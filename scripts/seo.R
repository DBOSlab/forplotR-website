#!/usr/bin/env Rscript
# SEO e GEO do site do forplotR (pós-renderização) ------------------------------
#
# Roda depois do `quarto render` (project.post-render no _quarto.yml) sobre a
# pasta de saída inteira. Para cada página com data-page-id:
#   - resolve os marcadores do template ({{ROOT}}, {{LANGROOT}}, {{ALT_URL}},
#     {{AUTHOR_LINE}});
#   - grava em <!--fp:seo--> o canonical, os hreflang (pt-BR, en, x-default),
#     Open Graph, as meta tags de autoria e de citação e o JSON-LD (schema.org)
#     com o grafo de entidades de _data/entities.yml: o forplotR, a autoria
#     (Giulia C. Ottino, Domingos Cardoso, com ORCID), a dissertação de mestrado
#     de que o pacote é produto, as instituições e a própria página;
# e gera sitemap.xml (com as versões PT/EN de cada página), robots.txt,
# llms.txt e llms-full.txt (resumo e texto integral para assistentes de IA) e
# as páginas de redirecionamento dos endereços do site anterior.
#
# Uso manual: Rscript scripts/seo.R [_site]

suppressPackageStartupMessages({
  library(yaml)
  library(jsonlite)
})

args <- commandArgs(trailingOnly = TRUE)
site_dir <- if (length(args)) args[[1]] else Sys.getenv("QUARTO_PROJECT_OUTPUT_DIR", "_site")
if (!dir.exists(site_dir)) stop("pasta de saída não encontrada: ", site_dir)

ent <- read_yaml("_data/entities.yml")
base <- sub("/?$", "/", ent$site$url)

read_utf8 <- function(f) paste(readLines(f, encoding = "UTF-8", warn = FALSE), collapse = "\n")
write_utf8 <- function(x, f) {
  dir.create(dirname(f), recursive = TRUE, showWarnings = FALSE)
  con <- file(f, open = "wb"); on.exit(close(con))
  writeBin(charToRaw(enc2utf8(x)), con)
}
first_match <- function(x, pattern) {
  m <- regmatches(x, regexec(pattern, x, perl = TRUE))[[1]]
  if (length(m) < 2) NA_character_ else m[[2]]
}
html_escape <- function(x) {
  x <- gsub("&", "&amp;", x, fixed = TRUE)
  x <- gsub("<", "&lt;", x, fixed = TRUE)
  x <- gsub(">", "&gt;", x, fixed = TRUE)
  gsub("\"", "&quot;", x, fixed = TRUE)
}
html_unescape <- function(x) {
  x <- gsub("&quot;", "\"", x, fixed = TRUE)
  x <- gsub("&#39;", "'", x, fixed = TRUE)
  x <- gsub("&lt;", "<", x, fixed = TRUE)
  x <- gsub("&gt;", ">", x, fixed = TRUE)
  gsub("&amp;", "&", x, fixed = TRUE)
}
strip_tags <- function(x) {
  x <- gsub("<(script|style|svg|nav|aside|footer)[^>]*>.*?</\\1>", " ", x, perl = TRUE)
  x <- gsub("<[^>]+>", " ", x, perl = TRUE)
  x <- html_unescape(x)
  trimws(gsub("[ \t\r\n]+", " ", x, perl = TRUE))
}
null_or <- function(x, y) if (is.null(x) || (length(x) == 1 && is.na(x))) y else x
has <- function(x) !is.null(x) && length(x) && !all(is.na(x)) && any(nzchar(x))

# ---------------------------------------------------------------- páginas -----
skip_dirs <- "^(site_libs|webr|webr-dev|assets|figures|fonts|js|exemplos)/"
files <- list.files(site_dir, pattern = "\\.html$", recursive = TRUE)
files <- files[!grepl(skip_dirs, files)]

pages <- do.call(rbind, lapply(files, function(p) {
  h <- read_utf8(file.path(site_dir, p))
  id <- first_match(h, '<html[^>]*\\sdata-page-id="([^"]*)"')
  if (is.na(id) || !nzchar(id)) return(NULL)
  data.frame(
    path = p,
    id = id,
    lang = if (grepl("^en", first_match(h, '<html[^>]*\\slang="([^"]*)"'))) "en" else "pt",
    schema = null_or(first_match(h, '<html[^>]*\\sdata-schema="([^"]*)"'), "WebPage"),
    title = html_unescape(null_or(first_match(h, "<title>(.*?)</title>"), "forplotR")),
    description = html_unescape(null_or(first_match(h, '<meta name="description" content="([^"]*)"'), "")),
    stringsAsFactors = FALSE
  )
}))
if (is.null(pages) || !nrow(pages)) { message("seo.R: nenhuma página com data-page-id"); quit(save = "no") }
pages$clean <- sub("index\\.html$", "", pages$path)
pages$url <- paste0(base, pages$clean)
dups <- pages[duplicated(pages[c("id", "lang")]), ]
if (nrow(dups)) stop("page-id repetido na mesma língua: ", paste(dups$id, dups$lang, collapse = ", "))

