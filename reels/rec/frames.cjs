// Decodes an MP4 in real Chrome and writes a contact sheet of frames.
// usage: node frames.cjs <video-url> <out.jpg> t1,t2,...
const puppeteer = require('puppeteer-core');
(async () => {
  const [, , SRC, OUT, TS] = process.argv;
  const times = TS.split(',').map(Number);
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 1000 });
  await p.goto(new URL('/sheet.html', SRC).href);
  const info = await p.evaluate(async (src, times) => {
    document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#111;color:#bbb;font:14px system-ui';
    const blobUrl = URL.createObjectURL(await (await fetch(src)).blob());
    const v = document.createElement('video'); v.src = blobUrl; v.muted = true; v.preload = 'auto';
    v.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01'; document.body.appendChild(v);
    await new Promise((r, j) => { v.onloadeddata = r; v.onerror = () => j(new Error('decode error ' + (v.error && v.error.code))); setTimeout(() => j(new Error('no loadeddata, readyState ' + v.readyState + ', canPlay h264: ' + v.canPlayType('video/mp4; codecs="avc1.640028"'))), 20000); });
    const wrap = document.createElement('div'); wrap.id = 'sheet'; wrap.style.cssText = 'display:flex;gap:6px;padding:6px'; document.body.appendChild(wrap);
    for (const t of times) {
      v.currentTime = t; await new Promise(r => { v.addEventListener('seeked', r, { once: true }); setTimeout(r, 5000); });
      await new Promise(r => setTimeout(r, 250));
      const c = document.createElement('canvas'); c.width = 270; c.height = 480; c.getContext('2d').drawImage(v, 0, 0, 270, 480);
      const f = document.createElement('div'); f.appendChild(c); const s = document.createElement('div'); s.textContent = t + 's'; f.appendChild(s); wrap.appendChild(f);
    }
    return { w: v.videoWidth, h: v.videoHeight, d: v.duration };
  }, SRC, times);
  const el = await p.$('#sheet');
  await el.screenshot({ path: OUT, type: 'jpeg', quality: 85 });
  console.log(JSON.stringify(info));
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
