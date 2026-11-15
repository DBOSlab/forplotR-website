# forplotR online

Site em **Quarto** que roda as funções do pacote
[forplotR](https://github.com/DBOSlab/forplotR) **no navegador de quem acessa**
(webR, o R compilado para WebAssembly), sem servidor e sem enviar os dados das
parcelas a lugar nenhum, e os **artigos/tutoriais** de cada função. O servidor R
(Plumber + fila) continua disponível como modo alternativo.

Visual: identidade tropical sobre base científica. Tipografia fontzz (SIL OFL 1.1,
em `fonts/`): Folio (títulos), Halden (texto) e Signal (código). Paleta verde-mata,
ipê-amarelo, urucum, rio e jabuticaba sobre papel de herbário; cada função tem uma
cor fixa. A figura da abertura (`figures/rus01_stem_map.svg`) é o mapa de fustes
real da parcela RUS01. Botão PT/EN no menu.
Exemplos de código: um argumento por linha, um espaço em torno de `=`, sem alinhar.

| Página | Função | Saídas | No navegador |
| --- | --- | --- | --- |
| `ferramentas/relatorio/` | `forplot_balance()` | relatório HTML/PDF, mapas PNG, balanço XLSX | sim (PDF pela impressão do navegador) |
| `ferramentas/mapa/` | `forplot_map()` | mapa HTML interativo | sim (sem busca em herbários) |
| `ferramentas/herbario/` | `forplot_sheets()` | planilha JABOT/BRAHMS | sim (altitude obrigatória, sem GADM) |
| `ferramentas/determinacoes/` | `forplot_crossdet()` | cruzamento com o JABOT (XLSX) | não: precisa baixar o JABOT |
| `ferramentas/vouchers/` | `forplot_vouchers()` | pastas Família/Gênero/Voucher (ZIP) | sim |

## Estrutura

```
_quarto.yml               site: navbar, rodapé, tema
_language.yml             textos da interface do Quarto
_includes/
  forplotr-head.html      política de segurança (CSP), motor/API + fontes
  forplotr-after.html     botão PT/EN, animações, abas dos diagramas
theme.scss                cores e fontes (Bootstrap)
styles.css                visual do site, das ferramentas e dos artigos
index.qmd                 página inicial (seções fx-section, textos PT/EN)
artigos/
  _metadata.yml           layout comum dos artigos (barra lateral + sumário)
  index.qmd               cartões de todos os tutoriais
  comecar.qmd             instalação, formatos de planilha, colunas
  forplot_balance.qmd     um artigo por função, com argumentos e saídas
  forplot_map.qmd
  forplot_sheets.qmd
  forplot_crossdet.qmd
  forplot_vouchers.qmd
  faq.qmd, novidades.qmd
listings.json             vazio; evita um 404 do Quarto por causa das categories
ferramentas/
  index.qmd               visão geral
  relatorio/index.qmd     uma pasta por ferramenta: texto em Markdown + o
  mapa/index.qmd            ponto onde o formulário aparece
  herbario/index.qmd
  determinacoes/index.qmd
  vouchers/index.qmd
sobre/index.qmd           como funciona, privacidade, como citar
figures/                  logos e fundo
js/forplotr-app.js        formulários e resultados (escolhe o motor)
js/forplotr-local.js      motor local: webR no navegador
backend/
  R/tools_spec.R          campos de cada ferramenta (fonte única, dos dois motores)
  R/core_params.R         núcleo comum: campos do formulário -> argumentos
  R/core_run.R            núcleo comum: execução e organização das saídas
  R/config.R              configuração e utilidades
  webr/engine.R           motor local (roda dentro do webR)
  iniciar.R               modo servidor: site + API + 2 workers
  plumber.R               rotas /v1/... e o site estático (_site/)
  worker.R, run_api.R     modo servidor em produção
  R/inputs.R, R/jobs.R    modo servidor: uploads, fila, limpeza
  Dockerfile, nginx-jbrj.conf
docker-compose.yml        servidor do JBRJ
.github/workflows/build-webr.yml   build do site com o webR (prévia; no main, Pages)
scripts/build_pure_r_binary.R      binário do forplotR para o webR
scripts/mirror_webr_deps.R         espelha as dependências wasm (MD5 conferido)
scripts/export_local_tools.R       formulários do modo navegador (JSON)
webr-dev/index.html       página interna de teste de fumaça do webR (só nas prévias)
scripts/smoke.sh          teste de ponta a ponta
scripts/mock_server.py    API falsa para mexer no visual sem R
```

### Textos em português e inglês

O botão **PT/EN** fica no menu e a escolha é lembrada pelo navegador. Qualquer
elemento com `data-lang="pt"` ou `data-lang="en"` só aparece no idioma escolhido:

```html
<h2 data-lang="pt">Ferramentas</h2><h2 data-lang="en">Tools</h2>
```

Em Markdown e no `_quarto.yml`: `[Artigos]{data-lang=pt}[Articles]{data-lang=en}`.
A página inicial e o menu estão nos dois idiomas; os artigos e as ferramentas,
em português (com um aviso em inglês apontando para a documentação do pacote).

### Artigos

Cada artigo é um `.qmd` comum em `artigos/`. Para criar um novo, copie um
existente, mude o cabeçalho (`title`, `subtitle`, `description`, `categories`)
e acrescente o arquivo na `sidebar` do `_quarto.yml` e no cartão de
`artigos/index.qmd`. Os blocos de código são só texto (```` ```r ````), então
o site renderiza sem precisar do R.

### O que fica no Quarto e o que fica no R

- **Tudo o que é texto e página** (títulos, explicações, cartões, navbar,
  rodapé, cores) está nos `.qmd`, `_quarto.yml`, `theme.scss` e `styles.css`.
  Edite e rode `quarto render` (ou `quarto preview`).
- **O formulário** de cada ferramenta é montado pelo `js/forplotr-app.js` a partir
  de `backend/R/tools_spec.R`. Assim, os campos, os valores padrão e a validação
  no servidor nunca ficam diferentes. Para mudar um rótulo ou uma ajuda de um
  campo, ou expor um novo argumento de uma função, edite a linha `fld(...)` lá.
- Em qualquer página, estes elementos ganham vida pelo script:

```html
<div class="fp-tool-app" data-tool="balance"></div>   <!-- formulário + resultados -->
<div class="fp-recent"></div>                          <!-- processamentos recentes -->
<span class="api-status"></span>                       <!-- situação do servidor -->
<script src="../../js/forplotr-app.js"></script>       <!-- caminho relativo à página -->
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
- CSP em todas as páginas (`_includes/forplotr-head.html`): conexões, imagens e
  iframes só da própria origem (mais `blob:`/`data:`). As prévias herdam a
  política, então um mapa aberto ali não busca imagens de satélite em terceiros.
- No R: `options(forplotR.offline = TRUE)` e `download.file`, `url()` e as
  funções de download do curl trocados por funções que dão erro.
- Prévias em `iframe sandbox` sem `allow-same-origin`.
- webR com versão e sha256 fixos; dependências espelhadas com MD5 conferido;
  actions fixadas por SHA; nenhum script, fonte ou serviço de terceiros.

**Build** (`.github/workflows/build-webr.yml`): gera o binário do forplotR (R
puro, portável para o webR) a partir do ref escolhido, espelha as dependências,
baixa o runtime do webR, exporta os formulários e renderiza o site. Nos branches
de teste publica o artefato `site-preview`; no `main`, publica no GitHub Pages
(Settings > Pages > Source: **GitHub Actions**).

**Testar uma prévia:**

```bash
gh run download <run-id> -n site-preview -D preview
python -m http.server -d preview 8000     # http://127.0.0.1:8000/
```

`http://127.0.0.1:8000/webr-dev/` mede o tempo de cada etapa (só nas prévias).
Para usar o servidor em vez do navegador: `<meta name="forplotr-engine"
content="http">` no `_includes/forplotr-head.html`, ou, para testar,
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
- **Site em subpasta** (ex.: `/forplotr/`): mude a meta em
  `_includes/forplotr-head.html` para `/forplotr/v1`.

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
