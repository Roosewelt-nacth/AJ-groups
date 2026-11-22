/* Shared menu behaviour: the open card dims the page, a tap outside or Escape closes it. The page's own script still opens and closes it. */
(function () {
  'use strict';
  var m = document.querySelector('#menu.menu'), b = document.getElementById('menubtn');
  if (!m || !b) return;
  var root = document.documentElement, open = function () { return m.classList.contains('on'); };
  var sync = function () { root.classList.toggle('menu-open', open()); };
  new MutationObserver(sync).observe(m, { attributes: true, attributeFilter: ['class'] }); sync();
  document.addEventListener('pointerdown', function (e) { if (open() && !m.contains(e.target) && !b.contains(e.target)) b.click(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open()) b.click(); });
})();
