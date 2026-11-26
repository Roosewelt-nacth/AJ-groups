/* Bun Bun Cafe, "Open your box". No libraries. Edit business details in BUNBUN. Anything null shows "to be added". */
const BUNBUN = {
  whatsapp: '918807893624',            // AJ GROUPS business number for now; replace with Bun Bun's own (country code, no + or spaces)
  instagram: 'https://www.instagram.com/bun.bun.bakes/?hl=en', handle: '@bun.bun.bakes',
  fssai: null, location: null, noticeDays: 2,
  cats: [
    { id: 'b', name: 'Brownies', photo: 'stock/brownie-pour.webp', thumb: 'stock/brownie-plate-sq.webp', story: 'Rich, fudgy and made to be shared.', items: ['Nutella Brownie', 'Double Chocolate Brownie', 'Metro Chocolate Brownie'] },
    { id: 'w', name: 'Waffles', photo: 'stock/waffle.webp', thumb: 'stock/waffle-sq.webp', story: 'Warm, crisp and finished with chocolate.', items: ['White Chocolate Waffle', 'Triple Chocolate Waffle'] },
    { id: 'd', name: 'Desserts', photo: 'stock/flan.webp', thumb: 'stock/flan-sq.webp', story: 'Silky, chilled and made to be savoured.', items: ['Chocolate Mousse', 'Caramel Pudding'] },
    { id: 'c', name: 'Cakes', photo: null, story: 'Our cake collection is being finalised. We also create bespoke cakes for birthdays, anniversaries and special occasions.', items: [] },
    { id: 'x', name: 'Christmas', season: true, photo: 'stock/fruit-cake.webp', thumb: 'stock/fruit-cake-sq.webp', story: 'Rich plum cakes and Christmas hampers, baked for the season. Plum cakes come in half kg and 1 kg. The rum cake contains alcohol and is not for under-18s.',
      items: ['Rum-Soaked Plum Cake (Half kg)', 'Rum-Soaked Plum Cake (1 kg)', 'Non-Alcoholic Plum Cake (Half kg)', 'Non-Alcoholic Plum Cake (1 kg)', 'Christmas Hamper'] },
  ],
};

