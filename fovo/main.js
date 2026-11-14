/* House of Fovo. A light, monochrome Mac desktop.
   Wallpaper: a blurred portrait; the part under your cursor comes into focus, with a live shooting readout in the menu bar.
   Desktop: photographs you can drag and open.  Dock: opens the apps.
   Apps: About (Notes), Frames (a roll receding in depth), Story (a grid that bends toward the light), Services (Finder), Book (Mail), Preview.
   The photographs are stock images standing in for the studio's own. */
(function () {
'use strict';
const $ = id => document.getElementById(id), clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t, sst = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, TOUCH = matchMedia('(hover: none)').matches, SMALL = () => innerWidth <= 700;
const IMG = Array.from({ length: 14 }, (_, i) => `../assets/fovo-stock/${String(i).padStart(2, '0')}.jpg`);
const img = (i, extra = '') => `<img src="${IMG[((i % 14) + 14) % 14]}" alt="" ${extra}>`;
const KINDS = ['land', 'port', 'arch', 'event', 'prod', 'land', 'port', 'event', 'arch', 'prod', 'land', 'port', 'event', 'land'];
const CAP = ['Torres del Paine', 'Studio portrait', 'Concrete and glass', 'The ceremony', 'Evening fragrance', 'Shoreline', 'Hand on face', 'Night, front row', 'The spiral', 'Black and white', 'Open sea', 'Stone portrait', 'The bride', 'The break'];
const APS = ['1.4', '1.8', '2.8', '4', '5.6', '8', '11', '16'], SHS = ['1/30', '1/60', '1/125', '1/250', '1/500', '1/1000', '1/2000'], LENS = ['35 mm', '50 mm', '85 mm', '24 mm', '135 mm'];
const exifRows = i => `<div><span>Aperture</span><span>f/${APS[(i * 3) % 8]}</span></div><div><span>Shutter</span><span>${SHS[(i * 2) % 7]} s</span></div><div><span>ISO</span><span>${[100, 200, 400, 800][i % 4]}</span></div><div><span>Lens</span><span>${LENS[i % 5]}</span></div>`;
const KIND_NAME = { land: ['Landscape', ['coast at dawn', 'before the rain', 'late sun', 'mountain haze']], port: ['Portrait', ['window light', 'studio, hard light', 'on location', 'golden hour']], arch: ['Architecture', ['blue hour', 'the staircase', 'glass and steel']], event: ['Event', ['launch night', 'the first dance', 'backstage', 'the speech']], prod: ['Commercial', ['product on stone', 'the lookbook', 'food, overhead']] }, used = {};
const META = Array.from({ length: 18 }, (_, i) => { const k = KINDS[i % KINDS.length], e = KIND_NAME[k]; used[k] = (used[k] || 0); return [e[0], e[1][used[k]++ % e[1].length]]; });
const noise = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), im = g.createImageData(128, 128); for (let i = 0; i < im.data.length; i += 4) { const v = 120 + Math.random() * 135; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); return c; })();
document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG' && !t.dataset.retry) { t.dataset.retry = 1; setTimeout(() => { t.src = t.src; }, 600); } }, true);

/* ---------- windows ---------- */
const WINS = {}; let zTop = 20, placed = 0;
function makeWin(id, title, w, h, build, hooks = {}) {
  const el = document.createElement('div'); el.className = 'win'; el.id = 'w-' + id; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', title);
  el.innerHTML = `<div class="tbar"><div class="tl"><button data-s="×" aria-label="Close"></button><button data-s="–" aria-label="Minimise"></button><button data-s="+" aria-label="Zoom"></button></div><div class="tt">${title}</div></div><div class="wb"></div>`;
  document.body.appendChild(el);
  const W = { id, el, title, w, h, body: el.querySelector('.wb'), build, hooks, built: false, open: false, rect: null, max: false };
  WINS[id] = W; const [bc, bm, bz] = el.querySelectorAll('.tl button'); bc.onclick = () => closeWin(id); bm.onclick = () => minWin(id); bz.onclick = () => zoomWin(id);
  el.addEventListener('pointerdown', () => front(id)); const tb = el.querySelector('.tbar'); let drag = null;
  tb.addEventListener('pointerdown', e => { if (e.target.closest('.tl') || SMALL() || W.max) return; const r = el.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; tb.setPointerCapture(e.pointerId); });
  tb.addEventListener('pointermove', e => { if (!drag) return; el.style.left = clamp(e.clientX - drag.dx, -W.w + 120, innerWidth - 120) + 'px'; el.style.top = clamp(e.clientY - drag.dy, 30, innerHeight - 60) + 'px'; });
  tb.addEventListener('pointerup', () => { drag = null; }); tb.addEventListener('dblclick', () => zoomWin(id));
  return W;
}
function front(id) { WINS[id].el.style.zIndex = ++zTop; }
function openWin(id) {
  const W = WINS[id]; if (!W) return; if (!W.built) { W.build(W.body, W); W.built = true; }
  if (!W.placed) { const ww = Math.min(W.w, innerWidth - 24), hh = Math.min(W.h, innerHeight - 140), off = (placed++ % 5) * 26; W.el.style.width = ww + 'px'; W.el.style.height = hh + 'px'; W.el.style.left = Math.max(12, (innerWidth - ww) / 2 + off - 40) + 'px'; W.el.style.top = Math.max(42, (innerHeight - hh) / 2 - 30 + off) + 'px'; W.placed = true; }
  W.el.style.display = 'flex'; front(id); setTimeout(() => { W.el.classList.remove('min'); W.el.classList.add('on'); }, 30); W.open = true; W.min = false; W.hooks.open && W.hooks.open(W); dockState();
}
function closeWin(id) { const W = WINS[id]; W.el.classList.remove('on'); setTimeout(() => { if (!W.open) W.el.style.display = 'none'; }, 260); W.open = false; W.hooks.close && W.hooks.close(W); dockState(); }
function minWin(id) { const W = WINS[id]; W.el.classList.add('min'); W.min = true; dockState(); }
function zoomWin(id) { const W = WINS[id]; if (SMALL()) return; const el = W.el; if (!W.max) { const r = el.getBoundingClientRect(); W.rect = [r.left, r.top, r.width, r.height]; el.style.left = '10px'; el.style.top = '40px'; el.style.width = innerWidth - 20 + 'px'; el.style.height = innerHeight - 130 + 'px'; W.max = true; el.classList.add('max'); } else { el.style.left = W.rect[0] + 'px'; el.style.top = W.rect[1] + 'px'; el.style.width = W.rect[2] + 'px'; el.style.height = W.rect[3] + 'px'; W.max = false; el.classList.remove('max'); } }
const toggleWin = id => { const W = WINS[id]; if (W.open && !W.min) { front(id); } else if (W.open && W.min) { W.el.classList.remove('min'); W.min = false; front(id); dockState(); } else openWin(id); };
const topWin = () => Object.values(WINS).filter(w => w.open && !w.min).sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0))[0];

