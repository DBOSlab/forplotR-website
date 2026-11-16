::: {.note}
[[Nome anterior]{data-lang=pt}[Former name]{data-lang=en}]{.note-title}

[Esta função se chamava `mk_voucher_dirs()`.]{data-lang=pt}[This function was previously called `mk_voucher_dirs()`.]{data-lang=en}
:::


## [Descrição]{data-lang=pt}[Description]{data-lang=en} {#descricao}

::: {data-lang="pt"}
Cada indivíduo coletado em campo costuma ser documentado por várias fotografias (hábito, folhas, flores, casca). `forplot_vouchers()` cria, a partir da tabela do censo, um diretório para cada indivíduo coletado, organizado pela determinação atual. A estrutura reproduz a organização taxonômica do inventário:
:::
::: {data-lang="en"}
Each individual collected in the field is usually documented by several photographs (habit, leaves, flowers, bark). From the census table, `forplot_vouchers()` creates one directory per collected individual, organised by its current determination. The structure mirrors the taxonomic organisation of the inventory:
:::

```
voucher_imgs/
└── Lauraceae/
    └── Ocotea/
        └── GCO1004_Tree#4/
```

::: {data-lang="pt"}
O nome do diretório combina o código do voucher e a plaqueta (`<voucher>_Tree#<plaqueta>`; espaços são substituídos por `_` e pontos são removidos). Se o indivíduo foi coletado mas não tem código de voucher, o diretório recebe apenas `Tree#<plaqueta>`. Indivíduos sem família ou gênero na planilha são omitidos e listados no resumo do console.

As fotografias são colocadas diretamente nos diretórios terminais; não há convenção obrigatória de nome ou formato de arquivo. A função foi projetada para **execuções repetidas**:

- **Na primeira execução**, cria o diretório principal (`output_dir`) e a estrutura Família/Gênero/Voucher para cada indivíduo coletado; não requer imagens como entrada.
- **Nas execuções seguintes**, compara os diretórios existentes com as determinações atuais da planilha. Um voucher que está em um gênero anterior é **movido** para a posição atualizada. Se o diretório de destino já contém arquivos, nada é sobrescrito: apenas os arquivos ausentes são movidos. Diretórios que ficam vazios são removidos.

Assim, o arquivo de imagens permanece consistente com as identificações correntes ao longo das revisões taxonômicas.
:::

::: {data-lang="en"}
The directory name combines the voucher code and the tag (`<voucher>_Tree#<tag>`; spaces are replaced by `_` and full stops are removed). If the individual was collected but has no voucher code, the directory is named `Tree#<tag>` only. Individuals without family or genus in the spreadsheet are skipped and listed in the console summary.

Photographs go directly into the terminal directories; there is no required file naming or format convention. The function is designed for **repeated runs**:

- **On the first run**, it creates the main directory (`output_dir`) and the Family/Genus/Voucher structure for every collected individual; no images are needed as input.
- **On later runs**, it compares the existing directories with the current determinations in the spreadsheet. A voucher filed under a previous genus is **moved** to its updated position. If the destination directory already contains files, nothing is overwritten: only missing files are moved. Directories left empty are removed.

The image archive thus stays consistent with current identifications throughout taxonomic revisions.
:::


## [Critério de coleta]{data-lang=pt}[Collection criterion]{data-lang=en} {#criterio-de-coleta}

::: {data-lang="pt"}
Um indivíduo recebe diretório quando a coluna de situação de coleta indica coleta: `Sim`, `Yes`, `Collected`, `Coletado`, `1`, `x` e variações. Se essa coluna estiver vazia mas houver código de voucher, o indivíduo também é considerado coletado, exceto quando a coluna indica explicitamente o contrário.
:::
::: {data-lang="en"}
An individual gets a directory when the collection status column indicates collection: `Sim`, `Yes`, `Collected`, `Coletado`, `1`, `x` and variants. If that column is empty but there is a voucher code, the individual is also treated as collected, unless the column explicitly says otherwise.
:::

## [Uso básico]{data-lang=pt}[Basic usage]{data-lang=en} {#uso-basico}

