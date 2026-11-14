/* AJ GROUPS · A new era (prototype 1)
   Built from the client's reference: a charcoal page, a black faceted rock floating on the right with crystals growing from it,
   a stream of white particles arriving from the left, a thin serif headline. Here the rock carries six crystals, one per business,
   and the camera visits each as you scroll. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const V3 = THREE.Vector3, PI = Math.PI;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const stopEls = [...document.querySelectorAll('.stop')], N = stopEls.length;
document.documentElement.style.setProperty('--n', N);
let sd = 5; const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };

const canvas = document.getElementById('c');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !MOBILE, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
if (!renderer) { stopEls.forEach(e => { e.style.visibility = 'visible'; e.style.position = 'static'; e.style.opacity = 1; e.style.transform = 'none'; e.style.padding = '90px 22px 20px'; }); throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
{ const cv = document.createElement('canvas'); cv.width = cv.height = 512; const x = cv.getContext('2d'), g = x.createRadialGradient(300, 240, 0, 256, 256, 420);
  g.addColorStop(0, '#2b2b2c'); g.addColorStop(.55, '#161617'); g.addColorStop(1, '#0a0a0a'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; }
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .3;
const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-4, 5, 5); scene.add(key);
const rimL = new THREE.DirectionalLight(0x9fd8ff, 2.2); rimL.position.set(5, 2, -3); scene.add(rimL);
scene.add(new THREE.HemisphereLight(0x8a8f99, 0x050505, .35));

/* ---------- noise ---------- */
const h3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
function vn(x, y, z) { const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h3(ix, iy, iz), h3(ix + 1, iy, iz), u), l(h3(ix, iy + 1, iz), h3(ix + 1, iy + 1, iz), u), v), l(l(h3(ix, iy, iz + 1), h3(ix + 1, iy, iz + 1), u), l(h3(ix, iy + 1, iz + 1), h3(ix + 1, iy + 1, iz + 1), u), v), w); }
const fbm = (x, y, z) => vn(x, y, z) * .55 + vn(x * 2.1, y * 2.1, z * 2.1) * .3 + vn(x * 4.3, y * 4.3, z * 4.3) * .15;

