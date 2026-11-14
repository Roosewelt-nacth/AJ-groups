import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $ = (i) => document.getElementById(i);
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t, ease = (t) => t * t * (3 - 2 * t);
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

/* ---------- the menu of choices ---------- */
const FL = { vanilla: ['Vanilla bean', '#f6e3b4'], chocolate: ['Chocolate', '#6a3b2a'], redvelvet: ['Red velvet', '#b8283f'], strawberry: ['Strawberry', '#f4a3b5'], lemon: ['Lemon', '#fbe88a'], caramel: ['Caramel', '#c98a4b'] };
const FR = { rose: ['Rose', '#f6b8cb'], cream: ['Cream', '#fff4ea'], lilac: ['Lilac', '#cdb7f2'], mint: ['Mint', '#b8ecd5'], cocoa: ['Cocoa', '#7a4a38'], butter: ['Butter', '#ffe39a'] };
const DR = { none: ['No drip', null], choc: ['Chocolate', '#4b2a1e'], berry: ['Berry', '#ff6f95'], caramel: ['Caramel', '#d99a4e'], white: ['White', '#fffaf5'] };
const TOPS = { cherries: 'Cherries', sprinkles: 'Sprinkles', berries: 'Berries', flowers: 'Flowers' };
const TIER = { 1: ['1 tier', 'serves 8', 1200], 2: ['2 tiers', 'serves 16', 2600], 3: ['3 tiers', 'serves 28', 4200] };
const OCC = [
  { k: 'Birthday', tiers: 2, flavour: 'vanilla', frost: 'rose', drip: 'berry', tops: ['cherries', 'sprinkles'], candles: true, msg: 'Happy Birthday', c: ['#ffd9e4', '#f6a5c0'] },
  { k: 'Wedding', tiers: 3, flavour: 'vanilla', frost: 'cream', drip: 'none', tops: ['flowers'], candles: false, msg: 'Forever begins', c: ['#fff4ea', '#f3c8d6'] },
  { k: 'Anniversary', tiers: 2, flavour: 'redvelvet', frost: 'cream', drip: 'none', tops: ['berries'], candles: true, msg: 'Happy Anniversary', c: ['#f9d3dc', '#d9708c'] },
  { k: 'Baby shower', tiers: 2, flavour: 'strawberry', frost: 'lilac', drip: 'white', tops: ['sprinkles'], candles: false, msg: 'Welcome little one', c: ['#e6dcf8', '#f6b8cb'] },
  { k: 'Graduation', tiers: 1, flavour: 'chocolate', frost: 'cocoa', drip: 'caramel', tops: ['berries'], candles: false, msg: 'Well done', c: ['#d8bfae', '#8a7467'] },
  { k: 'Festival', tiers: 2, flavour: 'caramel', frost: 'butter', drip: 'choc', tops: ['sprinkles', 'cherries'], candles: true, msg: 'Happy celebrations', c: ['#ffe9b0', '#f2b9cc'] },
  { k: 'Just because', tiers: 1, flavour: 'lemon', frost: 'mint', drip: 'none', tops: ['flowers', 'berries'], candles: false, msg: 'Because you are lovely', c: ['#d2f3e4', '#f6c9d8'] }
];
const S = { occ: 'Birthday', tiers: 2, flavour: 'vanilla', frost: 'rose', drip: 'berry', tops: new Set(['cherries', 'sprinkles']), candles: true, msg: 'Happy Birthday', deco: [], decorate: false, qty: 1, ship: 'home', pinOk: false, km: 0 };
const price = (s = S) => (TIER[s.tiers][2] + (s.drip !== 'none' ? 150 : 0) + [...s.tops].length * 100 + (s.candles ? 50 : 0) + (s.deco ? s.deco.length * 20 : 0)) * (s.qty || 1);
const preset = (o) => ({ ...S, occ: o.k, tiers: o.tiers, flavour: o.flavour, frost: o.frost, drip: o.drip, tops: new Set(o.tops), candles: o.candles, msg: o.msg, deco: [], decorate: false });

