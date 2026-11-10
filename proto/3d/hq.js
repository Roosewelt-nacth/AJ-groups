/* AJ GROUPS · Headquarters (blockout v2)
   The AJ Groups hero as a lived-in HQ seen from above. Rooms are sized and shaped by the
   work done in them, not a tidy grid, and each has people working on what that brand
   delivers. Screens show live-looking work (code being written, campaign numbers climbing,
   bakery orders moving). The constellation core floats in an off-centre atrium and streams
   light into every room. Simple shapes stand in for the bought models and animated
   characters that replace them later; "Ask this room" (real AI) is the next phase. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BRANDS, MOBILE, RM, clamp, lerp, glowTexture, rng } from './common.js';

const V3 = THREE.Vector3, PI = Math.PI;
const rand = rng(42);
const U = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=520&q=70`;

/* ---------- renderer, camera, light ---------- */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .92;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .8;
{
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const x = cv.getContext('2d');
  const gr = x.createRadialGradient(256, 220, 0, 256, 256, 400); gr.addColorStop(0, '#f1efec'); gr.addColorStop(.6, '#dcd9d4'); gr.addColorStop(1, '#c7c3bd');
  x.fillStyle = gr; x.fillRect(0, 0, 512, 512); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
}
const camera = new THREE.PerspectiveCamera(30, 1, .1, 300);
const composer = new EffectComposer(renderer);
if (MOBILE) composer.setPixelRatio(1);
composer.addPass(new RenderPass(scene, camera));
/* no bloom: in daylight it hazes the white walls */
composer.addPass(new OutputPass());
scene.add(new THREE.HemisphereLight(0xfff8ef, 0x8a8178, .75));
const sun = new THREE.DirectionalLight(0xfff0dc, 2.6); sun.position.set(-9, 16, 8); sun.castShadow = true;
sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 11, bottom: -11, near: 1, far: 50 });
sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; scene.add(sun);

/* ---------- materials ---------- */
function canvasTex(w, h, draw, rep = 1) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; return t;
}
const wood = canvasTex(512, 512, x => {
  for (let r = 0; r < 8; r++) for (let c = -1; c < 3; c++) { x.fillStyle = `hsl(28,${36 + rand() * 12}%,${30 + rand() * 7}%)`; x.fillRect(c * 170 + (r % 2) * 85, r * 64, 170, 64); }
  x.globalAlpha = .12; for (let k = 0; k < 500; k++) { x.fillStyle = rand() > .5 ? '#000' : '#fff'; x.fillRect(rand() * 512, Math.floor(rand() * 8) * 64 + rand() * 64, 30 + rand() * 90, 1); }
  x.globalAlpha = .35; x.fillStyle = '#2a1a10'; for (let r = 0; r <= 8; r++) x.fillRect(0, r * 64, 512, 2);
}, 1.2);
const tile = canvasTex(256, 256, x => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#e9e6e1' : '#cfcac2'; x.fillRect(i * 32, j * 32, 32, 32); } }, 1.5);
const concrete = canvasTex(512, 512, x => {
  x.fillStyle = '#bdbcb9'; x.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 9000; k++) { x.fillStyle = `rgba(${rand() > .5 ? '0,0,0' : '255,255,255'},${rand() * .06})`; x.fillRect(rand() * 512, rand() * 512, 2 + rand() * 5, 2 + rand() * 5); }
}, 2);
const Std = o => new THREE.MeshStandardMaterial(o);
const M = {
  base: Std({ color: 0xb3b0ab, roughness: .9 }), wood: Std({ map: wood, roughness: .5 }), tile: Std({ map: tile, roughness: .35 }),
  concrete: Std({ map: concrete, color: 0xdedcd8, roughness: .3 }), plaster: Std({ color: 0xf0eeea, roughness: .9 }),
  white: Std({ color: 0xf5f4f1, roughness: .6 }), steel: Std({ color: 0xc4c8ce, roughness: .28, metalness: .85 }),
  dark: Std({ color: 0x2b2b2f, roughness: .4, metalness: .5 }), black: Std({ color: 0x151517, roughness: .5 }),
  woodDark: Std({ color: 0x4a3324, roughness: .55 }), oak: Std({ color: 0xa27650, roughness: .55 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: .95, roughness: .04, thickness: .15 }),
  dough: Std({ color: 0xf1dfc2, roughness: .85 }), bread: Std({ color: 0xb8782f, roughness: .7 }), flour: Std({ color: 0xf4efe6, roughness: 1 }),
  plant: Std({ color: 0x4f7a4a, roughness: .8 }), pot: Std({ color: 0xc9b8a3, roughness: .9 }),
  ovenGlow: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, .9, .25), toneMapped: false }), lamp: Std({ color: 0x000000, emissive: 0xfff3dd, emissiveIntensity: 3 }),
};
const fabric = c => Std({ color: c, roughness: .92 });
const carpet = c => Std({ color: c, roughness: 1 });
const tint = (c, to, k) => new THREE.Color(c).lerp(new THREE.Color(to), k);

/* ---------- geometry helpers ---------- */
function add(geo, mat, p, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; p.add(m); return m;
}
const box = (w, h, d, mat, p, x, y, z, s) => add(new THREE.BoxGeometry(w, h, d), mat, p, x, y, z, s);
const cyl = (rt, rb, h, mat, p, x, y, z, s) => add(new THREE.CylinderGeometry(rt, rb, h, 24), mat, p, x, y, z, s);
const sph = (r, mat, p, x, y, z, s) => add(new THREE.SphereGeometry(r, 24, 16), mat, p, x, y, z, s);
function table(p, w, d, h, x, z, top = M.oak, leg = M.dark) {
  box(w, .05, d, top, p, x, h, z);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(.04, h, .04, leg, p, x + a * (w / 2 - .06), h / 2, z + b * (d / 2 - .06)));
}
function plant(p, x, z, s = 1) { cyl(.12 * s, .1 * s, .22 * s, M.pot, p, x, .11 * s, z); sph(.2 * s, M.plant, p, x, .38 * s, z).scale.y = 1.3; }
function chair(p, x, z, ry = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g); box(.34, .05, .34, M.dark, g, 0, .36, 0); box(.34, .34, .04, M.dark, g, 0, .55, .16); cyl(.02, .02, .34, M.steel, g, 0, .18, 0); return g; }

/* live screens drawn on canvases (cheap: redrawn a few times a second) */
const screens = [];
function screen(w, h, draw, pxw = 256) {
  const cv = document.createElement('canvas'); cv.width = pxw; cv.height = Math.round(pxw * h / w);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const s = { cv, x: cv.getContext('2d'), tex, draw, st: {} }; screens.push(s);
  return { geo: new THREE.PlaneGeometry(w, h), mat, s };
}

