/* AJ GROUPS · One orb, six businesses (light prototype)
   A calm grey-blue page with one glass orb at its centre (after the Atomic Motion reference). A shader ray-marches the orb as a signed distance
   field, so it can melt from a sphere into a ripple, a lens, a cloth, a cube, a donut, soft blobs and a ring, one per chapter. The page tone and
   type colour shift per chapter (dark type on pale chapters, white on deeper ones). A circular loader counts up and ends inside the orb. */
import * as THREE from 'three';

const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t, sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const stopEls = [...document.querySelectorAll('.stop')], NS = stopEls.length; document.documentElement.style.setProperty('--n', NS);
const q = new URLSearchParams(location.search), PIN = parseFloat(q.get('s')), TFIX = parseFloat(q.get('t'));
const root = document.documentElement;

const canvas = document.getElementById('c');
let renderer; try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
if (!renderer) { stopEls.forEach(e => { e.style.visibility = 'visible'; e.style.position = 'static'; e.style.opacity = 1; e.style.transform = 'none'; e.style.padding = '90px 22px 20px'; }); throw new Error('WebGL unavailable'); }
let PR = Math.min(devicePixelRatio, MOBILE ? .75 : 1.25); renderer.setPixelRatio(PR);

/* per chapter: shape, page tone (rgb), text is white (1) or dark (0), orb tint, orb screen position (x offset in screens, 0 = centred) and scale */
const CH = [
  /* s shape, bg page tone, w white text, tint, ox orb offset, sc scale, ps phone scale, ext shape extent, abs absorption colour, fe (weave, grid, transmission, dispersion) */
  { s: 0, bg: [.62, .69, .73], w: 1, tint: [1, 1, 1], ox: 0, sc: 1.0, ps: 1, ext: 1, abs: [3.6, 2.6, 1.3], fe: [0, 0, 1, .07] },
  { s: 0, bg: [.60, .68, .73], w: 1, tint: [1, 1, 1], ox: 0, sc: 1.18, ps: 1, ext: 1, abs: [3.6, 2.6, 1.3], fe: [0, 0, 1, .07] },
  { s: 1, bg: [.78, .85, .89], w: 0, tint: [.85, 1, .97], ox: .24, sc: 1, ps: 1, ext: 1, abs: [3.4, .8, 1.1], fe: [0, 0, 1, .08] },          /* marketing: teal glass, rings of light */
  { s: 2, bg: [.42, .55, .62], w: 1, tint: [.95, .98, 1], ox: .24, sc: 1, ps: 1, ext: 1.07, abs: [.45, .42, .4], fe: [0, 0, 1, .13] },     /* photography: water-clear crystal with strong colour fringes */
  { s: 3, bg: [.86, .81, .74], w: 0, tint: [1, .9, .75], ox: .24, sc: .92, ps: .9, ext: 1.15, abs: [.7, 1.5, 3.2], fe: [1, 0, .6, .03] },  /* clothing: frosted amber linen with a woven surface */
  { s: 4, bg: [.27, .40, .52], w: 1, tint: [.85, .8, 1], ox: .24, sc: .86, ps: .85, ext: 1.3, abs: [1.3, 3.2, .5], fe: [0, 1, 1, .06] },     /* software: violet glass with a faint circuit grid inside */
  { s: 5, bg: [.87, .79, .72], w: 0, tint: [1, .86, .7], ox: .24, sc: 1, ps: 1, ext: 1.07, abs: [1.6, 3.0, 5.4], fe: [0, 0, .32, .02] },    /* bakery: glossy golden glaze, mostly solid */
  { s: 6, bg: [.78, .85, .93], w: 0, tint: [1, .85, .92], ox: .24, sc: .95, ps: .95, ext: 1.1, abs: [.5, 2.3, 1.4], fe: [0, 0, .85, .04] }, /* kids: bright rose jelly */
  { s: 7, bg: [.27, .42, .50], w: 1, tint: [.9, .95, 1], ox: .26, sc: 1.05, ps: .74, ext: 1.5, abs: [.5, .5, .45], fe: [0, 0, 1, .1] },
];
const DARK = [[.045, .06, .10], [.05, .065, .11], [.035, .085, .105], [.07, .09, .14], [.115, .085, .065], [.07, .06, .16], [.12, .07, .06], [.09, .07, .125], [.04, .08, .13]];
let THEME = 0; try { THEME = localStorage.getItem('ajtheme') === 'dark' ? 1 : 0; } catch (e) {} if (q.get('theme')) THEME = q.get('theme') === 'dark' ? 1 : 0;
let themeNow = THEME; root.dataset.theme = THEME ? 'dark' : 'light';
const U = { uTime: { value: 0 }, uAsp: { value: 1 }, uTan: { value: Math.tan(.5 * 36 * Math.PI / 180) }, uA: { value: 0 }, uB: { value: 0 }, uW: { value: 0 }, uBG: { value: new THREE.Vector3() }, uTA: { value: new THREE.Vector3(1, 1, 1) }, uTB: { value: new THREE.Vector3(1, 1, 1) },
  uOff: { value: new THREE.Vector2() }, uSc: { value: 1 }, uApp: { value: 0 }, uRot: { value: new THREE.Vector2() }, uTheme: { value: 0 }, uAbsA: { value: new THREE.Vector3(3.6, 2.6, 1.3) }, uAbsB: { value: new THREE.Vector3(3.6, 2.6, 1.3) }, uFeA: { value: new THREE.Vector4(0, 0, 1, .07) }, uFeB: { value: new THREE.Vector4(0, 0, 1, .07) }, uSteps: { value: MOBILE ? 46 : 72 }, uInner: { value: MOBILE ? 20 : 34 }, uDark: { value: 0 } };
