# Detecção do formato da planilha e resumo do resultado ------------------------
#
# Carregado pelo motor local (webR) junto com engine.R. Nada aqui altera os
# dados: só lê o cabeçalho para sugerir o formato e as colunas (local_detect) e,
# depois de uma execução, conta o que a planilha harmonizada tem (local_summary).
# São sugestões para a pessoa conferir, não verificações.
#
# A linha do cabeçalho, os metadados acima dela e o significado de cada coluna
# vêm do próprio forplotR (detect_header_row(), read_plot_metadata(),
# read_plot_sheet()): o formulário mostra exatamente o que o pacote vai ler.
# Não há leitura de cabeçalho em JavaScript. Com um forplotR anterior a essas
# funções, vale a leitura antiga (.local_detect_legacy).

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
  colname_stemgroup  = "New Stem Grouping",
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
  colname_stemgroup = c("new stem grouping", "stem grouping", "stem group", "grupo de fustes"),
  colname_subplot   = c("t1", "sub plot t1", "standardised subplot t1", "standardized subplot t1", "subplot", "subparcela", "subunidades", "subunidade", "parcela"),
  colname_x         = c("x", "standardised x", "standardized x", "coord x", "coordx", "x m", "x local", "coordenada x"),
  colname_y         = c("y", "standardised y", "standardized y", "coord y", "coordy", "y m", "y local", "coordenada y"),
  colname_family    = c("family", "recommended voucher family", "recommended family", "familia"),
  colname_species   = c("original determination", "species", "especie", "taxon", "scientific name", "nome cientifico", "determinacao"),
  colname_dbh       = c("d", "d1", "dbh", "dap", "dap mm", "diameter", "diametro"),
  colname_voucher   = c("voucher", "voucher code", "voucher numero", "numero coleta", "coleta"),
  colname_collected = c("collected", "voucher collected", "coletado", "individuo coletado")
)

# Campos opcionais: a falta deles não é um problema a avisar
.fp_optional <- c("colname_stemgroup")

# GigaFlor (rede de florestas gigantes da Amazônia): mesma ficha do ForestPlots,
# com "Tag Number", "Species" e "Main Stem Tag", D em cm e X/Y em graus
# decimais. Os cabeçalhos podem ser bilíngues ("Main Stem Tag | Placa do fuste
# principal"); os nomes chegam aqui já separados em "|" e normalizados.
.fp_is_gigaflor <- function(hn) {
  "tag number" %in% hn && any(c("main stem tag", "species") %in% hn) &&
    "t1" %in% hn && !("new tag no" %in% hn)
}

# Os dados do GigaFlor ficam na aba "Data" (o pacote lê essa aba sozinho:
# .gigaflor_sheet()). Devolve o número dessa aba se ela tiver o cabeçalho do
# GigaFlor, ou NA.
.fp_gigaflor_data_sheet <- function(path, sheets, fp) {
  i <- which(tolower(trimws(sheets)) == "data")
  if (!length(i)) return(NA_integer_)
  raw <- tryCatch(fp$.read_raw_rows(path, sheet = i[1], n_max = 20L), error = function(e) NULL)
  if (is.null(raw) || !nrow(raw)) return(NA_integer_)
  hit <- vapply(seq_len(nrow(raw)), function(r) {
    v <- as.character(unlist(raw[r, , drop = TRUE]))
    .fp_is_gigaflor(.fp_norm(unlist(strsplit(v[!is.na(v)], "|", fixed = TRUE))))
  }, logical(1))
  if (any(hit)) i[1] else NA_integer_
}

.fp_has_header_api <- function() {
  ns <- asNamespace("forplotR")
  all(vapply(c("detect_header_row", "read_plot_sheet", ".score_header_rows",
               ".canonical_header", ".parse_plot_metadata", ".read_raw_rows"),
             exists, logical(1), envir = ns, inherits = FALSE))
}

