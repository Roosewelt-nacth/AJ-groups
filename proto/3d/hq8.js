/* AJ GROUPS · Headquarters tour (slice 1)
   One fixed isometric view for every device. The camera is a pure function of scroll position:
   the page opens on the whole floor, then each scroll step glides to the next business.
   Each business is an open stage with three marked zones: brief in -> work -> delivered, and a
   glowing token carries the work through them on a loop. Alven Studio is fully built in this
   slice; the other rooms are simple stages with the same three zones.
   Lean on purpose: no shadow maps, no post-processing, no glass, merged static geometry,
   one directional light, capped pixel density, automatic quality step-down. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const V3 = THREE.Vector3, PI = Math.PI;
const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const $ = s => document.querySelector(s);
const hexCss = c => '#' + c.toString(16).padStart(6, '0');
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

/* ---------- 3D availability: if anything fails, the plain tour list stays ---------- */
const canvas = $('#c'), stopEls = [...document.querySelectorAll('.stop')], N = stopEls.length;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !MOBILE, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }
if (!renderer) throw new Error('WebGL unavailable: showing the plain tour');

document.body.classList.add('on');
document.documentElement.style.setProperty('--n', N);
document.body.style.setProperty('--n', N);
let PR = Math.min(devicePixelRatio, MOBILE ? 1.5 : 2);
renderer.setPixelRatio(PR);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 1, 900);

/* blue hour: a sky dome that follows the camera, stars, and an environment map made from the same sky */
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: {},
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `varying vec3 vP; void main(){
    float h = clamp(vP.y, -.15, 1.);
    vec3 zen = vec3(.010, .020, .075), mid = vec3(.035, .075, .21), hor = vec3(.20, .24, .34);
    vec3 c = mix(hor, mid, smoothstep(0., .20, h)); c = mix(c, zen, smoothstep(.12, .85, h));
    c += vec3(.85, .62, .42) * exp(-abs(vP.y) * 20.) * .13;
    c = mix(c, vec3(.05, .05, .12), smoothstep(0., -.12, vP.y));
    gl_FragColor = vec4(c, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }` });
const skyGeo = new THREE.SphereGeometry(500, 32, 16), sky = new THREE.Mesh(skyGeo, skyMat); sky.renderOrder = -10; scene.add(sky);
{
  const skyScene = new THREE.Scene(); skyScene.add(new THREE.Mesh(skyGeo, skyMat));
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(skyScene, 0, 1, 1000).texture; scene.environmentIntensity = .9; pm.dispose();
  const n = 700, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = rnd() * PI * 2, y = .12 + rnd() * .88, r = Math.sqrt(1 - y * y) * 480; pos.set([Math.cos(a) * r, y * 480, Math.sin(a) * r], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.8, sizeAttenuation: false, color: 0xcfd8ff, transparent: true, opacity: .7, depthWrite: false, fog: false })); stars.renderOrder = -9; scene.add(stars);
  const mc = document.createElement('canvas'); mc.width = mc.height = 256; const mx = mc.getContext('2d'), mg = mx.createRadialGradient(128, 128, 0, 128, 128, 128);
  mg.addColorStop(0, 'rgba(255,250,235,1)'); mg.addColorStop(.13, 'rgba(255,250,235,1)'); mg.addColorStop(.17, 'rgba(255,244,220,.55)'); mg.addColorStop(.4, 'rgba(190,205,255,.16)'); mg.addColorStop(1, 'rgba(190,205,255,0)'); mx.fillStyle = mg; mx.fillRect(0, 0, 256, 256);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(mc), transparent: true, depthWrite: false, fog: false })); moon.position.set(-250, 170, -400); moon.scale.setScalar(120); moon.renderOrder = -8; scene.add(moon); window.__moon = moon;
}
scene.add(new THREE.HemisphereLight(0x8c9bc4, 0x16161f, 1.1));
const sun = new THREE.DirectionalLight(0xa9bcff, 1.25); sun.position.set(-9, 16, 10); scene.add(sun);

/* ---------- shared helpers ---------- */
function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.3, 'rgba(255,255,255,.4)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}
const GLOW = glowTex();
function blobTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
const BLOB = new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false });
const blobGeo = new THREE.PlaneGeometry(.55, .55).rotateX(-PI / 2);
function sprite(color, scale, opacity = .5) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(scale); return s;
}
/* static parts are collected per material and merged: one draw call per material per room */
class Batch {
  constructor() { this.g = {}; }
  add(geo, key, x, y, z, ry = 0) { if (ry) geo.rotateY(ry); geo.translate(x, y, z); (this.g[key] ??= []).push(geo); }
  box(w, h, d, key, x, y, z, ry) { this.add(new THREE.BoxGeometry(w, h, d), key, x, y, z, ry); }
  cyl(rt, rb, h, key, x, y, z) { this.add(new THREE.CylinderGeometry(rt, rb, h, 20), key, x, y, z); }
  build(parent, mats) {
    for (const k in this.g) { const m = new THREE.Mesh(mergeGeometries(this.g[k]), mats[k]); parent.add(m); this.g[k].forEach(g => g.dispose()); }
  }
}
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .2, ...o });
const base = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });

/* ---------- floor plan: uneven workplaces, sized by the work ---------- */
const ROOMS = [
  { id: 'alven', name: 'Alven Studio', line: 'Digital marketing', color: 0x8fb9b2, x0: -2.6, x1: 3.0, z0: -6.4, z1: -2.6, floor: 'slate', wall: 0x1f2e2f },
  { id: 'fovo', name: 'House of Fovo', line: 'Photography', color: 0xdfe6ff, x0: 3.4, x1: 9.2, z0: -6.4, z1: -1.4, floor: 'concrete', wall: 0x2a2a30 },
  { id: 'bun', name: 'Bun Bun Bakes', line: 'Bakery', color: 0xb98577, x0: -9.2, x1: -3.2, z0: -6.4, z1: -.6, floor: 'tile', wall: 0x3b2c24 },
  { id: 'soft', name: 'AJ Softwares', line: 'Software', color: 0x8f8bb8, x0: 1.9, x1: 9.2, z0: 3.4, z1: 6.4, floor: 'carpet', wall: 0x1d1e2a },
  { id: 'wear', name: 'Clothing', line: 'Clothing', color: 0xc19a6b, x0: -1.9, x1: 1.3, z0: 2.4, z1: 6.4, floor: 'wood', wall: 0x33291f },
  { id: 'kids', name: 'AJ Little World', line: 'Children', color: 0x7f9bb8, x0: -9.2, x1: -4.8, z0: 2.9, z1: 6.4, floor: 'mat', wall: 0x2a3a52 },
  { id: 'founder', name: 'Founder’s office', line: 'Allwyn', color: 0xd9b26f, x0: -4.4, x1: -2.3, z0: 2.6, z1: 6.4, floor: 'woodDark', wall: 0x2a2218, founder: true },
];
const NOW = {
  alven: ['Reviewing this week’s campaign numbers', 'Planning the next social calendar', 'Pitching a launch idea to a client'],
  fovo: ['Shooting a portrait series', 'Checking shots on the monitor', 'Setting up the lights'],
  bun: ['Pulling croissants from the oven', 'Kneading the morning dough', 'Serving the first customers'],
  soft: ['Shipping a website update', 'Writing code for a client app', 'Checking the servers'],
  wear: ['Fitting a new jacket', 'Sewing the autumn samples', 'Choosing fabrics'],
  kids: ['Reading a new story aloud', 'Drawing the next picture book', 'Testing a game with kids'],
  founder: ['Reviewing plans for the next venture', 'Walking the floor', 'Meeting a partner'],
};

const FW = 19.4, FD = 13.8, Y = .14;
const world = new THREE.Group(); scene.add(world);
const CORE = new V3(1.6, 0, .5);
const rooms = [], hitBoxes = [], people = [], peopleHits = [], workHits = [], screens = [];
{
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d');
  x.fillStyle = '#0a0a0e'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 2; x.strokeRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(FW / 1.2, FD / 1.2); t.anisotropy = 4;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(FW, .1, FD), new THREE.MeshStandardMaterial({ map: t, roughness: .7, metalness: .1 })); slab.position.y = -.5; world.add(slab);
}

/* shared materials: one set for every room keeps the material count low */
const tex = (w, h, draw, rep = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 4; return t; };
const woodTex = tex(256, 256, x => { for (let r = 0; r < 8; r++) for (let c = -1; c < 3; c++) { x.fillStyle = `hsl(28,${34 + rnd() * 10}%,${22 + rnd() * 6}%)`; x.fillRect(c * 85 + (r % 2) * 42, r * 32, 85, 32); } x.fillStyle = 'rgba(0,0,0,.3)'; for (let r = 0; r <= 8; r++) x.fillRect(0, r * 32, 256, 1.5); }, 1.4);
const tileTex = tex(128, 128, x => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#4a362b' : '#3a2a22'; x.fillRect(i * 32, j * 32, 32, 32); } }, 2.4);
const FLOORS = { slate: std(0x1d2a2d, { roughness: .45, metalness: .3 }), concrete: std(0x36363c, { roughness: .35, metalness: .3 }), tile: std(0xffffff, { map: tileTex, roughness: .4 }),
  carpet: std(0x1c1e2c, { roughness: .95, metalness: 0 }), wood: std(0xffffff, { map: woodTex, roughness: .5 }), mat: std(0x2a3441, { roughness: .9, metalness: 0 }), woodDark: std(0x9a7a64, { map: woodTex, roughness: .45 }) };
const pal = { c1: 0xa87b70, c2: 0xb9a374, c3: 0x6f8aa0, c4: 0x7a9582, c5: 0x8b86a6, c6: 0xb08a60 };
const MAT = {
  dark: std(0x1a1a20, { roughness: .6 }), metal: std(0x34343c, { roughness: .4, metalness: .6 }), steel: std(0xb8bcc4, { roughness: .3, metalness: .8 }), white: std(0xdcdce2, { roughness: .6 }),
  wood: std(0x8a5f3a, { roughness: .6 }), woodDark: std(0x4a3324, { roughness: .55 }), oak: std(0xa27650, { roughness: .55 }), black: std(0x0d0d10, { roughness: .5 }),
  paper: std(0xe9e7e3, { roughness: .9 }), plant: std(0x3f6b3f, { roughness: .8 }), pot: std(0xbfae98, { roughness: .9 }), dough: std(0xf1dfc2, { roughness: .9 }), bread: std(0xc2813a, { roughness: .7 }),
  cream: std(0xefe3cf, { roughness: .8 }), red: std(0x7e5248, { roughness: .8 }), blue: std(0x43607c, { roughness: .7 }), denim: std(0x2d3a4a, { roughness: .95 }), gray: std(0x6d7078, { roughness: .8 }),
  glassy: new THREE.MeshStandardMaterial({ color: 0x9fd2ff, transparent: true, opacity: .3, roughness: .1, depthWrite: false }), lamp: base(new THREE.Color(1.7, 1.45, 1.1)),
};
Object.entries(pal).forEach(([k, c]) => { MAT[k] = std(c, { roughness: .75 }); });

/* furniture helpers (all merged into one mesh per material per room) */
Batch.prototype.sph = function (r, key, x, y, z, sy = 1) { const g = new THREE.SphereGeometry(r, 12, 8); g.scale(1, sy, 1); this.add(g, key, x, y, z); };
Batch.prototype.hcyl = function (r, len, key, x, y, z) { const g = new THREE.CylinderGeometry(r, r, len, 14); g.rotateZ(PI / 2); this.add(g, key, x, y, z); };
Batch.prototype.cap = function (r, len, key, x, y, z) { this.add(new THREE.CapsuleGeometry(r, len, 4, 10), key, x, y, z); };
const legs = (b, key, x, z, w, d, h) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c]) => b.box(.045, h, .045, key, x + a * (w / 2 - .05), Y + h / 2, z + c * (d / 2 - .05)));
const desk = (b, x, z, w = 1.1, d = .55, key = 'white') => { b.box(w, .05, d, key, x, Y + .62, z); legs(b, 'metal', x, z, w, d, .6); };
const chair = (b, x, z, face) => { b.box(.34, .05, .34, 'dark', x, Y + .36, z); b.box(.34, .34, .04, 'dark', x, Y + .55, z - face * .17); b.box(.04, .34, .04, 'metal', x, Y + .18, z); };
const bezel = (b, x, y, z, w, h) => b.box(w + .04, h + .04, .03, 'black', x, y, z);
const plant = (b, x, z, s = 1) => { b.cyl(.12 * s, .1 * s, .22 * s, 'pot', x, Y + .11 * s, z); b.sph(.2 * s, 'plant', x, Y + .4 * s, z, 1.3); };
const glowAt = (R, x, y, z, color, size, op) => { const s = sprite(color, size, op); s.position.set(x, y, z); R.g.add(s); return s; };
function live(w, h, draw, px = 256) {
  const cv = document.createElement('canvas'); cv.width = px; cv.height = Math.round(px * h / w); const cx = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const st = {}, entry = { st, draw: tm => { draw(cx, cv.width, cv.height, st, tm); t.needsUpdate = true; } }; screens.push(entry); entry.draw(0);
  return new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
}
const plane = (m, w, h, x, y, z, parent, ry = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; parent.add(p); return p; };
/* one shared code texture feeds every monitor that shows code */
const codeMat = (() => {
  const SRC = ['const order = await queue.next();', 'export function ship(site) {', '  return deploy(site, { region });', 'if (!user.signedIn) redirect("/login");', 'for (const p of items) render(p);', 'await db.save({ id, status: "ready" });', 'test("checkout works", () => {', 'fetch("/api/stats").then(show);'];
  return live(.5, .32, (cx, w, h, st) => {
    st.lines ??= []; st.ci ??= 0; st.src ??= 0; const src = SRC[st.src]; st.ci++;
    if (st.ci > src.length + 4) { st.lines.push(src); st.ci = 0; st.src = (st.src + 1 + Math.floor(rnd() * 3)) % SRC.length; if (st.lines.length > 6) st.lines.shift(); }
    cx.fillStyle = '#0f1115'; cx.fillRect(0, 0, w, h); cx.font = `${Math.round(h / 9)}px monospace`;
    [...st.lines, SRC[st.src].slice(0, st.ci) + (st.ci % 2 ? '▍' : '')].forEach((l, i) => { cx.fillStyle = ['#cfd2d8', '#9aa6b8', '#b8a98a', '#8a94a8'][i % 4]; cx.fillText(l, 6, (i + 1) * h / 8.2); });
  }, 256);
})();

