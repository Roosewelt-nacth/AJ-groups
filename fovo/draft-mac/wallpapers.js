/* House of Fovo wallpapers: the macOS desktop pictures, drawn in code (no image files), sharp at any screen size.
   0 Sonoma: golden hills with rows of vines.      1 Sequoia: misty pine ridges at dusk.     2 Ventura: soft colour waves on white.
   3 Monterey: silk ribbons in magenta and blue.   4 Big Sur: layered hills at sunrise.      5 Pro Display: liquid chrome.
   Each is drawn once, at the size of the screen, and handed to the page as an image. */
(function () {
'use strict';
const rn = s => () => (s = (s * 16807) % 2147483647) / 2147483647, clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const noiseC = (() => { const c = cv(128, 128), g = c.getContext('2d'), im = g.createImageData(128, 128); for (let i = 0; i < im.data.length; i += 4) { const v = 110 + Math.random() * 145; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); return c; })();
const grain = (g, w, h, a) => { g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = a; g.fillStyle = g.createPattern(noiseC, 'repeat'); g.fillRect(0, 0, w, h); g.restore(); };
const hex = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t), rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const glow = (g, x, y, r, c, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgb(c, a)); gr.addColorStop(1, rgb(c, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
const ridge = (w, k, amp, f1, f2, p1, p2) => x => Math.sin(x * f1 + p1) * amp + Math.sin(x * f2 + p2) * amp * .45 + Math.sin(x * .0006 + k * 2.1) * amp * .8;

/* 0. Sonoma: warm light, soft hills, rows of vines that follow the slope */
function sonoma(w, h) {
  const c = cv(w, h), g = c.getContext('2d'), R = rn(5);
  const sk = g.createLinearGradient(0, 0, 0, h * .62); sk.addColorStop(0, '#86a9d6'); sk.addColorStop(.5, '#d9cdbf'); sk.addColorStop(1, '#ffe2b4'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
  glow(g, w * .78, h * .5, w * .5, [255, 236, 190], .85);
  for (let i = 0; i < 18; i++) { const x = R() * w, y = R() * h * .4; g.save(); g.translate(x, y); g.scale(1, .06 + R() * .05); const gr = g.createRadialGradient(0, 0, 0, 0, 0, w * (.07 + R() * .16)); gr.addColorStop(0, 'rgba(255,255,255,.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, w * .25, 0, 6.3); g.fill(); g.restore(); }
  const y0 = h * .5, L = 7;
  for (let k = 0; k < L; k++) {
    const t = k / (L - 1), base = y0 + k * h * .066, a = h * (.02 + .02 * k), Y = ridge(w, k, a, .0014 + R() * .001, .0036 + R() * .002, R() * 6, R() * 6) , far = mix(hex(0xbcb98a), hex(0xd9c38a), .4), near = mix(hex(0x8a9a4a), hex(0x4f6a30), t);
    const top = mix(hex(0xcfc79a), hex(0xa6b86a), t), bot = mix(near, hex(0x39502a), t);
    const gr = g.createLinearGradient(0, base - a, 0, base + h * .14); gr.addColorStop(0, rgb(top)); gr.addColorStop(1, rgb(bot));
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 5) g.lineTo(x, base + Y(x)); g.lineTo(w, h); g.closePath(); g.fill();
    /* light from the right: a warm rim on the top edge of every hill */
    g.strokeStyle = 'rgba(255,238,190,.35)'; g.lineWidth = 1 + k * .6; g.beginPath(); for (let x = 0; x <= w; x += 5) { const y = base + Y(x); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    /* rows of vines, following the hill */
    if (k >= 1) { const sp = h * (.0085 + .0045 * k), rows = 11 + k * 2; g.lineWidth = .7 + k * .55; g.setLineDash([1.5 + k, 2.5 + k * .8]); for (let r = 1; r <= rows; r++) { g.strokeStyle = r % 2 ? `rgba(48,70,28,${.18 + .05 * k})` : `rgba(118,134,64,${.16 + .04 * k})`; g.beginPath(); const tilt = (R() - .5) * .08; for (let x = 0; x <= w; x += 8) { const y = base + Y(x) + r * sp * (1 + .35 * Math.sin(x * .004 + k) ) + x * tilt * .04; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } g.setLineDash([]); }
    if (k < L - 1) { const hz = g.createLinearGradient(0, base - h * .02, 0, base + h * .09); hz.addColorStop(0, 'rgba(255,226,180,0)'); hz.addColorStop(.5, `rgba(255,226,180,${.26 - t * .2})`); hz.addColorStop(1, 'rgba(255,226,180,0)'); g.fillStyle = hz; g.fillRect(0, base - h * .02, w, h * .12); }
  }
  const vg = g.createRadialGradient(w / 2, h / 2, h * .4, w / 2, h / 2, h * .95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,20,10,.28)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  grain(g, w, h, .1); return c;
}

/* 1. Sequoia: pine ridges fading into mist, low sun behind them */
function sequoia(w, h) {
  const c = cv(w, h), g = c.getContext('2d'), R = rn(17);
  const sk = g.createLinearGradient(0, 0, 0, h * .7); sk.addColorStop(0, '#52709f'); sk.addColorStop(.45, '#a89cc4'); sk.addColorStop(.78, '#f3bfa6'); sk.addColorStop(1, '#ffe0b8'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
  glow(g, w * .62, h * .56, w * .45, [255, 224, 180], .9); glow(g, w * .62, h * .56, w * .12, [255, 244, 220], .9);
  for (let i = 0; i < 14; i++) { const x = R() * w, y = R() * h * .45; g.save(); g.translate(x, y); g.scale(1, .05 + R() * .04); const gr = g.createRadialGradient(0, 0, 0, 0, 0, w * .2); gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, w * .2, 0, 6.3); g.fill(); g.restore(); }
  const L = 8, far = hex(0xd7c0cf), near = hex(0x142233);
  for (let k = 0; k < L; k++) {
    const t = k / (L - 1), base = h * (.5 + k * .062), a = h * (.03 + .02 * k), Y = ridge(w, k, a, .0011 + R() * .0012, .004 + R() * .003, R() * 6, R() * 6), col = mix(far, near, Math.pow(t, .8)), colTop = mix(col, hex(0xfff0dc), .22 * (1 - t));
    const tops = [], step = 3 + (L - k) * .3; for (let x = 0; x <= w; x += step) tops.push([x, base + Y(x)]);
    g.fillStyle = rgb(col); g.beginPath(); g.moveTo(0, h); tops.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(w, h); g.closePath(); g.fill();
    const th = 5 + k * 6; g.fillStyle = rgb(col); for (let x = 0; x <= w; x += 4 + (L - k)) { const y = base + Y(x), hh = th * (.4 + R() * .9); g.beginPath(); g.moveTo(x - hh * .22, y + 2); g.lineTo(x, y - hh); g.lineTo(x + hh * .22, y + 2); g.closePath(); g.fill(); }
    const rim = g.createLinearGradient(0, base - a - th, 0, base + h * .06); rim.addColorStop(0, rgb(colTop, .55)); rim.addColorStop(.3, rgb(colTop, 0)); g.fillStyle = rim; g.beginPath(); g.moveTo(0, h); tops.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(w, h); g.closePath(); g.fill();
    if (k < L - 1) { const m = g.createLinearGradient(0, base - a, 0, base + h * .12); m.addColorStop(0, 'rgba(255,226,200,0)'); m.addColorStop(.45, `rgba(255,232,214,${.42 - t * .3})`); m.addColorStop(1, 'rgba(255,226,200,0)'); g.fillStyle = m; g.fillRect(0, base - a, w, h * .2); }
  }
  grain(g, w, h, .12); return c;
}

/* 4. Big Sur: layered hills at sunrise, over a still sea */
function bigsur(w, h) {
  const c = cv(w, h), g = c.getContext('2d'), R = rn(29);
  const sk = g.createLinearGradient(0, 0, 0, h * .72); sk.addColorStop(0, '#2c2a7a'); sk.addColorStop(.35, '#a14ba0'); sk.addColorStop(.7, '#ff8f78'); sk.addColorStop(1, '#ffd89a'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
  glow(g, w * .5, h * .66, w * .5, [255, 214, 160], .95); glow(g, w * .5, h * .66, w * .1, [255, 246, 226], .95);
  const L = 6, cols = [0xe58aa5, 0xc4609c, 0x8b4294, 0x5a3283, 0x372766, 0x1b1a45];
  for (let k = 0; k < L; k++) {
    const t = k / (L - 1), base = h * (.52 + k * .062), a = h * (.045 + .022 * k), Y = x => Math.sin(x * (.0016 + .0006 * k) + k * 2.1) * a + Math.sin(x * (.0042 + .001 * k) + k) * a * .35 + Math.sin(x * .0008 - k) * a * .7, col = hex(cols[k]), top = mix(col, hex(0xffd9b0), .26 * (1 - t));
    const gr = g.createLinearGradient(0, base - a, 0, base + h * .2); gr.addColorStop(0, rgb(top)); gr.addColorStop(.45, rgb(col)); gr.addColorStop(1, rgb(mix(col, hex(0x120f33), .6)));
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 4) g.lineTo(x, base + Y(x)); g.lineTo(w, h); g.closePath(); g.fill();
    g.strokeStyle = rgb(hex(0xffe2c0), .3 * (1 - t) + .06); g.lineWidth = 1.4; g.beginPath(); for (let x = 0; x <= w; x += 4) { const y = base + Y(x); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    const m = g.createLinearGradient(0, base - a * .5, 0, base + h * .1); m.addColorStop(0, 'rgba(255,200,170,0)'); m.addColorStop(.5, `rgba(255,190,170,${.2 - t * .14})`); m.addColorStop(1, 'rgba(255,200,170,0)'); g.fillStyle = m; g.fillRect(0, base - a * .5, w, h * .16);
  }
  const sea = h * .9, sg = g.createLinearGradient(0, sea, 0, h); sg.addColorStop(0, '#2b2160'); sg.addColorStop(1, '#14123a'); g.fillStyle = sg; g.fillRect(0, sea, w, h - sea);
  for (let i = 0; i < 140; i++) { const y = sea + R() * (h - sea), x = R() * w, l = w * (.02 + R() * .12); g.strokeStyle = `rgba(255,${150 + R() * 70 | 0},${130 + R() * 50 | 0},${.04 + R() * .12})`; g.lineWidth = 1 + R() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke(); }
  grain(g, w, h, .12); return c;
}

/* 2, 3 and 5. Ventura, Monterey and the Pro Display chrome: a shader draws warped flow, colour and light */
function glArt(mode, w, h) {
  const c = cv(w, h), gl = c.getContext('webgl', { preserveDrawingBuffer: true, antialias: false }); if (!gl) return null;
  const vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
  const fs = `precision highp float; uniform vec2 uR; uniform float uMode;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 6; i++) { s += a * vn(p); p = p * 2.03 + 11.3; a *= .5; } return s; }
vec3 pal(float t){ return .5 + .5 * cos(6.28318 * (t + vec3(0., .33, .67))); }
float ribbon(vec2 p, float a, float f, float ph, float c, float wd, out float t){ float cy = a * sin(p.x * f + ph) + .42 * a * sin(p.x * f * 2.1 + ph * 1.7) + c + .15 * a * sin(p.x * f * 3.7 + ph * 2.3); float d = p.y - cy; t = d / wd; return smoothstep(1., .82, abs(t)); }
void main(){
  vec2 uv = gl_FragCoord.xy / uR, p = (uv - .5) * vec2(uR.x / uR.y, 1.) * 2.3;
  vec2 q = vec2(fbm(p + vec2(1.7, 9.2)), fbm(p + vec2(8.3, 2.8)));
  vec2 r = vec2(fbm(p + 3. * q + vec2(.5, .1)), fbm(p + 3. * q + vec2(2., 4.)));
  float f = fbm(p + 3.2 * r);
  vec2 e = vec2(.003, 0.); float fx = fbm(p + e + 3.2 * r) - f, fy = fbm(p + e.yx + 3.2 * r) - f; vec3 n = normalize(vec3(-fx * 60., -fy * 60., 1.));
  vec3 col;
  if (uMode < .5) {
    /* Pro Display chrome: many thin, glowing lines that flow like liquid metal; where they bunch together they burn white */
    col = vec3(0.);
    for (int k = 0; k < 34; k++) {
      float fk = float(k), cy = (fk / 34. - .5) * 2.7 + .46 * sin(p.x * .85 + fk * .105) + .3 * sin(p.x * 1.9 + fk * .21 + 1.2) + .13 * sin(p.x * 3.4 - fk * .33 + .4) + .35 * sin(p.x * .4 + 2.);
      float d = abs(p.y - cy), wd = .0065 + .0055 * (.5 + .5 * sin(fk * 1.7 + p.x * 1.4)), li = exp(-d * d / (wd * wd)), halo = exp(-d * d / (wd * wd * 60.));
      vec3 c = mix(vec3(.12, .36, 1.), vec3(.86, .34, .86), smoothstep(0., 1., .5 + .5 * sin(fk * .21 + p.x * .35)));
      c = mix(c, vec3(1., .62, .42), smoothstep(.55, 1., .5 + .5 * sin(fk * .37 - p.x * .5 + 1.3)));
      col += c * li * .78 + c * halo * .05;
    }
    col += vec3(.7, .85, 1.) * pow(clamp(col.r + col.g + col.b, 0., 3.) / 3., 3.) * .6;
    col *= .5 + .65 * smoothstep(1.35, .05, length(uv - vec2(.5, .5)));
  } else if (uMode < 2.5) {
    /* Ventura: big satin ribbons of sky, indigo, violet and coral over a pale ground */
    col = mix(vec3(.97, .97, 1.), vec3(.87, .9, 1.), uv.y);
    for (int k = 0; k < 7; k++) { float fk = float(k), t; float m = ribbon(p, .34 + .12 * sin(fk * 1.3), .85 + .2 * fk, fk * 1.9, -1.05 + fk * .34, .36 + .12 * sin(fk * 2.1), t); vec3 ca, cb;
      if (k == 0) { ca = vec3(.66, .84, 1.); cb = vec3(.32, .5, .97); } else if (k == 1) { ca = vec3(.4, .42, .97); cb = vec3(.16, .18, .72); } else if (k == 2) { ca = vec3(.82, .46, .97); cb = vec3(.46, .26, .92); } else if (k == 3) { ca = vec3(1., .62, .44); cb = vec3(.94, .34, .62); } else if (k == 4) { ca = vec3(.3, .36, .94); cb = vec3(.58, .32, .97); } else if (k == 5) { ca = vec3(.64, .88, 1.); cb = vec3(.92, .54, .93); } else { ca = vec3(.5, .4, .98); cb = vec3(.2, .24, .8); }
      vec3 rc = mix(ca, cb, clamp(t * .5 + .5, 0., 1.)); rc += vec3(1.) * pow(1. - abs(t), 4.) * .32 - pow(abs(t), 3.) * .16; col = mix(col, rc, m * .95); }
    col = mix(col, vec3(1.), pow(max(dot(n, normalize(vec3(-.4, .6, .7))), 0.), 14.) * .12);
  } else {
    /* Monterey: silk ribbons of magenta, violet and blue on a deep ground */
    col = mix(vec3(.04, .01, .16), vec3(.1, .03, .28), uv.y);
    for (int k = 0; k < 7; k++) { float fk = float(k), t; float m = ribbon(p, .3 + .14 * sin(fk * 1.7 + 1.), .75 + .24 * fk, fk * 2.3 + 1., -1.0 + fk * .33, .34 + .13 * sin(fk * 1.9), t); vec3 ca, cb;
      if (k == 0) { ca = vec3(.34, .12, .86); cb = vec3(.12, .08, .5); } else if (k == 1) { ca = vec3(.9, .16, .62); cb = vec3(.48, .06, .5); } else if (k == 2) { ca = vec3(.26, .42, .98); cb = vec3(.14, .16, .76); } else if (k == 3) { ca = vec3(1., .44, .74); cb = vec3(.74, .12, .6); } else if (k == 4) { ca = vec3(.56, .3, 1.); cb = vec3(.24, .12, .8); } else if (k == 5) { ca = vec3(.98, .3, .66); cb = vec3(.36, .18, .9); } else { ca = vec3(.3, .52, 1.); cb = vec3(.6, .22, .96); }
      vec3 rc = mix(ca, cb, clamp(t * .5 + .5, 0., 1.)); rc += vec3(1., .6, .86) * pow(1. - abs(t), 5.) * .42 - pow(abs(t), 3.) * .22; col = mix(col, rc, m * .96); }
    col *= .6 + .5 * smoothstep(1.5, .1, length(uv - .5));
  }
  gl_FragColor = vec4(col, 1.);
}`;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }, pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null; gl.useProgram(pr);
  const bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(gl.getUniformLocation(pr, 'uR'), w, h); gl.uniform1f(gl.getUniformLocation(pr, 'uMode'), mode); gl.viewport(0, 0, w, h); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  const out = cv(w, h), g = out.getContext('2d'); g.drawImage(c, 0, 0); grain(g, w, h, .07); const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); return out;
}

const GEN = [sonoma, sequoia, (w, h) => glArt(2, w, h), (w, h) => glArt(3, w, h), bigsur, (w, h) => glArt(0, w, h)];
window.FovoWP = { count: GEN.length, names: ['Sonoma', 'Sequoia', 'Ventura', 'Monterey', 'Big Sur', 'Pro Display'], canvas: (i, w, h) => GEN[i](w, h) || GEN[0](w, h) };
})();