alt_of <- function(id, lang) {
  other <- if (lang == "pt") "en" else "pt"
  r <- pages[pages$id == id & pages$lang == other, ]
  if (nrow(r)) r[1, ] else NULL
}
page_of <- function(id, lang) {
  r <- pages[pages$id == id & pages$lang == lang, ]
  if (nrow(r)) r[1, ] else NULL
}

# ---------------------------------------------------------------- entidades ----
P <- ent$people
O <- ent$organizations
th <- ent$thesis
sw <- ent$software
thesis_ok <- has(th$title) && has(th$program) && has(th$institution)

id_person <- function(k) paste0(base, "authors/#", gsub("[^a-z]+", "-", tolower(iconv(P[[k]]$name, to = "ASCII//TRANSLIT"))))
id_org <- function(k) paste0(base, "#org-", k)
id_sw <- paste0(base, "#software")
id_site <- paste0(base, "#website")
id_thesis <- paste0(base, "authors/#dissertacao")
# endereço da página de autoria em cada língua (inglês na raiz, português em pt/)
authors_path <- function(lang) { r <- page_of("authors", lang); if (is.null(r)) (if (lang == "en") "authors/" else "pt/autoria/") else r$clean }

person_node <- function(k, lang) {
  p <- P[[k]]
  compact(list(
    "@type" = "Person", "@id" = id_person(k),
    name = p$name, givenName = p$given, familyName = p$family,
    description = if (lang == "en") p$role_en else p$role_pt,
    identifier = if (has(p$orcid)) list("@type" = "PropertyValue", propertyID = "ORCID", value = sub(".*orcid.org/", "", p$orcid), url = p$orcid),
    alternateName = unique(c(p$full_name, unlist(p$citation_names))),
    sameAs = unique(c(unlist(p$same_as), if (has(p$lattes)) p$lattes)),
    affiliation = if (has(p$affiliation)) list("@id" = id_org(p$affiliation)),
    alumniOf = if (has(p$alumni_of)) list("@id" = id_org(p$alumni_of)),
    url = paste0(base, authors_path(lang))
  ))
}
org_node <- function(k) {
  o <- O[[k]]
  compact(list("@type" = if (k == "enbt") "CollegeOrUniversity" else "Organization", "@id" = id_org(k), name = o$name,
               alternateName = o$alternate_name, url = o$url,
               parentOrganization = if (has(o$parent)) list("@id" = id_org(o$parent))))
}
inst <- function(lang) if (lang == "en" && has(th$institution_en)) th$institution_en else th$institution
prog <- function(lang) if (lang == "en" && has(th$program_en)) th$program_en else th$program
compact <- function(x) x[!vapply(x, function(v) is.null(v) || (length(v) == 1 && is.atomic(v) && (is.na(v) || identical(v, ""))) || length(v) == 0, logical(1))]

