/* =====================================================================
   AJ GROUPS — BEHAVIOUR
   Routing, animations, scroll effects, gallery viewer and forms.
   No content lives here.
   ===================================================================== */
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const HOVER=matchMedia('(hover:hover) and (pointer:fine)').matches;
const lenis=(!RM&&window.Lenis)?new Lenis({duration:1.25,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true}):null;
if(lenis){const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf)}
const toTop=()=>lenis?lenis.scrollTo(0,{immediate:true,force:true}):window.scrollTo(0,0);

/* crests and footer, filled from content.js */
$('#navCrest').innerHTML=crest('mini');$('#introCrest').innerHTML=crest();$('#veilCrest').innerHTML=crest('mini');$('#fcrest').innerHTML=crest();
$('#introEst').textContent='Est. '+EST;
$('#fb').innerHTML=B.map(x=>`<li><a href="#${x.id}">${x.short}</a></li>`).join('');
$('#fc').innerHTML=[SITE.email,SITE.phone,SITE.location].map(v=>`<li>${v}</li>`).join('');
$('#ftag').textContent=SITE.tagline;
$('#fcopy').textContent=`© ${SITE.copyrightYear} ${SITE.name}. All rights reserved.`;
$('#fnote').textContent=SITE.footerNote;
$('#totop').onclick=e=>{e.preventDefault();lenis?lenis.scrollTo(0,{duration:1.6}):window.scrollTo({top:0,behavior:'smooth'})};

let fx=[],obs=[],timers=[],cleanup=[];
function render(){
 obs.forEach(o=>o.disconnect());obs=[];fx=[];timers.forEach(t=>{clearInterval(t);clearTimeout(t)});timers=[];cleanup.forEach(f=>f());cleanup=[];
 let h=location.hash.slice(1);if(!PAGES[h])h='home';
 $('#app').innerHTML=PAGES[h]();
 const bx=B.find(x=>x.id===h);
 document.title=(bx?bx.n:TT[h])+(h==='home'?'':' | '+SITE.name);
 const on=k=>k===h||(k==='businesses'&&bx);
 $('#nv').innerHTML=NAV.map(([k,l])=>`<a href="#${k}" class="${on(k)?'on':''}">${l}</a>`).join('');
 $('#mnav').innerHTML=NAV.map(([k,l],i)=>`<a href="#${k}" class="${on(k)?'on':''}" style="--i:${i}"><span class="rn">${num(i+1)}</span>${l}</a>`).join('')+`<small>${SITE.name} · ${SITE.tagline}</small>`;
 setMenu(false);$('#nav').classList.remove('hide');
 toTop();
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
 $$('[data-d]').forEach(el=>el.style.setProperty('--d',el.dataset.d*90+'ms'));
 $$('.rv').forEach(el=>io.observe(el));obs.push(io);
 const co=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;co.unobserve(e.target);const el=e.target,n=+el.dataset.n,t0=performance.now();
  const step=t=>{const p=clamp((t-t0)/1600);el.textContent=Math.round(n*(1-Math.pow(1-p,4)));if(p<1)requestAnimationFrame(step)};RM?el.textContent=n:requestAnimationFrame(step)}),{threshold:.5});
 $$('.cnt').forEach(el=>co.observe(el));obs.push(co);
 if(h==='home')initHome();
 if($('#orbit'))initFamily();
 if(h==='businesses')initDirectory();
 if(bx)initGallery(bx);
 initCarousels();
 buildRail();
 tick();
}

