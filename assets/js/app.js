/* =====================================================================
   AJ GROUPS — BEHAVIOUR
   Routing, animations, scroll effects and forms. No content lives here.
   ===================================================================== */
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const FINE=matchMedia('(pointer:fine)').matches;
const lenis=(!RM&&window.Lenis)?new Lenis({duration:1.2,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true}):null;
if(lenis){const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf)}

/* footer, filled from content.js */
$('#fb').innerHTML=B.map(x=>`<li><a href="#${x.id}">${x.short}</a></li>`).join('');
$('#fc').innerHTML=[SITE.email,SITE.phone,SITE.location].map(v=>`<li>${v}</li>`).join('');
$('#ftag').textContent=SITE.tagline;
$('#fcopy').textContent=`© ${SITE.copyrightYear} ${SITE.name}. All rights reserved.`;
$('#fnote').textContent=SITE.footerNote;
const WC=['#4c6fff','#a78bfa','#ff7ad1','#ff6b4a','#ffb23f','#20d3c2','#d4ff3f'];
$('#wm').innerHTML=[...SITE.name].map((ch,i)=>ch===' '?'<span>&nbsp;</span>':`<span style="--c:${WC[i%WC.length]}">${ch}</span>`).join('');

let fx=[],obs=[],timers=[],cleanup=[];
function render(){
 obs.forEach(o=>o.disconnect());obs=[];fx=[];timers.forEach(t=>{clearInterval(t);clearTimeout(t)});timers=[];cleanup.forEach(f=>f());cleanup=[];
 let h=location.hash.slice(1);if(!PAGES[h])h='home';
 $('#app').innerHTML=PAGES[h]();
 const bx=B.find(x=>x.id===h);
 document.title=(bx?bx.n:TT[h])+(h==='home'?'':' | '+SITE.name);
 const on=k=>k===h||(k==='businesses'&&bx);
 $('#nv').innerHTML=NAV.map(([k,l])=>`<a href="#${k}" class="${on(k)?'on':''}">${l}</a>`).join('');
 $('#mnav').innerHTML=NAV.map(([k,l],i)=>`<a href="#${k}" class="${on(k)?'on':''}" style="--i:${i};--c:${WC[i]}">${l}</a>`).join('')+`<small>${SITE.name}. ${SITE.tagline}</small>`;
 setMenu(false);$('#nav').classList.remove('hide');
 lenis?lenis.scrollTo(0,{immediate:true,force:true}):window.scrollTo(0,0);
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
 $$('[data-d]').forEach(el=>el.style.setProperty('--d',el.dataset.d*90+'ms'));
 $$('.rv').forEach(el=>io.observe(el));obs.push(io);
 const co=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;co.unobserve(e.target);const el=e.target,n=+el.dataset.n,t0=performance.now();
  const step=t=>{const p=clamp((t-t0)/1500);el.textContent=Math.round(n*(1-Math.pow(1-p,4)));if(p<1)requestAnimationFrame(step)};RM?el.textContent=n:requestAnimationFrame(step)}),{threshold:.5});
 $$('.cnt').forEach(el=>co.observe(el));obs.push(co);
 if(h==='home')initHome();
 buildRail();
 bindFx();tick();
}

