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
    { id: 'x', name: 'Christmas', season: true, photo: 'stock/fruit-cake.webp', thumb: 'stock/fruit-cake-sq.webp', story: 'Plum cakes and Christmas hampers for the season.', items: [] },
  ],
  /* Seasonal Editions (until 1 Jan 2027): one plum cake with a choice of type and size, and the hamper builder.
     Add, remove or rename a type here; the card, the box and the WhatsApp message follow. */
  plum: { name: 'Christmas Plum Cake', photo: 'stock/fruit-cake.webp', sizes: ['Half kg', '1 kg'],
    intro: 'Our festive plum cake, baked whole and made to order. Choose how you would like it.',
    types: [
      { label: 'Rum-soaked', item: 'Rum-Soaked Plum Cake', tag: 'Contains alcohol (rum). Not for under-18s.',
        desc: 'A festive classic prepared with carefully selected ingredients and rum-soaked fruits, bringing together the rich and traditional flavours of Christmas.' },
      { label: 'Non-alcoholic', item: 'Non-Alcoholic Plum Cake', tag: 'Prepared without alcohol',
        desc: 'Enjoy the traditional festive plum cake experience with our non-alcoholic version.' },
    ] },
  hamper: { sizes: ['Petite', 'Classic', 'Grand'], items: ['Plum cake', 'Brownies', 'Caramel pudding', 'Waffles', 'Chocolate mousse'] },
  christmas: [2026, 11, 25],                                              // month is 0-based
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
  $('#trayg').addEventListener('click', (e) => { const b = e.target.closest('.cp'); if (!b) return; if (b.dataset.id === 'x') { const t = $('#seasonal'); if (lenis) lenis.scrollTo(t, { duration: 1.4 }); else t.scrollIntoView({ behavior: 'smooth' }); return; } openSheet(b.dataset.id); });
  sChk.addEventListener('change', (e) => { const s = sel[cur.id] || (sel[cur.id] = new Set()); e.target.checked ? s.add(e.target.value) : s.delete(e.target.value); upd(); bump(); if (e.target.checked) pop(e.target); });
  let opener = null;
  function show(d) { opener = document.activeElement; root.classList.add('modal'); if (lenis) lenis.stop(); d.classList.remove('closing'); d.showModal(); }
  const hide = (d) => { if (!d.open || d.classList.contains('closing')) return; if (RM) { d.close(); return; } d.classList.add('closing'); setTimeout(() => { d.classList.remove('closing'); d.close(); }, 260); };
  $$('dialog').forEach((d) => { d.addEventListener('close', () => { root.classList.remove('modal'); if (lenis && opened) lenis.start(); if (opener && opener.focus) opener.focus({ preventScroll: true }); });
    d.addEventListener('cancel', (e) => { e.preventDefault(); hide(d); }); d.addEventListener('click', (e) => { if (e.target === d) hide(d); }); });
  $$('dialog [data-close]').forEach((b) => b.addEventListener('click', () => hide(b.closest('dialog'))));
  $('#clr').addEventListener('click', () => { Object.keys(sel).forEach((k) => delete sel[k]); upd(); });


  /* ---------- Seasonal Editions: plum cakes by weight and the hamper builder, both go into the box ---------- */
  const seg = (s) => `<div class="seg" role="group" aria-label="Size">${s.map((x, k) => `<button type="button" data-s="${esc(x)}" aria-pressed="${k === 0}">${esc(x)}</button>`).join('')}</div>`;
  const addX = (txt) => { const s = sel.x || (sel.x = new Set()); s.add(txt); upd(); bump(); };
  const flash = (b, t) => { const o = b.textContent; b.textContent = t; b.classList.add('added'); setTimeout(() => { b.textContent = o; b.classList.remove('added'); }, 1400); };
  if (season && $('#plums')) {
    const P = B.plum;
    $('#plums').innerHTML = `<article class="pc one rv"><div class="ph"><img src="${IMG(P.photo)}" alt="${esc(P.name)}" loading="lazy" decoding="async"></div>
      <div class="bd"><span class="tg" id="pTag">${esc(P.types[0].tag)}</span><h3>${esc(P.name)}</h3><p class="pin">${esc(P.intro)}</p>
        <div class="opt"><span class="lb">Type</span><div class="seg type" role="group" aria-label="Type">${P.types.map((t, k) => `<button type="button" data-t="${k}" aria-pressed="${k === 0}">${esc(t.label)}</button>`).join('')}</div></div>
        <p class="pdesc" id="pDesc" aria-live="polite">${esc(P.types[0].desc)}</p>
        <div class="opt"><span class="lb">Size</span>${seg(P.sizes)}</div>
        <div class="act"><button class="pb solid add" type="button">Add to box</button><a class="pb go" target="_blank" rel="noopener" href="#">Enquire</a></div></div></article>`;
    const pType = () => P.types[+$('#plums .seg.type [aria-pressed="true"]').dataset.t];
    const H = B.hamper;
    $('#hamper').innerHTML = `<div><div class="hico"><svg viewBox="0 0 120 120" aria-hidden="true"><rect x="22" y="54" width="76" height="52" rx="4"/><rect x="16" y="40" width="88" height="16" rx="4"/><path d="M60 40v66"/><path d="M60 40c-8-14-26-14-26-4s14 8 26 4zM60 40c8-14 26-14 26-4s-14 8-26 4z"/></svg></div><span class="tg" style="color:var(--mute)">Made to order</span><h3>Christmas Hamper</h3><p>Choose a size and what goes inside. We confirm the final box with you on WhatsApp.</p></div>
      <div class="hb"><div><span class="lb">Size</span><br>${seg(H.sizes)}</div><div><span class="lb">Add to your hamper</span><div class="chk" style="margin-top:8px">${H.items.map((x) => `<label><input type="checkbox" value="${esc(x)}">${esc(x)}</label>`).join('')}</div></div>
      <label><span class="lb">Card message</span><br><input class="fld" maxlength="70" placeholder="Optional" style="margin-top:8px"></label>
      <div class="act"><button class="pb solid add" type="button">Add hamper to box</button><a class="pb go" target="_blank" rel="noopener" href="#">Enquire</a></div></div>`;
    const plumTxt = (a) => pType().item + ' (' + $('.seg:not(.type) [aria-pressed="true"]', a).dataset.s + ')';
    const plumShow = () => { const t = pType(), tg = $('#pTag'), d = $('#pDesc');
      [tg, d].forEach((el) => el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' }));
      tg.textContent = t.tag; d.textContent = t.desc; };
    const hamTxt = () => { const h = $('#hamper'), inside = $$('.chk input:checked', h).map((x) => x.value), card = $('.fld', h).value.trim();
      return 'Christmas Hamper (' + $('.seg [aria-pressed="true"]', h).dataset.s + ')' + (inside.length ? ' with ' + inside.join(', ') : '') + (card ? ', card: "' + card + '"' : ''); };
    const sync = () => { $$('#plums .pc').forEach((a) => { $('.go', a).href = msg(['• ' + plumTxt(a)]); }); $('#hamper .go').href = msg(['• ' + hamTxt()]); };
    sync();
    $('#seasonal').addEventListener('click', (e) => { const sb = e.target.closest('.seg button'); if (sb) { $$('button', sb.parentElement).forEach((x) => x.setAttribute('aria-pressed', x === sb)); if (sb.parentElement.classList.contains('type')) plumShow(); sync(); return; }
      const ad = e.target.closest('.add'); if (!ad) return; const a = ad.closest('.pc'); addX(a ? plumTxt(a) : hamTxt()); flash(ad, 'Added ✓'); pop(ad); });
    ['input', 'change'].forEach((t) => $('#hamper').addEventListener(t, sync));
    /* days to Christmas, and the arc fills as it comes closer (from 1 Nov) */
    const n = new Date(), d0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()), xd = new Date(...B.christmas);
    $$('[data-xdays]').forEach((el) => { el.textContent = Math.max(0, Math.round((xd - d0) / 864e5)); });
    $$('.days .arc').forEach((a) => { const s = new Date(B.christmas[0], 10, 1); a.style.strokeDasharray = Math.max(4, Math.min(100, (n - s) / (xd - s) * 100)) + ' 100'; });
  }

  /* a tiny burst of crumbs when you add something */
  const pop = (el) => { const host = el.closest('dialog') || document.body, hr = host === document.body ? { left: 0, top: 0 } : host.getBoundingClientRect(), r0 = (el.tagName === 'INPUT' ? el.parentElement : el).getBoundingClientRect(), r = { left: r0.left - hr.left, top: r0.top - hr.top + (host === document.body ? 0 : host.scrollTop), width: r0.width, height: r0.height }; for (let i = 0; i < 8; i++) { const d = document.createElement('i'); d.style.cssText = `position:${host === document.body ? 'fixed' : 'absolute'};z-index:300;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:7px;height:7px;border-radius:50%;background:${(getComputedStyle(el).getPropertyValue('--g').trim() || '#4a442c')};pointer-events:none`; host.append(d);
    const a = Math.random() * 6.28, k = 30 + Math.random() * 40; d.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * k}px,${Math.sin(a) * k - 20}px) scale(.2)`, opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => d.remove(); } };

  /* ---------- details ---------- */
  $$('[data-wa]').forEach((a) => { a.href = wa('Hi Bun Bun Cafe, I would like to place an order.'); });
  $$('[data-fill]').forEach((el) => { const k = el.dataset.fill;
    if (k === 'fssai') el.textContent = B.fssai || 'to be added';
    if (k === 'location') el.textContent = B.location || 'Location to be added';
    if (k === 'wa-number') el.textContent = '+' + B.whatsapp.replace(/^(\d{2})(\d{5})(\d+)$/, '$1 $2 $3');
    if (k === 'instagram') { if (B.instagram) { el.href = B.instagram; el.target = '_blank'; el.rel = 'noopener'; } else { el.removeAttribute('href'); el.textContent = 'Instagram (link coming soon)'; } } });
  upd();

  /* ---------- brand first: the page opens straight onto the brand; the box unwraps itself as you scroll ---------- */
  const opened = true;
  requestAnimationFrame(() => setTimeout(() => root.classList.add('ready'), 60));
  setTimeout(startMotion, RM ? 0 : 3200);

  /* gentle reveals */
  $$('.th, .intro .wrap > *, .seasonal .sh, .seasonal .notice, .hamper, .about h2, .about .three p, .who, .lic, .contact h2, .contact .lead, .contact .notice, .cc').forEach((el) => el.classList.add('rv'));
  $$('.cp').forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--dl', (i % 3) * .08 + 's'); });
  const GS = !RM && !!(window.gsap && window.ScrollTrigger);
  if (RM || !('IntersectionObserver' in window)) $$('.rv').forEach((el) => el.classList.add('in'));
  else if (GS) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.batch('.rv', { start: 'top 88%', once: true, onEnter: (els) => els.forEach((el, i) => { el.style.setProperty('--dl', i * .09 + 's'); el.classList.add('in'); }) }); }
  else { const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -10% 0px' }); $$('.rv').forEach((el) => io.observe(el)); }
  /* the earliest pickup date in the "Collect" step: today plus the notice days (live, never made up) */
  { const d = new Date(); d.setDate(d.getDate() + B.noticeDays);
    const f = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
    $$('#pickup').forEach((el) => { el.textContent = f; }); $$('[data-days]').forEach((el) => { el.textContent = B.noticeDays; });
    $$('[data-slip]').forEach((el) => { el.href = wa('Hi Bun Bun Cafe, I would like to place an order. The earliest date I can pick up is ' + f + '.\n\nWhat I would like:\n'); }); }
  /* the slogans on their ropes: in each side column two dough ropes twist; every numbered dot rides one rope, the slogan text swings with it
     and comes a little forward and back as the rope turns. Leader lines follow each dot to the ring. The logo and ring are never touched. */
  { const fig = $('.fig'), cv = $('#braids'), svg = $('#leaders'), disc = $('.disc'), wm = $('.spec .wm'); const NS = 'http://www.w3.org/2000/svg';
    if (fig && cv && svg && disc && wm) { const g2 = cv.getContext('2d');
      let FW = 0, FH = 0, dpr = 1, col = '#4a442c', bg = '#f8f2e4', cx = 0, cy = 0, R = 0, D = 0, items = [], axes = { '-1': 0, '1': 0 }, y0 = 0, y1 = 0, vis = true, run = false, armed = false, gs = 0, amp = RM ? 1 : 0, grow = RM ? 1 : 0, small = false;
      const t0 = performance.now(), AM = 15, rd = () => { const cs = getComputedStyle(fig); col = cs.getPropertyValue('--g').trim() || col; bg = cs.getPropertyValue('--c').trim() || bg; };
      const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
      const measure = () => { small = matchMedia('(max-width:1100px)').matches; cv.style.display = svg.style.display = small ? 'none' : ''; if (small) { items = []; return; }
        const cos = $$('.co', fig).filter((co) => getComputedStyle(co).display !== 'none'); cos.forEach((co) => { co.style.transform = 'none'; });
        const fr = fig.getBoundingClientRect(), dr = disc.getBoundingClientRect(), mr = wm.getBoundingClientRect();
        FW = Math.round(fr.width); FH = Math.round(fr.height); dpr = Math.min(devicePixelRatio || 1, 2); cv.style.width = FW + 'px'; cv.style.height = FH + 'px'; cv.width = FW * dpr; cv.height = FH * dpr; g2.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = dr.left + dr.width / 2 - fr.left; cy = dr.top + dr.height / 2 - fr.top; D = dr.width; R = D / 2 * 1.025; y0 = dr.top - fr.top - 40; y1 = mr.bottom - fr.top + 30;
        const old = items; items = cos.map((co, i) => { const n = $('.n', co).getBoundingClientRect(); const it = { co, x: n.left + n.width / 2 - fr.left, y: n.top + n.height / 2 - fr.top, r: n.width / 2, side: co.classList.contains('l') ? -1 : 1 };
          if (old[i] && old[i].ln) { it.ln = old[i].ln; it.dt = old[i].dt; } else { it.ln = document.createElementNS(NS, 'line'); it.dt = document.createElementNS(NS, 'circle'); it.dt.setAttribute('r', 3.2); it.ln.style.setProperty('--i', i); it.dt.style.setProperty('--i', i); svg.append(it.ln, it.dt); } return it; });
        [-1, 1].forEach((s) => { const xs = items.filter((it) => it.side === s).map((it) => it.x); axes[s] = xs.length ? xs.reduce((p, q) => p + q, 0) / xs.length : (s < 0 ? cx - D : cx + D); });
        rd(); if (!armed && items.length) { armed = true; svg.classList.add('go'); setTimeout(() => svg.classList.add('static'), 4600); } frame(performance.now()); };
      function frame(now) { if (small || !FW) return; const t = (now - t0) / 1000, ph = t * .85, k = 2 * Math.PI / (D * .72), A = AM * amp, wv = (y, off) => Math.sin(k * y + ph + off);
        g2.clearRect(0, 0, FW, FH);
        /* ropes */
        const lim = y0 + (y1 - y0) * grow; g2.lineCap = 'round'; g2.lineJoin = 'round';
        const fade = (y) => sm((y - y0) / ((y1 - y0) * .14)) * sm((y1 - y) / ((y1 - y0) * .16));
        [-1, 1].forEach((s) => { const ax = axes[s], off = s < 0 ? 0 : Math.PI * .6;
          const P = (y, r) => { const p = k * y + ph + off + r * Math.PI; return [ax + AM * 1.0 * Math.sin(p), Math.cos(p)]; };
          for (const front of [false, true]) {
            if (front) for (let y = y0 + 8; y < lim; y += 20) { const a = P(y, 0), b = P(y, 1), f = fade(y); if (f < .02) continue; g2.globalAlpha = f * .2; g2.strokeStyle = col; g2.lineWidth = 1; g2.beginPath(); g2.moveTo(a[0], y); g2.lineTo(b[0], y); g2.stroke(); }
            for (const r of [0, 1]) { let prev = null; for (let y = y0; y <= lim; y += 3) { const [x, z] = P(y, r), isF = z >= 0, f = fade(y); if (prev && prev.f === isF && isF === front) { g2.globalAlpha = f * (.3 + .55 * (z + 1) / 2); g2.strokeStyle = col; g2.lineWidth = 1.3 + 3 * (z + 1) / 2; g2.beginPath(); g2.moveTo(prev.x, prev.y); g2.lineTo(x, y); g2.stroke(); } prev = { x, y, f: isF }; } }
            if (front) for (let y = y0 + 14; y < lim; y += 54) for (const r of [0, 1]) { const [x, z] = P(y, r), f = fade(y); if (f < .05) continue; g2.globalAlpha = f * (.5 + .45 * (z + 1) / 2); g2.fillStyle = bg; g2.strokeStyle = col; g2.lineWidth = 1.2; g2.beginPath(); g2.arc(x, y, 2.8 + 2 * (z + 1) / 2, 0, 6.283); g2.fill(); g2.stroke(); }
          } });
        g2.globalAlpha = 1;
        /* the slogans: each dot rides rope 0 of its side; text swings and breathes with the twist; leader lines follow */
        items.forEach((it) => { const off = it.side < 0 ? 0 : Math.PI * .6, p = k * it.y + ph + off, dx = A * Math.sin(p), z01 = (Math.cos(p) + 1) / 2;
          it.co.style.transform = 'translateX(' + dx.toFixed(2) + 'px)'; it.co.style.setProperty('--z', z01.toFixed(3));
          const sx = it.x + dx, sy = it.y, ang = Math.atan2(sy - cy, sx - cx), ux = Math.cos(ang), uy = Math.sin(ang), ex = cx + R * ux, ey = cy + R * uy, x1 = sx - ux * it.r, y1b = sy - uy * it.r;
          it.ln.setAttribute('x1', x1.toFixed(1)); it.ln.setAttribute('y1', y1b.toFixed(1)); it.ln.setAttribute('x2', ex.toFixed(1)); it.ln.setAttribute('y2', ey.toFixed(1)); it.ln.style.setProperty('--len', Math.ceil(Math.hypot(ex - x1, ey - y1b)) + 60);
          it.dt.setAttribute('cx', ex.toFixed(1)); it.dt.setAttribute('cy', ey.toFixed(1)); }); }
      const loop = (now) => { if (!vis || document.hidden || small) { run = false; return; }
        if (gs) { grow = 1 - Math.pow(1 - Math.min(1, Math.max(0, (now - gs) / 2000)), 3); amp = sm((now - gs - 400) / 2200); } frame(now); requestAnimationFrame(loop); };
      const kick = () => { if (!run && vis && !small && !RM) { run = true; requestAnimationFrame(loop); } };
      measure(); addEventListener('resize', () => { measure(); kick(); }); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); }); setTimeout(measure, 700); setTimeout(measure, 2300);
      if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); kick(); }).observe(fig);
      addEventListener('lookchange', () => { rd(); frame(performance.now()); });
      if (!RM) { setTimeout(() => { gs = performance.now(); kick(); }, 1000); if ('IntersectionObserver' in window) new IntersectionObserver((es) => { vis = es[0].isIntersecting; if (vis) kick(); }).observe(fig); document.addEventListener('visibilitychange', kick); } } }

  /* the flow: 01, 02, 03 take turns; each bar fills like piping, then the number settles in */
  { const fl = $('.flow'); if (fl) { const lis = $$('li', fl); let s = -1, tm = 0, paused = false, seen = false;
      const show = (n) => { lis.forEach((li, k) => { li.classList.toggle('on', k === n); li.classList.toggle('done', k < n || n === lis.length); }); fl.classList.add('run'); };
      const tick = () => { clearTimeout(tm); if (paused) return; s = (s + 1) % (lis.length + 1); if (s === 0) { lis.forEach((li) => li.classList.remove('on', 'done')); void fl.offsetWidth; } show(s); tm = setTimeout(tick, s === lis.length ? 1600 : 2400); };
      if (RM) { lis.forEach((li) => li.classList.add('done')); } else {
        const start = () => { if (!seen) { seen = true; setTimeout(tick, 900); } };
        if ('IntersectionObserver' in window) new IntersectionObserver((es) => { if (es[0].isIntersecting) start(); }, { threshold: .3 }).observe(fl); else start();
        fl.addEventListener('pointerenter', () => { paused = true; clearTimeout(tm); }); fl.addEventListener('pointerleave', () => { if (paused) { paused = false; tm = setTimeout(tick, 600); } }); } } }

  /* chapters take turns between the two palette colours; the look switch flips the pair */
  { const order = ['home', 'seasonal', 'tray', 'about', 'contact'].map((id) => $('#' + id)).filter((el) => el && getComputedStyle(el).display !== 'none');
    order.forEach((el, i) => { const alt = i % 2 === 1; el.classList.toggle('alt', alt); if (el.id === 'home') { const it = $('#intro'); if (it) it.classList.toggle('alt', alt); } });
    const meta = $('meta[name="theme-color"]'), btns = $$('.look button');
    const setLook = (l, save) => { root.dataset.look = l; btns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.l === l)); if (meta) meta.content = l === 'green' ? '#4a442c' : '#f8f2e4';
      if (save) { try { localStorage.setItem('bbboxlook', l); } catch (e) {} } dispatchEvent(new Event('lookchange')); };
    btns.forEach((b) => b.addEventListener('click', () => setLook(b.dataset.l, true))); setLook(root.dataset.look === 'green' ? 'green' : 'cream', false); }

  /* the bar steps aside on the way down */
  const top = $('#top'); let ly = 0; addEventListener('scroll', () => { const y = scrollY; top.classList.toggle('hide', y > ly && y > 240); ly = y; }, { passive: true });
  document.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href') === '#') return; const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); if (lenis) lenis.scrollTo(t, { duration: 1.4 }); else t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); } });


  /* ---------- Lenis smooth scroll + GSAP ScrollTrigger scenes (after the box is open) ---------- */
  function startMotion() {
    root.classList.add('settled');
    if (RM || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis && !lenis) { lenis = new Lenis({ lerp: .1, wheelMultiplier: .9, touchMultiplier: 1.4 }); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
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
      const t = e.target; cu.classList.toggle('dish', !!t.closest('.cp') || !!t.closest('#seal')); cu.classList.toggle('btn', !t.closest('.cp') && !!t.closest('a,button,label')); }, { passive: true });
    document.addEventListener('pointerleave', () => root.classList.remove('moved')); }
  else addEventListener('pointerdown', (e) => { if (e.target.closest('#lid')) return; const p = document.createElement('div'); p.className = 'tp'; p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px'; p.innerHTML = '<i class="mk"></i>'; document.body.append(p); setTimeout(() => p.remove(), 850); }, { passive: true });

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

  /* today's date on the landing (the "No. 001 / Fresh batch" line) */
  { const today = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
    $$('[data-today]').forEach((el) => { el.textContent = today; }); }
})();