function initHome(){
 /* rotating hero word */
 const rot=$('#rot');let ri=0;
 if(!RM)timers.push(setInterval(()=>{rot.classList.add('out');setTimeout(()=>{ri=(ri+1)%ROT.length;rot.textContent=ROT[ri][0];rot.style.color=ROT[ri][1];rot.classList.remove('out');rot.classList.add('pre-in');void rot.offsetWidth;rot.classList.remove('pre-in')},450)},3200));

 /* the correspondence: a new note from one of the houses arrives every few seconds */
 const stack=$('#stack'),ntfn=$('#ntfn');let k=0;
 const mk=i=>{const[x,t]=NOTES[i%NOTES.length],a=document.createElement('a');a.className='nt';a.href='#'+x.id;
  a.innerHTML=`${seal(x)}<div><b>${x.short}<em>${x.tag||''}</em></b><p>${t}</p></div>`;return a};
 const fit=()=>{const c=[...stack.children].filter(e=>!e.classList.contains('out')).slice(0,3);stack.style.height=c.reduce((s,e)=>s+e.offsetHeight,0)+'px'};
 for(k=0;k<3;k++)stack.append(mk(k));fit();
 const push=()=>{const old=[...stack.children],y0=old.map(e=>e.offsetTop),n=mk(k++);n.classList.add('new');stack.prepend(n);
  old.forEach((e,i)=>{e.style.transition='none';e.style.transform=`translateY(${y0[i]-e.offsetTop}px)`});
  requestAnimationFrame(()=>requestAnimationFrame(()=>old.forEach(e=>{e.style.transition='';e.style.transform=''})));
  const last=stack.children[3];if(last){last.classList.add('out');setTimeout(()=>last.remove(),650)}
  ntfn.textContent='No. '+num(k-2);fit()};
 let paused=false;const card=$('#ntf');card.onmouseenter=()=>paused=true;card.onmouseleave=()=>paused=false;
 if(!RM)timers.push(setInterval(()=>{if(!paused&&!document.hidden)push()},4200));
 addEventListener('resize',fit);cleanup.push(()=>removeEventListener('resize',fit));

 /* ribbons lean very slightly with scroll speed */
 const sks=[...$$('.band .sk')];let sk=0;
 fx.push(()=>{const v=lenis?lenis.velocity:0;sk+=(clamp(v*-.12,-3,3)-sk)*.2;sks.forEach((e,i)=>e.style.transform=`skewX(${i?sk:-sk}deg)`)});

 /* house folios: each one dims as the next is laid over it (no shrinking, so edges and content stay aligned) */
 const chaps=[...$$('.chap')];
 const ao=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('act');ao.unobserve(e.target)}}),{threshold:.33});
 chaps.forEach(c=>ao.observe(c));obs.push(ao);
 fx.push(()=>{chaps.forEach((c,i)=>{const nx=chaps[i+1];if(!nx)return;
  const p=clamp(1-(nx.getBoundingClientRect().top-parseFloat(getComputedStyle(nx).top))/innerHeight);c.style.setProperty('--dim',(p*.5).toFixed(3))})});

}

/* family diagram (about page) */
function initFamily(){
 /* family diagram: hovering a house (or its row) lights it and names it in the centre */
 const nodes=[...$$('.node')],rows=[...$$('#legend li')],lines=[...$$('.ring line')],coreT=$('#coreT'),coreS=$('#coreS');
 const lit=i=>{nodes.forEach((n,j)=>n.classList.toggle('on',j===i));rows.forEach((r,j)=>r.classList.toggle('on',j===i));lines.forEach((l,j)=>l.classList.toggle('on',j===i));
  if(i<0){coreT.textContent=SITE.name;coreT.style.color='';coreS.textContent='The parent group';return}
  coreT.textContent=B[i].short;coreT.style.color=B[i].c1;coreS.textContent=B[i].tag};
 [...nodes,...rows].forEach(el=>{el.addEventListener('mouseenter',()=>lit(+el.dataset.i));el.addEventListener('focus',()=>lit(+el.dataset.i));el.addEventListener('mouseleave',()=>lit(-1))});
 rows.forEach(r=>r.onclick=()=>location.hash=B[+r.dataset.i].id);
 /* touch screens have no hover, so the diagram introduces each house in turn */
 if(!HOVER&&!RM){let oi=0;timers.push(setInterval(()=>{lit(oi);oi=(oi+1)%B.length},2400))}
}

