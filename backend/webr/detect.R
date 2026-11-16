# Detecção do formato da planilha e resumo do resultado ------------------------
#
# Carregado pelo motor local (webR) junto com engine.R. Nada aqui altera os
# dados: só lê o cabeçalho para sugerir o formato e as colunas (local_detect) e,
# depois de uma execução, conta o que a planilha harmonizada tem (local_summary).
# São sugestões para a pessoa conferir, não verificações.

.fp_norm <- function(x) {
  x <- as.character(x)
  x[is.na(x)] <- ""
  x <- iconv(x, from = "UTF-8", to = "ASCII//TRANSLIT", sub = "")
  x[is.na(x)] <- ""
  trimws(gsub("[^a-z0-9]+", " ", tolower(x)))
}

# Campos que o forplotR usa e os nomes padrão (como em .forplot_colname_registry)
.fp_fields <- list(
  colname_tagno      = "New Tag No",
  colname_subplot    = "T1",
  colname_x          = "X",
  colname_y          = "Y",
  colname_family     = "Family",
  colname_species    = "Original determination",
  colname_dbh        = "D",
  colname_voucher    = "Voucher",
  colname_collected  = "Collected"
)

# Nomes alternativos comuns, para sugerir a coluna quando o padrão não existe
.fp_alias <- list(
  colname_tagno     = c("new tag no", "tag no", "tag", "tag number", "placa", "plaqueta", "n arvore", "numero", "tree id"),
  colname_subplot   = c("t1", "sub plot t1", "standardised subplot t1", "standardized subplot t1", "subplot", "subparcela", "subunidades", "subunidade", "parcela"),
  colname_x         = c("x", "standardised x", "standardized x", "coord x", "coordx", "x m", "x local", "coordenada x"),
  colname_y         = c("y", "standardised y", "standardized y", "coord y", "coordy", "y m", "y local", "coordenada y"),
  colname_family    = c("family", "recommended voucher family", "recommended family", "familia"),
  colname_species   = c("original determination", "species", "especie", "taxon", "scientific name", "nome cientifico", "determinacao"),
  colname_dbh       = c("d", "d1", "dbh", "dap", "dap mm", "diameter", "diametro"),
  colname_voucher   = c("voucher", "voucher code", "voucher numero", "numero coleta", "coleta"),
  colname_collected = c("collected", "voucher collected", "coletado", "individuo coletado")
)

