import * as THREE from 'three';
(function(){
'use strict';
var D='../assets/clothing-cutouts/';
var P=[
 {id:'bluetee',n:'Washed tee',pr:1490,x:32,y:40,h:140,m:[22,31]},
 {id:'shirt',n:'Linen shirt',pr:2890,x:77,y:27,h:190,m:[80,54]},
 {id:'denim',n:'Raw denim',pr:3490,x:21,y:70,h:200,m:[22,67]},
 {id:'whitetee',n:'Studio tee',pr:1290,x:80,y:68,h:170,m:[76,78]},
 {id:'dress',n:'Evening dress',pr:5990,x:63,y:20,h:130,m:[78,29]}
];
var $=function(i){return document.getElementById(i)};
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
var inr=function(n){return '₹'+n.toLocaleString('en-IN')};

/* top bar + menu */
var tb=$('tb'),menu=$('menu'),mb=$('menubtn');
mb.onclick=function(){var o=menu.classList.toggle('on');mb.setAttribute('aria-expanded',o);mb.textContent=o?'Close':'Menu'};
menu.addEventListener('click',function(e){if(e.target.tagName==='A'){menu.classList.remove('on');mb.textContent='Menu';mb.setAttribute('aria-expanded',false)}});
var hero=$('hero');
new IntersectionObserver(function(e){tb.classList.toggle('dark',!e[0].isIntersecting)},{rootMargin:'-40px 0px -85% 0px'}).observe(hero);
addEventListener('scroll',function(){tb.classList.toggle('dark',scrollY>innerHeight*.7)},{passive:true});

/* ---- the poster: a garment that streaks like a long exposure ---- */
var sub=$('sub'),N=11,ghosts=[],main;
for(var k=0;k<N;k++){var im=new Image();im.alt='';im.draggable=false;im.src=D+P[0].id+'.webp';sub.appendChild(im);ghosts.push(im)}
main=new Image();main.alt='';main.className='main';main.draggable=false;main.src=D+P[0].id+'.webp';sub.appendChild(main);
P.forEach(function(p){var i=new Image();i.src=D+p.id+'.webp'});
var cur=0,phase='hold',pt=0,streak=0.04,dir=1,px=0,pvx=0,lastx=null,lastT=performance.now(),nm=$('pnm');
hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect(),x=(e.clientX-r.left)/r.width;if(lastx!==null)pvx+=(x-lastx)*14;lastx=x;px=x-.5},{passive:true});
hero.addEventListener('pointerleave',function(){lastx=null});