/* venture carousels: swipe, drag, arrow keys, buttons and page dots */
function initCarousels(){
 $$('[data-car]').forEach(car=>{
  const tr=car.querySelector('.car-track'),cards=[...tr.children],dots=car.querySelector('.car-dots'),cnt=car.querySelector('.car-n'),pv=car.querySelector('.car-p'),nx=car.querySelector('.car-nx');
  const step=()=>cards.length>1?cards[1].offsetLeft-cards[0].offsetLeft:tr.clientWidth;
  const pages=()=>Math.max(1,Math.round((tr.scrollWidth-tr.clientWidth)/step())+1);
  const cur=()=>Math.round(tr.scrollLeft/step());
  /* own easing instead of scrollTo smooth: some phones cancel smooth scrolling on snapping rows */
  let anim=0;
  const go=i=>{const to=Math.min(clamp(i,0,pages()-1)*step(),tr.scrollWidth-tr.clientWidth),from=tr.scrollLeft,t0=performance.now(),D=RM?0:520,id=++anim;
   const done=()=>{if(id!==anim)return;tr.scrollLeft=to;tr.classList.remove('anim');upd()};
   if(!D||Math.abs(to-from)<2){done();return}
   tr.classList.add('anim');
   const f=t=>{if(id!==anim)return;const p=clamp((t-t0)/D);tr.scrollLeft=from+(to-from)*(1-Math.pow(1-p,3));p<1?requestAnimationFrame(f):done()};
   requestAnimationFrame(f);setTimeout(done,D+250)};
  const upd=()=>{const n=pages(),i=clamp(cur(),0,n-1);[...dots.children].forEach((b,j)=>{b.setAttribute('aria-selected',j===i);b.classList.toggle('on',j===i)});
   cnt.textContent=`${i+1} / ${n}`;pv.disabled=i<=0;nx.disabled=i>=n-1};
  const build=()=>{const n=pages();car.classList.toggle('one',n<2);
   dots.innerHTML=Array.from({length:n},(_,i)=>`<button type="button" role="tab" aria-label="Page ${i+1} of ${n}"></button>`).join('');
   [...dots.children].forEach((b,i)=>b.onclick=()=>go(i));upd()};
  pv.onclick=()=>go(cur()-1);nx.onclick=()=>go(cur()+1);
  let raf=0;tr.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(upd)},{passive:true});
  tr.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();go(cur()+1)}if(e.key==='ArrowLeft'){e.preventDefault();go(cur()-1)}});
  /* mouse drag on desktop (touch screens swipe natively) */
  let sx=0,sl=0,drag=false,moved=false;
  tr.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;drag=true;moved=false;sx=e.clientX;sl=tr.scrollLeft});
  const mv=e=>{if(!drag)return;const dx=e.clientX-sx;if(!moved&&Math.abs(dx)>6){moved=true;tr.classList.add('grab')}if(moved)tr.scrollLeft=sl-dx};
  const end=()=>{if(!drag)return;drag=false;if(moved){tr.classList.remove('grab');go(Math.round(tr.scrollLeft/step()))}};
  addEventListener('pointermove',mv,{passive:true});addEventListener('pointerup',end);
  tr.addEventListener('dragstart',e=>e.preventDefault());
  tr.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
  build();const rs=()=>build();addEventListener('resize',rs);
  cleanup.push(()=>{removeEventListener('resize',rs);removeEventListener('pointermove',mv);removeEventListener('pointerup',end)});
 });
}

