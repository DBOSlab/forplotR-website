/* forplotR: comportamento comum a todas as páginas (sem dependências).
 *
 * O site funciona sem JavaScript: navegação, textos, código e imagens estáticas
 * estão no HTML. Este arquivo só acrescenta:
 *   - troca de tema claro/escuro (salva em localStorage: forplotR_theme);
 *   - preferência de idioma (forplotR_lang), usada pelos redirecionamentos;
 *   - índice da página com a seção atual e o arco de progresso da leitura;
 *   - botão "Copiar" nos blocos de código;
 *   - atalhos: t (tema), l (idioma), / (busca, quando houver).
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
