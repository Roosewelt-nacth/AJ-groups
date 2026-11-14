/* AJ GROUPS · The journey (component 1)
   A real mountain at night with a spiral road carved into it. A dummy climber follows the road as you scroll, from base camp past six
   checkpoints (one per venture) to the summit. A cinematic descent opens the page. Each checkpoint holds a placeholder stage
   where that venture's HQ room goes in component 2. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createHQ } from './hqrooms.js';

const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const V3 = THREE.Vector3, PI = Math.PI;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t, sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const stopEls = [...document.querySelectorAll('.stop')], N = stopEls.length; document.documentElement.style.setProperty('--n', N);
let sd = 3; const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
const q = new URLSearchParams(location.search), PIN = parseFloat(q.get('s')), OPEN = parseFloat(q.get('open'));

const canvas = document.getElementById('c');
let renderer; try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !MOBILE, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
if (!renderer) { stopEls.forEach(e => { e.style.visibility = 'visible'; e.style.position = 'static'; e.style.opacity = 1; e.style.transform = 'none'; e.style.padding = '90px 22px 20px'; }); document.body.classList.add('hello'); throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x1a2236, .0075);
const camera = new THREE.PerspectiveCamera(36, 1, .5, 900);

/* ---------- noise ---------- */
const h3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
function vn(x, y, z) { const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz), l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h3(ix, iy, iz), h3(ix + 1, iy, iz), u), l(h3(ix, iy + 1, iz), h3(ix + 1, iy + 1, iz), u), v), l(l(h3(ix, iy, iz + 1), h3(ix + 1, iy, iz + 1), u), l(h3(ix, iy + 1, iz + 1), h3(ix + 1, iy + 1, iz + 1), u), v), w); }
const fbm = (x, y, z) => vn(x, y, z) * .55 + vn(x * 2.1, y * 2.1, z * 2.1) * .3 + vn(x * 4.3, y * 4.3, z * 4.3) * .15;
const ridge = (x, z) => { const a = 1 - Math.abs(fbm(x, 0, z) * 2 - 1), b = 1 - Math.abs(fbm(x * 2.3 + 5, 3, z * 2.3 + 9) * 2 - 1); return a * a * .65 + b * b * .35; };

