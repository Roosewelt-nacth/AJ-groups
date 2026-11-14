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
  uCam: { value: 4.5 }, uInner: { value: MOBILE ? 22 : 40 }, uTime: { value: 0 }, uAspect: { value: 1 }, uOff: { value: new THREE.Vector2(.55, 0) }, uRot: { value: new THREE.Vector2() },
  uA: { value: 0 }, uB: { value: 1 }, uW: { value: 0 }, uTan: { value: FOV }, uSteps: { value: MOBILE ? 44 : 72 },
};
const vert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
const frag = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime, uAspect, uW, uTan, uSteps, uCam, uInner; uniform vec2 uOff, uRot; uniform float uA, uB;

float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }
float sdRound(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r; }
float sdCylZ(vec3 p, float r, float h){ vec2 d = vec2(length(p.xy) - r, abs(p.z) - h); return min(max(d.x, d.y), 0.) + length(max(d, 0.)); }
float sdTorusZ(vec3 p, float R, float r){ vec2 q = vec2(length(p.xy) - R, p.z); return length(q) - r; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

/* 0: the seed: a soft, unknown form, slightly pinched like a drop about to fall */
float sdSeed(vec3 p){
  float d = length(p * vec3(1., .9, 1.)) - .56;
  d += .06 * sin(3.1 * p.x + uTime * .5) * sin(3.3 * p.y + 1. + uTime * .4) * sin(3.7 * p.z + 2.);
  float d2 = length(p - vec3(.3 * sin(uTime * .4), .34, .1)) - .26;
  return smin(d, d2, .32);
}
/* 1: a camera, with a body, grip, viewfinder bump, shutter button and a lens made of rings */
float sdCamera(vec3 p){
  p.xz *= rot(-.38);
  float body = sdRound(p, vec3(.7, .4, .24), .08);
  float grip = sdRound(p - vec3(.56, -.04, .1), vec3(.16, .34, .2), .09);
  float top = sdRound(p - vec3(-.34, .47, 0.), vec3(.22, .07, .16), .045);
  float prism = sdRound(p - vec3(.0, .5, -.02), vec3(.16, .09, .13), .04);
  float shutter = sdCylZ((p - vec3(.42, .52, .0)).xzy, .06, .03) - .015;
  float d = smin(body, grip, .05); d = smin(d, top, .04); d = smin(d, prism, .05); d = min(d, shutter);
  vec3 q = p - vec3(-.02, .02, .24);
  float barrel = sdCylZ(q - vec3(0., 0., .15), .31, .17) - .02;
  float ring1 = sdCylZ(q - vec3(0., 0., .34), .34, .03) - .018;
  float ring2 = sdCylZ(q - vec3(0., 0., .2), .335, .016) - .012;
  d = smin(d, barrel, .03); d = smin(d, ring1, .02); d = min(d, ring2);
  d = max(d, -(sdCylZ(q - vec3(0., 0., .5), .21, .2)));              /* the lens is hollow */
  float glass = max(length(q - vec3(0., 0., .02)) - .42, sdCylZ(q - vec3(0., 0., .3), .22, .03));
  return min(d, glass);
}
/* 2: a croissant, with segmented layers that taper to two curled points */
float sdCroissant(vec3 p){
  p *= .84; p.y += .3; p.xy *= rot(.1);
  float d = 1e3;
  for (int i = 0; i < 15; i++) {
    float t = (float(i) - 7.) / 7., at = abs(t);
    vec3 c = vec3(t * .86, .2 - .5 * t * t - .04 * at, .02 * sin(t * 6.));
    float r = max(.085, .3 * (1. - .7 * pow(at, 1.3)));
    vec3 q = p - c; q.y *= 1. + .12 * at; q.z *= 1.18;
    float seg = length(q) - r;
    d = smin(d, seg, .2);
  }
  /* layered ridges across the body */
  d += .02 * sin(p.x * 26. + p.y * 2.) * (1. - abs(p.x) * .55);
  return d / .84;
}
float shape(int id, vec3 p){ if (id == 0) return sdSeed(p); if (id == 1) return sdCamera(p); return sdCroissant(p); }
float noise3(vec3 p){ return sin(p.x * 5. + uTime * .9) * sin(p.y * 5.3 - uTime * .7) * sin(p.z * 4.7 + uTime * .8); }

float map(vec3 p){
  p.yz *= rot(uRot.y); p.xz *= rot(uRot.x);
  float a = shape(int(uA + .5), p);
  if (uW < .001) return a;
  float b = shape(int(uB + .5), p);
  float d = mix(a, b, uW);
  d += .1 * sin(uW * 3.14159) * noise3(p * 1.3);
  return d * .8;
}
vec3 normalAt(vec3 p){ vec2 e = vec2(.0015, -.0015); return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)); }

