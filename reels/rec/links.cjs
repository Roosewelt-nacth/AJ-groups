const puppeteer=require('puppeteer-core');const BASE=(process.env.SITE||'http://localhost:8000/');
const pages=['index.html','alven/','fovo/','clothing/','privacy/','terms/','404.html','bunbun/'];
(async()=>{const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const seen=new Set();
for(const pg of pages){const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push('JS '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text().slice(0,160))});
p.on('response',r=>{if(r.status()>=400)errs.push(r.status()+' '+r.url())});p.on('requestfailed',r=>{if(!/fonts\.g|jsdelivr|formsubmit|instagram/.test(r.url()))errs.push('FAILED '+r.url())});
await p.setViewport({width:1280,height:800});await p.goto(BASE+pg,{waitUntil:'load'}).catch(e=>errs.push('goto '+e.message));await new Promise(r=>setTimeout(r,4000));
const info=await p.evaluate(()=>({url:location.href,title:document.title,links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')),imgs:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src)}));
console.log('\n== '+pg+' -> '+info.url.replace(BASE,'')+' | '+info.title); if(errs.length)console.log('  errors:',errs.join(' || ')); if(info.imgs.length)console.log('  broken imgs:',info.imgs.join(', '));
for(const h of info.links){ if(/^(https?:|mailto:|tel:|#|javascript:)/.test(h))continue; const u=new URL(h,info.url).href.split('#')[0]; if(seen.has(u))continue; seen.add(u);
  const st=await p.evaluate(async u=>{try{return (await fetch(u,{method:'GET'})).status}catch(e){return 'ERR'}},u); if(st!==200)console.log('  link',h,'->',st);}
await p.close();}
await b.close();})();
