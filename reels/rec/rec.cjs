// Renders a reel page to an H.264 MP4, frame by frame, on a stepped clock.
// usage: node rec.cjs <url> <out.mp4> [seconds]
const puppeteer = require('puppeteer-core');
const fs = require('fs'), path = require('path');

const [, , PAGE, OUT, SECS] = process.argv;
const FPS = 30, W = 1080, H = 1920, SECONDS = +SECS || 16, DT = 1000 / FPS;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// installed in every frame (reel page and the embedded site) before their own scripts run
const CLOCK = `(() => {
  window.__VT = 0;
  const realRAF = window.requestAnimationFrame.bind(window);
  window.__realRAF = realRAF;
  let q = [], id = 0;
  window.requestAnimationFrame = cb => { q.push([++id, cb]); return id; };
  window.cancelAnimationFrame = i => { q = q.filter(x => x[0] !== i); };
  window.__flush = () => { const cur = q; q = []; for (const [, cb] of cur) { try { cb(window.__VT); } catch (e) { console.error('raf: ' + (e && e.message)); } } };
  performance.now = () => window.__VT;
  const D0 = Date.now(); Date.now = () => D0 + window.__VT;
  window.__anims = new Set();
  window.__stepAnims = dt => {
    for (const a of document.getAnimations()) {
      if (!window.__anims.has(a)) { window.__anims.add(a); a.pause(); continue; }
      if (a.playState === 'finished') continue;
      const t = (a.currentTime || 0) + dt, end = a.effect ? a.effect.getComputedTiming().endTime : Infinity;
      if (isFinite(end) && t >= end) a.finish(); else a.currentTime = t;
    }
  };
})();`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const t0 = Date.now();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-unsafe-swiftshader',
      '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows', '--force-device-scale-factor=1'],
  });
  try {
    // encoder page
    const enc = await browser.newPage();
    await enc.goto(new URL('/rec/enc.html', PAGE).href);
    await enc.addScriptTag({ path: path.join(__dirname, 'node_modules/mp4-muxer/build/mp4-muxer.js') });
    const codec = await enc.evaluate(async ({ W, H, FPS }) => {
      const tries = ['avc1.640028', 'avc1.4d0028', 'avc1.640033', 'avc1.42002a'];
      let pick = null;
      for (const c of tries) { const s = await VideoEncoder.isConfigSupported({ codec: c, width: W, height: H, bitrate: 14e6, framerate: FPS }); if (s.supported) { pick = c; break; } }
      if (!pick) return null;
      const { Muxer, ArrayBufferTarget } = Mp4Muxer;
      const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H, frameRate: FPS }, fastStart: 'in-memory' });
      const encoder = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { window.__err = String(e); } });
      encoder.configure({ codec: pick, width: W, height: H, bitrate: 14e6, framerate: FPS, avc: { format: 'avc' } });
      window.__add = async (b64, i) => {
        const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const bmp = await createImageBitmap(new Blob([bin], { type: 'image/jpeg' }));
        const vf = new VideoFrame(bmp, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
        encoder.encode(vf, { keyFrame: i % (FPS * 2) === 0 }); vf.close(); bmp.close();
        while (encoder.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 5));
        return window.__err || null;
      };
      window.__finish = async () => { await encoder.flush(); muxer.finalize(); window.__out = new Uint8Array(muxer.target.buffer); return window.__out.length; };
      window.__chunk = (s, e) => { const a = window.__out.subarray(s, e); let str = ''; for (let i = 0; i < a.length; i++) str += String.fromCharCode(a[i]); return btoa(str); };
      return pick;
    }, { W, H, FPS });
    if (!codec) throw new Error('No supported H.264 encoder config');
    console.log('codec', codec);

    // reel page
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument(CLOCK);
    page.on('pageerror', e => console.log('[pageerror]', e.message));
    page.on('console', m => { if (m.type() === 'error') console.log('[console]', m.text()); });
    await page.goto(PAGE + (PAGE.includes('?') ? '&' : '?') + 'rec', { waitUntil: 'load' });

    // wait until the reel has built its timeline (pages that generate keyframes set window.__built)
    await page.waitForFunction(() => window.__built === true || !!document.querySelector('iframe.live'), { timeout: 30000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    // hold the reel at t=0 while any embedded live site warms up
    await page.evaluate(() => { for (const a of document.getAnimations()) { window.__anims.add(a); a.pause(); a.currentTime = 0; } });
    const hasSite = await page.evaluate(() => !!document.querySelector('iframe.live'));
    let fr = null;
    if (hasSite) {
      const site = () => page.frames().find(f => f.url().includes('site/index.html'));
      for (let k = 0; k < 100 && !(fr = site()); k++) await sleep(100);
      if (!fr) throw new Error('site frame not found');
      await fr.waitForFunction(() => document.readyState === 'complete', { timeout: 30000 });
      let live = false;
      for (let k = 0; k < 400 && !live; k++) {
        await fr.evaluate(dt => { window.__VT += dt; window.__stepAnims(dt); window.__flush(); }, DT);
        await page.evaluate(() => window.__flush());
        await sleep(15);
        live = await page.evaluate(() => document.querySelector('.display').classList.contains('is-live'));
      }
      console.log('live site ready:', live, 'warm-up virtual ms:', await fr.evaluate(() => Math.round(window.__VT)));
      // let the site settle on its first chapter
      for (let k = 0; k < 45; k++) { await fr.evaluate(dt => { window.__VT += dt; window.__stepAnims(dt); window.__flush(); }, DT); }
    } else {
      console.log('no embedded site; animations:', await page.evaluate(() => document.getAnimations().length));
    }

    await page.bringToFront();
    const N = Math.round(SECONDS * FPS);
    for (let i = 0; i < N; i++) {
      if (i === Math.min(N - 1, 45)) {
        console.log('check @1.5s', JSON.stringify(await page.evaluate(() => {
          return { anims: document.getAnimations().length, vis: document.visibilityState };
        })));
      }
      if (i > 0) {
        await page.evaluate(dt => { window.__stepAnims(dt); window.__flush(); }, DT);
        if (fr) await fr.evaluate(dt => { window.__VT += dt; window.__stepAnims(dt); window.__flush(); }, DT);
        await sleep(0);
      }
      await page.evaluate(() => new Promise(r => window.__realRAF(() => window.__realRAF(r))));
      const shot = await page.screenshot({ type: 'jpeg', quality: 92, optimizeForSpeed: true, encoding: 'base64' });
      if (i === Math.min(N - 1, 45)) fs.writeFileSync(path.join(__dirname, 'probe.jpg'), Buffer.from(shot, 'base64'));
      const err = await enc.evaluate((b, i) => window.__add(b, i), shot, i);
      if (err) throw new Error('encoder: ' + err);
      if (i % 60 === 0) console.log(`frame ${i}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    const len = await enc.evaluate(() => window.__finish());
    const parts = [];
    for (let s = 0; s < len; s += 4 << 20) parts.push(Buffer.from(await enc.evaluate((a, b) => window.__chunk(a, b), s, Math.min(len, s + (4 << 20))), 'base64'));
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, Buffer.concat(parts));
    console.log('wrote', OUT, (len / 1048576).toFixed(1) + ' MB', `in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
