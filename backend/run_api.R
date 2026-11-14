# Sobe a API + site (uso em servidor / Docker) ----------------------------------
#   Rscript backend/run_api.R
# Os workers rodam à parte: Rscript backend/worker.R

local({
  root <- Sys.getenv("FORPLOTR_ROOT", unset = "")
  if (!nzchar(root)) {
    a <- commandArgs(FALSE)
    f <- sub("^--file=", "", a[grepl("^--file=", a)])
    root <- if (length(f)) dirname(dirname(normalizePath(f[1]))) else getwd()
    Sys.setenv(FORPLOTR_ROOT = root)
  }
})

root <- Sys.getenv("FORPLOTR_ROOT")
max_mb <- suppressWarnings(as.numeric(Sys.getenv("FORPLOTR_MAX_UPLOAD_MB", "200")))
options(plumber.maxRequestSize = max_mb * 1024^2)

host <- Sys.getenv("HOST", unset = "0.0.0.0")
port <- as.integer(Sys.getenv("PORT", unset = "8000"))

pr <- plumber::plumb(file.path(root, "backend", "plumber.R"))
message("forplotR online em http://", host, ":", port, "/  (raiz: ", root, ")")
plumber::pr_run(pr, host = host, port = port, docs = FALSE)
