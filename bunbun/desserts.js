/* 3D desserts for the Bun Bun menu. Each builder returns a THREE.Group sitting on a plate at y = 0.
   They are made from shapes, textures and light, so colours and toppings come from the menu data (menu.js). */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, rr = (a, b) => a + (b - a) * rnd();
const P = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .6, ...o });
const tx = {};
function canvasTex(w, h, draw, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); t.anisotropy = 4; return t; }
function textures() {
  if (tx.fine) return tx;
  tx.fine = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#9c9c9c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { const g = 90 + rnd() * 140; x.fillStyle = `rgb(${g},${g},${g})`; x.fillRect(rnd() * w, rnd() * h, 1.6, 1.6); } }, [3, 3]);
  tx.crumb = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2400; i++) { const g = 70 + rnd() * 150; x.fillStyle = `rgb(${g},${g},${g})`; x.beginPath(); x.arc(rnd() * w, rnd() * h, .6 + rnd() * 2.8, 0, 6.283); x.fill(); } }, [2, 2]);
  tx.crack = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#3a2216'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(190,150,110,.75)'; x.lineWidth = 2.4; for (let i = 0; i < 26; i++) { x.beginPath(); let px = rnd() * w, py = rnd() * h; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (rnd() - .5) * 60; py += (rnd() - .5) * 60; x.lineTo(px, py); } x.stroke(); } for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(255,255,255,${rnd() * .22})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); } });
  tx.crack.colorSpace = THREE.SRGBColorSpace;
  tx.seed = canvasTex(256, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#e23a46'); g.addColorStop(.35, '#cf1630'); g.addColorStop(1, '#9d0b24'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(255,${120 + rnd() * 80},${100 + rnd() * 60},${rnd() * .1})`; x.beginPath(); x.arc(rnd() * w, rnd() * h, 6 + rnd() * 10, 0, 6.283); x.fill(); }
    for (let r = 0; r < 26; r++) for (let c = 0; c < 12; c++) { const px = (c + (r % 2) * .5) * (w / 12) + 4 + rnd() * 3, py = (r + .5) * (h / 26) + rnd() * 3; x.fillStyle = 'rgba(90,6,18,.55)'; x.beginPath(); x.ellipse(px, py + 2, 4.4, 5.6, 0, 0, 6.283); x.fill(); x.fillStyle = 'rgba(255,226,150,.95)'; x.beginPath(); x.ellipse(px, py, 2.1, 3.4, 0, 0, 6.283); x.fill(); } });
  tx.seed.colorSpace = THREE.SRGBColorSpace;
  tx.seedBump = canvasTex(256, 512, (x, w, h) => { x.fillStyle = '#d0d0d0'; x.fillRect(0, 0, w, h); for (let r = 0; r < 26; r++) for (let c = 0; c < 12; c++) { const px = (c + (r % 2) * .5) * (w / 12) + 4, py = (r + .5) * (h / 26); x.fillStyle = '#303030'; x.beginPath(); x.ellipse(px, py + 2, 5, 6.4, 0, 0, 6.283); x.fill(); } });
  tx.cut = canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h * .55, 8, w / 2, h * .55, w * .62); g.addColorStop(0, '#fff3ef'); g.addColorStop(.28, '#ffd2cc'); g.addColorStop(.62, '#ee5560'); g.addColorStop(1, '#c4152e'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,240,236,.55)'; x.lineWidth = 2.2; for (let i = 0; i < 26; i++) { const a = -Math.PI / 2 + (i / 25 - .5) * 2.7; x.beginPath(); x.moveTo(w / 2, h * .5); x.lineTo(w / 2 + Math.cos(a) * w * .5, h * .55 + Math.sin(a) * h * .58); x.stroke(); }
    x.fillStyle = 'rgba(255,224,150,.9)'; for (let i = 0; i < 22; i++) { const a = Math.PI * (i / 21) - Math.PI, rr2 = w * .44; x.beginPath(); x.ellipse(w / 2 + Math.cos(a) * rr2 * .98, h * .52 - Math.sin(a) * rr2 * .86, 2, 3, 0, 0, 6.283); x.fill(); } });
  tx.cut.colorSpace = THREE.SRGBColorSpace;
  tx.ridge = canvasTex(64, 128, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); for (let k = 0; k < 14; k++) { x.fillStyle = k % 2 ? '#f2f2f2' : '#202020'; x.fillRect(0, k * (h / 14), w, h / 14 * .55); } });
  tx.bloom = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const g = 110 + rnd() * 120; x.fillStyle = `rgb(${g},${g},${g})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); } }, [2, 2]);
  return tx;
}
const cast = (m, g, c = true) => { m.castShadow = c; m.receiveShadow = true; g.add(m); return m; };
const lathe = (pts, seg = 64) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
function wobble(geo, amt, freq, seedv = 0) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + amt * Math.sin(a * freq + seedv) + amt * .6 * Math.sin(a * freq * 2.3 + seedv * 2); p.setX(i, x * k); p.setZ(i, z * k); } geo.computeVertexNormals(); return geo; }
function plate(g, r = 1.7) { const m = cast(new THREE.Mesh(lathe([[0, 0], [r - .25, 0], [r - .05, .035], [r + .05, .1], [r + .06, .125], [r, .105], [r - .05, .06], [0, .05]]), P('#fdfcf8', { roughness: .18, clearcoat: .8, envMapIntensity: 1.2 })), g); m.position.y = 0; m.userData.plate = true; return m; }
const STRAW = [[0, 0], [.04, .004], [.085, .03], [.118, .075], [.13, .13], [.122, .185], [.098, .23], [.06, .262], [.02, .278], [0, .28]];
const berry = (s = 1) => { const g = new THREE.Group(); const t = textures(); const b = new THREE.Mesh(lathe(STRAW, 28), P('#fff', { map: t.seed, bumpMap: t.seedBump, bumpScale: 1.6, roughness: .16, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 1.7 })); b.rotation.x = Math.PI; b.position.y = .28; b.scale.set(1 + rr(-.08, .08), 1, 1 + rr(-.08, .08)); cast(b, g);
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), P('#4f8a35', { roughness: .5 })); l.scale.set(.085, .008, .03); const a = i / 7 * 6.283; l.position.set(Math.cos(a) * .052, .288, Math.sin(a) * .052); l.rotation.set(0, -a, .4); cast(l, g, false); } const st = new THREE.Mesh(new THREE.CylinderGeometry(.007, .009, .05, 6), P('#5d8b3c')); st.position.y = .31; cast(st, g, false); g.scale.setScalar(s); return g; };
const berryHalf = (s = 1) => { const g = new THREE.Group(); const t = textures();
  const skin = new THREE.Mesh(new THREE.LatheGeometry(STRAW.map(([x, y]) => new THREE.Vector2(x, y)), 24, -Math.PI / 2, Math.PI), P('#fff', { map: t.seed, bumpMap: t.seedBump, bumpScale: 1.6, roughness: .16, clearcoat: 1, side: THREE.DoubleSide })); cast(skin, g);
  const sh = new THREE.Shape(); STRAW.forEach(([x, y], k) => (k ? sh.lineTo(x, y) : sh.moveTo(x, y))); [...STRAW].reverse().forEach(([x, y]) => sh.lineTo(-x, y)); const cg = new THREE.ShapeGeometry(sh); { const p = cg.attributes.position, uv = cg.attributes.uv; for (let k = 0; k < p.count; k++) uv.setXY(k, p.getX(k) / .27 + .5, p.getY(k) / .3); }
  const cut = new THREE.Mesh(cg, P('#fff', { map: t.cut, roughness: .22, clearcoat: .9 })); cut.position.z = .001; cast(cut, g, false);
  for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), P('#4f8a35', { roughness: .5 })); l.scale.set(.085, .008, .03); l.position.set((i - 2) * .035, .283, .03); l.rotation.set(0, (i - 2) * .4, .3); cast(l, g, false); }
  g.rotation.x = Math.PI; g.position.y = .28; const w = new THREE.Group(); w.add(g); w.scale.setScalar(s); return w; };
const blueberry = (s = 1) => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.SphereGeometry(.06 * s, 24, 18), P('#2f3b82', { roughness: .36, bumpMap: textures().bloom, bumpScale: .5, sheen: 1, sheenColor: new THREE.Color('#b9c6f2'), sheenRoughness: .35, clearcoat: .25 })); m.scale.y = .86; cast(m, g);
  const cr = new THREE.Mesh(new THREE.TorusGeometry(.016 * s, .006 * s, 8, 14), P('#1a2150', { roughness: .6 })); cr.rotation.x = Math.PI / 2; cr.position.y = .05 * s; cast(cr, g, false); const dn = new THREE.Mesh(new THREE.CircleGeometry(.014 * s, 10), P('#10163a', { roughness: .7 })); dn.rotation.x = -Math.PI / 2; dn.position.y = .0505 * s; g.add(dn); return g; };
const raspberry = (s = 1) => { const g = new THREE.Group(); const m = P('#c2224f', { roughness: .3, clearcoat: .45 }); for (let i = 0; i < 38; i++) { const a = rnd() * 6.283, hh = rnd() * .85 - .1, r = Math.sqrt(Math.max(0, 1 - hh * hh)); const b = new THREE.Mesh(new THREE.SphereGeometry(.022 * s, 10, 8), m); b.position.set(Math.cos(a) * r * .052 * s, hh * .06 * s + .045 * s, Math.sin(a) * r * .052 * s); cast(b, g, false); } return g; };
const mint = (s = 1) => { const g = new THREE.Group(); for (let i = 0; i < 2; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), P('#4f8a4d', { roughness: .6 })); l.scale.set(.09 * s, .008 * s, .05 * s); l.position.set(i * .05 * s, 0, 0); l.rotation.set(0, i * 1.1, .25); cast(l, g, false); } return g; };
function sprinkles(g, r, y, n = 60, cols = ['#f2a7be', '#f6d37a', '#9fd2c3', '#a9b8e8', '#ffffff']) { for (let i = 0; i < n; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * r; const s = new THREE.Mesh(new THREE.CapsuleGeometry(.008, .034, 2, 5), P(cols[i % cols.length], { roughness: .5 })); s.position.set(Math.cos(a) * d, y, Math.sin(a) * d); s.rotation.set(Math.PI / 2, 0, rnd() * 6.283); g.add(s); } }

/* ---------- builders ---------- */
const B = {};

B.cheesecake = (o) => {
  const g = new THREE.Group(), t = textures(); plate(g, 1.75); const R = 1.3, A = .78;
  const sector = (r) => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(r, 0); s.absarc(0, 0, r, 0, A, false); s.lineTo(0, 0); return s; };
  const layer = (r, h, y, mat, bev = .012) => { const geo = new THREE.ExtrudeGeometry(sector(r), { depth: h, bevelEnabled: true, bevelSize: bev, bevelThickness: bev, bevelSegments: 3, curveSegments: 36 }); geo.rotateX(-Math.PI / 2); const m = cast(new THREE.Mesh(geo, mat), g); m.position.y = y; return m; };
  const hCrust = .17, hFill = .6, hTop = o.top ? .1 : 0, y1 = .12 + hCrust, ribbon = o.ribbon ? .045 : 0;
  layer(R, hCrust, .12, P(o.crust || '#b27a3d', { roughness: .96, bumpMap: t.crumb, bumpScale: 3.4 }));
  if (o.ribbon) layer(R - .01, ribbon, y1, P(o.ribbon, { roughness: .35, clearcoat: .6 }), .006);
  layer(R - .012, hFill - ribbon, y1 + ribbon, P(o.fill || '#f7eed8', { roughness: .5, bumpMap: t.fine, bumpScale: .35, sheen: .55, sheenColor: new THREE.Color('#fff4de'), sheenRoughness: .5 }));
  const yT = y1 + hFill;
  if (o.top) layer(R - .006, hTop, yT, P(o.top, { roughness: .06, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 2.1, emissive: new THREE.Color(o.top).multiplyScalar(.1) }), .02);
  const y0 = yT + hTop; const at = (a, rd) => [Math.cos(a) * rd, -Math.sin(a) * rd];
  if (o.top) {                                                    /* glaze that runs down the cut face and pools on the plate */
    const gm = P(o.top, { roughness: .05, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 2.1 });
    for (let k = 0; k < 6; k++) { const x = R * (.2 + k * .14 + rr(-.03, .03)), L = rr(.14, .5), w = rr(.034, .06); const dr = new THREE.Mesh(new THREE.CapsuleGeometry(w, L, 4, 12), gm); dr.position.set(x, y0 - .015 - L / 2, w * .5); dr.scale.z = .55; cast(dr, g, false); const bl = new THREE.Mesh(new THREE.SphereGeometry(w * 1.2, 14, 10), gm); bl.scale.z = .6; bl.position.set(x, y0 - .015 - L, w * .55); cast(bl, g, false); }
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .026, 48), gm); pool.scale.set(1.5, 1, .42); wobble(pool.geometry, .12, 3); pool.position.set(R * .38, .125, .3); cast(pool, g, false);
  }
  const garnish = o.garnish || [];
  if (garnish.includes('strawberry')) { const [x, z] = at(A * .46, R * .6); const b = berryHalf(1.7); b.position.set(x, y0 + .13, z); b.rotation.set(1.05, .3, 0); g.add(b); const [x2, z2] = at(A * .3, R * .66); const b2 = berry(.9); b2.position.set(x2 - .1, y0 - .01, z2 - .08); b2.rotation.y = 2; g.add(b2); }
  if (garnish.includes('blueberry')) for (let i = 0; i < 7; i++) { const [x, z] = at(A * (.18 + (i % 4) * .17), R * (.42 + (i % 3) * .16)); const b = blueberry(1.3); b.position.set(x, y0 + .06, z + (i > 3 ? .1 : 0)); cast(b, g, false); b.rotation.y = i; g.add(b); }
  if (garnish.includes('raspberry')) for (let i = 0; i < 3; i++) { const [x, z] = at(A * (.3 + i * .22), R * .65); const b = raspberry(1.5); b.position.set(x, y0, z); g.add(b); }
  if (garnish.includes('crumble')) for (let i = 0; i < 46; i++) { const [x, z] = at(A * rr(.05, .95), R * rr(.2, .95)); const c = new THREE.Mesh(new THREE.DodecahedronGeometry(rr(.02, .055), 0), P('#c28a45', { roughness: .85, bumpMap: t.crumb, bumpScale: 2 })); c.position.set(x, y0 + .025, z); c.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); cast(c, g, false); }
  if (garnish.includes('mint')) { const [x, z] = at(A * .46, R * .46); const mn = mint(1.5); mn.position.set(x, y0 + .12, z); mn.rotation.y = .8; g.add(mn); }
  if (garnish.includes('chocolate')) for (let i = 0; i < 8; i++) { const [x, z] = at(A * rr(.2, .8), R * rr(.4, .85)); const c = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, rr(.2, .38), 8), P('#33190e', { roughness: .25, clearcoat: .8 })); c.position.set(x, y0 + .05, z); c.rotation.set(Math.PI / 2, 0, rnd() * 3); cast(c, g, false); }
  if (garnish.includes('mango')) for (let i = 0; i < 5; i++) { const [x, z] = at(A * (.18 + i * .16), R * (.55 + (i % 2) * .1)); const c = new THREE.Mesh(new RoundedBoxGeometry(.15, .07, .15, 3, .02), P('#f7b21c', { roughness: .18, clearcoat: .9 })); c.position.set(x, y0 + .04, z); c.rotation.y = rnd() * 3; cast(c, g, false); }
  g.position.set(-R * .42, 0, R * .1); g.rotation.y = -A / 2 + .2; const w = new THREE.Group(); w.add(g); return w;
};

B.flan = (o) => {
  const g = new THREE.Group(); plate(g, 1.7);
  const pool = cast(new THREE.Mesh(lathe([[0, .01], [1.35, .012], [1.42, .02], [1.4, .004], [0, 0]], 72), P(o.sauce || '#b8691c', { roughness: .12, clearcoat: 1 })), g); pool.position.y = .115;
  const body = cast(new THREE.Mesh(wobble(lathe([[0, 0], [.98, 0], [1.04, .04], [.9, .62], [.8, .7], [.7, .72], [0, .72]], 72), .005, 9), P(o.body || '#f2cf86', { roughness: .28, clearcoat: .5, bumpMap: textures().fine, bumpScale: .12, sheen: .3 })), g); body.position.y = .12;
  const sauce = cast(new THREE.Mesh(lathe([[0, .012], [.74, .01], [.92, -.18], [.95, -.4], [.88, -.44], [.7, -.05], [0, -.04]], 72), P(o.sauce || '#b8691c', { roughness: .1, clearcoat: 1 })), g); sauce.position.y = .12 + .72;
  if (o.garnish === 'cream') { const k = cast(new THREE.Mesh(lathe([[0, .2], [.05, .19], [.11, .12], [.15, .04], [.16, 0]], 18), P('#fffaf0', { roughness: .4 })), g); k.position.set(0, .12 + .72, 0); k.scale.setScalar(1.3); }
  if (o.garnish === 'mint') { const m = mint(1.6); m.position.set(0, .12 + .74, 0); g.add(m); }
  return g;
};

B.glass = (o) => {                                   /* layered dessert in a glass: puddings, tiramisu, panna cotta, jars */
  const g = new THREE.Group(); plate(g, 1.5); const gr = o.wide ? .78 : .62, H = o.tall || 1.5, layers = o.layers || [['#f6ecd6', 1]];
  const total = layers.reduce((s, l) => s + l[1], 0); let y = .14 + .05;
  layers.forEach(([c, w, kind], i) => { const h = H * w / total; const rad = gr - .015 - (i % 2) * .004; const m = cast(new THREE.Mesh(wobble(new THREE.CylinderGeometry(rad, rad - .012, h, 56), kind === 'crumb' ? .012 : .004, 7, i), P(c, { roughness: kind === 'sauce' ? .15 : .7, clearcoat: kind === 'sauce' ? 1 : 0, bumpMap: kind === 'crumb' ? textures().crumb : textures().fine, bumpScale: kind === 'crumb' ? 2 : .2 })), g); m.position.y = y + h / 2; y += h; });
  const topY = y;
  if (o.top === 'cocoa') { const m = cast(new THREE.Mesh(new THREE.CylinderGeometry(gr - .02, gr - .02, .02, 56), P('#4a2a1a', { roughness: .95, bumpMap: textures().crumb, bumpScale: 2 })), g); m.position.y = topY + .01; }
  if (o.top === 'cream') { const k = new THREE.Mesh(lathe([[0, .3], [.06, .29], [.17, .2], [.3, .1], [.4, .02], [.42, 0]], 24), P('#fffaf0', { roughness: .42 })); k.position.y = topY; wobble(k.geometry, .06, 7); cast(k, g); }
  if (o.top === 'caramel') { const m = cast(new THREE.Mesh(new THREE.CylinderGeometry(gr - .03, gr - .03, .03, 56), P('#b8691c', { roughness: .1, clearcoat: 1 })), g); m.position.y = topY + .015; }
  (o.garnish || []).forEach((k) => { if (k === 'strawberry') { const b = berry(.8); b.position.set(.1, topY + (o.top === 'cream' ? .24 : 0), .05); g.add(b); } if (k === 'blueberry') for (let i = 0; i < 5; i++) { const b = blueberry(); b.position.set(rr(-.3, .3), topY + .05 + (o.top === 'cream' ? .1 : 0), rr(-.3, .3)); cast(b, g); } if (k === 'mint') { const m = mint(1.3); m.position.set(.05, topY + .3, 0); g.add(m); } if (k === 'chocolate') for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .3, 8), P('#33190e', { roughness: .3 })); c.position.set(rr(-.25, .25), topY + .08 + (o.top === 'cream' ? .16 : 0), rr(-.25, .25)); c.rotation.set(Math.PI / 2, 0, rnd() * 3); cast(c, g, false); } if (k === 'mango') for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(.12, .05, .12), P('#f6b21c', { roughness: .3, clearcoat: .7 })); c.position.set(rr(-.2, .2), topY + .04, rr(-.2, .2)); c.rotation.y = rnd() * 3; cast(c, g, false); } if (k === 'biscuit') { const c = new THREE.Mesh(new THREE.BoxGeometry(.5, .04, .22), P('#a9763d', { roughness: .85, bumpMap: textures().crumb, bumpScale: 1.5 })); c.position.set(.1, topY + .2, 0); c.rotation.set(.2, .6, .5); cast(c, g); } });
  const glass = new THREE.Mesh(lathe([[0, 0], [gr * .8, 0], [gr, .06], [gr + .02, .12], [gr + .03, H + .22], [gr + .018, H + .22], [gr, H + .2], [gr - .012, .14], [gr * .75, .06], [0, .05]].map(([x, y]) => [x, y + .09]), 64), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .02, metalness: 0, transparent: true, opacity: .2, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false })); glass.renderOrder = 2; g.add(glass);
  return g;
};

B.pops = (o) => {
  const g = new THREE.Group(); plate(g, 1.7); const cols = o.colors || ['#f2a7be', '#f2a7be', '#f2a7be'];
  cols.forEach((c, i) => { const pop = new THREE.Group(); const stick = cast(new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 1.5, 8), P('#f7f2e8', { roughness: .8 })), pop); stick.position.y = .4;
    const s = cast(new THREE.Mesh(new THREE.SphereGeometry(.34, 40, 28), P(c, { roughness: .2, clearcoat: 1, clearcoatRoughness: .08 })), pop); s.position.y = 1.05; s.scale.y = .96;
    const cap = cast(new THREE.Mesh(new THREE.TorusGeometry(.2, .035, 10, 24), P(c, { roughness: .2, clearcoat: 1 })), pop); cap.rotation.x = Math.PI / 2; cap.position.y = .76; cap.scale.set(1, 1, 1.2);
    if (o.sprinkles) sprinkles(pop, .3, 1.05, 0); if (o.sprinkles) for (let k = 0; k < 32; k++) { const a = rnd() * 6.283, b = Math.acos(rr(.2, 1)); const m = new THREE.Mesh(new THREE.CapsuleGeometry(.009, .036, 2, 5), P(['#ffffff', '#f6d37a', '#a9b8e8', '#f2a7be'][k % 4])); m.position.set(Math.sin(b) * Math.cos(a) * .34, 1.05 + Math.cos(b) * .33, Math.sin(b) * Math.sin(a) * .34); m.lookAt(m.position.clone().multiplyScalar(2).setY(m.position.y * 2 - 1.05)); pop.add(m); }
    if (o.drizzle) { const d = new THREE.Mesh(new THREE.TorusGeometry(.3, .012, 6, 40, 4.4), P(o.drizzle, { roughness: .2, clearcoat: .8 })); d.rotation.set(Math.PI / 2.6, 0, i); d.position.y = 1.2; pop.add(d); }
    pop.position.set((i - 1) * .78, .12, (i === 1 ? .1 : -.05)); pop.rotation.z = (i - 1) * -.1; pop.scale.setScalar(.82); g.add(pop); });
  return g;
};

B.brownie = (o) => {
  const g = new THREE.Group(), t = textures(); plate(g, 1.7);
  const side = P(o.side || '#2d170d', { roughness: .85, bumpMap: t.crumb, bumpScale: 2.2 }), top = P('#ffffff', { map: t.crack, roughness: .45, bumpMap: t.crack, bumpScale: 1.4 });
  [[0, 0, .12, 0], [.08, -.03, .12 + .36, .35], [-.05, .04, .12 + .72, -.22]].forEach(([x, z, y, rot], i) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(1.15, .36, 1.15, 4, .035), [side, side, i === 2 ? top : side, side, side, side]); m.geometry = new RoundedBoxGeometry(1.15, .36, 1.15, 4, .035); m.material = [side, side, top, side, side, side]; cast(m, g); m.position.set(x, y + .18, z); m.rotation.y = rot; });
  const ty = .12 + .72 + .36;
  if (o.topping === 'walnut') for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.IcosahedronGeometry(.16, 1), P('#a97b4a', { roughness: .8, bumpMap: t.crumb, bumpScale: 2 })); w.scale.set(1.15, .6, .9); w.position.set(rr(-.25, .3), ty + .06, rr(-.25, .3)); w.rotation.set(rnd(), rnd() * 6, rnd()); cast(w, g); }
  if (o.topping === 'caramel') for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.TorusGeometry(.42, .02, 6, 40, 2.4), P('#c98a3c', { roughness: .1, clearcoat: 1 })); d.rotation.set(Math.PI / 2, 0, i * 1.1); d.position.set(0, ty + .02, (i - 2) * .14); g.add(d); }
  if (o.topping === 'sugar') for (let i = 0; i < 160; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.008, 4, 3), P('#ffffff')); s.position.set(rr(-.5, .5), ty + .006, rr(-.5, .5)); g.add(s); }
  if (o.topping === 'swirl') { const s = new THREE.Mesh(new THREE.TorusKnotGeometry(.3, .04, 80, 8, 2, 3), P('#8a5532', { roughness: .22, clearcoat: .8 })); s.scale.set(1, .25, 1); s.rotation.x = Math.PI / 2; s.position.y = ty + .03; cast(s, g, false); }
  g.rotation.y = -.4; return g;
};

B.cupcake = (o) => {
  const g = new THREE.Group(), t = textures(); plate(g, 1.5);
  const liner = lathe([[0, 0], [.34, 0], [.46, .46], [.5, .52], [.44, .5], [.31, .02]], 48); { const p = liner.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + .045 * Math.sin(a * 22); p.setX(i, x * k); p.setZ(i, z * k); } liner.computeVertexNormals(); }
  const l = cast(new THREE.Mesh(liner, P(o.liner || '#e6c9d3', { roughness: .85, side: THREE.DoubleSide })), g); l.position.y = .12;
  const sp = cast(new THREE.Mesh(new THREE.SphereGeometry(.5, 40, 20, 0, 6.283, 0, 1.15), P(o.sponge || '#e2b66f', { roughness: .9, bumpMap: t.crumb, bumpScale: 2 })), g); sp.position.y = .12 + .46; sp.scale.set(1, .6, 1);
  const curve = new THREE.CatmullRomCurve3(Array.from({ length: 48 }, (_, i) => { const u = i / 47, a = u * Math.PI * 2 * 3.2, r = .5 * (1 - u * .82); return new THREE.Vector3(Math.cos(a) * r, .12 + .6 + u * .62, Math.sin(a) * r); }));
  const sw = cast(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, .17, 16), P(o.frost || '#f7f0e4', { roughness: .5, bumpMap: t.ridge, bumpScale: 1.4, sheen: .5, sheenColor: new THREE.Color('#fff') })), g);
  const ty = .12 + .6 + .66;
  if (o.garnish === 'cherry') { const c = cast(new THREE.Mesh(new THREE.SphereGeometry(.1, 20, 14), P('#b3112e', { roughness: .12, clearcoat: 1 })), g); c.position.set(0, ty + .05, 0); }
  if (o.garnish === 'strawberry') { const b = berry(.6); b.position.set(0, ty - .04, 0); g.add(b); }
  if (o.garnish === 'blueberry') for (let i = 0; i < 4; i++) { const b = blueberry(1.1); b.position.set(rr(-.1, .1), ty + .03, rr(-.1, .1)); cast(b, g); }
  if (o.garnish === 'sprinkles') sprinkles(g, .34, ty - .26, 40);
  if (o.garnish === 'ganache') { const gm = cast(new THREE.Mesh(new THREE.SphereGeometry(.2, 20, 12, 0, 6.283, 0, 1.2), P('#2f1a12', { roughness: .1, clearcoat: 1 })), g); gm.position.y = ty - .08; gm.scale.y = .6; }
  g.scale.setScalar(1.25); g.position.y = 0; return g;
};

B.macarons = (o) => {
  const g = new THREE.Group(); plate(g, 1.6); const cols = o.colors || ['#f4b8c8', '#f4b8c8', '#f4b8c8'];
  const mac = (c, f) => { const m = new THREE.Group(); const sh = P(c, { roughness: .5, clearcoat: .2, bumpMap: textures().fine, bumpScale: .15 }); const geo = new THREE.SphereGeometry(.34, 32, 16); geo.scale(1, .4, 1);
    const a = cast(new THREE.Mesh(geo, sh), m); a.position.y = .26; const b = cast(new THREE.Mesh(geo, sh), m); b.position.y = .06; b.scale.y = .85;
    const feet = new THREE.Mesh(new THREE.TorusGeometry(.325, .035, 8, 36), sh); feet.rotation.x = Math.PI / 2; feet.position.y = .21; feet.scale.set(1, 1, .6); m.add(feet);
    const fl = cast(new THREE.Mesh(new THREE.CylinderGeometry(.31, .31, .12, 32), P(f || '#fbf5e8', { roughness: .75 })), m); fl.position.y = .15; return m; };
  [[-.55, .35, .1, 0], [.5, .4, .15, .2], [0, .0, -.4, 0]].forEach(([x, rz, z, rx], i) => { const m = mac(cols[i % cols.length], o.filling); m.position.set(x, .12 + (i === 2 ? .42 : 0), z); m.rotation.set(i === 2 ? .12 : 0, i * 1.3, i === 2 ? 0 : rz * (i ? -1 : 1) * .0); g.add(m); });
  return g;
};

B.donut = (o) => {
  const g = new THREE.Group(), t = textures(); plate(g, 1.5);
  const d = cast(new THREE.Mesh(new THREE.TorusGeometry(.58, .26, 28, 56), P(o.dough || '#d9a35a', { roughness: .85, bumpMap: t.fine, bumpScale: .6 })), g); d.rotation.x = Math.PI / 2; d.position.y = .12 + .26;
  const gl = new THREE.Mesh(new THREE.TorusGeometry(.58, .27, 28, 56, 6.283), P(o.glaze || '#f2a7be', { roughness: .16, clearcoat: 1 })); gl.geometry.scale(1, 1, .62); gl.geometry.translate(0, 0, .09); wobble(gl.geometry, 0, 1); gl.rotation.x = Math.PI / 2; gl.position.y = .12 + .27 + .02; cast(gl, g);
  if (o.sprinkles) for (let i = 0; i < 60; i++) { const a = rnd() * 6.283, rd = .58 + rr(-.18, .18); const s = new THREE.Mesh(new THREE.CapsuleGeometry(.009, .04, 2, 5), P(['#ffffff', '#f6d37a', '#a9b8e8', '#d9283c'][i % 4])); s.position.set(Math.cos(a) * rd, .12 + .26 + .26 * .64 + .05, Math.sin(a) * rd); s.rotation.set(Math.PI / 2, 0, rnd() * 6.283); g.add(s); }
  if (o.drizzle) for (let i = 0; i < 6; i++) { const z = new THREE.Mesh(new THREE.TorusGeometry(.58, .012, 6, 60, 2.2), P(o.drizzle, { roughness: .2, clearcoat: .8 })); z.rotation.set(Math.PI / 2, 0, i * 1.0); z.position.y = .12 + .26 + .26 * .64 + .035; z.scale.set(1 + i * .02, 1, 1); g.add(z); }
  g.rotation.set(-.12, 0, 0); return g;
};

B.cookies = (o) => {
  const g = new THREE.Group(), t = textures(); plate(g, 1.6);
  const cookie = (c, chips, y, x, z, rot) => { const m = new THREE.Group(); const geo = new THREE.CylinderGeometry(.62, .6, .16, 64); wobble(geo, .035, 5); const b = cast(new THREE.Mesh(geo, P(c, { roughness: .95, bumpMap: t.crumb, bumpScale: 2.6 })), m); b.position.y = .08;
    for (let i = 0; i < 16; i++) { const a = rnd() * 6.283, rd = Math.sqrt(rnd()) * .5; const ch = new THREE.Mesh(new THREE.DodecahedronGeometry(rr(.045, .08), 0), P(chips, { roughness: .35, clearcoat: .4 })); ch.scale.y = .6; ch.position.set(Math.cos(a) * rd, .15, Math.sin(a) * rd); ch.rotation.set(rnd(), rnd(), rnd()); cast(ch, m, false); }
    m.position.set(x, y, z); m.rotation.y = rot; return m; };
  g.add(cookie(o.dough || '#c58a4a', o.chips || '#2c170c', .12, -.2, .1, .3)); g.add(cookie(o.dough || '#c58a4a', o.chips || '#2c170c', .12, .35, -.1, 1.4)); g.add(cookie(o.dough || '#c58a4a', o.chips || '#2c170c', .27, .08, 0, 2.2)); return g;
};

B.tart = (o) => {
  const g = new THREE.Group(), t = textures(); plate(g, 1.7);
  const shell = lathe([[0, 0], [1.0, 0], [1.08, .03], [1.12, .26], [1.08, .3], [1.0, .27], [.96, .06], [0, .05]], 72); { const p = shell.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + .02 * Math.sin(a * 30); p.setX(i, x * k); p.setZ(i, z * k); } shell.computeVertexNormals(); }
  const s = cast(new THREE.Mesh(shell, P(o.shell || '#d8a85f', { roughness: .85, bumpMap: t.crumb, bumpScale: 1.6, side: THREE.DoubleSide })), g); s.position.y = .12;
  const ring = textures().ridge.clone(); ring.repeat.set(1, 16); ring.needsUpdate = true; const fill = cast(new THREE.Mesh(lathe([[0, .2], [.5, .2], [.98, .19], [.98, 0], [0, 0]], 64), P(o.fill || '#f8dc4a', { roughness: o.glossy === false ? .5 : .22, clearcoat: o.glossy === false ? 0 : .9, bumpMap: o.glossy === false ? ring : null, bumpScale: o.glossy === false ? 1.2 : 0 })), g); fill.position.y = .12 + .02;
  const topY = .12 + .3;
  if (o.garnish === 'meringue') for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, rd = i ? .6 : 0; const k = cast(new THREE.Mesh(lathe([[0, .22], [.04, .2], [.1, .12], [.15, .03], [.16, 0]], 18), P('#fff6e4', { roughness: .6 })), g); k.position.set(Math.cos(a) * rd, topY, Math.sin(a) * rd); k.scale.setScalar(1.3); }
  if (o.garnish === 'berries') for (let i = 0; i < 18; i++) { const a = rnd() * 6.283, rd = Math.sqrt(rnd()) * .8; const b = i % 3 === 0 ? raspberry(1.6) : (i % 3 === 1 ? blueberry(1.2) : berry(.45)); b.position.set(Math.cos(a) * rd, topY + .02, Math.sin(a) * rd); g.add(b); }
  if (o.garnish === 'cocoa') { sprinkles(g, .8, topY + .01, 0); const d = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .02, 48), P('#3a2216', { roughness: .95, bumpMap: t.crumb, bumpScale: 1.5, transparent: true, opacity: .35 })); d.position.y = topY + .012; g.add(d); const m = mint(1.4); m.position.set(.2, topY + .02, 0); g.add(m); }
  if (o.garnish === 'fruit') for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 * 2.1, rd = .12 + i * .06; const f = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), P(['#f6b21c', '#d9283c', '#3d8f5a', '#f2a7be'][i % 4], { roughness: .2, clearcoat: .9 })); f.scale.y = .55; f.position.set(Math.cos(a) * rd, topY + .05, Math.sin(a) * rd); cast(f, g, false); }
  return g;
};

B.eclair = (o) => {
  const g = new THREE.Group(), t = textures(); plate(g, 1.8);
  const one = (x, z, rot) => { const e = new THREE.Group(); const bd = new THREE.CapsuleGeometry(.24, 1.1, 8, 24); bd.rotateZ(Math.PI / 2); const body = cast(new THREE.Mesh(bd, P(o.dough || '#d6a25b', { roughness: .8, bumpMap: t.fine, bumpScale: .5 })), e); body.scale.set(1, .85, .95); body.position.y = .3;
    const gl = new THREE.CapsuleGeometry(.255, 1.05, 8, 24); gl.rotateZ(Math.PI / 2); const glaze = cast(new THREE.Mesh(gl, P(o.glaze || '#3a1f13', { roughness: .12, clearcoat: 1 })), e); glaze.scale.set(1, .5, .96); glaze.position.y = .43;
    if (o.drizzle) for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(.03, .01, .42), P(o.drizzle, { roughness: .2 })); d.position.set(-.45 + i * .3, .56, 0); d.rotation.y = .5; e.add(d); }
    if (o.nuts) for (let i = 0; i < 18; i++) { const n = new THREE.Mesh(new THREE.DodecahedronGeometry(.03, 0), P('#9bb95f', { roughness: .8 })); n.position.set(rr(-.7, .7), .56, rr(-.12, .12)); e.add(n); }
    e.position.set(x, .12, z); e.rotation.y = rot; return e; };
  g.add(one(-.05, .32, .12)); g.add(one(.1, -.45, -.08)); return g;
};

B.jar = (o) => B.glass({ ...o, wide: true, tall: 1.2 });

export { berry, berryHalf, blueberry, raspberry, mint, textures };
export function dessert(type, o = {}) { seed = (o.seed || 11); textures(); const f = B[type] || B.cheesecake; return f(o); }
export const FRAME = { y: .55, d: 6.4, h: 2.2 };