/* ---------- controls ---------- */
function chipRow(id, items, isOn, pick, swatch) {
  const el = $(id); el.innerHTML = '';
  items.forEach(([key, label, col]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (isOn(key) ? ' on' : ''); b.setAttribute('aria-pressed', isOn(key));
    b.innerHTML = (swatch && col ? `<i style="background:${col}"></i>` : '') + label; b.addEventListener('click', () => pick(key)); el.appendChild(b); });
}
function ui() {
  chipRow('c-occ', OCC.map((o) => [o.k, o.k]), (k) => S.occ === k, (k) => apply(preset(OCC.find((o) => o.k === k))));
  chipRow('c-tiers', [1, 2, 3].map((n) => [n, TIER[n][0] + ' · ' + TIER[n][1]]), (k) => S.tiers === +k, (k) => { S.tiers = +k; S.deco = []; refresh(); });
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
  const lines = summary(); $('sum').innerHTML = lines; $('sum2').innerHTML = lines;
  $('bDeco').classList.toggle('on', S.decorate); $('viewer').style.cursor = S.decorate ? 'crosshair' : '';
  $('hint').textContent = S.decorate ? 'Tap the top of the cake to place a cherry or star' : 'Drag to rotate';
}
function summary() {
  const t = [...S.tops].map((k) => TOPS[k].toLowerCase()); if (S.candles) t.push('candles'); if (S.deco.length) t.push(S.deco.length + ' hand-placed');
  return `<b>${S.occ} cake</b> · ${TIER[S.tiers][0]} (${TIER[S.tiers][1]})<br>${FL[S.flavour][0]} sponge, ${FR[S.frost][0].toLowerCase()} frosting${S.drip !== 'none' ? ', ' + DR[S.drip][0].toLowerCase() + ' drip' : ''}<br>${t.length ? 'With ' + t.join(', ') + '<br>' : ''}${S.msg ? 'Message: “' + S.msg.replace(/</g, '&lt;') + '”<br>' : ''}Quantity ${S.qty} · <b>${inr(price())}</b> <span style="opacity:.6">(draft pricing)</span>`;
}
function refresh() { ui(); build(); }
function apply(next) { Object.assign(S, next); $('msg').value = S.msg; refresh(); }

