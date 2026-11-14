/* AJ GROUPS · The ascent (prototype 1)
   Story: wherever there is an opening, Allwyn builds. Six businesses are six camps on one climb up a mountain at night;
   the summit is the founder's vision. The mountain is a floating peak of black glossy rock with real rock detail, a thin path of
   light spirals up it, and a lit crystal marks each camp. Scroll is the climb: the camera follows the path from camp to camp. */
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const V3 = THREE.Vector3, PI = Math.PI;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const stopEls = [...document.querySelectorAll('.stop')], N = stopEls.length;
document.documentElement.style.setProperty('--n', N);
let sd = 7; const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };

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
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .35;
const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(-5, 6, 5); scene.add(key);
const rimL = new THREE.DirectionalLight(0x9fc8ff, 2.4); rimL.position.set(6, 3, -4); scene.add(rimL);
scene.add(new THREE.HemisphereLight(0x8a8f99, 0x050505, .3));

/* ---------- noise ---------- */
const h3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
function vn(x, y, z) { const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h3(ix, iy, iz), h3(ix + 1, iy, iz), u), l(h3(ix, iy + 1, iz), h3(ix + 1, iy + 1, iz), u), v), l(l(h3(ix, iy, iz + 1), h3(ix + 1, iy, iz + 1), u), l(h3(ix, iy + 1, iz + 1), h3(ix + 1, iy + 1, iz + 1), u), v), w); }
const fbm = (x, y, z) => vn(x, y, z) * .55 + vn(x * 2.1, y * 2.1, z * 2.1) * .3 + vn(x * 4.3, y * 4.3, z * 4.3) * .15;
const ridge = (x, y, z) => { const a = 1 - Math.abs(fbm(x, y, z) * 2 - 1), b = 1 - Math.abs(fbm(x * 2.3 + 5, y * 2.3, z * 2.3 + 9) * 2 - 1); return a * a * .65 + b * b * .35; };

/* ---------- the mountain: a floating peak with a tapering underside ---------- */
const H = 2.7, R0 = 1.55;
const geo0 = new THREE.IcosahedronGeometry(1, MOBILE ? 5 : 6); geo0.deleteAttribute('normal'); geo0.deleteAttribute('uv');
let geo = mergeVertices(geo0, 1e-4); const P = geo.attributes.position, tv = new V3(), uvs = new Float32Array(P.count * 2);
for (let i = 0; i < P.count; i++) {
  tv.fromBufferAttribute(P, i);
  const y = tv.y, th = Math.atan2(tv.z, tv.x);
  const prof = y >= 0 ? Math.pow(1 - y, .8) : Math.pow(1 + y, .5);
  const asym = 1 + .22 * (fbm(Math.cos(th) * 1.3 + 2, y * 1.1, Math.sin(th) * 1.3) - .5) * 2;
  let r = R0 * prof * asym;
  const px = Math.cos(th) * r, pz = Math.sin(th) * r, py = y * H;
  const rg = ridge(px * .75 + 4, py * .5, pz * .75), fine = fbm(px * 3.1, py * 3.1 + 3, pz * 3.1) - .5;
  const amp = prof > 0 ? Math.pow(prof, .7) * (y > 0 ? 1 : .8) : 0;
  r += (rg * 1.05 - .46 + fine * .3) * amp * R0 * .85;
  r *= 1 + .26 * amp * (Math.pow(Math.abs(Math.sin(th * 3. + fbm(px * .6, py * .4, pz * .6) * 4.)), .6) - .5);   /* ridges that run down from the summit */
  r = Math.max(r, 0);
  const jag = y > .78 ? (1 + .3 * Math.sin(th * 5 + 1.) * sstep(.78, .98, y)) : 1;                 /* a sharper summit */
  P.setXYZ(i, Math.cos(th) * r * jag, py + (fine * .12) * amp, Math.sin(th) * r * jag);
  uvs[i * 2] = (th / (2 * PI) + .5) * 3.2; uvs[i * 2 + 1] = (y * .5 + .5) * 3.2;
}
geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geo.computeVertexNormals();
const nTex = new THREE.TextureLoader().load('../../assets/models/rocks/rock_09/textures/rock_09_nor_gl_1k.jpg', t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; }); nTex.wrapS = nTex.wrapT = THREE.RepeatWrapping;
const mat = new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: .5, metalness: .1, clearcoat: .7, clearcoatRoughness: .3, normalMap: nTex, normalScale: new THREE.Vector2(2.0, 2.0), envMapIntensity: .9 });
const mountain = new THREE.Mesh(geo, mat), group = new THREE.Group(); group.add(mountain); scene.add(group);
mountain.updateMatrixWorld(true);

