/* AJ GROUPS · One object (prototype 1)
   One sculpted object in a deep blue night. A fragment shader ray-marches it as a signed distance field, so it can
   melt from one shape into the next: an unknown seed, a camera, a croissant. Dust gathers around it at each change.
   Scroll drives the shape; the cursor (or the phone's tilt) turns it. */
import * as THREE from 'three';

const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const stopEls = [...document.querySelectorAll('.stop')], N = stopEls.length;
document.documentElement.style.setProperty('--n', N);

const canvas = document.getElementById('c');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
if (!renderer) { stopEls.forEach(e => { e.style.visibility = 'visible'; e.style.position = 'static'; e.style.opacity = 1; e.style.transform = 'none'; }); throw new Error('WebGL unavailable'); }
let PR = Math.min(devicePixelRatio, MOBILE ? .7 : 1.25);
renderer.setPixelRatio(PR);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, .1, 50); camera.position.set(0, 0, 4.5);
const FOV = Math.tan(THREE.MathUtils.degToRad(35) / 2);

const U = {
  uCam: { value: 4.5 }, uTime: { value: 0 }, uAspect: { value: 1 }, uOff: { value: new THREE.Vector2(.55, 0) }, uRot: { value: new THREE.Vector2() },
  uA: { value: 0 }, uB: { value: 1 }, uW: { value: 0 }, uTan: { value: FOV }, uSteps: { value: MOBILE ? 44 : 72 },
};
const vert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
const frag = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime, uAspect, uW, uTan, uSteps, uCam; uniform vec2 uOff, uRot; uniform float uA, uB;

float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }
float sdRound(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r; }
float sdCylZ(vec3 p, float r, float h){ vec2 d = vec2(length(p.xy) - r, abs(p.z) - h); return min(max(d.x, d.y), 0.) + length(max(d, 0.)); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

/* 0: the seed, a soft unknown form */
float sdSeed(vec3 p){
  float d = length(p) - .56;
  d += .07 * sin(3.1 * p.x + uTime * .5) * sin(3.3 * p.y + 1. + uTime * .4) * sin(3.7 * p.z + 2.);
  float d2 = length(p - vec3(.34 * sin(uTime * .4), .26, .12)) - .28;
  float d3 = length(p - vec3(-.3, -.22 * cos(uTime * .35), -.1)) - .24;
  return smin(smin(d, d2, .3), d3, .3);
}
/* 1: a camera */
float sdCamera(vec3 p){
  p.xz *= rot(-.3);
  float body = sdRound(p, vec3(.72, .42, .27), .09);
  float grip = sdRound(p - vec3(.52, -.03, .12), vec3(.2, .36, .22), .08);
  float top = sdRound(p - vec3(-.3, .5, 0.), vec3(.24, .08, .18), .05);
  float lens = sdCylZ(p - vec3(.0, .02, .46), .31, .2) - .02;
  float ring = sdCylZ(p - vec3(.0, .02, .68), .34, .03) - .015;
  float glass = length(p - vec3(.0, .02, .44)) - .4;
  float d = smin(body, grip, .05); d = smin(d, top, .05); d = smin(d, lens, .04); d = smin(d, ring, .02);
  d = max(d, -(sdCylZ(p - vec3(.0, .02, .72), .2, .1) - .0));
  d = min(d, max(glass, sdCylZ(p - vec3(.0, .02, .62), .24, .02)));
  return d;
}
/* 2: a croissant */
float sdCroissant(vec3 p){
  p.xy *= rot(.08);
  float d = 1e3;
  for (int i = 0; i < 7; i++) {
    float t = (float(i) - 3.) / 3., at = abs(t);
    vec3 c = vec3(t * .84, .16 - .46 * t * t, .0);
    float r = .31 * (1. - .64 * pow(at, 1.5));
    vec3 q = p - c; q.x *= 1.15 - .25 * at;
    d = smin(d, length(q) - r, .18);
  }
  d += .016 * sin(p.x * 24. + p.y * 5.) * (1. - abs(p.x) * .5);
  return d;
}
float shape(int id, vec3 p){ if (id == 0) return sdSeed(p); if (id == 1) return sdCamera(p); return sdCroissant(p); }

float noise3(vec3 p){ return sin(p.x * 5. + uTime * .9) * sin(p.y * 5.3 - uTime * .7) * sin(p.z * 4.7 + uTime * .8); }

float map(vec3 p){
  p.yz *= rot(uRot.y); p.xz *= rot(uRot.x);
  float a = shape(int(uA + .5), p);
  if (uW < .001) return a;
  float b = shape(int(uB + .5), p);
  float w = uW, d = mix(a, b, w);
  d += .11 * sin(w * 3.14159) * noise3(p * 1.3);   /* the liquid wobble while it changes */
  return d * .8;
}
vec3 normalAt(vec3 p){ vec2 e = vec2(.002, -.002); return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)); }

