# Fila de jobs em disco -------------------------------------------------------
# data/jobs/<id>/            job.rds (argumentos), status.json, log.txt,
#                            inputs/, outputs/, resultados_<id>.zip
# data/jobs/_queue/<t>_<id>  ficha na fila (o worker "pega" renomeando)
# data/jobs/_running/        fichas em execução
# data/jobs/_workers/        batimentos dos workers (saúde)

valid_job_id <- function(id) {
  is.character(id) && length(id) == 1L &&
    grepl("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", id)
}

job_dir_of <- function(cfg, id) file.path(cfg$jobs, id)

write_status <- function(job_dir, st) {
  tmp <- tempfile(tmpdir = job_dir, fileext = ".tmp")
  jsonlite::write_json(st, tmp, auto_unbox = TRUE, pretty = TRUE, null = "null", na = "null")
  if (!file.rename(tmp, file.path(job_dir, "status.json"))) {
    file.copy(tmp, file.path(job_dir, "status.json"), overwrite = TRUE)
    unlink(tmp)
  }
  invisible(st)
}

read_status <- function(job_dir) {
  f <- file.path(job_dir, "status.json")
  if (!file.exists(f)) return(NULL)
  jsonlite::read_json(f, simplifyVector = FALSE)
}

update_status <- function(job_dir, ...) {
  st <- read_status(job_dir) %||% list()
  new <- list(...)
  for (nm in names(new)) st[[nm]] <- new[[nm]]
  write_status(job_dir, st)
}

queue_tokens <- function(cfg) sort(list.files(file.path(cfg$jobs, "_queue")))

# Chamado pela API --------------------------------------------------------------

submit_job <- function(req, tool, cfg) {
  spec <- TOOLS[[tool]]
  if (is.null(spec)) user_error("Ferramenta desconhecida: ", tool)
  if (length(queue_tokens(cfg)) >= cfg$max_queue) {
    user_error("A fila está cheia. Tente de novo em alguns minutos.")
  }

  parts <- read_multipart(req)

  id <- uuid::UUIDgenerate()
  job_dir <- job_dir_of(cfg, id)
  dir.create(file.path(job_dir, "inputs"), recursive = TRUE)
  dir.create(file.path(job_dir, "outputs"), recursive = TRUE)
  ok <- FALSE
  on.exit(if (!ok) unlink(job_dir, recursive = TRUE, force = TRUE), add = TRUE)

  params <- build_params(spec, parts, job_dir, cfg)

  saveRDS(list(id = id, tool = tool, fun = spec$fun, params = params,
               extra_libs = spec$extra_libs %||% character()),
          file.path(job_dir, "job.rds"))

  write_status(job_dir, list(
    id = id, tool = tool, title = spec$title, fun = spec$fun,
    status = "queued", message = "Na fila", error = "",
    created = now_iso(), created_epoch = as.numeric(Sys.time()),
    started = "", started_epoch = 0, finished = "", elapsed_s = 0,
    forplotR = forplotR_version(cfg),
    files = list(), n_files = 0, zip = ""
  ))

  token <- sprintf("%.0f_%s", as.numeric(Sys.time()) * 1000, id)
  file.create(file.path(cfg$jobs, "_queue", token))
  ok <- TRUE
  list(job_id = id, status = "queued")
}

job_status_for_api <- function(cfg, id) {
  if (!valid_job_id(id)) return(NULL)
  st <- read_status(job_dir_of(cfg, id))
  if (is.null(st)) return(NULL)
  if (identical(st$status, "queued")) {
    toks <- queue_tokens(cfg)
    pos <- which(sub("^[0-9]+_", "", toks) == id)
    st$queue_position <- if (length(pos)) pos[1] else 0
  }
  st
}

log_tail <- function(cfg, id, n = 150) {
  if (!valid_job_id(id)) return("")
  f <- file.path(job_dir_of(cfg, id), "log.txt")
  if (!file.exists(f)) return("")
  x <- tryCatch(readLines(f, warn = FALSE, encoding = "UTF-8"), error = function(e) character())
  paste(utils::tail(x, n), collapse = "\n")
}

# Chamado pelo worker ---------------------------------------------------------

claim_next <- function(cfg) {
  q <- file.path(cfg$jobs, "_queue")
  for (t in queue_tokens(cfg)) {
    dest <- file.path(cfg$jobs, "_running", t)
    if (isTRUE(suppressWarnings(file.rename(file.path(q, t), dest)))) {
      id <- sub("^[0-9]+_", "", t)
      return(list(id = id, token = dest, dir = job_dir_of(cfg, id)))
    }
  }
  NULL
}

heartbeat <- function(cfg, worker_id, busy = "") {
  writeLines(c(now_iso(), busy), file.path(cfg$jobs, "_workers", worker_id))
}

active_workers <- function(cfg, max_age_s = 60) {
  f <- list.files(file.path(cfg$jobs, "_workers"), full.names = TRUE)
  if (!length(f)) return(0L)
  age <- as.numeric(difftime(Sys.time(), file.info(f)$mtime, units = "secs"))
  sum(age < max_age_s, na.rm = TRUE)
}