software_node <- function(lang) {
  compact(list(
    "@type" = "SoftwareSourceCode", "@id" = id_sw,
    name = sw$name, alternateName = sw$alternate_name,
    description = if (lang == "en") sw$description_en else sw$description_pt,
    url = base, codeRepository = sw$code_repository, sameAs = list(sw$code_repository),
    programmingLanguage = list("@type" = "ComputerLanguage", name = "R", url = "https://www.r-project.org/"),
    runtimePlatform = sw$runtime, version = sw$version, license = sw$license,
    datePublished = sw$date_published, keywords = paste(unlist(sw$keywords), collapse = ", "),
    isAccessibleForFree = TRUE,
    author = list(list("@id" = id_person("ottino")), list("@id" = id_person("cardoso"))),
    creator = list("@id" = id_person("ottino")),
    maintainer = list("@id" = id_person("ottino")),
    copyrightHolder = list(list("@id" = id_person("ottino")), list("@id" = id_person("cardoso"))),
    funder = lapply(unlist(sw$funders), function(f) list("@type" = "Organization", name = f)),
    sourceOrganization = list("@id" = id_org("dboslab")),
    subjectOf = if (thesis_ok) list("@id" = id_thesis),
    citation = if (exists("paper_ok") && paper_ok) compact(list("@type" = "ScholarlyArticle", name = pp$title,
                 isPartOf = if (has(pp$journal)) list("@type" = "Periodical", name = pp$journal),
                 datePublished = pp$year, sameAs = paste0("https://doi.org/", pp$doi),
                 author = list(list("@id" = id_person("ottino")), list("@id" = id_person("cardoso"))))),
    targetProduct = list(
      "@type" = "SoftwareApplication", name = sw$name,
      applicationCategory = "ScientificApplication",
      operatingSystem = "Windows, macOS, Linux; web browser (webR)",
      offers = list("@type" = "Offer", price = "0", priceCurrency = "BRL")
    )
  ))
}
thesis_node <- function(lang) {
  if (!thesis_ok) return(NULL)
  compact(list(
    "@type" = "Thesis", "@id" = id_thesis, name = th$title,
    inSupportOf = if (lang == "en") th$degree_en else th$degree_pt,
    inLanguage = "pt-BR",
    author = list("@id" = id_person(th$author)),
    contributor = compact(list(list("@id" = id_person(th$advisor)),
                               if (has(th$co_advisor)) list("@id" = id_person(th$co_advisor)))),
    sourceOrganization = list("@id" = id_org("enbt")),
    funder = if (has(th$scholarship)) list("@type" = "Organization", name = th$scholarship),
    keywords = if (has(th$keywords)) paste(unlist(th$keywords), collapse = ", "),
    dateCreated = th$year, url = th$url, about = list("@id" = id_sw),
    workExample = list("@id" = id_sw)
  ))
}

# Frase de autoria do rodapé (texto visível: é o que buscadores e assistentes leem).
author_line <- function(lang, root) {
  a <- paste0(root, authors_path(lang))
  yr <- if (thesis_ok && has(th$year)) paste0(", ", th$year) else ""
  if (lang == "en") {
    detail <- if (thesis_ok) sprintf(' as the product of her <a href="%s#dissertacao">master\'s degree in Botany</a> at the National School of Tropical Botany (ENBT/JBRJ%s)', a, yr) else " during her master's degree"
    sprintf('forplotR was developed by <a href="%s#giulia-c-ottino">Giulia C. Ottino</a>%s, supervised by <a href="%s#domingos-cardoso">Domingos Cardoso</a>, at the Rio de Janeiro Botanical Garden (DBOSlab).', a, detail, a)
  } else {
    detail <- if (thesis_ok) sprintf(' como produto de seu <a href="%s#dissertacao">mestrado em Botânica</a> na Escola Nacional de Botânica Tropical (ENBT/JBRJ%s)', a, yr) else " como produto de seu mestrado"
    sprintf('O forplotR foi desenvolvido por <a href="%s#giulia-c-ottino">Giulia C. Ottino</a>%s, sob orientação de <a href="%s#domingos-cardoso">Domingos Cardoso</a>, no Jardim Botânico do Rio de Janeiro (DBOSlab).', a, detail, a)
  }
}

# Artigo (página "Como citar"): DOI quando publicado.
pp <- ent$paper
paper_ok <- !is.null(pp) && has(pp$doi)
paper_block <- function(lang) {
  if (!paper_ok) {
    return(if (lang == "en") "<p>The DOI of the paper describing forplotR will appear here once it is published.</p>"
           else "<p>O DOI do artigo que descreve o forplotR aparecerá aqui quando ele for publicado.</p>")
  }
  ref <- sprintf("Ottino, G. C. & Cardoso, D.%s %s%s", if (has(pp$year)) paste0(" (", pp$year, ").") else "",
                 if (has(pp$title)) paste0(html_escape(pp$title), ". ") else "",
                 if (has(pp$journal)) paste0("<em>", html_escape(pp$journal), "</em>. ") else "")
  sprintf('<div class="cite-box">%s<a href="https://doi.org/%s">https://doi.org/%s</a></div>', ref, pp$doi, pp$doi)
}

