import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $ = (i) => document.getElementById(i);
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const IMG = (i) => `../assets/fovo-stock/${String(i).padStart(2, '0')}.jpg`;
const CAP = ['Torres del Paine', 'Studio portrait', 'Concrete and glass', 'The ceremony', 'Evening fragrance', 'Shoreline', 'Hand on face', 'Night, front row', 'The spiral', 'Black and white', 'Open sea', 'Stone portrait', 'The bride', 'The break'];

/* ---------- sliced photographs ---------- */
const N = 10;
function slice(ph) {
  const i = +ph.dataset.i, src = IMG(i);
  const im = new Image(); im.alt = CAP[i] || ''; im.src = src; im.loading = 'lazy'; im.draggable = false; ph.appendChild(im);
  const sl = document.createElement('div'); sl.className = 'sl'; sl.setAttribute('aria-hidden', 'true');
  for (let k = 0; k < N; k++) {
    const s = document.createElement('i');
    s.style.backgroundImage = `url(${src})`; s.style.backgroundPosition = `${(k * 100) / (N - 1)}% 50%`;
    s.style.setProperty('--y', k % 2 ? '-105%' : '105%'); s.style.setProperty('--dl', (k * 0.05).toFixed(2) + 's');
    sl.appendChild(s);
  }
  ph.appendChild(sl);
  if (matchMedia('(hover:hover)').matches) {
    let t = 0;
    ph.addEventListener('pointerenter', () => { if (!ph.classList.contains('done') && !ph.classList.contains('live')) return; clearTimeout(t); ph.classList.add('live'); ap.hover = 1; });
    ph.addEventListener('pointermove', (e) => {
      if (!ph.classList.contains('live')) return;
      const r = ph.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width;
      ph.querySelectorAll('.sl i').forEach((s, k) => { const d = k / (N - 1) - fx; s.style.setProperty('--w', (-Math.exp(-d * d * 16) * 22).toFixed(1) + 'px'); });
    });
    ph.addEventListener('pointerleave', () => { ap.hover = 0; ph.querySelectorAll('.sl i').forEach((s) => s.style.setProperty('--w', '0px')); t = setTimeout(() => ph.classList.remove('live'), 380); });
  }
}
const grid = $('grid');
const G = [[0, 'g1 a45'], [3, 'g2 a45'], [8, 'g3 a11'], [11, 'g4 a32'], [6, 'g5 a45'], [9, 'g6 a45'], [12, 'g7 a45']];
G.forEach(([i, c], n) => {
  const f = document.createElement('figure'); f.style.margin = 0; f.className = c.split(' ')[0];
  f.innerHTML = `<div class="ph ${c.split(' ')[1]}" data-i="${i}"><span class="no mono">${String(n + 1).padStart(2, '0')}</span></div><figcaption class="cap"><span>${CAP[i]}</span><span>${String(i + 1).padStart(2, '0')}</span></figcaption>`;
  grid.appendChild(f);
});
const Y = [[2023, 4, 'Brand launch, evening fragrance'], [2024, 7, 'Front-row night, live event'], [2025, 10, 'Open sea, editorial series'], [2025, 1, 'Studio portraits, personal brand']];
$('years').innerHTML = Y.map(([y, i, t]) => `<div><div class="y">${y}</div><div class="ph" data-i="${i}"></div><p>${t}</p></div>`).join('');
document.querySelectorAll('.ph').forEach(slice);

const phIO = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  phIO.unobserve(e.target); const ph = e.target;
  requestAnimationFrame(() => { ph.classList.add('in'); ap.blink = 1; setTimeout(() => ph.classList.add('done'), reduce ? 0 : 1700); });
}), { threshold: 0.18 });
document.querySelectorAll('.ph').forEach((p) => phIO.observe(p));
const rvIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); } }), { threshold: 0.2 });
document.querySelectorAll('.rv').forEach((r) => rvIO.observe(r));

