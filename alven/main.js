/* Alven Studio. A flowing colour field (a shader) behind the page, a glass lens that follows the pointer and bends what is under it,
   and the page content on top. The hero headline has a second copy that shows only inside the lens. */
import * as THREE from 'three';

const MOBILE = matchMedia('(max-width: 900px), (pointer: coarse)').matches, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const q = new URLSearchParams(location.search), TFIX = parseFloat(q.get('t'));
const root = document.documentElement, $ = id => document.getElementById(id);

/* ---------- theme: follows the device unless the visitor picks ---------- */
const SYS = matchMedia('(prefers-color-scheme: dark)'); let LIGHT = SYS.matches ? 0 : 1, CHOSEN = false;
try { const sv = localStorage.getItem('alventheme'); if (sv) { LIGHT = sv === 'light' ? 1 : 0; CHOSEN = true; } } catch (e) {}
if (q.get('theme')) LIGHT = q.get('theme') === 'light' ? 1 : 0;
let lightNow = LIGHT; const setTheme = () => { root.dataset.theme = LIGHT ? 'light' : 'dark'; };
setTheme();
SYS.addEventListener && SYS.addEventListener('change', e => { if (CHOSEN) return; LIGHT = e.matches ? 0 : 1; setTheme(); });
$('theme').addEventListener('click', () => { CHOSEN = true; LIGHT = LIGHT ? 0 : 1; setTheme(); try { localStorage.setItem('alventheme', LIGHT ? 'light' : 'dark'); } catch (e) {} });