/* ---------- the cake in 3D ---------- */
const cvs = $('cake'); let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: cvs, alpha: true, antialias: true }); } catch (e) { cvs.style.display = 'none'; }
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, .1, 60), root = new THREE.Group(), cakeG = new THREE.Group(), boxG = new THREE.Group();
let topDisc = null, topY = 0, topR = 1, topper = null; const flames = []; let camTarget = { y: 1.5, d: 10 };
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(640, 640, false); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  const key = new THREE.DirectionalLight(0xfff1ea, 1.4); key.position.set(3, 6, 4); scene.add(key); scene.add(new THREE.HemisphereLight(0xffffff, 0xf3b8cc, .5));
  root.add(cakeG, boxG); scene.add(root); cam.position.set(0, 3.2, 10); cam.lookAt(0, 1.5, 0);
}
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .55, metalness: 0, ...o });
const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(120,60,80,.38)'); g.addColorStop(1, 'rgba(120,60,80,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
function flag(text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 176; const x = c.getContext('2d');
  x.fillStyle = '#fff7f4'; x.beginPath(); x.roundRect(8, 8, 496, 160, 36); x.fill(); x.lineWidth = 6; x.strokeStyle = '#e98fb0'; x.stroke();
  let size = 64; x.fillStyle = '#8a7467'; x.textAlign = 'center'; x.textBaseline = 'middle';
  do { x.font = `700 ${size}px Comfortaa, Inter, sans-serif`; size -= 3; } while (x.measureText(text).width > 440 && size > 22);
  x.fillText(text, 256, 92); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function build() {
  if (!renderer) return;
  while (cakeG.children.length) { const o = cakeG.children.pop(); o.traverse((n) => { if (n.geometry) n.geometry.dispose(); if (n.material) { const ms = Array.isArray(n.material) ? n.material : [n.material]; ms.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); } }); }
  flames.length = 0; topper = null;
  const sponge = FL[S.flavour][1], fro = FR[S.frost][1], dripC = DR[S.drip][1];
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.5, .08, 64), M('#fff7f4', { roughness: .3 })); plate.position.y = .04; cakeG.add(plate);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = -.02; cakeG.add(sh);
  const R = S.tiers === 1 ? [1.1] : S.tiers === 2 ? [1.1, .75] : [1.15, .8, .52]; let y = .08;
  R.forEach((r, i) => {
    for (let k = 0; k < 3; k++) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .22, 56), M(sponge, { roughness: .85 })); m.position.y = y + .11; cakeG.add(m); y += .22;
      if (k < 2) { const f = new THREE.Mesh(new THREE.CylinderGeometry(r + .028, r + .028, .07, 56), M(fro, { roughness: .4 })); f.position.y = y + .035; cakeG.add(f); y += .07; }
    }
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r + .02, r + .02, .06, 56), M(fro, { roughness: .35 })); t.position.y = y + .03; cakeG.add(t); y += .06;
    const n = Math.round(r * 20); for (let d = 0; d < n; d++) { const a = (d / n) * Math.PI * 2, s = new THREE.Mesh(new THREE.SphereGeometry(.082, 18, 14), M(fro, { roughness: .3 })); s.position.set(Math.cos(a) * (r - .01), y + .01, Math.sin(a) * (r - .01)); s.scale.y = .82; cakeG.add(s); }
    if (dripC) {
      const pool = new THREE.Mesh(new THREE.CylinderGeometry(r - .1, r - .1, .02, 56), M(dripC, { roughness: .18 })); pool.position.y = y + .06; cakeG.add(pool);
      const nd = Math.round(r * 13); for (let d = 0; d < nd; d++) { const a = (d / nd) * Math.PI * 2 + (d % 2) * .09, L = .1 + ((d * 37) % 11) / 11 * .3 + (i === 0 ? .06 : 0);
        const cy = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, L, 12), M(dripC, { roughness: .18 })); cy.position.set(Math.cos(a) * (r + .045), y + .02 - L / 2, Math.sin(a) * (r + .045)); cakeG.add(cy);
        const bl = new THREE.Mesh(new THREE.SphereGeometry(.058, 14, 12), M(dripC, { roughness: .18 })); bl.position.set(cy.position.x, y + .02 - L, cy.position.z); cakeG.add(bl); }
    }
    if (i === R.length - 1) { topDisc = t; topY = y + .08; topR = r; }
    y += .02;
  });
  const top = topY; const rr = topR;
  if (S.tops.has('cherries')) for (let d = 0; d < 5; d++) { const a = d / 5 * Math.PI * 2 + .4, x = Math.cos(a) * (rr * .62), z = Math.sin(a) * (rr * .62); const c = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 16), M('#c2183b', { roughness: .15 })); c.position.set(x, top + .13, z); cakeG.add(c);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .26, 6), M('#5b7a3a')); st.position.set(x + .04, top + .3, z); st.rotation.z = -.35; cakeG.add(st); }
  if (S.tops.has('sprinkles')) { const cols = ['#ff7fa8', '#ffd166', '#7fd6c2', '#a98bf0', '#ffffff']; for (let d = 0; d < 70; d++) { const a = Math.random() * 6.283, rad = Math.sqrt(Math.random()) * (rr - .12); const s = new THREE.Mesh(new THREE.CapsuleGeometry(.014, .07, 3, 6), M(cols[d % 5], { roughness: .4 })); s.position.set(Math.cos(a) * rad, top + .02, Math.sin(a) * rad); s.rotation.set(Math.PI / 2, 0, Math.random() * 6.283); cakeG.add(s); } }
  if (S.tops.has('berries')) { const cols = ['#4b4a9a', '#d6336c', '#7a2a6a']; for (let d = 0; d < 9; d++) { const a = d * 2.4, rad = (d % 3) * .09 + .15; const b = new THREE.Mesh(new THREE.SphereGeometry(.09 + (d % 2) * .02, 16, 12), M(cols[d % 3], { roughness: .3 })); b.position.set(Math.cos(a) * rad - rr * .25, top + .08 + (d > 5 ? .1 : 0), Math.sin(a) * rad + rr * .1); cakeG.add(b); }
    for (let d = 0; d < 3; d++) { const l = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), M('#6fae6a')); l.scale.set(1.6, .12, .8); l.position.set(-rr * .25 + d * .16 - .1, top + .05, rr * .1 + .22); l.rotation.y = d; cakeG.add(l); } }
  if (S.tops.has('flowers')) [[.55, .1], [-.4, -.5], [.05, .6]].forEach(([fx, fz], f) => { const g = new THREE.Group(); const pet = f % 2 ? '#ffffff' : '#f6a5c0'; for (let p = 0; p < 6; p++) { const a = p / 6 * Math.PI * 2, pe = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 10), M(pet, { roughness: .5 })); pe.scale.set(1, .35, 1.2); pe.position.set(Math.cos(a) * .12, 0, Math.sin(a) * .12); pe.rotation.y = -a; g.add(pe); } const ce = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 10), M('#ffd166')); ce.position.y = .03; g.add(ce); g.position.set(fx * rr, top + .05, fz * rr); cakeG.add(g); });
  if (S.candles) for (let d = 0; d < 5; d++) { const a = d / 5 * Math.PI * 2 + .2, x = Math.cos(a) * (rr * .38), z = Math.sin(a) * (rr * .38); const c = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .5, 10), M(d % 2 ? '#fff7f4' : '#f6a5c0')); c.position.set(x, top + .25, z); cakeG.add(c);
    const f = new THREE.Mesh(new THREE.SphereGeometry(.055, 12, 10), new THREE.MeshBasicMaterial({ color: '#ffd37a' })); f.scale.y = 1.7; f.position.set(x, top + .58, z); f.userData.p = d; cakeG.add(f); flames.push(f); }
  S.deco.forEach((p) => { const m = p.t === 'cherry' ? new THREE.Mesh(new THREE.SphereGeometry(.11, 18, 14), M('#c2183b', { roughness: .15 })) : new THREE.Mesh(new THREE.OctahedronGeometry(.1), M('#ffd166', { roughness: .25, metalness: .4 })); m.position.set(p.x, top + (p.t === 'cherry' ? .11 : .1), p.z); cakeG.add(m); });
  if (S.msg.trim()) { const g = new THREE.Group(); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .52), new THREE.MeshBasicMaterial({ map: flag(S.msg.trim()), transparent: true, side: THREE.DoubleSide })); f.position.y = .78; g.add(f);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .78, 6), M('#e98fb0')); st.position.y = .39; g.add(st); g.position.set(0, top, 0); cakeG.add(g); topper = g; }
  const H = y; camTarget = { y: H * .5 + .35, d: 8.6 + S.tiers * 1.05 };
}

