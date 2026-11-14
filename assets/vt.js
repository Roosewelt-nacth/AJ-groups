/* AJ GROUPS: page-to-page transition and nav behaviour shared by every site.
   Leaving: a glass sheet in the destination's colour rises over the page, then we navigate.
   Arriving: the same sheet is already covering the new page; once it is ready the sheet lifts away.
   The sheet hides the load, so heavy 3D pages never flash or freeze, and it works in every browser, phone or laptop.
   Nav: the header slides away on scroll down and returns on scroll up. */
(function () {
  'use strict';
  var KEY = 'ajvt', RM = matchMedia('(prefers-reduced-motion:reduce)').matches, root = document.documentElement;
  var SITES = { 'aj-groups': ['#9fd0ff', 'AJ GROUPS'], alven: ['#5fe0cd', 'Alven Studio'], fovo: ['#dfe7ff', 'House of Fovo'], clothing: ['#e9a24a', 'Atelier'], bunbun: ['#f2a6c1', 'Bun Bun Bakes'] };
  var site = function (path) { var m = /\/(aj-groups|alven|fovo|clothing|bunbun)\/?/.exec(path); return m ? m[1] : null; };
  var EASE = 'cubic-bezier(.76,0,.18,1)';

  function sheet(color, title, y, back) {
    var el = document.createElement('div'); el.setAttribute('aria-hidden', 'true'); el.id = 'ajvt-sheet';
    el.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:2147483000;pointer-events:all;display:grid;place-items:center;overflow:hidden;will-change:transform;' +
      'background:linear-gradient(180deg,color-mix(in srgb,' + color + ' 84%,#fff),' + color + ' 40%,color-mix(in srgb,' + color + ' 46%,#0b1020));' +
      'box-shadow:0 -30px 80px rgba(0,0,0,.35);transform:translateY(' + y + ')';
    el.innerHTML = '<div style="text-align:center;color:#0b1020;font-family:Inter,system-ui,sans-serif;pointer-events:none"><div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.6;margin-bottom:12px;font-weight:500">' + (back ? 'Back to' : 'Entering') + '</div><div style="font-weight:300;font-size:clamp(40px,12vw,104px);letter-spacing:-.055em;line-height:1">' + title + '</div></div>' +
      '<i style="position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.3) 50%,transparent 70%);transform:translateX(-120%)"></i>';
    return el;
  }
  function sheen(el) { var i = el.querySelector('i'); if (i && i.animate) i.animate([{ transform: 'translateX(-120%)' }, { transform: 'translateX(120%)' }], { duration: 520, easing: 'ease-in-out' }); }

  var leaving = false;
  /* arriving: cover the page straight away, then lift once it is ready */
  var inc = null; try { inc = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (e) {}
  if (inc && !RM && Date.now() - inc.t < 8000) {
    var s = sheet(inc.c, inc.n, '0', inc.d === 'back'); root.appendChild(s); var lifted = false;
    var lift = function () { if (lifted) return; lifted = true; var to = inc.d === 'back' ? '100%' : '-100%';
      if (!s.animate) { s.remove(); return; }
      var a = s.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + to + ')' }], { duration: 440, easing: EASE, fill: 'forwards' });
      sheen(s); var fin = function () { s.remove(); }; a.finished.then(fin, fin); setTimeout(fin, 1200); };
    var ready = function () { var go = function () { requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(lift, 60); }); }); };
      Promise.race([document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(), new Promise(function (r) { setTimeout(r, 450); })]).then(go, go); };
    if (document.readyState !== 'loading') ready(); else addEventListener('DOMContentLoaded', ready, { once: true });
    setTimeout(lift, 1800);   /* never stay covered */
  }
  addEventListener('pageshow', function (e) { if (e.persisted) { ['ajvt-sheet', 'ajvt-dim'].forEach(function (id) { var o = document.getElementById(id); if (o) o.remove(); }); leaving = false; } });

  /* leaving */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download')) return; var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin || u.pathname === location.pathname) return;
    var dest = site(u.pathname); if (!dest || leaving) return;
    if (RM || !document.documentElement.animate) return;   /* plain navigation */
    e.preventDefault(); e.stopImmediatePropagation(); leaving = true;
    var back = dest === 'aj-groups', info = SITES[dest], s = sheet(info[0], info[1], back ? '-100%' : '100%', back); root.appendChild(s);
    var dim = document.createElement('div'); dim.id = 'ajvt-dim'; dim.style.cssText = 'position:fixed;inset:0;z-index:2147482999;background:#000;opacity:0;pointer-events:none'; root.appendChild(dim);
    dim.animate([{ opacity: 0 }, { opacity: .45 }], { duration: 340, fill: 'forwards', easing: 'ease-out' });
    var go = function () { try { sessionStorage.setItem(KEY, JSON.stringify({ c: info[0], n: info[1], d: back ? 'back' : 'in', t: Date.now() })); } catch (x) {} location.href = u.href; };
    var a2 = s.animate([{ transform: 'translateY(' + (back ? '-100%' : '100%') + ')' }, { transform: 'translateY(0)' }], { duration: 360, easing: EASE, fill: 'forwards' });
    sheen(s); a2.finished.then(go, go); setTimeout(go, 800);
  }, true);

  /* nav: away on scroll down, back on scroll up or when the pointer visits the top edge */
  addEventListener('DOMContentLoaded', function () {
    var hd = document.querySelector('header'); if (!hd) return; var last = scrollY, hidden = false, tk = false;
    var base = getComputedStyle(hd).transition; hd.style.transition = (base && !/^all 0s/.test(base) ? base + ', ' : '') + 'translate .5s cubic-bezier(.2,.8,.2,1)';
    var set = function (h) { if (h === hidden) return; hidden = h; hd.style.translate = h ? '0 -120%' : ''; };
    var menuOpen = function () { var m = document.getElementById('menu'); return m && m.classList.contains('on'); };
    var run = function () { tk = false; var y = scrollY, d = y - last; if (Math.abs(d) < 6) return; last = y; if (menuOpen() || hd.contains(document.activeElement)) { set(false); return; } if (y < 80) set(false); else set(d > 0); };
    addEventListener('scroll', run, { passive: true });
    addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch' && e.clientY < 70) set(false); }, { passive: true });
  });

  /* prefetch sibling pages (Chrome) so they load fast once the sheet has covered the screen */
  if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
    var sp = document.createElement('script'); sp.type = 'speculationrules';
    sp.textContent = JSON.stringify({ prefetch: [{ source: 'document', where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/*#*' } }, { not: { selector_matches: '[target=_blank]' } }] }, eagerness: 'moderate' }] });
    document.head.appendChild(sp);
  }
})();