/* ---------- the rock: an angular obsidian mass with a cave in one side ---------- */
const BR = [
  { id: 'alven', name: 'Alven Studio', line: 'Digital marketing', col: 0x38d9c0, dir: [.05, 1, .12], big: 1.0 },
  { id: 'fovo', name: 'House of Fovo', line: 'Photography', col: 0xdfe7ff, dir: [-.85, .35, .45], big: .7 },
  { id: 'wear', name: 'Clothing', line: 'Clothing', col: 0xffb066, dir: [.8, -.4, .5], big: .72 },
  { id: 'soft', name: 'AJ Softwares', line: 'Software', col: 0xa77bff, dir: [.62, -.1, .78], big: .9, cave: true },
  { id: 'bun', name: 'Bun Bun Bakes', line: 'Bakery', col: 0xff7d96, dir: [-.4, -.55, -.75], big: .7 },
  { id: 'kids', name: 'AJ Little World', line: 'Children', col: 0x5fb6ff, dir: [-.6, .2, -.8], big: .68 },
];
/* ---------- the rock: a real photogrammetry scan (Poly Haven, CC0), finished as black glossy obsidian ---------- */
const group = new THREE.Group(); scene.add(group);
const crystals = [], ray = new THREE.Raycaster(), up = new V3(0, 1, 0); let rock = null;
function crystalGeo(rad, h) {
  const pts = [[0, 0], [rad * .92, 0], [rad, h * .78], [rad * .55, h], [0, h * 1.12]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 6); g.computeVertexNormals(); return g;
}
function placeCrystals() {
  group.updateMatrixWorld(true); const inv = group.matrixWorld.clone().invert();
  BR.forEach((b, bi) => {
    const d = new V3(...b.dir).normalize();
    ray.set(d.clone().multiplyScalar(9), d.clone().negate()); const hit = ray.intersectObject(rock, false)[0];
    const pw = hit ? hit.point.clone() : d.clone().multiplyScalar(1.4), nw = hit ? hit.face.normal.clone().transformDirection(rock.matrixWorld).normalize() : d.clone();
    const p = pw.applyMatrix4(inv), n = nw.transformDirection(inv).normalize(); p.addScaledVector(n, -.04);
    const cg = new THREE.Group(); cg.position.copy(p); cg.quaternion.setFromUnitVectors(up, n.clone().add(new V3(0, .2, 0)).normalize()); cg.scale.setScalar(.5);
    const col = new THREE.Color(b.col);
    const mat = new THREE.MeshPhysicalMaterial({ color: col.clone().multiplyScalar(.6), emissive: col, emissiveIntensity: .55, roughness: .08, metalness: 0, clearcoat: 1, transparent: true, opacity: .97, flatShading: true });
    const list = [[0, 0, 0, b.big * .9, b.big * 1.7, 0, 0], [.22, 0, .1, b.big * .5, b.big * 1.0, .35, .3], [-.2, 0, -.06, b.big * .42, b.big * .85, -.3, -.4]];
    const meshes = list.map(([x, y, z, r, h, rz, rx]) => { const m = new THREE.Mesh(crystalGeo(r * .22, h * .5), mat); m.position.set(x * .3, y, z * .3); m.rotation.set(rx, 0, rz); cg.add(m); return m; });
    const light = new THREE.PointLight(b.col, MOBILE ? 0 : .8, 3, 2); light.position.set(0, .35, 0); cg.add(light);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 4), new THREE.MeshBasicMaterial({ visible: false })); cg.add(glow);
    const hit2 = new THREE.Mesh(new THREE.SphereGeometry(.6, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); hit2.position.y = .3; hit2.userData.i = bi; cg.add(hit2);
    group.add(cg); crystals.push({ b, cg, mat, light, glow, hit: hit2, meshes, focus: 0, hover: 0, n: n.clone() });
  });
}
new GLTFLoader().load('../../assets/models/rocks/rock_09/rock_09_1k.gltf', g => {
  let mesh = null; g.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
  const holder = new THREE.Group(); holder.add(g.scene);
  const box = new THREE.Box3().setFromObject(g.scene), size = box.getSize(new V3()), ctr = box.getCenter(new V3());
  const k = 3.3 / Math.max(size.x, size.y, size.z); g.scene.scale.setScalar(k); g.scene.position.set(-ctr.x * k, -ctr.y * k, -ctr.z * k);
  const old = mesh.material;
  mesh.material = new THREE.MeshPhysicalMaterial({ color: 0x040405, roughness: .42, metalness: .1, clearcoat: 1, clearcoatRoughness: .25, normalMap: old.normalMap, normalScale: new THREE.Vector2(1.1, 1.1), envMapIntensity: .8 });
  mesh.castShadow = mesh.receiveShadow = false;
  group.add(holder); rock = mesh; group.scale.setScalar(1); group.updateMatrixWorld(true); rock.updateMatrixWorld(true);
  placeCrystals();
}, undefined, err => console.warn('rock failed', err));