const frag = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime, uAsp, uTan, uA, uB, uW, uSc, uApp, uSteps, uInner, uDark, uTheme; uniform vec3 uBG, uTA, uTB, uAbsA, uAbsB; uniform vec4 uFeA, uFeB; uniform vec2 uOff, uRot;
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
  c += vec3(1.5, 1.45, 1.35) * smoothstep(.84, .97, dot(r, normalize(vec3(-.5, .7, .55)))) * (1.2 + uTheme * 1.8);
  c += vec3(.5, .7, 1.1) * smoothstep(.7, .98, dot(r, normalize(vec3(.9, .1, .3)))) * (.8 + uTheme * 1.4);
  c += vec3(.9, .7, .5) * smoothstep(.8, .98, dot(r, normalize(vec3(.2, -.6, .6)))) * .35;
  return c;
}
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
float marchIn(vec3 ro, vec3 rd){ float t = .02; for (int i = 0; i < 48; i++) { if (float(i) > uInner) break; float d = -map(ro + rd * t); if (d < .002) break; t += max(d, .012); if (t > 3.5) break; } return t; }
vec3 objP(vec3 p){ p /= uSc * max(uApp, .001); p.yz *= rot(uRot.y); p.xz *= rot(uRot.x + uTime * .1); return p; }
vec3 glass(vec3 p, vec3 rd, vec3 tint, vec3 ab, vec4 fe){
  vec3 n = nrm(p), q = objP(p);
  n = normalize(n + fe.x * .06 * vec3(sin(q.y * 58.) * cos(q.x * 58.), sin(q.x * 58.) * cos(q.y * 58.), 0.));              /* woven cloth */
  vec3 v = -rd, r = reflect(rd, n); float fr = pow(1. - max(dot(n, v), 0.), 3.5), F = .05 + .95 * fr;
  vec3 rin = refract(rd, n, 1. / 1.45); float tin = marchIn(p - n * .004, rin); vec3 po = p + rin * tin, no = -nrm(po);
  vec3 tr = vec3(0.); float ior[3]; ior[0] = 1.48 - fe.w; ior[1] = 1.48; ior[2] = 1.48 + fe.w * 1.15;
  for (int k = 0; k < 3; k++) { vec3 ro2 = refract(rin, no, ior[k]); if (dot(ro2, ro2) < .01) ro2 = reflect(rin, no); vec3 e = env(ro2); if (k == 0) tr.r = e.r; else if (k == 1) tr.g = e.g; else tr.b = e.b; }
  vec3 absorb = exp(-tin * ab * .55);
  vec3 col = env(r) * tint * F * 1.25 + tr * absorb * (1. - F) * .9 * fe.z;
  vec3 alb = exp(-ab * .22) * tint; float lit = .28 + .6 * max(dot(n, normalize(vec3(-.5, .7, .55))), 0.);
  col += (1. - fe.z) * alb * lit * (1. - F) * 1.1;                                                                            /* the solid part of frosted or glazed materials */
  col += vec3(.03, .06, .16) * (1. - fr) * .6 * (1. - absorb) * fe.z;
  col += tint * vec3(.55, .4, .3) * pow(fr, 2.) * .3;
  vec3 f3 = abs(fract(q * 3.2) - .5); float ln = smoothstep(.455, .5, max(f3.x, max(f3.y, f3.z)));
  col += fe.y * ln * vec3(.38, .3, 1.) * (.45 + .55 * sin(uTime * 1.6 + q.y * 5.)) * (1. - fr) * .55;                          /* circuit grid inside */
  return col;
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec2 uv = (vUv * 2. - 1.) * vec2(uAsp, 1.) * uTan;
  vec3 ro = vec3(-uOff.x * 2.4 * uTan * uAsp * 3.2, -uOff.y, 4.6), rd = normalize(vec3(uv, -1.));
  /* the page: a calm tone with blurred dark blobs drifting at the edges */
  vec2 q = vUv; vec3 bg = uBG; float bl = 0.;
  for (int i = 0; i < 5; i++) { float fi = float(i); vec2 c = vec2(.5 + .46 * sin(uTime * .05 + fi * 2.1) * (i % 2 == 0 ? 1. : -1.), .5 + .42 * cos(uTime * .04 + fi * 1.7)); vec2 d = (q - c) * vec2(uAsp, 1.); bl += exp(-dot(d, d) * (9. + fi * 3.)) * (.55 - fi * .06); }
  float vig = (1. - smoothstep(.0, .75, length((q - .5) * vec2(uAsp, 1.)))) * .05;
  vec3 bgL = bg * (1. - bl * .22 * (1. - uDark * .5)) + vig, bgD = bg + bl * .075 * vec3(.55, .75, 1.) + vig * .6;
  float xx = q.x * uAsp;
  for (int k = 0; k < 3; k++) { float fk = float(k); float yk = .13 + .1 * fk + .05 * sin(xx * (1.5 + .5 * fk) + uTime * .035 + fk * 2.) + .03 * sin(xx * (3.7 + fk) + fk * 5. - uTime * .02); float m = 1. - smoothstep(yk - .14, yk + .1, q.y);
    bgL = mix(bgL, bgL * (.9 - .03 * fk) + vec3(.02) * fk, m * .6); bgD = mix(bgD, bgD + vec3(.025, .04, .06) * (1. + fk * .5), m * .5); }
  bg = mix(bgL, bgD, uTheme);
  float t = 0.; bool hit = false; vec3 p = ro;
  float bR = 1.62 * uSc * max(uApp, .001), bb = dot(ro, rd), disc = bb * bb - (dot(ro, ro) - bR * bR);                 /* a bounding sphere: pixels that miss it cost almost nothing */
  if (disc > 0.) { float sq = sqrt(disc), tmax = -bb + sq + .1; t = max(0., -bb - sq);
    for (int i = 0; i < 90; i++) { if (float(i) > uSteps) break; p = ro + rd * t; float d = map(p); if (d < .0016) { hit = true; break; } t += d; if (t > tmax) break; } }
  vec3 col = bg;                                                                          /* the page tone is already in display colour */
  if (hit) { col = glass(p, rd, mix(uTA, uTB, uW), mix(uAbsA, uAbsB, uW), mix(uFeA, uFeB, uW)); col = aces(col * 1.05); col = pow(col, vec3(.4545)); }
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.) - .5) * .02;                          /* film grain */
  gl_FragColor = vec4(col, 1.);
}`;
const scene = new THREE.Scene(), cam = new THREE.Camera();
scene.add(Object.assign(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: frag, depthTest: false, depthWrite: false })), { frustumCulled: false }));
renderer.setClearColor(0x9fb0ba);

/* ---------- chrome ---------- */
const dotsEl = document.getElementById('dots'); dotsEl.innerHTML = stopEls.map(el => `<button type="button" aria-label="${(el.querySelector('h1,h2,.lead') || el).textContent.replace(/\s+/g, ' ').trim()}"></button>`).join('');
const dotBtns = [...dotsEl.children], vh = () => innerHeight, fade = document.getElementById('fade'), formEl = document.getElementById('form'), cue = document.getElementById('cue'), top = document.getElementById('top'), mark = document.getElementById('mark');
stopEls.forEach(el => { if (el.dataset.c) el.style.setProperty('--c', el.dataset.c); });
let sNow = 0; dotBtns.forEach((b, i) => b.addEventListener('click', () => { if (i === Math.round(sNow)) return; fade.classList.add('on'); setTimeout(() => { scrollTo(0, i * vh()); sNow = i; fade.classList.remove('on'); }, 360); }));
function fit() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); U.uAsp.value = w / h; }
const LY = { stack: false, short: false, zone: [70, 400], zone8: [70, 400] };
function layout() {
  const W = innerWidth, H = innerHeight, hb = Math.max(top.offsetHeight, 52);
  LY.stack = W / H < 1 || (W <= 760 && H >= 560); LY.short = !LY.stack && H < 570; root.classList.toggle('stack', LY.stack); root.classList.toggle('short', LY.short);
  if (LY.stack) { let mh = 0; stopEls.forEach((el, k) => { if (k > 0 && k < 8) mh = Math.max(mh, el.offsetHeight); }); LY.zone = [hb + 4, H - mh + 36]; LY.zone8 = [hb + 4, H - stopEls[8].offsetHeight];
    const z = LY.zone8, zh = Math.max(250, Math.min(340, z[1] - z[0] - 6)); formEl.style.setProperty('--zh', zh + 'px'); formEl.style.setProperty('--zy', Math.max(hb + 4 + zh / 2, (z[0] + z[1]) / 2) + 'px'); }
}
fit(); addEventListener('resize', () => { fit(); layout(); });
const ptr = { x: 0, y: 0, tx: 0, ty: 0 }; addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; ptr.tx = e.clientX / innerWidth * 2 - 1; ptr.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
let loadDone = true, app = (!isNaN(PIN) || RM) ? 1 : 0;   /* no loading page: the orb simply grows into place when the page opens */
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], c255 = c => `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
/* theme toggle */
const tbtn = document.getElementById('theme');
tbtn.addEventListener('click', () => { THEME = THEME ? 0 : 1; root.dataset.theme = THEME ? 'dark' : 'light'; try { localStorage.setItem('ajtheme', THEME ? 'dark' : 'light'); } catch (e) {} tbtn.setAttribute('aria-pressed', THEME ? 'true' : 'false'); });
tbtn.setAttribute('aria-pressed', THEME ? 'true' : 'false');
/* headlines reveal word by word out of a mask */
document.querySelectorAll('h1,h2').forEach(hd => { let k = 0; const walk = n => { [...n.childNodes].forEach(c => { if (c.nodeType === 3) { const frag = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(t => { if (!t.trim()) { frag.append(t); return; } const w = document.createElement('span'); w.className = 'w'; const i = document.createElement('span'); i.textContent = t; i.style.setProperty('--k', k++); w.append(i); frag.append(w); }); c.replaceWith(frag); } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c); }); }; walk(hd); });
/* a soft cursor ring on laptops */
const ring = document.getElementById('cursor'), fine = matchMedia('(hover: hover) and (pointer: fine)').matches; let cx = -50, cy = -50, rx = -50, ry = -50, big = 0;
if (fine) addEventListener('pointermove', e => { cx = e.clientX; cy = e.clientY; big = e.target.closest('a,button,input,textarea') ? 1 : 0; }, { passive: true }); else ring.remove();
const countEl = document.getElementById('count'), countN = document.getElementById('countN'), countBar = document.getElementById('countBar'), cards = [...document.querySelectorAll('.card')];
const orbit = document.getElementById('orbit'), oc1 = orbit.querySelector('.c1'), oc2 = orbit.querySelector('.c2'), od = orbit.querySelector('.dot');
const clock = new THREE.Clock(); let first = true, curIdx = -1, fa = 0, fn = 0; const PRMAX = PR, FIXED = q.has('fixedres');
function frame() {
  const dt = Math.min(clock.getDelta(), .05), T = !isNaN(TFIX) ? TFIX : (RM ? 0 : clock.elapsedTime);
  if (!FIXED && !first) { fa += dt; fn++; if (fn >= 40) { const av = fa / fn; if (av > .027 && PR > .5) { PR = Math.max(.5, PR * .82); renderer.setPixelRatio(PR); fit(); } else if (av < .019 && PR < PRMAX) { PR = Math.min(PRMAX, PR * 1.1); renderer.setPixelRatio(PR); fit(); } fa = 0; fn = 0; } }
  if (app < 1) app = Math.min(1, app + dt * .6);
  const target = isNaN(PIN) ? clamp(scrollY / vh(), 0, NS - 1) : clamp(PIN, 0, NS - 1);
  sNow = first ? target : sNow + (target - sNow) * Math.min(1, dt * 4.5);
  const i0 = Math.min(NS - 2, Math.floor(clamp(sNow, 0, NS - 1))), f = clamp(sNow - i0, 0, 1), w = sstep(.15, .85, f), A = CH[sNow >= NS - 1 ? NS - 1 : i0], B = CH[sNow >= NS - 1 ? NS - 1 : i0 + 1], ww = sNow >= NS - 1 ? 0 : w;
  U.uA.value = A.s; U.uB.value = B.s; U.uW.value = A.s === B.s ? 0 : ww;
  themeNow += (THEME - themeNow) * Math.min(1, dt * 3.2); const iA = sNow >= NS - 1 ? NS - 1 : i0, iB = sNow >= NS - 1 ? NS - 1 : i0 + 1;
  const bg = mix3(mix3(A.bg, B.bg, ww), mix3(DARK[iA], DARK[iB], ww), themeNow); U.uBG.value.set(...bg); U.uTA.value.set(...A.tint); U.uTB.value.set(...B.tint); U.uAbsA.value.set(...A.abs); U.uAbsB.value.set(...B.abs); U.uFeA.value.set(...A.fe); U.uFeB.value.set(...B.fe); U.uTheme.value = themeNow; U.uDark.value = 1 - lerp(A.w, B.w, ww);
  const asp = innerWidth / innerHeight, st = LY.stack;
  if (st) { const z = sNow > 7.5 ? LY.zone8 : LY.zone, zc = (z[0] + z[1]) / 2, zr = Math.min((z[1] - z[0]) / 2 * .96, innerWidth * .44), ext = lerp(A.ext, B.ext, ww); U.uOff.value.set(0, (1 - 2 * zc / innerHeight) * 4.6 * .32492); U.uSc.value = zr / ext / (.615 * innerHeight / 2); }
  else { const oxx = lerp(A.ox, B.ox, ww) * .8, ex = lerp(A.ext, B.ext, ww), cxp = (.5 + .5 * 1.67 * oxx) * innerWidth; U.uOff.value.set(oxx, 0); U.uSc.value = Math.min(lerp(A.sc, B.sc, ww) * (asp < 1.3 ? clamp(asp / 1.3 + .25) : 1), (innerWidth - 10 - cxp) / (.615 * innerHeight / 2 * ex)); }
  { } U.uApp.value = sstep(0, 1, app); U.uTime.value = T;
  ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 3); ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 3); U.uRot.value.set(ptr.x * .5, ptr.y * .3);
  /* page tone and type colour: every value is blended, so changing chapter or theme is a cross-fade, never a jump */
  const white = lerp(lerp(A.w, B.w, ww), 1, themeNow), c3 = (a, b, t) => `${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))}`, NAVY = [14, 23, 48], WH = [255, 255, 255];
  root.style.setProperty('--ink', `rgb(${c3(NAVY, WH, white)})`); root.style.setProperty('--mute', `rgba(${c3(NAVY, WH, white)},${lerp(.66, .78, white).toFixed(2)})`); root.style.setProperty('--line', `rgba(${c3(NAVY, WH, white)},${lerp(.2, .24, white).toFixed(2)})`);
  root.style.setProperty('--btn', `rgb(${c3(NAVY, WH, white)})`); root.style.setProperty('--btnink', `rgb(${c3(WH, NAVY, white)})`); root.style.setProperty('--sheet', c255(bg.map(v => v * (.72 - themeNow * .3))));
  document.body.style.background = c255(bg); renderer.setClearColor(new THREE.Color(...bg));
  mark.style.setProperty('--ms', sNow < .2 ? '46px' : '17px'); mark.style.setProperty('--msm', sNow < .2 ? '30px' : '17px');
  const near = Math.round(clamp(sNow, 0, NS - 1)), d = Math.abs(sNow - near), op = (1 - sstep(.08, .34, d)) * sstep(.55, 1, app);
  stopEls.forEach((el, k) => { const on = k === near; el.style.setProperty('--o', on ? op.toFixed(3) : 0); el.classList.toggle('cur', on && op > .4); });
  if (near !== curIdx) { curIdx = near; dotBtns.forEach((b, k) => k === near ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')); }
  top.style.opacity = sstep(.25, .8, app); cue.style.opacity = sNow < .1 ? 1 : 0; countEl.style.opacity = sNow > .3 ? 1 : 0; countN.textContent = String(Math.round(sNow) + 1).padStart(2, '0'); countBar.style.transform = `scaleY(${clamp(sNow / (NS - 1)).toFixed(3)})`; formEl.classList.toggle('on', sNow > 7.55);
  if (fine) { rx += (cx - rx) * Math.min(1, dt * 14); ry += (cy - ry) * Math.min(1, dt * 14); ring.style.transform = `translate(${rx}px,${ry}px) scale(${1 + big * 1.4})`; ring.style.opacity = loadDone ? .9 : 0; }
  { const W = innerWidth, H = innerHeight, tanv = .32492, ocx = (.5 + .5 * 1.67 * U.uOff.value.x) * W, ocy = (.5 - .5 * U.uOff.value.y / (4.6 * tanv)) * H, orad = .615 * U.uSc.value * (H / 2) * sstep(0, 1, app);
    oc1.setAttribute('cx', ocx); oc1.setAttribute('cy', ocy); oc1.setAttribute('r', orad * 1.45); oc2.setAttribute('cx', ocx); oc2.setAttribute('cy', ocy); oc2.setAttribute('r', orad * 2.25);
    const ang = T * .22 + 1; od.setAttribute('cx', ocx + Math.cos(ang) * orad * 2.25); od.setAttribute('cy', ocy + Math.sin(ang) * orad * 2.25); orbit.style.opacity = sstep(.3, 1, app) * (LY.stack ? .5 : 1);
    let dd = 1; cards.forEach(c => { if (!c.classList.contains('cur')) return; const r = c.getBoundingClientRect(), dx = Math.max(r.left - (ocx + Math.cos(ang) * orad * 2.25), 0, (ocx + Math.cos(ang) * orad * 2.25) - r.right), dy = Math.max(r.top - (ocy + Math.sin(ang) * orad * 2.25), 0, (ocy + Math.sin(ang) * orad * 2.25) - r.bottom); dd = Math.min(dd, Math.hypot(dx, dy) / 40); }); od.style.opacity = clamp(dd); }
  cards.forEach(c => c.classList.toggle('cur', +c.dataset.i === near && op > .4));
  renderer.render(scene, cam); first = false; requestAnimationFrame(frame);
}
layout(); (document.fonts && document.fonts.ready || Promise.resolve()).then(layout); setTimeout(layout, 400);
requestAnimationFrame(frame);

/* ?audit: shows each chapter in turn, measures every block and reports overlaps and anything off screen. */
if (q.has('audit')) setTimeout(() => {
  const W = innerWidth, H = innerHeight, phone = LY.stack, asp = W / H, R = el => el.getBoundingClientRect(), inter = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1, out = [];
  const pill = R(document.querySelector('.pillnav')), mk = R(mark), rt = R(document.querySelector('.top .right')), hb = Math.max(R(top).bottom, 0);
  if (!phone && pill.width) { if (mk.right > pill.left - 6) out.push('mark/nav touch'); if (pill.right > rt.left - 6) out.push('nav/right touch'); }
  if (document.documentElement.scrollWidth > W + 1) out.push('horizontal scroll ' + document.documentElement.scrollWidth);
  stopEls.forEach((el, k) => {
    stopEls.forEach((o, j) => o.classList.toggle('cur', j === k)); cards.forEach(c => c.classList.toggle('cur', +c.dataset.i === k)); formEl.classList.toggle('on', k === 8);
    const c = CH[k], z = k === 8 ? LY.zone8 : LY.zone, uSc = phone ? Math.min((z[1] - z[0]) / 2 * .96, W * .44) / c.ext / (.615 * H / 2) : Math.min(c.sc * (asp < 1.3 ? clamp(asp / 1.3 + .25) : 1), (W - 10 - (.5 + .5 * 1.67 * c.ox * .8) * W) / (.615 * H / 2 * c.ext)), ox = phone ? 0 : c.ox * .8, oy = phone ? (1 - (z[0] + z[1]) / H) * 4.6 * .32492 : 0;
    const cx = (.5 + .5 * 1.67 * ox) * W, cy = (.5 - .5 * oy / (4.6 * .32492)) * H, r = .615 * uSc * (H / 2) * c.ext, O = { left: cx - r, right: cx + r, top: cy - r, bottom: cy + r };
    const S = R(el), cd = cards.find(x => +x.dataset.i === k), C = cd && getComputedStyle(cd).display !== 'none' ? R(cd) : null, ct = R(document.getElementById('count')), F = k === 8 ? R(formEl) : null, notes = [];
    if (S.left < 0 || S.right > W) notes.push('text off sides'); if (S.top < hb + 6 && !phone) notes.push('text under header'); if (S.bottom > H + (phone ? 1 : -6)) notes.push('text below fold');
    if (C && inter(S, C)) notes.push('text/card overlap'); if (C && (C.left < 0 || C.right > W || C.bottom > H || C.top < 0)) notes.push('card off screen');
    if (!phone && inter(S, ct) && k > 0) notes.push('text/counter overlap'); if (C && !phone && inter(C, ct)) notes.push('card/counter overlap');
    if (O.left < -2 || O.right > W + 2 || O.top < -2 || O.bottom > H + 2) notes.push(`orb cut off (${Math.round(O.left)},${Math.round(O.top)},${Math.round(O.right)},${Math.round(O.bottom)})`);
    if (phone && k > 0 && O.bottom > S.top + 40) notes.push('orb hidden by text sheet by ' + Math.round(O.bottom - S.top));
    if (!phone && k > 1 && k < 8 && S.right > O.left + r * .6) notes.push('text over orb by ' + Math.round(S.right - O.left));
    if (F && inter(S, F)) notes.push('text/form overlap'); if (F && (F.left < 0 || F.right > W || F.top < hb || F.bottom > H)) notes.push('form off screen');
    if (notes.length) out.push(k + ': ' + notes.join('; '));
  });
  document.title = 'AUDIT ' + W + 'x' + H + ' => ' + (out.length ? out.join(' | ') : 'clean');
}, 1800);