/* the houses page: a framed photograph follows the pointer over the list */
function initDirectory(){
 const pv=$('#dprev');if(!HOVER||!pv)return;
 const imgs=[...pv.children];let x=0,y=0,cx=0,cy=0,run=false;
 const loop=()=>{cx+=(x-cx)*.14;cy+=(y-cy)*.14;pv.style.transform=`translate(${cx}px,${cy}px) rotate(${clamp((x-cx)*.04,-6,6)}deg)`;if(run)requestAnimationFrame(loop)};
 $$('.drow').forEach(r=>{
  r.addEventListener('pointerenter',e=>{imgs.forEach((im,j)=>im.classList.toggle('on',j===+r.dataset.i));x=e.clientX+30;y=e.clientY-160;if(!pv.classList.contains('on')){cx=x;cy=y}pv.classList.add('on');if(!run){run=true;loop()}});
  r.addEventListener('pointermove',e=>{x=e.clientX+30;y=e.clientY-160});
  r.addEventListener('pointerleave',()=>{pv.classList.remove('on');run=false})});
 cleanup.push(()=>{run=false});
}

/* gallery viewer on business pages */
let LB={list:[],i:0,name:''};
function initGallery(bx){LB={list:bx.gl,i:0,name:bx.short}}
function showLB(i){const lb=$('#lb');if(!LB.list.length)return;LB.i=(i+LB.list.length)%LB.list.length;
 const im=$('#lbi');im.src=LB.list[LB.i].replace(/w=\d+/,'w=1600');im.alt=`${LB.name}, image ${LB.i+1}`;
 $('#lbc').textContent=`${LB.name} · ${num(LB.i+1)} of ${num(LB.list.length)}`;
 if(lb.hidden){lb.hidden=false;requestAnimationFrame(()=>lb.classList.add('on'));if(lenis)lenis.stop();document.body.style.overflow='hidden';$('#lbx').focus()}}
function hideLB(){const lb=$('#lb');if(lb.hidden)return;lb.classList.remove('on');setTimeout(()=>{lb.hidden=true},350);if(lenis)lenis.start();document.body.style.overflow=''}
document.addEventListener('click',e=>{const g=e.target.closest('[data-lb]');if(g)showLB(+g.dataset.lb)});
$('#lbx').onclick=hideLB;$('#lbp').onclick=()=>showLB(LB.i-1);$('#lbn').onclick=()=>showLB(LB.i+1);
$('#lb').addEventListener('click',e=>{if(e.target.id==='lb')hideLB()});
let tx0=null;$('#lb').addEventListener('touchstart',e=>tx0=e.touches[0].clientX,{passive:true});
$('#lb').addEventListener('touchend',e=>{if(tx0===null)return;const dx=e.changedTouches[0].clientX-tx0;if(Math.abs(dx)>50)showLB(LB.i+(dx<0?1:-1));tx0=null});
addEventListener('keydown',e=>{if($('#lb').hidden){if(e.key==='Escape')setMenu(false);return}
 if(e.key==='Escape')hideLB();if(e.key==='ArrowLeft')showLB(LB.i-1);if(e.key==='ArrowRight')showLB(LB.i+1)});

/* section guide on the right edge: one mark per section that has data-ch */
function buildRail(){
 const rail=$('#chrail'),secs=[...$$('[data-ch]')];
 if(secs.length<3){rail.innerHTML='';return}
 rail.innerHTML=secs.map((s,i)=>`<a href="#" data-k="${i}"><span>${s.dataset.ch}</span><i></i></a>`).join('');
 const links=[...rail.children];
 links.forEach((a,i)=>a.onclick=e=>{e.preventDefault();lenis?lenis.scrollTo(secs[i],{offset:0}):secs[i].scrollIntoView({behavior:'smooth'})});
 const ro=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const i=secs.indexOf(e.target);links.forEach((a,j)=>a.classList.toggle('on',j===i))}}),{rootMargin:'-45% 0px -50% 0px'});
 secs.forEach(s=>ro.observe(s));obs.push(ro);
}