/* ---------- stand-in people ---------- */
const SKIN = [0xe2b38c, 0xc68c62, 0x8d5a3b, 0xf0c9a4, 0xa8714b], HAIR = [0x231a14, 0x4a3020, 0x111111, 0x6b4a2b];
const pants = Std({ color: 0x3a3d44, roughness: .9 });
const people = [];
function person(p, x, z, o = {}) {
  const s = (o.scale ?? 1) * 1.15, g = new THREE.Group(); g.position.set(x, o.y ?? 0, z); g.rotation.y = o.ry ?? 0; g.scale.setScalar(s); p.add(g);
  const skin = Std({ color: o.skin ?? SKIN[Math.floor(rand() * SKIN.length)], roughness: .7 });
  const shirt = fabric(o.shirt ?? 0x8899aa);
  const hips = new THREE.Group(); hips.position.y = .42; g.add(hips);
  const legs = [-1, 1].map(k => { const l = new THREE.Group(); l.position.set(k * .055, 0, 0); hips.add(l);
    add(new THREE.CapsuleGeometry(.045, .3, 4, 10), pants, l, 0, -.2, 0); return l; });
  const torso = new THREE.Group(); hips.add(torso);
  add(new THREE.CapsuleGeometry(.1, .2, 4, 12), shirt, torso, 0, .17, 0).scale.z = .72;
  const head = new THREE.Group(); head.position.y = .38; torso.add(head);
  add(new THREE.SphereGeometry(.075, 16, 12), skin, head, 0, 0, 0);
  const hair = add(new THREE.SphereGeometry(.079, 16, 10, 0, PI * 2, 0, PI * .55), Std({ color: o.hair ?? HAIR[Math.floor(rand() * HAIR.length)], roughness: .8 }), head, 0, .006, .004);
  hair.rotation.x = -.25;
  const arms = [-1, 1].map(k => { const a = new THREE.Group(); a.position.set(k * .135, .28, 0); torso.add(a);
    add(new THREE.CapsuleGeometry(.033, .22, 4, 8), shirt, a, 0, -.13, 0); add(new THREE.SphereGeometry(.034, 10, 8), skin, a, 0, -.27, 0); return a; });
  if (o.seated) { hips.position.y = .36; legs.forEach(l => l.rotation.x = -PI / 2); }
  const P = { g, hips, torso, head, arms, legs, o, ph: rand() * 6.28, seated: !!o.seated };
  if (o.holds) { o.holds(arms[1]); }
  people.push(P); return P;
}
/* small library of working motions */
const ACT = {
  type: (P, t) => { P.arms.forEach((a, i) => { a.rotation.x = -1.15 + Math.sin(t * 14 + i * 1.7 + P.ph) * .06; }); P.head.rotation.x = .12 + Math.sin(t * .7 + P.ph) * .04; P.head.rotation.y = Math.sin(t * .3 + P.ph) * .15; },
  knead: (P, t) => { const k = Math.sin(t * 3 + P.ph); P.arms.forEach(a => { a.rotation.x = -1 + k * .25; }); P.torso.rotation.x = .18 + k * .06; },
  pin: (P, t) => { P.arms[1].rotation.x = -1.3 + Math.sin(t * 1.8) * .2; P.arms[0].rotation.x = -.6; P.torso.rotation.y = Math.sin(t * .4) * .2; P.head.rotation.x = .15; },
  present: (P, t) => { const u = (Math.sin(t * .6 + P.ph) + 1) / 2; P.arms[1].rotation.x = -lerp(.3, 2.2, u); P.arms[1].rotation.z = .2; P.arms[0].rotation.x = -.2; P.torso.rotation.y = Math.sin(t * .35) * .25; },
  read: (P, t) => { P.arms.forEach((a, i) => { a.rotation.x = -.9 + Math.sin(t * 1.2 + i) * .05; }); P.head.rotation.x = .2 + Math.sin(t * .5) * .05; P.torso.rotation.y = Math.sin(t * .4) * .2; },
  bounce: (P, t) => { P.g.position.y = Math.abs(Math.sin(t * 3.2 + P.ph)) * .12; P.arms.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * (.4 + Math.abs(Math.sin(t * 3.2)) * .8); }); },
  pose: (P, t) => { const k = Math.floor(t / 2.6 + P.ph) % 3; const tz = [.2, -.4, 1.2][k]; P.arms[0].rotation.z = lerp(P.arms[0].rotation.z, tz, .05); P.arms[1].rotation.z = lerp(P.arms[1].rotation.z, -tz * .5, .05); P.g.rotation.y = lerp(P.g.rotation.y, P.o.ry + [0, .5, -.4][k], .03); },
  shoot: (P, t) => { P.arms.forEach(a => { a.rotation.x = -1.45; a.rotation.z = 0; }); P.head.rotation.x = .05; const u = t * .35 + P.ph; P.g.position.x = P.o.x0 + Math.sin(u) * .5; P.g.position.z = P.o.z0 + Math.cos(u * .7) * .18; P.g.rotation.y = P.o.ry + Math.sin(u) * -.45; P.hips.position.y = .42 - Math.max(0, Math.sin(u * 2)) * .08; },
  idle: (P, t) => { P.torso.rotation.y = Math.sin(t * .5 + P.ph) * .1; P.head.rotation.y = Math.sin(t * .37 + P.ph) * .3; P.arms.forEach((a, i) => { a.rotation.x = Math.sin(t * .8 + i) * .05; }); },
};
/* walking between points: legs swing, body turns toward travel */
function walker(P, pts, speed = .55, pause = 1.6) {
  const segs = pts.map((p, i) => [p, pts[(i + 1) % pts.length]]), lens = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const cycle = lens.reduce((s, l) => s + l / speed + pause, 0);
  P.walk = (t, act) => {
    let u = (t + P.ph * 3) % cycle;
    for (let i = 0; i < segs.length; i++) {
      const dur = lens[i] / speed;
      if (u < pause) { const [a] = segs[i]; P.g.position.x = a[0]; P.g.position.z = a[1]; P.legs.forEach(l => l.rotation.x = lerp(l.rotation.x, 0, .2)); act && act(P, t); return; }
      u -= pause;
      if (u < dur) {
        const [a, b] = segs[i], k = u / dur; P.g.position.x = lerp(a[0], b[0], k); P.g.position.z = lerp(a[1], b[1], k);
        const ry = Math.atan2(b[0] - a[0], b[1] - a[1]); P.g.rotation.y = ry;
        const sw = Math.sin(t * 9); P.legs[0].rotation.x = sw * .5; P.legs[1].rotation.x = -sw * .5;
        P.arms[0].rotation.x = -sw * .35; if (!P.o.holds) P.arms[1].rotation.x = sw * .35; P.g.position.y = Math.abs(Math.cos(t * 9)) * .02; return;
      }
      u -= dur;
    }
  };
}

