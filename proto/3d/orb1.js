/* AJ GROUPS · One orb, six businesses (light prototype)
   A calm grey-blue page with one glass orb at its centre (after the Atomic Motion reference). A shader ray-marches the orb as a signed distance
   field, so it can melt from a sphere into a ripple, a lens, a cloth, a cube, a donut, soft blobs and a ring, one per chapter. The page tone and
   type colour shift per chapter (dark type on pale chapters, white on deeper ones). A circular loader counts up and ends inside the orb. */
import * as THREE from 'three';

const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t, sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const stopEls = [...document.querySelectorAll('.stop')], NS = stopEls.length; document.documentElement.style.setProperty('--n', NS);
const q = new URLSearchParams(location.search), PIN = parseFloat(q.get('s')), TFIX = parseFloat(q.get('t'));
const root = document.documentElement, loadEl = document.getElementById('load');

const canvas = document.getElementById('c');
let renderer; try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
if (!renderer) { stopEls.forEach(e => { e.style.visibility = 'visible'; e.style.position = 'static'; e.style.opacity = 1; e.style.transform = 'none'; e.style.padding = '90px 22px 20px'; }); loadEl.remove(); throw new Error('WebGL unavailable'); }
let PR = Math.min(devicePixelRatio, MOBILE ? .75 : 1.25); renderer.setPixelRatio(PR);

/* per chapter: shape, page tone (rgb), text is white (1) or dark (0), orb tint, orb screen position (x offset in screens, 0 = centred) and scale */
const CH = [
  { s: 0, bg: [.62, .69, .73], w: 1, tint: [1, 1, 1], ox: 0, sc: 1.0 },
  { s: 0, bg: [.60, .68, .73], w: 1, tint: [1, 1, 1], ox: 0, sc: 1.18 },
  { s: 1, bg: [.78, .85, .89], w: 0, tint: [.82, 1, .96], ox: .24, sc: 1 },
  { s: 2, bg: [.42, .55, .62], w: 1, tint: [.88, .94, 1], ox: .24, sc: 1 },
  { s: 3, bg: [.86, .81, .74], w: 0, tint: [1, .88, .7], ox: .24, sc: 1 },
  { s: 4, bg: [.27, .40, .52], w: 1, tint: [.8, .76, 1], ox: .24, sc: 1 },
  { s: 5, bg: [.87, .79, .72], w: 0, tint: [1, .8, .66], ox: .24, sc: 1 },
  { s: 6, bg: [.78, .85, .93], w: 0, tint: [1, .8, .88], ox: .24, sc: 1 },
  { s: 7, bg: [.27, .42, .50], w: 1, tint: [.8, .92, 1], ox: .26, sc: 1.05 },
];
const U = { uTime: { value: 0 }, uAsp: { value: 1 }, uTan: { value: Math.tan(.5 * 36 * Math.PI / 180) }, uA: { value: 0 }, uB: { value: 0 }, uW: { value: 0 }, uBG: { value: new THREE.Vector3() }, uTA: { value: new THREE.Vector3(1, 1, 1) }, uTB: { value: new THREE.Vector3(1, 1, 1) },
  uOff: { value: new THREE.Vector2() }, uSc: { value: 1 }, uApp: { value: 0 }, uRot: { value: new THREE.Vector2() }, uSteps: { value: MOBILE ? 46 : 72 }, uInner: { value: MOBILE ? 20 : 34 }, uDark: { value: 0 } };
const frag = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime, uAsp, uTan, uA, uB, uW, uSc, uApp, uSteps, uInner, uDark; uniform vec3 uBG, uTA, uTB; uniform vec2 uOff, uRot;
float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sdRound(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r; }
float sdTorus(vec3 p, float R, float r){ vec2 q = vec2(length(p.xz) - R, p.y); return length(q) - r; }
float sdCylY(vec3 p, float r, float h){ vec2 d = vec2(length(p.xz) - r, abs(p.y) - h); return min(max(d.x, d.y), 0.) + length(max(d, 0.)); }

