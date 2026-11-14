/* Atelier (working name). A warm cream page with a chrome rail of hanging pieces.
   The rail: pieces sway away from the cursor and lift when you point at one.
   The piece: clicking pulls it out of the rail into a full view, with a motion-blur streak between pieces, and a story below in big light words.
   Photographs are stock images standing in for the brand's own. */
(function () {
'use strict';
const $ = id => document.getElementById(id), clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, TOUCH = matchMedia('(hover: none)').matches;
const q = new URLSearchParams(location.search);
const IMG = n => `../../assets/clothing-stock/${n}.jpg`;
const P = [
  { img: '01', name: 'Washed Tee', price: '₹1,800', desc: 'A soft, slightly faded tee in a washed sky blue. Easy through the body, finished with a clean neckline.', big: 'Washed soft. Worn in from the first day.', story: 'We wash every tee before it is cut, so it fits the way it will after a year of wear.', fabric: 'Heavy cotton jersey, garment washed. Relaxed fit, true to size.' },
  { img: '02', name: 'Sherpa Denim Jacket', price: '₹5,400', desc: 'A faded denim jacket with a warm sherpa collar and deep pockets. Made to be layered and left on.', big: 'Faded by hand. Warm where it counts.', story: 'The wash is done by hand, one jacket at a time, so no two collars sit quite the same.', fabric: 'Mid-weight denim, sherpa collar. Regular fit, room for a knit underneath.' },
  { img: '04', name: 'Print Camp Shirt', price: '₹3,200', desc: 'A short-sleeve camp shirt in a small ink print on cream. Light, loose and made for warm evenings.', big: 'Small print. Loose cut. Long evenings.', story: 'The print is drawn in the studio and placed so it falls evenly across the shoulders.', fabric: 'Light cotton blend with a soft drape. Boxy fit; size down for a closer cut.' },
  { img: '06', name: 'White V-neck Tee', price: '₹1,600', desc: 'A plain white tee with a low V and a quiet shoulder line. The one you reach for without thinking.', big: 'Plain white. Cut with care.', story: 'A simple piece takes the most care. We spent a season on the neckline alone.', fabric: 'Fine combed cotton jersey. Slim through the body, slightly long.' },
  { img: '05', name: 'Puffer Jackets', price: '₹6,900', desc: 'Light puffer jackets in earth tones, filled for warmth without bulk. Tailored at the shoulder.', big: 'Light to carry. Warm to wear.', story: 'Filled by weight, not by volume, so each jacket is warm without looking padded.', fabric: 'Recycled shell, light fill. Regular fit with a tailored shoulder.' },
  { img: '03', name: 'Washed Denim', price: '₹3,900', desc: 'Washed straight-leg denim with a high pocket and a soft hand. Hemmed to your length.', big: 'Straight cut. Hemmed to you.', story: 'Every pair is hemmed to the length of the person who orders it. That is the whole idea.', fabric: 'Rigid cotton denim, stone washed. Straight leg, mid rise.' },
  { img: '00', name: 'Hanger Tee', price: '₹1,700', desc: 'A white tee, shown the way it is kept: on a wooden hanger, ready to wear.', big: 'Ready on the rail. Ready when you are.', story: 'Every piece leaves the studio pressed and hung, exactly as you see it here.', fabric: 'Cotton jersey, soft and dense. Regular fit, true to size.' }
];
const N = P.length, SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const HANGER = '<svg class="hg" viewBox="0 0 100 46" aria-hidden="true"><path d="M50 22V12a6 6 0 1 0-6-6" fill="none" stroke="#8b8780" stroke-width="2.4" stroke-linecap="round"/><path d="M50 22 8 42h84z" fill="none" stroke="#8b8780" stroke-width="2.4" stroke-linejoin="round"/></svg>';

/* ---------- the rail ---------- */
const track = $('track');
track.innerHTML = P.map((p, i) => `<div class="it" data-i="${i}" style="--d:${(-(i * 1.17) % 7.5).toFixed(2)}s" tabindex="0" role="button" aria-label="${p.name}">${HANGER}<div class="ph"><img src="${IMG(p.img)}" alt="" loading="eager"><span class="no mono">${String(i + 1).padStart(2, '0')}</span></div></div>`).join('');
const its = [...track.children];
const capN = $('capn'), capP = $('capp'), capG = $('capg'); let hov = -1;
function setHover(i) { if (i === hov) return; hov = i; its.forEach((el, k) => el.classList.toggle('hov', k === i)); track.classList.toggle('has-hov', i >= 0); capN.style.opacity = 0; setTimeout(() => { if (i >= 0) { capN.textContent = P[i].name; capP.textContent = P[i].price; capG.hidden = false; } else { capN.textContent = 'Choose a piece'; capP.textContent = 'Move along the rail'; capG.hidden = true; } capN.style.opacity = 1; }, 120); }
its.forEach((el, i) => { el.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') setHover(i); }); el.addEventListener('focus', () => setHover(i)); el.addEventListener('click', () => openPdp(i)); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPdp(i); } }); });
track.addEventListener('pointerleave', () => setHover(-1)); capG.addEventListener('click', () => { if (hov >= 0) openPdp(hov); });
const ptr = { x: -9999, y: 0 }; addEventListener('pointermove', e => { if (e.pointerType !== 'touch') { ptr.x = e.clientX; ptr.y = e.clientY; } }, { passive: true });
const swing = its.map(() => 0);
function railTick() { its.forEach((el, k) => { const r = el.getBoundingClientRect(), dx = r.left + r.width / 2 - ptr.x, target = TOUCH || RM || ptr.x < -999 ? 0 : Math.sign(dx) * 9 * Math.exp(-(dx * dx) / (2 * 170 * 170)); swing[k] += (target - swing[k]) * .12; el.style.transform = `rotate(${swing[k].toFixed(2)}deg)`; }); requestAnimationFrame(railTick); }
requestAnimationFrame(railTick);

/* ---------- menu, bag, marquee ---------- */
const menu = $('menu'), mb = $('menubtn'), setMenu = on => { menu.classList.toggle('on', on); mb.setAttribute('aria-expanded', on ? 'true' : 'false'); mb.textContent = on ? 'Close' : 'Menu'; };
mb.addEventListener('click', () => setMenu(!menu.classList.contains('on')));
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { setMenu(false); if (a.dataset.open != null) openPdp(+a.dataset.open); }));
let bag = 0; const addBag = () => { bag++; $('bagn').textContent = bag; };
$('mq').innerHTML = Array(8).fill(['New arrivals', 'Made to order', 'Free alterations', 'Fitted to the person who wears them'].map(t => `<span>${t}</span>`).join('')).join('');

/* ---------- the piece ---------- */
const pdp = $('pdp'), pimg = $('pimg'), pimgi = $('pimgi'); let cur = -1, size = 'M';
const split = (el, text) => { el.classList.remove('in'); el.innerHTML = text.split(/\s+/).map((w, k) => `<span class="w"><span style="--k:${k}">${w}</span></span>`).join(' '); };
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); } }), { root: pdp, threshold: .25 });
function fill(i) { const p = P[i]; cur = i; pimgi.src = IMG(p.img); $('pno').textContent = `[ ${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')} ]`; $('pname').textContent = p.name; $('pprice').textContent = p.price + ' (placeholder price)'; $('pdesc').textContent = p.desc; $('pst').textContent = p.story; $('pfb').textContent = p.fabric; split($('pbig'), p.big); $('pok').classList.remove('on');
  $('psz').innerHTML = SIZES.map(s => `<button type="button" class="${s === size ? 'on' : ''}" data-s="${s}">${s}</button>`).join(''); $('psz').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { size = b.dataset.s; $('psz').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); })); }
