/* forplotR: comportamento comum a todas as páginas (sem dependências).
 *
 * O site funciona sem JavaScript: navegação, textos, código e imagens estáticas
 * estão no HTML. Este arquivo só acrescenta:
 *   - troca de tema claro/escuro (salva em localStorage: forplotR_theme);
 *   - preferência de idioma (forplotR_lang), usada pelos redirecionamentos;
 *   - índice da página com a seção atual e o arco de progresso da leitura;
 *   - botão "Copiar" nos blocos de código;
 *   - busca (Pagefind, carregada só quando aberta) e panoramas 3D;
 *   - atalhos: t (tema), l (idioma), / (busca).
 * Nada sai do navegador.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var EN = root.classList.contains('fp-en');
  var store = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var saved = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };

  // ---------- tema ----------
  function theme() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function label(btn) {
    var dark = theme() === 'dark';
    var t = dark ? btn.getAttribute('data-label-light') : btn.getAttribute('data-label-dark');
    btn.setAttribute('aria-label', t); btn.title = t;
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
  }
  function setTheme(t, persist) {
    root.setAttribute('data-theme', t);
    if (persist) store('forplotR_theme', t);
    document.querySelectorAll('.theme-btn').forEach(label);
    document.dispatchEvent(new CustomEvent('fp:theme', { detail: { theme: t } }));
  }
  document.querySelectorAll('.theme-btn').forEach(function (b) {
    label(b);
    b.addEventListener('click', function () { setTheme(theme() === 'dark' ? 'light' : 'dark', true); });
  });
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var follow = function (e) {
      var s = saved('forplotR_theme');
      if (s !== 'light' && s !== 'dark') setTheme(e.matches ? 'dark' : 'light', false);
    };
    if (mq.addEventListener) mq.addEventListener('change', follow);
  }

  // ---------- idioma: a troca é um link para a página equivalente ----------
  document.querySelectorAll('[data-set-lang]').forEach(function (a) {
    a.addEventListener('click', function () { store('forplotR_lang', a.getAttribute('data-set-lang')); });
  });
  store('forplotR_lang', EN ? 'en' : 'pt');

  // ---------- índice: seção atual e arco de progresso ----------
  var toc = document.querySelector('.toc');
  var fill = document.querySelector('.arc-fill');
  var links = toc ? Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]')) : [];
  var targets = links.map(function (a) {
    try { return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); } catch (e) { return null; }
  });
  var LEN = 94.25; // 2πr, r = 15
  var ticking = false;
  function onScroll() {
    ticking = false;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 1;
    if (fill) fill.style.strokeDashoffset = String(LEN * (1 - p));
    var cur = -1;
    for (var i = 0; i < targets.length; i++) {
      if (targets[i] && targets[i].getBoundingClientRect().top < 140) cur = i;
    }
    links.forEach(function (a, i) {
      var on = i === cur;
      a.classList.toggle('is-current', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }
  if (fill || links.length) {
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  // ---------- copiar código ----------
  var T = EN ? { copy: 'Copy', done: 'Copied', label: 'Copy code' } : { copy: 'Copiar', done: 'Copiado', label: 'Copiar o código' };
  document.querySelectorAll('div.sourceCode').forEach(function (box) {
    var pre = box.querySelector('pre');
    if (!pre || box.querySelector('.copy-btn')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'copy-btn'; b.textContent = T.copy; b.setAttribute('aria-label', T.label);
    b.addEventListener('click', function () {
      var txt = pre.innerText.replace(/\n$/, '');
      var ok = function () {
        b.textContent = T.done; b.classList.add('is-done');
        setTimeout(function () { b.textContent = T.copy; b.classList.remove('is-done'); }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok, function () {});
      else {
        var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); ok(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
    box.appendChild(b);
  });

  // ---------- exemplos ao vivo: carregados só quando a pessoa pede ----------
  // <figure class="live"> com um link [data-live-src]; sem JavaScript o link
  // abre o arquivo. O iframe não tem allow-same-origin: o exemplo não lê o site.
  document.querySelectorAll('[data-live-src]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var box = a.closest('.live');
      if (!box || box.querySelector('iframe')) return;
      e.preventDefault();
      var f = document.createElement('iframe');
      f.src = a.getAttribute('href');
      f.title = a.getAttribute('data-title') || a.textContent;
      f.setAttribute('sandbox', 'allow-scripts allow-popups allow-downloads');
      f.setAttribute('loading', 'lazy');
      var stage = box.querySelector('.live-stage') || box;
      stage.innerHTML = '';
      stage.appendChild(f);
      a.textContent = a.getAttribute('data-opened') || a.textContent;
      a.removeAttribute('data-live-src');
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });
  });

  // ---------- panoramas 3D ----------
  // O SVG estático já está na página. O 3D (assets/panorama.js, Three.js
  // empacotado) só é carregado com WebGL, sem prefers-reduced-motion, e depois
  // da primeira interação ou de alguns segundos.
  (function () {
    if (!document.querySelector('figure.panorama[data-pano]')) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      var c = document.createElement('canvas');
      if (!(c.getContext('webgl2') || c.getContext('webgl'))) return;
    } catch (e) { return; }
    var meta = document.querySelector('meta[name="quarto:offset"]');
    var base = new URL((meta && meta.content) || './', location.href).href;
    var done = false;
    var evs = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];
    function go() {
      if (done) return;
      done = true;
      evs.forEach(function (ev) { window.removeEventListener(ev, go); });
      import(base + 'assets/panorama.js').then(function (m) { return m.start(base); }).catch(function () {});
    }
    evs.forEach(function (ev) { window.addEventListener(ev, go, { passive: true, once: true }); });
    setTimeout(go, 3000);
  })();

  // ---------- busca (Pagefind) ----------
  // O índice (pagefind/, gerado depois do quarto render) só é baixado quando a
  // pessoa abre a busca. Cada idioma tem o seu índice, escolhido pelo lang da
  // página. Sem JavaScript o botão não aparece.
  (function () {
    var opens = document.querySelectorAll('[data-search-open]');
    if (!opens.length || typeof HTMLDialogElement !== 'function') return;
    var meta = document.querySelector('meta[name="quarto:offset"]');
    var base = new URL((meta && meta.content) || './', location.href);
    var S = EN
      ? { title: 'Search the site', ph: 'Search…', hint: 'Type at least two letters.', none: 'Nothing found.', fail: 'Search is not available in this copy of the site (index not built).', close: 'Close', n: function (k) { return k + (k === 1 ? ' result' : ' results'); } }
      : { title: 'Buscar no site', ph: 'Buscar…', hint: 'Digite pelo menos duas letras.', none: 'Nada encontrado.', fail: 'A busca não está disponível nesta cópia do site (índice não gerado).', close: 'Fechar', n: function (k) { return k + (k === 1 ? ' resultado' : ' resultados'); } };
    var dlg, input, list, status, pf;

    function build() {
      dlg = document.createElement('dialog');
      dlg.className = 'search-dlg';
      dlg.setAttribute('aria-label', S.title);
      dlg.innerHTML = '<form method="dialog" class="search-top" role="search">' +
        '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3.5 3.5"/></svg>' +
        '<input type="search" autocomplete="off" spellcheck="false">' +
        '<button type="submit" class="search-close"></button></form>' +
        '<p class="search-status" role="status" aria-live="polite"></p><ol class="search-results"></ol>';
      input = dlg.querySelector('input');
      input.placeholder = S.ph;
      input.setAttribute('aria-label', S.title);
      dlg.querySelector('.search-close').textContent = S.close;
      status = dlg.querySelector('.search-status');
      list = dlg.querySelector('.search-results');
      status.textContent = S.hint;
      input.addEventListener('input', run);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); var a = list.querySelector('a'); if (a) a.click(); }
        if (e.key === 'ArrowDown') { e.preventDefault(); var b = list.querySelector('a'); if (b) b.focus(); }
      });
      list.addEventListener('keydown', function (e) {
        var as = [].slice.call(list.querySelectorAll('a'));
        var i = as.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' && i < as.length - 1) { e.preventDefault(); as[i + 1].focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); (i > 0 ? as[i - 1] : input).focus(); }
      });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      document.body.appendChild(dlg);
    }
    function load() {
      if (!pf) {
        pf = import(new URL('pagefind/pagefind.js', base).href).then(function (m) {
          return Promise.resolve(m.options({ baseUrl: base.pathname })).then(function () { return m; });
        });
        pf.catch(function () { status.textContent = S.fail; });
      }
      return pf;
    }
    function run() {
      var q = input.value.trim();
      if (q.length < 2) { list.innerHTML = ''; status.textContent = S.hint; return; }
      load().then(function (m) { return m.debouncedSearch(q, {}, 180); }).then(function (r) {
        if (!r) return; // substituída por uma busca mais nova
        return Promise.all(r.results.slice(0, 8).map(function (x) { return x.data(); })).then(function (rows) {
          if (q !== input.value.trim()) return;
          list.innerHTML = '';
          status.textContent = rows.length ? S.n(r.results.length) : S.none;
          rows.forEach(function (d) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = d.url;
            var t = document.createElement('span');
            t.className = 'r-title';
            t.textContent = (d.meta && d.meta.title) || d.url;
            var ex = document.createElement('span');
            ex.className = 'r-excerpt';
            ex.innerHTML = d.excerpt; // trecho do próprio índice do site, com <mark>
            a.appendChild(t); a.appendChild(ex); li.appendChild(a); list.appendChild(li);
          });
        });
      }).catch(function () {});
    }
    function open() {
      if (!dlg) build();
      if (!dlg.open) dlg.showModal();
      input.select();
      load();
    }
    opens.forEach(function (b) { b.addEventListener('click', open); });
  })();

  // ---------- atalhos de teclado ----------
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var el = e.target;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    if (e.key === 't') { setTheme(theme() === 'dark' ? 'light' : 'dark', true); }
    else if (e.key === 'l') {
      var a = document.querySelector('.lang-switch');
      if (a) { store('forplotR_lang', a.getAttribute('data-set-lang')); location.href = a.href; }
    } else if (e.key === '/') {
      var s = document.querySelector('[data-search-open]');
      if (s) { e.preventDefault(); s.click(); }
    }
  });
})();
