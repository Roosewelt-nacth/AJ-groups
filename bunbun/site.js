/* Bun Bun Cafe: shared header, footer, product lists and WhatsApp ordering for all eight pages.
   EDIT BUSINESS DETAILS HERE. Anything still null shows as "to be confirmed" on the site. */
const BUNBUN = {
  whatsapp: '918807893624',          // AJ GROUPS business number for now; replace with Bun Bun's own number (country code, no + or spaces)
  instagram: null,                   // e.g. 'https://www.instagram.com/bunbuncafe/' once shared
  fssai: null,                       // licence number, e.g. '12345678901234'
  location: 'Choolaimedu, Chennai',
  areas: ['Choolaimedu', 'Anna Nagar', 'Nungambakkam', 'Aminjikarai', 'Kilpauk'],
  customNoticeDays: 2,

  /* The menu. price and size stay null until confirmed; photo is a path such as '../assets/bunbun/menu/nutella-brownie.webp'. */
  menu: [
    { cat: 'Brownies', items: [
      { id: 'nutella-brownie', name: 'Nutella Brownie', desc: 'Description to be confirmed.', size: null, price: null, photo: 'menu/nutella-brownie.webp' },
      { id: 'double-choc-brownie', name: 'Double Chocolate Brownie', desc: 'Description to be confirmed.', size: null, price: null, photo: 'menu/double-choc-brownie.webp' },
      { id: 'metro-brownie', name: 'Metro Chocolate Brownie', desc: 'Description to be confirmed.', size: null, price: null, photo: 'menu/metro-brownie.webp' } ] },
    { cat: 'Desserts', items: [
      { id: 'choc-mousse', name: 'Chocolate Mousse', desc: 'Description to be confirmed.', size: null, price: null, photo: 'menu/choc-mousse.webp' },
      { id: 'caramel-pudding', name: 'Caramel Pudding', desc: 'Description to be confirmed.', size: null, price: null, photo: 'menu/caramel-pudding.webp' } ] },
    { cat: 'Waffles', items: [
      { id: 'white-choc-waffle', name: 'White Chocolate Waffle', desc: 'Description to be confirmed.', size: null, price: null, photo: 'menu/white-choc-waffle.webp' },
      { id: 'triple-choc-waffle', name: 'Triple Chocolate Waffle', desc: 'Description to be confirmed.', size: null, price: null, photo: 'menu/triple-choc-waffle.webp' } ] },
    { cat: 'Signature', items: [
      { id: 'signature', name: 'Signature product', desc: 'To be finalised.', size: null, price: null, photo: null } ] },
  ],
  /* shown on the home page */
  featured: ['nutella-brownie', 'caramel-pudding', 'triple-choc-waffle'],

  seasonal: [
    { id: 'plum-rum', name: 'Traditional Rum-Soaked Plum Cake', tag: 'Contains alcohol', alcohol: true,
      desc: 'A festive classic prepared with carefully selected ingredients and rum-soaked fruits, bringing together the rich and traditional flavours of Christmas.', size: null, price: null, photo: 'plum/step-6.webp', preorder: null },
    { id: 'plum-free', name: 'Non-Alcoholic Plum Cake', tag: 'Alcohol-free', alcohol: false,
      desc: 'Enjoy the traditional festive plum cake experience with our non-alcoholic version, prepared without alcohol.', size: null, price: null, photo: 'plum/step-1.webp', preorder: null },
  ],

  credits: [],

  cakes: ['Birthday Cakes', 'Anniversary Cakes', 'Theme-Based Cakes', 'Personalised Cakes', 'Special Occasion Cakes'],
};