/* ---------- apps ---------- */
makeWin('about', 'About House of Fovo', 460, 400, b => { b.innerHTML = `<div class="notes"><span class="lab">[ About ]</span><h2>House <em>of</em> Fovo</h2><p>Photography, seen properly. Portraits, events and commercial work, shot with patience and a good eye.</p><p>We plan every frame on a grid, then wait for the moment that breaks it. A photography house inside AJ GROUPS, built and led by Allwyn.</p><div class="acts"><button class="btn p" data-open="book">Book a session ↗</button><button class="btn" data-open="services">See services</button><button class="btn" data-open="frames">Open the roll</button></div></div>`; });

/* Frames: a roll receding in depth */
const FN = 18; let roll = { p: 0, auto: true, last: 0, dir: 1, frames: [], imgs: [], tabs: [], active: -1 };
makeWin('frames', 'Frames: the roll', 800, 540, (b, W) => {
  b.innerHTML = `<div class="roll"><div class="rstage" id="rstage"></div><div class="rinfo"><div class="big swap" id="inum">001</div><div class="swap" id="itxt"><h3 id="ititle"></h3><div class="rows mono" id="irows"></div></div></div><div class="rbar mono"><span>Roll</span><input type="range" id="rrng" min="0" max="1000" value="0" aria-label="Move through the roll"><span id="rcnt">001 / 018</span></div></div>`;
  const st = $('rstage'); roll.frames = Array.from({ length: FN }, (_, i) => { const d = document.createElement('div'); d.className = 'fr'; d.innerHTML = `<span class="tab mono">Frame ${String(i + 1).padStart(3, '0')}</span>${img(i)}<div class="ex mono"><span>${META[i][0]}</span><span>f/${APS[(i * 3) % 8]} · ${SHS[(i * 2) % 7]}</span></div>`; st.appendChild(d); return d; });
  roll.imgs = roll.frames.map(f => f.querySelector('img')); roll.tabs = roll.frames.map(f => f.querySelector('.tab'));
  $('rrng').addEventListener('input', e => { roll.p = e.target.value / 1000; roll.auto = false; roll.last = performance.now(); });
  st.addEventListener('wheel', e => { e.preventDefault(); roll.p = clamp(roll.p + e.deltaY * .0006); roll.auto = false; roll.last = performance.now(); $('rrng').value = roll.p * 1000; }, { passive: false });
});
function setRollInfo(i) { const n = $('inum'), t = $('itxt'); n.classList.add('out'); t.classList.add('out'); setTimeout(() => { n.textContent = String(i + 1).padStart(3, '0'); $('ititle').innerHTML = `${META[i][0]}, <em>${META[i][1]}</em>`; $('irows').innerHTML = exifRows(i); $('rcnt').textContent = `${String(i + 1).padStart(3, '0')} / 018`; n.classList.remove('out'); t.classList.remove('out'); }, roll.active < 0 ? 0 : 260); roll.active = i; }
function rollTick(now, dt) {
  const W = WINS.frames; if (!W.open || W.min || !roll.frames.length) return; const st = $('rstage'), sw = st.clientWidth, sh = st.clientHeight;
  if (!roll.auto && now - roll.last > 5000) roll.auto = true; if (roll.auto && !RM) { roll.p += dt * .035 * roll.dir; if (roll.p >= 1) { roll.p = 1; roll.dir = -1; } if (roll.p <= 0) { roll.p = 0; roll.dir = 1; } $('rrng').value = roll.p * 1000; }
  const cam = roll.p * (FN - 1);
  for (let i = 0; i < FN; i++) { const d = i - cam, el = roll.frames[i]; let tx, ty, tz, op;
    if (d >= 0) { tx = d * sw * .036; ty = d * sh * .04; tz = -d * 110; op = clamp(1 - d * .075); } else { tx = d * sw * .09; ty = d * sh * .1; tz = -d * 140; op = clamp(1 + d * 1.5); }
    el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,${tz.toFixed(1)}px)`; el.style.opacity = op.toFixed(3); el.style.zIndex = 1000 - Math.round(d * 100);
    if (Math.abs(d) < 8) roll.imgs[i].style.filter = d > .4 ? `grayscale(1) blur(${clamp(d * 1.1, 0, 5).toFixed(1)}px) brightness(${(1 + clamp(d * .04, 0, .3)).toFixed(2)})` : 'grayscale(1)'; }
  const a = Math.round(cam); if (a !== roll.active) setRollInfo(a);
}

/* Story: a grid that bends toward the light, then lets go */
const SL = [['01', 'The grid is <span class="dot">real.</span>', 'Every photograph starts with a plan: frames, thirds, a place to stand.', 'Order →'], ['02', 'Light bends <span class="dot">it.</span>', 'Weather, mood and people never sit on the lines.', 'Order → Light'], ['03', 'Then the <span class="dot">moment.</span>', 'That is the frame we wait for. Everything else was preparation.', 'Order → Moment']];
const story = { p: 0, auto: true, last: 0, hold: 0, slide: -1, ctx: null, gw: 0, gh: 0, dpr: 1, fx: .62, fy: .42 };
makeWin('story', 'Story: order, light, moment', 840, 560, b => {
  b.innerHTML = `<div class="story"><canvas id="gc" aria-hidden="true"></canvas><div class="sflow mono"><span id="sfl">Order →</span><span id="scnt">/01</span></div><div class="scap"><div class="n swap" id="sn">01</div><div class="swap" id="stx"><h2 id="sh"></h2><p id="sp"></p></div></div><div class="rbar mono" style="right:14px"><span>Slide</span><input type="range" id="srng" min="0" max="1000" value="0" aria-label="Scrub the story"><span id="sc2">1 / 3</span></div></div>`;
  story.ctx = $('gc').getContext('2d'); $('srng').addEventListener('input', e => { story.p = e.target.value / 1000; story.auto = false; story.last = performance.now(); });
  $('gc').addEventListener('pointermove', e => { const r = $('gc').getBoundingClientRect(); story.fx = (e.clientX - r.left) / r.width; story.fy = (e.clientY - r.top) / r.height; story.last = performance.now(); });
  new ResizeObserver(() => { const c = $('gc'), r = c.getBoundingClientRect(); story.dpr = Math.min(devicePixelRatio, 2); story.gw = r.width; story.gh = r.height; c.width = Math.round(r.width * story.dpr); c.height = Math.round(r.height * story.dpr); }).observe($('gc'));
});
const H2 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
function setSlide(i) { const n = $('sn'), t = $('stx'); n.classList.add('out'); t.classList.add('out'); setTimeout(() => { n.textContent = SL[i][0]; $('sh').innerHTML = SL[i][1]; $('sp').textContent = SL[i][2]; $('sfl').textContent = SL[i][3]; $('scnt').textContent = '/' + SL[i][0]; $('sc2').textContent = `${i + 1} / 3`; n.classList.remove('out'); t.classList.remove('out'); }, story.slide < 0 ? 0 : 280); story.slide = i; }
const smear = (c, x, y, rx, ry, rot, col, a) => { c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, ry / rx); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, 6.3); c.fill(); c.restore(); };
function storyTick(now, dt, T) {
  const W = WINS.story; if (!W.open || W.min || !story.ctx || !story.gw) return;
  if (!story.auto && now - story.last > 6000) story.auto = true;
  if (story.auto && !RM) { if (story.hold > 0) story.hold -= dt; else { story.p += dt / 16; if (story.p >= 1) { story.p = 1; story.hold = 2.5; story.auto = true; story.pend = 1; } } if (story.pend && story.hold <= 0) { story.p = 0; story.pend = 0; } $('srng').value = story.p * 1000; }
  const p = story.p, i = p < .33 ? 0 : p < .66 ? 1 : 2; if (i !== story.slide) setSlide(i);
  const c = story.ctx, GW = story.gw, GH = story.gh; c.setTransform(story.dpr, 0, 0, story.dpr, 0, 0); c.clearRect(0, 0, GW, GH);
  const warp = sst(.1, .55, p), brk = sst(.55, .95, p), gr = GW <= 560 ? 34 : 50, fx = lerp(GW * .62, story.fx * GW, .55), fy = lerp(GH * .42, story.fy * GH, .55), sigma = GW * .2;
  const cols = Math.floor((GW - 40) / gr), rows = Math.floor((GH - 130) / gr), x0 = (GW - cols * gr) / 2, y0 = 44, STEP = 16;
  const pt = (x, y) => { const dx = x - fx, dy = y - fy, k = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma)); return [x + (fx - x) * warp * .55 * k + Math.sin(y * .013 + T * .4) * 14 * warp * (1 - k * .5), y + (fy - y) * warp * .55 * k + Math.sin(x * .011 - T * .35) * 10 * warp]; };
  c.lineWidth = 1; c.lineCap = 'round';
  const seg = (xa, ya, xb, yb, key) => { if (H2(key, Math.floor((xa + ya) / 24)) < brk * 1.05) return; const m = pt((xa + xb) / 2, (ya + yb) / 2), a = pt(xa, ya), b = pt(xb, yb); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0] * 2 - (a[0] + b[0]) / 2, m[1] * 2 - (a[1] + b[1]) / 2, b[0], b[1]); };
  c.strokeStyle = `rgba(17,17,17,${(.5 - brk * .12).toFixed(2)})`; c.beginPath();
  for (let i = 0; i <= cols; i++) for (let y = 0; y < rows * gr; y += STEP) seg(x0 + i * gr, y0 + y, x0 + i * gr, y0 + y + STEP, i + 1);
  for (let j = 0; j <= rows; j++) for (let x = 0; x < cols * gr; x += STEP) seg(x0 + x, y0 + j * gr, x0 + x + STEP, y0 + j * gr, j + 77);
  c.stroke();
  c.fillStyle = '#111'; const nSq = Math.floor(brk * 30);
  for (let k = 0; k < nSq; k++) { const a = H2(k, 3) * 6.28, d = Math.pow(H2(k, 9), 1.6) * GW * .34, s = 3 + H2(k, 5) * 13 * brk, p2 = pt(fx + Math.cos(a) * d, fy + Math.sin(a) * d * .8); c.fillRect(p2[0] - s / 2, p2[1] - s / 2, s, s); }
  for (let k = 0; k < Math.floor(brk * 140); k++) { const a = H2(k, 21) * 6.28, d = Math.pow(H2(k, 17), 1.3) * GW * .42, p2 = pt(fx + Math.cos(a) * d, fy + Math.sin(a) * d * .8); c.fillRect(p2[0], p2[1], 1.5, 1.5); }
  if (brk > .02) { c.save(); c.globalCompositeOperation = 'multiply'; smear(c, fx - 40, fy + 10, GW * .26, GW * .1, -.5, '#000', brk * .85); smear(c, fx + 70, fy - 20, GW * .22, GW * .08, -.35, '#555', brk * .7); smear(c, fx - 140, fy + 70, GW * .2, GW * .07, -.6, '#222', brk * .6); smear(c, fx + 150, fy + 60, GW * .14, GW * .06, -.2, '#888', brk * .5); c.restore();
    c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = .25 * brk; c.fillStyle = c.createPattern(noise, 'repeat'); c.fillRect(0, 0, GW, GH); c.restore(); }
  const rs = lerp(8, 18, brk); c.fillStyle = '#111'; if (brk < .7) c.fillRect(fx - rs / 2, fy - rs / 2, rs, rs); else { c.beginPath(); c.arc(fx, fy - GH * .16 * brk, rs * 1.5, 0, 6.3); c.fill(); }
}

/* Develop: a small photo editor, with real sliders */
const dv = { img: 0, e: 1, c: 1, f: 0, g: .25, v: .2, mono: 1, before: 0 };
makeWin('develop', 'Develop', 800, 540, b => {
  const fid = n => `FOVO_${String(400 + n * 7).padStart(4, '0')}.NEF`;
  b.innerHTML = `<div class="dev"><div class="dimg"><span class="fn" id="dfn"></span><div class="pic" id="dpic"><img id="dim" alt=""><div class="gr" id="dgr"></div><div class="vg" id="dvg"></div></div><div class="strip2" id="dstrip">${[0, 6, 3, 1, 8, 12].map(k => `<button type="button" data-k="${k}" aria-label="${CAP[k]}"><img src="${IMG[k]}" alt=""></button>`).join('')}</div></div>
  <div class="dpan"><h4>Basic</h4><label>Exposure <b id="vE">0.00</b></label><input type="range" id="rE" min="-100" max="100" value="0"><label>Contrast <b id="vC">0</b></label><input type="range" id="rC" min="-100" max="100" value="0"><label>Focus <b id="vF">sharp</b></label><input type="range" id="rF" min="0" max="100" value="0"><h4 style="margin-top:18px">Effects</h4><label>Grain <b id="vG">25</b></label><input type="range" id="rG" min="0" max="100" value="25"><label>Vignette <b id="vV">20</b></label><input type="range" id="rV" min="0" max="100" value="20"><div class="row"><button type="button" id="dMono" class="on">Mono</button><button type="button" id="dBef">Before</button><button type="button" id="dRst">Reset</button></div><p class="mono" style="margin-top:14px;color:#8a8a90;font-size:10px">Move the sliders. Every photograph on this page is edited the same way.</p></div></div>`;
  $('dgr').style.backgroundImage = `url(${noise.toDataURL()})`;
  const apply = () => { const im = $('dim'); im.src = IMG[dv.img]; $('dfn').textContent = `FOVO_${String(400 + dv.img * 7).padStart(4, '0')}.NEF`; const f = dv.before ? 'grayscale(0)' : `grayscale(${dv.mono}) brightness(${(1 + dv.e * .6).toFixed(2)}) contrast(${(1 + dv.c * .6).toFixed(2)}) blur(${(dv.f * 6).toFixed(1)}px)`; im.style.filter = f; $('dgr').style.opacity = dv.before ? 0 : dv.g * .9; $('dvg').style.opacity = dv.before ? 0 : dv.v; $('vE').textContent = (dv.e * 2).toFixed(2); $('vC').textContent = Math.round(dv.c * 100); $('vF').textContent = dv.f < .02 ? 'sharp' : Math.round(dv.f * 100); $('vG').textContent = Math.round(dv.g * 100); $('vV').textContent = Math.round(dv.v * 100); $('dMono').classList.toggle('on', !!dv.mono); $('dBef').classList.toggle('on', !!dv.before); b.querySelectorAll('#dstrip button').forEach(x => x.classList.toggle('on', +x.dataset.k === dv.img)); };
  const bind = (id, key, scale) => $(id).addEventListener('input', e => { dv[key] = e.target.value / scale; apply(); });
  bind('rE', 'e', 100); bind('rC', 'c', 100); bind('rF', 'f', 100); bind('rG', 'g', 100); bind('rV', 'v', 100);
  b.querySelectorAll('#dstrip button').forEach(x => x.addEventListener('click', () => { dv.img = +x.dataset.k; apply(); }));
  $('dMono').addEventListener('click', () => { dv.mono = dv.mono ? 0 : 1; apply(); }); $('dBef').addEventListener('click', () => { dv.before = dv.before ? 0 : 1; apply(); });
  $('dRst').addEventListener('click', () => { Object.assign(dv, { e: 0, c: 0, f: 0, g: .25, v: .2, mono: 1, before: 0 }); ['rE', 'rC', 'rF'].forEach(id => { $(id).value = 0; }); $('rG').value = 25; $('rV').value = 20; apply(); });
  Object.assign(dv, { e: 0, c: 0 }); apply();
});

/* Services: a Finder window */
const SERV = [['Portraits', 'Studio and location sessions. Light, patience and a good eye.', [1, 6, 11, 12, 3, 0, 5, 13]], ['Events', 'Weddings, launches and celebrations, covered without getting in the way.', [3, 7, 12, 6, 1, 10, 13, 5]], ['Commercial', 'Products, people and places, shot to sell and made to last.', [4, 9, 2, 8, 0, 10, 5, 13]]];
makeWin('services', 'Services', 780, 520, b => {
  b.innerHTML = `<div class="fnd"><div class="fside"><small>Favourites</small>${SERV.map((s, i) => `<button type="button" data-i="${i}" class="${i ? '' : 'on'}">${s[0]}</button>`).join('')}<small style="margin-top:14px">Archive</small><button type="button" data-open="archive-note">Roll 01 to 03</button></div><div class="fmain" id="fmain"></div></div>`;
  const show = i => { const s = SERV[i]; $('fmain').innerHTML = `<span class="lab">[ 0${i + 1} ]</span><h3>${s[0]}</h3><p>${s[1]}</p><div class="fgrid">${s[2].map((k, n) => `<figure style="--i:${n}" data-k="${k}">${img(k)}<figcaption class="mono">${'ABC'[i]}${String(n + 1).padStart(2, '0')}</figcaption></figure>`).join('')}</div><p style="margin-top:14px" class="mono">FOVO_ARCHIVE / ROLL 0${i + 1}</p>`; $('fmain').querySelectorAll('figure').forEach(f => f.addEventListener('click', () => showPhoto(+f.dataset.k))); };
  b.querySelectorAll('.fside button[data-i]').forEach(btn => btn.addEventListener('click', () => { b.querySelectorAll('.fside button').forEach(x => x.classList.remove('on')); btn.classList.add('on'); show(+btn.dataset.i); })); show(0);
  b.querySelector('[data-open="archive-note"]').addEventListener('click', () => showPhoto(1));
});

/* Book: a Mail compose window */
makeWin('book', 'New booking', 560, 560, b => {
  b.innerHTML = `<form class="mail" id="mform" onsubmit="return false" novalidate><div class="mrow"><label>To</label><input value="hello@houseoffovo.example" readonly aria-label="To"></div><div class="mrow"><label for="mn">Name</label><input id="mn" placeholder="Your name" autocomplete="name"></div><div class="mrow"><label for="me">E-mail</label><input id="me" type="email" placeholder="you@email.com" autocomplete="email"></div><div class="mrow"><label>Scene</label><div class="chips"><label><input type="radio" name="sc" checked><span>Portrait</span></label><label><input type="radio" name="sc"><span>Event</span></label><label><input type="radio" name="sc"><span>Commercial</span></label></div></div><div class="mrow"><label for="md">Date</label><input id="md" type="date"></div><div class="mrow"><label for="ml">Location</label><input id="ml" placeholder="City or venue"></div><div class="mrow col"><label for="mt">Notes</label><textarea id="mt" placeholder="A few lines about the shoot"></textarea></div><div class="mfoot"><button class="btn p" type="submit">Send ↗</button><span class="ok" id="mok">Thank you. This is a placeholder form, so nothing was sent yet.</span></div><p class="mono" style="padding:6px 16px 0;color:var(--mute)">Placeholder contact details: +00 00000 00000</p></form>`;
  $('mform').addEventListener('submit', e => { e.preventDefault(); $('mok').classList.add('on'); });
});

/* Preview: one photograph */
makeWin('preview', 'Preview', 640, 560, b => { b.innerHTML = `<div class="pv"><div class="im"><img id="pvi" alt=""></div><div class="pi"><span class="lab" id="pvn"></span><h3 id="pvt"></h3><div class="rows mono" id="pvr"></div><p class="mono" style="margin-top:14px;color:var(--mute)">Stock photograph</p></div></div>`; });
function showPhoto(i) { const open = () => { $('pvi').src = IMG[i]; $('pvn').textContent = `[ Frame ${String(i + 1).padStart(3, '0')} ]`; $('pvt').textContent = CAP[i]; $('pvr').innerHTML = exifRows(i); WINS.preview.el.querySelector('.tt').textContent = CAP[i]; }; if (!WINS.preview.built) { WINS.preview.build(WINS.preview.body, WINS.preview); WINS.preview.built = true; } open(); openWin('preview'); }

/* ---------- desktop icons ---------- */
const desk = $('desk'), POS = [[62, 12], [26, 24], [8, 34], [24, 50], [38, 62], [46, 20], [58, 30], [76, 18], [80, 40], [90, 28], [72, 56], [60, 64], [47, 44], [92, 54]];
desk.insertAdjacentHTML('beforeend', POS.map((p, i) => `<div class="ico" data-i="${i}" style="left:${p[0]}%;top:${p[1]}%;--d:${(-(i * 1.3) % 7).toFixed(1)}s;--is:${SMALL() ? 44 : 62}px" tabindex="0" role="button" aria-label="${CAP[i]}"><img src="${IMG[i]}" alt=""><span>${CAP[i]}</span></div>`).join(''));
{ let cur = null, sx = 0, sy = 0, ox = 0, oy = 0, moved = 0;
  desk.addEventListener('pointerdown', e => { const el = e.target.closest('.ico'); if (!el) return; cur = el; const dr = desk.getBoundingClientRect(), r = el.getBoundingClientRect(); ox = r.left - dr.left; oy = r.top - dr.top; sx = e.clientX; sy = e.clientY; moved = 0; el.style.left = ox + 'px'; el.style.top = oy + 'px'; el.classList.add('drag'); el.setPointerCapture(e.pointerId); });
  desk.addEventListener('pointermove', e => { if (!cur) return; const dx = e.clientX - sx, dy = e.clientY - sy; moved = Math.max(moved, Math.hypot(dx, dy)); const dr = desk.getBoundingClientRect(); cur.style.left = clamp(ox + dx, 0, dr.width - cur.offsetWidth) + 'px'; cur.style.top = clamp(oy + dy, 0, dr.height - cur.offsetHeight) + 'px'; });
  const end = () => { if (!cur) return; const el = cur; cur = null; el.classList.remove('drag'); if (moved < 6) showPhoto(+el.dataset.i); };
  desk.addEventListener('pointerup', end); desk.addEventListener('pointercancel', () => { if (cur) { cur.classList.remove('drag'); cur = null; } });
  desk.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('ico')) { e.preventDefault(); showPhoto(+e.target.dataset.i); } }); }

/* ---------- dock ---------- */
const ICON_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="hl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
<linearGradient id="g-svc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0ff"/><stop offset="1" stop-color="#1c6fe6"/></linearGradient>
<linearGradient id="g-svf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfe6ff"/></linearGradient>
<linearGradient id="g-cam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#48484c"/><stop offset="1" stop-color="#0f0f11"/></linearGradient>
<linearGradient id="g-cbody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f1f4"/><stop offset="1" stop-color="#a3a3aa"/></linearGradient>
<radialGradient id="g-lens" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#7fb0ff"/><stop offset=".45" stop-color="#1c3f94"/><stop offset="1" stop-color="#050b20"/></radialGradient>
<linearGradient id="g-dev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3b3f"/><stop offset="1" stop-color="#0d0d0f"/></linearGradient>
<linearGradient id="g-nt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ececef"/></linearGradient>
<linearGradient id="g-nty" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe46b"/><stop offset="1" stop-color="#ffc400"/></linearGradient>
<linearGradient id="g-st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a3e"/><stop offset="1" stop-color="#0b0b0c"/></linearGradient>
<linearGradient id="g-ml" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#63d2ff"/><stop offset="1" stop-color="#0a5fd6"/></linearGradient>
<linearGradient id="g-aj" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dcdce2"/></linearGradient>
<pattern id="stripes" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="8" height="16" fill="#fff"/><rect x="8" width="8" height="16" fill="#111"/></pattern>
<clipPath id="sq"><rect width="100" height="100" rx="22.5"/></clipPath></defs></svg>`;
document.body.insertAdjacentHTML('afterbegin', ICON_DEFS);
const sq = fill => `<rect width="100" height="100" rx="22.5" fill="${fill}"/>`, shine = '<rect width="100" height="100" rx="22.5" fill="url(#hl)"/><rect x=".5" y=".5" width="99" height="99" rx="22" fill="none" stroke="#fff" stroke-opacity=".35"/>';
const ICON = {
  services: sq('url(#g-svc)') + '<path d="M18 36h22l8 8h34a4 4 0 0 1 4 4v8H14V40a4 4 0 0 1 4-4z" fill="#e4f1ff"/><rect x="26" y="30" width="46" height="26" rx="2" fill="#fff"/><path d="M14 52a4 4 0 0 1 4-4h64a4 4 0 0 1 4 4v28a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z" fill="url(#g-svf)"/>' + shine,
  frames: sq('url(#g-cam)') + '<rect x="12" y="32" width="76" height="46" rx="9" fill="url(#g-cbody)"/><rect x="34" y="23" width="30" height="12" rx="4" fill="#d6d6db"/><rect x="72" y="38" width="9" height="5" rx="1.5" fill="#ff453a"/><circle cx="50" cy="55" r="19" fill="#1c1c1e" stroke="#6a6a70" stroke-width="3"/><circle cx="50" cy="55" r="13" fill="url(#g-lens)"/><circle cx="44" cy="49" r="3.4" fill="#fff" fill-opacity=".75"/><circle cx="56" cy="62" r="1.6" fill="#fff" fill-opacity=".35"/>' + shine,
  develop: sq('url(#g-dev)') + '<g stroke-linecap="round"><path d="M22 30h56M22 50h56M22 70h56" stroke="#5c5c62" stroke-width="4"/><path d="M22 30h22" stroke="#ff9f0a" stroke-width="4"/><path d="M22 50h44" stroke="#32d4c2" stroke-width="4"/><path d="M22 70h30" stroke="#bf5af2" stroke-width="4"/></g><circle cx="44" cy="30" r="7" fill="#fff"/><circle cx="66" cy="50" r="7" fill="#fff"/><circle cx="52" cy="70" r="7" fill="#fff"/>' + shine,
  about: sq('url(#g-nt)') + '<path d="M0 22.5A22.5 22.5 0 0 1 22.5 0h55A22.5 22.5 0 0 1 100 22.5V28H0z" fill="url(#g-nty)"/><g stroke="#d3d3d8" stroke-width="2.4" stroke-linecap="round"><path d="M22 46h56M22 60h56M22 74h38"/></g><circle cx="16" cy="46" r="1.6" fill="#b9b9bf"/><circle cx="16" cy="60" r="1.6" fill="#b9b9bf"/><circle cx="16" cy="74" r="1.6" fill="#b9b9bf"/>' + shine,
  story: sq('url(#g-st)') + '<g transform="rotate(-9 50 36)"><rect x="16" y="22" width="68" height="15" rx="3" fill="url(#stripes)" stroke="#fff" stroke-width="2"/></g><rect x="16" y="40" width="68" height="38" rx="4" fill="#161618" stroke="#fff" stroke-width="2.4"/><path d="M26 52h26M26 62h40" stroke="#8e8e93" stroke-width="3" stroke-linecap="round"/>' + shine,
  book: sq('url(#g-ml)') + '<rect x="16" y="28" width="68" height="46" rx="7" fill="#fff"/><path d="M16 35l34 23 34-23" fill="none" stroke="#a9d3ff" stroke-width="3.2" stroke-linejoin="round"/><path d="M16 74l24-20M84 74L60 54" stroke="#e1efff" stroke-width="2.4"/>' + shine,
  aj: sq('url(#g-aj)') + '<circle cx="50" cy="50" r="32" fill="#fff" stroke="#b9b9c2" stroke-width="3"/><g stroke="#9a9aa4" stroke-width="2" stroke-linecap="round"><path d="M50 21v6M50 73v6M21 50h6M73 50h6"/></g><path d="M50 50 62 30 56 56z" fill="#ff3b30"/><path d="M50 50 38 70 44 44z" fill="#2a2a2f"/><circle cx="50" cy="50" r="3.2" fill="#fff" stroke="#6b6b72"/>' + shine
};
const DOCK = [['services', 'Services'], ['frames', 'Frames'], ['develop', 'Develop'], ['about', 'About'], ['story', 'Story'], ['book', 'Book a session'], ['aj', 'AJ GROUPS']];
const dock = $('dock'); dock.innerHTML = DOCK.map(d => d[0] === 'aj' ? `<hr><a href="../aj-groups/" data-l="${d[1]}" aria-label="${d[1]}"><svg viewBox="0 0 100 100" aria-hidden="true">${ICON[d[0]]}</svg></a>` : `<a href="#" data-k="${d[0]}" data-l="${d[1]}" aria-label="${d[1]}"><svg viewBox="0 0 100 100" aria-hidden="true">${ICON[d[0]]}</svg></a>`).join('');
const dks = [...dock.querySelectorAll('a')]; dks.forEach(a => { if (a.dataset.k) a.addEventListener('click', e => { e.preventDefault(); a.classList.remove('bounce'); void a.offsetWidth; a.classList.add('bounce'); toggleWin(a.dataset.k); }); });
function dockState() { dks.forEach(a => { const W = WINS[a.dataset.k]; a.classList.toggle('run', !!(W && W.open)); }); }
dock.addEventListener('pointermove', e => { if (TOUCH) return; dks.forEach(a => { const r = a.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)); a.style.transform = `scale(${(1 + .5 * Math.exp(-(d * d) / 6500)).toFixed(3)})`; }); });
dock.addEventListener('pointerleave', () => dks.forEach(a => { a.style.transform = ''; }));
document.addEventListener('click', e => { const t = e.target.closest('[data-open]'); if (t && WINS[t.dataset.open]) openWin(t.dataset.open); });

