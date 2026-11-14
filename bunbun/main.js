import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { dessert, berry as dBerry, berryHalf as dHalf, blueberry as dBlue, raspberry as dRasp, textures as dTex } from './desserts.js?v=5';
import { MENU } from './menu.js?v=5';

const $ = (i) => document.getElementById(i);
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t, ease = (t) => t * t * (3 - 2 * t);
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();   /* repeatable "randomness" so a cake looks the same each time */

/* ---------- the menu of choices ---------- */
const FL = { vanilla: ['Vanilla bean', '#f1d9a0'], chocolate: ['Chocolate', '#4a2a1e'], redvelvet: ['Red velvet', '#8f1d2e'], strawberry: ['Strawberry', '#efb0bb'], lemon: ['Lemon', '#f3e08a'], caramel: ['Caramel', '#b97a3d'] };
const FR = { cream: ['Fresh cream', '#f7f0e4'], sky: ['Sky blue', '#bccbe6'], blush: ['Blush', '#f1cfd6'], pistachio: ['Pistachio', '#cfe3c6'], cocoa: ['Cocoa', '#6e4636'], butter: ['Butter', '#f3dc9b'] };
const DR = { none: ['No drip', null], choc: ['Chocolate', '#2f1a12'], caramel: ['Caramel', '#c98a3c'], white: ['White chocolate', '#fbf6ec'], berry: ['Berry', '#9b2347'] };
const TOPS = { strawberry: 'Strawberries', berries: 'Berries', roses: 'Piped roses', macarons: 'Macarons', pearls: 'Gold pearls', sprinkles: 'Sprinkles' };
const STYLE = { naked: 'Semi-naked', frosted: 'Smooth buttercream' };
const TIER = { 1: ['1 tier', 'serves 8', 1200], 2: ['2 tiers', 'serves 16', 2600], 3: ['3 tiers', 'serves 28', 4200] };
const OCC = [
  { k: 'Birthday', style: 'naked', tiers: 2, flavour: 'vanilla', frost: 'cream', drip: 'none', tops: ['strawberry', 'berries'], candles: true, msg: 'Happy Birthday' },
  { k: 'Wedding', style: 'frosted', tiers: 3, flavour: 'vanilla', frost: 'cream', drip: 'none', tops: ['roses', 'pearls'], candles: false, msg: 'Forever begins' },
  { k: 'Anniversary', style: 'naked', tiers: 2, flavour: 'redvelvet', frost: 'cream', drip: 'none', tops: ['strawberry', 'roses'], candles: true, msg: 'Happy Anniversary' },
  { k: 'Baby shower', style: 'frosted', tiers: 2, flavour: 'strawberry', frost: 'sky', drip: 'white', tops: ['macarons', 'pearls'], candles: false, msg: 'Welcome little one' },
  { k: 'Graduation', style: 'frosted', tiers: 1, flavour: 'chocolate', frost: 'cocoa', drip: 'choc', tops: ['berries', 'pearls'], candles: false, msg: 'Well done' },
  { k: 'Festival', style: 'naked', tiers: 2, flavour: 'caramel', frost: 'butter', drip: 'caramel', tops: ['sprinkles', 'pearls'], candles: true, msg: 'Happy celebrations' },
  { k: 'Just because', style: 'naked', tiers: 1, flavour: 'lemon', frost: 'cream', drip: 'none', tops: ['berries', 'strawberry'], candles: false, msg: 'Because you are lovely' }
];
const bag = new Map(); const STAND = .52; const standParts = [];
const S = { cakeOn: false, occ: 'Birthday', style: 'naked', tiers: 2, flavour: 'vanilla', frost: 'cream', drip: 'none', tops: new Set(['strawberry', 'berries']), candles: true, msg: 'Happy Birthday', deco: [], decorate: false, qty: 1, ship: 'home', pinOk: false, km: 0 };
const price = (s = S) => (TIER[s.tiers][2] + (s.drip !== 'none' ? 150 : 0) + [...s.tops].length * 100 + (s.candles ? 50 : 0) + (s.style === 'frosted' ? 200 : 0) + (s.deco ? s.deco.length * 20 : 0)) * (s.qty || 1);
const preset = (o) => ({ ...S, occ: o.k, style: o.style, tiers: o.tiers, flavour: o.flavour, frost: o.frost, drip: o.drip, tops: new Set(o.tops), candles: o.candles, msg: o.msg, deco: [], decorate: false, qty: 1 });

/* ---------- controls ---------- */
function chipRow(id, items, isOn, pick, swatch) {
  const el = $(id); el.innerHTML = '';
  items.forEach(([key, label, col]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (isOn(key) ? ' on' : ''); b.setAttribute('aria-pressed', isOn(key));
    b.innerHTML = (swatch && col ? `<i style="background:${col}"></i>` : '') + label; b.addEventListener('click', () => pick(key)); el.appendChild(b); });
}
function ui() {
  chipRow('c-occ', OCC.map((o) => [o.k, o.k]), (k) => S.occ === k, (k) => apply(preset(OCC.find((o) => o.k === k))));
  chipRow('c-tiers', [1, 2, 3].map((n) => [n, TIER[n][0] + ' · ' + TIER[n][1]]), (k) => S.tiers === +k, (k) => { S.tiers = +k; S.deco = []; refresh(); });
  chipRow('c-style', Object.entries(STYLE), (k) => S.style === k, (k) => { S.style = k; refresh(); });
  chipRow('c-flavour', Object.entries(FL).map(([k, v]) => [k, v[0], v[1]]), (k) => S.flavour === k, (k) => { S.flavour = k; refresh(); }, true);
  chipRow('c-frost', Object.entries(FR).map(([k, v]) => [k, v[0], v[1]]), (k) => S.frost === k, (k) => { S.frost = k; refresh(); }, true);
  chipRow('c-drip', Object.entries(DR).map(([k, v]) => [k, v[0], v[1]]), (k) => S.drip === k, (k) => { S.drip = k; refresh(); }, true);
  chipRow('c-tops', [...Object.entries(TOPS), ['candles', 'Candles']], (k) => (k === 'candles' ? S.candles : S.tops.has(k)), (k) => { if (k === 'candles') S.candles = !S.candles; else S.tops.has(k) ? S.tops.delete(k) : S.tops.add(k); refresh(); });
  chipRow('c-ship', [['home', 'Home delivery (nearby)'], ['pickup', 'Pickup']], (k) => S.ship === k, (k) => { S.ship = k; refresh(); });
  $('serves').textContent = TIER[S.tiers][1];
  $('qn').textContent = S.qty; $('price').textContent = inr(price());
  $('shipRow').style.display = S.ship === 'home' ? 'flex' : 'none'; $('shipMsg').style.display = S.ship === 'home' ? '' : 'none';
  $('bPack').textContent = packState === 'done' ? 'Design another cake' : S.ship === 'home' ? 'Pack it and send home →' : 'Pack it for pickup →';
  $('bgword').textContent = S.occ;
  const lines = summary(); $('sum').innerHTML = lines; $('sum2').innerHTML = orderSummary(); badge();
  $('bDeco').classList.toggle('on', S.decorate); $('viewer').style.cursor = S.decorate ? 'crosshair' : '';
  $('hint').textContent = S.decorate ? 'Tap the top of the cake to place a strawberry or macaron' : 'Drag to rotate';
}
function summary() {
  const t = [...S.tops].map((k) => TOPS[k].toLowerCase()); if (S.candles) t.push('candles'); if (S.deco.length) t.push(S.deco.length + ' hand-placed');
  return `<b>${S.occ} cake</b> · ${TIER[S.tiers][0]} (${TIER[S.tiers][1]}) · ${STYLE[S.style].toLowerCase()}<br>${FL[S.flavour][0]} sponge, ${FR[S.frost][0].toLowerCase()} buttercream${S.drip !== 'none' ? ', ' + DR[S.drip][0].toLowerCase() + ' drip' : ''}<br>${t.length ? 'With ' + t.join(', ') + '<br>' : ''}${S.msg ? 'Message: “' + S.msg.replace(/</g, '&lt;') + '”<br>' : ''}Quantity ${S.qty} · <b>${inr(price())}</b> <span style="opacity:.6">(sample pricing)</span>`;
}
function refresh() { S.cakeOn = true; ui(); build(); }
function apply(next) { Object.assign(S, next); S.cakeOn = true; $('msg').value = S.msg; refresh(); }