# Detalhes da dissertação na página de autoria (só com os dados preenchidos).
thesis_block <- function(lang) {
  if (!thesis_ok) return("")
  adv <- P[[th$advisor]]$name
  co <- if (has(th$co_advisor)) P[[th$co_advisor]]$name else NULL
  link <- function(x) if (has(th$url)) sprintf('<a href="%s">%s</a>', th$url, x) else x
  yr <- if (has(th$year)) paste0(", ", th$year) else ""
  lat <- if (has(P[[th$author]]$lattes)) P[[th$author]]$lattes else NULL
  if (lang == "en") {
    sprintf('<div class="thesis" id="dissertacao"><p class="thesis-label">Master\'s dissertation (in Portuguese)</p><p class="thesis-title">%s</p><p>Giulia Cavalcanti Ottino. %s, %s%s. Supervisor: %s%s.%s%s</p></div>',
            link(html_escape(th$title)), html_escape(prog("en")), html_escape(inst("en")), yr, adv,
            if (!is.null(co)) paste0("; co-supervisor: ", co) else "",
            if (has(th$scholarship)) paste0(" ", th$scholarship, " scholarship.") else "",
            if (!is.null(lat)) sprintf(' <a href="%s">Lattes CV</a>.', lat) else "")
  } else {
    sprintf('<div class="thesis" id="dissertacao"><p class="thesis-label">Dissertação de mestrado</p><p class="thesis-title">%s</p><p>Giulia Cavalcanti Ottino. %s, %s%s. Orientação: %s%s.%s%s</p></div>',
            link(html_escape(th$title)), html_escape(prog("pt")), html_escape(inst("pt")), yr, adv,
            if (!is.null(co)) paste0("; coorientação: ", co) else "",
            if (has(th$scholarship)) paste0(" Bolsa ", th$scholarship, ".") else "",
            if (!is.null(lat)) sprintf(' <a href="%s">Currículo Lattes</a>.', lat) else "")
  }
}

# Perguntas frequentes: <details class="faq"><summary>P</summary> R </details>
faq_entities <- function(h) {
  m <- gregexpr('<details class="faq"[^>]*>\\s*<summary>(.*?)</summary>(.*?)</details>', h, perl = TRUE)
  blocks <- regmatches(h, m)[[1]]
  lapply(blocks, function(b) {
    q <- strip_tags(first_match(b, "<summary>(.*?)</summary>"))
    a <- strip_tags(sub(".*?</summary>", "", sub("</details>$", "", b), perl = TRUE))
    list("@type" = "Question", name = q, acceptedAnswer = list("@type" = "Answer", text = a))
  })
}

breadcrumb <- function(row) {
  segs <- strsplit(sub("/$", "", row$clean), "/")[[1]]
  segs <- segs[nzchar(segs)]
  home <- if (row$lang == "en") "" else "pt/"
  crumbs <- list()
  add <- function(clean, name) crumbs[[length(crumbs) + 1]] <<- list("@type" = "ListItem", position = length(crumbs) + 1, name = name, item = paste0(base, clean))
  add(home, if (row$lang == "en") "forplotR" else "forplotR")
  acc <- ""
  for (s in segs) {
    acc <- paste0(acc, s, "/")
    if (acc == home) next
    r <- pages[pages$clean == acc, ]
    if (nrow(r)) add(acc, sub(" [—|–-] forplotR$", "", r$title[[1]]))
  }
  if (length(crumbs) < 2) return(NULL)
  list("@type" = "BreadcrumbList", itemListElement = crumbs)
}

page_node <- function(row, h) {
  type <- row$schema
  node <- compact(list(
    "@type" = type, "@id" = paste0(row$url, "#webpage"), url = row$url,
    name = sub(" [—|–-] forplotR$", "", row$title), description = row$description,
    inLanguage = if (row$lang == "en") "en" else "pt-BR",
    isPartOf = list("@id" = id_site), about = list("@id" = id_sw),
    author = list(list("@id" = id_person("ottino")), list("@id" = id_person("cardoso"))),
    breadcrumb = breadcrumb(row)
  ))
  if (type == "TechArticle") {
    node$headline <- node$name
    node$proficiencyLevel <- "Beginner"
    node$dependencies <- "R (>= 4.1.0), forplotR"
  }
  if (type == "FAQPage") node$mainEntity <- faq_entities(h)
  if (type %in% c("AboutPage", "ProfilePage")) {
    node$mainEntity <- list(list("@id" = id_person("ottino")), list("@id" = id_person("cardoso")))
  }
  node
}