/* ---------- floor plan: rooms sized by their work ---------- */
/* each room: rectangle(s) in world units, wall height, door side/position, floor, and who works there */
const PLAN = [
  { key: 'alven', b: 0, x0: -2.6, x1: 3.0, z0: -6.4, z1: -2.6, h: 1.15, door: ['s', .55, 1.4], floor: 'wood',
    now: ['Reviewing this week’s campaign numbers', 'Planning the next social calendar', 'Pitching a launch idea to a client'], img: U('photo-1563986768494-4dee2763ff3f'),
    hi: ['Brand strategy', 'Social media campaigns', 'Performance ads'] },
  { key: 'fovo', b: 1, x0: 3.4, x1: 9.2, z0: -6.4, z1: -1.4, h: 1.7, door: ['s', .3, 1.3], floor: 'concrete',
    now: ['Shooting a portrait series', 'Checking shots on the monitor', 'Setting up the lights'], img: U('photo-1516961642265-531546e84af2'),
    hi: ['Portrait sessions', 'Events', 'Commercial shoots'] },
  { key: 'wear', b: 2, x0: -1.9, x1: .5, z0: 2.4, z1: 6.4, h: 1.15, door: ['n', .5, 1.1], floor: 'wood', rot: -.05,
    now: ['Fitting a new jacket', 'Sewing the autumn samples', 'Choosing fabrics'], img: U('photo-1441986300917-64674bd600d8'),
    hi: ['Seasonal collections', 'Tailored pieces', 'Lookbooks'] },
  { key: 'soft', b: 3, x0: 1.9, x1: 9.2, z0: 3.4, z1: 6.4, h: 1.15, door: ['n', .25, 1.3], floor: 'carpetDark',
    now: ['Shipping a website update', 'Writing code for a client app', 'Checking the servers'], img: U('photo-1505685296765-3a2736de412f'),
    hi: ['Websites and apps', 'Custom software', 'Support and hosting'] },
  { key: 'bun', b: 4, x0: -9.2, x1: -3.2, z0: -6.4, z1: -.6, h: 1.15, door: ['e', .7, 1.3], floor: 'tile',
    extra: { x0: -9.2, x1: -5.6, z0: -.6, z1: 2.0, door: ['e', .5, 1.2] },
    now: ['Kneading the morning dough', 'Pulling croissants from the oven', 'Packing a cake order'], img: U('photo-1515037893149-de7f840978e2'),
    hi: ['Fresh daily bakes', 'Custom cakes', 'Orders and catering'] },
  { key: 'kids', b: 5, x0: -9.2, x1: -4.8, z0: 2.9, z1: 6.4, h: .95, door: ['n', .7, 1.2], floor: 'carpetKids', rot: .07,
    now: ['Reading a new story aloud', 'Recording a learning video', 'Testing a game with kids'], img: U('photo-1545558014-8692077e9b5c'),
    hi: ['Stories for kids', 'Learning videos', 'Creative play'] },
  { key: 'founder', b: -1, x0: -4.4, x1: -2.3, z0: 2.6, z1: 6.4, h: 1.15, door: ['n', .5, .9], floor: 'woodDark', raise: .45, glassFront: true,
    name: 'Founder’s office', line: 'Allwyn · Founder, AJ GROUPS',
    now: ['Reviewing plans for the next venture', 'Meeting a partner', 'Walking the floor'], img: U('photo-1497366216548-37526070297c'),
    hi: ['Vision for the group', 'Partnerships', 'New ventures'] },
];
const WT = .12;
const building = new THREE.Group(); scene.add(building);
const walls = [], rooms = [];
const floorMat = { wood: M.wood, concrete: M.concrete, tile: M.tile, woodDark: Std({ map: wood, color: 0x8a6a55, roughness: .45 }),
  carpetDark: carpet(0x3d4048), carpetKids: carpet(0x9cc7e8) };
function wallSeg(p, len, h, x, z, horiz, n, mat = M.plaster) {
  const m = box(horiz ? len : WT, h, horiz ? WT : len, mat, p, x, h / 2, z);
  m.userData = { n, h, k: 1, y0: 0 }; walls.push(m); return m;
}
/* walls around one rectangle (local coords, centred), with an optional doorway and open sides */
function rectWalls(p, w, d, h, door, open = [], glassFront) {
  const sides = { n: [w, 0, -d / 2, true, new V3(0, 0, -1)], s: [w, 0, d / 2, true, new V3(0, 0, 1)],
    w: [d, -w / 2, 0, false, new V3(-1, 0, 0)], e: [d, w / 2, 0, false, new V3(1, 0, 0)] };
  for (const [k, [len, x, z, horiz, n]] of Object.entries(sides)) {
    if (open.includes(k)) continue;
    const mat = glassFront && k === 'n' ? M.glass : M.plaster;
    if (door && door[0] === k) {
      const at = door[1] * len - len / 2, dw = door[2], a = at - dw / 2 + len / 2, b = len / 2 - (at + dw / 2);
      if (a > .05) wallSeg(p, a, h, horiz ? x - len / 2 + a / 2 : x, horiz ? z : z - len / 2 + a / 2, horiz, n, mat);
      if (b > .05) wallSeg(p, b, h, horiz ? x + len / 2 - b / 2 : x, horiz ? z : z + len / 2 - b / 2, horiz, n, mat);
      box(dw + .1, .06, WT * 1.4, M.woodDark, p, horiz ? x + at : x, .03, horiz ? z : z + at);   /* threshold */
    } else wallSeg(p, len, h, x, z, horiz, n, mat);
  }
}
const BUILD = {};   /* furniture + people per room, filled below */

/* ---------- room contents ---------- */
const code = ['const order = await bakery.next();', 'export function launch(site) {', '  return deploy(site, { region });', 'if (!user.signedIn) redirect("/login");',
  'for (const p of products) render(p);', 'await db.save({ id, status: "ready" });', '}', 'test("checkout works", async () => {', '  expect(total).toBe(12.5);', 'fetch("/api/stats").then(show);'];