/* ---------- drag to spin, tap to decorate ---------- */
let rotY = .5, rotV = 0, dragging = false, lastX = 0, downX = 0, downY = 0, moved = 0, spinning = true;
function attach(el) {
  el.addEventListener('pointerdown', (e) => { dragging = true; lastX = downX = e.clientX; downY = e.clientY; moved = 0; rotV = 0; el.classList.add('drag'); try { el.setPointerCapture(e.pointerId); } catch (x) {} });
  el.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); rotV = dx * .012; rotY += dx * .012; });
  const up = (e) => { if (!dragging) return; dragging = false; el.classList.remove('drag'); if (el.id === 'viewer' && S.decorate && moved < 6 && Math.hypot(e.clientX - downX, e.clientY - downY) < 8) place(e); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', () => { dragging = false; el.classList.remove('drag'); });
}
const ray = new THREE.Raycaster();
function place(e) {
  if (!renderer || !topDisc) return; const r = cvs.getBoundingClientRect(); const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
  ray.setFromCamera({ x: nx, y: ny }, cam); const hit = ray.intersectObject(topDisc)[0]; if (!hit) return; const p = cakeG.worldToLocal(hit.point.clone());
  if (S.deco.length >= 12) S.deco.shift(); S.deco.push({ x: p.x, z: p.z, t: S.deco.length % 2 ? 'star' : 'cherry' }); refresh();
}
attach($('viewer')); attach($('heroSlot'));