/* ---------- textures that make it read as food ---------- */
function ctex(w, h, draw, repeat) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 4; return t; }
const T = {};
function makeTextures() {
  T.crumb = ctex(256, 256, (x, w, h) => { x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const g = 80 + rnd() * 150; x.fillStyle = `rgb(${g},${g},${g})`; x.beginPath(); x.arc(rnd() * w, rnd() * h, .6 + rnd() * 2.6, 0, 6.283); x.fill(); } }, [3, 1]);
  T.crumbMap = ctex(256, 256, (x, w, h) => { x.fillStyle = '#e6e6e6'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1800; i++) { const g = 190 + rnd() * 65; x.fillStyle = `rgba(${g},${g * .96},${g * .9},.55)`; x.beginPath(); x.arc(rnd() * w, rnd() * h, .8 + rnd() * 3, 0, 6.283); x.fill(); } }, [3, 1]);
  T.frost = ctex(256, 256, (x, w, h) => { x.fillStyle = '#b4b4b4'; x.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { const y = rnd() * h, g = 140 + rnd() * 100; x.strokeStyle = `rgba(${g},${g},${g},.55)`; x.lineWidth = .6 + rnd() * 1.6; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * .3, y + (rnd() - .5) * 5, w * .7, y + (rnd() - .5) * 5, w, y + (rnd() - .5) * 3); x.stroke(); } for (let i = 0; i < 1500; i++) { const g = 150 + rnd() * 90; x.fillStyle = `rgba(${g},${g},${g},.4)`; x.fillRect(rnd() * w, rnd() * h, 1.4, 1.4); } }, [4, 1]);
  T.seed = ctex(128, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#d9283c'); g.addColorStop(.5, '#c4162e'); g.addColorStop(1, '#a50f26'); x.fillStyle = g; x.fillRect(0, 0, w, h); for (let r = 0; r < 18; r++) for (let c = 0; c < 9; c++) { const px = (c + (r % 2) * .5) * (w / 9) + 2, py = (r + .5) * (h / 18); x.fillStyle = 'rgba(255,224,150,.85)'; x.beginPath(); x.ellipse(px, py, 1.5, 2.4, 0, 0, 6.283); x.fill(); x.fillStyle = 'rgba(120,10,25,.4)'; x.beginPath(); x.arc(px, py + 3, 3, 0, 6.283); x.fill(); } });
  T.glow = ctex(64, 64, (x, w, h) => { const g = x.createRadialGradient(32, 32, 1, 32, 32, 31); g.addColorStop(0, 'rgba(255,230,160,.95)'); g.addColorStop(.35, 'rgba(255,190,90,.45)'); g.addColorStop(1, 'rgba(255,170,60,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  T.glow.wrapS = T.glow.wrapT = THREE.ClampToEdgeWrapping;
}

/* ---------- shared geometry ---------- */
const G = {};
function makeGeometry() {
  const kiss = new THREE.LatheGeometry([[0, .17], [.018, .165], [.04, .14], [.062, .1], [.078, .055], [.086, .02], [.088, 0]].map(([x, y]) => new THREE.Vector2(x, y)), 18);   /* piped buttercream kiss */
  { const p = kiss.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z), k = 1 + .09 * Math.sin(a * 9 + y * 55); p.setXYZ(i, Math.cos(a) * r * k, y, Math.sin(a) * r * k); } kiss.computeVertexNormals(); }
  G.kiss = kiss;
  const sb = [[0, 0], [.04, .004], [.085, .03], [.118, .075], [.13, .13], [.122, .185], [.098, .23], [.06, .262], [.02, .278], [0, .28]].map(([x, y]) => new THREE.Vector2(x, y));
  G.berry = new THREE.LatheGeometry(sb, 24); G.berry.translate(0, -.0, 0);
  G.leaf = new THREE.SphereGeometry(1, 12, 8); G.leaf.scale(.07, .008, .028);
  G.blue = new THREE.SphereGeometry(.058, 18, 14); G.rasp = new THREE.SphereGeometry(.026, 8, 6);
  G.pearl = new THREE.SphereGeometry(.03, 14, 10); G.spr = new THREE.CapsuleGeometry(.008, .034, 2, 5);
  G.mac = new THREE.SphereGeometry(.12, 22, 14); G.mac.scale(1, .42, 1);
  G.flame = new THREE.LatheGeometry([[0, 0], [.03, .03], [.036, .075], [.022, .13], [0, .2]].map(([x, y]) => new THREE.Vector2(x, y)), 12);
}
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, metalness: 0, ...o });
const MP = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .5, ...o });