(() => {
  const B = BUNBUN, root = document.documentElement, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const season = root.classList.contains('season');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wa = (t) => 'https://wa.me/' + B.whatsapp + '?text=' + encodeURIComponent(t);
  const IMG = (p) => '../assets/bunbun/' + p;
  const NOTE = `Date needed: ______ (I know orders need ${B.noticeDays} days' notice)`;
  const cats = B.cats.filter((c) => !c.season || season), by = (id) => B.cats.find((c) => c.id === id);
  let lenis = null;
  const sel = {};                                              // category id -> Set of chosen items
  const count = () => Object.values(sel).reduce((n, s) => n + s.size, 0);
  const lines = () => Object.keys(sel).filter((k) => sel[k].size).map((k) => '• ' + by(k).name + ': ' + [...sel[k]].join(', '));
  const msg = (l) => wa(['Hi Bun Bun Cafe, I would like to order:'].concat(l, ['', NOTE]).join('\n'));

  /* ---------- the tray ---------- */
  $('#trayg').innerHTML = B.cats.map((c, i) => {
    const n = String(i + 1).padStart(2, '0');
    return c.photo
      ? `<button class="cp c-${c.id}" type="button" data-id="${c.id}"><img src="${IMG(c.photo)}" alt="" width="640" height="640" loading="lazy" decoding="async"><span class="cnt" aria-hidden="true">0</span><span class="lab"><span><span class="no">${n}</span><h3>${esc(c.name)}</h3></span><span class="go" aria-hidden="true">&rarr;</span></span></button>`
      : `<button class="cp c-${c.id}" type="button" data-id="${c.id}"><i class="mk big" aria-hidden="true"></i><span class="cnt" aria-hidden="true">0</span><span class="lab"><span><span class="no">${n}</span><h3>${esc(c.name)}</h3></span><span class="go" aria-hidden="true">&rarr;</span></span></button>`;
  }).join('');

  /* ---------- the sheet ---------- */
  const sheet = $('#sheet'), sChk = $('#sChk'); let cur = null;
  const upd = () => { const n = count(); $('#bn').textContent = n; $('#bx').classList.toggle('on', n > 0); $('#eq').href = msg(lines());
    $$('.cp[data-id]').forEach((b) => { const k = sel[b.dataset.id] ? sel[b.dataset.id].size : 0; b.classList.toggle('has', k > 0); $('.cnt', b).textContent = k; });
    if (cur) $('#sGo').href = cur.items.length ? msg(sel[cur.id] && sel[cur.id].size ? ['• ' + cur.name + ': ' + [...sel[cur.id]].join(', ')] : ['• ' + cur.name + ': selection to be discussed']) : wa('Hi Bun Bun Cafe, I would like to ask about a bespoke cake.\n\nOccasion:\nFlavour and size:\n' + NOTE); };
  const bump = () => { const b = $('#bx'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); };
  const openSheet = (id) => { cur = by(id); const c = cur, i = B.cats.indexOf(c);
    if (c.photo) $('#sImg').src = IMG(c.photo); $('.sp', sheet).classList.toggle('nophoto', !c.photo); $('#sImg').alt = c.photo ? c.name : ''; $('#sNo').textContent = String(i + 1).padStart(2, '0'); $('#sTitle').textContent = c.name; $('#sText').textContent = c.story;
    $('#sLb').hidden = !c.items.length; sChk.innerHTML = c.items.map((x) => `<label><input type="checkbox" value="${esc(x)}"${sel[c.id] && sel[c.id].has(x) ? ' checked' : ''}>${esc(x)}</label>`).join('');
    $('#sGo').textContent = c.items.length ? 'Enquire on WhatsApp' : 'Enquire about a bespoke cake';
    upd(); show(sheet); };
  $('#trayg').addEventListener('click', (e) => { const b = e.target.closest('.cp'); if (b) openSheet(b.dataset.id); });
  sChk.addEventListener('change', (e) => { const s = sel[cur.id] || (sel[cur.id] = new Set()); e.target.checked ? s.add(e.target.value) : s.delete(e.target.value); upd(); bump(); if (e.target.checked) pop(e.target); });
  let opener = null;
  function show(d) { opener = document.activeElement; root.classList.add('modal'); if (lenis) lenis.stop(); d.classList.remove('closing'); d.showModal(); }
  const hide = (d) => { if (!d.open || d.classList.contains('closing')) return; if (RM) { d.close(); return; } d.classList.add('closing'); setTimeout(() => { d.classList.remove('closing'); d.close(); }, 260); };
  $$('dialog').forEach((d) => { d.addEventListener('close', () => { root.classList.remove('modal'); if (lenis && opened) lenis.start(); if (opener && opener.focus) opener.focus({ preventScroll: true }); });
    d.addEventListener('cancel', (e) => { e.preventDefault(); hide(d); }); d.addEventListener('click', (e) => { if (e.target === d) hide(d); }); });
  $$('dialog [data-close]').forEach((b) => b.addEventListener('click', () => hide(b.closest('dialog'))));
  $('#clr').addEventListener('click', () => { Object.keys(sel).forEach((k) => delete sel[k]); upd(); });

  /* a tiny burst of crumbs when you add something */
  const pop = (el) => { const host = el.closest('dialog') || document.body, hr = host === document.body ? { left: 0, top: 0 } : host.getBoundingClientRect(), r0 = el.parentElement.getBoundingClientRect(), r = { left: r0.left - hr.left, top: r0.top - hr.top + (host === document.body ? 0 : host.scrollTop), width: r0.width, height: r0.height }; for (let i = 0; i < 8; i++) { const d = document.createElement('i'); d.style.cssText = `position:${host === document.body ? 'fixed' : 'absolute'};z-index:300;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:7px;height:7px;border-radius:50%;background:#4a442c;pointer-events:none`; host.append(d);
    const a = Math.random() * 6.28, k = 30 + Math.random() * 40; d.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * k}px,${Math.sin(a) * k - 20}px) scale(.2)`, opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => d.remove(); } };

  /* ---------- details ---------- */
  $$('[data-wa]').forEach((a) => { a.href = wa('Hi Bun Bun Cafe, I would like to place an order.'); });
  $$('[data-fill]').forEach((el) => { const k = el.dataset.fill;
    if (k === 'fssai') el.textContent = B.fssai || 'to be added';
    if (k === 'location') el.textContent = B.location || 'Location to be added';
    if (k === 'wa-number') el.textContent = '+' + B.whatsapp.replace(/^(\d{2})(\d{5})(\d+)$/, '$1 $2 $3');
    if (k === 'instagram') { if (B.instagram) el.href = B.instagram; else { el.removeAttribute('href'); $('b', el).textContent = 'Link coming soon'; } } });
  upd();

  /* ---------- the lid ---------- */
  const lid = $('#lid'), seal = $('#seal'); let opened = root.classList.contains('opened');
  const openBox = () => { if (opened) return; opened = true; lid.style.removeProperty('--d'); lid.classList.add('open'); $$('.half', lid).forEach((h) => { h.style.transform = ''; });
    setTimeout(() => root.classList.add('opened'), RM ? 0 : 380); scrollTo(0, 0); setTimeout(startMotion, RM ? 0 : 1900); };
  if (opened) { lid.style.display = 'none'; setTimeout(startMotion, 0); }
  if (season) { $('textPath', lid).textContent = 'OPEN YOUR CHRISTMAS BOX · BUN BUN CAFE · '; $('.tag', lid).textContent = 'Christmas editions are here'; }
  seal.addEventListener('click', () => { if (!dragged) openBox(); });
  let sx = 0, dragging = false, dragged = false;
  seal.addEventListener('pointerdown', (e) => { dragging = true; dragged = false; sx = e.clientX; seal.setPointerCapture(e.pointerId); });
  seal.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = Math.abs(e.clientX - sx); if (dx > 6) dragged = true; const h = $$('.half', lid); h[0].style.transition = h[1].style.transition = 'none'; h[0].style.transform = `translateX(${-dx * .5}px)`; h[1].style.transform = `translateX(${dx * .5}px)`; if (dx > 90) { dragging = false; h.forEach((x) => { x.style.transition = ''; }); openBox(); } });
  const endDrag = () => { if (!dragging) return; dragging = false; $$('.half', lid).forEach((h) => { h.style.transition = ''; h.style.transform = ''; }); setTimeout(() => { dragged = false; }, 50); };
  seal.addEventListener('pointerup', endDrag); seal.addEventListener('pointercancel', endDrag);
  if (FINE) $('.hint .d', lid).textContent = 'Click'; else $('.hint .d', lid).textContent = 'Tap';
  addEventListener('keydown', (e) => { if (!opened && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openBox(); } });

  /* gentle reveals */
  $$('.th, .about h2, .about .two p, .who, .lic, .contact h2, .cc').forEach((el) => el.classList.add('rv'));
  $$('.cp').forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--dl', (i % 3) * .08 + 's'); });
  const GS = !RM && !!(window.gsap && window.ScrollTrigger);
  if (RM || !('IntersectionObserver' in window)) $$('.rv').forEach((el) => el.classList.add('in'));
  else if (GS) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.batch('.rv', { start: 'top 88%', once: true, onEnter: (els) => els.forEach((el, i) => { el.style.setProperty('--dl', i * .09 + 's'); el.classList.add('in'); }) }); }
  else { const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -10% 0px' }); $$('.rv').forEach((el) => io.observe(el)); }
  /* the treats drift away from the pointer, a little */
  if (FINE && !RM) { const ins = $('.inside'), fls = $$('.fl', ins); let raf = 0, mx = 0, my = 0;
    ins.addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; if (!raf) raf = requestAnimationFrame(() => { raf = 0; fls.forEach((f, k) => { const d = (k + 1) * 14; f.style.setProperty('--px', (-mx * d) + 'px'); f.style.setProperty('--py', (-my * d) + 'px'); }); }); }); }

  /* the bar steps aside on the way down */
  const top = $('#top'); let ly = 0; addEventListener('scroll', () => { const y = scrollY; top.classList.toggle('hide', y > ly && y > 240); ly = y; }, { passive: true });
  document.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href') === '#') return; const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); if (lenis) lenis.scrollTo(t, { duration: 1.4 }); else t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); } });


  /* ---------- Lenis smooth scroll + GSAP ScrollTrigger scenes (after the box is open) ---------- */
  function startMotion() {
    root.classList.add('settled');
    if (RM || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis && !lenis) { lenis = new Lenis({ lerp: .1, wheelMultiplier: .9, touchMultiplier: 1.4 }); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    const ins = $('.inside');
    /* the inside of the box: the headline sinks back and the treats drift up as you leave */
    gsap.to('.inside h1', { yPercent: 38, opacity: .15, scale: .94, ease: 'none', scrollTrigger: { trigger: ins, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to(['.inside .lead', '.inside .notice', '.inside .eyebrow'], { y: -60, opacity: 0, ease: 'none', scrollTrigger: { trigger: ins, start: 'top top', end: '60% top', scrub: true } });
    $$('.fl', ins).forEach((f, k) => gsap.to(f, { y: -(140 + k * 90), rotate: k % 2 ? 8 : -8, ease: 'none', scrollTrigger: { trigger: ins, start: 'top top', end: 'bottom top', scrub: true } }));
    /* the tray: the heading drifts sideways, every photo has its own depth */
    gsap.fromTo('.th h2', { xPercent: 3 }, { xPercent: -3, ease: 'none', scrollTrigger: { trigger: '.trayw', start: 'top bottom', end: 'bottom top', scrub: true } });
    $$('.cp img').forEach((im) => gsap.fromTo(im, { yPercent: -7, scale: 1.14 }, { yPercent: 7, scale: 1.14, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    $$('.cp .big').forEach((m) => gsap.fromTo(m, { rotate: -10 }, { rotate: 10, ease: 'none', scrollTrigger: { trigger: m.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    /* about: the founder's name slides in, the pills follow one by one */
    gsap.from('.about .pills li', { y: 30, opacity: 0, stagger: .07, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.about .pills', start: 'top 90%', once: true } });
    /* the ribbon ties itself around the footer */
    gsap.fromTo('.rib', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.ft', start: 'top bottom', end: 'top 55%', scrub: true } });
    gsap.fromTo('.rib b', { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, ease: 'back.out(2)', duration: .8, scrollTrigger: { trigger: '.ft', start: 'top 60%', once: true } });
    /* the bar follows Lenis' direction */
    if (lenis) lenis.on('scroll', ({ direction, scroll }) => top.classList.toggle('hide', direction > 0 && scroll > 240));
    addEventListener('load', () => ScrollTrigger.refresh());
    ScrollTrigger.refresh();
  }

  /* ---------- the mascot cursor (laptops) and the tap pop (phones) ---------- */
  const cu = $('#cur'); let tx = 0, ty = 0, x = 0, y = 0, run = false;
  if (FINE) { root.classList.add('fine'); cu.querySelector('span').textContent = 'Open';
    const loop = () => { x += (tx - x) * .22; y += (ty - y) * .22; cu.style.setProperty('--x', x + 'px'); cu.style.setProperty('--y', y + 'px'); if (Math.abs(tx - x) + Math.abs(ty - y) > .1) requestAnimationFrame(loop); else run = false; };
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; if (!root.classList.contains('moved')) { root.classList.add('moved'); x = tx; y = ty; } if (!run) { run = true; requestAnimationFrame(loop); }
      const t = e.target; cu.classList.toggle('dish', !!t.closest('.cp') || !!t.closest('.seal')); cu.classList.toggle('btn', !t.closest('.cp') && !!t.closest('a,button,label')); }, { passive: true });
    document.addEventListener('pointerleave', () => root.classList.remove('moved')); }
  else addEventListener('pointerdown', (e) => { if (e.target.closest('.seal')) return; const p = document.createElement('div'); p.className = 'tp'; p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px'; p.innerHTML = '<i class="mk"></i>'; document.body.append(p); setTimeout(() => p.remove(), 850); }, { passive: true });

  /* ---------- the share card (canvas) ---------- */
  const cardD = $('#cardD'), cv = $('#cv'), cx = cv.getContext('2d');
  const G = '#4a442c', C = '#f8f2e4';
  const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  const wrap = (t, mw) => { const w = t.split(' '), out = []; let l = ''; w.forEach((x) => { const n = l ? l + ' ' + x : x; if (cx.measureText(n).width > mw && l) { out.push(l); l = x; } else l = n; }); if (l) out.push(l); return out; };
  const drawCard = async () => {
    await Promise.all([document.fonts.load('300 100px Fraunces'), document.fonts.load('italic 300 100px Fraunces'), document.fonts.load('500 40px "DM Sans"')]).catch(() => {});
    const used = Object.keys(sel).filter((k) => sel[k].size);
    const photos = (await Promise.all(used.map((k) => by(k).thumb ? load(IMG(by(k).thumb)) : null))).filter(Boolean).slice(0, 3), mark = await load(IMG('logo-mark.png'));
    const picks = used.flatMap((k) => [...sel[k]]);
    const W = 1080, Hc = 1350;
    cx.clearRect(0, 0, W, Hc); cx.fillStyle = G; cx.fillRect(0, 0, W, Hc);
    /* soft tissue lines, like the inside of the box */
    cx.save(); cx.globalAlpha = .06; cx.strokeStyle = C; cx.lineWidth = 1; for (let i = -Hc; i < W; i += 46) { cx.beginPath(); cx.moveTo(i, 0); cx.lineTo(i + Hc * .47, Hc); cx.stroke(); } cx.restore();
    /* the ribbon across the top, with the seal */
    cx.fillStyle = C; cx.globalAlpha = .12; cx.fillRect(0, 150, W, 44); cx.globalAlpha = 1;
    cx.beginPath(); cx.arc(W / 2, 172, 92, 0, 6.2832); cx.fillStyle = C; cx.fill();
    if (mark) { const oc = document.createElement('canvas'); oc.width = oc.height = 240; const o = oc.getContext('2d'); o.drawImage(mark, 0, 0, 240, 240); o.globalCompositeOperation = 'source-in'; o.fillStyle = G; o.fillRect(0, 0, 240, 240); cx.drawImage(oc, W / 2 - 52, 120, 104, 104); }
    /* frame */
    cx.strokeStyle = C; cx.globalAlpha = .3; cx.lineWidth = 2; cx.beginPath(); cx.roundRect(36, 36, W - 72, Hc - 72, 44); cx.stroke(); cx.globalAlpha = 1;
    /* title */
    cx.fillStyle = C; cx.textAlign = 'center';
    cx.font = '500 24px "DM Sans", sans-serif'; if ('letterSpacing' in cx) cx.letterSpacing = '9px'; cx.globalAlpha = .75; cx.fillText(season ? 'BUN BUN CAFE · CHRISTMAS' : 'BUN BUN CAFE', W / 2, 330); cx.globalAlpha = 1; if ('letterSpacing' in cx) cx.letterSpacing = '0px';
    cx.font = '300 120px Fraunces, Georgia, serif'; cx.fillText('My Bun Bun', W / 2, 462);
    cx.font = 'italic 300 120px Fraunces, Georgia, serif'; cx.globalAlpha = .62; cx.fillText('box.', W / 2, 578); cx.globalAlpha = 1;
    /* picks as pills, centred rows */
    cx.font = '500 32px "DM Sans", sans-serif'; const ph = 66, padX = 30, gap = 16, maxW = W - 180, shown = picks.slice(0, 9), more = picks.length - shown.length;
    const pills = shown.map((t) => ({ t, w: Math.min(maxW, cx.measureText(t).width + padX * 2) })); if (more > 0) pills.push({ t: '+' + more + ' more', w: cx.measureText('+' + more + ' more').width + padX * 2 });
    const rows = []; let row = [], rw = 0; pills.forEach((p) => { if (row.length && rw + gap + p.w > maxW) { rows.push(row); row = []; rw = 0; } rw += (row.length ? gap : 0) + p.w; row.push(p); }); if (row.length) rows.push(row);
    let y = 650; rows.slice(0, 4).forEach((r) => { const tw = r.reduce((s, p) => s + p.w, 0) + gap * (r.length - 1); let x = W / 2 - tw / 2;
      r.forEach((p) => { cx.beginPath(); cx.roundRect(x, y, p.w, ph, ph / 2); cx.strokeStyle = C; cx.globalAlpha = .55; cx.lineWidth = 2; cx.stroke(); cx.globalAlpha = 1; cx.fillStyle = C; cx.fillText(p.t, x + p.w / 2, y + 44, p.w - padX); x += p.w + gap; }); y += ph + 16; });
    /* dish photos, overlapping like treats in a row */
    const r = 112, n = photos.length, step = r * 1.55, x0 = W / 2 - (step * (n - 1)) / 2, cy = Math.max(y + 150, 1060);
    photos.forEach((p, k) => { const px = x0 + k * step; cx.beginPath(); cx.arc(px, cy, r + 10, 0, 6.2832); cx.fillStyle = G; cx.fill(); cx.save(); cx.beginPath(); cx.arc(px, cy, r, 0, 6.2832); cx.clip(); cx.drawImage(p, px - r, cy - r, r * 2, r * 2); cx.restore(); cx.beginPath(); cx.arc(px, cy, r, 0, 6.2832); cx.strokeStyle = C; cx.lineWidth = 3; cx.stroke(); });
    /* footer */
    cx.fillStyle = C; cx.font = '500 28px "DM Sans", sans-serif'; cx.globalAlpha = .8; cx.fillText('Baked fresh · Made to order · ' + B.handle, W / 2, Hc - 92); cx.globalAlpha = 1; };
  $('#mk').addEventListener('click', async () => { await drawCard(); show(cardD); });
  $('#cSave').addEventListener('click', () => { cv.toBlob(async (b) => { if (!b) return; const f = new File([b], 'my-bun-bun-box.png', { type: 'image/png' });
    try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'My Bun Bun box', text: 'I am treating myself to Bun Bun Cafe ' + B.handle }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'my-bun-bun-box.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png'); });
})();