/* ---------- flying from the hero to the studio ---------- */
let t0 = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - t0) / 1000) || .016; t0 = now; const T = now / 1000;
  if (renderer) {
    const hr = $('heroSlot').getBoundingClientRect(), vr = $('viewer').getBoundingClientRect();
    const e = ease(clamp((innerHeight * .92 - vr.top) / (innerHeight * .55))), size = lerp(hr.width, Math.min(vr.width, vr.height) * 1.08, e);
    const cx = lerp(hr.left + hr.width / 2, vr.left + vr.width / 2, e), cy = lerp(hr.top + hr.height / 2, vr.top + vr.height / 2 + vr.height * .03, e);
    const inView = (hr.bottom > -40 && hr.top < innerHeight) || (vr.bottom > -40 && vr.top < innerHeight);
    const fade = e < 1 ? 1 : clamp(vr.bottom / (innerHeight * .3)) * clamp((innerHeight - vr.top) / (innerHeight * .15));
    cvs.style.transform = `translate(${(cx - 320).toFixed(1)}px,${(cy - 320).toFixed(1)}px) scale(${(size / 640).toFixed(4)})`; cvs.style.opacity = inView ? fade.toFixed(3) : 0; cvs.style.visibility = inView && fade > .01 ? 'visible' : 'hidden';
    if (inView) {
      if (!dragging) { rotV *= Math.pow(.04, dt); rotY += rotV; if (spinning && !S.decorate && !reduce && Math.abs(rotV) < .002) rotY += dt * .35; }
      root.rotation.y = rotY; root.position.y = packState ? root.position.y : Math.sin(T * 1.3) * .04;
      cam.position.y += ((camTarget.y + 1.6) - cam.position.y) * Math.min(1, dt * 4); cam.position.z += (camTarget.d - cam.position.z) * Math.min(1, dt * 4); cam.lookAt(0, camTarget.y, 0);
      flames.forEach((f) => { f.scale.set(1 + Math.sin(T * 9 + f.userData.p) * .12, 1.7 + Math.sin(T * 11 + f.userData.p * 2) * .25, 1); });
      if (topper) topper.rotation.y = -root.rotation.y;
      renderer.render(scene, cam);
    }
  }
  arcFrame(dt); requestAnimationFrame(frame);
}

/* ---------- the arc of occasions ---------- */
const cakeSVG = ([a, b]) => `<svg viewBox="0 0 100 120" aria-hidden="true"><ellipse cx="50" cy="104" rx="38" ry="6" fill="rgba(120,60,80,.18)"/><rect x="14" y="62" width="72" height="38" rx="12" fill="${b}"/><rect x="26" y="34" width="48" height="32" rx="10" fill="${a}"/><path d="M26 44q4 10 8 0t8 0t8 0t8 0t8 0t8 0" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="26" r="6" fill="#c2183b"/><path d="M50 20q4-8 8-8" stroke="#5b7a3a" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M20 80h60" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/></svg>`;
const rail = $('arcrail'), arc = $('arc'); let arcPos = 0, arcT = 0, arcDrag = false, arcX = 0, arcSeen = false, arcIdle = 0;
const cards = OCC.map((o, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ac'; b.setAttribute('role', 'option'); b.innerHTML = cakeSVG(o.c) + `<div><b>${o.k}</b><small>from ${inr(price(preset(o)))}</small></div>`; rail.appendChild(b);
  b.addEventListener('click', () => { if (Math.abs(wrapD(i, arcPos)) < .35) choose(i); else arcT = Math.round(arcPos) + Math.round(wrapD(i, arcPos)); }); return b; });
const wrapD = (i, p) => { const n = OCC.length; return ((i - p + n / 2) % n + n) % n - n / 2; };
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

/* ---------- quantity, message, tools ---------- */
$('qm').addEventListener('click', () => { S.qty = Math.max(1, S.qty - 1); ui(); }); $('qp').addEventListener('click', () => { S.qty = Math.min(9, S.qty + 1); ui(); });
$('msg').addEventListener('input', (e) => { S.msg = e.target.value; clearTimeout(S._m); S._m = setTimeout(refresh, 180); });
$('bDeco').addEventListener('click', () => { S.decorate = !S.decorate; ui(); }); $('bClear').addEventListener('click', () => { S.deco = []; refresh(); });
$('bRand').addEventListener('click', () => { const pick = (o) => Object.keys(o)[Math.floor(Math.random() * Object.keys(o).length)]; S.flavour = pick(FL); S.frost = pick(FR); S.drip = pick(DR); S.tiers = 1 + Math.floor(Math.random() * 3); S.tops = new Set(Object.keys(TOPS).filter(() => Math.random() > .5)); S.candles = Math.random() > .5; S.deco = []; refresh(); });
const float = $('float'); ['#ffffff', '#fff3f6', '#f6b8cb', '#ffd9e4', '#e98fb0'].forEach((c, k) => { for (let i = 0; i < 4; i++) { const p = document.createElement('i'); p.style.cssText = `left:${(8 + Math.random() * 84).toFixed(0)}%;top:${(10 + Math.random() * 70).toFixed(0)}%;--c:${c};--t:${(5 + Math.random() * 5).toFixed(1)}s;--d:${(-Math.random() * 6).toFixed(1)}s;scale:${(.7 + Math.random() * .9).toFixed(2)}`; float.appendChild(p); } });

