// Panoramas 3D da página inicial ----------------------------------------------
//
// Dois objetos, ambos com dados reais de RUS01 (exemplos/panorama/rus01.json,
// gerado por scripts/build_assets.R a partir de forplot_balance()):
//
//   parcela  o hectare como grade de subparcelas; cada árvore é uma haste na sua
//            posição x, y, com altura proporcional ao diâmetro; a cor diz se tem
//            voucher. Com o scroll, a câmera desce do sobrevoo à altura das árvores.
//   balanco  uma coluna por subparcela: com voucher embaixo, sem voucher em cima.
//            Com o scroll, as colunas se elevam.
//
// O site.js só carrega este arquivo se houver WebGL, sem prefers-reduced-motion,
// depois da primeira interação ou de alguns segundos. Sem ele, fica o SVG estático
// (mesmo conteúdo, gerado em R). Só desenha quando visível; para em aba oculta.

import {
  BoxGeometry,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  WebGLRenderer
} from 'three';

const root = document.documentElement;
const EN = (root.getAttribute('lang') || '').slice(0, 2) === 'en';

// Cores vêm dos tokens do CSS (claro/escuro), convertidas por um canvas 2D para
// aceitar qualquer formato que o navegador entenda.
const probe = document.createElement('canvas').getContext('2d');
function token(name) {
  const v = getComputedStyle(root).getPropertyValue(name).trim() || '#888';
  probe.fillStyle = '#000';
  probe.fillStyle = v;
  return new Color(probe.fillStyle);
}
function palette() {
  return {
    col: token('--folha-mark'),
    unc: token('--urucum'),
    palm: token('--faint'),
    grid: token('--rule-strong')
  };
}

// Caixa unitária (base em y = 0) com sombreamento fixo por face: topo claro,
// laterais mais escuras. Dá volume sem luzes nem materiais com iluminação.
function shadedBox() {
  const g = new BoxGeometry(1, 1, 1);
  g.translate(0, 0.5, 0);
  const n = g.attributes.normal;
  const c = [];
  for (let i = 0; i < n.count; i++) {
    const ny = n.getY(i);
    const nx = n.getX(i);
    const k = ny > 0.5 ? 1 : ny < -0.5 ? 0.5 : nx !== 0 ? 0.78 : 0.64;
    c.push(k, k, k);
  }
  g.setAttribute('color', new Float32BufferAttribute(c, 3));
  return g;
}

function gridLines(size, step) {
  const p = [];
  const h = size / 2;
  for (let k = 0; k <= size; k += step) {
    p.push(k - h, 0, -h, k - h, 0, h);
    p.push(-h, 0, k - h, h, 0, k - h);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(p, 3));
  return g;
}

const ease = (t) => t * t * (3 - 2 * t);
const clamp = (t) => Math.max(0, Math.min(1, t));
const lerp = (a, b, t) => a + (b - a) * t;

// --------------------------------------------------------------- cada objeto
function buildParcela(data, col) {
  const scene = new Scene();
  const W = data.plot.width;
  const L = data.plot.length;
  const grid = new LineSegments(gridLines(W, data.plot.subplot), new LineBasicMaterial({ color: col.grid }));
  scene.add(grid);

  const trees = data.trees;
  const dmax = trees.reduce((m, t) => Math.max(m, t[2]), 0) || 1;
  const mesh = new InstancedMesh(shadedBox(), new MeshBasicMaterial({ vertexColors: true }), trees.length);
  const o = new Object3D();
  const kind = [];
  trees.forEach((t, i) => {
    const h = 1.5 + 15 * Math.sqrt(t[2] / dmax);
    o.position.set(t[0] - W / 2, 0, L / 2 - t[1]);
    o.scale.set(0.32, h, 0.32);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
    kind.push(t[4] === 1 ? 'palm' : t[3] === 1 ? 'col' : 'unc');
  });
  scene.add(mesh);

  const n = { col: 0, unc: 0, palm: 0 };
  const placed = data.n_placed > trees.length ? (EN ? ` (of ${data.n_placed} placed)` : ` (de ${data.n_placed} com posição)`) : '';
  kind.forEach((k) => n[k]++);
  const label = EN
    ? `RUS01 plot in perspective, 1 ha in 100 subplots of 10 × 10 m: ${trees.length} trees with a diameter in the spreadsheet${placed}; stem height follows diameter. ${n.col} with a voucher, ${n.unc} without, ${n.palm} palms.`
    : `Parcela RUS01 em perspectiva, 1 ha em 100 subparcelas de 10 × 10 m: ${trees.length} árvores com diâmetro na planilha${placed}; a altura da haste acompanha o diâmetro. ${n.col} com voucher, ${n.unc} sem voucher, ${n.palm} palmeiras.`;

  return {
    scene,
    label,
    recolor(c) {
      grid.material.color.copy(c.grid);
      kind.forEach((k, i) => mesh.setColorAt(i, c[k]));
      mesh.instanceColor.needsUpdate = true;
    },
    // t: 0 = sobrevoo alto; 1 = câmera na altura das árvores
    pose(cam, t) {
      const e = ease(t);
      const elev = lerp(58, 11, e) * Math.PI / 180;
      const az = lerp(36, 54, e) * Math.PI / 180;
      const r = lerp(215, 150, e);
      cam.position.set(r * Math.cos(elev) * Math.sin(az), r * Math.sin(elev), r * Math.cos(elev) * Math.cos(az));
      cam.lookAt(0, lerp(-4, 4, e), 0);
    }
  };
}