/* ---- WebGL: the garment is sliced into bands that shear and smear with the streak ---- */
var gl=null,glU=null,texs={},bw=document.querySelector('.bigword');
try{
 var cvs=$('gl'),rd=new THREE.WebGLRenderer({canvas:cvs,alpha:true,antialias:false});
 rd.setPixelRatio(Math.min(devicePixelRatio,1.5));rd.setClearColor(0x000000,0);
 var sc=new THREE.Scene(),oc=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 glU={uTex:{value:null},uAsp:{value:.7},uRes:{value:new THREE.Vector2(1,1)},uS:{value:0},uDir:{value:1},uMo:{value:1},uT:{value:0},uX:{value:0},uSeed:{value:1}};
 var mat=new THREE.ShaderMaterial({uniforms:glU,transparent:true,depthTest:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:[
 'precision highp float;varying vec2 vUv;uniform sampler2D uTex;uniform float uAsp,uS,uDir,uMo,uT,uX,uSeed;uniform vec2 uRes;',
 'float h(float n){return fract(sin(n*91.345+uSeed*17.3)*43758.5453);}',
 'vec4 smp(vec2 q){if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return vec4(0.);vec4 c=texture2D(uTex,q);return vec4(c.rgb*c.a,c.a);}',
 'void main(){float R=uRes.x/uRes.y,H=min(.8,.8*R/uAsp),W=H*uAsp/R;vec2 ce=vec2(.5+uX,.5);vec2 q=(vUv-ce)/vec2(W,H)+.5;',
 'float S=pow(uS,1.8)*1.15;float B=44.,b=floor(q.y*B),hh=h(b);float wob=sin(b*.8+uT*1.6)*.05;float off=uDir*S*((hh-.5)*.9+wob);',
 'vec4 c=vec4(0.);for(int i=0;i<14;i++){float t=float(i)/13.-.5;c+=smp(vec2(q.x+off+t*S*(.18+.5*hh),q.y+S*.012*(hh-.5)*t));}c/=14.;',
 'vec4 s0=smp(q);c=mix(s0,c,smoothstep(.0,.03,S));float a=c.a*uMo;vec3 col=c.a>.001?c.rgb/c.a:vec3(0.);',
 'gl_FragColor=vec4(col,a);}'].join(String.fromCharCode(10))});
 sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat));
 var loader=new THREE.TextureLoader();
 P.forEach(function(p){loader.load(D+p.id+'.webp',function(t){t.colorSpace=THREE.NoColorSpace;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;texs[p.id]=t;if(p.id===P[cur].id){glU.uTex.value=t;glU.uAsp.value=t.image.width/t.image.height}})});
 var sizeGL=function(){var r=hero.getBoundingClientRect();rd.setSize(r.width,r.height,false);glU.uRes.value.set(r.width,r.height)};sizeGL();addEventListener('resize',sizeGL);
 gl={r:rd,s:sc,c:oc};document.getElementById('sub').style.display='none';
}catch(err){gl=null}
function setSrc(i){var t0=texs[P[i].id];if(t0&&glU){glU.uTex.value=t0;glU.uAsp.value=t0.image.width/t0.image.height;glU.uSeed.value=Math.random()*50}var s=D+P[i].id+'.webp';ghosts.forEach(function(g){g.src=s});main.src=s;nm.textContent=P[i].n}
function frame(now){
 var dt=Math.min(.05,(now-lastT)/1000);lastT=now;pt+=dt;pvx*=Math.pow(.02,dt);
 var target=.04,mo=1;
 if(!reduce){
  if(phase==='hold'){target=.06+Math.abs(pvx)*.9;if(pt>5.2){phase='out';pt=0;dir=Math.random()<.5?-1:1}}
  else if(phase==='out'){var u=Math.min(1,pt/.9);target=.06+u*u*1;mo=1-u;if(u>=1){cur=(cur+1)%P.length;setSrc(cur);phase='in';pt=0;dir=-dir}}
  else{var v=Math.min(1,pt/1.1);target=1-v*v*(3-2*v)+.06;mo=v;if(v>=1){phase='hold';pt=0}}
 }
 streak+=(target-streak)*Math.min(1,dt*9);
 var sgn=phase==='hold'?(pvx>=0?1:-1):dir,spread=Math.min(innerWidth,1200)*.045;
 var par=px*-24;
 for(var k=0;k<N;k++){
  var g=ghosts[k],f=(k+1)/N,off=sgn*streak*f*spread*N*.55;
  g.style.transform='translateX(calc(-50% + '+(off+par).toFixed(1)+'px))';
  g.style.filter='blur('+(streak*f*14+f*2).toFixed(1)+'px)';
  g.style.opacity=(mo*(.34-.26*f)*Math.min(1,streak*5)).toFixed(3);
 }
 main.style.transform='translateX(calc(-50% + '+(par*.5).toFixed(1)+'px))';
 main.style.opacity=mo.toFixed(3);
 main.style.filter='blur('+(streak*2.2).toFixed(1)+'px) drop-shadow(0 30px 40px rgba(20,50,100,.35))';
 var sig=document.querySelector('.sig i');if(sig)sig.style.transform='scaleX('+(.55+Math.min(1,streak*1.5)*.45).toFixed(2)+')';
 nm.style.opacity=phase==='hold'?1:.25;
 if(gl){glU.uS.value=Math.min(1.4,streak*1.25);glU.uDir.value=sgn;glU.uMo.value=mo;glU.uT.value=now/1000;glU.uX.value=par*.0009*-1;var sp=Math.min(1,scrollY/innerHeight);if(bw)bw.style.transform='translateY('+(sp*-90).toFixed(1)+'px) scale('+(1+sp*.08).toFixed(3)+')';gl.r.render(gl.s,gl.c)}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---- the stack canvas ---- */
var cv=$('cv'),chosen={},els={},mobile=function(){return innerWidth<760};
P.forEach(function(p,i){
 var d=document.createElement('div');d.className='pc';d.tabIndex=0;d.setAttribute('role','button');d.setAttribute('aria-pressed','false');d.setAttribute('aria-label','Add '+p.n+' to your stack');
 d.innerHTML='<div class="fl" style="--d:'+(-i*1.3)+'s"><img alt="'+p.n+'" src="'+D+p.id+'.webp" draggable="false"></div><span class="pill">'+p.n+'</span>';
 d.style.setProperty('--h',p.h+'px');
 cv.appendChild(d);els[p.id]=d;
 var tg=function(){toggle(p.id)};
 d.addEventListener('click',tg);d.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();tg()}});
});
function place(){var m=mobile();P.forEach(function(p){var e=els[p.id],pos=m?p.m:[p.x,p.y];e.dataset.bx=pos[0];e.dataset.by=pos[1];e.style.left=pos[0]+'%';e.style.top=pos[1]+'%';e.style.setProperty('--h',(m?p.h*.62:p.h)+'px')})}
place();addEventListener('resize',place);
var sec=$('stack'),mx=0,my=0,tx=0,ty=0;
sec.addEventListener('pointermove',function(e){var r=sec.getBoundingClientRect();tx=(e.clientX-r.left)/r.width-.5;ty=(e.clientY-r.top)/r.height-.5},{passive:true});
sec.addEventListener('pointerleave',function(){tx=ty=0});
(function par(){mx+=(tx-mx)*.07;my+=(ty-my)*.07;
 if(!reduce)P.forEach(function(p,i){var z=(i%3+1)*14;els[p.id].style.transform='translate(calc(-50% + '+(mx*-z).toFixed(1)+'px),calc(-50% + '+(my*-z).toFixed(1)+'px))'});
 requestAnimationFrame(par)})();

