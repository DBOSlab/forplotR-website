# Especificação das ferramentas ---------------------------------------------
# Fonte única da verdade: este arquivo define, para cada função do forplotR,
# os campos do formulário (o site lê via GET /v1/tools), a validação dos
# valores e os argumentos fixos que o servidor impõe (pastas de saída etc.).
#
# Tipos de campo: file, example, select, number, bool, text, text_vec, vertices
# Grupos: "principal" (sempre visível), "avancado", "logos", "colunas" (recolhidos)
#
# Dois motores usam este arquivo:
#   "http"  servidor Plumber (backend/plumber.R);
#   "local" webR no navegador (backend/webr/engine.R): os dados não saem do
#           computador, então nada que use a internet é oferecido.
# Para o modo local:
#   fld(local = FALSE)            o campo não aparece;
#   fld(local = list(...))        substitui atributos (ex.: required, help);
#   ferramenta local = FALSE      indisponível, com local_note explicando;
#   ferramenta local_fixed        argumentos impostos (ex.: validate_locality = FALSE).

fld <- function(name, label, type, arg = name, default = NULL, options = NULL,
                required = FALSE, help = NULL, group = "principal",
                accept_ext = NULL, show_if = NULL, local = NULL) {
  x <- list(
    name = name, label = label, type = type, arg = arg, default = default,
    options = options, required = required, help = help, group = group,
    accept_ext = if (!is.null(accept_ext)) I(accept_ext) else NULL,
    show_if = show_if, local = local
  )
  Filter(Negate(is.null), x)
}

# opts(pt = "Português", en = "English") -> lista de {value, label}
opts <- function(...) {
  x <- c(...)
  lapply(seq_along(x), function(i) list(value = names(x)[i], label = unname(x[[i]])))
}

only_monitora <- list(field = "input_type", values = I("monitora"))

# Campos reutilizados ---------------------------------------------------------

f_fp_file <- function() {
  fld("fp_file", "Planilha da parcela", "file", arg = "fp_file_path",
      required = TRUE, accept_ext = c("xlsx", "xls"),
      help = "Arquivo Excel no formato escolhido abaixo.")
}

f_example <- function() {
  fld("usar_exemplo", "Usar os dados de exemplo do pacote (RUS01 ou TUM)", "example",
      arg = "",
      help = "Para demonstração: usa RUS01 (field sheet) ou TUM (MONITORA) no lugar da planilha.")
}

it_all <- opts(field_sheet = "ForestPlots — field sheet",
               field_sheet_ti = "Field sheet de Terra Indígena",
               fp_query_sheet = "ForestPlots — Query Library",
               monitora = "MONITORA (ICMBio)")

f_input_type <- function(choices = it_all, default = "field_sheet") {
  fld("input_type", "Formato da planilha", "select", options = choices, default = default)
}

f_language <- function(choices = opts(pt = "Português", en = "English", es = "Español",
                                      fr = "Français", ma = "Mandarim", pa = "Panará"),
                       default = "pt") {
  fld("language", "Idioma dos resultados", "select", options = choices, default = default)
}

f_station <- function(multiple = FALSE) {
  fld("station_name", if (multiple) "Estação(ões) MONITORA" else "Estação MONITORA",
      if (multiple) "text_vec" else "text", show_if = only_monitora,
      help = if (multiple) "Nome ou número. Várias estações: separe por vírgula (um relatório por estação)."
             else "Nome ou número da estação.")
}

f_geometry <- function() {
  list(
    fld("plot_size", "Área da parcela (ha)", "number", default = 1,
        help = "Ignorado para MONITORA."),
    fld("subplot_size", "Lado da subparcela (m)", "number", default = 10),
    fld("plot_width_m", "Largura da parcela (m)", "number", group = "avancado",
        help = "Opcional. Se vazio, é calculada a partir da área."),
    fld("plot_length_m", "Comprimento da parcela (m)", "number", group = "avancado",
        help = "Opcional.")
  )
}

f_plot_meta <- function() {
  list(
    fld("plot_name", "Nome da parcela", "text", group = "avancado",
        help = "Substitui o nome lido da planilha."),
    fld("plot_code", "Código da parcela", "text", group = "avancado"),
    fld("team", "Equipe / PI", "text", group = "avancado")
  )
}