/* ---------- people ---------- */
const SKIN = [0xe2b38c, 0xc68c62, 0x8d5a3b, 0xf0c9a4, 0xa8714b];
const pantsMat = std(0x30333a, { roughness: .9 });
function person(g, shirt, x, z, o = {}) {
  const grp = new THREE.Group(); grp.position.set(x, Y + (o.y || 0), z); grp.rotation.y = o.ry || 0; grp.scale.setScalar((o.s || 1) * (.94 + rnd() * .12)); g.add(grp);
  const si = o.skin ?? Math.floor(rnd() * SKIN.length), sm = person.mats[shirt] ??= std(new THREE.Color(shirt).offsetHSL(0, -.38, -.06).multiplyScalar(.82), { roughness: .9 }), skin = person.skin[si] ??= std(SKIN[si], { roughness: .8 });
  const lg = new THREE.Mesh(person.leg, pantsMat); lg.position.y = .24; grp.add(lg);
  const torso = new THREE.Group(); torso.position.y = .42; grp.add(torso);
  const body = new THREE.Mesh(person.body, sm); body.position.y = .2; torso.add(body);
  const head = new THREE.Group(); head.position.y = .5; torso.add(head); head.add(new THREE.Mesh(headGeo(si, Math.floor(rnd() * HAIRS.length), rnd() < .3), person.headMat));
  const arms = [-1, 1].map(k => { const a = new THREE.Group(); a.position.set(k * .13, .34, 0); torso.add(a); const m = new THREE.Mesh(person.arm, sm); m.position.y = -.12; a.add(m); return a; });
  const P = { g: grp, torso, head, arms, ph: rnd() * 6, x0: x, y0: o.y || 0, kid: (o.s || 1) < .8 };
  const hp = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 1.35, 8), new THREE.MeshBasicMaterial({ visible: false })); hp.position.y = .62; hp.userData.person = P; grp.add(hp); P.hit = hp; peopleHits.push(hp);
  people.push(P); return P;
}
const HAIRS = [0x231a14, 0x4a3020, 0x111111, 0x6b4a2b, 0x8a6a3a, 0xb9b0a0], headCache = {};
function headGeo(si, hi, long) {
  const key = si + '_' + hi + '_' + long; if (headCache[key]) return headCache[key];
  const col = (geo, hex) => { const c = new THREE.Color(hex), n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; };
  const parts = [col(new THREE.SphereGeometry(.085, 12, 9), SKIN[si])];
  const cap = new THREE.SphereGeometry(.093, 12, 8, 0, PI * 2, 0, PI * .52); cap.rotateX(-.25); parts.push(col(cap, HAIRS[hi]));
  if (long) { const back = new THREE.SphereGeometry(.09, 10, 8); back.scale(1, 1.25, .8); back.translate(0, -.03, -.035); parts.push(col(back, HAIRS[hi])); }
  return (headCache[key] = mergeGeometries(parts));
}
person.headMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8 });
person.mats = {}; person.skin = {}; person.leg = new THREE.CapsuleGeometry(.075, .26, 3, 8); person.body = new THREE.CapsuleGeometry(.11, .2, 3, 8); person.head = new THREE.SphereGeometry(.085, 12, 9); person.arm = new THREE.CapsuleGeometry(.035, .2, 3, 6);
const ACT = {
  type: (P, t) => { P.arms[0].rotation.x = -1.05 + Math.sin(t * 11 + P.ph) * .07; P.arms[1].rotation.x = -1.05 + Math.sin(t * 9 + P.ph * 2) * .07; P.torso.rotation.x = .1 + Math.sin(t * .8 + P.ph) * .03; P.head.rotation.y = Math.sin(t * .4 + P.ph) * .2; },
  knead: (P, t) => { const k = Math.sin(t * 3 + P.ph); P.arms.forEach(a => a.rotation.x = -1.05 + k * .3); P.torso.rotation.x = .25 + k * .08; },
  present: (P, t) => { P.arms[1].rotation.x = -1.7 + Math.sin(t * .9 + P.ph) * .25; P.arms[1].rotation.z = .5; P.arms[0].rotation.x = -.2; P.head.rotation.y = Math.sin(t * .5) * .4; },
  pose: (P, t) => { const k = Math.floor(t / 2.4 + P.ph) % 3, z = [.4, 1.3, .1][k]; P.arms[0].rotation.z = lerp(P.arms[0].rotation.z, -z, .06); P.arms[1].rotation.z = lerp(P.arms[1].rotation.z, z * .7, .06); P.arms.forEach(a => a.rotation.x = lerp(a.rotation.x, k === 2 ? -.9 : -.1, .06)); P.torso.rotation.y = Math.sin(t * .4 + P.ph) * .25; },
  cam: (P, t) => { P.arms.forEach(a => a.rotation.x = -1.45); P.torso.rotation.x = .05 + Math.sin(t * 1.3) * .04; P.g.position.x = P.x0 + Math.sin(t * .45 + P.ph) * .35; },
  sew: (P, t) => { P.arms.forEach((a, i) => a.rotation.x = -.95 + Math.sin(t * 14 + i) * .04); P.torso.rotation.x = .3; },
  read: (P, t) => { P.arms.forEach(a => a.rotation.x = -1.2); P.head.rotation.x = .25; P.head.rotation.y = Math.sin(t * .6) * .3; },
  draw: (P, t) => { P.arms[1].rotation.x = -1.0 + Math.sin(t * 4) * .12; P.arms[1].rotation.z = Math.cos(t * 3) * .15; P.arms[0].rotation.x = -.8; P.torso.rotation.x = .3; },
  idle: (P, t) => { P.torso.rotation.y = Math.sin(t * .5 + P.ph) * .12; P.head.rotation.y = Math.sin(t * .37 + P.ph) * .35; P.arms.forEach((a, i) => a.rotation.x = Math.sin(t * .8 + i + P.ph) * .05); },
  bounce: (P, t) => { P.g.position.y = Y + P.y0 + Math.abs(Math.sin(t * 3 + P.ph)) * .1; P.arms.forEach((a, i) => a.rotation.z = (i ? 1 : -1) * (.5 + Math.abs(Math.sin(t * 3)) * .6)); },
  pin: (P, t) => { P.arms[1].rotation.x = -1.2 + Math.sin(t * 1.8 + P.ph) * .25; P.arms[0].rotation.x = -.7; P.torso.rotation.x = .2; P.torso.rotation.y = Math.sin(t * .4) * .25; },
  chat: (P, t) => { P.arms[1].rotation.x = -.7 + Math.sin(t * 2.3 + P.ph) * .45; P.arms[1].rotation.z = .25; P.arms[0].rotation.x = -.2; P.head.rotation.x = Math.sin(t * 1.7 + P.ph) * .08; P.head.rotation.y = Math.sin(t * .6 + P.ph) * .2; },
  carry: (P, t) => { P.arms.forEach(a => a.rotation.x = -1.1); P.torso.rotation.x = Math.sin(t * 8) * .03; },
};

