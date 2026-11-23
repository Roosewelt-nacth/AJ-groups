/* AJ GROUPS service worker: makes repeat visits load from the device instead of the network.
   - Pages (HTML): always asked from the network first, so updates show at once; the saved copy is used only when offline.
   - Files with a ?v= number, fonts and the 3D library from jsDelivr: kept and reused (a new ?v= number is a new file).
   - Other images and files: shown from the saved copy straight away and refreshed in the background.
   To switch it off for everyone, replace this file with one that calls self.registration.unregister(). */
const CACHE = 'aj-site-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('aj-site-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
const put = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); } return res; };
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url), same = u.origin === self.location.origin, cdn = /^(cdn\.jsdelivr\.net|fonts\.gstatic\.com|fonts\.googleapis\.com)$/.test(u.hostname);
  if (same && u.pathname.includes('/bunbun/baker/')) return;              /* the baker dashboard has its own worker */
  if (req.mode === 'navigate') { e.respondWith(fetch(req).then((r) => put(req, r)).catch(() => caches.match(req).then((m) => m || caches.match(new URL('./', self.registration.scope).href)))); return; }
  if (!same && !cdn) return;
  if (cdn || /[?&]v=/.test(u.search) || /\.woff2$/.test(u.pathname)) { e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => put(req, r)))); return; }
  e.respondWith(caches.match(req).then((m) => { const net = fetch(req).then((r) => put(req, r)).catch(() => m); return m || net; }));
});
