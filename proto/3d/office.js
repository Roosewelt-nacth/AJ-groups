/* AJ GROUPS · The office (blockout)
   The AJ Groups hero as a 3D office seen from above: two rows of three brand rooms on either
   side of a central atrium hall, with the constellation core floating in the hall and light
   streaming from it into every room.
   - Drag to look around (limited), scroll or pinch to zoom.
   - Hover a room (tap on phones) for its card; click (tap again) to fly in.
   - Style switch: Dark glow / Miniature / Realistic, same blockout. ?style=dark|mini|real
   Everything is built from simple shapes so the layout and interaction can be approved
   before real models are made. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BRANDS, MOBILE, RM, clamp, lerp, glowTexture } from './common.js';

/* placeholder card content per brand (same order as BRANDS) */
const U = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=520&q=70`;
const INFO = [
  { hi: ['Brand strategy', 'Social media campaigns', 'Performance ads'], img: U('photo-1563986768494-4dee2763ff3f') },
  { hi: ['Portrait sessions', 'Events', 'Commercial shoots'], img: U('photo-1516961642265-531546e84af2') },
  { hi: ['Seasonal collections', 'Tailored pieces', 'Lookbooks'], img: U('photo-1441986300917-64674bd600d8') },
  { hi: ['Websites and apps', 'Custom software', 'Support and hosting'], img: U('photo-1505685296765-3a2736de412f') },
  { hi: ['Fresh daily bakes', 'Custom cakes', 'Orders and catering'], img: U('photo-1515037893149-de7f840978e2') },
  { hi: ['Stories for kids', 'Learning videos', 'Creative play'], img: U('photo-1545558014-8692077e9b5c') },
];
INFO.forEach(x => { new Image().src = x.img; });

const V3 = THREE.Vector3;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
const camera = new THREE.PerspectiveCamera(30, 1, .1, 300);
const composer = new EffectComposer(renderer);
if (MOBILE) composer.setPixelRatio(1);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .55, .45, .78);
composer.addPass(bloom); composer.addPass(new OutputPass());

const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(-8, 15, 9);
sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 45 });
sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; scene.add(sun);

/* ---------- building helpers: every part carries a role, so a style can re-skin it ---------- */
const BLANK = new THREE.MeshBasicMaterial();
const meshes = [], walls = [];
function part(geo, role, p, x = 0, y = 0, z = 0, ex = {}) {
  const m = new THREE.Mesh(geo, BLANK); m.position.set(x, y, z);
  Object.assign(m.userData, { role }, ex);
  m.castShadow = role !== 'glass' && role !== 'screen' && role !== 'strip'; m.receiveShadow = true;
  p.add(m); meshes.push(m); return m;
}
const box = (w, h, d, role, p, x, y, z, ex) => part(new THREE.BoxGeometry(w, h, d), role, p, x, y, z, ex);
const cyl = (rt, rb, h, role, p, x, y, z, ex) => part(new THREE.CylinderGeometry(rt, rb, h, 24), role, p, x, y, z, ex);
const sph = (r, role, p, x, y, z, ex) => part(new THREE.SphereGeometry(r, 24, 16), role, p, x, y, z, ex);
function wall(w, h, d, p, x, z, n) {
  const m = box(w, h, d, 'wall', p, x, .12 + h / 2, z, { n, h, k: 1 }); walls.push(m); return m;
}

/* ---------- the six room objects (simple shapes standing in for real models) ---------- */
const TOYS = [0xff6b6b, 0xffd166, 0x4fb8ff, 0x7bd88f];
const BUILD = [
  /* Alven Studio: campaign wall of screens, meeting table, megaphone on a podium */
  g => {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const x = (c - 1) * .95, y = .55 + r * .6;
      box(.88, .54, .06, 'obj', g, x, y, -1.78); box(.8, .46, .01, 'screen', g, x, y, -1.745);
    }
    cyl(.55, .55, .05, 'accent', g, 0, .5, .3); cyl(.06, .08, .48, 'obj', g, 0, .25, .3);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; cyl(.14, .14, .3, 'soft', g, Math.cos(a) * .85, .15, .3 + Math.sin(a) * .85); }
    box(.4, .55, .4, 'obj', g, 1.4, .275, 1.1);
    const mp = part(new THREE.ConeGeometry(.15, .38, 24), 'accent', g, 1.4, .72, 1.1); mp.rotation.x = -Math.PI / 2.4;
  },
  /* House of Fovo: backdrop sweep, posing stool, camera on a tripod, two softboxes */
  g => {
    box(2.8, 1.7, .04, 'soft', g, 0, .85, -1.75); box(2.8, .01, 1.3, 'soft', g, 0, .006, -1.1);
    box(.34, .42, .34, 'obj', g, 0, .21, -1.05);
    for (let k = 0; k < 3; k++) {
      const a = k / 3 * Math.PI * 2 + .5, leg = cyl(.018, .018, 1, 'obj', g, Math.cos(a) * .16, .48, 1 + Math.sin(a) * .16);
      leg.rotation.set(Math.sin(a) * .18, 0, -Math.cos(a) * .18);
    }
    box(.3, .2, .18, 'obj', g, 0, 1.02, 1);
    const lens = cyl(.08, .09, .22, 'accent', g, 0, 1.02, .82); lens.rotation.x = Math.PI / 2;
    [-1.25, 1.25].forEach(x => {
      cyl(.02, .02, 1.2, 'obj', g, x, .6, .1);
      const sb = new THREE.Group(); sb.position.set(x, 1.3, .1); sb.rotation.y = x > 0 ? .7 : -.7; g.add(sb);
      box(.6, .6, .22, 'obj', sb, 0, 0, 0); box(.54, .54, .01, 'screen', sb, 0, 0, -.115);
    });
  },
  /* Clothing: clothing rail with garments, mannequin, mirror, pouf */
  g => {
    cyl(.03, .03, 1.2, 'obj', g, -1, .6, -1.3); cyl(.03, .03, 1.2, 'obj', g, 1, .6, -1.3);
    cyl(.025, .025, 2.05, 'obj', g, 0, 1.18, -1.3).rotation.z = Math.PI / 2;
    for (let k = 0; k < 6; k++) box(.26, .62, .07, k % 2 ? 'accent' : 'soft', g, -.8 + k * .32, .83, -1.3);
    cyl(.18, .2, .04, 'obj', g, .1, .02, .45); cyl(.02, .02, .62, 'obj', g, .1, .33, .45);
    part(new THREE.CapsuleGeometry(.17, .34, 6, 16), 'soft', g, .1, .92, .45).scale.z = .7;
    sph(.1, 'obj', g, .1, 1.37, .45);
    box(.62, 1.32, .03, 'obj', g, -1.47, .72, .58).rotation.y = .7;
    box(.55, 1.24, .04, 'glass', g, -1.45, .72, .6).rotation.y = .7;
    cyl(.28, .28, .32, 'accent', g, 1.25, .16, .85);
  },
  /* AJ Softwares: two desks with monitors, server racks, a wall screen */
  g => {
    const desk = (x, z) => {
      box(1.25, .05, .62, 'obj', g, x, .62, z);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(.04, .6, .04, 'obj', g, x + a * .58, .3, z + b * .27));
      box(.62, .38, .03, 'obj', g, x, .95, z - .2); box(.56, .32, .01, 'screen', g, x, .95, z - .183);
      box(.06, .14, .06, 'obj', g, x, .71, z - .2); box(.42, .02, .14, 'soft', g, x, .655, z + .05);
      cyl(.2, .2, .08, 'soft', g, x, .42, z + .55); cyl(.03, .03, .38, 'obj', g, x, .2, z + .55);
    };
    desk(-.75, .2); desk(.75, .2);
    [-1.3, -.7].forEach(x => { box(.5, 1.4, .5, 'obj', g, x, .7, -1.6); for (let k = 0; k < 6; k++) box(.38, .03, .01, 'screen', g, x, .3 + k * .18, -1.345); });
    box(1.3, .75, .04, 'obj', g, .8, 1.05, -1.82); box(1.2, .65, .01, 'screen', g, .8, 1.05, -1.795);
  },
  /* Bun Bun Bakes: counter with a glass case of buns, cake, oven, bread shelf, cafe tables */
  g => {
    box(2.6, .8, .65, 'obj', g, 0, .4, -.7); box(2.7, .05, .75, 'accent', g, 0, .825, -.7);
    box(1.1, .36, .5, 'glass', g, -.55, 1.03, -.7);
    for (let k = 0; k < 6; k++) sph(.075, 'bun', g, -.92 + (k % 3) * .37, .91, -.82 + Math.floor(k / 3) * .24).scale.y = .6;
    cyl(.2, .2, .14, 'soft', g, .75, .92, -.7); cyl(.14, .14, .12, 'soft', g, .75, 1.05, -.7); sph(.035, 'accent', g, .75, 1.14, -.7);
    box(1, 1, .6, 'obj', g, 1.15, .5, -1.6); box(.6, .32, .01, 'screen', g, 1.15, .62, -1.295);
    box(1.4, .04, .3, 'obj', g, -.9, 1.2, -1.8);
    for (let k = 0; k < 4; k++) sph(.1, 'bun', g, -1.4 + k * .32, 1.28, -1.8).scale.set(1.5, .7, .9);
    [[-.85, .9], [.85, 1.05]].forEach(([x, z]) => {
      cyl(.3, .3, .04, 'accent', g, x, .56, z); cyl(.03, .03, .54, 'obj', g, x, .27, z);
      cyl(.14, .14, .05, 'soft', g, x + .45, .34, z); cyl(.14, .14, .05, 'soft', g, x - .45, .34, z);
    });
  },
  /* AJ Little World: giant open storybook, toy block tower, ball, toy rocket, beanbag */
  g => {
    box(1, .07, 1.3, 'accent', g, -.5, .3, -.7).rotation.z = -.22; box(1, .07, 1.3, 'accent', g, .5, .3, -.7).rotation.z = .22;
    box(.94, .06, 1.22, 'soft', g, -.5, .36, -.7).rotation.z = -.22; box(.94, .06, 1.22, 'soft', g, .5, .36, -.7).rotation.z = .22;
    for (let k = 0; k < 4; k++) box(.32, .32, .32, 'toy', g, 1.2 + (k % 2) * .05, .16 + k * .32, .75, { col: TOYS[k] }).rotation.y = k * .35;
    box(.32, .32, .32, 'toy', g, .78, .16, .95, { col: TOYS[2] }).rotation.y = .5;
    sph(.22, 'toy', g, -1.25, .22, .9, { col: TOYS[0] });
    cyl(.12, .12, .6, 'soft', g, -1.4, .42, -1.5);
    part(new THREE.ConeGeometry(.12, .26, 24), 'accent', g, -1.4, .85, -1.5);
    [0, 2.1, 4.2].forEach(a => box(.04, .2, .18, 'accent', g, -1.4 + Math.cos(a) * .12, .18, -1.5 + Math.sin(a) * .12).rotation.y = -a);
    sph(.3, 'soft', g, .2, .15, .95).scale.set(1, .5, 1);
  },
];

/* ---------- floor plan: two rows of three rooms either side of the atrium hall ---------- */
const RW = 4, H = .95, T = .12, GAP = .4, HALL = 3.2;
const building = new THREE.Group(); scene.add(building);
const rooms = BRANDS.map((brand, i) => {
  const row = i < 3 ? 0 : 1, col = i % 3, s = row === 0 ? -1 : 1;   /* s: direction away from the hall */
  const g = new THREE.Group(); g.position.set((col - 1) * (RW + GAP), 0, s * (HALL / 2 + RW / 2)); building.add(g);
  box(RW, .12, RW, 'floor', g, 0, .06, 0);
  wall(RW, H, T, g, 0, s * (RW / 2 - T / 2), new V3(0, 0, s));
  wall(T, H, RW, g, -(RW / 2 - T / 2), 0, new V3(-1, 0, 0));
  wall(T, H, RW, g, RW / 2 - T / 2, 0, new V3(1, 0, 0));
  const seg = (RW - 1.3) / 2;   /* hall side: low wall either side of a doorway */
  wall(seg, H * .55, T, g, -(RW / 2 - seg / 2), -s * (RW / 2 - T / 2), new V3(0, 0, -s));
  wall(seg, H * .55, T, g, RW / 2 - seg / 2, -s * (RW / 2 - T / 2), new V3(0, 0, -s));
  const L = RW - .5;
  box(L, .02, .05, 'strip', g, 0, .13, L / 2); box(L, .02, .05, 'strip', g, 0, .13, -L / 2);
  box(.05, .02, L, 'strip', g, L / 2, .13, 0); box(.05, .02, L, 'strip', g, -L / 2, .13, 0);
  const obj = new THREE.Group(); obj.position.y = .12; if (s > 0) obj.rotation.y = Math.PI; g.add(obj);
  BUILD[i](obj);
  const light = new THREE.PointLight(brand.color, 0, 6, 1.6); light.position.set(0, 2.1, 0); g.add(light);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(RW, 1.8, RW), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = .9; hit.userData.room = i; g.add(hit);
  g.traverse(o => { if (o.userData.role && o.userData.b === undefined) o.userData.b = i; });
  return { i, g, light, hit, s, lift: 0, brand, info: INFO[i] };
});
const FW = 3 * (RW + GAP) + GAP, FD = 2 * RW + HALL;
box(FW, .08, HALL, 'hall', building, 0, .04, 0, { b: -1 });
box(FW + 1, .1, FD + 1, 'base', building, 0, -.05, 0, { b: -1 });

/* ---------- the constellation core in the atrium ---------- */
const glowTex = glowTexture();
const coreG = new THREE.Group(); building.add(coreG);
cyl(.9, 1, .14, 'obj', coreG, 0, .15, 0, { b: -1 });
part(new THREE.TorusGeometry(.93, .025, 8, 72), 'strip', coreG, 0, .23, 0, { b: -1 }).rotation.x = Math.PI / 2;
const CORE_Y = 1.65;
const glass = new THREE.Mesh(new THREE.IcosahedronGeometry(.5, 1), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: 1,
  roughness: .05, ior: 1.45, iridescence: .8, iridescenceIOR: 1.25, flatShading: true }));
glass.position.y = CORE_Y; coreG.add(glass);
const heart = new THREE.Mesh(new THREE.IcosahedronGeometry(.17, 3), new THREE.MeshBasicMaterial()); heart.position.y = CORE_Y; coreG.add(heart);
const heartGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
heartGlow.position.y = CORE_Y; heartGlow.scale.setScalar(1.9); coreG.add(heartGlow);
const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.72, 1)), new THREE.LineBasicMaterial({ transparent: true }));
shell.position.y = CORE_Y; coreG.add(shell);
const coreLight = new THREE.PointLight(0xbfe6ff, 0, 7, 2); coreLight.position.y = CORE_Y; coreG.add(coreLight);

/* light streams from the core into each room */
const P = MOBILE ? 28 : 56, sPos = new Float32Array(6 * P * 3), sCol = new Float32Array(6 * P * 3);
const curves = rooms.map(r => {
  const p2 = r.g.position.clone().add(new V3(0, .75, 0)), p0 = new V3(0, CORE_Y, 0);
  const c = new V3(p2.x * .55, 2.3, p2.z * .3);
  const col = new THREE.Color(r.brand.color); for (let j = 0; j < P; j++) sCol.set([col.r, col.g, col.b], (r.i * P + j) * 3);
  return { p0, c, p2 };
});
const sGeo = new THREE.BufferGeometry();
sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
const streams = new THREE.Points(sGeo, new THREE.PointsMaterial({ size: .09, map: glowTex, vertexColors: true, transparent: true, depthWrite: false }));
building.add(streams);

/* ---------- styles ---------- */
function bgTex(a, b, c) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const x = cv.getContext('2d');
  const gr = x.createRadialGradient(256, 220, 0, 256, 256, 400); gr.addColorStop(0, a); gr.addColorStop(.55, b); gr.addColorStop(1, c);
  x.fillStyle = gr; x.fillRect(0, 0, 512, 512); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function canvasTex(draw, rep) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; draw(cv.getContext('2d'));
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep);
  t.anisotropy = 8; return t;
}
const woodTex = canvasTex(x => {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 3; c++) {
    const off = (r % 2) * 85, l = 50 + Math.random() * 10;
    x.fillStyle = `hsl(28,${38 + Math.random() * 10}%,${l * .62}%)`; x.fillRect(c * 170 + off - 170, r * 64, 170, 64); x.fillRect(c * 170 + off, r * 64, 170, 64);
  }
  x.globalAlpha = .12; for (let k = 0; k < 400; k++) { x.fillStyle = Math.random() > .5 ? '#000' : '#fff'; x.fillRect(Math.random() * 512, Math.floor(Math.random() * 8) * 64 + Math.random() * 64, 30 + Math.random() * 90, 1); }
  x.globalAlpha = .35; x.fillStyle = '#2a1a10'; for (let r = 0; r <= 8; r++) x.fillRect(0, r * 64, 512, 2);
}, 1.5);
const concreteTex = canvasTex(x => {
  x.fillStyle = '#b9b9b7'; x.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 9000; k++) { x.fillStyle = `rgba(${Math.random() > .5 ? '0,0,0' : '255,255,255'},${Math.random() * .06})`; x.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 5, 2 + Math.random() * 5); }
}, 2);

const C = c => new THREE.Color(c), tint = (c, to, k) => C(c).lerp(C(to), k);
const Std = o => new THREE.MeshStandardMaterial(o), Phy = o => new THREE.MeshPhysicalMaterial(o), Bas = o => new THREE.MeshBasicMaterial(o);
const LOOK = {
  dark: (bc, col) => ({
    base: () => Std({ color: 0x050506, roughness: .9 }),
    floor: () => Phy({ color: tint(bc, 0x0b0b0e, .9), roughness: .38, clearcoat: .7, clearcoatRoughness: .2 }),
    hall: () => Phy({ color: 0x08080a, roughness: .22, metalness: .2, clearcoat: .8 }),
    wall: () => Std({ color: 0x17171c, roughness: .5, metalness: .25 }),
    obj: () => Std({ color: 0x232329, roughness: .42, metalness: .35 }),
    soft: () => Std({ color: tint(bc, 0x141417, .62), roughness: .85 }),
    accent: () => Std({ color: bc, emissive: bc, emissiveIntensity: .55, roughness: .4 }),
    screen: () => Bas({ color: tint(bc, 0xffffff, .15).multiplyScalar(1.15) }),
    strip: () => Bas({ color: C(bc).multiplyScalar(1.7) }),
    glass: () => Phy({ color: 0xffffff, transmission: 1, roughness: .05, thickness: .3 }),
    bun: () => Std({ color: 0x9a6430, roughness: .6, emissive: 0x3a1e08, emissiveIntensity: .5 }),
    toy: () => Std({ color: col, emissive: col, emissiveIntensity: .35, roughness: .5 }),
  }),
  mini: (bc, col) => ({
    base: () => Std({ color: 0xe0d4c3, roughness: 1 }),
    floor: () => Std({ color: tint(bc, 0xf6efe6, .74), roughness: .95 }),
    hall: () => Std({ color: 0xefe6da, roughness: .95 }),
    wall: () => Std({ color: 0xfbf6ef, roughness: .95 }),
    obj: () => Std({ color: 0xf1e9df, roughness: .9 }),
    soft: () => Std({ color: tint(bc, 0xffffff, .45), roughness: .95 }),
    accent: () => Std({ color: tint(bc, 0xffffff, .12), roughness: .8 }),
    screen: () => Std({ color: tint(bc, 0xffffff, .55), emissive: tint(bc, 0xffffff, .55), emissiveIntensity: .25, roughness: .7 }),
    strip: () => Std({ color: tint(bc, 0xffffff, .3), roughness: .8 }),
    glass: () => Std({ color: 0xe8f4f8, transparent: true, opacity: .45, roughness: .2 }),
    bun: () => Std({ color: 0xd9a066, roughness: .9 }),
    toy: () => Std({ color: col, roughness: .85 }),
  }),
  real: (bc, col) => ({
    base: () => Std({ color: 0xb5b7ba, roughness: .9 }),
    floor: () => Std({ map: woodTex, roughness: .5 }),
    hall: () => Std({ map: concreteTex, color: 0xd6d6d4, roughness: .32 }),
    wall: () => Std({ color: 0xefeeeb, roughness: .9 }),
    obj: () => Std({ color: 0x2c2c30, roughness: .35, metalness: .6 }),
    soft: () => Std({ color: tint(bc, 0x808080, .3), roughness: .95 }),
    accent: () => Std({ color: bc, roughness: .45, metalness: .1 }),
    screen: () => Std({ color: 0x000000, emissive: tint(bc, 0xffffff, .3), emissiveIntensity: .9, roughness: .2 }),
    strip: () => Std({ color: 0x3b2a1e, roughness: .6 }),
    glass: () => Phy({ color: 0xffffff, transmission: .95, roughness: .03, thickness: .2 }),
    bun: () => Std({ color: 0xb87a3e, roughness: .7 }),
    toy: () => Std({ color: col, roughness: .55 }),
  }),
};
const cache = new Map();
function mat(style, role, b, col) {
  const key = `${style}|${role}|${b}|${col ?? ''}`;
  if (!cache.has(key)) cache.set(key, LOOK[style](b >= 0 ? BRANDS[b].color : 0xdfe9ff, col)[role]());
  return cache.get(key);
}
const STY = {
  dark: { bg: bgTex('#202027', '#0c0c10', '#040405'), exp: 1, hemi: [0x8090b0, 0x050505, .35], sun: [0xffffff, .25], shadow: false, bloom: true, env: .22,
    room: 2.6, core: 1.6, streams: [THREE.AdditiveBlending, .9], heart: [1.05, 1.2, 1.3], glow: .22, shell: [0xaabfff, .22] },
  mini: { bg: bgTex('#f8f2e9', '#ede4d7', '#ddd0be'), exp: 1.05, hemi: [0xfff5e6, 0xcbb9a2, 1.5], sun: [0xfff1dc, 2.3], shadow: true, bloom: false, env: .3,
    room: 0, core: 0, streams: [THREE.NormalBlending, .6], heart: [1, .97, .93], glow: 0, shell: [0x9b8b78, .45] },
  real: { bg: bgTex('#eef0f3', '#d8dadd', '#c3c5c9'), exp: 1, hemi: [0xffffff, 0x8c8c8c, .75], sun: [0xfff6ea, 2.8], shadow: true, bloom: false, env: 1,
    room: .9, core: 1, streams: [THREE.NormalBlending, .4], heart: [.92, .97, 1], glow: .08, shell: [0x77777c, .35] },
};
let style = 'dark';
const btns = [...document.querySelectorAll('.sw button')];
function applyStyle(s) {
  if (!STY[s]) s = 'dark';
  style = s; const S = STY[s];
  document.body.dataset.style = s;
  scene.background = S.bg; renderer.toneMappingExposure = S.exp; scene.environmentIntensity = S.env;
  hemi.color.set(S.hemi[0]); hemi.groundColor.set(S.hemi[1]); hemi.intensity = S.hemi[2];
  sun.color.set(S.sun[0]); sun.intensity = S.sun[1]; sun.castShadow = S.shadow; bloom.enabled = S.bloom;
  meshes.forEach(m => { m.material = mat(s, m.userData.role, m.userData.b, m.userData.col); });
  streams.material.blending = S.streams[0]; streams.material.opacity = S.streams[1]; streams.material.needsUpdate = true;
  heart.material.color.setRGB(...S.heart); heartGlow.material.opacity = S.glow;
  shell.material.color.set(S.shell[0]); shell.material.opacity = S.shell[1];
  btns.forEach(b => b.setAttribute('aria-checked', b.dataset.s === s));
}
btns.forEach(b => b.addEventListener('click', () => {
  applyStyle(b.dataset.s);
  const q = new URLSearchParams(location.search); q.set('style', b.dataset.s); history.replaceState(null, '', '?' + q);
}));
applyStyle(new URLSearchParams(location.search).get('style') || 'dark');

/* ---------- bird's-eye camera ---------- */
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enableDamping: true, dampingFactor: .08, enablePan: false, rotateSpeed: .55, zoomSpeed: .7,
  minPolarAngle: .3, maxPolarAngle: 1.12, minAzimuthAngle: -.75, maxAzimuthAngle: .75 });
const home = { pos: new V3(), tgt: new V3(0, .3, 0) };
let portrait = null;
function fit() {
  const a = innerWidth / innerHeight, was = portrait; portrait = a < .9;
  renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight);
  camera.aspect = a; camera.updateProjectionMatrix();
  building.rotation.y = portrait ? Math.PI / 2 : 0;   /* phones: the hall runs top to bottom */
  const W = portrait ? FD : FW, D = portrait ? FW : FD, polar = portrait ? .5 : .62;
  const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * a);
  const R = Math.max(W / 2 / Math.tan(hf / 2), (D * Math.cos(polar) + 2.6) / 2 / Math.tan(vf / 2)) * (portrait ? .98 : 1.18);
  home.pos.setFromSphericalCoords(R, polar, 0).add(home.tgt);
  controls.minDistance = R * .5; controls.maxDistance = R * 1.25;
  if (was !== portrait && !focused && !fly) { camera.position.copy(home.pos); controls.target.copy(home.tgt); controls.update(); }
}

/* camera flights: intro, into a room, and back */
let fly = null, focused = null, saved = null;
const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
function flyTo(pos, tgt, ms, done) {
  controls.enabled = false;
  fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: tgt.clone(), start: performance.now(), ms: RM ? 1 : ms, done };
}

/* ---------- hover card, picking, entering a room ---------- */
const card = document.getElementById('card'), hint = document.getElementById('hint');
const focusEl = document.getElementById('focus'), focusMsg = document.getElementById('focusMsg'), backBtn = document.getElementById('backBtn');
const hex = c => '#' + c.toString(16).padStart(6, '0');
let hovered = null, touchUI = MOBILE;
hint.textContent = touchUI ? 'Drag to look around · Tap a room · Tap again to enter' : 'Drag to look around · Scroll to zoom · Hover a room · Click to enter';
function setHover(r) {
  if (r === hovered) return;
  hovered = r; document.body.style.cursor = r && !touchUI ? 'pointer' : '';
  if (r) card.innerHTML = `<img src="${r.info.img}" alt=""><h3><i style="background:${hex(r.brand.color)}"></i>${r.brand.name}</h3>
    <p class="ln">${r.brand.line}</p><ul>${r.info.hi.map(h => `<li>${h}</li>`).join('')}</ul><p class="go">${touchUI ? 'Tap again to enter' : 'Click to enter'}</p>`;
  card.classList.toggle('on', !!r);
}
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(9, 9), hits = rooms.map(r => r.hit);
function pick() { ray.setFromCamera(ptr, camera); const h = ray.intersectObjects(hits, false)[0]; return h ? rooms[h.object.userData.room] : null; }
let down = null, dragged = false;
const setPtr = e => ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1));
canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; dragged = false; touchUI = e.pointerType !== 'mouse'; setPtr(e); });
canvas.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse') touchUI = false;
  if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) dragged = true;
  if (e.pointerType === 'mouse') setPtr(e);
});
canvas.addEventListener('pointerleave', () => { if (!touchUI) { ptr.set(9, 9); setHover(null); } });
canvas.addEventListener('pointerup', e => {
  const tap = down && !dragged; down = null;
  if (!tap || focused || fly) return;
  setPtr(e); const r = pick();
  if (touchUI) { if (r && r === hovered) enter(r); else setHover(r); }
  else if (r) enter(r);
});

function enter(r) {
  focused = r; saved = { pos: camera.position.clone(), tgt: controls.target.clone() };
  setHover(null); hint.style.opacity = 0;
  const c = r.g.getWorldPosition(new V3()), hd = new V3(0, 0, -r.s).applyQuaternion(building.quaternion);
  flyTo(c.clone().addScaledVector(hd, 3.7).add(new V3(0, 3.2, 0)), c.clone().add(new V3(0, .55, 0)), 1400, () => {
    focusMsg.textContent = `${r.brand.name}: its page will open here (not built yet)`;
    focusEl.hidden = false; backBtn.focus({ preventScroll: true });
  });
}
function leave() {
  if (!focused || fly) return;
  focusEl.hidden = true;
  flyTo(saved.pos, saved.tgt, 1200, () => { focused = null; controls.enabled = true; hint.style.opacity = 1; });
}
backBtn.addEventListener('click', leave);
addEventListener('keydown', e => { if (e.key === 'Escape') leave(); });

/* ---------- start ---------- */
addEventListener('resize', fit); fit();
camera.position.copy(home.tgt).add(new V3().setFromSphericalCoords(home.pos.distanceTo(home.tgt) * 1.55, .04, 0));
controls.target.copy(home.tgt); camera.lookAt(home.tgt);
flyTo(home.pos, home.tgt, 2600, () => { controls.enabled = true; });

const clock = new THREE.Clock(), camFlat = new V3(), wn = new V3(), tmp = new V3(), wp = new V3();
function frame() {
  const dt = Math.min(clock.getDelta(), .05), time = clock.elapsedTime;
  if (fly) {
    const u = clamp((performance.now() - fly.start) / fly.ms), e = ease(u);
    camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e); camera.lookAt(controls.target);
    if (u >= 1) { const d = fly.done; fly = null; d && d(); }
  } else if (controls.enabled) controls.update();

  if (!touchUI && !focused && !fly && !down) setHover(pick());
  if (hovered && !touchUI) {
    hovered.g.getWorldPosition(wp).add(tmp.set(0, 1.4, 0)).project(camera);
    const sx = (wp.x + 1) / 2 * innerWidth, sy = (1 - wp.y) / 2 * innerHeight, cw = 260, ch = card.offsetHeight;
    let x = sx + 40; if (x + cw > innerWidth - 12) x = sx - cw - 40;
    card.style.left = clamp(x, 12, innerWidth - cw - 12) + 'px'; card.style.top = clamp(sy - ch / 2, 70, innerHeight - ch - 12) + 'px';
  }

  const S = STY[style];
  rooms.forEach(r => {
    r.lift = lerp(r.lift, r === hovered || r === focused ? 1 : 0, Math.min(1, dt * 7));
    r.g.position.y = r.lift * .16;
    r.light.intensity = S.room * (1 + 1.3 * r.lift);
  });
  /* walls facing the camera drop low, like a cut-away dollhouse */
  camFlat.copy(camera.position).sub(controls.target).setY(0).normalize();
  walls.forEach(w => {
    wn.copy(w.userData.n).applyQuaternion(building.quaternion);
    w.userData.k = lerp(w.userData.k, wn.dot(camFlat) > .45 ? .28 : 1, Math.min(1, dt * 6));
    w.scale.y = w.userData.k; w.position.y = .12 + w.userData.h * w.userData.k / 2;
  });
  /* core */
  const bob = Math.sin(time * 1.2) * .06;
  glass.position.y = heart.position.y = heartGlow.position.y = shell.position.y = CORE_Y + bob;
  glass.rotation.y = time * .15; glass.rotation.x = time * .07; shell.rotation.y = -time * .08;
  heart.scale.setScalar(1 + .07 * Math.sin(time * 2)); coreLight.intensity = S.core;
  /* streams */
  curves.forEach((c, i) => {
    const lift = rooms[i].lift * .16;
    for (let j = 0; j < P; j++) {
      const u = (j / P + time * .16) % 1, a = 1 - u;
      tmp.set(0, 0, 0).addScaledVector(c.p0, a * a).addScaledVector(c.c, 2 * a * u).addScaledVector(c.p2, u * u);
      tmp.y += bob * a * a + lift * u * u;
      sPos.set([tmp.x, tmp.y, tmp.z], (i * P + j) * 3);
    }
  });
  sGeo.attributes.position.needsUpdate = true;
  composer.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__office = { rooms, camera, controls, applyStyle, enter, leave, get fly() { return fly; } };