/* ---------- the renderer, scene, light ---------- */
const cvs = $('cake'); let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: cvs, alpha: true, antialias: true }); } catch (e) { cvs.style.display = 'none'; }
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(28, 1, .1, 60), root = new THREE.Group(), cakeG = new THREE.Group(), boxG = new THREE.Group();
let topDisc = null, topY = 0, topR = 1, topper = null, camTarget = { y: 1.5, d: 10 }, cakeH = 2; const flames = [];
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(640, 640, false); renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .62;
  const key = new THREE.DirectionalLight(0xfff3e6, 2.4); key.position.set(3.2, 7, 4.5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 5; key.shadow.camera.bottom = -2; key.shadow.camera.near = 1; key.shadow.camera.far = 20; key.shadow.bias = -.0004; key.shadow.radius = 5; scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe8ff, .9); rim.position.set(-4, 3, -3); scene.add(rim); scene.add(new THREE.HemisphereLight(0xffffff, 0xaab6cc, .35));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(4, 48), new THREE.ShadowMaterial({ opacity: .22 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.005; ground.receiveShadow = true; root.add(ground);
  root.add(cakeG, boxG); scene.add(root); cam.position.set(0, 3.2, 10); cam.lookAt(0, 1.5, 0);
  makeTextures(); makeGeometry();
}
const add = (mesh, parent = cakeG, cast = true) => { mesh.castShadow = cast; mesh.receiveShadow = true; parent.add(mesh); return mesh; };

function topperTexture(text) {
  const c = document.createElement('canvas'); c.width = 768; c.height = 256; const x = c.getContext('2d'); x.textAlign = 'center'; x.textBaseline = 'middle';
  let size = 130; do { x.font = `italic 500 ${size}px 'Cormorant Garamond', Georgia, serif`; size -= 4; } while (x.measureText(text).width > 700 && size > 40);
  const g = x.createLinearGradient(0, 70, 0, 190); g.addColorStop(0, '#fff2c4'); g.addColorStop(.45, '#e2b862'); g.addColorStop(1, '#b3862f');
  x.shadowColor = 'rgba(60,40,10,.35)'; x.shadowBlur = 6; x.shadowOffsetY = 3; x.fillStyle = g; x.fillText(text, 384, 132); x.lineWidth = 2; x.strokeStyle = 'rgba(120,84,20,.6)'; x.strokeText(text, 384, 132);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function rose(col) {
  const g = new THREE.Group(); const m = MP(col, { roughness: .42, sheen: .5, sheenRoughness: .6, sheenColor: new THREE.Color('#ffffff') });
  [[.105, .03], [.08, .045], [.058, .058], [.038, .07], [.02, .08]].forEach(([r, y], i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, .03 - i * .003, 8, 22), m); t.rotation.x = Math.PI / 2; t.position.y = y; t.scale.z = 1.25; add(t, g); });
  const c = new THREE.Mesh(new THREE.SphereGeometry(.026, 10, 8), m); c.position.y = .092; add(c, g); return g;
}
const strawberry = (s = 1) => dBerry(s);
function macaron(col) {
  const g = new THREE.Group(); const sh = MP(col, { roughness: .55, clearcoat: .15 });
  const a = new THREE.Mesh(G.mac, sh); a.position.y = .1; add(a, g); const b = new THREE.Mesh(G.mac, sh); b.position.y = .035; b.scale.y = .85; add(b, g);
  const f = new THREE.Mesh(new THREE.CylinderGeometry(.108, .108, .05, 22), M('#fbf5e8', { roughness: .8 })); f.position.y = .066; add(f, g); return g;
}
function rosette(mat, s = 1) {
  const pts = Array.from({ length: 64 }, (_, i) => { const u = i / 63, a = u * Math.PI * 2 * 2.6, r = .095 * (1 - u * .86); return new THREE.Vector3(Math.cos(a) * r, .02 + u * .085, Math.sin(a) * r); });
  const g = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, .034, 10), mat); g.scale.setScalar(s); return g;
}
function build() {
  if (!renderer) return;
  while (cakeG.children.length) { const o = cakeG.children.pop(); o.traverse((n) => { if (n.isMesh && n.geometry && !Object.values(G).includes(n.geometry)) n.geometry.dispose(); if (n.material) { const ms = Array.isArray(n.material) ? n.material : [n.material]; ms.forEach((m) => { if (m.map && !Object.values(T).includes(m.map)) m.map.dispose(); m.dispose(); }); } }); }
  flames.length = 0; topper = null; rnd(); let seed = 7;
  const sponge = FL[S.flavour][1], fro = FR[S.frost][1], dripC = DR[S.drip][1];
  const frostMat = () => MP(fro, { roughness: .62, bumpMap: T.frost, bumpScale: .4, sheen: .16, sheenRoughness: .8, sheenColor: new THREE.Color('#ffffff') });
  const spongeMat = () => M(sponge, { roughness: .92, bumpMap: T.crumb, bumpScale: 1.6, map: T.crumbMap });
  /* a pedestal cake stand: foot, stem and a white plate with a thin gold rim */
  standParts.length = 0;
  const foot = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.7, 0], [.76, .03], [.66, .08], [.2, .12], [0, .12]].map(([a, b]) => new THREE.Vector2(a, b)), 64), M('#f4efe6', { roughness: .35 })); add(foot); standParts.push(foot);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.09, .13, STAND - .12, 28), M('#f4efe6', { roughness: .35 })); stem.position.y = .12 + (STAND - .12) / 2 - .05; add(stem); standParts.push(stem);
  const board = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.6, .07, 96), M('#f7f3ea', { roughness: .3 })); board.position.y = STAND - .035; add(board);
  const rimG = new THREE.Mesh(new THREE.TorusGeometry(1.62, .014, 8, 96), M('#d8b66a', { metalness: .95, roughness: .28 })); rimG.rotation.x = Math.PI / 2; rimG.position.y = STAND - .02; add(rimG, cakeG, false);
  const R = S.tiers === 1 ? [1.12] : S.tiers === 2 ? [1.14, .78] : [1.2, .86, .56]; let y = STAND;
  R.forEach((r, i) => {
    const bottom = y;
    if (S.style === 'frosted') {
      const hgt = .98, pts = [[0, 0], [r - .04, 0], [r - .012, .006], [r, .04], [r, hgt - .05], [r - .012, hgt - .014], [r - .05, hgt], [0, hgt]].map(([a, b]) => new THREE.Vector2(a, b));
      const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), frostMat()); body.position.y = y; add(body); y += hgt;
      const nb = Math.round(r * 24); for (let d = 0; d < nb; d++) { const a = d / nb * Math.PI * 2, k = new THREE.Mesh(G.kiss, frostMat()); k.position.set(Math.cos(a) * (r - .02), bottom, Math.sin(a) * (r - .02)); k.scale.setScalar(.8); add(k); }
    } else {
      for (let k = 0; k < 3; k++) {
        const sl = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.004, .24, 80, 1), spongeMat()); { const p = sl.geometry.attributes.position; for (let v = 0; v < p.count; v++) { const x = p.getX(v), z = p.getZ(v), a = Math.atan2(z, x), w = 1 + .006 * Math.sin(a * 11 + k) + .004 * Math.sin(a * 23); p.setX(v, x * w); p.setZ(v, z * w); } sl.geometry.computeVertexNormals(); }
        sl.position.y = y + .12; add(sl); y += .24;
        if (k < 2) { const fh = .11, fm = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [r - .01, 0], [r + .035, .02], [r + .05, fh * .5], [r + .035, fh - .02], [r - .01, fh], [0, fh]].map(([a, b]) => new THREE.Vector2(a, b)), 80), frostMat()); { const p = fm.geometry.attributes.position; for (let v = 0; v < p.count; v++) { const x = p.getX(v), z = p.getZ(v), a = Math.atan2(z, x), w = 1 + .018 * Math.sin(a * 7 + k * 2) + .01 * Math.sin(a * 17); p.setX(v, x * w); p.setZ(v, z * w); } fm.geometry.computeVertexNormals(); } fm.position.y = y; add(fm); y += fh; }
      }
    }
    /* top surface: a soft dome of buttercream with a piped border */
    const topPts = [[0, .035], [r - .14, .03], [r - .04, .014], [r, 0]].map(([a, b]) => new THREE.Vector2(a, b));
    const ringT = dTex().ridge.clone(); ringT.repeat.set(1, 20); ringT.needsUpdate = true; const topMat = MP(fro, { roughness: .6, bumpMap: ringT, bumpScale: 1.5, sheen: .25, sheenColor: new THREE.Color('#fff') }); const top = new THREE.Mesh(new THREE.LatheGeometry(topPts.map((p) => p), 96), topMat); top.position.y = y; add(top); const topSurf = y + .03; y += .0;
    const rmat = MP(fro, { roughness: .6, bumpMap: dTex().ridge, bumpScale: 1.1, sheen: .2, sheenColor: new THREE.Color('#fff') }); const n = Math.round(r * 16); for (let d = 0; d < n; d++) { const a = d / n * Math.PI * 2, k = rosette(rmat, 1.45 - i * .1); k.position.set(Math.cos(a) * (r - .09), y - .005, Math.sin(a) * (r - .09)); k.rotation.y = d; add(k); }
    if (dripC) {
      const gm = MP(dripC, { roughness: .12, clearcoat: 1, clearcoatRoughness: .06 });
      const pool = new THREE.Mesh(new THREE.LatheGeometry([[0, .02], [r - .16, .02], [r - .06, .012], [r + .006, -.004], [r + .012, -.03], [0, -.03]].map(([a, b]) => new THREE.Vector2(a, b)), 96), gm); pool.position.y = y + .02; add(pool);
      const nd = Math.round(r * 14); for (let d = 0; d < nd; d++) { const a = (d / nd) * Math.PI * 2 + .15 * Math.sin(d * 2.3), L = .1 + ((d * 53) % 17) / 17 * .36 + (i === 0 ? .06 : 0), w = .045 + ((d * 29) % 7) / 7 * .02;
        const dr = new THREE.Mesh(new THREE.CapsuleGeometry(w, L, 4, 10), gm); dr.position.set(Math.cos(a) * (r + .018), y - .015 - L / 2, Math.sin(a) * (r + .018)); add(dr); }
    }
    if (i === R.length - 1) { topDisc = top; topY = y + .04; topR = r; }
    y += .04;
  });
  cakeH = y; const top = topY, rr = topR; const at = (a, rad, extra = 0) => [Math.cos(a) * rad, top + extra, Math.sin(a) * rad];
  if (S.tops.has('strawberry')) for (let d = 0; d < 5; d++) { const a = -1.0 + d * .46, s = strawberry(.7 + ((d * 37) % 5) * .05), rad = rr * (.68 - Math.abs(d - 2) * .035); const p = at(a, rad); s.position.set(p[0], top - .012, p[2]); s.rotation.set(.24 * Math.cos(a), a * 3 + d, .24 * Math.sin(a) + (d % 2 ? .12 : -.12)); add(s, cakeG, false); }
  if (S.tops.has('berries')) {
    const nr = Math.round(rr * 17); for (let d = 0; d < nr; d++) { const a = d / nr * Math.PI * 2, b = dBlue(1.5 - (d % 3) * .06); b.position.set(Math.cos(a) * (rr - .16), top + .055, Math.sin(a) * (rr - .16)); b.rotation.y = d; add(b, cakeG, false); }
    for (let d = 0; d < 16; d++) { const a = d * 2.399, rad = Math.sqrt(d / 16) * rr * .42, b = d % 6 === 5 ? dRasp(1.7) : dBlue(1.5 - (d % 4) * .08); b.position.set(Math.cos(a) * rad, top + (d % 6 === 5 ? 0 : .055) + (d > 9 ? .04 : 0), Math.sin(a) * rad); b.rotation.y = d; add(b, cakeG, false); }
    for (let d = 0; d < 3; d++) { const l = new THREE.Mesh(G.leaf, M('#4f8a4d')); l.scale.setScalar(2.2); const a = d * 2.1; l.position.set(Math.cos(a) * rr * .5, top + .03, Math.sin(a) * rr * .5); l.rotation.y = a; add(l, cakeG, false); } }
  if (S.tops.has('roses')) { const cols = ['#fdf6ec', '#f1cfd6', '#fbeec9']; [[.55, .05], [-.42, -.5], [.1, .62], [-.6, .3]].forEach(([fx, fz], f) => { const r = rose(cols[f % 3]); r.position.set(fx * rr, top, fz * rr); r.rotation.y = f * 1.7; add(r, cakeG, false);
    for (let l = 0; l < 3; l++) { const lf = new THREE.Mesh(G.leaf, M('#5b8a52')); lf.scale.setScalar(1.8); const a = l * 2.1 + f; lf.position.set(fx * rr + Math.cos(a) * .15, top + .012, fz * rr + Math.sin(a) * .15); lf.rotation.y = -a; add(lf, cakeG, false); } }); }
  if (S.tops.has('macarons')) { const cols = ['#f4b8c8', '#bccbe6', '#f6e3a8', '#cfe3c6']; for (let d = 0; d < 4; d++) { const a = d / 4 * Math.PI * 2 + .6, m = macaron(cols[d]); const p = at(a, rr * .55); m.position.set(p[0], top - .01, p[2]); m.rotation.set(.35, a, .1); add(m, cakeG, false); } }
  if (S.tops.has('pearls')) { const pm = M('#e6c36e', { metalness: .95, roughness: .22 }); for (let d = 0; d < 16; d++) { const a = d / 16 * Math.PI * 2, rad = rr * (.85 + (d % 2) * .06); const p = new THREE.Mesh(G.pearl, pm); p.position.set(Math.cos(a) * rad, top + .03, Math.sin(a) * rad); add(p); } for (let d = 0; d < 9; d++) { const a = d * 2.3, rad = (.12 + (d % 3) * .1) * rr; const p = new THREE.Mesh(G.pearl, pm); p.scale.setScalar(.8); p.position.set(Math.cos(a) * rad + rr * .1, top + .028, Math.sin(a) * rad - rr * .1); add(p); } }
  if (S.tops.has('sprinkles')) { const cl = ['#f2a7be', '#f6d37a', '#9fd2c3', '#a9b8e8', '#ffffff']; for (let d = 0; d < 110; d++) { const a = rnd() * 6.283, rad = Math.sqrt(rnd()) * (rr - .16); const s = new THREE.Mesh(G.spr, M(cl[d % 5], { roughness: .5 })); s.position.set(Math.cos(a) * rad, top + .012, Math.sin(a) * rad); s.rotation.set(Math.PI / 2, 0, rnd() * 6.283); add(s, cakeG, false); } }
  if (S.candles) for (let d = 0; d < 5; d++) { const a = d / 5 * Math.PI * 2 + .2, x = Math.cos(a) * (rr * .36), z = Math.sin(a) * (rr * .36);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.017, .02, .62, 14), M('#f6efe0', { roughness: .45 })); c.position.set(x, top + .31, z); add(c);
    const f = new THREE.Mesh(G.flame, new THREE.MeshBasicMaterial({ color: '#ffd37a' })); f.position.set(x, top + .63, z); f.scale.setScalar(.8); f.userData.p = d; cakeG.add(f); flames.push(f);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.setScalar(.14); gl.position.set(x, top + .7, z); cakeG.add(gl); }
  S.deco.forEach((p) => { const m = p.t === 'strawberry' ? strawberry(.85) : macaron(['#f4b8c8', '#bccbe6', '#f6e3a8'][Math.abs(Math.round(p.x * 10)) % 3]); m.position.set(p.x, top - .01, p.z); m.rotation.y = p.x * 9; add(m, cakeG, false); });
  if (S.msg.trim()) { const g = new THREE.Group(); const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .57), new THREE.MeshBasicMaterial({ map: topperTexture(S.msg.trim()), transparent: true, side: THREE.DoubleSide, depthWrite: false })); pl.position.y = .88; g.add(pl);
    [-.35, .35].forEach((sx) => { const st = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .64, 6), M('#d8b66a', { metalness: .95, roughness: .25 })); st.position.set(sx, .32, 0); g.add(st); }); g.position.set(0, top, -rr * .08); cakeG.add(g); topper = g; }
  camTarget = { y: cakeH * .5 + .3, d: 8.8 + S.tiers * 1.0 };
}

