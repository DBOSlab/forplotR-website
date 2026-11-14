# =============================================================================
# forplotR online — DEMONSTRAÇÃO LOCAL
#
# 1. Renderize o site:   quarto render          (na raiz do projeto)
# 2. Rode este arquivo:  Source no RStudio, ou  Rscript backend/iniciar.R
#
# Sobe o site renderizado + a API em http://127.0.0.1:8000 e dois workers.
# Para editar o site com recarga automática, rode em paralelo `quarto preview`:
# a página do preview usa esta mesma API (porta 8000).
# Para parar: Esc no RStudio (ou Ctrl+C no terminal).
#
# Para usar o código do pacote que está no seu computador (versão mais nova
# que a do GitHub), descomente e ajuste:
# Sys.setenv(FORPLOTR_PKG_PATH = "C:/repos/forplotR")
# =============================================================================

local({
  here <- NULL
  a <- commandArgs(FALSE)
  f <- sub("^--file=", "", a[grepl("^--file=", a)])
  if (length(f)) here <- dirname(normalizePath(f[1]))
  if (is.null(here)) {
    for (i in rev(seq_len(sys.nframe()))) {
      of <- sys.frame(i)$ofile
      if (!is.null(of)) { here <- dirname(normalizePath(of)); break }
    }
  }
  if (is.null(here) && requireNamespace("rstudioapi", quietly = TRUE) &&
      rstudioapi::isAvailable()) {
    p <- tryCatch(rstudioapi::getSourceEditorContext()$path, error = function(e) "")
    if (nzchar(p)) here <- dirname(normalizePath(p))
  }
  if (is.null(here)) here <- getwd()
  # aceita rodar a partir da raiz do projeto ou de dentro de backend/
  root <- if (file.exists(file.path(here, "plumber.R"))) dirname(here) else here
  if (!file.exists(file.path(root, "backend", "plumber.R"))) {
    stop("Não achei backend/plumber.R. Abra o projeto forplotR_site e rode backend/iniciar.R.", call. = FALSE)
  }
  Sys.setenv(FORPLOTR_ROOT = normalizePath(root, winslash = "/"))
})

root <- Sys.getenv("FORPLOTR_ROOT")
message("Projeto: ", root)

# Site do Quarto ---------------------------------------------------------------
if (!file.exists(file.path(root, "_site", "index.html"))) {
  quarto <- Sys.which("quarto")
  if (nzchar(quarto)) {
    message("Renderizando o site com o Quarto...")
    old <- setwd(root)
    system2(quarto, "render")
    setwd(old)
  } else {
    warning("Pasta _site não encontrada e Quarto não está no PATH. ",
            "Rode `quarto render` na raiz do projeto; a API funciona mesmo assim.", call. = FALSE)
  }
}

# Pacotes do servidor ----------------------------------------------------------
precisa <- c("plumber", "callr", "processx", "jsonlite", "zip", "webutils", "uuid", "openxlsx")
if (nzchar(Sys.getenv("FORPLOTR_PKG_PATH"))) precisa <- c(precisa, "pkgload")
faltam <- precisa[!vapply(precisa, requireNamespace, logical(1), quietly = TRUE)]
if (length(faltam)) {
  message("Instalando: ", paste(faltam, collapse = ", "))
  install.packages(faltam)
}

pkg_path <- Sys.getenv("FORPLOTR_PKG_PATH")
if (nzchar(pkg_path)) {
  if (!file.exists(file.path(pkg_path, "DESCRIPTION"))) {
    stop("FORPLOTR_PKG_PATH não aponta para a pasta do pacote: ", pkg_path, call. = FALSE)
  }
  message("Usando o forplotR do código em: ", pkg_path)
} else if (!requireNamespace("forplotR", quietly = TRUE)) {
  stop("O forplotR não está instalado. Rode remotes::install_github('DBOSlab/forplotR') ",
       "ou defina FORPLOTR_PKG_PATH no topo deste arquivo.", call. = FALSE)
}

# Workers em segundo plano -----------------------------------------------------
dir.create(file.path(root, "data"), showWarnings = FALSE)
n_workers <- as.integer(Sys.getenv("FORPLOTR_WORKERS", "2"))
workers <- lapply(seq_len(n_workers), function(i) {
  callr::r_bg(
    function(root) {
      Sys.setenv(FORPLOTR_ROOT = root)
      source(file.path(root, "backend", "worker.R"), encoding = "UTF-8")
    },
    args = list(root = root),
    stdout = file.path(root, "data", sprintf("worker%d.log", i)),
    stderr = "2>&1",
    supervise = TRUE
  )
})
message(n_workers, " worker(s) iniciado(s). Registros em data/worker*.log")

# Site + API -------------------------------------------------------------------
options(plumber.maxRequestSize = 200 * 1024^2)
port <- as.integer(Sys.getenv("PORT", "8000"))
url <- sprintf("http://127.0.0.1:%d/", port)

pr <- plumber::plumb(file.path(root, "backend", "plumber.R"))
later::later(function() utils::browseURL(url), 2)
message("\n  forplotR online: ", url, "\n  (Esc ou Ctrl+C para parar)\n")
tryCatch(
  plumber::pr_run(pr, host = "127.0.0.1", port = port, docs = FALSE),
  finally = {
    for (w in workers) try(w$kill(), silent = TRUE)
    message("Servidor e workers encerrados.")
  }
)
