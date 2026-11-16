::: {.note}
[[Nome anterior]{data-lang=pt}[Former name]{data-lang=en}]{.note-title}

[Esta função se chamava `fp_herb_converter()`.]{data-lang=pt}[This function was previously called `fp_herb_converter()`.]{data-lang=en}
:::


## [Descrição]{data-lang=pt}[Description]{data-lang=en} {#descricao}

::: {data-lang="pt"}
`forplot_sheets()` converte os dados do censo em uma planilha de herbário que segue um modelo definido pelo usuário (por exemplo, modelos compatíveis com os sistemas de gestão de herbário JABOT ou BRAHMS). Cada linha corresponde a um espécime e reúne as informações necessárias à etiqueta: identificação taxonômica, coletor e número, data, descrição da localidade, identificadores de parcela e subparcela, coordenadas do fuste, descrição do hábitat e notas fenológicas ou do censo. As etapas são:

1. leitura da planilha da parcela e do modelo do herbário;
2. verificação dos metadados obrigatórios (estado, município, latitude, longitude etc.);
3. no Monitora, conversão da planilha e leitura da estação, da unidade de conservação, da equipe e do ano do censo a partir das próprias colunas;
4. preenchimento dos campos de taxonomia, localidade e notas;
5. gravação de um novo `.xlsx` em subdiretório datado.

A planilha pode ser importada diretamente nas bases de dados do herbário ou usada para a impressão de etiquetas.
:::

::: {data-lang="en"}
`forplot_sheets()` converts census data into a herbarium spreadsheet that follows a user-defined template (for example, templates compatible with the JABOT or BRAHMS herbarium management systems). Each row is one specimen and holds the information needed for its label: taxonomic identification, collector and number, date, locality description, plot and subplot identifiers, stem coordinates, habitat description and phenological or census notes. The steps are:

1. reading the plot spreadsheet and the herbarium template;
2. checking the required metadata (state, municipality, latitude, longitude, etc.);
3. for Monitora, converting the spreadsheet and reading the station, protected area, team and census year from its own columns;
4. filling in the taxonomy, locality and notes fields;
5. writing a new `.xlsx` to a date-stamped subdirectory.

The spreadsheet can be imported directly into herbarium databases or used to print labels.
:::

### [Notas de etiqueta]{data-lang=pt}[Label notes]{data-lang=en} {#notas-de-etiqueta}

::: {data-lang="pt"}
Os códigos do protocolo RAINFOR (condição da árvore, exposição da copa à luz) são convertidos em texto. Com o DAP, as anotações da ficha e a posição na subparcela, compõem a nota da etiqueta. Exemplo (texto ilustrativo):

> Árvore, 24,83 cm de DAP, com casca descamando, pequenas sapopemas, casca com placas avermelhadas, copa totalmente exposta à luz vertical e lateral. Indivíduo nº 3 na subparcela 1, x = 1,5 m, y = 2,5 m.

"Com casca descamando" e "copa totalmente exposta…" derivam dos códigos RAINFOR; "pequenas sapopemas" e "casca com placas avermelhadas", das anotações de campo. As notas podem ser redigidas em português, inglês ou espanhol (`language`). Com `add_census_notes = FALSE`, as notas do censo são omitidas.
:::

::: {data-lang="en"}
RAINFOR protocol codes (tree condition, crown light exposure) are converted to text. Together with DBH, the field-sheet notes and the position within the subplot, they make up the label note. Example (illustrative text):

> Tree, 24.83 cm DBH, with flaking bark, small buttresses, bark with reddish plates, crown fully exposed to vertical and lateral light. Individual no. 3 in subplot 1, x = 1.5 m, y = 2.5 m.

"With flaking bark" and "crown fully exposed…" come from the RAINFOR codes; "small buttresses" and "bark with reddish plates" from the field notes. Notes can be written in Portuguese, English or Spanish (`language`). With `add_census_notes = FALSE`, census notes are left out.
:::

## [Uso básico (JABOT)]{data-lang=pt}[Basic usage (JABOT)]{data-lang=en} {#uso-basico}

```{.r .rede}
library(forplotR)

data(RUS01)
openxlsx::write.xlsx(RUS01, "RUS01.xlsx")

forplot_sheets(
  fp_file_path = "RUS01.xlsx",
  herb_file_path = "modelo_jabot.xlsx",
  input_type = "forestplots",
  language = "pt",
  country = "Brazil",
  majorarea = "Espírito Santo",
  minorarea = "Santa Teresa",
  protectedarea = "Reserva Biológica Augusto Ruschi",
  lat = -19.9,
  long = -40.5
)
```

