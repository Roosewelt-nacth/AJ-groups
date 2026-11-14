/* AJ GROUPS · Touch the material (prototype 1)
   A dark surface lit by a small torch that follows the cursor (or a finger, or a slow wandering light when untouched).
   The surface is a real photographic scan (CC0, ambientCG): colour, normal and roughness maps lit at a raking angle,
   so every fibre and grain catches the light. Scrolling dissolves one material into the next. */
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
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));

/* materials: scans, plus a tint and a texture scale for each stop */
const DIR = '../../assets/materials/', NAMES = ['Fabric086', 'Leather037', 'Paper006'];
const loader = new THREE.TextureLoader(), maxAni = renderer.capabilities.getMaxAnisotropy();
const tex = (n, kind, srgb) => { const t = loader.load(`${DIR}${n}_1K-JPG_${kind}.jpg`, () => { loaded++; }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAni; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
let loaded = 0;
const T = NAMES.map(n => ({ c: tex(n, 'Color', true), n: tex(n, 'NormalGL', false), r: tex(n, 'Roughness', false) }));
/* stop -> [material index, tint, scale] */
const STOPS = [
  [0, [.55, .62, .85], 1.0],   /* AJ Groups: dark blue-grey cloth */
  [1, [.85, .72, .6], 1.15],   /* Fovo: camera leather */
  [0, [.9, .62, .45], 1.25],   /* Clothing: warm cloth */
  [2, [.82, .84, .9], 1.0],    /* Alven: paper */
];

const U = {
  c0: { value: T[0].c }, n0: { value: T[0].n }, r0: { value: T[0].r }, c1: { value: T[1].c }, n1: { value: T[1].n }, r1: { value: T[1].r }, c2: { value: T[2].c }, n2: { value: T[2].n }, r2: { value: T[2].r },
  uA: { value: 0 }, uB: { value: 1 }, uMix: { value: 0 }, uTintA: { value: new THREE.Vector3(...STOPS[0][1]) }, uTintB: { value: new THREE.Vector3(...STOPS[1][1]) },
  uScaleA: { value: 1 }, uScaleB: { value: 1 }, uLight: { value: new THREE.Vector2(.65, .5) }, uAspect: { value: 1 }, uTime: { value: 0 }, uReveal: { value: 0 }, uRadius: { value: 1 },
};
const vert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
const frag = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D c0, n0, r0, c1, n1, r1, c2, n2, r2;
uniform float uA, uB, uMix, uScaleA, uScaleB, uAspect, uTime, uReveal, uRadius; uniform vec3 uTintA, uTintB; uniform vec2 uLight;

vec3 colTex(float id, vec2 uv){ if (id < .5) return texture2D(c0, uv).rgb; if (id < 1.5) return texture2D(c1, uv).rgb; return texture2D(c2, uv).rgb; }
vec3 nrmTex(float id, vec2 uv){ if (id < .5) return texture2D(n0, uv).rgb; if (id < 1.5) return texture2D(n1, uv).rgb; return texture2D(n2, uv).rgb; }
float rouTex(float id, vec2 uv){ if (id < .5) return texture2D(r0, uv).r; if (id < 1.5) return texture2D(r1, uv).r; return texture2D(r2, uv).r; }
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y); }
float fbm(vec2 p){ return vnoise(p) * .55 + vnoise(p * 2.1) * .3 + vnoise(p * 4.3) * .15; }

vec3 shade(float id, vec3 tint, float sc, vec2 p, vec3 L){
  vec2 uv = p * sc * .9 + vec2(.5);
  vec3 alb = colTex(id, uv) * tint;
  vec3 nm = nrmTex(id, uv) * 2. - 1.; nm.xy *= (id > 1.5 ? 2.4 : 1.5); vec3 n = normalize(nm);
  float rough = rouTex(id, uv);
  vec3 toL = L - vec3(p, 0.); float dist2 = dot(toL.xy, toL.xy);
  vec3 ldir = normalize(toL);
  float atten = 1. / (1. + 8. / max(uRadius, .2) * dist2); float gain = id > 1.5 ? .42 : 1.;
  float diff = max(dot(n, ldir), 0.);
  vec3 h = normalize(ldir + vec3(0., 0., 1.));
  float spec = pow(max(dot(n, h), 0.), mix(60., 8., rough)) * (1. - rough * .6);
  vec3 key = normalize(vec3(-.6, .5, .62));
  vec3 c = alb * (.035 + .95 * gain * diff * atten * vec3(1., .84, .64) * uReveal);
  c += spec * atten * gain * vec3(1., .9, .76) * .55 * uReveal;
  c += alb * max(dot(n, key), 0.) * vec3(.34, .46, .8) * .13;       /* a cold grazing light so the shadow side is never dead */
  return c;
}
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }

