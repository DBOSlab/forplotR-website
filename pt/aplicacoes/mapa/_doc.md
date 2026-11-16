::: {.note}
[[Nome anterior]{data-lang=pt}[Former name]{data-lang=en}]{.note-title}

[Esta função se chamava `plot_html_map()`.]{data-lang=pt}[This function was previously called `plot_html_map()`.]{data-lang=en}
:::


## [Descrição]{data-lang=pt}[Description]{data-lang=en} {#descricao}

::: {data-lang="pt"}
`forplot_map()` representa no mapa cada indivíduo da parcela. As coordenadas locais x–y da planilha (em metros, dentro de cada subparcela) e os identificadores das unidades amostrais são convertidos em coordenadas da parcela, a partir das dimensões e da organização espacial informadas, e em seguida em latitude e longitude usando:

- os **quatro vértices** da parcela, nas fichas ForestPlots.net (`field_sheet`, `field_sheet_ti`, `fp_query_sheet`);
- o **ponto central**, no Programa Monitora.

O resultado é um único arquivo HTML que abre em qualquer navegador; os dados ficam no próprio arquivo (apenas a imagem de satélite de fundo requer conexão). O mapa contém:

- os limites da parcela e das subparcelas;
- os indivíduos classificados pela situação de coleta, com palmeiras em categoria própria (`highlight_palms`);
- filtros por família, espécie e situação de coleta;
- uma janela por indivíduo com plaqueta, subparcela, família, espécie, DAP e voucher;
- as imagens do voucher em carrossel, quando há diretório de imagens;
- links para as exsicatas digitalizadas no JABOT, com `herbaria_lookup = TRUE`.

O filtro taxonômico permite que especialistas examinem um clado específico e avaliem rapidamente a identificação e a cobertura de vouchers na parcela. O arquivo pode ser compartilhado com taxonomistas, gestores de áreas protegidas e curadores de herbário.
:::

::: {data-lang="en"}
`forplot_map()` places every individual of the plot on a map. The local x–y coordinates in the spreadsheet (in metres, within each subplot) and the sampling-unit identifiers are converted to plot coordinates, from the given dimensions and spatial layout, and then to latitude and longitude using:

- the **four vertices** of the plot, for ForestPlots.net sheets (`field_sheet`, `field_sheet_ti`, `fp_query_sheet`);
- the **centre point**, for the Monitora Program.

The result is a single HTML file that opens in any browser; the data are stored in the file itself (only the satellite base layer needs a connection). The map contains:

- the plot and subplot boundaries;
- the individuals classified by collection status, with palms as a separate category (`highlight_palms`);
- filters by family, species and collection status;
- a pop-up per individual with tag, subplot, family, species, DBH and voucher;
- the voucher images in a carousel, when an image directory is given;
- links to digitised specimens in JABOT, with `herbaria_lookup = TRUE`.

The taxonomic filter lets specialists examine a given clade and quickly assess identification and voucher coverage in the plot. The file can be shared with taxonomists, protected-area managers and herbarium curators.
:::

## [Ordem dos vértices]{data-lang=pt}[Vertex order]{data-lang=en} {#ordem-dos-vertices}

::: {data-lang="pt"}
Os quatro vértices devem ser informados **nesta ordem**, no sistema de coordenadas da parcela:

| Ordem | Vértice | X | Y |
|---|---|---|---|
| 1 | origem | 0 | 0 |
| 2 | | 0 | comprimento |
| 3 | | largura | 0 |
| 4 | | largura | comprimento |

: Ordem dos vértices em `vertex_coords`. {.arg-table}

As coordenadas são dadas em graus decimais, negativas para sul e oeste. Se as distâncias entre os vértices não forem compatíveis com as dimensões da parcela, a função emite um aviso; a causa mais frequente é a ordem incorreta.

`vertex_coords` aceita um `data.frame`, o caminho de um arquivo `.xlsx` ou `.csv` ou, no Monitora, um vetor `c(lat, lon)`. As colunas são reconhecidas pelo nome: `lat`, `latitude`, `lon`, `long`, `longitude`.
:::

::: {data-lang="en"}
The four vertices must be given **in this order**, in the plot coordinate system:

| Order | Vertex | X | Y |
|---|---|---|---|
| 1 | origin | 0 | 0 |
| 2 | | 0 | length |
| 3 | | width | 0 |
| 4 | | width | length |

: Vertex order in `vertex_coords`. {.arg-table}

Coordinates are in decimal degrees, negative for south and west. If the distances between vertices do not match the plot dimensions, the function issues a warning; the most frequent cause is an incorrect order.

`vertex_coords` accepts a `data.frame`, the path to an `.xlsx` or `.csv` file or, for Monitora, a `c(lat, lon)` vector. Columns are recognised by name: `lat`, `latitude`, `lon`, `long`, `longitude`.
:::

## [Uso básico]{data-lang=pt}[Basic usage]{data-lang=en} {#uso-basico}

