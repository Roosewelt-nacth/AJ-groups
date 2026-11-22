// usage: node pin.cjs tag WxH:s,WxH:s ...   screenshots chapter s at each size (?s= pins the chapter)
const puppeteer=require('puppeteer-core');const tag=process.argv[2];const jobs=process.argv[3].split(',').map(j=>{const [sz,s]=j.split(':');const [w,h]=sz.split('x').map(Number);return {w,h,s}});
(async()=>{const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars']});
for(const {w,h,s} of jobs){const p=await b.newPage();const mob=w<760||(h>w&&w<900);await p.setViewport({width:w,height:h,deviceScaleFactor:mob?2:1,isMobile:mob,hasTouch:mob});
await p.goto((process.env.SITE||'http://localhost:8000/')+(process.env.PAGE||'index.html')+'?s='+s+'&t=3',{waitUntil:'load'});await new Promise(r=>setTimeout(r,9000));
await p.screenshot({path:`${__dirname}/pin-${tag}-${w}x${h}-s${s}.png`});await p.close();}
await b.close();})();
