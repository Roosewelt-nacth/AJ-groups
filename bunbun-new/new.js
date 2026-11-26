/* Bun Bun Cafe, new design. Libraries (pinned, self-hosted in ./vendor): GSAP + ScrollTrigger (animation and scroll),
   Lenis (smooth scroll), Matter.js (sprinkle physics). The chocolate ripple is plain WebGL written here.
   Edit business details in BUNBUN below. Anything null shows "to be added". */
const BUNBUN = {
  whatsapp: '918807893624',            // AJ GROUPS business number for now; replace with Bun Bun's own (country code, no + or spaces)
  instagram: 'https://www.instagram.com/bun.bun.bakes/?hl=en',
  fssai: null, location: null, noticeDays: 2,
  menu: [
    { cat: 'Brownies', wash: '#8a4b26', photo: 'menu-c/nutella-brownie.webp', story: 'Rich, fudgy and made to be shared.', items: ['Nutella Brownie', 'Double Chocolate Brownie', 'Metro Chocolate Brownie'] },
    { cat: 'Waffles', wash: '#c98a3c', photo: 'menu-c/triple-choc-waffle.webp', story: 'Warm, crisp and finished with chocolate.', items: ['White Chocolate Waffle', 'Triple Chocolate Waffle'] },
    { cat: 'Desserts', wash: '#d79a2f', photo: 'menu-c/caramel-pudding.webp', story: 'Silky, chilled and made to be savoured.', items: ['Chocolate Mousse', 'Caramel Pudding'] },
    { cat: 'Cakes', photo: null, items: [], story: 'Our cake collection is being finalised. We also create bespoke cakes for birthdays, anniversaries and special occasions.' },
  ],
  seasonal: [
    { name: 'Traditional Rum-Soaked Plum Cake', tag: 'Contains alcohol (rum). Not for under-18s.', photo: 'menu-c/plum-rum.webp', sizes: ['Half kg', '1 kg'], desc: 'A festive classic prepared with carefully selected ingredients and rum-soaked fruits, bringing together the rich and traditional flavours of Christmas.' },
    { name: 'Non-Alcoholic Plum Cake', tag: 'Prepared without alcohol', photo: 'menu-c/plum-free.webp', sizes: ['Half kg', '1 kg'], desc: 'Enjoy the traditional festive plum cake experience with our non-alcoholic version.' },
  ],
  hamper: { sizes: ['Petite', 'Classic', 'Grand'], items: ['Plum cake', 'Brownies', 'Caramel pudding', 'Waffles', 'Chocolate mousse'] },
  christmas: [2026, 11, 25],
};

