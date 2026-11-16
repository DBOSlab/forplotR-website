# Exporta os formulários do modo local (navegador) em JSON ----------------------
#
# Uso: Rscript scripts/export_local_tools.R <saida.json>
# O site lê esse arquivo para desenhar os formulários na hora, enquanto o webR
# carrega em segundo plano. Mesma fonte do servidor: backend/R/tools_spec.R.

args <- commandArgs(trailingOnly = TRUE)
if (length(args) < 1) stop("Uso: Rscript export_local_tools.R <saida.json>")

for (f in c("config.R", "tools_spec.R")) {
  sys.source(file.path("backend", "R", f), envir = globalenv(), keep.source = FALSE)
}
dir.create(dirname(args[1]), recursive = TRUE, showWarnings = FALSE)
jsonlite::write_json(tools_public("local"), args[1], auto_unbox = TRUE, null = "null",
                     pretty = FALSE)
message("Formulários do modo local: ", args[1])
