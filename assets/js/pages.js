/* =====================================================================
   AJ GROUPS — PAGE TEMPLATES
   Builds every page from the data in content.js.
   You normally don't need to edit this file to change text.
   ===================================================================== */

/* ---------- adapt content.js into short names used by the templates ---------- */
const B = BUSINESSES.map(b => ({
  id: b.id, n: b.name, short: b.shortName, m: b.monogram, c: b.category, tag: b.tag,
  c1: b.colors.main, c2: b.colors.second, f: b.colors.text, hi: b.colors.light,
  s: b.summary, p: b.description, l: b.listTitle, h: b.listHeading, i: b.items, gal: b.galleryTitle,
  img: b.image || '', gl: b.gallery || [],
}));
const NOTES = HERO_NOTES.map(n => {
  if (n.business) { const b = B.find(x => x.id === n.business); return [b, n.text]; }
  return [{ short: n.name, tag: n.tag, m: n.monogram, c1: n.colors[0], c2: n.colors[1], f: n.colors[2], id: 'ventures' }, n.text];
});
const ROT = HERO.rotatingWords.map(w => [w.word, w.color]);
const ICONS = {
  home: '<path d="M4 20V10l8-6 8 6v10"/><path d="M10 20v-6h4v6"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  people: '<circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10.5" r="2.5"/><path d="M3 19c1-3 3.5-4.5 6-4.5s5 1.5 6 4.5M15 15c2.5 0 4.5 1.2 5.5 3.5"/>',
  growth: '<path d="M4 18 10 12l4 4 6-8"/><path d="M15 8h5v5"/>',
  mail: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
};
const WHY = WHY_POINTS.map(w => [w.title, w.text, ICONS[w.icon] || ICONS.check]);
const NAV = [['home','Home'],['about','About'],['businesses','Businesses'],['ventures','Ventures'],['partnerships','Partnerships'],['contact','Contact']];
const TT = { home: `${SITE.name} | ${SITE.tagline}`, about: 'About Us', businesses: 'Our Businesses', ventures: 'Our Ventures', partnerships: 'Partnerships', contact: 'Contact Us' };

/* ---------- helpers ---------- */
const ic = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const AR = '<svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
const d = i => `data-d="${i}"`;                       /* reveal delay step; app.js turns it into --d */
const vars = x => `--c1:${x.c1};--c2:${x.c2};--f:${x.f}`;
const pad = n => String(n).padStart(2, '0');
const tags = list => `<div class="tg">${list.map(t => `<span>${t}</span>`).join('')}</div>`;
const pic = (src, alt) => src ? `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">` : '';
const bcard = (x, i) => `<a class="bcard tilt" href="#${x.id}" style="${vars(x)}" data-cur="Explore"><span class="mg" aria-hidden="true">${x.m}</span>
 <div class="tp"><span>${pad(i + 1)}</span><span>${x.tag}</span></div>
 ${x.img ? `<figure class="bimg">${pic(x.img, x.short)}</figure>` : ''}
 <h3>${x.short}</h3>${tags(x.i.slice(0, 4))}
 <div class="bt"><p>${x.s}</p><span class="go">${AR}</span></div></a>`;
const shapes = () => `<div class="bgm" aria-hidden="true"><i class="grid"></i><i class="sig"></i></div>`;   /* minimal grid background */
const ph = (e, t, l) => `<section class="ph dk" data-ch="Intro">${shapes()}<div class="w" style="position:relative"><p class="eye rv">${e}</p><h1 class="rv" ${d(1)}>${t}</h1><p class="lead rv" ${d(2)}>${l}</p></div></section>`;
const cta = (t, l) => `<section class="cta dk" data-ch="Say hello">${shapes()}<div class="w" style="position:relative"><p class="eye rv" style="justify-content:center">Get in touch</p><h2 class="rv" ${d(1)}>${t}</h2><p class="lead rv" ${d(2)} style="margin:26px auto 0">${l}</p>
 <a class="bigbtn mag rv" ${d(3)} href="#contact"><span>Contact us${AR}</span></a></div></section>`;