/* ---- the drawer ---- */
var dr=$('drawer'),dl=$('dl'),cta=$('cta'),figp=$('figp'),bagn=$('bagn');
function count(){return Object.keys(chosen).length}
function toggle(id){if(chosen[id])delete chosen[id];else chosen[id]=1;render()}
function render(){
 var ids=P.filter(function(p){return chosen[p.id]}),n=ids.length,t=0;
 P.forEach(function(p){var e=els[p.id],on=!!chosen[p.id];e.classList.toggle('in',on);e.setAttribute('aria-pressed',on);e.setAttribute('aria-label',(on?'Remove ':'Add ')+p.n+(on?' from':' to')+' your stack')});
 dl.innerHTML=ids.length?'':'<li class="empty" style="border:0">Nothing yet. Tap a piece on the canvas.</li>';
 ids.forEach(function(p){t+=p.pr;var li=document.createElement('li');li.innerHTML='<img alt="" src="'+D+p.id+'.webp"><span>'+p.n+'</span><b style="font-weight:400;font-family:var(--mono);font-size:11px">'+inr(p.pr)+'</b>';var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Remove '+p.n);b.textContent='×';b.onclick=function(){toggle(p.id)};li.appendChild(b);dl.appendChild(li)});
 $('dtot').textContent=inr(t);bagn.textContent=n;
 cta.textContent=n?'Your stack ('+n+')':'Create your stack';figp.textContent=n?'Your stack ('+n+')':'Your stack';
 if(!n)dr.classList.remove('on');
}
function open(){dr.classList.toggle('on')}
cta.onclick=function(){if(count())open();else{var f=P.filter(function(p){return !chosen[p.id]})[0];if(f){els[f.id].animate([{transform:els[f.id].style.transform},{transform:els[f.id].style.transform}],1);}dr.classList.add('on');$('dnote').textContent='Tap pieces on the canvas to add them. Placeholder prices.'}};
figp.onclick=function(){dr.classList.add('on')};
$('bagbtn').onclick=function(){document.getElementById('stack').scrollIntoView({behavior:reduce?'auto':'smooth'});dr.classList.add('on')};
$('dreq').onclick=function(){if(!count()){$('dnote').textContent='Add at least one piece first.';return}$('dnote').textContent='Fitting requests are not wired up yet. Your stack is saved on this page only.'};
document.addEventListener('keydown',function(e){if(e.key==='Escape'){dr.classList.remove('on');menu.classList.remove('on');mb.textContent='Menu'}});
render();
})();

/* build the stack canvas when it scrolls into view */
{ const sec = document.getElementById('stack'); if (sec) {
  [...sec.querySelectorAll('.pc')].forEach((p, i) => p.style.setProperty('--rd', (0.25 + i * 0.1).toFixed(2) + 's'));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { sec.classList.add('go'); io.disconnect(); } }), { threshold: 0.2 }); io.observe(sec); } }
