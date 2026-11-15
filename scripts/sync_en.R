#!/usr/bin/env Rscript
# Páginas em inglês a partir das portuguesas (pré-renderização) -----------------
#
# Cada página portuguesa é um index.qmd com o cabeçalho YAML e
#   {{< include _body.qmd >}}
# O campo `en-path` do cabeçalho diz onde fica a versão inglesa (dentro de en/).
# Este script grava en/<en-path>/index.qmd com o mesmo cabeçalho (os títulos já
# são bilíngues) e um include do mesmo _body.qmd; a língua vem de en/_metadata.yml
# e o filtro _tpl/lang.lua mantém só o inglês. Páginas geradas que não têm mais
# origem são apagadas. Os arquivos gerados ficam no repositório (o render funciona
# sem este passo), mas não devem ser editados à mão.

suppressPackageStartupMessages(library(yaml))

MARK <- "# gerado por scripts/sync_en.R a partir de"
read_utf8 <- function(f) readLines(f, encoding = "UTF-8", warn = FALSE)
write_utf8 <- function(x, f) {
  dir.create(dirname(f), recursive = TRUE, showWarnings = FALSE)
  con <- file(f, open = "wb"); on.exit(close(con))
  writeBin(charToRaw(enc2utf8(paste0(paste(x, collapse = "\n"), "\n"))), con)
}
front_matter <- function(lines) {
  if (!length(lines) || lines[[1]] != "---") return(NULL)
  end <- which(lines == "---")[2]
  if (is.na(end)) return(NULL)
  yaml.load(paste(lines[2:(end - 1)], collapse = "\n"))
}
rel_path <- function(from_dir, to_dir) {
  a <- strsplit(from_dir, "/")[[1]]; b <- strsplit(to_dir, "/")[[1]]
  a <- a[nzchar(a) & a != "."]; b <- b[nzchar(b) & b != "."]
  n <- 0; while (n < min(length(a), length(b)) && a[n + 1] == b[n + 1]) n <- n + 1
  paste(c(rep("..", length(a) - n), b[seq_len(length(b) - n) + n]), collapse = "/")
}

src <- list.files(".", pattern = "^index\\.qmd$", recursive = TRUE)
src <- src[!grepl("^(en|_site|_freeze|node_modules|webr|backend)/", src)]

write_utf8(c("# Páginas em inglês: língua da página (o filtro _tpl/lang.lua usa este campo).",
             "lang: en", "lang-en: true"), "en/_metadata.yml")

made <- character()
for (f in src) {
  fm <- front_matter(read_utf8(f))
  if (is.null(fm) || is.null(fm[["en-path"]])) next
  pt_dir <- dirname(f)
  en_dir <- sub("/$", "", file.path("en", fm[["en-path"]]))
  if (!file.exists(file.path(pt_dir, "_body.qmd"))) { warning("sem _body.qmd: ", pt_dir); next }
  fm[["en-path"]] <- NULL
  out <- file.path(en_dir, "index.qmd")
  inc <- paste0(rel_path(en_dir, pt_dir), "/_body.qmd")
  write_utf8(c("---", paste(MARK, f), sub("\n$", "", as.yaml(fm, line.sep = "\n", indent.mapping.sequence = TRUE,
                                                         handlers = list(logical = function(x) { v <- ifelse(x, "true", "false"); class(v) <- "verbatim"; v }))), "---", "",
               sprintf("{{< include %s >}}", inc)), out)
  made <- c(made, normalizePath(out, winslash = "/"))
}

# remove páginas geradas que perderam a origem
old <- list.files("en", pattern = "^index\\.qmd$", recursive = TRUE, full.names = TRUE)
for (o in old) {
  if (normalizePath(o, winslash = "/") %in% made) next
  if (any(startsWith(read_utf8(o), MARK))) { file.remove(o); message("removida: ", o) }
}
message(sprintf("sync_en.R: %d páginas em inglês", length(made)))
