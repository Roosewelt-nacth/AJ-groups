/* AJ GROUPS · One orb, six businesses (light prototype)
   A calm grey-blue page with one glass orb at its centre (after the Atomic Motion reference). A shader ray-marches the orb as a signed distance
   field, so it can melt from a sphere into a ripple, a lens, a cloth, a cube, a donut, soft blobs and a ring, one per chapter. The page tone and
   type colour shift per chapter (dark type on pale chapters, white on deeper ones). A circular loader counts up and ends inside the orb. */
import * as THREE from 'three';

const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t, sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const stopEls = [...document.querySelectorAll('.stop')], NS = stopEls.length; document.documentElement.style.setProperty('--n', NS); const LAST = NS - 1, IV = stopEls.findIndex(e => e.dataset.i === '1');
const q = new URLSearchParams(location.search), PIN = parseFloat(q.get('s')), TFIX = parseFloat(q.get('t'));
const root = document.documentElement; if (q.get('sheet')) root.classList.add('sheet');   /* ?sheet=1 keeps the old full-height frosted sheet on phones */

const canvas = document.getElementById('c');
let renderer; try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' }); renderer.autoClear = false; } catch (e) { renderer = null; }
if (!renderer) { stopEls.forEach(e => { e.style.visibility = 'visible'; e.style.position = 'static'; e.style.opacity = 1; e.style.transform = 'none'; e.style.padding = '90px 22px 20px'; }); throw new Error('WebGL unavailable'); }
let PR = Math.min(devicePixelRatio, MOBILE ? 2 : 1.25); renderer.setPixelRatio(PR);

/* per chapter: shape, page tone (rgb), text is white (1) or dark (0), orb tint, orb screen position (x offset in screens, 0 = centred) and scale */
const CH = [
  /* s shape, bg page tone, w white text, tint, ox orb offset, sc scale, ps phone scale, ext shape extent, abs absorption colour, fe (weave, grid, transmission, dispersion). AJ palette: slate blue #2d3041 and beige #debd87; the glass takes the opposite colour to its page so the orb always stands out (tintD/absD: the same glass in the dark theme) */
  { s: 9, bg: [.176, .188, .255], w: 1, tint: [1, .9, .74], ox: 0, sc: 1.0, ps: 1, ext: 1, abs: [.3, .6, 1.8], fe: [0, 0, 1, .07] },
  { s: 8, bg: [.205, .218, .295], w: 1, tint: [1, .92, .78], ox: .24, sc: .96, ps: .92, ext: 1.07, abs: [.5, .9, 1.9], fe: [0, 0, 1, .1] },     /* founder: warm crystal */
  { s: 8, bg: [.205, .218, .295], w: 1, tint: [1, .92, .78], ox: .24, sc: .96, ps: .92, ext: 1.07, abs: [.5, .9, 1.9], fe: [0, 0, 1, .1] },     /* founder: warm crystal */
  { s: 9, bg: [.957, .945, .918], w: 0, tint: [.5, .54, .72], tintD: [1, .88, .68], ox: .24, sc: 1.05, ps: 1, ext: 1, abs: [4.6, 4.4, 3.0], absD: [0.25, 1.7, 3.2], fe: [0, 0, .45, .07] },        /* our story */
  { s: 9, bg: [.957, .945, .918], w: 0, tint: [.5, .54, .72], tintD: [1, .88, .68], ox: .24, sc: 1.05, ps: 1, ext: 1, abs: [4.6, 4.4, 3.0], absD: [0.25, 1.7, 3.2], fe: [0, 0, .45, .07] },        /* our story */
  { s: 0, bg: [.205, .218, .295], w: 1, tint: [1, .9, .74], ox: 0, sc: 1.18, ps: 1, ext: 1, abs: [.3, .6, 1.8], fe: [0, 0, 1, .07] },
  { s: 5, bg: [.205, .218, .295], w: 1, tint: [1, .86, .66], ox: .24, sc: 1, ps: 1, ext: 1.07, abs: [.7, 1.5, 3.8], fe: [0, 0, .32, .02] },    /* bakery: glossy golden glaze */
  { s: 1, bg: [.957, .945, .918], w: 0, tint: [.5, .54, .72], tintD: [1, .88, .68], ox: .24, sc: 1, ps: 1, ext: 1, abs: [4.6, 4.4, 3.0], absD: [0.25, 1.7, 3.2], fe: [0, 0, .45, .08] },     /* marketing: megaphone */
  { s: 2, bg: [.176, .188, .255], w: 1, tint: [.95, .96, 1], ox: .24, sc: 1, ps: 1, ext: 1.07, abs: [.7, .65, .5], fe: [0, 0, 1, .13] },     /* photography: clear crystal with colour fringes */
  { s: 6, bg: [.957, .945, .918], w: 0, tint: [.5, .54, .72], tintD: [1, .88, .66], ox: .24, sc: .95, ps: .95, ext: 1.1, abs: [4.6, 4.4, 3.0], absD: [0.2, 1.5, 2.5], fe: [0, 0, .4, .03] }, /* kids: toy blocks */
  { s: 3, bg: [.957, .945, .918], w: 0, tint: [.5, .54, .72], tintD: [1, .88, .68], ox: .24, sc: .92, ps: .9, ext: 1.02, abs: [4.6, 4.4, 3.0], absD: [0.35, 2.1, 3.7], fe: [1, 0, .6, .03] },  /* clothing: woven spool */
  { s: 4, bg: [.176, .188, .255], w: 1, tint: [.66, .7, .88], ox: .24, sc: .86, ps: .85, ext: 1.05, abs: [1.6, 1.5, 1.0], fe: [0, 1, 1, .06] },     /* software: blue glass with a beige circuit grid */
  { s: 8, bg: [.205, .218, .295], w: 1, tint: [1, .92, .78], ox: .24, sc: .96, ps: .92, ext: 1.07, abs: [.5, .9, 1.9], fe: [0, 0, 1, .1] },     /* founder: warm crystal */
  { s: 9, bg: [.957, .945, .918], w: 0, tint: [.5, .54, .72], tintD: [1, .88, .68], ox: .24, sc: 1.05, ps: 1, ext: 1, abs: [4.6, 4.4, 3.0], absD: [0.25, 1.7, 3.2], fe: [0, 0, .45, .07] },        /* our story */
  { s: 7, bg: [.176, .188, .255], w: 1, tint: [.95, .96, 1], ox: .26, sc: 1.05, ps: .74, ext: 1.5, abs: [.6, .58, .5], fe: [0, 0, 1, .1] },
];
const DARK = [[.105, .113, .155], [.12, .128, .172], [.098, .105, .145], [.105, .113, .155], [.12, .128, .172], [.098, .105, .145], [.105, .113, .155], [.098, .105, .145], [.12, .128, .172], [.098, .105, .145], [.12, .128, .172], [.098, .105, .145], [.12, .128, .172], [.098, .105, .145], [.105, .113, .155]];
const SYS = matchMedia('(prefers-color-scheme: dark)'); let THEME = SYS.matches ? 1 : 0, CHOSEN = false; try { const sv = localStorage.getItem('ajtheme'); if (sv) { THEME = sv === 'dark' ? 1 : 0; CHOSEN = true; } } catch (e) {} if (q.get('theme')) THEME = q.get('theme') === 'dark' ? 1 : 0;
let themeNow = THEME; root.dataset.theme = THEME ? 'dark' : 'light';
const U = { uTime: { value: 0 }, uAsp: { value: 1 }, uTan: { value: Math.tan(.5 * 36 * Math.PI / 180) }, uA: { value: 0 }, uB: { value: 0 }, uW: { value: 0 }, uBG: { value: new THREE.Vector3() }, uTA: { value: new THREE.Vector3(1, 1, 1) }, uTB: { value: new THREE.Vector3(1, 1, 1) },
  uOff: { value: new THREE.Vector2() }, uSc: { value: 1 }, uApp: { value: 0 }, uRot: { value: new THREE.Vector2() }, uTheme: { value: 0 }, uAbsA: { value: new THREE.Vector3(3.6, 2.6, 1.3) }, uAbsB: { value: new THREE.Vector3(3.6, 2.6, 1.3) }, uFeA: { value: new THREE.Vector4(0, 0, 1, .07) }, uFeB: { value: new THREE.Vector4(0, 0, 1, .07) }, uSteps: { value: MOBILE ? 52 : 72 }, uInner: { value: MOBILE ? 22 : 34 }, uTr: { value: 0 }, uPx: { value: .003 }, uFade: { value: 0 }, uDark: { value: 0 } };