/* ---------- the aperture ---------- */
const ap = { o: 0.55, hover: 0, blink: 0, vel: 0, dock: 0 };
const cvs = $('lens');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: cvs, alpha: true, antialias: true });
} catch (e) { cvs.style.display = 'none'; }
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(360, 360, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50); cam.position.set(0, 0, 7.4);
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2, 3, 5); scene.add(key);
  const root = new THREE.Group(); scene.add(root);

  const gm = new THREE.MeshStandardMaterial({ color: 0x1b1b1c, metalness: 0.9, roughness: 0.32 });
  const bm = new THREE.MeshStandardMaterial({ color: 0xdedede, metalness: 0.5, roughness: 0.42, envMapIntensity: 1.8, side: THREE.DoubleSide });
  /* outer ring with a round opening */
  const rs = new THREE.Shape(); rs.absarc(0, 0, 1.6, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, 1.04, 0, Math.PI * 2, true); rs.holes.push(hole);
  const ringGeo = new THREE.ExtrudeGeometry(rs, { depth: 0.16, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3, curveSegments: 96 });
  const ring = new THREE.Mesh(ringGeo, gm); ring.position.z = 0.1; root.add(ring);
  /* ticks on the front face */
  const tg = new THREE.BoxGeometry(0.04, 0.2, 0.02), tm = new THREE.MeshStandardMaterial({ color: 0xe9e9e6, metalness: 0.4, roughness: 0.5 });
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2, t = new THREE.Mesh(tg, tm), r = k % 4 === 0 ? 1.42 : 1.36;
    t.scale.y = k % 4 === 0 ? 1.5 : 0.8; t.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.31); t.rotation.z = a + Math.PI / 2; root.add(t);
  }
  /* black glass behind */
  const back = new THREE.Mesh(new THREE.CircleGeometry(1.25, 64), new THREE.MeshBasicMaterial({ color: 0x050506 })); back.position.z = -0.25; root.add(back);
  /* blades */
  const NB = 8, R = 1.0, C = 0.36, L = 1.22, blades = [];
  const bs = new THREE.Shape(); bs.moveTo(0.34, 0.22); bs.lineTo(-C, 0.22); bs.lineTo(-C, -L); bs.quadraticCurveTo(0.0, -L - 0.08, 0.34, -L + 0.3); bs.lineTo(0.34, 0.22);
  const bg = new THREE.ExtrudeGeometry(bs, { depth: 0.012, bevelEnabled: false });
  for (let k = 0; k < NB; k++) {
    const g = new THREE.Group(), th = (k / NB) * Math.PI * 2; g.position.set(Math.cos(th) * R, Math.sin(th) * R, -0.1 + k * 0.016);
    const m = new THREE.Mesh(bg, bm); g.add(m); g.userData.th = th; root.add(g); blades.push(g);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 16), gm); p.rotation.x = Math.PI / 2; p.position.z = 0.1; g.add(p);
  }
  const OPEN = 0.1, CLOSED = Math.acos(C / R) - 0.08;
  const setO = (o) => { const a = CLOSED + (OPEN - CLOSED) * o; blades.forEach((g) => { g.rotation.z = g.userData.th - a; }); };
  setO(ap.o);

  let mx = 0, my = 0, tx = 0, ty = 0, last = performance.now(), sy = scrollY, lastSY = scrollY;
  addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });
  const small = () => innerWidth < 760;
  $('lens').addEventListener('click', () => { if (ap.dock > 0.9) scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  const words = [...document.querySelectorAll('.word span')];
  const ease = (t) => t * t * (3 - 2 * t);
  const fr = (now) => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)) || 0.016; last = now;
    sy = scrollY; const v = (sy - lastSY) / Math.max(dt, 0.001); lastSY = sy; ap.vel += (Math.min(1, Math.abs(v) / 2400) - ap.vel) * Math.min(1, dt * 8);
    mx += (tx - mx) * Math.min(1, dt * 5); my += (ty - my) * Math.min(1, dt * 5);
    const p = Math.min(1, sy / (innerHeight * 0.8)), e = ease(p); ap.dock = p;
    /* opening: wide at rest in the hero, a quick blink on new photographs, snaps shut on fast scroll, wide on hover */
    let target = (0.62 - 0.3 * e) + ap.hover * 0.4 - ap.vel * 0.55;
    if (ap.blink > 0) { ap.blink = Math.max(0, ap.blink - dt * 3.2); target = Math.min(target, 0.05 + (1 - ap.blink) * 0.4); }
    ap.o += (target - ap.o) * Math.min(1, Math.max(0, dt) * 9); if (!Number.isFinite(ap.o)) ap.o = 0.5; setO(Math.max(0, Math.min(1, ap.o)));
    root.rotation.y = mx * 0.7 + Math.sin(now / 2200) * 0.12; root.rotation.x = my * 0.55 + Math.cos(now / 2600) * 0.08;
    const s0 = small() ? 0.4 : 0.64, s1 = small() ? 0.2 : 0.23, s = s0 + (s1 - s0) * e;
    const pad = small() ? 14 : 26, cx0 = innerWidth / 2, cy0 = innerHeight * 0.5, cx1 = innerWidth - pad - 40, cy1 = innerHeight - pad - 40;
    cvs.style.transform = `translate(${(cx0 + (cx1 - cx0) * e - 180).toFixed(1)}px,${(cy0 + (cy1 - cy0) * e - 180).toFixed(1)}px) scale(${s.toFixed(3)})`;
    cvs.classList.toggle('dock', p > 0.9);
    words.forEach((w, i) => { w.style.transform = `translate(${(mx * (i % 2 ? 28 : -28)).toFixed(1)}px,${(my * 18 * (i % 2 ? 1 : -1) - sy * 0.12 * (1 + i * 0.12)).toFixed(1)}px)`; });
    renderer.render(scene, cam); requestAnimationFrame(fr);
  };
  requestAnimationFrame(fr);
}

/* hero photograph reveals at once */
requestAnimationFrame(() => { const h = document.querySelector('.ph1'); if (h) { h.classList.add('in'); setTimeout(() => h.classList.add('done'), 1700); } });

/* booking form (demo) */
$('bf').addEventListener('submit', (e) => {
  e.preventDefault(); const f = e.target;
  $('st').textContent = !f.n.value.trim() || !/\S+@\S+\.\S+/.test(f.e.value) ? 'Please add your name and a valid email.' : 'Thank you. Booking requests are not wired up yet, so nothing was sent.';
});
