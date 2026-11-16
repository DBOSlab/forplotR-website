# Leitura do formulário enviado ao servidor (multipart) --------------------------
# A montagem dos argumentos, comum aos dois motores, está em core_params.R.

# Lê o corpo multipart/form-data diretamente (independe do parser do Plumber).
# Devolve uma lista nomeada: list(campo = list(file = TRUE/FALSE, value, filename)).
read_multipart <- function(req) {
  ct <- req$HTTP_CONTENT_TYPE %||% req$CONTENT_TYPE %||% ""
  if (!grepl("multipart/form-data", ct, fixed = TRUE)) {
    user_error("Envie os dados como multipart/form-data.")
  }
  boundary <- sub('^.*boundary="?([^";]+)"?.*$', "\\1", ct)

  body <- req$bodyRaw
  if (is.null(body) || !length(body)) {
    inp <- req$rook.input
    if (!is.null(inp)) {
      try(inp$rewind(), silent = TRUE)
      body <- inp$read()
    }
  }
  if (is.null(body) || !length(body)) user_error("Requisição vazia.")

  parts <- webutils::parse_multipart(body, boundary)
  nms <- names(parts) %||% rep("", length(parts))

  out <- list()
  for (i in seq_along(parts)) {
    p <- parts[[i]]
    nm <- p$name %||% nms[i]
    if (is.null(nm) || !nzchar(nm)) next
    fn <- p$filename
    if (!is.null(fn) && nzchar(fn)) {
      if (!length(p$value)) next
      out[[nm]] <- list(file = TRUE, filename = fn, value = p$value)
    } else {
      txt <- if (is.raw(p$value)) rawToChar(p$value) else as.character(p$value)
      Encoding(txt) <- "UTF-8"
      out[[nm]] <- list(file = FALSE, value = txt)
    }
  }
  out
}