/* ---------- the path of light and the camps ---------- */
const BR = [
  { name: 'Alven Studio', col: 0x38d9c0, u: .15 }, { name: 'House of Fovo', col: 0xdfe7ff, u: .3 }, { name: 'Clothing', col: 0xffb066, u: .45 },
  { name: 'AJ Softwares', col: 0xa77bff, u: .6 }, { name: 'Bun Bun Bakes', col: 0xff7d96, u: .75 }, { name: 'AJ Little World', col: 0x5fb6ff, u: .89 },
];
const ray = new THREE.Raycaster(), up = new V3(0, 1, 0), pathPts = [], pathN = [];
const TURNS = 2.1, Y0 = -.38 * H, Y1 = .93 * H;
for (let k = 0; k <= 60; k++) {
  const u = k / 60, y = lerp(Y0, Y1, u), th = -.4 + u * TURNS * 2 * PI;
  ray.set(new V3(Math.cos(th) * 9, y, Math.sin(th) * 9), new V3(-Math.cos(th), 0, -Math.sin(th)));
  const hit = ray.intersectObject(mountain, false)[0];
  if (hit) { const n = hit.face.normal.clone().transformDirection(mountain.matrixWorld).normalize(); pathPts.push(hit.point.clone().addScaledVector(n, .035)); pathN.push(n); }
}
const curve = new THREE.CatmullRomCurve3(pathPts, false, 'catmullrom', .5);
const pathMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 240, .012, 5, false), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.25, .8), transparent: true, opacity: .75, toneMapped: false }));
group.add(pathMesh);

