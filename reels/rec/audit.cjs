const puppeteer=require('puppeteer-core');
const sizes=process.argv[2].split(',').map(s=>s.split('x').map(Number));
(async()=>{const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for(const [w,h] of sizes){const p=await b.newPage();const mob=w<900&&h>w||w<760;const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('requestfailed',r=>errs.push('FAIL '+r.url()));
await p.setViewport({width:w,height:h,deviceScaleFactor:1,isMobile:mob,hasTouch:mob});
await p.goto((process.env.SITE||'http://localhost:8000/')+'index.html?audit',{waitUntil:'load'});
let t='';for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,1000));t=await p.title();if(t.startsWith('AUDIT'))break;}
console.log(w+'x'+h, t, errs.length?'ERRORS: '+errs.join(' || '):'');await p.close();}
await b.close();})();