/* ---------- the mountain, with a spiral road ---------- */
const HT = 44, RB = 52, RT = 4, TURNS = 3.2, SIZE = 150;
const Hc = r => HT * Math.pow(Math.max(0, 1 - r / 72), 1.5);
const rU = u => lerp(RB, RT, u), thU = u => -PI / 2 + u * TURNS * 2 * PI;
const pathAt = u => { const r = rU(u), th = thU(u); return new V3(Math.cos(th) * r, Hc(r) + .05, Math.sin(th) * r); };
const STOP_U = [0, .1, .24, .38, .53, .68, .83, 1];
const checks = []; for (let i = 1; i <= 6; i++) { const u = STOP_U[i], p = pathAt(u), th = thU(u), out = new V3(Math.cos(th), 0, Math.sin(th)); checks.push({ u, p, out, s: p.clone().addScaledVector(out, 11.5) }); }
function height(x, z) {
  const r = Math.hypot(x, z), th = Math.atan2(z, x);
  let h = Hc(r) + (ridge(x * .035, z * .035) * 13 - 5.5) * (.25 + Hc(r) / HT * .9) * clamp(r / 8) + (fbm(x * .22, 1, z * .22) - .5) * 1.8 * clamp(Hc(r) / 6);
  if (r < RB + 8 && r > RT - 3) {                                                  /* the road: a graded shelf along the spiral */
    let best = 1e9, bu = 0;
    for (let k = -1; k <= 4; k++) { const u = (th + PI / 2 + 2 * PI * k) / (TURNS * 2 * PI); if (u < -.02 || u > 1.02) continue; const d = Math.abs(r - rU(clamp(u))); if (d < best) { best = d; bu = clamp(u); } }
    const w = 1 - sstep(2.2, 7.5, best); h = lerp(h, Hc(rU(bu)), w);
  }
  for (const c of checks) { const d = Math.hypot(x - c.s.x, z - c.s.z); h = lerp(h, c.p.y - .1, 1 - sstep(10, 18, d)); }          /* level pads for the stages */
  return h - 2.5 * sstep(60, 75, r);
}
const SEG = MOBILE ? 120 : 190, tg = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG).rotateX(-PI / 2), P = tg.attributes.position, col = new Float32Array(P.count * 3), uv = tg.attributes.uv;
for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); P.setY(i, height(x, z)); uv.setXY(i, x * .09, z * .09); }
tg.computeVertexNormals(); const nrm = tg.attributes.normal, cA = new THREE.Color(.05, .047, .05), cB = new THREE.Color(.12, .09, .07), cC = new THREE.Color(.14, .14, .16), snow = new THREE.Color(.62, .68, .8), tmp = new THREE.Color();
for (let i = 0; i < P.count; i++) {
  const x = P.getX(i), y = P.getY(i), z = P.getZ(i), slope = 1 - nrm.getY(i), n = fbm(x * .12, y * .1, z * .12);
  tmp.copy(cA).lerp(cB, n * .9).lerp(cC, clamp(slope * 2.2 - .3));
  const sn = sstep(27, 36, y + (n - .5) * 8) * (1 - clamp(slope * 1.9)); tmp.lerp(snow, sn);
  col.set([tmp.r, tmp.g, tmp.b], i * 3);
}
tg.setAttribute('color', new THREE.BufferAttribute(col, 3));
const nTex = new THREE.TextureLoader().load('../../assets/models/rocks/rock_09/textures/rock_09_nor_gl_1k.jpg'); nTex.wrapS = nTex.wrapT = THREE.RepeatWrapping; nTex.anisotropy = 8;
const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: 0, normalMap: nTex, normalScale: new THREE.Vector2(1.4, 1.4) })); scene.add(terrain);
/* the road as a faint strip of light on the ground */
{ const pts = []; for (let k = 0; k <= 400; k++) { const u = k / 400, p = pathAt(u); p.y = height(p.x, p.z) + .06; pts.push(p); }
  const roadGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 800, .07, 4, false); scene.add(new THREE.Mesh(roadGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.05, .75), transparent: true, opacity: .55, toneMapped: false }))); }

/* ---------- sky: blue hour at the base, deep night, then dawn at the summit ---------- */
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uAlt: { value: 0 } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `varying vec3 vP; uniform float uAlt; void main(){
    float h = clamp(vP.y, -.1, 1.);
    vec3 zenA = vec3(.012,.026,.10), midA = vec3(.05,.10,.28), horA = vec3(.32,.30,.46);          /* blue hour */
    vec3 zenB = vec3(.004,.008,.03), midB = vec3(.015,.03,.10), horB = vec3(.06,.08,.17);         /* deep night */
    vec3 zenC = vec3(.05,.09,.24), midC = vec3(.30,.26,.40), horC = vec3(1.0,.62,.34);              /* dawn */
    float a = smoothstep(.0,.55,uAlt), c = smoothstep(.72,1.,uAlt);
    vec3 zen = mix(mix(zenA,zenB,a),zenC,c), mid = mix(mix(midA,midB,a),midC,c), hor = mix(mix(horA,horB,a),horC,c);
    vec3 col = mix(hor, mid, smoothstep(0.,.22,h)); col = mix(col, zen, smoothstep(.1,.9,h));
    col += vec3(1.,.6,.35) * exp(-abs(vP.y) * 16.) * mix(.18,.45,c);
    gl_FragColor = vec4(col, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }` });
const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), skyMat); sky.renderOrder = -10; scene.add(sky);
{ const n = 900, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = rnd() * PI * 2, y = .06 + rnd() * .94, r = Math.sqrt(1 - y * y) * 580; pos.set([Math.cos(a) * r, y * 580, Math.sin(a) * r], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.8, sizeAttenuation: false, color: 0xd6deff, transparent: true, opacity: .75, depthWrite: false, fog: false })); stars.renderOrder = -9; scene.add(stars); window.__stars = stars; }
const moonLight = new THREE.DirectionalLight(0x9db5ff, 1.5); moonLight.position.set(-60, 90, 40); scene.add(moonLight);
const warm = new THREE.DirectionalLight(0xffc89a, 0); warm.position.set(80, 20, -60); scene.add(warm);
scene.add(new THREE.HemisphereLight(0x6f86c0, 0x14121a, .5));