function crystalGeo(rad, h) {
  const pts = [[0, 0], [rad * .92, 0], [rad, h * .78], [rad * .55, h], [0, h * 1.12]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 6); g.computeVertexNormals(); return g;
}
const crystals = [];
function camp(pos, n, color, big, summit) {
  const cg = new THREE.Group(); cg.position.copy(pos); cg.quaternion.setFromUnitVectors(up, n.clone().add(new V3(0, .35, 0)).normalize()); cg.scale.setScalar(.42 * (summit ? 1.15 : 1));
  const col = new THREE.Color(color);
  const m = new THREE.MeshPhysicalMaterial({ color: col.clone().multiplyScalar(.6), emissive: col, emissiveIntensity: .6, roughness: .08, clearcoat: 1, flatShading: true });
  const list = [[0, 0, 0, big * .9, big * 1.7, 0, 0], [.22, 0, .1, big * .5, big * 1.0, .35, .3], [-.2, 0, -.06, big * .42, big * .85, -.3, -.4]];
  list.forEach(([x, y, z, r, h, rz, rx]) => { const c = new THREE.Mesh(crystalGeo(r * .22, h * .5), m); c.position.set(x * .3, y, z * .3); c.rotation.set(rx, 0, rz); cg.add(c); });
  const light = new THREE.PointLight(color, MOBILE ? 0 : .9, 3.4, 2); light.position.set(0, .4, 0); cg.add(light);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(.7, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = .3; cg.add(hit);
  group.add(cg); return { cg, m, light, hit, n: n.clone(), focus: 0, hover: 0, color };
}
BR.forEach((b, i) => { const t = curve.getPointAt(b.u), idx = Math.min(pathN.length - 1, Math.round(b.u * (pathN.length - 1))); const c = camp(t, pathN[idx], b.col, 1, false); c.hit.userData.i = i; crystals.push(c); });
{ const top = new V3(0, H * .985, 0); const c = camp(top, new V3(0, 1, 0), 0xf2d9a0, 1.2, true); c.hit.userData.i = 6; crystals.push(c); }

/* ---------- particles: wind and snow that arrive from the left and wrap the mountain ---------- */
const PN = MOBILE ? 700 : 1800;
const pg = new THREE.BufferGeometry(), pu = new Float32Array(PN), ps = new Float32Array(PN * 3), pp = new Float32Array(PN * 3);
for (let i = 0; i < PN; i++) { pu[i] = rnd(); ps.set([rnd(), rnd(), rnd()], i * 3); }
pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('aU', new THREE.BufferAttribute(pu, 1)); pg.setAttribute('aS', new THREE.BufferAttribute(ps, 3));
const pm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uFocus: { value: new V3() }, uHold: { value: 0 } },
  vertexShader: `attribute float aU; attribute vec3 aS; uniform float uTime, uPR, uHold; uniform vec3 uFocus; varying float vA;
  void main(){
    float u = fract(aU + uTime * (.016 + aS.x * .016)); float k = pow(u, 1.1);
    vec3 p = vec3(mix(-17., 0., k), 0., 0.); float w = (1. - k) * 1.6 + .15;
    p.y = .6 + sin(k * 3.2 + aS.y * 6.28) * .8 * (1. - k) + (aS.y - .5) * w * 2.;
    p.z = (aS.z - .5) * w * 3.4 + sin(k * 5. + aS.x * 6.28) * .35 * (1. - k);
    float sw = smoothstep(.8, 1., k); float a = aS.x * 6.28 + uTime * .22;
    p += vec3(cos(a), (aS.y - .5) * 3.2, sin(a)) * sw * (2. + aS.z * 1.1);
    p = mix(p, uFocus + vec3(cos(a), (aS.y - .5) * 1.2, sin(a)) * (.55 + aS.z * .7), uHold * .5);
    vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.1 + aS.z * 2.3) * uPR * (8. / -mv.z);
    vA = (.25 + .75 * aS.x) * smoothstep(0., .08, k) * (1. - .5 * sw);
  }`,
  fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(.96, .96, .98, smoothstep(.5, .12, d) * vA); }` });
const parts = new THREE.Points(pg, pm); parts.frustumCulled = false; scene.add(parts);

let composer = null;
if (!MOBILE) { composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), .5, .55, .8)); composer.addPass(new OutputPass()); }

/* ---------- the climb: a pose for each stop ---------- */
const wp = new V3(), wn = new V3();
function poseFor(i, out) {
  if (i === 0) { out.pos.set(.8, .2, 14); out.look.set(0, .15, 0); return out; }
  if (i === 7) { out.pos.set(-1.4, 2.6, 9.8); out.look.set(0, H * .62, 0); return out; }
  const c = crystals[i - 1]; c.cg.getWorldPosition(wp); wn.copy(c.n).transformDirection(group.matrixWorld).normalize();
  out.look.copy(wp).addScaledVector(wn, .1);
  const out3 = new V3(wp.x, 0, wp.z).normalize();                                      /* stand out from the mountain, looking in */
  out.pos.copy(wp).addScaledVector(wn, 2.6).addScaledVector(out3, 1.1).add(new V3(0, .5, 0));
  return out;
}
const pa = { pos: new V3(), look: new V3() }, pb = { pos: new V3(), look: new V3() }, cur = { pos: new V3(.8, .2, 14), look: new V3() }, tgtPose = { pos: new V3(), look: new V3() };
let jump = null, jumpTo = -1, sNow = 0;
const dotsEl = document.getElementById('dots');
dotsEl.innerHTML = stopEls.map(el => `<button type="button" aria-label="${(el.querySelector('h1,h2') || el).textContent.replace(/\s+/g, ' ').trim()}"></button>`).join('');
const dotBtns = [...dotsEl.children], vh = () => innerHeight;
function goTo(i) {
  i = clamp(Math.round(i), 0, N - 1); if (i === Math.round(sNow) && !jump) return;
  jump = RM ? null : { from: { pos: cur.pos.clone(), look: cur.look.clone() }, i, t0: performance.now(), ms: 1400 }; jumpTo = i; sNow = i; scrollTo(0, i * vh());
}
dotBtns.forEach((b, i) => b.addEventListener('click', () => goTo(i)));
const PIN = parseFloat(new URLSearchParams(location.search).get('s'));
const meta = document.getElementById('meta'), prog = document.getElementById('prog'), progN = document.getElementById('progN'), tip = document.getElementById('tip');
stopEls.forEach(el => { if (el.dataset.c) el.style.setProperty('--c', el.dataset.c); });

const ptr = new THREE.Vector2(9, 9), PTR = { cx: 0, cy: 0 }; let hovered = -1;
addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); PTR.cx = e.clientX; PTR.cy = e.clientY; }, { passive: true });
canvas.addEventListener('click', e => { ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); ray.setFromCamera(ptr, camera); const h = ray.intersectObjects(crystals.map(c => c.hit), false)[0]; if (h) goTo(h.object.userData.i + 1); });
function fit() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer && composer.setSize(w, h);
  camera.aspect = w / h; const phone = w <= 760;
  camera.setViewOffset(w, h, phone ? 0 : -w * .16, phone ? h * .17 : 0, w, h); camera.updateProjectionMatrix();
}
fit(); addEventListener('resize', fit);

const clock = new THREE.Clock(); let first = true, curIdx = -1;
function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime, T = RM ? 0 : t;
  const target = isNaN(PIN) ? clamp(scrollY / vh(), 0, N - 1) : clamp(PIN, 0, N - 1);
  if (jump && Math.abs(target - jumpTo) > .3) jump = null;
  sNow = jump ? jumpTo : (first ? target : sNow + (target - sNow) * Math.min(1, dt * 5));
  group.position.y = Math.sin(T * .5) * .05; group.rotation.y = Math.sin(T * .16) * .06 - .35; group.updateMatrixWorld(true);
  const i0 = Math.min(N - 2, Math.floor(clamp(sNow, 0, N - 1))), f = clamp(sNow - i0, 0, 1);
  if (jump) {
    const u = clamp((performance.now() - jump.t0) / jump.ms), e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; poseFor(jump.i, tgtPose);
    cur.pos.lerpVectors(jump.from.pos, tgtPose.pos, e); cur.look.lerpVectors(jump.from.look, tgtPose.look, e); cur.pos.y += Math.sin(e * PI) * .8; if (u >= 1) jump = null;
  } else { poseFor(i0, pa); poseFor(i0 + 1, pb); const g = sstep(.15, .85, f); cur.pos.lerpVectors(pa.pos, pb.pos, g); cur.look.lerpVectors(pa.look, pb.look, g); }
  camera.position.copy(cur.pos); camera.lookAt(cur.look);
  const near = Math.round(clamp(sNow, 0, N - 1)), foc = near - 1;
  crystals.forEach((c, k) => {
    c.focus += ((k === foc ? 1 : 0) - c.focus) * Math.min(1, dt * 4); c.hover += ((k === hovered ? 1 : 0) - c.hover) * Math.min(1, dt * 8);
    const reached = sNow >= k + .4 ? 1 : .35, pulse = .5 + .5 * Math.sin(T * 1.3 + k * 1.7);
    c.m.emissiveIntensity = (.25 + .35 * reached) + pulse * .08 + c.focus * .5; c.light.intensity = (MOBILE ? 0 : .8) * (reached + c.focus * 1.6 + c.hover);
  });
  const d = Math.abs(sNow - near), op = 1 - sstep(.08, .34, d);
  stopEls.forEach((el, k) => { const on = k === near; el.style.setProperty('--o', on ? op.toFixed(3) : 0); el.classList.toggle('cur', on && op > .4); });
  if (near !== curIdx) { curIdx = near; dotBtns.forEach((b, k) => k === near ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')); progN.textContent = stopEls[near].dataset.label || 'Base'; }
  meta.style.opacity = sNow < .1 ? 1 : 0; prog.style.opacity = sNow > .15 ? 1 : 0;
  if (!first && matchMedia('(hover: hover)').matches && !jump) {
    ray.setFromCamera(ptr, camera); const h = ray.intersectObjects(crystals.map(c => c.hit), false)[0], k = h ? h.object.userData.i : -1;
    if (k !== hovered) { hovered = k; document.body.style.cursor = k >= 0 ? 'pointer' : ''; if (k >= 0) tip.innerHTML = `<i style="background:#${(k < 6 ? BR[k].col : 0xf2d9a0).toString(16).padStart(6, '0')}"></i>${k < 6 ? BR[k].name : 'The summit'}`; tip.classList.toggle('on', k >= 0); }
    if (k >= 0) { tip.style.left = (PTR.cx + 16) + 'px'; tip.style.top = (PTR.cy + 16) + 'px'; }
  }
  pm.uniforms.uTime.value = T;
  if (foc >= 0) crystals[foc].cg.getWorldPosition(pm.uniforms.uFocus.value); pm.uniforms.uHold.value += ((foc >= 0 ? 1 : 0) - pm.uniforms.uHold.value) * Math.min(1, dt * 3);
  composer ? composer.render() : renderer.render(scene, camera);
  first = false; requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__ascent = { camera, crystals, goTo, group };
