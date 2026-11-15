## [Planilhas]{data-lang=pt}[Spreadsheets]{data-lang=en} {#planilhas}

### [A planilha usa outros nomes de coluna. É preciso renomeá-las?]{data-lang=pt}[My spreadsheet uses other column names. Do I need to rename them?]{data-lang=en} {#colunas}

::: {data-lang="pt"}
Não. Os nomes são informados pelos argumentos `colname_*` de `forplot_balance()` e `forplot_map()` (por exemplo, `colname_tagno = "Placa"`). Na interface web, os mesmos campos estão em **Minha planilha usa outros nomes de coluna**. A lista completa está em [Primeiros passos]({{LINK:start}}#mapeamento-de-colunas).
:::
::: {data-lang="en"}
No. The names are given through the `colname_*` arguments of `forplot_balance()` and `forplot_map()` (for example, `colname_tagno = "Placa"`). In the web interface, the same fields are under **My spreadsheet uses other column names**. The full list is in [Get started]({{LINK:start}}#mapeamento-de-colunas).
:::

### [Qual valor de `input_type` deve ser usado?]{data-lang=pt}[Which `input_type` value should I use?]{data-lang=en} {#input-type}

::: {data-lang="pt"}
Ficha de campo do ForestPlots.net: `"field_sheet"`; ficha de Terra Indígena: `"field_sheet_ti"`; exportação da Query Library: `"fp_query_sheet"`; planilha do Programa Monitora: `"monitora"`. Em `forplot_sheets()`, use `"forestplots"` para qualquer ficha ForestPlots.net.
:::
::: {data-lang="en"}
ForestPlots.net field sheet: `"field_sheet"`; Indigenous Land field sheet: `"field_sheet_ti"`; Query Library export: `"fp_query_sheet"`; Monitora Program spreadsheet: `"monitora"`. In `forplot_sheets()`, use `"forestplots"` for any ForestPlots.net sheet.
:::

### [Como a situação de coleta é determinada?]{data-lang=pt}[How is collection status determined?]{data-lang=en} {#situacao-de-coleta}

::: {data-lang="pt"}
Pela coluna `Collected` (ou pela indicada em `colname_collected`). Valores como `Sim`, `Yes`, `Coletado`, `1` e `x` são interpretados como coletado. Em `forplot_vouchers()`, um código de voucher preenchido também indica coleta, exceto quando a coluna registra explicitamente o contrário.
:::
::: {data-lang="en"}
From the `Collected` column (or the one given in `colname_collected`). Values such as `Sim`, `Yes`, `Coletado`, `1` and `x` are read as collected. In `forplot_vouchers()`, a filled-in voucher code also indicates collection, unless the column explicitly records otherwise.
:::

## [Relatórios e mapas]{data-lang=pt}[Reports and maps]{data-lang=en} {#relatorios-e-mapas}

### [O PDF não foi gerado.]{data-lang=pt}[The PDF was not produced.]{data-lang=en} {#pdf}

::: {data-lang="pt"}
O PDF requer LaTeX. Instale com `tinytex::install_tinytex()` ou execute com `render_pdf = FALSE`. O HTML, as figuras e a planilha não dependem de LaTeX.
:::
::: {data-lang="en"}
The PDF requires LaTeX. Install it with `tinytex::install_tinytex()` or run with `render_pdf = FALSE`. The HTML, the figures and the spreadsheet do not depend on LaTeX.
:::

### [Os pontos do mapa estão fora da parcela ou espelhados.]{data-lang=pt}[Map points fall outside the plot or are mirrored.]{data-lang=en} {#vertices}

::: {data-lang="pt"}
A causa mais frequente é a ordem dos vértices, que deve ser (0, 0), (0, comprimento), (largura, 0), (largura, comprimento). Ver [`forplot_map()`]({{LINK:map}}#ordem-dos-vertices). A função emite um aviso quando as distâncias entre os vértices não são compatíveis com as dimensões da parcela.
:::
::: {data-lang="en"}
The most frequent cause is the vertex order, which must be (0, 0), (0, length), (width, 0), (width, length). See [`forplot_map()`]({{LINK:map}}#ordem-dos-vertices). The function warns when the distances between vertices do not match the plot dimensions.
:::

### [As imagens não aparecem no mapa.]{data-lang=pt}[Images do not show on the map.]{data-lang=en} {#imagens}

::: {data-lang="pt"}
Verifique se o diretório de cada voucher tem o nome do voucher (maiúsculas, espaços e pontuação são ignorados) e se o diretório `<filename>_vouchers` foi compartilhado junto com o HTML. Para um único arquivo, use `embed_voucher_imgs = TRUE`.
:::
::: {data-lang="en"}
Check that each voucher directory is named after the voucher (case, spaces and punctuation are ignored) and that the `<filename>_vouchers` directory was shared together with the HTML. For a single file, use `embed_voucher_imgs = TRUE`.
:::

### [O cálculo de biomassa (AGB) foi removido?]{data-lang=pt}[Was the biomass (AGB) calculation removed?]{data-lang=en} {#biomassa}

::: {data-lang="pt"}
Sim. As versões anteriores de `plot_for_balance()` incluíam o argumento `calc_agb`; a versão atual, `forplot_balance()`, concentra-se no balanço de coleta. Para estimativas de biomassa, ver o pacote [BIOMASS](https://doi.org/10.1111/2041-210X.12753) (Réjou-Méchain et al., 2017).
:::
::: {data-lang="en"}
Yes. Earlier versions of `plot_for_balance()` had a `calc_agb` argument; the current `forplot_balance()` focuses on the collection balance. For biomass estimates, see the [BIOMASS](https://doi.org/10.1111/2041-210X.12753) package (Réjou-Méchain et al., 2017).
:::

## [Interface web]{data-lang=pt}[Web interface]{data-lang=en} {#interface-web}

### [É necessário instalar algum programa para usar a interface web?]{data-lang=pt}[Do I need to install anything to use the web interface?]{data-lang=en} {#instalar}

::: {data-lang="pt"}
Não. O processamento é feito no servidor do Jardim Botânico do Rio de Janeiro, com a mesma versão do pacote. A versão em uso é indicada em [Sobre]({{LINK:about}}).
:::
::: {data-lang="en"}
No. Processing runs on the Rio de Janeiro Botanical Garden server, with the same package version. The version in use is shown under [About]({{LINK:about}}).
:::

### [Os dados enviados ficam armazenados?]{data-lang=pt}[Are uploaded data stored?]{data-lang=en} {#dados}

::: {data-lang="pt"}
Os arquivos enviados e os resultados são apagados automaticamente após 72 horas. Ver [Sobre]({{LINK:about}}#dados-enviados).
:::
::: {data-lang="en"}
Uploaded files and results are deleted automatically after 72 hours. See [About]({{LINK:about}}#dados-enviados).
:::

### [Como relatar um erro?]{data-lang=pt}[How do I report a bug?]{data-lang=en} {#erros}

::: {data-lang="pt"}
Abra uma *issue* no [GitHub](https://github.com/DBOSlab/forplotR/issues) com a mensagem de erro e, se possível, uma planilha reduzida que reproduza o problema.
:::
::: {data-lang="en"}
Open an issue on [GitHub](https://github.com/DBOSlab/forplotR/issues) with the error message and, if possible, a reduced spreadsheet that reproduces the problem.
:::