/* ---------- checkpoint stages (placeholders: the HQ rooms replace these in component 2) ---------- */
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, metalness: .2, ...o }), bas = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
const COLS = [0x38d9c0, 0xdfe7ff, 0xffb066, 0xa77bff, 0xff7d96, 0x5fb6ff];
/* summit beacon */
const summit = pathAt(1); const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 14, 6), bas(new THREE.Color(1.6, 1.3, .8))); beacon.position.copy(summit).add(new V3(0, 7, 0)); beacon.material.transparent = true; beacon.material.opacity = .5; scene.add(beacon);

/* ---------- the dummy climber ---------- */
const climber = new THREE.Group(); scene.add(climber);
let mixer = null, walkA = null, idleA = null, hasModel = false;
{ const proxy = new THREE.Mesh(new THREE.CapsuleGeometry(.28, 1.1, 4, 10), std(0xd9d4cc, { roughness: .5 })); proxy.position.y = .85; climber.add(proxy); climber.userData.proxy = proxy; }
new GLTFLoader().load('../../assets/models/people/UAL1_Standard.glb', gl => {
  const m = SkeletonUtils.clone(gl.scene), box3 = new THREE.Box3().setFromObject(m), hgt = box3.getSize(new V3()).y || 1.8;
  const mat = new THREE.MeshStandardMaterial({ color: 0xd9d4cc, roughness: .5, metalness: .05 }); m.traverse(o => { if (o.isMesh) { o.material = mat; o.frustumCulled = false; } });
  m.scale.setScalar(1.82 / hgt); climber.remove(climber.userData.proxy); climber.add(m); mixer = new THREE.AnimationMixer(m);
  const cl = n => gl.animations.find(a => a.name === n) || gl.animations[0]; walkA = mixer.clipAction(cl('Walk_Loop')); idleA = mixer.clipAction(cl('Idle_Loop')); walkA.play(); idleA.play(); idleA.setEffectiveWeight(1); walkA.setEffectiveWeight(0); hasModel = true;
});