/* the AJ logo as a 3D object: its silhouette becomes a signed-distance texture (built once, here) that the shader extrudes into a slab */
U.uLogo = { value: Object.assign(new THREE.DataTexture(new Uint16Array([THREE.DataUtils.toHalfFloat(1)]), 1, 1, THREE.RedFormat, THREE.HalfFloatType), { needsUpdate: true }) }; U.uLogoOn = { value: 0 };
(function () {
  const N = 512, M = 512, UNIT = 2.5 / N, img = new Image();
  const dt1 = (f, n, d, v, z) => { let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20; for (let q = 1; q < n; q++) { let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); } k++; v[k] = q; z[k] = s; z[k + 1] = 1e20; } k = 0; for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; } };
  const edt = (g) => { const f = new Float64Array(N), d = new Float64Array(N), v = new Int32Array(N), z = new Float64Array(N + 1);
    for (let x = 0; x < N; x++) { for (let y = 0; y < N; y++) f[y] = g[y * N + x]; dt1(f, N, d, v, z); for (let y = 0; y < N; y++) g[y * N + x] = d[y]; }
    for (let y = 0; y < N; y++) { for (let x = 0; x < N; x++) f[x] = g[y * N + x]; dt1(f, N, d, v, z); for (let x = 0; x < N; x++) g[y * N + x] = d[x]; } };
  img.onload = () => {
    try {
      const c = document.createElement('canvas'); c.width = c.height = N; const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0, N, N);
      const px = cx.getImageData(0, 0, N, N).data, inside = new Uint8Array(N * N), A = new Float32Array(N * N), B = new Float32Array(N * N);
      for (let i = 0; i < N * N; i++) { const on = px[i * 4] > 127; inside[i] = on ? 1 : 0; A[i] = on ? 0 : 1e9; B[i] = on ? 1e9 : 0; }
      edt(A); edt(B);                                                   /* A: distance to the logo, B: distance to the outside */
      const sd = new Float32Array(M * M);
      for (let k = 0; k < N * N; k++) sd[k] = (inside[k] ? -(Math.sqrt(B[k]) - .5) : Math.sqrt(A[k]) - .5) * UNIT;
      const bl = new Float32Array(M * M);                                  /* one light blur keeps the gradient smooth, so the glass shows no facets */
      for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) { let s = 0, n = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const xx = x + i, yy = y + j; if (xx >= 0 && xx < M && yy >= 0 && yy < M) { s += sd[yy * M + xx]; n++; } } bl[y * M + x] = s / n; }
      const out = new Uint16Array(M * M);
      for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) out[(M - 1 - y) * M + x] = THREE.DataUtils.toHalfFloat(bl[y * M + x]);   /* row 0 of a data texture is the bottom */
      const t = new THREE.DataTexture(out, M, M, THREE.RedFormat, THREE.HalfFloatType);
      t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
      U.uLogo.value = t; U.uLogoOn.value = 1;
    } catch (e) { /* no logo texture: the shape stays the orb */ }
  };
  img.src = 'assets/brand/logo-silhouette.png';
})();
const frag = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime, uAsp, uTan, uA, uB, uW, uSc, uApp, uSteps, uInner, uDark, uTheme, uTr, uPx, uFade, uLogoOn; uniform vec3 uBG, uTA, uTB, uAbsA, uAbsB; uniform vec4 uFeA, uFeB; uniform vec2 uOff, uRot; uniform sampler2D uLogo;
float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sdRound(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r; }
float sdTorus(vec3 p, float R, float r){ vec2 q = vec2(length(p.xz) - R, p.y); return length(q) - r; }
float sdCylY(vec3 p, float r, float h){ vec2 d = vec2(length(p.xz) - r, abs(p.y) - h); return min(max(d.x, d.y), 0.) + length(max(d, 0.)); }
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h) - r; }
float sdCone(vec3 p, float h, float r1, float r2){ vec2 q = vec2(length(p.xz), p.y), k1 = vec2(r2, h), k2 = vec2(r2 - r1, 2. * h), ca = vec2(q.x - min(q.x, q.y < 0. ? r1 : r2), abs(q.y) - h), cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0., 1.); float s = (cb.x < 0. && ca.y < 0.) ? -1. : 1.; return s * sqrt(min(dot(ca, ca), dot(cb, cb))); }