/* ---------- drag to spin, tap to decorate ---------- */
let rotY = .5, rotV = 0, dragging = false, lastX = 0, downX = 0, downY = 0, moved = 0, spinning = true;
function attach(el) {
  el.addEventListener('pointerdown', (e) => { dragging = true; lastX = downX = e.clientX; downY = e.clientY; moved = 0; rotV = 0; el.classList.add('drag'); try { el.setPointerCapture(e.pointerId); } catch (x) {} });
  el.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); rotV = dx * .012; rotY += dx * .012; });
  const up = (e) => { if (!dragging) return; dragging = false; el.classList.remove('drag'); if (S.decorate && moved < 6 && Math.hypot(e.clientX - downX, e.clientY - downY) < 8) place(e); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', () => { dragging = false; el.classList.remove('drag'); });
}
const ray = new THREE.Raycaster();
function place(e) {
  if (!renderer || !topDisc) return; const r = cvs.getBoundingClientRect(); const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
  ray.setFromCamera({ x: nx, y: ny }, cam); const hit = ray.intersectObject(topDisc)[0]; if (!hit) return; const p = cakeG.worldToLocal(hit.point.clone());
  if (S.deco.length >= 10) S.deco.shift(); S.deco.push({ x: p.x, z: p.z, t: S.deco.length % 2 ? 'macaron' : 'strawberry' }); refresh();
}
attach($('viewer'));

