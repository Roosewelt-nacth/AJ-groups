const puppeteer=require('puppeteer-core');
const sizes=process.argv[2].split(',').map(s=>s.split('x').map(Number)); const tag=process.argv[3]||'s';
(async()=>{const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for(const [w,h] of sizes){const p=await b.newPage();const mob=w<760;await p.setViewport({width:w,height:h,deviceScaleFactor:mob?2:1,isMobile:mob,hasTouch:mob});
await p.goto((process.env.SITE||'http://localhost:8000/')+'index.html',{waitUntil:'domcontentloaded'});await new Promise(r=>setTimeout(r,4500));
await p.evaluate(()=>{const e=[...document.querySelectorAll('[data-go="5"]')].find(x=>x.offsetParent!==null)||document.querySelector('[data-go="5"]');
  if(e.closest('#menu')){document.getElementById('menubtn').click();setTimeout(()=>e.click(),700)}else e.click()});
await new Promise(r=>setTimeout(r,45000));
await p.screenshot({path:`${tag}-${w}x${h}.png`});
console.log(w,h,JSON.stringify(await p.evaluate(()=>{const g=document.querySelector('.stop[data-i="1"] .vgrid');const r=g.getBoundingClientRect();const h1=document.querySelector('.stop[data-i="1"] h1');return {grid:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)],vw:innerWidth,vh:innerHeight,h1:getComputedStyle(h1).fontSize,cards:[...g.children].map(c=>{const b=c.getBoundingClientRect();return [Math.round(b.left),Math.round(b.top),Math.round(b.width),Math.round(b.height)]}),cls:document.getElementById('stack')?.className||document.body.className}})));
await p.close();}
await b.close();})();
