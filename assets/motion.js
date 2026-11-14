/* Shared motion toolkit for the AJ GROUPS sites.
   Set window.MOTION before loading: { accent: '#5fe0cd', dock: [{l:'Home',h:'#hero',i:'<svg…>'}…], par: '.hero .big' }
   Gives every page: a scroll progress line, press feedback and magnetic buttons, eased anchor scrolling with a blade page transition,
   scroll-linked parallax, blur-rise reveals with stagger, and on phones a bottom dock with a springing indicator and a haptic tick. */
(function () {
  'use strict';
  var C = window.MOTION || {}, RM = matchMedia('(prefers-reduced-motion:reduce)').matches, phone = function () { return innerWidth < 760; };
  var accent = C.accent || '#9fd0ff';
  var css = document.createElement('style');
  css.textContent = [
    '.mo-bar{position:fixed;left:0;top:0;height:2px;width:100%;z-index:60;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(90deg,' + accent + ',#fff);pointer-events:none}',
    'button,.btn,a.enter{-webkit-tap-highlight-color:transparent}',
    '.mo-press{transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .3s,background .3s,color .3s,opacity .4s}.mo-press:active{transform:scale(.94)!important}',
    '.mo-wipe{position:fixed;inset:0;z-index:70;display:flex;pointer-events:none;visibility:hidden}.mo-wipe.on{visibility:visible}',
    '.mo-wipe i{flex:1;margin:0 -2px;transform:scaleY(0);position:relative;overflow:hidden;box-shadow:inset 1px 0 0 rgba(255,255,255,.3),inset -1px 0 0 rgba(0,0,0,.14)}',
    '.mo-wipe i::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.28) 50%,transparent 70%);transform:translateX(-120%)}.mo-wipe.on i::after{animation:mosheen .8s ease-in-out}@keyframes mosheen{to{transform:translateX(120%)}}',
    '.mo-card{position:absolute;left:0;right:0;top:50%;margin-top:-1.1em;text-align:center;color:#0b1020;opacity:0;pointer-events:none}.mo-card small{display:block;font:500 12px/1 Inter,system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;opacity:.65;margin-bottom:10px}.mo-card b{display:block;font-weight:300;font-size:clamp(40px,11vw,120px);letter-spacing:-.055em;line-height:1}',
    '.mo-in{opacity:0;transform:translateY(34px);filter:blur(8px);transition:opacity .8s ease,transform 1.1s cubic-bezier(.16,1,.3,1),filter .8s ease;transition-delay:var(--mo-d,0s)}.mo-in.mo-on{opacity:1;transform:none;filter:none}',
    '.mo-dock{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translate(-50%,120%);z-index:55;display:none;gap:2px;padding:6px;border-radius:999px;border:1px solid rgba(128,128,128,.28);background:rgba(18,22,30,.62);-webkit-backdrop-filter:blur(20px) saturate(1.4);backdrop-filter:blur(20px) saturate(1.4);box-shadow:0 14px 40px rgba(0,0,0,.28);transition:transform .7s cubic-bezier(.16,1,.3,1)}',
    '.mo-dock.on{transform:translate(-50%,0)}.mo-dock a{position:relative;z-index:1;display:grid;justify-items:center;gap:3px;min-width:62px;padding:8px 10px 7px;border-radius:999px;color:rgba(255,255,255,.7);text-decoration:none;font:500 10px/1 Inter,system-ui,sans-serif;letter-spacing:.02em;transition:color .3s,transform .3s cubic-bezier(.2,.8,.2,1)}',
    '.mo-dock a svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.mo-dock a.cur{color:#fff}.mo-dock a:active{transform:scale(.9)}',
    '.mo-dock .pillbg{position:absolute;z-index:0;top:6px;bottom:6px;left:0;width:62px;border-radius:999px;background:' + accent + ';opacity:.28;transition:transform .55s cubic-bezier(.34,1.56,.64,1),width .55s cubic-bezier(.34,1.56,.64,1)}',
    '@media (max-width:759px){.mo-dock{display:flex}'+(C.dock?'body{padding-bottom:84px}':'')+'}',
    '@media (prefers-reduced-motion:reduce){.mo-in{opacity:1;transform:none;filter:none;transition:none}.mo-bar{display:none}}'
  ].join('\n');
  document.head.appendChild(css);
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var haptic = function (n) { try { if (navigator.vibrate && phone() && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(n || 8); } catch (e) {} };

  /* progress line */
  var bar = document.createElement('div'); bar.className = 'mo-bar'; document.body.appendChild(bar);
  /* press feedback + magnetic buttons */
  $$(C.press || '.btn,button,a.enter,.cue').forEach(function (b) { b.classList.add('mo-press'); });
  if (!RM) $$(C.mag || '.btn,a.enter,.cta').forEach(function (b) {
    b.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; var r = b.getBoundingClientRect(); b.style.translate = ((e.clientX - r.left - r.width / 2) * .25).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * .35).toFixed(1) + 'px'; });
    b.addEventListener('pointerleave', function () { b.style.translate = ''; });
  });

  /* blade wipe */
  var wipe = document.createElement('div'); wipe.className = 'mo-wipe'; var NB = 11; wipe.innerHTML = new Array(NB + 1).join('<i></i>') + '<div class="mo-card"><small></small><b></b></div>'; document.body.appendChild(wipe);
  var blades = $$('i', wipe), card = wipe.querySelector('.mo-card'), csm = card.querySelector('small'), cb = card.querySelector('b'), busy = false;
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function scrollEase(to, done) { var from = scrollY, t0 = performance.now(), d = 700 + Math.min(500, Math.abs(to - from) / innerHeight * 120); document.documentElement.style.scrollBehavior = 'auto';
    (function s(n) { var k = Math.min(1, (n - t0) / d); scrollTo(0, from + (to - from) * ease(k)); if (k < 1) requestAnimationFrame(s); else { document.documentElement.style.scrollBehavior = ''; if (done) done(); } })(t0); }
  function jump(target, title, index, total) {
    if (busy) return; var to = target.getBoundingClientRect().top + scrollY - (C.offset || 0); if (RM) { scrollTo(0, to); return; } busy = true;
    var fwd = to > scrollY, sk = fwd ? -9 : 9, mid = (NB - 1) / 2, ord = function (k) { return fwd ? k : NB - 1 - k; };
    csm.textContent = index ? String(index).padStart(2, '0') + ' / ' + String(total).padStart(2, '0') : ''; cb.textContent = title || '';
    blades.forEach(function (b) { b.style.background = 'linear-gradient(180deg,color-mix(in srgb,' + accent + ' 82%,#fff),' + accent + ' 38%,color-mix(in srgb,' + accent + ' 48%,#0b1020))'; });
    wipe.classList.add('on'); haptic(9);
    var guard = setTimeout(function () { if (!busy) return; scrollTo(0, to); wipe.classList.remove('on'); blades.concat(card).forEach(function (b) { b.getAnimations().forEach(function (x) { x.cancel(); }); }); busy = false; }, 3200);
    var up = blades.map(function (b, k) { return b.animate([{ transform: 'skewX(' + sk + 'deg) scaleY(0)', transformOrigin: '50% 100%' }, { transform: 'skewX(0deg) scaleY(1)', transformOrigin: '50% 100%' }], { duration: 340, delay: ord(k) * 18 + Math.abs(k - mid) * 8, easing: 'cubic-bezier(.76,0,.18,1)', fill: 'forwards' }).finished; });
    var ci = card.animate([{ opacity: 0, transform: 'translateY(24px) scale(.96)', filter: 'blur(8px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 300, delay: 220, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }).finished;
    Promise.all(up.concat(ci)).then(function () { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, to); document.documentElement.style.scrollBehavior = '';
      var co = card.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'translateY(-28px) scale(1.04)', filter: 'blur(8px)' }], { duration: 260, delay: 140, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'forwards' }).finished;
      var dn = blades.map(function (b, k) { return b.animate([{ transform: 'skewX(0deg) scaleY(1)', transformOrigin: '50% 0%' }, { transform: 'skewX(' + (-sk) + 'deg) scaleY(0)', transformOrigin: '50% 0%' }], { duration: 400, delay: 160 + ord(k) * 16, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'forwards' }).finished; });
      Promise.all(dn.concat(co)).then(function () { wipe.classList.remove('on'); blades.concat(card).forEach(function (b) { b.getAnimations().forEach(function (a) { a.cancel(); }); }); busy = false; clearTimeout(guard); }); });
  }
  var secs = $$(C.sections || 'main > section[id]'), titles = C.titles || {};
  var nice = function (id) { return titles[id] || id.charAt(0).toUpperCase() + id.slice(1); };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return; var id = a.getAttribute('href').slice(1); if (!id) return;
    var t = document.getElementById(id); if (!t) return; e.preventDefault(); var i = secs.indexOf(t);
    var menu = document.getElementById('menu'); if (menu && menu.classList.contains('on')) { var mb = document.getElementById('menubtn'); if (mb) mb.click(); }
    jump(t, nice(id), i + 1, secs.length);
  });

  /* scroll: progress line, parallax on the hero, dock indicator */
  var par = $$(C.par || '.hero .big,.hero .tag'), ticking = false;
  function onScroll() { var h = document.documentElement.scrollHeight - innerHeight, p = h > 0 ? scrollY / h : 0; bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (!RM) { var f = Math.min(1, scrollY / innerHeight); par.forEach(function (el, i) { el.style.translate = '0 ' + (-f * (60 + i * 30)).toFixed(1) + 'px'; el.style.opacity = (1 - f * .85).toFixed(3); }); } ticking = false; }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true }); onScroll();

  /* blur-rise reveals with stagger */
  var rv = $$(C.reveal || '.s h2,.s .lead,.s p.lead,.card,.step,.field,.rv'); rv.forEach(function (el) { if (el.classList.contains('rv')) return; el.classList.add('mo-in'); });
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var sibs = e.target.parentElement ? [].slice.call(e.target.parentElement.children).filter(function (x) { return x.classList.contains('mo-in'); }) : []; e.target.style.setProperty('--mo-d', (Math.max(0, sibs.indexOf(e.target)) * .09).toFixed(2) + 's'); e.target.classList.add('mo-on'); io.unobserve(e.target); } }); }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('.mo-in').forEach(function (el) { io.observe(el); });

  /* phone dock */
  if (C.dock && C.dock.length) {
    var dock = document.createElement('nav'); dock.className = 'mo-dock'; dock.setAttribute('aria-label', 'Sections');
    dock.innerHTML = '<i class="pillbg"></i>' + C.dock.map(function (d) { return '<a href="' + d.h + '" data-h="' + d.h.slice(1) + '">' + d.i + '<span>' + d.l + '</span></a>'; }).join(''); document.body.appendChild(dock);
    var links = $$('a', dock), bg = dock.querySelector('.pillbg');
    function mark(id) { links.forEach(function (a) { a.classList.toggle('cur', a.dataset.h === id); }); var a = links.filter(function (x) { return x.dataset.h === id; })[0]; if (a) { bg.style.width = a.offsetWidth + 'px'; bg.style.transform = 'translateX(' + a.offsetLeft + 'px)'; } }
    var cur = '', seen = {}; var sio = new IntersectionObserver(function (es) { es.forEach(function (e) { seen[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; }); var best = '', bv = 0; Object.keys(seen).forEach(function (k) { if (seen[k] > bv) { bv = seen[k]; best = k; } }); if (best && best !== cur) { cur = best; mark(cur); haptic(6); } }, { threshold: [0, .25, .5, .75] });
    C.dock.forEach(function (d) { var t = document.getElementById(d.h.slice(1)); if (t) sio.observe(t); });
    setTimeout(function () { dock.classList.add('on'); mark(C.dock[0].h.slice(1)); }, 900);
    addEventListener('resize', function () { mark(cur || C.dock[0].h.slice(1)); });
  }
})();
