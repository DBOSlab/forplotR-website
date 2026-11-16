# forplotR online

Site do pacote R [forplotR](https://github.com/DBOSlab/forplotR), em **Quarto**,
organizado pelas aplicações do pacote, em **inglês (`/`, idioma padrão) e português (`/pt/`)**.
As funções também rodam **no navegador de quem acessa** (webR, o R compilado
para WebAssembly), sem servidor e sem enviar os dados das parcelas a lugar
nenhum. O servidor R (Plumber e fila) continua disponível como modo alternativo.

O forplotR foi desenvolvido por Giulia C. Ottino como produto de seu mestrado em
Botânica na Escola Nacional de Botânica Tropical (ENBT/JBRJ), sob orientação de
Domingos Cardoso (DBOSlab).

Visual: Quarto sem Bootstrap (template próprio em `_tpl/page.html`, CSS com
tokens em `assets/site.css`). Tipografia: sans-serif do sistema em texto,
interface e títulos (`--font-sans`) e Signal (fontzz, SIL OFL 1.1, em `fonts/`)
em código (`--font-mono`); a escolha fica só nesses dois tokens. Paleta verde-mata, ipê,
urucum, rio e jabuticaba sobre papel de herbário, com tema claro e escuro e
contraste AA. Todo exemplo (mapa, relatório, figuras, planilhas, árvore de
pastas, panoramas e números do texto) é gerado pelo próprio pacote sobre os
conjuntos `RUS01` e `TUM`. Exemplos de código: um argumento por linha, com os
rótulos "roda offline" (`{.r .offline}`) e "usa rede" (`{.r .rede}`).

| Ferramenta no navegador | Função | Saídas | No navegador |
| --- | --- | --- | --- |
| `ferramentas/relatorio/` | `forplot_balance()` | relatório HTML/PDF, mapas PNG, balanço XLSX | sim (PDF pela impressão do navegador) |
| `ferramentas/mapa/` | `forplot_map()` | mapa HTML interativo | sim (sem busca em herbários) |
| `ferramentas/herbario/` | `forplot_sheets()` | planilha JABOT/BRAHMS | sim (altitude obrigatória, sem GADM) |
| `ferramentas/determinacoes/` | `forplot_crossdet()` | cruzamento com o JABOT (XLSX) | não: precisa baixar o JABOT |
| `ferramentas/vouchers/` | `forplot_vouchers()` | pastas Família/Gênero/Voucher (ZIP) | sim |

## Estrutura

```
_quarto.yml                site: páginas, recursos, filtros e scripts de build
_tpl/page.html             template HTML (sem Bootstrap): CSP, navegação, rodapé
_tpl/lang.lua              filtro: uma fonte bilíngue, uma página por idioma
_data/entities.yml         fatos de autoria, dissertação, instituições e software (SEO/GEO)
_variables.yml             números do texto ({{< var rus01.arvores >}}), gerados
assets/site.css, site.js   visual e comportamento comuns (tema, índice, cópia, busca)
assets/tools.css           visual dos formulários das ferramentas
assets/panorama.js         panoramas 3D (Three.js empacotado, gerado em _tools/)
pt/                        FONTES de todas as páginas (bilíngues) = páginas em português:
  index.qmd + _body.qmd      página inicial
  comecar/, formatos/        instalação; dados aceitos (formatos, colunas, detecção)
  aplicacoes/                mapa, balanco, fotos, etiquetas, determinacoes
                             (index.qmd + _body.qmd + _doc.md)
  ferramentas/               as ferramentas no navegador (formulário + texto)
  referencia/                referência das funções (gerada do Rd do pacote)
  autoria/, citar/           autoria (mestrado, ORCID, Lattes, GitHub) e citação
  perguntas/, novidades/     perguntas frequentes e NEWS do pacote
  sobre/                     como funciona, privacidade
index.qmd, get-started/, formats/, applications/, tools/, reference/, authors/,
cite/, about/, news/, faq/   páginas EN (raiz), geradas por scripts/sync_lang.R (não editar)
exemplos/                  saídas reais do pacote (mapa, relatório, planilhas, panoramas)
figures/, fonts/           imagens e fontes
js/forplotr-app.js         formulários e resultados (escolhe o motor)
js/forplotr-local.js       motor local: webR no navegador
_tools/                    Node: empacotamento dos panoramas e índice de busca
scripts/
  sync_lang.R              pre-render: páginas EN (raiz) a partir das fontes em pt/
  seo.R                    post-render: JSON-LD, meta tags, sitemap, robots, llms.txt,
                           redirecionamentos das URLs antigas
  build_assets.R           exemplos, panoramas e _variables.yml (roda o pacote)
  build_reference.R        referência, NEWS e citação a partir do pacote instalado
  build_pure_r_binary.R    binário do forplotR para o webR
  mirror_webr_deps.R       espelha as dependências wasm (MD5 conferido)
  export_local_tools.R     formulários do modo navegador (JSON)
  smoke.sh                 teste de ponta a ponta do modo servidor
  mock_server.py           API falsa para mexer no visual sem R
backend/                   motores: webR (webr/engine.R) e servidor (Plumber)
.github/workflows/build-webr.yml   build e publicação no GitHub Pages
webr-dev/index.html        teste de fumaça do webR (só nas prévias)
```

### Como as páginas são feitas

Cada página é uma pasta em `pt/` com `index.qmd` (só o cabeçalho) e
`_body.qmd` (o texto). O cabeçalho é bilíngue e diz onde fica a versão em inglês:

```yaml
---
title: "[Balanço de coleta]{data-lang=pt}[Collection balance]{data-lang=en}"
description: "[...]{data-lang=pt}[...]{data-lang=en}"
page-id: balance                 # usado nos links {{LINK:balance}}
en-path: "applications/balance"  # gera applications/balance/ (inglês, raiz)
schema: TechArticle              # tipo do nó JSON-LD da página
kicker: "forplot_balance()"
toc: true
---

{{< include _body.qmd >}}
```

No texto, cada trecho vem nos dois idiomas, e o filtro `_tpl/lang.lua` deixa só
o da página:

```markdown
[Coletadas]{data-lang=pt}[Collected]{data-lang=en}

::: {data-lang="pt"}
Parágrafo em português.
:::
::: {data-lang="en"}
Paragraph in English.
:::
```

Use sempre `{#id}` explícito nos títulos (os ids automáticos misturariam os
idiomas). Links internos: `{{LINK:page-id}}`, resolvido pelo `scripts/seo.R`
para a página no mesmo idioma. Inclusões aninhadas usam caminhos a partir da
raiz do projeto (`{{< include /pt/aplicacoes/mapa/_doc.md >}}`).

As URLs do site anterior (`about.html`, `articles/*`, `reference/<função antiga>.html`)
continuam funcionando: o `scripts/seo.R` grava páginas de redirecionamento
(inglês por padrão; português se a pessoa escolheu o português ou com `?lang=pt`).
`get-started/`, `faq/`, `news/`, `authors/` e `reference/` têm o mesmo endereço de antes.

### Construir o site

```bash
quarto render                    # sync_lang.R antes, seo.R depois (pacotes yaml e jsonlite)
npm ci --prefix _tools           # uma vez
npm run search --prefix _tools   # índice de busca (Pagefind) em _site/pagefind/
```

Sem o índice, o site funciona e o diálogo de busca avisa que ela não está disponível.

**Regenerar os exemplos** (precisa do forplotR instalado; uns 5 minutos):

```bash
Rscript scripts/build_assets.R      # exemplos/, panoramas, _variables.yml
Rscript scripts/build_reference.R   # referencia/_rd.md, novidades/_news.md, citar/
```

**Panoramas 3D**: o código está em `_tools/panorama/src/panorama.js` e o pacote
gerado (`assets/panorama.js`, ~123 KB gz) fica no repositório, então o build do
site não precisa de Node para eles. Depois de mudar o código:
`npm run panorama --prefix _tools`. O `site.js` só carrega o 3D com WebGL, sem
`prefers-reduced-motion`, e depois da primeira interação ou de 3 s; sem isso,
na impressão ou sem JavaScript, fica o SVG estático gerado em R.

**SEO e GEO**: os fatos sobre autoria, dissertação, instituições e software
ficam em `_data/entities.yml` (fonte única). O `scripts/seo.R` gera em cada
página o canonical, os hreflang PT/EN, Open Graph, as meta `citation_*` e o
JSON-LD (`SoftwareSourceCode`, `Person`, `Thesis`, organizações, página e
trilha), além de `sitemap.xml`, `robots.txt`, `llms.txt` e `llms-full.txt`.
Quando o artigo do pacote sair, preencha `paper.doi`; quando a dissertação
tiver repositório, `thesis.url`.

### O formulário das ferramentas

**O formulário** de cada ferramenta é montado pelo `js/forplotr-app.js` a partir
de `backend/R/tools_spec.R`. Assim, os campos, os valores padrão e a validação
no servidor nunca ficam diferentes. Para mudar um rótulo ou uma ajuda de um
campo, ou expor um novo argumento de uma função, edite a linha `fld(...)` lá.
Em qualquer página com `tool: true` no cabeçalho, estes elementos ganham vida:

```html
<div class="fp-tool-app" data-tool="balance"></div>   <!-- formulário + resultados -->
<div class="fp-recent"></div>                          <!-- processamentos recentes -->
<span class="api-status"></span>                       <!-- situação do motor -->
<script src="{{ROOT}}js/forplotr-local.js"></script>
<script src="{{ROOT}}js/forplotr-app.js"></script>
```

`data-tool` aceita `balance`, `map`, `sheets`, `crossdet`, `vouchers`.

## Modo navegador (webR)

É o modo padrão. O `js/forplotr-local.js` carrega o webR assim que a página de
uma ferramenta abre, instala o forplotR e o código R do motor (tudo servido pelo
próprio site) e, ao clicar em **Processar**, grava os arquivos no sistema de
arquivos virtual do webR (memória), roda `local_run()` (`backend/webr/engine.R`)
e devolve os resultados como URLs `blob:`. Ao terminar, a pasta de trabalho é
apagada; nada é guardado no navegador além do idioma e do tema.

Os dois motores usam a mesma especificação (`backend/R/tools_spec.R`) e o mesmo
núcleo (`core_params.R`, `core_run.R`). No modo navegador, `fld(local = FALSE)`
esconde um campo, `fld(local = list(...))` muda atributos (ex.: altitude
obrigatória), e uma ferramenta com `local = FALSE` mostra `local_note`.

**Segurança.** Os dados das parcelas não saem do computador:
- CSP em todas as páginas (`_tpl/page.html`): conexões, imagens e
  iframes só da própria origem (mais `blob:`/`data:`). As prévias herdam a
  política, então um mapa aberto ali não busca imagens de satélite em terceiros.
- No R: `options(forplotR.offline = TRUE)` e `download.file`, `url()` e as
  funções de download do curl trocados por funções que dão erro.
- Prévias em `iframe sandbox` sem `allow-same-origin`.
- webR com versão e sha256 fixos; dependências espelhadas com MD5 conferido;
  actions fixadas por SHA; nenhum script, fonte ou serviço de terceiros.

**Build** (`.github/workflows/build-webr.yml`): gera o binário do forplotR (R
puro, portável para o webR) a partir do ref escolhido, espelha as dependências,
baixa o runtime do webR, exporta os formulários, renderiza o site e gera o
índice de busca. Nos branches
de teste publica o artefato `site-preview`; no `main`, publica no GitHub Pages
(Settings > Pages > Source: **GitHub Actions**).

**Testar uma prévia:**

```bash
gh run download <run-id> -n site-preview -D preview
python -m http.server -d preview 8000     # http://127.0.0.1:8000/
```

`http://127.0.0.1:8000/webr-dev/` mede o tempo de cada etapa (só nas prévias).
Para usar o servidor em vez do navegador: `<meta name="forplotr-engine"
content="http">` no `_tpl/page.html`, ou, para testar,
`localStorage.FORPLOTR_ENGINE = 'http'` no console.

## Modo servidor: rodar no seu computador

Requisitos: R ≥ 4.1, o forplotR e o Quarto.

```bash
quarto render              # gera _site/
Rscript backend/iniciar.R  # ou: abrir backend/iniciar.R no RStudio e clicar em Source
```

O navegador abre em `http://127.0.0.1:8000/`. Se o `_site/` não existir, o
`iniciar.R` tenta rodar `quarto render` sozinho.

Para usar a versão do pacote que está no seu computador, descomente
`Sys.setenv(FORPLOTR_PKG_PATH = ...)` no topo do `backend/iniciar.R`.

**Editando o site com recarga automática:** deixe o `backend/iniciar.R` rodando e,
em outro terminal, `quarto preview`. A página do preview (outra porta) fala com a
API na porta 8000 automaticamente.

**Mexendo só no visual, sem R:** `quarto render && python3 scripts/mock_server.py`
simula a API com resultados de mentira.

### Roteiro para a apresentação (~10 min)

1. **Início**: as cinco ferramentas e a nota sobre os dados.
2. **Relatório**: marque “Usar os dados de exemplo” → Processar. Mostre a fila,
   o registro ao vivo e, ao final, o relatório na página, as figuras e “Baixar tudo”.
3. **Vouchers**: exemplo de novo → ZIP com as pastas por família.
4. **Mapa**: com uma planilha sua e as coordenadas dos 4 cantos.
5. **Determinações** (se houver internet): exemplo + `RB`; a primeira vez baixa o JABOT.
6. Feche a aba e volte por “Seus processamentos”: o resultado continua lá.

Antes da apresentação: `bash scripts/smoke.sh` (Linux/Mac/Git Bash).

## Servidor do JBRJ (Docker)

| Item | Recomendado |
| --- | --- |
| CPU / memória | 4 vCPU / 8 GB |
| Disco | 80 GB (fotos de vouchers e cache do JABOT) |
| Software | Docker + Docker Compose, Quarto (para renderizar o site) |
| Rede de saída | `ipt.jbrj.gov.br`, GitHub, servidores do `geodata` (GADM, elevação) |
| Endereço | subdomínio com HTTPS, ex.: `forplotr.jbrj.gov.br` |

```bash
git clone <repositório> forplotR_site && cd forplotR_site
quarto render
docker compose up -d --build
bash scripts/smoke.sh http://127.0.0.1:8000
```

- O serviço responde só em `127.0.0.1:8000`; o nginx do JBRJ publica com HTTPS
  (`backend/nginx-jbrj.conf`).
- **Atualizar o site**: `git pull && quarto render` — o `_site/` é montado no
  container, não precisa reconstruir a imagem.
- **Atualizar o forplotR**: troque `FORPLOTR_REF` no `docker-compose.yml` por
  uma tag e rode `docker compose up -d --build`. Ou copie o código do pacote
  para `backend/pkg/`.
- **Site em subpasta** (ex.: `/forplotr/`): mude a meta `forplotr-api` em
  `_tpl/page.html` para `/forplotr/v1`.

### API

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/v1/health` | versões, workers ativos, fila |
| GET | `/v1/tools` | ferramentas e campos dos formulários |
| POST | `/v1/jobs/{balance,map,sheets,crossdet,vouchers}` | envia (multipart/form-data) → 202 + `job_id` |
| GET | `/v1/jobs/{id}` | `queued`, `running`, `done` ou `error`, arquivos |
| GET | `/v1/jobs/{id}/log` | registro do processamento |
| GET | `/v1/jobs/{id}/files/{f1…\|all}` | download (`?inline=1` para visualizar) |

### Configuração (variáveis de ambiente)

| Variável | Padrão | Uso |
| --- | --- | --- |
| `FORPLOTR_PKG_PATH` | vazio | pasta do código do pacote (`pkgload::load_all`) |
| `FORPLOTR_SITE_DIR` | `./_site` | site renderizado |
| `FORPLOTR_DATA_DIR` | `./data` | jobs e cache |
| `FORPLOTR_WORKERS` | 2 | workers do `iniciar.R` |
| `FORPLOTR_MAX_UPLOAD_MB` | 200 | limite por envio |
| `FORPLOTR_MAX_ZIP_MB` | 500 | ZIP de fotos descompactado |
| `FORPLOTR_JOB_TIMEOUT` | 1800 | segundos por job |
| `FORPLOTR_KEEP_HOURS` | 72 | retenção dos resultados |
| `FORPLOTR_MAX_QUEUE` | 20 | jobs na fila antes de recusar novos |
| `FORPLOTR_CORS_ORIGINS` | vazio | outros domínios autorizados a usar a API |

## Limitações

- Modo navegador: o primeiro acesso baixa cerca de 120 MB (depois fica no cache);
  o relatório do RUS01 leva cerca de 2 minutos. Busca em herbários, GADM,
  altitude automática e o cruzamento de determinações ficam só no pacote, no R.
- Modo servidor: as rotas foram testadas pelo núcleo comum (`build_params`,
  `child_run`); rode `scripts/smoke.sh` antes de uma apresentação.
- Os bugs do pacote apontados na auditoria aparecem nos resultados até serem
  corrigidos no forplotR.
- Sem login. Para abrir ao público, combinar com a TI um limite por IP no nginx.
- Mapa de várias estações MONITORA: uma por vez.