/* ---------- a room: diorama plinth, lit floor, two cut-away back walls, glowing edge ---------- */
function buildRoom(def) {
  const w = def.x1 - def.x0, d = def.z1 - def.z0, cx = (def.x0 + def.x1) / 2, cz = (def.z0 + def.z1) / 2;
  const g = new THREE.Group(); g.position.set(cx, 0, cz); world.add(g);
  const col = new THREE.Color(def.color), rimBase = col.clone().multiplyScalar(.62);
  const M = { ...MAT, lamp: base(new THREE.Color(LAMPC[def.id]).multiplyScalar(1.05)), floor: FLOORS[def.floor], wall: std(def.wall, { roughness: .7, metalness: .2 }), rim: base(rimBase.clone()), plinth: std(0x1a1a21, { roughness: .45, metalness: .5 }) };
  const b = new Batch();
  b.box(w, .57, d, 'plinth', 0, -.165, 0);
  b.box(w - .5, .02, d - .5, 'floor', 0, .13, 0);
  const rt = .08, wh = 1.3, wt = .12;
  b.box(w, .03, rt, 'rim', 0, .135, d / 2 - rt / 2); b.box(w, .03, rt, 'rim', 0, .135, -d / 2 + rt / 2);
  b.box(rt, .03, d, 'rim', w / 2 - rt / 2, .135, 0); b.box(rt, .03, d, 'rim', -w / 2 + rt / 2, .135, 0);
  b.box(w, wh, wt, 'wall', 0, .12 + wh / 2, -d / 2 + wt / 2); b.box(wt, wh, d - wt, 'wall', -w / 2 + wt / 2, .12 + wh / 2, wt / 2);
  b.box(w, .04, wt + .02, 'rim', 0, .12 + wh, -d / 2 + wt / 2); b.box(wt + .02, .04, d - wt, 'rim', -w / 2 + wt / 2, .12 + wh, wt / 2);
  const R = { def, g, w, d, cx, cz, mats: M, rimBase, hover: 0, halo: null, stopIndex: -1 };
  BUILDERS[def.id](R, b, g); EXTRAS[def.id] && EXTRAS[def.id](R, b, g);
  b.build(g, M);
  const halo = sprite(def.color, Math.max(w, d) * 1.5, .13); halo.position.set(0, .3, 0); g.add(halo); R.halo = halo;
  const hit = new THREE.Mesh(new THREE.BoxGeometry(w, 1.5, d), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = .75; hit.userData.room = rooms.length; g.add(hit); hitBoxes.push(hit);
  rooms.push(R); return R;
}
const BUILDERS = {}, EXTRAS = {};
const LAMPC = { alven: 0xdff8f4, fovo: 0xffffff, bun: 0xffd8a0, soft: 0xcdbbff, wear: 0xffd9a8, kids: 0xcfe8ff, founder: 0xffd9a0 };

/* Alven Studio: a marketing agency. Campaign board, live dashboard, meeting table, whiteboard. */
BUILDERS.alven = (R, b, g) => {
  const w = R.w, d = R.d, zN = -d / 2 + .14;
  b.box(1.5, .85, .02, 'paper', -1.45, Y + .95, zN); for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) b.box(.17, .17, .012, 'c' + (1 + (i + j * 2) % 6), -2.0 + i * .22, Y + .68 + j * .24, zN + .016);
  bezel(b, 1.05, Y + .95, zN, 2.0, .9);
  const dash = live(2.0, .9, (cx, W, H, st, t) => {
    st.reach ??= 12400; st.ctr ??= 3.8; st.leads ??= 842; st.pts ??= [];
    st.reach += Math.floor(rnd() * 40); st.ctr = +(st.ctr + (rnd() - .45) * .02).toFixed(2); if (rnd() > .7) st.leads++;
    st.pts.push(.45 + Math.sin(t * .3) * .2 + rnd() * .1); if (st.pts.length > 60) st.pts.shift();
    cx.fillStyle = '#0d1014'; cx.fillRect(0, 0, W, H);
    [['REACH', st.reach.toLocaleString()], ['CTR %', st.ctr.toFixed(2)], ['LEADS', st.leads]].forEach(([k, v], i) => { cx.fillStyle = '#8b939c'; cx.font = `${H / 10}px sans-serif`; cx.fillText(k, 14 + i * W * .16, H * .16); cx.fillStyle = '#b9d4cf'; cx.font = `bold ${H / 6}px sans-serif`; cx.fillText(String(v), 14 + i * W * .16, H * .34); });
    cx.fillStyle = '#e6edf3'; cx.font = `${H / 10}px sans-serif`; cx.fillText('Autumn launch · live', W * .55, H * .16);
    cx.strokeStyle = '#b9d4cf'; cx.lineWidth = 3; cx.beginPath(); st.pts.forEach((p, i) => { const x = W * .5 + i * (W * .46 / 60), y = H * (.92 - p * .6); i ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke();
    for (let i = 0; i < 14; i++) { cx.fillStyle = '#b9d4cf'; const hg = H * (.08 + (Math.sin(i * 1.7 + t * .6) + 1) * .12); cx.fillRect(16 + i * W * .033, H * .92 - hg, W * .022, hg); }
  }, 384);
  plane(dash, 2.0, .9, 1.05, Y + .95, zN + .02, g);
  b.box(.03, .85, 1.3, 'white', -w / 2 + .14, Y + .95, .2); [[-.2, 'c3'], [.15, 'c1'], [.5, 'c4']].forEach(([z, k]) => b.box(.02, .05, .5, k, -w / 2 + .16, Y + 1.05 - z * .3, z));
  desk(b, 0, .45, 2.4, .9, 'oak');
  [-.8, 0, .8].forEach(x => { chair(b, x, 1.05, -1); b.box(.36, .02, .26, 'dark', x, Y + .66, .62); b.box(.34, .22, .02, 'dark', x, Y + .78, .5); });
  [-.6, .6].forEach(x => chair(b, x, -.15, 1));
  b.box(.6, .85, .5, 'white', w / 2 - .5, Y + .43, -d / 2 + .5); plant(b, w / 2 - .4, d / 2 - .5, 1.1); plant(b, -w / 2 + .5, d / 2 - .45);
  glowAt(R, 0, Y + .2, .45, 0x8fb9b2, 3.2, .1);
  person(g, 0x2f6f66, -.8, 1.05, { ry: Math.PI }).act = ACT.type; person(g, 0xe6e2da, .8, 1.05, { ry: Math.PI }).act = ACT.type;
  person(g, 0x6b5cc9, .6, -.15, { ry: 0 }).act = ACT.type;
  person(g, 0xc8a96a, -1.3, -1.2, { ry: .3 }).act = ACT.present;
  const walker = person(g, 0xd9d9e0, -2.1, 1.3); walker.walk = [[-2.1, 1.3], [-1.9, -.5], [-1.2, .1]]; walker.act = ACT.carry;
};

/* House of Fovo: a photo studio. Paper backdrop, flash lights, camera, tethered monitor, prints on a line. */
BUILDERS.fovo = (R, b, g) => {
  const w = R.w, d = R.d, zN = -d / 2 + .14;
  b.box(3.0, 1.2, .04, 'paper', .5, Y + .75, zN + .3); b.box(3.0, .02, 1.2, 'paper', .5, Y + .01, zN + .95);
  [-1.4, 2.4].forEach(x => b.box(.04, 1.3, .04, 'metal', x, Y + .65, -.4));
  b.box(.05, .95, .05, 'metal', .2, Y + .48, 1.05); b.box(.3, .2, .18, 'black', .2, Y + 1.05, 1.05); b.box(.08, .08, .14, 'metal', .2, Y + 1.05, .93);
  const faces = [-1.4, 2.4].map(x => { const m = new THREE.Mesh(new THREE.BoxGeometry(.66, .66, .12), base(new THREE.Color(.8, .8, .9))); m.position.set(x, Y + 1.45, -.4); m.rotation.y = x > 0 ? -.7 : .7; g.add(m); return m; });
  const flare = sprite(0xffffff, 3.4, 0); flare.position.set(.5, Y + 1.1, -.5); g.add(flare);
  desk(b, 2.2, -1.5, 1.2, .55, 'white'); bezel(b, 2.2, Y + .98, -1.78, .62, .4); chair(b, 2.2, -1.05, -1);
  const mon = live(.6, .38, (cx, W, H, st) => { if (st.hue === undefined || st.flash) { st.hue = Math.floor(rnd() * 360); st.flash = false; } const gr = cx.createLinearGradient(0, 0, W, H); gr.addColorStop(0, `hsl(${st.hue},20%,26%)`); gr.addColorStop(1, `hsl(${st.hue + 30},14%,9%)`); cx.fillStyle = gr; cx.fillRect(0, 0, W, H); cx.fillStyle = 'rgba(240,230,220,.85)'; cx.beginPath(); cx.ellipse(W * .5, H * .38, W * .07, H * .14, 0, 0, PI * 2); cx.fill(); cx.beginPath(); cx.ellipse(W * .5, H * .9, W * .2, H * .32, 0, PI, 0); cx.fill(); }, 192);
  plane(mon, .6, .38, 2.2, Y + .98, -1.76, g);
  const tones = [0xcfc7bd, 0xa9b4c6, 0xc9a98f, 0xd8d8dc, 0x9fa6b4]; for (let i = 0; i < 5; i++) b.box(.03, .5, .4, 'cream', -w / 2 + .16, Y + .85, -1.2 + i * .62);
  b.box(.02, .02, 3.3, 'dark', -w / 2 + .15, Y + 1.2, .3);
  b.box(.6, .34, .4, 'black', -1.9, Y + .18, 1.5); b.box(.7, .7, .02, 'white', -.9, Y + 1.0, .3); b.box(.04, .9, .04, 'metal', -.9, Y + .45, .3); plant(b, w / 2 - .5, d / 2 - .5, 1.1);
  R.update = t => { const f = !RM && (t % 3.4) < .1; faces.forEach(m => m.material.color.setScalar(f ? 4 : .85)); flare.material.opacity = f ? .5 : 0; };
  const monSt = screens[screens.length - 1], mdraw = monSt.draw; let lastF = false;
  monSt.draw = tm => { const f = !RM && (tm % 3.4) < .6; if (f && !lastF) monSt.st.flash = true; lastF = f; mdraw(tm); };
  const model = person(g, 0x1d1d1f, .5, -.5, { ry: 0 }); model.act = ACT.pose;
  const ph = person(g, 0xdfe6ff, .2, 1.55, { ry: Math.PI }); ph.act = ACT.cam;
  person(g, 0x6f6f78, 2.2, -1.05, { ry: Math.PI }).act = ACT.type;
};

/* Bun Bun Bakes: a bakery. Ovens and a worktable in the kitchen, a counter, cakes and customers in the shop. */
BUILDERS.bun = (R, b, g) => {
  const w = R.w, d = R.d, zN = -d / 2 + .14;
  [-1.9, -.7, .5].forEach(x => b.box(1.0, 1.0, .6, 'steel', x, Y + .5, zN + .4));
  b.box(.6, 1.3, .5, 'steel', w / 2 - .55, Y + .65, zN + .4); [.3, .62, .94].forEach(y => { b.box(.55, .03, .45, 'dark', w / 2 - .55, Y + y, zN + .4); });
  desk(b, -.4, -.95, 2.2, .9, 'steel'); for (let i = 0; i < 5; i++) b.sph(.11, 'dough', -1.2 + i * .4, Y + .73, -.95 + (i % 2) * .15, .6); b.box(.4, .015, .3, 'white', .45, Y + .66, -.85);
  b.box(4.4, .85, .6, 'oak', 0, Y + .43, 1.15); b.box(4.5, .05, .7, 'cream', 0, Y + .87, 1.15); b.box(2.3, .4, .5, 'glassy', -.8, Y + 1.12, 1.15);
  b.box(.35, .25, .3, 'black', 1.6, Y + 1.0, 1.15);
  b.box(.8, .04, .8, 'cream', 1.8, Y + .02, 2.2); plant(b, -w / 2 + .5, d / 2 - .45, 1.2);
  [-1.9, -.7, .5].forEach(x => { const door = new THREE.Mesh(new THREE.BoxGeometry(.7, .42, .02), base(new THREE.Color(2.2, .9, .25))); door.position.set(x, Y + .5, zN + .71); g.add(door); (R.doors ??= []).push(door); });
  const board = live(1.1, .62, (cx, W, H, st, t) => { st.n ??= 126; st.list ??= [['126', 'Croissants', 'Ready'], ['127', 'Birthday cake', 'Baking'], ['128', 'Sourdough', 'Queued']]; st.last ??= -1; const items = ['Cinnamon rolls', 'Sourdough x6', 'Box of buns', 'Chocolate cake', 'Croissant x3'], k = Math.floor(t / 5);
    if (k !== st.last) { st.last = k; st.list.shift(); st.list.push([String(++st.n + 2), items[st.n % items.length], 'Queued']); st.list[0][2] = 'Ready'; st.list[1][2] = 'Baking'; }
    cx.fillStyle = '#2a1c14'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#f4e3cf'; cx.font = `bold ${H / 8}px sans-serif`; cx.fillText('ORDERS', 10, H * .17);
    st.list.forEach(([n, it, s2], i) => { const y = H * (.38 + i * .22); cx.font = `${H / 10}px sans-serif`; cx.fillStyle = '#f4e3cf'; cx.fillText(`#${n} ${it}`, 10, y); cx.fillStyle = s2 === 'Ready' ? '#7bd88f' : s2 === 'Baking' ? '#ffb35c' : '#b9a894'; cx.fillText(s2, W * .7, y); }); }, 256);
  bezel(b, -w / 2 + .16, Y + 1.1, .0, .04, .04); plane(board, 1.1, .62, -w / 2 + .15, Y + 1.1, -.2, g, Math.PI / 2);
  glowAt(R, -.2, Y + 1.4, -.9, 0xffb35c, 3.4, .13); glowAt(R, 0, Y + 1.4, 1.6, 0xffb35c, 3.2, .1);
  R.update = t => { R.doors.forEach((m, i) => { const s = .7 + .3 * Math.sin(t * 1.5 + i * 2); m.material.color.setRGB(2.2 * s, .9 * s, .25 * s); }); };
  person(g, 0xf6f3ee, -.8, -.4, { ry: Math.PI }).act = ACT.knead; person(g, 0xf6f3ee, .5, -.4, { ry: Math.PI }).act = ACT.knead;
  const runner = person(g, 0xb98577, 1.0, -1.7); runner.walk = [[1.0, -1.7], [-.4, -1.7], [-1.5, -1.7]]; runner.act = ACT.carry;
  person(g, 0xb98577, 1.2, .75, { ry: 0 }).act = ACT.idle;
  const c1 = person(g, 0x55604a, -.8, 1.9, { ry: Math.PI }); c1.act = ACT.idle; const c2 = person(g, 0x4a5e80, .9, 2.2, { ry: Math.PI }); c2.walk = [[.9, 2.4], [.7, 1.85]]; c2.act = ACT.idle;
};

/* AJ Softwares: a software team. Kanban board, a row of desks, servers, a build screen. */
BUILDERS.soft = (R, b, g) => {
  const w = R.w, d = R.d, zN = -d / 2 + .14;
  b.box(2.5, .95, .03, 'white', -.9, Y + .95, zN); [[-1.9, 'c3'], [-.9, 'c2'], [.1, 'c4']].forEach(([x, k]) => { b.box(.7, .08, .02, k, x, Y + 1.3, zN + .02); for (let i = 0; i < 3; i++) b.box(.55, .16, .015, 'c' + (1 + (i * 2 + (k.charCodeAt(1) - 48)) % 6), x, Y + 1.1 - i * .22, zN + .02); });
  bezel(b, 2.1, Y + .95, zN, 1.6, .9); plane(codeMat, 1.6, .9, 2.1, Y + .95, zN + .02, g);
  [-2.6, -.9, .8, 2.5].forEach((x, i) => { desk(b, x, -.15, 1.3, .6, 'white'); [-.33, .33].forEach(o => { bezel(b, x + o, Y + .95, -.38, .5, .32); plane(codeMat, .5, .32, x + o, Y + .95, -.36, g); }); chair(b, x, .6, -1); b.box(.4, .02, .14, 'dark', x, Y + .655, .05); });
  b.box(.55, 1.4, .5, 'dark', -w / 2 + .5, Y + .7, zN + .4); b.box(.55, 1.4, .5, 'dark', -w / 2 + 1.1, Y + .7, zN + .4);
  const leds = []; for (let k = 0; k < 2; k++) for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.36, .03, .01), base(new THREE.Color(.3, 1.5, .6))); m.position.set(-w / 2 + .5 + k * .6, Y + .3 + i * .18, zN + .66); m.userData.ph = rnd() * 6; g.add(m); leds.push(m); }
  b.box(.6, .9, .5, 'white', w / 2 - .5, Y + .45, d / 2 - .5); plant(b, w / 2 - .5, zN + .6, 1.1); plant(b, 1.6, d / 2 - .4);
  glowAt(R, 0, Y + .3, .2, 0x8f8bb8, 4.5, .1);
  R.update = t => { leds.forEach(m => m.material.color.setScalar(Math.sin(t * 5 + m.userData.ph) > .1 ? 1 : .25)); };
  [[-2.6, 0x8f8bb8], [-.9, 0x3a3d44], [2.5, 0xe6e2da]].forEach(([x, c]) => { person(g, c, x, .6, { ry: Math.PI }).act = ACT.type; });
  const lead = person(g, 0xc8a96a, .8, .6, { ry: Math.PI }); lead.act = ACT.idle;
  const co = person(g, 0xd9d9e0, 1.8, 1.2); co.walk = [[1.8, 1.2], [-.4, 1.2], [-1.5, .9]]; co.act = ACT.carry;
};

/* Clothing: an atelier. Fabric rolls, a rail of finished pieces, a cutting table, mannequins, sewing. */
BUILDERS.wear = (R, b, g) => {
  const w = R.w, d = R.d, zN = -d / 2 + .14;
  ['denim', 'red', 'cream', 'c6', 'c4', 'c3'].forEach((k, i) => b.hcyl(.13, .95, k, -.5 + (i % 2) * 1.0, Y + .35 + Math.floor(i / 2) * .3, zN + .2)); b.box(1.5, .04, .4, 'woodDark', 0, Y + .2, zN + .2);
  b.box(.03, .03, 2.8, 'metal', -w / 2 + .5, Y + 1.25, .1); b.box(.03, 1.1, .03, 'metal', -w / 2 + .5, Y + .65, -1.2); b.box(.03, 1.1, .03, 'metal', -w / 2 + .5, Y + .65, 1.35);
  ['red', 'denim', 'cream', 'c6', 'c5', 'c4', 'blue', 'c1'].forEach((k, i) => b.box(.07, .72, .26, k, -w / 2 + .5, Y + .85, -1.0 + i * .3));
  desk(b, .15, -.45, 1.4, .8, 'white'); b.box(1.2, .015, .6, 'denim', .15, Y + .655, -.45); b.box(.3, .015, .04, 'c2', .4, Y + .67, -.35);
  [[.95, -.9], [.95, .35]].forEach(([x, z], i) => { b.cyl(.15, .17, .03, 'metal', x, Y + .02, z); b.cyl(.015, .015, .5, 'metal', x, Y + .27, z); b.cap(.14, .26, i ? 'c6' : 'red', x, Y + .78, z); });
  desk(b, -.3, 1.2, 1.0, .55, 'oak'); b.box(.3, .22, .15, 'white', -.3, Y + .76, 1.15); b.box(.55, 1.2, .03, 'glassy', 1.05, Y + .72, 1.5);
  plant(b, w / 2 - .35, -d / 2 + .5, 1.0);
  glowAt(R, .2, Y + .6, 0, 0xc19a6b, 3.0, .12);
  person(g, 0x2b2b2f, .15, .15, { ry: Math.PI }).act = ACT.pin; person(g, 0xd9c7a7, -.3, 1.65, { ry: Math.PI }).act = ACT.sew;
  const t2 = person(g, 0x7e5248, -.4, .7); t2.walk = [[-.4, .7], [.5, .1], [.4, -1.2]]; t2.act = ACT.carry;
};