# Linha do cabeçalho: vazio = detectada pelo forplotR (detect_header_row()).
# No navegador vira um seletor junto da leitura da planilha (forplotr-app.js).
f_header_row <- function() {
  fld("header_row", "Linha do cabeçalho", "number", group = "colunas",
      help = "Linha da planilha com os nomes das colunas. Vazio: detectada automaticamente.")
}

# Logos no cabeçalho do relatório e do mapa. A do forplotR entra sempre; cada
# caixa acrescenta uma das logos que vêm com o pacote (inst/logos). O app marca
# CI e Iakiô sozinho quando detecta a ficha de Terra Indígena (forplotr-app.js).
LOGO_FIELDS <- c(logo_jbrj = "jbrj", logo_ci = "ci", logo_iakio = "iakio",
                 logo_monitora = "monitora", logo_forestplots = "forestplots")
f_logos <- function(jbrj = TRUE) {
  lab <- c(
    logo_jbrj = "Logo do Jardim Botânico do Rio de Janeiro (JBRJ)",
    logo_ci = "Logo da Conservação Internacional (CI)",
    logo_iakio = "Logo da Associação Iakiô Panará",
    logo_monitora = "Logo do Programa MONITORA",
    logo_forestplots = "Logo do ForestPlots.net"
  )
  lapply(names(lab), function(nm) {
    fld(nm, lab[[nm]], "bool", default = identical(nm, "logo_jbrj") && isTRUE(jbrj), group = "logos")
  })
}
# caixas marcadas -> argumento logos do forplot_balance() e do forplot_map()
logos_param <- function(params) {
  on <- names(LOGO_FIELDS)[vapply(names(LOGO_FIELDS), function(nm) isTRUE(params[[nm]]), logical(1))]
  params$logos <- c("forplotR", unname(LOGO_FIELDS[on]))
  params[names(LOGO_FIELDS)] <- NULL
  params
}

f_colnames <- function() {
  lab <- c(
    colname_tagno = "Coluna da plaqueta (New Tag No)",
    colname_stemgroup = "Coluna do grupo de fustes",
    colname_subplot = "Coluna da subparcela (T1 / subunidade)",
    colname_x = "Coluna X (m)",
    colname_y = "Coluna Y (m)",
    colname_family = "Coluna da família",
    colname_species = "Coluna da espécie",
    colname_dbh = "Coluna do DAP (mm)",
    colname_voucher = "Coluna do voucher",
    colname_collected = "Coluna de coletado",
    colname_subplot_t2 = "MONITORA: coluna N_parcela",
    colname_cap = "MONITORA: coluna CAP (cm)",
    colname_station = "MONITORA: coluna da estação",
    colname_census_year = "MONITORA: coluna do ano do censo"
  )
  lapply(names(lab), function(nm) fld(nm, lab[[nm]], "text", group = "colunas"))
}

flatten_fields <- function(...) {
  out <- list()
  for (x in list(...)) {
    if (!is.null(x$name)) out[[length(out) + 1]] <- x else out <- c(out, x)
  }
  out
}

# Modelos de planilha de herbário (usados quando o usuário não envia um) ------

herb_template_cols <- list(
  jabot = c("family", "genus", "sp1", "collector", "number", "addcoll",
            "colldd", "collmm", "collyy", "country", "majorarea", "minorarea",
            "uc", "projeto", "locnotes", "latitude", "longitude", "altprof", "notes"),
  brahms = c("FamilyName", "GenusName", "SpeciesName", "Collectors", "FieldNumber",
             "AdditionalCollectors", "CollectionDay", "CollectionMonth",
             "CollectionYear", "CountryName", "MajorAdminName", "MinorAdminName",
             "LocalityName", "LocalityNotes", "Latitude", "Longitude", "Elevation",
             "DescriptionText")
)

write_herb_template <- function(format, path) {
  cols <- herb_template_cols[[format]]
  df <- as.data.frame(stats::setNames(replicate(length(cols), character(0), simplify = FALSE), cols),
                      stringsAsFactors = FALSE)
  openxlsx::write.xlsx(df, path)
  normalizePath(path, winslash = "/", mustWork = TRUE)
}

# As cinco ferramentas ---------------------------------------------------------