/* ---------- the studio follows the page ---------- */
let t0 = performance.now(); let packState = '';
function frame(now) {
  const dt = Math.min(.05, (now - t0) / 1000) || .016; t0 = now; const T2 = now / 1000;
  if (renderer) {
    const vr = $('viewer').getBoundingClientRect(), size = Math.min(vr.width, vr.height) * 1.1, cx = vr.left + vr.width / 2, cy = vr.top + vr.height / 2 + vr.height * (innerWidth < 760 ? -.03 : .04);
    const inView = vr.bottom > -40 && vr.top < innerHeight, fade = clamp(vr.bottom / (innerHeight * .25)) * clamp((innerHeight - vr.top) / (innerHeight * .12));
    cvs.style.transform = `translate(${(cx - 320).toFixed(1)}px,${(cy - 320).toFixed(1)}px) scale(${(size / 640).toFixed(4)})`; cvs.style.opacity = inView ? fade.toFixed(3) : 0; cvs.style.visibility = inView && fade > .01 ? 'visible' : 'hidden';
    if (inView && !thumbsBusy) {
      if (!dragging) { rotV *= Math.pow(.04, dt); rotY += rotV; if (spinning && !S.decorate && !reduce && Math.abs(rotV) < .002) rotY += dt * .3; }
      root.rotation.y = rotY; if (!packState) root.position.y = Math.sin(T2 * 1.2) * .03;
      cam.position.y += ((camTarget.y + 1.7) - cam.position.y) * Math.min(1, dt * 4); cam.position.z += (camTarget.d - cam.position.z) * Math.min(1, dt * 4); cam.lookAt(0, camTarget.y, 0);
      flames.forEach((f) => { f.scale.set(1 + Math.sin(T2 * 9 + f.userData.p) * .1, 1 + Math.sin(T2 * 11 + f.userData.p * 2) * .12, 1); });
      if (topper) topper.rotation.y = -root.rotation.y;
      renderer.render(scene, cam);
    }
  }
  arcFrame(dt); requestAnimationFrame(frame);
}