::: {data-lang="pt"}
```{.r .offline}
library(forplotR)

data(RUS01)
openxlsx::write.xlsx(RUS01, "RUS01.xlsx")

forplot_vouchers(
  fp_file_path = "RUS01.xlsx",
  input_type = "field_sheet",
  output_dir = "voucher_imgs"
)

# Após copiar as imagens e revisar as determinações na planilha,
# a mesma chamada reorganiza os diretórios alterados:
forplot_vouchers(
  fp_file_path = "RUS01.xlsx",
  input_type = "field_sheet",
  output_dir = "voucher_imgs"
)
```

Outros formatos de entrada:

```{.r .offline}
# Ficha de Terra Indígena
forplot_vouchers(
  fp_file_path = "SKR_01.xlsx",
  input_type = "field_sheet_ti",
  output_dir = "voucher_imgs_skr"
)

# Exportação da Query Library
forplot_vouchers(
  fp_file_path = "query_export.xlsx",
  input_type = "fp_query_sheet"
)

# Programa Monitora, uma estação
forplot_vouchers(
  fp_file_path = "TUM.xlsx",
  input_type = "monitora",
  station_name = 1,
  output_dir = "voucher_imgs_tum"
)
```
:::

::: {data-lang="en"}
```{.r .offline}
library(forplotR)

data(RUS01)
openxlsx::write.xlsx(RUS01, "RUS01.xlsx")

forplot_vouchers(
  fp_file_path = "RUS01.xlsx",
  input_type = "field_sheet",
  output_dir = "voucher_imgs"
)

# After copying the images and revising determinations in the spreadsheet,
# the same call reorganises the directories that changed:
forplot_vouchers(
  fp_file_path = "RUS01.xlsx",
  input_type = "field_sheet",
  output_dir = "voucher_imgs"
)
```

Other input layouts:

```{.r .offline}
# Indigenous Land field sheet
forplot_vouchers(
  fp_file_path = "SKR_01.xlsx",
  input_type = "field_sheet_ti",
  output_dir = "voucher_imgs_skr"
)

# Query Library export
forplot_vouchers(
  fp_file_path = "query_export.xlsx",
  input_type = "fp_query_sheet"
)

# Monitora Program, one station
forplot_vouchers(
  fp_file_path = "TUM.xlsx",
  input_type = "monitora",
  station_name = 1,
  output_dir = "voucher_imgs_tum"
)
```
:::

## [Argumentos]{data-lang=pt}[Arguments]{data-lang=en} {#argumentos}

::: {data-lang="pt"}
| Argumento | Padrão | Descrição |
|---|---|---|
| `fp_file_path` | — | Planilha da parcela |
| `output_dir` | `"voucher_imgs"` | Diretório principal das imagens |
| `input_type` | `"field_sheet"` | `"field_sheet"`, `"field_sheet_ti"`, `"fp_query_sheet"` ou `"monitora"` |
| `station_name` | `NULL` | Estação do Monitora |
| `verbose` | `TRUE` | Exibe cada diretório criado ou movido |

: Argumentos de `forplot_vouchers()`. {.arg-table}

A função retorna, de forma invisível, a tabela padronizada usada para construir os diretórios.
:::

::: {data-lang="en"}
| Argument | Default | Description |
|---|---|---|
| `fp_file_path` | — | Plot spreadsheet |
| `output_dir` | `"voucher_imgs"` | Main image directory |
| `input_type` | `"field_sheet"` | `"field_sheet"`, `"field_sheet_ti"`, `"fp_query_sheet"` or `"monitora"` |
| `station_name` | `NULL` | Monitora station |
| `verbose` | `TRUE` | Prints each directory created or moved |

: Arguments of `forplot_vouchers()`. {.arg-table}

The function invisibly returns the standardised table used to build the directories.
:::

## [Relação com `forplot_map()`]{data-lang=pt}[Relation to `forplot_map()`]{data-lang=en} {#relacao-com-forplot-map}

::: {data-lang="pt"}
O diretório criado por esta função é o que [`forplot_map()`]({{LINK:map}}) recebe em `voucher_imgs`. Após a inclusão das imagens, o mapa apresenta um carrossel de imagens na janela de cada indivíduo.
:::
::: {data-lang="en"}
The directory created by this function is what [`forplot_map()`]({{LINK:map}}) takes as `voucher_imgs`. Once the images are in place, the map shows an image carousel in the pop-up of each individual.
:::
