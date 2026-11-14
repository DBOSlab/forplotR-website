# Núcleo comum: execução e organização das saídas ---------------------------
# Usado pelo servidor (Plumber/callr) e pelo motor local (webR, no navegador).
# Autossuficiente: não depende de outros arquivos de backend/R.

# Executa uma função do forplotR com os argumentos montados por build_params().
# Usado pelo servidor (dentro do child_run) e pelo motor local (webR).
# O pacote já deve estar carregado.
run_tool <- function(tool_fun, params) {
  options(warn = 1)
  ex <- params[[".example"]]
  params[[".example"]] <- NULL
  if (!is.null(ex)) {
    e <- new.env()
    df <- tryCatch({
      utils::data(list = ex, package = "forplotR", envir = e)
      get(ex, envir = e)
    }, error = function(err) get(ex, envir = asNamespace("forplotR")))
    openxlsx::write.xlsx(df, params$fp_file_path)
    message("Usando os dados de exemplo ", ex, " do pacote.")
  }

  fn <- get(tool_fun, envir = asNamespace("forplotR"))

  # Versões diferentes do pacote têm argumentos diferentes: ignora os que esta não tem.
  fa <- names(formals(fn))
  if (!"..." %in% fa) {
    drop <- setdiff(names(params), fa)
    if (length(drop)) {
      message("Ignorando opções que esta versão do forplotR não aceita: ",
              paste(drop, collapse = ", "))
      params <- params[setdiff(names(params), drop)]
    }
  }

  message("forplotR ", utils::packageVersion("forplotR"), " | ", R.version.string)
  message("Executando forplotR::", tool_fun, "() ...")
  do.call(fn, params)
  message("Pronto.")
  invisible(TRUE)
}

file_kind <- function(path) {
  ext <- tolower(tools::file_ext(path))
  switch(ext, html = "html", htm = "html", pdf = "pdf", xlsx = "xlsx", xls = "xlsx",
         png = "image", jpg = "image", jpeg = "image", gif = "image", webp = "image",
         csv = "csv", zip = "zip", "file")
}

file_label <- function(rel) {
  b <- basename(rel)
  rules <- c(
    "_full_report\\.html$" = "Relatório completo (HTML interativo)",
    "_full_report\\.pdf$" = "Relatório completo (PDF)",
    "^collection_balance\\.xlsx$" = "Balanço de coleta por subparcela (XLSX)",
    "_general\\.png$" = "Mapa geral da parcela",
    "_collected\\.png$" = "Mapa dos coletados",
    "_uncollected\\.png$" = "Mapa dos não coletados",
    "_uncollected_palms\\.png$" = "Mapa das palmeiras não coletadas",
    "_priority_uncollected_species\\.png$" = "Subparcelas prioritárias",
    "_species_plot\\.png$" = "Espécies mais abundantes",
    "_family_plot\\.png$" = "Famílias mais abundantes",
    "^Results_.*\\.html$" = "Mapa interativo (HTML)",
    "planilha_herbario\\.xlsx$" = "Planilha para o herbário (XLSX)",
    "cruzamento_herbario\\.xlsx$" = "Cruzamento com o herbário (XLSX)"
  )
  for (r in names(rules)) if (grepl(r, b)) return(rules[[r]])
  b
}

finalize_outputs <- function(job_dir, id) {
  out_dir <- file.path(job_dir, "outputs")

  # temporários que algumas funções deixam para trás
  tmp <- list.files(out_dir, recursive = TRUE, full.names = TRUE, all.files = TRUE,
                    pattern = "(_temp\\.Rmd|\\.knit\\.md|\\.log|\\.aux|\\.tmp)$")
  if (length(tmp)) unlink(tmp, force = TRUE)
  for (d in c("jabot_download", "reflora_download")) {
    unlink(file.path(out_dir, d), recursive = TRUE, force = TRUE)
  }

  # pastas vazias (estrutura de vouchers) precisam de um arquivo para ir no ZIP;
  # a própria pasta de saídas fica de fora (sem saída, não há ZIP).
  dirs <- list.dirs(out_dir, recursive = TRUE, full.names = TRUE)[-1]
  for (d in dirs) {
    if (!length(list.files(d, all.files = TRUE, no.. = TRUE))) {
      writeLines("Coloque aqui as fotos deste voucher.", file.path(d, "LEIA-ME.txt"))
    }
  }

  rel <- list.files(out_dir, recursive = TRUE, all.files = FALSE)
  zip_path <- ""
  if (length(rel)) {
    zip_name <- paste0("resultados_", substr(id, 1, 8), ".zip")
    zip_path <- file.path(job_dir, zip_name)
    zip::zip(zip_path, files = rel, root = out_dir)
  }

  show <- rel[!grepl("LEIA-ME\\.txt$", rel)]
  info <- file.info(file.path(out_dir, show))
  ord <- order(match(vapply(show, file_kind, ""), c("html", "pdf", "xlsx", "image", "csv", "zip", "file")),
               show)
  show <- show[ord]
  info <- info[ord, , drop = FALSE]
  shown <- utils::head(seq_along(show), 300)

  files <- lapply(shown, function(i) list(
    id = paste0("f", i),
    path = show[i],
    name = basename(show[i]),
    label = file_label(show[i]),
    kind = file_kind(show[i]),
    size = unname(info$size[i])
  ))

  list(files = files, n_files = length(rel), zip = if (nzchar(zip_path)) basename(zip_path) else "")
}