graph_for <- function(row, h) {
  g <- list(
    compact(list("@type" = "WebSite", "@id" = id_site, url = base, name = ent$site$name,
                 inLanguage = list("pt-BR", "en"), about = list("@id" = id_sw),
                 author = list(list("@id" = id_person("ottino")), list("@id" = id_person("cardoso"))),
                 publisher = list("@id" = id_org("dboslab")))),
    software_node(row$lang),
    person_node("ottino", row$lang),
    person_node("cardoso", row$lang),
    org_node("jbrj"), org_node("dboslab"), org_node("enbt"),
    page_node(row, h)
  )
  t <- thesis_node(row$lang)
  if (!is.null(t)) g <- c(g, list(t))
  if (thesis_ok && has(th$co_advisor)) g <- c(g, list(person_node(th$co_advisor, row$lang)))
  # páginas do app no navegador: WebApplication (gratuito, roda no navegador,
  # dados ficam no computador), ligado ao pacote e à autora
  if (row$id == "tools" || grepl("^tool-", row$id)) {
    en <- row$lang == "en"
    g <- c(g, list(compact(list(
      "@type" = "WebApplication", "@id" = paste0(row$url, "#app"),
      name = sub(" [—|–-] forplotR$", "", row$title), url = row$url,
      description = row$description,
      applicationCategory = "ScientificApplication",
      applicationSubCategory = if (en) "Botanical collection management for permanent vegetation plots" else "Gestão de coleções botânicas de parcelas permanentes de vegetação",
      operatingSystem = "Any (web browser with WebAssembly)",
      browserRequirements = "Requires WebAssembly (webR); data are processed locally and are not uploaded.",
      isAccessibleForFree = TRUE,
      offers = list("@type" = "Offer", price = "0", priceCurrency = "USD"),
      inLanguage = if (en) "en" else "pt-BR",
      featureList = if (en) c("Reads the spreadsheet header and suggests the layout and columns",
                              "Interactive plot map", "Collection-balance report", "Voucher photo folders",
                              "Herbarium label spreadsheet (JABOT, BRAHMS)", "Runs locally: no data upload")
                    else c("Lê o cabeçalho da planilha e sugere o formato e as colunas",
                           "Mapa interativo da parcela", "Relatório de balanço de coleta", "Pastas de fotos dos vouchers",
                           "Planilha de etiquetas do herbário (JABOT, BRAHMS)", "Roda no computador: nenhum dado é enviado"),
      isPartOf = list("@id" = id_sw),
      creator = list(list("@id" = id_person("ottino")), list("@id" = id_person("cardoso")))
    ))))
  }
  list("@context" = "https://schema.org", "@graph" = g)
}

head_block <- function(row, h) {
  alt <- alt_of(row$id, row$lang)
  pt <- if (row$lang == "pt") row else alt
  en <- if (row$lang == "en") row else alt
  img <- paste0(base, ent$site$image)
  t <- sub(" [—|–-] forplotR$", "", row$title)
  lines <- c(
    sprintf('<link rel="canonical" href="%s">', row$url),
    if (!is.null(pt)) sprintf('<link rel="alternate" hreflang="pt-BR" href="%s">', pt$url),
    if (!is.null(en)) sprintf('<link rel="alternate" hreflang="en" href="%s">', en$url),
    if (!is.null(en)) sprintf('<link rel="alternate" hreflang="x-default" href="%s">', en$url),
    sprintf('<meta name="author" content="%s, %s">', P$ottino$name, P$cardoso$name),
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">',
    sprintf('<meta property="og:site_name" content="%s">', ent$site$name),
    sprintf('<meta property="og:type" content="%s">', if (row$id == "home") "website" else "article"),
    sprintf('<meta property="og:title" content="%s">', html_escape(t)),
    if (nzchar(row$description)) sprintf('<meta property="og:description" content="%s">', html_escape(row$description)),
    sprintf('<meta property="og:url" content="%s">', row$url),
    sprintf('<meta property="og:image" content="%s">', img),
    '<meta property="og:image:alt" content="forplotR">',
    sprintf('<meta property="og:locale" content="%s">', if (row$lang == "en") "en_US" else "pt_BR"),
    if (!is.null(alt)) sprintf('<meta property="og:locale:alternate" content="%s">', if (row$lang == "en") "pt_BR" else "en_US"),
    if (row$id != "home") sprintf('<meta property="article:author" content="%s">', P$ottino$name),
    '<meta name="twitter:card" content="summary">',
    sprintf('<meta name="twitter:title" content="%s">', html_escape(t)),
    if (nzchar(row$description)) sprintf('<meta name="twitter:description" content="%s">', html_escape(row$description)),
    sprintf('<link rel="author" href="%s">', paste0(base, authors_path(row$lang))),
    sprintf('<link rel="license" href="%s">', sw$license),
    sprintf('<link rel="sitemap" type="application/xml" href="%ssitemap.xml">', base)
  )
  # Meta tags de citação (Google Scholar / Zotero) na página inicial e em "Como citar".
  if (row$id %in% c("home", "cite")) {
    lines <- c(lines,
      sprintf('<meta name="citation_title" content="%s">', "forplotR: Streamlined Forest Plot Data Management and Visualization"),
      sprintf('<meta name="citation_author" content="%s, %s">', P$ottino$family, P$ottino$given),
      sprintf('<meta name="citation_author_orcid" content="%s">', P$ottino$orcid),
      sprintf('<meta name="citation_author" content="%s, %s">', P$cardoso$family, P$cardoso$given),
      sprintf('<meta name="citation_author_orcid" content="%s">', P$cardoso$orcid),
      sprintf('<meta name="citation_publication_date" content="%s">', sw$date_published),
      sprintf('<meta name="citation_public_url" content="%s">', base),
      sprintf('<meta name="DC.title" content="forplotR">'),
      sprintf('<meta name="DC.creator" content="%s">', P$ottino$name),
      sprintf('<meta name="DC.creator" content="%s">', P$cardoso$name),
      sprintf('<meta name="DC.rights" content="MIT">'))
  }
  ld <- toJSON(graph_for(row, h), auto_unbox = TRUE, pretty = FALSE, null = "null")
  ld <- gsub("</", "<\\/", ld, fixed = TRUE)
  c(lines, sprintf('<script type="application/ld+json">%s</script>', ld))
}