```{.r .offline}
library(forplotR)

data(RUS01)
openxlsx::write.xlsx(RUS01, "RUS01.xlsx")

vertices <- data.frame(
  Latitude = c(-19.9000, -19.9009, -19.9000, -19.9009),
  Longitude = c(-40.5500, -40.5500, -40.5490, -40.5490)
)

forplot_map(
  fp_file_path = "RUS01.xlsx",
  input_type = "field_sheet",
  vertex_coords = vertices,
  voucher_imgs = "voucher_imgs",
  filename = "RUS01_mapa",
  language = "pt"
)
```

::: {data-lang="pt"}
Os vértices seguem a ordem (0, 0), (0, comprimento), (largura, 0), (largura, comprimento). As coordenadas acima são ilustrativas; use os vértices medidos da parcela.
:::
::: {data-lang="en"}
The vertices follow the order (0, 0), (0, length), (width, 0), (width, length). The coordinates above are illustrative; use the measured vertices of your plot.
:::

### [Imagens dos vouchers]{data-lang=pt}[Voucher images]{data-lang=en} {#imagens-dos-vouchers}

::: {data-lang="pt"}
`voucher_imgs` é o diretório com uma subpasta por voucher, como o criado por [`forplot_vouchers()`]({{LINK:photos}}). A correspondência ignora maiúsculas, espaços e pontuação: `GCO 123` corresponde à pasta `GCO_123`.

- Com `embed_voucher_imgs = FALSE` (padrão), as imagens são copiadas para o diretório `<filename>_vouchers`, ao lado do HTML; **os dois devem ser compartilhados juntos**.
- Com `embed_voucher_imgs = TRUE`, as imagens são incorporadas ao HTML: um único arquivo, possivelmente de tamanho elevado.
:::

::: {data-lang="en"}
`voucher_imgs` is the directory with one subfolder per voucher, such as the one created by [`forplot_vouchers()`]({{LINK:photos}}). Matching ignores case, spaces and punctuation: `GCO 123` matches the folder `GCO_123`.

- With `embed_voucher_imgs = FALSE` (default), the images are copied to a `<filename>_vouchers` directory next to the HTML; **the two must be shared together**.
- With `embed_voucher_imgs = TRUE`, the images are embedded in the HTML: a single file, possibly a large one.
:::

### [Links para o herbário]{data-lang=pt}[Herbarium links]{data-lang=en} {#links-para-o-herbario}

```{.r .rede}
forplot_map(
  fp_file_path = "RUS01.xlsx",
  input_type = "field_sheet",
  vertex_coords = "vertices.xlsx",
  voucher_imgs = "voucher_imgs",
  embed_voucher_imgs = TRUE,
  collector = "G. C. Ottino",
  herbaria_lookup = TRUE,
  herbaria = "RB",
  filename = "RUS01_mapa"
)
```

::: {data-lang="pt"}
Na primeira execução, a função obtém os arquivos Darwin Core Archive (DwC-A) do herbário no JABOT e constrói um índice local, reutilizado nas execuções seguintes (`herbaria_force_refresh = TRUE` reconstrói o índice). Esta etapa requer acesso à internet. Quando os vouchers trazem apenas a sigla do coletor, `collector_map` expande as siglas:
:::
::: {data-lang="en"}
On the first run, the function downloads the herbarium's Darwin Core Archive (DwC-A) files from JABOT and builds a local index, reused on later runs (`herbaria_force_refresh = TRUE` rebuilds it). This step requires internet access. When vouchers carry only the collector's initials, `collector_map` expands them:
:::

```r
collector_map = c(
  "DC" = "D. Cardoso",
  "PWM" = "P. W. Moonlight"
)
```

### [Programa Monitora]{data-lang=pt}[Monitora Program]{data-lang=en} {#monitora}

::: {data-lang="pt"}
Um ponto central por estação, como lista nomeada, `data.frame` com uma linha por estação ou `data.frame` com coluna de estação:
:::
::: {data-lang="en"}
One centre point per station, as a named list, a `data.frame` with one row per station or a `data.frame` with a station column:
:::

```{.r .offline}
data(TUM)
openxlsx::write.xlsx(TUM, "TUM.xlsx")

forplot_map(
  fp_file_path = "TUM.xlsx",
  input_type = "monitora",
  vertex_coords = list(
    "EA-1" = c(lat = 1.50, lon = -52.50),
    "EA-2" = c(lat = 1.52, lon = -52.48)
  ),
  station_name = c("EA-1", "EA-2"),
  filename = "TUM_mapa"
)
```

::: {data-lang="pt"}
As estações do `TUM` são `EA-1`, `EA-2` e `EA-3`. Os pontos centrais acima são aproximados, só para ilustração; use os pontos medidos em campo.
:::
::: {data-lang="en"}
The `TUM` stations are `EA-1`, `EA-2` and `EA-3`. The centre points above are approximate, for illustration only; use the points measured in the field.
:::

## [Argumentos]{data-lang=pt}[Arguments]{data-lang=en} {#argumentos}

