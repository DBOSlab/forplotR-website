#!/usr/bin/env Rscript
# Exemplos do site gerados pelo próprio forplotR --------------------------------
#
# Tudo o que o site mostra como saída (mapa, relatório, figuras, planilhas,
# árvore de pastas, panoramas e números) sai daqui, rodando o pacote sobre os
# conjuntos de exemplo RUS01 (ForestPlots.net, 1 ha, REBIO Augusto Ruschi, ES) e
# TUM (MONITORA, PARNA Montanhas do Tumucumaque, AP). Nada de captura de tela
# nem dado inventado. Rode de novo a cada versão do pacote:
#
#   R CMD INSTALL ../forplotR-webr        # a versão que o site documenta
#   Rscript scripts/build_assets.R
#
# Saídas (versionadas no repositório):
#   exemplos/mapa/        mapa HTML do RUS01 (pt, en)
#   exemplos/balanco/     relatório HTML (pt, en), mapas PNG, planilha XLSX
#   exemplos/fotos/       árvore de pastas do forplot_vouchers()
#   exemplos/etiquetas/   planilhas JABOT do RUS01 e do TUM e um trecho em CSV
#   exemplos/panorama/    dados dos panoramas 3D (JSON) e versões estáticas (SVG)
#   _variables.yml        números usados nos textos ({{< var rus01.arvores >}})
#
# Roda sem internet: options(forplotR.offline = TRUE); a altitude é informada e
# a validação de localidade (GADM) fica desligada, como no modo navegador.

suppressPackageStartupMessages({
  library(forplotR)
  library(jsonlite)
})
options(forplotR.offline = TRUE, warn = 1)

out <- "exemplos"
work <- file.path(tempdir(), "fp_assets"); unlink(work, recursive = TRUE); dir.create(work)
for (d in c("mapa", "balanco", "fotos", "etiquetas", "panorama")) dir.create(file.path(out, d), recursive = TRUE, showWarnings = FALSE)
say <- function(...) message(format(Sys.time(), "%H:%M:%S "), ...)
pkg_version <- as.character(packageVersion("forplotR"))
say("forplotR ", pkg_version)

fp <- file.path(work, "RUS01.xlsx"); openxlsx::write.xlsx(RUS01, fp)
fm <- file.path(work, "TUM.xlsx"); openxlsx::write.xlsx(TUM, fm)

# Os vértices do RUS01 abaixo são aproximados, só para ilustração (como na
# vinheta do pacote); o site diz isso junto do mapa.
corners <- data.frame(
  Latitude = c(-19.9000, -19.9009, -19.9000, -19.9009),
  Longitude = c(-40.5500, -40.5500, -40.5490, -40.5490)
)

# ---------------------------------------------------------- 1. pastas de vouchers
say("forplot_vouchers()")
img_dir <- file.path(work, "voucher_imgs")
forplot_vouchers(fp, output_dir = img_dir, verbose = FALSE)
fams <- sort(list.dirs(img_dir, recursive = FALSE, full.names = FALSE))
leaf <- list.dirs(img_dir, recursive = TRUE, full.names = FALSE)
depth <- lengths(strsplit(leaf[nzchar(leaf)], "/"))
tree <- lapply(fams[seq_len(min(3, length(fams)))], function(f) {
  gen <- sort(list.dirs(file.path(img_dir, f), recursive = FALSE, full.names = FALSE))
  list(family = f, genera = lapply(gen[seq_len(min(2, length(gen)))], function(g) {
    v <- sort(list.dirs(file.path(img_dir, f, g), recursive = FALSE, full.names = FALSE))
    list(name = g, vouchers = head(v, 3), more = max(0, length(v) - 3))
  }), more = max(0, length(gen) - 2))
})
write_json(list(families = length(fams), voucher_folders = sum(depth == max(depth)), sample = tree),
           file.path(out, "fotos", "rus01_pastas.json"), auto_unbox = TRUE, pretty = TRUE)