TOOLS <- list(

  balance = list(
    id = "balance", fun = "forplot_balance", chip = "Relatório",
    title = "Relatório de campo e balanço de coleta",
    description = paste(
      "Um único arquivo HTML para usar no campo (celular, sem internet) ou impresso:",
      "resumo do balanço, grade clicável das subparcelas, mapas da parcela com a",
      "plaqueta de cada fuste, rota de prioridade, uma página A4 por subparcela",
      "com mapa, tabela e colunas para remedição, e florística e fitossociologia.",
      "Também gera a planilha XLSX."),
    eta = "1 a 2 minutos com os dados de exemplo",
    example = TRUE,
    # No navegador não há Chrome sem interface para imprimir o PDF: o relatório
    # HTML é impresso em PDF pelo próprio navegador (Imprimir > Salvar como PDF).
    local_fixed = list(render_pdf = FALSE),
    fields = flatten_fields(
      f_fp_file(), f_example(), f_input_type(), f_language(), f_station(multiple = TRUE),
      f_geometry(),
      fld("render_html", "Gerar relatório de campo (HTML)", "bool", default = TRUE,
          local = list(help = "Para ter o PDF (A4), abra o relatório e use Imprimir > Salvar como PDF.")),
      fld("render_pdf", "Gerar relatório PDF", "bool", default = FALSE,
          help = "Exige Chrome, Chromium ou Edge no servidor.", local = FALSE),
      fld("write_xlsx", "Gerar planilha de balanço (XLSX)", "bool", default = TRUE,
          help = "Não disponível para MONITORA."),
      fld("highlight_palms", "Destacar palmeiras (Arecaceae)", "bool", default = TRUE,
          group = "avancado"),
      f_plot_meta(),
      fld("plot_census_no", "Número do censo", "text", group = "avancado"),
      f_logos(jbrj = TRUE),
      f_header_row(),
      f_colnames()
    ),
    fixed = function(ctx, params) list(dir = ctx$outputs, filename = "relatorio_parcela",
                                       verbose = TRUE),
    check = function(params, ctx) logos_param(params)
  ),

  map = list(
    id = "map", fun = "forplot_map", chip = "Mapa",
    title = "Mapa interativo da parcela",
    description = paste(
      "Mapa HTML sobre imagem de satélite com cada indivíduo georreferenciado,",
      "filtros por família, espécie e situação de coleta, fotos dos vouchers",
      "e links para as exsicatas no JABOT/REFLORA."),
    eta = "menos de 1 minuto (mais, com busca em herbários)",
    example = TRUE,
    fields = flatten_fields(
      f_fp_file(), f_example(), f_input_type(),
      fld("vertices", "Coordenadas da parcela (graus decimais)", "vertices",
          arg = "vertex_coords", required = FALSE,
          help = paste(
            "Uma linha por ponto: latitude; longitude. Parcelas ForestPlots: 4 cantos na",
            "ordem (0,0), (0,comprimento), (largura,0), (largura,comprimento).",
            "MONITORA: 1 ponto, o centro da estação.")),
      fld("vertex_file", "…ou envie as coordenadas em planilha", "file",
          arg = "vertex_coords", accept_ext = c("csv", "xlsx", "xls"),
          help = "Colunas latitude e longitude."),
      f_language(), f_station(multiple = FALSE), f_geometry(),
      fld("voucher_zip", "Fotos dos vouchers (ZIP, opcional)", "file",
          arg = "voucher_imgs", accept_ext = c("zip"),
          help = "Uma pasta por voucher com as fotos dentro (ex.: o ZIP gerado pela ferramenta Pastas de vouchers)."),
      fld("embed_voucher_imgs", "Embutir as fotos no HTML (arquivo único)", "bool",
          default = TRUE, group = "avancado"),
      fld("herbaria_lookup", "Buscar exsicatas nos herbários (JABOT/REFLORA)", "bool",
          default = FALSE, help = "Baixa os dados do herbário; a primeira vez é demorada.",
          local = FALSE),
      fld("herbaria", "Herbários", "text_vec", default = "RB",
          help = "Siglas separadas por vírgula, ex.: RB, UPCB.", local = FALSE),
      fld("collector", "Coletor (quando o voucher só tem número)", "text", group = "avancado",
          local = FALSE),
      fld("herbaria_force_refresh", "Forçar novo download dos herbários", "bool",
          default = FALSE, group = "avancado", local = FALSE),
      fld("highlight_palms", "Destacar palmeiras (Arecaceae)", "bool", default = TRUE,
          group = "avancado"),
      f_plot_meta(),
      f_logos(jbrj = FALSE),
      f_header_row(),
      f_colnames()
    ),
    fixed = function(ctx, params) list(dir = ctx$outputs, filename = "mapa_parcela",
                                       keep_herbaria_downloads = FALSE, verbose = TRUE),
    check = function(params, ctx) {
      if (is.null(params$vertex_coords)) {
        user_error("Informe as coordenadas da parcela (digitadas ou em planilha).")
      }
      logos_param(params)
    }
  ),

  sheets = list(
    id = "sheets", fun = "forplot_sheets", chip = "Herbário",
    title = "Planilha para o herbário",
    description = paste(
      "Preenche a planilha de entrada do herbário (JABOT ou BRAHMS) com os",
      "indivíduos coletados, incluindo notas descritivas geradas a partir dos",
      "códigos RAINFOR, DAP e posição na parcela."),
    eta = "menos de 1 minuto (mais, se a altitude for calculada)",
    example = TRUE,
    extra_libs = c("terra", "stringi"),
    fields = flatten_fields(
      f_fp_file(), f_example(),
      f_input_type(opts(forestplots = "ForestPlots — field sheet", monitora = "MONITORA (ICMBio)"),
                   default = "forestplots"),
      fld("herbarium_format", "Formato do herbário", "select",
          options = opts(jabot = "JABOT", brahms = "BRAHMS"), default = "jabot"),
      fld("herb_file", "Modelo da planilha do herbário (opcional)", "file",
          arg = "herb_file_path", accept_ext = c("xlsx", "xls"),
          help = "Se não enviar, usamos um modelo com as colunas do formato escolhido."),
      f_language(opts(pt = "Português", en = "English", es = "Español")),
      fld("country", "País", "text", default = "Brazil"),
      fld("majorarea", "Estado", "text", required = TRUE, help = "Ex.: BA ou Bahia."),
      fld("minorarea", "Município", "text", required = TRUE),
      fld("lat", "Latitude (graus decimais)", "number", required = TRUE),
      fld("long", "Longitude (graus decimais)", "number", required = TRUE),
      fld("alt", "Altitude (m)", "number",
          help = "Recomendado. Se vazio, o servidor baixa um modelo de elevação global de baixa resolução (~4,5 km).",
          local = list(required = TRUE,
                       help = "Obrigatória no navegador: o modelo de elevação global não é baixado.")),
      fld("protectedarea", "Unidade de conservação", "text"),
      fld("collector", "Coletor principal", "text", group = "avancado",
          help = "Se vazio, é lido da planilha (campo Team)."),
      fld("addcoll", "Coletores adicionais", "text", group = "avancado"),
      fld("project", "Projeto", "text", group = "avancado"),
      fld("locnotes", "Notas da localidade", "text", group = "avancado"),
      f_station(multiple = FALSE),
      fld("sheet", "Aba da planilha (número)", "number", default = 1, group = "avancado"),
      f_header_row(),
      fld("add_census_notes", "Incluir notas do censo nas observações", "bool", default = TRUE,
          group = "avancado"),
      fld("validate_locality", "Conferir se as coordenadas caem no estado", "bool",
          default = FALSE, group = "avancado",
          help = "Baixa os limites administrativos do GADM.", local = FALSE)
    ),
    local_fixed = list(validate_locality = FALSE),
    fixed = function(ctx, params) list(dir = ctx$outputs, filename = "planilha_herbario"),
    check = function(params, ctx) {
      if (is.null(params$herb_file_path)) {
        params$herb_file_path <- write_herb_template(
          params$herbarium_format %||% "jabot",
          file.path(ctx$inputs, "modelo_herbario.xlsx"))
      }
      if (!is.null(params$lat) && abs(params$lat) > 90) user_error("Latitude fora do intervalo.")
      if (!is.null(params$long) && abs(params$long) > 180) user_error("Longitude fora do intervalo.")
      params
    }
  ),

  crossdet = list(
    id = "crossdet", fun = "forplot_crossdet", chip = "Determinações",
    title = "Cruzamento com o herbário",
    description = paste(
      "Procura cada voucher do inventário no herbário escolhido (JABOT) e compara",
      "as identificações: indeterminados que já têm nome no herbário,",
      "divergências e vouchers ainda não tombados."),
    eta = "primeira vez: vários minutos (download do JABOT); depois, ~1 minuto",
    example = TRUE,
    local = FALSE,
    local_note = paste(
      "O cruzamento precisa baixar os dados do herbário (JABOT) pela internet,",
      "o que não é feito no modo navegador. Use o pacote forplotR no R."),
    fields = flatten_fields(
      f_fp_file(), f_example(),
      f_input_type(opts(field_sheet = "ForestPlots — field sheet",
                        fp_query_sheet = "ForestPlots — Query Library",
                        monitora = "MONITORA (ICMBio)")),
      fld("herbaria", "Herbário", "text", default = "RB", required = TRUE,
          help = "Uma sigla, ex.: RB."),
      fld("collector_fallback", "Coletor (quando o voucher só tem número)", "text",
          help = "Ex.: G. Ottino"),
      f_station(multiple = FALSE),
      fld("only_collected", "Somente indivíduos coletados", "bool", default = TRUE),
      fld("force_refresh", "Baixar de novo os dados do herbário", "bool", default = FALSE,
          group = "avancado", help = "Use só se os dados do JABOT mudaram.")
    ),
    fixed = function(ctx, params) {
      herb <- toupper(gsub("[^A-Za-z0-9]", "", params$herbaria %||% "RB"))
      list(save = TRUE, dir = ctx$outputs, filename = "cruzamento_herbario",
           dbdir = ":memory:", verbose = TRUE,
           path = file.path(ctx$cfg$cache, "jabot_dwca", herb))
    },
    check = function(params, ctx) {
      if (!grepl("^[A-Za-z0-9]+$", params$herbaria %||% "")) {
        user_error("Informe uma única sigla de herbário, só letras e números.")
      }
      cache <- file.path(ctx$cfg$cache, "jabot_dwca", toupper(params$herbaria))
      if (isTRUE(params$force_refresh)) unlink(cache, recursive = TRUE, force = TRUE)
      dir.create(cache, recursive = TRUE, showWarnings = FALSE)
      params
    }
  ),

  vouchers = list(
    id = "vouchers", fun = "forplot_vouchers", chip = "Vouchers",
    title = "Pastas de vouchers",
    description = paste(
      "Cria a estrutura Família/Gênero/Voucher para organizar as fotos dos",
      "vouchers. Envie o ZIP da sua pasta atual para reorganizá-la conforme as",
      "identificações mais recentes da planilha."),
    eta = "segundos",
    example = TRUE,
    fields = flatten_fields(
      f_fp_file(), f_example(), f_input_type(), f_station(multiple = FALSE), f_header_row(),
      fld("voucher_zip", "Pasta de fotos atual (ZIP, opcional)", "file", arg = "",
          accept_ext = c("zip"),
          help = "Sem ZIP, é criada a estrutura vazia para você preencher.")
    ),
    fixed = function(ctx, params) list(output_dir = file.path(ctx$outputs, "voucher_imgs"),
                                       verbose = TRUE)
  )
)

