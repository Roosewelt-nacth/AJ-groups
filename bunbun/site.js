/* Bun Bun Cafe: one scrolling page in five chapters (Home, About, Menu, Seasonal, Contact Us). Every order goes to WhatsApp.
   EDIT BUSINESS DETAILS HERE. Anything still null shows as "to be added" on the site. */
const BUNBUN = {
  whatsapp: '918807893624',            // AJ GROUPS business number for now; replace with Bun Bun's own (country code, no + or spaces)
  instagram: 'https://www.instagram.com/bun.bun.bakes/?hl=en',
  fssai: null,                         // licence number, e.g. '12345678901234'
  location: null,                      // e.g. 'Area, City' (to come from AJ GROUPS)
  noticeDays: 2,

  /* The menu: one panel per category, every child item inside it. Add a size list (sizes) for items sold by weight. */
  menu: [
    { cat: 'Brownies', photo: 'menu/nutella-brownie.webp', items: [
      { name: 'Nutella Brownie' }, { name: 'Double Chocolate Brownie' }, { name: 'Metro Chocolate Brownie' } ] },
    { cat: 'Waffles', photo: 'menu/triple-choc-waffle.webp', items: [
      { name: 'White Chocolate Waffle' }, { name: 'Triple Chocolate Waffle' } ] },
    { cat: 'Desserts', photo: 'menu/caramel-pudding.webp', items: [
      { name: 'Chocolate Mousse' }, { name: 'Caramel Pudding' } ] },
    { cat: 'Cakes', photo: null, sub: 'Menu coming soon', items: [],
      note: 'Our cake menu is on its way. We also make customised cakes for birthdays, anniversaries and special occasions.' },
  ],

  /* Seasonal (Advent) menu: full cakes by weight, and the hamper builder. Shown until 1 Jan 2027. */
  seasonal: [
    { name: 'Traditional Rum-Soaked Plum Cake', tag: 'Contains alcohol (rum). Not for under-18s.', photo: 'menu/plum-rum.webp', sizes: ['Half kg', '1 kg'],
      desc: 'A festive classic prepared with carefully selected ingredients and rum-soaked fruits, bringing together the rich and traditional flavours of Christmas.' },
    { name: 'Non-Alcoholic Plum Cake', tag: 'Prepared without alcohol', photo: 'menu/plum-free.webp', sizes: ['Half kg', '1 kg'],
      desc: 'Enjoy the traditional festive plum cake experience with our non-alcoholic version.' },
  ],
  hamper: { sizes: ['Petite', 'Classic', 'Grand'], items: ['Plum cake', 'Brownies', 'Caramel pudding', 'Waffles', 'Chocolate mousse'] },
  christmas: [2026, 11, 25],                                              // month is 0-based
};