const band = (t, cls) => { const s = t.map(v => `<span>${v}<i></i></span>`).join(''); return `<div class="band ${cls}"><div class="sk"><div class="tr">${s}${s}${s}${s}</div></div></div>`; };
const sticker = (v, i, big) => `<${big ? 'div' : 'a href="#ventures"'} class="sticker rv" ${d(i)} style="--c:${v.color};--rot:${[-3, 2, -1.5, 2.5][i % 4]}deg${big ? ';min-height:420px' : ''}"><i class="tape"></i>${v.image ? `<figure class="simg">${pic(v.image, v.name)}</figure>` : ''}<span class="st">${v.status}</span><h3>${v.name}</h3>${big && v.items.length ? tags(v.items) : `<p>${v.summary}</p>`}</${big ? 'div' : 'a'}>`;
const socialLinks = () => SITE.socials.map(s => s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>` : `<a href="#contact" title="Link to be added">${s.label}</a>`).join('');

let fid = 0;
function form(fields, btn) {
  const p = 'f' + (++fid);
  return `<form class="fm" novalidate>${fields.map(([n, lb, ty, r, o]) => {
    const id = p + n;
    const c = ty === 'textarea' ? `<textarea id="${id}" name="${n}" ${r ? 'data-r=1' : ''}></textarea>`
      : ty === 'select' ? `<select id="${id}" name="${n}" data-r=1><option value="">Select…</option>${o.map(v => `<option>${v}</option>`).join('')}</select>`
      : `<input id="${id}" name="${n}" type="${ty}" ${r ? 'data-r=1' : ''} autocomplete="${({ email: 'email', name: 'name', phone: 'tel', company: 'organization' })[n] || 'off'}">`;
    return `<div class="fl"><label for="${id}">${lb}${r ? ' *' : ''}</label>${c}<small class="er" role="alert"></small></div>`;
  }).join('')}<button class="btn" type="submit">${btn} ${AR}</button><div class="st" role="status" aria-live="polite"></div></form>`;
}
const CF = [['name','Full Name','text',1],['email','Email','email',1],['phone','Phone','tel',0],['subject','Subject','text',1],['message','Message','textarea',1]];

/* positions of the paper notes on the home-page board (desktop) */
const BOARD = { rot: [-3, 2, -1.5, 2.5, -2], tape: [-4, 3, -2, 5, -3], bg: ['#fffdf6', '#dfe6ff', '#fff0c8', '#d6f6f0', '#ffe2da'], left: [0, 23, 46, 5, 31], top: [0, 44, 4, 318, 338] };

/* ---------- pages ---------- */
const PAGES = {
home: () => `
<section class="hero dk" id="hero" data-ch="Start">${shapes()}
 <div class="w">
  <div class="hgrid" id="hgrid">
   <div class="hcopy">
    <div class="tagrow">${HERO.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    <h1><span class="ln"><span>Building businesses.</span></span><span class="ln"><span>Creating <em class="rot" id="rot"><span>${ROT[0][0]}</span><svg class="circ" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><path pathLength="100" vector-effect="non-scaling-stroke" d="M26 20C70 4 168 4 190 32 205 60 128 78 64 73 14 68 0 42 22 22 40 8 78 6 104 9"/></svg></em></span></span></h1>
    <div class="hfoot"><p class="lead">${HERO.intro}</p>
    <div class="row"><a class="btn" href="#businesses">Explore businesses ${AR}</a><a class="btn gh" href="#partnerships">Partner with us</a></div></div>
   </div>
   <aside class="ntf" id="ntf" aria-label="Latest from ${SITE.name}">
    <span class="scrib" aria-hidden="true">a peek at what<br>each brand does<svg viewBox="0 0 64 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6C24 2 44 10 56 30M45 29l11 2 1-11"/></svg></span>
    <div class="hdl"></div>
    <div class="top"><span>${ic(ICONS.pin)}What our brands are up to</span><span>${B.length} brands</span></div>
    <div class="stack" id="stack"></div>
    <a class="hot" href="#ventures">${VENTURES.length} upcoming ventures →</a>
   </aside>
  </div>
  <div class="strip" id="strip">${WHY.map(([t, , p], i) => `<button data-i="${i}">${ic(p)}<span>${t}</span></button>`).join('')}</div>
 </div></section>

<div class="bands" aria-hidden="true">${band(['build it', 'give it a name', 'watch it grow', 'do it again'], 'b')}${band(B.map(x => x.tag === 'Kids' ? 'Kids’ content' : x.c.split(' & ')[0]), 'a')}</div>

<section class="hl dk" id="hl" data-ch="Who we are"><div class="stk"><div class="w"><p id="hlp">${HERO.statement}</p></div></div></section>

<section class="dk" data-ch="The group"><div class="w model">
 <div><p class="eye rv">How the group fits together</p><h2 class="rv" ${d(1)}>One parent. <span class="mk">${B.length}</span> independent brands.</h2>
  <p class="lead rv" ${d(2)} style="margin-top:22px">${ABOUT.approach}</p>
  <ul class="legend rv" ${d(3)} id="legend">${B.map((x, i) => `<li data-i="${i}" style="--c1:${x.c1}"><i></i><b>${x.short}</b><small>${x.tag}</small></li>`).join('')}</ul></div>
 <div class="orbit rv" ${d(2)} id="orbit">
  <div class="ring"><svg viewBox="0 0 100 100" aria-hidden="true">${B.map((x, i) => { const a = (i * 360 / B.length - 90) * Math.PI / 180; return `<line x1="50" y1="50" x2="${(50 + 40 * Math.cos(a)).toFixed(2)}" y2="${(50 + 40 * Math.sin(a)).toFixed(2)}" style="--c:${x.c1}"/>`; }).join('')}</svg>
   ${B.map((x, i) => `<a class="node" href="#${x.id}" data-i="${i}" style="--a:${i * 360 / B.length - 90}deg;${vars(x)}" aria-label="${x.short}"><span style="${x.img ? `background:linear-gradient(140deg,${x.c1}d9,${x.c2}cc),url('${x.img.replace('w=1400', 'w=300')}') center/cover` : ''}">${x.m}</span></a>`).join('')}</div>
  <div class="core"><b id="coreT">${SITE.name}</b><small id="coreS">The parent group.<br>Hover a brand.</small></div>
 </div>
</div></section>

<section class="dk" data-ch="Our brands" style="padding-bottom:60px"><div class="w hs-head"><div><p class="eye rv">Our business portfolio</p><h2 class="rv" ${d(1)}>Five businesses, <span class="mk">one family.</span></h2></div><p class="lead rv" ${d(2)} style="max-width:380px">Keep scrolling. Each one gets the whole screen, because each one is its own thing.</p></div></section>
<div class="chaps" id="chaps">${B.map((x, i) => `<section class="chap" style="${vars(x)};--i:${i};z-index:${i + 1}"><span class="mg" aria-hidden="true">${x.m}</span><div class="w chin">
 <div class="ctext">
  <div class="ctop"><span>${pad(i + 1)} / ${pad(B.length)}</span><span>${x.c}</span></div>
  <h3 class="cname">${x.short}</h3>
  <p class="cdesc">${x.p}</p>
  <div><p class="clab">${x.l.toLowerCase()}</p><ul class="clist">${x.i.map(v => `<li>${v}</li>`).join('')}</ul></div>
  <a class="btn" href="#${x.id}">Visit ${x.short} ${AR}</a>
 </div>
 ${x.img ? `<figure class="cimg">${pic(x.img, x.short)}</figure>` : ''}
</div></section>`).join('')}</div>

<section class="lt board-sec" data-ch="How we work"><div class="w">
 <div class="bhead"><div><p class="eye rv">Why ${SITE.name}?</p><h2 class="rv" ${d(1)}>How we <span class="mk">work.</span></h2></div>
  <div class="tally rv" ${d(2)}>${[[B.length, 'businesses'], [VENTURES.length, 'in the works'], [VALUES.length, 'values']].map(([n, t]) => `<div><b class="cnt" data-n="${n}">0</b><span>${t}</span></div>`).join('')}</div></div>
 <div class="board" id="board">
  ${WHY.map(([t, dd], i) => `<div class="note rv" ${d(i)} style="--rot:${BOARD.rot[i % 5]}deg;--tr:${BOARD.tape[i % 5]}deg;--bg:${BOARD.bg[i % 5]};left:${BOARD.left[i % 5]}%;top:${BOARD.top[i % 5]}px"><i class="tape"></i><h3>${t}</h3><p>${dd}</p></div>`).join('')}
  <div class="note big rv" ${d(2)} style="--rot:1.5deg;--tr:-3deg;--bg:#d4ff3f;left:67%;top:120px"><i class="tape"></i><span class="hand">our vision</span><p class="bq">${ABOUT.vision}</p></div>
  <span class="hint"><span class="hd">psst, you can move these around</span><span class="hm">swipe through these →</span></span>
 </div>
</div></section>

<section class="dk" data-ch="What’s next"><div class="w">
 <div style="display:flex;justify-content:space-between;align-items:end;gap:20px;flex-wrap:wrap"><div><p class="eye rv">Upcoming ventures</p><h2 class="rv" ${d(1)}>On the <span class="mk">workbench.</span></h2></div><a class="btn gh rv" ${d(2)} href="#ventures">All ventures ${AR}</a></div>
 <div class="stks">${VENTURES.map((v, i) => sticker(v, i, false)).join('')}</div>
</div></section>
${cta('Got an idea? <span class="mk">Let’s talk.</span>', 'Business enquiry, partnership, or just a half-formed idea. Send it over and we’ll get back to you.')}`,

about: () => ph('About us', 'Who <em>we</em> are.', ABOUT.intro) +
`<section class="lt"><div class="w split"><div><p class="eye rv">Our story</p><h2 class="rv" ${d(1)}>One identity. <em>Many</em> opportunities.</h2></div><p class="lead rv" ${d(2)} style="color:var(--ink);font-size:clamp(20px,2.2vw,28px)">${ABOUT.story}</p></div>
 <div class="w"><figure class="wide rv">${pic(IMAGES.about, 'People working together around a table')}</figure></div>
 <div class="w bento" style="margin-top:80px">
  <div class="bx c2 rv" style="min-height:300px"><span class="num">Our mission</span><h3 style="font-size:clamp(26px,2.8vw,38px)">${ABOUT.mission}</h3></div>
  <div class="bx c2 quote rv" ${d(1)} style="min-height:300px"><span class="num">Our vision</span><h3 style="font-size:clamp(26px,2.8vw,38px)">${ABOUT.vision}</h3></div>
 </div></section>
<section class="dk"><div class="w"><p class="eye rv">Our values</p><h2 class="rv" ${d(1)}>What <em>guides</em> us.</h2>
 <div class="vals">${VALUES.map((v, i) => `<span class="rv" ${d(i)} style="--c:${v.color}">${v.name}</span>`).join('')}</div></div></section>
<section class="lt"><div class="w split"><div><p class="eye rv">Our approach</p><h2 class="rv" ${d(1)}>Independent brands. <em>Shared</em> vision.</h2></div><p class="lead rv" ${d(2)} style="color:var(--ink);font-size:clamp(20px,2.2vw,28px)">${ABOUT.approach}</p></div></section>`
+ cta(`Work with <em>${SITE.name}.</em>`, 'Explore partnership options or send us an enquiry.'),

businesses: () => ph('Our businesses', 'Our business <em>portfolio.</em>', `Independent brands operating under the ${SITE.name} umbrella.`) +
`<section class="lt"><div class="w bgrid">${B.map((x, i) => `<div class="rv" ${d(i % 2)}>${bcard(x, i)}</div>`).join('')}</div></section>`
+ cta('Interested in one of our <em>brands?</em>', 'Tell us what you need and we will point you to the right team.'),

ventures: () => ph('Our ventures', 'On the <span class="mk">workbench.</span>', `Future initiatives of ${SITE.name}. None of the following are currently operational.`) +
`<section class="dk" style="padding-top:20px"><div class="w"><div class="stks" style="margin-top:0">${VENTURES.map((v, i) => sticker(v, i, true)).join('')}</div></div></section>`
+ cta('Want to follow these <em>ventures?</em>', 'Get in touch and we will keep you informed as they develop.'),

partnerships: () => ph('Partnerships', `Partner with <em>${SITE.name}.</em>`, 'We welcome people and organisations who share our approach to building businesses.') +
`<section class="lt"><div class="w split">
 <div class="plist"><figure class="side rv">${pic(IMAGES.partnerships, 'Two people shaking hands')}</figure>${PARTNERSHIP_TYPES.map((t, i) => `<div class="pi rv" ${d(i)}><span class="num">${pad(i + 1)}</span><div><h3>${t.title}</h3><p>${t.text}</p></div></div>`).join('')}</div>
 <div class="rv" ${d(1)}><h2 style="font-size:clamp(34px,3.8vw,52px);margin-bottom:24px">Partnership <em>enquiry.</em></h2>${form([['name','Full Name','text',1],['email','Email','email',1],['phone','Phone','tel',0],['company','Company Name','text',0],['type','Partnership Type','select',1,PARTNERSHIP_TYPES.map(t => t.option)],['message','Message','textarea',1]], 'Submit enquiry')}</div>
</div></section>`,

contact: () => ph('Contact us', 'Say <em>hello.</em>', 'Send a business or general enquiry and the right team will get back to you.') +
`<section class="lt"><div class="w split">
 <div>
  <div class="ci rv"><span class="ico">${ic(ICONS.mail)}</span><div><small>Email</small>${SITE.email}</div></div>
  <div class="ci rv" ${d(1)}><span class="ico">${ic(ICONS.phone)}</span><div><small>Phone</small>${SITE.phone}</div></div>
  <div class="ci rv" ${d(2)}><span class="ico">${ic(ICONS.pin)}</span><div><small>Location</small>${SITE.location}</div></div>
  <p class="eye rv" ${d(3)} style="margin:34px 0 0">Follow us</p>
  <div class="soc rv" ${d(3)}>${socialLinks()}</div>
  <figure class="side rv" ${d(4)} style="margin-top:34px">${pic(IMAGES.contact, 'A laptop on a clean desk')}</figure>
 </div>
 <div class="rv" ${d(1)}><div class="seg" role="tablist" data-a="0"><span class="pill"></span><button role="tab" aria-selected="true" data-t="0">Business enquiry</button><button role="tab" aria-selected="false" data-t="1">General enquiry</button></div>
 <div data-p="0">${form(CF, 'Send enquiry')}</div><div data-p="1" hidden>${form(CF, 'Send enquiry')}</div></div>
</div></section>`
};

/* ---------- one page per business: full-colour hero, list, gallery, next link ---------- */
B.forEach((x, bi) => PAGES[x.id] = () => { const nx = B[(bi + 1) % B.length]; return `<div style="${vars(x)}">
<section class="bh" data-ch="Overview"><span class="mg" aria-hidden="true">${x.m}</span><div class="w bhg" style="width:100%"><div>
 <a class="back rv" href="#businesses"><svg viewBox="0 0 8 14" width="7" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 1 1 7l6 6"/></svg>All businesses</a>
 <p class="rv" ${d(1)} style="font-weight:600;margin-bottom:16px">${x.c}</p>
 <h1 class="rv" ${d(2)}>${x.short}</h1>
 <p class="lead rv" ${d(3)}>${x.p}</p>
 <div class="row rv" ${d(4)}><a class="btn" href="#contact">Send an enquiry ${AR}</a><a class="btn gh" href="#home">${SITE.name}</a></div></div>
 ${x.img ? `<figure class="bhimg rv" ${d(3)}>${pic(x.img, x.short)}</figure>` : ''}</div></section>
<section class="lt" data-ch="${x.l}"><div class="w">
 <div class="glance rv" style="margin-bottom:clamp(70px,9vw,120px)">
  <div><small>what it is</small><b>${x.c}</b></div>
  <div><small>${x.l.toLowerCase()}</small><b>${x.i.length} offered</b></div>
  <div><small>part of</small><b>${SITE.name}</b></div>
  <div><small>talk to us</small><b><a href="#contact" style="text-decoration:underline;text-underline-offset:4px">Send an enquiry</a></b></div>
 </div>
 <p class="eye rv">${x.l}</p><h2 class="rv" ${d(1)} style="margin-bottom:50px">${x.h}</h2>
 <ul class="idx">${x.i.map((v, i) => `<li class="rv" ${d(i % 4)}><small>${pad(i + 1)}</small>${v}${AR.replace('class="ar" ', '')}</li>`).join('')}</ul></div></section>
<section class="lt" style="padding-top:0" data-ch="Working together"><div class="w"><p class="eye rv">Working together</p><h2 class="rv" ${d(1)}>Three <span class="mk">simple</span> steps.</h2>
 <div class="steps">${[['Tell us what you need', 'Send an enquiry with a few lines about what you have in mind.'], ['We talk it through', `The ${x.short} team gets back to you to understand the details.`], ['We get to work', 'Once it’s agreed, we start and keep you posted along the way.']].map(([t, p], i) => `<div class="step rv" ${d(i)}><b>${i + 1}</b><h3>${t}</h3><p>${p}</p></div>`).join('')}</div></div></section>
${x.gal ? `<section class="lt" style="padding-top:0" data-ch="${x.gal}"><div class="w"><p class="eye rv">${x.gal}</p><h2 class="rv" ${d(1)}>Selected <em>work.</em></h2><p class="lead rv" ${d(2)} style="margin-top:16px">Sample stock photos for now. Swap in your own work when it’s ready.</p>
 <div class="gal">${(x.gl.length ? x.gl : [1, 2, 3, 4, 5, 6]).map((g, i) => `<div class="rv" ${d(i % 3)}>${typeof g === 'string' ? pic(g, `${x.short} sample image ${i + 1}`) : `Image ${g}`}</div>`).join('')}</div></div></section>` : ''}
<section class="lt" style="padding-top:0" data-ch="The family"><div class="w"><p class="eye rv">Also from ${SITE.name}</p><h2 class="rv" ${d(1)}>Meet the <span class="mk">family.</span></h2>
 <div class="others">${B.filter(o => o.id !== x.id).map((o, i) => `<a class="other rv" ${d(i)} href="#${o.id}" style="${vars(o)}"><span>${o.tag}</span><b>${o.short}</b></a>`).join('')}</div></div></section>
<section class="dk" style="padding:70px 0"><div class="w" style="display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap"><span class="num">Next business</span><a href="#${nx.id}" data-cur="Next" style="font:700 clamp(32px,5vw,72px)/1 var(--disp);letter-spacing:-.04em;display:flex;align-items:center;gap:20px">${nx.short} <span style="width:clamp(44px,5vw,64px);height:clamp(44px,5vw,64px);border-radius:50%;background:${nx.c1};display:grid;place-items:center;color:${nx.f}">${AR}</span></a></div></section>
${cta(`Work with <em>${x.short}.</em>`, 'Tell us about your requirement and we will get back to you.')}</div>`; });
