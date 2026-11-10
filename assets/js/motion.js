/* =====================================================================
   AJ GROUPS — MOTION AND GALLERY
   Loaded after app.js and adds:
   1. Shared-element transitions: a brand photo and title glide into the brand page
   2. GSAP scroll choreography: headings rise line by line, folio names letter by letter,
      photos drift slowly as you scroll
   3. PhotoSwipe: pinch-zoom, swipe, swipe-down-to-close gallery
   4. Embla: momentum carousel for ventures
   5. Blur-up: photos sharpen in from a soft preview instead of popping in
   If a library fails to load, the site falls back to the simpler versions in app.js.
   Visitors with "reduce motion" turned on get no scroll reveals or shared transitions.
   ===================================================================== */
(function () {
  const G = window.gsap, ST = window.ScrollTrigger, SPLIT = window.SplitText;
  const MOTION = !RM && G && ST && SPLIT;
  if (MOTION) { G.registerPlugin(ST, SPLIT); if (lenis) lenis.on('scroll', ST.update); }

  /* ---------- 5. blur-up photos ---------- */
  function blurUp() {
    $$('main img').forEach(im => {
      if (!/images\.unsplash\.com/.test(im.src) || im.dataset.bu) return;
      im.dataset.bu = '1';
      im.style.backgroundImage = `url("${im.src.replace(/w=\d+/, 'w=40').replace(/q=\d+/, 'q=30')}&blur=40")`;
      const done = () => im.classList.add('bu-in');
      if (im.complete && im.naturalWidth) im.classList.add('bu-in', 'bu-cached'); else im.addEventListener('load', done, { once: true });
    });
  }

  /* ---------- 2. scroll choreography ---------- */
  /* text must never stay hidden: if frames stall (slow phone, background tab), every
     reveal is forced to its end shortly after it was meant to finish */
  /* Text is only hidden at the moment its reveal starts (never in advance), and every reveal
     is forced to its end shortly after it was due, so a stalled frame clock (slow phone,
     background tab) can never leave text invisible. */
  const settle = t => setTimeout(() => { if (t.progress() < 1) t.progress(1); }, (t.duration() + 1) * 1000 + 1200);
  const reveal = (trigger, start, targets, vars) => ST.create({ trigger, start, once: true,
    onEnter: () => settle(G.from(targets(), Object.assign({ ease: 'expo.out', immediateRender: true }, vars))) });
  let ctx = null, splits = [];
  function choreo() {
    if (!MOTION) return;
    if (ctx) ctx.revert();
    splits.forEach(s => s.revert()); splits = [];
    ctx = G.context(() => {
      /* section headings: each line rises out of a mask */
      $$('main h2').forEach(h => {
        h.classList.remove('rv'); h.classList.add('sx');
        const s = SPLIT.create(h, { type: 'lines', mask: 'lines' }); splits.push(s);
        reveal(h, 'top bottom-=60', () => s.lines, { yPercent: 110, duration: 1.1, stagger: .09 });
      });
      /* folio names: letters settle in as the folio arrives; the photo drifts inside its frame */
      $$('.chap').forEach(c => {
        const n = c.querySelector('.cname');
        if (n) { const s = SPLIT.create(n, { type: 'words,chars', mask: 'chars' }); splits.push(s);
          reveal(c, 'top 70%', () => s.chars, { yPercent: 105, duration: .9, stagger: .022 }); }
        const im = c.querySelector('.cimg img');
        if (im) G.fromTo(im, { scale: 1.16, yPercent: -5 }, { scale: 1.04, yPercent: 5, ease: 'none',
          scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      /* large photos ease back to full size as they pass */
      $$('.wide img, .bhimg img, .side img, .inv-img img').forEach(im =>
        G.fromTo(im, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: im, start: 'top bottom', end: 'bottom top', scrub: true } }));
    });
    ST.refresh();
  }

  /* ---------- 4. Embla carousel (replaces the hand-made one) ---------- */
  let emblas = [];
  if (window.EmblaCarousel) initCarousels = function () {   /* without Embla, app.js keeps its own carousel */
    emblas.forEach(e => e.destroy()); emblas = [];
    $$('[data-car]').forEach(car => {
      const tr = car.querySelector('.car-track');
      const box = document.createElement('div'); box.className = 'emb-c';
      while (tr.firstChild) box.append(tr.firstChild);
      tr.append(box); tr.classList.add('emb');
      const api = EmblaCarousel(tr, { align: 'start', containScroll: 'trimSnaps', duration: 30 });
      const dots = car.querySelector('.car-dots'), cnt = car.querySelector('.car-n'), pv = car.querySelector('.car-p'), nx = car.querySelector('.car-nx');
      const upd = () => {
        const i = api.selectedScrollSnap(), n = api.scrollSnapList().length;
        [...dots.children].forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-selected', j === i); });
        cnt.textContent = `${i + 1} / ${n}`; pv.disabled = !api.canScrollPrev(); nx.disabled = !api.canScrollNext();
      };
      const build = () => {
        const n = api.scrollSnapList().length; car.classList.toggle('one', n < 2);
        dots.innerHTML = api.scrollSnapList().map((_, i) => `<button type="button" role="tab" aria-label="Page ${i + 1} of ${n}"></button>`).join('');
        [...dots.children].forEach((b, i) => b.onclick = () => api.scrollTo(i)); upd();
      };
      pv.onclick = () => api.scrollPrev(); nx.onclick = () => api.scrollNext();
      tr.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); api.scrollNext(); } if (e.key === 'ArrowLeft') { e.preventDefault(); api.scrollPrev(); } });
      api.on('select', upd).on('reInit', build); build();
      emblas.push(api);
    });
  };

  /* ---------- 3. PhotoSwipe gallery (replaces the basic viewer) ---------- */
  let lightbox = null;
  const baseGallery = initGallery;
  initGallery = function (bx) {
    baseGallery(bx);
    if (lightbox) { lightbox.destroy(); lightbox = null; }
    if (!window.PhotoSwipeLightbox) return;
    const items = bx.gl.map(u => ({ src: u.replace(/w=\d+/, 'w=1800'), msrc: u, width: 1800, height: 1200, thumbCropped: true, alt: bx.short }));
    items.forEach(it => { const im = new Image(); im.onload = () => { it.width = im.naturalWidth; it.height = im.naturalHeight; }; im.src = it.src; });
    lightbox = new PhotoSwipeLightbox({ dataSource: items, pswpModule: PhotoSwipe, showHideAnimationType: 'zoom', bgOpacity: .96,
      padding: { top: 40, bottom: 70, left: 12, right: 12 }, wheelToZoom: true, imageClickAction: 'zoom', tapAction: 'toggle-controls' });
    lightbox.addFilter('thumbEl', (el, data, i) => document.querySelector(`.gal [data-lb="${i}"] img`) || el);
    lightbox.addFilter('placeholderSrc', (src, slide) => slide.data.msrc);
    lightbox.on('uiRegister', () => lightbox.pswp.ui.registerElement({ name: 'cap', order: 9, isButton: false, appendTo: 'root',
      onInit: (el, p) => p.on('change', () => { el.textContent = `${bx.short} · ${num(p.currIndex + 1)} of ${num(items.length)}`; }) }));
    lightbox.on('beforeOpen', () => lenis && lenis.stop());
    lightbox.on('destroy', () => lenis && lenis.start());
    lightbox.init();
  };
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-lb]'); if (!g || !lightbox) return;
    e.preventDefault(); e.stopPropagation(); lightbox.loadAndOpen(+g.dataset.lb);
  }, true);

  /* ---------- 1. shared-element transitions into a brand page ---------- */
  let lastLink = null;
  document.addEventListener('click', e => { lastLink = e.target.closest('a[href^="#"]'); }, true);
  const canVT = !!document.startViewTransition && !RM;
  removeEventListener('hashchange', route);
  addEventListener('hashchange', () => {
    const to = location.hash.slice(1), bx = B.find(x => x.id === to);
    const holder = lastLink && lastLink.closest('.chap, .drow, .nt, li');
    const srcImg = bx && holder ? holder.querySelector('.cimg img, .dthumb img') : null;
    const srcTitle = bx && holder ? holder.querySelector('.cname, .dn b') : null;
    lastLink = null;
    /* no photo to carry over (menu links, back links): keep the theme's page-turn / aperture */
    /* clear any names left by an interrupted transition; duplicates would cancel the next one */
    $$('[style*="view-transition-name"]').forEach(el => { el.style.viewTransitionName = ''; });
    if (!canVT || document.hidden || !srcImg) { route(); return; }
    hideLB();
    srcImg.style.viewTransitionName = 'hero-photo';
    if (srcTitle) srcTitle.style.viewTransitionName = 'hero-title';
    const vt = document.startViewTransition(async () => {
      render();
      $$('.bh .rv').forEach(el => { el.style.transition = 'none'; el.classList.add('in'); });
      const img = $('.bhimg img'), h = $('.bh h1');
      if (img) { img.loading = 'eager'; img.style.viewTransitionName = 'hero-photo'; try { await Promise.race([img.decode(), new Promise(r => setTimeout(r, 350))]); } catch (e) {} }
      if (h && srcTitle) h.style.viewTransitionName = 'hero-title';
    });
    [vt.ready, vt.finished, vt.updateCallbackDone].forEach(p => p && p.catch(() => {}));
    const guard = setTimeout(() => { try { vt.skipTransition(); } catch (e) {} }, 2500);
    vt.finished.finally(() => {
      clearTimeout(guard);
      $$('[style*="view-transition-name"]').forEach(el => { el.style.viewTransitionName = ''; });
      $$('.bh .rv').forEach(el => { el.style.transition = ''; });
    });
  });

  /* re-split headings when the width changes (rotating a phone), so lines wrap correctly */
  let lastW = innerWidth, rT = 0;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { if (innerWidth !== lastW) { lastW = innerWidth; choreo(); } }, 300); });

  /* run the upgrade after every page render, then once now for the current page */
  const baseRender = render;
  render = function () { baseRender(); blurUp(); choreo(); };
  render();
})();
