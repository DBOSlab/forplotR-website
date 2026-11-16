#!/usr/bin/env Rscript
# Referência, novidades e citação a partir do pacote ----------------------------
#
# Lê o código-fonte do forplotR (padrão: ../forplotR-webr; ou FORPLOTR_PKG) e
# grava os trechos que as páginas incluem:
#   referencia/_rd.md     funções e dados, de man/*.Rd (tools::Rd2HTML),
#                         agrupados pelas aplicações do site
#   novidades/_news.md    NEWS.md
#   citar/_bib.md         BibTeX e texto de citação (inst/CITATION)
#   exemplos/citacao/     forplotR.bib e CITATION.cff para baixar
# Rode de novo a cada versão do pacote.

pkg <- Sys.getenv("FORPLOTR_PKG", "../forplotR-webr")
if (!file.exists(file.path(pkg, "DESCRIPTION"))) stop("pacote não encontrado em ", pkg)
write_utf8 <- function(x, f) {
  dir.create(dirname(f), recursive = TRUE, showWarnings = FALSE)
  con <- file(f, open = "wb"); on.exit(close(con))
  writeBin(charToRaw(enc2utf8(paste0(paste(x, collapse = "\n"), "\n"))), con)
}
desc <- read.dcf(file.path(pkg, "DESCRIPTION"))
version <- desc[1, "Version"]

# ------------------------------------------------------------------ referência --
groups <- list(
  list(id = "map", pt = "Mapear a parcela", en = "Map the plot", rd = "forplot_map"),
  list(id = "balance", pt = "Balanço de coleta", en = "Collection balance", rd = "forplot_balance"),
  list(id = "photos", pt = "Organizar as fotos", en = "Organise the photos", rd = "forplot_vouchers"),
  list(id = "labels", pt = "Etiquetas para o herbário", en = "Herbarium labels", rd = "forplot_sheets"),
  list(id = "determinations", pt = "Conferir determinações", en = "Check determinations", rd = "forplot_crossdet"),
  list(id = "start", pt = "Dados de exemplo", en = "Example data", rd = c("RUS01", "TUM"))
)
# Rd do pacote instalado (instale a versão documentada antes: R CMD INSTALL <pkg>)
db <- tools::Rd_db("forplotR")
if (as.character(utils::packageVersion("forplotR")) != version) {
  warning("forplotR instalado (", utils::packageVersion("forplotR"), ") difere do código em ", pkg, " (", version, ")")
}
rd_html <- function(name) {
  rd <- db[[paste0(name, ".Rd")]]
  if (is.null(rd)) stop("Rd não encontrado: ", name)
  tmp <- tempfile(fileext = ".html")
  tools::Rd2HTML(rd, out = tmp, fragment = TRUE, no_links = TRUE)
  h <- paste(readLines(tmp, encoding = "UTF-8", warn = FALSE), collapse = "\n")
  # o título vira o nosso cabeçalho; níveis de título descem um degrau
  h <- sub("(?s)^.*?<h2[^>]*>.*?</h2>", "", h, perl = TRUE)
  h <- gsub("<h3", "<h4", gsub("</h3>", "</h4>", h, fixed = TRUE), fixed = TRUE)
  h <- gsub("<table[^>]*>", "<table>", h, perl = TRUE)
  h <- sub("(?s)<h4>Title</h4>.*?(?=<h4>Description</h4>)", "", h, perl = TRUE)
  title <- tools:::.Rd_get_metadata(rd, "title")
  list(html = h, title = trimws(gsub("\\s+", " ", paste(title, collapse = " "))))
}
lines <- c(
  "<!-- gerado por scripts/build_reference.R a partir de man/*.Rd; não edite -->", "",
  sprintf("[A referência vem da documentação do pacote (forplotR %s) e está em inglês, como no R.]{data-lang=pt}[Generated from the package documentation (forplotR %s).]{data-lang=en}", version, version), ""
)
for (g in groups) {
  lines <- c(lines, sprintf("## [%s]{data-lang=pt}[%s]{data-lang=en} {#%s}", g$pt, g$en, paste0("grupo-", g$id)), "")
  for (r in g$rd) {
    x <- rd_html(r)
    is_fun <- startsWith(r, "forplot_")
    lines <- c(lines,
      sprintf("### `%s%s` {#%s}", r, if (is_fun) "()" else "", r), "",
      sprintf('<p class="rd-title">%s</p>', x$title), "",
      if (g$id != "start") sprintf("[Aplicação: %s]{data-lang=pt}[Application: %s]{data-lang=en} · [→]({{LINK:%s}})", g$pt, g$en, g$id) else "", "",
      "```{=html}", '<div class="rd" lang="en">', x$html, "</div>", "```", "")
  }
}
write_utf8(lines, "pt/referencia/_rd.md")

# ------------------------------------------------------------------ novidades ---
news <- readLines(file.path(pkg, "NEWS.md"), encoding = "UTF-8", warn = FALSE)
news <- sub("^(#+) ", "#\\1 ", news)                      # um nível abaixo do título da página
k <- 0
news <- vapply(news, function(l) {
  if (grepl("^#{2,} ", l)) { k <<- k + 1; paste0(l, " {#news-", k, "}") } else l
}, "", USE.NAMES = FALSE)
write_utf8(c("<!-- gerado por scripts/build_reference.R a partir de NEWS.md; não edite -->", "",
             '::: {lang="en"}', news, ":::"), "pt/novidades/_news.md")

# ------------------------------------------------------------------- citação ----
cit <- utils::readCitationFile(file.path(pkg, "inst", "CITATION"), meta = list(Version = version, Encoding = "UTF-8"))
bib <- paste(utils::toBibtex(cit), collapse = "\n")
bib <- sub("@Manual\\{,", "@Manual{forplotR,", bib)
txt <- attr(unclass(cit)[[1]], "textVersion")
if (is.null(txt)) txt <- format(cit, style = "text")
txt <- sub("(https?://\\S+)$", "<\\1>", txt)
write_utf8(bib, "exemplos/citacao/forplotR.bib")
file.copy(file.path(pkg, "CITATION.cff"), "exemplos/citacao/CITATION.cff", overwrite = TRUE)
write_utf8(c("<!-- gerado por scripts/build_reference.R a partir de inst/CITATION; não edite -->", "",
             '::: {.cite-box #cite-text}', txt, ":::", "",
             "```{.bibtex}", bib, "```"), "pt/citar/_bib.md")
message(sprintf("build_reference.R: forplotR %s; %d páginas de ajuda", version, sum(lengths(lapply(groups, `[[`, "rd")))))