function buildBalanco(data, col) {
  const scene = new Scene();
  const W = data.plot.width;
  const S = data.plot.subplot;
  const grid = new LineSegments(gridLines(W, S), new LineBasicMaterial({ color: col.grid }));
  scene.add(grid);

  // subplots: [x0, y0, com voucher, sem voucher, palmeiras]
  const sp = data.subplots;
  const k = 1.1;
  const geo = shadedBox();
  const mat = new MeshBasicMaterial({ vertexColors: true });
  const lower = new InstancedMesh(geo, mat, sp.length);
  const upper = new InstancedMesh(geo, mat, sp.length);
  const o = new Object3D();
  let ncol = 0;
  let nunc = 0;
  sp.forEach((s) => { ncol += s[2]; nunc += s[3]; });

  function place(g) {
    sp.forEach((s, i) => {
      // onda diagonal: as subparcelas do fundo sobem um pouco depois
      const d = (s[0] + s[1]) / (2 * (W - S));
      const t = ease(clamp(g * 1.6 - d * 0.6));
      const x = s[0] + S / 2 - W / 2;
      const z = W / 2 - (s[1] + S / 2);
      // altura zero vira caixa degenerada (invisível), sem disputar o topo
      const hc = s[2] * k * t;
      const hu = s[3] * k * t;
      const w = (h) => (h > 0.01 ? S * 0.5 : 0);
      o.position.set(x, 0, z);
      o.scale.set(w(hc), hc, w(hc));
      o.updateMatrix();
      lower.setMatrixAt(i, o.matrix);
      o.position.set(x, hc, z);
      o.scale.set(w(hu), hu, w(hu));
      o.updateMatrix();
      upper.setMatrixAt(i, o.matrix);
    });
    lower.instanceMatrix.needsUpdate = true;
    upper.instanceMatrix.needsUpdate = true;
  }
  place(0);
  scene.add(lower, upper);

  const label = EN
    ? `RUS01 collection balance: one column per subplot (100); with a voucher below (${ncol} individuals), without a voucher on top (${nunc}), as reported by forplot_balance().`
    : `Balanço de coleta do RUS01: uma coluna por subparcela (100); com voucher embaixo (${ncol} indivíduos), sem voucher em cima (${nunc}), segundo forplot_balance().`;

  return {
    scene,
    label,
    recolor(c) {
      grid.material.color.copy(c.grid);
      for (let i = 0; i < sp.length; i++) {
        lower.setColorAt(i, c.col);
        upper.setColorAt(i, c.unc);
      }
      lower.instanceColor.needsUpdate = true;
      upper.instanceColor.needsUpdate = true;
    },
    pose(cam, t) {
      place(t);
      const elev = 32 * Math.PI / 180;
      const az = lerp(30, 44, t) * Math.PI / 180;
      const r = 205;
      cam.position.set(r * Math.cos(elev) * Math.sin(az), r * Math.sin(elev), r * Math.cos(elev) * Math.cos(az));
      cam.lookAt(0, 2, 0);
    }
  };
}

const BUILD = { parcela: buildParcela, balanco: buildBalanco };

// ---------------------------------------------------------- montagem na página
function mount(fig, data) {
  const make = BUILD[fig.getAttribute('data-pano')];
  if (!make) return null;
  let col = palette();
  const obj = make(data, col);
  obj.recolor(col);

  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', obj.label);
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) {
    return null; // fica o SVG
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const cam = new PerspectiveCamera(32, 16 / 10, 1, 1000);

  const stat = fig.querySelector('.static');
  fig.insertBefore(canvas, stat);
  fig.classList.add('is-live');

  let visible = false;
  let current = -1;
  let target = 0;
  let raf = 0;

  // progresso do scroll: 0 com o centro da figura perto do pé da janela,
  // 1 quando ele chega ao quarto superior
  function progress() {
    const r = fig.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    return clamp((vh * 0.85 - (r.top + r.height / 2)) / (vh * 0.6));
  }
  function size() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  function frame() {
    raf = 0;
    if (!visible || document.hidden) return;
    current = current < 0 ? target : current + (target - current) * 0.08;
    if (Math.abs(target - current) < 0.0005) current = target;
    obj.pose(cam, current);
    renderer.render(obj.scene, cam);
    if (current !== target) raf = requestAnimationFrame(frame);
  }
  function kick() {
    target = progress();
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function redraw() { current = -1; kick(); }

  size();
  new ResizeObserver(() => { size(); redraw(); }).observe(canvas);
  new IntersectionObserver((es) => {
    visible = es[es.length - 1].isIntersecting;
    if (visible) kick();
  }, { rootMargin: '80px 0px' }).observe(fig);
  window.addEventListener('scroll', kick, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  // troca de tema (botão ou sistema): refaz as cores
  const recolor = () => { col = palette(); obj.recolor(col); redraw(); };
  new MutationObserver(recolor).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolor);
  return obj;
}

export async function start(base) {
  const figs = document.querySelectorAll('figure.panorama[data-pano]');
  if (!figs.length) return;
  const res = await fetch(new URL('exemplos/panorama/rus01.json', base));
  if (!res.ok) return;
  const data = await res.json();
  figs.forEach((f) => mount(f, data));
}