/* ---------- menu bar ---------- */
const dd = $('dd'), MENUS = {
  Fovo: [['About House of Fovo', () => openWin('about')], ['Book a session', () => openWin('book')], 'hr', ['AJ GROUPS ↗', () => { location.href = '../aj-groups/'; }]],
  File: [['New booking', () => openWin('book')], ['Open the roll', () => openWin('frames')], 'hr', ['Close window', () => { const w = topWin(); if (w) closeWin(w.id); }]],
  View: [['Show desktop', () => Object.values(WINS).forEach(w => { if (w.open) minWin(w.id); })], ['Close all windows', () => Object.values(WINS).forEach(w => { if (w.open) closeWin(w.id); })]],
  Go: [['Services', () => openWin('services')], ['Frames', () => openWin('frames')], ['Develop', () => openWin('develop')], ['Story', () => openWin('story')], ['About', () => openWin('about')], ['Book', () => openWin('book')]],
  Window: [['Minimise', () => { const w = topWin(); if (w) minWin(w.id); }], ['Zoom', () => { const w = topWin(); if (w) zoomWin(w.id); }]],
  Help: [['Drag the photographs around', () => { }], ['Tap one to open it in Preview', () => { }], ['Open apps from the dock', () => { }]]
};
let openMenu = null; const mis = [...document.querySelectorAll('.mbar .mi')];
function showMenu(btn) { const items = MENUS[btn.dataset.m]; dd.innerHTML = items.map((it, i) => it === 'hr' ? '<hr>' : `<button type="button" data-i="${i}">${it[0]}</button>`).join(''); dd.style.left = btn.getBoundingClientRect().left + 'px'; dd.classList.add('on'); mis.forEach(m => m.classList.toggle('on', m === btn)); openMenu = btn; dd.querySelectorAll('button').forEach(bt => bt.addEventListener('click', () => { items[+bt.dataset.i][1](); hideMenu(); })); }
function hideMenu() { dd.classList.remove('on'); mis.forEach(m => m.classList.remove('on')); openMenu = null; }
mis.forEach(m => { m.addEventListener('click', e => { e.stopPropagation(); openMenu === m ? hideMenu() : showMenu(m); }); m.addEventListener('pointerenter', () => { if (openMenu && openMenu !== m) showMenu(m); }); });
document.addEventListener('click', hideMenu); addEventListener('keydown', e => { if (e.key === 'Escape') hideMenu(); });
const clock = $('clock'), fmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const tickClock = () => { clock.textContent = fmt.format(new Date()).replace(',', ''); }; tickClock(); setInterval(tickClock, 15000);