(() => {
  const B = BUNBUN, body = document.body, page = body.dataset.page || 'home', R = body.dataset.root || './';
  const keep = /[?&]preview(=|&|$)/.test(location.search) ? '?preview' : '';
  const link = (p) => (p ? R + p + '/' : R) + keep;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wa = (text) => 'https://wa.me/' + B.whatsapp + '?text=' + encodeURIComponent(text);
  const ig = B.instagram;
  const PAGES = [['home', '', 'Home'], ['about', 'about', 'About Us'], ['menu', 'menu', 'Our Menu'], ['cakes', 'custom-cakes', 'Custom Cakes'], ['seasonal', 'seasonal', 'Seasonal Specials'], ['brand', 'brand', 'Our Brand'], ['how', 'how-to-order', 'How to Order'], ['contact', 'contact', 'Contact Us']];

  /* header */
  const hd = document.createElement('header'); hd.className = 'hd';
  hd.innerHTML = `<div class="wrap"><a class="brand" href="${link('')}" aria-label="Bun Bun Cafe home"><i class="mk"></i><i class="wm"></i></a>
    <nav class="nav" aria-label="Main">${PAGES.map(([k, p, l]) => `<a href="${link(p)}"${k === page ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false"><i></i><i></i></button>
    <div class="look" role="group" aria-label="Choose a look"><button type="button" data-l="cream" title="Cream"><i></i><span>Cream</span></button><button type="button" data-l="green" title="Green"><i></i><span>Green</span></button></div><button class="btn sm" type="button" data-order="general">Order Now</button></div>`;
  body.prepend(hd);
  const setLook = (l) => { document.documentElement.dataset.look = l; hd.querySelectorAll('.look button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.l === l)); try { localStorage.setItem('bbtheme', l === 'green' ? 'b' : 'a'); } catch (e) {} };
  hd.querySelectorAll('.look button').forEach((b) => b.addEventListener('click', () => setLook(b.dataset.l)));
  setLook(document.documentElement.dataset.look || 'cream');
  const mb = hd.querySelector('.menu-btn');
  mb.addEventListener('click', () => { const o = hd.classList.toggle('open'); mb.setAttribute('aria-expanded', o); mb.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); });
  let lastY = scrollY; addEventListener('scroll', () => { const y = scrollY; if (!hd.classList.contains('open')) hd.classList.toggle('up', y > lastY && y > 140); lastY = y; }, { passive: true });

  /* footer */
  const ft = document.createElement('footer'); ft.className = 'ft';
  ft.innerHTML = `<div class="wrap">
    <div class="about"><a class="brand" href="${link('')}" aria-label="Bun Bun Cafe home" style="display:block;text-decoration:none"><i class="mk"></i><i class="wm"></i></a>
      <p>A homegrown bakery in ${esc(B.location)}, making fresh treats and personalised cakes with care.</p></div>
    <div><h4>Explore</h4><ul>${PAGES.map(([, p, l]) => `<li><a href="${link(p)}">${l}</a></li>`).join('')}</ul></div>
    <div><h4>Order</h4><ul>
      <li><a href="${wa('Hi Bun Bun Cafe, I would like to place an order.')}" target="_blank" rel="noopener">WhatsApp</a></li>
      <li>${ig ? `<a href="${ig}" target="_blank" rel="noopener">Instagram</a>` : '<span>Instagram (link coming soon)</span>'}</li>
      <li><span>FSSAI licence: ${B.fssai ? esc(B.fssai) : 'to be added'}</span></li></ul></div>
    ${B.credits.length ? `<details class="cr"><summary>Photo credits</summary><p>Sample photos from Wikimedia Commons, colour-graded for this site, until Bun Bun's own photos are ready. ${B.credits.map(([w, a, l, f]) => `${esc(w)}: <a href="https://commons.wikimedia.org/wiki/${f}" target="_blank" rel="noopener">${esc(a)}</a>, ${esc(l)}`).join(' · ')}</p></details>` : ''}
    <div class="base"><span>© 2026 Bun Bun Cafe · by AJ GROUPS. All rights reserved.</span><span><a href="${R}../privacy/">Privacy</a> · <a href="${R}../terms/">Terms</a></span></div></div>`;
  body.append(ft);

  /* product cards */
  const all = {}; B.menu.forEach((c) => c.items.forEach((i) => { all[i.id] = i; })); B.seasonal.forEach((i) => { all[i.id] = i; });
  const IMG = (i) => R + '../assets/bunbun/' + i.photo;
  const card = (i) => `<article class="pc rv">
    <div class="ph">${i.photo ? `<img src="${esc(IMG(i))}" alt="${esc(i.name)}" loading="lazy">` : '<i class="mk" aria-hidden="true"></i>'}
      <div class="chips">${i.tag ? `<span>${esc(i.tag)}</span>` : ''}<span>${i.photo ? 'Illustrative photo' : 'Photo coming soon'}</span></div></div>
    <div class="bd"><h3>${esc(i.name)}</h3><p>${esc(i.desc)}</p>${i.preorder ? `<p>${esc(i.preorder)}</p>` : ''}
      <div class="ln"><span>Size</span><b>${i.size ? esc(i.size) : 'To be confirmed'}</b></div>
      <div class="ln"><span>Price</span><b>${i.price ? esc(i.price) : 'To be confirmed'}</b></div>
      <button class="btn pill" type="button" data-order="${esc(i.id)}">Order Now</button></div></article>`;
  document.querySelectorAll('[data-list]').forEach((el) => {
    const k = el.dataset.list;
    if (k === 'menu') el.innerHTML = B.menu.map((c) => `<div class="cat"><h3>${esc(c.cat)}</h3><div class="grid g3">${c.items.map(card).join('')}</div></div>`).join('');
    else if (k === 'featured') el.innerHTML = B.featured.map((id) => all[id]).filter(Boolean).map(card).join('');
    else if (k === 'seasonal') el.innerHTML = B.seasonal.map(card).join('');
    else if (k === 'cakes') el.innerHTML = B.cakes.map((c) => `<li>${esc(c)}</li>`).join('');
    else if (k === 'areas') el.innerHTML = B.areas.map((c) => `<li>${esc(c)}</li>`).join('');
  });
  document.querySelectorAll('[data-fill]').forEach((el) => {
    const k = el.dataset.fill;
    if (k === 'fssai') el.textContent = B.fssai || 'Licence number to be added';
    if (k === 'location') el.textContent = B.location;
    if (k === 'wa-number') el.textContent = '+' + B.whatsapp.replace(/^(\d{2})(\d{5})(\d+)$/, '$1 $2 $3');
    if (k === 'whatsapp') { el.href = wa('Hi Bun Bun Cafe, I would like to place an order.'); el.target = '_blank'; el.rel = 'noopener'; }
    if (k === 'instagram') { if (ig) { el.href = ig; el.target = '_blank'; el.rel = 'noopener'; } else { el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true'); el.textContent = 'Instagram (link coming soon)'; } }
  });
  document.querySelectorAll('a[data-to]').forEach((a) => { a.href = link(a.dataset.to); });

  /* WhatsApp order dialog: product, quantity, date, requirements, then opens WhatsApp with the message filled in */
  const dlg = document.createElement('dialog'); dlg.className = 'od';
  const min = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  dlg.innerHTML = `<div class="odbg" aria-hidden="true"></div><form method="dialog" novalidate>
    <div class="sheet"><button class="x" type="button" aria-label="Close">×</button>
      <div class="odph"><div class="chips"><span id="odC1">Order on WhatsApp</span><span id="odC2"></span></div></div>
      <h4>Order details</h4>
      <p class="odt" id="odT">Order</p>
      <label class="pl">Product<select id="odP"></select></label>
      <div class="two"><label class="pl">Quantity<input id="odQ" type="number" min="1" max="99" value="1" inputmode="numeric"></label><label class="pl">Date<input id="odD" type="date" min="${min}"></label></div>
      <h4>Your requirements</h4>
      <label class="pl"><span class="sr">Requirements</span><textarea id="odN" maxlength="600" placeholder="Flavour, size, message on the cake, allergies…"></textarea></label>
      <p class="hint" id="odH"></p>
      <p class="hint">Confirmed only after Bun Bun Cafe replies with availability, price and timing.</p></div>
    <div class="odgo"><button class="btn cta" type="submit" id="odGo">Continue to WhatsApp</button>${ig ? `<a class="btn cta ghost" href="${ig}" target="_blank" rel="noopener">Instagram</a>` : ''}</div></form>`;
  body.append(dlg);
  const $ = (id) => dlg.querySelector('#' + id);
  const opts = [['general', 'Not sure yet / general enquiry'], ['custom-cake', 'Custom cake']].concat(B.menu.flatMap((c) => c.items.map((i) => [i.id, i.name])), B.seasonal.map((i) => [i.id, i.name]));
  $('odP').innerHTML = opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  const setHint = () => { const v = $('odP').value, c = v === 'custom-cake';
    $('odD').min = c ? new Date(Date.now() + B.customNoticeDays * 864e5).toISOString().slice(0, 10) : min;
    $('odH').textContent = c ? `Custom cakes need at least ${B.customNoticeDays} days' notice. Share reference images in the WhatsApp chat.` : (all[v] && all[v].alcohol ? 'This cake contains alcohol (rum). Not for under-18s.' : ''); };
  $('odP').addEventListener('change', setHint);
  const FALL = R + '../assets/bunbun/pack-coffee.webp';
  const paint = (id) => { const it = all[id], src = it && it.photo ? IMG(it) : FALL;
    dlg.style.setProperty('--odimg', 'url("' + src + '")'); $('odC2').textContent = it ? (it.price || 'Price to be confirmed') : (id === 'custom-cake' ? B.customNoticeDays + " days' notice" : 'Bun Bun Cafe'); };
  $('odP').addEventListener('change', () => paint($('odP').value));
  const open = (id) => { $('odP').value = opts.some((o) => o[0] === id) ? id : 'general'; $('odT').textContent = all[id] ? all[id].name : (id === 'custom-cake' ? 'Custom cake' : 'Place an order'); paint(id); setHint(); dlg.showModal(); };
  dlg.querySelector('.x').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.classList.contains('odbg') || e.target.tagName === 'FORM') dlg.close(); });
  dlg.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault(); const v = $('odP').value, name = opts.find((o) => o[0] === v)[1], d = $('odD').value;
    if (v === 'custom-cake' && d && d < $('odD').min) { $('odH').textContent = `Please pick a date at least ${B.customNoticeDays} days from today for a custom cake.`; $('odD').focus(); return; }
    const q = Math.max(1, Math.min(99, parseInt($('odQ').value, 10) || 1));
    const msg = ['Hi Bun Bun Cafe, I would like to order:', '', 'Product: ' + name, 'Quantity: ' + q, 'Preferred date: ' + (d ? new Date(d + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Flexible'), 'Requirements: ' + ($('odN').value.trim() || 'None')].join('\n');
    window.open(wa(msg), '_blank', 'noopener'); dlg.close();
  });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-order]'); if (b) { e.preventDefault(); open(b.dataset.order); } });


  /* scrolling plum cake, animated with the scroll: each new layer is revealed the way it is made
     (fruit drops in, glaze pours down, sugar falls, the holly grows in, the plate opens out), while the slice floats and turns */
  document.querySelectorAll('[data-story]').forEach((sec) => {
    const imgs = [...sec.querySelectorAll('.frames img')], dots = [...sec.querySelectorAll('.dots li')], steps = [...sec.querySelectorAll('.st')];
    const frames = sec.querySelector('.frames'), stage = sec.querySelector('.stage');
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    imgs.forEach((im) => { im.loading = 'eager'; im.classList.add('on'); });
    const cv = document.createElement('canvas'); cv.className = 'fx'; cv.setAttribute('aria-hidden', 'true'); frames.append(cv);
    const cx = cv.getContext('2d'); let W = 0, H = 0;
    const size = () => { const r = frames.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); };
    size(); addEventListener('resize', size);
    const cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x), ease = (x) => x * x * (3 - 2 * x);
    /* where we are: 0 at the first step ... 5 at the last, fractional in between */
    const where = () => { const mid = innerHeight * (innerWidth < 860 ? .72 : .52), c = steps.map((s) => { const r = s.getBoundingClientRect(); return r.top + r.height / 2; });
      if (mid <= c[0]) return 0; for (let k = 0; k < c.length - 1; k++) if (mid <= c[k + 1]) return k + (mid - c[k]) / (c[k + 1] - c[k]); return c.length - 1; };
    /* particles: sugar snow and a few drops of glaze */
    const sugar = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), s: .6 + Math.random() * 1.6, v: .04 + Math.random() * .08, w: Math.random() * 6.28 }));
    let p = 0, shown = 0, last = performance.now(), active = false, run = false, cur = -1;
    const draw = (now) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      shown += (p - shown) * (RM ? 1 : Math.min(1, dt * 7));                       /* glide towards the scroll position */
      const q = shown, r = (k) => ease(cl((q - (k - .75)) / .75));                    /* reveal of layer k, 0..1, finishing as its step is reached */
      const r1 = r(1), r2 = r(2), r3 = r(3), r4 = r(4), r5 = r(5);
      imgs[1].style.cssText = `opacity:${r1};transform:translateY(${(1 - r1) * -7}%) scale(${1 + (1 - r1) * .06});filter:blur(${(1 - r1) * 6}px)`;
      /* calm, photographic: each layer simply dissolves in with the scroll (no floating, no particles) until the real video is ready */
      [r1, r2, r3, r4, r5].forEach((v, k) => { imgs[k + 1].style.cssText = `opacity:${v}`; });
      frames.style.transform = '';
      /* sugar falls while step 4 is being reached; glaze drips during step 3 */
      cx.clearRect(0, 0, W, H);
      const snow = 0;
      if (snow > 0) { cx.fillStyle = '#ffffff'; sugar.forEach((g) => { g.y += g.v * dt * 3; if (g.y > 1) { g.y = 0; g.x = Math.random(); } g.w += dt * 2;
        const x = (.28 + g.x * .5) * W + Math.sin(g.w) * 4, y = (.02 + g.y * .5) * H; cx.globalAlpha = snow * .85 * (1 - g.y); cx.beginPath(); cx.arc(x, y, g.s, 0, 6.283); cx.fill(); }); cx.globalAlpha = 1; }
      const n = Math.round(q); if (n !== cur) { cur = n; dots.forEach((d, k) => d.classList.toggle('on', k <= n)); steps.forEach((s, k) => s.classList.toggle('on', k === n)); }
      if (Math.abs(p - shown) > .002) requestAnimationFrame(draw); else run = false;
    };
    const io = new IntersectionObserver((es) => { const on = es[0].isIntersecting; active = on; if (on && !run) { run = true; last = performance.now(); requestAnimationFrame(draw); } }, { rootMargin: '200px 0px' });
    io.observe(sec);
    const tick = () => { p = where(); if (!run) { run = true; last = performance.now(); requestAnimationFrame(draw); } }; addEventListener('scroll', tick, { passive: true }); tick();
  });

  /* hero dish turns a little towards the pointer (hover screens only) */
  document.querySelectorAll('[data-tilt]').forEach((f) => { const im = f.querySelector('img'); if (!im || !matchMedia('(hover:hover)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    addEventListener('pointermove', (e) => { const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5; im.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 7}deg) translateZ(0)`; }, { passive: true }); });

  /* page transitions: a short fade between pages (skipped with reduced motion, new tabs and modified clicks) */
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.addEventListener('click', (e) => { const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const u = new URL(a.href, location.href); if (u.origin !== location.origin || u.pathname === location.pathname || !u.pathname.includes('/bunbun/')) return;
      e.preventDefault(); document.documentElement.classList.add('leaving'); setTimeout(() => { location.href = u.href; }, 260); });
    addEventListener('pageshow', () => document.documentElement.classList.remove('leaving'));
  }

  /* gentle reveal on scroll */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('.rv').forEach((el) => { if (!io || el.getBoundingClientRect().top < innerHeight) setTimeout(() => el.classList.add('in'), 40); else io.observe(el); });
})();