local_detect <- function(path) {
  out <- tryCatch({
    raw <- suppressMessages(readxl::read_excel(path, sheet = 1, col_names = FALSE, n_max = 8,
                                               col_types = "text", .name_repair = "minimal"))
    raw <- as.data.frame(raw, stringsAsFactors = FALSE)
    if (!nrow(raw)) stop("planilha vazia")
    rows <- lapply(seq_len(nrow(raw)), function(i) as.character(unlist(raw[i, , drop = TRUE])))
    nrows <- lapply(rows, .fp_norm)

    meta_row <- rows[[1]]
    has_meta <- any(grepl("^\\s*(plotcode|plot code|plot name|team|pi)\\s*:", tolower(meta_row[!is.na(meta_row)])))
    grab <- function(key) {
      v <- meta_row[!is.na(meta_row) & grepl(paste0("^\\s*", key, "\\s*:"), meta_row, ignore.case = TRUE)]
      if (length(v)) trimws(sub("^[^:]*:", "", v[[1]])) else ""
    }

    fs_t <- c("new tag no", "new stem grouping", "t1", "t2", "x", "y", "family", "original determination", "d")
    ql_t <- c("plot code", "plotcode", "plot name", "sub plot t1", "standardised subplot t1", "standardized subplot t1",
              "standardised x", "standardized x", "census no", "recommended voucher family", "voucher code", "tag no")
    mo_t <- c("cduc", "nomeuc", "n estacao", "nome estacao", "n ua", "subunidades", "n parcela", "n arvore",
              "cap tot", "cap 1", "arvore morta", "familia", "genero", "especie", "individuo coletado")
    upto <- min(6, length(nrows))
    fs_score <- vapply(nrows[seq_len(upto)], function(r) sum(fs_t %in% r), numeric(1))
    ql_score <- sum(ql_t %in% nrows[[1]])
    mo_score <- sum(mo_t %in% nrows[[1]])

    type <- "unknown"; confidence <- "low"; hdr <- 1L
    if (mo_score >= 4) {
      type <- "monitora"; confidence <- if (mo_score >= 7) "high" else "medium"
    } else if (ql_score >= 3) {
      type <- "fp_query_sheet"; confidence <- if (ql_score >= 5) "high" else "medium"
    } else if (max(fs_score) >= 4) {
      hdr <- which.max(fs_score)
      type <- "field_sheet"; confidence <- if (has_meta && max(fs_score) >= 6) "high" else "medium"
    } else if (has_meta && length(rows) >= 2) {
      hdr <- 2L; type <- "field_sheet_ti"; confidence <- "low"
    } else {
      # formato desconhecido: o cabeçalho é a primeira linha com mais texto que números
      txt <- vapply(rows[seq_len(upto)], function(r) {
        r <- r[!is.na(r) & nzchar(trimws(r))]
        if (!length(r)) return(0)
        mean(is.na(suppressWarnings(as.numeric(r))))
      }, numeric(1))
      hdr <- which(txt >= 0.6)[1]
      if (is.na(hdr)) hdr <- 1L
    }

    headers <- rows[[hdr]]
    headers <- headers[!is.na(headers) & nzchar(trimws(headers))]
    nh <- .fp_norm(headers)

    # colunas do padrão que não estão na planilha, com sugestão pelo nome
    missing <- list(); suggest <- list()
    if (type %in% c("field_sheet", "unknown")) {
      for (k in names(.fp_fields)) {
        if (.fp_norm(.fp_fields[[k]]) %in% nh) next
        missing[[length(missing) + 1]] <- k
        hit <- which(nh %in% .fp_alias[[k]])
        if (length(hit)) suggest[[k]] <- headers[[hit[[1]]]]
      }
    }

    # estações (MONITORA): valores da coluna Nome_estacao ou N_estacao
    stations <- character()
    plot_name <- grab("plot name"); plot_code <- grab("plotcode")
    if (!nzchar(plot_code)) plot_code <- grab("plot code")
    n_rows <- NA_integer_
    if (type == "monitora") {
      full <- suppressMessages(readxl::read_excel(path, sheet = 1, col_types = "text", .name_repair = "minimal"))
      nn <- .fp_norm(names(full))
      sc <- which(nn %in% c("nome estacao", "estacao"))
      if (!length(sc)) sc <- which(nn %in% c("n estacao", "numero estacao"))
      if (length(sc)) stations <- sort(unique(stats::na.omit(trimws(full[[sc[[1]]]]))))
      uc <- which(nn %in% c("nomeuc", "nome uc", "uc"))
      if (length(uc)) plot_name <- as.character(stats::na.omit(full[[uc[[1]]]])[1] %||% "")
      n_rows <- nrow(full)
    } else {
      full <- suppressMessages(readxl::read_excel(path, sheet = 1, col_names = FALSE, col_types = "text",
                                                  .name_repair = "minimal", range = readxl::cell_cols(1)))
      n_rows <- max(0L, nrow(full) - hdr)
    }

    list(ok = TRUE, type = type, confidence = confidence, header_row = hdr, has_meta = has_meta,
         headers = as.list(headers), missing = missing, suggest = suggest,
         stations = as.list(utils::head(stations, 50)),
         plot_name = plot_name %||% "", plot_code = plot_code %||% "", n_rows = n_rows)
  }, error = function(e) list(ok = FALSE, error = conditionMessage(e)))
  jsonlite::toJSON(out, auto_unbox = TRUE, null = "null", na = "null")
}

# Resumo do que a planilha harmonizada contém, com a mesma regra do balanço:
# só árvores com subparcela; palmeiras (Arecaceae) à parte; "com voucher" =
# coluna Collected preenchida. Devolve NULL se não for possível ler.
local_summary <- function(params) {
  tryCatch({
    path <- params$fp_file_path %||% params$fp_file
    if (is.null(path) || !file.exists(path)) return(NULL)
    type <- params$input_type %||% "field_sheet"
    if (identical(type, "forestplots")) type <- "field_sheet"
    cm <- params[grepl("^colname_", names(params))]
    cm <- cm[!vapply(cm, function(v) is.null(v) || !nzchar(paste(v, collapse = "")), logical(1))]
    col_map <- if (length(cm)) do.call(forplotR:::.build_col_map, cm) else NULL
    st <- params$station_name
    if (length(st) > 1) st <- st[[1]]
    h <- suppressMessages(forplotR:::.harmonize_plot_input(path, input_type = type, station_name = st,
                                                           verbose = FALSE, require_spatial = FALSE,
                                                           col_map = col_map, has_user_meta = TRUE))
    s <- h$fp_sheet
    tag <- trimws(as.character(s[["New Tag No"]]))
    s <- s[!is.na(tag) & nzchar(tag) & !is.na(suppressWarnings(as.numeric(s$T1))), , drop = FALSE]
    fam <- trimws(as.character(s$Family))
    col <- !is.na(s$Collected) & trimws(as.character(s$Collected)) != ""
    palm <- !is.na(fam) & fam == "Arecaceae"
    n_sub <- length(unique(s$T1))
    sub_missing <- if (nrow(s)) length(unique(s$T1[!col & !palm])) else 0L
    list(plot_name = h$plot_name %||% "", plot_code = h$plot_code %||% "",
         trees = nrow(s), families = length(unique(fam[!is.na(fam) & nzchar(fam)])),
         subplots = n_sub, with_voucher = sum(col & !palm), without_voucher = sum(!col & !palm),
         palms = sum(palm), subplots_missing = sub_missing,
         pct_voucher = if (sum(!palm)) round(100 * sum(col & !palm) / sum(!palm)) else NA)
  }, error = function(e) NULL)
}
