# Gera o binário do forplotR para o webR ---------------------------------------
#
# Uso:
#   Rscript scripts/build_pure_r_binary.R <pacote_dir> <repo_dir> <r_version>
#   ex.: Rscript scripts/build_pure_r_binary.R _pkg webr/repo 4.6
#
# O forplotR é R puro (sem src/). Um pacote assim, instalado com
# `R CMD INSTALL` na mesma versão menor do R do webR, é portável:
# o campo Built fica sem plataforma e o webR o instala diretamente.
# Não usamos o compilador cruzado (rwasm), cujo resolvedor de pacotes está
# quebrado (r-wasm/rwasm#56).
#
# Requer as dependências do pacote instaladas no R que roda este script.

args <- commandArgs(trailingOnly = TRUE)
if (length(args) < 3) {
  stop("Uso: Rscript build_pure_r_binary.R <pacote_dir> <repo_dir> <r_version>")
}
pkg_dir <- normalizePath(args[1], mustWork = TRUE)
repo_dir <- args[2]
r_ver <- args[3]

here_ver <- paste(R.version$major, sub("\\..*$", "", R.version$minor), sep = ".")
if (!identical(here_ver, r_ver)) {
  stop("R ", here_ver, " não corresponde ao R do webR (", r_ver, ").")
}
if (dir.exists(file.path(pkg_dir, "src"))) {
  stop("O pacote tem código compilado (src/); este caminho só serve para R puro.")
}

contrib <- file.path(repo_dir, "bin", "emscripten", "contrib", r_ver)
dir.create(contrib, recursive = TRUE, showWarnings = FALSE)

work <- tempfile("fpbuild")
dir.create(work)
old <- setwd(work)
on.exit(setwd(old), add = TRUE)

run <- function(...) {
  status <- system2(file.path(R.home("bin"), "R"), c(...))
  if (!identical(status, 0L)) stop("Falhou: R ", paste(c(...), collapse = " "))
}

run("CMD", "build", "--no-build-vignettes", "--no-manual", shQuote(pkg_dir))
src <- list.files(work, "\\.tar\\.gz$")
if (length(src) != 1) stop("R CMD build não gerou exatamente um tarball.")

lib <- file.path(work, "lib")
dir.create(lib)
run("CMD", "INSTALL", "--no-html", "--no-multiarch",
    paste0("--library=", shQuote(lib)), shQuote(src))

# Conferências de portabilidade
desc <- read.dcf(file.path(lib, "forplotR", "DESCRIPTION"))
built <- strsplit(desc[1, "Built"], ";\\s*")[[1]]
if (nzchar(built[2])) stop("Binário dependente de plataforma: Built = ", desc[1, "Built"])
if (dir.exists(file.path(lib, "forplotR", "libs"))) stop("O binário contém libs/.")

version <- desc[1, "Version"]
dest <- file.path(normalizePath(contrib), paste0("forplotR_", version, ".tgz"))
# Empacota a pasta instalada (mesmo formato do binário que o webR espera:
# um .tgz com forplotR/ na raiz), igual em qualquer sistema.
setwd(lib)
utils::tar(dest, files = "forplotR", compression = "gzip", tar = "internal")

setwd(old)
tools::write_PACKAGES(contrib, type = "mac.binary", fields = c("Built"))
unlink(file.path(contrib, "PACKAGES.rds"))

message(sprintf("forplotR %s -> %s (%.1f MB)", version, dest, file.size(dest) / 1024^2))
message("Built: ", desc[1, "Built"])
