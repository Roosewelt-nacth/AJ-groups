// Renders a poster page to a 1080x1920 PNG and checks its QR code decodes.
// usage: node poster.cjs <url> <out.png>
const puppeteer = require('puppeteer-core');
const fs = require('fs');
(async () => {
  const [, , URL_, OUT] = process.argv;
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--hide-scrollbars'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.goto(URL_, { waitUntil: 'networkidle0' });
  await p.waitForFunction(() => window.__built === true, { timeout: 15000 });
  await p.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 300));
  await p.screenshot({ path: OUT, type: 'png' });
  // decode the QR from the rendered pixels
  if (!(await p.$('#qr'))) { console.log('rendered (no QR)'); await b.close(); return; }
  const rect = await p.evaluate(() => { const r = document.getElementById('qr').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const pad = 40;
  await p.addScriptTag({ path: require.resolve('jsqr/dist/jsQR.js') });
  const png = fs.readFileSync(OUT).toString('base64');
  const decoded = await p.evaluate(async (png, rect, pad) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
    const c = document.createElement('canvas'); const w = Math.round(rect.w + pad * 2), h = Math.round(rect.h + pad * 2);
    c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, rect.x - pad, rect.y - pad, w, h, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h); const r = jsQR(d.data, w, h); return r ? r.data : null;
  }, png, rect, pad);
  console.log('qr box', JSON.stringify(rect), 'decodes to:', decoded);
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
