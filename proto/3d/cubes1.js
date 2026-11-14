/* AJ GROUPS · One world, six businesses (light prototype)
   Built from the client's reference video: a scroll-driven story where one set of glass cubes transforms from chapter to chapter.
   A single instanced mesh (512 cubes) is rearranged by scroll: scattered -> one cube -> a wall of tiles (marketing) -> lens rings (photography)
   -> woven cloth (clothing) -> a globe (software) -> a crescent (bakery) -> toy blocks (kids) -> a halo around the contact form. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PI = Math.PI, clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t, sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const stopEls = [...document.querySelectorAll('.stop')], N_STOPS = stopEls.length; document.documentElement.style.setProperty('--n', N_STOPS);
const q = new URLSearchParams(location.search), PIN = parseFloat(q.get('s')), TFIX = parseFloat(q.get('t'));
const hash = i => { const h = Math.sin(i * 127.1 + 311.7) * 43758.5453; return h - Math.floor(h); }, hash2 = (i, k) => hash(i * 7.31 + k * 19.7);

const canvas = document.getElementById('c');
let renderer; try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !MOBILE, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
const loadEl = document.getElementById('load');
if (!renderer) { stopEls.forEach(e => { e.style.visibility = 'visible'; e.style.position = 'static'; e.style.opacity = 1; e.style.transform = 'none'; e.style.padding = '90px 22px 20px'; }); loadEl.remove(); throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
{ const cv = document.createElement('canvas'); cv.width = cv.height = 512; const x = cv.getContext('2d'), g = x.createRadialGradient(330, 220, 0, 256, 256, 430); g.addColorStop(0, '#fbfcff'); g.addColorStop(.55, '#e9edf6'); g.addColorStop(1, '#d6dcec'); x.fillStyle = g; x.fillRect(0, 0, 512, 512); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; }
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = 1.15;
const camera = new THREE.PerspectiveCamera(32, 1, .1, 120);
const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-6, 9, 8); scene.add(key); const fill = new THREE.DirectionalLight(0x9db6ff, .9); fill.position.set(8, -2, 5); scene.add(fill);
scene.add(new THREE.HemisphereLight(0xffffff, 0xaab4d0, .6));

/* ---------- the cubes ---------- */
const N = 512;
const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .1, metalness: 0, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 1.35, iridescence: .6, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 420] });
const mesh = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, MOBILE ? 2 : 3, .09), mat, N); mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false;
mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3); mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
const world = new THREE.Group(); world.add(mesh); scene.add(world);