/* ---------- delivery check (demo estimate) ---------- */
const shipMsg = $('shipMsg');
$('pinGo').addEventListener('click', checkPin); $('pin').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); checkPin(); } });
function checkPin() {
  const v = $('pin').value.trim(); S.pinOk = false; shipMsg.className = 'shipMsg';
  if (!/^\d{6}$/.test(v)) { shipMsg.textContent = 'Enter a 6-digit pincode.'; shipMsg.classList.add('no'); return; }
  const km = 1 + ((+v * 7919) % 1400) / 100; S.km = km;
  if (km > 9.5) { shipMsg.textContent = `That is about ${km.toFixed(1)} km from the kitchen, outside our nearby delivery area. Choose pickup or try another pincode. (Demo estimate)`; shipMsg.classList.add('no'); return; }
  const eta = Math.round(25 + km * 4), fee = km <= 4 ? 0 : Math.round(30 + km * 8); S.pinOk = true; S.eta = eta;
  shipMsg.textContent = `Nearby: about ${km.toFixed(1)} km, arrives in ~${eta} min, delivery ${fee ? inr(fee) : 'free'}. (Demo estimate)`; shipMsg.classList.add('ok');
}

/* ---------- packing it up and sending it home ---------- */
let packState = '';
const stage = document.querySelector('.stage'), statusEl = $('status'), tween = (ms, fn, ez = ease) => new Promise((res) => { const s0 = performance.now(); const step = (n) => { const k = clamp((n - s0) / ms); fn(ez(k), k); if (k < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
const bounce = (t) => { const n1 = 7.5625, d1 = 2.75; if (t < 1 / d1) return n1 * t * t; if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + .75; if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + .9375; return n1 * (t -= 2.625 / d1) * t + .984375; };
const say = (t) => { statusEl.textContent = t; statusEl.classList.toggle('on', !!t); };
async function pack() {
  if (packState === 'done') { reset(); return; } if (packState) return;
  if (S.ship === 'home' && !S.pinOk) { shipMsg.className = 'shipMsg no'; shipMsg.textContent = 'Check your pincode first so we know you are nearby.'; $('pin').focus(); return; }
  packState = 'busy'; $('bPack').disabled = true; spinning = false; S.decorate = false; ui(); stage.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  if (!renderer) { say('Packed (preview needs 3D)'); packState = 'done'; $('bPack').disabled = false; ui(); return; }
  say('Packing your cake…'); const H = camTarget.y * 2 - .3, bw = 3.05, bh = H + .5, pink = M('#f3b4c9', { roughness: .55 }), pale = M('#fbd3e0', { roughness: .5 }), rib = M('#fff7f4', { roughness: .35 });
  const walls = new THREE.Group(); const w = (sx, sy, sz, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), pink); m.position.set(x, sy / 2, z); walls.add(m); };
  w(bw, bh, .07, 0, bw / 2); w(bw, bh, .07, 0, -bw / 2); w(.07, bh, bw, bw / 2, 0); w(.07, bh, bw, -bw / 2, 0); walls.scale.y = .001; boxG.add(walls);
  const lid = new THREE.Group(); const lm = new THREE.Mesh(new THREE.BoxGeometry(bw + .16, .34, bw + .16), pale); lm.position.y = .17; lid.add(lm);
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(.26, .38, bw + .2), rib); b1.position.y = .18; const b2 = new THREE.Mesh(new THREE.BoxGeometry(bw + .2, .38, .26), rib); b2.position.y = .18; lid.add(b1, b2);
  const bow = new THREE.Group(); [-1, 1].forEach((s) => { const t = new THREE.Mesh(new THREE.TorusGeometry(.26, .08, 12, 28), rib); t.position.set(s * .27, .5, 0); t.rotation.set(Math.PI / 2.4, s * .5, s * .6); bow.add(t); }); const kn = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), rib); kn.position.y = .46; bow.add(kn); bow.scale.setScalar(.001); lid.add(bow);
  lid.position.y = bh + 4; boxG.add(lid); b1.scale.x = b2.scale.z = .001;
  await tween(550, (t) => { cakeG.scale.setScalar(lerp(1, .82, t)); rotY += (0 - (rotY % (Math.PI * 2)) + (rotY % (Math.PI * 2) > Math.PI ? Math.PI * 2 : 0)) * .0; walls.scale.y = Math.max(.001, t); });
  await tween(750, (t) => { lid.position.y = lerp(bh + 4, bh + .02, bounce(t)); }, (k) => k);
  say('Tying the ribbon…'); await tween(450, (t) => { b1.scale.x = b2.scale.z = Math.max(.001, t); });
  await tween(450, (t) => { bow.scale.setScalar(Math.max(.001, 1 + Math.sin(t * Math.PI) * .25) * t); }, (k) => k);
  say('Packed with love'); await tween(900, (t) => { rotY += .12 * (1 - t); root.position.y = Math.sin(t * Math.PI) * .5; });
  root.position.y = 0;
  if (S.ship === 'pickup') { say('Packed · ready for pickup at the kitchen'); packState = 'done'; $('bPack').disabled = false; ui(); return; }
  stage.classList.add('ship'); say(`Out for delivery · ~${S.eta} min`); const path = $('routep'), len = path.getTotalLength(), sc = $('scoot'); const pos = (k) => { const p = path.getPointAtLength(len * k); sc.setAttribute('transform', `translate(${p.x},${p.y})`); }; pos(0);
  const fly = tween(1400, (t) => { root.position.x = t * 3.4; root.position.y = t * .9; root.scale.setScalar(1 - t * .72); root.rotation.z = -t * .25; });
  await Promise.all([fly, tween(3400, (t) => pos(t), (k) => k * (2 - k) * .6 + k * .4)]);
  root.visible = false; say('Delivered · enjoy! (demo)'); packState = 'done'; $('bPack').disabled = false; ui();
}
function reset() { while (boxG.children.length) { const o = boxG.children.pop(); o.traverse((n) => { if (n.geometry) n.geometry.dispose(); }); } root.visible = true; root.position.set(0, 0, 0); root.scale.setScalar(1); root.rotation.z = 0; cakeG.scale.setScalar(1); stage.classList.remove('ship'); say(''); packState = ''; spinning = true; ui(); }
$('bPack').addEventListener('click', pack);

