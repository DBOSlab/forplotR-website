# Espelha no site as dependências wasm do forplotR ---------------------------
#
# Uso (no CI, depois do build do forplotR com r-wasm/actions/build-rwasm):
#   Rscript scripts/mirror_webr_deps.R <repo_dir> <r_version> [extras] [prune]
#   ex.: Rscript scripts/mirror_webr_deps.R webr/repo 4.6 zip sf,raster
#   [extras]: pacotes adicionais (separados por vírgula) usados pelo motor
#   local do site, além das dependências do forplotR.
#   [prune]: pacotes declarados por alguma dependência mas nunca carregados
#   pelo forplotR; nem eles nem o que só eles puxam são espelhados. O webR
#   instala o resto normalmente (apenas avisa que não os encontrou).
#   Ex.: o leaflet declara sf e raster (e, por eles, terra, sp, s2, units...),
#   que ele só usa com objetos espaciais; o forplotR passa tabelas comuns.
#
# O que faz:
#   1. lê a entrada do forplotR no PACKAGES gerado pelo rwasm em <repo_dir>;
#   2. resolve o fecho de dependências (Depends + Imports, recursivo) usando o
#      índice oficial https://repo.r-wasm.org (só pacotes não-base);
#   3. baixa cada binário .tgz e confere o MD5sum declarado no índice; qualquer
#      divergência aborta o build (nada é publicado com arquivo adulterado);
#   4. reescreve PACKAGES / PACKAGES.gz com as entradas originais do índice
#      + a entrada do forplotR.
#
# Assim o navegador instala tudo a partir da própria origem do site, sem
# contato com servidores de terceiros em tempo de execução.

args <- commandArgs(trailingOnly = TRUE)
if (length(args) < 2) stop("Uso: Rscript mirror_webr_deps.R <repo_dir> <r_version>")
repo_dir <- args[1]
r_ver <- args[2]
extras <- if (length(args) >= 3) trimws(strsplit(args[3], ",")[[1]]) else character(0)
extras <- extras[nzchar(extras)]
prune <- if (length(args) >= 4) trimws(strsplit(args[4], ",")[[1]]) else character(0)
prune <- prune[nzchar(prune)]

upstream <- paste0("https://repo.r-wasm.org/bin/emscripten/contrib/", r_ver)
contrib <- file.path(repo_dir, "bin", "emscripten", "contrib", r_ver)
if (!dir.exists(contrib)) stop("Pasta do repositório não encontrada: ", contrib)

read_index <- function(path_or_url) {
  con <- if (grepl("^https?://", path_or_url)) url(path_or_url) else file(path_or_url)
  on.exit(close(con))
  db <- read.dcf(con)
  rownames(db) <- db[, "Package"]
  db
}

dep_names <- function(field) {
  if (is.na(field) || !nzchar(field)) return(character(0))
  x <- trimws(strsplit(field, ",")[[1]])
  x <- sub("\\s*\\(.*$", "", x)
  setdiff(x[nzchar(x)], "R")
}

local_db <- read_index(file.path(contrib, "PACKAGES"))
if (!"forplotR" %in% rownames(local_db)) stop("forplotR não está no PACKAGES de ", contrib)
remote_db <- read_index(paste0(upstream, "/PACKAGES"))

base_pkgs <- rownames(installed.packages(priority = "base"))
field <- function(db, pkg, f) if (f %in% colnames(db)) db[pkg, f] else NA_character_

# Fecho de dependências
todo <- c(dep_names(field(local_db, "forplotR", "Depends")),
          dep_names(field(local_db, "forplotR", "Imports")),
          extras)
need <- character(0)
while (length(todo)) {
  p <- todo[1]; todo <- todo[-1]
  if (p %in% c(need, base_pkgs, "forplotR", prune)) next
  if (!p %in% rownames(remote_db)) stop("Dependência sem binário wasm em ", upstream, ": ", p)
  need <- c(need, p)
  todo <- c(todo, dep_names(field(remote_db, p, "Depends")),
                  dep_names(field(remote_db, p, "Imports")))
}
need <- sort(need)
message(length(need), " dependências: ", paste(need, collapse = ", "))
if (length(prune)) message("Fora do espelho (não carregados pelo forplotR): ", paste(prune, collapse = ", "))

# Download + conferência de integridade
for (p in need) {
  fname <- field(remote_db, p, "File")
  if (is.na(fname)) fname <- paste0(p, "_", remote_db[p, "Version"], ".tgz")
  dest <- file.path(contrib, fname)
  md5 <- field(remote_db, p, "MD5sum")
  if (is.na(md5)) stop("Índice sem MD5sum para ", p, "; abortando por segurança.")
  utils::download.file(paste0(upstream, "/", fname), dest, mode = "wb", quiet = TRUE)
  got <- unname(tools::md5sum(dest))
  if (!identical(tolower(got), tolower(md5))) {
    stop("MD5 diferente para ", fname, " (esperado ", md5, ", obtido ", got, ")")
  }
}

# Índice final: entradas originais do upstream + forplotR
write_entries <- function(db, con) {
  for (i in seq_len(nrow(db))) {
    row <- db[i, ]
    row <- row[!is.na(row)]
    write.dcf(t(as.matrix(row)), con, width = 1000)
    cat("\n", file = con)
  }
}
out <- file.path(contrib, "PACKAGES")
con <- file(out, "w")
write_entries(local_db["forplotR", , drop = FALSE], con)
write_entries(remote_db[need, , drop = FALSE], con)
close(con)
gz <- gzfile(file.path(contrib, "PACKAGES.gz"), "w")
writeLines(readLines(out), gz)
close(gz)
# PACKAGES.rds é o primeiro índice que o webR procura (evita um 404 a cada instalação).
saveRDS(read.dcf(out), file.path(contrib, "PACKAGES.rds"), compress = "xz")

sizes <- file.info(list.files(contrib, "\\.tgz$", full.names = TRUE))$size
message(sprintf("Repositório pronto: %d pacotes, %.1f MB", length(need) + 1, sum(sizes) / 1024^2))