# Roda no processo R NOVO (callr). Não pode depender de nada de fora: carrega o
# pacote e o núcleo comum (core_run.R) por conta própria.
child_run <- function(tool_fun, params, pkg_path, cache_dir, extra_libs, core_file) {
  options(warn = 1, timeout = 3600, forplotR.herbaria_cache_dir = cache_dir)
  if (nzchar(pkg_path)) {
    pkgload::load_all(pkg_path, quiet = TRUE, export_all = FALSE, helpers = FALSE)
  } else {
    suppressPackageStartupMessages(library(forplotR))
  }
  # Contorno para versões antigas do pacote: .check_point_in_admin() usava
  # funções de terra/stringi sem namespace.
  for (p in extra_libs) suppressPackageStartupMessages(library(p, character.only = TRUE))

  core <- new.env()
  sys.source(core_file, envir = core, keep.source = FALSE)
  core$run_tool(tool_fun, params)
}

run_job <- function(claim, cfg, worker_id) {
  job_dir <- claim$dir
  on.exit(unlink(claim$token, force = TRUE), add = TRUE)
  job <- tryCatch(readRDS(file.path(job_dir, "job.rds")), error = function(e) NULL)
  if (is.null(job)) return(invisible(FALSE))

  t0 <- Sys.time()
  update_status(job_dir, status = "running", message = "Processando",
                started = now_iso(), started_epoch = as.numeric(t0))
  log_file <- file.path(job_dir, "log.txt")

  proc <- callr::r_bg(
    child_run,
    args = list(tool_fun = job$fun, params = job$params, pkg_path = cfg$pkg_path,
                cache_dir = cfg$cache, extra_libs = job$extra_libs,
                core_file = file.path(cfg$root, "backend", "R", "core_run.R")),
    wd = file.path(job_dir, "outputs"),
    stdout = log_file, stderr = "2>&1",
    supervise = TRUE
  )

  timed_out <- FALSE
  while (proc$is_alive()) {
    heartbeat(cfg, worker_id, job$id)
    if (as.numeric(difftime(Sys.time(), t0, units = "secs")) > cfg$job_timeout_s) {
      proc$kill()
      timed_out <- TRUE
      break
    }
    proc$wait(2000)
  }

  err <- ""
  if (timed_out) {
    err <- sprintf("Tempo limite atingido (%d min).", round(cfg$job_timeout_s / 60))
  } else {
    res <- tryCatch({ proc$get_result(); "" }, error = function(e) err_msg(e))
    err <- res
  }

  fin <- tryCatch(finalize_outputs(job_dir, job$id),
                  error = function(e) list(files = list(), n_files = 0, zip = ""))
  elapsed <- round(as.numeric(difftime(Sys.time(), t0, units = "secs")))

  if (nzchar(err)) {
    update_status(job_dir, status = "error", message = "Falhou", error = err,
                  finished = now_iso(), elapsed_s = elapsed,
                  files = fin$files, n_files = fin$n_files, zip = fin$zip)
  } else {
    msg <- if (fin$n_files > 0) "Concluído" else "Concluído, mas nenhum arquivo foi gerado (veja o registro)"
    update_status(job_dir, status = "done", message = msg, error = "",
                  finished = now_iso(), elapsed_s = elapsed,
                  files = fin$files, n_files = fin$n_files, zip = fin$zip)
  }
  invisible(TRUE)
}

# Jobs que estavam "rodando" quando um worker caiu.
recover_stale <- function(cfg) {
  run_dir <- file.path(cfg$jobs, "_running")
  for (t in list.files(run_dir)) {
    id <- sub("^[0-9]+_", "", t)
    st <- read_status(job_dir_of(cfg, id))
    started <- as.numeric(st$started_epoch %||% 0)
    age <- as.numeric(Sys.time()) - started
    if (is.null(st) || (identical(st$status, "running") && age > cfg$job_timeout_s + 300)) {
      if (!is.null(st)) {
        update_status(job_dir_of(cfg, id), status = "error", message = "Falhou",
                      error = "O processamento foi interrompido (o servidor reiniciou). Envie de novo.",
                      finished = now_iso())
      }
      unlink(file.path(run_dir, t), force = TRUE)
    }
  }
}

cleanup_jobs <- function(cfg) {
  dirs <- list.dirs(cfg$jobs, recursive = FALSE, full.names = TRUE)
  dirs <- dirs[!startsWith(basename(dirs), "_")]
  if (!length(dirs)) return(invisible(0))
  age_h <- as.numeric(difftime(Sys.time(), file.info(dirs)$mtime, units = "hours"))
  old <- dirs[!is.na(age_h) & age_h > cfg$keep_hours]
  for (d in old) {
    st <- read_status(d)
    if (!is.null(st) && isTRUE(st$status %in% c("queued", "running"))) next
    unlink(d, recursive = TRUE, force = TRUE)
  }
  wk <- list.files(file.path(cfg$jobs, "_workers"), full.names = TRUE)
  if (length(wk)) {
    wage <- as.numeric(difftime(Sys.time(), file.info(wk)$mtime, units = "hours"))
    unlink(wk[!is.na(wage) & wage > 1])
  }
  invisible(length(old))
}