/* ---------- the wallpaper comes into focus under the cursor ---------- */
const wpS = $('wpS'), wpH = $('wpH'), ring = $('ring'); wpS.style.backgroundImage = $('wpSh').style.backgroundImage = `url(${IMG[6]})`;
const ptr = { x: innerWidth * .6, y: innerHeight * .5, tx: innerWidth * .6, ty: innerHeight * .5, last: 0, over: true }, wan = { x: 0, y: 0, next: 0 };
addEventListener('pointermove', e => { ptr.tx = e.clientX; ptr.ty = e.clientY; ptr.last = performance.now(); ptr.over = !e.target.closest('.win,.dock,.mbar,.dd,.ico'); }, { passive: true });
let lastEx = '';
/* ---------- the loop ---------- */
let prev = performance.now();
function frame(now) { const dt = Math.min(.05, (now - prev) / 1000); prev = now; const T = now / 1000;
  if (TOUCH && now - ptr.last > 2200) { if (now > wan.next) { wan.next = now + 2200 + Math.random() * 2000; wan.x = innerWidth * (.12 + .76 * Math.random()); wan.y = innerHeight * (.18 + .55 * Math.random()); } ptr.tx = wan.x; ptr.ty = wan.y; ptr.over = true; }
  ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 8); ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 8);
  const R = SMALL() ? 62 : 85, on = ptr.over && ptr.y > 34 && !openMenu;
  ring.style.width = ring.style.height = R * 2 + 'px'; ring.style.margin = `${-R}px 0 0 ${-R}px`; ring.style.transform = `translate(${ptr.x}px,${ptr.y}px)`; ring.classList.toggle('on', on);
  wpH.style.clipPath = on ? `circle(${R}px at ${ptr.x.toFixed(1)}px ${ptr.y.toFixed(1)}px)` : 'circle(0 at 0 0)';
  if (on) { const a = APS[Math.round(clamp(ptr.x / innerWidth) * 7)], s = SHS[Math.round(clamp(ptr.y / innerHeight) * 6)]; if (a + s !== lastEx) { lastEx = a + s; $('exA').textContent = a; $('exS').textContent = s; } }
  rollTick(now, dt); storyTick(now, dt, RM ? 0 : T);
  requestAnimationFrame(frame); }
requestAnimationFrame(frame);
if (!SMALL()) setTimeout(() => openWin('about'), 700);
})();