/* AJ Little World: a children's studio. Story corner, a screen showing the story, drawing table, blocks. */
BUILDERS.kids = (R, b, g) => {
  const w = R.w, d = R.d, zN = -d / 2 + .14;
  b.cyl(1.0, 1.0, .012, 'c2', .1, Y + .01, .5); b.cyl(.6, .6, .014, 'c1', .1, Y + .02, .5);
  bezel(b, .5, Y + .95, zN, 1.7, .95);
  const story = live(1.7, .95, (cx, W, H, st, t) => { const sky = cx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1b2a5a'); sky.addColorStop(1, '#6a8fd8'); cx.fillStyle = sky; cx.fillRect(0, 0, W, H);
    cx.fillStyle = '#ffd166'; cx.beginPath(); cx.arc(W * (.2 + .6 * ((t * .04) % 1)), H * .28, H * .12, 0, PI * 2); cx.fill(); cx.fillStyle = '#3a6b46'; cx.fillRect(0, H * .72, W, H * .28);
    cx.fillStyle = '#fff'; const cxp = W * ((t * .03 + .3) % 1); cx.beginPath(); cx.arc(cxp, H * .15, H * .06, 0, PI * 2); cx.arc(cxp + H * .07, H * .17, H * .05, 0, PI * 2); cx.fill();
    cx.fillStyle = '#e8e8f2'; cx.fillRect(W * .46, H * .5, W * .08, H * .22); cx.fillStyle = '#ff6f91'; cx.fillRect(W * .44, H * .48, W * .12, H * .06); }, 256);
  plane(story, 1.7, .95, .5, Y + .95, zN + .02, g);
  for (let i = 0; i < 4; i++) { b.box(.03, .04, 1.3, 'woodDark', -w / 2 + .3, Y + .35 + i * .28, -.2); } for (let i = 0; i < 12; i++) b.box(.12, .22, .06, 'c' + (1 + i % 6), -w / 2 + .3, Y + .5 + Math.floor(i / 4) * .28, -.75 + (i % 4) * .33);
  for (let k = 0; k < 4; k++) b.box(.28, .28, .28, 'c' + (1 + k), 1.6 + (k % 2) * .04, Y + .14 + k * .28, -.5);
  b.cyl(.1, .1, .5, 'white', 1.6, Y + .3, .35); b.add(new THREE.ConeGeometry(.1, .26, 16), 'c1', 1.6, Y + .68, .35);
  b.sph(.3, 'c5', -.8, Y + .13, .35, .5); b.sph(.28, 'c6', 1.0, Y + .12, .0, .5);
  desk(b, 1.5, 1.0, .9, .5, 'oak'); [0, 1, 2, 3].forEach(i => b.box(.05, .02, .12, 'c' + (1 + i), 1.3 + i * .12, Y + .65, 1.0)); b.box(.4, .01, .3, 'paper', 1.6, Y + .655, .95);
  glowAt(R, .5, Y + .6, .3, 0x7f9bb8, 3.6, .1);
  const tl = person(g, 0x7f9bb8, .1, .45, { ry: 0 }); tl.act = ACT.read; const bk = new THREE.Mesh(new THREE.BoxGeometry(.28, .22, .03), std(0xb98577)); bk.position.set(0, .52, .22); bk.rotation.x = -.5; tl.torso.add(bk);
  [-.5, .2, .9].forEach((x, i) => { const k = person(g, [0xd8c08a, 0x8aa592, 0xa9a4c8][i], x, 1.2, { ry: Math.PI, s: .62 }); k.act = ACT.idle; });
  const dk = person(g, 0xc19a6b, 1.5, 1.5, { ry: Math.PI, s: .62 }); dk.act = ACT.draw;
  const bn = person(g, 0xb98577, -1.3, .9, { s: .62 }); bn.act = ACT.bounce;
};

/* Founder's office: a desk, shelves, a window over the floor, six small lights for the six businesses. */
BUILDERS.founder = (R, b, g) => {
  const w = R.w, d = R.d, zN = -d / 2 + .14, col = new THREE.Color(R.def.color);
  b.box(w - .6, 1.0, .03, 'glassy', 0, Y + .7, zN); b.box(w - .6, .04, .05, 'lamp', 0, Y + 1.22, zN);
  desk(b, 0, .6, 1.2, .6, 'woodDark'); chair(b, 0, 1.2, -1); b.box(.4, .5, .05, 'black', 0, Y + .95, 1.15);
  for (let i = 0; i < 4; i++) b.box(.3, .03, 1.8, 'woodDark', -w / 2 + .3, Y + .3 + i * .28, .3); for (let i = 0; i < 16; i++) b.box(.16, .22, .05, ['red', 'blue', 'cream', 'dark'][i % 4], -w / 2 + .3, Y + .45 + Math.floor(i / 5) * .28, -.45 + (i % 5) * .3);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.55, .025, 8, 48), base(col.clone().multiplyScalar(1.2))); ring.rotation.x = PI / 2; ring.position.set(0, Y + .02, -.35); g.add(ring);
  const orbit = new THREE.Group(); orbit.position.set(0, Y + 1.1, -.35); g.add(orbit);
  ROOMS.filter(r => !r.founder).forEach((r, i) => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(.09), base(new THREE.Color(r.color).multiplyScalar(1.4))); const a = i / 6 * PI * 2; m.position.set(Math.cos(a) * .55, 0, Math.sin(a) * .55); orbit.add(m); const h = sprite(r.color, .5, .5); h.position.copy(m.position); orbit.add(h); });
  glowAt(R, 0, Y + .4, .2, 0xd9b26f, 3.0, .12);
  R.update = t => { orbit.rotation.y = t * .6; };
  const f = person(g, 0x1d2433, 0, -.35, { ry: .5 }); f.act = ACT.idle;
};