(() => {
  const B = BUNBUN, body = document.body, root = document.documentElement, season = root.classList.contains('season');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wa = (text) => 'https://wa.me/' + B.whatsapp + '?text=' + encodeURIComponent(text);
  const IMG = (p) => '../assets/bunbun/' + p;
  const ig = B.instagram;
  const NOTE = `Date needed: ______ (I know orders need ${B.noticeDays} days' notice)`;
  const msg = (lines) => wa(['Hi Bun Bun Cafe, I would like to order:'].concat(lines.filter(Boolean), ['', NOTE]).join('\n'));
  const NAMES = { home: 'Home', about: 'About', menu: 'Menu', seasonal: 'Seasonal', contact: 'Contact Us' };
  const chaps = [...document.querySelectorAll('.chap')].filter((c) => getComputedStyle(c).display !== 'none');

  /* header: the mark only, five chapters, Order Now goes to the menu */
  const hd = document.createElement('header'); hd.className = 'hd';
  hd.innerHTML = `<div class="wrap"><a class="brand" href="#home" aria-label="Bun Bun Cafe, home"><i class="mk"></i></a>
    <nav class="nav" aria-label="Main">${chaps.map((c) => `<a href="#${c.id}"${c.id === 'seasonal' ? ' class="ns"' : ''}>${NAMES[c.id]}</a>`).join('')}</nav>
    <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false"><i></i><i></i></button>
    <div class="look" role="group" aria-label="Choose a look"><button type="button" data-l="cream" title="Cream"><i></i><span>Cream</span></button><button type="button" data-l="green" title="Green"><i></i><span>Green</span></button></div>
    <a class="btn sm" href="#menu">Order Now</a></div>`;
  body.prepend(hd);
  const setLook = (l) => { root.dataset.look = l; hd.querySelectorAll('.look button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.l === l)); try { localStorage.setItem('bbtheme', l === 'green' ? 'b' : 'a'); } catch (e) {} };
  hd.querySelectorAll('.look button').forEach((b) => b.addEventListener('click', () => setLook(b.dataset.l)));
  setLook(root.dataset.look || 'cream');
  const mb = hd.querySelector('.menu-btn');
  mb.addEventListener('click', () => { const o = hd.classList.toggle('open'); mb.setAttribute('aria-expanded', o); mb.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); });
  let lastY = scrollY; addEventListener('scroll', () => { const y = scrollY; if (!hd.classList.contains('open')) hd.classList.toggle('up', y > lastY && y > 140); lastY = y; }, { passive: true });

  /* footer */
  const ft = document.createElement('footer'); ft.className = 'ft';
  ft.innerHTML = `<div class="wrap">
    <div class="about"><a class="brand" href="#home" aria-label="Bun Bun Cafe, home"><i class="mk"></i><i class="wm"></i></a>
      <p>A homegrown bakery making fresh treats and personalised cakes with care.</p></div>
    <div><h4>Explore</h4><ul>${chaps.map((c) => `<li><a href="#${c.id}">${NAMES[c.id]}</a></li>`).join('')}</ul></div>
    <div><h4>Order</h4><ul>
      <li><a href="${wa('Hi Bun Bun Cafe, I would like to place an order.')}" target="_blank" rel="noopener">WhatsApp</a></li>
      <li>${ig ? `<a href="${ig}" target="_blank" rel="noopener">Instagram</a>` : '<span>Instagram (link coming soon)</span>'}</li>
      <li><span>FSSAI licence: ${B.fssai ? esc(B.fssai) : 'to be added'}</span></li></ul></div>
    <div class="base"><span>© 2026 Bun Bun Cafe · by AJ GROUPS. All rights reserved.</span><span><a href="../privacy/">Privacy</a> · <a href="../terms/">Terms</a></span></div></div>`;
  body.append(ft);

  /* alternating colours down the page, numbered chapters */
  let ai = 0; chaps.forEach((c, i) => { c.dataset.n = String(i + 1).padStart(2, '0'); c.dataset.name = NAMES[c.id]; if (c.id === 'seasonal') return; c.classList.toggle('alt', ai % 2 === 1); ai++; });  /* Seasonal keeps its own Christmas colours and is left out of the cream/green alternation */
  ft.classList.toggle('alt', !chaps[chaps.length - 1].classList.contains('alt'));

  /* menu panels and seasonal cards */
  const seg = (sizes) => (sizes ? `<div class="seg" role="group" aria-label="Size">${sizes.map((s, k) => `<button type="button" data-s="${esc(s)}" aria-pressed="${k === 0}">${esc(s)}</button>`).join('')}</div>` : '');
  const item = (i) => `<li class="it" data-name="${esc(i.name)}"><span class="nm">${esc(i.name)}</span><div class="ctl">${seg(i.sizes)}<a class="btn sm ghost go" href="#" target="_blank" rel="noopener">Order</a></div></li>`;
  const customCake = wa('Hi Bun Bun Cafe, I would like to ask about a customised cake.\n\nOccasion:\nFlavour and size:\n' + NOTE);
  const panel = (c) => `<section class="mp rv"><div class="mp-h">${c.photo ? `<img src="${IMG(c.photo)}" alt="${esc(c.cat)}" width="68" height="68" loading="lazy">` : '<div class="t0"><i class="mk" aria-hidden="true"></i></div>'}<div><h3>${esc(c.cat)}</h3><small>${c.items.length ? c.items.length + (c.items.length === 1 ? ' choice' : ' choices') : esc(c.sub || '')}</small></div></div>
    ${c.items.length ? `<ul>${c.items.map(item).join('')}</ul>` : `<p class="note">${esc(c.note)}</p><a class="btn sm ghost" href="${customCake}" target="_blank" rel="noopener">Ask about a customised cake</a>`}</section>`;
  const cake = (i) => `<article class="pc rv" data-name="${esc(i.name)}"><div class="ph"><img src="${IMG(i.photo)}" alt="${esc(i.name)}" loading="lazy"></div>
    <div class="bd"><span class="tg">${esc(i.tag)}</span><h3>${esc(i.name)}</h3><p>${esc(i.desc)}</p><div class="act">${seg(i.sizes)}<a class="btn sm go" href="#" target="_blank" rel="noopener">Order</a></div></div></article>`;
  const H = B.hamper;
  const hamper = () => `<article class="pc hm rv" data-hamper><div class="ph"><svg viewBox="0 0 120 120" aria-hidden="true"><rect x="22" y="54" width="76" height="52" rx="4"/><rect x="16" y="40" width="88" height="16" rx="4"/><path d="M60 40v66"/><path d="M60 40c-8-14-26-14-26-4s14 8 26 4zM60 40c8-14 26-14 26-4s-14 8-26 4z"/></svg></div>
    <div class="bd"><span class="tg">Made to order</span><h3>Christmas Hamper</h3><p>Choose a size and what goes inside. We confirm the final box with you on WhatsApp.</p>
      <div class="hmo"><div><div class="opt"><span class="lb">Size</span>${seg(H.sizes)}</div>
        <div class="opt"><span class="lb">Add to your box</span><div class="chk">${H.items.map((x) => `<label><input type="checkbox" value="${esc(x)}">${esc(x)}</label>`).join('')}</div></div></div>
      <div><label class="opt"><span class="lb">Card message</span><input class="fld" maxlength="70" placeholder="Optional"></label>
        <div class="act"><a class="btn sm go" href="#" target="_blank" rel="noopener">Order hamper</a></div></div></div></div></article>`;
  document.querySelectorAll('[data-list]').forEach((el) => {
    if (el.dataset.list === 'menu') el.innerHTML = B.menu.map(panel).join('');
    else if (el.dataset.list === 'seasonal') el.innerHTML = B.seasonal.map(cake).join('') + hamper();
  });
  const upd = (r) => { const a = r.querySelector('a.go'); if (!a) return; const sz = r.querySelector('.seg [aria-pressed="true"]');
    if (r.hasAttribute('data-hamper')) { const inside = [...r.querySelectorAll('.chk input:checked')].map((x) => x.value), card = r.querySelector('.fld').value.trim();
      a.href = msg(['• Christmas hamper' + (sz ? ' (' + sz.dataset.s + ')' : ''), '  Inside: ' + (inside.length ? inside.join(', ') : 'to be discussed'), card ? '  Card message: ' + card : '']); }
    else a.href = msg(['• ' + r.dataset.name + (sz ? ' (' + sz.dataset.s + ')' : '')]); };
  document.querySelectorAll('[data-name],[data-hamper]').forEach(upd);
  document.addEventListener('click', (e) => { const b = e.target.closest('.seg button'); if (!b) return; b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); upd(b.closest('[data-name],[data-hamper]')); });
  ['input', 'change'].forEach((t) => document.addEventListener(t, (e) => { const r = e.target.closest('[data-hamper]'); if (r) upd(r); }));

  /* Christmas chapter: a slow, sparse snowfall (only while the chapter is on screen; none with reduced motion) */
  const snowC = document.querySelector('.xmas .snow');
  if (snowC && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const sx = snowC.getContext('2d'), sec = snowC.parentElement; let W = 0, Hh = 0, on = false, lt = 0;
    const flakes = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: .7 + Math.random() * 2.1, v: .012 + Math.random() * .03, a: .25 + Math.random() * .5, w: Math.random() * 6.28 }));
    const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); W = sec.clientWidth; Hh = sec.clientHeight; snowC.width = W * d; snowC.height = Hh * d; sx.setTransform(d, 0, 0, d, 0, 0); };
    const tickS = (now) => { if (!on) return; const dt = Math.min(.05, (now - (lt || now)) / 1000); lt = now; sx.clearRect(0, 0, W, Hh);
      const col = getComputedStyle(sec).color; sx.fillStyle = col;
      flakes.forEach((f) => { f.y += f.v * dt * 6 * (800 / Math.max(Hh, 400)); f.w += dt * .6; if (f.y > 1.02) { f.y = -.02; f.x = Math.random(); }
        sx.globalAlpha = f.a; sx.beginPath(); sx.arc((f.x + Math.sin(f.w) * .012) * W, f.y * Hh, f.r, 0, 6.283); sx.fill(); });
      sx.globalAlpha = 1; requestAnimationFrame(tickS); };
    fit(); addEventListener('resize', fit); new ResizeObserver(fit).observe(sec);
    new IntersectionObserver((es) => { const v = es[0].isIntersecting; if (v && !on) { on = true; lt = 0; requestAnimationFrame(tickS); } on = v; }).observe(sec);
  }

  /* Advent: days to Christmas */
  const advEl = document.querySelector('[data-advent]');
  document.querySelectorAll('[data-xdays]').forEach((el) => { const n = new Date(), d0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()); el.textContent = Math.max(0, Math.round((new Date(B.christmas[0], B.christmas[1], B.christmas[2]) - d0) / 864e5)); });
  document.querySelectorAll('.w1 .arc').forEach((a) => { const n = new Date(), s = new Date(B.christmas[0], 10, 1), e = new Date(B.christmas[0], B.christmas[1], B.christmas[2]); a.style.strokeDasharray = Math.max(4, Math.min(100, (n - s) / (e - s) * 100)) + ' 100'; });
  if (advEl) {
    const n = new Date(), today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    const days = Math.round((new Date(B.christmas[0], B.christmas[1], B.christmas[2]) - today) / 864e5);
    advEl.innerHTML = '<div class="days">' + (days > 0 ? `<b>${days}</b>${days === 1 ? 'day' : 'days'} to Christmas` : days === 0 ? '<b>Today</b>Merry Christmas' : '<b>Merry</b>Christmas') + '</div>';
  }

  /* contact details */
  document.querySelectorAll('[data-fill]').forEach((el) => {
    const k = el.dataset.fill;
    if (k === 'fssai') el.textContent = B.fssai || 'to be added';
    if (k === 'location') el.textContent = B.location || 'Location to be added';
    if (k === 'wa-number') el.textContent = '+' + B.whatsapp.replace(/^(\d{2})(\d{5})(\d+)$/, '$1 $2 $3');
    if (k === 'wa-xmas') { el.href = msg(['• Christmas collection (plum cake / hamper)']); el.target = '_blank'; el.rel = 'noopener'; }
    if (k === 'whatsapp') { el.href = wa('Hi Bun Bun Cafe, I would like to place an order.'); el.target = '_blank'; el.rel = 'noopener'; }
    if (k === 'instagram') { if (ig) { el.href = ig; el.target = '_blank'; el.rel = 'noopener'; } else { el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true'); el.textContent = 'Instagram (link coming soon)'; } }
  });

  /* header highlight follows the chapter you are reading */
  const navA = [...hd.querySelectorAll('.nav a')];
  let cur = '', tk = 0;
  const spy = () => { tk = 0; const line = innerHeight * .35; let c0 = chaps[0];
    chaps.forEach((c) => { if (c.getBoundingClientRect().top <= line) c0 = c; });
    if (c0.id === cur) return; cur = c0.id;
    navA.forEach((a) => { if (a.getAttribute('href') === '#' + cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); };
  addEventListener('scroll', () => { if (!tk) tk = requestAnimationFrame(spy); }, { passive: true }); addEventListener('resize', spy); spy();
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented) return; const el = document.getElementById(a.getAttribute('href').slice(1)); if (!el) return;
    e.preventDefault(); hd.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); history.replaceState(null, '', '#' + el.id); });
  if (location.hash) { const id = location.hash.slice(1) === 'order' ? 'contact' : location.hash.slice(1), el = document.getElementById(id); if (el && getComputedStyle(el).display !== 'none') { const go = () => el.scrollIntoView({ behavior: 'instant', block: 'start' }); go(); addEventListener('load', go); } }

  /* gentle reveal on scroll */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('.rv').forEach((el) => { if (!io || el.getBoundingClientRect().top < innerHeight) setTimeout(() => el.classList.add('in'), 40); else io.observe(el); });
})();