function drawCode(x, w, h, st, t) {
  st.lines ??= []; st.cur ??= ''; st.src ??= Math.floor(rand() * code.length); st.ci ??= 0;
  const src = code[st.src]; st.cur = src.slice(0, ++st.ci);
  if (st.ci > src.length) { st.lines.push(st.cur); st.cur = ''; st.ci = 0; st.src = (st.src + 1 + Math.floor(rand() * 3)) % code.length; if (st.lines.length > 7) st.lines.shift(); }
  x.fillStyle = '#0f1115'; x.fillRect(0, 0, w, h); x.font = `${Math.round(h / 10)}px monospace`;
  [...st.lines, st.cur + (Math.floor(t * 2) % 2 ? '▍' : '')].forEach((l, i) => {
    x.fillStyle = i === st.lines.length ? '#e6edf3' : ['#7ee787', '#79c0ff', '#d2a8ff', '#ffa657'][i % 4]; x.fillText(l, 8, (i + 1) * h / 9);
  });
}
BUILD.alven = r => {
  const g = r.inner, d = r.d;
  /* campaign wall: one wide live dashboard across the back wall */
  const sc = screen(3.6, 1, (x, w, h, st, t) => {
    st.v ??= [12400, 3.8, 842]; st.v[0] += Math.floor(rand() * 40); st.v[1] = +(st.v[1] + (rand() - .45) * .02).toFixed(2); st.v[2] += rand() > .7 ? 1 : 0;
    st.pts ??= []; st.pts.push(.45 + Math.sin(t * .3) * .2 + rand() * .1); if (st.pts.length > 60) st.pts.shift();
    x.fillStyle = '#101418'; x.fillRect(0, 0, w, h);
    [['REACH', st.v[0].toLocaleString()], ['CTR %', st.v[1].toFixed(2)], ['LEADS', st.v[2]]].forEach(([k, v], i) => {
      x.fillStyle = '#7d8590'; x.font = `${h / 10}px sans-serif`; x.fillText(k, 16 + i * w * .165, h * .2);
      x.fillStyle = '#2de2c8'; x.font = `bold ${h / 7}px sans-serif`; x.fillText(v, 16 + i * w * .165, h * .42);
    });
    x.strokeStyle = '#2de2c8'; x.lineWidth = 3; x.beginPath();
    st.pts.forEach((p, i) => { const px = w * .52 + i * (w * .45 / 60), py = h * (.9 - p * .7); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke();
    x.fillStyle = '#e6edf3'; x.font = `${h / 9}px sans-serif`; x.fillText('Autumn launch · live', w * .52, h * .16);
  }, 512);
  box(3.7, 1.08, .06, M.black, g, -.3, .95, -d / 2 + .12); add(sc.geo, sc.mat, g, -.3, .95, -d / 2 + .156, false);
  table(g, 2, .9, .62, .2, .2); [-.6, .2, 1].forEach(x => { chair(g, x, .85, PI); box(.32, .02, .22, M.dark, g, x, .66, .35); });
  chair(g, -.6, -.45, 0); plant(g, 2.4, 1.4); box(.8, .85, .35, M.oak, g, -2.3, .42, 1.4);
  const a = person(g, -.6, .85, { seated: true, ry: PI, shirt: 0x2f6f66 }); a.act = ACT.type;
  const b = person(g, 1.1, -1.05, { ry: PI, shirt: 0xdedad2 }); b.act = ACT.present;
  r.screens = [sc];
};
BUILD.fovo = r => {
  const g = r.inner, d = r.d;
  /* paper backdrop sweep: wall sheet + curved foot + floor sheet */
  const paper = fabric(0xe9e7e3);
  box(3.2, 1.6, .03, paper, g, .3, .8, -d / 2 + .2);
  add(new THREE.CylinderGeometry(.35, .35, 3.2, 16, 1, true, PI, PI / 2), paper, g, .3, .35, -d / 2 + .55).rotation.z = PI / 2;
  box(3.2, .01, 1.4, paper, g, .3, .005, -d / 2 + 1.25);
  const flashes = [];
  [-1.3, 1.9].forEach(x => {
    cyl(.02, .02, 1.3, M.dark, g, x, .65, -.2);
    const sb = new THREE.Group(); sb.position.set(x, 1.35, -.2); sb.rotation.y = x > 0 ? .6 : -.6; g.add(sb);
    box(.7, .7, .25, M.black, sb, 0, 0, 0);
    const face = box(.62, .62, .01, Std({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: .4 }), sb, 0, 0, -.13, false); flashes.push(face);
  });
  const flashLight = new THREE.PointLight(0xffffff, 0, 6, 1.4); flashLight.position.set(.3, 1.4, -.5); g.add(flashLight);
  /* tripod camera and a monitor station */
  for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; cyl(.015, .015, .95, M.dark, g, -1 + Math.cos(a) * .15, .45, 1 + Math.sin(a) * .15).rotation.set(Math.sin(a) * .16, 0, -Math.cos(a) * .16); }
  box(.26, .18, .16, M.black, g, -1, .98, 1); cyl(.07, .08, .2, M.dark, g, -1, .98, .84).rotation.x = PI / 2;
  table(g, 1.2, .6, .7, 2.1, 1.6, M.white);
  const mon = screen(.8, .5, (x, w, h, st) => {
    if (!st.img || st.flashed) { st.flashed = false; st.hue = Math.floor(rand() * 360); }
    const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, `hsl(${st.hue},18%,22%)`); gr.addColorStop(1, `hsl(${st.hue + 30},12%,8%)`);
    x.fillStyle = gr; x.fillRect(0, 0, w, h); st.img = 1;
    x.fillStyle = 'rgba(240,230,220,.85)'; x.beginPath(); x.ellipse(w * .5, h * .38, w * .07, h * .13, 0, 0, PI * 2); x.fill();
    x.beginPath(); x.ellipse(w * .5, h * .85, w * .2, h * .3, 0, PI, 0); x.fill();
    x.fillStyle = '#fff'; x.font = `${h / 12}px sans-serif`; x.fillText('IMG_0' + (2400 + (st.n ??= 0)), 8, h - 8);
  });
  box(.86, .54, .04, M.black, g, 2.1, 1.05, 1.42); add(mon.geo, mon.mat, g, 2.1, 1.05, 1.442, false);
  chair(g, 2.1, 2, PI);
  const model = person(g, .3, -d / 2 + 1, { ry: 0, shirt: 0x1d1d1f }); model.act = ACT.pose;
  const ph = person(g, -.7, .9, { ry: PI - .15, shirt: 0xdfe6ff, holds: a => box(.12, .09, .1, M.black, a, 0, -.3, .02) });
  ph.o.x0 = -.7; ph.o.z0 = .9; ph.o.ry = PI - .15; ph.act = ACT.shoot;
  const asst = person(g, 2.1, 2, { seated: true, ry: PI, shirt: 0x6f6f78 }); asst.act = ACT.type;
  /* flash every few seconds: softboxes and a light pop, and the monitor shows the new shot */
  r.tick = t => { const k = (t % 3.1) < .09 ? 1 : 0; flashes.forEach(f => f.material.emissiveIntensity = .4 + k * 6); flashLight.intensity = k * 18;
    if (k && !r._f) { mon.s.st.flashed = true; mon.s.st.n = (mon.s.st.n ?? 0) + 1; } r._f = k; };
  r.screens = [mon];
};
BUILD.wear = r => {
  const g = r.inner, w = r.w, d = r.d;
  /* rail of garments along one wall */
  cyl(.02, .02, 1.1, M.steel, g, -w / 2 + .3, .55, -1.5); cyl(.02, .02, 1.1, M.steel, g, -w / 2 + .3, .55, .5);
  cyl(.018, .018, 2.05, M.steel, g, -w / 2 + .3, 1.08, -.5).rotation.x = PI / 2;
  const cols = [0x8a5a3c, 0xd9c7a7, 0x2d3a4a, 0xa94f3d, 0xc8b8a0, 0x55604a];
  cols.forEach((c, k) => box(.06, .62, .3, fabric(c), g, -w / 2 + .3, .75, -1.35 + k * .33));
  /* mannequin being fitted, cutting table with fabric, sewing machine */
  cyl(.15, .17, .03, M.dark, g, .35, .02, -.9); cyl(.015, .015, .62, M.dark, g, .35, .32, -.9);
  add(new THREE.CapsuleGeometry(.15, .3, 6, 16), fabric(0xffa94d), g, .35, .85, -.9).scale.z = .7;
  table(g, 1.2, .6, .72, .2, 1.1, M.oak); box(.9, .01, .5, fabric(0x2d3a4a), g, .1, .755, 1.1);
  box(.3, .18, .14, M.white, g, .5, .84, 1.1);
  box(.5, 1.2, .03, M.glass, g, w / 2 - .12, .7, -1.6).rotation.y = -.3;
  const tailor = person(g, .35, -.45, { ry: PI, shirt: 0x2b2b2f }); tailor.act = ACT.pin;
  const sewer = person(g, .45, 1.55, { seated: true, ry: PI, shirt: 0xd9c7a7 }); sewer.act = ACT.type; chair(g, .45, 1.55, PI);
};
BUILD.soft = r => {
  const g = r.inner, w = r.w, d = r.d, scr = [];
  /* a row of desks with live code, a server corner, a whiteboard */
  [-2.4, -.9, .6].forEach((x, i) => {
    table(g, 1.2, .62, .66, x, -d / 2 + .55, M.white);
    [-.27, .27].forEach(o => { const s = screen(.5, .3, (cx, cw, ch, st, t) => drawCode(cx, cw, ch, st, t)); scr.push(s);
      box(.54, .34, .03, M.black, g, x + o, .97, -d / 2 + .36); add(s.geo, s.mat, g, x + o, .97, -d / 2 + .377, false); });
    chair(g, x, -d / 2 + 1.05, 0);
    if (i < 2) { const c = person(g, x, -d / 2 + 1.05, { seated: true, ry: PI, shirt: i ? 0x9b6bff : 0x3a3d44 }); c.act = ACT.type; }
  });
  [2.3, 2.85].forEach(x => { box(.5, 1.35, .55, M.black, g, x, .68, -d / 2 + .4);
    for (let k = 0; k < 7; k++) { const led = box(.36, .025, .01, Std({ color: 0x000000, emissive: k % 3 ? 0x5dff9a : 0x79c0ff, emissiveIntensity: 2 }), g, x, .22 + k * .17, -d / 2 + .68, false); led.userData.blink = rand() * 6; scr.push({ led }); } });
  box(1.3, .8, .03, M.white, g, w / 2 - .25, .9, .4).rotation.y = -PI / 2;
  const lead = person(g, 1.6, .5, { shirt: 0xdedad2 }); walker(lead, [[1.6, .5], [2.55, -.35], [.6, .2]], .5, 2.2); lead.act = ACT.idle;
  plant(g, -w / 2 + .35, d / 2 - .4);
  r.screens = scr.filter(s => s.s);
  r.leds = scr.filter(s => s.led).map(s => s.led);
};
BUILD.bun = r => {
  const g = r.inner, w = r.w, d = r.d;
  /* kitchen: three ovens on the back wall, big steel worktable with dough, racks of trays */
  [-1.6, -.4, .8].forEach(x => { box(1.05, 1, .65, M.steel, g, x, .5, -d / 2 + .42); box(.7, .32, .01, M.ovenGlow, g, x, .58, -d / 2 + .1 + .66, false); });
  const ovenLight = new THREE.PointLight(0xff8a2a, 2.5, 3.5, 1.6); ovenLight.position.set(-.4, .7, -d / 2 + 1.1); g.add(ovenLight);
  table(g, 2.4, .95, .78, -.3, .5, M.steel, M.steel);
  for (let k = 0; k < 5; k++) sph(.11, M.dough, g, -1.2 + k * .42, .87, .45 + (k % 2) * .12).scale.y = .55;
  box(.4, .02, .3, M.flour, g, .6, .81, .7);
  [2.2].forEach(x => { box(.6, 1.4, .5, M.steel, g, x, .7, -1.4); for (let k = 0; k < 5; k++) { box(.55, .02, .45, M.dark, g, x, .25 + k * .25, -1.4); for (let j = 0; j < 3; j++) sph(.06, M.bread, g, x - .16 + j * .16, .3 + k * .25, -1.4).scale.set(1.3, .6, 1); } });
  [[-2.5, 2.4], [-2.2, 2.6]].forEach(([x, z]) => box(.4, .5, .3, M.flour, g, x, .25, z));
  const k1 = person(g, -.4, -.15, { ry: 0, shirt: 0xf6f3ee }); k1.act = ACT.knead;
  const k2 = person(g, .8, -1.2, { shirt: 0xf6f3ee, holds: a => box(.4, .02, .3, M.dark, a, 0, -.28, .12) });
  walker(k2, [[.8, -1.75], [1.75, -1.4], [1.3, 1.6]], .55, 1.4);
  k2.act = (P, t) => { P.arms.forEach(a => a.rotation.x = -1.3); };
  /* shopfront: counter, glass case of buns, order board, the cashier */
  const s = r.R.shop;
  box(2.2, .85, .55, M.oak, s, .2, .43, -.15); box(2.3, .04, .62, M.white, s, .2, .87, -.15);
  box(1, .32, .45, M.glass, s, -.3, 1.05, -.15);
  for (let k = 0; k < 6; k++) sph(.07, M.bread, s, -.65 + (k % 3) * .35, .94, -.28 + Math.floor(k / 3) * .22).scale.y = .6;
  const board = screen(1, .55, (x, w2, h2, st, t) => {
    st.n ??= 126; st.list ??= [['126', 'Croissant x2', 'Ready'], ['127', 'Birthday cake', 'Baking'], ['128', 'Sourdough', 'Queued']];
    if (Math.floor(t / 4) !== st.last) { st.last = Math.floor(t / 4); st.list.shift(); const items = ['Cinnamon bun x4', 'Sourdough', 'Box of 6 buns', 'Chocolate cake', 'Croissant x3'];
      st.list.push([String(++st.n + 2), items[st.n % items.length], 'Queued']); st.list[0][2] = 'Ready'; st.list[1][2] = 'Baking'; }
    x.fillStyle = '#2a1c14'; x.fillRect(0, 0, w2, h2); x.fillStyle = '#f4e3cf'; x.font = `bold ${h2 / 8}px sans-serif`; x.fillText('ORDERS', 12, h2 * .17);
    st.list.forEach(([n, it, stt], i) => { const y = h2 * (.38 + i * .22); x.font = `${h2 / 10}px sans-serif`; x.fillStyle = '#f4e3cf'; x.fillText(`#${n}  ${it}`, 12, y);
      x.fillStyle = stt === 'Ready' ? '#7bd88f' : stt === 'Baking' ? '#ffb35c' : '#b9a894'; x.fillText(stt, w2 * .72, y); });
  });
  box(1.05, .6, .04, M.black, s, -.6, 1.25, -1.15); add(board.geo, board.mat, s, -.6, 1.25, -1.128, false);
  const cashier = person(s, .6, -.75, { shirt: 0xff6f91 }); cashier.act = ACT.idle;
  const cust = person(s, .9, .45, { ry: PI, shirt: 0x55604a }); cust.act = ACT.idle;
  r.screens = [board];
};
BUILD.kids = r => {
  const g = r.inner, w = r.w, d = r.d;
  /* giant open storybook with a turning page, toy blocks, beanbags, a reading stage */
  const bookG = new THREE.Group(); bookG.position.set(-.4, 0, -.6); g.add(bookG);
  const cover = Std({ color: 0x2f6fb3, roughness: .6 }), page = Std({ color: 0xfbf7ee, roughness: .9 });
  box(1, .07, 1.3, cover, bookG, -.5, .25, 0).rotation.z = -.2; box(1, .07, 1.3, cover, bookG, .5, .25, 0).rotation.z = .2;
  box(.94, .06, 1.22, page, bookG, -.48, .31, 0).rotation.z = -.2; box(.94, .06, 1.22, page, bookG, .48, .31, 0).rotation.z = .2;
  const leafP = new THREE.Group(); leafP.position.set(0, .34, 0); bookG.add(leafP);
  const leaf = box(.92, .01, 1.18, page, leafP, .46, 0, 0, false);
  r.tick = t => { const u = (t % 6) / 6; leafP.rotation.z = u < .25 ? lerp(.2, PI - .2, Math.sin(u / .25 * PI / 2)) : u < .9 ? PI - .2 : lerp(PI - .2, .2, (u - .9) / .1); };
  const toys = [0xff6b6b, 0xffd166, 0x4fb8ff, 0x7bd88f];
  for (let k = 0; k < 4; k++) box(.28, .28, .28, Std({ color: toys[k], roughness: .55 }), g, 1.3 + (k % 2) * .05, .14 + k * .28, .8).rotation.y = k * .35;
  sph(.2, Std({ color: 0xff6b6b, roughness: .5 }), g, 1.6, .2, -1.1);
  [[-1.5, .9, 0xffd166], [-.7, 1.2, 0x7bd88f]].forEach(([x, z, c]) => sph(.28, fabric(c), g, x, .14, z).scale.set(1, .5, 1));
  const teller = person(g, -.4, .35, { seated: true, ry: PI, shirt: 0x4fb8ff, y: -.12 }); teller.act = ACT.read;
  const kid1 = person(g, -1.5, .9, { scale: .62, ry: PI, shirt: 0xffd166 }); kid1.act = ACT.bounce;
  const kid2 = person(g, .9, .3, { scale: .6, ry: -2.2, shirt: 0x7bd88f }); kid2.act = ACT.idle;
};
BUILD.founder = r => {
  const g = r.inner, w = r.w, d = r.d;
  table(g, 1.1, .55, .7, 0, .6, M.woodDark); chair(g, 0, 1.05, PI); box(.35, .22, .02, M.black, g, 0, .86, .45);
  box(.35, 1.2, 1.6, M.woodDark, g, w / 2 - .25, .6, .7);
  for (let k = 0; k < 4; k++) for (let j = 0; j < 5; j++) box(.2, .22, .06, fabric([0x7a2e2e, 0x2e4a6a, 0xc9a46a, 0x3b3b3b][(k + j) % 4]), g, w / 2 - .25, .2 + k * .28, .1 + j * .28);
  box(.6, .35, .3, fabric(0x6b4a2b), g, -w / 2 + .45, .18, 1.6); plant(g, -w / 2 + .3, -1.4, 1.1);
  const f = person(g, 0, -.9, { shirt: 0x1d2433 });
  walker(f, [[0, -1.35], [-.5, .1], [0, 1.05]], .4, 3);
  f.act = ACT.idle;
};

