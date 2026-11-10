/* Shared setup for the AJ GROUPS 3D hero prototypes.
   Gives each prototype: renderer + bloom, dark backdrop, drifting particle stream that bends
   around the cursor, the short "particles gather" intro, scroll progress, cursor/phone tilt,
   and hover/click picking for the six brand pieces. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* placeholder glow colours per brand, to be confirmed */
export const BRANDS = [
  { name: 'Alven Studio', line: 'Digital marketing', color: 0x2de2c8 },
  { name: 'House of Fovo', line: 'Photography', color: 0xdfe6ff },
  { name: 'Clothing (name TBC)', line: 'Clothing', color: 0xffa94d },
  { name: 'AJ Softwares', line: 'Software', color: 0x9b6bff },
  { name: 'Bun Bun Bakes', line: 'Bakery', color: 0xff6f91 },
  { name: 'AJ Little World', line: 'Kids', color: 0x4fb8ff },
];

export const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = t => t * t * (3 - 2 * t);
export const easeOut = t => 1 - Math.pow(1 - t, 3);
export function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function bgTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'), gr = g.createRadialGradient(256, 236, 0, 256, 256, 380);
  gr.addColorStop(0, '#25252a'); gr.addColorStop(.55, '#111114'); gr.addColorStop(1, '#050506');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const DOT_FRAG = `varying float vA; uniform float uAlpha;
void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(.93,.94,1., smoothstep(.5,.08,d) * vA * uAlpha); }`;

/* drifting stream of dust, like light catching particles; pushed aside by the cursor */
function makeStream(n) {
  const r = rng(11), pos = new Float32Array(n * 3), start = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const g = (r() + r() + r() - 1.5) * 1.6;
    pos.set([r() * 28 - 14, g, r() * 9.5 - 7], i * 3);
    const u = r() * 2 - 1, a = r() * 6.283, s = Math.sqrt(1 - u * u), d = 10 + r() * 6;
    start.set([Math.cos(a) * s * d, u * d, Math.sin(a) * s * d], i * 3); seed[i] = r();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector3(99, 99, 0) }, uPR: { value: 1 }, uIntro: { value: 0 }, uAlpha: { value: 1 } },
    vertexShader: `uniform float uTime, uPR, uIntro; uniform vec3 uMouse; attribute vec3 aStart; attribute float aSeed; varying float vA;
    void main(){
      vec3 p = position;
      p.x = mod(p.x + uTime * (.18 + aSeed * .3) + 14., 28.) - 14.;
      p.y += p.x * .2 + sin(uTime * .5 + aSeed * 6.283) * .12;
      vec2 d = p.xy - uMouse.xy; float L = length(d);
      p.xy += (d / max(L, .001)) * smoothstep(2.4, 0., L) * 1.1;
      p = mix(aStart, p, uIntro);
      vec4 mv = modelViewMatrix * vec4(p, 1.);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = (1. + aSeed * 2.2) * uPR * (7. / -mv.z);
      vA = (.2 + .8 * aSeed) * smoothstep(14., 9., abs(p.x));
    }`,
    fragmentShader: DOT_FRAG,
  });
  return new THREE.Points(geo, mat);
}

/* intro: particles fly in and gather into the object's place */
function makeGather(n, radius) {
  const r = rng(23), start = new Float32Array(n * 3), end = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let u = r() * 2 - 1, a = r() * 6.283, s = Math.sqrt(1 - u * u), d = 9 + r() * 7;
    start.set([Math.cos(a) * s * d, u * d, Math.sin(a) * s * d], i * 3);
    u = r() * 2 - 1; a = r() * 6.283; s = Math.sqrt(1 - u * u); d = radius * (.55 + .45 * r());
    end.set([Math.cos(a) * s * d, u * d * 1.3, Math.sin(a) * s * d], i * 3); seed[i] = r();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(end, 3));
  geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uP: { value: 0 }, uPR: { value: 1 }, uAlpha: { value: 1 } },
    vertexShader: `uniform float uP, uPR; attribute vec3 aStart; attribute float aSeed; varying float vA;
    void main(){
      vec3 p = mix(aStart, position, uP);
      float a = (1. - uP) * 2.6 * (.5 + aSeed); float c = cos(a), s = sin(a);
      p.xz = mat2(c, -s, s, c) * p.xz;
      vec4 mv = modelViewMatrix * vec4(p, 1.);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = (1.4 + aSeed * 2.4) * uPR * (7. / -mv.z);
      vA = .35 + .65 * aSeed;
    }`,
    fragmentShader: DOT_FRAG,
  });
  return new THREE.Points(geo, mat);
}

/* ?at=0.5 pins the scroll story at that point (for screenshots and reviews) */
const AT = (() => { const v = new URLSearchParams(location.search).get('at'); return v == null ? null : clamp(+v); })();

