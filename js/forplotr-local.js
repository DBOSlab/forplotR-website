/* forplotR online — motor local (webR, no navegador)
 *
 * O forplotR roda dentro do navegador (R compilado para WebAssembly). Os
 * arquivos da pessoa vão para o sistema de arquivos virtual do webR, em
 * memória, e nunca saem do computador. Tudo vem da própria origem do site:
 *   webr/runtime/   R em WebAssembly (versão fixa, sha256 conferido no build)
 *   webr/repo/      forplotR e dependências (MD5 conferido no build)
 *   webr/engine/    código R do motor (backend/R/core_*.R, backend/webr/engine.R)
 *                   e os formulários (tools-local.json)
 *
 * Uso (pelo js/forplotr-app.js):
 *   var eng = window.ForplotrLocalEngine(ROOT);
 *   eng.tools()                 -> Promise<lista de ferramentas>
 *   eng.warmup()                -> começa a carregar o R
 *   eng.onStage(fn)             -> fn('runtime'|'packages'|'engine'|'ready'|'failed')
 *   eng.run(tool, formData, ui) -> Promise<{st, log}>; ui.progress(st), ui.log(texto)
 *   eng.fileUrl(st, f), eng.zipUrl(st)  -> URLs blob: dos resultados
 */
(function () {
  'use strict';

  var MIME = {
    html: 'text/html', htm: 'text/html', pdf: 'application/pdf',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
    csv: 'text/csv', txt: 'text/plain', zip: 'application/zip',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  var ENGINE_FILES = ['config.R', 'tools_spec.R', 'core_params.R', 'core_run.R', 'engine.R'];
  var ENGINE_DIR = '/home/web_user/fpengine';

  function ext(p) { var m = /\.([^.\/]+)$/.exec(p); return m ? m[1].toLowerCase() : ''; }
  function utf8(s) { return new TextEncoder().encode(s); }

  function ForplotrLocalEngine(root) {
    var base = new URL(root + 'webr/', location.href).href;
    var webR = null, ready = null, sink = null, busy = false;
    var stage = 'idle', listeners = [], urls = [], info = null, toolsP = null;

    function setStage(s) {
      stage = s;
      listeners.slice().forEach(function (f) { try { f(s); } catch (e) { /* ignora */ } });
    }
    function onStage(f) {
      listeners.push(f);
      f(stage);
      return function () { listeners = listeners.filter(function (x) { return x !== f; }); };
    }

    // Saída do R (mensagens, avisos) chega por aqui enquanto a função roda.
    function readLoop() {
      webR.read().then(function (m) {
        if ((m.type === 'stdout' || m.type === 'stderr') && sink) sink(String(m.data));
        if (m.type !== 'closed') readLoop();
      });
    }

    function init() {
      if (ready) return ready;
      ready = (async function () {
        setStage('runtime');
        var mod = await import(base + 'runtime/webr.mjs');
        webR = new mod.WebR({
          baseUrl: base + 'runtime/',
          repoUrl: base + 'repo/',
          // O GitHub Pages não envia COOP/COEP; PostMessage funciona sem eles.
          channelType: mod.ChannelType.PostMessage,
          interactive: false
        });
        await webR.init();
        readLoop();

        setStage('packages');
        // markdown: relatório do forplot_balance sem pandoc.
        await webR.installPackages(['forplotR', 'zip', 'markdown'], { repos: [base + 'repo/'], quiet: true });

        setStage('engine');
        await webR.FS.mkdir(ENGINE_DIR);
        for (var i = 0; i < ENGINE_FILES.length; i++) {
          var f = ENGINE_FILES[i];
          var r = await fetch(base + 'engine/' + f, { cache: 'no-cache' });
          if (!r.ok) throw new Error('webr/engine/' + f + ': HTTP ' + r.status);
          await webR.FS.writeFile(ENGINE_DIR + '/' + f, new Uint8Array(await r.arrayBuffer()));
          await webR.evalRVoid('sys.source("' + ENGINE_DIR + '/' + f + '", envir = globalenv(), keep.source = FALSE)');
        }
        await webR.evalRVoid('local_init()');
        info = JSON.parse(await webR.evalRString('local_health()'));
        setStage('ready');
        return info;
      })();
      ready.catch(function (e) {
        ready = null;
        setStage('failed');
        if (window.console) console.error('forplotR (webR):', e);
      });
      return ready;
    }

    function release() {
      urls.forEach(function (u) { URL.revokeObjectURL(u); });
      urls = [];
    }
    function blobUrl(data, path) {
      var u = URL.createObjectURL(new Blob([data], { type: MIME[ext(path)] || 'application/octet-stream' }));
      urls.push(u);
      return u;
    }

    async function run(tool, fd, ui) {
      if (busy) throw new Error('busy');
      busy = true;
      release();
      var stopStage = onStage(function (s) {
        if (s !== 'ready') ui.progress({ status: 'loading', title: tool.title, stage: s });
      });
      try {
        await init();
        stopStage();

        var up = await webR.evalRString('local_prepare()');
        var fields = {};
        var entries = Array.from(fd.entries());
        for (var i = 0; i < entries.length; i++) {
          var name = entries[i][0], val = entries[i][1];
          if (!/^[a-z_]+$/.test(name)) continue;
          if (typeof val === 'object' && val && typeof val.arrayBuffer === 'function') {
            var p = up + '/' + name;
            await webR.FS.writeFile(p, new Uint8Array(await val.arrayBuffer()));
            fields[name] = { file: true, filename: val.name || name, path: p };
          } else {
            fields[name] = { file: false, value: String(val) };
          }
        }
        var rootDir = up.replace(/\/uploads$/, '');
        await webR.FS.writeFile(rootDir + '/fields.json', utf8(JSON.stringify(fields)));

        var log = '';
        sink = function (t) { log += t + '\n'; ui.log(log); };
        ui.progress({ status: 'running', title: tool.title, fun: tool.fun, started_epoch: Date.now() / 1000 });

        var out = await webR.evalRString('local_run(' + JSON.stringify(tool.id) + ')',
                                         { captureStreams: false, captureConditions: false });
        sink = null;
        var st = JSON.parse(out);

        // Resultados viram URLs blob: (memória do navegador) antes de limpar o R.
        for (var j = 0; j < (st.files || []).length; j++) {
          var f = st.files[j];
          f._url = blobUrl(await webR.FS.readFile(st.root + '/outputs/' + f.path), f.path);
        }
        if (st.zip) st._zipUrl = blobUrl(await webR.FS.readFile(st.root + '/' + st.zip), st.zip);
        return { st: st, log: log };
      } finally {
        stopStage();
        sink = null;
        busy = false;
        if (webR && ready) { try { await webR.evalRVoid('local_cleanup()'); } catch (e) { /* ignora */ } }
      }
    }

    window.addEventListener('pagehide', release);

    return {
      mode: 'local',
      tools: function () {
        if (!toolsP) {
          toolsP = fetch(base + 'engine/tools-local.json', { cache: 'no-cache' }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          });
          toolsP.catch(function () { toolsP = null; });
        }
        return toolsP;
      },
      warmup: function () { init().catch(function () { /* estado 'failed' já avisado */ }); },
      health: function () { return init(); },
      info: function () { return info; },
      stage: function () { return stage; },
      onStage: onStage,
      run: run,
      fileUrl: function (st, f) { return f._url || '#'; },
      zipUrl: function (st) { return st._zipUrl || '#'; },
      release: release
    };
  }

  window.ForplotrLocalEngine = ForplotrLocalEngine;
})();
