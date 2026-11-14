# Configuração central do forplotR online ----------------------------------
# Tudo pode ser ajustado por variáveis de ambiente (ver README).

`%||%` <- function(x, y) if (is.null(x) || length(x) == 0) y else x

fp_cfg <- function(root = Sys.getenv("FORPLOTR_ROOT", unset = getwd())) {
  root <- normalizePath(root, winslash = "/", mustWork = FALSE)
  data_dir <- Sys.getenv("FORPLOTR_DATA_DIR", unset = file.path(root, "data"))
  data_dir <- normalizePath(data_dir, winslash = "/", mustWork = FALSE)

  num_env <- function(name, default) {
    v <- suppressWarnings(as.numeric(Sys.getenv(name, unset = as.character(default))))
    if (is.na(v)) default else v
  }

  list(
    root          = root,
    site          = normalizePath(Sys.getenv("FORPLOTR_SITE_DIR", unset = file.path(root, "_site")),
                                  winslash = "/", mustWork = FALSE),
    cors_origins  = trimws(strsplit(Sys.getenv("FORPLOTR_CORS_ORIGINS", unset = ""), ",")[[1]]),
    jobs          = file.path(data_dir, "jobs"),
    cache         = file.path(data_dir, "cache"),
    pkg_path      = Sys.getenv("FORPLOTR_PKG_PATH", unset = ""),
    max_upload_mb = num_env("FORPLOTR_MAX_UPLOAD_MB", 200),
    max_zip_mb    = num_env("FORPLOTR_MAX_ZIP_MB", 500),
    job_timeout_s = num_env("FORPLOTR_JOB_TIMEOUT", 1800),
    keep_hours    = num_env("FORPLOTR_KEEP_HOURS", 72),
    max_queue     = num_env("FORPLOTR_MAX_QUEUE", 20)
  )
}

ensure_dirs <- function(cfg = fp_cfg()) {
  for (d in c(cfg$jobs,
              file.path(cfg$jobs, "_queue"),
              file.path(cfg$jobs, "_running"),
              file.path(cfg$jobs, "_workers"),
              cfg$cache)) {
    dir.create(d, recursive = TRUE, showWarnings = FALSE)
  }
  invisible(cfg)
}

now_iso <- function() format(Sys.time(), "%Y-%m-%dT%H:%M:%S%z")

# Erro "do usuário" (dados inválidos): vira HTTP 400 com mensagem legível.
user_error <- function(...) {
  stop(structure(
    class = c("fp_user_error", "error", "condition"),
    list(message = paste0(...), call = NULL)
  ))
}

# Mensagem mais útil de um erro do callr (o erro real fica em $parent).
err_msg <- function(e) {
  m <- conditionMessage(e)
  if (!is.null(e$parent) && inherits(e$parent, "condition")) {
    m <- conditionMessage(e$parent)
  }
  trimws(m)
}

forplotR_version <- function(cfg) {
  if (nzchar(cfg$pkg_path)) {
    d <- tryCatch(read.dcf(file.path(cfg$pkg_path, "DESCRIPTION"), fields = "Version"),
                  error = function(e) NULL)
    if (!is.null(d)) return(paste0(d[1, 1], " (código local)"))
  }
  tryCatch(as.character(utils::packageVersion("forplotR")),
           error = function(e) "não instalado")
}