float shape(int id, vec3 p){
  if (id == 0) { float d = length(p) - .92; return d + .012 * sin(p.x * 9. + uTime * .5) * sin(p.y * 8. + uTime * .4); }
  if (id == 1) { vec3 q = p * 1.5; q.xy *= rot(-.42); q.xz *= rot(-.3);                                                                                      /* marketing: a megaphone with sound rings */
    float horn = sdCone(vec3(q.y, q.x - .1, q.z), .5, .2, .62) - .03, cap = length(q - vec3(-.46, 0., 0.)) - .27, grip = sdRound(q - vec3(-.2, -.46, 0.), vec3(.07, .2, .07), .04);
    float r1 = sdTorus(vec3(q.y, q.x - 1., q.z), .42, .035), r2 = sdTorus(vec3(q.y, q.x - 1.2, q.z), .66, .035);
    return min(smin(smin(horn, cap, .08), grip, .06), min(r1, r2)) / 1.5; }
  if (id == 2) { vec3 q = p * 1.3; q.yz *= rot(.22);                                                                                                           /* photography: a camera */
    float body = sdRound(q - vec3(0., -.05, 0.), vec3(.78, .46, .24), .1), hump = sdRound(q - vec3(-.34, .52, 0.), vec3(.24, .1, .16), .06), btn = sdCylY(q - vec3(.5, .56, 0.), .09, .05) - .02;
    vec3 l = q - vec3(.1, -.02, .3), n = vec3(l.x, l.z, l.y); float barrel = sdCylY(n, .36, .18) - .03, hole = sdCylY(n - vec3(0., .2, 0.), .24, .14), glass = length(q - vec3(.1, -.02, .34)) - .2;
    float d = smin(smin(body, hump, .05), btn, .03); d = smin(d, max(barrel, -hole), .04); return smin(d, glass, .02) / 1.3; }
  if (id == 3) { vec3 q = p * 1.15; q.yz *= rot(.5); q.xy *= rot(.35);                                                                                          /* clothing: a spool of thread */
    float core = sdCylY(q, .34, .56) - .02, fl = min(sdCylY(q - vec3(0., .56, 0.), .66, .07), sdCylY(q + vec3(0., .56, 0.), .66, .07)) - .04, thread = sdCylY(q, .52, .46) - .03 + .012 * sin(q.y * 42.);
    return smin(fl, smin(core, thread, .05), .06) / 1.15; }
  if (id == 4) { vec3 q = p * 1.2; float r = .115;                                                                                                              /* software: code brackets </> */
    float a = smin(sdCap(q, vec3(-.3, .46, 0.), vec3(-.84, 0., 0.), r), sdCap(q, vec3(-.84, 0., 0.), vec3(-.3, -.46, 0.), r), .06), b = smin(sdCap(q, vec3(.3, .46, 0.), vec3(.84, 0., 0.), r), sdCap(q, vec3(.84, 0., 0.), vec3(.3, -.46, 0.), r), .06);
    return min(min(a, b), sdCap(q, vec3(.15, .64, 0.), vec3(-.15, -.64, 0.), r * .9)) / 1.2; }
  if (id == 5) { vec3 q = p; q.yz *= rot(-.5); float ang = atan(q.z, q.x);                                                                                  /* bakery: a two-tier cake with a cherry */
    float lo = sdCylY(q - vec3(0., -.3, 0.), .74, .2) - .07 + .007 * sin(ang * 20.);
    float hi = sdCylY(q - vec3(0., .12, 0.), .46, .17) - .07 + .006 * sin(ang * 16.);
    float ic = sdTorus(q - vec3(0., .3, 0.), .4, .045), ch = length(q - vec3(.04, .47, 0.)) - .14;
    return smin(smin(lo, hi, .06), smin(ic, ch, .04), .05); }
  if (id == 6) { vec3 q = p * 1.35, q1 = q - vec3(-.42, -.4, 0.), q2 = q - vec3(.34, -.42, .1), q3 = q - vec3(-.02, .2, .05);                                    /* kids: three toy blocks */
    q1.xz *= rot(.35); q2.xz *= rot(-.3); q3.xz *= rot(.8); q3.xy *= rot(.12);
    return min(min(sdRound(q1, vec3(.3), .06), sdRound(q2, vec3(.3), .06)), sdRound(q3, vec3(.3), .06)) / 1.35; }
  if (id == 8) { vec3 q = p.xzy; float body = sdCylY(q, .98, .22) - .05, hole = sdCylY(q, .52, .6), core = length(p) - .34; return smin(max(body, -hole), core, .1); }   /* founder: a warm clear crystal disc */
  if (id == 9) {                                                                                                                                                /* the AJ monogram as a rounded 3D slab; falls back to the orb until the logo texture is ready */
    if (uLogoOn < .5) return length(p) - .92;
    vec2 q = p.xy; float d2 = texture2D(uLogo, q / 2.5 + .5).r - .032 + length(max(abs(q) - 1.25, 0.));
    float h = .26, r = .11; vec2 w = vec2(d2 + r, abs(p.z) - h + r);
    return min(max(w.x, w.y), 0.) + length(max(w, 0.)) - r; }
  float d = sdTorus(p.xzy, 1.28, .07); return d;                                                                                                              /* contact: a ring */
}
float noise3(vec3 p){ return sin(p.x * 5. + uTime * .9) * sin(p.y * 5.3 - uTime * .7) * sin(p.z * 4.7 + uTime * .8); }
float map(vec3 p){
  p /= uSc * max(uApp, .001); p.yz *= rot(uRot.y); p.xz *= rot(uRot.x + sin(uTime * .35) * .38);
  float a = shape(int(uA + .5), p), d = a;
  if (uW > .001) { float b = shape(int(uB + .5), p); d = mix(a, b, uW) + .09 * sin(uW * 3.14159) * noise3(p * 1.4); }
  return d * .8 * uSc * max(uApp, .001);
}
vec3 nrm(vec3 p){ vec2 e = vec2(.0014, -.0014); return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)); }
/* a soft studio in the page's own colour: bright overhead, a cool strip, warm bounce */
vec3 env(vec3 r){
  float y = r.y * .5 + .5; vec3 c = mix(uBG * .55, uBG * 1.15 + vec3(.1), smoothstep(0., 1., y));
  c += vec3(1.5, 1.45, 1.35) * smoothstep(.84, .97, dot(r, normalize(vec3(-.5, .7, .55)))) * (1.2 + uTheme * 1.8);
  c += vec3(.62, .66, .92) * smoothstep(.7, .98, dot(r, normalize(vec3(.9, .1, .3)))) * (.8 + uTheme * 1.4);
  c += vec3(.9, .7, .5) * smoothstep(.8, .98, dot(r, normalize(vec3(.2, -.6, .6)))) * .35;
  return c;
}
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
float marchIn(vec3 ro, vec3 rd){ float t = .02; for (int i = 0; i < 48; i++) { if (float(i) > uInner) break; float d = -map(ro + rd * t); if (d < .002) break; t += max(d, .012); if (t > 3.5) break; } return t; }
vec3 objP(vec3 p){ p /= uSc * max(uApp, .001); p.yz *= rot(uRot.y); p.xz *= rot(uRot.x + sin(uTime * .35) * .38); return p; }
vec3 glass(vec3 p, vec3 rd, vec3 tint, vec3 ab, vec4 fe){
  vec3 n = nrm(p), q = objP(p);
  n = normalize(n + fe.x * .06 * vec3(sin(q.y * 58.) * cos(q.x * 58.), sin(q.x * 58.) * cos(q.y * 58.), 0.));              /* woven cloth */
  vec3 v = -rd, r = reflect(rd, n); float fr = pow(1. - max(dot(n, v), 0.), 3.5), F = .05 + .95 * fr;
  vec3 rin = refract(rd, n, 1. / 1.45); float tin = marchIn(p - n * .004, rin); vec3 po = p + rin * tin, no = -nrm(po);
  vec3 tr = vec3(0.); float ior[3]; ior[0] = 1.48 - fe.w * .25; ior[1] = 1.48; ior[2] = 1.48 + fe.w * .3;
  for (int k = 0; k < 3; k++) { vec3 ro2 = refract(rin, no, ior[k]); if (dot(ro2, ro2) < .01) ro2 = reflect(rin, no); vec3 e = env(ro2); if (k == 0) tr.r = e.r; else if (k == 1) tr.g = e.g; else tr.b = e.b; }
  vec3 absorb = exp(-tin * ab * .55);
  vec3 col = env(r) * tint * F * 1.25 + tr * absorb * (1. - F) * .9 * fe.z;
  vec3 alb = exp(-ab * .22) * tint; float lit = .28 + .6 * max(dot(n, normalize(vec3(-.5, .7, .55))), 0.);
  col += (1. - fe.z) * alb * lit * (1. - F) * 1.1;                                                                            /* the solid part of frosted or glazed materials */
  col += vec3(.16, .12, .07) * (1. - fr) * .7 * (1. - absorb) * fe.z;
  col += tint * vec3(.55, .4, .3) * pow(fr, 2.) * .3;
  col += vec3(.87, .74, .53) * pow(fr, 3.5) * .2;                                                                             /* the one accent colour: a thin aqua glint on the rim */
  vec3 f3 = abs(fract(q * 3.2) - .5); float ln = smoothstep(.455, .5, max(f3.x, max(f3.y, f3.z)));
  col += fe.y * ln * vec3(.87, .74, .53) * (.45 + .55 * sin(uTime * 1.6 + q.y * 5.)) * (1. - fr) * .55;                          /* circuit grid inside */
  return col;
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec2 uv = (vUv * 2. - 1.) * vec2(uAsp, 1.) * uTan;
  vec3 ro = vec3(-uOff.x * 2.4 * uTan * uAsp * 3.2, -uOff.y, 4.6), rd = normalize(vec3(uv, -1.));
  /* the page: a calm tone with blurred dark blobs drifting at the edges */
  vec2 q = vUv; vec3 bg = uBG; float bl = 0.;
  if (uTr < .5) {
  for (int i = 0; i < 5; i++) { float fi = float(i); vec2 c = vec2(.5 + .46 * sin(uTime * .05 + fi * 2.1) * (i % 2 == 0 ? 1. : -1.), .5 + .42 * cos(uTime * .04 + fi * 1.7)); vec2 d = (q - c) * vec2(uAsp, 1.); bl += exp(-dot(d, d) * (9. + fi * 3.)) * (.55 - fi * .06); }
  float vig = (1. - smoothstep(.0, .75, length((q - .5) * vec2(uAsp, 1.)))) * .05;
  vec3 bgL = bg * (1. - bl * .22 * (1. - uDark * .5)) + vig, bgD = bg + bl * .075 * vec3(.85, .72, .5) + vig * .6;
  float xx = q.x * uAsp;
  for (int k = 0; k < 3; k++) { float fk = float(k); float yk = .13 + .1 * fk + .05 * sin(xx * (1.5 + .5 * fk) + uTime * .035 + fk * 2.) + .03 * sin(xx * (3.7 + fk) + fk * 5. - uTime * .02); float m = 1. - smoothstep(yk - .14, yk + .1, q.y);
    bgL = mix(bgL, bgL * (.9 - .03 * fk) + vec3(.02) * fk, m * .6); bgD = mix(bgD, bgD + vec3(.04, .038, .045) * (1. + fk * .5), m * .5); }
  bg = mix(bgL, bgD, uTheme);
  }
  float t = 0.; bool hit = false; vec3 p = ro; float mind = 9.; vec3 pm = ro;
  float bR = 1.62 * uSc * max(uApp, .001), bb = dot(ro, rd), disc = bb * bb - (dot(ro, ro) - bR * bR);                 /* a bounding sphere: pixels that miss it cost almost nothing */
  if (disc > 0.) { float sq = sqrt(disc), tmax = -bb + sq + .1; t = max(0., -bb - sq);
    for (int i = 0; i < 90; i++) { if (float(i) > uSteps) break; p = ro + rd * t; float d = map(p); if (d < mind) { mind = d; pm = p; } if (d < .0016) { hit = true; break; } t += d; if (t > tmax) break; } }
  /* phones draw only the orb on a transparent canvas: a ray that just misses the edge still shades, with partial coverage, so the outline is smooth */
  float a = hit ? 1. : 0.; bool near = !hit && uTr > .5 && mind < uPx * 1.6;
  if (near) { p = pm; a = 1. - smoothstep(0., uPx * 1.6, mind); }
  vec3 col = bg;                                                                          /* the page tone is already in display colour */
  if (hit || near) { col = glass(p, rd, mix(uTA, uTB, uW), mix(uAbsA, uAbsB, uW), mix(uFeA, uFeB, uW)); col = aces(col * 1.05); col = pow(col, vec3(.4545)); col = mix(bg, col, uTr > .5 ? 1. : uFade); a *= uFade; }
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.) - .5) * .02;                          /* film grain */
  gl_FragColor = uTr > .5 ? vec4(col * a, a) : vec4(col, 1.);
}`;
const scene = new THREE.Scene(), cam = new THREE.Camera();
scene.add(Object.assign(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: frag, depthTest: false, depthWrite: false })), { frustumCulled: false }));
renderer.setClearColor(0x9fb0ba); renderer.compile(scene, cam);   /* build the shader before the first frame so the opening isn't a stutter */

/* group each chapter's text and button in a panel (a glass sheet on phones, invisible on laptops) */
stopEls.forEach(el => { const items = [...el.querySelectorAll(':scope > .lead, :scope > .line, :scope > .enter')]; if (!items.length) return; const b = document.createElement('div'); b.className = 'body'; items[0].before(b); items.forEach(x => b.append(x)); });
/* ---------- chrome ---------- */
const dotsEl = document.getElementById('dots'); dotsEl.innerHTML = stopEls.map(el => `<button type="button" aria-label="${(el.querySelector('h1,h2,.lead') || el).textContent.replace(/\s+/g, ' ').trim()}"></button>`).join('');
const dotBtns = [...dotsEl.children]; dotBtns[0].setAttribute('aria-current', 'step'); const vh = () => innerHeight, fade = document.getElementById('fade'), formEl = document.getElementById('form'), cue = document.getElementById('cue'), top = document.getElementById('top'), mark = document.getElementById('mark');
stopEls.forEach(el => { if (el.dataset.c) el.style.setProperty('--c', el.dataset.c); }); stopEls.forEach((el, k) => { const t = el.querySelector('.tag'); if (t) t.dataset.ix = k - 1; });
/* phone only: fill the card with a short list (what each business does, or an index of all six) */
stopEls.forEach((el, k) => { el.dataset.num = String(k + 1).padStart(2, '0') + ' / ' + String(NS).padStart(2, '0'); const bd = el.querySelector('.body'); if (!bd) return; let ul;
  if (k === 0) { ul = document.createElement('ul'); ul.className = 'svc idx'; ['Alven Studio', 'House of Fovo', 'Clothing', 'AJ Softwares', 'Bun Bun Bakes', 'AJ Little Wonder World'].forEach((n, i) => { const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<b>0' + (i + 1) + '</b>' + n; b.addEventListener('click', () => go(i + 2)); li.append(b); ul.append(li); }); }
  else { const src = document.querySelector('.card[data-i="' + k + '"] ul'); if (!src) return; ul = document.createElement('ul'); ul.className = 'svc'; ul.innerHTML = src.innerHTML; }
  el.insertBefore(ul, bd); });
let sNow = 0, swF = 0, swDrag = false;
/* chapter jumps: a row of tall glass blades rises from the centre outward in the destination's colour, the page changes behind them, then they lift away */
const NB = 11; fade.innerHTML = Array.from({ length: NB }, () => '<i></i>').join('') + '<div class="tcard"><small></small><b></b></div>'; const blades = [...fade.querySelectorAll('i')], tcard = fade.querySelector('.tcard'), tsm = tcard.querySelector('small'), tb = tcard.querySelector('b'); let jumping = false;
const TITLES = stopEls.map(el => (el.querySelector('.tag') ? el.querySelector('.tag').textContent : (el.querySelector('h1,h2,.lead') || el).textContent).replace(/\s+/g, ' ').trim());
const go = i => { if (i === Math.round(sNow) || jumping) return; if (RM) { scrollTo(0, i * vh()); sNow = i; swF = i; return; } jumping = true;
  const col = stopEls[i].dataset.c || '#debd87', mid = (NB - 1) / 2, fwd = i > sNow, sk = fwd ? -9 : 9; fade.classList.add('on'); tsm.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(NS).padStart(2, '0'); tb.textContent = i === 0 ? 'AJ Groups' : TITLES[i];
  blades.forEach((b, k) => { const t = k / (NB - 1); b.style.background = `linear-gradient(${180 + (fwd ? -8 : 8)}deg, color-mix(in srgb, ${col} 82%, #fff) 0%, ${col} 38%, color-mix(in srgb, ${col} 48%, #2d3041) 100%)`; b.style.setProperty('--sh', (t * 100).toFixed(0) + '%'); });
  const ord = k => fwd ? k : NB - 1 - k;
  const up = blades.map((b, k) => b.animate([{ transform: `skewX(${sk}deg) scaleY(0)`, transformOrigin: '50% 100%' }, { transform: `skewX(0deg) scaleY(1)`, transformOrigin: '50% 100%' }], { duration: 240, delay: ord(k) * 11 + Math.abs(k - mid) * 5, easing: 'cubic-bezier(.76,0,.18,1)', fill: 'forwards' }));
  const ci = tcard.animate([{ opacity: 0, transform: 'translateY(26px) scale(.96)', filter: 'blur(8px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 220, delay: 140, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
  Promise.all(up.map(a => a.finished).concat(ci.finished)).then(() => { scrollTo(0, i * vh()); sNow = i; swF = i;
    const co = tcard.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'translateY(-30px) scale(1.04)', filter: 'blur(8px)' }], { duration: 190, delay: 80, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'forwards' });
    const dn = blades.map((b, k) => b.animate([{ transform: 'skewX(0deg) scaleY(1)', transformOrigin: '50% 0%' }, { transform: `skewX(${-sk}deg) scaleY(0)`, transformOrigin: '50% 0%' }], { duration: 280, delay: 100 + ord(k) * 10, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'forwards' }));
    Promise.all(dn.map(a => a.finished).concat(co.finished)).then(() => { fade.classList.remove('on'); blades.concat(tcard).forEach(b => b.getAnimations().forEach(a => a.cancel())); jumping = false; }); }); };
dotBtns.forEach((b, i) => b.addEventListener('click', () => go(i)));
const menuEl = document.getElementById('menu'), menuBtn = document.getElementById('menubtn');
const setMenu = on => { menuEl.classList.toggle('on', on); menuBtn.setAttribute('aria-expanded', on ? 'true' : 'false'); menuBtn.firstChild.textContent = on ? 'Close' : 'Menu'; };
menuBtn.addEventListener('click', () => setMenu(!menuEl.classList.contains('on')));
document.querySelectorAll('.pillnav a,.gbtn,.stop .enter[data-go],.stop[data-i="0"] [data-go],.vgrid [data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); a.blur(); go(+a.dataset.go); }));
menuEl.querySelectorAll('a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); setMenu(false); go(+a.dataset.go); }));

function fit() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); U.uAsp.value = w / h; }
const LY = { stack: false, short: false, zone: [70, 400], zone8: [70, 400] };
function fitLists() { stopEls.forEach(el => { const sv = el.querySelector('.svc'); if (!sv) return; sv.classList.remove('off'); if (!LY.stack) return; const bd = el.querySelector('.body'), top0 = (el.querySelector('h1,h2') || el.querySelector('.tag') || el).getBoundingClientRect(), svr = sv.getBoundingClientRect(), bdr = bd.getBoundingClientRect(); if (svr.top < (el.querySelector('h1,h2') ? top0.bottom + 150 : top0.top + 70) || svr.bottom > bdr.top) sv.classList.add('off'); }); }
function layout() {
  const W = innerWidth, H = innerHeight, hb = Math.max(top.offsetHeight, 52);
  LY.stack = W / H < 1 || (W <= 760 && H >= 560); LY.short = !LY.stack && H < 570; root.classList.toggle('stack', LY.stack); root.classList.toggle('short', LY.short);
  if (LY.stack) { const tb = top.getBoundingClientRect().bottom; LY.hb = tb; root.style.setProperty('--hb', tb + 'px'); const cr = stopEls[1].getBoundingClientRect();
    if (root.classList.contains('sheet')) { const cc = (cr.top + cr.bottom) / 2, R = Math.min(W * .58, (cr.bottom - cr.top) * .38); LY.zone = [cc - R, cc + R]; }
    else { let ha = 0, bb = Infinity; for (let k = 1; k < LAST; k++) { if (k === IV || k === 2 || k === 3) continue; const h = stopEls[k].querySelector('h2'), b = stopEls[k].querySelector('.body'); if (h) ha = Math.max(ha, h.getBoundingClientRect().bottom); if (b) bb = Math.min(bb, b.getBoundingClientRect().top); }
      const a0 = ha + 8, b0 = bb - 8, mid = (a0 + b0) / 2, R = Math.min(W * .5, Math.max(80, (b0 - a0) / 2)); LY.zone = [mid - R, mid + R]; }
    const h8 = stopEls[LAST].querySelector('h2').getBoundingClientRect().bottom; LY.zone8 = [h8 + 10, cr.bottom - 14];
    fitLists(); const z = LY.zone8, zh = Math.max(226, Math.min(340, z[1] - z[0])); formEl.style.setProperty('--zh', zh + 'px'); formEl.style.setProperty('--zy', Math.max(z[0] + zh / 2, (z[0] + z[1]) / 2) + 'px'); }
}
fit(); addEventListener('resize', () => { fit(); layout(); });
const ptr = { x: 0, y: 0, tx: 0, ty: 0 }; addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; ptr.tx = e.clientX / innerWidth * 2 - 1; ptr.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
let loadDone = true, app = (!isNaN(PIN) || RM) ? 1 : 0;   /* no loading page: the orb simply grows into place when the page opens */
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], c255 = c => `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
/* theme toggle */
const tbtn = document.getElementById('theme');
SYS.addEventListener && SYS.addEventListener('change', e => { if (CHOSEN) return; THEME = e.matches ? 1 : 0; root.dataset.theme = THEME ? 'dark' : 'light'; tbtn.setAttribute('aria-pressed', THEME ? 'true' : 'false'); });
tbtn.addEventListener('click', () => { CHOSEN = true; THEME = THEME ? 0 : 1; root.dataset.theme = THEME ? 'dark' : 'light'; try { localStorage.setItem('ajtheme', THEME ? 'dark' : 'light'); } catch (e) {} tbtn.setAttribute('aria-pressed', THEME ? 'true' : 'false'); });
tbtn.setAttribute('aria-pressed', THEME ? 'true' : 'false');
/* headlines reveal word by word out of a mask */
document.querySelectorAll('h1,h2,.stop[data-i="0"] .lead').forEach(hd => { let k = 0; const walk = n => { [...n.childNodes].forEach(c => { if (c.nodeType === 3) { const frag = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(t => { if (!t.trim()) { frag.append(t); return; } const w = document.createElement('span'); w.className = 'w'; const i = document.createElement('span'); i.textContent = t; i.style.setProperty('--k', k++); w.append(i); frag.append(w); }); c.replaceWith(frag); } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c); }); }; walk(hd); });
/* a soft cursor ring on laptops */
const ring = document.getElementById('cursor'), fine = matchMedia('(hover: hover) and (pointer: fine)').matches; let cx = -50, cy = -50, rx = -50, ry = -50, big = 0;
if (fine) addEventListener('pointermove', e => { cx = e.clientX; cy = e.clientY; big = e.target.closest('a,button,input,textarea') ? 1 : 0; }, { passive: true }); else ring.remove();
const legalEl = document.getElementById('legal'), countEl = document.getElementById('count'), countN = document.getElementById('countN'), countBar = document.getElementById('countBar'), cards = [...document.querySelectorAll('.card')];
const orbit = document.getElementById('orbit'), oc1 = orbit.querySelector('.c1'), oc2 = orbit.querySelector('.c2'), od = orbit.querySelector('.dot');
/* write a style or custom property only when its value changed: rewriting the same :root variables every frame restyles the whole page */
const _sc = new Map(), setV = (el, k, v) => { let m = _sc.get(el); if (!m) _sc.set(el, m = {}); if (m[k] === v) return; m[k] = v; if (k[0] === '-') el.style.setProperty(k, v); else el.style[k] = v; };
const setA = (el, k, v) => { const s = String(v); if (el['_a' + k] !== s) { el['_a' + k] = s; el.setAttribute(k, s); } }, setT = (el, v) => { if (el._t !== v) { el._t = v; el.textContent = v; } };
let _bgc = '';
const clock = new THREE.Clock(); let frames = 0, fontsOk = false, ready = (!isNaN(PIN) || RM); if (ready) root.classList.add('ready');
/* the opening waits for the first drawn frames and the fonts, so nothing starts while the page is still busy and then jumps */
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { fontsOk = true; }); setTimeout(() => { fontsOk = true; }, 1800);
let first = true, curIdx = -1, fa = 0, fn = 0, svPrev = 0, svS = 0, dragS = 0, dragT = 0; const PRMAX = PR, PFLOOR = Math.max(.75, PR * .6), FIXED = q.has('fixedres');
function frame() {
  const dt = Math.min(clock.getDelta(), .05), T = !isNaN(TFIX) ? TFIX : (RM ? 0 : clock.elapsedTime);
  if (!FIXED && !first && clock.elapsedTime > 3 && dt < .05) { fa += dt; fn++; if (fn >= 40) { const av = fa / fn; if (av > .024 && PR > PFLOOR) { PR = Math.max(PFLOOR, PR * .85); renderer.setPixelRatio(PR); fit(); } else if (av < .0185 && PR < PRMAX) { PR = Math.min(PRMAX, PR * 1.1); renderer.setPixelRatio(PR); fit(); } fa = 0; fn = 0; } }
  frames++; if (!ready && frames > 3 && fontsOk) { ready = true; root.classList.add('ready'); }
  if (ready && app < 1) app = Math.min(1, app + dt * .4);
  const target = !isNaN(PIN) ? clamp(PIN, 0, NS - 1) : LY.stack ? clamp(swF, 0, NS - 1) : clamp(scrollY / vh(), 0, NS - 1);
  sNow = first ? target : sNow + (target - sNow) * Math.min(1, dt * (LY.stack ? (swDrag ? 32 : 12) : 5.5));
  const i0 = Math.min(NS - 2, Math.floor(clamp(sNow, 0, NS - 1))), f = clamp(sNow - i0, 0, 1), w = sstep(.15, .85, f), A = CH[sNow >= NS - 1 ? NS - 1 : i0], B = CH[sNow >= NS - 1 ? NS - 1 : i0 + 1], ww = sNow >= NS - 1 ? 0 : w;
  U.uA.value = A.s; U.uB.value = B.s; U.uW.value = A.s === B.s ? 0 : ww;
  themeNow += (THEME - themeNow) * Math.min(1, dt * 3.2); const iA = sNow >= NS - 1 ? NS - 1 : i0, iB = sNow >= NS - 1 ? NS - 1 : i0 + 1;
  const bg = mix3(mix3(A.bg, B.bg, ww), mix3(DARK[iA], DARK[iB], ww), themeNow); U.uBG.value.set(...bg); const gl = (c, k) => c[k + 'D'] ? mix3(c[k], c[k + 'D'], themeNow) : c[k]; U.uTA.value.set(...gl(A, 'tint')); U.uTB.value.set(...gl(B, 'tint')); const kLogo = c => c.s === 9 ? (c.absD ? lerp(3.3, 1.4, themeNow) : 3.3) : 1; U.uAbsA.value.set(...gl(A, 'abs').map(v => v * kLogo(A))); U.uAbsB.value.set(...gl(B, 'abs').map(v => v * kLogo(B))); U.uFeA.value.set(...A.fe); U.uFeB.value.set(...B.fe); U.uTheme.value = themeNow; U.uDark.value = 1 - lerp(A.w, B.w, ww);
  const asp = innerWidth / innerHeight, st = LY.stack;
  if (st) { const z = sNow > LAST - .5 ? LY.zone8 : LY.zone, zc = (z[0] + z[1]) / 2, zr = Math.min((z[1] - z[0]) / 2 * .96, innerWidth * .56), ext = lerp(A.ext, B.ext, ww); const tOy = (1 - 2 * zc / innerHeight) * 4.6 * .32492, tSc = zr / ext / (.615 * innerHeight / 2), kk = first ? 1 : Math.min(1, dt * 9);   /* the orb eases to its place, so a late font or layout change never makes it jump */
    U.uOff.value.set(0, lerp(U.uOff.value.y, tOy, kk)); U.uSc.value = lerp(U.uSc.value, tSc, kk); LY.rpx = 1.22 * ext * U.uSc.value * (.615 * innerHeight / 2); LY.zc = innerHeight * (1 - U.uOff.value.y / (4.6 * .32492)) / 2; }
  else { const oxx = lerp(A.ox, B.ox, ww) * .8, ex = lerp(A.ext, B.ext, ww), cxp = (.5 + .5 * 1.67 * oxx) * innerWidth; U.uOff.value.set(oxx, 0); U.uSc.value = Math.min(lerp(A.sc, B.sc, ww) * (asp < 1.3 ? clamp(asp / 1.3 + .25) : 1), (innerWidth - 10 - cxp) / (.615 * innerHeight / 2 * ex)); }
  /* the orb starts at 80% size and fades in, never as a speck: a tiny orb can't be drawn crisply and looks like a blur until it grows */
  U.uApp.value = lerp(.8, 1, sstep(0, 1, sstep(0, 1, app))); U.uFade.value = sstep(0, 1, sstep(.04, .8, app)); U.uTime.value = T;
  dragS += (dragT - dragS) * Math.min(1, dt * 14);
  { const sv = (target - svPrev) / Math.max(dt, .001); svPrev = target; svS += (clamp(sv * .09, -1, 1) - svS) * Math.min(1, dt * 6); }
  ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 3); ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 3); U.uRot.value.set(ptr.x * .5, ptr.y * .3 + (RM ? 0 : svS * .6));
  /* page tone and type colour: every value is blended, so changing chapter or theme is a cross-fade, never a jump */
  const white = lerp(lerp(A.w, B.w, ww), 1, themeNow), c3 = (a, b, t) => `${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))}`, NAVY = [45, 48, 65], WH = [244, 241, 234], GOLD = [222, 189, 135], BRONZE = [143, 108, 48], TAUPE = [166, 162, 154];
  setV(root, '--ink', `rgb(${c3(NAVY, WH, white)})`); setV(root, '--mute', `rgba(${c3(NAVY, TAUPE, white)},${lerp(.72, 1, white).toFixed(2)})`); setV(root, '--em', `rgb(${c3(GOLD, BRONZE, white)})`);
setV(root, '--line', `rgba(${c3(GOLD, BRONZE, white)},${lerp(.34, .38, white).toFixed(2)})`); setV(root, '--lw', white.toFixed(3));
  setV(root, '--btn', `rgb(${c3(NAVY, GOLD, white)})`); setV(root, '--btnink', `rgb(${c3(GOLD, NAVY, white)})`); setV(root, '--sheet', c255(bg.map(v => v * (.72 - themeNow * .3))));
  const bgc = c255(bg); setV(document.body, 'background', bgc); if (bgc !== _bgc) { _bgc = bgc; renderer.setClearColor(new THREE.Color(...bg)); }
  setV(mark, '--ms', sNow < .2 ? '40px' : '24px'); setV(mark, '--msm', sNow < .2 ? '28px' : '20px');
  const near = Math.round(clamp(sNow, 0, NS - 1)), d = Math.abs(sNow - near), op = (1 - sstep(.08, .34, d)) * sstep(.55, 1, app);
  stopEls.forEach((el, k) => { const on = k === near; setV(el, '--o', on ? op.toFixed(3) : '0'); el.classList.toggle('cur', on && op > .4); });
  { const st2 = LY.stack; stopEls.forEach((el, k) => { el.classList.toggle('past', k < near); el.classList.toggle('next', k > near);
      const off = k - sNow, a = Math.abs(off);
      if (st2) {
        if (!RM && a < 1.02) { const out = off < 0; el.classList.add('peek');
          /* cards ahead slide over from the right; cards behind stay solid and recede, so swiping back is the same motion in reverse */
          setV(el, 'translate', `${(out ? off * 30 : off * 104).toFixed(1)}% 0`); setV(el, 'scale', out ? (1 - .06 * a).toFixed(3) : '1'); setV(el, 'rotate', `${(off * (out ? 2 : 1.2)).toFixed(2)}deg`);
          setV(el, 'opacity', out ? (1 - Math.min(1, Math.max(0, (a - .62) / .38))).toFixed(3) : '1'); setV(el, 'zIndex', out ? '4' : '5'); setV(el, 'filter', ''); }
        else { el.classList.remove('peek'); setV(el, 'translate', ''); setV(el, 'scale', ''); setV(el, 'rotate', ''); setV(el, 'opacity', ''); setV(el, 'zIndex', ''); setV(el, 'filter', ''); }
        return; }
      el.classList.remove('peek'); el.style.scale = ''; el.style.opacity = ''; el.style.zIndex = '';
      if (k === near && !RM) { el.style.translate = `0 ${(-(sNow - near) * 150).toFixed(1)}px`; el.style.filter = d > .02 ? `blur(${(d * 18).toFixed(1)}px)` : 'none'; } else { el.style.translate = ''; el.style.rotate = ''; el.style.filter = ''; } }); }
  if (near !== curIdx) { updateNav(near); if (curIdx >= 0 && LY.stack && navigator.vibrate) { try { navigator.vibrate(9); } catch (e) {} } curIdx = near; dotBtns.forEach((b, k) => k === near ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')); }
  setV(top, 'opacity', sstep(0, 1, sstep(.34, .92, app)).toFixed(3)); setT(cue, LY.stack ? 'Swipe to explore  →' : '↓ Scroll down'); setV(cue, 'opacity', sNow < .1 ? '1' : '0'); setV(countEl, 'opacity', sNow > .3 ? '1' : '0'); setT(countN, String(Math.round(sNow) + 1).padStart(2, '0')); setV(countBar, 'transform', `scaleY(${clamp(sNow / (NS - 1)).toFixed(3)})`); { const fo = LAST - sNow, ph = LY.stack && !RM && fo > 0 && fo < 1.02;
    { const _on = sNow > (LY.stack ? LAST - .98 : LAST - .45); formEl.classList.toggle('on', _on); if (legalEl) legalEl.classList.toggle('on', _on); }
    if (LY.stack) { setV(formEl, '--fx', (ph ? fo * 1.04 * (innerWidth - 24) : 0).toFixed(1) + 'px'); setV(formEl, '--fr', (ph ? fo * 1.2 : 0).toFixed(2) + 'deg'); dotBtns.forEach((b, k) => setV(b, '--a', clamp(1 - Math.abs(sNow - k), 0, 1).toFixed(3))); } }
  if (fine) { rx += (cx - rx) * Math.min(1, dt * 14); ry += (cy - ry) * Math.min(1, dt * 14); ring.style.transform = `translate(${rx}px,${ry}px) scale(${1 + big * 1.4})`; ring.style.opacity = loadDone ? .9 : 0; }
  { const W = innerWidth, H = innerHeight, tanv = .32492, ocx = (.5 + .5 * 1.67 * U.uOff.value.x) * W, ocy = (.5 - .5 * U.uOff.value.y / (4.6 * tanv)) * H, orad = .615 * U.uSc.value * (H / 2) * sstep(0, 1, app);
    setA(oc1, 'cx', ocx.toFixed(1)); setA(oc1, 'cy', ocy.toFixed(1)); setA(oc1, 'r', (orad * 1.45).toFixed(1)); setA(oc2, 'cx', ocx.toFixed(1)); setA(oc2, 'cy', ocy.toFixed(1)); setA(oc2, 'r', (orad * 2.25).toFixed(1));
    const ang = T * .22 + 1; setA(od, 'cx', (ocx + Math.cos(ang) * orad * 2.25).toFixed(1)); setA(od, 'cy', (ocy + Math.sin(ang) * orad * 2.25).toFixed(1)); setV(orbit, 'opacity', (sstep(.3, 1, app) * (LY.stack ? .5 : 1)).toFixed(3));
    let dd = 1; if (!LY.stack) cards.forEach(c => { if (!c.classList.contains('cur')) return; const r = c.getBoundingClientRect(), dx = Math.max(r.left - (ocx + Math.cos(ang) * orad * 2.25), 0, (ocx + Math.cos(ang) * orad * 2.25) - r.right), dy = Math.max(r.top - (ocy + Math.sin(ang) * orad * 2.25), 0, (ocy + Math.sin(ang) * orad * 2.25) - r.bottom); dd = Math.min(dd, Math.hypot(dx, dy) / 40); }); setV(od, 'opacity', clamp(dd).toFixed(2)); }
  cards.forEach(c => c.classList.toggle('cur', +c.dataset.i === near && op > .4));
  /* phones: transparent canvas, and only the box around the orb is shaded (so it can be drawn at full sharpness for the same cost); laptops draw the whole page */
  U.uTr.value = LY.stack ? 1 : 0; U.uPx.value = 2 * 4.6 * U.uTan.value / (innerHeight * renderer.getPixelRatio());
  renderer.setScissorTest(false); renderer.setClearAlpha(LY.stack ? 0 : 1); renderer.clear();
  if (LY.stack && LY.rpx) { const W = innerWidth, H = innerHeight, x0 = Math.max(0, W / 2 - LY.rpx), x1 = Math.min(W, W / 2 + LY.rpx), y0 = Math.max(0, LY.zc - LY.rpx), y1 = Math.min(H, LY.zc + LY.rpx); renderer.setScissorTest(true); renderer.setScissor(Math.floor(x0), Math.floor(H - y1), Math.ceil(x1 - x0), Math.ceil(y1 - y0)); }
  renderer.render(scene, cam); renderer.setScissorTest(false); first = false; requestAnimationFrame(frame);
}
/* swipe sideways between businesses on phones; the orb follows the finger and settles on release */
{ let sx = 0, sy = 0, base = 0, drag = false, lock = '', lx = 0, lt = 0, vx = 0;
  addEventListener('pointerdown', e => { if (!LY.stack || e.target.closest('input,textarea,.dots,#theme')) return; sx = lx = e.clientX; sy = e.clientY; lt = e.timeStamp; vx = 0; base = Math.round(swF); drag = true; lock = ''; }, { passive: true });
  addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (!lock && Math.hypot(dx, dy) > 8) lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; const dtm = e.timeStamp - lt; if (dtm > 0) { vx = vx * .6 + (e.clientX - lx) / dtm * .4; lx = e.clientX; lt = e.timeStamp; } if (lock === 'x') { swDrag = true; swF = clamp(base - dx / (innerWidth * .85), 0, NS - 1); dragT = clamp(dx * .22, -60, 60); } }, { passive: true });
  /* a quick flick commits even when it is short; a slow drag needs a third of the card */
  const end = e => { if (!drag) return; drag = false; swDrag = false; dragT = 0; if (lock === 'x') { const dx = e.clientX - sx, go1 = Math.abs(dx) > innerWidth * .22 || (Math.abs(vx) > .35 && Math.abs(dx) > 14); swF = clamp(go1 ? base + (dx < 0 ? 1 : -1) : base, 0, NS - 1); } };
  addEventListener('pointerup', end); addEventListener('pointercancel', () => { drag = false; swDrag = false; dragT = 0; swF = Math.round(swF); });
  addEventListener('keydown', e => { if (!LY.stack) return; if (e.key === 'ArrowRight') swF = clamp(Math.round(swF) + 1, 0, NS - 1); if (e.key === 'ArrowLeft') swF = clamp(Math.round(swF) - 1, 0, NS - 1); }); }
if (q.get('sw')) swF = +q.get('sw');
layout(); (document.fonts && document.fonts.ready || Promise.resolve()).then(layout); setTimeout(layout, 400);
requestAnimationFrame(frame);

/* ?audit: shows each chapter in turn, measures every block and reports overlaps and anything off screen. */
if (q.has('audit')) setTimeout(() => {
  const W = innerWidth, H = innerHeight, phone = LY.stack, asp = W / H, R = el => el.getBoundingClientRect(), inter = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1, out = [];
  const pill = R(document.querySelector('.pillnav')), mk = R(mark), rt = R(document.querySelector('.top .right')), hb = Math.max(R(top).bottom, 0);
  if (!phone && pill.width) { if (mk.right > pill.left - 6) out.push('mark/nav touch'); if (pill.right > rt.left - 6) out.push('nav/right touch'); }
  if (document.documentElement.scrollWidth > W + 1) out.push('horizontal scroll ' + document.documentElement.scrollWidth);
  stopEls.forEach((el, k) => {
    stopEls.forEach((o, j) => o.classList.toggle('cur', j === k)); cards.forEach(c => c.classList.toggle('cur', +c.dataset.i === k)); { const _on = k === LAST; formEl.classList.toggle('on', _on); if (legalEl) legalEl.classList.toggle('on', _on); }
    const c = CH[k], z = k === LAST ? LY.zone8 : LY.zone, uSc = phone ? Math.min((z[1] - z[0]) / 2 * .96, W * .56) / c.ext / (.615 * H / 2) : Math.min(c.sc * (asp < 1.3 ? clamp(asp / 1.3 + .25) : 1), (W - 10 - (.5 + .5 * 1.67 * c.ox * .8) * W) / (.615 * H / 2 * c.ext)), ox = phone ? 0 : c.ox * .8, oy = phone ? (1 - (z[0] + z[1]) / H) * 4.6 * .32492 : 0;
    const cx = (.5 + .5 * 1.67 * ox) * W, cy = (.5 - .5 * oy / (4.6 * .32492)) * H, r = .615 * uSc * (H / 2) * c.ext, O = { left: cx - r, right: cx + r, top: cy - r, bottom: cy + r };
    if (phone) { const h2 = el.querySelector('h1,h2'), bd = el.querySelector('.body'), H2 = h2 && R(h2), BD = bd && getComputedStyle(bd).display !== 'none' ? R(bd) : null, nt = [];
      if (H2) { const sp = [...h2.querySelectorAll('.w')].map(R); if (sp.some(r => r.right > W - 6 || r.left < 6)) nt.push('headline off sides'); if (H2.top < hb) nt.push('headline under header'); if (BD && H2.bottom > BD.top + 2) nt.push('headline over panel'); }
      if (BD && (BD.bottom > H - 60 || BD.left < 6 || BD.right > W - 6)) nt.push('panel off/under dots'); { const SR = R(el); if (H2 && BD && H2.bottom > BD.top - 8) nt.push('headline touches text'); if (SR.top < hb) nt.push('card under header'); }
      if (k === LAST) { const F = R(formEl); const hh = el.querySelector('h2'), SC = R(el); if (hh && F.top < hh.getBoundingClientRect().bottom - 2) nt.push('form over headline'); if (F.bottom > SC.bottom - 8) nt.push('form past card'); if (F.bottom > H - 56 || F.left < 4 || F.right > W - 4) nt.push('form off'); }
      if (O.top < hb - 6 || O.bottom > H - 40) nt.push(`orb cut off (${Math.round(O.left)},${Math.round(O.top)},${Math.round(O.right)},${Math.round(O.bottom)})`);
      if (nt.length) out.push(k + ': ' + nt.join('; ')); return; }
    const S = R(el), cd = cards.find(x => +x.dataset.i === k), C = cd && getComputedStyle(cd).display !== 'none' ? R(cd) : null, ct = R(document.getElementById('count')), F = k === LAST ? R(formEl) : null, notes = [];
    if (S.left < 0 || S.right > W) notes.push('text off sides'); if (S.top < hb + 6 && !phone) notes.push('text under header'); if (S.bottom > H + (phone ? 1 : -6)) notes.push('text below fold');
    if (C && inter(S, C)) notes.push('text/card overlap'); if (C && (C.left < 0 || C.right > W || C.bottom > H || C.top < 0)) notes.push('card off screen');
    if (!phone && inter(S, ct) && k > 0) notes.push('text/counter overlap'); if (C && !phone && inter(C, ct)) notes.push('card/counter overlap');
    if (O.left < -2 || O.right > W + 2 || O.top < -2 || O.bottom > H + 2) notes.push(`orb cut off (${Math.round(O.left)},${Math.round(O.top)},${Math.round(O.right)},${Math.round(O.bottom)})`);
    if (phone && k > 0 && O.bottom > S.top + 40) notes.push('orb hidden by text sheet by ' + Math.round(O.bottom - S.top));
    if (!phone && k > 1 && k < LAST - 2 && S.right > O.left + r * .6) notes.push('text over orb by ' + Math.round(S.right - O.left));
    if (F && inter(S, F)) notes.push('text/form overlap'); if (F && (F.left < 0 || F.right > W || F.top < hb || F.bottom > H)) notes.push('form off screen');
    if (notes.length) out.push(k + ': ' + notes.join('; '));
  });
  document.title = 'AUDIT ' + W + 'x' + H + ' => ' + (out.length ? out.join(' | ') : 'clean');
}, 1800);

/* ---------- motion layer: magnetic buttons, circular page wipe, and a settle that lands each scroll on a chapter ---------- */
if (!RM) {
  const mag = [...document.querySelectorAll('.enter,.gbtn,.menubtn,.sidetab')];
  mag.forEach(b => { b.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; const r = b.getBoundingClientRect(); b.style.translate = `${((e.clientX - r.left - r.width / 2) * .28).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .38).toFixed(1)}px`; });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; }); });
  document.querySelectorAll('.enter[href$="/"]:not([href^="#"])').forEach(a => a.addEventListener('click', e => { if (e.metaKey || e.ctrlKey || e.shiftKey || 'PageRevealEvent' in window) return; e.preventDefault();
    const w = document.createElement('div'), col = getComputedStyle(a.closest('.stop') || a).getPropertyValue('--c') || '#fff'; w.className = 'wipe'; w.style.background = col.trim() || '#fff'; document.body.append(w);
    w.animate([{ clipPath: `circle(0px at ${e.clientX}px ${e.clientY}px)` }, { clipPath: `circle(${Math.hypot(innerWidth, innerHeight) + 40}px at ${e.clientX}px ${e.clientY}px)` }], { duration: 720, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
    setTimeout(() => { location.href = a.href; }, 640); }));
  addEventListener('pageshow', e => { if (e.persisted) document.querySelectorAll('.wipe').forEach(w => w.remove()); });
  let idleT = 0, anim = 0, settled = 0; const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const cancel = () => { cancelAnimationFrame(anim); anim = 0; };
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, cancel, { passive: true }));
  addEventListener('scroll', () => { if (anim || LY.stack || menuEl.classList.contains('on')) return; clearTimeout(idleT); idleT = setTimeout(() => {
    const H = vh(), pos = scrollY / H, dl = pos - settled; let tgt = Math.abs(dl) > 1.25 ? Math.round(pos) : (Math.abs(dl) > .05 ? settled + Math.sign(dl) : settled); tgt = clamp(tgt, 0, NS - 1);
    const from = scrollY, to = tgt * H; settled = tgt; if (Math.abs(to - from) < 2) return; const t0 = performance.now(), dur = 700 + Math.min(500, Math.abs(to - from) / H * 160);
    const step = now => { const k = Math.min(1, (now - t0) / dur); scrollTo(0, from + (to - from) * ease(k)); if (k < 1) anim = requestAnimationFrame(step); else anim = 0; }; anim = requestAnimationFrame(step); }, 140); }, { passive: true });
}

/* pages that are not built yet say so instead of doing nothing */
{ const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); let tt = 0;
  document.querySelectorAll('.enter[href^="#"]:not([data-go])').forEach(a => a.addEventListener('click', e => { e.preventDefault(); t.textContent = 'This brand is coming soon. Please check back.'; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); })); }

/* contact form: checks, gentle error shake, a sending beat and a drawn tick (sent by e-mail) */
{ const f = document.getElementById('form'); f.addEventListener('submit', e => { e.preventDefault(); const n = f.elements.n, em = f.elements.e; let ok = true;
    [[n, !n.value.trim()], [em, !/^\S+@\S+\.\S+$/.test(em.value.trim())]].forEach(([el, bad]) => { const w = el.closest('.f'); w.classList.toggle('bad', bad); if (bad) { ok = false; w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); } });
    if (!ok) { (n.value.trim() ? em : n).focus(); return; } f.classList.add('sending'); const data = { name: n.value.trim(), email: em.value.trim(), topic: (f.elements.b && f.elements.b.value) || 'Not specified', message: (f.elements.m && f.elements.m.value.trim()) || '(no message)', _subject: 'AJ GROUPS website enquiry', _template: 'table', _captcha: 'false', _honey: f.elements._honey ? f.elements._honey.value : '' };
      const done = () => { f.classList.remove('sending'); f.classList.add('sent'); f.reset(); setTimeout(() => f.classList.remove('sent'), 7000); };
      const fail = () => { f.classList.remove('sending'); const t = document.querySelector('.toast'); if (t) { t.textContent = 'Sorry, that did not send. Please email ajgroups.official2026@gmail.com instead.'; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 6000); } };
      fetch('https://formsubmit.co/ajax/ajgroups.official2026@gmail.com', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()).then(d => (d.success === true || d.success === 'true') ? done() : fail()).catch(fail); }); }

/* contact form: a soft light follows the pointer across the glass */
{ const f = document.getElementById('form'); f.addEventListener('pointermove', e => { const r = f.getBoundingClientRect(); f.style.setProperty('--gx', (e.clientX - r.left) + 'px'); f.style.setProperty('--gy', (e.clientY - r.top) + 'px'); }); }

/* ---------- nav: always shows where you are (laptop pill, phone menu) ---------- */
const pillEl = document.querySelector('.pillnav'), pillLinks = pillEl ? [...pillEl.querySelectorAll('a')] : [], indEl = pillEl && pillEl.querySelector('.ind'), menuLinks = [...document.querySelectorAll('#menu a[data-go]')];
const navOf = (n) => (n <= 0 ? -1 : n <= 3 ? 0 : n === 4 ? 1 : n < LAST ? 2 : 3);
function placeInd(k) { if (!indEl) return; const a = pillLinks[k]; if (!a || !pillEl.offsetWidth) { indEl.style.opacity = 0; return; } indEl.style.opacity = 1; indEl.style.width = a.offsetWidth + 'px'; indEl.style.transform = `translateX(${a.offsetLeft}px)`; }
function updateNav(n) {
  const k = navOf(n); pillLinks.forEach((a, i) => { a.classList.toggle('on', i === k); if (i === k) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); placeInd(k);
  const exact = menuLinks.some((a) => +a.dataset.go === n);
  menuLinks.forEach((a) => { const on = +a.dataset.go === n || (!exact && ((+a.dataset.go === 1 && n >= 1 && n <= 3) || (+a.dataset.go === IV && n >= IV && n < LAST))); a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
}
addEventListener('resize', () => placeInd(navOf(Math.round(clamp(sNow, 0, NS - 1)))));
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => placeInd(navOf(Math.round(clamp(sNow, 0, NS - 1)))));