void main(){
  vec2 p = (vUv - .5) * vec2(uAspect, 1.);
  vec3 L = vec3((uLight - .5) * vec2(uAspect, 1.), .26);
  vec3 a = shade(uA, uTintA, uScaleA, p, L);
  vec3 col = a;
  float edge = 0.;
  if (uMix > .001) {
    vec3 b = shade(uB, uTintB, uScaleB, p, L);
    float nse = fbm(p * 2.2 + uTime * .012);
    float thr = mix(-.12, 1.1, uMix);
    float m = smoothstep(thr - .05, thr + .05, nse);            /* 1 where the old material remains */
    col = mix(b, a, m);
    edge = exp(-pow((nse - thr) / .035, 2.)) * sin(3.14159 * clamp(uMix, 0., 1.));
    col += vec3(1., .55, .22) * edge * .9 * uReveal;               /* a thin warm line where one becomes the next */
  }
  vec2 q = vUv - .5; col *= 1. - dot(q, q) * .9;
  col = aces(col * 1.25);
  col = pow(col, vec3(.4545));
  col += (hash(gl_FragCoord.xy + fract(uTime) * 100.) - .5) * .02;
  gl_FragColor = vec4(col, 1.);
}`;
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false }));
quad.frustumCulled = false; renderer.setClearColor(0x050608); const scene = new THREE.Scene(); scene.add(quad);
const cam = new THREE.Camera();

/* panels and dots */
const dotsEl = document.getElementById('dots');
dotsEl.innerHTML = stopEls.map(el => `<button type="button" aria-label="${(el.querySelector('h1,h2') || el).textContent.trim()}"></button>`).join('');
const dotBtns = [...dotsEl.children], vh = () => innerHeight;
dotBtns.forEach((b, i) => b.addEventListener('click', () => scrollTo({ top: i * vh(), behavior: RM ? 'auto' : 'smooth' })));
const PIN = parseFloat(new URLSearchParams(location.search).get('s')), LP = (new URLSearchParams(location.search).get('l') || '').split(',').map(parseFloat);
const cue = document.getElementById('cue');

/* the light: the cursor, a finger, or a slow wandering path when nobody is touching */
const light = { x: .65, y: .5, tx: .65, ty: .5, idle: 1 }; let lastMove = -9;
const setLight = (cx, cy) => { light.tx = cx / innerWidth; light.ty = 1 - cy / innerHeight; lastMove = performance.now() / 1000; };
addEventListener('pointermove', e => setLight(e.clientX, e.clientY), { passive: true });
addEventListener('pointerdown', e => setLight(e.clientX, e.clientY), { passive: true });
function fit() { renderer.setSize(innerWidth, innerHeight, false); U.uAspect.value = innerWidth / innerHeight; }
fit(); addEventListener('resize', fit);

const clock = new THREE.Clock(); let sNow = 0, first = true, curIdx = -1, reveal = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime, T0 = RM ? 0 : t;
  const target = isNaN(PIN) ? clamp(scrollY / vh(), 0, N - 1) : clamp(PIN, 0, N - 1);
  sNow = first ? target : sNow + (target - sNow) * Math.min(1, dt * 5);
  const i = clamp(Math.floor(sNow), 0, N - 2), f = sNow - i, w = sNow >= N - 1 ? 0 : sstep(.2, .8, f), a = sNow >= N - 1 ? N - 1 : i, b = sNow >= N - 1 ? N - 1 : i + 1;
  U.uA.value = STOPS[a][0]; U.uB.value = STOPS[b][0]; U.uMix.value = w;
  U.uTintA.value.set(...STOPS[a][1]); U.uTintB.value.set(...STOPS[b][1]); U.uScaleA.value = STOPS[a][2]; U.uScaleB.value = STOPS[b][2];
  /* light position */
  const idle = performance.now() / 1000 - lastMove > 2.5;
  let lx = light.tx, ly = light.ty;
  if (LP.length === 2 && !isNaN(LP[0])) { lx = LP[0]; ly = LP[1]; }
  else if (idle) { lx = .62 + Math.sin(T0 * .32) * .26 + Math.sin(T0 * .71) * .05; ly = .5 + Math.cos(T0 * .27) * .22; }
  light.x += (lx - light.x) * Math.min(1, dt * (idle ? 1.2 : 9)); light.y += (ly - light.y) * Math.min(1, dt * (idle ? 1.2 : 9));
  U.uLight.value.set(light.x, light.y);
  reveal += ((loaded >= 9 ? 1 : 0) - reveal) * Math.min(1, dt * 1.4); U.uReveal.value = isNaN(PIN) ? reveal : (loaded >= 9 ? 1 : 0);
  U.uRadius.value = 1 + Math.sin(T0 * .8) * .06; U.uTime.value = T0;
  const near = Math.round(clamp(sNow, 0, N - 1)), d = Math.abs(sNow - near), op = (1 - sstep(.08, .34, d)) * sstep(.25, 1.1, U.uReveal.value * 1.2);
  stopEls.forEach((el, k) => { const on = k === near; el.style.setProperty('--o', on ? op.toFixed(3) : 0); el.classList.toggle('cur', on && op > .4); });
  if (near !== curIdx) { curIdx = near; dotBtns.forEach((bt, k) => k === near ? bt.setAttribute('aria-current', 'step') : bt.removeAttribute('aria-current')); }
  cue.style.opacity = sNow < .08 ? 1 : 0;
  renderer.render(scene, cam); first = false;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__touch = { U };
