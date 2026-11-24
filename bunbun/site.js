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
      desc: 'A festive classic prepared with carefully selected ingredients and rum-soaked fruits, bringing together the rich and traditional flavours of Christmas.', size: null, price: null, photo: 'menu/plum-rum.webp', preorder: null },
    { id: 'plum-free', name: 'Non-Alcoholic Plum Cake', tag: 'Alcohol-free', alcohol: false,
      desc: 'Enjoy the traditional festive plum cake experience with our non-alcoholic version, prepared without alcohol.', size: null, price: null, photo: 'menu/plum-free.webp', preorder: null },
  ],

  /* sample photos until Bun Bun's own are ready: free-licence images from Wikimedia Commons, colour-graded to the brand */
  credits: [
    ['Nutella Brownie', 'Ɱ', 'CC BY-SA 3.0', 'File:Chocolatebrownie.JPG'],
    ['Double Chocolate Brownie', 'Wikimedia Commons contributor', 'CC BY-SA 3.0', 'File:Chocolate_brownies_without_table.jpg'],
    ['Metro Chocolate Brownie', 'Phadke09', 'CC BY-SA 4.0', 'File:Brownie_IMG_001.jpg'],
    ['Chocolate Mousse', 'jules / stonesoup', 'CC BY 2.0', 'File:Chocolate_mousse_-_stonesoup.jpg'],
    ['Caramel Pudding', 'BokuAlec', 'CC BY-SA 3.0', 'File:Italian_Creme_Caramel.JPG'],
    ['White Chocolate Waffle', 'Susanne Nilsson', 'CC BY-SA 2.0', 'File:Dessert_(37490131630).jpg'],
    ['Triple Chocolate Waffle', 'Andy Li', 'CC0', 'File:%22triple_chocolate%22_waffle_-_Wafflemeister_2024-08-25.jpg'],
    ['Traditional Plum Cake', 'Joegoauk Goa', 'CC BY-SA 2.0', 'File:Plum_cake._Goa.jpg'],
    ['Non-Alcoholic Plum Cake', 'James Petts', 'CC BY-SA 2.0', 'File:Slice_of_Christmas_cake_(11879724696).jpg'],
    ['Home page', 'zingyyellow', 'CC BY 2.0', 'File:Baked_cheesecake_with_raspberries_and_blueberries.jpg'],
  ],

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
    <button class="btn sm" type="button" data-order="general">Order Now</button></div>`;
  body.prepend(hd);
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
    <details class="cr"><summary>Photo credits</summary><p>Sample photos from Wikimedia Commons, colour-graded for this site, until Bun Bun's own photos are ready. ${B.credits.map(([w, a, l, f]) => `${esc(w)}: <a href="https://commons.wikimedia.org/wiki/${f}" target="_blank" rel="noopener">${esc(a)}</a>, ${esc(l)}`).join(' · ')}</p></details>
    <div class="base"><span>© 2026 Bun Bun Cafe · by AJ GROUPS. All rights reserved.</span><span><a href="${R}../privacy/">Privacy</a> · <a href="${R}../terms/">Terms</a></span></div></div>`;
  body.append(ft);

  /* product cards */
  const all = {}; B.menu.forEach((c) => c.items.forEach((i) => { all[i.id] = i; })); B.seasonal.forEach((i) => { all[i.id] = i; });
  const card = (i) => `<article class="pc rv">
    <div class="ph">${i.photo ? `<img src="${R}../assets/bunbun/${esc(i.photo)}" alt="${esc(i.name)}" loading="lazy">` : '<i class="mk" aria-hidden="true"></i><small>Photo coming soon</small>'}${i.photo ? '<small>Sample photo</small>' : ''}</div>
    <div class="bd">${i.tag ? `<span class="tag${i.alcohol ? ' solid' : ''}">${esc(i.tag)}</span>` : ''}<h3>${esc(i.name)}</h3><p>${esc(i.desc)}</p>
      ${i.preorder ? `<p>${esc(i.preorder)}</p>` : ''}
      <div class="meta"><div><div class="price">${i.price ? esc(i.price) : 'Price to be confirmed'}</div><div class="size">${i.size ? esc(i.size) : 'Size to be confirmed'}</div></div>
      <button class="btn sm" type="button" data-order="${esc(i.id)}">Order Now</button></div></div></article>`;
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
    if (k === 'whatsapp') { el.href = wa('Hi Bun Bun Cafe, I would like to place an order.'); el.target = '_blank'; el.rel = 'noopener'; }
    if (k === 'instagram') { if (ig) { el.href = ig; el.target = '_blank'; el.rel = 'noopener'; } else { el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true'); el.textContent = 'Instagram (link coming soon)'; } }
  });
  document.querySelectorAll('a[data-to]').forEach((a) => { a.href = link(a.dataset.to); });

  /* WhatsApp order dialog: product, quantity, date, requirements, then opens WhatsApp with the message filled in */
  const dlg = document.createElement('dialog'); dlg.className = 'od';
  const min = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  dlg.innerHTML = `<button class="x" type="button" aria-label="Close">×</button><form method="dialog" novalidate>
    <span class="eyebrow">Order on WhatsApp</span><h3 id="odT">Order</h3>
    <label id="odPw">Product<select id="odP"></select></label>
    <div class="two"><label>Quantity<input id="odQ" type="number" min="1" max="99" value="1" inputmode="numeric"></label><label>Preferred date<input id="odD" type="date" min="${min}"></label></div>
    <label>Requirements<textarea id="odN" maxlength="600" placeholder="Flavour, size, message on the cake, allergies…"></textarea></label>
    <p class="hint" id="odH"></p>
    <div class="row"><button class="btn" type="submit" id="odGo">Continue to WhatsApp</button>${ig ? `<a class="btn ghost" href="${ig}" target="_blank" rel="noopener">Message on Instagram</a>` : ''}</div>
    <p class="hint">Your order is confirmed only after Bun Bun Cafe replies to confirm availability, price and timing.</p></form>`;
  body.append(dlg);
  const $ = (id) => dlg.querySelector('#' + id);
  const opts = [['general', 'Not sure yet / general enquiry'], ['custom-cake', 'Custom cake']].concat(B.menu.flatMap((c) => c.items.map((i) => [i.id, i.name])), B.seasonal.map((i) => [i.id, i.name]));
  $('odP').innerHTML = opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  const setHint = () => { const v = $('odP').value, c = v === 'custom-cake';
    $('odD').min = c ? new Date(Date.now() + B.customNoticeDays * 864e5).toISOString().slice(0, 10) : min;
    $('odH').textContent = c ? `Custom cakes need at least ${B.customNoticeDays} days' notice. Share reference images in the WhatsApp chat.` : (all[v] && all[v].alcohol ? 'This cake contains alcohol (rum). Not for under-18s.' : ''); };
  $('odP').addEventListener('change', setHint);
  const open = (id) => { $('odP').value = opts.some((o) => o[0] === id) ? id : 'general'; $('odT').textContent = all[id] ? all[id].name : (id === 'custom-cake' ? 'Custom cake' : 'Place an order'); setHint(); dlg.showModal(); };
  dlg.querySelector('.x').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault(); const v = $('odP').value, name = opts.find((o) => o[0] === v)[1], d = $('odD').value;
    if (v === 'custom-cake' && d && d < $('odD').min) { $('odH').textContent = `Please pick a date at least ${B.customNoticeDays} days from today for a custom cake.`; $('odD').focus(); return; }
    const q = Math.max(1, Math.min(99, parseInt($('odQ').value, 10) || 1));
    const msg = ['Hi Bun Bun Cafe, I would like to order:', '', 'Product: ' + name, 'Quantity: ' + q, 'Preferred date: ' + (d ? new Date(d + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Flexible'), 'Requirements: ' + ($('odN').value.trim() || 'None')].join('\n');
    window.open(wa(msg), '_blank', 'noopener'); dlg.close();
  });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-order]'); if (b) { e.preventDefault(); open(b.dataset.order); } });

  /* gentle reveal on scroll */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('.rv').forEach((el) => { if (!io || el.getBoundingClientRect().top < innerHeight) setTimeout(() => el.classList.add('in'), 40); else io.observe(el); });
})();
