## [Versão atual]{data-lang=pt}[Current version]{data-lang=en} {#versao-atual}

### [Novos nomes das funções]{data-lang=pt}[New function names]{data-lang=en} {#novos-nomes}

::: {data-lang="pt"}
Todas as funções passaram a usar o prefixo `forplot_`, o que agrupa a interface do pacote e facilita a busca por autocompletar.

| Nome anterior | Nome atual |
|---|---|
| `plot_for_balance()` | [`forplot_balance()`]({{LINK:balance}}) |
| `mk_voucher_dirs()` | [`forplot_vouchers()`]({{LINK:photos}}) |
| `plot_html_map()` | [`forplot_map()`]({{LINK:map}}) |
| `fp_herb_converter()` | [`forplot_sheets()`]({{LINK:labels}}) |
| — | [`forplot_crossdet()`]({{LINK:determinations}}) (nova) |

: Correspondência entre nomes anteriores e atuais. {.arg-table}
:::

::: {data-lang="en"}
All functions now share the `forplot_` prefix, which groups the package interface and makes autocompletion easier.

| Former name | Current name |
|---|---|
| `plot_for_balance()` | [`forplot_balance()`]({{LINK:balance}}) |
| `mk_voucher_dirs()` | [`forplot_vouchers()`]({{LINK:photos}}) |
| `plot_html_map()` | [`forplot_map()`]({{LINK:map}}) |
| `fp_herb_converter()` | [`forplot_sheets()`]({{LINK:labels}}) |
| — | [`forplot_crossdet()`]({{LINK:determinations}}) (new) |

: Correspondence between former and current names. {.arg-table}
:::

### [Alterações por função]{data-lang=pt}[Changes by function]{data-lang=en} {#alteracoes}

::: {data-lang="pt"}
- **`forplot_balance()`**: relatório em HTML, além do PDF; formatos `field_sheet_ti` (Terra Indígena) e `fp_query_sheet` (Query Library); suporte ao Programa Monitora com uma ou várias estações; argumentos `colname_*` para colunas com outros nomes; relatórios em francês, mandarim e panará; argumentos `render_html`, `render_pdf` e `write_xlsx`. O cálculo de biomassa (`calc_agb`) foi removido.
- **`forplot_vouchers()`**: todos os formatos de entrada; reorganização sem sobrescrita quando as determinações mudam.
- **`forplot_map()`**: ponto central único para parcelas do Monitora; imagens incorporadas ao HTML (`embed_voucher_imgs`); links para exsicatas digitalizadas (`herbaria_lookup`, `herbaria`); `collector_map` para siglas de coletores; aviso quando os vértices parecem fora de ordem.
- **`forplot_sheets()`**: entrada do Monitora, com metadados lidos da própria planilha; validação da compatibilidade entre coordenadas e estado (`validate_locality`).
- **`forplot_crossdet()`**: nova função para comparar as determinações da parcela com as de um herbário do JABOT.
:::

::: {data-lang="en"}
- **`forplot_balance()`**: HTML report in addition to the PDF; `field_sheet_ti` (Indigenous Land) and `fp_query_sheet` (Query Library) layouts; support for the Monitora Program with one or several stations; `colname_*` arguments for columns with other names; reports in French, Mandarin and Panará; `render_html`, `render_pdf` and `write_xlsx` arguments. The biomass calculation (`calc_agb`) was removed.
- **`forplot_vouchers()`**: all input layouts; reorganisation without overwriting when determinations change.
- **`forplot_map()`**: single centre point for Monitora plots; images embedded in the HTML (`embed_voucher_imgs`); links to digitised specimens (`herbaria_lookup`, `herbaria`); `collector_map` for collector initials; a warning when vertices seem out of order.
- **`forplot_sheets()`**: Monitora input, with metadata read from the spreadsheet itself; check that coordinates agree with the state (`validate_locality`).
- **`forplot_crossdet()`**: new function comparing plot determinations with those of a JABOT herbarium.
:::

### [Site]{data-lang=pt}[Website]{data-lang=en} {#site}

::: {data-lang="pt"}
- Interface web: todas as funções podem ser executadas no navegador, no servidor do JBRJ, sem instalação do R.
- Documentação bilíngue (português e inglês), atualizada para os nomes e argumentos atuais.
:::
::: {data-lang="en"}
- Web interface: every function can be run in the browser, on the JBRJ server, without installing R.
- Bilingual documentation (Portuguese and English), updated to the current names and arguments.
:::

## 1.0.0 {#v1-0-0}

::: {data-lang="pt"}
- Primeira versão pública, com `plot_for_balance()`, `plot_html_map()`, `fp_herb_converter()` e `mk_voucher_dirs()`.
:::
::: {data-lang="en"}
- First public release, with `plot_for_balance()`, `plot_html_map()`, `fp_herb_converter()` and `mk_voucher_dirs()`.
:::