/* a layout function writes position, scale, rotation and colour for cube i into o */
const o = { x: 0, y: 0, z: 0, sx: 1, sy: 1, sz: 1, rx: 0, ry: 0, rz: 0, r: 1, g: 1, b: 1 }, o2 = { ...o };
const set = (x, y, z, sx, sy, sz, rx, ry, rz, r, g, b) => { o.x = x; o.y = y; o.z = z; o.sx = sx; o.sy = sy; o.sz = sz; o.rx = rx; o.ry = ry; o.rz = rz; o.r = r; o.g = g; o.b = b; };
const RINGS = []; { let left = N, r = .8; while (left > 0) { const n = Math.min(left, Math.max(6, Math.round(2 * PI * r / .66))); RINGS.push({ r, n, start: N - left }); left -= n; r += .66; if (RINGS.length > 30) break; } }
const ringOf = i => { for (let k = RINGS.length - 1; k >= 0; k--) if (i >= RINGS[k].start) return k; return 0; };
const PAST = [[1, .62, .72], [.62, .92, .8], [.62, .8, 1], [1, .92, .6], [.82, .7, 1], [1, .74, .58]];
const LAY = [
  /* 0 cube */ (i, T) => { const gx = i % 8, gy = Math.floor(i / 8) % 8, gz = Math.floor(i / 64), acc = (gx + gy + gz) % 7 === 0, sh = .86 + .14 * (gx + gy + gz) / 21; set((gx - 3.5) * 1.07, (gy - 3.5) * 1.07, (gz - 3.5) * 1.07, .96, .96, .96, 0, 0, 0, acc ? .45 : .9 * sh, acc ? .62 : .93 * sh, acc ? 1 : 1 * sh); },
  /* 1 tiles */ (i, T) => { const gx = i % 32, gy = Math.floor(i / 32), h = hash(i), lit = h > .86 ? .5 + .5 * Math.sin(T * 2.2 + i) : 0; set((gx - 15.5) * .64, (gy - 7.5) * .64, 0, .58, .58, .2, 0, 0, 0, lerp(.9, .1, lit), lerp(.93, .78, lit), lerp(.97, .7, lit)); },
  /* 2 lens */ (i, T) => { const k = ringOf(i), R = RINGS[k], a = (i - R.start) / R.n * 2 * PI + T * (.12 / (1 + k * .15)) * (k % 2 ? 1 : -1), s = k > RINGS.length - 3 ? .5 : .46, t = k / RINGS.length; set(Math.cos(a) * R.r, Math.sin(a) * R.r, -R.r * R.r * .018, s * .5, s * 1.25, s * .5, 0, 0, a - PI / 2, lerp(.95, .7, t), lerp(.96, .75, t), lerp(.98, .85, t)); },
  /* 3 cloth */ (i, T) => { const gx = i % 32, gy = Math.floor(i / 32), ph = gx * .33 + T * 1.1, z = Math.sin(ph) * 1.2 + Math.cos(gy * .45 + T * .7) * .55, st = (gx + gy) % 6 < 3 ? 1 : .93; set((gx - 15.5) * .64, (gy - 7.5) * .64, z, .6, .6, .12, Math.sin(gy * .45 + T * .7) * .3, -Math.cos(ph) * .5, 0, .99 * st, .86 * st, .7 * st); },
  /* 4 globe */ (i, T) => { const y = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - y * y), th = i * 2.39996 + T * .15; set(Math.cos(th) * r * 4.7, y * 4.7, Math.sin(th) * r * 4.7, .36, .36, .36, 0, th, 0, lerp(.7, .93, (y + 1) / 2), lerp(.62, .86, (y + 1) / 2), 1); },
  /* 5 crescent */ (i, T) => { const t = i / N * 2 - 1, at = Math.abs(t), rad = 1.55 * (1 - .72 * Math.pow(at, 1.25)), ph = i * 2.39996, ridge = .5 + .5 * Math.sin(t * 15); set(t * 4.6, 1.5 * (1 - t * t) - 1.1 + rad * Math.cos(ph) * .85, rad * Math.sin(ph) * .9, .5 * (1.15 - .55 * at), .5 * (1.15 - .55 * at), .5 * (1.15 - .55 * at), ph, t * .6, 0, lerp(.98, .84, ridge * .6), lerp(.8, .6, ridge * .6), lerp(.55, .36, ridge * .6)); },
  /* 6 toys */ (i, T) => { const s = .55 + hash2(i, 4) * 1.15, c = PAST[i % 6]; set((hash2(i, 1) - .5) * 10, (hash2(i, 2) - .5) * 8 + Math.sin(T * 1.5 + i) * .22, (hash2(i, 3) - .5) * 5, s, s, s, hash2(i, 5) * 6 + T * (hash2(i, 6) - .5) * .5, hash2(i, 7) * 6 + T * (hash2(i, 8) - .5) * .5, 0, c[0], c[1], c[2]); },
  /* 7 halo */ (i, T) => { const inner = i < 330, n = inner ? 330 : 182, j = inner ? i : i - 330, R = inner ? 5.3 : 6.7, a = j / n * 2 * PI + T * (inner ? .06 : -.04); set(Math.cos(a) * R, Math.sin(a) * R, Math.sin(a * 3 + T) * .25, .22, .7, .22, 0, 0, a - PI / 2, inner ? .55 : .9, inner ? .68 : .93, 1); },
];
const CAMZ = [17, 21, 18, 21, 16, 17, 19, 19];
const dummy = new THREE.Object3D(), eul = new THREE.Euler(), col = new THREE.Color();
function scatter(i, out) { const u = hash2(i, 11) * 2 - 1, a = hash2(i, 12) * 2 * PI, r = 9 + hash2(i, 13) * 6, s = Math.sqrt(1 - u * u), sc = .5 + hash2(i, 14) * 1.2; out.x = Math.cos(a) * s * r; out.y = u * r * .8; out.z = Math.sin(a) * s * r * .7 - 3; out.sx = out.sy = out.sz = sc; out.rx = hash2(i, 15) * 6; out.ry = hash2(i, 16) * 6; out.rz = hash2(i, 17) * 6; out.r = .78 + hash2(i, 18) * .2; out.g = .86 + hash2(i, 18) * .1; out.b = 1; }