function initHome(){
 /* hero drifts and fades as you scroll away */
 const hg=$('#hgrid');
 /* only on wide screens: on phones the hero is taller than the screen, so fading it would hide content still in view */
 fx.push(()=>{if(innerWidth<=1020){hg.style.transform='';hg.style.opacity='';return}const p=clamp(scrollY/innerHeight);hg.style.transform=`translateY(${p*80}px)`;hg.style.opacity=1-p*1.15});

 /* rotating hero word */
 const rot=$('#rot');let ri=0;
 if(!RM)timers.push(setInterval(()=>{rot.classList.add('out');setTimeout(()=>{ri=(ri+1)%ROT.length;rot.firstChild.textContent=ROT[ri][0];rot.style.color=ROT[ri][1];rot.classList.remove('out');rot.classList.add('pre-in');void rot.offsetWidth;rot.classList.remove('pre-in')},450)},2600));

 /* live notification stack */
 const stack=$('#stack'),AGE=['now','2m ago','5m ago'];let k=0;
 const mk=i=>{const[x,t]=NOTES[i%NOTES.length],a=document.createElement('a');a.className='nt';a.href='#'+x.id;a.style.cssText=`--c1:${x.c1};--c2:${x.c2};--f:${x.f}`;
  a.innerHTML=`<span class="ap">${x.m}</span><div><b>${x.short}<em>${x.tag||''}</em></b><p>${t}</p></div>`;return a};
 const ages=()=>{};
 const fit=()=>{const c=[...stack.children].filter(e=>!e.classList.contains('out')).slice(0,3);stack.style.height=c.reduce((s,e)=>s+e.offsetHeight,0)+8*(c.length-1)+'px'};
 for(k=0;k<3;k++)stack.append(mk(k));ages();fit();
 const push=()=>{const old=[...stack.children],y0=old.map(e=>e.offsetTop),n=mk(k++);n.classList.add('new');stack.prepend(n);
  old.forEach((e,i)=>{e.style.transition='none';e.style.transform=`translateY(${y0[i]-e.offsetTop}px)`});
  requestAnimationFrame(()=>requestAnimationFrame(()=>old.forEach(e=>{e.style.transition='';e.style.transform=''})));
  const last=stack.children[3];if(last){last.classList.add('out');setTimeout(()=>last.remove(),650)}ages();fit()};
 let paused=false;const card=$('#ntf');card.onmouseenter=()=>paused=true;card.onmouseleave=()=>paused=false;
 if(!RM)timers.push(setInterval(()=>{if(!paused&&!document.hidden)push()},3400));
 addEventListener('resize',fit);cleanup.push(()=>removeEventListener('resize',fit));

 timers.push(setTimeout(()=>{const h=$('#hero');if(h)h.classList.add('done')},1700));

 /* note board: drag the paper notes around (larger screens) */
 const board=$('#board');let zTop=10;
 if(board)board.querySelectorAll('.note').forEach(n=>n.addEventListener('pointerdown',e=>{
  if(innerWidth<860)return;e.preventDefault();n.setPointerCapture(e.pointerId);n.classList.add('drag');n.style.zIndex=++zTop;
  const sx=e.clientX-n.offsetLeft,sy=e.clientY-n.offsetTop,bw=board.offsetWidth,bh=board.offsetHeight;
  const mv=ev=>{n.style.left=clamp(ev.clientX-sx,-30,bw-n.offsetWidth+30)+'px';n.style.top=clamp(ev.clientY-sy,-30,bh-n.offsetHeight+60)+'px'};
  const up=()=>{n.classList.remove('drag');n.removeEventListener('pointermove',mv);n.removeEventListener('pointerup',up);n.removeEventListener('pointercancel',up)};
  n.addEventListener('pointermove',mv);n.addEventListener('pointerup',up);n.addEventListener('pointercancel',up)}));

 /* feature strip */
 const sb=[...$$('#strip button')];let s=0;
 const act=i=>{s=i;sb.forEach((b,j)=>b.classList.toggle('on',j===i))};
 timers.push(setTimeout(()=>act(0),1000));
 sb.forEach((b,i)=>{b.onmouseenter=()=>act(i);b.onclick=()=>act(i)});
 if(!RM)timers.push(setInterval(()=>act((s+1)%sb.length),3600));

 /* tape bands skew with scroll speed */
 const sks=[...$$('.band .sk')];let sk=0;
 fx.push(()=>{const v=lenis?lenis.velocity:0;sk+=(clamp(v*-.35,-12,12)-sk)*.2;sks.forEach((e,i)=>e.style.transform=`skewX(${i?sk:-sk}deg)`)});

 /* scroll-highlight statement */
 const P=$('#hlp');P.innerHTML=P.textContent.split(/(\*[^*]+\*)/).map(s=>s.startsWith('*')?s.slice(1,-1).split(' ').map(w=>`<span class="wd k">${w}</span>`).join(' '):s.split(' ').map(w=>w?`<span class="wd">${w}</span>`:'').join(' ')).join(' ');
 const W=[...P.querySelectorAll('.wd')],hl=$('#hl');
 fx.push(()=>{const r=hl.getBoundingClientRect(),p=clamp(-r.top/(r.height-innerHeight)*1.15),n=Math.floor(p*W.length);W.forEach((w,i)=>w.classList.toggle('on',i<n||RM))});

 /* business chapters: each panel dims and sinks a little as the next one slides over it */
 const chaps=[...$$('.chap')];
 /* play each panel's entrance once it is a third on screen */
 const ao=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('act');ao.unobserve(e.target)}}),{threshold:.33});
 chaps.forEach(c=>ao.observe(c));obs.push(ao);
 fx.push(()=>{chaps.forEach((c,i)=>{const nx=chaps[i+1];if(!nx)return;
  const p=clamp(1-(nx.getBoundingClientRect().top-parseFloat(getComputedStyle(nx).top))/innerHeight);c.style.setProperty('--dim',(p*.45).toFixed(3));c.style.transform=`scale(${(1-p*.04).toFixed(4)})`})});

 /* orbit: hovering a brand (or its legend row) lights it up and fills the centre */
 const nodes=[...$$('.node')],rows=[...$$('#legend li')],lines=[...$$('.ring line')],coreT=$('#coreT'),coreS=$('#coreS');
 const lit=i=>{nodes.forEach((n,j)=>n.classList.toggle('on',j===i));rows.forEach((r,j)=>r.classList.toggle('on',j===i));lines.forEach((l,j)=>l.classList.toggle('on',j===i));
  if(i<0){coreT.textContent=SITE.name;coreT.style.color='';coreS.innerHTML='The parent group.<br>Hover a brand.';return}
  coreT.textContent=B[i].short;coreT.style.color=B[i].hi;coreS.textContent=innerWidth<600?B[i].tag:B[i].c};
 [...nodes,...rows].forEach(el=>{el.addEventListener('mouseenter',()=>lit(+el.dataset.i));el.addEventListener('focus',()=>lit(+el.dataset.i));el.addEventListener('mouseleave',()=>lit(-1))});
 /* touch screens have no hover, so the orbit introduces each brand in turn by itself */
 if(!FINE&&!RM){let oi=0;timers.push(setInterval(()=>{lit(oi);oi=(oi+1)%B.length},2200))}
}