/* ---------- extra detail, mood and people per room ---------- */
const poolGeo = new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2);
function pool(R, x, z, size, color, op) { const m = new THREE.Mesh(poolGeo, new THREE.MeshBasicMaterial({ map: GLOW, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); m.position.set(x, Y + .012, z); m.material.opacity *= .45; m.scale.set(size, 1, size); R.g.add(m); return m; }
function sign(R, text, x, y, z, w, h, color, ry = 0) {
  const t = tex(512, Math.round(512 * h / w), (cx, W, H) => { cx.fillStyle = 'rgba(10,10,12,.92)'; cx.fillRect(0, 0, W, H); cx.strokeStyle = color; cx.lineWidth = 5; cx.strokeRect(7, 7, W - 14, H - 14); cx.fillStyle = color; cx.font = `700 ${Math.round(H * .4)}px Inter, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(text, W / 2, H / 2 + 2); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(x, y, z); m.rotation.y = ry; R.g.add(m);
}
const MORE = !MOBILE;   /* extra background people are for laptops; phones keep the lighter scene */
EXTRAS.alven = (R, b, g) => {
  const w = R.w, d = R.d;
  sign(R, 'ALVEN STUDIO', -w / 2 + .15, Y + 1.12, -1.25, .75, .24, '#b9d4cf', Math.PI / 2);
  b.box(2.7, .012, 1.4, 'denim', 0, Y + .006, .5);
  [[-.9, .6, 'c2'], [.35, .5, 'c1'], [.9, .62, 'c4']].forEach(([x, z, k]) => b.box(.09, .01, .09, k, x, Y + .655, z));
  [-.4, .5, 1.0].forEach(x => b.cyl(.035, .035, .08, 'white', x, Y + .69, .3));
  b.box(.3, .35, .3, 'black', w / 2 - .5, Y + 1.02, -d / 2 + .5); b.sph(.05, 'c3', w / 2 - .3, Y + .9, -d / 2 + .75);
  b.box(.9, .035, .12, 'lamp', -.5, Y + 1.15, .45); b.box(.9, .035, .12, 'lamp', .8, Y + 1.15, .45);
  pool(R, 0, .45, 3.4, 0x8fb9b2, .16); pool(R, 1.05, -1.1, 1.8, 0x8fb9b2, .12);
  if (MORE) { const a = person(g, 0xb98577, w / 2 - 1.1, -.55, { ry: Math.PI / 2 }); a.act = ACT.chat; const c = person(g, 0x3a3d44, w / 2 - .7, -.55, { ry: -Math.PI / 2 }); c.act = ACT.chat; }
};
EXTRAS.fovo = (R, b, g) => {
  const w = R.w, d = R.d, zN = -d / 2 + .14;
  sign(R, 'HOUSE OF FOVO', -1.9, Y + 1.1, zN + .02, 1.05, .26, '#dfe6ff');
  b.box(3.0, .03, .03, 'metal', .5, Y + 1.3, zN + .2); [-.7, .5, 1.7].forEach((x, i) => b.hcyl(.05, .8, ['cream', 'gray', 'c6'][i], x, Y + 1.2, zN + .2));
  b.cyl(.16, .16, .45, 'dark', 1.4, Y + .36, -.15); b.cyl(.2, .2, .04, 'dark', 1.4, Y + .6, -.15);
  b.box(.04, 1.2, .04, 'metal', 2.9, Y + .6, .6); b.box(.6, .6, .12, 'black', 2.55, Y + 1.2, .6);
  desk(b, -1.2, -1.45, 1.0, .5, 'white'); [0, 1, 2].forEach(i => b.box(.22, .01, .3, 'cream', -1.45 + i * .26, Y + .655, -1.45));
  b.box(1.2, .3, .5, 'gray', -1.9, Y + .15, 1.9); b.box(1.2, .35, .1, 'gray', -1.9, Y + .42, 2.15);
  b.box(.02, .01, 1.4, 'black', .1, Y + .005, .2); b.box(.02, .01, 1.0, 'black', 1.6, Y + .005, -.3);
  pool(R, .5, -.6, 2.8, 0xffffff, .22); pool(R, 2.2, -1.3, 1.5, 0x9fb4ff, .14);
  if (MORE) { const cl = person(g, 0x8a5f3a, -1.9, 1.75, { ry: Math.PI }); cl.act = ACT.idle; const as = person(g, 0x2b2b2f, 2.3, .15, { ry: 2.2 }); as.walk = [[2.3, .15], [1.9, .55], [2.5, .8]]; as.act = ACT.carry; }
};
EXTRAS.bun = (R, b, g) => {
  const w = R.w, d = R.d;
  sign(R, 'BUN BUN BAKES', -w / 2 + .15, Y + 1.12, -1.7, 1.0, .26, '#c9a094', Math.PI / 2); sign(R, 'TODAY', -w / 2 + .15, Y + 1.0, 1.55, .6, .32, '#f4e3cf', Math.PI / 2);
  b.box(.3, .42, .3, 'red', .5, Y + .87, -.95); b.sph(.14, 'steel', .5, Y + 1.0, -.95, .7);
  [-2.2, -1.85].forEach(z => b.box(.35, .5, .25, 'cream', -2.6, Y + .25, z));
  [1.0, 1.4].forEach(x => { b.cyl(.2, .17, .1, 'wood', x, Y + .93, 1.0); });
  b.cyl(.28, .28, .03, 'oak', -2.1, Y + .6, 2.0); b.cyl(.03, .03, .58, 'metal', -2.1, Y + .3, 2.0); b.cyl(.14, .14, .04, 'dark', -2.55, Y + .35, 2.0); b.cyl(.14, .14, .04, 'dark', -1.65, Y + .35, 2.0);
  b.cyl(.04, .04, .08, 'white', -2.05, Y + .66, 2.0);
  pool(R, -.7, -1.6, 3.0, 0xd9904a, .22); pool(R, 0, 1.6, 3.4, 0xffb35c, .14);
  if (MORE) { const bk = person(g, 0xf6f3ee, -1.25, -1.75, { ry: Math.PI }); bk.act = ACT.knead; const sc = person(g, 0x7a4a8a, -2.1, 2.45, { ry: Math.PI }); sc.act = ACT.idle; }
};
EXTRAS.soft = (R, b, g) => {
  const w = R.w, d = R.d, zN = -d / 2 + .14;
  sign(R, 'AJ SOFTWARES', -w / 2 + 1.1, Y + 1.22, zN + .02, 1.1, .22, '#a8a4c8');
  [-2.6, -.9, .8, 2.5].forEach((x, i) => { b.sph(.04, 'c2', x + .5, Y + .68, -.3, 1); b.box(.12, .1, .12, 'c' + (1 + i), x - .5, Y + .68, .05); pool(R, x, .3, 1.5, 0x9fb2c8, .13); });
  b.sph(.3, 'c5', w / 2 - 1.0, Y + .13, .8, .5); b.sph(.28, 'c1', w / 2 - .5, Y + .12, 1.1, .5);
  b.box(.5, .03, .4, 'oak', -1.3, Y + .5, 1.1); b.box(.4, .02, .3, 'dark', -1.3, Y + .52, 1.1);
  if (MORE) { const s1 = person(g, 0xc8a96a, -1.7, -1.1, { ry: 0 }); s1.act = ACT.present; const s2 = person(g, 0x3a3d44, -.5, -1.1, { ry: -.6 }); s2.act = ACT.chat; }
};
EXTRAS.wear = (R, b, g) => {
  const w = R.w, d = R.d, zN = -d / 2 + .14;
  sign(R, 'THE ATELIER', 1.0, Y + 1.15, zN + .02, .9, .22, '#d2b48c');
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) b.box(.12, .12, .01, ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'denim', 'red'][(i * 3 + j) % 8], -1.2 + i * .14, Y + .65 + j * .14, zN + .016);
  b.box(.7, .04, .25, 'white', -.9, Y + .7, .85); b.box(.04, .6, .04, 'metal', -1.15, Y + .35, .85); b.box(.04, .6, .04, 'metal', -.65, Y + .35, .85);
  desk(b, .75, 1.35, .9, .5, 'oak'); b.box(.3, .22, .15, 'white', .75, Y + .76, 1.3);
  pool(R, .15, -.45, 2.6, 0xffd9a8, .2); pool(R, .75, 1.4, 1.4, 0xffd9a8, .12);
  if (MORE) { const c = person(g, 0x6b5cc9, 1.0, .95, { ry: -Math.PI / 2 }); c.act = ACT.idle; const s2 = person(g, 0xd9c7a7, .75, 1.8, { ry: Math.PI }); s2.act = ACT.sew; }
};
EXTRAS.kids = (R, b, g) => {
  const w = R.w, d = R.d, zN = -d / 2 + .14;
  sign(R, 'LITTLE WORLD', -1.55, Y + 1.15, zN + .02, 1.0, .26, '#9db4c8');
  b.add(new THREE.ConeGeometry(.5, 1.0, 6), 'cream', -1.55, Y + .5, -1.0);
  b.cyl(.55, .55, .14, 'c4', -1.6, Y + .07, 1.1);
  for (let i = 0; i < 14; i++) b.sph(.07, 'c' + (1 + i % 6), -1.6 + Math.cos(i * 2.1) * .35 * ((i % 3) / 3 + .3), Y + .17, 1.1 + Math.sin(i * 2.1) * .35 * ((i % 3) / 3 + .3));
  b.sph(.13, 'c2', .75, Y + .17, .85, 1); b.sph(.07, 'c2', .75, Y + .35, .85, 1); b.sph(.12, 'c1', -.15, Y + .5, .3, 1.1);
  [-.4, .5, 1.2].forEach(x => { const s = sprite(0xd8c08a, .35, .9); s.position.set(x, Y + 1.15 - Math.abs(x) * .1, .6); g.add(s); });
  pool(R, .1, .5, 3.2, 0xd8c08a, .17); pool(R, .5, -.6, 2.0, 0x7f9bb8, .14);
  if (MORE) { const h2 = person(g, 0xb98577, .5, -.9, { ry: 0 }); h2.act = ACT.present; }
};
EXTRAS.founder = (R, b, g) => {
  const w = R.w, d = R.d;
  b.box(1.5, .012, 2.0, 'red', 0, Y + .006, .1);
  b.box(.3, .5, .3, 'woodDark', .6, Y + .25, -.9); b.sph(.17, 'blue', .6, Y + .68, -.9, 1);
  b.box(.5, .3, .9, 'denim', .5, Y + .15, 1.4); b.box(.12, .4, .9, 'denim', .72, Y + .35, 1.4);
  b.cyl(.02, .02, 1.2, 'metal', -.55, Y + .6, 1.4); b.cyl(.14, .1, .2, 'lamp', -.55, Y + 1.25, 1.4);
  for (let i = 0; i < 4; i++) b.box(.07, .1, .07, 'lamp', -w / 2 + .3, Y + .76 + (i % 2) * .28, -.3 + i * .35);
  pool(R, 0, -.2, 2.6, 0xffd9a0, .2); pool(R, -.55, 1.4, 1.2, 0xffd9a0, .16);
  const partner = person(g, 0x4a5e80, .86, -.05, { ry: -1.35 }); partner.act = ACT.chat;
  R.founderP = people.find(P => P.g.parent === g && Math.abs(P.g.position.z + .35) < .01); if (R.founderP) R.founderP.act = ACT.chat;
};

ROOMS.forEach(buildRoom);

if (!MOBILE) rooms.forEach(R => { const l = new THREE.PointLight(LAMPC[R.def.id], 4.5, 11, 1.4); l.position.set(R.cx, 1.55, R.cz); scene.add(l); });

/* real 3D food: Tiny Treats baked goods (CC0, see assets/models/tiny-treats/CREDITS.txt) */
const FOOD_DIR = '../../assets/models/tiny-treats/', gltf = new GLTFLoader(), foodCache = {};
const loadFood = n => foodCache[n] ??= new Promise(res => gltf.load(FOOD_DIR + n + '.gltf', o => res(o.scene), undefined, () => res(null)));
async function placeFood(R, list) {
  for (const [name, size, x, y, z, ry = 0] of list) {
    const src = await loadFood(name); if (!src) continue;
    const m = src.clone(true), box = new THREE.Box3().setFromObject(m), sz = box.getSize(new V3()); m.scale.setScalar(size / Math.max(sz.x, sz.y, sz.z));
    box.setFromObject(m); const c = box.getCenter(new V3()); m.position.set(-c.x, -box.min.y, -c.z);
    const pv = new THREE.Group(); pv.position.set(x, y, z); pv.rotation.y = ry; pv.add(m); R.g.add(pv);
  }
}
{
  const bun = rooms.find(r => r.def.id === 'bun'), zr = -bun.d / 2 + .14 + .4, rx = bun.w / 2 - .55;
  placeFood(bun, [
    ['croissant', .22, -1.75, Y + .9, 1.0, .4], ['croissant', .22, -1.45, Y + .9, 1.0, -.3], ['croissant', .22, -1.15, Y + .9, 1.0, .9],
    ['cinnamon_roll', .17, -1.6, Y + .9, 1.3], ['donut_pink', .17, -1.25, Y + .9, 1.3], ['muffin', .17, -.9, Y + .9, 1.3], ['cupcake', .17, -.62, Y + .9, 1.3],
    ['cake_birthday', .5, .05, Y + .9, 1.2], ['cake_strawberry', .44, .72, Y + .9, 1.2],
    ['cupcake', .2, 1.0, Y + .98, 1.0], ['pie_apple', .3, 1.4, Y + .98, 1.0, .5],
    ['bread_roll', .18, rx - .12, Y + .315, zr], ['bread_roll', .18, rx + .1, Y + .315, zr], ['bread_roll', .18, rx - .12, Y + .635, zr], ['bread_roll', .18, rx + .1, Y + .635, zr], ['croissant', .2, rx, Y + .955, zr, .3],
    ['baguette', .75, .15, Y + .66, -1.1, .3], ['bread', .36, -.35, Y + .66, -1.0, .5], ['croissant', .2, .5, Y + .66, -.8, 1.0], ['croissant', .2, .2, Y + .66, -.72, -.5],
  ]);
}

/* the core in the atrium: a glowing crystal, wire shell and halo, with streams of light into each inbox */
const coreG = new THREE.Group(); coreG.position.copy(CORE); world.add(coreG);
const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(.5, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(.85, .9, 1.0), toneMapped: false })); coreMesh.position.y = 1.8; coreG.add(coreMesh);
const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.8, 1)), new THREE.LineBasicMaterial({ color: 0xaabfff, transparent: true, opacity: .5 })); shell.position.y = 1.8; coreG.add(shell);
const coreHalo = sprite(0x9fd2ff, 2.2, .07); coreHalo.position.y = 1.8; coreG.add(coreHalo);
const ringFloor = new THREE.Mesh(new THREE.TorusGeometry(1.05, .03, 8, 64), base(new THREE.Color(.75, .9, 1.2))); ringFloor.rotation.x = PI / 2; ringFloor.position.y = .1; coreG.add(ringFloor);
const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(.95, 1.05, .64, 32), std(0x1a1a20, { metalness: .6, roughness: .35 })); pedestal.position.y = -.13; coreG.add(pedestal);
const SP = MOBILE ? 14 : 30, sPos = new Float32Array(rooms.length * SP * 3), sCol = new Float32Array(rooms.length * SP * 3);
const curves = rooms.map((R, i) => {
  const p0 = new V3(CORE.x, 1.8, CORE.z), p2 = new V3(R.cx, .9, R.cz);
  const c = new V3((p0.x + p2.x) / 2, 2.6, (p0.z + p2.z) / 2); const col = new THREE.Color(R.def.color);
  for (let j = 0; j < SP; j++) sCol.set([col.r, col.g, col.b], (i * SP + j) * 3);
  return { p0, c, p2 };
});
const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
const streams = new THREE.Points(sGeo, new THREE.PointsMaterial({ size: 7, sizeAttenuation: false, map: GLOW, vertexColors: true, transparent: true, opacity: .32, depthWrite: false, blending: THREE.AdditiveBlending }));
streams.frustumCulled = false; streams.visible = false; world.add(streams);

/* ---------- camera stops: one per article, computed from each room's bounds ---------- */
const YAW = .5, EL = .78;
const DIR = new V3(Math.sin(YAW) * Math.cos(EL), Math.sin(EL), Math.cos(YAW) * Math.cos(EL)).normalize();
const FWD = DIR.clone().negate(), RIGHT = new V3().crossVectors(FWD, new V3(0, 1, 0)).normalize(), UPV = new V3().crossVectors(RIGHT, FWD).normalize();
const roomById = Object.fromEntries(rooms.map(r => [r.def.id, r]));
const stops = stopEls.map(el => {
  const id = el.dataset.room, R = roomById[id];
  const box = R ? { cx: R.cx, cz: R.cz + (id === 'founder' ? .45 : 0), w: R.w + .8, d: id === 'founder' ? 2.6 : R.d + .8, h: 1.9 } : { cx: 0, cz: 0, w: FW, d: FD, h: .4 };
  let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9; const c = new V3(box.cx, box.h / 2, box.cz);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [0, box.h]) {
    const p = new V3(box.cx + sx * box.w / 2, y, box.cz + sz * box.d / 2).sub(c); const a = p.dot(RIGHT), b = p.dot(UPV);
    mnx = Math.min(mnx, a); mxx = Math.max(mxx, a); mny = Math.min(mny, b); mxy = Math.max(mxy, b);
  }
  return { id, c, box, ex: mxx - mnx, ey: mxy - mny, H: 1, fx: .5, fy: .5 };
});
let aspect = 1, layout = { aw: 1, ah: 1, fx: .5, fy: .5 };
/* each stop has its own yaw and elevation: a low establishing wide, steeper moves into the rooms, a gentler end on the founder */
const POSE = { intro: [.62, .16], founder: [.4, .62] }, DEFPOSE = [.5, .72];
const dirOf = (yaw, el) => new V3(Math.sin(yaw) * Math.cos(el), Math.sin(el), Math.cos(yaw) * Math.cos(el));
function fit() {
  const w = innerWidth, h = innerHeight; aspect = w / h;
  renderer.setSize(w, h, false); camera.aspect = aspect; camera.updateProjectionMatrix();
  const phone = w <= 760, th = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  layout = phone ? { aw: .96, ah: .5, fx: .5, fy: .36 } : { aw: .56, ah: .8, fx: .69, fy: .55 };
  stops.forEach(st => {
    const [yaw, el] = (st.id === 'intro' && phone) ? [.62, .42] : (POSE[st.id] || DEFPOSE), d = dirOf(yaw, el), fwd = d.clone().negate(), right = new V3().crossVectors(fwd, new V3(0, 1, 0)).normalize(), up = new V3().crossVectors(right, fwd).normalize();
    const bx = st.box, c = st.c; let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9, mnz = 1e9, mxz = -1e9;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [0, bx.h]) {
      const p = new V3(bx.cx + sx * bx.w / 2, y, bx.cz + sz * bx.d / 2).sub(c), A = p.dot(right), B = p.dot(up), Z = p.dot(fwd);
      mnx = Math.min(mnx, A); mxx = Math.max(mxx, A); mny = Math.min(mny, B); mxy = Math.max(mxy, B); mnz = Math.min(mnz, Z); mxz = Math.max(mxz, Z);
    }
    const L = st.id === 'intro' ? { ...layout, ah: layout.ah * .8, aw: phone ? layout.aw * .9 : layout.aw * 1.14, fx: phone ? .5 : .67, fy: phone ? .74 : .8 } : layout;
    const dist = Math.max((mxy - mny) / L.ah, (mxx - mnx) / (L.aw * aspect)) / (2 * th) * 1.06 + (mxz - mnz) / 2;
    const Wv = 2 * dist * th * aspect, Hv = 2 * dist * th;
    st.yaw = yaw; st.el = el; st.dist = dist;
    st.look = c.clone().addScaledVector(right, -(L.fx - .5) * Wv).addScaledVector(up, (L.fy - .5) * Hv);
  });
}
const tgt = new V3(), lookV = new V3();
let jump = null;   /* { from: {look,dist,yaw,el}, to: stop, t0, ms } */
const curPose = { look: new V3(), dist: 1, yaw: 0, el: 0 };
function applyPose(s) {
  if (jump) {
    const u = clamp((performance.now() - jump.t0) / jump.ms), e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, a = jump.from, b = jump.to;
    lookV.lerpVectors(a.look, b.look, e);
    const dist = Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), e)) * (1 + .12 * Math.sin(e * PI)), d = dirOf(lerp(a.yaw, b.yaw, e), lerp(a.el, b.el, e));
    camera.position.copy(lookV).addScaledVector(d, dist); camera.lookAt(lookV);
    curPose.look.copy(lookV); curPose.dist = dist; curPose.yaw = lerp(a.yaw, b.yaw, e); curPose.el = lerp(a.el, b.el, e);
    if (u >= 1) jump = null; return;
  }
  const i = Math.min(N - 2, Math.floor(clamp(s, 0, N - 1))), f = clamp(s - i, 0, 1), g = sstep(.2, .8, f), a = stops[i], b = stops[i + 1];
  lookV.lerpVectors(a.look, b.look, g);
  const dist = Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), g)), d = dirOf(lerp(a.yaw, b.yaw, g), lerp(a.el, b.el, g));
  camera.position.copy(lookV).addScaledVector(d, dist); camera.lookAt(lookV);
  curPose.look.copy(lookV); curPose.dist = dist; curPose.yaw = lerp(a.yaw, b.yaw, g); curPose.el = lerp(a.el, b.el, g);
}

/* ---------- hook 1: the guide light ----------
   A light travels the whole tour on a faint path over the floor, one step ahead of the scroll,
   so the eye always has somewhere to go next. It takes the colour of the business it is above and,
   on a laptop, leans toward the cursor. */
const gPts = stops.map((s, i) => i === 0 ? new V3(CORE.x + 2.2, 2.3, CORE.z + 1.2) : new V3(s.c.x + RIGHT.x * s.ex * .32, 2.7, s.c.z + RIGHT.z * s.ex * .32));
const gCurve = new THREE.CatmullRomCurve3(gPts, false, 'catmullrom', .5);
/* The hook: a chess knight. One calm object that travels the whole tour, hopping from business to business
   and turning to face where it is going, and settling to face the visitor when it rests. */
const knight = new THREE.Group(); scene.add(knight);
{
  const mat = new THREE.MeshStandardMaterial({ color: 0xe4ded2, roughness: .32, metalness: .06 });
  const sil = new THREE.Shape();
  [[.30, 0], [.27, .28], [.31, .54], [.23, .80], [.06, .97], [0, 1.09], [-.07, .98], [-.30, .85], [-.47, .63], [-.41, .52], [-.22, .56], [-.10, .49], [-.21, .33], [-.31, .12], [-.31, 0]].forEach(([x, y], i) => i ? sil.lineTo(x, y) : sil.moveTo(x, y));
  const body = new THREE.ExtrudeGeometry(sil, { depth: .26, bevelEnabled: true, bevelThickness: .07, bevelSize: .07, bevelSegments: 4, curveSegments: 6 });
  body.translate(0, 0, -.13);
  const head = new THREE.Mesh(body, mat); head.scale.setScalar(.95); head.position.y = .28; head.rotation.y = PI / 2; head.name = 'body';
  const prof = [[.0, 0], [.4, 0], [.43, .04], [.4, .09], [.3, .14], [.26, .22], [.33, .25], [.33, .29], [.0, .29]].map(([r, y]) => new THREE.Vector2(r, y));
  const base = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), mat);
  knight.add(base, head); knight.scale.setScalar(.78);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: .85 })); sh.scale.set(1.2, 1, 1.2); sh.name = 'shadow'; scene.add(sh); knight.userData.sh = sh;
}
knight.visible = false; knight.userData.sh.visible = false;
const gHead = new V3(), gTmp = new V3(), gOff = new V3(), gTan = new V3(), gPlane = new THREE.Plane(new V3(0, 1, 0), 0);
let gpos = 0, gYaw = 0, gLand = 0;
const restYaw = Math.atan2(DIR.x, DIR.z) - .5;
const angLerp = (a, b, t) => { let d = ((b - a + PI) % (PI * 2) + PI * 2) % (PI * 2) - PI; return a + d * t; };
function guideUpdate(s, T, dt) {
  return;   /* knight removed */
  const u = clamp(s / (N - 1)), prev = gpos;
  gpos += (clamp(u + .015) - gpos) * (isNaN(PIN) ? Math.min(1, dt * 3.2) : 1);
  gCurve.getPoint(clamp(gpos), gHead); gCurve.getTangent(clamp(gpos), gTan);
  const seg = gpos * (N - 1), f = seg - Math.floor(seg), moving = clamp(Math.abs(gpos - prev) / Math.max(dt, .001) * 5);
  const hop = Math.sin(clamp(f) * PI) * moving;
  /* lean a little toward the cursor on laptops */
  if (fine && Math.abs(ptr.x) < 1.5) {
    gPlane.constant = -gHead.y; ray.setFromCamera(ptr, camera);
    if (ray.ray.intersectPlane(gPlane, gTmp)) { gTmp.sub(gHead); const l = gTmp.length(); if (l > 1.2) gTmp.multiplyScalar(1.2 / l); gOff.lerp(gTmp.multiplyScalar(.2), Math.min(1, dt * 4)); }
  } else gOff.multiplyScalar(1 - Math.min(1, dt * 4));
  knight.position.set(gHead.x + gOff.x, gHead.y + Math.sin(T * 1.4) * .04 + hop * .55, gHead.z + gOff.z);
  gYaw = angLerp(gYaw, angLerp(restYaw, Math.atan2(gTan.x, gTan.z), clamp(moving * 1.4)), Math.min(1, dt * 6));
  knight.rotation.y = gYaw; knight.rotation.z = -hop * .12;
  const sh = knight.userData.sh; sh.position.set(knight.position.x, GY + .02, knight.position.z); sh.material.opacity = .6 - hop * .25; sh.scale.setScalar(1.2 - hop * .2);
}

/* ---------- hook 2: the surround ----------
   Instead of an empty dark void the HQ stands in a lit plaza: paving, glowing edge, light bollards,
   trees, a glass facade on the two far sides, a ring road with moving traffic, and a city skyline. */
const GY = -.56;
{
  const paving = tex(256, 256, (x, W, H) => { x.fillStyle = '#17181e'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(255,255,255,.075)'; x.lineWidth = 2; x.strokeRect(1, 1, W - 2, H - 2);
    x.strokeStyle = 'rgba(255,255,255,.03)'; x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.moveTo(0, H / 2); x.lineTo(W, H / 2); x.stroke(); for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(255,255,255,${rnd() * .03})`; x.fillRect(rnd() * W, rnd() * H, 2, 2); } }, 330);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000).rotateX(-PI / 2), std(0xffffff, { map: paving, roughness: .55, metalness: .22, envMapIntensity: .8 })); ground.position.y = GY; scene.add(ground);
  const hx = FW / 2 + 1.3, hz = FD / 2 + 1.3, edge = base(new THREE.Color(.46, .42, .32));
  [[0, -hz, hx * 2, .06], [0, hz, hx * 2, .06]].forEach(([x, z, w, t]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, .02, t), edge); m.position.set(x, GY + .012, z); scene.add(m); });
  [[-hx, 0], [hx, 0]].forEach(([x, z]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(.06, .02, hz * 2), edge); m.position.set(x, GY + .012, z); scene.add(m); });

  /* light bollards: poles + lamp heads merged, glow as one point cloud */
  const bx = FW / 2 + 2.2, bz = FD / 2 + 2.2, bp = [];
  for (let x = -bx; x <= bx + .01; x += 5.2) { bp.push([x, -bz], [x, bz]); } for (let z = -bz + 5.2; z < bz - .01; z += 5.2) { bp.push([-bx, z], [bx, z]); }
  const poles = [], heads = [], gl = new Float32Array(bp.length * 3);
  bp.forEach(([x, z], i) => { const p = new THREE.CylinderGeometry(.045, .06, .7, 8); p.translate(x, GY + .35, z); poles.push(p); const h = new THREE.CylinderGeometry(.085, .085, .08, 10); h.translate(x, GY + .74, z); heads.push(h); gl[i * 3] = x; gl[i * 3 + 1] = GY + .74; gl[i * 3 + 2] = z; });
  scene.add(new THREE.Mesh(mergeGeometries(poles), std(0x23242c, { roughness: .5, metalness: .5 })));
  scene.add(new THREE.Mesh(mergeGeometries(heads), base(new THREE.Color(1.8, 1.55, 1.2))));
  const glg = new THREE.BufferGeometry(); glg.setAttribute('position', new THREE.BufferAttribute(gl, 3));
  scene.add(new THREE.Points(glg, new THREE.PointsMaterial({ size: 16, sizeAttenuation: false, map: GLOW, color: 0xffd9a0, transparent: true, opacity: .28, depthWrite: false, blending: THREE.AdditiveBlending })));

  /* trees */
  const trunks = [], leaves = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
    const x = sx * (FW / 2 + 3.6) + (i % 3) * .4, z = sz * (FD / 2 + 3.4) + (i % 2) * .5;
    const t = new THREE.CylinderGeometry(.1, .15, 1.1, 8); t.translate(x, GY + .55, z); trunks.push(t);
    const a = new THREE.IcosahedronGeometry(.85, 1); a.scale(.62, 1.9, .62); a.translate(x, GY + 2.1, z); leaves.push(a); const b2 = new THREE.IcosahedronGeometry(.6, 1); b2.scale(.5, 1.5, .5); b2.translate(x + .05, GY + 3.2, z - .03); leaves.push(b2);
  });
  scene.add(new THREE.Mesh(mergeGeometries(trunks), std(0x2b2018, { roughness: .9 })));
  scene.add(new THREE.Mesh(mergeGeometries(leaves), std(0x1a2e26, { roughness: .9, flatShading: true })));

  /* glass facade on the two far sides, so the floor reads as a building */
  const GH = 2.6, glassM = new THREE.MeshStandardMaterial({ color: 0x9fd2ff, transparent: true, opacity: .09, roughness: .1, metalness: .3, depthWrite: false, side: THREE.DoubleSide });
  const paneA = new THREE.Mesh(new THREE.PlaneGeometry(FD + .2, GH).rotateY(PI / 2), glassM); paneA.position.set(-FW / 2 - .05, -.45 + GH / 2, 0); scene.add(paneA);
  const paneB = new THREE.Mesh(new THREE.PlaneGeometry(FW + .2, GH), glassM); paneB.position.set(0, -.45 + GH / 2, -FD / 2 - .05); scene.add(paneB);
  const mull = [], rail = [];
  for (let z = -FD / 2; z <= FD / 2 + .01; z += 1.725) { const m = new THREE.BoxGeometry(.07, GH, .07); m.translate(-FW / 2 - .05, -.45 + GH / 2, z); mull.push(m); }
  for (let x = -FW / 2; x <= FW / 2 + .01; x += 1.62) { const m = new THREE.BoxGeometry(.07, GH, .07); m.translate(x, -.45 + GH / 2, -FD / 2 - .05); mull.push(m); }
  [-.45 + GH, -.45 + .02].forEach(y => { const a = new THREE.BoxGeometry(.06, .05, FD + .2); a.translate(-FW / 2 - .05, y, 0); rail.push(a); const b3 = new THREE.BoxGeometry(FW + .2, .05, .06); b3.translate(0, y, -FD / 2 - .05); rail.push(b3); });
  scene.add(new THREE.Mesh(mergeGeometries(mull), std(0x1c1d24, { roughness: .4, metalness: .6 })));
  scene.add(new THREE.Mesh(mergeGeometries(rail), base(new THREE.Color(.55, .5, .38))));

  /* ring road */
  const rx = FW / 2 + 5.6, rz = FD / 2 + 5.4, rw = 2.1, asph = std(0x101116, { roughness: .8 }), roads = [];
  [[0, -rz, rx * 2 + rw, rw], [0, rz, rx * 2 + rw, rw]].forEach(([x, z, w, d]) => { const g = new THREE.BoxGeometry(w, .02, d); g.translate(x, GY + .01, z); roads.push(g); });
  [[-rx, 0], [rx, 0]].forEach(([x, z]) => { const g = new THREE.BoxGeometry(rw, .02, rz * 2 - rw); g.translate(x, GY + .01, z); roads.push(g); });
  const dashes = []; for (let x = -rx; x < rx; x += 1.6) { [-rz, rz].forEach(z => { const g = new THREE.BoxGeometry(.7, .022, .05); g.translate(x + .4, GY + .015, z); dashes.push(g); }); }
  for (let z = -rz + .8; z < rz; z += 1.6) { [-rx, rx].forEach(x => { const g = new THREE.BoxGeometry(.05, .022, .7); g.translate(x, GY + .015, z + .4); dashes.push(g); }); }
  const CAR = MOBILE ? 16 : 30, carPos = new Float32Array(CAR * 3), carCol = new Float32Array(CAR * 3), carU = [], carDir = [], carSp = [];
  for (let i = 0; i < CAR; i++) { carU.push(rnd()); carDir.push(i % 2 ? 1 : -1); carSp.push(.012 + rnd() * .012); const w = carDir[i] > 0 ? [1.6, 1.4, 1.1] : [1.5, .25, .2]; carCol.set(w, i * 3); }
  const carG = new THREE.BufferGeometry(); carG.setAttribute('position', new THREE.BufferAttribute(carPos, 3)); carG.setAttribute('color', new THREE.BufferAttribute(carCol, 3));
  const cars = new THREE.Points(carG, new THREE.PointsMaterial({ size: 20, sizeAttenuation: false, map: GLOW, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); cars.frustumCulled = false; cars.visible = false;
  const per = 2 * (2 * rx + 2 * rz);
  const loop = (u, off) => { let d = ((u % 1) + 1) % 1 * per; const wx = 2 * rx, wz = 2 * rz;
    if (d < wx) return [-rx + d, -rz + off]; d -= wx; if (d < wz) return [rx - off, -rz + d]; d -= wz; if (d < wx) return [rx - d, rz - off]; d -= wx; return [-rx + off, rz - d]; };
  surroundUpdate = T => { return; for (let i = 0; i < CAR; i++) { const u = RM ? carU[i] : carU[i] + T * carSp[i] * carDir[i], [x, z] = loop(carDir[i] > 0 ? u : 1 - u, carDir[i] > 0 ? -.45 : .45); carPos[i * 3] = x; carPos[i * 3 + 1] = GY + .09; carPos[i * 3 + 2] = z; } carG.attributes.position.needsUpdate = true; };

  /* skyline: layered towers fading into haze, kept behind and beside the floor as seen from the establishing shot */
  const win = tex(128, 256, (x, W, H) => { x.fillStyle = '#000'; x.fillRect(0, 0, W, H); for (let r = 0; r < 32; r++) for (let c = 0; c < 8; c++) if (rnd() < .27) { const warm = rnd() < .94; x.fillStyle = warm ? `rgba(255,${180 + Math.floor(rnd() * 50)},${110 + Math.floor(rnd() * 60)},${.5 + rnd() * .5})` : `rgba(150,190,255,${.4 + rnd() * .5})`; x.fillRect(c * 16 + 3, r * 8 + 2, 10, 4); } }, 1);
  const fx = Math.sin(.62), fz = Math.cos(.62), sx = fz, sz = -fx, bl = [], tips = [];
  const tower = (x, z, w, d, h, y0) => {
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, ou = rnd(), ov = rnd();
    for (let k = 0; k < uv.count; k++) { const face = Math.floor(k / 4), horiz = (face === 0 || face === 1) ? d : w; uv.setXY(k, ou + uv.getX(k) * horiz / 13, ov + uv.getY(k) * h / 20); }
    g.translate(x, y0 + h / 2, z); bl.push(g);
  };
  for (let i = 0, tries = 0; i < 150 && tries < 4000; tries++) {
    const r = 120 + rnd() * 220, a = rnd() * PI * 2, x = Math.cos(a) * r * 1.2, z = Math.sin(a) * r, along = x * fx + z * fz, side = x * sx + z * sz;
    if (!(along < -14 || Math.abs(side) > 46)) continue; if (Math.abs(x) < rx + 6 && Math.abs(z) < rz + 6) continue;
    const slim = rnd() < .45, w = slim ? 5 + rnd() * 5 : 8 + rnd() * 14, d = slim ? 5 + rnd() * 5 : 8 + rnd() * 14, h = 9 + Math.pow(rnd(), 1.6) * (14 + r * .22);
    tower(x, z, w, d, h, GY);
    let top = GY + h;
    if (h > 26 && rnd() < .6) { const h2 = h * (.18 + rnd() * .15); tower(x, z, w * .62, d * .62, h2, top); top += h2; }
    if (h > 34 && rnd() < .5) { const sp = new THREE.CylinderGeometry(.12, .25, 7, 6); sp.translate(x, top + 3.5, z); bl.push(sp); top += 7; }
    if (h > 28) tips.push(x, top + .6, z);
    i++;
  }
  scene.add(new THREE.Mesh(mergeGeometries(bl), new THREE.MeshStandardMaterial({ color: 0x0a0c16, emissive: 0xffffff, emissiveMap: win, emissiveIntensity: .62, roughness: .8 })));
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tips, 3));
  scene.add(new THREE.Points(tg, new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, color: 0xff5040, map: GLOW, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending })));
  /* avenue: leading lines from the plaza toward the skyline, with lamps and slow traffic */
  {
    const th = PI + .62, dx = -fx, dz = -fz, perp = [sx, sz], A0 = 20, LEN = 320;
    const road = new THREE.Mesh(new THREE.PlaneGeometry(10, LEN).rotateX(-PI / 2), std(0x0d0e14, { roughness: .5, metalness: .3 })); road.rotation.y = th; road.position.set(dx * (A0 + LEN / 2), GY + .012, dz * (A0 + LEN / 2)); scene.add(road);
    const dashes = [], lamps = [];
    for (let t = A0 + 4; t < A0 + LEN; t += 7) { const g = new THREE.BoxGeometry(.18, .02, 2.8); g.rotateY(th); g.translate(dx * t, GY + .02, dz * t); dashes.push(g); }
    for (let t = A0 + 6; t < A0 + LEN; t += 16) for (const o of [-6.2, 6.2]) lamps.push(dx * t + perp[0] * o, GY + 2.6, dz * t + perp[1] * o);
    scene.add(new THREE.Mesh(mergeGeometries(dashes), base(new THREE.Color(.8, .76, .64))));
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lamps, 3));
    scene.add(new THREE.Points(lg, new THREE.PointsMaterial({ size: 18, sizeAttenuation: false, map: GLOW, color: 0xffd9a0, transparent: true, opacity: .75, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })));
    const NC = MOBILE ? 14 : 30, cp = new Float32Array(NC * 3), cc = new Float32Array(NC * 3), cu = [], cd = [], cv = [];
    for (let i = 0; i < NC; i++) { cu.push(rnd()); cd.push(i % 2 ? 1 : -1); cv.push(.012 + rnd() * .012); cc.set(cd[i] > 0 ? [1.4, 1.25, .9] : [1.4, .2, .15], i * 3); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3)); cg.setAttribute('color', new THREE.BufferAttribute(cc, 3));
    const cm = new THREE.Points(cg, new THREE.PointsMaterial({ size: 9, sizeAttenuation: false, map: GLOW, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); cm.frustumCulled = false; scene.add(cm);
    surroundUpdate = T => { for (let i = 0; i < NC; i++) { const u = ((RM ? cu[i] : cu[i] + T * cv[i] * cd[i]) % 1 + 1) % 1, t = A0 + u * LEN, o = cd[i] * 1.8; cp[i * 3] = dx * t + perp[0] * o; cp[i * 3 + 1] = GY + .12; cp[i * 3 + 2] = dz * t + perp[1] * o; } cg.attributes.position.needsUpdate = true; };
  }
  scene.fog = new THREE.Fog(0x1d2440, 90, 420);
}
function surroundUpdate() {}