/* scroll loop: progress line, smart nav, page effects */
let ticking=false,lastY=0;
function tick(){
 const y=scrollY,max=document.documentElement.scrollHeight-innerHeight;
 $('#prog').style.transform=`scaleX(${max>0?y/max:0})`;
 if(!document.body.classList.contains('mopen')){if(y>lastY+6&&y>240)$('#nav').classList.add('hide');else if(y<lastY-6||y<240)$('#nav').classList.remove('hide')}
 lastY=y;if(!RM)fx.forEach(f=>f());ticking=false}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(tick)}},{passive:true});

/* page changes, one per theme (styles in each theme's CSS):
   Heritage: a parchment leaf turns over the page like a ledger, then turns away.
   Gallery: a camera-aperture circle opens from where you tapped, then closes back to it. */
let navSeq=0,tapX=innerWidth/2,tapY=innerHeight/2;
addEventListener('pointerdown',e=>{tapX=e.clientX;tapY=e.clientY},{passive:true});
addEventListener('keydown',e=>{if(e.key==='Enter'){tapX=innerWidth/2;tapY=innerHeight/2}});
function route(){const id=++navSeq;hideLB();
 if(RM||document.hidden){render();return}
 const v=$('#veil'),IN=620,OUT=700;
 v.style.setProperty('--vx',tapX+'px');v.style.setProperty('--vy',tapY+'px');
 v.classList.remove('away');void v.offsetWidth;v.classList.add('cover');
 setTimeout(()=>{if(id!==navSeq)return;render();v.classList.remove('cover');v.classList.add('away');setTimeout(()=>{if(id===navSeq)v.classList.remove('away')},OUT+60)},IN)}
addEventListener('hashchange',route);

/* mobile menu */
function setMenu(o){document.body.classList.toggle('mopen',o);if(o)$('#nav').classList.remove('hide');if(lenis)o?lenis.stop():lenis.start();$('#burg').setAttribute('aria-expanded',o);$('#burg').setAttribute('aria-label',o?'Close menu':'Open menu');document.body.style.overflow=o?'hidden':''}
$('#burg').onclick=()=>setMenu(!document.body.classList.contains('mopen'));

/* contact: enquiry type tabs */
document.addEventListener('click',e=>{const b=e.target.closest('.seg button');if(!b)return;const s=b.parentElement;s.dataset.a=b.dataset.t;
 s.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x===b));$$('[data-p]').forEach(p=>p.hidden=p.dataset.p!==b.dataset.t)});

/* form validation (demo: no backend yet) */
document.addEventListener('submit',e=>{const f=e.target;if(!f.matches('.fm'))return;e.preventDefault();let ok=true;
 f.querySelectorAll('input,textarea,select').forEach(i=>{const v=i.value.trim();let m='';
  if(i.dataset.r&&!v)m='This field is required.';
  else if(i.type==='email'&&v&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))m='Please enter a valid email address.';
  else if(i.type==='tel'&&v&&!/^[+\d\s()-]{7,}$/.test(v))m='Please enter a valid telephone number.';
  i.nextElementSibling.textContent=m;i.setAttribute('aria-invalid',!!m);if(m)ok=false});
 const st=f.querySelector('.st');
 if(ok){st.className='st ok';st.textContent='Thank you. Your enquiry is ready. (Demo: no backend is connected yet, so nothing was sent.)';f.reset()}
 else{st.className='st bad';st.textContent='Please correct the highlighted fields.'}});

/* first load: the crest intro plays once per visit, then the hero settles in */
render();
if(document.fonts)document.fonts.ready.then(()=>dispatchEvent(new Event('resize')));
const intro=$('#intro');let seen=false;
try{seen=sessionStorage.getItem('aj-intro')==='1';sessionStorage.setItem('aj-intro','1')}catch(e){}
const start=()=>{intro.classList.add('gone');void document.body.offsetWidth;document.body.classList.add('ready');setTimeout(()=>intro.classList.add('skip'),900)};
if(seen||RM){intro.classList.add('skip');start()}else setTimeout(start,1600);