# --------------------------------------------------------- reescrever páginas --
for (i in seq_len(nrow(pages))) {
  row <- pages[i, ]
  f <- file.path(site_dir, row$path)
  h <- read_utf8(f)
  depth <- lengths(regmatches(row$path, gregexpr("/", row$path)))
  root <- if (depth == 0) "./" else strrep("../", depth)
  langroot <- if (row$lang == "en") root else paste0(root, "pt/")
  alt <- alt_of(row$id, row$lang)
  alt_href <- if (!is.null(alt)) paste0(root, alt$clean) else if (row$lang == "en") paste0(root, "pt/") else root
  if (identical(alt_href, "./")) alt_href <- "./"
  # num link Markdown o Pandoc codifica as chaves dos marcadores (%7B%7BROOT%7D%7D)
  h <- gsub("%7B%7B([A-Z_]+|LINK:[A-Za-z0-9_-]+)%7D%7D", "{{\\1}}", h, perl = TRUE)
  h <- gsub("{{ROOT}}", root, h, fixed = TRUE)
  h <- gsub("{{LANGROOT}}", langroot, h, fixed = TRUE)
  h <- gsub("{{ALT_URL}}", alt_href, h, fixed = TRUE)
  h <- gsub("{{AUTHOR_LINE}}", author_line(row$lang, root), h, fixed = TRUE)
  h <- gsub("<p>{{THESIS_BLOCK}}</p>", thesis_block(row$lang), h, fixed = TRUE)
  h <- gsub("<p>{{PAPER_BLOCK}}</p>", paper_block(row$lang), h, fixed = TRUE)
  # {{LINK:id}}: endereço relativo da página com esse page-id, na língua da página
  for (lk in unique(regmatches(h, gregexpr("\\{\\{LINK:[A-Za-z0-9_-]+\\}\\}", h, perl = TRUE))[[1]])) {
    tid <- sub("^\\{\\{LINK:(.*)\\}\\}$", "\\1", lk)
    tgt <- page_of(tid, row$lang)
    if (is.null(tgt)) tgt <- page_of(tid, if (row$lang == "en") "pt" else "en")
    if (is.null(tgt)) { warning("seo.R: link para page-id inexistente: ", tid, " em ", row$path); next }
    h <- gsub(lk, paste0(root, tgt$clean), h, fixed = TRUE)
  }
  h <- sub("<!--fp:seo-->", paste(head_block(row, h), collapse = "\n"), h, fixed = TRUE)
  # título da aba e do resultado de busca sempre com a marca
  if (!grepl("forplotR", row$title, fixed = TRUE)) {
    h <- sub("<title>(.*?)</title>", sprintf("<title>%s — forplotR</title>", html_escape(row$title)), h, perl = TRUE)
  }
  # página atual marcada no menu já no HTML (funciona sem JavaScript)
  nav_key <- if (grepl("^tool-", row$id)) "tools" else row$id
  h <- gsub(sprintf('data-nav="%s"', nav_key), sprintf('data-nav="%s" aria-current="page"', nav_key), h, fixed = TRUE)
  write_utf8(h, f)
}

