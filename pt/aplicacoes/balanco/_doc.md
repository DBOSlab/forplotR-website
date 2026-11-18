::: {.note}
[[Nome anterior]{data-lang=pt}[Former name]{data-lang=en}]{.note-title}

::: {data-lang="pt"}
Esta função se chamava `plot_for_balance()`. O cálculo de biomassa (`calc_agb`) presente na versão anterior **foi removido**; a função concentra-se no balanço de coleta.
:::
::: {data-lang="en"}
This function was previously called `plot_for_balance()`. The biomass calculation (`calc_agb`) of the earlier version **has been removed**; the function now focuses on the collection balance.
:::
:::


## [Descrição]{data-lang=pt}[Description]{data-lang=en} {#descricao}

::: {data-lang="pt"}
`forplot_balance()` gera um relatório que sintetiza a estrutura da parcela, a composição de espécies e a cobertura de vouchers, servindo como instrumento de planejamento das campanhas de campo. A função lê a planilha da parcela, padroniza colunas, coordenadas e diâmetros, calcula a posição de cada indivíduo e produz:

1. o **mapa geral** da parcela, com os indivíduos classificados pela situação de coleta (coletado, não coletado e, opcionalmente, palmeiras em categoria própria);
2. um **mapa por subparcela** (ou braço da cruz-de-malta), com o tamanho do símbolo proporcional ao diâmetro;
3. as **subparcelas prioritárias**, que concentram espécies ainda sem coleta;
4. o **checklist** por família, ligado às plaquetas e à situação de coleta;
5. a **florística e fitossociologia** da parcela (Mueller-Dombois & Ellenberg 1974, com a subparcela como unidade amostral): riqueza de espécies, gêneros e famílias, densidade e área basal por hectare, índices de Shannon (H′), Simpson (1 − D) e Pielou (J′), famílias e espécies com maior valor de importância (IVI = densidade + frequência + dominância relativas), fustes por classe de diâmetro e as tabelas completas de parâmetros de todas as famílias e espécies;
6. o **relatório de campo** em HTML, que se imprime em PDF com uma página A4 por subparcela, e a **planilha de balanço** em XLSX.

A situação de coleta é lida da coluna `Collected` (ou equivalente). Valores como `Sim`, `Yes`, `Coletado`, `1` ou `x` são interpretados como coletado.

Em dados com vários censos, o relatório pode ser regenerado após cada campanha, incorporando novas identificações, coletas e informações do censo.
:::

::: {data-lang="en"}
`forplot_balance()` produces a report summarising plot structure, species composition and voucher coverage, intended as a planning instrument for field campaigns. The function reads the plot spreadsheet, standardises columns, coordinates and diameters, computes the position of each individual and produces:

1. the **overall plot map**, with individuals classified by collection status (collected, not collected and, optionally, palms as a separate category);
2. a **map per subplot** (or maltese-cross arm), with symbol size proportional to diameter;
3. the **priority subplots**, where species still lacking collections are concentrated;
4. the **checklist** by family, linked to tags and collection status;
5. the **floristics and phytosociology** of the plot (Mueller-Dombois & Ellenberg 1974, with the subplot as the sampling unit): species, genus and family richness, density and basal area per hectare, Shannon (H′), Simpson (1 − D) and Pielou (J′) indices, the families and species with the highest importance value (IVI = relative density + frequency + dominance), stems per diameter class and the full tables of parameters of every family and species;
6. the **field report** in HTML, which prints to PDF with one A4 page per subplot, and the **balance spreadsheet** in XLSX.

Collection status is read from the `Collected` column (or equivalent). Values such as `Sim`, `Yes`, `Coletado`, `1` or `x` are interpreted as collected.

For data with several censuses, the report can be regenerated after each campaign, incorporating new identifications, collections and census information.
:::

## [Uso básico]{data-lang=pt}[Basic usage]{data-lang=en} {#uso-basico}