/* ---------- panels, dots, scroll ---------- */
const dotsEl = $('#dots');
dotsEl.innerHTML = stopEls.map((el, i) => `<button type="button" aria-label="${(el.querySelector('h1,h2') || el).textContent.trim()}"></button>`).join('');
const dotBtns = [...dotsEl.children];
const vh = () => innerHeight;
function goTo(i) {
  i = clamp(Math.round(i), 0, N - 1);
  const st = stops[i], cur = Math.round(sNow);
  if (i === cur && !jump) return;
  jump = RM ? null : { from: { look: curPose.look.clone(), dist: curPose.dist, yaw: curPose.yaw, el: curPose.el }, to: st, t0: performance.now(), ms: 1150 };
  jumpTo = i; sNow = i;
  { const R = roomById[st.id], sw = document.getElementById('sweep'); if (sw && !RM) { sw.style.setProperty('--c', R ? hexCss(R.def.color) : '#ffffff'); sw.classList.remove('go'); void sw.offsetWidth; sw.classList.add('go'); } }
  document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, i * vh());
}
let jumpTo = -1;
dotBtns.forEach((b, i) => b.addEventListener('click', () => goTo(i)));
stopEls.forEach(el => el.setAttribute('inert', ''));
const nowEls = stopEls.map(el => el.querySelector('.now span'));
stopEls.forEach(el => { const R = roomById[el.dataset.room]; if (R) el.style.setProperty('--c', hexCss(R.def.color)); });
rooms.forEach(R => { R.stopIndex = stops.findIndex(s => s.id === R.def.id); });
const enterLinks = document.querySelectorAll('.enter[href^="#"]');
enterLinks.forEach(a => a.addEventListener('click', e => { e.preventDefault(); a.dataset.pressed = '1'; }));
let curIdx = -1;
function updatePanels(s) {
  const near = Math.round(clamp(s, 0, N - 1)), d = Math.abs(s - near);
  const op = 1 - sstep(.1, .38, d);
  stopEls.forEach((el, i) => {
    const on = i === near;
    el.style.setProperty('--o', on ? op.toFixed(3) : 0);
    el.style.setProperty('--ty', on ? `${((s - near) * 60).toFixed(1)}px` : '0px');
    el.classList.toggle('cur', on && op > .4);
    if (on && op > .4) el.removeAttribute('inert'); else el.setAttribute('inert', '');
  });
  if (near !== curIdx) { curIdx = near; dotBtns.forEach((b, i) => i === near ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')); }
}
function updateFlow(t) {
  const R = curIdx >= 0 ? roomById[stopEls[curIdx].dataset.room] : null; if (!R) return;
  const n = NOW[R.def.id]; if (n && nowEls[curIdx]) { const txt = n[Math.floor(t / 7) % n.length]; if (nowEls[curIdx].textContent !== txt) nowEls[curIdx].textContent = txt; }
}

/* ---------- hover (laptop) and tap (phone) ---------- */
const tip = $('#tip'), ray = new THREE.Raycaster(), ptr = new THREE.Vector2(9, 9);
let hovered = null, fine = matchMedia('(hover: hover) and (pointer: fine)').matches, px = 0, py = 0;
function pick() { ray.setFromCamera(ptr, camera); const h = ray.intersectObjects(hitBoxes, false)[0]; return h ? rooms[h.object.userData.room] : null; }
addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); px = e.clientX; py = e.clientY; });
addEventListener('pointerleave', () => ptr.set(9, 9));
canvas.addEventListener('click', e => {
  ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1));
  ray.setFromCamera(ptr, camera);
  const ph = ray.intersectObjects(peopleHits, false)[0], wh = ray.intersectObjects(workHits, false)[0];
  if (ph && (!wh || ph.distance < wh.distance)) { speak(ph.object.userData.person); return; }
  if (wh) { openWork(wh.object.userData.work); return; }
  hideBubble(); const R = pick(); if (R && R.stopIndex >= 0) goTo(R.stopIndex);
});