/* the studio: near-black navy, a champagne key softbox, a cool strip, a hard rim, a dark floor */
vec3 env(vec3 r){
  float y = r.y * .5 + .5;
  vec3 c = mix(vec3(.002, .004, .014), vec3(.016, .028, .075), smoothstep(.0, 1., y));
  c += vec3(2.4, 1.7, 1.05) * smoothstep(.86, .97, dot(r, normalize(vec3(-.55, .62, .56)))) * 1.7;
  c += vec3(.45, .65, 1.8) * smoothstep(.8, .985, dot(r, normalize(vec3(.88, .1, .35)))) * 1.2;
  c += vec3(.7, .8, 1.2) * smoothstep(.94, 1., r.y) * .5;
  c += vec3(1.5, 1.2, .9) * smoothstep(.93, .99, dot(r, normalize(vec3(.1, .45, -.9)))) * .6;       /* a thin back rim */
  c += vec3(.015, .03, .07) * smoothstep(.2, -.7, r.y);
  return c;
}
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }

float marchObj(vec3 ro, vec3 rd, float steps, float maxT){
  float t = .02;
  for (int i = 0; i < 80; i++) { if (float(i) > steps) break; float d = map(ro + rd * t); if (d < .0016) return t; t += d; if (t > maxT) break; }
  return -1.;
}
float marchIn(vec3 ro, vec3 rd){
  float t = .02;
  for (int i = 0; i < 48; i++) { if (float(i) > uInner) break; float d = -map(ro + rd * t); if (d < .002) break; t += max(d, .01); if (t > 3.) break; }
  return t;
}
const float FLOORY = -.98;

float transOf(float id){ return id < .5 ? 1. : id < 1.5 ? .55 : .1; }
vec3 tintOf(float id){ return id < .5 ? vec3(1.) : id < 1.5 ? vec3(.8, .86, 1.) : vec3(1.25, .78, .42); }
vec3 shadeGlass(vec3 p, vec3 rd){
  float tm = mix(transOf(uA), transOf(uB), uW); vec3 tc = mix(tintOf(uA), tintOf(uB), uW);
  vec3 n = normalAt(p), v = -rd, r = reflect(rd, n);
  float fr = pow(1. - max(dot(n, v), 0.), 4.), F = .05 + .95 * fr;
  /* light that enters the glass, travels through it and leaves again, split slightly by colour */
  vec3 rin = refract(rd, n, 1. / 1.47);
  float tin = marchIn(p - n * .004, rin);
  vec3 pout = p + rin * tin, nout = -normalAt(pout);
  vec3 ro1 = refract(rin, nout, 1.47 / 1.0), tr = vec3(0.);
  float ior[3]; ior[0] = 1.45; ior[1] = 1.5; ior[2] = 1.56;
  for (int k = 0; k < 3; k++) {
    vec3 ro2 = refract(rin, nout, ior[k]);
    if (dot(ro2, ro2) < .01) ro2 = reflect(rin, nout);          /* total internal reflection */
    vec3 e = env(ro2);
    if (k == 0) tr.r = e.r; else if (k == 1) tr.g = e.g; else tr.b = e.b;
  }
  vec3 absorb = exp(-tin * vec3(.9, .55, .35) * 1.6);
  float Fm = mix(F, .42 + .58 * fr, 1. - tm);
  vec3 col = env(r) * mix(vec3(1.), tc, 1. - tm) * Fm * 1.15 + tr * absorb * (1. - F) * .55 * tm;
  col += (1. - tm) * tc * (.02 + .06 * max(n.y, 0.) + .05 * max(dot(n, normalize(vec3(-.5, .6, .6))), 0.));
  col += vec3(1.2, .9, .6) * pow(max(dot(r, normalize(vec3(-.55, .62, .56))), 0.), 90.) * .9;
  col += vec3(.04, .07, .16) * (1. - fr) * .4;                      /* a deep inner colour */
  return col;
}

