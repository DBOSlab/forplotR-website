# forplotR online

Site em **Quarto** + servidor **R** que rodam as funções do pacote
[forplotR](https://github.com/DBOSlab/forplotR) pelo navegador, com fila de
processamento e download dos resultados, e os **artigos/tutoriais** de cada função.

Visual: identidade tropical sobre base científica. Tipografia fontzz (SIL OFL 1.1,
em `fonts/`): Folio (títulos), Halden (texto) e Signal (código). Paleta verde-mata,
ipê-amarelo, urucum, rio e jabuticaba sobre papel de herbário; cada função tem uma
cor fixa. A figura da abertura (`figures/rus01_stem_map.svg`) é o mapa de fustes
real da parcela RUS01. Botão PT/EN no menu.
Exemplos de código: um argumento por linha, um espaço em torno de `=`, sem alinhar.

| Página | Função | Saídas |
| --- | --- | --- |
| `ferramentas/relatorio/` | `forplot_balance()` | relatório HTML/PDF, mapas PNG, balanço XLSX |
| `ferramentas/mapa/` | `forplot_map()` | mapa HTML interativo |
| `ferramentas/herbario/` | `forplot_sheets()` | planilha JABOT/BRAHMS |
| `ferramentas/determinacoes/` | `forplot_crossdet()` | cruzamento com o JABOT (XLSX) |
| `ferramentas/vouchers/` | `forplot_vouchers()` | pastas Família/Gênero/Voucher (ZIP) |

## Estrutura

```
_quarto.yml               site: navbar, rodapé, tema
_language.yml             textos da interface do Quarto
_includes/
  forplotr-head.html      onde está a API (<meta name="forplotr-api">) + fontes
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
js/forplotr-app.js        formulários, fila, resultados (lê a API)
backend/                  servidor R (Plumber + fila + workers)
  iniciar.R               demonstração local: site + API + 2 workers
  plumber.R               rotas /v1/... e o site estático (_site/)
  worker.R, run_api.R     uso em servidor
  R/tools_spec.R          campos de cada ferramenta (fonte única)
  R/inputs.R, R/jobs.R    uploads, fila, execução, limpeza
  Dockerfile, nginx-jbrj.conf
docker-compose.yml        servidor do JBRJ
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

## Rodar no seu computador (apresentação)

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

## Limitações deste protótipo

- O backend R **ainda não foi executado**: o site foi renderizado com Quarto
  1.9.38 e testado no navegador contra a API simulada; o código R foi revisado à
  mão. Rode `scripts/smoke.sh` antes da apresentação.
- Os bugs do pacote apontados na auditoria aparecem nos resultados até serem
  corrigidos no forplotR.
- Sem login. Para abrir ao público, combinar com a TI um limite por IP no nginx.
- Mapa de várias estações MONITORA: uma por vez.
