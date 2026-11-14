/* Direction for the stack transition, plus pre-rendering of the sibling pages on hover/touch so they are ready when the slide starts. */
(function () {
  'use strict';
  var KEY = 'ajvt';
  function dir(e) {
    var d = null; try { d = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch (x) {}
    if (d === 'back') { document.documentElement.classList.add('vt-back'); var vt = e && e.viewTransition; var off = function () { document.documentElement.classList.remove('vt-back'); }; if (vt) vt.finished.then(off, off); else setTimeout(off, 1500); }
  }
  try { addEventListener('pagereveal', dir); } catch (e) {}
  if (!document.prerendering) dir(null);   /* runs before the first paint, so the direction is set in time */
  /* a pre-rendered page was waiting; the tap activates it */
  if (document.prerendering) document.addEventListener('prerenderingchange', function () { dir(null); }, { once: true });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target === '_blank') return; var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin || (u.pathname === location.pathname && u.hash)) return;
    var toHome = /\/aj-groups\/?$/.test(u.pathname), here = /\/aj-groups\/?$/.test(location.pathname);
    try { if (toHome && !here) sessionStorage.setItem(KEY, 'back'); else sessionStorage.removeItem(KEY); } catch (x) {}
  }, true);
  /* pre-render siblings (Chrome): ready by the time you tap */
  if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
    var s = document.createElement('script'); s.type = 'speculationrules';
    s.textContent = JSON.stringify({ prerender: [{ source: 'document', where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/*#*' } }, { not: { selector_matches: '[target=_blank]' } }] }, eagerness: 'moderate' }] });
    document.head.appendChild(s);
  }
})();