# ---------------------------------------------------------------- 2. mapa
for (lg in c("pt", "en")) {
  say("forplot_map() ", lg)
  p <- forplot_map(fp, vertex_coords = corners, voucher_imgs = img_dir, dir = file.path(work, "map", lg),
                   filename = paste0("RUS01_mapa_", lg), language = lg, verbose = FALSE)
  file.copy(p, file.path(out, "mapa", paste0("RUS01_mapa_", lg, ".html")), overwrite = TRUE)
}

# ------------------------------------------------------------- 3. balanço
bal <- list()
for (lg in c("pt", "en")) {
  say("forplot_balance() ", lg)
  bal[[lg]] <- forplot_balance(fp, plot_size = 1, subplot_size = 10, render_html = TRUE, render_pdf = FALSE,
                               write_xlsx = TRUE, dir = file.path(work, "bal", lg),
                               filename = paste0("RUS01_balanco_", lg), language = lg, verbose = FALSE)
  file.copy(bal[[lg]]$html_report, file.path(out, "balanco", paste0("RUS01_relatorio_", lg, ".html")), overwrite = TRUE)
  file.copy(bal[[lg]]$xlsx_report, file.path(out, "balanco", paste0("RUS01_balanco_", lg, ".xlsx")), overwrite = TRUE)
}

# Mesmos dados e mesmas figuras do forplot_balance(), em resolução de tela.
geo <- forplotR:::.resolve_plot_geometry(1, 10)
loaded <- forplotR:::.harmonize_plot_input(fp, input_type = "field_sheet", verbose = FALSE)
b <- forplotR:::.prepare_balance_data(loaded, input_type = "field_sheet", language = "pt", plot_size = 1, subplot_size = 10,
                                      plot_width_m = geo$plot_width_m, plot_length_m = geo$plot_length_m,
                                      plot_geometry = geo, interactive = FALSE, verbose = FALSE)
for (nm in c("collected", "uncollected", "palms")) {
  if (!is.null(b$plots[[nm]])) ggplot2::ggsave(file.path(out, "balanco", paste0("RUS01_", nm, ".png")), b$plots[[nm]],
                                               width = 7, height = 7, units = "in", dpi = 110, bg = "white")
}
fc <- as.data.frame(b$fp_coords)
is_col <- !is.na(fc$Collected) & fc$Collected != ""
is_palm <- !is.na(fc$Family) & fc$Family == "Arecaceae"

# ------------------------------------------------------------ 4. etiquetas
say("forplot_sheets()")
jabot_cols <- c("family", "genus", "sp1", "number", "collector", "addcoll", "colldd", "collmm", "collyy",
                "country", "majorarea", "minorarea", "uc", "projeto", "locnotes", "latitude", "longitude",
                "altprof", "notes")
template <- as.data.frame(matrix(character(0), ncol = length(jabot_cols), dimnames = list(NULL, jabot_cols)))
herb <- file.path(work, "jabot_template.xlsx"); openxlsx::write.xlsx(template, herb)
lab <- forplot_sheets(fp_file_path = fp, herb_file_path = herb, input_type = "forestplots", language = "pt",
                      majorarea = "ES", minorarea = "Santa Teresa", protectedarea = "REBIO Augusto Ruschi",
                      collector = "G. C. Ottino", lat = -19.9, long = -40.55, alt = 800, validate_locality = FALSE,
                      dir = file.path(work, "herb"), filename = "RUS01_etiquetas_jabot")
openxlsx::write.xlsx(lab, file.path(out, "etiquetas", "RUS01_etiquetas_jabot.xlsx"))
show <- intersect(c("family", "genus", "sp1", "number", "collector", "colldd", "collmm", "collyy", "notes"), names(lab))
utils::write.csv(utils::head(lab[, show], 4), file.path(out, "etiquetas", "RUS01_etiquetas_trecho.csv"), row.names = FALSE, fileEncoding = "UTF-8")
tum <- forplot_sheets(fp_file_path = fm, herb_file_path = herb, input_type = "monitora", station_name = "EA-1", language = "pt",
                      majorarea = "AP", minorarea = "Laranjal do Jari", lat = 1.5, long = -52.5, alt = 300,
                      validate_locality = FALSE, dir = file.path(work, "herb"), filename = "TUM_etiquetas_jabot")
