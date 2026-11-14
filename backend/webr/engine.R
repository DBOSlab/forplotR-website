# Motor local do forplotR online (webR, no navegador) --------------------------
#
# Carregado pelo js/forplotr-local.js, dentro do webR, depois de:
#   backend/R/config.R, tools_spec.R, core_params.R, core_run.R
# O JavaScript grava os arquivos enviados em <raiz>/uploads, chama local_run()
# e lê as saídas de <raiz>/outputs. Ao terminar, local_cleanup() apaga tudo.
#
# Nada aqui usa a internet: local_init() liga options(forplotR.offline = TRUE)
# e troca as funções de download do R por funções que dão erro.

local_root <- "/home/web_user/fpjob"

# Chamado uma vez, depois de instalar os pacotes e carregar estes arquivos.
local_init <- function() {
  suppressPackageStartupMessages(library(forplotR))
  options(forplotR.offline = TRUE, warn = 1)
  local_lock_network()
  invisible(TRUE)
}

local_lock_network <- function() {
  blocked <- function(...) {
    stop("Acesso à rede desativado: no navegador, os dados não saem do seu computador.",
         call. = FALSE)
  }
  lock <- function(ns, names) {
    env <- asNamespace(ns)
    for (nm in intersect(names, ls(env, all.names = TRUE))) {
      unlockBinding(nm, env)
      assign(nm, blocked, envir = env)
      lockBinding(nm, env)
    }
  }
  lock("utils", "download.file")
  lock("base", "url")
  # curl só é carregado se algum pacote pedir; trava no momento do carregamento.
  curl_fns <- c("curl", "curl_download", "curl_fetch_memory", "curl_fetch_disk",
                "curl_fetch_stream", "multi_download")
  if (isNamespaceLoaded("curl")) lock("curl", curl_fns)
  setHook(packageEvent("curl", "onLoad"), function(...) lock("curl", curl_fns))
  invisible(TRUE)
}

local_health <- function() {
  jsonlite::toJSON(list(
    mode = "local",
    forplotR = as.character(utils::packageVersion("forplotR")),
    R = R.version.string,
    max_upload_mb = 200
  ), auto_unbox = TRUE)
}

# Cria as pastas vazias do processamento; devolve a pasta de uploads.
local_prepare <- function() {
  local_cleanup()
  for (d in c("uploads", "inputs", "outputs")) {
    dir.create(file.path(local_root, d), recursive = TRUE, showWarnings = FALSE)
  }
  file.path(local_root, "uploads")
}

local_cleanup <- function() {
  unlink(local_root, recursive = TRUE, force = TRUE)
  invisible(TRUE)
}

# fields_file: JSON gravado pelo navegador em <raiz>/fields.json, no formato
#   {"campo": {"file": true, "filename": "x.xlsx", "path": "<uploads>/campo"}
#    ou {"file": false, "value": "texto"}}
# (por arquivo, e não embutido no código R, para não depender de escapes).
# Devolve (JSON) a situação final no mesmo formato do servidor, mais `root`.
local_run <- function(tool, fields_file = file.path(local_root, "fields.json")) {
  t0 <- Sys.time()
  id <- paste(sample(c(0:9, letters[1:6]), 32, replace = TRUE), collapse = "")
  spec <- NULL
  err <- tryCatch({
    spec <- tool_spec(tool, "local")
    fields <- jsonlite::fromJSON(fields_file, simplifyVector = FALSE)
    unlink(fields_file)
    parts <- lapply(fields, function(f) {
      if (isTRUE(f$file)) {
        path <- normalizePath(f$path, winslash = "/", mustWork = TRUE)
        if (!startsWith(path, paste0(local_root, "/uploads/"))) {
          user_error("Arquivo enviado em local inválido.")
        }
        list(file = TRUE, filename = f$filename,
             value = readBin(path, what = "raw", n = file.info(path)$size))
      } else {
        list(file = FALSE, value = enc2utf8(as.character(f$value %||% "")))
      }
    })
    unlink(file.path(local_root, "uploads"), recursive = TRUE, force = TRUE)

    cfg <- list(max_zip_mb = 500, cache = file.path(tempdir(), "fp_cache"))
    params <- build_params(spec, parts, local_root, cfg)
    params <- utils::modifyList(params, spec$local_fixed %||% list())

    old <- setwd(file.path(local_root, "outputs"))
    on.exit(setwd(old), add = TRUE)
    run_tool(spec$fun, params)
    ""
  }, error = function(e) {
    message("Erro: ", conditionMessage(e))
    conditionMessage(e)
  })

  fin <- tryCatch(finalize_outputs(local_root, id),
                  error = function(e) list(files = list(), n_files = 0, zip = ""))
  unlink(file.path(local_root, "inputs"), recursive = TRUE, force = TRUE)

  ok <- !nzchar(err)
  st <- list(
    id = id, tool = tool, title = spec$title %||% tool, fun = spec$fun %||% "",
    status = if (ok) "done" else "error",
    message = if (!ok) "Falhou" else if (fin$n_files > 0) "Concluído" else
      "Concluído, mas nenhum arquivo foi gerado (veja o registro)",
    error = err,
    elapsed_s = round(as.numeric(difftime(Sys.time(), t0, units = "secs"))),
    forplotR = as.character(utils::packageVersion("forplotR")),
    files = fin$files, n_files = fin$n_files, zip = fin$zip,
    root = local_root
  )
  jsonlite::toJSON(st, auto_unbox = TRUE, null = "null", na = "null")
}