float shape(int id, vec3 p){
  if (id == 0) { float d = length(p) - .92; return d + .012 * sin(p.x * 9. + uTime * .5) * sin(p.y * 8. + uTime * .4); }
  if (id == 1) { float r = length(p.xy), d = length(p) - .92; return d + .05 * sin(r * 30. - uTime * 1.4) * smoothstep(1., .2, r); }                       /* ripples: a signal spreading */
  if (id == 2) { vec3 q = p.xzy; float body = sdCylY(q, .98, .22) - .05, hole = sdCylY(q, .52, .6), core = length(p) - .34; return smin(max(body, -hole), core, .1); }   /* a lens */
  if (id == 3) { vec3 q = p; q.xz *= rot(q.y * 1.3 + uTime * .2); return sdRound(q, vec3(.8, 1., .045), .05); }                                           /* cloth: a twisted fold */
  if (id == 4) { vec3 q = p; q.xz *= rot(.55); q.yz *= rot(.3); return sdRound(q, vec3(.58), .2); }                                                          /* software: a cube */
  if (id == 5) { vec3 q = p; q.yz *= rot(.9); float d = sdTorus(q, .62, .36); return d + .015 * sin(atan(q.z, q.x) * 14.); }                                  /* bakery: a bun */
  if (id == 6) { float a = length(p - vec3(-.5 + .06 * sin(uTime * .8), -.22, 0.)) - .5, b = length(p - vec3(.5, -.12 + .05 * sin(uTime * .7 + 1.), .1)) - .46, c = length(p - vec3(0., .52 + .05 * sin(uTime * .9 + 2.), -.1)) - .4; return smin(smin(a, b, .32), c, .32); }
  float d = sdTorus(p.xzy, 1.28, .07); return d;                                                                                                              /* contact: a ring */
}
float noise3(vec3 p){ return sin(p.x * 5. + uTime * .9) * sin(p.y * 5.3 - uTime * .7) * sin(p.z * 4.7 + uTime * .8); }
float map(vec3 p){
  p /= uSc * max(uApp, .001); p.yz *= rot(uRot.y); p.xz *= rot(uRot.x + uTime * .1);
  float a = shape(int(uA + .5), p), d = a;
  if (uW > .001) { float b = shape(int(uB + .5), p); d = mix(a, b, uW) + .09 * sin(uW * 3.14159) * noise3(p * 1.4); }
  return d * .8 * uSc * max(uApp, .001);
}
vec3 nrm(vec3 p){ vec2 e = vec2(.0014, -.0014); return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)); }
/* a soft studio in the page's own colour: bright overhead, a cool strip, warm bounce */
vec3 env(vec3 r){
  float y = r.y * .5 + .5; vec3 c = mix(uBG * .55, uBG * 1.15 + vec3(.1), smoothstep(0., 1., y));
  c += vec3(1.5, 1.45, 1.35) * smoothstep(.84, .97, dot(r, normalize(vec3(-.5, .7, .55)))) * 1.2;
  c += vec3(.5, .7, 1.1) * smoothstep(.7, .98, dot(r, normalize(vec3(.9, .1, .3)))) * .8;
  c += vec3(.9, .7, .5) * smoothstep(.8, .98, dot(r, normalize(vec3(.2, -.6, .6)))) * .35;
  return c;
}
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
float marchIn(vec3 ro, vec3 rd){ float t = .02; for (int i = 0; i < 48; i++) { if (float(i) > uInner) break; float d = -map(ro + rd * t); if (d < .002) break; t += max(d, .012); if (t > 3.5) break; } return t; }
vec3 glass(vec3 p, vec3 rd, vec3 tint){
  vec3 n = nrm(p), v = -rd, r = reflect(rd, n); float fr = pow(1. - max(dot(n, v), 0.), 3.5), F = .05 + .95 * fr;
  vec3 rin = refract(rd, n, 1. / 1.45); float tin = marchIn(p - n * .004, rin); vec3 po = p + rin * tin, no = -nrm(po);
  vec3 tr = vec3(0.); float ior[3]; ior[0] = 1.42; ior[1] = 1.48; ior[2] = 1.56;
  for (int k = 0; k < 3; k++) { vec3 ro2 = refract(rin, no, ior[k]); if (dot(ro2, ro2) < .01) ro2 = reflect(rin, no); vec3 e = env(ro2); if (k == 0) tr.r = e.r; else if (k == 1) tr.g = e.g; else tr.b = e.b; }
  vec3 absorb = exp(-tin * vec3(1.9, 1.35, .7) * 1.9);                                   /* the deep navy core */
  vec3 col = env(r) * tint * F * 1.25 + tr * absorb * (1. - F) * .9;
  col += vec3(.03, .06, .16) * (1. - fr) * .8 * (1. - absorb);
  col += tint * vec3(.55, .4, .3) * pow(fr, 2.) * .35;                                  /* a warm iridescent rim */
  return col;
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec2 uv = (vUv * 2. - 1.) * vec2(uAsp, 1.) * uTan;
  vec3 ro = vec3(-uOff.x * 2.4 * uTan * uAsp * 3.2, -uOff.y, 4.6), rd = normalize(vec3(uv, -1.));
  /* the page: a calm tone with blurred dark blobs drifting at the edges */
  vec2 q = vUv; vec3 bg = uBG; float bl = 0.;
  for (int i = 0; i < 5; i++) { float fi = float(i); vec2 c = vec2(.5 + .46 * sin(uTime * .05 + fi * 2.1) * (i % 2 == 0 ? 1. : -1.), .5 + .42 * cos(uTime * .04 + fi * 1.7)); vec2 d = (q - c) * vec2(uAsp, 1.); bl += exp(-dot(d, d) * (9. + fi * 3.)) * (.55 - fi * .06); }
  bg *= 1. - bl * .22 * (1. - uDark * .5); bg += (1. - smoothstep(.0, .75, length((q - .5) * vec2(uAsp, 1.)))) * .05;
  float t = 0.; bool hit = false; vec3 p;
  for (int i = 0; i < 90; i++) { if (float(i) > uSteps) break; p = ro + rd * t; float d = map(p); if (d < .0016) { hit = true; break; } t += d; if (t > 9.) break; }
  vec3 col = bg;                                                                          /* the page tone is already in display colour */
  if (hit) { col = glass(p, rd, mix(uTA, uTB, uW)); col = aces(col * 1.05); col = pow(col, vec3(.4545)); }
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.) - .5) * .02;                          /* film grain */
  gl_FragColor = vec4(col, 1.);
}`;
const scene = new THREE.Scene(), cam = new THREE.Camera();
scene.add(Object.assign(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: frag, depthTest: false, depthWrite: false })), { frustumCulled: false }));
renderer.setClearColor(0x9fb0ba);

/* ---------- chrome ---------- */
const dotsEl = document.getElementById('dots'); dotsEl.innerHTML = stopEls.map(el => `<button type="button" aria-label="${(el.querySelector('h1,h2,.lead') || el).textContent.replace(/\s+/g, ' ').trim()}"></button>`).join('');
const dotBtns = [...dotsEl.children], vh = () => innerHeight, fade = document.getElementById('fade'), formEl = document.getElementById('form'), cue = document.getElementById('cue'), top = document.getElementById('top'), mark = document.getElementById('mark');
const arc = document.getElementById('arc'), lpct = document.getElementById('lpct'), ticks = document.getElementById('ticks');
for (let k = 0; k < 72; k++) { const a = k / 72 * Math.PI * 2, l = document.createElementNS('http://www.w3.org/2000/svg', 'line'); l.setAttribute('x1', 75 + Math.cos(a) * 66); l.setAttribute('y1', 75 + Math.sin(a) * 66); l.setAttribute('x2', 75 + Math.cos(a) * 71); l.setAttribute('y2', 75 + Math.sin(a) * 71); ticks.append(l); }
stopEls.forEach(el => { if (el.dataset.c) el.style.setProperty('--c', el.dataset.c); });
let sNow = 0; dotBtns.forEach((b, i) => b.addEventListener('click', () => { if (i === Math.round(sNow)) return; fade.classList.add('on'); setTimeout(() => { scrollTo(0, i * vh()); sNow = i; fade.classList.remove('on'); }, 360); }));
function fit() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); U.uAsp.value = w / h; }
fit(); addEventListener('resize', fit);
const ptr = { x: 0, y: 0, tx: 0, ty: 0 }; addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; ptr.tx = e.clientX / innerWidth * 2 - 1; ptr.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
const skip = !isNaN(PIN) || RM; const t0 = performance.now(); let loadDone = skip, app = skip ? 1 : 0; if (skip) loadEl.classList.add('done'); else document.body.style.overflow = 'hidden';
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], c255 = c => `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
const clock = new THREE.Clock(); let first = true, curIdx = -1;
function frame() {
  const dt = Math.min(clock.getDelta(), .05), T = !isNaN(TFIX) ? TFIX : (RM ? 0 : clock.elapsedTime);
  if (!loadDone) { const k = clamp((performance.now() - t0) / 2600); lpct.textContent = Math.round(k * 100) + '%'; arc.style.strokeDashoffset = 377 * (1 - k); app = sstep(.6, 1, k); if (k >= 1) { loadDone = true; loadEl.classList.add('done'); document.body.style.overflow = ''; } }
  const target = isNaN(PIN) ? clamp(scrollY / vh(), 0, NS - 1) : clamp(PIN, 0, NS - 1);
  sNow = first ? target : sNow + (target - sNow) * Math.min(1, dt * 4.5);
  const i0 = Math.min(NS - 2, Math.floor(clamp(sNow, 0, NS - 1))), f = clamp(sNow - i0, 0, 1), w = sstep(.15, .85, f), A = CH[sNow >= NS - 1 ? NS - 1 : i0], B = CH[sNow >= NS - 1 ? NS - 1 : i0 + 1], ww = sNow >= NS - 1 ? 0 : w;
  U.uA.value = A.s; U.uB.value = B.s; U.uW.value = A.s === B.s ? 0 : ww;
  const bg = mix3(A.bg, B.bg, ww); U.uBG.value.set(...bg); U.uTA.value.set(...A.tint); U.uTB.value.set(...B.tint); U.uDark.value = lerp(1 - A.w, 1 - B.w, ww) * 0 + (1 - lerp(A.w, B.w, ww));
  const asp = innerWidth / innerHeight, phone = innerWidth <= 760, ox = lerp(A.ox, B.ox, ww) * (phone ? 0 : 1), sc = lerp(A.sc, B.sc, ww) * (phone ? .8 : 1);
  U.uOff.value.set(ox * .8, phone ? -.5 : 0); U.uSc.value = sc * (asp < 1.3 ? clamp(asp / 1.3 + .25) : 1); U.uApp.value = app; U.uTime.value = T;
  ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 3); ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 3); U.uRot.value.set(ptr.x * .5, ptr.y * .3);
  /* page tone and type colour */
  const white = lerp(A.w, B.w, ww), ink = white > .5 ? [1, 1, 1] : [.055, .09, .19]; root.style.setProperty('--ink', c255(mix3([.055, .09, .19], [1, 1, 1], white)));
  root.style.setProperty('--mute', white > .5 ? 'rgba(255,255,255,.8)' : 'rgba(14,23,48,.66)'); root.style.setProperty('--line', white > .5 ? 'rgba(255,255,255,.28)' : 'rgba(14,23,48,.2)');
  root.style.setProperty('--btn', white > .5 ? '#ffffff' : '#0e1730'); root.style.setProperty('--btnink', white > .5 ? '#0e1730' : '#ffffff'); root.style.setProperty('--sheet', c255(bg.map(v => v * .72)));
  document.body.style.background = c255(bg); renderer.setClearColor(new THREE.Color(...bg));
  mark.style.setProperty('--ms', sNow < .2 ? '46px' : '15px'); mark.style.setProperty('--msm', sNow < .2 ? '30px' : '15px');
  const near = Math.round(clamp(sNow, 0, NS - 1)), d = Math.abs(sNow - near), op = (1 - sstep(.08, .34, d)) * sstep(.55, 1, app);
  stopEls.forEach((el, k) => { const on = k === near; el.style.setProperty('--o', on ? op.toFixed(3) : 0); el.classList.toggle('cur', on && op > .4); });
  if (near !== curIdx) { curIdx = near; dotBtns.forEach((b, k) => k === near ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')); }
  top.style.opacity = loadDone ? 1 : 0; cue.style.opacity = sNow < .1 && loadDone ? 1 : 0; formEl.classList.toggle('on', sNow > 7.55);
  renderer.render(scene, cam); first = false; requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