openxlsx::write.xlsx(tum, file.path(out, "etiquetas", "TUM_EA1_etiquetas_jabot.xlsx"))

# ------------------------------------------------------------- 5. panoramas
say("panoramas")
d_cm <- round(as.numeric(fc$D) / 10, 1)          # D do ForestPlots.net em mm
trees <- data.frame(x = round(fc$draw_x, 2), y = round(fc$draw_y, 2), d = d_cm,
                    c = as.integer(is_col), p = as.integer(is_palm), t = as.integer(fc$T1))
trees <- trees[is.finite(trees$x) & is.finite(trees$y) & is.finite(trees$d), ]
# balanço por subparcela com a mesma regra do forplot_balance(): coletadas e não
# coletadas sem contar as palmeiras, que o relatório trata à parte
sub <- do.call(rbind, lapply(seq_len(geo$n_subplots), function(k) {
  r <- fc$T1 == k
  data.frame(t = k, col = floor((k - 1) / geo$n_rows), row = (k - 1) %% geo$n_rows,
             collected = sum(r & is_col & !is_palm, na.rm = TRUE),
             missing = sum(r & !is_col & !is_palm, na.rm = TRUE),
             palms = sum(r & is_palm, na.rm = TRUE))
}))
# posição da subparcela no desenho (mesma serpentina de .compute_global_coordinates)
sub$x0 <- sub$col * 10
sub$y0 <- ifelse(sub$col %% 2 == 0, sub$row * 10, (geo$n_rows - sub$row - 1) * 10)
pano <- list(
  source = sprintf("forplotR %s, RUS01 (ForestPlots.net), forplot_balance()", pkg_version),
  plot = list(width = geo$plot_width_m, length = geo$plot_length_m, subplot = 10, n_subplots = geo$n_subplots),
  trees = unname(as.list(as.data.frame(t(trees)))),
  fields = names(trees),
  subplots = unname(lapply(split(sub[, c("x0", "y0", "collected", "missing", "palms")], seq_len(nrow(sub))), function(r) unname(unlist(r))))
)
write_json(pano, file.path(out, "panorama", "rus01.json"), auto_unbox = TRUE, digits = NA)

# SVG estáticos (sem JavaScript, movimento reduzido, impressão, sem WebGL):
# o mesmo conteúdo em projeção isométrica, com classes estilizadas pelo site.css.
iso <- function(x, y, z = 0, s = 3.1, ox = 330, oy = 120) {
  cbind(ox + (x - y) * s * cos(pi / 6), oy + (x + y) * s * sin(pi / 6) - z * s)
}
f1 <- function(v) formatC(v, format = "f", digits = 1)
svg_open <- function(title, desc, w = 660, h = 470) sprintf(
  '<svg class="pano-svg" viewBox="0 0 %d %d" role="img" aria-labelledby="%s-t %s-d" xmlns="http://www.w3.org/2000/svg"><title id="%s-t">%s</title><desc id="%s-d">%s</desc>',
  w, h, title$id, title$id, title$id, title$text, title$id, desc)