(() => {
  const B = BUNBUN, root = document.documentElement, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const DESK = () => matchMedia('(min-width:901px)').matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wa = (t) => 'https://wa.me/' + B.whatsapp + '?text=' + encodeURIComponent(t);
  const IMG = (p) => '../assets/bunbun/' + p;
  const NOTE = `Date needed: ______ (I know orders need ${B.noticeDays} days' notice)`;
  const msg = (l) => wa(['Hi Bun Bun Cafe, I would like to order:'].concat(l.filter(Boolean), ['', NOTE]).join('\n'));
  const gsapOK = !!(window.gsap && window.ScrollTrigger);
  if (!RM) root.classList.add('js');

  /* ---------- content ---------- */
  const seg = (s) => `<div class="seg" role="group" aria-label="Size">${s.map((x, k) => `<button type="button" data-s="${esc(x)}" aria-pressed="${k === 0}">${esc(x)}</button>`).join('')}</div>`;
  const feat = (c, k) => c.items.length
    ? `<article class="fc" data-cat="${esc(c.cat)}" style="--wash:${c.wash}"><div class="fp"><img src="${IMG(c.photo)}" alt="${esc(c.cat)}" width="640" height="640" loading="lazy" decoding="async"></div>
       <div class="fb"><span class="fn">0${k + 1}</span><h3>${esc(c.cat)}</h3><p>${esc(c.story)}</p><div><span class="lb">Choose your favourites</span><div class="chk">${c.items.map((x) => `<label><input type="checkbox" value="${esc(x)}">${esc(x)}</label>`).join('')}</div></div>
       <a class="pillbtn solid go" href="#" target="_blank" rel="noopener">Enquire &rarr;</a></div></article>`
    : `<article class="fc wide"><div class="fp"><i class="mk"></i></div><div class="fb"><span class="fn">0${k + 1}</span><h3>${esc(c.cat)}</h3><p>${esc(c.story)}</p><a class="pillbtn" href="${wa('Hi Bun Bun Cafe, I would like to ask about a bespoke cake.\n\nOccasion:\nFlavour and size:\n' + NOTE)}" target="_blank" rel="noopener">Enquire about a bespoke cake</a></div></article>`;
  const cake = (i) => `<article class="pc" data-name="${esc(i.name)}"><div class="ph"><img src="${IMG(i.photo)}" alt="${esc(i.name)}" width="640" height="640" loading="lazy" decoding="async"></div><span class="tg">${esc(i.tag)}</span><h3>${esc(i.name)}</h3><p>${esc(i.desc)}</p><div class="act">${seg(i.sizes)}<a class="pillbtn solid go" href="#" target="_blank" rel="noopener">Enquire &rarr;</a></div></article>`;
  const H = B.hamper;
  const hamper = () => `<article class="pc hm" data-hamper><span class="tg">Made to order</span><h3>Christmas Hamper</h3><p>Choose a size and what goes inside. We confirm the final box with you on WhatsApp.</p><div class="act">${seg(H.sizes)}</div>
    <div class="chk">${H.items.map((x) => `<label><input type="checkbox" value="${esc(x)}">${esc(x)}</label>`).join('')}</div><input class="fld" maxlength="70" placeholder="Card message (optional)" aria-label="Card message"><div class="act"><a class="pillbtn solid go" href="#" target="_blank" rel="noopener">Enquire &rarr;</a></div></article>`;
  $$('[data-list]').forEach((el) => { el.innerHTML = el.dataset.list === 'menu' ? B.menu.map(feat).join('') : B.seasonal.map(cake).join('') + hamper(); });

  const upd = (r) => { const a = $('a.go', r); if (!a) return; const sz = $('.seg [aria-pressed="true"]', r);
    if (r.hasAttribute('data-cat')) { const s = $$('.chk input:checked', r).map((x) => x.value); a.href = msg(['• ' + r.dataset.cat + ': ' + (s.length ? s.join(', ') : 'selection to be discussed')]); }
    else if (r.hasAttribute('data-hamper')) { const s = $$('.chk input:checked', r).map((x) => x.value), c = $('.fld', r).value.trim(); a.href = msg(['• Christmas hamper' + (sz ? ' (' + sz.dataset.s + ')' : ''), '  Inside: ' + (s.length ? s.join(', ') : 'to be discussed'), c ? '  Card message: ' + c : '']); }
    else a.href = msg(['• ' + r.dataset.name + (sz ? ' (' + sz.dataset.s + ')' : '')]); };
  $$('[data-name],[data-hamper],[data-cat]').forEach(upd);
  document.addEventListener('click', (e) => { const b = e.target.closest('.seg button'); if (!b) return; $$('button', b.parentElement).forEach((x) => x.setAttribute('aria-pressed', x === b)); upd(b.closest('[data-name],[data-hamper]')); });

  /* basket: everything ticked across the Creations, in one WhatsApp message */
  const bk = $('#bk'), bkU = () => { const ls = $$('[data-cat]').map((r) => { const s = $$('.chk input:checked', r).map((x) => x.value); return s.length ? '• ' + r.dataset.cat + ': ' + s.join(', ') : ''; }).filter(Boolean);
    const n = $$('[data-cat] .chk input:checked').length; bk.classList.toggle('on', n > 0); $('b', bk).textContent = n; $('a', bk).href = msg(ls); };
  ['input', 'change'].forEach((t) => document.addEventListener(t, (e) => { const r = e.target.closest('[data-hamper],[data-cat]'); if (r) { upd(r); bkU(); } }));
  $('button', bk).addEventListener('click', () => { $$('[data-cat] .chk input').forEach((x) => { x.checked = false; }); $$('[data-cat]').forEach(upd); bkU(); });

  /* details and links */
  $$('[data-wa]').forEach((a) => { a.href = wa('Hi Bun Bun Cafe, I would like to place an order.'); });
  $$('[data-fill]').forEach((el) => { const k = el.dataset.fill;
    if (k === 'fssai') el.textContent = B.fssai || 'to be added';
    if (k === 'location') el.textContent = B.location || 'Location to be added';
    if (k === 'wa-number') el.textContent = '+' + B.whatsapp.replace(/^(\d{2})(\d{5})(\d+)$/, '$1 $2 $3');
    if (k === 'instagram' && !B.instagram) { el.removeAttribute('href'); $('b', el).textContent = 'Link coming soon'; } else if (k === 'instagram') el.href = B.instagram; });
  $$('[data-xdays]').forEach((el) => { const n = new Date(), d0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()); el.textContent = Math.max(0, Math.round((new Date(...B.christmas) - d0) / 864e5)); });

  /* words rise from a mask */
  const splitWords = (el) => { const walk = (node) => [...node.childNodes].forEach((n) => { if (n.nodeType === 3) { const f = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach((p) => { if (!p.trim()) { f.append(p); return; } const w = document.createElement('span'); w.className = 'w'; w.innerHTML = '<span>' + p + '</span>'; f.append(w); }); n.replaceWith(f); } else if (n.nodeType === 1) walk(n); }); walk(el); return $$('.w > span', el); };

  /* smooth in-page links (also works without the libraries) */
  let lenis = null;
  const go = (id) => { const t = $(id); if (!t) return; if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.4 }); else t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); };
  document.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href') === '#') return; e.preventDefault(); go(a.getAttribute('href')); });

  if (RM || !gsapOK) { $('#load').remove(); return; }

  /* ---------- motion ---------- */
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) { lenis = new Lenis({ lerp: .09, wheelMultiplier: .95 }); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  lenis && lenis.stop();

  const words = splitWords($('.hero h1')); gsap.set(words, { yPercent: 115 });
  gsap.set(['.hero .eyebrow', '.hero .lead', '.cta > *', '.scrollcue'], { opacity: 0, y: 22 }); gsap.set('.float', { opacity: 0, scale: .7 }); gsap.set('.bar', { yPercent: -120 });

  /* opening: the oven warms to 180 degrees, then the curtain lifts */
  const dn = $('#ldn'), o = { v: 0 };
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to(o, { v: 180, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { dn.textContent = Math.round(o.v); } })
    .to('#load', { yPercent: -100, duration: 1.0, ease: 'power4.inOut', onComplete: () => { $('#load').remove(); lenis && lenis.start(); } }, '+=.15')
    .to('.bar', { yPercent: 0, duration: .9 }, '-=.35')
    .to('.hero .eyebrow', { opacity: 1, y: 0, duration: .8 }, '-=.6')
    .to(words, { yPercent: 0, duration: 1.1, stagger: .09 }, '-=.7')
    .to('.float', { opacity: 1, scale: 1, duration: 1.4, stagger: .15, ease: 'expo.out' }, '-=.9')
    .to(['.hero .lead', '.cta > *', '.scrollcue'], { opacity: 1, y: 0, duration: .9, stagger: .08 }, '-=1');

  /* top bar leaves on the way down, returns on the way up */
  const bar = $('#bar'); let ly = 0; ScrollTrigger.create({ onUpdate: (s) => { const y = s.scroll(); bar.classList.toggle('hide', y > ly && y > 200); ly = y; } });

  /* hero: floating dishes drift with the pointer and with scroll */
  $$('.float').forEach((f, i) => { gsap.to(f, { yPercent: -18 - i * 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to(f.firstElementChild, { y: '+=14', rotate: i % 2 ? -4 : 4, duration: 3.4 + i, ease: 'sine.inOut', yoyo: true, repeat: -1 }); });
  if (FINE) { const mx = gsap.quickTo; const fx = $$('.float img').map((el, i) => [mx(el, 'x', { duration: 1.2, ease: 'power3' }), mx(el, 'xPercent', { duration: 1 }), 18 + i * 10]);
    $('.hero').addEventListener('pointermove', (e) => { const nx = e.clientX / innerWidth - .5; fx.forEach(([q, , k]) => q(nx * k * -2)); }); }

  /* magnetic buttons */
  if (FINE) $$('.mag').forEach((b) => { const qx = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' }), qy = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * .3); qy((e.clientY - r.top - r.height / 2) * .4); });
    b.addEventListener('pointerleave', () => { qx(0); qy(0); }); });

  /* headings rise as they arrive */
  $$('.big, .eyebrow, .lead, .notice, .two p, .founder > *, .pills, .cc, .pc').forEach((el) => { gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }); });

  /* our way: pinned, three steps swap as you scroll (laptops); stacked on phones */
  const mm = gsap.matchMedia();
  mm.add('(min-width:901px)', () => {
    const steps = $$('.st'), dots = $$('.dots i'), imgs = $$('.frame img'); let cur = -1;
    const show = (i) => { if (i === cur) return; cur = i; steps.forEach((s, k) => s.classList.toggle('on', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k === i)); imgs.forEach((m, k) => m.classList.toggle('on', k === i)); };
    ScrollTrigger.create({ trigger: '.story', start: 'top top', end: '+=240%', pin: '.sp', onUpdate: (s) => show(Math.min(2, Math.floor(s.progress * 3))) });
    show(0);
    /* creations: pinned, the counter slides sideways */
    const tr = $('.track'), dist = () => Math.max(0, tr.scrollWidth - innerWidth + 0);
    gsap.to(tr, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.counter', start: 'top 12%', end: () => '+=' + dist(), pin: true, scrub: .6, anticipatePin: 1, invalidateOnRefresh: true } });
  });
  /* the story image on phones just wipes in */
  mm.add('(max-width:900px)', () => { gsap.from('.frame', { clipPath: 'inset(0 0 100% 0)', duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.frame', start: 'top 85%', once: true } }); });

  /* ---------- chocolate ripple on the dish photos (plain WebGL, laptops only) ---------- */
  const ripple = (fp) => { const img = $('img', fp); const cv = document.createElement('canvas'); const gl = cv.getContext('webgl', { premultipliedAlpha: false, alpha: true }); if (!gl) return;
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, 'attribute vec2 a;varying vec2 u;void main(){u=a*.5+.5;u.y=1.-u.y;gl_Position=vec4(a,0.,1.);}'));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec2 u;uniform sampler2D t;uniform vec2 m;uniform float s,k;void main(){vec2 d=u-m;float r=length(d);float w=sin(r*46.-k*5.)*exp(-r*4.5)*s*.016;vec2 n=d/(r+.0001);gl_FragColor=texture2D(t,u+n*w);}'));
    gl.linkProgram(p); gl.useProgram(p); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const U = (n) => gl.getUniformLocation(p, n); const um = U('m'), us = U('s'), uk = U('k'); let s = 0, ts = 0, mx = .5, my = .5, run = false, t0 = performance.now();
    const ld = () => { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); fp.appendChild(cv); }; if (img.complete) ld(); else img.addEventListener('load', ld, { once: true });
    const fit = () => { const r = fp.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 1.5); cv.width = r.width * d; cv.height = r.height * d; gl.viewport(0, 0, cv.width, cv.height); }; fit(); addEventListener('resize', fit);
    const draw = (now) => { s += (ts - s) * .08; gl.uniform2f(um, mx, my); gl.uniform1f(us, s); gl.uniform1f(uk, (now - t0) / 1000); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (s > .01 || ts > 0) requestAnimationFrame(draw); else { run = false; fp.classList.remove('gl'); } };
    fp.addEventListener('pointermove', (e) => { const r = fp.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height; ts = 1; fp.classList.add('gl'); if (!run) { run = true; requestAnimationFrame(draw); } });
    fp.addEventListener('pointerleave', () => { ts = 0; }); };
  if (FINE) $$('.fc .fp').forEach((fp) => { if ($('img', fp)) fp.addEventListener('pointerenter', () => { if (!fp.dataset.r) { fp.dataset.r = 1; ripple(fp); } }, { once: true }); });

  /* ---------- seasonal snow (only while on screen) ---------- */
  const sc = $('.snow'); if (sc) { const x = sc.getContext('2d'), sec = sc.parentElement; let W = 0, Hh = 0, on = false, lt = 0;
    const fl = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), r: .7 + Math.random() * 2, v: .012 + Math.random() * .03, a: .12 + Math.random() * .3, w: Math.random() * 6.28 }));
    const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); W = sec.clientWidth; Hh = sec.clientHeight; sc.width = W * d; sc.height = Hh * d; x.setTransform(d, 0, 0, d, 0, 0); };
    const tk = (now) => { if (!on) return; const dt = Math.min(.05, (now - (lt || now)) / 1000); lt = now; x.clearRect(0, 0, W, Hh); x.fillStyle = getComputedStyle(sec).color;
      fl.forEach((f) => { f.y += f.v * dt * 6 * (800 / Math.max(Hh, 400)); f.w += dt * .6; if (f.y > 1.02) { f.y = -.02; f.x = Math.random(); } x.globalAlpha = f.a; x.beginPath(); x.arc((f.x + Math.sin(f.w) * .012) * W, f.y * Hh, f.r, 0, 6.283); x.fill(); }); x.globalAlpha = 1; requestAnimationFrame(tk); };
    fit(); new ResizeObserver(fit).observe(sec); new IntersectionObserver((es) => { const v = es[0].isIntersecting; if (v && !on) { on = true; lt = 0; requestAnimationFrame(tk); } on = v; }).observe(sec); }

  /* ---------- the sprinkle floor (Matter.js): falls when Contact arrives, drag with the pointer on laptops ---------- */
  const fc = $('#floor'); if (fc && window.Matter) { const M = Matter, sec = fc.parentElement, ctx = fc.getContext('2d'); let eng, W, Hh, started = false, raf = 0, vis = false;
    const cols = ['#4a442c', '#7a6a3e', '#b9803f', '#d9b36a', '#f8f2e4', '#8a4b26', '#a8a07a'];
    const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); W = sec.clientWidth; Hh = sec.clientHeight; fc.width = W * d; fc.height = Hh * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const start = () => { started = true; fit(); eng = M.Engine.create({ gravity: { y: 1.1 } });
      const t = 60, wl = { isStatic: true, render: { visible: false } };
      M.Composite.add(eng.world, [M.Bodies.rectangle(W / 2, Hh + t / 2 - 56, W * 2, t, wl), M.Bodies.rectangle(-t / 2, Hh / 2, t, Hh * 3, wl), M.Bodies.rectangle(W + t / 2, Hh / 2, t, Hh * 3, wl)]);
      const n = W < 700 ? 70 : 130; for (let i = 0; i < n; i++) setTimeout(() => { if (!eng) return; const c = cols[i % cols.length], b = M.Bodies.rectangle(40 + Math.random() * (W - 80), -30 - Math.random() * 120, 26 + Math.random() * 12, 9, { chamfer: { radius: 4 }, restitution: .3, friction: .4, angle: Math.random() * 3 }); b.c = c; b.w = b.bounds.max.x - b.bounds.min.x; M.Composite.add(eng.world, b); }, i * 26);
      if (FINE) { const mo = M.Mouse.create(fc), mc = M.MouseConstraint.create(eng, { mouse: mo, constraint: { stiffness: .2, render: { visible: false } } }); M.Composite.add(eng.world, mc); mo.element.removeEventListener('wheel', mo.mousewheel); mo.element.removeEventListener('mousewheel', mo.mousewheel); mo.element.removeEventListener('DOMMouseScroll', mo.mousewheel); }
      const loop = () => { if (!vis) { raf = 0; return; } M.Engine.update(eng, 1000 / 60); ctx.clearRect(0, 0, W, Hh);
        M.Composite.allBodies(eng.world).forEach((b) => { if (!b.c) return; ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle); ctx.fillStyle = b.c; ctx.beginPath(); ctx.roundRect(-b.w / 2, -4.5, b.w, 9, 4.5); ctx.fill(); ctx.restore(); }); raf = requestAnimationFrame(loop); };
      start.loop = loop; };
    new IntersectionObserver((es) => { vis = es[0].isIntersecting; if (vis && !started && sec.getBoundingClientRect().top < innerHeight * .8) start(); if (vis && started && !raf) raf = requestAnimationFrame(start.loop); }, { threshold: .25 }).observe(sec);
    addEventListener('resize', () => { if (started) fit(); }); }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