/* ---------- camera and journey ---------- */
const uOfS = s => { const i = clamp(Math.floor(s), 0, N - 2), f = clamp(s - i, 0, 1); return lerp(STOP_U[i], STOP_U[i + 1], sstep(.08, .92, f)); };
const up = new V3(0, 1, 0), tanV = new V3(), outV = new V3(), pP = new V3(), A = new V3(), B = new V3(), Lk = new V3(), tmpV = new V3();
/* camp cameras: a three-quarter view from above and behind the climber, lifted until nothing in the mountain blocks the line to the stage */
const stageCam = checks.map(c => {
  const u = c.u, e = .004, tv = pathAt(Math.min(1, u + e)).sub(pathAt(Math.max(0, u - e))); tv.y = 0; tv.normalize();
  const look = c.p.clone().lerp(c.s, .8).add(new V3(0, 1.6, 0)), upv = new V3(0, 1, 0);
  const mk = (base, o, t, h) => base.clone().addScaledVector(c.out, o).addScaledVector(tv, t).addScaledVector(upv, h);
  const clearAt = pos => { for (let k = 1; k <= 18; k++) { const t = k / 25, x = lerp(pos.x, look.x, t), z = lerp(pos.z, look.z, t), y = lerp(pos.y, look.y, t); if (height(x, z) + 1.2 > y) return false; } return height(pos.x, pos.z) + 3 < pos.y; };
  /* try views in order of preference: behind the climber, then out over the drop on either side, then ahead of him */
  const cands = [mk(c.p, -2, -17, 7), mk(c.s, 14, -10, 6.5), mk(c.s, 14, 10, 6.5), mk(c.p, -2, 17, 7), mk(c.s, 17, -4, 9)];
  let pos = cands.find(clearAt);
  if (!pos) { pos = cands[0].clone(); for (let n = 0; n < 40 && !clearAt(pos); n++) pos.y += 1.5; }
  return { pos, look };
});
function frameAt(u, s) {
  pP.copy(pathAt(u)); pP.y = height(pP.x, pP.z); const e = .004; tanV.copy(pathAt(Math.min(1, u + e))).sub(pathAt(Math.max(0, u - e))); tanV.y = 0; tanV.normalize(); const th = thU(u); outV.set(Math.cos(th), 0, Math.sin(th));
  /* follow shot */
  A.copy(pP).addScaledVector(tanV, -9).addScaledVector(outV, -2.2).add(new V3(0, 3.6, 0)); Lk.copy(pP).addScaledVector(tanV, 5).add(new V3(0, 1.9, 0));
  /* checkpoint view */
  const near = Math.round(clamp(s, 0, N - 1)), w = 1 - sstep(.05, .42, Math.abs(s - near));
  if (near >= 1 && near <= 6) { const sc = stageCam[near - 1]; A.lerp(sc.pos, w); Lk.lerp(sc.look, w); }
  if (near === 0) { B.set(18, 11, -92); tmpV.set(0, 20, -6); A.lerp(B, w); Lk.lerp(tmpV, w); }
  if (near === 7) { const su = pathAt(1); B.set(su.x - 34, su.y + 9, su.z - 40); tmpV.copy(su).add(new V3(0, 1, 0)); A.lerp(B, w); Lk.lerp(tmpV, w); }
}
/* ---------- the HQ rooms, one at each camp ---------- */
const hq = createHQ(), ORDER = ['alven', 'fovo', 'wear', 'soft', 'bun', 'kids'], ROOM_SCALE = 1.5, roomLights = [];
ORDER.forEach((id, i) => {
  const R = hq.byId[id], c = checks[i], holder = new THREE.Group(), sc = stageCam[i];
  R.g.position.x = 0; R.g.position.z = 0; holder.add(R.g); holder.scale.setScalar(ROOM_SCALE); holder.position.set(c.s.x, c.p.y + .5, c.s.z);
  const phi = Math.atan2(sc.pos.x - c.s.x, sc.pos.z - c.s.z); holder.rotation.y = phi - .5 + (R.def.rot || 0) * 0;
  const L = new THREE.PointLight(COLS[i], MOBILE ? 0 : 55, 20, 2); L.position.set(0, 3.2, 0.5); holder.add(L); roomLights.push(L);
  scene.add(holder); R.holder = holder;
});
let composer = null; if (!MOBILE) { composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), .38, .6, .85)); composer.addPass(new OutputPass()); }
const dotsEl = document.getElementById('dots'); dotsEl.innerHTML = stopEls.map(el => `<button type="button" aria-label="${(el.querySelector('h1,h2') || el).textContent.replace(/\s+/g, ' ').trim()}"></button>`).join('');
const dotBtns = [...dotsEl.children], vh = () => innerHeight, fade = document.getElementById('fade'), altN = document.getElementById('altN'), altH = document.getElementById('altH');
stopEls.forEach(el => { if (el.dataset.c) el.style.setProperty('--c', el.dataset.c); });
let sNow = 0, goingTo = -1;
dotBtns.forEach((b, i) => b.addEventListener('click', () => { if (i === Math.round(sNow)) return; goingTo = i; fade.classList.add('on'); setTimeout(() => { scrollTo(0, i * vh()); sNow = i; fade.classList.remove('on'); goingTo = -1; }, 380); }));
function fit() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer && composer.setSize(w, h); camera.aspect = w / h; const ph = w <= 760; camera.setViewOffset(w, h, ph ? 0 : -w * .13, ph ? h * .15 : 0, w, h); camera.updateProjectionMatrix(); }
fit(); addEventListener('resize', fit);
/* the cinematic opening: a high aerial that drops to base camp */
let openT0 = performance.now(), opening = isNaN(PIN) && !RM; const OPEN_MS = 5200;
if (!opening) document.body.classList.add('hello'); else if (!isNaN(OPEN)) document.body.classList.add('hello'); else setTimeout(() => document.body.classList.add('hello'), 3000);
const camPos = new V3(18, 11, -92), camLook = new V3(0, 20, -6), start = { pos: new V3(95, 110, -150), look: new V3(0, 30, 0) };
const clock = new THREE.Clock(); let prevU = 0, first = true, walkW = 0, yawC = 0, curIdx = -1;
function frame() {
  const dt = Math.min(clock.getDelta(), .05), T = RM ? 0 : clock.elapsedTime;
  const target = isNaN(PIN) ? clamp(scrollY / vh(), 0, N - 1) : clamp(PIN, 0, N - 1);
  sNow = first ? target : sNow + (target - sNow) * Math.min(1, dt * 4.2);
  const u = uOfS(sNow); frameAt(u, sNow);
  /* climber */
  const du = (u - prevU) / Math.max(dt, .001); prevU = u;
  climber.position.copy(pP); const want = du < -.004 ? Math.atan2(-tanV.x, -tanV.z) : Math.atan2(tanV.x, tanV.z); yawC += (((want - yawC + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI) * Math.min(1, dt * 6); climber.rotation.y = yawC;
  const moving = clamp(Math.abs(du) / .05); walkW += (moving - walkW) * Math.min(1, dt * 6);
  if (hasModel) { walkA.setEffectiveWeight(walkW); idleA.setEffectiveWeight(1 - walkW); walkA.timeScale = .6 + clamp(Math.abs(du) / .12) * .9; mixer.update(dt); } else climber.children[0] && (climber.children[0].position.y = .85 + Math.abs(Math.sin(T * 5)) * .05 * walkW);
  /* camera */
  if (opening && isNaN(OPEN)) { const k = clamp((performance.now() - openT0) / OPEN_MS), e = k * k * (3 - 2 * k); camPos.lerpVectors(start.pos, A, e); camLook.lerpVectors(start.look, Lk, e); if (k >= 1) opening = false; }
  else if (!isNaN(OPEN)) { const e = OPEN * OPEN * (3 - 2 * OPEN); camPos.lerpVectors(start.pos, A, e); camLook.lerpVectors(start.look, Lk, e); }
  else { camPos.lerp(A, first ? 1 : Math.min(1, dt * 5)); camLook.lerp(Lk, first ? 1 : Math.min(1, dt * 5)); }
  { const gy = height(camPos.x, camPos.z) + 3.2; if (camPos.y < gy) camPos.y += (gy - camPos.y) * Math.min(1, dt * 8 + (first ? 1 : 0)); }
  camera.position.copy(camPos); camera.lookAt(camLook); sky.position.copy(camera.position); if (window.__stars) window.__stars.position.copy(camera.position);
  /* sky and light follow the altitude */
  const alt = clamp(pP.y / HT); skyMat.uniforms.uAlt.value = alt; const dawn = sstep(.72, 1, alt); warm.intensity = dawn * 1.8; moonLight.intensity = 1.5 * (1 - dawn * .6);
  scene.fog.color.setRGB(lerp(lerp(.10, .035, sstep(0, .5, alt)), .45, dawn), lerp(lerp(.14, .05, sstep(0, .5, alt)), .32, dawn), lerp(lerp(.21, .11, sstep(0, .5, alt)), .38, dawn));
  roomLights.forEach((l, k) => { const on = Math.abs(sNow - (k + 1)) < .6; l.intensity += ((MOBILE ? 0 : (on ? 90 : 35)) - l.intensity) * Math.min(1, dt * 4); });
  hq.update(T, dt);
  /* panels */
  const near = Math.round(clamp(sNow, 0, N - 1)), d = Math.abs(sNow - near), op = 1 - sstep(.08, .34, d);
  stopEls.forEach((el, k) => { const on = k === near; el.style.setProperty('--o', on ? op.toFixed(3) : 0); el.classList.toggle('cur', on && op > .4); });
  if (near !== curIdx) { curIdx = near; dotBtns.forEach((b, k) => k === near ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')); altN.textContent = stopEls[near].dataset.name || (near === 0 ? 'Base camp' : ''); }
  altH.textContent = Math.round(pP.y * 38) + ' m';
  composer ? composer.render() : renderer.render(scene, camera);
  first = false; requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__journey = { camera, height, pathAt, checks, stageCam };

if (q.has('dbg')) document.title = JSON.stringify(stageCam.map((c, i) => [i + 1, Math.round(c.pos.y - checks[i].p.y), Math.round(Math.hypot(c.pos.x - checks[i].s.x, c.pos.z - checks[i].s.z))]));