grid_lines <- function() {
  l <- character()
  for (k in seq(0, 100, 10)) {
    a <- iso(k, 0); bb <- iso(k, 100); l <- c(l, sprintf('<line x1="%s" y1="%s" x2="%s" y2="%s"/>', f1(a[1]), f1(a[2]), f1(bb[1]), f1(bb[2])))
    a <- iso(0, k); bb <- iso(100, k); l <- c(l, sprintf('<line x1="%s" y1="%s" x2="%s" y2="%s"/>', f1(a[1]), f1(a[2]), f1(bb[1]), f1(bb[2])))
  }
  paste0('<g class="pano-grid">', paste(l, collapse = ""), '</g>')
}
ord <- order(trees$x + trees$y, decreasing = TRUE)   # do fundo para a frente
stems <- vapply(ord, function(i) {
  tr <- trees[i, ]
  h <- 2 + 18 * sqrt(tr$d / max(trees$d))
  a <- iso(tr$x, tr$y); bb <- iso(tr$x, tr$y, h)
  cls <- if (tr$p == 1) "palm" else if (tr$c == 1) "col" else "unc"
  sprintf('<line class="%s" x1="%s" y1="%s" x2="%s" y2="%s"/>', cls, f1(a[1]), f1(a[2]), f1(bb[1]), f1(bb[2]))
}, character(1))
writeLines(c(
  svg_open(list(id = "pano1", text = "RUS01: a parcela em perspectiva / the plot in perspective"),
           sprintf("Parcela RUS01 (1 ha, 100 subparcelas de 10 x 10 m): %d árvores marcadas; altura da haste proporcional ao diâmetro; %d com voucher coletado, %d sem voucher, %d palmeiras.",
                   nrow(trees), sum(trees$c == 1 & trees$p == 0), sum(trees$c == 0 & trees$p == 0), sum(trees$p == 1))),
  grid_lines(), paste0('<g class="pano-stems">', paste(stems, collapse = ""), "</g></svg>")
), file.path(out, "panorama", "rus01_parcela.svg"), useBytes = TRUE)

maxn <- max(sub$collected + sub$missing)
sord <- order(sub$x0 + sub$y0, decreasing = TRUE)
bars <- vapply(sord, function(i) {
  s <- sub[i, ]; cx <- s$x0 + 5; cy <- s$y0 + 5
  hc <- 40 * s$collected / maxn; hm <- 40 * s$missing / maxn
  a <- iso(cx, cy); b1 <- iso(cx, cy, hc); b2 <- iso(cx, cy, hc + hm)
  sprintf('<line class="col" x1="%s" y1="%s" x2="%s" y2="%s"/><line class="unc" x1="%s" y1="%s" x2="%s" y2="%s"/>',
          f1(a[1]), f1(a[2]), f1(b1[1]), f1(b1[2]), f1(b1[1]), f1(b1[2]), f1(b2[1]), f1(b2[2]))
}, character(1))
writeLines(c(
  svg_open(list(id = "pano2", text = "RUS01: o balanço de coleta por subparcela / collection balance per subplot"),
           sprintf("Balanço de coleta do RUS01 por subparcela, calculado pelo forplot_balance(): %d indivíduos com voucher e %d sem voucher (palmeiras à parte).",
                   sum(sub$collected), sum(sub$missing))),
  grid_lines(), paste0('<g class="pano-bars">', paste(bars, collapse = ""), "</g></svg>")
), file.path(out, "panorama", "rus01_balanco.svg"), useBytes = TRUE)

# --------------------------------------------------------------- 6. números
tum_st <- table(TUM$Nome_estacao)
nums <- list(
  forplotr = list(versao = pkg_version),
  rus01 = list(
    arvores = nrow(fc), sem_subparcela = nrow(RUS01) - 1 - nrow(fc) - sum(is.na(suppressWarnings(as.numeric(RUS01[-1, 1])))),
    coletadas = sum(is_col & !is_palm), nao_coletadas = sum(!is_col & !is_palm), palmeiras = sum(is_palm),
    familias = length(unique(stats::na.omit(fc$Family))), subparcelas = geo$n_subplots,
    pct_coletado = round(100 * sum(is_col & !is_palm) / sum(!is_palm)),
    pastas_familia = length(fams), etiquetas = nrow(lab)
  ),
  tum = list(registros = nrow(TUM), estacoes = length(tum_st), etiquetas_ea1 = nrow(tum))
)
to_int <- function(x) if (is.list(x)) lapply(x, to_int) else if (is.numeric(x) && all(x == round(x))) as.integer(x) else x
nums <- to_int(nums)
nums$rus01$sem_subparcela <- NULL   # contado pelo aviso do pacote; não usado nos textos
yaml::write_yaml(nums, "_variables.yml")
say("pronto: ", paste(list.files(out, recursive = TRUE), collapse = ", "))