# ---------------------------------------------------------- redirecionamentos --
# Endereços do site anterior (main:/docs, indexados pelos buscadores) que não
# existem mais. Os que continuam iguais (get-started/, faq/, news/, authors/,
# reference/) não precisam de nada: o inglês ficou na raiz justamente por isso.
# Destino: page-id e âncora; inglês por padrão, português se a pessoa escolheu
# o português antes (localStorage) ou se o endereço traz ?lang=pt.
redirects <- list(
  "about.html"                                    = c("about", ""),
  "LICENSE.html"                                  = c("about", ""),
  "articles/index.html"                           = c("apps", ""),
  "articles/plot_html_map_general_usage.html"     = c("map", ""),
  "articles/plot_for_balance_general_usage.html"  = c("balance", ""),
  "articles/mk_voucher_dirs_general_usage.html"   = c("photos", ""),
  "articles/fp_herb_converter_general_usage.html" = c("labels", ""),
  "reference/plot_html_map.html"                  = c("reference", "#forplot_map"),
  "reference/plot_for_balance.html"               = c("reference", "#forplot_balance"),
  "reference/mk_voucher_dirs.html"                = c("reference", "#forplot_vouchers"),
  "reference/fp_herb_converter.html"              = c("reference", "#forplot_sheets")
)
n_red <- 0
for (old in names(redirects)) {
  if (file.exists(file.path(site_dir, old)) && grepl("data-page-id", read_utf8(file.path(site_dir, old)), fixed = TRUE)) next
  tid <- redirects[[old]][[1]]; anchor <- redirects[[old]][[2]]
  en <- page_of(tid, "en"); pt <- page_of(tid, "pt")
  if (is.null(en)) next
  depth <- lengths(regmatches(old, gregexpr("/", old)))
  root <- if (depth == 0) "./" else strrep("../", depth)
  to_en <- paste0(root, en$clean); to_pt <- if (!is.null(pt)) paste0(root, pt$clean) else to_en
  html <- paste0(
    '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n',
    '<title>', html_escape(en$title), '</title>\n',
    '<meta name="robots" content="noindex, follow">\n',
    '<link rel="canonical" href="', en$url, '">\n',
    '<meta http-equiv="refresh" content="0; url=', to_en, anchor, '">\n',
    '<script>(function(){var l=null;try{l=localStorage.getItem("forplotR_lang")}catch(e){}',
    'var h=location.hash||"', anchor, '";',
    'if(/[?&]lang=pt\\b/.test(location.search)||l==="pt"){location.replace("', to_pt, '"+h)}',
    'else{location.replace("', to_en, '"+h)}})();</script>\n',
    '</head>\n<body>\n<p>This page has moved: <a href="', to_en, anchor, '">', html_escape(en$title), '</a>.',
    if (!is.null(pt)) paste0(' Português: <a href="', to_pt, anchor, '">', html_escape(pt$title), '</a>.') else '',
    '</p>\n</body>\n</html>\n')
  write_utf8(html, file.path(site_dir, old))
  n_red <- n_red + 1
}

# ------------------------------------------------------------------ sitemap ----
git_date <- function(path) {
  out <- tryCatch(suppressWarnings(system2("git", c("log", "-1", "--format=%cs", "--", shQuote(path)), stdout = TRUE, stderr = FALSE)),
                  error = function(e) character())
  if (length(out) && nzchar(out[[1]])) out[[1]] else NA_character_
}
src_dir <- function(row) {
  pt <- if (row$lang == "pt") row else alt_of(row$id, row$lang)
  # a fonte de cada página é o _body.qmd em pt/ (as páginas EN são geradas)
  d <- if (is.null(pt)) dirname(row$path) else dirname(pt$path)
  file.path(d, "_body.qmd")
}
urls <- vapply(seq_len(nrow(pages)), function(i) {
  row <- pages[i, ]
  alt <- alt_of(row$id, row$lang)
  pt <- if (row$lang == "pt") row else alt
  en <- if (row$lang == "en") row else alt
  lm <- git_date(src_dir(row))
  paste0(
    "  <url>\n    <loc>", row$url, "</loc>\n",
    if (!is.na(lm)) paste0("    <lastmod>", lm, "</lastmod>\n") else "",
    if (!is.null(pt)) paste0('    <xhtml:link rel="alternate" hreflang="pt-BR" href="', pt$url, '"/>\n') else "",
    if (!is.null(en)) paste0('    <xhtml:link rel="alternate" hreflang="en" href="', en$url, '"/>\n') else "",
    if (!is.null(en)) paste0('    <xhtml:link rel="alternate" hreflang="x-default" href="', en$url, '"/>\n') else "",
    "  </url>")
}, character(1))
write_utf8(paste0('<?xml version="1.0" encoding="UTF-8"?>\n',
                  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n',
                  paste(urls, collapse = "\n"), "\n</urlset>\n"),
           file.path(site_dir, "sitemap.xml"))

