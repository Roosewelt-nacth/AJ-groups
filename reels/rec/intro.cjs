// Captures the landing intro on a stepped clock. usage: node intro.cjs <WxH> <tag> [url]
const puppeteer=require('puppeteer-core'), fs=require('fs');
const [,,SZ,TAG,URL_]=process.argv; const [W,H]=SZ.split('x').map(Number); const mob=W<760;
const CLOCK=fs.readFileSync(__dirname+'/rec.cjs','utf8').match(/const CLOCK = `([\s\S]*?)`;/)[1];
const TIMES=[0,.3,.6,.9,1.2,1.5,1.8,2.1,2.5,3,3.5,4.5];
(async()=>{const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars']});
const p=await b.newPage(); await p.setViewport({width:W,height:H,deviceScaleFactor:mob?2:1,isMobile:mob,hasTouch:mob});
await p.evaluateOnNewDocument(CLOCK); p.on('pageerror',e=>console.log('[pageerror]',e.message)); p.on('console',m=>{if(m.type()==='error')console.log('[console]',m.text())});
await p.goto(URL_||(process.env.SITE||'http://localhost:8000/')+'index.html',{waitUntil:'load'}); await p.evaluate(()=>document.fonts&&document.fonts.ready);
await new Promise(r=>setTimeout(r,2000));  // real time: lets fonts/setTimeout fallbacks fire, virtual clock is still 0
const DT=1000/30; let t=0, k=0;
for(const T of TIMES){ while(t<T*1000-1){ await p.evaluate(dt=>{window.__VT+=dt;window.__stepAnims(dt);window.__flush();},DT); t+=DT; }
  await p.evaluate(()=>new Promise(r=>window.__realRAF(()=>window.__realRAF(r))));
  await p.screenshot({path:`${__dirname}/in-${TAG}-${String(k++).padStart(2,'0')}.png`});
  console.log(T, JSON.stringify(await p.evaluate(()=>({ready:document.documentElement.classList.contains('ready'),cw:document.getElementById('c').width,cf:getComputedStyle(document.getElementById('c')).filter,co:getComputedStyle(document.getElementById('c')).opacity,bf:[...document.querySelectorAll('body *')].filter(e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect();return (c.backdropFilter!=='none'||c.filter!=='none')&&r.left<195&&r.right>195&&r.top<420&&r.bottom>420&&c.display!=='none'&&c.visibility!=='hidden'}).map(e=>{const c=getComputedStyle(e);return e.tagName+'#'+e.id+'.'+String(e.className).slice(0,24)+' bf:'+c.backdropFilter+' f:'+c.filter+' op:'+c.opacity+' z:'+c.zIndex})}))));
}
await b.close();})();