/* the studio: a deep blue night, a warm key softbox, a cool strip and a faint floor bounce */
vec3 env(vec3 r){
  float y = r.y * .5 + .5;
  vec3 c = mix(vec3(.003, .006, .018), vec3(.02, .036, .09), smoothstep(.0, 1., y));
  c += vec3(2.2, 1.5, .95) * smoothstep(.88, .975, dot(r, normalize(vec3(-.55, .62, .56)))) * 1.5;
  c += vec3(.5, .7, 1.6) * smoothstep(.78, .985, dot(r, normalize(vec3(.85, .12, .35)))) * 1.1;
  c += vec3(.6, .7, 1.1) * smoothstep(.9, 1., r.y) * .45;
  c += vec3(.02, .04, .1) * smoothstep(.2, -.8, r.y) * .6;
  return c;
}
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }

void main(){
  vec2 uv = (vUv * 2. - 1.) * vec2(uAspect, 1.) * uTan;
  vec3 ro = vec3(-uOff.x, -uOff.y, uCam), rd = normalize(vec3(uv, -1.));
  /* background: deep blue with a soft glow behind the object */
  vec2 q = vUv - vec2(.5 + uOff.x * .22, .5 - uOff.y * .22);
  vec3 bg = mix(vec3(.006, .012, .034), vec3(.028, .055, .14), smoothstep(1., 0., length(q * vec2(uAspect, 1.) * 1.1)));
  bg += vec3(.04, .075, .19) * exp(-dot(q, q) * 9.) * .8;
  float t = 0.; float d; bool hit = false; vec3 p;
  for (int i = 0; i < 90; i++) {
    if (float(i) > uSteps) break;
    p = ro + rd * t; d = map(p);
    if (d < .0016) { hit = true; break; }
    t += d; if (t > 7.) break;
  }
  vec3 col = bg;
  if (hit) {
    vec3 n = normalAt(p), v = -rd, r = reflect(rd, n);
    float fr = pow(1. - max(dot(n, v), 0.), 3.);
    vec3 tint = vec3(.9, .94, 1.);
    vec3 refl = env(r) * tint;
    vec3 refr = env(refract(rd, n, .7)) * vec3(.35, .5, .9) * .55;
    col = mix(refl * (.55 + .45 * fr + .35), refr + refl * .5, .0);
    col = refl * (.42 + 1.1 * fr) + refr * .22;
    col += vec3(1., .85, .6) * pow(max(dot(r, normalize(vec3(-.5, .6, .6))), 0.), 60.) * .6;   /* a sharp key highlight */
    float ao = 1. - clamp(map(p + n * .12) * -4. + .5, 0., 1.) * .0;
    col *= mix(.78, 1., clamp(map(p + n * .22) / .22, 0., 1.));
  }
  col = aces(col * 1.15);
  col = pow(col, vec3(.4545));
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime) * 43758.5453) - .5) * .018;   /* a trace of film grain */
  gl_FragColor = vec4(col, 1.);
}`;
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false }));
quad.frustumCulled = false; quad.renderOrder = -1; scene.add(quad);

/* dust: gathers around the object at each change, drifts quietly the rest of the time */
const DN = MOBILE ? 160 : 420, dpos = new Float32Array(DN * 3), dir = [], dBase = [], dSeed = [];
for (let i = 0; i < DN; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, s = Math.sqrt(1 - u * u); dir.push([Math.cos(a) * s, u, Math.sin(a) * s]); dBase.push(.9 + Math.random() * 1.9); dSeed.push(Math.random() * 6.283); }
const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
const gtex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, map: gtex, color: 0xbcd0ff, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
dust.frustumCulled = false; scene.add(dust);

/* ---------- scroll, panels, dots ---------- */
const dotsEl = document.getElementById('dots');
dotsEl.innerHTML = stopEls.map((el, i) => `<button type="button" aria-label="${(el.querySelector('h1,h2') || el).textContent.trim()}"></button>`).join('');
const dotBtns = [...dotsEl.children], vh = () => innerHeight;
dotBtns.forEach((b, i) => b.addEventListener('click', () => scrollTo({ top: i * vh(), behavior: RM ? 'auto' : 'smooth' })));
const PIN = parseFloat(new URLSearchParams(location.search).get('s'));
const cue = document.getElementById('cue');

/* pointer / tilt */
const ptr = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; tgt.x = e.clientX / innerWidth * 2 - 1; tgt.y = e.clientY / innerHeight * 2 - 1; });
addEventListener('deviceorientation', e => { if (e.gamma == null) return; tgt.x = clamp(e.gamma / 30, -1, 1); tgt.y = clamp((e.beta - 45) / 30, -1, 1); });

function fit() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  U.uAspect.value = w / h; const phone = w <= 760;
  const a = w / h; U.uCam.value = a < 1.4 ? 4.5 + (1.4 - a) * 2.7 : 4.5;
  U.uOff.value.set(phone ? 0 : Math.min(1.1, .33 * a), phone ? 1.15 : 0);
  document.body.dataset.phone = phone ? 1 : 0;
}
fit(); addEventListener('resize', fit);

/* the shape timeline: each stop holds its shape, then melts into the next over the stretch between stops */
function shapeAt(s) {
  const i = clamp(Math.floor(s), 0, N - 2), f = s - i, w = sstep(.18, .82, f);
  if (s >= N - 1) return { a: N - 1, b: N - 1, w: 0 };
  return { a: i, b: i + 1, w };
}
const clock = new THREE.Clock(); let sNow = 0, first = true, frames = 0, acc = 0, lowQ = false, curIdx = -1, rx = 0, ry = 0;
const v3 = new THREE.Vector3();
function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime, T = RM ? 0 : t;
  const target = isNaN(PIN) ? clamp(scrollY / vh(), 0, N - 1) : clamp(PIN, 0, N - 1);
  sNow = first ? target : sNow + (target - sNow) * Math.min(1, dt * 5);
  const sh = shapeAt(sNow);
  U.uA.value = sh.a; U.uB.value = sh.b; U.uW.value = sh.w; U.uTime.value = T;
  ptr.x += (tgt.x - ptr.x) * Math.min(1, dt * 2.5); ptr.y += (tgt.y - ptr.y) * Math.min(1, dt * 2.5);
  rx = (RM ? 0 : Math.sin(T * .22) * .5) + ptr.x * .6; ry = ptr.y * .3; U.uRot.value.set(rx, ry);
  /* panels */
  const near = Math.round(clamp(sNow, 0, N - 1)), d = Math.abs(sNow - near), op = 1 - sstep(.08, .34, d);
  stopEls.forEach((el, i) => { const on = i === near; el.style.setProperty('--o', on ? op.toFixed(3) : 0); el.classList.toggle('cur', on && op > .4); });
  if (near !== curIdx) { curIdx = near; dotBtns.forEach((b, i) => i === near ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')); }
  cue.style.opacity = sNow < .08 ? 1 : 0;
  /* dust: contracts toward the object while it changes, then lets go */
  const gather = Math.sin(sh.w * Math.PI);
  const ox = U.uOff.value.x, oy = U.uOff.value.y;
  for (let i = 0; i < DN; i++) {
    const r = lerp(dBase[i] + Math.sin(T * .3 + dSeed[i]) * .1, .55 + (i % 7) * .035, gather * gather);
    dpos[i * 3] = dir[i][0] * r; dpos[i * 3 + 1] = dir[i][1] * r; dpos[i * 3 + 2] = dir[i][2] * r;
  }
  dust.rotation.y = T * .05; dust.material.opacity = .32 + gather * .55;
  dg.attributes.position.needsUpdate = true;
  camera.position.set(-ox, -oy, U.uCam.value);
  renderer.render(scene, camera);
  first = false; frames++;
  if (!lowQ && frames > 40 && frames < 100) { acc += dt; if (frames === 99) { if (acc / 59 > .03) { lowQ = true; PR = Math.max(.55, PR * .7); renderer.setPixelRatio(PR); U.uSteps.value = 44; fit(); } } }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__morph = { U, renderer, shapeAt };