/* ---------- the colour field and the lens ---------- */
const canvas = $('c'); let renderer; try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
let PR = Math.min(devicePixelRatio, MOBILE ? 1.5 : 1.5), PRMAX = PR;
const U = { uT: { value: 0 }, uAsp: { value: 1 }, uRes: { value: new THREE.Vector2(1, 1) }, uM: { value: new THREE.Vector2(-999, -999) }, uR: { value: 90 }, uOn: { value: 0 }, uLight: { value: LIGHT }, uScroll: { value: 0 }, uScrollY: { value: 0 }, uOct: { value: MOBILE ? 3 : 4 }, uPtr: { value: new THREE.Vector2(.5, .5) }, uC1: { value: new THREE.Vector3() }, uC2: { value: new THREE.Vector3() }, uC3: { value: new THREE.Vector3() }, uC4: { value: new THREE.Vector3() }, uGrade: { value: new THREE.Vector3(1, 1, 1) }, uHue: { value: 0 }, uSA: { value: 0 }, uSB: { value: 0 }, uSW: { value: 1 }, uSph: { value: 1 }, uGaze: { value: new THREE.Vector2() } };
let scene, cam;
if (renderer) {
  renderer.setPixelRatio(PR);
  const frag = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uT, uAsp, uR, uOn, uLight, uScroll, uScrollY, uOct, uHue; uniform vec2 uRes, uM, uPtr; uniform vec3 uC1, uC2, uC3, uC4, uGrade; uniform float uSA, uSB, uSW, uSph; uniform vec2 uGaze;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
vec3 hueRot(vec3 c, float a){ const vec3 k = vec3(.57735); float ca = cos(a), sa = sin(a); return c * ca + cross(k, c) * sa + k * dot(k, c) * (1. - ca); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { if (float(i) >= uOct) break; s += a * vn(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
/* the field: three soft masks (deep teal, bright mint, warm amber) that drift and fold into each other */
vec3 field(vec2 uv){
  vec2 p = uv * 1.15 + vec2(0., uScrollY * .5); float t = uT * .06;
  p += (uPtr - .5) * .12;
  vec2 a = vec2(fbm(p + vec2(0., t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 b = vec2(fbm(p + 3. * a + vec2(1.7, 9.2) + t * 1.3), fbm(p + 3. * a + vec2(8.3, 2.8) - t));
  float f = fbm(p + 3.4 * b);
  float m1 = smoothstep(.30, .70, f), m2 = smoothstep(.52, .92, f * (.6 + b.x)), m3 = smoothstep(.52, .86, b.y) * (1. - m2 * .5);
  vec3 dk = vec3(.012, .03, .03);
  vec3 d = mix(dk, uC1, m1); d = mix(d, uC4, smoothstep(.2, .6, a.x) * .5 * m1); d = mix(d, uC2, m2 * .72); d = mix(d, uC3, m3 * .9);
  vec3 lt = vec3(.935, .955, .95); lt = mix(lt, mix(vec3(1.), uC2, .4), m1 * .55); lt = mix(lt, mix(vec3(1.), uC2, .6), m2 * .6); lt = mix(lt, mix(vec3(1.), uC3, .55), m3 * .65);
  vec3 c = mix(d, lt, uLight);
  vec2 dp = uv - (uPtr - .5) * vec2(uAsp, 1.);                                  /* hues turn near the pointer, and drift slowly everywhere */
  return hueRot(c, uHue * exp(-dot(dp, dp) * 6.5) + .12 * sin(uT * .05 + uv.x));
}
float sdBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r; }
float sdTorus(vec3 p, float R, float r){ vec2 q = vec2(length(p.xy) - R, p.z); return length(q) - r; }
float sdHex(vec2 p, float r){ const vec3 k = vec3(-.866025404, .5, .577350269); p = abs(p); p -= 2. * min(dot(k.xy, p), 0.) * k.xy; p -= vec2(clamp(p.x, -k.z * r, k.z * r), r); return length(p) * sign(p.y); }
float sdTri(vec2 p){ const float k = 1.7320508; p.x = abs(p.x) - .62; p.y = p.y + .62 / k; if (p.x + k * p.y > 0.) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.; p.x -= clamp(p.x, -1.24, 0.); return -length(p) * sign(p.y); }
float smin2(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }
float ext2(float d2, float z, float h){ vec2 w = vec2(d2, abs(z) - h); return min(max(w.x, w.y), 0.) + length(max(w, 0.)); }
/* the glass object: 0 sphere (the eye), 1 cube (strategy), 2 two bubbles (social), 3 target ring (ads), 4 play (video), 5 browser slab (web), 6 bars (analytics), 7 aperture (the idea) */
float shp(float id, vec3 p){
  if (id < .5) return length(p) - .985;
  if (id < 1.5) return sdBox(p, vec3(.56), .2);
  if (id < 2.5) return smin2(length(p - vec3(-.3, .14, 0.)) - .6, length(p - vec3(.34, -.22, 0.)) - .5, .25);
  if (id < 3.5) return sdTorus(p, .66, .27);
  if (id < 4.5) return ext2(sdTri(vec2(-p.y, p.x) * 1.1) / 1.1 - .05, p.z, .22);
  if (id < 5.5) return sdBox(p, vec3(.8, .5, .1), .1);
  if (id < 6.5) return min(min(sdBox(p - vec3(-.58, -.32, 0.), vec3(.17, .33, .22), .08), sdBox(p - vec3(0., -.14, 0.), vec3(.17, .5, .22), .08)), sdBox(p - vec3(.58, .08, 0.), vec3(.17, .74, .22), .08));
  return ext2(max(length(p.xy) - .94, -sdHex(p.xy, .46)), p.z, .2) - .05;
}
float eyeMap(vec3 p){
  float a = sin(uT * .35) * .75, ca = cos(a), sa = sin(a); p.xz = mat2(ca, -sa, sa, ca) * p.xz;
  float b = .3 + uGaze.y * .25 - uGaze.x * 0., cb = cos(b), sb = sin(b); p.yz = mat2(cb, -sb, sb, cb) * p.yz;
  return mix(shp(uSA, p), shp(uSB, p), uSW);
}
vec3 eyeN(vec3 p){ vec2 e = vec2(.002, -.002); return normalize(e.xyy * eyeMap(p + e.xyy) + e.yyx * eyeMap(p + e.yyx) + e.yxy * eyeMap(p + e.yxy) + e.xxx * eyeMap(p + e.xxx)); }
void main(){
  vec2 uv = (vUv - .5) * vec2(uAsp, 1.);
  vec2 pix = vUv * uRes; vec2 dd = (pix - uM) / uR; float r = length(dd);
  vec3 col;
  if (r < 1.12 && uOn > .01) {
    vec3 ro = vec3(dd, 3.), rd = vec3(0., 0., -1.); float t = 1.5, mind = 9.; bool hit = false; vec3 p = ro;
    for (int i = 0; i < 40; i++) { p = ro + rd * t; float d = eyeMap(p); mind = min(mind, d); if (d < .002) { hit = true; break; } t += d * .9; if (t > 4.6) break; }
    col = field(uv);
    if (hit) {
      vec3 n = eyeN(p); vec3 rin = refract(rd, n, 1. / 1.45); float ti = .02; vec3 q = p;
      for (int i = 0; i < 24; i++) { q = p - n * .004 + rin * ti; float d = -eyeMap(q); if (d < .003) break; ti += max(d, .015); if (ti > 3.2) break; }
      vec3 no = -eyeN(q); vec3 ro2 = refract(rin, no, 1.45); if (dot(ro2, ro2) < .01) ro2 = reflect(rin, no);
      float k = (uR / uRes.y) * 1.15 * uOn; vec2 o = (ro2.xy * (.55 + ti * .8) - n.xy * .25) * k;
      col = vec3(field(uv + o).r, field(uv + o * 1.07).g, field(uv + o * 1.14).b);
      col *= mix(vec3(1.), uC2 * 1.15 + .15, clamp(ti * .12, 0., .3));
      float fr = pow(1. - max(n.z, 0.), 3.);
      col += vec3(1.) * fr * .34 * (1. - uLight * .6);
      col += vec3(1.) * pow(max(dot(n, normalize(vec3(-.45, .55, .7))), 0.), 36.) * .7;
    } else if (mind < .014) col += vec3(.25) * (1. - mind / .014);
  } else col = field(uv);
  col *= uGrade;
  col += (h(gl_FragCoord.xy + fract(uT) * 91.) - .5) * (.03 + .02 * (1. - uLight));
  gl_FragColor = vec4(col, 1.);
}`;
  scene = new THREE.Scene(); cam = new THREE.Camera();
  scene.add(Object.assign(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: frag, depthTest: false, depthWrite: false })), { frustumCulled: false }));
} else document.body.style.background = 'radial-gradient(60% 50% at 70% 20%,#0f5a52,#050a0a)';
const fit = () => { if (!renderer) return; const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); U.uAsp.value = w / h; U.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio()); };
fit(); addEventListener('resize', fit);

/* ---------- adaptive colour: a palette per section, blended as you scroll; a grade for the visitor's time of day; hue turns near the pointer ---------- */
const PAL = [
  [[.03, .30, .30], [.24, .93, .80], [1., .46, .16], [.04, .12, .22]],      /* hero: teal and amber */
  [[.02, .10, .24], [.30, .80, 1.], [.85, .88, 1.], [.02, .05, .14]],      /* the idea: night blue and cool light */
  [[.05, .12, .38], [.28, .62, 1.], [.62, .30, 1.], [.03, .05, .20]],      /* services: blue and violet */
  [[.30, .05, .25], [1., .35, .62], [1., .55, .28], [.12, .03, .14]],      /* process: magenta and coral */
  [[.05, .25, .12], [.55, .95, .35], [1., .78, .25], [.03, .12, .08]]];    /* contact: green and gold */
const secEls = ['hero', 'idea', 'services', 'process', 'contact'].map(id => $(id)), mixv = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t), sst = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const TOD = [[0, [.84, .92, 1.14]], [5, [.88, .95, 1.1]], [9, [.95, 1.0, 1.06]], [12, [1, 1, 1]], [16, [1.02, 1, .97]], [18.5, [1.12, .97, .82]], [21, [.92, .92, 1.08]], [24, [.84, .92, 1.14]]];
const hourNow = () => { const o = parseFloat(q.get('hour')); if (!isNaN(o)) return o; const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
const grade = hr => { for (let i = 0; i < TOD.length - 1; i++) if (hr >= TOD[i][0] && hr <= TOD[i + 1][0]) return mixv(TOD[i][1], TOD[i + 1][1], (hr - TOD[i][0]) / (TOD[i + 1][0] - TOD[i][0])); return [1, 1, 1]; };
let curPal = PAL[0].map(c => c.slice()), secP = 0, hoverCard = -1;
function palette(y, H) { const tops = secEls.map(e => e.getBoundingClientRect().top + scrollY); let p = 0; for (let i = 1; i < PAL.length; i++) p += sst(tops[i] - H * .7, tops[i] - H * .1, y + H * .5); secP = p; const i0 = Math.min(PAL.length - 2, Math.floor(p)), f = clamp(p - i0); return PAL[i0].map((c, k) => mixv(c, PAL[i0 + 1][k], f)); }

/* ---------- headline words ---------- */
const split = hd => { let k = 0; const walk = n => { [...n.childNodes].forEach(c => { if (c.nodeType === 3) { const frag = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(t => { if (!t.trim()) { frag.append(t); return; } const w = document.createElement('span'); w.className = 'w'; const i = document.createElement('span'); i.textContent = t; i.style.setProperty('--k', k++); w.append(i); frag.append(w); }); c.replaceWith(frag); } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c); }); }; walk(hd); };
document.querySelectorAll('.h2,.big2').forEach(split);
/* the hero headline reveals as a unit */
document.querySelectorAll('.hero .big').forEach(h => { h.style.opacity = 0; h.style.transform = 'translateY(24px)'; h.style.transition = 'opacity 1.1s ease .15s,transform 1.2s cubic-bezier(.2,.8,.2,1) .15s'; requestAnimationFrame(() => requestAnimationFrame(() => { h.style.opacity = 1; h.style.transform = 'none'; })); });
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const sib = [...(e.target.parentElement ? e.target.parentElement.children : [])].filter(x => x.classList.contains('rv') && !x.classList.contains('in')); e.target.style.setProperty('--rd', (Math.min(5, Math.max(0, sib.indexOf(e.target))) * .08).toFixed(2) + 's'); e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .06, rootMargin: '0px 0px -4% 0px' });
document.querySelectorAll('.rv,.h2,.big2').forEach(el => io.observe(el));
if (RM) document.querySelectorAll('.rv,.h2,.big2').forEach(el => el.classList.add('in'));

/* ---------- menu, active link ---------- */
const menu = $('menu'), mb = $('menubtn'); const setMenu = on => { menu.classList.toggle('on', on); mb.setAttribute('aria-expanded', on ? 'true' : 'false'); mb.textContent = on ? 'Close' : 'Menu'; };
mb.addEventListener('click', () => setMenu(!menu.classList.contains('on'))); menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
const links = [...document.querySelectorAll('.pill a')], secs = links.map(a => document.querySelector(a.getAttribute('href')));
/* ---------- services: a soft glow follows the pointer on each card ---------- */
/* each service reveals what is included when it is hovered, focused or (on a phone) tapped once */
const MORE = [['Positioning workshop', 'Voice and messaging', 'Visual direction'], ['Content calendar', 'Community management', 'Monthly report'], ['Search and social ads', 'Audience testing', 'Weekly optimisation'], ['Shoots and reels', 'Editing and motion', 'Photo library'], ['Design and build', 'Speed and search basics', 'Forms and tracking'], ['Live dashboard', 'Plain monthly review', 'Clear next steps']];
const touchOnly = matchMedia('(hover: none)').matches;
document.querySelectorAll('#cards .card').forEach((c, i) => { const ul = document.createElement('ul'); ul.className = 'more'; ul.innerHTML = MORE[i].map(t => `<li>${t}</li>`).join('') + '<li>Enquire about this <span>→</span></li>'; c.lastElementChild.append(ul);
  if (touchOnly) c.addEventListener('click', e => { if (!c.classList.contains('open')) { e.preventDefault(); document.querySelectorAll('#cards .card.open').forEach(o => o.classList.remove('open')); c.classList.add('open'); } }); });
document.querySelectorAll('#cards .card').forEach((c, i) => { c.addEventListener('pointerenter', () => { hoverCard = i; }); c.addEventListener('pointerleave', () => { if (hoverCard === i) hoverCard = -1; }); c.addEventListener('focus', () => { hoverCard = i; }); c.addEventListener('blur', () => { if (hoverCard === i) hoverCard = -1; }); });
document.querySelectorAll('#cards .card').forEach(c => c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }));

/* ---------- process: five steps that advance by themselves and answer a click ---------- */
const STEPS = [
  ['Listen', 'We start with your goals, your customers and what has and has not worked before.', ['Discovery call', 'Audit', 'Goals']],
  ['Plan', 'A clear plan: audience, message, channels and a calendar you can read in a minute.', ['Strategy', 'Content plan', 'Budget']],
  ['Create', 'Posts, films, ads and pages made by one team, in your brand’s own voice.', ['Design', 'Video', 'Copy']],
  ['Launch', 'We publish, run the ads and watch the first numbers closely.', ['Campaign', 'Ads', 'Tracking']],
  ['Grow', 'Monthly reviews, honest reports and the next experiment to try.', ['Reports', 'Testing', 'Scale']]];
const stepsEl = $('steps'), pn = $('pnum'), ptx = $('ptxt'); let cur = -1, timer = 0, manual = false; const DUR = 6;
stepsEl.innerHTML = STEPS.map((s, i) => `<button type="button" role="tab" data-i="${i}"><b>0${i + 1}</b><span>${s[0]}</span><i></i></button>`).join('');
const sb = [...stepsEl.children];
function show(i, first) { if (i === cur) return; cur = i; sb.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.style.setProperty('--dur', manual ? '0s' : DUR + 's'); });
  const apply = () => { pn.textContent = '0' + (i + 1); $('pt').textContent = STEPS[i][0]; $('pp').textContent = STEPS[i][1]; $('pc').innerHTML = STEPS[i][2].map(t => `<span>${t}</span>`).join(''); pn.classList.remove('out'); ptx.classList.remove('out'); };
  if (first) apply(); else { pn.classList.add('out'); ptx.classList.add('out'); setTimeout(apply, 330); } }
const arm = () => { clearTimeout(timer); if (RM || manual) return; timer = setTimeout(() => { show((cur + 1) % STEPS.length); arm(); }, DUR * 1000); };
sb.forEach((b, i) => b.addEventListener('click', () => { manual = true; clearTimeout(timer); show(i); }));
show(0, true); arm();

/* ---------- form (placeholder) ---------- */
$('form').addEventListener('submit', e => { e.preventDefault(); $('ok').classList.add('on'); });

/* ---------- the idea: a field of people, lit by the lens ---------- */
const audEl = $('aud'), actx = audEl.getContext('2d'), ideaEl = $('idea'); let dots = [], seenN = 0, audVis = false, audW = 0, audH = 0, audDpr = 1, audShown = 0;
const PEOPLE = 6;   /* each dot stands for six people */
function audInit() { const r = ideaEl.getBoundingClientRect(); audDpr = Math.min(devicePixelRatio, 2); audW = r.width; audH = r.height; audEl.width = Math.round(audW * audDpr); audEl.height = Math.round(audH * audDpr);
  const gap = MOBILE ? 25 : 28, tr = ideaEl.querySelector('.idea-in').getBoundingClientRect(), bx = { l: tr.left - r.left - 34, r: tr.right - r.left + 34, t: tr.top - r.top - 30, b: tr.bottom - r.top + 30 }; dots = []; seenN = 0; audShown = 0; for (let y = gap / 2; y < audH; y += gap) for (let x = gap / 2; x < audW; x += gap) if (!(x > bx.l && x < bx.r && y > bx.t && y < bx.b)) dots.push({ x: x + (Math.random() - .5) * gap * .55, y: y + (Math.random() - .5) * gap * .55, b: 0, s: 0, ph: Math.random() * 6.28 });
  $('seen').textContent = '0'; $('seenBar').style.transform = 'scaleX(0)'; $('audDone').classList.remove('on'); }
new ResizeObserver(() => { if (Math.abs(ideaEl.offsetWidth - audW) > 2 || Math.abs(ideaEl.offsetHeight - audH) > 2) audInit(); }).observe(ideaEl);
new IntersectionObserver(es => { audVis = es[0].isIntersecting; }, { threshold: 0 }).observe(ideaEl);
$('audReset').addEventListener('click', audInit);
function drawAud(T, ptrX, ptrY, light, rgb) {
  const r = ideaEl.getBoundingClientRect(), px = ptrX - r.left, py = ptrY - r.top, R = MOBILE ? 70 : 100, c = actx; c.setTransform(audDpr, 0, 0, audDpr, 0, 0); c.clearRect(0, 0, audW, audH);
  const base = light ? '10,22,18' : '238,246,243', lit = rgb.join(',');
  for (let i = 0; i < dots.length; i++) { const d = dots[i], dist = Math.hypot(d.x - px, d.y - py);
    if (dist < R) { const k = 1 - dist / R; if (k * 1.3 > d.b) d.b = Math.min(1, k * 1.3); if (!d.s) { d.s = 1; seenN++; } }
    d.b *= .965; const a = d.s ? .5 + d.b * .5 : .16 + .06 * Math.sin(T * .8 + d.ph), rad = 1.5 + d.b * 3.6 + (d.s ? .5 : 0);
    c.fillStyle = d.s ? `rgba(${lit},${a.toFixed(3)})` : `rgba(${base},${a.toFixed(3)})`; c.beginPath(); c.arc(d.x, d.y, rad, 0, 6.2832); c.fill(); }
  audShown += (seenN - audShown) * .12; $('seen').textContent = Math.round(audShown * PEOPLE).toLocaleString('en-IN'); const frac = dots.length ? seenN / dots.length : 0; $('seenBar').style.transform = `scaleX(${frac.toFixed(3)})`;
  $('audDone').classList.toggle('on', frac > .8);
}
audInit(); (document.fonts && document.fonts.ready || Promise.resolve()).then(audInit); setTimeout(audInit, 600);

/* ---------- pointer, lens and frame loop ---------- */
const ptr = { x: innerWidth * .62, y: innerHeight * .46, tx: innerWidth * .62, ty: innerHeight * .46, last: 0, touch: MOBILE };
addEventListener('pointermove', e => { ptr.tx = e.clientX; ptr.ty = e.clientY; ptr.last = performance.now(); if (e.pointerType === 'touch') ptr.touch = true; else ptr.touch = false; }, { passive: true });
addEventListener('pointerdown', e => { ptr.tx = e.clientX; ptr.ty = e.clientY; ptr.last = performance.now(); }, { passive: true });
const topEl = $('top'), ht = $('ht'), base = ht.querySelector('.big'), alt = $('alt'), clock = new THREE.Clock(); let fa = 0, fn = 0, first = true, sy = 0, lensOn = 0, Rcur = 0; const wan = { x: innerWidth * .6, y: innerHeight * .45, next: 0 }; const eye = { a: 0, b: 0, w: 1, want: 0, gx: 0, gy: 0 }, cardEls = [...document.querySelectorAll('#cards .card')];
function frame() {
  const dt = Math.min(clock.getDelta(), .05), now = performance.now(), T = !isNaN(TFIX) ? TFIX : (RM ? 0 : clock.elapsedTime);
  if (renderer && !first) { fa += dt; fn++; if (fn >= 40) { const av = fa / fn; if (av > .027 && PR > .6) { PR = Math.max(.6, PR * .82); renderer.setPixelRatio(PR); fit(); } else if (av < .019 && PR < PRMAX) { PR = Math.min(PRMAX, PR * 1.1); renderer.setPixelRatio(PR); fit(); } fa = 0; fn = 0; } }
  /* on a phone the lens drifts on its own until a finger moves it */
  const idle = now - ptr.last > 2600;
  if (ptr.touch && idle) { if (now > wan.next) { wan.next = now + 2400 + Math.random() * 2400; const ir = audVis ? document.querySelector('.idea-in').getBoundingClientRect() : null;
      for (let k = 0; k < 8; k++) { const x = innerWidth * (.12 + .76 * Math.random()), y = innerHeight * (.2 + .62 * Math.random()); wan.x = x; wan.y = y; if (!ir || !(x > ir.left - 70 && x < ir.right + 70 && y > ir.top - 70 && y < ir.bottom + 70)) break; } }
    ptr.tx = wan.x; ptr.ty = wan.y; }
  let dockRect = null; { let hc0 = hoverCard; if (touchOnly) { const oi = [...document.querySelectorAll('#cards .card')].findIndex(c => c.classList.contains('open')); if (oi >= 0) hc0 = oi; }
    if (hc0 >= 0) { dockRect = document.querySelectorAll('#cards .card')[hc0].getBoundingClientRect(); ptr.tx = dockRect.left + dockRect.width / 2; ptr.ty = dockRect.top + dockRect.height * .27; ptr.last = now; } }
  ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 7); ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 7);
  lensOn += (1 - lensOn) * Math.min(1, dt * 2.2);
  lightNow += (LIGHT - lightNow) * Math.min(1, dt * 4);
  const H = innerHeight, docH = Math.max(1, document.documentElement.scrollHeight - H); sy += (scrollY - sy) * Math.min(1, dt * 6);
  const Rb = clamp(Math.min(innerWidth, H) * (MOBILE ? .17 : .13), 52, 150), Rt = dockRect ? Math.min(Rb, dockRect.height * .18) : Rb; Rcur = Rcur ? Rcur + (Rt - Rcur) * Math.min(1, dt * 6) : Rt; const R = Rcur, pr = renderer ? renderer.getPixelRatio() : 1;
  { const target = palette(scrollY, H); curPal = curPal.map((c, k) => mixv(c, target[k], Math.min(1, dt * 5))); U.uC1.value.set(...curPal[0]); U.uC2.value.set(...curPal[1]); U.uC3.value.set(...curPal[2]); U.uC4.value.set(...curPal[3]); U.uGrade.value.set(...grade(hourNow()));
    const ink = lightNow > .5 ? .55 : 1, c2 = curPal[1].map(v => Math.round(clamp(v * ink) * 255)), c3 = curPal[2].map(v => Math.round(clamp(v * (lightNow > .5 ? .78 : 1)) * 255));
    root.style.setProperty('--teal', `rgb(${c2})`); root.style.setProperty('--acc', `rgb(${c3})`); U.uHue.value = 1.1; }
  { let hc = hoverCard; if (touchOnly) { const oi = cardEls.findIndex(c => c.classList.contains('open')); if (oi >= 0) hc = oi; }
    const want = 0;   /* the orb keeps one shape: the sphere */
    if (want !== eye.want) { eye.want = want; eye.a = eye.w > .5 ? eye.b : eye.a; eye.b = want; eye.w = 0; }
    eye.w = Math.min(1, eye.w + dt * 2.2); const sw = sst(0, 1, eye.w); U.uSA.value = eye.a; U.uSB.value = eye.b; U.uSW.value = sw; U.uSph.value = (eye.a === 0 ? 1 - sw : 0) + (eye.b === 0 ? sw : 0);
    eye.gx += (clamp((ptr.tx - ptr.x) / 160, -1, 1) - eye.gx) * Math.min(1, dt * 4); eye.gy += (clamp(-(ptr.ty - ptr.y) / 160, -1, 1) - eye.gy) * Math.min(1, dt * 4); U.uGaze.value.set(eye.gx, eye.gy); }
  U.uT.value = T; U.uLight.value = lightNow; U.uScroll.value = clamp(sy / docH); U.uScrollY.value = sy / H; U.uPtr.value.set(ptr.x / innerWidth, 1 - ptr.y / H);
  U.uM.value.set(ptr.x * pr, (H - ptr.y) * pr); U.uR.value = R * pr; U.uOn.value = lensOn;
  /* the second headline shows only inside the lens, and only while the hero is on screen */
  const hr = ht.getBoundingClientRect(), vis = hr.bottom > 0 && hr.top < H, ar = alt.getBoundingClientRect(), br = base.getBoundingClientRect(), RR = (R * .985 * U.uSph.value).toFixed(1);
  { const m = vis && R * U.uSph.value > 8 ? `radial-gradient(circle ${RR}px at ${(ptr.x - br.left).toFixed(1)}px ${(ptr.y - br.top).toFixed(1)}px, transparent ${(R * .97 * U.uSph.value).toFixed(1)}px, #000 ${RR}px)` : 'none'; base.style.webkitMaskImage = m; base.style.maskImage = m; }
  alt.style.clipPath = vis && R * U.uSph.value > 8 ? `circle(${RR}px at ${(ptr.x - ar.left).toFixed(1)}px ${(ptr.y - ar.top).toFixed(1)}px)` : 'circle(0 at 0 0)';
  if (audVis) drawAud(T, ptr.x, ptr.y, lightNow > .5, curPal[1].map(v => Math.round(clamp(v * (lightNow > .5 ? .55 : 1)) * 255)));
  topEl.classList.toggle('sc', scrollY > 40);
  /* the nav shows where you are */
  let on = -1; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < H * .5) on = i; }); links.forEach((a, i) => a.classList.toggle('on', i === on));
  if (renderer) renderer.render(scene, cam); first = false; requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
