::: {data-lang="pt"}
Cada artigo descreve uma função: finalidade, formatos de planilha aceitos, argumentos principais, um exemplo reprodutível com os conjuntos de dados distribuídos com o pacote (`RUS01` e `TUM`) e a lista das saídas. Todas as funções também podem ser executadas pela [interface web]({{LINK:tools}}), sem instalação local.

| Artigo | Etapa do fluxo de trabalho | Conteúdo |
|---|---|---|
| [Primeiros passos]({{LINK:start}}) | Preparação | Instalação, formatos de entrada (`input_type`), mapeamento de colunas, dados de exemplo e idiomas |
| [`forplot_balance()`]({{LINK:balance}}) | Planejamento de campo | Relatório com mapas de fustes, checklist, subparcelas prioritárias e balanço de coleta |
| [`forplot_vouchers()`]({{LINK:photos}}) | Organização dos vouchers | Hierarquia Família/Gênero/Voucher para imagens, reorganizada após revisões taxonômicas |
| [`forplot_map()`]({{LINK:map}}) | Visualização espacial | Mapa Leaflet autocontido, com imagens dos vouchers e links para exsicatas digitalizadas |
| [`forplot_sheets()`]({{LINK:labels}}) | Documentação de herbário | Planilha de etiquetas nos formatos JABOT, BRAHMS ou em modelo próprio |
| [`forplot_crossdet()`]({{LINK:determinations}}) | Verificação taxonômica | Comparação das determinações do inventário com os registros de um herbário do JABOT |
| [Perguntas frequentes]({{LINK:faq}}) | — | Problemas comuns com planilhas, relatórios e mapas |
| [Novidades]({{LINK:news}}) | — | Histórico de versões e mudanças de nome das funções |

: Artigos de documentação do forplotR. {.arg-table}
:::

::: {data-lang="en"}
Each article describes one function: purpose, accepted spreadsheet layouts, main arguments, a reproducible example with the datasets shipped with the package (`RUS01` and `TUM`) and the list of outputs. Every function can also be run through the [web interface]({{LINK:tools}}), with no local installation.

| Article | Workflow step | Content |
|---|---|---|
| [Get started]({{LINK:start}}) | Preparation | Installation, input layouts (`input_type`), column mapping, example data and languages |
| [`forplot_balance()`]({{LINK:balance}}) | Field planning | Report with stem maps, checklist, priority subplots and collection balance |
| [`forplot_vouchers()`]({{LINK:photos}}) | Voucher organisation | Family/Genus/Voucher hierarchy for images, reorganised after taxonomic revisions |
| [`forplot_map()`]({{LINK:map}}) | Spatial visualisation | Self-contained Leaflet map with voucher images and links to digitised specimens |
| [`forplot_sheets()`]({{LINK:labels}}) | Herbarium documentation | Label spreadsheet in the JABOT or BRAHMS layout, or a custom template |
| [`forplot_crossdet()`]({{LINK:determinations}}) | Taxonomic verification | Comparison of inventory determinations with the records of a JABOT herbarium |
| [FAQ]({{LINK:faq}}) | — | Common problems with spreadsheets, reports and maps |
| [News]({{LINK:news}}) | — | Version history and function renamings |

: forplotR documentation articles. {.arg-table}
:::

::: {.note}
[[Nomes das funções em versões anteriores]{data-lang=pt}[Function names in earlier versions]{data-lang=en}]{.note-title}

::: {data-lang="pt"}
`plot_for_balance()` corresponde a `forplot_balance()`, `mk_voucher_dirs()` a `forplot_vouchers()`, `plot_html_map()` a `forplot_map()` e `fp_herb_converter()` a `forplot_sheets()`. A função `forplot_crossdet()` foi introduzida na versão atual. Ver [Novidades]({{LINK:news}}).
:::
::: {data-lang="en"}
`plot_for_balance()` is now `forplot_balance()`, `mk_voucher_dirs()` is `forplot_vouchers()`, `plot_html_map()` is `forplot_map()` and `fp_herb_converter()` is `forplot_sheets()`. `forplot_crossdet()` was introduced in the current version. See [News]({{LINK:news}}).
:::
:::

## [Sequência recomendada]{data-lang=pt}[Recommended sequence]{data-lang=en} {#sequencia-recomendada}

::: {data-lang="pt"}
Para uma parcela em nova campanha de campo, a sequência usual é:

1. [`forplot_balance()`]({{LINK:balance}}): avaliar a cobertura de coleta e identificar os fustes a coletar ou revisitar;
2. [`forplot_vouchers()`]({{LINK:photos}}): criar os diretórios e arquivar as fotografias de campo;
3. [`forplot_map()`]({{LINK:map}}): integrar a tabela do censo, os vértices da parcela e as imagens em um mapa;
4. [`forplot_sheets()`]({{LINK:labels}}): gerar a planilha de etiquetas para o herbário;
5. [`forplot_crossdet()`]({{LINK:determinations}}): após o tombamento, comparar as determinações do inventário com as do herbário.

Quando a tabela do censo é atualizada (novas coletas ou determinações revisadas), as etapas podem ser executadas novamente; as saídas são regeneradas a partir da mesma fonte.
:::

::: {data-lang="en"}
For a plot entering a new field campaign, the usual sequence is:

1. [`forplot_balance()`]({{LINK:balance}}): assess collection coverage and identify the stems to collect or revisit;
2. [`forplot_vouchers()`]({{LINK:photos}}): create the directories and archive the field photographs;
3. [`forplot_map()`]({{LINK:map}}): combine the census table, the plot vertices and the images in a map;
4. [`forplot_sheets()`]({{LINK:labels}}): produce the label spreadsheet for the herbarium;
5. [`forplot_crossdet()`]({{LINK:determinations}}): after accession, compare inventory determinations with those of the herbarium.

When the census table is updated (new collections or revised determinations), the steps can be run again; the outputs are regenerated from the same source.
:::
