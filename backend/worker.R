# Worker do forplotR online -----------------------------------------------------
# Pega o próximo job da fila e roda a função do forplotR num processo R novo.
# Rode quantos quiser em paralelo (cada um processa um job por vez):
#   Rscript backend/worker.R

local({
  root <- Sys.getenv("FORPLOTR_ROOT", unset = "")
  if (!nzchar(root)) {
    a <- commandArgs(FALSE)
    f <- sub("^--file=", "", a[grepl("^--file=", a)])
    root <- if (length(f)) dirname(dirname(normalizePath(f[1]))) else getwd()
    Sys.setenv(FORPLOTR_ROOT = root)
  }
})

for (.f in sort(list.files(file.path(Sys.getenv("FORPLOTR_ROOT"), "backend", "R"),
                           pattern = "\\.R$", full.names = TRUE))) {
  source(.f, encoding = "UTF-8")
}

run_worker <- function() {
  cfg <- ensure_dirs(fp_cfg())
  worker_id <- paste0(gsub("[^A-Za-z0-9_-]", "", Sys.info()[["nodename"]]), "-", Sys.getpid())
  message(now_iso(), " worker ", worker_id, " iniciado. Jobs em: ", cfg$jobs)

  recover_stale(cfg)
  last_cleanup <- Sys.time() - 7200

  repeat {
    heartbeat(cfg, worker_id)
    claim <- tryCatch(claim_next(cfg), error = function(e) NULL)
    if (!is.null(claim)) {
      message(now_iso(), " iniciando job ", claim$id)
      tryCatch(run_job(claim, cfg, worker_id),
               error = function(e) {
                 message(now_iso(), " erro no job ", claim$id, ": ", conditionMessage(e))
                 try(update_status(claim$dir, status = "error", message = "Falhou",
                                   error = paste("Erro no servidor:", conditionMessage(e)),
                                   finished = now_iso()), silent = TRUE)
               })
      message(now_iso(), " job ", claim$id, " terminado")
    } else {
      Sys.sleep(1.5)
    }
    if (difftime(Sys.time(), last_cleanup, units = "mins") > 60) {
      n <- tryCatch(cleanup_jobs(cfg), error = function(e) 0)
      if (n > 0) message(now_iso(), " limpeza: ", n, " job(s) antigo(s) apagado(s)")
      last_cleanup <- Sys.time()
    }
  }
}

if (!identical(Sys.getenv("FORPLOTR_NO_AUTORUN"), "1")) run_worker()