# header_row: NULL, "" ou "auto" = automático; número = linha escolhida na tela
# sheet: aba da planilha (número ou nome); o padrão é a primeira.
local_detect <- function(path, header_row = NULL, sheet = 1) {
  hr <- suppressWarnings(as.integer(header_row))
  if (!length(hr) || is.na(hr) || hr < 1L) hr <- NULL
  sh <- suppressWarnings(as.integer(sheet))
  if (!length(sh) || is.na(sh) || sh < 1L) sh <- 1L
  if (!.fp_has_header_api()) return(.local_detect_legacy(path))

  out <- tryCatch({
    fp <- asNamespace("forplotR")
    sheets <- readxl::excel_sheets(path)
    if (sh > length(sheets)) stop("a planilha tem ", length(sheets), " aba(s); a aba ", sh, " não existe")
    # GigaFlor com a aba "Data" depois de outras (ex.: instruções): lê a "Data"
    if (sh == 1L) {
      gf_sh <- .fp_gigaflor_data_sheet(path, sheets, fp)
      if (!is.na(gf_sh)) sh <- gf_sh
    }
    raw <- fp$.read_raw_rows(path, sheet = sh, n_max = 20L)
    if (!nrow(raw)) stop("planilha vazia")

    sc <- fp$.score_header_rows(raw)
    auto <- sc$row
    # linhas com algum texto: as que podem ser escolhidas como cabeçalho
    filled <- which(vapply(seq_len(nrow(raw)), function(i) {
      r <- as.character(unlist(raw[i, , drop = TRUE]))
      any(!is.na(r) & nzchar(trimws(r)))
    }, logical(1)))
    if (!is.null(hr) && !(hr %in% filled)) hr <- NULL

    # formatos de uma linha só de cabeçalho (MONITORA, Query Library)
    row_names <- function(i) {
      r <- as.character(unlist(raw[i, , drop = TRUE]))
      .fp_norm(unlist(strsplit(r[!is.na(r)], "|", fixed = TRUE)))
    }
    mo_t <- c("cduc", "nomeuc", "n estacao", "nome estacao", "n ua", "subunidades", "n parcela", "n arvore",
              "cap tot", "cap 1", "arvore morta", "familia", "genero", "especie", "individuo coletado")
    ql_t <- c("plot code", "plotcode", "plot name", "sub plot t1", "standardised subplot t1", "standardized subplot t1",
              "standardised x", "standardized x", "census no", "recommended voucher family", "voucher code", "tag no")

    hdr <- hr %||% (if (!is.na(auto)) auto else NA_integer_)
    # GigaFlor: o cabeçalho é a linha com Tag Number / Species / Main Stem Tag
    gf_rows <- filled[vapply(filled, function(i) .fp_is_gigaflor(row_names(i)), logical(1))]
    if (is.null(hr) && length(gf_rows) && !(hdr %in% gf_rows)) hdr <- gf_rows[1]
    if (is.na(hdr)) {
      # nenhum nome conhecido: a primeira linha com mais texto que números
      txt <- vapply(filled, function(i) {
        r <- as.character(unlist(raw[i, , drop = TRUE]))
        r <- r[!is.na(r) & nzchar(trimws(r))]
        mean(is.na(suppressWarnings(as.numeric(r))))
      }, numeric(1))
      hdr <- filled[which(txt >= 0.6)[1]]
      if (is.na(hdr)) hdr <- filled[1]
    }
    hn <- row_names(hdr)
    mo_score <- sum(mo_t %in% hn)
    ql_score <- sum(ql_t %in% hn)

    # Metadados acima do cabeçalho, pelos rótulos que o pacote conhece
    # (inglês, português e Panará: .metadata_label_dict() do forplotR)
    meta <- fp$.parse_plot_metadata(raw[seq_len(hdr - 1L), , drop = FALSE])
    has_meta <- !is.na(meta$plot_code) || !is.na(meta$plot_name) || length(meta$team) > 0

    # Colunas: os nomes e o significado de cada uma vêm do pacote, da mesma
    # linha de cabeçalho usada na leitura dos dados (read_plot_header();
    # dicionário de nomes .header_alias_dict(), com os rótulos em Panará).
    # `name` é o nome que a coluna tem na leitura: é ele que vai no seletor e
    # é ele que volta para o R em colname_*.
    cols <- if (exists("read_plot_header", envir = fp, inherits = FALSE)) {
      forplotR::read_plot_header(path, sheet = sh, header_row = hdr)
    } else {
      cc <- fp$.canonical_header(as.character(unlist(raw[hdr, , drop = TRUE])))
      cc <- cc[nzchar(cc$header), , drop = FALSE]
      cc$name <- cc$header
      cc
    }
    n_known <- sum(!is.na(cols$canonical))
    bilingual <- any(grepl("|", c(cols$header, as.character(unlist(raw[seq_len(hdr - 1L), , drop = TRUE]))),
                           fixed = TRUE), na.rm = TRUE)

    type <- "unknown"; confidence <- "low"
    if (mo_score >= 4) {
      type <- "monitora"; confidence <- if (mo_score >= 7) "high" else "medium"
    } else if (.fp_is_gigaflor(hn)) {
      type <- "gigaflor"
      confidence <- if (all(c("main stem tag", "species", "x", "y") %in% hn)) "high" else "medium"
    } else if (ql_score >= 3) {
      type <- "fp_query_sheet"; confidence <- if (ql_score >= 5) "high" else "medium"
    } else if (n_known >= 4) {
      type <- if (bilingual) "field_sheet_ti" else "field_sheet"
      confidence <- if (has_meta && n_known >= 6) "high" else "medium"
    } else if (has_meta && nrow(raw) >= 2) {
      type <- "field_sheet_ti"; confidence <- "low"
    }

    # opções dos seletores, na ordem da planilha: valor = nome na leitura;
    # rótulo = o cabeçalho, com a posição quando o nome é vazio ou repetido
    dup_header <- duplicated(cols$header) | duplicated(cols$header, fromLast = TRUE)
    label <- ifelse(!nzchar(cols$header), paste0("(coluna ", cols$position, ", sem nome)"),
                    ifelse(dup_header, paste0(cols$header, " (coluna ", cols$position, ")"), cols$header))
    label_en <- ifelse(!nzchar(cols$header), paste0("(column ", cols$position, ", no name)"),
                       ifelse(dup_header, paste0(cols$header, " (column ", cols$position, ")"), cols$header))
    columns <- lapply(seq_len(nrow(cols)), function(i) {
      list(value = cols$name[i], label = label[i], label_en = label_en[i], position = cols$position[i])
    })

    mapped <- list(); missing <- list(); suggest <- list()
    if (type %in% c("field_sheet", "field_sheet_ti", "unknown")) {
      nh <- .fp_norm(cols$header)
      for (k in names(.fp_fields)) {
        std <- .fp_fields[[k]]
        hit <- which(!is.na(cols$canonical) & cols$canonical == std)
        # nome alternativo que o pacote não conhece, mas o site sim
        if (!length(hit)) hit <- which(nh %in% .fp_alias[[k]])
        if (!length(hit)) {
          if (!(k %in% .fp_optional)) missing[[length(missing) + 1]] <- k
          next
        }
        mapped[[k]] <- cols$name[hit[1]]
        if (!identical(trimws(cols$header[hit[1]]), std)) suggest[[k]] <- cols$name[hit[1]]
      }
    }

    stations <- character()
    plot_name <- if (is.na(meta$plot_name)) "" else meta$plot_name
    plot_code <- if (is.na(meta$plot_code)) "" else meta$plot_code
    n_rows <- NA_integer_; n_subplots <- NA_integer_; subplot_max <- NA_integer_
    renamed <- list()

    if (type == "monitora") {
      full <- suppressMessages(readxl::read_excel(path, sheet = sh, col_types = "text", .name_repair = "minimal",
                                                  skip = hdr - 1L))
      nn <- .fp_norm(names(full))
      sc2 <- which(nn %in% c("nome estacao", "estacao"))
      if (!length(sc2)) sc2 <- which(nn %in% c("n estacao", "numero estacao"))
      if (length(sc2)) stations <- sort(unique(stats::na.omit(trimws(full[[sc2[[1]]]]))))
      uc <- which(nn %in% c("nomeuc", "nome uc", "uc"))
      if (length(uc)) plot_name <- as.character(stats::na.omit(full[[uc[[1]]]])[1] %||% "")
      n_rows <- nrow(full)
    } else {
      # a tabela como o pacote a lê: linhas, subparcelas e nomes repetidos
      tab <- tryCatch(suppressWarnings(forplotR::read_plot_sheet(path, sheet = sh, header_row = hdr, verbose = FALSE)),
                      error = function(e) NULL)
      if (!is.null(tab)) {
        n_rows <- nrow(tab)
        tc <- attr(tab, "columns")
        dup <- tc[!is.na(tc$duplicate_of), , drop = FALSE]
        renamed <- lapply(seq_len(nrow(dup)), function(i) {
          first <- match(dup$duplicate_of[i], tc$column)
          list(name = dup$duplicate_of[i], used = tc$header[first], used_position = tc$position[first],
               other = dup$header[i], other_position = dup$position[i])
        })
        sub_pos <- if (!is.null(mapped$colname_subplot)) cols$position[match(mapped$colname_subplot, cols$name)] else NA
        sub <- if (!is.na(sub_pos)) tab[[tc$column[match(sub_pos, tc$position)]]] else tab[["T1"]]
        if (!is.null(sub)) {
          sv <- suppressWarnings(as.numeric(as.character(sub)))
          sv <- sv[!is.na(sv)]
          if (length(sv)) {
            n_subplots <- length(unique(sv))
            subplot_max <- as.integer(max(sv))
          }
        }
      }
    }

    list(ok = TRUE, type = type, confidence = confidence,
         sheet = sh, sheet_name = sheets[sh], n_sheets = length(sheets),
         header_row = hdr, header_row_auto = if (is.na(auto)) NULL else auto,
         header_row_forced = !is.null(hr), header_rows = as.list(filled),
         has_meta = has_meta,
         meta = list(plot_code = plot_code, plot_name = plot_name,
                     date = if (is.na(meta$date)) "" else format(meta$date, "%Y-%m-%d"),
                     team = as.list(meta$team),
                     census_no = if (is.na(meta$census_no)) "" else meta$census_no),
         columns = columns, headers = as.list(cols$name),
         mapped = mapped, missing = missing, suggest = suggest,
         renamed = renamed,
         stations = as.list(utils::head(stations, 50)),
         plot_name = plot_name %||% "", plot_code = plot_code %||% "",
         n_rows = n_rows, n_subplots = n_subplots, subplot_max = subplot_max)
  }, error = function(e) list(ok = FALSE, error = conditionMessage(e)))
  jsonlite::toJSON(out, auto_unbox = TRUE, null = "null", na = "null")
}

# Leitura anterior, para versões do forplotR sem detect_header_row(). Só
# sugere o formato; não lista colunas (o app avisa que o pacote está antigo).
.local_detect_legacy <- function(path) {
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

    # Sem as funções de cabeçalho do pacote não há como saber, com segurança,
    # qual linha é o cabeçalho: nenhuma coluna é oferecida nos seletores.
    list(ok = TRUE, legacy = TRUE, type = type, confidence = "low", header_row = hdr, has_meta = has_meta,
         columns = list(), headers = list(), missing = list(), suggest = list(),
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
    if (!("header_row" %in% names(formals(forplotR:::.harmonize_plot_input)))) params$header_row <- NULL
    harmonize <- function(...) {
      if (is.null(params$header_row)) forplotR:::.harmonize_plot_input(...)
      else forplotR:::.harmonize_plot_input(..., header_row = params$header_row)
    }
    h <- suppressMessages(harmonize(path, input_type = type, station_name = st,
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