/* ---------- the arc of occasions, each card a render of the real cake ---------- */
const rail = $('arcrail'), arc = $('arc'); let arcPos = 0, arcT = 0, arcDrag = false, arcX = 0, arcSeen = false, arcIdle = 0, thumbsBusy = false;
const wrapD = (i, p) => { const n = OCC.length; return ((i - p + n / 2) % n + n) % n - n / 2; };
const cards = OCC.map((o, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ac'; b.setAttribute('role', 'option'); b.innerHTML = `<img alt="" width="320" height="320"><div><b>${o.k}</b><small>from ${inr(price(preset(o)))}</small></div>`; rail.appendChild(b);
  b.addEventListener('click', () => { if (Math.abs(wrapD(i, arcPos)) < .35) choose(i); else arcT = Math.round(arcPos) + Math.round(wrapD(i, arcPos)); }); return b; });
function choose(i) { apply(preset(OCC[((i % OCC.length) + OCC.length) % OCC.length])); $('build').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
function arcFrame(dt) {
  arcPos += (arcT - arcPos) * Math.min(1, dt * 6); const W = arc.clientWidth, Rr = Math.max(240, W * .5);
  if (arcSeen && !arcDrag && !reduce) { arcIdle += dt; if (arcIdle > 3) { arcIdle = 0; arcT += 1; } }
  cards.forEach((c, i) => { const d = wrapD(i, arcPos), th = d * .52, cs = Math.cos(th); const x = Math.sin(th) * Rr * .95, y = (1 - cs) * Rr * .55, sc = lerp(.6, 1.04, Math.pow(Math.max(0, cs), 3));
    c.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(th * 57.3 * .9).toFixed(1)}deg) scale(${sc.toFixed(3)})`; c.style.zIndex = Math.round(cs * 100); c.style.opacity = clamp(1.15 - Math.abs(d) * .26, .12, 1).toFixed(2); c.classList.toggle('on', Math.abs(d) < .5); });
}
new IntersectionObserver((es) => { arcSeen = es[0].isIntersecting; }, { threshold: .3 }).observe(arc);
arc.addEventListener('pointerdown', (e) => { if (e.target.closest('.arcpill,.arcnav')) return; arcDrag = true; arcX = e.clientX; arc.classList.add('drag'); arcIdle = 0; });
addEventListener('pointermove', (e) => { if (!arcDrag) return; const dx = e.clientX - arcX; arcX = e.clientX; arcT -= dx / 170; arcPos -= dx / 170; });
addEventListener('pointerup', () => { if (!arcDrag) return; arcDrag = false; arc.classList.remove('drag'); arcT = Math.round(arcT); });
$('arcp').addEventListener('click', () => { arcT = Math.round(arcT) - 1; arcIdle = 0; }); $('arcn').addEventListener('click', () => { arcT = Math.round(arcT) + 1; arcIdle = 0; });
$('arcpill').addEventListener('click', () => choose(Math.round(arcT)));
/* photograph each preset with the same camera and light, then put the cakes back */
async function renders() {
  if (!renderer) return; thumbsBusy = true; const keep = { ...S, tops: new Set(S.tops), deco: [...S.deco] }, ry = root.rotation.y, cp = cam.position.clone();
  renderer.setPixelRatio(1); renderer.setSize(360, 360, false);
  for (let i = 0; i < OCC.length; i++) { Object.assign(S, preset(OCC[i])); build(); root.rotation.set(0, .55, 0); root.position.set(0, 0, 0); if (topper) topper.rotation.y = -.55; cam.position.set(0, camTarget.y + 1.55, camTarget.d * .84); cam.lookAt(0, camTarget.y, 0); renderer.render(scene, cam); cards[i].querySelector('img').src = cvs.toDataURL('image/png'); await new Promise((r) => setTimeout(r, 30)); }
  Object.assign(S, keep); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(640, 640, false); root.rotation.y = ry; cam.position.copy(cp); build(); thumbsBusy = false; ui();
}

/* ---------- quantity, message, tools ---------- */
$('qm').addEventListener('click', () => { S.qty = Math.max(1, S.qty - 1); ui(); }); $('qp').addEventListener('click', () => { S.qty = Math.min(9, S.qty + 1); ui(); });
$('msg').addEventListener('input', (e) => { S.msg = e.target.value; clearTimeout(S._m); S._m = setTimeout(refresh, 180); });
$('bDeco').addEventListener('click', () => { S.decorate = !S.decorate; ui(); }); $('bClear').addEventListener('click', () => { S.deco = []; refresh(); });
$('bRand').addEventListener('click', () => { const pick = (o) => Object.keys(o)[Math.floor(Math.random() * Object.keys(o).length)]; S.flavour = pick(FL); S.frost = pick(FR); S.drip = pick(DR); S.style = pick(STYLE); S.tiers = 1 + Math.floor(Math.random() * 3); S.tops = new Set(Object.keys(TOPS).filter(() => Math.random() > .55)); if (!S.tops.size) S.tops.add('berries'); S.candles = Math.random() > .5; S.deco = []; refresh(); });
const float = $('float'); ['#ffffff', '#f2f5fb', '#dfe6f2', '#fff0c1', '#c8d1e1'].forEach((c) => { for (let i = 0; i < 4; i++) { const p = document.createElement('i'); p.style.cssText = `left:${(8 + Math.random() * 84).toFixed(0)}%;top:${(10 + Math.random() * 70).toFixed(0)}%;--c:${c};--t:${(5 + Math.random() * 5).toFixed(1)}s;--d:${(-Math.random() * 6).toFixed(1)}s;scale:${(.7 + Math.random() * .9).toFixed(2)}`; float.appendChild(p); } });

/* ---------- delivery check (demo estimate) ---------- */
const shipMsg = $('shipMsg');
$('pinGo').addEventListener('click', checkPin); $('pin').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); checkPin(); } });
function checkPin() {
  const v = $('pin').value.trim(); S.pinOk = false; shipMsg.className = 'shipMsg';
  if (!/^\d{6}$/.test(v)) { shipMsg.textContent = 'Enter a 6-digit pincode.'; shipMsg.classList.add('no'); return; }
  const km = 1 + ((+v * 7919) % 1400) / 100; S.km = km;
  if (km > 9.5) { shipMsg.textContent = `That is about ${km.toFixed(1)} km from the kitchen, outside our nearby delivery area. Choose pickup or try another pincode. (Demo estimate)`; shipMsg.classList.add('no'); return; }
  const eta = Math.round(25 + km * 4), fee = Math.round(30 + km * 8); S.pinOk = true; S.eta = eta;
  shipMsg.textContent = `Nearby: about ${km.toFixed(1)} km, arrives in ~${eta} min, delivery ${inr(fee)}. (Demo estimate)`; shipMsg.classList.add('ok');
}

/* ---------- packing it up and sending it home ---------- */
const stage = document.querySelector('.stage'), statusEl = $('status');
const tween = (ms, fn, ez = ease) => new Promise((res) => { const s0 = performance.now(); const step = (n) => { const k = clamp((n - s0) / ms); fn(ez(k), k); if (k < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
const bounce = (t) => { const n1 = 7.5625, d1 = 2.75; if (t < 1 / d1) return n1 * t * t; if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + .75; if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + .9375; return n1 * (t -= 2.625 / d1) * t + .984375; };
const say = (t) => { statusEl.textContent = t; statusEl.classList.toggle('on', !!t); };
async function pack() {
  if (packState === 'done') { reset(); return; } if (packState) return;
  if (S.ship === 'home' && !S.pinOk) { shipMsg.className = 'shipMsg no'; shipMsg.textContent = 'Check your pincode first so we know you are nearby.'; $('pin').focus(); return; }
  packState = 'busy'; $('bPack').disabled = true; spinning = false; S.decorate = false; ui(); stage.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  if (!renderer) { say('Packed (preview needs 3D)'); packState = 'done'; $('bPack').disabled = false; ui(); return; }
  say('Packing your cake…'); standParts.forEach((p) => { p.visible = false; }); const bw = 3.2, bh = cakeH - STAND + .35, wall = M('#aab6cc', { roughness: .6 }), lidM = M('#c8d1e1', { roughness: .5 }), rib = M('#fff0c1', { roughness: .4 });
  const walls = new THREE.Group(); const w = (sx, sy, sz, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wall); m.position.set(x, sy / 2, z); m.castShadow = true; walls.add(m); };
  w(bw, bh, .07, 0, bw / 2); w(bw, bh, .07, 0, -bw / 2); w(.07, bh, bw, bw / 2, 0); w(.07, bh, bw, -bw / 2, 0); walls.scale.y = .001; boxG.add(walls);
  const lid = new THREE.Group(); const lm = new THREE.Mesh(new THREE.BoxGeometry(bw + .16, .34, bw + .16), lidM); lm.position.y = .17; lm.castShadow = true; lid.add(lm);
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(.26, .38, bw + .2), rib), b2 = new THREE.Mesh(new THREE.BoxGeometry(bw + .2, .38, .26), rib); b1.position.y = b2.position.y = .18; lid.add(b1, b2);
  const bow = new THREE.Group(); [-1, 1].forEach((s) => { const t = new THREE.Mesh(new THREE.TorusGeometry(.26, .08, 12, 28), rib); t.position.set(s * .27, .5, 0); t.rotation.set(Math.PI / 2.4, s * .5, s * .6); bow.add(t); }); const kn = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), rib); kn.position.y = .46; bow.add(kn); bow.scale.setScalar(.001); lid.add(bow);
  lid.position.y = bh + 4; boxG.add(lid); b1.scale.x = b2.scale.z = .001;
  await tween(550, (t) => { cakeG.scale.setScalar(lerp(1, .84, t)); cakeG.position.y = -STAND * lerp(1, .84, t) * t; walls.scale.y = Math.max(.001, t); });
  await tween(750, (t) => { lid.position.y = lerp(bh + 4, bh + .02, bounce(t)); }, (k) => k);
  say('Tying the ribbon…'); await tween(450, (t) => { b1.scale.x = b2.scale.z = Math.max(.001, t); });
  await tween(450, (t) => { bow.scale.setScalar(Math.max(.001, 1 + Math.sin(t * Math.PI) * .25) * t); }, (k) => k);
  say('Packed with love'); await tween(900, (t) => { rotY += .12 * (1 - t); root.position.y = Math.sin(t * Math.PI) * .5; }); root.position.y = 0;
  if (S.ship === 'pickup') { say('Packed · ready for pickup at the kitchen'); packState = 'done'; $('bPack').disabled = false; ui(); return; }
  stage.classList.add('ship'); say(`Out for delivery · ~${S.eta} min`); const path = $('routep'), len = path.getTotalLength(), sc = $('scoot'); const pos = (k) => { const p = path.getPointAtLength(len * k); sc.setAttribute('transform', `translate(${p.x},${p.y})`); }; pos(0);
  const fly = tween(1400, (t) => { root.position.x = t * 3.4; root.position.y = t * .9; root.scale.setScalar(1 - t * .72); root.rotation.z = -t * .25; });
  await Promise.all([fly, tween(3400, (t) => pos(t), (k) => k * (2 - k) * .6 + k * .4)]);
  root.visible = false; say('Delivered · enjoy! (demo)'); packState = 'done'; $('bPack').disabled = false; ui();
}
function reset() { while (boxG.children.length) { const o = boxG.children.pop(); o.traverse((n) => { if (n.geometry) n.geometry.dispose(); }); } root.visible = true; root.position.set(0, 0, 0); root.scale.setScalar(1); root.rotation.z = 0; cakeG.scale.setScalar(1); cakeG.position.y = 0; standParts.forEach((p) => { p.visible = true; }); stage.classList.remove('ship'); say(''); packState = ''; spinning = true; ui(); }
$('bPack').addEventListener('click', pack);

/* ---------- order form (demo) ---------- */
$('form').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target, th = $('thanks'); th.classList.add('on');
  th.textContent = !f.n.value.trim() || !/^[\d\s+()-]{7,}$/.test(f.p.value.trim()) ? 'Please add your name and a phone number so the baker can call you.' : `Thank you, ${f.n.value.trim()}. A baker will call to confirm your ${S.occ.toLowerCase()} cake. (Draft: nothing is sent yet.)`; });

/* ---------- reveals ---------- */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const sib = [...e.target.parentElement.children].filter((x) => x.classList.contains('rv') && !x.classList.contains('in')); e.target.style.setProperty('--rd', (Math.min(4, Math.max(0, sib.indexOf(e.target))) * .09).toFixed(2) + 's'); e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08, rootMargin: '0px 0px -4% 0px' });
document.querySelectorAll('.rv').forEach((r) => io.observe(r));

$('msg').value = S.msg; ui(); build(); requestAnimationFrame(frame);


/* ---------- colour directions A, B, C ---------- */
{ const root = document.documentElement, meta = document.querySelector('meta[name="theme-color"]'), bg = { a: '#aab6cc', b: '#19253b', c: '#fff0c1' }, btns = [...document.querySelectorAll('.sw button')];
  const set = (t, save) => { root.dataset.theme = t; if (meta) meta.setAttribute('content', bg[t]); btns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.t === t)); if (save) { try { localStorage.setItem('bbtheme', t); } catch (e) {} } };
  btns.forEach((b) => b.addEventListener('click', () => set(b.dataset.t, true))); set(root.dataset.theme || 'a'); }


/* ---------- the menu: every dessert drawn in 3D from menu.js, plus an order bag ---------- */
let lock = Promise.resolve(); const exclusive = (fn) => (lock = lock.then(fn).catch((e) => { console.error('render step failed', e); thumbsBusy = false; root.visible = true; }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
let menuCat = 'All'; const toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast); let toastT = 0;
const say2 = (t) => { toast.textContent = t; toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), 1800); };
const ALL = MENU.flatMap((c) => c.items.map((i) => ({ ...i, cat: c.cat })));
function badge() { const n = [...bag.values()].reduce((a, b) => a + b, 0) + (S.cakeOn ? S.qty : 0); document.querySelectorAll('.bagn').forEach((e) => { e.textContent = n; e.parentElement.classList.toggle('has', n > 0); }); const d = document.querySelector('.mo-dock a[data-h="order"]'); if (d) d.dataset.n = n || ''; }
function orderSummary() {
  const rows = [...bag.entries()].map(([id, q]) => { const it = ALL.find((x) => x.id === id); return `<div class="ol"><span>${it.name} <small>${inr(it.price)} / ${it.unit}</small></span><span class="oq"><button type="button" data-o="-${id}" aria-label="One less">−</button><b>${q}</b><button type="button" data-o="+${id}" aria-label="One more">+</button></span><span class="op">${inr(it.price * q)}</span></div>`; });
  const items = [...bag.entries()].reduce((a, [id, q]) => a + ALL.find((x) => x.id === id).price * q, 0);
  const cake = S.cakeOn ? `<div class="ol cake"><span>${summary()}</span><span></span><span class="op">${inr(price())}</span></div>` : '';
  if (!rows.length && !cake) return '<span style="opacity:.7">Nothing here yet. Design a cake above or add items from the menu.</span>';
  return cake + rows.join('') + `<div class="ol tot"><span>Total <small>(sample pricing)</small></span><span></span><span class="op">${inr(items + (S.cakeOn ? price() : 0))}</span></div>`;
}
function changeBag(id, d) { const q = (bag.get(id) || 0) + d; if (q <= 0) bag.delete(id); else bag.set(id, Math.min(20, q)); ui(); renderMenu(); }
$('sum2').addEventListener('click', (e) => { const b = e.target.closest('button[data-o]'); if (!b) return; const v = b.dataset.o; changeBag(v.slice(1), v[0] === '+' ? 1 : -1); });
function renderMenu() {
  const tabs = $('mtabs'); tabs.innerHTML = ['All', ...MENU.map((c) => c.cat)].map((c) => `<button type="button" class="chip${c === menuCat ? ' on' : ''}" data-c="${c}" aria-pressed="${c === menuCat}">${c}</button>`).join('');
  const grid = $('mgrid'); const keep = {}; grid.querySelectorAll('img[data-id]').forEach((i) => { if (i.src.startsWith('data:')) keep[i.dataset.id] = i.src; });
  const list = menuCat === 'All' ? ALL : ALL.filter((x) => x.cat === menuCat);
  grid.innerHTML = list.map((it) => { const q = bag.get(it.id) || 0; const ph = it.photo ? `../assets/bunbun/menu/${it.photo}` : ''; return `<article class="mc rv in" data-id="${it.id}"><div class="mi${ph ? ' photo ok' : ''}"><img data-id="${it.id}" alt="${it.name}" width="420" height="420" ${ph ? `src="${ph}" loading="lazy"` : (keep[it.id] ? `src="${keep[it.id]}"` : '')}></div><div class="mt"><h3>${it.name}</h3><p>${it.desc}</p></div><div class="mb"><span class="mp">${inr(it.price)}<small> / ${it.unit}</small></span>${q ? `<span class="oq"><button type="button" data-a="-${it.id}" aria-label="One less">−</button><b>${q}</b><button type="button" data-a="+${it.id}" aria-label="One more">+</button></span>` : `<button type="button" class="add" data-a="+${it.id}">Add</button>`}</div></article>`; }).join('');
  fillMenuImages();
}
$('mtabs').addEventListener('click', (e) => { const b = e.target.closest('button[data-c]'); if (!b) return; menuCat = b.dataset.c; renderMenu(); });
$('mgrid').addEventListener('click', (e) => { const b = e.target.closest('button[data-a]'); if (!b) return; const v = b.dataset.a, id = v.slice(1); changeBag(id, v[0] === '+' ? 1 : -1); if (v[0] === '+') say2(ALL.find((x) => x.id === id).name + ' added to your order'); });
const menuImgs = {};   /* rendered once, kept for the session */
function fillMenuImages() { document.querySelectorAll('#mgrid img[data-id]').forEach((i) => { if (!i.parentElement.classList.contains('photo') && menuImgs[i.dataset.id]) { i.src = menuImgs[i.dataset.id]; i.parentElement.classList.add('ok'); } }); }
const dG = new THREE.Group(); let menuDone = false;
/* frame the food, not the plate: fit the camera to everything except the plate so each dessert fills its card */
function frameDessert(g) {
  const box = new THREE.Box3(); g.traverse((n) => { if (n.isMesh && !n.userData.plate) box.expandByObject(n); });
  const s = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3()), fit = Math.max(s.y * 1.08, s.x * .92, s.z * .92) * 1.28, dist = fit / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
  cam.position.set(0, c.y + dist * .42, dist * .91); cam.lookAt(0, c.y - s.y * .04, 0);
}
async function menuRenders() {
  if (!renderer || menuDone) return; menuDone = true; thumbsBusy = true; root.visible = false; scene.add(dG);
  const gr = new THREE.Mesh(new THREE.CircleGeometry(5, 48), new THREE.ShadowMaterial({ opacity: .22 })); gr.rotation.x = -Math.PI / 2; gr.position.y = -.005; gr.receiveShadow = true; dG.add(gr);
  const keep = cam.position.clone(), keepExp = renderer.toneMappingExposure; renderer.setPixelRatio(1); renderer.setSize(420, 420, false); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.22;
  for (const it of ALL) { if (it.photo) continue; const g = dessert(it.type, { ...it.opts, seed: hash(it.id) }); g.rotation.y = .5; dG.add(g); g.updateMatrixWorld(true); frameDessert(g); renderer.render(scene, cam); menuImgs[it.id] = cvs.toDataURL('image/png'); dG.remove(g); g.traverse((n) => { if (n.geometry) n.geometry.dispose(); }); fillMenuImages(); await sleep(16); }
  scene.remove(dG); renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = keepExp; renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(640, 640, false); cam.position.copy(keep); root.visible = true; thumbsBusy = false;
}
renderMenu();
new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { ob.disconnect(); exclusive(menuRenders); } }, { rootMargin: '600px 0px' }).observe($('menu'));
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { build(); exclusive(async () => { await sleep(300); await renders(); }); });