void main(){
  vec2 uv = (vUv * 2. - 1.) * vec2(uAspect, 1.) * uTan;
  vec3 ro = vec3(-uOff.x, -uOff.y, uCam), rd = normalize(vec3(uv, -1.));
  rd.yz = mat2(cos(.14), -sin(.14), sin(.14), cos(.14)) * rd.yz;       /* looking slightly down, so the floor is in frame */
  /* background: deep navy with a soft glow */
  vec2 q = vUv - vec2(.5 + uOff.x * .2, .5 - uOff.y * .2);
  vec3 bg = mix(vec3(.004, .008, .024), vec3(.02, .04, .11), smoothstep(1., 0., length(q * vec2(uAspect, 1.) * 1.1)));
  bg += vec3(.03, .055, .15) * exp(-dot(q, q) * 8.) * .7;

  float t = 0., glow = 0.; bool hit = false; vec3 p;
  for (int i = 0; i < 90; i++) {
    if (float(i) > uSteps) break;
    p = ro + rd * t; float d = map(p);
    glow += .0016 / (.03 + d * d * 6.);
    if (d < .0016) { hit = true; break; }
    t += d; if (t > 8.) break;
  }
  vec3 col = bg;
  /* the floor: a dark glossy plane that holds the object's reflection and a pool of light */
  float tf = rd.y < -.0005 ? (FLOORY - ro.y) / rd.y : -1.;
  bool onFloor = tf > 0. && (!hit || tf < t);
  if (onFloor) {
    vec3 fp = ro + rd * tf; vec3 fr = reflect(rd, vec3(0., 1., 0.));
    float dist = length(fp.xz - vec2(0.));
    vec3 fc = vec3(.003, .006, .016);
    fc += vec3(.04, .06, .15) * exp(-dist * dist * .5) * .55;                     /* the pool of light */
    float refl = .38 * exp(-dist * .18);
    float rt = marchObj(fp + vec3(0., .01, 0.), fr, uSteps * .6, 4.);
    vec3 rc = rt > 0. ? shadeGlass(fp + fr * rt, fr) * .55 : env(fr) * .15;
    fc += rc * refl;
    float fade = smoothstep(14., 3., tf);
    col = mix(bg, fc, fade);
  } else if (hit) {
    col = shadeGlass(p, rd);
  }
  col += glow * vec3(.2, .32, .7) * (hit || onFloor ? .25 : .45) * .1;                           /* a faint halo */
  col = aces(col * 1.2);
  col = pow(col, vec3(.4545));
  vec2 vq = vUv - .5; col *= 1. - dot(vq, vq) * .55;
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime) * 43758.5453) - .5) * .016;
  gl_FragColor = vec4(col, 1.);
}
`;
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
  U.uOff.value.set(phone ? 0 : Math.min(1.1, .33 * a), phone ? .3 : -.5);
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
  rx = (RM || !isNaN(PIN) ? 0 : Math.sin(T * .22) * .5) + ptr.x * .6; ry = ptr.y * .3; U.uRot.value.set(rx, ry);
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
  camera.position.set(-ox, -oy, U.uCam.value); camera.rotation.x = -.14;
  renderer.render(scene, camera);
  first = false; frames++;
  if (!lowQ && frames > 40 && frames < 100) { acc += dt; if (frames === 99) { if (acc / 59 > .03) { lowQ = true; PR = Math.max(.55, PR * .7); renderer.setPixelRatio(PR); U.uSteps.value = 44; U.uInner.value = 18; fit(); } } }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__morph = { U, renderer, shapeAt };
