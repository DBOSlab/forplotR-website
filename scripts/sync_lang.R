#!/usr/bin/env Rscript
# Páginas em inglês (raiz do site) a partir das fontes bilíngues em pt/ ---------
#
# O site é bilíngue a partir de uma fonte só. Cada página fica em pt/<caminho>/
# como index.qmd (cabeçalho YAML com títulos bilíngues) e _body.qmd (texto com
# trechos [..]{data-lang=pt}[..]{data-lang=en}). As páginas em pt/ são as
# portuguesas (pt/_metadata.yml: lang pt-BR). O inglês é o idioma padrão e fica
# na raiz: o campo `en-path` diz onde (ex.: "applications/map"; "" = início).
#
# Este script grava <en-path>/index.qmd com o mesmo cabeçalho e um include do
# mesmo _body.qmd; o filtro _tpl/lang.lua mantém só o inglês. Páginas geradas
# que perderam a origem são apagadas. Os arquivos gerados ficam no repositório
# (o Quarto lista as páginas antes do pre-render), mas não se editam à mão.

suppressPackageStartupMessages(library(yaml))

MARK <- "# gerado por scripts/sync_lang.R a partir de"
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
yaml_out <- function(fm) sub("\n$", "", as.yaml(fm, line.sep = "\n", indent.mapping.sequence = TRUE,
  handlers = list(logical = function(x) { v <- ifelse(x, "true", "false"); class(v) <- "verbatim"; v })))

write_utf8(c("# Páginas em português: língua da página (o filtro _tpl/lang.lua usa este campo).",
             "lang: pt-BR", "lang-en: false"), "pt/_metadata.yml")

src <- list.files("pt", pattern = "^index\\.qmd$", recursive = TRUE, full.names = TRUE)
made <- character()
for (f in src) {
  fm <- front_matter(read_utf8(f))
  if (is.null(fm) || is.null(fm[["en-path"]])) next
  pt_dir <- dirname(f)
  en_dir <- if (nzchar(fm[["en-path"]])) sub("/$", "", fm[["en-path"]]) else "."
  if (!file.exists(file.path(pt_dir, "_body.qmd"))) { warning("sem _body.qmd: ", pt_dir); next }
  fm[["en-path"]] <- NULL
  out <- if (en_dir == ".") "index.qmd" else file.path(en_dir, "index.qmd")
  inc <- paste0(rel_path(en_dir, pt_dir), "/_body.qmd")
  write_utf8(c("---", paste(MARK, f), yaml_out(fm), "---", "", sprintf("{{< include %s >}}", inc)), out)
  made <- c(made, normalizePath(out, winslash = "/"))
}

# remove páginas geradas que perderam a origem
old <- list.files(".", pattern = "^index\\.qmd$", recursive = TRUE)
old <- old[!grepl("^(pt|_site|_freeze|_tools|node_modules|webr|backend|exemplos)/", old)]
for (o in old) {
  if (normalizePath(o, winslash = "/") %in% made) next
  if (any(startsWith(read_utf8(o), MARK))) { file.remove(o); message("removida: ", o) }
}
message(sprintf("sync_lang.R: %d páginas em inglês", length(made)))