/* what people say when you click them (placeholder lines until the client supplies real ones) */
const SAY = {
  alven: ['Reviewing the autumn launch numbers.', 'Reach is up on last week. Good sign.', 'Sending the new creatives to the client.', 'Planning next month’s content.'],
  fovo: ['Checking today’s shots on the monitor.', 'Light is set. One more take.', 'Retouching the portrait series.', 'Prints go out this afternoon.'],
  bun: ['First batch is out of the oven.', 'Dough needs ten more minutes.', 'Cake order for six o’clock.', 'Croissants are still warm.'],
  soft: ['Shipping a fix to production.', 'Reviewing a pull request.', 'Tests are green.', 'Checking the servers.'],
  wear: ['Pinning the hem on this jacket.', 'Choosing fabric for autumn.', 'Fitting at three.', 'Finishing the buttonholes.'],
  kids: ['Reading the next story aloud.', 'Trying the new game with the kids.', 'Drawing the picture for page six.', 'Recording a learning video.'],
  founder: ['Every venture earns its place here.', 'Reviewing the plan for next year.', 'I walk the floor most mornings.'],
};
const bub = document.getElementById('bubble'); let bubP = null, bubT = 0;
const sayIdx = new Map();
function speak(P) {
  const R = rooms.find(r => r.g === P.g.parent), id = R ? R.def.id : 'alven', list = SAY[id] || SAY.alven, i = ((sayIdx.get(P) ?? Math.floor(rnd() * list.length)) + 1) % list.length; sayIdx.set(P, i);
  bub.innerHTML = `<small>${R ? R.def.name : ''}</small>${list[i]}`; bub.classList.add('on'); bubP = P; clearTimeout(bubT); bubT = setTimeout(hideBubble, 4200);
}
function hideBubble() { bub.classList.remove('on'); bubP = null; }
const bv = new V3();
function bubbleUpdate() { if (!bubP) return; bubP.g.getWorldPosition(bv); bv.y += 1.45; bv.project(camera); bub.style.left = ((bv.x + 1) / 2 * innerWidth) + 'px'; bub.style.top = ((1 - bv.y) / 2 * innerHeight) + 'px'; }

/* work viewer */
const workEl = document.getElementById('work'), workImg = document.getElementById('workImg'), workCap = document.getElementById('workCap');
function openWork(w) { workImg.src = `https://images.unsplash.com/photo-${w.id}?auto=format&fit=crop&w=1100&q=75`; workCap.textContent = `${w.room} · sample work (placeholder)`; workEl.hidden = false; hideBubble(); }
function closeWork() { workEl.hidden = true; }
document.getElementById('workX').addEventListener('click', closeWork); workEl.addEventListener('click', e => { if (e.target === workEl) closeWork(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeWork(); });

if (!MOBILE) {
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 14, bottom: -14, near: 1, far: 70 }); sun.shadow.bias = -.0005; sun.shadow.normalBias = .03;
  scene.traverse(o => { if (o.isMesh && o.material && !o.material.transparent && !o.material.isMeshBasicMaterial && !o.material.isShaderMaterial) { o.castShadow = true; o.receiveShadow = true; } });
}

/* ---------- the atrium: a quiet fountain ---------- */
coreG.visible = false;
const fount = new THREE.Group(); fount.position.copy(CORE); world.add(fount);
{
  const stone = std(0x34363e, { roughness: .6, metalness: .1 });
  const bas = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, .34, 48), stone); bas.position.y = .17; fount.add(bas);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.4, .018, 6, 64), base(new THREE.Color(.55, .5, .38))); rim.rotation.x = PI / 2; rim.position.y = .345; fount.add(rim);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.32, 48).rotateX(-PI / 2), new THREE.MeshStandardMaterial({ color: 0x08101c, roughness: .04, metalness: .95, envMapIntensity: 1.6 })); water.position.y = .32; fount.add(water);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(.035, .05, 1.1, 12), std(0xb59a6a, { roughness: .35, metalness: .85 })); spout.position.y = .85; fount.add(spout);
  const ripples = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(.96, 1, 64).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: 0xaec4ff, transparent: true, opacity: 0, depthWrite: false })); m.position.y = .325; fount.add(m); return m; });
  const fl = new THREE.PointLight(0xaec4ff, 1.4, 7, 2); fl.position.y = 1.1; fount.add(fl);
  fountainUpdate = T => ripples.forEach((m, i) => { const u = (T * .22 + i / 3) % 1; m.scale.set(.05 + u * 1.28, 1, .05 + u * 1.28); m.material.opacity = (1 - u) * .38 * (u > .02 ? 1 : 0); });
}
function fountainUpdate() {}

/* ---------- real-looking work on the walls (placeholder photographs until the client's own work is supplied) ---------- */
{
  const tl = new THREE.TextureLoader(); tl.setCrossOrigin('anonymous');
  const photo = id => { const m = new THREE.MeshBasicMaterial({ color: 0x3a3c44, toneMapped: false }); tl.load(`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=320&q=60`, t => { t.colorSpace = THREE.SRGBColorSpace; m.map = t; m.color.set(0xe6e6ea); m.needsUpdate = true; }); return m; };
  const hang = (R, id, x, y, z, w, h, ry = 0) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), photo(id)); q.position.set(x, y, z); q.rotation.y = ry; R.g.add(q); q.userData.work = { id, room: R.def.name }; workHits.push(q); };
  const rm = id => rooms.find(r => r.def.id === id), HP = Math.PI / 2;
  { const R = rm('alven'), zN = -R.d / 2 + .14, ids = ['1558655146-9f40138edfeb', '1611162617213-7d7a39e9b1d7', '1432888498266-38ffec3eaf0a', '1517694712202-14dd9538aa97', '1563986768494-4dee2763ff3f', '1494790108377-be9c29b29330'];
    ids.forEach((id, k) => hang(R, id, -1.45 + ((k % 3) - 1) * .46, Y + .95 + (k < 3 ? .2 : -.2), zN + .03, .36, .34)); }
  { const R = rm('fovo'), x = -R.w / 2 + .16 + .02; ['1494790108377-be9c29b29330', '1507003211169-0a1dd7228f2d', '1438761681033-6461ffad8d80', '1500648767791-00dcc994a43e', '1534528741775-53994a69daeb'].forEach((id, i) => hang(R, id, x, Y + .85, -1.2 + i * .62, .4, .5, HP)); }
  { const R = rm('wear'), x = -R.w / 2 + .17; [['1483985988355-763728e1935b', -.7], ['1445205170230-053b83016050', .3], ['1469334031218-e382a71b716b', 1.3]].forEach(([id, z]) => hang(R, id, x, Y + 1.0, z, .5, .7, HP)); }
  { const R = rm('bun'), x = -R.w / 2 + .17; [['1509440159596-0249088772ff', .55], ['1555507036-ab1f4038808a', -2.4], ['1578985545062-69928b1d9587', 2.3]].forEach(([id, z]) => hang(R, id, x, Y + 1.15, z, .5, .4, HP)); }
}

/* ---------- real people: Quaternius rigged mannequin and animations (CC0, see assets/models/people/CREDITS.txt) ----------
   Every capsule figure is swapped for the same rigged mannequin in a matte stone tone, playing a clip that matches what that person was doing:
   sitting and talking at desks, formal walking between rooms, idle talking, working with the hands. */