::: {data-lang="pt"}
O modelo do JABOT está disponível na [página de validação de planilhas do JABOT](https://rb.jbrj.gov.br/v2/validarplanilha_externo.php); a interface web usa esse mesmo modelo.

Com `validate_locality = TRUE` (padrão), a função verifica se as coordenadas estão contidas no país e no estado informados; um erro frequente é a longitude sem o sinal negativo.
:::
::: {data-lang="en"}
The JABOT template is available from the [JABOT spreadsheet validation page](https://rb.jbrj.gov.br/v2/validarplanilha_externo.php); the web interface uses the same template.

With `validate_locality = TRUE` (default), the function checks that the coordinates fall within the given country and state; a frequent mistake is a longitude missing its minus sign.
:::

### [Programa Monitora]{data-lang=pt}[Monitora Program]{data-lang=en} {#monitora}

```{.r .rede}
data(TUM)
openxlsx::write.xlsx(TUM, "TUM.xlsx")

forplot_sheets(
  fp_file_path = "TUM.xlsx",
  herb_file_path = "modelo_jabot.xlsx",
  input_type = "monitora",
  station_name = 1,
  language = "pt",
  majorarea = "Amapá",
  minorarea = "Laranjal do Jari"
)
```

::: {data-lang="pt"}
Se `protectedarea`, `project`, `collector` e `addcoll` não forem informados, a função tenta lê-los das colunas do Monitora.
:::
::: {data-lang="en"}
If `protectedarea`, `project`, `collector` and `addcoll` are not given, the function tries to read them from the Monitora columns.
:::

### [BRAHMS ou modelo próprio]{data-lang=pt}[BRAHMS or a custom template]{data-lang=en} {#brahms-ou-modelo-proprio}

::: {data-lang="pt"}
Para um modelo próprio, `column_map` indica a coluna do modelo que recebe cada campo do forplotR (ver `?forplot_sheets`).
:::
::: {data-lang="en"}
For a custom template, `column_map` states which template column receives each forplotR field (see `?forplot_sheets`).
:::

```{.r .rede}
forplot_sheets(
  fp_file_path = "RUS01.xlsx",
  herb_file_path = "modelo_brahms.xlsx",
  herbarium_format = "brahms",
  majorarea = "Espírito Santo",
  minorarea = "Santa Teresa"
)

forplot_sheets(
  fp_file_path = "RUS01.xlsx",
  herb_file_path = "modelo_meu_herbario.xlsx",
  herbarium_format = "custom",
  column_map = list()
)
```

## [Argumentos]{data-lang=pt}[Arguments]{data-lang=en} {#argumentos}

::: {data-lang="pt"}
| Argumento | Padrão | Descrição |
|---|---|---|
| `fp_file_path` | — | Planilha da parcela |
| `herb_file_path` | — | Modelo vazio da planilha do herbário |
| `input_type` | `"forestplots"` | `"forestplots"` ou `"monitora"` |
| `sheet` | `1` | Aba da planilha da parcela |
| `station_name` | `NULL` | Estação do Monitora (nome ou número) |
| `language` | `"en"` | `"pt"`, `"en"` ou `"es"` |
| `herbarium_format` | `"jabot"` | `"jabot"`, `"brahms"` ou `"custom"` |
| `column_map` | `NULL` | Lista de correspondência de colunas, para `"custom"` |
| `country`, `majorarea`, `minorarea` | `"Brazil"`, —, — | País, estado e município |
| `protectedarea`, `locnotes`, `project` | `NULL` | Unidade de conservação, notas de localidade e projeto |
| `collector`, `addcoll` | `NULL` | Coletor principal e coletores adicionais (lidos da planilha se ausentes) |
| `lat`, `long`, `alt` | `NULL` | Coordenadas em graus decimais e altitude em metros (estimada se ausente) |
| `add_census_notes` | `TRUE` | Inclui as notas do censo |
| `validate_locality` | `TRUE` | Verifica a compatibilidade entre coordenadas e divisão administrativa |
| `dir` | `"Results_herb_label"` | Diretório de saída (com subdiretório datado) |
| `filename` | `"plot_to_herb_sheet"` | Nome do arquivo |

: Argumentos de `forplot_sheets()`. {.arg-table}
:::

::: {data-lang="en"}
| Argument | Default | Description |
|---|---|---|
| `fp_file_path` | — | Plot spreadsheet |
| `herb_file_path` | — | Empty herbarium spreadsheet template |
| `input_type` | `"forestplots"` | `"forestplots"` or `"monitora"` |
| `sheet` | `1` | Sheet of the plot workbook |
| `station_name` | `NULL` | Monitora station (name or number) |
| `language` | `"en"` | `"pt"`, `"en"` or `"es"` |
| `herbarium_format` | `"jabot"` | `"jabot"`, `"brahms"` or `"custom"` |
| `column_map` | `NULL` | Column correspondence list, for `"custom"` |
| `country`, `majorarea`, `minorarea` | `"Brazil"`, —, — | Country, state and municipality |
| `protectedarea`, `locnotes`, `project` | `NULL` | Protected area, locality notes and project |
| `collector`, `addcoll` | `NULL` | Main collector and additional collectors (read from the spreadsheet if missing) |
| `lat`, `long`, `alt` | `NULL` | Coordinates in decimal degrees and elevation in metres (estimated if missing) |
| `add_census_notes` | `TRUE` | Includes the census notes |
| `validate_locality` | `TRUE` | Checks that coordinates agree with the administrative division |
| `dir` | `"Results_herb_label"` | Output directory (with a date-stamped subdirectory) |
| `filename` | `"plot_to_herb_sheet"` | File name |

: Arguments of `forplot_sheets()`. {.arg-table}
:::

## [Saídas]{data-lang=pt}[Outputs]{data-lang=en} {#saidas}

::: {data-lang="pt"}
| Arquivo | Conteúdo |
|---|---|
| `Results_herb_label/<ddMonYYYY>/plot_to_herb_sheet.xlsx` | Modelo do herbário preenchido, pronto para importação ou impressão de etiquetas |

: Arquivo gerado por `forplot_sheets()`. {.arg-table}

Após o tombamento, [`forplot_crossdet()`]({{LINK:determinations}}) compara as determinações da parcela com as do herbário.
:::

::: {data-lang="en"}
| File | Content |
|---|---|
| `Results_herb_label/<ddMonYYYY>/plot_to_herb_sheet.xlsx` | Filled herbarium template, ready for import or label printing |

: File produced by `forplot_sheets()`. {.arg-table}

After accession, [`forplot_crossdet()`]({{LINK:determinations}}) compares the plot determinations with those of the herbarium.
:::