function openPdp(i) {
  const src = its[i].querySelector('.ph').getBoundingClientRect(); fill(i); pdp.scrollTop = 0; document.body.classList.add('lock'); pdp.classList.add('on'); pdp.setAttribute('aria-hidden', 'false');
  pdp.querySelectorAll('.rv').forEach(e => e.classList.remove('in')); [$('pbig'), ...pdp.querySelectorAll('.rv')].forEach(e => io.observe(e));
  requestAnimationFrame(() => { const dst = pimg.getBoundingClientRect(); if (!RM && dst.width) pimg.animate([{ transformOrigin: '0 0', transform: `translate(${src.left - dst.left}px,${src.top - dst.top}px) scale(${src.width / dst.width},${src.height / dst.height})`, borderRadius: '10px' }, { transformOrigin: '0 0', transform: 'none', borderRadius: '14px' }], { duration: 780, easing: 'cubic-bezier(.2,.8,.2,1)' }); });
  its[i].style.visibility = 'hidden';
}
function closePdp() { if (!pdp.classList.contains('on')) return; pdp.classList.remove('on'); pdp.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lock'); its.forEach(e => { e.style.visibility = ''; }); }
function go(dir) { if (cur < 0) return; const n = (cur + dir + N) % N, out = RM ? null : pimgi.animate([{ transform: 'none', filter: 'blur(0)', opacity: 1 }, { transform: `translateX(${-dir * 90}px) scaleX(1.14)`, filter: 'blur(18px)', opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' });
  setTimeout(() => { fill(n); if (out) out.cancel(); if (!RM) pimgi.animate([{ transform: `translateX(${dir * 90}px) scaleX(1.14)`, filter: 'blur(18px)', opacity: 0 }, { transform: 'none', filter: 'blur(0)', opacity: 1 }], { duration: 620, easing: 'cubic-bezier(.2,.8,.2,1)' }); }, RM ? 0 : 250); }
$('pdpx').addEventListener('click', closePdp); $('pprev').addEventListener('click', () => go(-1)); $('pnext').addEventListener('click', () => go(1));
$('padd').addEventListener('click', () => { addBag(); $('pok').textContent = `Added to your bag in size ${size}. This is a placeholder shop.`; $('pok').classList.add('on'); });
addEventListener('keydown', e => { if (!pdp.classList.contains('on')) return; if (e.key === 'Escape') closePdp(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
if (q.get('open') != null) setTimeout(() => openPdp(+q.get('open') || 0), 400);
})();