/* chapter guide on the right edge: one dot per section that has data-ch */
function buildRail(){
 const rail=$('#chrail'),secs=[...$$('[data-ch]')];
 if(secs.length<3){rail.innerHTML='';return}
 rail.innerHTML=secs.map((s,i)=>`<a href="#" data-k="${i}"><span>${s.dataset.ch}</span><i></i></a>`).join('');
 const links=[...rail.children];
 links.forEach((a,i)=>a.onclick=e=>{e.preventDefault();lenis?lenis.scrollTo(secs[i],{offset:0}):secs[i].scrollIntoView({behavior:'smooth'})});
 const ro=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const i=secs.indexOf(e.target);links.forEach((a,j)=>a.classList.toggle('on',j===i))}}),{rootMargin:'-45% 0px -50% 0px'});
 secs.forEach(s=>ro.observe(s));obs.push(ro);
}

/* scroll loop: progress bar, smart nav, page effects */
let ticking=false,lastY=0;
function tick(){
 const y=scrollY,max=document.documentElement.scrollHeight-innerHeight;
 $('#prog').style.transform=`scaleX(${max>0?y/max:0})`;
 if(!document.body.classList.contains('mopen')){if(y>lastY+6&&y>240)$('#nav').classList.add('hide');else if(y<lastY-6||y<240)$('#nav').classList.remove('hide')}
 lastY=y;if(!RM)fx.forEach(f=>f());ticking=false}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(tick)}},{passive:true});

