/* Bun Bun extras: share a cake, delivery map with ETA, saved dates with countdowns.
   Everything configurable lives in menu.js (DELIVERY). */
const MSG_STYLES = ['script', 'piped', 'plaque'];

export function initExtras(c) {
  const { S, $, apply, preset, OCC, keys, XM, inr, D, renderer, scene, cam, cvs, reduce } = c;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), has = (m, k) => Object.prototype.hasOwnProperty.call(m, k);
  const pad = (n) => String(n).padStart(2, '0'), iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const midnight = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const fmt = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  /* ============ 1. SHARE: a link that rebuilds the cake, and a card you can send ============ */
  const b64 = (s) => { let t = ''; new TextEncoder().encode(s).forEach((x) => { t += String.fromCharCode(x); }); return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0)));
  const encode = () => b64(JSON.stringify({ o: S.occ, y: S.style, t: S.tiers, f: S.flavour, r: S.frost, d: S.drip, p: [...S.tops], c: S.candles ? 1 : 0, m: S.msg, s: S.msgStyle, x: S.deco.map((d) => [+d.x.toFixed(2), +d.z.toFixed(2), d.t === 'macaron' ? 1 : 0]), q: S.qty }));
  function decode(str) {
    try {
      const o = JSON.parse(unb64(str));
      return { occ: OCC.some((x) => x.k === o.o) ? o.o : 'Birthday', style: has(keys.STYLE, o.y) ? o.y : 'naked', tiers: [1, 2, 3].includes(+o.t) ? +o.t : 2, flavour: has(keys.FL, o.f) ? o.f : 'vanilla', frost: has(keys.FR, o.r) ? o.r : 'cream', drip: has(keys.DR, o.d) ? o.d : 'none',
        tops: new Set((Array.isArray(o.p) ? o.p : []).filter((k) => has(keys.TOPS, k)).slice(0, 8)), candles: !!o.c, msg: String(o.m || '').slice(0, 22), msgStyle: MSG_STYLES.includes(o.s) ? o.s : 'script',
        deco: (Array.isArray(o.x) ? o.x : []).slice(0, 10).filter((a) => Array.isArray(a) && isFinite(a[0]) && isFinite(a[1])).map((a) => ({ x: clamp(+a[0], -3, 3), z: clamp(+a[1], -3, 3), t: a[2] === 1 ? 'macaron' : 'strawberry' })), qty: clamp(Math.round(+o.q || 1), 1, 20), decorate: false };
    } catch (e) { return null; }
  }
  const shareURL = () => { const u = new URL(location.href); u.search = ''; if (XM) u.searchParams.set('xmas', '1'); u.searchParams.set('cake', encode()); u.hash = '#build'; return u.toString(); };
  const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const rrect = (x, a, b, w, h, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); };
  async function cardImage() {
    renderer.render(scene, cam); const cake = await load(cvs.toDataURL('image/png'));
    const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    const cs = getComputedStyle(document.documentElement), v = (n, f) => cs.getPropertyValue(n).trim() || f, bg = v('--bg', '#4a442c'), b1 = v('--bg1', '#6b6340'), ink = v('--ink', '#ffffff'), acc = v('--accent', ink), glow = v('--stage-glow', 'rgba(255,255,255,.2)');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    let g = x.createRadialGradient(W * .3, H * .12, 0, W * .3, H * .12, W * 1.05); g.addColorStop(0, b1); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    g = x.createRadialGradient(W / 2, H * .5, 0, W / 2, H * .5, W * .58); g.addColorStop(0, glow); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    rrect(x, 36, 36, W - 72, H - 72, 60); x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 2; x.stroke();
    const wm = await load('../assets/bunbun/logo-word.png?v=2');
    if (wm) { const t = document.createElement('canvas'); t.width = wm.width; t.height = wm.height; const tx = t.getContext('2d'); tx.drawImage(wm, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = ink; tx.fillRect(0, 0, t.width, t.height); const ww = 300; x.drawImage(t, (W - ww) / 2, 92, ww, ww * wm.height / wm.width); }
    if (cake) x.drawImage(cake, 40, 215, 1000, 1000);
    x.textAlign = 'center'; x.fillStyle = ink; x.font = "italic 500 78px 'Cormorant Garamond', Georgia, serif"; x.fillText(S.msg.trim() || `${S.occ} cake`, W / 2, 1182);
    x.font = "500 25px Inter, system-ui, sans-serif"; try { x.letterSpacing = '3px'; } catch (e) {} x.fillStyle = acc; const info = `${keys.TIER[S.tiers][0]} · ${keys.FL[S.flavour][0]} sponge · ${keys.STYLE[S.style]}`.toUpperCase(); x.fillText(info, W / 2, 1238);
    x.fillStyle = ink; x.globalAlpha = .75; x.font = "500 23px Inter, system-ui, sans-serif"; x.fillText('DESIGN YOURS AT BUN BUN BAKES', W / 2, 1290); x.globalAlpha = 1; try { x.letterSpacing = '0px'; } catch (e) {}
    return cv;
  }
  const modal = document.createElement('div'); modal.className = 'shm'; modal.hidden = true; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Share your cake');
  modal.innerHTML = '<div class="shb"><button type="button" class="shx" aria-label="Close">✕</button><img id="shimg" alt="Your cake card" width="270" height="338"><div class="shr"><button type="button" class="btn" id="shNative">Share…</button><a class="btn ghost" id="shWa" target="_blank" rel="noopener">WhatsApp</a><button type="button" class="btn ghost" id="shCopy">Copy link</button><a class="btn ghost" id="shSave" download="my-bun-bun-cake.png">Save image</a></div><p class="shmsg" id="shmsg" role="status"></p></div>';
  document.body.appendChild(modal);
  const shmsg = $('shmsg'), closeShare = () => { modal.hidden = true; document.body.style.overflow = ''; }; let blobURL = '';
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.shx')) closeShare(); }); addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeShare(); });
  $('bShare').addEventListener('click', async () => {
    const url = shareURL(), text = `I designed a ${S.occ.toLowerCase()} cake at Bun Bun Cafe. What do you think?`; shmsg.textContent = 'Making your card…'; modal.hidden = false; document.body.style.overflow = 'hidden';
    const cv = await cardImage(), blob = await new Promise((r) => cv.toBlob(r, 'image/png')); if (blobURL) URL.revokeObjectURL(blobURL); blobURL = URL.createObjectURL(blob);
    $('shimg').src = blobURL; $('shSave').href = blobURL; $('shWa').href = 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url); shmsg.textContent = 'Anyone with the link sees your exact design and can change it.';
    const file = new File([blob], 'my-bun-bun-cake.png', { type: 'image/png' }), nat = $('shNative'); nat.style.display = navigator.share ? '' : 'none';
    nat.onclick = async () => { try { if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'My Bun Bun cake', text: text + ' ' + url }); else await navigator.share({ title: 'My Bun Bun cake', text, url }); } catch (e) {} };
    $('shCopy').onclick = async () => { try { await navigator.clipboard.writeText(url); shmsg.textContent = 'Link copied.'; } catch (e) { const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); shmsg.textContent = 'Link copied.'; } catch (x) { shmsg.textContent = url; } t.remove(); } };
  });
  /* opened from a shared link */
  const sp = new URLSearchParams(location.search).get('cake');
  if (sp) { const patch = decode(sp); if (patch) {
    const run = () => { apply(patch); const b = document.createElement('div'); b.className = 'xc sharedb'; b.innerHTML = '<span>This cake was designed and shared with you. Change anything you like, then order.</span><button type="button" class="btn ghost">Start fresh</button>'; $('build').querySelector('.builder').before(b);
      b.querySelector('button').addEventListener('click', () => { apply(preset(OCC[0])); b.remove(); });
      setTimeout(() => $('build').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 700); };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(run, 400)); } }

  /* ============ 2. DELIVERY: map, ride time, fee and the earliest slot ============ */
  const dmap = document.createElement('div'); dmap.className = 'dmap'; dmap.id = 'dmap'; $('shipMsg').after(dmap);
  const slotSel = document.querySelector('#form select[name="s"]'); if (slotSel) slotSel.innerHTML = D.slots.map((s) => `<option>${s}</option>`).join('');
  const earliest = () => { const n = new Date(), add = n.getHours() < D.cutoffHour ? D.leadDays : D.leadDays + 1; return new Date(n.getFullYear(), n.getMonth(), n.getDate() + add); };
  const untilCutoff = () => { const n = new Date(), cut = new Date(n.getFullYear(), n.getMonth(), n.getDate(), D.cutoffHour); if (n >= cut) cut.setDate(cut.getDate() + 1); const m = Math.max(0, Math.round((cut - n) / 60000)); return `${Math.floor(m / 60)}h ${pad(m % 60)}m`; };
  const mapSVG = (km, pin) => {
    const sc = 19, kx = 52, ky = 128, h = (Math.imul(+pin, 2654435761) >>> 0), ang = -(4 + (h % 3400) / 100) * Math.PI / 180, dx = Math.cos(ang) * km * sc, dy = Math.sin(ang) * km * sc, tx = kx + dx, ty = ky + dy, mx = kx + dx * .62;
    const path = `M${kx} ${ky} L${mx.toFixed(1)} ${ky} L${mx.toFixed(1)} ${ty.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)}`, side = tx > 230 ? 'end' : 'middle', lx = tx > 230 ? tx + 6 : tx;
    let streets = ''; [30, 62, 94, 128, 160].forEach((y) => { streets += `<line x1="0" y1="${y}" x2="320" y2="${y}"/>`; }); [40, 88, 136, 184, 232, 280].forEach((x) => { streets += `<line x1="${x}" y1="0" x2="${x}" y2="170"/>`; });
    const rings = [3, 6, D.radiusKm].map((k) => `<circle cx="${kx}" cy="${ky}" r="${(k * sc).toFixed(1)}"/>`).join('');
    return `<svg viewBox="0 0 320 170" role="img" aria-label="Map from our kitchen to your pincode, ${km.toFixed(1)} km"><g style="stroke:var(--line);stroke-width:1;fill:none" opacity=".8">${streets}</g><ellipse cx="232" cy="46" rx="34" ry="18" style="fill:var(--accent)" opacity=".14"/><path d="M0 70 C70 40 120 110 190 80 S290 100 320 60" style="stroke:var(--accent);fill:none" stroke-width="9" opacity=".16"/>
      <g style="stroke:var(--ink);fill:none" stroke-dasharray="3 5" opacity=".38">${rings}</g><text x="${kx + 3 * sc + 3}" y="${ky - 5}" font-size="8" style="fill:var(--mute)">3 km</text><text x="${kx + 6 * sc + 3}" y="${ky - 5}" font-size="8" style="fill:var(--mute)">6 km</text>
      <path d="${path}" fill="none" style="stroke:var(--accent)" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" opacity=".28"/><path class="dflow" d="${path}" fill="none" style="stroke:var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="2 7"/>
      <circle cx="${kx}" cy="${ky}" r="9" style="fill:var(--btn)"/><circle cx="${kx}" cy="${ky}" r="3.4" style="fill:var(--btn-ink)"/><text x="${kx}" y="${ky + 23}" text-anchor="middle" font-size="9" style="fill:var(--ink)">Kitchen</text>
      <g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)})"><path d="M0 0C-7-9-9-14-9-17a9 9 0 1 1 18 0c0 3-2 8-9 17z" style="fill:var(--accent)"/><circle cy="-17" r="3.4" style="fill:var(--bg)"/></g><text x="${lx.toFixed(1)}" y="${(ty + 15).toFixed(1)}" text-anchor="${side}" font-size="9" style="fill:var(--ink)">You · ${km.toFixed(1)} km</text>
      ${reduce ? '' : `<g><circle r="7" style="fill:var(--btn)"/><circle r="2.6" style="fill:var(--btn-ink)"/><animateMotion dur="${Math.max(3.5, km * .75).toFixed(1)}s" repeatCount="indefinite" path="${path}"/></g>`}</svg>`;
  };
  const meta = { km: 0, ride: 0, fee: 0, pin: '' };
  function paintMeta() { const e = earliest(), el = dmap.querySelector('.dmeta'); if (!el) return; el.innerHTML = `<div><span class="mono">On the road</span><b>~${meta.ride} min</b></div><div><span class="mono">Delivery</span><b>${inr(meta.fee)}</b></div><div><span class="mono">Earliest delivery</span><b>${fmt(e)}</b></div><div><span class="mono">Order within</span><b>${untilCutoff()}</b></div>`; }
  function pin(info) {
    if (!info || !info.ok) { dmap.classList.remove('on'); return; }
    Object.assign(meta, { km: info.km, ride: info.eta, fee: info.fee, pin: info.pin }); dmap.innerHTML = `<div class="dsvg">${mapSVG(info.km, info.pin)}</div><div class="dmeta"></div><div class="dslots" id="dslots" role="group" aria-label="Delivery slot"></div><p class="dnote">Cakes are baked to order, so the earliest day depends on the time you order. Distance and times are estimates until real pincode data is connected.</p>`; dmap.classList.add('on'); paintMeta();
    const sl = $('dslots'); sl.innerHTML = D.slots.map((s, i) => `<button type="button" class="chip${i === 0 ? ' on' : ''}" aria-pressed="${i === 0}">${s}</button>`).join(''); S.slot = D.slots[0]; if (slotSel) slotSel.value = S.slot;
    sl.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => { sl.querySelectorAll('button').forEach((x, j) => { x.classList.toggle('on', j === i); x.setAttribute('aria-pressed', j === i); }); S.slot = D.slots[i]; if (slotSel) slotSel.value = S.slot; }));
    const f = $('form').d; if (f) { f.min = iso(earliest()); if (!f.value || parse(f.value) < earliest()) f.value = iso(earliest()); }
  }
  if (slotSel) slotSel.addEventListener('change', () => { S.slot = slotSel.value; const sl = $('dslots'); if (sl) sl.querySelectorAll('button').forEach((x, j) => { const on = D.slots[j] === S.slot; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); });
  setInterval(paintMeta, 30000);

  /* ============ 3. SAVED DATES: countdown, last day to order, calendar ============ */
  const KEY = 'bbdates', list = $('rmList'), sel = $('rmOcc'); let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY) || '[]').filter((e) => e && e.date && e.occ); } catch (e) { items = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} };
  sel.innerHTML = OCC.filter((o) => o.k !== 'Just because' && o.k !== 'Christmas').map((o) => `<option>${o.k}</option>`).join('');
  const FEST = [{ n: 'Christmas', m: 11, d: 25, msg: 'Merry Christmas', occ: 'Festival' }, { n: "New Year's Eve", m: 11, d: 31, msg: 'Happy New Year', occ: 'Festival' }, { n: "Valentine's Day", m: 1, d: 14, msg: 'Be my Valentine', occ: 'Anniversary' }];
  const nextFest = (f) => { const t = midnight(); let d = new Date(t.getFullYear(), f.m, f.d); if (d < t) d = new Date(t.getFullYear() + 1, f.m, f.d); return d; };
  $('rmFest').innerHTML = FEST.map((f, i) => `<button type="button" class="chip" data-i="${i}">${f.n}</button>`).join('');
  const nextOcc = (e) => { const t = midnight(); let d = parse(e.date); if (e.yearly) while (d < t) d = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()); return d; };
  const title = (e) => (e.name ? `${e.name}'s ${e.occ}` : e.occ);
  const status = (days) => { const left = days - D.leadDays; if (days < 0) return ['late', 'Passed', 'This date has passed.']; if (days === 0) return ['late', 'Today', 'Today is the day. Pick something ready from the menu.']; if (left < 0) return ['late', 'Too late for a custom cake', `Custom cakes need ${D.leadDays} days. Choose from the menu or call us.`]; if (left === 0) return ['urgent', 'Order today', 'Today is the last day to order a custom cake.']; if (left <= 5) return ['soon', `Order within ${left} day${left > 1 ? 's' : ''}`, 'The last day to order is coming up.']; return ['ok', 'Plenty of time', 'Plan the design now and order later.']; };
  function ics(e) {
    const d = nextOcc(e), ymd = (x) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}`, end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1), clean = (s) => String(s).replace(/[\\;,]/g, ' ').replace(/\r?\n/g, ' '), trig = (days) => { const h = Math.max(0, days * 24 - 9), dd = Math.floor(h / 24), hh = h % 24; return `-P${dd}DT${hh}H`; };
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bun Bun Cafe//Save a date//EN', 'BEGIN:VEVENT', `UID:${e.id}@bunbun`, `DTSTAMP:${ymd(new Date())}T000000Z`, `DTSTART;VALUE=DATE:${ymd(d)}`, `DTEND;VALUE=DATE:${ymd(end)}`, `SUMMARY:${clean(title(e))}`, `DESCRIPTION:Order the cake from Bun Bun Cafe by ${clean(fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate() - D.leadDays)))}.`];
    if (e.yearly) L.push('RRULE:FREQ=YEARLY'); [D.leadDays + 5, D.leadDays].forEach((n) => L.push('BEGIN:VALARM', `TRIGGER:${trig(n)}`, 'ACTION:DISPLAY', n === D.leadDays ? 'DESCRIPTION:Last day to order the cake' : 'DESCRIPTION:Time to plan the cake', 'END:VALARM')); L.push('END:VEVENT', 'END:VCALENDAR');
    const url = URL.createObjectURL(new Blob([L.join('\r\n')], { type: 'text/calendar' })), a = document.createElement('a'); a.href = url; a.download = 'bun-bun-' + clean(title(e)).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  function design(e) {
    const base = e.festMsg ? { msg: e.festMsg } : null, o = OCC.find((x) => x.k === e.occ) || OCC.find((x) => x.k === e.base) || OCC[0], p = preset(o); let msg = base ? base.msg : o.msg; if (e.name && !base) { const m2 = `${o.msg} ${e.name}`; msg = m2.length <= 22 ? m2 : e.name.slice(0, 22); } p.msg = msg; apply(p);
    const f = $('form').d, d = nextOcc(e); if (f && d >= earliest()) f.value = iso(d); $('build').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  function render() {
    const t = midnight(), rows = items.map((e) => { const d = nextOcc(e), days = Math.round((d - t) / 864e5); return { e, d, days }; }).sort((a, b) => a.days - b.days);
    list.innerHTML = rows.length ? rows.map(({ e, d, days }) => { const [k, pill, note] = status(days), by = new Date(d.getFullYear(), d.getMonth(), d.getDate() - D.leadDays);
      return `<div class="xc rmi st-${k}" data-id="${e.id}"><div class="rmc"><b>${Math.max(0, days)}</b><span>${days === 1 ? 'day' : 'days'}</span></div><div class="rmt"><h4>${esc(title(e))}</h4><p>${fmt(d)}${days > D.leadDays ? ` · Order by ${fmt(by)}` : ''}</p><span class="rmpill">${pill}</span><small>${note}</small></div><div class="rma"><button type="button" data-a="design">Design this cake</button><button type="button" data-a="ics">Add to calendar</button><button type="button" data-a="del" aria-label="Remove ${esc(title(e))}">Remove</button></div></div>`; }).join('')
      : '<div class="xc rmempty">No dates saved yet. Add a birthday or anniversary, or tap a festival.</div>';
    const nx = rows.find((r) => r.days >= 0), tc = document.querySelector('.t-c'); if (tc) tc.innerHTML = nx ? `<a href="#remind" style="color:inherit;text-decoration:none">Next: ${esc(title(nx.e))} in ${nx.days} day${nx.days === 1 ? '' : 's'}</a>` : '[ Cakes for every occasion ]';
  }
  list.addEventListener('click', (ev) => { const b = ev.target.closest('button[data-a]'); if (!b) return; const id = b.closest('.rmi').dataset.id, e = items.find((x) => x.id === id); if (!e) return; if (b.dataset.a === 'del') { items = items.filter((x) => x.id !== id); save(); render(); } else if (b.dataset.a === 'ics') ics(e); else design(e); });
  $('rmFest').addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (!b) return; const f = FEST[+b.dataset.i], d = nextFest(f); if (items.some((x) => x.occ === f.n)) return; items.push({ id: 'f' + Date.now().toString(36), occ: f.n, name: '', date: iso(d), yearly: true, festMsg: f.msg, base: f.occ }); save(); render(); });
  $('rmForm').addEventListener('submit', (ev) => { ev.preventDefault(); const date = $('rmDate').value, name = $('rmFor').value.trim().slice(0, 20); if (!date) { $('rmDate').focus(); return; } items.push({ id: 'd' + Date.now().toString(36), occ: sel.value, name, date, yearly: $('rmYear').checked }); save(); $('rmFor').value = ''; $('rmDate').value = ''; render(); });
  $('rmDate').min = iso(midnight()); render();
  return { pin };
}