# Spec de uma ferramenta para um motor ("http" ou "local").
tool_spec <- function(id, mode = c("http", "local")) {
  mode <- match.arg(mode)
  spec <- TOOLS[[id]]
  if (is.null(spec)) user_error("Ferramenta desconhecida: ", id)
  if (identical(mode, "local")) {
    if (identical(spec$local, FALSE)) {
      user_error(spec$local_note %||% "Esta ferramenta não está disponível no navegador.")
    }
    spec$fields <- local_fields(spec$fields)
  }
  spec
}

local_fields <- function(fields) {
  out <- list()
  for (f in fields) {
    loc <- f$local
    if (identical(loc, FALSE)) next
    if (is.list(loc)) for (nm in names(loc)) f[[nm]] <- loc[[nm]]
    f$local <- NULL
    out[[length(out) + 1]] <- f
  }
  out
}

# Versão pública do spec (sem funções) para o site.
tools_public <- function(mode = c("http", "local")) {
  mode <- match.arg(mode)
  lapply(unname(TOOLS), function(t) {
    out <- t[c("id", "fun", "chip", "title", "description", "eta", "example")]
    if (identical(mode, "local")) {
      out$available <- !identical(t$local, FALSE)
      if (!out$available) out$note <- t$local_note
      out$fields <- local_fields(t$fields)
    } else {
      out$available <- TRUE
      out$fields <- lapply(t$fields, function(f) { f$local <- NULL; f })
    }
    out
  })
}
