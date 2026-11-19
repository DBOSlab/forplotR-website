# Núcleo comum: campos do formulário -> argumentos da função -----------------
# Usado pelo servidor (Plumber) e pelo motor local (webR, no navegador).
# `parts` é uma lista nomeada: list(campo = list(file = TRUE, filename, value = <raw>)
# ou list(file = FALSE, value = "<texto>")).

part_text <- function(parts, nm) {
  p <- parts[[nm]]
  if (is.null(p) || isTRUE(p$file)) "" else trimws(p$value)
}

is_true_txt <- function(v) tolower(v) %in% c("true", "1", "on", "sim", "yes")

parse_number <- function(v, label) {
  x <- suppressWarnings(as.numeric(sub(",", ".", v, fixed = TRUE)))
  if (is.na(x) || !is.finite(x)) user_error("Número inválido em \"", label, "\": ", v)
  x
}

save_upload <- function(p, inputs, f) {
  ext <- tolower(tools::file_ext(p$filename))
  allowed <- as.character(f$accept_ext)
  if (!ext %in% allowed) {
    user_error("Formato não aceito em \"", f$label, "\": .", ext,
               " (aceitos: ", paste0(".", allowed, collapse = ", "), ")")
  }
  if (ext %in% c("xlsx", "zip") &&
      !identical(p$value[1:2], charToRaw("PK"))) {
    user_error("O arquivo enviado em \"", f$label, "\" não é um .", ext, " válido.")
  }
  dest <- file.path(inputs, paste0(f$name, ".", ext))
  writeBin(p$value, dest)
  normalizePath(dest, winslash = "/", mustWork = TRUE)
}

# Extrai um ZIP com checagens: caminhos, tamanho total, número de arquivos.
# Mantém só imagens. Se houver uma única pasta-raiz, devolve essa pasta.
safe_unzip_images <- function(zipfile, exdir, max_mb = 500, max_files = 10000,
                              collapse_pattern = ".") {
  lst <- tryCatch(zip::zip_list(zipfile), error = function(e) user_error("ZIP inválido ou corrompido."))
  fn <- lst$filename
  if (length(fn) > max_files) user_error("O ZIP tem arquivos demais (máximo ", max_files, ").")
  if (sum(lst$uncompressed_size, na.rm = TRUE) > max_mb * 1024^2) {
    user_error("O ZIP descompactado passa de ", max_mb, " MB.")
  }
  bad <- grepl("^(/|\\\\|[A-Za-z]:)", fn) | grepl("(^|[/\\\\])\\.\\.([/\\\\]|$)", fn)
  if (any(bad)) user_error("O ZIP contém caminhos inválidos.")

  dir.create(exdir, recursive = TRUE, showWarnings = FALSE)
  zip::unzip(zipfile, exdir = exdir)
  unlink(file.path(exdir, "__MACOSX"), recursive = TRUE, force = TRUE)

  all <- list.files(exdir, recursive = TRUE, full.names = TRUE, all.files = TRUE)
  junk <- all[!grepl("\\.(jpe?g|png|gif|webp|tiff?)$", all, ignore.case = TRUE)]
  if (length(junk)) unlink(junk, force = TRUE)

  top <- list.files(exdir, full.names = TRUE, no.. = TRUE)
  if (length(top) == 1L && dir.exists(top) &&
      grepl(collapse_pattern, basename(top), ignore.case = TRUE)) {
    return(normalizePath(top, winslash = "/"))
  }
  normalizePath(exdir, winslash = "/")
}

# Texto "lat; lon" (uma linha por ponto) -> CSV latitude,longitude
write_vertices <- function(v, inputs) {
  lines <- trimws(unlist(strsplit(v, "[\r\n]+")))
  lines <- lines[nzchar(lines)]
  if (!length(lines)) return(NULL)
  if (length(lines) > 50) user_error("Coordenadas demais.")

  parse_line <- function(l) {
    pieces <- if (grepl(";", l, fixed = TRUE)) {
      strsplit(l, ";", fixed = TRUE)[[1]]
    } else if (grepl("\t", l, fixed = TRUE)) {
      strsplit(l, "\t", fixed = TRUE)[[1]]
    } else {
      strsplit(l, "\\s*,\\s*|\\s+")[[1]]
    }
    pieces <- trimws(pieces)
    pieces <- pieces[nzchar(pieces)]
    if (length(pieces) != 2L) {
      user_error("Cada linha precisa ter latitude e longitude (use ; entre elas): \"", l, "\"")
    }
    nums <- suppressWarnings(as.numeric(sub(",", ".", pieces, fixed = TRUE)))
    if (anyNA(nums) || abs(nums[1]) > 90 || abs(nums[2]) > 180) {
      user_error("Coordenada inválida: \"", l, "\"")
    }
    nums
  }

  m <- do.call(rbind, lapply(lines, parse_line))
  path <- file.path(inputs, "coordenadas.csv")
  utils::write.csv(data.frame(latitude = m[, 1], longitude = m[, 2]), path, row.names = FALSE)
  normalizePath(path, winslash = "/", mustWork = TRUE)
}