/* ---------- particles: a stream that arrives from the left and wraps the rock, like the reference ---------- */
const PN = MOBILE ? 700 : 1900;
const pg = new THREE.BufferGeometry(), pu = new Float32Array(PN), ps = new Float32Array(PN * 3), pp = new Float32Array(PN * 3);
for (let i = 0; i < PN; i++) { pu[i] = rnd(); ps.set([rnd(), rnd(), rnd()], i * 3); }
pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('aU', new THREE.BufferAttribute(pu, 1)); pg.setAttribute('aS', new THREE.BufferAttribute(ps, 3));
const pm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uFocus: { value: new THREE.Vector3() }, uHold: { value: 0 } },
  vertexShader: `attribute float aU; attribute vec3 aS; uniform float uTime, uPR, uHold; uniform vec3 uFocus; varying float vA;
  void main(){
    float u = fract(aU + uTime * (.018 + aS.x * .018));
    float k = pow(u, 1.15);
    vec3 p = vec3(mix(-15., 1.4, k), 0., 0.);
    float w = (1. - k) * 1.5 + .12;
    p.y = .5 + sin(k * 3.2 + aS.y * 6.28) * .55 * (1. - k) + (aS.y - .5) * w * 1.6;
    p.z = (aS.z - .5) * w * 3. + sin(k * 5. + aS.x * 6.28) * .3 * (1. - k);
    float swirl = smoothstep(.82, 1., k);
    float a = aS.x * 6.28 + uTime * .3; p += vec3(cos(a), (aS.y - .5) * 1.4, sin(a)) * swirl * (.9 + aS.z * .8) * .9;
    p = mix(p, uFocus + vec3(cos(a), (aS.y - .5) * 1.2, sin(a)) * (.5 + aS.z * .7), uHold * .6);
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.1 + aS.z * 2.4) * uPR * (7. / -mv.z);
    vA = (.25 + .75 * aS.x) * smoothstep(0., .08, k) * (1. - .55 * swirl);
  }`,
  fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(.96, .96, .98, smoothstep(.5, .12, d) * vA); }` });
const parts = new THREE.Points(pg, pm); parts.frustumCulled = false; scene.add(parts);

/* ---------- post: a restrained bloom (laptops only) ---------- */
let composer = null;
if (!MOBILE) { composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), .42, .55, .82)); composer.addPass(new OutputPass()); }

/* ---------- camera poses: a hero view, then one close view per crystal ---------- */
const DISTS = [7.2, 3.1, 3.1, 3.1, 3.1, 3.1, 3.1];
const wp = new V3(), wn = new V3();
function poseFor(i, out) {
  if (i === 0) { out.pos.set(.6, .5, 7.4); out.look.set(0, .1, 0); return out; }
  if (!crystals[i - 1]) { out.pos.set(.6, .5, 7.4); out.look.set(0, .1, 0); return out; }
  const c = crystals[i - 1]; c.cg.getWorldPosition(wp); wn.copy(c.n).transformDirection(group.matrixWorld).normalize();
  out.look.copy(wp).addScaledVector(wn, .25);
  out.pos.copy(wp).addScaledVector(wn, DISTS[i]).add(new V3(0, .35, 0));
  return out;
}
const pa = { pos: new V3(), look: new V3() }, pb = { pos: new V3(), look: new V3() }, cur = { pos: new V3(.6, .5, 7.4), look: new V3() }, ltmp = new V3();
let jump = null, jumpTo = -1;

const dotsEl = document.getElementById('dots');
dotsEl.innerHTML = stopEls.map((el, i) => `<button type="button" aria-label="${(el.querySelector('h1,h2') || el).textContent.replace(/\s+/g, ' ').trim()}"></button>`).join('');
const dotBtns = [...dotsEl.children], vh = () => innerHeight;
function goTo(i) {
  i = clamp(Math.round(i), 0, N - 1); if (i === Math.round(sNow) && !jump) return;
  jump = RM ? null : { from: { pos: cur.pos.clone(), look: cur.look.clone() }, i, t0: performance.now(), ms: 1300 }; jumpTo = i; sNow = i;
  scrollTo(0, i * vh());
}
dotBtns.forEach((b, i) => b.addEventListener('click', () => goTo(i)));
const PIN = parseFloat(new URLSearchParams(location.search).get('s'));
const meta = document.getElementById('meta'), chev = document.getElementById('chev'), tip = document.getElementById('tip');
stopEls.forEach(el => { if (el.dataset.c) el.style.setProperty('--c', el.dataset.c); });

/* pointer */
const ptr = new THREE.Vector2(9, 9), P = { x: 0, y: 0, cx: 0, cy: 0 }; let hovered = -1;
addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); P.x = ptr.x; P.y = ptr.y; P.cx = e.clientX; P.cy = e.clientY; }, { passive: true });
canvas.addEventListener('click', e => { ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); ray.setFromCamera(ptr, camera); const h = ray.intersectObjects(crystals.map(c => c.hit), false)[0]; if (h) goTo(h.object.userData.i + 1); });

function fit() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer && composer.setSize(w, h);
  camera.aspect = w / h; const phone = w <= 760;
  camera.setViewOffset(w, h, phone ? 0 : -w * .17, phone ? h * .16 : 0, w, h); camera.updateProjectionMatrix();
}
fit(); addEventListener('resize', fit);

const clock = new THREE.Clock(); let sNow = 0, first = true, curIdx = -1;
const tgtPose = { pos: new V3(), look: new V3() };
function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime, T = RM ? 0 : t;
  const target = isNaN(PIN) ? clamp(scrollY / vh(), 0, N - 1) : clamp(PIN, 0, N - 1);
  if (jump && Math.abs(target - jumpTo) > .3) jump = null;
  sNow = jump ? jumpTo : (first ? target : sNow + (target - sNow) * Math.min(1, dt * 5));
  /* the rock floats and sways slowly */
  group.position.y = Math.sin(T * .5) * .06; group.rotation.y = Math.sin(T * .18) * .14 - .1; group.rotation.z = Math.sin(T * .23) * .02;
  group.updateMatrixWorld(true);
  /* camera */
  const i0 = Math.min(N - 2, Math.floor(clamp(sNow, 0, N - 1))), f = clamp(sNow - i0, 0, 1);
  if (jump) {
    const u = clamp((performance.now() - jump.t0) / jump.ms), e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; poseFor(jump.i, tgtPose);
    cur.pos.lerpVectors(jump.from.pos, tgtPose.pos, e); cur.look.lerpVectors(jump.from.look, tgtPose.look, e); cur.pos.y += Math.sin(e * PI) * .5; if (u >= 1) jump = null;
  } else { poseFor(i0, pa); poseFor(i0 + 1, pb); const g = sstep(.15, .85, f); cur.pos.lerpVectors(pa.pos, pb.pos, g); cur.look.lerpVectors(pa.look, pb.look, g); }
  camera.position.copy(cur.pos); camera.lookAt(cur.look);
  /* crystals: the focused one glows, the others rest */
  const near = Math.round(clamp(sNow, 0, N - 1)), foc = near - 1;
  crystals.forEach((c, k) => {
    c.focus += ((k === foc ? 1 : 0) - c.focus) * Math.min(1, dt * 4); c.hover += ((k === hovered ? 1 : 0) - c.hover) * Math.min(1, dt * 8);
    const pulse = .5 + .5 * Math.sin(T * 1.2 + k * 1.7);
    c.mat.emissiveIntensity = .3 + pulse * .08; c.light.intensity = (MOBILE ? 0 : .8) * (1 + c.focus * 1.8 + c.hover * 1.1); c.glow.material.opacity = 0;
    c.cg.scale.setScalar(.62 * (1 + c.focus * .1 + c.hover * .08));
  });
  /* panels, dots, meta */
  const d = Math.abs(sNow - near), op = 1 - sstep(.08, .34, d);
  stopEls.forEach((el, k) => { const on = k === near; el.style.setProperty('--o', on ? op.toFixed(3) : 0); el.classList.toggle('cur', on && op > .4); });
  if (near !== curIdx) { curIdx = near; dotBtns.forEach((b, k) => k === near ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')); }
  meta.style.opacity = chev.style.opacity = sNow < .1 ? 1 : 0;
  /* hover (laptops) */
  if (!first && matchMedia('(hover: hover)').matches && !jump) {
    ray.setFromCamera(ptr, camera); const h = ray.intersectObjects(crystals.map(c => c.hit), false)[0], k = h ? h.object.userData.i : -1;
    if (k !== hovered) { hovered = k; document.body.style.cursor = k >= 0 ? 'pointer' : ''; if (k >= 0) tip.innerHTML = `<i style="background:#${BR[k].col.toString(16).padStart(6, '0')}"></i>${BR[k].name}`; tip.classList.toggle('on', k >= 0); }
    if (k >= 0) { tip.style.left = (P.cx + 16) + 'px'; tip.style.top = (P.cy + 16) + 'px'; }
  }
  pm.uniforms.uTime.value = T;
  if (foc >= 0) crystals[foc].cg.getWorldPosition(pm.uniforms.uFocus.value); pm.uniforms.uHold.value += ((foc >= 0 ? 1 : 0) - pm.uniforms.uHold.value) * Math.min(1, dt * 3);
  composer ? composer.render() : renderer.render(scene, camera);
  first = false; requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__era = { camera, crystals, goTo };