/* page transitions */
/* uses the View Transitions wipe when available; never waits more than 800ms for it */
let navSeq=0;
function route(){const id=++navSeq;let ran=false;const go=()=>{if(ran||id!==navSeq)return;ran=true;render()};
 if(document.startViewTransition&&!RM&&!document.hidden){try{const vt=document.startViewTransition(go);[vt.ready,vt.finished,vt.updateCallbackDone].forEach(pr=>pr&&pr.catch(()=>{}))}catch(e){go()}setTimeout(go,800)}else go()}
addEventListener('hashchange',route);

/* mobile menu */
function setMenu(o){document.body.classList.toggle('mopen',o);if(lenis)o?lenis.stop():lenis.start();$('#burg').setAttribute('aria-expanded',o);$('#burg').setAttribute('aria-label',o?'Close menu':'Open menu');document.body.style.overflow=o?'hidden':''}
$('#burg').onclick=()=>setMenu(!document.body.classList.contains('mopen'));
addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});

/* custom cursor + magnetic buttons + 3D tilt + card glow (mouse/trackpad only) */
function bindFx(){
 if(!FINE||RM)return;
 $$('.mag').forEach(el=>{el.onpointermove=e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.25}px,${(e.clientY-r.top-r.height/2)*.35}px)`};el.onpointerleave=()=>{el.style.transform=''}});
 $$('.tilt').forEach(el=>{el.onpointermove=e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform=`perspective(900px) rotateY(${x*8}deg) rotateX(${-y*8}deg) scale(1.015)`};el.onpointerleave=()=>{el.style.transform=''}});
}
if(FINE&&!RM){
 const c=$('#cur'),lab=c.firstChild;let x=innerWidth/2,y=innerHeight/2,cx=x,cy=y;document.body.classList.add('has-cur');
 addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;c.style.opacity=1;
  const t=e.target.closest&&e.target.closest('a,button,[data-cur]'),l=t&&t.closest('[data-cur]');
  c.classList.toggle('hov',!!t&&!l);c.classList.toggle('lab',!!l);lab.textContent=l?l.dataset.cur:'';
  const b=e.target.closest&&e.target.closest('.bx');if(b){const r=b.getBoundingClientRect();b.style.setProperty('--mx',e.clientX-r.left+'px');b.style.setProperty('--my',e.clientY-r.top+'px')}},{passive:true});
 document.addEventListener('pointerleave',()=>c.style.opacity=0);
 const loop=()=>{cx+=(x-cx)*.2;cy+=(y-cy)*.2;c.style.transform=`translate(${cx}px,${cy}px)`;requestAnimationFrame(loop)};loop();
}

/* contact: segmented control */
document.addEventListener('click',e=>{const b=e.target.closest('.seg button');if(!b)return;const s=b.parentElement;s.dataset.a=b.dataset.t;
 s.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x===b));$$('[data-p]').forEach(p=>p.hidden=p.dataset.p!==b.dataset.t)});

/* form validation (demo: no backend yet) */
document.addEventListener('submit',e=>{const f=e.target;if(!f.matches('.fm'))return;e.preventDefault();let ok=true;
 f.querySelectorAll('input,textarea,select').forEach(i=>{const v=i.value.trim();let m='';
  if(i.dataset.r&&!v)m='This field is required.';
  else if(i.type==='email'&&v&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))m='Enter a valid email address.';
  else if(i.type==='tel'&&v&&!/^[+\d\s()-]{7,}$/.test(v))m='Enter a valid phone number.';
  i.nextElementSibling.textContent=m;i.setAttribute('aria-invalid',!!m);if(m)ok=false});
 const st=f.querySelector('.st');
 if(ok){st.className='st ok';st.textContent='Thanks! Your enquiry is ready. (Demo: no backend is connected yet, so nothing was sent.)';f.reset()}
 else{st.className='st bad';st.textContent='Please correct the highlighted fields.'}});

/* first load: quick counter preloader, then the hero plays in */
render();
if(document.fonts)document.fonts.ready.then(()=>dispatchEvent(new Event('resize')));
void document.body.offsetWidth;document.body.classList.add('ready');