PLAN.forEach(R => {
  const g = new THREE.Group(), w = R.x1 - R.x0, d = R.z1 - R.z0;
  g.position.set((R.x0 + R.x1) / 2, R.raise ?? 0, (R.z0 + R.z1) / 2); g.rotation.y = R.rot ?? 0; building.add(g);
  const fl = floorMat[R.floor];
  box(w, .1, d, fl, g, 0, .05, 0).castShadow = false;
  if (R.raise) { box(w, R.raise, d, M.base, g, 0, -R.raise / 2, 0); for (let k = 0; k < 3; k++) box(.9, R.raise * (k + 1) / 3, .25, M.woodDark, g, 0, -R.raise + R.raise * (k + 1) / 6, -d / 2 - .2 - (2 - k) * .25); }
  const inner = new THREE.Group(); inner.position.y = .1; g.add(inner);
  rectWalls(inner, w, d, R.h, R.door, R.extra ? ['s'] : [], R.glassFront);
  if (R.extra) {   /* L-shaped room: second rectangle (the bakery shopfront) */
    const E = R.extra, ew = E.x1 - E.x0, ed = E.z1 - E.z0, eg = new THREE.Group();
    eg.position.set((E.x0 + E.x1) / 2 - g.position.x, 0, (E.z0 + E.z1) / 2 - g.position.z); g.add(eg);
    box(ew, .1, ed, M.wood, eg, 0, .05, 0).castShadow = false;
    const ei = new THREE.Group(); ei.position.y = .1; eg.add(ei);
    rectWalls(ei, ew, ed, R.h, E.door, ['n']);
    const sw = w - ew;   /* wall closing the kitchen's south side beyond the shop */
    wallSeg(inner, sw, R.h, w / 2 - sw / 2, d / 2, true, new V3(0, 0, 1));
    R.shop = ei; R.shopOff = eg.position;
  }
  const brand = R.b >= 0 ? BRANDS[R.b] : { name: R.name, line: R.line, color: 0xc9a46a };
  const light = new THREE.PointLight(0xfff1de, .6, Math.max(w, d) * 1.2, 1.5); light.position.set(0, 2, 0); g.add(light);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(w, 1.6, d), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = .8; g.add(hit);
  if (R.extra) { const E = R.extra, h2 = new THREE.Mesh(new THREE.BoxGeometry(E.x1 - E.x0, 1.6, E.z1 - E.z0), hit.material);
    h2.position.set((E.x0 + E.x1) / 2 - g.position.x, .8, (E.z0 + E.z1) / 2 - g.position.z); g.add(h2); h2.userData.room = rooms.length; }
  hit.userData.room = rooms.length;
  const room = { R, g, inner, w, d, brand, light, lift: 0, base: g.position.y, nowI: 0 };
  rooms.push(room);
  BUILD[R.key](room);
});
const hits = []; rooms.forEach(r => r.g.traverse(o => { if (o.userData.room !== undefined) hits.push(o); }));

