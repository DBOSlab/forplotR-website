::: {data-lang="pt"}
O forplotR pode ser usado de duas formas, que executam o mesmo código:

- **no R**, com o pacote instalado localmente, indicado para várias parcelas, para scripts e para registrar os parâmetros de cada análise;
- **no [navegador]({{LINK:tools}})**, sem instalar nada e sem enviar os dados, uma parcela por vez.

Esta página trata do uso no R.
:::

::: {data-lang="en"}
forplotR can be used in two ways, both running the same code:

- **in R**, with the package installed locally, suited to several plots, to scripts and to recording the parameters of each analysis;
- **in the [browser]({{LINK:tools}})**, with nothing to install and without sending the data, one plot at a time.

This page covers use in R.
:::

## [Instalação]{data-lang=pt}[Installation]{data-lang=en} {#instalacao}

::: {data-lang="pt"}
O código-fonte está no [GitHub](https://github.com/DBOSlab/forplotR), sob licença MIT. O pacote requer R ≥ 4.1.0 e é instalado com o `devtools`:
:::
::: {data-lang="en"}
The source code is on [GitHub](https://github.com/DBOSlab/forplotR) under the MIT licence. The package requires R ≥ 4.1.0 and is installed with `devtools`:
:::

```{.r .rede}
install.packages("devtools")
devtools::install_github("DBOSlab/forplotR")
library(forplotR)
```

::: {data-lang="pt"}
O **relatório em PDF** de `forplot_balance()` é compilado com LaTeX e requer uma distribuição TeX (TinyTeX, TeX Live ou MiKTeX). A instalação do TinyTeX pode ser feita a partir do R:
:::
::: {data-lang="en"}
The **PDF report** of `forplot_balance()` is compiled with LaTeX and requires a TeX distribution (TinyTeX, TeX Live or MiKTeX). TinyTeX can be installed from R:
:::

```{.r .rede}
install.packages("tinytex")
tinytex::install_tinytex()
```

::: {data-lang="pt"}
O relatório HTML, as figuras e as planilhas não dependem de LaTeX; para omitir o PDF, use `render_pdf = FALSE`.
:::
::: {data-lang="en"}
The HTML report, the figures and the spreadsheets do not depend on LaTeX; to skip the PDF, use `render_pdf = FALSE`.
:::

## [Formatos de entrada]{data-lang=pt}[Input layouts]{data-lang=en} {#formatos-de-entrada}

::: {data-lang="pt"}
A maioria das funções tem o argumento `input_type`, que indica a organização da planilha e ativa as opções predefinidas de metadados e de geometria:

| `input_type` | Planilha | Geometria da parcela |
|---|---|---|
| `"field_sheet"` | Ficha de campo do ForestPlots.net | Retangular, definida por `plot_size` e `subplot_size` (ou `plot_width_m` e `plot_length_m`) |
| `"field_sheet_ti"` | Ficha de campo usada em Terras Indígenas (variante da ficha ForestPlots.net) | Como em `"field_sheet"` |
| `"fp_query_sheet"` | Exportação da Query Library do ForestPlots.net | Como em `"field_sheet"`; o número do censo é lido do arquivo |
| `"monitora"` | Planilha do Programa Monitora (ICMBio) | Cruz-de-malta de 0,4 ha, calculada automaticamente; a estação é escolhida com `station_name` |

: Formatos de entrada aceitos. {.arg-table}

Em `forplot_sheets()`, os valores são `"forestplots"` (qualquer ficha ForestPlots.net) ou `"monitora"`.

Dados de outras iniciativas de monitoramento podem ser preparados a partir da planilha-modelo do pacote, mapeando identificadores de fuste, plaquetas, taxonomia, coordenadas e dados de coleta para os campos exigidos.
:::

::: {data-lang="en"}
Most functions take an `input_type` argument, which states how the spreadsheet is organised and enables the predefined metadata and geometry options:

| `input_type` | Spreadsheet | Plot geometry |
|---|---|---|
| `"field_sheet"` | ForestPlots.net field sheet | Rectangular, defined by `plot_size` and `subplot_size` (or `plot_width_m` and `plot_length_m`) |
| `"field_sheet_ti"` | Field sheet used in Indigenous Lands (a variant of the ForestPlots.net sheet) | As for `"field_sheet"` |
| `"fp_query_sheet"` | ForestPlots.net Query Library export | As for `"field_sheet"`; the census number is read from the file |
| `"monitora"` | Monitora Program spreadsheet (ICMBio) | 0.4-ha maltese cross, computed automatically; the station is chosen with `station_name` |

: Accepted input layouts. {.arg-table}

In `forplot_sheets()`, the values are `"forestplots"` (any ForestPlots.net sheet) or `"monitora"`.

Data from other monitoring initiatives can be prepared from the package template spreadsheet, mapping stem identifiers, tags, taxonomy, coordinates and collection data to the required fields.
:::

### [Mapeamento de colunas]{data-lang=pt}[Column mapping]{data-lang=en} {#mapeamento-de-colunas}

::: {data-lang="pt"}
Os nomes usuais das colunas são reconhecidos sem distinção de maiúsculas, acentos e pontuação. Quando a planilha usa outros nomes, eles são informados pelos argumentos `colname_*` (disponíveis em `forplot_balance()` e `forplot_map()`):
:::
::: {data-lang="en"}
The usual column names are recognised regardless of case, accents and punctuation. When the spreadsheet uses other names, they are given through the `colname_*` arguments (available in `forplot_balance()` and `forplot_map()`):
:::

```{.r .offline}
forplot_balance(
  fp_file_path = "minha_parcela.xlsx",
  input_type = "field_sheet",
  colname_tagno = "Placa",
  colname_subplot = "Subparcela",
  colname_x = "Coord X",
  colname_y = "Coord Y",
  colname_family = "Familia",
  colname_species = "Especie",
  colname_dbh = "DAP_mm",
  colname_voucher = "Voucher"
)
```

::: {data-lang="pt"}
| Argumento | Coluna padrão | Conteúdo |
|---|---|---|
| `colname_tagno` | `New Tag No` | Número da plaqueta |
| `colname_stemgroup` | `New Stem Grouping` | Agrupamento de fustes (indivíduos multifustes) |
| `colname_subplot` | `T1` | Subparcela (no Monitora, a subunidade N/S/L/O) |
| `colname_subplot_t2` | `N_parcela` | Apenas Monitora: número da parcela dentro da subunidade |
| `colname_x`, `colname_y` | `X`, `Y` | Coordenadas locais, em metros |
| `colname_family` | `Family` | Família |
| `colname_species` | `Original determination` | Espécie |
| `colname_dbh` | `D` | Diâmetro, em mm |
| `colname_cap` | — | Apenas Monitora: circunferência à altura do peito (CAP) |
| `colname_voucher` | `Voucher` | Código do voucher |
| `colname_collected` | `Collected` | Situação de coleta |
| `colname_station`, `colname_census_year` | — | Apenas Monitora: estação e ano do censo |

: Argumentos de mapeamento de colunas. {.arg-table}
:::

::: {data-lang="en"}
| Argument | Default column | Content |
|---|---|---|
| `colname_tagno` | `New Tag No` | Tag number |
| `colname_stemgroup` | `New Stem Grouping` | Stem grouping (multi-stemmed individuals) |
| `colname_subplot` | `T1` | Subplot (for Monitora, the N/S/E/W subunit) |
| `colname_subplot_t2` | `N_parcela` | Monitora only: plot number within the subunit |
| `colname_x`, `colname_y` | `X`, `Y` | Local coordinates, in metres |
| `colname_family` | `Family` | Family |
| `colname_species` | `Original determination` | Species |
| `colname_dbh` | `D` | Diameter, in mm |
| `colname_cap` | — | Monitora only: circumference at breast height (CBH) |
| `colname_voucher` | `Voucher` | Voucher code |
| `colname_collected` | `Collected` | Collection status |
| `colname_station`, `colname_census_year` | — | Monitora only: station and census year |

: Column-mapping arguments. {.arg-table}
:::

## [Dados de exemplo]{data-lang=pt}[Example data]{data-lang=en} {#dados-de-exemplo}

::: {data-lang="pt"}
O pacote inclui dois conjuntos de dados, correspondentes aos estudos de caso do manuscrito:

- `RUS01`: parcela permanente de 1 ha (protocolo RAINFOR, ForestPlots.net) na Reserva Biológica Augusto Ruschi, Mata Atlântica montana, Espírito Santo; formato de ficha de campo;
- `TUM`: parcelas em cruz-de-malta de 0,4 ha do Programa Monitora no Parque Nacional Montanhas do Tumucumaque, Amazônia, Amapá.

As funções leem arquivos `.xlsx`; o primeiro passo é gravar os dados em disco:
:::

::: {data-lang="en"}
The package includes two datasets, matching the case studies of the manuscript:

- `RUS01`: a 1-ha permanent plot (RAINFOR protocol, ForestPlots.net) in the Augusto Ruschi Biological Reserve, montane Atlantic Forest, Espírito Santo; field-sheet layout;
- `TUM`: 0.4-ha maltese-cross plots of the Monitora Program in the Montanhas do Tumucumaque National Park, Amazonia, Amapá.

The functions read `.xlsx` files, so the first step is to write the data to disk:
:::

```{.r .offline}
library(openxlsx)

data(RUS01)
data(TUM)

write.xlsx(RUS01, "RUS01.xlsx")
write.xlsx(TUM, "TUM.xlsx")
```

## [Primeiro relatório]{data-lang=pt}[First report]{data-lang=en} {#primeiro-relatorio}

```{.r .offline}
forplot_balance(
  fp_file_path = "RUS01.xlsx",
  input_type = "field_sheet",
  plot_size = 1,
  subplot_size = 10,
  language = "pt",
  dir = "resultados"
)
```

::: {data-lang="pt"}
`plot_size` é a área em hectares e `subplot_size`, o lado da subparcela em metros. Os arquivos são gravados em `resultados/<data>/` (por exemplo, `resultados/10Nov2026/`); o subdiretório datado identifica cada execução. A página [Balanço de coleta]({{LINK:balance}}) descreve cada saída.

Para uma estação do Monitora:
:::
::: {data-lang="en"}
`plot_size` is the area in hectares and `subplot_size` the subplot side in metres. Files are written to `resultados/<date>/` (for example, `resultados/10Nov2026/`); the date-stamped subdirectory identifies each run. The [Collection balance]({{LINK:balance}}) page describes every output.

For a Monitora station:
:::

```{.r .offline}
forplot_balance(
  fp_file_path = "TUM.xlsx",
  input_type = "monitora",
  station_name = 1,
  language = "pt"
)
```

## [Idiomas]{data-lang=pt}[Languages]{data-lang=en} {#idiomas}

::: {data-lang="pt"}
| Código | Idioma | Funções |
|---|---|---|
| `"pt"` | Português | todas as funções com o argumento `language` |
| `"en"` | Inglês | todas |
| `"es"` | Espanhol | todas |
| `"fr"` | Francês | `forplot_balance()`, `forplot_map()` |
| `"ma"` | Mandarim | `forplot_balance()`, `forplot_map()` |
| `"pa"` | Panará | `forplot_balance()`, `forplot_map()` |

: Idiomas das saídas. {.arg-table}
:::

::: {data-lang="en"}
| Code | Language | Functions |
|---|---|---|
| `"pt"` | Portuguese | every function with a `language` argument |
| `"en"` | English | all |
| `"es"` | Spanish | all |
| `"fr"` | French | `forplot_balance()`, `forplot_map()` |
| `"ma"` | Mandarin | `forplot_balance()`, `forplot_map()` |
| `"pa"` | Panará | `forplot_balance()`, `forplot_map()` |

: Output languages. {.arg-table}
:::

## [Próximos passos]{data-lang=pt}[Next steps]{data-lang=en} {#proximos-passos}

::: {data-lang="pt"}
Continue com [`forplot_balance()`]({{LINK:balance}}) ou consulte a [sequência recomendada]({{LINK:apps}}#sequencia-recomendada) das funções.
:::
::: {data-lang="en"}
Continue with [`forplot_balance()`]({{LINK:balance}}) or see the [recommended sequence]({{LINK:apps}}#sequencia-recomendada) of functions.
:::
