/* forplotR online — cliente do site (Quarto)
 * Nas páginas, coloque:
 *   <div class="fp-tool-app" data-tool="balance"></div>   -> formulário + resultados
 *   <div class="fp-recent"></div>                          -> processamentos recentes
 *   <span class="api-status"></span>                       -> situação do servidor
 * O formulário vem da API (GET /v1/tools), definida em backend/R/tools_spec.R.
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
  var PAGES = { balance: 'relatorio', map: 'mapa', sheets: 'herbario', crossdet: 'determinacoes', vouchers: 'vouchers' };
  function toolPage(id) { return ROOT + 'ferramentas/' + (PAGES[id] || id) + '/index.html'; }
  var STORE = 'forplotR_jobs_v1';
  var state = { tools: [], health: null, poll: null, logPoll: null, tick: null };

  // ---------- idioma ----------
  function isEn() { return document.documentElement.classList.contains('fp-en'); }
  // Textos do servidor (tools_spec.R, jobs.R) em inglês.
  var SERVER_EN = {
    // ferramentas
    'Relatório e balanço de coleta': 'Report and collection balance',
    'Mapa interativo da parcela': 'Interactive plot map',
    'Planilha para o herbário': 'Herbarium spreadsheet',
    'Cruzamento com o herbário': 'Determination cross-check',
    'Pastas de vouchers': 'Voucher directories',
    '1 a 5 minutos (PDF leva mais)': '1 to 5 minutes (longer with PDF)',
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
    'Gerar relatório HTML interativo': 'Produce interactive HTML report',
    'Gerar relatório PDF': 'Produce PDF report',
    'Exige LaTeX no servidor e leva alguns minutos a mais.': 'Requires LaTeX on the server and takes a few more minutes.',
    'Gerar planilha de balanço (XLSX)': 'Produce balance spreadsheet (XLSX)',
    'Não disponível para MONITORA.': 'Not available for MONITORA.',
    'Destacar palmeiras (Arecaceae)': 'Highlight palms (Arecaceae)',
    'Número do censo': 'Census number',
    'Coordenadas da parcela (graus decimais)': 'Plot coordinates (decimal degrees)',
    'Uma linha por ponto: latitude; longitude. Parcelas ForestPlots: 4 cantos na ordem (0,0), (0,comprimento), (largura,0), (largura,comprimento). MONITORA: 1 ponto, o centro da estação.':
      'One line per point: latitude; longitude. ForestPlots plots: 4 corners in the order (0,0), (0,length), (width,0), (width,length). MONITORA: 1 point, the station centre.',
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
    'Espécies mais abundantes': 'Most abundant species',
    'Famílias mais abundantes': 'Most abundant families',
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
    'Informe uma única sigla de herbário, só letras e números.': 'Give a single herbarium acronym, letters and digits only.'
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
  function checkHealth() {
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

  // ---------- formulário ----------
  function fieldNode(f) {
    var id = 'f_' + f.name;
    var wrap = el('div', { class: 'form-field', 'data-field': f.name });
    if (f.type === 'bool' || f.type === 'example') {
      wrap.className = 'form-field check-field' + (f.type === 'example' ? ' example-field' : '');
      var lab = el('label', { for: id });
      var cb = el('input', { type: 'checkbox', id: id, name: f.name });
      cb.checked = f.type === 'bool' ? !!f.default : false;
      lab.appendChild(cb);
      lab.appendChild(biEl('span', null, f.label));
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
          placeholder: '-22.9668; -43.2245\n-22.9659; -43.2245\n-22.9668; -43.2235\n-22.9659; -43.2235' });
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
  function setError(wrap, pt, en) {
    clearError(wrap);
    var inp = wrap.querySelector('input:not([type=checkbox]), select, textarea');
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
    box.appendChild(biEl('h3', null, 'Nenhum resultado ainda', 'No results yet'));
    box.appendChild(biEl('p', null,
      'Preencha o formulário e clique em Processar. Os arquivos gerados aparecem aqui, com prévia e download.',
      'Fill in the form and press Run. The generated files appear here, with preview and download.'));
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
    var res = el('div', { class: 'result-panel' });
    var e = el('div', { class: 'result-empty' }, [svg(IC.plot)]);
    e.appendChild(biEl('p', null, 'Carregando o formulário…', 'Loading the form…'));
    res.appendChild(e);
    shell.appendChild(res);
    mount.appendChild(shell);
  }

  function renderTool(tool, mount) {
    mount.innerHTML = '';
    var shell = el('div', { class: 'tool-shell' });
    var card = el('div', { class: 'tool-card' });
    var head = el('div', { class: 'fp-tool-head' });
    head.appendChild(el('span', { class: 'eyebrow' }, 'forplotR::' + tool.fun + '()'));
    head.appendChild(el('span', { class: 'api-status' }));
    card.appendChild(head);
    var form = el('form', { class: 'tool-form', id: 'tool-form', novalidate: true });
    card.appendChild(form);
    var res = el('div', { class: 'result-panel', id: 'result-panel', 'aria-live': 'polite' });
    res.appendChild(emptyState(tool));
    shell.appendChild(card);
    shell.appendChild(res);
    mount.appendChild(shell);

    var groups = { principal: form };
    var titles = { avancado: ['Opções avançadas', 'Advanced options'], colunas: ['Minha planilha usa outros nomes de coluna', 'My spreadsheet uses other column names'] };
    tool.fields.forEach(function (f) {
      var g = f.group || 'principal';
      if (!groups[g]) {
        var det = el('details', { class: 'adv-group' });
        var t = titles[g] || [g, g];
        det.appendChild(biEl('summary', null, t[0], t[1]));
        var inner = el('div', { class: 'adv-inner' });
        det.appendChild(inner);
        groups[g] = inner;
        groups['_' + g] = det;
      }
      groups[g].appendChild(fieldNode(f));
    });
    ['avancado', 'colunas'].forEach(function (g) { if (groups['_' + g]) form.appendChild(groups['_' + g]); });

    var foot = el('div', { class: 'form-foot' });
    var btn = el('button', { type: 'submit', class: 'fx-btn fx-btn-primary fx-btn-block', id: 'submit-btn' });
    btn.appendChild(bi('Processar', 'Run'));
    foot.appendChild(btn);
    foot.appendChild(biEl('p', { class: 'muted-note', style: 'margin:0' }, '* campo obrigatório', '* required field'));
    form.appendChild(foot);

    form.addEventListener('change', function () { applyVisibility(tool); });
    applyVisibility(tool);
    form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(tool); });
  }

  function currentValue(name) { var f = $('tool-form'); var inp = f && f.elements[name]; return inp ? inp.value : ''; }
  function applyVisibility(tool) {
    var ex = $('f_usar_exemplo');
    var useEx = ex && ex.checked;
    tool.fields.forEach(function (f) {
      var node = document.querySelector('[data-field="' + f.name + '"]');
      if (!node) return;
      var show = true;
      if (f.show_if) show = arr(f.show_if.values).indexOf(currentValue(f.show_if.field)) >= 0;
      node.hidden = !show;
      if (f.name === 'fp_file') {
        node.classList.toggle('is-disabled', !!useEx);
        var inp = node.querySelector('input'); if (inp) inp.disabled = !!useEx;
        if (useEx) clearError(node);
      }
    });
  }
  function isHidden(f) { var node = document.querySelector('[data-field="' + f.name + '"]'); return !node || node.hidden; }

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
      if (window.innerWidth < 1100) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    var fill = $('progress-fill'), tag = $('job-tag'), sub = $('job-sub');
    $('job-title').innerHTML = ''; $('job-title').appendChild(bi(st.title || ''));
    tag.innerHTML = ''; sub.innerHTML = '';
    if (st.status === 'uploading') {
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
      sub.appendChild(bi('. É possível fechar a página e voltar pelo link; o resultado fica guardado.',
                         '. You can close the page and come back via the link; the result is kept.'));
      fill.className = 'progress-fill is-running'; fill.style.width = '';
    }
  }

  function fileUrl(st, f, inline) { return API + '/jobs/' + st.id + '/files/' + f.id + (inline ? '?inline=1' : ''); }

  function renderResult(st, log) {
    var p = panel();
    var ok = st.status === 'done';
    var box = el('section', { class: 'job-box' });
    box.appendChild(ok ? statusTag('is-done', 'Concluído', 'Done') : statusTag('is-error', 'Falhou', 'Failed'));
    box.appendChild(biEl('h3', { class: 'job-title' }, st.title || ''));
    var sub = el('p', { class: 'job-sub' });
    var t = st.elapsed_s ? fmtDur(st.elapsed_s) : '';
    sub.appendChild(ok
      ? bi((st.message || 'Concluído') + '.' + (t ? ' Tempo: ' + t + '.' : ''), tr(st.message || 'Concluído') + '.' + (t ? ' Time: ' + t + '.' : ''))
      : bi('O forplotR parou com um erro.', 'forplotR stopped with an error.'));
    if (st.forplotR) sub.appendChild(document.createTextNode(' forplotR ' + st.forplotR + '.'));
    box.appendChild(sub);

    if (!ok) {
      box.appendChild(el('div', { class: 'error-box' }, st.error || '—'));
      box.appendChild(biEl('p', { class: 'muted-note' },
        'Confira o formato da planilha escolhido e, se as colunas tiverem outros nomes, informe-os em “Minha planilha usa outros nomes de coluna”.',
        'Check the selected spreadsheet layout and, if the columns have other names, declare them under “My spreadsheet uses other column names”.'));
    }

    var files = arr(st.files);
    if (files.length) {
      var actions = el('div', { class: 'result-actions' });
      if (st.zip) actions.appendChild(biEl('a', { class: 'fx-btn fx-btn-primary', href: API + '/jobs/' + st.id + '/files/all' }, 'Baixar tudo (.zip)', 'Download all (.zip)'));
      var share = biEl('button', { type: 'button', class: 'fx-btn fx-btn-secondary' }, 'Copiar link do resultado', 'Copy result link');
      share.addEventListener('click', function () {
        var u = location.href.split('#')[0] + '#job=' + st.id;
        var done = function () {
          share.innerHTML = ''; share.appendChild(bi('Link copiado', 'Link copied')); share.disabled = true;
          setTimeout(function () { share.innerHTML = ''; share.appendChild(bi('Copiar link do resultado', 'Copy result link')); share.disabled = false; }, 2000);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(u).then(done); else window.prompt('', u);
      });
      actions.appendChild(share);
      box.appendChild(actions);

      var htmls = files.filter(function (f) { return f.kind === 'html'; });
      var imgs = files.filter(function (f) { return f.kind === 'image'; }).slice(0, 8);
      if (htmls.length) {
        var tabs = el('div', { class: 'preview-tabs', role: 'tablist' });
        var frame = el('iframe', { class: 'report-frame', title: isEn() ? 'Preview' : 'Prévia', sandbox: 'allow-scripts allow-popups allow-downloads' });
        htmls.forEach(function (f, i) {
          var b = biEl('button', { type: 'button', role: 'tab', class: i === 0 ? 'is-active' : '', 'aria-selected': i === 0 ? 'true' : 'false' }, f.label);
          b.addEventListener('click', function () {
            tabs.querySelectorAll('button').forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false'); });
            b.classList.add('is-active'); b.setAttribute('aria-selected', 'true');
            frame.src = fileUrl(st, f, true);
          });
          tabs.appendChild(b);
        });
        frame.src = fileUrl(st, htmls[0], true);
        box.appendChild(biEl('h4', { class: 'block-title' }, 'Prévia', 'Preview'));
        if (htmls.length > 1) box.appendChild(tabs);
        box.appendChild(frame);
      }
      if (imgs.length) {
        box.appendChild(biEl('h4', { class: 'block-title' }, 'Figuras', 'Figures'));
        var grid = el('div', { class: 'thumb-grid' });
        imgs.forEach(function (f) {
          var a = el('a', { href: fileUrl(st, f, true), target: '_blank', rel: 'noopener', title: f.label });
          a.appendChild(el('img', { src: fileUrl(st, f, true), alt: f.label, loading: 'lazy' }));
          a.appendChild(biEl('span', null, f.label));
          grid.appendChild(a);
        });
        box.appendChild(grid);
      }

      box.appendChild(biEl('h4', { class: 'block-title' }, 'Arquivos (' + st.n_files + ')', 'Files (' + st.n_files + ')'));
      var list = el('div', { class: 'output-list' });
      files.forEach(function (f) {
        var card = el('article', { class: 'output-card' });
        var info = el('div');
        info.appendChild(biEl('strong', null, f.label));
        info.appendChild(el('span', null, f.path + ' · ' + fmtSize(f.size)));
        card.appendChild(info);
        card.appendChild(biEl('a', { class: 'fx-btn fx-btn-secondary fx-btn-sm', href: fileUrl(st, f, false) }, 'Baixar', 'Download'));
        list.appendChild(card);
      });
      box.appendChild(list);
      if (st.n_files > files.length) {
        box.appendChild(biEl('p', { class: 'muted-note' },
          'Mostrando ' + files.length + ' de ' + st.n_files + ' arquivos. Todos estão no ZIP.',
          'Showing ' + files.length + ' of ' + st.n_files + ' files. All are in the ZIP.'));
      }
    } else if (ok) {
      box.appendChild(biEl('p', { class: 'muted-note' }, 'Nenhum arquivo foi gerado. Veja o registro abaixo.', 'No file was produced. See the log below.'));
    }

    var det = el('details', { class: 'log-details' });
    if (!ok) det.open = true;
    det.appendChild(biEl('summary', null, 'Registro do processamento', 'Processing log'));
    det.appendChild(el('pre', { class: 'progress-log' }, log || '—'));
    box.appendChild(det);
    p.appendChild(box);
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
    if (!mount) { checkHealth(); setInterval(checkHealth, 30000); return; }
    var id = mount.getAttribute('data-tool');
    skeleton(mount);
    getJSON(API + '/tools').then(function (tools) {
      state.tools = arr(tools);
      var tool = state.tools.filter(function (t) { return t.id === id; })[0];
      if (!tool) { mount.innerHTML = ''; mount.appendChild(biEl('div', { class: 'error-box' }, 'Ferramenta não encontrada: ' + id, 'Tool not found: ' + id)); return; }
      renderTool(tool, mount);
      checkHealth();
      setInterval(checkHealth, 30000);
      var j = hashJob();
      if (j) watch(j);
    }).catch(function () {
      mount.innerHTML = '';
      var box = el('div', { class: 'result-empty is-error', role: 'alert' }, [svg(IC.offline)]);
      box.appendChild(biEl('h3', null, 'Servidor indisponível', 'Server unavailable'));
      box.appendChild(biEl('p', null,
        'O formulário não pôde ser carregado porque o servidor do forplotR não respondeu. Tente novamente mais tarde ou use o pacote diretamente no R.',
        'The form could not be loaded because the forplotR server did not respond. Try again later or use the package directly in R.'));
      var retry = biEl('button', { type: 'button', class: 'fx-btn fx-btn-secondary fx-btn-sm' }, 'Tentar de novo', 'Try again');
      retry.addEventListener('click', boot);
      box.appendChild(retry);
      box.appendChild(el('p', { class: 'muted-note' }, API));
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