/* building slab + atrium */
box(19.4, .12, 13.8, M.base, building, 0, -.06, 0).castShadow = false;
box(14.6, .02, 4.8, M.concrete, building, 0, .01, 0).castShadow = false;   /* atrium floor */
[[-4.2, -1.6], [6.5, .4], [-3.6, 1.9], [8.6, 2.4]].forEach(([x, z], i) => plant(building, x, z, .9 + (i % 2) * .3));
box(1.6, .3, .45, M.oak, building, 4.2, .15, 1.6); box(1.6, .3, .45, M.oak, building, -1.6, .15, -1.9);

/* ---------- the core in the atrium ---------- */
const CORE = new V3(1.4, 0, -.2), CORE_Y = 1.75, glowTex = glowTexture();
const coreG = new THREE.Group(); coreG.position.copy(CORE); building.add(coreG);
cyl(.95, 1.05, .16, M.dark, coreG, 0, .08, 0);
add(new THREE.TorusGeometry(.98, .025, 8, 72), Std({ color: 0x000000, emissive: 0xbfe3ff, emissiveIntensity: 1.6 }), coreG, 0, .17, 0, false).rotation.x = PI / 2;
const glass = add(new THREE.IcosahedronGeometry(.52, 1), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: 1, roughness: .05, ior: 1.45,
  iridescence: .8, iridescenceIOR: 1.25, flatShading: true }), coreG, 0, CORE_Y, 0, false);