```{.r .offline}
library(forplotR)

data(RUS01)
openxlsx::write.xlsx(RUS01, "RUS01.xlsx")

forplot_balance(
  fp_file_path = "RUS01.xlsx",
  input_type = "field_sheet",
  plot_size = 1,
  subplot_size = 10,
  highlight_palms = TRUE,
  language = "pt",
  dir = "Results_map_plot",
  filename = "RUS01"
)
```

### [Parcela retangular]{data-lang=pt}[Rectangular plot]{data-lang=en} {#parcela-retangular}

::: {data-lang="pt"}
Para parcelas não quadradas, as dimensões são informadas em metros. Se apenas uma delas for informada, a outra é calculada a partir de `plot_size`:
:::
::: {data-lang="en"}
For non-square plots, dimensions are given in metres. If only one of them is given, the other is computed from `plot_size`:
:::

```{.r .offline}
forplot_balance(
  fp_file_path = "parcela_meio_hectare.xlsx",
  input_type = "field_sheet",
  plot_size = 0.5,
  plot_width_m = 50,
  plot_length_m = 100,
  subplot_size = 10
)
```

### [Exportação da Query Library]{data-lang=pt}[Query Library export]{data-lang=en} {#query-library}

::: {data-lang="pt"}
O argumento `plot_census_no` é opcional e substitui o número do censo lido do arquivo.
:::
::: {data-lang="en"}
The `plot_census_no` argument is optional and overrides the census number read from the file.
:::

```{.r .offline}
forplot_balance(
  fp_file_path = "query_export.xlsx",
  input_type = "fp_query_sheet",
  plot_census_no = "3"
)
```

### [Programa Monitora]{data-lang=pt}[Monitora Program]{data-lang=en} {#monitora}

::: {data-lang="pt"}
No Monitora, a geometria em cruz-de-malta é calculada pela própria função; `plot_size`, `plot_width_m` e `plot_length_m` são ignorados. A estação é indicada pelo nome ou pelo número. Com mais de uma estação, é gerado um relatório por estação, com o sufixo `_station_<estação>` no nome dos arquivos:
:::
::: {data-lang="en"}
For Monitora, the maltese-cross geometry is computed by the function itself; `plot_size`, `plot_width_m` and `plot_length_m` are ignored. The station is given by name or number. With more than one station, one report is produced per station, with the suffix `_station_<station>` in the file names:
:::

```{.r .offline}
data(TUM)
openxlsx::write.xlsx(TUM, "TUM.xlsx")

forplot_balance(
  fp_file_path = "TUM.xlsx",
  input_type = "monitora",
  station_name = c("EA-1", "EA-2"),
  language = "pt"
)
```

## [Argumentos]{data-lang=pt}[Arguments]{data-lang=en} {#argumentos}

