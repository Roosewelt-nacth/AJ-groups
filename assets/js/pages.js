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
const WHY = WHY_POINTS.map(w => [w.title, w.text]);
const NAV = [['home','Home'],['about','About'],['businesses','The Houses'],['ventures','Ventures'],['partnerships','Partnerships'],['contact','Contact']];
const TT = { home: `${SITE.name} | ${SITE.tagline}`, about: 'About Us', businesses: 'The Houses', ventures: 'Our Ventures', partnerships: 'Partnerships', contact: 'Contact Us' };

/* ---------- helpers ---------- */
const roman = n => { let r = ''; [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']].forEach(([v, s]) => { while (n >= v) { r += s; n -= v; } }); return r; };
const HERITAGE = document.documentElement.getAttribute('data-theme') === 'heritage';
const num = n => HERITAGE ? roman(n) : String(n);            /* Roman numerals in the heritage theme, plain numbers otherwise */
const EST = HERITAGE ? num(SITE.founded || SITE.copyrightYear) : String(SITE.founded || SITE.copyrightYear);
const AR = '<span class="ar" aria-hidden="true">→</span>';
const d = i => `data-d="${i}"`;                       /* reveal delay step; app.js turns it into --d */
const vars = x => `--c1:${x.c1};--c2:${x.c2};--f:${x.f};--hi:${x.hi}`;
const pad = n => String(n).padStart(2, '0');
const pic = (src, alt) => src ? `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">` : '';
const orn = () => `<div class="orn rv" aria-hidden="true"><i></i><span>✦</span><i></i></div>`;

/* the group crest: double ring, lettering around the edge, monogram in the middle */
let cid = 0;
const crest = (cls = '') => { const id = 'cr' + (++cid); return `<svg class="crest ${cls}" viewBox="0 0 120 120" aria-hidden="true">
 <defs><path id="${id}" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0"/></defs>
 <circle cx="60" cy="60" r="58" class="cr-o"/><circle cx="60" cy="60" r="53.5" class="cr-l"/><circle cx="60" cy="60" r="37" class="cr-l"/>
 <text class="cr-t"><textPath href="#${id}" textLength="282" lengthAdjust="spacing">${SITE.name} · EST. ${EST} · BUILDING BUSINESSES ·</textPath></text>
 <text x="60" y="72" text-anchor="middle" class="cr-m">AJ</text></svg>`; };
const seal = (x, cls = '') => `<span class="seal ${cls}" style="--c1:${x.c1};--c2:${x.c2};--f:${x.f}">${x.m}</span>`;

const ph = (e, t, l) => `<section class="ph" data-ch="Introduction"><div class="w">
 <div class="mast rv"><span>${e}</span><i></i><span>Est. ${EST}</span></div>
 <h1 class="rv" ${d(1)}>${t}</h1><p class="lead rv" ${d(2)}>${l}</p>${orn()}</div></section>`;
const cta = (t, l) => `<section class="cta dk" data-ch="Correspondence"><div class="w">
 <div class="cta-crest rv">${crest()}</div>
 <p class="eye rv" ${d(1)}>Correspondence</p><h2 class="rv" ${d(1)}>${t}</h2><p class="lead rv" ${d(2)}>${l}</p>
 <a class="btn rv" ${d(3)} href="#contact">Write to us ${AR}</a></div></section>`;
const ribbon = (t, cls) => { const s = t.map(v => `<span>${v}<i>✦</i></span>`).join(''); return `<div class="band ${cls}"><div class="sk"><div class="tr">${s}${s}${s}${s}</div></div></div>`; };
const invite = (v, i, full) => `<${full ? 'article' : 'a href="#ventures"'} class="inv rv" ${d(i)} style="--c:${v.color}"><div class="inv-in">
 <div class="inv-top"><span>No. ${num(i + 1)}</span><span>${v.status}</span></div>
 ${v.image ? `<figure class="frm inv-img">${pic(v.image, v.name)}</figure>` : ''}
 <h3>${v.name}</h3><p>${v.summary}</p>
 ${full && v.items.length ? `<ul class="inv-list">${v.items.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
 ${full ? '' : `<span class="lnk">Learn more ${AR}</span>`}</div></${full ? 'article' : 'a'}>`;
const socialLinks = () => SITE.socials.map(s => s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>` : `<a href="#contact" title="Link to be added">${s.label}</a>`).join('');

let fid = 0;
function form(fields, btn) {
  const p = 'f' + (++fid);
  return `<form class="fm" novalidate>${fields.map(([n, lb, ty, r, o]) => {
    const id = p + n;
    const c = ty === 'textarea' ? `<textarea id="${id}" name="${n}" rows="4" ${r ? 'data-r=1' : ''}></textarea>`
      : ty === 'select' ? `<select id="${id}" name="${n}" data-r=1><option value="">Select…</option>${o.map(v => `<option>${v}</option>`).join('')}</select>`
      : `<input id="${id}" name="${n}" type="${ty}" ${r ? 'data-r=1' : ''} autocomplete="${({ email: 'email', name: 'name', phone: 'tel', company: 'organization' })[n] || 'off'}">`;
    return `<div class="fl${ty === 'textarea' ? ' wide' : ''}"><label for="${id}">${lb}${r ? ' *' : ''}</label>${c}<small class="er" role="alert"></small></div>`;
  }).join('')}<button class="btn" type="submit">${btn} ${AR}</button><div class="st" role="status" aria-live="polite"></div></form>`;
}
const CF = [['name','Full Name','text',1],['email','Email','email',1],['phone','Phone','tel',0],['subject','Subject','text',1],['message','Message','textarea',1]];

/* ---------- pages ---------- */
const PAGES = {
home: () => `
<section class="hero" id="hero" data-ch="Prologue"><div class="w">
 <div class="mast"><span>${HERO.tags[0]}</span><i></i><span class="mast-c">${crest('mini')}</span><i></i><span>Est. ${EST}</span></div>
 <div class="hgrid" id="hgrid">
  <div class="hcopy">
   <p class="eye">${HERO.tags[1]}</p>
   <h1><span class="ln"><span>Building businesses.</span></span><span class="ln"><span>Creating <em class="rot" id="rot" style="color:${ROT[0][1]}">${ROT[0][0]}</em></span></span></h1>
   <p class="lead">${HERO.intro}</p>
   <div class="row"><a class="btn" href="#businesses">Visit the houses ${AR}</a><a class="lnk" href="#partnerships">Partner with us</a></div>
  </div>
  <aside class="ntf" id="ntf" aria-label="Latest from ${SITE.name}">
   <div class="ntf-h"><span>The Correspondence</span><span id="ntfn">No. I</span></div>
   <div class="stack" id="stack"></div>
   <a class="ntf-f" href="#ventures">${VENTURES.length} ventures forthcoming ${AR}</a>
  </aside>
 </div>
 <div class="strip" id="strip">${WHY.map(([t], i) => `<button data-i="${i}"><span class="rn">${num(i + 1)}</span><span>${t}</span></button>`).join('')}</div>
 <p class="strip-t" id="stript" aria-live="polite">${WHY[0][1]}</p>
</div></section>

<div class="bands" aria-hidden="true">${ribbon(B.map(x => x.c.split(' & ')[0]), 'a')}${ribbon(['Build it', 'Give it a name', 'Watch it grow', 'Do it again'], 'b')}</div>

<section class="hl" id="hl" data-ch="The group"><div class="stk"><div class="w"><p class="eye">A word on the group</p><p id="hlp">${HERO.statement}</p></div></div></section>

<section class="lt" data-ch="The family"><div class="w model">
 <div><p class="eye rv">How the group fits together</p><h2 class="rv" ${d(1)}>One parent. <em>${B.length}</em> independent houses.</h2>
  <p class="lead rv" ${d(2)}>${ABOUT.approach}</p>
  <ol class="legend rv" ${d(3)} id="legend">${B.map((x, i) => `<li data-i="${i}" style="--c1:${x.c1}"><span class="rn">${num(i + 1)}</span><b>${x.short}</b><small>${x.tag}</small></li>`).join('')}</ol></div>
 <div class="orbit rv" ${d(2)} id="orbit">
  <div class="ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" class="rg"/><circle cx="50" cy="50" r="46" class="rg2"/>${B.map((x, i) => { const a = (i * 360 / B.length - 90) * Math.PI / 180; return `<line x1="50" y1="50" x2="${(50 + 40 * Math.cos(a)).toFixed(2)}" y2="${(50 + 40 * Math.sin(a)).toFixed(2)}" style="--c:${x.c1}"/>`; }).join('')}</svg>
   ${B.map((x, i) => `<a class="node" href="#${x.id}" data-i="${i}" style="--a:${i * 360 / B.length - 90}deg;${vars(x)}" aria-label="${x.short}"><span>${x.m}</span></a>`).join('')}</div>
  <div class="core"><span class="core-c">${crest('mini')}</span><b id="coreT">${SITE.name}</b><small id="coreS">The parent group</small></div>
 </div>
</div></section>

<section class="lt" data-ch="The houses" style="padding-bottom:60px"><div class="w hs-head"><div><p class="eye rv">Our business portfolio</p><h2 class="rv" ${d(1)}>Five houses, <em>one family.</em></h2></div><p class="lead rv" ${d(2)}>Each house keeps its own name, its own craft and its own direction. Scroll on to open each folio.</p></div></section>
<div class="chaps" id="chaps">${B.map((x, i) => `<section class="chap" style="${vars(x)};--i:${i};z-index:${i + 1}"><div class="w chin">
 <div class="ctop"><span>Folio ${num(i + 1)} of ${num(B.length)}</span><span>${x.c}</span></div>
 <div class="ctext">
  <h3 class="cname">${x.short}</h3>
  <p class="cdesc">${x.p}</p>
  <div><p class="clab">${x.l}</p><ul class="clist">${x.i.map((v, k) => `<li style="--k:${k}">${v}</li>`).join('')}</ul></div>
  <a class="btn inv-b" href="#${x.id}">Visit ${x.short} ${AR}</a>
 </div>
 ${x.img ? `<figure class="cimg">${pic(x.img, x.short)}</figure>` : ''}
</div></section>`).join('')}</div>

<section class="lt prin" data-ch="Principles"><div class="w prin-g">
 <div class="prin-l"><p class="eye rv">Why ${SITE.name}</p><h2 class="rv" ${d(1)}>How we conduct <em>business.</em></h2>
  <div class="tally rv" ${d(2)}>${[[B.length, 'Houses'], [VENTURES.length, 'Forthcoming'], [VALUES.length, 'Values']].map(([n, t]) => `<div><b class="cnt" data-n="${n}">0</b><span>${t}</span></div>`).join('')}</div>
  <blockquote class="vq rv" ${d(3)}><p>${ABOUT.vision}</p><cite>Our vision</cite></blockquote></div>
 <ol class="prin-list">${WHY.map(([t, dd], i) => `<li class="rv" ${d(i)}><span class="rn">${num(i + 1)}</span><div><h3>${t}</h3><p>${dd}</p></div></li>`).join('')}</ol>
</div></section>

<section class="pa" data-ch="Forthcoming"><div class="w">
 <div class="sec-h"><div><p class="eye rv">Upcoming ventures</p><h2 class="rv" ${d(1)}>Forthcoming <em>from the group.</em></h2></div><a class="lnk rv" ${d(2)} href="#ventures">All ventures ${AR}</a></div>
 <div class="invs">${VENTURES.map((v, i) => invite(v, i, false)).join('')}</div>
</div></section>
${cta('An idea worth <em>discussing?</em>', 'Business enquiry, partnership, or an idea still taking shape. Write to us and we will reply in good time.')}`,

about: () => ph('About us', 'Who <em>we</em> are.', ABOUT.intro) +
`<section class="lt" data-ch="Our story"><div class="w split"><div><p class="eye rv">Our story</p><h2 class="rv" ${d(1)}>One identity. <em>Many</em> opportunities.</h2></div><p class="lead dropcap rv" ${d(2)}>${ABOUT.story}</p></div>
 <div class="w"><figure class="frm wide rv">${pic(IMAGES.about, 'People working together around a table')}</figure></div>
 <div class="w mv">
  <div class="rv"><span class="rn">I</span><p class="eye">Our mission</p><h3>${ABOUT.mission}</h3></div>
  <div class="rv" ${d(1)}><span class="rn">II</span><p class="eye">Our vision</p><h3>${ABOUT.vision}</h3></div>
 </div></section>
<section class="dk" data-ch="Our values"><div class="w" style="text-align:center"><p class="eye rv" style="justify-content:center">Our values</p><h2 class="rv" ${d(1)}>What <em>guides</em> us.</h2>
 <div class="vals">${VALUES.map((v, i) => `<span class="rv" ${d(i)}>${v.name}</span>`).join('')}</div></div></section>
<section class="lt" data-ch="Our approach"><div class="w split"><div><p class="eye rv">Our approach</p><h2 class="rv" ${d(1)}>Independent houses. <em>Shared</em> vision.</h2></div><p class="lead rv" ${d(2)}>${ABOUT.approach}</p></div></section>`
+ cta(`Work with <em>${SITE.name}.</em>`, 'Explore partnership options or send us an enquiry.'),

businesses: () => ph('The houses', 'Our business <em>portfolio.</em>', `Independent brands operating under the ${SITE.name} name. Choose a house to learn more.`) +
`<section class="lt dir-sec" data-ch="Directory"><div class="w">
 <ol class="dir" id="dir">${B.map((x, i) => `<li class="rv" ${d(i)}><a href="#${x.id}" class="drow" style="${vars(x)}" data-i="${i}">
  <span class="rn">${num(i + 1)}</span>${seal(x)}<span class="dn"><b>${x.short}</b><small>${x.c}</small></span><span class="ds">${x.s}</span>${x.img ? `<span class="dthumb frm">${pic(x.img, x.short)}</span>` : ''}${AR}</a></li>`).join('')}</ol>
 </div><div class="dprev" id="dprev" aria-hidden="true">${B.map(x => x.img ? `<img src="${x.img}" alt="" loading="lazy">` : '<span></span>').join('')}</div></section>`
+ cta('Interested in one of our <em>houses?</em>', 'Tell us what you need and we will point you to the right team.'),

ventures: () => ph('Our ventures', 'Forthcoming <em>ventures.</em>', `Future initiatives of ${SITE.name}. None of the following are operating yet.`) +
`<section class="pa" style="padding-top:20px" data-ch="Ventures"><div class="w"><div class="invs full">${VENTURES.map((v, i) => invite(v, i, true)).join('')}</div></div></section>`
+ cta('Wish to follow these <em>ventures?</em>', 'Write to us and we will keep you informed as they develop.'),

partnerships: () => ph('Partnerships', `Partner with <em>${SITE.name}.</em>`, 'We welcome people and organisations who share our approach to building businesses.') +
`<section class="lt" data-ch="Enquiry"><div class="w split">
 <div class="plist"><figure class="frm side rv">${pic(IMAGES.partnerships, 'Two people shaking hands')}</figure>${PARTNERSHIP_TYPES.map((t, i) => `<div class="pi rv" ${d(i)}><span class="rn">${num(i + 1)}</span><div><h3>${t.title}</h3><p>${t.text}</p></div></div>`).join('')}</div>
 <div class="letter rv" ${d(1)}><p class="eye">By letter</p><h2>Partnership <em>enquiry.</em></h2>${form([['name','Full Name','text',1],['email','Email','email',1],['phone','Phone','tel',0],['company','Company Name','text',0],['type','Partnership Type','select',1,PARTNERSHIP_TYPES.map(t => t.option)],['message','Message','textarea',1]], 'Send enquiry')}</div>
</div></section>`,

contact: () => ph('Contact us', 'Write to <em>us.</em>', 'Send a business or general enquiry and the right team will reply.') +
`<section class="lt" data-ch="Enquiry"><div class="w split">
 <div>
  <div class="card rv"><div class="card-in">${crest('mini')}<b>${SITE.name}</b><small>${SITE.tagline}</small>
   <dl><div><dt>Email</dt><dd>${SITE.email}</dd></div><div><dt>Telephone</dt><dd>${SITE.phone}</dd></div><div><dt>Address</dt><dd>${SITE.location}</dd></div></dl></div></div>
  <p class="eye rv" ${d(2)} style="margin-top:40px">Follow the group</p>
  <div class="soc rv" ${d(2)}>${socialLinks()}</div>
 </div>
 <div class="letter rv" ${d(1)}><div class="seg" role="tablist" data-a="0"><button role="tab" aria-selected="true" data-t="0">Business enquiry</button><button role="tab" aria-selected="false" data-t="1">General enquiry</button></div>
 <div data-p="0">${form(CF, 'Send enquiry')}</div><div data-p="1" hidden>${form(CF, 'Send enquiry')}</div></div>
</div></section>`
};

/* ---------- one page per business ---------- */
B.forEach((x, bi) => PAGES[x.id] = () => { const nx = B[(bi + 1) % B.length]; return `<div style="${vars(x)}" class="bpage">
<section class="bh" data-ch="Overview"><div class="w bhg"><div>
 <a class="back rv" href="#businesses">← All houses</a>
 <p class="eye rv" ${d(1)}>House ${num(bi + 1)} · ${x.c}</p>
 <h1 class="rv" ${d(2)}>${x.short}</h1>
 <p class="lead rv" ${d(3)}>${x.p}</p>
 <div class="row rv" ${d(4)}><a class="btn inv-b" href="#contact">Send an enquiry ${AR}</a><a class="lnk" href="#home">${SITE.name}</a></div></div>
 <div class="bh-art rv" ${d(3)}>${x.img ? `<figure class="frm bhimg">${pic(x.img, x.short)}</figure>` : ''}${seal(x, 'big')}</div></div></section>
<section class="lt" data-ch="At a glance"><div class="w">
 <dl class="ledger rv">
  <div><dt>The house</dt><dd>${x.short}</dd></div>
  <div><dt>Discipline</dt><dd>${x.c}</dd></div>
  <div><dt>${x.l}</dt><dd>${x.i.length} offered</dd></div>
  <div><dt>Part of</dt><dd>${SITE.name}</dd></div>
  <div><dt>Enquiries</dt><dd><a href="#contact">Write to us</a></dd></div>
 </dl></div></section>
<section class="lt" style="padding-top:0" data-ch="${x.l}"><div class="w">
 <div class="menu-card rv"><p class="eye" style="justify-content:center">${x.l}</p><h2>${x.h}</h2>${orn()}
 <ol class="menu">${x.i.map((v, i) => `<li><span class="rn">${num(i + 1)}</span><span class="mi">${v}</span><span class="dots"></span><a href="#contact">Enquire</a></li>`).join('')}</ol></div></div></section>
<section class="lt" style="padding-top:0" data-ch="Working together"><div class="w"><p class="eye rv">Working together</p><h2 class="rv" ${d(1)}>Three <em>simple</em> steps.</h2>
 <div class="steps">${[['Tell us what you need', 'Send an enquiry with a few lines about what you have in mind.'], ['We talk it through', `The ${x.short} team gets back to you to understand the details.`], ['We get to work', 'Once it is agreed, we begin and keep you informed along the way.']].map(([t, p], i) => `<div class="step rv" ${d(i)}><span class="rn">${num(i + 1)}</span><h3>${t}</h3><p>${p}</p></div>`).join('')}</div></div></section>
${x.gal ? `<section class="lt" style="padding-top:0" data-ch="${x.gal}"><div class="w"><div class="sec-h"><div><p class="eye rv">${x.gal}</p><h2 class="rv" ${d(1)}>Selected <em>work.</em></h2></div><p class="note rv" ${d(2)}>Sample photographs for now. Select one to view it larger.</p></div>
 <div class="gal">${x.gl.map((g, i) => `<button class="gi rv" ${d(i % 3)} data-lb="${i}" aria-label="View image ${i + 1}"><span class="frm">${pic(g, `${x.short}, image ${i + 1}`)}</span></button>`).join('')}</div></div></section>` : ''}
<section class="lt" style="padding-top:0" data-ch="The family"><div class="w"><p class="eye rv">Also from ${SITE.name}</p><h2 class="rv" ${d(1)}>The rest of the <em>family.</em></h2>
 <div class="others">${B.filter(o => o.id !== x.id).map((o, i) => `<a class="other rv" ${d(i)} href="#${o.id}">${seal(o)}<span><small>${o.tag}</small><b>${o.short}</b></span></a>`).join('')}</div></div></section>
<section class="nextb"><div class="w"><span class="eye">Next house</span><a href="#${nx.id}">${nx.short} ${seal(nx)}</a></div></section>
${cta(`Work with <em>${x.short}.</em>`, 'Tell us about your requirement and we will be in touch.')}</div>`; });