const TONES = [0xd8d4cc, 0xa7adb5, 0x747c88, 0x4f5560, 0xb8a58c];
const CLIP = { type: 'Sitting_Idle_Loop', sew: 'Interact', knead: 'Interact', present: 'Idle_Talking_Loop', chat: 'Idle_Talking_Loop', pose: 'Idle_Loop', cam: 'Interact', read: 'Idle_Talking_Loop', draw: 'Interact', idle: 'Idle_Loop', bounce: 'Idle_Loop', pin: 'Interact', carry: 'Idle_Loop' };
const ACTNAME = new Map(Object.entries(ACT).map(([k, v]) => [v, k]));
const crowd = [];
if (!MOBILE) new GLTFLoader().load('../../assets/models/people/UAL1_Standard.glb', gl => {
  const clips = Object.fromEntries(gl.animations.map(a => [a.name, a]));
  const probe = new THREE.Box3().setFromObject(gl.scene), height = probe.getSize(new V3()).y || 1.8;
  /* dress: group the triangles by the body part they belong to, so each part can take its own colour */
  let src = null; gl.scene.traverse(o => { if (o.isSkinnedMesh && !src) src = o; });
  const geo = src.geometry, names = src.skeleton.bones.map(b => b.name.toLowerCase()), sI = geo.attributes.skinIndex.array, sW = geo.attributes.skinWeight.array, P3 = geo.attributes.position;
  const reg = new Uint8Array(P3.count); let hMin = 1e9, hMax = -1e9;
  const dom = i => { let b = 0, bw = -1; for (let k = 0; k < 4; k++) if (sW[i * 4 + k] > bw) { bw = sW[i * 4 + k]; b = sI[i * 4 + k]; } return names[b] || ''; };
  for (let i = 0; i < P3.count; i++) if (/head/.test(dom(i))) { hMin = Math.min(hMin, P3.getY(i)); hMax = Math.max(hMax, P3.getY(i)); }
  for (let i = 0; i < P3.count; i++) {
    const n = dom(i);
    reg[i] = /head|neck/.test(n) ? (P3.getY(i) > hMin + (hMax - hMin) * .56 && /head/.test(n) ? 4 : 0)
      : /hand|thumb|index|middle|ring|pinky/.test(n) ? 0 : /foot|ball|toe/.test(n) ? 3 : /thigh|calf|knee|pelvis/.test(n) ? 2 : 1;
  }
  /* which way the figure faces, and where a face would sit on the head (all in bind-pose space, then moved into the head bone) */
  let fwd = 1; { let fz = 0, fn = 0, bz = 0, bn = 0; for (let i = 0; i < P3.count; i++) { const n = dom(i); if (/ball|toe/.test(n)) { fz += P3.getZ(i); fn++; } else if (/foot/.test(n)) { bz += P3.getZ(i); bn++; } } if (fn && bn) fwd = fz / fn > bz / bn ? 1 : -1; }
  const hbb = { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 }; for (let i = 0; i < P3.count; i++) if (/head/.test(dom(i))) { hbb.x0 = Math.min(hbb.x0, P3.getX(i)); hbb.x1 = Math.max(hbb.x1, P3.getX(i)); hbb.z0 = Math.min(hbb.z0, P3.getZ(i)); hbb.z1 = Math.max(hbb.z1, P3.getZ(i)); }
  const headIdx = names.indexOf('head') >= 0 ? names.indexOf('head') : names.findIndex(n => /head/.test(n)), headName = src.skeleton.bones[headIdx].name, inv = src.skeleton.boneInverses[headIdx];
  const hw = hbb.x1 - hbb.x0, hcx = (hbb.x0 + hbb.x1) / 2, eyeY = hMin + (hMax - hMin) * .55, front = fwd > 0 ? hbb.z1 : hbb.z0, er = hw * .1, tl = (x, y, z) => new V3(x, y, z).applyMatrix4(inv);
  const FACE = { er, eyeL: tl(hcx - hw * .2, eyeY, front - fwd * er * .2), eyeR: tl(hcx + hw * .2, eyeY, front - fwd * er * .2), nose: tl(hcx, eyeY - (hMax - hMin) * .13, front + fwd * er * .1),
    browL: tl(hcx - hw * .2, eyeY + er * 2.3, front - fwd * er * .1), browR: tl(hcx + hw * .2, eyeY + er * 2.3, front - fwd * er * .1) };
  const eyeGeo = new THREE.SphereGeometry(er * 1.15, 10, 8), noseGeo = new THREE.SphereGeometry(er * .95, 10, 8), browGeo = new THREE.BoxGeometry(er * 2.8, er * .55, er * .7), eyeMat = new THREE.MeshStandardMaterial({ color: 0x14151a, roughness: .4 });
  const ix = geo.index ? Array.from(geo.index.array) : Array.from({ length: P3.count }, (_, i) => i), buckets = [[], [], [], [], []];
  for (let t = 0; t < ix.length; t += 3) { const a = reg[ix[t]], b = reg[ix[t + 1]], c = reg[ix[t + 2]]; buckets[a === b || a === c ? a : b === c ? b : a].push(ix[t], ix[t + 1], ix[t + 2]); }
  geo.setIndex(buckets.flat()); geo.clearGroups(); let st = 0; buckets.forEach((bk, r) => { if (bk.length) { geo.addGroup(st, bk.length, r); st += bk.length; } else geo.addGroup(st, 0, r); });
  geo.computeBoundingSphere(); geo.boundingSphere.radius *= 2.4;
  const SKINS = [0xd9ae8b, 0xc08a62, 0x8a5a3c, 0xe8c4a4, 0xa8714b], SHIRTS = [0xe8e4da, 0x2f3b52, 0x4a4f58, 0x6b3a3a, 0x5c6b4f, 0xb89b72, 0x8aa0b8, 0x1f2430, 0xcfc8b8], PANTS = [0x2b2f38, 0x3a3f4a, 0x4a4036, 0x26292f], HAIRC = [0x1d1612, 0x3a2a1e, 0x111111, 0x5a4330, 0x7a6a52, 0xa8a196];
  const dressCache = {}, dress = (i, kid) => {
    const k = (i % 997) + (kid ? 1000 : 0); if (dressCache[k]) return dressCache[k];
    const m = c => new THREE.MeshStandardMaterial({ color: c, roughness: .8, metalness: 0 });
    return dressCache[k] = [m(SKINS[(i * 5 + 1) % SKINS.length]), m(SHIRTS[(i * 3) % SHIRTS.length]), m(PANTS[(i * 7) % PANTS.length]), m(0x16161a), m(HAIRC[(i * 11) % (kid ? 4 : HAIRC.length)])];
  };
  people.forEach((P, i) => {
    const key = ACTNAME.get(P.act) || 'idle', m = SkeletonUtils.clone(gl.scene);
    const mats = dress(i, P.kid);
    m.traverse(o => { if (o.isMesh) { o.material = mats; o.frustumCulled = true; o.castShadow = !MOBILE; o.receiveShadow = true; } });
    m.scale.setScalar(1.12 / height);
    if (fwd < 0) { const w = new THREE.Group(); w.rotation.y = Math.PI; w.add(m); P.wrap = w; }
    /* children are not small adults: bigger head, shorter limbs */
    const kidBones = []; if (P.kid) m.traverse(o => { if (o.isBone) { const n = o.name.toLowerCase(); const k = n === 'head' ? 1.5 : /thigh|calf/.test(n) ? .8 : /upperarm|lowerarm/.test(n) ? .84 : 0; if (k) kidBones.push([o, k]); } });
    /* a face: eyes, brows and a nose attached to the head bone */
    { const hbone = m.getObjectByName(headName); if (hbone) {
      const put = (geo2, mat2, v) => { const q = new THREE.Mesh(geo2, mat2); q.position.copy(v); hbone.add(q); };
      put(eyeGeo, eyeMat, FACE.eyeL); put(eyeGeo, eyeMat, FACE.eyeR); put(noseGeo, mats[0], FACE.nose); put(browGeo, mats[4], FACE.browL); put(browGeo, mats[4], FACE.browR);
    } }
    while (P.g.children.length) P.g.remove(P.g.children[0]);
    P.g.add(P.hit);
    P.g.add(P.wrap || m); P.model = m;
    const mx = new THREE.AnimationMixer(m), play = n => { const a = mx.clipAction(clips[n] || clips.Idle_Loop); a.play(); a.time = rnd() * a.getClip().duration; return a; };
    const c = { P, mx, kidBones, last: P.g.position.clone() };
    /* seated adults: lifted onto the seat and moved back from the desk edge */
    if (!P.walk && key === 'type') (P.wrap || m).position.set(0, .1, .09);
    if (P.walk) { c.idle = play('Idle_Loop'); c.walk = play('Walk_Formal_Loop'); } else c.main = play(CLIP[key] || 'Idle_Loop');
    P.act = null; crowd.push(c);
  });
});
const tv = new V3();
function crowdUpdate(dt) {
  for (const c of crowd) {
    c.mx.update(dt); for (const [b, k] of c.kidBones) b.scale.setScalar(k);
    if (c.walk) { tv.copy(c.P.g.position); const sp = tv.distanceTo(c.last) / Math.max(dt, .001); c.last.copy(tv); const w = clamp((sp - .08) / .3); c.walk.setEffectiveWeight(w); c.idle.setEffectiveWeight(1 - w); c.walk.timeScale = clamp(sp / .5, .5, 1.4); }
  }
}

/* ---------- main loop ---------- */
const clock = new THREE.Clock(); let sNow = 0, first = true, frames = 0, acc = 0, lastScreen = 0, lowQ = false, ready = false;
const tmp = new V3();
fit(); addEventListener('resize', () => { fit(); });
/* ?stop=1.5 pins the tour at that point (for reviews and screenshots) */
const STATS = new URLSearchParams(location.search).has('stats');
const PIN = parseFloat(new URLSearchParams(location.search).get('stop'));
/* opening shot: start high over the skyline, look out across the city, then descend to the establishing view while the headline arrives */
let PINJ = NaN;
const OPENP = parseFloat(new URLSearchParams(location.search).get('open'));
if ((isNaN(PIN) || !isNaN(OPENP)) && !RM) {
  const s0 = stops[0], from = { look: s0.look.clone().add(new V3(-26, 22, -40)), dist: s0.dist * 2.4, yaw: s0.yaw - .55, el: .05 };
  jump = { from, to: s0, t0: performance.now(), ms: 4200 }; jumpTo = 0; curPose.look.copy(from.look); curPose.dist = from.dist; curPose.yaw = from.yaw; curPose.el = from.el;
  if (!isNaN(OPENP)) { PINJ = OPENP; if (OPENP > .5) document.body.classList.add('hello'); } else setTimeout(() => document.body.classList.add('hello'), 2300);
} else document.body.classList.add('hello');

function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime, T = RM ? 0 : t;
  const target = (isNaN(PIN) || !isNaN(OPENP)) && isNaN(OPENP) ? clamp(scrollY / vh(), 0, N - 1) : isNaN(PIN) ? clamp(scrollY / vh(), 0, N - 1) : clamp(PIN, 0, N - 1);
  if (jump && !isNaN(PINJ)) jump.t0 = performance.now() - jump.ms * PINJ;
  if (jump && Math.abs(target - jumpTo) > .3) jump = null;   /* the visitor scrolled away: hand control back */
  if (jump) sNow = jumpTo; else sNow = first ? target : sNow + (target - sNow) * Math.min(1, dt * 9); if (Math.abs(target - sNow) < .0005) sNow = target;
  applyPose(sNow); updatePanels(sNow);
  rooms.forEach(R => {
    R.update && R.update(T, dt);
    R.hover = lerp(R.hover, R === hovered ? 1 : 0, Math.min(1, dt * 8));
    const foc = R.stopIndex >= 0 ? 1 - clamp(Math.abs(sNow - R.stopIndex) * 1.5) : 1, dim = sstep(.15, .85, sNow) * (1 - foc);
    R.mats.rim.color.copy(R.rimBase).multiplyScalar((1 - .72 * dim) * (1 + R.hover * 1.1));
    R.halo.material.opacity = .13 * (1 - .85 * dim) + .1 * foc * sstep(.15, .85, sNow);
  });
  people.forEach(P => {
    if (P.walk) { const n = P.walk.length, u = (T * .35 + P.ph) % n, i = Math.floor(u), k = u - i, a = P.walk[i], b = P.walk[(i + 1) % n], m = sstep(.15, .85, k);
      P.g.position.x = lerp(a[0], b[0], m); P.g.position.z = lerp(a[1], b[1], m); P.g.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]); P.act && P.act(P, T); if (m > 0 && m < 1) { P.g.position.y = Y + P.y0 + Math.abs(Math.sin(T * 8)) * .025; P.torso.rotation.z = Math.sin(T * 8) * .04; }
    } else P.act && P.act(P, T);
  });
  if (t - lastScreen > .25) { lastScreen = t; screens.forEach(s => s.draw(T)); }
  updateFlow(t);
  /* hover tip on laptops only; phones select by tapping */
  if (fine && !first) { const R = pick(); if (R !== hovered) { hovered = R; document.body.style.cursor = R ? 'pointer' : ''; if (R) tip.innerHTML = `<i style="background:${hexCss(R.def.color)}"></i>${R.def.name}<small>${R.def.line}</small>`; tip.classList.toggle('show', !!R); }
    if (R) { tip.style.left = Math.min(px + 18, innerWidth - 200) + 'px'; tip.style.top = (py + 18) + 'px'; } }
  coreMesh.rotation.y = T * .4; coreMesh.rotation.x = T * .2; shell.rotation.y = -T * .15; coreMesh.position.y = shell.position.y = coreHalo.position.y = 1.8 + Math.sin(T * 1.2) * .06;
  if (!lowQ && streams.visible) {
    curves.forEach((c, i) => { for (let j = 0; j < SP; j++) { const u = (j / SP + T * .13) % 1, a = 1 - u;
      tmp.set(0, 0, 0).addScaledVector(c.p0, a * a).addScaledVector(c.c, 2 * a * u).addScaledVector(c.p2, u * u); sPos.set([tmp.x, tmp.y, tmp.z], (i * SP + j) * 3); } });
    sGeo.attributes.position.needsUpdate = true;
  }
  bubbleUpdate(); crowdUpdate(dt); fountainUpdate(T); guideUpdate(sNow, T, dt); surroundUpdate(T); sky.position.copy(camera.position);
  renderer.render(scene, camera);
  if (first) { first = false; }
  if (STATS && frames === 20) document.title = `calls=${renderer.info.render.calls} tris=${renderer.info.render.triangles} tex=${renderer.info.memory.textures} geo=${renderer.info.memory.geometries}`;
  if (!ready && ++frames > 2) { ready = true; document.body.classList.add('ready'); }
  /* automatic quality step-down on slow devices */
  if (!lowQ && frames > 30) { acc += dt; if (frames === 120) { if (acc / 90 > .026) { lowQ = true; PR = 1; renderer.setPixelRatio(1); streams.visible = false; fit(); } acc = 0; } }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__hq2 = { renderer, camera, rooms, stops, calls: () => renderer.info.render.calls, tris: () => renderer.info.render.triangles, goTo, applyPose, people, peopleHits, workHits, get jump() { return jump; }, get sNow() { return sNow; } };