::: {data-lang="pt"}
| Argumento | Padrão | Descrição |
|---|---|---|
| `fp_file_path` | — | Caminho do arquivo `.xlsx` |
| `input_type` | `"field_sheet"` | `"field_sheet"`, `"field_sheet_ti"`, `"fp_query_sheet"` ou `"monitora"` |
| `language` | `"en"` | `"pt"`, `"en"`, `"es"`, `"fr"`, `"ma"` (mandarim) ou `"pa"` (panará) |
| `plot_size` | `1` | Área da parcela, em hectares |
| `subplot_size` | `10` | Lado da subparcela, em metros |
| `plot_width_m`, `plot_length_m` | `NULL` | Dimensões, em metros (parcelas retangulares) |
| `highlight_palms` | `TRUE` | Representa as Arecaceae como categoria própria |
| `station_name` | `NULL` | Estação(ões) do Monitora |
| `plot_name`, `plot_code`, `team` | `NULL` | Substituem nome, código e equipe lidos da planilha |
| `plot_census_no` | `NULL` | Número do censo (padrão `"1"` quando ausente no arquivo) |
| `render_html`, `render_pdf`, `write_xlsx` | `TRUE` | Ativam ou desativam cada saída |
| `dir` | `"Results_map_plot"` | Diretório de saída; nele é criado um subdiretório datado |
| `filename` | `NULL` | Prefixo dos arquivos; sem ele, `parcela`, `plot` ou `parcelle`, conforme o idioma |
| `verbose` | `TRUE` | Exibe o andamento no console |
| `colname_*` | `NULL` | Nomes das colunas, quando diferentes do padrão (ver [Começar]({{LINK:start}}#mapeamento-de-colunas)) |

: Argumentos de `forplot_balance()`. {.arg-table}
:::

::: {data-lang="en"}
| Argument | Default | Description |
|---|---|---|
| `fp_file_path` | — | Path to the `.xlsx` file |
| `input_type` | `"field_sheet"` | `"field_sheet"`, `"field_sheet_ti"`, `"fp_query_sheet"` or `"monitora"` |
| `language` | `"en"` | `"pt"`, `"en"`, `"es"`, `"fr"`, `"ma"` (Mandarin) or `"pa"` (Panará) |
| `plot_size` | `1` | Plot area, in hectares |
| `subplot_size` | `10` | Subplot side, in metres |
| `plot_width_m`, `plot_length_m` | `NULL` | Dimensions, in metres (rectangular plots) |
| `highlight_palms` | `TRUE` | Shows Arecaceae as a separate category |
| `station_name` | `NULL` | Monitora station(s) |
| `plot_name`, `plot_code`, `team` | `NULL` | Override the name, code and team read from the spreadsheet |
| `plot_census_no` | `NULL` | Census number (defaults to `"1"` when missing from the file) |
| `render_html`, `render_pdf`, `write_xlsx` | `TRUE` | Enable or disable each output |
| `dir` | `"Results_map_plot"` | Output directory; a date-stamped subdirectory is created inside it |
| `filename` | `NULL` | File name prefix; without it, `plot`, `parcela` or `parcelle`, by language |
| `verbose` | `TRUE` | Prints progress to the console |
| `colname_*` | `NULL` | Column names, when different from the default (see [Get started]({{LINK:start}}#mapeamento-de-colunas)) |

: Arguments of `forplot_balance()`. {.arg-table}
:::

## [Saídas]{data-lang=pt}[Outputs]{data-lang=en} {#saidas}

::: {data-lang="pt"}
Os arquivos são gravados em `dir/<ddMonYYYY>/` e o nome segue o idioma (`language`): português com `"pt"` e `"pa"` (Panará), inglês com `"en"` e `"ma"`, espanhol com `"es"` e francês com `"fr"`. O prefixo é `filename`; sem ele, `parcela` (pt, pa, es), `plot` (en, ma) ou `parcelle` (fr). Com `filename = "RUS01"` e `language = "pt"`:

| Arquivo | Conteúdo |
|---|---|
| `RUS01_relatorio_completo.html` | Relatório de campo: resumo, mapas com a plaqueta de cada fuste, rota de prioridade, uma página por subparcela, florística e checklist |
| `RUS01_relatorio_completo.pdf` | Mesmo relatório impresso em A4 (requer Chrome, Chromium ou Edge) |
| `RUS01_geral.png` | Mapa geral da parcela |
| `RUS01_coletados.png`, `RUS01_nao_coletados.png` | Apenas coletados / apenas não coletados |
| `RUS01_palmeiras_nao_coletadas.png` | Palmeiras (com `highlight_palms = TRUE`) |
| `RUS01_especies_prioritarias_nao_coletadas.png` | Subparcelas prioritárias |
| `RUS01_especies_abundancia.png` | Espécies com mais indivíduos |
| `RUS01_especies_ivi.png`, `RUS01_familias_ivi.png` | Espécies e famílias com maior valor de importância (IVI) |
| `RUS01_classes_dap.png` | Fustes por classe de diâmetro |
| `RUS01_balanco_coleta.xlsx` | Abas `COLLECTION_PERCENTUAL` (percentual por subparcela), `NOT_COLLECTED` e `COLLECTED` |

: Arquivos gerados por `forplot_balance()`. {.arg-table}
:::

::: {data-lang="en"}
Files are written to `dir/<ddMonYYYY>/` and named in the report language (`language`): Portuguese for `"pt"` and `"pa"` (Panará), English for `"en"` and `"ma"`, Spanish for `"es"` and French for `"fr"`. The prefix is `filename`; without it, `plot` (en, ma), `parcela` (pt, pa, es) or `parcelle` (fr). With `filename = "RUS01"` and `language = "en"`:

| File | Content |
|---|---|
| `RUS01_full_report.html` | Field report: summary, maps with the tag of every stem, priority route, one page per subplot, floristics and checklist |
| `RUS01_full_report.pdf` | Same report printed on A4 (requires Chrome, Chromium or Edge) |
| `RUS01_general.png` | Overall plot map |
| `RUS01_collected.png`, `RUS01_uncollected.png` | Collected only / not collected only |
| `RUS01_uncollected_palms.png` | Palms (with `highlight_palms = TRUE`) |
| `RUS01_priority_uncollected_species.png` | Priority subplots |
| `RUS01_species_abundance.png` | Species with the most individuals |
| `RUS01_species_ivi.png`, `RUS01_families_ivi.png` | Species and families with the highest importance value (IVI) |
| `RUS01_dbh_classes.png` | Stems per diameter class |
| `RUS01_collection_balance.xlsx` | Sheets `COLLECTION_PERCENTUAL` (percentage per subplot), `NOT_COLLECTED` and `COLLECTED` |

: Files produced by `forplot_balance()`. {.arg-table}
:::

::: {.note}
[[Formatos de entrada]{data-lang=pt}[Input layouts]{data-lang=en}]{.note-title}

::: {data-lang="pt"}
A planilha de balanço (`*_balanco_coleta.xlsx`, `*_collection_balance.xlsx` em inglês) é gerada para os formatos ForestPlots.net (`field_sheet`, `field_sheet_ti`, `fp_query_sheet`). No Monitora, o balanço é apresentado no relatório.
:::
::: {data-lang="en"}
The balance spreadsheet (`*_collection_balance.xlsx`; `*_balanco_coleta.xlsx` in Portuguese) is produced for the ForestPlots.net layouts (`field_sheet`, `field_sheet_ti`, `fp_query_sheet`). For Monitora, the balance is shown in the report.
:::
:::

## [Problemas comuns]{data-lang=pt}[Common problems]{data-lang=en} {#problemas-comuns}

::: {data-lang="pt"}
- **O PDF não foi gerado.** Não há distribuição LaTeX disponível. Instale o TinyTeX (ver [Começar]({{LINK:start}}#instalacao)) ou use `render_pdf = FALSE`. Relatórios em mandarim usam o motor `xelatex` com o pacote `ctex`.
- **Indivíduos fora dos limites da parcela no mapa.** Verifique `plot_size`, `subplot_size` e as dimensões; a numeração das subparcelas segue o padrão ForestPlots.net (em ziguezague por colunas).
- **Nenhum indivíduo aparece como coletado.** Verifique a coluna de situação de coleta ou indique-a com `colname_collected`.
:::

::: {data-lang="en"}
- **The PDF was not produced.** No LaTeX distribution is available. Install TinyTeX (see [Get started]({{LINK:start}}#instalacao)) or use `render_pdf = FALSE`. Mandarin reports use the `xelatex` engine with the `ctex` package.
- **Individuals outside the plot boundary on the map.** Check `plot_size`, `subplot_size` and the dimensions; subplot numbering follows the ForestPlots.net convention (zigzag by columns).
- **No individual appears as collected.** Check the collection status column or declare it with `colname_collected`.
:::