/* ---------- order form (demo) ---------- */
$('form').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target, th = $('thanks'); th.classList.add('on');
  th.textContent = !f.n.value.trim() || !/^[\d\s+()-]{7,}$/.test(f.p.value.trim()) ? 'Please add your name and a phone number so the baker can call you.' : `Thank you, ${f.n.value.trim()}. A baker will call to confirm your ${S.occ.toLowerCase()} cake. (Draft: nothing is sent yet.)`; });

/* ---------- reveals ---------- */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const sib = [...e.target.parentElement.children].filter((x) => x.classList.contains('rv') && !x.classList.contains('in')); e.target.style.setProperty('--rd', (Math.min(4, Math.max(0, sib.indexOf(e.target))) * .09).toFixed(2) + 's'); e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08, rootMargin: '0px 0px -4% 0px' });
document.querySelectorAll('.rv').forEach((r) => io.observe(r));

/* hero letters drift with the pointer */
{ const ls = [...document.querySelectorAll('.word span')], hero = $('hero'); let tx = 0; hero.addEventListener('pointermove', (e) => { tx = (e.clientX / innerWidth - .5); }, { passive: true });
  setInterval(() => { if (reduce || document.hidden) return; ls.forEach((l, i) => { l.style.transform = `translateX(${(tx * (i % 2 ? 22 : -22)).toFixed(1)}px)`; l.style.transition = 'transform .8s cubic-bezier(.2,.8,.2,1)'; }); }, 120); }

$('msg').value = S.msg; ui(); build(); requestAnimationFrame(frame);