# Monta a lista de argumentos para a função do forplotR.
build_params <- function(spec, parts, job_dir, cfg) {
  ctx <- list(
    inputs = normalizePath(file.path(job_dir, "inputs"), winslash = "/", mustWork = TRUE),
    outputs = normalizePath(file.path(job_dir, "outputs"), winslash = "/", mustWork = TRUE),
    cfg = cfg
  )

  use_example <- isTRUE(spec$example) && is_true_txt(part_text(parts, "usar_exemplo"))
  params <- list()

  for (f in spec$fields) {
    arg <- f$arg %||% f$name
    if (identical(f$type, "example")) next

    if (identical(f$type, "file")) {
      p <- parts[[f$name]]
      if (is.null(p) || !isTRUE(p$file)) {
        if (isTRUE(f$required) && !(use_example && identical(f$name, "fp_file"))) {
          user_error("Envie o arquivo: ", f$label)
        }
        next
      }
      if (use_example && identical(f$name, "fp_file")) next
      path <- save_upload(p, ctx$inputs, f)

      if (identical(f$name, "voucher_zip")) {
        if (identical(spec$id, "vouchers")) {
          root <- safe_unzip_images(path, file.path(ctx$inputs, "zip"), cfg$max_zip_mb,
                                    collapse_pattern = "voucher|foto|imag|img")
          dest <- file.path(ctx$outputs, "voucher_imgs")
          if (!file.rename(root, dest)) {
            dir.create(dest, showWarnings = FALSE)
            file.copy(list.files(root, full.names = TRUE), dest, recursive = TRUE)
          }
          path <- NULL
        } else {
          path <- safe_unzip_images(path, file.path(ctx$inputs, "voucher_imgs"), cfg$max_zip_mb)
        }
      }
      if (!is.null(path) && nzchar(arg)) params[[arg]] <- path
      next
    }

    v <- part_text(parts, f$name)

    if (identical(f$type, "bool")) {
      params[[arg]] <- if (nzchar(v)) is_true_txt(v) else isTRUE(f$default)
      next
    }

    if (!nzchar(v)) {
      if (isTRUE(f$required)) user_error("Preencha o campo: ", f$label)
      if (!is.null(f$default) && f$type %in% c("select", "number")) params[[arg]] <- f$default
      next
    }

    if (nchar(v) > 2000) user_error("Texto longo demais em \"", f$label, "\".")

    val <- switch(
      f$type,
      number = parse_number(v, f$label),
      select = {
        ok <- vapply(f$options, function(o) o$value, character(1))
        if (!v %in% ok) user_error("Opção inválida em \"", f$label, "\".")
        v
      },
      text = v,
      text_vec = {
        x <- trimws(strsplit(v, ",", fixed = TRUE)[[1]])
        x <- x[nzchar(x)]
        if (length(x)) x else NULL
      },
      vertices = write_vertices(v, ctx$inputs),
      user_error("Tipo de campo desconhecido: ", f$type)
    )
    if (!is.null(val)) params[[arg]] <- val
  }

  # GigaFlor, protocolo 1: subparcelas de 20 m quando a pessoa não mudou o lado
  # (o formulário manda o padrão 10 do ForestPlots)
  if (identical(params$input_type, "gigaflor") && !is.null(params$subplot_size) &&
      !nzchar(part_text(parts, "subplot_size"))) {
    params$subplot_size <- GIGAFLOR_SUBPLOT_M
  }

  if (use_example) {
    it <- params$input_type %||% ""
    ds <- if (identical(it, "monitora")) "TUM" else if (it %in% c("field_sheet", "forestplots")) "RUS01" else ""
    if (!nzchar(ds)) {
      user_error("Os dados de exemplo existem para field sheet (RUS01) e MONITORA (TUM).")
    }
    params$fp_file_path <- file.path(ctx$inputs, paste0("exemplo_", ds, ".xlsx"))
    params$.example <- ds
  }

  if (is.function(spec$check)) params <- spec$check(params, ctx)
  params <- utils::modifyList(params, spec$fixed(ctx, params))
  params
}