const heart = add(new THREE.IcosahedronGeometry(.18, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.8, 2), toneMapped: false }), coreG, 0, CORE_Y, 0, false);
const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.74, 1)), new THREE.LineBasicMaterial({ color: 0x8a8f99, transparent: true, opacity: .45 }));
shell.position.y = CORE_Y; coreG.add(shell);
const coreLight = new THREE.PointLight(0xcfeaff, 2.2, 6, 2); coreLight.position.y = CORE_Y; coreG.add(coreLight);
/* light streams from the core to each room's doorway, then inside */
const SP = MOBILE ? 24 : 48, sPos = new Float32Array(rooms.length * SP * 3), sCol = new Float32Array(rooms.length * SP * 3);
const curves = rooms.map((r, i) => {
  const R = r.R, D = R.extra ? R.extra.door : R.door, Rr = R.extra || R;
  const w = Rr.x1 - Rr.x0, d = Rr.z1 - Rr.z0, cx = (Rr.x0 + Rr.x1) / 2, cz = (Rr.z0 + Rr.z1) / 2;
  const off = (D[1] - .5) * ({ n: w, s: w, e: d, w: d })[D[0]];
  const door = ({ n: [cx + off, Rr.z0], s: [cx + off, Rr.z1], e: [Rr.x1, cz + off], w: [Rr.x0, cz + off] })[D[0]];
  const p0 = CORE.clone().setY(CORE_Y), p2 = new V3((door[0] * 2 + r.g.position.x) / 3, .55 + (R.raise ?? 0), (door[1] * 2 + r.g.position.z) / 3);
  const c = new V3((p0.x + p2.x) / 2, 2.2, (p0.z + p2.z) / 2);
  const col = new THREE.Color(r.brand.color); for (let j = 0; j < SP; j++) sCol.set([col.r, col.g, col.b], (i * SP + j) * 3);
  return { p0, c, p2 };
});
const sGeo = new THREE.BufferGeometry();
sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
building.add(new THREE.Points(sGeo, new THREE.PointsMaterial({ size: .13, map: glowTex, vertexColors: true, transparent: true, opacity: 1, depthWrite: false })));

/* ---------- camera ---------- */
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enableDamping: true, dampingFactor: .08, enablePan: false, rotateSpeed: .5, zoomSpeed: .7,
  minPolarAngle: .25, maxPolarAngle: 1.1, minAzimuthAngle: -.8, maxAzimuthAngle: .8 });
const FW = 19.4, FD = 13.8, home = { pos: new V3(), tgt: new V3(0, .3, 0) };
let portrait = null, fly = null, focused = null, saved = null;
function fit() {
  const a = innerWidth / innerHeight, was = portrait; portrait = a < .9;
  renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight);
  camera.aspect = a; camera.updateProjectionMatrix();
  building.rotation.y = portrait ? PI / 2 : 0;
  const W = portrait ? FD : FW, D = portrait ? FW : FD, polar = portrait ? .45 : .6;
  const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * a);
  const R = Math.max(W / 2 / Math.tan(hf / 2), (D * Math.cos(polar) + 2.6) / 2 / Math.tan(vf / 2)) * (portrait ? 1.08 : 1.06);
  home.pos.setFromSphericalCoords(R, polar, 0).add(home.tgt);
  controls.minDistance = R * .4; controls.maxDistance = R * 1.25;
  if (was !== portrait && !focused && !fly) { camera.position.copy(home.pos); controls.target.copy(home.tgt); controls.update(); }
}
const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
function flyTo(pos, tgt, ms, done) { controls.enabled = false; fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: tgt.clone(), start: performance.now(), ms: RM ? 1 : ms, done }; }