# ------------------------------------------------------------------- robots ----
# Indexação aberta, inclusive para os rastreadores de assistentes de IA (GEO).
# Observação: num site de projeto do GitHub Pages (usuario.github.io/projeto/),
# os buscadores leem o robots.txt da raiz do domínio, não este; o sitemap deve
# ser enviado no Google Search Console e no Bing Webmaster Tools.
bots <- c("Googlebot", "Bingbot", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot",
          "Claude-SearchBot", "Claude-User", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot")
path0 <- sub("^https?://[^/]+", "", base)
write_utf8(paste0(
  "# forplotR: conteúdo aberto para busca e para assistentes de IA.\n",
  paste0("User-agent: ", bots, "\nAllow: ", path0, "\n", collapse = "\n"), "\n",
  "User-agent: *\nAllow: ", path0, "\nDisallow: ", path0, "webr/\nDisallow: ", path0, "webr-dev/\n\n",
  "Sitemap: ", base, "sitemap.xml\n"), file.path(site_dir, "robots.txt"))

# ---------------------------------------------------------------- llms.txt -----
# Resumo em Markdown para assistentes de IA (https://llmstxt.org) e texto integral.
lst <- function(lang, ids) {
  out <- character()
  for (id in ids) {
    r <- page_of(id, lang)
    if (!is.null(r)) out <- c(out, sprintf("- [%s](%s): %s", sub(" [—|–-] forplotR$", "", r$title), r$url, r$description))
  }
  out
}
core_ids <- c("home", "start", "apps", "map", "balance", "photos", "labels", "determinations", "tools", "reference")
meta_ids <- c("authors", "cite", "about", "faq", "news")
thesis_txt_en <- if (thesis_ok) sprintf("as the product of her master's degree in Botany at the National School of Tropical Botany (ENBT), Rio de Janeiro Botanical Garden Research Institute (dissertation, in Portuguese: \"%s\", %s; supervisor Domingos Cardoso, co-supervisor Pedro Lage Viana; CAPES scholarship)", th$title, th$year) else "as the product of her master's degree"
thesis_txt_pt <- if (thesis_ok) sprintf("como produto de seu mestrado em Botânica na Escola Nacional de Botânica Tropical (ENBT/JBRJ), com a dissertação \"%s\" (%s; orientação de Domingos Cardoso, coorientação de Pedro Lage Viana; bolsa CAPES)", th$title, th$year) else "como produto de seu mestrado"
llms <- c(
  "# forplotR",
  "",
  paste0("> ", sw$description_en),
  "",
  sprintf("forplotR was developed by Giulia C. Ottino (ORCID %s) %s, supervised by Domingos Cardoso (ORCID %s), at the Rio de Janeiro Botanical Garden (Instituto de Pesquisas Jardim Botânico do Rio de Janeiro, JBRJ), DBOSlab. Supported by %s. Licence: MIT. Source code: %s.",
          sub(".*orcid.org/", "", P$ottino$orcid), thesis_txt_en, sub(".*orcid.org/", "", P$cardoso$orcid),
          paste(unlist(sw$funders), collapse = " and "), sw$code_repository),
  "",
  sprintf("O forplotR foi desenvolvido por Giulia C. Ottino %s, sob orientação de Domingos Cardoso, no Jardim Botânico do Rio de Janeiro (DBOSlab).", thesis_txt_pt),
  "",
  "Principles: forplotR organises and cross-references plot and specimen data; it does not identify species or correct determinations. Cross-checks point out differences between field and herbarium for a person to review; the collection balance shows what is missing according to the spreadsheet. The browser tools run R locally (webR): plot data never leave the user's computer.",
  "",
  "## Documentation (English)", "", lst("en", core_ids), "",
  "## Documentação (português)", "", lst("pt", core_ids), "",
  "## About, authors and citation", "", lst("en", meta_ids), lst("pt", meta_ids), "",
  "## Optional", "",
  sprintf("- [Full text of the site](%sllms-full.txt): all pages as plain text, English and Portuguese", base),
  sprintf("- [Source code](%s)", sw$code_repository)
)
write_utf8(paste0(paste(llms, collapse = "\n"), "\n"), file.path(site_dir, "llms.txt"))

full <- character()
for (lang in c("en", "pt")) for (i in which(pages$lang == lang)) {
  row <- pages[i, ]
  h <- read_utf8(file.path(site_dir, row$path))
  main <- first_match(h, "(?s)<main[^>]*>(.*)</main>")
  if (is.na(main)) next
  full <- c(full, paste0("# ", sub(" [—|–-] forplotR$", "", row$title)), paste0("URL: ", row$url), "", strip_tags(main), "", "---", "")
}
write_utf8(paste0(paste(c(llms[1:7], "", "---", "", full), collapse = "\n"), "\n"), file.path(site_dir, "llms-full.txt"))

message(sprintf("seo.R: %d páginas (%d PT, %d EN), %d redirecionamentos, sitemap, robots.txt, llms.txt%s",
                nrow(pages), sum(pages$lang == "pt"), sum(pages$lang == "en"), n_red,
                if (thesis_ok) "" else " — dados da dissertação ainda vazios em _data/entities.yml"))
