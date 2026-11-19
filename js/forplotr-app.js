/* forplotR online — cliente do site (Quarto)
 * Nas páginas, coloque:
 *   <div class="fp-tool-app" data-tool="balance"></div>   -> formulário + resultados
 *   <div class="fp-recent"></div>                          -> processamentos recentes
 *   <span class="api-status"></span>                       -> situação do servidor
 * Dois motores, mesma especificação (backend/R/tools_spec.R):
 *   local (padrão): o forplotR roda no navegador (webR, js/forplotr-local.js);
 *                   os dados não saem do computador e nada é guardado.
 *   http:           servidor Plumber (/v1). Ative com
 *                   <meta name="forplotr-engine" content="http"> ou
 *                   localStorage.FORPLOTR_ENGINE = 'http'.
 *
 * Idioma: todo texto visível é criado em PT e EN (função bi) e alternado pelo CSS
 * (html.fp-en). Textos que vêm do servidor em português são traduzidos pelo
 * dicionário SERVER_EN; o que não estiver nele aparece como veio.
 * Estados: carregando (esqueleto), vazio, erro, enviando (botão com indicador),
 * em fila/processando (barra indeterminada), concluído e falhou. */
(function () {
  'use strict';

  // ---------- configuração ----------
  var API = (function () {
    try { var o = localStorage.getItem('FORPLOTR_API'); if (o) return o.replace(/\/$/, ''); } catch (e) {}
    var m = document.querySelector('meta[name="forplotr-api"]');
    var base = (m && m.content) || '/v1';
    var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if (location.protocol === 'file:' || (local && location.port !== '8000')) base = 'http://127.0.0.1:8000/v1';
    return base.replace(/\/$/, '');
  })();
  var ROOT = (function () {
    var m = document.querySelector('meta[name="quarto:offset"]');
    return m ? m.content : './';
  })();
  var MODE = (function () {
    try { var o = localStorage.getItem('FORPLOTR_ENGINE'); if (o === 'http' || o === 'local') return o; } catch (e) {}
    var m = document.querySelector('meta[name="forplotr-engine"]');
    return m && m.content === 'http' ? 'http' : 'local';
  })();
  var LOCAL = MODE === 'local' && window.ForplotrLocalEngine ? window.ForplotrLocalEngine(ROOT) : null;
  var PAGES = { balance: 'relatorio', map: 'mapa', sheets: 'herbario', crossdet: 'determinacoes', vouchers: 'vouchers' };
  var PAGES_EN = { balance: 'report', map: 'map', sheets: 'herbarium', crossdet: 'determinations', vouchers: 'vouchers' };
  function toolPage(id) {
    return isEn()
      ? ROOT + 'tools/' + (PAGES_EN[id] || id) + '/'
      : ROOT + 'pt/ferramentas/' + (PAGES[id] || id) + '/';
  }
  var STORE = 'forplotR_jobs_v1';
  var state = { tools: [], health: null, poll: null, logPoll: null, tick: null };

  // ---------- idioma ----------
  function isEn() { return document.documentElement.classList.contains('fp-en'); }
  // Textos do servidor (tools_spec.R, jobs.R) em inglês.
  var SERVER_EN = {
    // ferramentas
    'Relatório de campo e balanço de coleta': 'Field report and collection balance',
    'Mapa interativo da parcela': 'Interactive plot map',
    'Planilha para o herbário': 'Herbarium spreadsheet',
    'Cruzamento com o herbário': 'Determination cross-check',
    'Pastas de vouchers': 'Voucher directories',
    '1 a 2 minutos com os dados de exemplo': '1 to 2 minutes with the example data',
    'menos de 1 minuto (mais, com busca em herbários)': 'under 1 minute (longer with herbarium lookup)',
    'menos de 1 minuto (mais, se a altitude for calculada)': 'under 1 minute (longer if elevation is computed)',
    'primeira vez: vários minutos (download do JABOT); depois, ~1 minuto': 'first time: several minutes (JABOT download); afterwards, about 1 minute',
    'segundos': 'seconds',
    // campos
    'Planilha da parcela': 'Plot spreadsheet',
    'Arquivo Excel no formato escolhido abaixo.': 'Excel file in the layout selected below.',
    'Usar os dados de exemplo do pacote (RUS01 ou TUM)': 'Use the package example data (RUS01 or TUM)',
    'Para demonstração: usa RUS01 (field sheet) ou TUM (MONITORA) no lugar da planilha.': 'For demonstration: uses RUS01 (field sheet) or TUM (MONITORA) instead of a spreadsheet.',
    'Formato da planilha': 'Spreadsheet layout',
    'Linha do cabeçalho': 'Header row',
    'Logo do Jardim Botânico do Rio de Janeiro (JBRJ)': 'Rio de Janeiro Botanical Garden (JBRJ) logo',
    'Logo da Conservação Internacional (CI)': 'Conservation International (CI) logo',
    'Logo da Associação Iakiô Panará': 'Iakiô Panará Association logo',
    'Logo do Programa MONITORA': 'MONITORA Programme logo',
    'Logo do ForestPlots.net': 'ForestPlots.net logo',
    'Linha da planilha com os nomes das colunas. Vazio: detectada automaticamente.': 'Row of the spreadsheet with the column names. Empty: detected automatically.',
    'Field sheet de Terra Indígena': 'Indigenous Land field sheet',
    'Idioma dos resultados': 'Output language',
    'Português': 'Portuguese', 'English': 'English', 'Español': 'Spanish', 'Français': 'French', 'Mandarim': 'Mandarin', 'Panará': 'Panará',
    'Estação(ões) MONITORA': 'MONITORA station(s)',
    'Estação MONITORA': 'MONITORA station',
    'Nome ou número. Várias estações: separe por vírgula (um relatório por estação).': 'Name or number. Several stations: separate with commas (one report per station).',
    'Nome ou número da estação.': 'Station name or number.',
    'Área da parcela (ha)': 'Plot area (ha)',
    'Ignorado para MONITORA.': 'Ignored for MONITORA.',
    'Lado da subparcela (m)': 'Subplot side (m)',
    'Largura da parcela (m)': 'Plot width (m)',
    'Opcional. Se vazio, é calculada a partir da área.': 'Optional. If empty, it is computed from the area.',
    'Comprimento da parcela (m)': 'Plot length (m)',
    'Opcional.': 'Optional.',
    'Nome da parcela': 'Plot name',
    'Substitui o nome lido da planilha.': 'Overrides the name read from the spreadsheet.',
    'Código da parcela': 'Plot code',
    'Equipe / PI': 'Team / PI',
    'Coluna da plaqueta (New Tag No)': 'Tag column (New Tag No)',
    'Coluna do grupo de fustes': 'Stem grouping column',
    'Coluna da subparcela (T1 / subunidade)': 'Subplot column (T1 / subunit)',
    'Coluna X (m)': 'X column (m)',
    'Coluna Y (m)': 'Y column (m)',
    'Coluna da família': 'Family column',
    'Coluna da espécie': 'Species column',
    'Coluna do DAP (mm)': 'DBH column (mm)',
    'Coluna do voucher': 'Voucher column',
    'Coluna de coletado': 'Collected column',
    'MONITORA: coluna N_parcela': 'MONITORA: N_parcela column',
    'MONITORA: coluna CAP (cm)': 'MONITORA: CBH column (cm)',
    'MONITORA: coluna da estação': 'MONITORA: station column',
    'MONITORA: coluna do ano do censo': 'MONITORA: census year column',
    'Gerar relatório de campo (HTML)': 'Produce field report (HTML)',
    'Gerar relatório PDF': 'Produce PDF report',
    'Exige Chrome, Chromium ou Edge no servidor.': 'Requires Chrome, Chromium or Edge on the server.',
    'Gerar planilha de balanço (XLSX)': 'Produce balance spreadsheet (XLSX)',
    'Não disponível para MONITORA.': 'Not available for MONITORA.',
    'Destacar palmeiras (Arecaceae)': 'Highlight palms (Arecaceae)',
    'Número do censo': 'Census number',
    'Coordenadas da parcela (graus decimais)': 'Plot coordinates (decimal degrees)',
    'Uma linha por ponto: latitude; longitude. Parcelas ForestPlots: 4 cantos na ordem (0,0), (0,comprimento), (largura,0), (largura,comprimento). MONITORA: 1 ponto, o centro da estação. GigaFlor: opcional; sem vértices, a parcela é estimada a partir das coordenadas das árvores.':
      'One line per point: latitude; longitude. ForestPlots plots: 4 corners in the order (0,0), (0,length), (width,0), (width,length). MONITORA: 1 point, the station centre. GigaFlor: optional; without corners, the plot is estimated from the tree coordinates.',
    'GigaFlor (protocolo 1)': 'GigaFlor (protocol 1)',
    'GigaFlor: 20 m (protocolo 1), usado quando o campo fica com o valor padrão.': 'GigaFlor: 20 m (protocol 1), used when the field keeps its default value.',
    'Obrigatória, exceto no GigaFlor: se vazia, o centro das árvores da planilha.': 'Required, except for GigaFlor: if empty, the centre of the trees in the spreadsheet.',
    'Uma sigla, ex.: RB. Vazio: o herbário de cada voucher vem da coluna collectionCode da planilha (como na ficha GigaFlor).': 'One acronym, e.g. RB. Empty: the herbarium of each voucher comes from the collectionCode column of the spreadsheet (as in the GigaFlor sheet).',
    'Preencha o campo: Latitude (graus decimais)': 'Fill in the field: Latitude (decimal degrees)',
    'Preencha o campo: Longitude (graus decimais)': 'Fill in the field: Longitude (decimal degrees)',
    '…ou envie as coordenadas em planilha': '…or upload the coordinates as a spreadsheet',
    'Colunas latitude e longitude.': 'Latitude and longitude columns.',
    'Fotos dos vouchers (ZIP, opcional)': 'Voucher photos (ZIP, optional)',
    'Uma pasta por voucher com as fotos dentro (ex.: o ZIP gerado pela ferramenta Pastas de vouchers).': 'One folder per voucher with the photos inside (e.g. the ZIP produced by the voucher directories tool).',
    'Embutir as fotos no HTML (arquivo único)': 'Embed the photos in the HTML (single file)',
    'Buscar exsicatas nos herbários (JABOT/REFLORA)': 'Look up specimens in herbaria (JABOT/REFLORA)',
    'Baixa os dados do herbário; a primeira vez é demorada.': 'Downloads the herbarium data; the first time is slow.',
    'Herbários': 'Herbaria',
    'Siglas separadas por vírgula, ex.: RB, UPCB.': 'Acronyms separated by commas, e.g. RB, UPCB.',
    'Coletor (quando o voucher só tem número)': 'Collector (when the voucher has a number only)',
    'Forçar novo download dos herbários': 'Force a new herbarium download',
    'Formato do herbário': 'Herbarium layout',
    'Modelo da planilha do herbário (opcional)': 'Herbarium spreadsheet template (optional)',
    'Se não enviar, usamos um modelo com as colunas do formato escolhido.': 'If none is uploaded, a template with the columns of the selected layout is used.',
    'País': 'Country', 'Estado': 'State', 'Ex.: BA ou Bahia.': 'E.g. BA or Bahia.', 'Município': 'Municipality',
    'Latitude (graus decimais)': 'Latitude (decimal degrees)',
    'Longitude (graus decimais)': 'Longitude (decimal degrees)',
    'Altitude (m)': 'Elevation (m)',
    'Recomendado. Se vazio, o servidor baixa um modelo de elevação global de baixa resolução (~4,5 km).': 'Recommended. If empty, the server downloads a low-resolution global elevation model (~4.5 km).',
    'Unidade de conservação': 'Protected area',
    'Coletor principal': 'Main collector',
    'Se vazio, é lido da planilha (campo Team).': 'If empty, it is read from the spreadsheet (Team field).',
    'Coletores adicionais': 'Additional collectors',
    'Projeto': 'Project',
    'Notas da localidade': 'Locality notes',
    'Aba da planilha (número)': 'Spreadsheet sheet (number)',
    'Incluir notas do censo nas observações': 'Include census notes in the remarks',
    'Conferir se as coordenadas caem no estado': 'Check that the coordinates fall within the state',
    'Baixa os limites administrativos do GADM.': 'Downloads the GADM administrative boundaries.',
    'Herbário': 'Herbarium',
    'Uma sigla, ex.: RB.': 'One acronym, e.g. RB.',
    'Somente indivíduos coletados': 'Collected individuals only',
    'Baixar de novo os dados do herbário': 'Download the herbarium data again',
    'Use só se os dados do JABOT mudaram.': 'Use only if the JABOT data have changed.',
    'Pasta de fotos atual (ZIP, opcional)': 'Current photo folder (ZIP, optional)',
    'Sem ZIP, é criada a estrutura vazia para você preencher.': 'Without a ZIP, an empty structure is created for you to fill in.',
    'Nomes das pastas: imagens_testemunhos e "<Voucher> Arvore#<plaqueta>" em português.': 'Folder names: voucher_imgs and "<Voucher> Tree#<tag>" in English.',
    // status e arquivos
    'Na fila': 'Queued', 'Processando': 'Running', 'Concluído': 'Done', 'Falhou': 'Failed',
    'Concluído, mas nenhum arquivo foi gerado (veja o registro)': 'Done, but no file was produced (see the log)',
    'Relatório completo (HTML interativo)': 'Full report (interactive HTML)',
    'Relatório completo (PDF)': 'Full report (PDF)',
    'Balanço de coleta por subparcela (XLSX)': 'Collection balance per subplot (XLSX)',
    'Mapa geral da parcela': 'Overall plot map',
    'Mapa dos coletados': 'Map of collected stems',
    'Mapa dos não coletados': 'Map of uncollected stems',
    'Mapa das palmeiras não coletadas': 'Map of uncollected palms',
    'Subparcelas prioritárias': 'Priority subplots',
    'Espécies com mais indivíduos': 'Species with the most individuals',
    'Espécies por valor de importância (IVI)': 'Species by importance value (IVI)',
    'Famílias por valor de importância (IVI)': 'Families by importance value (IVI)',
    'Fustes por classe de diâmetro': 'Stems per diameter class',
    'Mapa interativo (HTML)': 'Interactive map (HTML)',
    'Planilha para o herbário (XLSX)': 'Herbarium spreadsheet (XLSX)',
    'Cruzamento com o herbário (XLSX)': 'Determination cross-check (XLSX)',
    // erros do servidor
    'Requisição vazia.': 'Empty request.',
    'ZIP inválido ou corrompido.': 'Invalid or corrupted ZIP.',
    'O ZIP contém caminhos inválidos.': 'The ZIP contains invalid paths.',
    'Coordenadas demais.': 'Too many coordinates.',
    'Os dados de exemplo existem para field sheet (RUS01) e MONITORA (TUM).': 'Example data exist for field sheet (RUS01) and MONITORA (TUM).',
    'A fila está cheia. Tente de novo em alguns minutos.': 'The queue is full. Please try again in a few minutes.',
    'Informe as coordenadas da parcela (digitadas ou em planilha).': 'Give the plot coordinates (typed or as a spreadsheet).',
    'Latitude fora do intervalo.': 'Latitude out of range.',
    'Longitude fora do intervalo.': 'Longitude out of range.',
    'Informe uma única sigla de herbário, só letras e números.': 'Give a single herbarium acronym, letters and digits only.',
    // modo local (navegador)
    'Obrigatória no navegador: o modelo de elevação global não é baixado.': 'Required in the browser: the global elevation model is not downloaded.',
    'O relatório ainda não roda no navegador: a geração do HTML está sendo adaptada. Por enquanto, use o pacote forplotR no R.':
      'The report does not run in the browser yet: HTML generation is being adapted. For now, use the forplotR package in R.',
    'O cruzamento precisa baixar os dados do herbário (JABOT) pela internet, o que não é feito no modo navegador. Use o pacote forplotR no R.':
      'The cross-check needs to download herbarium data (JABOT) from the internet, which the browser mode does not do. Use the forplotR package in R.',
    'Acesso à rede desativado: no navegador, os dados não saem do seu computador.': 'Network access disabled: in the browser, your data never leave your computer.',
    'Arquivo enviado em local inválido.': 'Uploaded file in an invalid location.',
    'Para ter o PDF (A4), abra o relatório e use Imprimir > Salvar como PDF.': 'For the PDF (A4), open the report and use Print > Save as PDF.'
  };
  // mensagens do servidor com partes variáveis
  var SERVER_EN_RX = [
    [/^Envie o arquivo: (.*)$/, function (m) { return 'Upload the file: ' + tr(m[1]); }],
    [/^Preencha o campo: (.*)$/, function (m) { return 'Fill in: ' + tr(m[1]); }],
    [/^Número inválido em "(.*)": (.*)$/, function (m) { return 'Invalid number in "' + tr(m[1]) + '": ' + m[2]; }],
    [/^Opção inválida em "(.*)"\.$/, function (m) { return 'Invalid option in "' + tr(m[1]) + '".'; }],
    [/^Texto longo demais em "(.*)"\.$/, function (m) { return 'Text too long in "' + tr(m[1]) + '".'; }],
    [/^Coordenada inválida: (.*)$/, function (m) { return 'Invalid coordinate: ' + m[1]; }],
    [/^Ferramenta desconhecida: (.*)$/, function (m) { return 'Unknown tool: ' + m[1]; }]
  ];
  function tr(pt) {
    if (pt === undefined || pt === null) return '';
    pt = String(pt);
    if (SERVER_EN[pt]) return SERVER_EN[pt];
    for (var i = 0; i < SERVER_EN_RX.length; i++) {
      var m = SERVER_EN_RX[i][0].exec(pt);
      if (m) return SERVER_EN_RX[i][1](m);
    }
    return pt;
  }

  // ---------- utilidades ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else e.setAttribute(k, v === true ? '' : v);
    });
    [].concat(kids === undefined ? [] : kids).forEach(function (c) {
      if (c === null || c === undefined) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }
  // texto bilíngue: dois <span data-lang>, alternados pelo CSS
  function bi(pt, en) {
    var f = document.createDocumentFragment();
    f.appendChild(el('span', { 'data-lang': 'pt' }, pt));
    f.appendChild(el('span', { 'data-lang': 'en' }, en === undefined ? tr(pt) : en));
    return f;
  }
  function biEl(tag, attrs, pt, en) { var e = el(tag, attrs); e.appendChild(bi(pt, en)); return e; }
  function arr(x) { return x === undefined || x === null ? [] : [].concat(x); }
  function fmtSize(b) {
    if (!b && b !== 0) return '';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(0) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  function fmtDur(s) {
    s = Math.max(0, Math.round(s));
    var m = Math.floor(s / 60), r = s % 60;
    return m ? m + ' min ' + r + ' s' : r + ' s';
  }
  function hashJob() { var m = /job=([0-9a-f-]{36})/.exec(location.hash); return m ? m[1] : ''; }
  function getJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.message || ('HTTP ' + r.status)); e.status = r.status; throw e; }
        return d;
      });
    });
  }
  function svg(path, cls) {
    var w = document.createElement('span');
    w.innerHTML = '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
    return w.firstChild;
  }
  // ícones (traço 1.5px, grade 24)
  var IC = {
    plot: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="12.5" cy="11" r="1" fill="currentColor"/><circle cx="18" cy="17" r="1" fill="currentColor"/>',
    offline: '<path d="M3 3l18 18"/><path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 4.2-2.6M12 18.5h.01M14.8 10.6A10 10 0 0 1 19 13M2 9.4a15 15 0 0 1 3.3-2.2M10.7 5.1A15 15 0 0 1 22 9.4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };

  // ---------- processamentos guardados no navegador ----------
  function loadJobs() { try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e) { return []; } }
  function saveJob(j) {
    try {
      var list = loadJobs().filter(function (x) { return x.id !== j.id; });
      list.unshift(j);
      localStorage.setItem(STORE, JSON.stringify(list.slice(0, 30)));
    } catch (e) { /* navegador sem armazenamento */ }
  }

  // ---------- situação do servidor ----------
  function setStatus(node, cls, pt, en, title) {
    node.classList.remove('is-ok', 'is-warn', 'is-bad', 'is-checking');
    node.classList.add(cls);
    node.innerHTML = '';
    node.appendChild(bi(pt, en));
    if (title) node.title = title;
  }
  var STAGE_TXT = {
    idle: ['R no navegador: aguardando', 'R in the browser: waiting'],
    runtime: ['carregando o R no navegador…', 'loading R in the browser…'],
    packages: ['instalando o forplotR no navegador…', 'installing forplotR in the browser…'],
    engine: ['preparando o forplotR…', 'preparing forplotR…'],
    failed: ['não foi possível iniciar o R no navegador', 'could not start R in the browser']
  };
  var localChipsBound = false;
  function checkLocal() {
    if (localChipsBound) return;
    localChipsBound = true;
    LOCAL.onStage(function (stage) {
      document.querySelectorAll('.api-status').forEach(function (s) {
        if (stage === 'ready') {
          var h = LOCAL.info() || {};
          setStatus(s, 'is-ok', 'pronto · processado no seu navegador', 'ready · processed in your browser',
                    'forplotR ' + (h.forplotR || '') + ' · ' + (h.R || ''));
        } else {
          var t = STAGE_TXT[stage] || STAGE_TXT.idle;
          setStatus(s, stage === 'failed' ? 'is-bad' : 'is-checking', t[0], t[1]);
        }
      });
      var v = document.querySelector('.fp-versions');
      var h2 = LOCAL.info();
      if (v && stage === 'ready' && h2) {
        v.innerHTML = '';
        v.appendChild(bi('No navegador: forplotR ' + h2.forplotR + ' · ' + h2.R + '.', 'In the browser: forplotR ' + h2.forplotR + ' · ' + h2.R + '.'));
      }
    });
  }
  function checkHealth() {
    if (LOCAL) { checkLocal(); return Promise.resolve(null); }
    var chips = document.querySelectorAll('.api-status');
    chips.forEach(function (s) { if (!s.textContent.trim()) setStatus(s, 'is-checking', 'verificando servidor', 'checking server'); });
    return getJSON(API + '/health').then(function (h) {
      state.health = h;
      chips.forEach(function (s) {
        if (h.workers > 0) setStatus(s, 'is-ok', 'servidor disponível · fila: ' + h.queue, 'server available · queue: ' + h.queue);
        else setStatus(s, 'is-warn', 'servidor sem processos ativos', 'server has no active workers');
        s.title = 'forplotR ' + h.forplotR + ' · ' + h.R;
      });
      var v = document.querySelector('.fp-versions');
      if (v) { v.innerHTML = ''; v.appendChild(bi('Servidor: forplotR ' + h.forplotR + ' · ' + h.R + '.', 'Server: forplotR ' + h.forplotR + ' · ' + h.R + '.')); }
      return h;
    }).catch(function () {
      chips.forEach(function (s) { setStatus(s, 'is-bad', 'servidor indisponível', 'server unavailable'); });
    });
  }

  // ---------- processamentos recentes ----------
  function statusLabel(s) {
    var pt = { queued: 'na fila', running: 'processando', done: 'concluído', error: 'falhou', expired: 'expirado' }[s] || s;
    var en = { queued: 'queued', running: 'running', done: 'done', error: 'failed', expired: 'expired' }[s] || s;
    return bi(pt, en);
  }
  function renderRecent() {
    var list = document.querySelector('.fp-recent');
    if (!list) return;
    if (LOCAL) {
      list.innerHTML = '';
      var note = el('div', { class: 'recent-empty' }, [svg(IC.clock)]);
      note.appendChild(biEl('p', null,
        'As ferramentas rodam no seu navegador: as planilhas não são enviadas a nenhum servidor e nada fica guardado depois que a página é fechada.',
        'The tools run in your browser: spreadsheets are not sent to any server and nothing is kept after the page is closed.'));
      list.appendChild(note);
      return;
    }
    var jobs = loadJobs();
    list.innerHTML = '';
    if (!jobs.length) {
      var empty = el('div', { class: 'recent-empty' }, [svg(IC.clock)]);
      empty.appendChild(biEl('p', null,
        'Nenhum processamento neste navegador. Os resultados aparecem aqui por 72 horas.',
        'No jobs in this browser yet. Results are listed here for 72 hours.'));
      list.appendChild(empty);
      return;
    }
    list.classList.add('recent-list');
    jobs.slice(0, 10).forEach(function (j) {
      var row = el('a', { class: 'recent-row', href: toolPage(j.tool) + '#job=' + j.id });
      row.appendChild(biEl('strong', null, j.title || j.tool));
      row.appendChild(el('span', { class: 'when' }, new Date(j.created).toLocaleString(isEn() ? 'en-GB' : 'pt-BR', { dateStyle: 'short', timeStyle: 'short' })));
      var st = el('span', { class: 'status-tag is-queued' });
      st.appendChild(bi('verificando', 'checking'));
      row.appendChild(st);
      list.appendChild(row);
      getJSON(API + '/jobs/' + j.id).then(function (d) {
        st.className = 'status-tag is-' + d.status; st.innerHTML = ''; st.appendChild(statusLabel(d.status));
      }).catch(function () {
        st.className = 'status-tag is-expired'; st.innerHTML = ''; st.appendChild(statusLabel('expired'));
      });
    });
  }

  // ---------- formulário em etapas ----------
  // O formulário continua gerado de backend/R/tools_spec.R (fonte única dos
  // campos); aqui só se decide a apresentação: etapas, cartões, desenho da
  // parcela, detecção do formato e a barra de execução.
  var LAYOUTS = {
    field_sheet: { pt: ['Ficha de campo', 'Padrão ForestPlots.net: linha de metadados e cabeçalho com New Tag No, T1, X, Y.'],
                   en: ['Field sheet', 'ForestPlots.net layout: a metadata row and a header with New Tag No, T1, X, Y.'], icon: 'grid' },
    fp_query_sheet: { pt: ['Exportação da Query Library', 'ForestPlots.net: Plot Code, Sub Plot T1, Standardised X e Y.'],
                      en: ['Query Library export', 'ForestPlots.net: Plot Code, Sub Plot T1, Standardised X and Y.'], icon: 'rows' },
    field_sheet_ti: { pt: ['Ficha de Terra Indígena', 'Linha de metadados e cabeçalho bilíngue (ex.: Panará); colunas reconhecidas pelo nome.'],
                      en: ['Indigenous Land field sheet', 'A metadata row and a bilingual header (e.g. Panará); columns recognised by name.'], icon: 'cols' },
    monitora: { pt: ['Protocolo MONITORA', 'Estações com quatro subunidades em cruz (ICMBio).'],
                en: ['MONITORA protocol', 'Stations with four subunits in a cross (ICMBio).'], icon: 'cross' },
    gigaflor: { pt: ['Protocolo GigaFlor', '1 ha, 25 subparcelas de 20 × 20 m com 4 quadrantes; X e Y em graus decimais, D em cm.'],
                en: ['GigaFlor protocol', '1 ha, 25 subplots of 20 × 20 m with 4 quadrants; X and Y in decimal degrees, D in cm.'], icon: 'giga' },
    forestplots: { pt: ['Planilha no padrão ForestPlots.net', 'Ficha de campo, exportação da Query Library ou ficha de Terra Indígena.'],
                   en: ['ForestPlots.net-style sheet', 'Field sheet, Query Library export or Indigenous Land sheet.'], icon: 'grid' },
    unknown: { pt: ['Formato não reconhecido', ''], en: ['Layout not recognised', ''], icon: 'grid' }
  };
  var LAYOUT_IC = {
    grid: '<rect x="3.5" y="6" width="17" height="14.5" rx="1"/><path d="M3.5 10h17M9.2 10v10.5M14.8 10v10.5M3.5 15.2h17M5 3.5h7"/>',
    rows: '<rect x="3.5" y="3.5" width="17" height="17" rx="1"/><path d="M3.5 8h17M3.5 12.5h17M3.5 17h17M8.5 3.5v17"/>',
    cols: '<rect x="3.5" y="6" width="17" height="14.5" rx="1"/><path d="M3.5 10h17M7 10v10.5M10.5 10v10.5M14 10v10.5M17.5 10v10.5M5 3.5h7"/>',
    giga: '<rect x="3.5" y="3.5" width="17" height="17" rx="1"/><path d="M10.3 3.5v17M13.7 3.5v17M3.5 10.3h17M3.5 13.7h17" opacity=".45"/><path d="M7 3.5v17M17 3.5v17M3.5 7h17M3.5 17h17"/>',
    cross: '<rect x="9.5" y="2.5" width="5" height="5.5"/><rect x="9.5" y="16" width="5" height="5.5"/><rect x="2.5" y="9.5" width="5.5" height="5"/><rect x="16" y="9.5" width="5.5" height="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'
  };
  var IC_OK = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
  var IC_INFO = '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>';
  var IC_EXPAND = '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>';
  var IC_EXT = '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>';
  var IC_DL = '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>';
  var STEP_OF = { fp_file: 'data', usar_exemplo: 'data', input_type: 'layout', station_name: 'layout',
                  plot_size: 'plot', subplot_size: 'plot', vertices: 'plot', vertex_file: 'plot' };
  var STEPS = [
    ['data', 'Seus dados', 'Your data'],
    ['layout', 'Formato da planilha', 'Spreadsheet layout'],
    ['plot', 'Geometria da parcela', 'Plot geometry'],
    ['options', 'Saídas e opções', 'Outputs and options']
  ];
  var MONITORA_COLS = ['colname_subplot_t2', 'colname_cap', 'colname_station', 'colname_census_year'];
  var PLOT_FIELDS = ['plot_size', 'subplot_size', 'plot_width_m', 'plot_length_m'];
  // Última leitura da planilha feita pelo forplotR no navegador (detect.R):
  // linha do cabeçalho, metadados, colunas e subparcelas. null = sem leitura.
  var detected = null;
  var HEADER_ROW_MAX = 12;

  function fieldNode(f) {
    if (f.type === 'select' && (f.name === 'input_type' || arr(f.options).length <= 6)) return choiceGroup(f);
    var id = 'f_' + f.name;
    var wrap = el('div', { class: 'form-field', 'data-field': f.name });
    if (f.type === 'bool' || f.type === 'example') {
      wrap.className = 'form-field check-field switch-field' + (f.type === 'example' ? ' example-field' : '');
      var lab = el('label', { for: id, class: 'switch' });
      var cb = el('input', { type: 'checkbox', id: id, name: f.name, role: 'switch' });
      cb.checked = f.type === 'bool' ? !!f.default : false;
      lab.appendChild(cb);
      lab.appendChild(el('span', { class: 'switch-track', 'aria-hidden': 'true' }));
      lab.appendChild(biEl('span', { class: 'switch-label' }, f.label));
      wrap.appendChild(lab);
    } else {
      var l = el('label', { for: id });
      l.appendChild(bi(f.label));
      if (f.required) l.appendChild(el('span', { class: 'req', 'aria-hidden': 'true' }, '*'));
      wrap.appendChild(l);
      var input;
      if (f.type === 'select') {
        input = el('select', { id: id, name: f.name });
        arr(f.options).forEach(function (o) {
          var op = el('option', { value: o.value, 'data-pt': o.label, 'data-en': tr(o.label) }, isEn() ? tr(o.label) : o.label);
          if (o.value === f.default) op.selected = true;
          input.appendChild(op);
        });
        wrap.appendChild(input);
      } else if (f.type === 'file') {
        var drop = el('div', { class: 'file-drop' });
        input = el('input', { type: 'file', id: id, name: f.name,
          accept: arr(f.accept_ext).map(function (e) { return '.' + e; }).join(',') });
        var btn = biEl('span', { class: 'file-btn', 'aria-hidden': 'true' }, 'Escolher arquivo', 'Choose file');
        var name = el('span', { class: 'file-name' });
        name.appendChild(bi('ou arraste para cá · ' + arr(f.accept_ext).map(function (e) { return '.' + e; }).join(', '),
                            'or drop it here · ' + arr(f.accept_ext).map(function (e) { return '.' + e; }).join(', ')));
        var placeholder = name.innerHTML;
        input.addEventListener('change', function () {
          var fl = input.files && input.files[0];
          drop.classList.toggle('has-file', !!fl);
          if (fl) name.textContent = fl.name + ' · ' + fmtSize(fl.size); else name.innerHTML = placeholder;
          clearError(wrap);
        });
        ['dragenter', 'dragover'].forEach(function (ev) { input.addEventListener(ev, function () { drop.classList.add('is-over'); }); });
        ['dragleave', 'drop'].forEach(function (ev) { input.addEventListener(ev, function () { drop.classList.remove('is-over'); }); });
        drop.appendChild(input); drop.appendChild(btn); drop.appendChild(name);
        wrap.appendChild(drop);
      } else if (f.type === 'vertices') {
        input = el('textarea', { id: id, name: f.name, rows: 4, spellcheck: 'false',
          placeholder: '-19.9000; -40.5500\n-19.9009; -40.5500\n-19.9000; -40.5490\n-19.9009; -40.5490' });
        wrap.appendChild(input);
      } else {
        input = el('input', { type: 'text', id: id, name: f.name,
          inputmode: f.type === 'number' ? 'decimal' : null, autocomplete: 'off' });
        if (f.default !== undefined && f.default !== null) input.value = arr(f.default).join(', ');
        wrap.appendChild(input);
      }
      if (f.required && f.type !== 'file') input.setAttribute('aria-required', 'true');
      input.addEventListener('input', function () { clearError(wrap); });
    }
    if (f.help) { var sm = el('small', { id: id + '_help' }); sm.appendChild(bi(f.help)); wrap.appendChild(sm); }
    return wrap;
  }

  // select com poucas opções: cartões (formato da planilha) ou botões segmentados
  function choiceGroup(f) {
    var id = 'f_' + f.name;
    var isLayout = f.name === 'input_type';
    var opts = arr(f.options);
    var def = opts.some(function (o) { return o.value === f.default; }) ? f.default : (opts[0] || {}).value;
    var wrap = el('div', { class: 'form-field choice-field' + (isLayout ? ' layout-field' : ''), 'data-field': f.name });
    var fs = el('fieldset', { class: isLayout ? 'layout-cards' : 'seg', id: id });
    var lg = el('legend', { class: isLayout ? 'visually-hidden' : null });
    lg.appendChild(bi(f.label));
    fs.appendChild(lg);
    opts.forEach(function (o) {
      var rid = id + '_' + o.value;
      var lab = el('label', { class: isLayout ? 'layout-card' : 'seg-opt', for: rid });
      var r = el('input', { type: 'radio', name: f.name, id: rid, value: o.value });
      if (o.value === def) r.checked = true;
      lab.appendChild(r);
      if (isLayout) {
        var L = LAYOUTS[o.value];
        lab.appendChild(svg(LAYOUT_IC[L ? L.icon : 'grid'], 'layout-ic'));
        var tx = el('span', { class: 'layout-tx' });
        tx.appendChild(L ? biEl('strong', null, L.pt[0], L.en[0]) : biEl('strong', null, o.label));
        if (L && L.pt[1]) tx.appendChild(biEl('small', null, L.pt[1], L.en[1]));
        lab.appendChild(tx);
      } else {
        lab.appendChild(biEl('span', null, o.label));
      }
      fs.appendChild(lab);
    });
    wrap.appendChild(fs);
    fs.addEventListener('change', function () { clearError(wrap); });
    if (f.help) { var sm = el('small', { id: id + '_help' }); sm.appendChild(bi(f.help)); wrap.appendChild(sm); }
    return wrap;
  }

  function setError(wrap, pt, en) {
    clearError(wrap);
    var inp = wrap.querySelector('input:not([type=checkbox]):not([type=radio]), select, textarea');
    if (inp) inp.setAttribute('aria-invalid', 'true');
    var drop = wrap.querySelector('.file-drop'); if (drop) drop.classList.add('is-invalid');
    var msg = biEl('p', { class: 'field-error', role: 'alert' }, pt, en);
    wrap.appendChild(msg);
  }
  function clearError(wrap) {
    var inp = wrap.querySelector('[aria-invalid]'); if (inp) inp.removeAttribute('aria-invalid');
    var drop = wrap.querySelector('.file-drop'); if (drop) drop.classList.remove('is-invalid');
    var m = wrap.querySelector('.field-error'); if (m) m.remove();
  }

  function emptyState(tool) {
    var box = el('div', { class: 'result-empty' }, [svg(IC.plot)]);
    box.appendChild(biEl('h3', null, 'Os resultados aparecem aqui', 'Results appear here'));
    box.appendChild(biEl('p', null,
      'Depois de Processar: os números da parcela, a prévia e os arquivos para baixar.',
      'After you press Run: the plot figures, a preview and the files to download.'));
    if (tool && tool.eta) box.appendChild(biEl('p', { class: 'muted-note' }, 'Tempo típico: ' + tool.eta + '.', 'Typical time: ' + tr(tool.eta) + '.'));
    return box;
  }

  function skeleton(mount) {
    mount.innerHTML = '';
    var shell = el('div', { class: 'tool-shell', 'aria-busy': 'true' });
    var card = el('div', { class: 'tool-card' });
    var g = el('div', { class: 'sk-group' });
    for (var i = 0; i < 4; i++) g.appendChild(el('div', null, [el('span', { class: 'sk sk-label' }), el('span', { class: 'sk sk-input' })]));
    card.appendChild(g);
    shell.appendChild(card);
    mount.appendChild(shell);
  }

  function renderUnavailable(tool, mount) {
    mount.innerHTML = '';
    var box = el('div', { class: 'result-empty is-error', role: 'note' }, [svg(IC.offline)]);
    box.appendChild(biEl('h3', null, 'Indisponível no navegador', 'Not available in the browser'));
    box.appendChild(biEl('p', null, tool.note || ''));
    box.appendChild(el('p', { class: 'muted-note' }, 'forplotR::' + tool.fun + '()'));
    mount.appendChild(box);
  }

  function stepSection(key, n, pt, en) {
    var sec = el('section', { class: 'step', 'data-step': key, 'aria-labelledby': 'step-' + key });
    var h = el('h3', { class: 'step-head', id: 'step-' + key });
    h.appendChild(el('span', { class: 'step-n', 'aria-hidden': 'true' }, String(n)));
    h.appendChild(bi(pt, en));
    sec.appendChild(h);
    return sec;
  }

  function renderTool(tool, mount) {
    if (tool.available === false) { renderUnavailable(tool, mount); return; }
    mount.innerHTML = '';
    var shell = el('div', { class: 'tool-shell' });
    var card = el('div', { class: 'tool-card' });
    var head = el('div', { class: 'fp-tool-head' });
    head.appendChild(el('span', { class: 'eyebrow' }, 'forplotR::' + tool.fun + '()'));
    head.appendChild(el('span', { class: 'api-status' }));
    card.appendChild(head);
    var form = el('form', { class: 'tool-form wizard', id: 'tool-form', novalidate: true });
    card.appendChild(form);
    var res = el('div', { class: 'result-panel', id: 'result-panel', 'aria-live': 'polite' });
    res.appendChild(emptyState(tool));
    shell.appendChild(card);
    shell.appendChild(res);
    mount.appendChild(shell);

    var by = {};
    tool.fields.forEach(function (f) { by[f.name] = f; });
    var hasPlot = !!(by.plot_size || by.vertices);
    var secs = {}, n = 0;
    STEPS.forEach(function (s) {
      if (s[0] === 'plot' && !hasPlot) return;
      if (s[0] === 'layout' && !by.input_type) return;
      secs[s[0]] = stepSection(s[0], ++n, s[1], s[2]);
      form.appendChild(secs[s[0]]);
    });

    // 1. dados: planilha própria ou exemplo, e a leitura do cabeçalho
    var cards = el('div', { class: 'source-cards' });
    if (by.fp_file) {
      var up = fieldNode(by.fp_file);
      up.classList.add('src-card', 'src-upload');
      var lab0 = up.querySelector('label');
      if (lab0) { lab0.innerHTML = ''; lab0.appendChild(biEl('strong', null, 'Usar minha planilha', 'Use my spreadsheet')); }
      var hint = up.querySelector('small');
      if (hint) { hint.innerHTML = ''; hint.appendChild(bi(LOCAL ? 'O app lê o cabeçalho e sugere o formato e as colunas.' : 'Planilha Excel da parcela.',
                                                         LOCAL ? 'The app reads the header and suggests the layout and columns.' : 'Excel spreadsheet of the plot.')); }
      cards.appendChild(up);
      up.querySelector('input[type=file]').addEventListener('change', function (e) {
        var fl = e.target.files && e.target.files[0];
        if (fl && $('f_usar_exemplo')) { $('f_usar_exemplo').checked = false; }
        var hrSel = $('f_header_row'); if (hrSel && hrSel.tagName === 'SELECT') hrSel.value = '';
        onFileChosen(tool, fl);
        form.dispatchEvent(new Event('change'));
      });
    }
    if (by.usar_exemplo) {
      var exw = el('div', { class: 'form-field check-field example-field src-card src-example', 'data-field': 'usar_exemplo' });
      var exl = el('label', { for: 'f_usar_exemplo' });
      exl.appendChild(el('input', { type: 'checkbox', id: 'f_usar_exemplo', name: 'usar_exemplo' }));
      var ext = el('span', { class: 'src-text' });
      ext.appendChild(biEl('strong', null, 'Testar com os dados de exemplo', 'Try the example data'));
      ext.appendChild(biEl('small', null, 'Dados que vêm com o pacote; nada para enviar.', 'Data that ship with the package; nothing to upload.'));
      exl.appendChild(ext);
      exw.appendChild(exl);
      cards.appendChild(exw);
    }
    secs.data.appendChild(cards);
    if (by.usar_exemplo && by.input_type) {
      var pick = el('div', { class: 'example-pick', id: 'example-pick', hidden: true, role: 'group' });
      [['field_sheet', 'RUS01', 'Mata Atlântica · parcela de 1 ha · ficha de campo', 'Atlantic Forest · 1-ha plot · field sheet'],
       ['monitora', 'TUM', 'Amazônia · estações do MONITORA', 'Amazon · MONITORA stations']].forEach(function (x) {
        var lay = mapLayout(tool, x[0]);
        if (!lay) return;
        var b = el('button', { type: 'button', class: 'ex-opt', 'data-layout': lay, 'aria-pressed': 'false' });
        b.appendChild(el('strong', null, x[1]));
        b.appendChild(biEl('span', null, x[2], x[3]));
        b.addEventListener('click', function () { setLayout(lay); });
        pick.appendChild(b);
      });
      secs.data.appendChild(pick);
    }
    secs.data.appendChild(el('div', { class: 'detect-box', id: 'detect-box', hidden: true, 'aria-live': 'polite' }));
    var localHeaderRow = !!(by.header_row && LOCAL && LOCAL.detect);
    if (localHeaderRow) secs.data.appendChild(headerRowControl(tool, by.header_row));

    // demais campos, cada um na sua etapa
    var groups = {};
    var titles = { avancado: ['Opções avançadas', 'Advanced options'], colunas: ['Colunas da planilha', 'Spreadsheet columns'],
                   logos: ['Logos no cabeçalho', 'Logos in the header'] };
    var plotInputs = null;
    tool.fields.forEach(function (f) {
      if (f.name === 'fp_file' || f.name === 'usar_exemplo') return;
      if (f.name === 'header_row' && localHeaderRow) return; // fica junto da leitura da planilha
      var g = f.group || 'principal';
      if (g !== 'principal') {
        if (!groups[g]) {
          var det = el('details', { class: 'adv-group', id: 'group-' + g });
          var t = titles[g] || [g, g];
          det.appendChild(biEl('summary', null, t[0], t[1]));
          if (g === 'logos') det.appendChild(biEl('p', { class: 'muted-note' },
            'A logo do forplotR entra sempre. Marque as outras que devem aparecer no cabeçalho do resultado.',
            'The forplotR logo is always there. Tick the others that should appear in the header of the result.'));
          if (g === 'colunas') det.appendChild(biEl('p', { class: 'muted-note' },
            'Só é preciso preencher se a planilha usa nomes diferentes dos padrões (veja Dados aceitos).',
            'Only needed if the spreadsheet uses names other than the defaults (see Supported data).'));
          var inner = el('div', { class: 'adv-inner' });
          det.appendChild(inner);
          groups[g] = inner; groups['_' + g] = det;
        }
        groups[g].appendChild(fieldNode(f));
        return;
      }
      var step = STEP_OF[f.name] || 'options';
      if (step === 'plot' && secs.plot) {
        if (!plotInputs) {
          var pg = el('div', { class: 'plot-grid' });
          plotInputs = el('div', { class: 'plot-inputs' });
          var fig = el('figure', { class: 'plot-diagram', id: 'plot-diagram' });
          pg.appendChild(plotInputs); pg.appendChild(fig);
          secs.plot.appendChild(pg);
        }
        plotInputs.appendChild(fieldNode(f));
        return;
      }
      (secs[step] || secs.options).appendChild(fieldNode(f));
    });
    if (secs.options && secs.options.children.length < 2) { secs.options.remove(); }
    ['logos', 'avancado', 'colunas'].forEach(function (g) { if (groups['_' + g]) form.appendChild(groups['_' + g]); });

    // barra de execução
    var bar = el('div', { class: 'run-bar' });
    bar.appendChild(el('p', { class: 'run-sum', id: 'run-sum', 'aria-live': 'polite' }));
    var btn = el('button', { type: 'submit', class: 'fx-btn fx-btn-primary', id: 'submit-btn' });
    btn.appendChild(bi('Processar', 'Run'));
    bar.appendChild(btn);
    form.appendChild(bar);
    form.appendChild(biEl('p', { class: 'muted-note form-req' }, '* campo obrigatório', '* required field'));

    form.addEventListener('change', function (e) {
      if (e.isTrusted && e.target && /^f_logo_/.test(e.target.id || '')) e.target.setAttribute('data-touched', '1');
      applyVisibility(tool);
    });
    form.addEventListener('input', function (e) { if (e.target && /^(plot_|subplot_size)/.test(e.target.name || '')) applyVisibility(tool); });
    applyVisibility(tool);
    form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(tool); });
    // Trocar de aba: lê de novo o cabeçalho dessa aba (linha do cabeçalho volta ao automático)
    var sheetInp = form.elements.sheet;
    if (sheetInp && LOCAL && LOCAL.detect) sheetInp.addEventListener('change', function () {
      var cur = $('f_fp_file'); var file = cur && cur.files && cur.files[0];
      var hrSel = $('f_header_row'); if (hrSel && hrSel.tagName === 'SELECT') hrSel.value = '';
      if (file) onFileChosen(tool, file);
    });
  }

  function currentValue(name) {
    var f = $('tool-form'); var inp = f && f.elements[name];
    if (!inp) return '';
    return inp.value || '';
  }
  function layoutOptions(tool) {
    var f = tool.fields.filter(function (x) { return x.name === 'input_type'; })[0];
    return f ? arr(f.options).map(function (o) { return o.value; }) : [];
  }
  // formato detectado -> opção existente nesta ferramenta
  function mapLayout(tool, type) {
    var opts = layoutOptions(tool);
    if (opts.indexOf(type) >= 0) return type;
    var fsLike = /^(field_sheet|fp_query_sheet|field_sheet_ti|unknown)$/.test(type);
    if (fsLike && opts.indexOf('forestplots') >= 0) return 'forestplots';
    if (fsLike && opts.indexOf('field_sheet') >= 0) return 'field_sheet';
    return null;
  }
  function setLayout(v) {
    var r = document.querySelector('#tool-form input[name="input_type"][value="' + v + '"]');
    if (r && !r.checked) { r.checked = true; }
    $('tool-form').dispatchEvent(new Event('change'));
  }

  function plotDims() {
    var num = function (n) { var x = parseFloat(String(currentValue(n) || '').replace(',', '.')); return isFinite(x) && x > 0 ? x : null; };
    var s = num('subplot_size') || 10, ha = num('plot_size') || 1, w = num('plot_width_m'), l = num('plot_length_m');
    if (!w && !l) { w = l = Math.sqrt(ha * 10000); }
    else if (!w) w = ha * 10000 / l;
    else if (!l) l = ha * 10000 / w;
    return { w: w, l: l, s: s, nx: Math.max(1, Math.round(w / s)), ny: Math.max(1, Math.round(l / s)) };
  }
  function fmtNum(x) { return (Math.round(x * 10) / 10).toLocaleString(isEn() ? 'en' : 'pt-BR'); }
  // GigaFlor (protocolo 1) usa subparcelas de 20 m: ao escolher o formato, o
  // lado da subparcela passa de 10 para 20 (e volta), se a pessoa não o mudou.
  var lastLayout = null;
  function syncGigaflorSubplot() {
    var lay = currentValue('input_type');
    var inp = $('f_subplot_size');
    if (inp && lay !== lastLayout) {
      if (lay === 'gigaflor' && (inp.value === '' || inp.value === '10')) inp.value = '20';
      else if (lastLayout === 'gigaflor' && inp.value === '20') inp.value = '10';
    }
    lastLayout = lay;
  }
  function drawPlot(tool) {
    var fig = $('plot-diagram');
    if (!fig) return;
    var mon = currentValue('input_type') === 'monitora';
    var hasV = tool.fields.some(function (f) { return f.name === 'vertices'; });
    var W = 220, H = 220, P = 26, s = '';
    if (mon) {
      var c = W / 2, a = 30, gap = 12;
      [[c - a / 2, P], [c - a / 2, H - P - a * 1.6], [P, c - a / 2], [W - P - a * 1.6, c - a / 2]].forEach(function (p, i) {
        var w = i < 2 ? a : a * 1.6, h = i < 2 ? a * 1.6 : a;
        s += '<rect class="pd-plot" x="' + p[0] + '" y="' + p[1] + '" width="' + w + '" height="' + h + '"/>';
      });
      s += '<circle class="pd-dot" cx="' + c + '" cy="' + c + '" r="4"/>';
      if (hasV) s += '<text class="pd-lab" x="' + (c + 8) + '" y="' + (c - 8) + '">1</text>';
    } else {
      var g = plotDims();
      var k = (W - 2 * P) / Math.max(g.w, g.l), pw = g.w * k, ph = g.l * k, x0 = (W - pw) / 2, y0 = (H - ph) / 2;
      var stepX = Math.max(1, Math.ceil(g.nx / 40)), stepY = Math.max(1, Math.ceil(g.ny / 40));
      for (var i = 1; i < g.nx; i += stepX) s += '<line class="pd-grid" x1="' + (x0 + i * pw / g.nx) + '" y1="' + y0 + '" x2="' + (x0 + i * pw / g.nx) + '" y2="' + (y0 + ph) + '"/>';
      for (var j = 1; j < g.ny; j += stepY) s += '<line class="pd-grid" x1="' + x0 + '" y1="' + (y0 + j * ph / g.ny) + '" x2="' + (x0 + pw) + '" y2="' + (y0 + j * ph / g.ny) + '"/>';
      s += '<rect class="pd-plot" x="' + x0 + '" y="' + y0 + '" width="' + pw + '" height="' + ph + '"/>';
      if (hasV) {
        // ordem dos vértices: (0,0), (0, comprimento), (largura, 0), (largura, comprimento)
        [[x0, y0 + ph, '1', -14, 14], [x0, y0, '2', -14, -4], [x0 + pw, y0 + ph, '3', 5, 14], [x0 + pw, y0, '4', 5, -4]].forEach(function (v) {
          s += '<circle class="pd-dot" cx="' + v[0] + '" cy="' + v[1] + '" r="3.5"/><text class="pd-lab" x="' + (v[0] + v[3]) + '" y="' + (v[1] + v[4]) + '">' + v[2] + '</text>';
        });
      }
    }
    fig.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-hidden="true">' + s + '</svg>';
    var cap = el('figcaption');
    if (mon) cap.appendChild(bi('MONITORA: o desenho do protocolo vale para a estação; área e subparcela são ignoradas.' + (hasV ? ' Informe um ponto: o centro da estação.' : ''),
                                'MONITORA: the protocol design applies to the station; area and subplot are ignored.' + (hasV ? ' Give one point: the centre of the station.' : '')));
    else {
      var g2 = plotDims();
      cap.appendChild(bi(fmtNum(g2.w) + ' × ' + fmtNum(g2.l) + ' m · ' + (g2.nx * g2.ny) + ' subparcelas de ' + fmtNum(g2.s) + ' × ' + fmtNum(g2.s) + ' m' + (hasV ? '. Vértices na ordem 1 a 4, como no desenho.' : ''),
                         fmtNum(g2.w) + ' × ' + fmtNum(g2.l) + ' m · ' + (g2.nx * g2.ny) + ' subplots of ' + fmtNum(g2.s) + ' × ' + fmtNum(g2.s) + ' m' + (hasV ? '. Corners in the order 1 to 4, as drawn.' : '')));
      if (currentValue('input_type') === 'gigaflor') {
        cap.appendChild(bi(' GigaFlor: X e Y da planilha são longitude e latitude; a posição de cada árvore na grade é calculada a partir delas' + (hasV ? ', e os vértices são opcionais.' : '.'),
                           ' GigaFlor: X and Y in the spreadsheet are longitude and latitude; the position of each tree on the grid is computed from them' + (hasV ? ', and the corners are optional.' : '.')));
      }
    }
    fig.appendChild(cap);
  }

  function updateRunSum(tool) {
    var s = $('run-sum');
    if (!s) return;
    var pt = [], en = [];
    var ex = $('f_usar_exemplo') && $('f_usar_exemplo').checked;
    var fi = $('f_fp_file'), fl = fi && fi.files && fi.files[0];
    if (ex) { pt.push('Dados de exemplo'); en.push('Example data'); }
    else if (fl) { pt.push(fl.name); en.push(fl.name); }
    else if (fi) { pt.push('Nenhuma planilha escolhida'); en.push('No spreadsheet chosen'); }
    var L = LAYOUTS[currentValue('input_type')];
    if (L) { pt.push(L.pt[0]); en.push(L.en[0]); }
    var warn = false;
    if ($('plot-diagram') && currentValue('input_type') !== 'monitora') {
      var g = plotDims(), grid = g.nx * g.ny;
      var inSheet = !ex && fl && detected && detected.n_subplots;
      if (inSheet) {
        // o que a planilha tem, não o que a geometria do formulário comporta
        pt.push(inSheet + ' subparcelas'); en.push(inSheet + ' subplots');
        if (detected.subplot_max > grid) {
          warn = true;
          pt.push('a geometria informada só comporta ' + grid + ' (a planilha vai até a subparcela ' + detected.subplot_max + ')');
          en.push('the geometry given only holds ' + grid + ' (the sheet goes up to subplot ' + detected.subplot_max + ')');
        }
      } else { pt.push(grid + ' subparcelas'); en.push(grid + ' subplots'); }
    }
    s.classList.toggle('is-warn', warn);
    s.innerHTML = '';
    s.appendChild(bi(pt.join(' · '), en.join(' · ')));
  }

  function applyVisibility(tool) {
    var ex = $('f_usar_exemplo');
    var useEx = ex && ex.checked;
    var lay = currentValue('input_type');
    var mon = lay === 'monitora';
    syncGigaflorSubplot();
    tool.fields.forEach(function (f) {
      var node = document.querySelector('[data-field="' + f.name + '"]');
      if (!node) return;
      var show = true;
      if (f.show_if) show = arr(f.show_if.values).indexOf(currentValue(f.show_if.field)) >= 0;
      if (mon && PLOT_FIELDS.indexOf(f.name) >= 0) show = false;
      if (!mon && MONITORA_COLS.indexOf(f.name) >= 0) show = false;
      node.hidden = !show;
      if (f.name === 'fp_file') {
        node.classList.toggle('is-disabled', !!useEx);
        var inp = node.querySelector('input'); if (inp) inp.disabled = !!useEx;
        if (useEx) clearError(node);
      }
    });
    var pick = $('example-pick');
    if (pick) {
      pick.hidden = !useEx;
      pick.querySelectorAll('.ex-opt').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-layout') === lay ? 'true' : 'false'); });
    }
    if (useEx && $('detect-box')) $('detect-box').hidden = true;
    if (useEx && document.querySelector('[data-field^="colname_"] select')) resetColumnSelects();
    var hrField = document.querySelector('.header-row-field');
    if (hrField) hrField.hidden = !!useEx || !detected;
    drawPlot(tool);
    updateRunSum(tool);
  }
  function isHidden(f) { var node = document.querySelector('[data-field="' + f.name + '"]'); return !node || node.hidden; }

  // ---------- leitura do cabeçalho (só no navegador) ----------
  // Quem lê a planilha é o forplotR, dentro do webR (backend/webr/detect.R):
  // a linha do cabeçalho, os metadados acima dela e as colunas mostradas aqui
  // são as que o pacote vai usar. Não há leitura de planilha em JavaScript.
  function onFileChosen(tool, file, headerRow) {
    var box = $('detect-box');
    if (!box) return;
    if (!LOCAL || !LOCAL.detect || !file || !/\.xlsx?$/i.test(file.name)) {
      detected = null; box.hidden = true; resetColumnSelects(); applyVisibility(tool); return;
    }
    // enquanto a nova leitura não chega, nada da planilha anterior fica à mostra
    detected = null; resetColumnSelects();
    box.hidden = false; box.className = 'detect-box is-busy'; box.innerHTML = '';
    var ready = LOCAL.stage && LOCAL.stage() === 'ready';
    box.appendChild(biEl('p', { class: 'detect-head' },
      ready ? 'Lendo o cabeçalho da planilha…' : 'Carregando o R no navegador para ler o cabeçalho…',
      ready ? 'Reading the spreadsheet header…' : 'Loading R in your browser to read the header…'));
    LOCAL.detect(file, headerRow || '', currentValue('sheet')).then(function (d) {
      var cur = $('f_fp_file'); var now = cur && cur.files && cur.files[0];
      if (now !== file) return; // outro arquivo foi escolhido nesse meio-tempo
      if (d) renderDetect(tool, d); else { detected = null; box.hidden = true; resetColumnSelects(); applyVisibility(tool); }
    }).catch(function () { detected = null; box.hidden = true; resetColumnSelects(); applyVisibility(tool); });
  }

  // "Linha do cabeçalho: [automática / 1 / 2 / 3 …]": reprocessa ao mudar
  function headerRowControl(tool, f) {
    var wrap = el('div', { class: 'form-field header-row-field', 'data-field': 'header_row', hidden: true });
    var lab = el('label', { for: 'f_header_row' });
    lab.appendChild(bi('Linha do cabeçalho', 'Header row'));
    wrap.appendChild(lab);
    var sel = el('select', { id: 'f_header_row', name: f.name });
    sel.appendChild(el('option', { value: '' }, isEn() ? 'automatic' : 'automática'));
    wrap.appendChild(sel);
    sel.addEventListener('change', function () {
      var cur = $('f_fp_file'); var file = cur && cur.files && cur.files[0];
      if (file) onFileChosen(tool, file, sel.value);
    });
    return wrap;
  }
  function syncHeaderRow(d) {
    var sel = $('f_header_row');
    if (!sel || sel.tagName !== 'SELECT') return;
    var rows = arr(d.header_rows).slice(0, HEADER_ROW_MAX);
    if (rows.indexOf(d.header_row) < 0) rows.push(d.header_row);
    rows.sort(function (a, b) { return a - b; });
    sel.innerHTML = '';
    var auto = d.header_row_auto;
    var op0 = el('option', { value: '' });
    op0.appendChild(bi(auto ? 'automática (linha ' + auto + ')' : 'automática', auto ? 'automatic (row ' + auto + ')' : 'automatic'));
    op0.textContent = isEn() ? (auto ? 'automatic (row ' + auto + ')' : 'automatic') : (auto ? 'automática (linha ' + auto + ')' : 'automática');
    sel.appendChild(op0);
    rows.forEach(function (r) { sel.appendChild(el('option', { value: String(r) }, String(r))); });
    sel.value = d.header_row_forced ? String(d.header_row) : '';
  }

  function fmtDate(iso, en) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return iso || '';
    return en ? iso : m[3] + '/' + m[2] + '/' + m[1];
  }
  // Metadados lidos acima do cabeçalho: código, nome, data e equipe
  function metaCard(m) {
    var team = arr(m.team);
    if (!m.plot_code && !m.plot_name && !m.date && !team.length) return null;
    var dl = el('dl', { class: 'meta-card' });
    var row = function (pt, en, node) {
      var d = el('div');
      d.appendChild(biEl('dt', null, pt, en));
      var dd = el('dd'); dd.appendChild(node); d.appendChild(dd);
      dl.appendChild(d);
    };
    if (m.plot_code) row('Código da parcela', 'Plot code', el('span', { class: 'meta-code' }, m.plot_code));
    if (m.plot_name) row('Nome', 'Name', el('span', null, m.plot_name));
    if (m.date) row('Data', 'Date', bi(fmtDate(m.date, false), fmtDate(m.date, true)));
    if (team.length) {
      var sp = el('span');
      sp.appendChild(biEl('strong', null, team.length + (team.length === 1 ? ' pessoa' : ' pessoas'), team.length + (team.length === 1 ? ' person' : ' people')));
      sp.appendChild(document.createTextNode(' · ' + team.join(', ')));
      row('Equipe', 'Team', sp);
    }
    return dl;
  }

  function renderDetect(tool, d) {
    var box = $('detect-box');
    box.innerHTML = ''; box.className = 'detect-box';
    if (!d.ok) {
      detected = null;
      resetColumnSelects();
      box.classList.add('is-warn');
      box.appendChild(biEl('p', { class: 'detect-head' }, 'Não foi possível ler o cabeçalho. Escolha o formato abaixo.', 'Could not read the header. Choose the layout below.'));
      if (d.error) box.appendChild(el('p', { class: 'detect-note' }, String(d.error)));
      applyVisibility(tool);
      return;
    }
    if (d.legacy) {
      // O forplotR deste build não tem a detecção do cabeçalho: não listamos
      // colunas (seriam as da linha 1, que pode ser de metadados).
      detected = null;
      resetColumnSelects();
      box.classList.add('is-warn');
      box.appendChild(biEl('p', { class: 'detect-head' },
        'Esta versão do app foi montada com um forplotR sem a leitura do cabeçalho: as colunas da planilha não puderam ser listadas.',
        'This build of the app uses a forplotR without header detection: the spreadsheet columns could not be listed.'));
      box.appendChild(biEl('p', { class: 'detect-note' },
        'Escolha o formato abaixo. Se precisar indicar colunas, digite o nome exatamente como está no cabeçalho.',
        'Choose the layout below. To map a column, type its name exactly as written in the header.'));
      var layL = mapLayout(tool, d.type);
      if (layL && d.type !== 'unknown') setLayout(layL);
      applyVisibility(tool);
      return;
    }
    detected = d;
    syncHeaderRow(d);
    var lay = mapLayout(tool, d.type);
    var L = LAYOUTS[d.type] || LAYOUTS.unknown;
    var head = el('p', { class: 'detect-head' }, [svg(d.type === 'unknown' ? IC_INFO : IC_OK)]);
    if (d.type === 'unknown') {
      box.classList.add('is-warn');
      head.appendChild(bi('O cabeçalho não corresponde a um formato reconhecido. Confira a linha do cabeçalho e indique as colunas abaixo.',
                          'The header does not match a recognised layout. Check the header row and map the columns below.'));
    } else {
      head.appendChild(bi('Formato sugerido: ' + L.pt[0] + '.' + (d.confidence === 'low' ? ' Confira abaixo.' : ''),
                          'Suggested layout: ' + L.en[0] + '.' + (d.confidence === 'low' ? ' Please check below.' : '')));
    }
    box.appendChild(head);

    var meta = d.meta || { plot_code: d.plot_code, plot_name: d.plot_name };
    var card = metaCard(meta);
    if (card) box.appendChild(card);

    var ul = el('ul', { class: 'detect-facts' });
    var who = [d.plot_code, d.plot_name].filter(function (x) { return x; }).join(' · ');
    if (who && !card) ul.appendChild(el('li', null, who));
    if (d.n_sheets > 1) ul.appendChild(biEl('li', null, 'Aba ' + d.sheet + ' de ' + d.n_sheets + ' (' + d.sheet_name + ')', 'Sheet ' + d.sheet + ' of ' + d.n_sheets + ' (' + d.sheet_name + ')'));
    if (d.header_row) ul.appendChild(biEl('li', null, 'Cabeçalho na linha ' + d.header_row, 'Header on row ' + d.header_row));
    if (d.n_rows) ul.appendChild(biEl('li', null, d.n_rows + ' linhas', d.n_rows + ' rows'));
    if (d.n_subplots) ul.appendChild(biEl('li', null, d.n_subplots + ' subparcelas', d.n_subplots + ' subplots'));
    var stations = arr(d.stations);
    if (stations.length) ul.appendChild(biEl('li', null, 'Estações: ' + stations.join(', '), 'Stations: ' + stations.join(', ')));
    if (ul.children.length) box.appendChild(ul);
    if (lay) setLayout(lay);
    if (stations.length) stationChips(stations);
    // Logos da CI e da Iakiô: sugeridas para a ficha de Terra Indígena, até a
    // pessoa mexer na caixa (aí vale a escolha dela).
    var ti = d.type === 'field_sheet_ti', suggested = false;
    ['f_logo_ci', 'f_logo_iakio'].forEach(function (id) {
      var lp = $(id);
      if (!lp || lp.getAttribute('data-touched') === '1') return;
      lp.checked = ti; suggested = suggested || ti;
    });
    if (suggested && $('group-logos')) {
      $('group-logos').open = true;
      box.appendChild(biEl('p', { class: 'detect-note' },
        'Ficha de Terra Indígena: as logos da CI e da Iakiô foram marcadas em “Logos no cabeçalho”. Desmarque se não quiser.',
        'Indigenous Land field sheet: the CI and Iakiô logos were ticked under “Logos in the header”. Untick them if you prefer.'));
    }

    // Os seletores de coluna mostram sempre o cabeçalho lido pelo R
    var missing = arr(d.missing);
    var headers = arr(d.columns).length ? arr(d.columns) : arr(d.headers).map(function (h) { return { value: h, label: h }; });
    var nSug = Object.keys(d.suggest || {}).length;
    // MONITORA e GigaFlor: o pacote conhece os nomes das colunas desses formatos
    var ownCols = d.type === 'monitora' || d.type === 'gigaflor';
    if (!headers.length || ownCols) resetColumnSelects();
    if (headers.length && !ownCols && document.querySelector('[data-field^="colname_"]')) {
      // Planilha com nomes diferentes do padrão: todos os campos reconhecidos
      // aparecem já escolhidos. Com os nomes padrão, nada precisa ser indicado.
      columnSelects(headers, nSug ? (d.mapped || d.suggest || {}) : {});
      var det = $('group-colunas');
      if (missing.length) {
        if (det) det.open = true;
        box.appendChild(biEl('p', { class: 'detect-note' },
          missing.length + ' coluna(s) não encontrada(s) nesta linha de cabeçalho' + (nSug ? '; ' + nSug + ' reconhecida(s) pelo nome' : '') + '. Indique-as em “Colunas da planilha” antes de processar.',
          missing.length + ' column(s) not found on this header row' + (nSug ? '; ' + nSug + ' recognised by name' : '') + '. Map them under “Spreadsheet columns” before running.'));
      } else if (nSug) {
        box.appendChild(biEl('p', { class: 'detect-note' },
          'Todas as colunas foram reconhecidas pelo nome; ' + nSug + ' com nome diferente do padrão já estão indicadas em “Colunas da planilha”.',
          'All columns were recognised by name; ' + nSug + ' with a name other than the default are already set under “Spreadsheet columns”.'));
      }
    }
    arr(d.renamed).forEach(function (r) {
      box.appendChild(biEl('p', { class: 'detect-note' },
        'Duas colunas são lidas como “' + r.name + '”: usamos a coluna ' + r.used_position + ' (“' + r.used + '”); a coluna ' + r.other_position + ' (“' + r.other + '”) é ignorada.',
        'Two columns read as “' + r.name + '”: column ' + r.used_position + ' (“' + r.used + '”) is used; column ' + r.other_position + ' (“' + r.other + '”) is ignored.'));
    });
    if (/^(field_sheet|unknown)$/.test(d.type) && !d.has_meta && $('f_plot_name')) {
      var adv = $('group-avancado'); if (adv) adv.open = true;
      box.appendChild(biEl('p', { class: 'detect-note' },
        'A planilha não tem a linha de metadados (Plotcode:, Plot Name:): informe o nome ou o código da parcela em “Opções avançadas”.',
        'The spreadsheet has no metadata row (Plotcode:, Plot Name:): give the plot name or code under “Advanced options”.'));
    }
    box.appendChild(biEl('p', { class: 'detect-privacy' }, 'Lido no seu computador; nada foi enviado.', 'Read on your computer; nothing was sent.'));
    $('tool-form').dispatchEvent(new Event('change'));
  }

  // estações detectadas viram botões que preenchem o campo
  function stationChips(stations) {
    var node = document.querySelector('[data-field="station_name"]');
    if (!node) return;
    var inp = node.querySelector('input');
    var old = node.querySelector('.chips'); if (old) old.remove();
    var multi = /\(ões\)|\(s\)/.test(node.querySelector('label') ? node.querySelector('label').textContent : '');
    var box = el('div', { class: 'chips', role: 'group' });
    var sync = function () {
      var cur = inp.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      box.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', cur.indexOf(b.textContent) >= 0 ? 'true' : 'false'); });
    };
    stations.forEach(function (st) {
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false' }, st);
      b.addEventListener('click', function () {
        var cur = inp.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
        if (multi) { var i = cur.indexOf(st); if (i >= 0) cur.splice(i, 1); else cur.push(st); }
        else cur = [st];
        inp.value = cur.join(', ');
        clearError(node); sync(); updateRunSum();
      });
      box.appendChild(b);
    });
    inp.insertAdjacentElement('afterend', box);
    if (!inp.value.trim()) inp.value = stations[0];
    sync();
  }

  // colunas: a lista vira um seletor com as colunas do arquivo
  // Seletores de coluna: "(nome padrão)" + as colunas do cabeçalho detectado,
  // na ordem da planilha. As opções vêm só do R (detect.R -> read_plot_header()
  // do forplotR); o valor de cada uma é o nome que a coluna tem na leitura.
  // São refeitos do zero a cada leitura: nada sobra de outro arquivo ou aba.
  function columnSelects(columns, suggest) {
    var values = columns.map(function (c) { return c.value; });
    document.querySelectorAll('[data-field^="colname_"]').forEach(function (node) {
      var name = node.getAttribute('data-field');
      var old = node.querySelector('input, select');
      if (!old) return;
      var sel = el('select', { id: old.id, name: name });
      sel.appendChild(el('option', { value: '' }, isEn() ? '(default name)' : '(nome padrão)'));
      columns.forEach(function (c) {
        sel.appendChild(el('option', { value: c.value }, isEn() ? (c.label_en || c.label || c.value) : (c.label || c.value)));
      });
      // sugestão do R; senão, a escolha da própria pessoa, se a coluna ainda existe
      var chosen = node.classList.contains('is-suggested') ? '' : (old.value || '').trim();
      var v = suggest[name] || (values.indexOf(chosen) >= 0 ? chosen : '');
      sel.value = v;
      node.classList.toggle('is-suggested', !!suggest[name]);
      old.replaceWith(sel);
    });
  }
  // Sem leitura da planilha (exemplo, outro formato, erro): volta ao campo de texto vazio
  function resetColumnSelects() {
    document.querySelectorAll('[data-field^="colname_"]').forEach(function (node) {
      var old = node.querySelector('select');
      node.classList.remove('is-suggested');
      if (!old) return;
      old.replaceWith(el('input', { type: 'text', id: old.id, name: node.getAttribute('data-field'), autocomplete: 'off' }));
    });
  }

  function buildFormData(tool) {
    var form = $('tool-form');
    var fd = new FormData();
    var bad = 0;
    var maxMb = state.health ? state.health.max_upload_mb : 200;
    var useEx = $('f_usar_exemplo') && $('f_usar_exemplo').checked;
    tool.fields.forEach(function (f) {
      if (isHidden(f)) return;
      var inp = form.elements[f.name];
      var wrap = document.querySelector('[data-field="' + f.name + '"]');
      if (!inp) return;
      if (f.type === 'file') {
        if (f.name === 'fp_file' && useEx) return;
        if (inp.files && inp.files.length) {
          var file = inp.files[0];
          if (file.size > maxMb * 1048576) { setError(wrap, 'Arquivo maior que ' + maxMb + ' MB.', 'File larger than ' + maxMb + ' MB.'); bad++; }
          else fd.append(f.name, file, file.name);
        } else if (f.required) { setError(wrap, 'Envie um arquivo ou marque os dados de exemplo.', 'Upload a file or tick the example data.'); bad++; }
      } else if (f.type === 'bool' || f.type === 'example') {
        fd.append(f.name, inp.checked ? 'true' : 'false');
      } else {
        var v = (inp.value || '').trim();
        if (f.type === 'number' && v && isNaN(Number(v.replace(',', '.')))) { setError(wrap, 'Use um número, ex.: 1 ou 0,5.', 'Use a number, e.g. 1 or 0.5.'); bad++; }
        else if (v) fd.append(f.name, v);
        else if (f.required) { setError(wrap, 'Campo obrigatório.', 'Required field.'); bad++; }
      }
    });
    return { fd: fd, bad: bad };
  }

  // ---------- envio e acompanhamento ----------
  function setBusy(btn, busy) {
    btn.disabled = busy;
    btn.classList.toggle('is-loading', busy);
    btn.setAttribute('aria-busy', busy ? 'true' : 'false');
    btn.innerHTML = '';
    btn.appendChild(busy ? bi('Enviando…', 'Uploading…') : bi('Processar', 'Run'));
  }
  function submit(tool) {
    var built = buildFormData(tool);
    if (built.bad) {
      var first = document.querySelector('#tool-form [aria-invalid="true"], #tool-form .file-drop.is-invalid input');
      if (first) first.focus();
      return;
    }
    if (LOCAL) { submitLocal(tool, built.fd); return; }
    var btn = $('submit-btn');
    setBusy(btn, true);
    renderProgress({ status: 'uploading', title: tool.title }, 0);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', API + '/jobs/' + tool.id);
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) renderProgress({ status: 'uploading', title: tool.title }, e.loaded / e.total);
    };
    xhr.onload = function () {
      setBusy(btn, false);
      var d = {};
      try { d = JSON.parse(xhr.responseText); } catch (e) { /* resposta não JSON */ }
      if (xhr.status >= 200 && xhr.status < 300 && d.job_id) {
        saveJob({ id: d.job_id, tool: tool.id, title: tool.title, created: new Date().toISOString() });
        history.replaceState(null, '', '#job=' + d.job_id);
        watch(d.job_id);
      } else {
        var msg = d.message || ('HTTP ' + xhr.status);
        showError(msg, tr(msg));
      }
    };
    xhr.onerror = function () {
      setBusy(btn, false);
      showError('Não foi possível falar com o servidor. Verifique a conexão e tente de novo.',
                'Could not reach the server. Check your connection and try again.');
    };
    xhr.send(built.fd);
  }

  // Motor local: roda no navegador; o progresso e o registro vêm do webR.
  function submitLocal(tool, fd) {
    var btn = $('submit-btn');
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = '';
    btn.appendChild(bi('Processando…', 'Running…'));
    stopWatching();
    var started = null;
    state.tick = setInterval(function () {
      var t = $('elapsed');
      if (t && started) t.textContent = fmtDur(Date.now() / 1000 - started);
    }, 1000);
    var done = function () { stopWatching(); setBusy(btn, false); };
    LOCAL.run(tool, fd, {
      progress: function (st) {
        if (st.status === 'running') started = st.started_epoch;
        renderProgress(st);
      },
      log: function (text) {
        var b = $('live-log');
        if (b) { b.textContent = text; b.scrollTop = b.scrollHeight; }
      }
    }).then(function (r) {
      done();
      renderResult(r.st, r.log);
    }).catch(function (e) {
      done();
      if (window.console) console.error(e);
      showError('Não foi possível rodar o forplotR no navegador. Recarregue a página e tente de novo; se persistir, use o pacote no R.',
                'Could not run forplotR in the browser. Reload the page and try again; if it persists, use the package in R.');
    });
  }

  function stopWatching() {
    clearInterval(state.poll); clearInterval(state.logPoll); clearInterval(state.tick);
    state.poll = state.logPoll = state.tick = null;
  }
  function watch(id) {
    stopWatching();
    var last = null;
    function step() {
      getJSON(API + '/jobs/' + id).then(function (st) {
        last = st;
        if (st.status === 'done' || st.status === 'error') {
          stopWatching();
          fetchLog(id).then(function (log) { renderResult(st, log); });
        } else renderProgress(st);
      }).catch(function (e) {
        stopWatching();
        if (e.status === 404) showError('Este processamento não existe mais. Os resultados ficam disponíveis por 72 horas.',
                                        'This job no longer exists. Results are kept for 72 hours.');
        else showError(e.message, tr(e.message));
      });
    }
    step();
    state.poll = setInterval(step, 2000);
    state.logPoll = setInterval(function () {
      fetchLog(id).then(function (log) { var b = $('live-log'); if (b) { b.textContent = log; b.scrollTop = b.scrollHeight; } });
    }, 3000);
    state.tick = setInterval(function () {
      var t = $('elapsed');
      if (t && last && last.started_epoch) t.textContent = fmtDur(Date.now() / 1000 - last.started_epoch);
    }, 1000);
  }
  function fetchLog(id) {
    return fetch(API + '/jobs/' + id + '/log', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .catch(function () { return ''; });
  }

  // ---------- painel de resultados ----------
  function panel() { var p = $('result-panel'); p.innerHTML = ''; return p; }
  function statusTag(cls, pt, en) { var s = el('span', { class: 'status-tag ' + cls }); s.appendChild(bi(pt, en)); return s; }

  function renderProgress(st, frac) {
    var p = $('result-panel');
    var box = $('progress-box');
    if (!box) {
      p.innerHTML = '';
      box = el('section', { class: 'job-box', id: 'progress-box' });
      box.appendChild(el('div', { id: 'job-tag' }));
      box.appendChild(el('h3', { class: 'job-title', id: 'job-title' }));
      box.appendChild(el('p', { class: 'job-sub', id: 'job-sub' }));
      var bar = el('div', { class: 'progress-bar', role: 'progressbar', 'aria-label': 'progresso' });
      bar.appendChild(el('div', { class: 'progress-fill', id: 'progress-fill' }));
      box.appendChild(bar);
      box.appendChild(el('pre', { class: 'progress-log', id: 'live-log' }));
      p.appendChild(box);
      box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
    var fill = $('progress-fill'), tag = $('job-tag'), sub = $('job-sub');
    $('job-title').innerHTML = ''; $('job-title').appendChild(bi(st.title || ''));
    tag.innerHTML = ''; sub.innerHTML = '';
    if (st.status === 'loading') {
      var stg = STAGE_TXT[st.stage] || STAGE_TXT.runtime;
      tag.appendChild(statusTag('is-queued', 'Preparando', 'Preparing'));
      sub.appendChild(bi(stg[0].charAt(0).toUpperCase() + stg[0].slice(1) + ' Na primeira vez, o download leva alguns minutos; depois, o navegador guarda os arquivos.',
                         stg[1].charAt(0).toUpperCase() + stg[1].slice(1) + ' The first download takes a few minutes; afterwards the browser caches the files.'));
      fill.className = 'progress-fill is-waiting'; fill.style.width = '';
    } else if (st.status === 'uploading') {
      var pc = Math.round((frac || 0) * 100);
      tag.appendChild(statusTag('is-uploading', 'Enviando', 'Uploading'));
      sub.appendChild(bi('Enviando arquivos… ' + pc + '%', 'Uploading files… ' + pc + '%'));
      fill.className = 'progress-fill'; fill.style.width = pc + '%';
    } else if (st.status === 'queued') {
      tag.appendChild(statusTag('is-queued', 'Na fila', 'Queued'));
      var n = (st.queue_position || 1) - 1;
      sub.appendChild(n > 0 ? bi(n + ' processamento(s) à frente.', n + ' job(s) ahead.') : bi('Próximo da fila. Começa em instantes.', 'Next in line. Starting shortly.'));
      fill.className = 'progress-fill is-waiting'; fill.style.width = '';
    } else {
      tag.appendChild(statusTag('is-running', 'Processando', 'Running'));
      sub.appendChild(document.createTextNode('forplotR::' + (st.fun || '') + '() · '));
      sub.appendChild(el('span', { id: 'elapsed' }, st.started_epoch ? fmtDur(Date.now() / 1000 - st.started_epoch) : '0 s'));
      if (LOCAL) sub.appendChild(bi('. Processando no seu navegador; mantenha esta página aberta.',
                                    '. Running in your browser; keep this page open.'));
      else sub.appendChild(bi('. É possível fechar a página e voltar pelo link; o resultado fica guardado.',
                              '. You can close the page and come back via the link; the result is kept.'));
      fill.className = 'progress-fill is-running'; fill.style.width = '';
    }
  }

  function fileUrl(st, f, inline) {
    if (LOCAL) return LOCAL.fileUrl(st, f);
    return API + '/jobs/' + st.id + '/files/' + f.id + (inline ? '?inline=1' : '');
  }
  function zipUrl(st) { return LOCAL ? LOCAL.zipUrl(st) : API + '/jobs/' + st.id + '/files/all'; }

  // números da parcela (detect.R: local_summary), com a mesma regra do balanço
  function summaryTiles(sm) {
    if (!sm || !sm.trees) return null;
    var nf = function (x) { return Number(x).toLocaleString(isEn() ? 'en' : 'pt-BR'); };
    var wrap = el('div', { class: 'res-summary' });
    var who = [sm.plot_code, sm.plot_name].filter(function (x) { return x; }).join(' · ');
    if (who) wrap.appendChild(el('p', { class: 'res-plot' }, who));
    var tiles = el('dl', { class: 'tiles' });
    var add = function (val, pt, en, cls) {
      var t = el('div', { class: 'tile' + (cls ? ' ' + cls : '') });
      t.appendChild(el('dd', null, val));
      t.appendChild(biEl('dt', null, pt, en));
      tiles.appendChild(t);
    };
    add(nf(sm.trees), 'árvores na planilha', 'trees in the spreadsheet');
    add(nf(sm.families), 'famílias', 'families');
    add(nf(sm.with_voucher) + (sm.pct_voucher !== null && sm.pct_voucher !== undefined ? ' · ' + sm.pct_voucher + '%' : ''),
        'com voucher (sem palmeiras)', 'with a voucher (palms excluded)', 'is-col');
    add(nf(sm.without_voucher), 'sem voucher', 'without a voucher', sm.without_voucher ? 'is-unc' : '');
    add(nf(sm.subplots_missing) + ' / ' + nf(sm.subplots), 'subparcelas com algo a coletar', 'subplots with something to collect');
    if (sm.palms) add(nf(sm.palms), 'palmeiras, à parte', 'palms, counted apart', 'is-palm');
    wrap.appendChild(tiles);
    wrap.appendChild(biEl('p', { class: 'muted-note' },
      'Contagens da planilha, com a regra do balanço de coleta: “com voucher” é a coluna Collected preenchida.',
      'Counts from the spreadsheet, with the collection-balance rule: “with a voucher” means the Collected column is filled in.'));
    return wrap;
  }

  function tabset(items) {
    var wrap = el('div', { class: 'res-tabs' });
    var list = el('div', { class: 'tab-list', role: 'tablist' });
    wrap.appendChild(list);
    var panes = [];
    items.forEach(function (it, i) {
      var id = 'res-tab-' + it.key;
      var b = el('button', { type: 'button', role: 'tab', id: id, 'aria-controls': id + '-p', 'aria-selected': i === 0 ? 'true' : 'false', tabindex: i === 0 ? '0' : '-1' });
      b.appendChild(bi(it.pt, it.en));
      if (it.count !== undefined) b.appendChild(el('span', { class: 'tab-count' }, String(it.count)));
      list.appendChild(b);
      var p = el('div', { role: 'tabpanel', id: id + '-p', 'aria-labelledby': id, class: 'tab-pane', hidden: i !== 0 });
      p.appendChild(it.node);
      wrap.appendChild(p);
      panes.push([b, p]);
    });
    var select = function (k) {
      panes.forEach(function (x, j) {
        var on = j === k;
        x[0].setAttribute('aria-selected', on ? 'true' : 'false'); x[0].tabIndex = on ? 0 : -1; x[1].hidden = !on;
      });
      panes[k][0].focus();
    };
    panes.forEach(function (x, j) { x[0].addEventListener('click', function () { select(j); }); });
    list.addEventListener('keydown', function (e) {
      var k = panes.findIndex(function (x) { return x[0] === document.activeElement; });
      if (k < 0) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); select((k + 1) % panes.length); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select((k - 1 + panes.length) % panes.length); }
    });
    return wrap;
  }

  function lightbox() {
    var d = el('dialog', { class: 'lightbox' });
    var fig = el('figure');
    var img = el('img', { alt: '' });
    var cap = el('figcaption');
    var close = biEl('button', { type: 'button', class: 'fx-btn fx-btn-secondary fx-btn-sm lb-close' }, 'Fechar', 'Close');
    close.addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    fig.appendChild(img); fig.appendChild(cap); d.appendChild(close); d.appendChild(fig);
    d.show_ = function (src, label, dl) {
      img.src = src; img.alt = label; cap.innerHTML = '';
      cap.appendChild(document.createTextNode(label + ' · '));
      cap.appendChild(dl);
      if (typeof d.showModal === 'function') d.showModal(); else window.open(src, '_blank', 'noopener');
    };
    return d;
  }

  function renderResult(st, log) {
    var p = panel();
    var ok = st.status === 'done';
    var box = el('section', { class: 'job-box' });
    var hd = el('header', { class: 'res-head' });
    hd.appendChild(ok ? statusTag('is-done', 'Concluído', 'Done') : statusTag('is-error', 'Falhou', 'Failed'));
    hd.appendChild(biEl('h3', { class: 'job-title' }, st.title || ''));
    var sub = el('p', { class: 'job-sub' });
    var t = st.elapsed_s ? fmtDur(st.elapsed_s) : '';
    sub.appendChild(ok
      ? bi((st.message || 'Concluído') + '.' + (t ? ' Tempo: ' + t + '.' : ''), tr(st.message || 'Concluído') + '.' + (t ? ' Time: ' + t + '.' : ''))
      : bi('O forplotR parou com um erro.', 'forplotR stopped with an error.'));
    if (st.forplotR) sub.appendChild(document.createTextNode(' forplotR ' + st.forplotR + '.'));
    hd.appendChild(sub);
    box.appendChild(hd);

    if (!ok) {
      box.appendChild(el('div', { class: 'error-box' }, st.error || '—'));
      box.appendChild(biEl('p', { class: 'muted-note' },
        'Confira o formato da planilha e, se as colunas tiverem outros nomes, indique-as em “Colunas da planilha”.',
        'Check the spreadsheet layout and, if the columns have other names, map them under “Spreadsheet columns”.'));
    }

    var tiles = ok ? summaryTiles(st.summary) : null;
    if (tiles) box.appendChild(tiles);

    var files = arr(st.files);
    if (files.length || st.zip) {
      var actions = el('div', { class: 'result-actions' });
      if (st.zip) {
        var za = el('a', { class: 'fx-btn fx-btn-primary', href: zipUrl(st), download: LOCAL ? st.zip : null }, [svg(IC_DL)]);
        za.appendChild(bi('Baixar tudo (.zip)', 'Download all (.zip)'));
        actions.appendChild(za);
      }
      // No modo local não há link para compartilhar: o resultado só existe nesta página.
      var share = LOCAL ? null : biEl('button', { type: 'button', class: 'fx-btn fx-btn-secondary' }, 'Copiar link do resultado', 'Copy result link');
      if (share) share.addEventListener('click', function () {
        var u = location.href.split('#')[0] + '#job=' + st.id;
        var done = function () {
          share.innerHTML = ''; share.appendChild(bi('Link copiado', 'Link copied')); share.disabled = true;
          setTimeout(function () { share.innerHTML = ''; share.appendChild(bi('Copiar link do resultado', 'Copy result link')); share.disabled = false; }, 2000);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(u).then(done); else window.prompt('', u);
      });
      if (share) actions.appendChild(share);
      box.appendChild(actions);
    }

    var items = [];
    var htmls = files.filter(function (f) { return f.kind === 'html'; });
    var imgs = files.filter(function (f) { return f.kind === 'image'; }).slice(0, 12);
    if (htmls.length) {
      var pv = el('div', { class: 'preview' });
      var bar = el('div', { class: 'preview-bar' });
      var frame = el('iframe', { class: 'report-frame', title: isEn() ? 'Preview' : 'Prévia', sandbox: 'allow-scripts allow-popups allow-downloads' });
      var openA = el('a', { class: 'fx-btn fx-btn-quiet fx-btn-sm', target: '_blank', rel: 'noopener' }, [svg(IC_EXT)]);
      openA.appendChild(bi('Abrir em nova aba', 'Open in a new tab'));
      var full = el('button', { type: 'button', class: 'fx-btn fx-btn-quiet fx-btn-sm' }, [svg(IC_EXPAND)]);
      full.appendChild(bi('Tela cheia', 'Full screen'));
      full.addEventListener('click', function () { var r = pv.requestFullscreen || pv.webkitRequestFullscreen; if (r) r.call(pv); });
      var show = function (f) { frame.src = fileUrl(st, f, true); openA.href = fileUrl(st, f, true); };
      if (htmls.length > 1) {
        var sw = el('div', { class: 'seg seg-sm', role: 'group' });
        htmls.forEach(function (f, i) {
          var b = biEl('button', { type: 'button', class: 'seg-btn', 'aria-pressed': i === 0 ? 'true' : 'false' }, f.label);
          b.addEventListener('click', function () {
            sw.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
            b.setAttribute('aria-pressed', 'true'); show(f);
          });
          sw.appendChild(b);
        });
        bar.appendChild(sw);
      }
      var tools = el('div', { class: 'preview-tools' });
      tools.appendChild(openA); tools.appendChild(full);
      bar.appendChild(tools);
      pv.appendChild(bar);
      pv.appendChild(frame);
      show(htmls[0]);
      var pvWrap = el('div');
      pvWrap.appendChild(pv);
      if (LOCAL && st.tool === 'balance') {
        pvWrap.appendChild(biEl('p', { class: 'muted-note' },
          'Para ter o relatório em PDF, baixe o arquivo HTML, abra-o no navegador e use Imprimir > Salvar como PDF.',
          'To get the report as a PDF, download the HTML file, open it in your browser and use Print > Save as PDF.'));
      }
      if (LOCAL && st.tool === 'map') {
        pvWrap.appendChild(biEl('p', { class: 'muted-note' },
          'A prévia não carrega a imagem de satélite, para não revelar a localização da parcela ao provedor das imagens. No arquivo baixado, o satélite aparece ao abri-lo, e a área visualizada é enviada ao provedor.',
          'The preview does not load satellite imagery, so that the plot location is not revealed to the imagery provider. In the downloaded file, the imagery appears when it is opened, and the area in view is sent to the provider.'));
      }
      items.push({ key: 'preview', pt: 'Prévia', en: 'Preview', node: pvWrap });
    }
    if (imgs.length) {
      var lb = lightbox();
      var grid = el('div', { class: 'thumb-grid' });
      imgs.forEach(function (f) {
        var a = el('a', { href: fileUrl(st, f, true), title: f.label, class: 'thumb' });
        a.appendChild(el('img', { src: fileUrl(st, f, true), alt: f.label, loading: 'lazy' }));
        a.appendChild(biEl('span', null, f.label));
        a.addEventListener('click', function (e) {
          if (typeof lb.showModal !== 'function') return;
          e.preventDefault();
          lb.show_(fileUrl(st, f, true), f.label, biEl('a', { href: fileUrl(st, f, false), download: LOCAL ? f.name : null }, 'Baixar', 'Download'));
        });
        grid.appendChild(a);
      });
      var gw = el('div'); gw.appendChild(grid); gw.appendChild(lb);
      items.push({ key: 'figures', pt: 'Figuras', en: 'Figures', count: imgs.length, node: gw });
    }
    if (files.length) {
      var list = el('div', { class: 'output-list' });
      files.forEach(function (f) {
        var card = el('article', { class: 'output-card' });
        card.appendChild(el('span', { class: 'file-kind kind-' + (f.kind || 'file') }, (String(f.path).split('.').pop() || '').toUpperCase().slice(0, 4)));
        var info = el('div');
        info.appendChild(biEl('strong', null, f.label));
        info.appendChild(el('span', null, f.path + ' · ' + fmtSize(f.size)));
        card.appendChild(info);
        var dl = el('a', { class: 'fx-btn fx-btn-secondary fx-btn-sm', href: fileUrl(st, f, false), download: LOCAL ? f.name : null }, [svg(IC_DL)]);
        dl.appendChild(bi('Baixar', 'Download'));
        card.appendChild(dl);
        list.appendChild(card);
      });
      var fw = el('div'); fw.appendChild(list);
      if (st.n_files > files.length) {
        fw.appendChild(biEl('p', { class: 'muted-note' },
          'Mostrando ' + files.length + ' de ' + st.n_files + ' arquivos. Todos estão no ZIP.',
          'Showing ' + files.length + ' of ' + st.n_files + ' files. All are in the ZIP.'));
      }
      items.push({ key: 'files', pt: 'Arquivos', en: 'Files', count: st.n_files || files.length, node: fw });
    } else if (st.zip) {
      box.appendChild(biEl('p', { class: 'muted-note' },
        'O resultado é uma estrutura de pastas (' + st.n_files + ' itens), toda dentro do ZIP.',
        'The result is a folder structure (' + st.n_files + ' items), all inside the ZIP.'));
    } else if (ok) {
      box.appendChild(biEl('p', { class: 'muted-note' }, 'Nenhum arquivo foi gerado. Veja o registro abaixo.', 'No file was produced. See the log below.'));
    }
    if (items.length) box.appendChild(tabset(items));

    var det = el('details', { class: 'log-details' });
    if (!ok) det.open = true;
    det.appendChild(biEl('summary', null, 'Registro do processamento', 'Processing log'));
    det.appendChild(el('pre', { class: 'progress-log' }, log || '—'));
    box.appendChild(det);
    p.appendChild(box);
    if (ok) box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function showError(pt, en) {
    var p = panel();
    var box = el('div', { class: 'result-empty is-error', role: 'alert' }, [svg(IC.offline)]);
    box.appendChild(biEl('h3', null, 'Não foi possível concluir', 'Could not complete'));
    box.appendChild(biEl('p', null, pt, en));
    p.appendChild(box);
  }

  // ---------- início ----------
  function boot() {
    var mount = document.querySelector('.fp-tool-app');
    renderRecent();
    if (!mount) {
      if (!LOCAL) { checkHealth(); setInterval(checkHealth, 30000); }
      else {
        document.querySelectorAll('.api-status').forEach(function (s) {
          setStatus(s, 'is-ok', 'roda no seu navegador', 'runs in your browser');
        });
        var v = document.querySelector('.fp-versions');
        if (v) fetch(ROOT + 'webr/engine/info.json', { cache: 'no-cache' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (h) {
            if (!h) return;
            v.innerHTML = '';
            v.appendChild(bi('No navegador: forplotR ' + h.forplotR + ' · ' + h.R + '.', 'In the browser: forplotR ' + h.forplotR + ' · ' + h.R + '.'));
          }).catch(function () { /* sem versão */ });
      }
      return;
    }
    var id = mount.getAttribute('data-tool');
    skeleton(mount);
    (LOCAL ? LOCAL.tools() : getJSON(API + '/tools')).then(function (tools) {
      state.tools = arr(tools);
      var tool = state.tools.filter(function (t) { return t.id === id; })[0];
      if (!tool) { mount.innerHTML = ''; mount.appendChild(biEl('div', { class: 'error-box' }, 'Ferramenta não encontrada: ' + id, 'Tool not found: ' + id)); return; }
      renderTool(tool, mount);
      if (LOCAL) {
        // O R começa a carregar assim que a ferramenta abre (fica pronto até o envio).
        if (tool.available !== false) { LOCAL.warmup(); checkHealth(); }
        return;
      }
      checkHealth();
      setInterval(checkHealth, 30000);
      var j = hashJob();
      if (j) watch(j);
    }).catch(function () {
      mount.innerHTML = '';
      var box = el('div', { class: 'result-empty is-error', role: 'alert' }, [svg(IC.offline)]);
      if (LOCAL) {
        box.appendChild(biEl('h3', null, 'Formulário indisponível', 'Form unavailable'));
        box.appendChild(biEl('p', null,
          'Os arquivos do forplotR para o navegador não foram encontrados neste site. Tente novamente mais tarde ou use o pacote diretamente no R.',
          'The forplotR browser files were not found on this site. Try again later or use the package directly in R.'));
      } else {
        box.appendChild(biEl('h3', null, 'Servidor indisponível', 'Server unavailable'));
        box.appendChild(biEl('p', null,
          'O formulário não pôde ser carregado porque o servidor do forplotR não respondeu. Tente novamente mais tarde ou use o pacote diretamente no R.',
          'The form could not be loaded because the forplotR server did not respond. Try again later or use the package directly in R.'));
      }
      var retry = biEl('button', { type: 'button', class: 'fx-btn fx-btn-secondary fx-btn-sm' }, 'Tentar de novo', 'Try again');
      retry.addEventListener('click', boot);
      box.appendChild(retry);
      if (!LOCAL) box.appendChild(el('p', { class: 'muted-note' }, API));
      mount.appendChild(box);
      checkHealth();
    });
  }

  // troca de idioma: atualiza o que não é <span data-lang> (opções de select, datas)
  document.addEventListener('fp:lang', function () {
    var en = isEn();
    document.querySelectorAll('option[data-pt]').forEach(function (o) { o.textContent = en ? o.getAttribute('data-en') : o.getAttribute('data-pt'); });
    renderRecent();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