/* ---------- card, picking, entering ---------- */
const card = document.getElementById('card'), hint = document.getElementById('hint');
const focusEl = document.getElementById('focus'), focusMsg = document.getElementById('focusMsg'), backBtn = document.getElementById('backBtn');
const hex = c => '#' + c.toString(16).padStart(6, '0');
let hovered = null, touchUI = MOBILE;
PLAN.forEach(R => { new Image().src = R.img; });
hint.textContent = touchUI ? 'Drag to look around · Tap a room · Tap again to enter' : 'Drag to look around · Scroll to zoom · Hover a room · Click to enter';
function fillCard(r) {
  const R = r.R;
  card.innerHTML = `<img src="${R.img}" alt=""><h3><i style="background:${hex(r.brand.color)}"></i>${r.brand.name}</h3>
    <p class="ln">${r.brand.line}</p><ul>${R.hi.map(h => `<li>${h}</li>`).join('')}</ul>
    <p class="now"><b>Now</b><span>${R.now[r.nowI]}</span></p>
    <p class="ask">${R.b >= 0 ? 'Ask this room: live AI, next phase · ' : ''}${touchUI ? 'Tap again to enter' : 'Click to enter'}</p>`;
}
function setHover(r) { if (r === hovered) return; hovered = r; document.body.style.cursor = r && !touchUI ? 'pointer' : ''; if (r) fillCard(r); card.classList.toggle('on', !!r); }
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(9, 9);
function pick() { ray.setFromCamera(ptr, camera); const h = ray.intersectObjects(hits, false)[0]; return h ? rooms[h.object.userData.room] : null; }
let down = null, dragged = false;
const setPtr = e => ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1));
canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; dragged = false; touchUI = e.pointerType !== 'mouse'; setPtr(e); });
canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { touchUI = false; setPtr(e); } if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) dragged = true; });
canvas.addEventListener('pointerleave', () => { if (!touchUI) { ptr.set(9, 9); setHover(null); } });
canvas.addEventListener('pointerup', e => {
  const tap = down && !dragged; down = null; if (!tap || focused || fly) return;
  setPtr(e); const r = pick();
  if (touchUI) { if (r && r === hovered) enter(r); else setHover(r); } else if (r) enter(r);
});
function enter(r) {
  focused = r; saved = { pos: camera.position.clone(), tgt: controls.target.clone() }; setHover(null); hint.style.opacity = 0;
  const c = r.g.getWorldPosition(new V3()), dir = c.clone().sub(CORE.clone().applyQuaternion(building.quaternion)).setY(0).normalize().negate();
  const dist = Math.max(r.w, r.d) * .95 + 1.5;
  flyTo(c.clone().addScaledVector(dir, dist * .8).add(new V3(0, dist * .85, 0)), c.clone().add(new V3(0, .5, 0)), 1500, () => {
    focusMsg.textContent = r.R.b >= 0 ? `${r.brand.name}: its page will open here (not built yet)` : 'Founder’s office: the founder’s story opens here (not built yet)';
    focusEl.hidden = false; backBtn.focus({ preventScroll: true });
  });
}
function leave() { if (!focused || fly) return; focusEl.hidden = true; flyTo(saved.pos, saved.tgt, 1200, () => { focused = null; controls.enabled = true; hint.style.opacity = 1; }); }
backBtn.addEventListener('click', leave);
addEventListener('keydown', e => { if (e.key === 'Escape') leave(); });

/* ---------- start ---------- */
addEventListener('resize', fit); fit();
camera.position.copy(home.tgt).add(new V3().setFromSphericalCoords(home.pos.distanceTo(home.tgt) * 1.5, .05, 0));
controls.target.copy(home.tgt); camera.lookAt(home.tgt);
flyTo(home.pos, home.tgt, 2600, () => { controls.enabled = true; });

const clock = new THREE.Clock(), camFlat = new V3(), wn = new V3(), tmp = new V3(), wp = new V3(), wq = new THREE.Quaternion();
let lastScreen = 0, lastNow = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime, T = RM ? 0 : t;
  if (fly) {
    const u = clamp((performance.now() - fly.start) / fly.ms), e = ease(u);
    camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e); camera.lookAt(controls.target);
    if (u >= 1) { const d = fly.done; fly = null; d && d(); }
  } else if (controls.enabled) controls.update();
  if (!touchUI && !focused && !fly && !down) setHover(pick());
  if (hovered && !touchUI) {
    hovered.g.getWorldPosition(wp).add(tmp.set(0, 1.3, 0)).project(camera);
    const sx = (wp.x + 1) / 2 * innerWidth, sy = (1 - wp.y) / 2 * innerHeight, cw = 260, ch = card.offsetHeight;
    let x = sx + 50; if (x + cw > innerWidth - 12) x = sx - cw - 50;
    card.style.left = clamp(x, 12, innerWidth - cw - 12) + 'px'; card.style.top = clamp(sy - ch / 2, 70, innerHeight - ch - 12) + 'px';
  }
  /* rooms: lift on hover, rotate what each team is doing */
  if (t - lastNow > 6) { lastNow = t; rooms.forEach(r => { r.nowI = (r.nowI + 1) % r.R.now.length; }); if (hovered) fillCard(hovered); }
  rooms.forEach(r => {
    r.lift = lerp(r.lift, r === hovered || r === focused ? 1 : 0, Math.min(1, dt * 7));
    r.g.position.y = r.base + r.lift * .14; r.light.intensity = .6 + r.lift * 1.4;
    r.tick && r.tick(T);
    r.leds && r.leds.forEach(l => { l.material.emissiveIntensity = Math.sin(T * 5 + l.userData.blink) > .2 ? 2 : .3; });
  });
  people.forEach(P => { if (P.walk) P.walk(T, P.act); else P.act && P.act(P, T); });
  if (t - lastScreen > .2) { lastScreen = t; screens.forEach(s => { s.draw(s.x, s.cv.width, s.cv.height, s.st, T); s.tex.needsUpdate = true; }); }
  /* walls facing the camera drop low (cut-away view) */
  camFlat.copy(camera.position).sub(controls.target).setY(0).normalize();
  walls.forEach(w => {
    w.getWorldQuaternion(wq); wn.copy(w.userData.n).applyQuaternion(wq);
    w.userData.k = lerp(w.userData.k, wn.dot(camFlat) > .4 ? .25 : 1, Math.min(1, dt * 6));
    w.scale.y = w.userData.k; w.position.y = w.userData.h * w.userData.k / 2;
  });
  /* core */
  const bob = Math.sin(t * 1.2) * .06;
  glass.position.y = heart.position.y = shell.position.y = CORE_Y + bob;
  glass.rotation.y = T * .15; glass.rotation.x = T * .07; shell.rotation.y = -T * .08; heart.scale.setScalar(1 + .07 * Math.sin(t * 2));
  curves.forEach((c, i) => {
    const lift = rooms[i].lift * .14;
    for (let j = 0; j < SP; j++) {
      const u = (j / SP + T * .14) % 1, a = 1 - u;
      tmp.set(0, 0, 0).addScaledVector(c.p0, a * a).addScaledVector(c.c, 2 * a * u).addScaledVector(c.p2, u * u);
      tmp.y += bob * a * a + lift * u * u; sPos.set([tmp.x, tmp.y, tmp.z], (i * SP + j) * 3);
    }
  });
  sGeo.attributes.position.needsUpdate = true;
  composer.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__hq = { rooms, camera, controls, enter, leave };
