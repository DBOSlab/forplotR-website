::: {.note}
[[Função introduzida na versão atual]{data-lang=pt}[Introduced in the current version]{data-lang=en}]{.note-title}

[`forplot_crossdet()` não existia nas versões anteriores do pacote.]{data-lang=pt}[`forplot_crossdet()` did not exist in earlier versions of the package.]{data-lang=en}
:::


## [Finalidade]{data-lang=pt}[Purpose]{data-lang=en} {#finalidade}

::: {data-lang="pt"}
Após o tombamento dos vouchers, as determinações podem ser alteradas no herbário, por exemplo quando um especialista revisa um espécime ou corrige um gênero. `forplot_crossdet()` identifica os casos em que a planilha da parcela e o herbário registram determinações diferentes, concentrando a atenção nos registros que requerem revisão taxonômica.

A comparação é feita com **um herbário por vez** (por exemplo, `herbaria = "RB"`), a partir dos arquivos Darwin Core Archive (DwC-A) publicados pelo [JABOT](https://jabot.jbrj.gov.br/), sistema de gestão de coleções botânicas que dá acesso aos registros de espécimes e dados associados.
:::

::: {data-lang="en"}
After vouchers are accessioned, determinations may change in the herbarium, for instance when a specialist revises a specimen or corrects a genus. `forplot_crossdet()` identifies cases in which the plot spreadsheet and the herbarium record different determinations, focusing attention on the records that need taxonomic review.

The comparison is made against **one herbarium at a time** (for example, `herbaria = "RB"`), from the Darwin Core Archive (DwC-A) files published by [JABOT](https://jabot.jbrj.gov.br/), the botanical collection management system that gives access to specimen records and associated data.
:::

## [Método]{data-lang=pt}[Method]{data-lang=en} {#metodo}

::: {data-lang="pt"}
1. A planilha da parcela é lida e convertida para o formato interno comum do pacote.
2. O coletor e o número de cada voucher são extraídos e normalizados, de modo que diferenças de espaçamento, pontuação e maiúsculas não impeçam a correspondência.
3. Os registros do herbário são lidos de arquivos `occurrence.txt` locais (`path`) ou obtidos automaticamente do JABOT e mantidos em cache.
4. Os registros são carregados em um banco DuckDB e associados aos vouchers pela chave coletor + número.
5. Os nomes de ambos os lados são padronizados antes da comparação: o autor é desconsiderado; determinações apenas em família tornam-se `Indet indet`; apenas em gênero (`Inga`, `Inga indet`), `Inga indet`; qualificadores como `cf.`, `aff.`, `subsp.` e `var.` são mantidos.
6. Cada par recebe uma classe diagnóstica.

Após a primeira obtenção dos dados, o processamento não requer conexão.
:::

::: {data-lang="en"}
1. The plot spreadsheet is read and converted to the package's common internal format.
2. The collector and number of each voucher are extracted and normalised, so that differences in spacing, punctuation and case do not prevent a match.
3. Herbarium records are read from local `occurrence.txt` files (`path`) or downloaded automatically from JABOT and cached.
4. The records are loaded into a DuckDB database and joined to the vouchers on the collector + number key.
5. Names on both sides are standardised before comparison: authorship is ignored; family-only determinations become `Indet indet`; genus-only ones (`Inga`, `Inga indet`) become `Inga indet`; qualifiers such as `cf.`, `aff.`, `subsp.` and `var.` are kept.
6. Each pair is assigned a diagnostic class.

Once the data have been downloaded, processing works offline.
:::

## [Classes diagnósticas]{data-lang=pt}[Diagnostic classes]{data-lang=en} {#classes-diagnosticas}

::: {data-lang="pt"}
| Classe | Significado | Ação sugerida |
|---|---|---|
| `same_determination` | Parcela e herbário concordam | Nenhuma |
| `different_determination` | Determinações divergentes | Verificar qual determinação é a mais recente e corrigir a planilha ou comunicar o herbário |
| `inventory_indet_herbarium_det` | Indeterminado na parcela, determinado no herbário | Atualizar a planilha da parcela |
| `inventory_det_herbarium_indet` | Determinado na parcela, indeterminado no herbário | Comunicar a determinação ao herbário |

: Classes diagnósticas de `forplot_crossdet()`. {.arg-table}
:::

::: {data-lang="en"}
| Class | Meaning | Suggested action |
|---|---|---|
| `same_determination` | Plot and herbarium agree | None |
| `different_determination` | Conflicting determinations | Check which determination is more recent and correct the spreadsheet or notify the herbarium |
| `inventory_indet_herbarium_det` | Indeterminate in the plot, determined in the herbarium | Update the plot spreadsheet |
| `inventory_det_herbarium_indet` | Determined in the plot, indeterminate in the herbarium | Report the determination to the herbarium |

: Diagnostic classes of `forplot_crossdet()`. {.arg-table}
:::

## [Uso básico]{data-lang=pt}[Basic usage]{data-lang=en} {#uso-basico}

```{.r .rede}
library(forplotR)

data(RUS01)
openxlsx::write.xlsx(RUS01, "RUS01.xlsx")

res <- forplot_crossdet(
  fp_file_path = "RUS01.xlsx",
  input_type = "field_sheet",
  herbaria = "RB",
  collector_fallback = "G. Ottino"
)

res$diagnostics
res$matches
res$unmatched_inventory
```

::: {data-lang="pt"}
`res$diagnostics` resume as classes; `res$matches` lista os pares que requerem revisão; `res$unmatched_inventory`, os vouchers não encontrados no herbário. `collector_fallback` é o coletor atribuído quando a planilha traz apenas o número do voucher. Se os vouchers usam siglas (`DC1234`), elas são informadas em `collector_codes`:
:::
::: {data-lang="en"}
`res$diagnostics` summarises the classes; `res$matches` lists the pairs that need review; `res$unmatched_inventory`, the vouchers not found in the herbarium. `collector_fallback` is the collector assigned when the spreadsheet holds only the voucher number. If vouchers use initials (`DC1234`), these are given in `collector_codes`:
:::

```r
collector_codes = c(
  "DC" = "D. Cardoso",
  "GCO" = "G. C. Ottino"
)
```

### [Programa Monitora]{data-lang=pt}[Monitora Program]{data-lang=en} {#monitora}

```{.r .rede}
data(TUM)
openxlsx::write.xlsx(TUM, "TUM.xlsx")

forplot_crossdet(
  fp_file_path = "TUM.xlsx",
  input_type = "monitora",
  herbaria = "RB",
  station_name = 1,
  collector_fallback = "H. Medeiros",
  verbose = TRUE
)
```

### [Arquivo do herbário obtido previamente]{data-lang=pt}[Previously downloaded herbarium archive]{data-lang=en} {#arquivo-local}

::: {data-lang="pt"}
`path` aponta para os diretórios com `occurrence.txt`, e `dbdir` grava o banco DuckDB em disco:
:::
::: {data-lang="en"}
`path` points to the directories containing `occurrence.txt`, and `dbdir` writes the DuckDB database to disk:
:::

```{.r .rede}
forplot_crossdet(
  fp_file_path = "RUS01.xlsx",
  herbaria = "RB",
  path = "dwca/",
  dbdir = "jabot_rb.duckdb"
)
```

::: {data-lang="pt"}
Use `force_refresh = TRUE` para obter novamente o arquivo do JABOT (por exemplo, após uma atualização extensa do herbário).
:::
::: {data-lang="en"}
Use `force_refresh = TRUE` to download the JABOT archive again (for example, after an extensive herbarium update).
:::

## [Argumentos]{data-lang=pt}[Arguments]{data-lang=en} {#argumentos}

::: {data-lang="pt"}
| Argumento | Padrão | Descrição |
|---|---|---|
| `fp_file_path` | — | Planilha da parcela |
| `input_type` | `"field_sheet"` | `"field_sheet"`, `"fp_query_sheet"` ou `"monitora"` |
| `herbaria` | — | Sigla de **um** herbário no JABOT, ex.: `"RB"` |
| `collector_fallback` | `NULL` | Coletor atribuído quando o voucher tem apenas o número |
| `collector_codes` | `NULL` | Correspondência entre siglas e nomes de coletores |
| `station_name` | `NULL` | Estação do Monitora |
| `sheet` | `NULL` | Aba da planilha |
| `path` | `NULL` | Diretório com os DwC-A locais (`occurrence.txt`) |
| `only_collected` | `TRUE` | Considera apenas indivíduos coletados ou com voucher |
| `save` | `TRUE` | Grava a planilha de resultados |
| `dir`, `filename` | `"crossdet_plot"` | Diretório e nome do arquivo |
| `dbdir` | `NULL` | Arquivo DuckDB (`NULL` = em memória ou no cache do pacote) |
| `force_refresh` | `FALSE` | Obtém novamente o DwC-A |
| `verbose` | `FALSE` | Exibe o andamento |
| `resource_map` | `NULL` | Define o recurso IPT do herbário (nomes no formato `"RB::jabot"`) |

: Argumentos de `forplot_crossdet()`. {.arg-table}
:::

::: {data-lang="en"}
| Argument | Default | Description |
|---|---|---|
| `fp_file_path` | — | Plot spreadsheet |
| `input_type` | `"field_sheet"` | `"field_sheet"`, `"fp_query_sheet"` or `"monitora"` |
| `herbaria` | — | Acronym of **one** JABOT herbarium, e.g. `"RB"` |
| `collector_fallback` | `NULL` | Collector assigned when the voucher has a number only |
| `collector_codes` | `NULL` | Correspondence between initials and collector names |
| `station_name` | `NULL` | Monitora station |
| `sheet` | `NULL` | Spreadsheet sheet |
| `path` | `NULL` | Directory with local DwC-A files (`occurrence.txt`) |
| `only_collected` | `TRUE` | Considers only collected individuals or those with a voucher |
| `save` | `TRUE` | Writes the results workbook |
| `dir`, `filename` | `"crossdet_plot"` | Directory and file name |
| `dbdir` | `NULL` | DuckDB file (`NULL` = in memory or in the package cache) |
| `force_refresh` | `FALSE` | Downloads the DwC-A again |
| `verbose` | `FALSE` | Prints progress |
| `resource_map` | `NULL` | Sets the herbarium IPT resource (names as `"RB::jabot"`) |

: Arguments of `forplot_crossdet()`. {.arg-table}
:::

## [Saídas]{data-lang=pt}[Outputs]{data-lang=en} {#saidas}

::: {data-lang="pt"}
A função retorna uma lista com três tabelas e, com `save = TRUE`, grava as três em uma única planilha:

| Aba em `crossdet_plot/crossdet_plot.xlsx` | Elemento da lista | Conteúdo |
|---|---|---|
| `Matches` | `matches` | Uma linha por voucher encontrado que requer revisão; os casos `same_determination` não são incluídos |
| `Diagnostics` | `diagnostics` | Contagem e descrição de cada classe |
| `Unmatched_inventory` | `unmatched_inventory` | Vouchers da parcela não encontrados no herbário |

: Saídas de `forplot_crossdet()`. {.arg-table}
:::

::: {data-lang="en"}
The function returns a list of three tables and, with `save = TRUE`, writes all three to a single workbook:

| Sheet in `crossdet_plot/crossdet_plot.xlsx` | List element | Content |
|---|---|---|
| `Matches` | `matches` | One row per matched voucher that needs review; `same_determination` cases are not included |
| `Diagnostics` | `diagnostics` | Count and description of each class |
| `Unmatched_inventory` | `unmatched_inventory` | Plot vouchers not found in the herbarium |

: Outputs of `forplot_crossdet()`. {.arg-table}
:::

::: {.note}
[[Vouchers não encontrados]{data-lang=pt}[Unmatched vouchers]{data-lang=en}]{.note-title}

::: {data-lang="pt"}
Um voucher em `Unmatched_inventory` pode ainda não ter sido tombado, estar depositado em outro herbário ou ter coletor e número registrados de forma não reconhecida pela normalização. Recomenda-se verificação manual antes de concluir que o espécime está ausente do herbário.
:::
::: {data-lang="en"}
A voucher in `Unmatched_inventory` may not have been accessioned yet, may be deposited in another herbarium, or may have its collector and number recorded in a form the normalisation does not recognise. Check manually before concluding that the specimen is missing from the herbarium.
:::
:::
