/* Bun Bun Cafe, the satin ribbon. No libraries.
   One ribbon hangs from the top of the page and flows down the margin through every chapter, then runs across the footer and ties a bow.
   It reads each chapter's real margin, so it never crowds the content; it is painted behind all content (canvas z-index 1, content z-index 2),
   takes the contrasting colour of each chapter, turns slowly like satin, catches a soft travelling sheen, and draws itself as you scroll.
   The landing keeps its slogans with thin lines to the ring (the helix is gone). */
(() => {
  const cv = document.getElementById('ribbon'); if (!cv) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const g = cv.getContext('2d'), fig = $('.fig'), disc = $('.disc'), lsvg = $('#leaders'), NS = 'http://www.w3.org/2000/svg', RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2, cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); }, lerp = (a, b, t) => a + (b - a) * t;
  const back = (x) => { x = cl(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const pr = (el) => { let x = 0, y = 0, e = el; while (e) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; };
  const shown = (el) => !!el && getComputedStyle(el).display !== 'none';
  /* a long, unhurried S: two slow waves on top of each other, so it never repeats visibly */
  const sway = (y) => .72 * Math.sin(y * TAU / 1150 + .6) + .28 * Math.sin(y * TAU / 470 + 2.1);
  const twist = (s) => .42 + .58 * Math.pow(Math.abs(Math.cos(s * TAU / 1900 + .4)), .7);

  let VW = 0, VH = 0, dpr = 1, on = false, raf = 0, timer = 0, armed = false, S = [], M = [], RV = [], KN = [], FBOW = null;
  const LN = [], T0 = performance.now();

  /* the slogans: a thin line from each number to the ring, as before */
  function leaders() {
    if (!lsvg || !fig || !disc || innerWidth <= 1100) return;
    const d = pr(disc), cx = d.x + d.w / 2, cy = d.y + d.h / 2, R = d.w / 2 * 1.025;
    $$('.co', fig).filter(shown).forEach((co, i) => { const n = $('.n', co); if (!n) return; const r = pr(n), x = r.x + r.w / 2, y = r.y + r.h / 2, rr = r.w / 2;
      let o = LN[i]; if (!o) { o = LN[i] = { ln: document.createElementNS(NS, 'line'), dt: document.createElementNS(NS, 'circle') }; o.dt.setAttribute('r', 3.2); o.ln.style.setProperty('--i', i); o.dt.style.setProperty('--i', i); lsvg.append(o.ln, o.dt); }
      const a = Math.atan2(y - cy, x - cx), ux = Math.cos(a), uy = Math.sin(a), ex = cx - ux * -R, ey = cy + uy * R, x1 = x - ux * rr, y1 = y - uy * rr;
      o.ln.setAttribute('x1', x1.toFixed(1)); o.ln.setAttribute('y1', y1.toFixed(1)); o.ln.setAttribute('x2', ex.toFixed(1)); o.ln.setAttribute('y2', ey.toFixed(1)); o.ln.style.setProperty('--len', Math.ceil(Math.hypot(ex - x1, ey - y1)) + 6);
      o.dt.setAttribute('cx', ex.toFixed(1)); o.dt.setAttribute('cy', ey.toFixed(1)); });
    if (!armed && LN.length) { armed = true; lsvg.classList.add('go'); setTimeout(() => lsvg.classList.add('static'), 4600); }
  }

  function measure() {
    leaders();
    on = innerWidth >= 700; cv.style.display = on ? '' : 'none'; if (!on) { M = []; return; }
    VW = innerWidth; VH = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    cv.style.width = VW + 'px'; cv.style.height = VH + 'px'; cv.width = Math.round(VW * dpr); cv.height = Math.round(VH * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* chapters: top, free margin on the left, and the two palette colours (read from the variables, never mid-fade) */
    const col = (el) => { const cs = getComputedStyle(el); return { fg: cs.getPropertyValue('--g').trim() || cs.color, bg: cs.getPropertyValue('--c').trim() || cs.backgroundColor }; };
    const padL = (sel) => { const w = $(sel); return shown(w) ? pr(w).x + parseFloat(getComputedStyle(w).paddingLeft || 0) : 40; };
    const ft = $('.ft'), ftr = shown(ft) ? pr(ft) : null; S = [];
    const add = (el, L) => { if (!shown(el)) return; const r = pr(el), m = Math.max(14, L), W = cl(m * .2, 6, 12); S.push(Object.assign({ el, top: r.y, xc: m * .5, W, amp: Math.max(0, m * .5 - W / 2 - 8) }, col(el))); };
    const v1 = fig && $('.v1', fig); if (fig) add(fig, v1 ? pr(v1).x : VW * .14);
    add($('#intro'), padL('#intro .wrap')); add($('#seasonal'), padL('#seasonal .wrap')); add($('#tray'), (() => { const t = $('.th'); return t ? pr(t).x : 56; })());
    add($('#about'), padL('#about .wrap')); add($('#contact'), padL('#contact .wrap')); if (ftr) add(ft, padL('.ft .fw'));
    S.sort((a, b) => a.top - b.top); if (!S.length) return;
    /* between chapters the margin, width and swing ease over 360 px, so the ribbon glides from one to the next */
    const B = (y) => { let k = 0; for (let i = 0; i < S.length; i++) if (y >= S[i].top - 180) k = i; const s = S[k], p = S[k - 1]; if (!p) return s;
      const t = sm((y - (s.top - 180)) / 360); return { xc: lerp(p.xc, s.xc, t), amp: lerp(p.amp, s.amp, t), W: lerp(p.W, s.W, t) }; };
    const secIdx = (y) => { let k = 0; for (let i = 0; i < S.length; i++) if (y >= S[i].top) k = i; return k; };
    const P = [], A = (x, y, k, W) => P.push({ x, y, k, W });
    const yEnd = ftr ? ftr.y + 58 : document.documentElement.scrollHeight - 40, ff = 64;
    for (let y = -40; y <= yEnd - ff; y += 3) { const b = B(y); A(b.xc + b.amp * sway(y), y, 0, b.W); }
    if (ftr) { const l = P[P.length - 1], n = Math.ceil(ff * Math.PI / 2 / 3);
      for (let i = 1; i <= n; i++) { const a = Math.PI - (Math.PI / 2) * i / n; A(l.x + ff + ff * Math.cos(a), yEnd - ff + ff * Math.sin(a), 1, lerp(l.W, 14, i / n)); }
      let bi = -1; for (let x = P[P.length - 1].x + 3; x <= VW + 40; x += 3) { A(x, yEnd + 2.5 * Math.sin(x / 140), 1, 14); if (bi < 0 && x >= VW / 2) bi = P.length - 1; }
      FBOW = { idx: bi, x: VW / 2, y: yEnd };
    } else FBOW = null;
    let s = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[i - 1]; if (q) s += Math.hypot(p.x - q.x, p.y - q.y); p.s = s; }
    for (let i = 0; i < P.length; i++) { const a = P[Math.max(0, i - 2)], b = P[Math.min(P.length - 1, i + 2)], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, p = P[i];
      p.nx = -dy / l; p.ny = dx / l; p.tw = p.k ? .85 + .15 * twist(p.s) : twist(p.s); p.hw = p.W / 2 * p.tw; p.si = secIdx(p.y); }
    M = P; RV = []; { let mx = -1e9, cum = 0; for (let i = 0; i < M.length; i++) { const p = M[i], q = M[i - 1]; if (q && p.k) cum += Math.abs(p.x - q.x); mx = Math.max(mx, p.y + .14 * cum); RV[i] = mx; } }
    KN = []; for (let i = 1; i < S.length; i++) { const idx = M.findIndex((p) => p.y >= S[i].top); if (idx > 0) KN.push({ idx, a: i - 1, b: i }); }
    if (FBOW) FBOW.si = S.length - 1;
    draw(performance.now());
  }

  const ub = (arr, v) => { let lo = 0, hi = arr.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m] <= v) { r = m; lo = m + 1; } else hi = m - 1; } return r; };
  const bow = (x, y, s, fg, bg) => { if (s <= .02) return; g.save(); g.translate(x, y); g.scale(s, s);
    const ear = (m) => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(m * 18, -28, m * 56, -32, m * 60, -8); g.bezierCurveTo(m * 62, 12, m * 28, 14, 0, 0); g.closePath(); g.fillStyle = fg; g.fill();
      g.strokeStyle = bg; g.globalAlpha = .45; g.lineWidth = 1.3; g.beginPath(); g.moveTo(m * 8, -3); g.bezierCurveTo(m * 24, -20, m * 45, -20, m * 50, -7); g.stroke(); g.globalAlpha = 1; };
    ear(-1); ear(1); g.beginPath(); g.ellipse(0, 0, 9, 8, 0, 0, TAU); g.fillStyle = fg; g.fill(); g.restore(); };

  function draw(now) {
    if (!on || !M.length) return;
    const t = (now - T0) / 1000, sy = scrollY; g.clearRect(0, 0, VW, VH);
    const strip = (i, j, a, b) => { g.beginPath(); for (let k = i; k <= j; k++) { const p = M[k]; const x = p.x + p.nx * p.hw * a, y = p.y + p.ny * p.hw * a - sy; k === i ? g.moveTo(x, y) : g.lineTo(x, y); }
      for (let k = j; k >= i; k--) { const p = M[k]; g.lineTo(p.x + p.nx * p.hw * b, p.y + p.ny * p.hw * b - sy); } g.closePath(); };
    /* drawn as far as the reader has scrolled; on the first screen it lowers itself in from the top */
    let idx = ub(RV, sy + VH * .88); if (!RM) idx = Math.min(idx, ub(RV, -40 + (VH * .88 + 40) * sm((t - .3) / 2.2) + Math.max(0, sy)));
    const lo = sy - 30, hi = sy + VH + 30, n = Math.min(M.length - 1, idx);
    for (let i = 0; i <= n;) { if (M[i].y < lo || M[i].y > hi) { i++; continue; } let j = i; while (j < n && M[j + 1].y >= lo && M[j + 1].y <= hi) j++;
      for (let a = i; a < j; a += 10) { const b = Math.min(j, a + 11), m = M[(a + b) >> 1], c = S[m.si] || S[0];
        strip(a, b, 1, -1); g.fillStyle = c.fg; g.fill();
        /* satin: a soft light band that travels slowly along the ribbon, brighter where it lies flat */
        strip(a, b, .7, .05); g.fillStyle = c.bg; g.globalAlpha = (.08 + .2 * m.tw) * (.55 + .45 * Math.sin((m.s - t * 90) / 70)); g.fill(); g.globalAlpha = 1; }
      i = j + 1; }
    /* small two-tone knots where one chapter hands the ribbon to the next */
    KN.forEach((k) => { if (k.idx > idx) return; const p = M[k.idx], y = p.y - sy; if (y < -30 || y > VH + 30) return; const a = S[k.a], b = S[k.b], r = p.W * .55 + 2.5;
      g.beginPath(); g.arc(p.x, y, r, 0, TAU); g.fillStyle = a.fg; g.fill(); g.lineWidth = 2; g.strokeStyle = b.fg; g.stroke(); });
    if (FBOW && FBOW.idx >= 0 && idx >= FBOW.idx) { const c = S[FBOW.si], q = cl((M[idx].s - M[FBOW.idx].s + 40) / 170); bow(FBOW.x, FBOW.y - sy, RM ? 1 : back(q), c.fg, c.bg); }
  }

  const frame = (now) => { raf = 0; if (!on) return; draw(now); if (!RM && !document.hidden) raf = requestAnimationFrame(frame); };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const remeasure = (ms) => { clearTimeout(timer); timer = setTimeout(() => { measure(); kick(); }, ms); };
  measure(); kick();
  addEventListener('scroll', kick, { passive: true }); addEventListener('resize', () => remeasure(140));
  document.addEventListener('visibilitychange', kick); addEventListener('load', () => remeasure(60));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => remeasure(30));
  [900, 2800, 5600].forEach((ms) => setTimeout(() => { measure(); kick(); }, ms));
  if ('ResizeObserver' in window) { let h = document.documentElement.scrollHeight; new ResizeObserver(() => { const nh = document.documentElement.scrollHeight; if (Math.abs(nh - h) > 2) { h = nh; remeasure(120); } }).observe(document.body); }
  addEventListener('lookchange', () => { remeasure(60); setTimeout(() => { measure(); kick(); }, 800); });
})();
