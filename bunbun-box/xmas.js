/* Seasonal Editions, Christmas experiment (review copy only): lights, holly, light snow. */
(function () {
  const sec = document.getElementById('seasonal'); if (!sec || getComputedStyle(sec).display === 'none') return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cols = ['#9e2b35', '#d2b273', '#f8f2e4'];

  /* string of lights */
  const xl = document.createElement('div'); xl.className = 'xl'; xl.setAttribute('aria-hidden', 'true');
  let d = 'M0 6', dots = ''; const n = 22;
  for (let i = 0; i < n; i++) { const x0 = i * 100 / n, x1 = (i + 1) * 100 / n, xm = (x0 + x1) / 2; d += ` Q${xm} 22 ${x1} 6`; dots += `<circle cx="${xm}" cy="15" r="1.3" fill="${cols[i % 3]}"/>`; }
  xl.innerHTML = `<svg viewBox="0 0 100 30" preserveAspectRatio="none"><path d="${d}" vector-effect="non-scaling-stroke"/>${dots}</svg>`;
  sec.prepend(xl);

  /* holly sprig */
  const h = document.createElement('div'); h.className = 'xholly'; h.setAttribute('aria-hidden', 'true');
  h.innerHTML = '<svg viewBox="0 0 120 90"><path d="M60 50C44 26 22 22 6 30c10 4 12 12 8 20 8-4 16-2 20 6 2-10 12-10 26-6z" fill="#2f5a3f" stroke="#d2b273" stroke-width="1.2"/><path d="M60 50c16-24 38-28 54-20-10 4-12 12-8 20-8-4-16-2-20 6-2-10-12-10-26-6z" fill="#3a6b4b" stroke="#d2b273" stroke-width="1.2"/><circle cx="54" cy="54" r="7" fill="#9e2b35"/><circle cx="66" cy="56" r="7" fill="#b03440"/><circle cx="60" cy="64" r="7" fill="#8c2430"/></svg>';
  sec.prepend(h);

  /* light snow while the chapter is on screen */
  if (RM) return;
  const cv = document.createElement('canvas'); cv.className = 'xsnow'; cv.setAttribute('aria-hidden', 'true'); sec.prepend(cv);
  const cx = cv.getContext('2d'); let W = 0, H = 0, fl = [], on = false, raf = 0;
  const size = () => { const r = sec.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); const k = Math.round(Math.min(90, W * H / 14000)); fl = Array.from({ length: k }, () => ({ x: Math.random() * W, y: Math.random() * H, r: .8 + Math.random() * 2, v: .25 + Math.random() * .6, s: Math.random() * 6 })); };
  const tick = (t) => { cx.clearRect(0, 0, W, H); cx.fillStyle = 'rgba(248,242,228,.75)'; for (const f of fl) { f.y += f.v; f.x += Math.sin(t / 1600 + f.s) * .25; if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; } cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, 6.283); cx.fill(); } if (on) raf = requestAnimationFrame(tick); };
  size(); addEventListener('resize', size);
  new IntersectionObserver((es) => { on = es[0].isIntersecting; cancelAnimationFrame(raf); if (on) raf = requestAnimationFrame(tick); }).observe(sec);
})();