export function setup(opts = {}) {
  const camZ = opts.camZ ?? 9, look = opts.look ?? new THREE.Vector3();
  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !MOBILE, powerPreference: 'high-performance' });
  const PR = Math.min(devicePixelRatio, MOBILE ? 1.5 : 2);
  renderer.setPixelRatio(PR);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = opts.exposure ?? 1;
  const scene = new THREE.Scene(); scene.background = bgTexture();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 200);
  const composer = new EffectComposer(renderer);
  if (MOBILE) composer.setPixelRatio(1);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), opts.bloom ?? .85, .55, opts.threshold ?? .2);
  composer.addPass(bloom); composer.addPass(new OutputPass());

  const stream = makeStream(MOBILE ? 1100 : 2800); scene.add(stream);
  const gather = makeGather(MOBILE ? 700 : 1600, opts.introRadius ?? 1.6); gather.position.copy(opts.introCenter ?? new THREE.Vector3()); scene.add(gather);
  stream.material.uniforms.uPR.value = gather.material.uniforms.uPR.value = PR;

  const app = { scene, camera, renderer, bloom, portrait: false, hovered: null };
  window.__app = app;
  const st = { t: 0, s: 0, intro: RM ? 1 : 0, px: 0, py: 0, time: 0, mouse: new THREE.Vector3(99, 99, 0) };
  app.state = st;

  function resize() {
    const w = innerWidth, h = innerHeight, a = w / h;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = a; app.portrait = a < .9;
    camera.position.set(look.x, look.y, look.z + camZ * Math.max(1, Math.pow(1.25 / a, .8)));
    camera.lookAt(look); camera.updateProjectionMatrix();
    app.onResize && app.onResize();
  }
  addEventListener('resize', resize); resize();

  /* cursor, or phone tilt */
  const ptr = { x: 0, y: 0, has: false, cx: 0, cy: 0 };
  addEventListener('pointermove', e => { if (e.pointerType === 'touch') return;
    ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = -(e.clientY / innerHeight * 2 - 1); ptr.cx = e.clientX; ptr.cy = e.clientY; ptr.has = true; });
  addEventListener('deviceorientation', e => { if (e.gamma == null) return; ptr.x = clamp(e.gamma / 30, -1, 1); ptr.y = clamp((45 - e.beta) / 30, -1, 1); });
  const askTilt = () => { const D = window.DeviceOrientationEvent; if (D && D.requestPermission) D.requestPermission().catch(() => {}); };
  addEventListener('touchend', askTilt, { once: true });

  /* picking */
  const ray = new THREE.Raycaster(), tip = document.getElementById('tip'), toast = document.getElementById('toast');
  let pickables = [], pickOn = () => false, toastT = 0;
  app.setPickables = (arr, enabled) => { pickables = arr; pickOn = enabled; };
  function pickAt(nx, ny) { ray.setFromCamera({ x: nx, y: ny }, camera); const h = ray.intersectObjects(pickables, false)[0]; return h ? h.object : null; }
  function setHover(o, cx, cy) {
    if (o !== app.hovered) {
      app.hovered = o; document.body.style.cursor = o ? 'pointer' : '';
      if (o) { const b = o.userData.brand; tip.innerHTML = `<b><i style="background:#${b.color.toString(16).padStart(6, '0')}"></i>${b.name}</b><span>${b.line}</span>`; }
      tip.classList.toggle('on', !!o);
    }
    if (o) tip.style.left = cx + 'px', tip.style.top = cy + 'px';
  }
  addEventListener('click', e => {
    const nx = e.clientX / innerWidth * 2 - 1, ny = -(e.clientY / innerHeight * 2 - 1);
    const o = pickOn() ? pickAt(nx, ny) : null; if (!o) return;
    setHover(o, e.clientX, e.clientY);
    const b = o.userData.brand; toast.textContent = `${b.name} → would open the ${b.line.toLowerCase()} page`;
    toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), 2200);
  });

  /* stage caption */
  const stageEl = document.getElementById('stage'), hint = document.getElementById('hint');
  let lastStage = '';
  const stageOf = t => t < .22 ? '01 · Hero' : t < .56 ? '02 · Vision' : (MOBILE ? '03 · Ventures: tap a piece' : '03 · Ventures: hover a piece, click to enter');

  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), mp = new THREE.Vector3();
  const clock = new THREE.Clock();
  app.start = update => {
    const frame = () => {
      const dt = Math.min(clock.getDelta(), .05), time = clock.elapsedTime; st.time = time;
      const max = document.documentElement.scrollHeight - innerHeight;
      st.t = AT != null ? AT : max > 0 ? clamp(scrollY / max) : 0;
      st.s = AT != null ? AT : st.s + (st.t - st.s) * Math.min(1, dt * 4);
      st.px += (ptr.x - st.px) * Math.min(1, dt * 3); st.py += (ptr.y - st.py) * Math.min(1, dt * 3);
      /* intro timeline */
      const gp = RM ? 1 : smooth(range(time, .15, 1.7));
      st.intro = RM ? 1 : easeOut(range(time, 1.35, 2.3));
      gather.material.uniforms.uP.value = gp;
      gather.material.uniforms.uAlpha.value = 1 - range(time, 1.5, 2.4);
      gather.visible = gather.material.uniforms.uAlpha.value > 0;
      stream.material.uniforms.uIntro.value = RM ? 1 : smooth(range(time, .4, 2.6));
      stream.material.uniforms.uTime.value = RM ? 0 : time;
      if (ptr.has) { ray.setFromCamera({ x: ptr.x, y: ptr.y }, camera); if (ray.ray.intersectPlane(plane, mp)) st.mouse.copy(mp); }
      stream.material.uniforms.uMouse.value.lerp(st.mouse, Math.min(1, dt * 5));
      if (st.intro >= 1) document.body.classList.add('ready');
      const sname = stageOf(st.s); if (sname !== lastStage) { lastStage = sname; stageEl.textContent = sname; }
      hint.style.opacity = st.intro >= 1 && st.s < .03 ? 1 : 0;

      update(time, dt, st);

      if (ptr.has && pickOn()) setHover(pickAt(ptr.x, ptr.y), ptr.cx, ptr.cy); else if (!MOBILE || !pickOn()) setHover(null);
      composer.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  return app;
}