const A = { x: 0, y: 0, z: 0, sx: 1, sy: 1, sz: 1, rx: 0, ry: 0, rz: 0, r: 1, g: 1, b: 1 }, B = { ...A };
function compose(sA, sB, w, T, asm) {
  const swirl = Math.sin(w * PI), ci = mesh.instanceColor.array;
  for (let i = 0; i < N; i++) {
    LAY[sA](i, T); Object.assign(A, o); if (sA === 0 && asm < 1) { scatter(i, B); for (const k in A) A[k] = lerp(B[k], A[k], asm); }
    if (w > 0.0001) { LAY[sB](i, T); Object.assign(B, o); } else Object.assign(B, A);
    const e = w, j = (hash(i) - .5) * 5 * swirl, kx = (hash2(i, 21) - .5) * 5 * swirl, kz = (hash2(i, 22) - .5) * 5 * swirl;
    dummy.position.set(lerp(A.x, B.x, e) + j, lerp(A.y, B.y, e) + kx, lerp(A.z, B.z, e) + kz);
    dummy.rotation.set(lerp(A.rx, B.rx, e) + swirl * 2 * hash2(i, 23), lerp(A.ry, B.ry, e), lerp(A.rz, B.rz, e));
    dummy.scale.set(lerp(A.sx, B.sx, e), lerp(A.sy, B.sy, e), lerp(A.sz, B.sz, e)); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    ci[i * 3] = lerp(A.r, B.r, e); ci[i * 3 + 1] = lerp(A.g, B.g, e); ci[i * 3 + 2] = lerp(A.b, B.b, e);
  }
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
}

/* ---------- chrome: dots, meter, loader, form ---------- */
const dotsEl = document.getElementById('dots'); dotsEl.innerHTML = stopEls.map(el => `<button type="button" aria-label="${(el.querySelector('h1,h2') || el).textContent.replace(/\s+/g, ' ').trim()}"></button>`).join('');
const dotBtns = [...dotsEl.children], vh = () => innerHeight, fade = document.getElementById('fade'), formEl = document.getElementById('form');
const mbar = document.getElementById('mbar'), mpct = document.getElementById('mpct'), lbar = document.getElementById('lbar'), lpct = document.getElementById('lpct'), meter = document.getElementById('meter'), cue = document.getElementById('cue'), topEl = document.getElementById('top');
for (let k = 0; k < 10; k++) { mbar.append(document.createElement('span')); lbar.append(document.createElement('span')); }
stopEls.forEach(el => { if (el.dataset.c) el.style.setProperty('--c', el.dataset.c); });
let sNow = 0; dotBtns.forEach((b, i) => b.addEventListener('click', () => { if (i === Math.round(sNow)) return; fade.classList.add('on'); setTimeout(() => { scrollTo(0, i * vh()); sNow = i; fade.classList.remove('on'); }, 360); }));
function fit() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; const ph = w <= 760; camera.setViewOffset(w, h, ph ? 0 : -w * .13, ph ? h * .16 : 0, w, h); camera.updateProjectionMatrix(); }
fit(); addEventListener('resize', fit);
const ptr = { x: 0, y: 0, tx: 0, ty: 0 }; addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; ptr.tx = e.clientX / innerWidth * 2 - 1; ptr.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });

/* the opening: a loader counts up while the cubes assemble (skipped when a chapter is pinned for review) */
const skipIntro = !isNaN(PIN) || RM; let t0 = performance.now(), asm = skipIntro ? 1 : 0, loadDone = skipIntro;
if (skipIntro) loadEl.classList.add('done'); document.body.style.overflow = skipIntro ? '' : 'hidden';
const bars = (el, f) => [...el.children].forEach((s, k) => s.classList.toggle('on', k < Math.round(f * 10)));
const clock = new THREE.Clock(); let first = true, curIdx = -1;
function frame() {
  const dt = Math.min(clock.getDelta(), .05), T = !isNaN(TFIX) ? TFIX : (RM ? 0 : clock.elapsedTime);
  if (!loadDone) { const k = clamp((performance.now() - t0) / 2200); lpct.textContent = Math.round(k * 100) + '%'; bars(lbar, k); asm = sstep(.35, 1, k); if (k >= 1) { loadDone = true; loadEl.classList.add('done'); document.body.style.overflow = ''; } }
  const target = isNaN(PIN) ? clamp(scrollY / vh(), 0, N_STOPS - 1) : clamp(PIN, 0, N_STOPS - 1);
  sNow = first ? target : sNow + (target - sNow) * Math.min(1, dt * 4.5);
  const i0 = Math.min(N_STOPS - 2, Math.floor(clamp(sNow, 0, N_STOPS - 1))), f = clamp(sNow - i0, 0, 1), w = sNow >= N_STOPS - 1 ? 0 : sstep(.12, .88, f), sA = sNow >= N_STOPS - 1 ? N_STOPS - 1 : i0, sB = Math.min(N_STOPS - 1, sA + 1);
  compose(sA, sB, w, T, asm);
  /* the group turns gently, and the camera backs off for wide layouts */
  const yaw = lerp([.5, 0, 0, 0, 0, .25, 0, 0][sA], [.5, 0, 0, 0, 0, .25, 0, 0][sB], w) + Math.sin(T * .2) * .12 + ptr.x * .15; world.rotation.y = yaw; world.rotation.x = lerp(.3, 0, sstep(0, .6, sNow)) + ptr.y * .06;
  ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 3); ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 3);
  const cz = lerp(CAMZ[sA], CAMZ[sB], w) * (innerWidth < 760 ? 1.28 : 1) / Math.min(1, (innerWidth / innerHeight) / 1.3 + .25); camera.position.set(ptr.x * .8, -ptr.y * .5, cz); camera.lookAt(0, innerWidth < 760 ? -1.2 : 0, 0);
  const near = Math.round(clamp(sNow, 0, N_STOPS - 1)), d = Math.abs(sNow - near), op = (1 - sstep(.08, .34, d)) * (near === 0 ? sstep(.55, 1, asm) : 1);
  stopEls.forEach((el, k) => { const on = k === near; el.style.setProperty('--o', on ? op.toFixed(3) : 0); el.classList.toggle('cur', on && op > .4); });
  if (near !== curIdx) { curIdx = near; dotBtns.forEach((b, k) => k === near ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')); }
  const pct = clamp(sNow / (N_STOPS - 1)); mpct.textContent = Math.round(pct * 100) + '%'; bars(mbar, pct);
  const intro = !loadDone; meter.style.opacity = topEl.style.opacity = intro ? 0 : 1; cue.style.opacity = sNow < .1 && !intro ? 1 : 0; formEl.classList.toggle('on', sNow > 6.6);
  renderer.render(scene, camera); first = false; requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__cubes = { LAY, N };
