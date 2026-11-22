// Seeks a pure-CSS reel to given times and writes a contact sheet of 1080x1920 frames (shown at quarter size).
// usage: node stills.cjs <url> <out.jpg> t1,t2,...  [--full=<t>  also writes full-size frame at t]
const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path');
(async () => {
  const [, , URL_, OUT, TS, FULL] = process.argv;
  const times = TS.split(',').map(Number), full = FULL ? +FULL.split('=')[1] : null;
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--hide-scrollbars'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1080, height: 1920 });
  p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 }); await new Promise(r => setTimeout(r, 3500));
  await p.waitForFunction(() => window.__built === true || !('__built' in window), { timeout: 15000 }).catch(() => {});
  await p.evaluate(() => document.fonts && document.fonts.ready);
  const shots = [];
  for (const t of [...times, ...(full != null ? [full] : [])]) {
    await p.evaluate(s => { document.getAnimations().forEach(a => { a.pause(); a.currentTime = s * 1000; }); }, t);
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    shots.push([t, await p.screenshot({ type: 'jpeg', quality: 85, encoding: 'base64' })]);
  }
  if (full != null) fs.writeFileSync(OUT.replace(/\.jpg$/, '-full.jpg'), Buffer.from(shots.pop()[1], 'base64'));
  const s = await b.newPage();
  await s.setViewport({ width: Math.min(1900, shots.length * 276 + 12), height: 540 });
  await s.setContent('<body style="margin:0;background:#111;color:#bbb;font:14px system-ui"><div id="g" style="display:flex;gap:6px;padding:6px">' +
    shots.map(([t, d]) => `<div><img src="data:image/jpeg;base64,${d}" style="width:270px;height:480px;display:block"><div>${t}s</div></div>`).join('') + '</div></body>');
  await (await s.$('#g')).screenshot({ path: OUT, type: 'jpeg', quality: 85 });
  await b.close();
  console.log('ok', shots.length);
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
