# forplotR online — API + site renderizado pelo Quarto ---------------------------
# Não rode este arquivo diretamente: use backend/iniciar.R (demonstração local)
# ou backend/run_api.R (servidor).
#
# Rotas da API ficam em /v1/...; todo o resto é o site estático em _site/
# (as rotas da API têm prioridade sobre os arquivos do site).

.root <- Sys.getenv("FORPLOTR_ROOT", unset = getwd())
for (.f in sort(list.files(file.path(.root, "backend", "R"), pattern = "\\.R$", full.names = TRUE))) {
  source(.f, local = environment(), encoding = "UTF-8")
}
.cfg <- ensure_dirs(fp_cfg(.root))

#* @apiTitle forplotR online
#* @apiDescription Executa as funções do pacote forplotR a partir do navegador.

#* @plumber
function(pr) {
  if (dir.exists(.cfg$site)) {
    plumber::pr_static(pr, "/", .cfg$site)
  } else {
    message("Aviso: pasta do site não encontrada (", .cfg$site, "). Rode `quarto render` na raiz do projeto.")
    pr
  }
}

#* Cabeçalhos de segurança e CORS (este último só para o `quarto preview` local)
#* @filter seguranca
function(req, res) {
  res$setHeader("X-Content-Type-Options", "nosniff")
  res$setHeader("Referrer-Policy", "same-origin")

  origin <- req$HTTP_ORIGIN %||% ""
  local_dev <- grepl("^https?://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?$", origin)
  if (nzchar(origin) && (local_dev || origin %in% .cfg$cors_origins)) {
    res$setHeader("Access-Control-Allow-Origin", origin)
    res$setHeader("Vary", "Origin")
    res$setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res$setHeader("Access-Control-Allow-Headers", "Content-Type")
    if (identical(req$REQUEST_METHOD, "OPTIONS")) {
      res$status <- 204L
      return(list())
    }
  }

  # /ferramentas/relatorio/  ->  /ferramentas/relatorio/index.html
  path <- req$PATH_INFO %||% "/"
  if (!startsWith(path, "/v1/") && path != "/" && grepl("/$", path)) {
    req$PATH_INFO <- paste0(path, "index.html")
  }
  plumber::forward()
}

#* Saúde do serviço
#* @get /v1/health
#* @serializer unboxedJSON
function() {
  list(
    status = "ok",
    time = now_iso(),
    forplotR = forplotR_version(.cfg),
    R = R.version.string,
    workers = active_workers(.cfg),
    queue = length(queue_tokens(.cfg)),
    running = length(list.files(file.path(.cfg$jobs, "_running"))),
    max_upload_mb = .cfg$max_upload_mb,
    keep_hours = .cfg$keep_hours
  )
}

#* Ferramentas e campos dos formulários
#* @get /v1/tools
#* @serializer unboxedJSON
function() {
  tools_public()
}

#* Envia um processamento para a fila
#* @post /v1/jobs/<tool>
#* @serializer unboxedJSON
function(req, res, tool) {
  tryCatch({
    out <- submit_job(req, tool, .cfg)
    res$status <- 202L
    out
  }, fp_user_error = function(e) {
    res$status <- 400L
    list(status = "error", message = conditionMessage(e))
  }, error = function(e) {
    res$status <- 500L
    list(status = "error", message = paste("Erro interno:", conditionMessage(e)))
  })
}

#* Situação de um processamento
#* @get /v1/jobs/<id>
#* @serializer unboxedJSON
function(res, id) {
  st <- job_status_for_api(.cfg, id)
  if (is.null(st)) {
    res$status <- 404L
    return(list(status = "error", message = "Processamento não encontrado (ou já expirou)."))
  }
  st
}

#* Registro (log) de um processamento
#* @get /v1/jobs/<id>/log
#* @serializer text
function(id) {
  log_tail(.cfg, id)
}

#* Download de um arquivo do resultado (file = f1, f2, ... ou "all" para o ZIP)
#* @get /v1/jobs/<id>/files/<file>
function(req, res, id, file) {
  fail <- function(code, msg) {
    res$status <- code
    res$setHeader("Content-Type", "text/plain; charset=utf-8")
    res$body <- msg
    res
  }
  if (!valid_job_id(id)) return(fail(404L, "Não encontrado."))
  job_dir <- job_dir_of(.cfg, id)
  st <- read_status(job_dir)
  if (is.null(st)) return(fail(404L, "Não encontrado."))

  if (identical(file, "all")) {
    if (!nzchar(st$zip %||% "")) return(fail(404L, "Sem arquivos."))
    path <- file.path(job_dir, st$zip)
    name <- st$zip
  } else {
    hit <- Filter(function(f) identical(f$id, file), st$files %||% list())
    if (!length(hit)) return(fail(404L, "Arquivo não encontrado."))
    rel <- hit[[1]]$path
    out_dir <- normalizePath(file.path(job_dir, "outputs"), winslash = "/")
    path <- normalizePath(file.path(out_dir, rel), winslash = "/", mustWork = FALSE)
    if (!startsWith(path, paste0(out_dir, "/"))) return(fail(404L, "Arquivo inválido."))
    name <- basename(rel)
  }
  if (!file.exists(path)) return(fail(404L, "Arquivo removido."))

  ctype <- switch(tolower(tools::file_ext(path)),
    html = "text/html; charset=utf-8", pdf = "application/pdf",
    png = "image/png", jpg = "image/jpeg", jpeg = "image/jpeg", gif = "image/gif",
    webp = "image/webp", csv = "text/csv; charset=utf-8", zip = "application/zip",
    xlsx = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt = "text/plain; charset=utf-8",
    "application/octet-stream")

  inline <- identical(req$argsQuery$inline, "1") &&
    grepl("^(text/html|application/pdf|image/)", ctype)
  safe_name <- gsub('[^A-Za-z0-9._-]', "_", name)

  res$status <- 200L
  res$setHeader("Content-Type", ctype)
  res$setHeader("Content-Disposition",
                paste0(if (inline) "inline" else "attachment", "; filename=\"", safe_name, "\""))
  # HTML gerado a partir de planilhas enviadas roda isolado do site.
  if (startsWith(ctype, "text/html")) {
    res$setHeader("Content-Security-Policy", "sandbox allow-scripts allow-popups allow-downloads")
  }
  res$setHeader("Cache-Control", "private, max-age=3600")
  res$body <- readBin(path, what = "raw", n = file.info(path)$size)
  res
}