::: {data-lang="pt"}
| Argumento | Padrão | Descrição |
|---|---|---|
| `fp_file_path` | — | Planilha da parcela (`.xlsx`) |
| `input_type` | `"field_sheet"` | `"field_sheet"`, `"field_sheet_ti"`, `"fp_query_sheet"` ou `"monitora"` |
| `vertex_coords` | — | Quatro vértices (ForestPlots.net) ou ponto central (Monitora) |
| `plot_size`, `subplot_size` | `1`, `10` | Área (ha) e lado da subparcela (m) |
| `plot_width_m`, `plot_length_m` | `NULL` | Dimensões, para parcelas retangulares |
| `voucher_imgs` | `NULL` | Diretório das imagens (uma subpasta por voucher) |
| `embed_voucher_imgs` | `FALSE` | Incorpora as imagens ao HTML |
| `highlight_palms` | `TRUE` | Palmeiras como categoria própria |
| `herbaria_lookup`, `herbaria` | `FALSE`, `NULL` | Links para exsicatas digitalizadas (ex.: `c("RB", "UPCB")`) |
| `herbaria_force_refresh` | `FALSE` | Reconstrói o índice local do herbário |
| `keep_herbaria_downloads` | `FALSE` | Mantém os arquivos DwC-A obtidos |
| `collector`, `collector_map` | `NULL` | Coletor padrão e expansão de siglas |
| `station_name` | `NULL` | Estação(ões) do Monitora |
| `plot_name`, `plot_code`, `team` | `NULL` | Substituem os metadados da planilha |
| `language` | `"en"` | `"pt"`, `"en"`, `"es"`, `"fr"`, `"ma"` ou `"pa"` |
| `dir` | `NULL` | Diretório de saída (padrão: diretório de trabalho) |
| `filename` | `"plot_map"` | Nome-base do arquivo |
| `colname_*` | `NULL` | Nomes de colunas diferentes do padrão |

: Argumentos de `forplot_map()`. {.arg-table}
:::

::: {data-lang="en"}
| Argument | Default | Description |
|---|---|---|
| `fp_file_path` | — | Plot spreadsheet (`.xlsx`) |
| `input_type` | `"field_sheet"` | `"field_sheet"`, `"field_sheet_ti"`, `"fp_query_sheet"` or `"monitora"` |
| `vertex_coords` | — | Four vertices (ForestPlots.net) or centre point (Monitora) |
| `plot_size`, `subplot_size` | `1`, `10` | Area (ha) and subplot side (m) |
| `plot_width_m`, `plot_length_m` | `NULL` | Dimensions, for rectangular plots |
| `voucher_imgs` | `NULL` | Image directory (one subfolder per voucher) |
| `embed_voucher_imgs` | `FALSE` | Embeds the images in the HTML |
| `highlight_palms` | `TRUE` | Palms as a separate category |
| `herbaria_lookup`, `herbaria` | `FALSE`, `NULL` | Links to digitised specimens (e.g. `c("RB", "UPCB")`) |
| `herbaria_force_refresh` | `FALSE` | Rebuilds the local herbarium index |
| `keep_herbaria_downloads` | `FALSE` | Keeps the downloaded DwC-A files |
| `collector`, `collector_map` | `NULL` | Default collector and expansion of initials |
| `station_name` | `NULL` | Monitora station(s) |
| `plot_name`, `plot_code`, `team` | `NULL` | Override the spreadsheet metadata |
| `language` | `"en"` | `"pt"`, `"en"`, `"es"`, `"fr"`, `"ma"` or `"pa"` |
| `dir` | `NULL` | Output directory (default: working directory) |
| `filename` | `"plot_map"` | Base file name |
| `colname_*` | `NULL` | Column names that differ from the default |

: Arguments of `forplot_map()`. {.arg-table}
:::

## [Saídas]{data-lang=pt}[Outputs]{data-lang=en} {#saidas}

::: {data-lang="pt"}
| Arquivo | Conteúdo |
|---|---|
| `Results_<ddMonYYYY>_<filename>.html` | Mapa interativo |
| `<filename>_vouchers/` | Imagens copiadas (apenas com `embed_voucher_imgs = FALSE` e `voucher_imgs` informado) |

: Arquivos gerados por `forplot_map()`. {.arg-table}

Mapas produzidos nos estudos de caso do manuscrito: [Mata Atlântica, REBIO Augusto Ruschi](https://html-rainfor-forplotr.pages.dev/) e [Amazônia, PARNA Montanhas do Tumucumaque](https://html-monitora-forplotr.pages.dev/).
:::

::: {data-lang="en"}
| File | Content |
|---|---|
| `Results_<ddMonYYYY>_<filename>.html` | Interactive map |
| `<filename>_vouchers/` | Copied images (only with `embed_voucher_imgs = FALSE` and `voucher_imgs` given) |

: Files produced by `forplot_map()`. {.arg-table}

Maps produced for the case studies of the manuscript: [Atlantic Forest, REBIO Augusto Ruschi](https://html-rainfor-forplotr.pages.dev/) and [Amazonia, PARNA Montanhas do Tumucumaque](https://html-monitora-forplotr.pages.dev/).
:::
