/* Bun Bun Cafe, "Open your box". No libraries. Edit business details in BUNBUN. Anything null shows "to be added". */
const BUNBUN = {
  whatsapp: '918807893624',            // AJ GROUPS business number for now; replace with Bun Bun's own (country code, no + or spaces)
  instagram: 'https://www.instagram.com/bun.bun.bakes/?hl=en', handle: '@bun.bun.bakes',
  fssai: null, location: null, noticeDays: 2,
  cats: [
    { id: 'b', name: 'Brownies', photo: 'menu-c/nutella-brownie.webp', story: 'Rich, fudgy and made to be shared.', items: ['Nutella Brownie', 'Double Chocolate Brownie', 'Metro Chocolate Brownie'] },
    { id: 'w', name: 'Waffles', photo: 'menu-c/triple-choc-waffle.webp', story: 'Warm, crisp and finished with chocolate.', items: ['White Chocolate Waffle', 'Triple Chocolate Waffle'] },
    { id: 'd', name: 'Desserts', photo: 'menu-c/caramel-pudding.webp', story: 'Silky, chilled and made to be savoured.', items: ['Chocolate Mousse', 'Caramel Pudding'] },
    { id: 'c', name: 'Cakes', photo: null, story: 'Our cake collection is being finalised. We also create bespoke cakes for birthdays, anniversaries and special occasions.', items: [] },
    { id: 'x', name: 'Christmas', season: true, photo: 'menu-c/plum-rum.webp', story: 'Rich plum cakes and Christmas hampers, baked for the season. Plum cakes come in half kg and 1 kg. The rum cake contains alcohol and is not for under-18s.',
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
    $('#sImg').src = c.photo ? IMG(c.photo) : '../assets/bunbun/logo-silhouette.png'; $('#sNo').textContent = String(i + 1).padStart(2, '0'); $('#sTitle').textContent = c.name; $('#sText').textContent = c.story;
    $('#sLb').hidden = !c.items.length; sChk.innerHTML = c.items.map((x) => `<label><input type="checkbox" value="${esc(x)}"${sel[c.id] && sel[c.id].has(x) ? ' checked' : ''}>${esc(x)}</label>`).join('');
    $('#sGo').textContent = c.items.length ? 'Enquire on WhatsApp' : 'Enquire about a bespoke cake'; $('.sp', sheet).style.background = c.photo ? '' : 'var(--g)';
    upd(); sheet.showModal(); };
  $('#trayg').addEventListener('click', (e) => { const b = e.target.closest('.cp'); if (b) openSheet(b.dataset.id); });
  sChk.addEventListener('change', (e) => { const s = sel[cur.id] || (sel[cur.id] = new Set()); e.target.checked ? s.add(e.target.value) : s.delete(e.target.value); upd(); bump(); if (e.target.checked) pop(e.target); });
  $$('dialog [data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
  $$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));
  $('#clr').addEventListener('click', () => { Object.keys(sel).forEach((k) => delete sel[k]); upd(); });

  /* a tiny burst of crumbs when you add something */
  const pop = (el) => { const r = el.parentElement.getBoundingClientRect(); for (let i = 0; i < 8; i++) { const d = document.createElement('i'); d.style.cssText = `position:fixed;z-index:300;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:7px;height:7px;border-radius:50%;background:#4a442c;pointer-events:none`; document.body.append(d);
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
    setTimeout(() => root.classList.add('opened'), RM ? 0 : 380); scrollTo(0, 0); };
  if (opened) lid.style.display = 'none';
  seal.addEventListener('click', () => { if (!dragged) openBox(); });
  let sx = 0, dragging = false, dragged = false;
  seal.addEventListener('pointerdown', (e) => { dragging = true; dragged = false; sx = e.clientX; seal.setPointerCapture(e.pointerId); });
  seal.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = Math.abs(e.clientX - sx); if (dx > 6) dragged = true; const h = $$('.half', lid); h[0].style.transition = h[1].style.transition = 'none'; h[0].style.transform = `translateX(${-dx * .5}px)`; h[1].style.transform = `translateX(${dx * .5}px)`; if (dx > 90) { dragging = false; h.forEach((x) => { x.style.transition = ''; }); openBox(); } });
  const endDrag = () => { if (!dragging) return; dragging = false; $$('.half', lid).forEach((h) => { h.style.transition = ''; h.style.transform = ''; }); setTimeout(() => { dragged = false; }, 50); };
  seal.addEventListener('pointerup', endDrag); seal.addEventListener('pointercancel', endDrag);
  if (FINE) $('.hint .d', lid).textContent = 'Click'; else $('.hint .d', lid).textContent = 'Tap';
  addEventListener('keydown', (e) => { if (!opened && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openBox(); } });

  /* the bar steps aside on the way down */
  const top = $('#top'); let ly = 0; addEventListener('scroll', () => { const y = scrollY; top.classList.toggle('hide', y > ly && y > 240); ly = y; }, { passive: true });
  document.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href') === '#') return; const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); } });

  /* ---------- the mascot cursor (laptops) and the tap pop (phones) ---------- */
  const cu = $('#cur'); let tx = 0, ty = 0, x = 0, y = 0, run = false;
  if (FINE) { root.classList.add('fine'); cu.querySelector('span').textContent = 'Open';
    const loop = () => { x += (tx - x) * .22; y += (ty - y) * .22; cu.style.setProperty('--x', x + 'px'); cu.style.setProperty('--y', y + 'px'); if (Math.abs(tx - x) + Math.abs(ty - y) > .1) requestAnimationFrame(loop); else run = false; };
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; if (!root.classList.contains('moved')) { root.classList.add('moved'); x = tx; y = ty; } if (!run) { run = true; requestAnimationFrame(loop); }
      const t = e.target; cu.classList.toggle('dish', !!t.closest('.cp')); cu.classList.toggle('btn', !t.closest('.cp') && !!t.closest('a,button,label')); }, { passive: true });
    document.addEventListener('pointerleave', () => root.classList.remove('moved')); }
  else addEventListener('pointerdown', (e) => { if (e.target.closest('.seal')) return; const p = document.createElement('div'); p.className = 'tp'; p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px'; p.innerHTML = '<i class="mk"></i>'; document.body.append(p); setTimeout(() => p.remove(), 850); }, { passive: true });

  /* ---------- the share card (canvas) ---------- */
  const cardD = $('#cardD'), cv = $('#cv'), cx = cv.getContext('2d');
  const G = '#4a442c', C = '#f8f2e4';
  const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  const wrap = (t, mw) => { const w = t.split(' '), out = []; let l = ''; w.forEach((x) => { const n = l ? l + ' ' + x : x; if (cx.measureText(n).width > mw && l) { out.push(l); l = x; } else l = n; }); if (l) out.push(l); return out; };
  const drawCard = async () => {
    await Promise.all([document.fonts.load('300 100px Fraunces'), document.fonts.load('500 40px "DM Sans"')]).catch(() => {});
    const used = Object.keys(sel).filter((k) => sel[k].size), photos = (await Promise.all(used.map((k) => by(k).photo ? load(IMG(by(k).photo)) : null))).filter(Boolean).slice(0, 4), mark = await load(IMG('logo-mark.png'));
    cx.clearRect(0, 0, 1080, 1350); cx.fillStyle = G; cx.fillRect(0, 0, 1080, 1350);
    cx.strokeStyle = C; cx.globalAlpha = .35; cx.lineWidth = 2; cx.beginPath(); cx.roundRect(36, 36, 1008, 1278, 44); cx.stroke(); cx.globalAlpha = 1;
    if (mark) { const oc = document.createElement('canvas'); oc.width = oc.height = 220; const o = oc.getContext('2d'); o.drawImage(mark, 0, 0, 220, 220); o.globalCompositeOperation = 'source-in'; o.fillStyle = C; o.fillRect(0, 0, 220, 220); cx.drawImage(oc, 540 - 55, 96, 110, 110); }
    cx.fillStyle = C; cx.textAlign = 'center'; cx.font = '500 26px "DM Sans", sans-serif'; if ('letterSpacing' in cx) cx.letterSpacing = '8px'; cx.fillText('BUN BUN CAFE', 540, 262); if ('letterSpacing' in cx) cx.letterSpacing = '0px';
    cx.font = '300 112px Fraunces, Georgia, serif'; cx.fillText('My Bun Bun', 540, 396); cx.font = 'italic 300 112px Fraunces, Georgia, serif'; cx.globalAlpha = .62; cx.fillText('box.', 540, 510); cx.globalAlpha = 1;
    cx.textAlign = 'left'; cx.font = '400 40px "DM Sans", sans-serif'; let yy = 600; const ls = lines();
    (ls.length ? ls : ['• Brownies, waffles and desserts, baked fresh']).forEach((l) => { wrap(l, 880).forEach((t, k) => { if (yy < 900) { cx.fillText(t, 100 + (k ? 28 : 0), yy); yy += 56; } }); yy += 12; });
    const r = 98, gap = 40, n = photos.length, w0 = n * r * 2 + (n - 1) * gap, x0 = 540 - w0 / 2 + r;
    photos.forEach((p, k) => { const cxp = x0 + k * (r * 2 + gap), cyp = 1090; cx.save(); cx.beginPath(); cx.arc(cxp, cyp, r, 0, 6.2832); cx.clip(); cx.drawImage(p, cxp - r, cyp - r, r * 2, r * 2); cx.restore(); cx.beginPath(); cx.arc(cxp, cyp, r + 6, 0, 6.2832); cx.strokeStyle = C; cx.lineWidth = 3; cx.stroke(); });
    cx.textAlign = 'center'; cx.font = '500 30px "DM Sans", sans-serif'; cx.globalAlpha = .85; cx.fillText('Baked fresh · Made to order · ' + B.handle, 540, 1262); cx.globalAlpha = 1; };
  $('#mk').addEventListener('click', async () => { await drawCard(); cardD.showModal(); });
  $('#cSave').addEventListener('click', () => { cv.toBlob(async (b) => { if (!b) return; const f = new File([b], 'my-bun-bun-box.png', { type: 'image/png' });
    try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'My Bun Bun box', text: 'I am treating myself to Bun Bun Cafe ' + B.handle }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'my-bun-bun-box.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png'); });
})();
