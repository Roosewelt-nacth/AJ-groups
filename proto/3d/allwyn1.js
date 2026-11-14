/* AJ GROUPS · Allwyn (character prototype 1)
   A stylised 3D Allwyn built from the client's character sheet, on Quaternius's animated mannequin (CC0):
   curly dark hair, a groomed beard, sunglasses, an olive overshirt over a cream tee, khaki cargo trousers,
   white sneakers, a watch, earbuds and a navy backpack with tan straps. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const V3 = THREE.Vector3, PI = Math.PI;
const q = new URLSearchParams(location.search), VIEW = q.get('v') || 'front', FREEZE = q.get('t');
let sd = 11; const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
{ const cv = document.createElement('canvas'); cv.width = cv.height = 512; const x = cv.getContext('2d'), g = x.createRadialGradient(256, 200, 0, 256, 256, 420);
  g.addColorStop(0, '#34312d'); g.addColorStop(.6, '#171614'); g.addColorStop(1, '#0a0a0a'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; }
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .55;
const camera = new THREE.PerspectiveCamera(28, 1, .1, 50);
const key = new THREE.DirectionalLight(0xfff0dc, 2.4); key.position.set(-2.5, 3.5, 3.5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2.5, bottom: -1, near: 1, far: 12 }); key.shadow.bias = -.0004; scene.add(key);
const rim = new THREE.DirectionalLight(0x9fc0ff, 1.6); rim.position.set(3, 2, -3); scene.add(rim);
scene.add(new THREE.HemisphereLight(0xb8b0a4, 0x1a1816, .55));
const floor = new THREE.Mesh(new THREE.CircleGeometry(1.4, 64).rotateX(-PI / 2), new THREE.MeshStandardMaterial({ color: 0x151412, roughness: .6, metalness: .2 })); floor.receiveShadow = true; scene.add(floor);

const controls = new OrbitControls(camera, canvas); Object.assign(controls, { enableDamping: true, enablePan: false, minDistance: 1.4, maxDistance: 7, target: new V3(0, .95, 0) });
function setView(v) {
  const d = 4.6, h = 1.05;
  if (v === 'front') camera.position.set(0, h, d); if (v === 'side') camera.position.set(d, h, 0); if (v === 'back') camera.position.set(0, h, -d);
  if (v === 'face') camera.position.set(.9, 1.7, 1.9);
  controls.target.set(0, v === 'face' ? 1.6 : .95, 0); controls.autoRotate = v === 'orbit'; controls.autoRotateSpeed = 2.2; controls.update();
  document.querySelectorAll('#bar button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v));
}
document.getElementById('bar').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setView(b.dataset.v); });

const C = { skin: 0xc08a62, hair: 0x1b1411, olive: 0x4a4630, tee: 0xe6dccb, khaki: 0xc4a67a, shoe: 0xf0eee8, navy: 0x1f2547, tan: 0xb98a52 };
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .8, metalness: 0, ...o });

new GLTFLoader().load('../../assets/models/people/UAL1_Standard.glb', gl => {
  const root = gl.scene; scene.add(root);
  let src = null; root.traverse(o => { if (o.isSkinnedMesh && !src) src = o; });
  const geo = src.geometry, bones = src.skeleton.bones, names = bones.map(b => b.name.toLowerCase());
  const sI = geo.attributes.skinIndex.array, sW = geo.attributes.skinWeight.array, P3 = geo.attributes.position;
  const dom = i => { let b = 0, bw = -1; for (let k = 0; k < 4; k++) if (sW[i * 4 + k] > bw) { bw = sW[i * 4 + k]; b = sI[i * 4 + k]; } return names[b] || ''; };
  /* body-part regions: 0 skin, 1 overshirt, 2 trousers, 3 shoes, 4 cream tee */
  let tw = 0, ymin = 1e9, ymax = -1e9;
  for (let i = 0; i < P3.count; i++) { ymin = Math.min(ymin, P3.getY(i)); ymax = Math.max(ymax, P3.getY(i)); if (/spine|clavicle/.test(dom(i))) tw = Math.max(tw, Math.abs(P3.getX(i))); }
  let fwd = 1; { let fz = 0, fn = 0, bz = 0, bn = 0; for (let i = 0; i < P3.count; i++) { const n = dom(i); if (/ball|toe/.test(n)) { fz += P3.getZ(i); fn++; } else if (/foot/.test(n)) { bz += P3.getZ(i); bn++; } } if (fn && bn) fwd = fz / fn > bz / bn ? 1 : -1; }
  const height = ymax - ymin, MATS = [mat(C.skin, { roughness: .7 }), mat(C.olive, { roughness: .9 }), mat(C.khaki, { roughness: .9 }), mat(C.shoe, { roughness: .5 }), mat(C.tee, { roughness: .9 })];
  function dressMesh(m) {
    const g2 = m.geometry, nm = m.skeleton.bones.map(b => b.name.toLowerCase()), sI2 = g2.attributes.skinIndex.array, sW2 = g2.attributes.skinWeight.array, PP = g2.attributes.position;
    const dm = i => { let b = 0, bw = -1; for (let k = 0; k < 4; k++) if (sW2[i * 4 + k] > bw) { bw = sW2[i * 4 + k]; b = sI2[i * 4 + k]; } return nm[b] || ''; };
    const rg = new Uint8Array(PP.count);
    for (let i = 0; i < PP.count; i++) { const n = dm(i); rg[i] = /head|neck/.test(n) ? 0 : /hand|thumb|index|middle|ring|pinky|lowerarm/.test(n) ? 0 : /foot|ball|toe/.test(n) ? 3 : /thigh|calf|knee|pelvis/.test(n) ? 2 : 1; }
    const ix2 = g2.index ? Array.from(g2.index.array) : Array.from({ length: PP.count }, (_, i) => i), bk = [[], [], [], [], []];
    for (let t = 0; t < ix2.length; t += 3) {
      const a = ix2[t], b = ix2[t + 1], c = ix2[t + 2]; const ra = rg[a], rb = rg[b], rc = rg[c]; let r = ra === rb || ra === rc ? ra : rb === rc ? rb : ra;
      if (r === 1) { const cx = (PP.getX(a) + PP.getX(b) + PP.getX(c)) / 3, cy = (PP.getY(a) + PP.getY(b) + PP.getY(c)) / 3, cz = (PP.getZ(a) + PP.getZ(b) + PP.getZ(c)) / 3;
        if (Math.abs(cx) < tw * .34 && cz * fwd > 0 && cy > ymin + height * .55 && cy < ymin + height * .79 && /spine/.test(dm(a))) r = 4; }
      bk[r].push(a, b, c);
    }
    g2.setIndex(bk.flat()); g2.clearGroups(); let st = 0; bk.forEach((b, r) => { g2.addGroup(st, b.length, r); st += b.length; });
    m.material = MATS; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
  }
  root.traverse(o => { if (o.isSkinnedMesh) dressMesh(o); });
  /* head metrics (bind space) */
  let hMin = 1e9, hMax = -1e9, hx0 = 1e9, hx1 = -1e9, hz0 = 1e9, hz1 = -1e9;
  for (let i = 0; i < P3.count; i++) if (/head/.test(dom(i))) { hMin = Math.min(hMin, P3.getY(i)); hMax = Math.max(hMax, P3.getY(i)); hx0 = Math.min(hx0, P3.getX(i)); hx1 = Math.max(hx1, P3.getX(i)); hz0 = Math.min(hz0, P3.getZ(i)); hz1 = Math.max(hz1, P3.getZ(i)); }
  const hi = names.findIndex(n => n === 'head'), headBone = bones[hi], inv = src.skeleton.boneInverses[hi];
  const hw = hx1 - hx0, hcx = (hx0 + hx1) / 2, hcz = (hz0 + hz1) / 2, hcy = (hMin + hMax) / 2, hh = hMax - hMin, hd = hz1 - hz0, eyeY = hMin + hh * .56;
  const front = fwd > 0 ? hz1 : hz0, tl = (x, y, z) => new V3(x, y, z).applyMatrix4(inv);
  const dir = (a, b, c) => new V3(a, b, c).normalize();

  /* hair: dense small curls, full on top, faded at the sides and back */
  const curl = new THREE.SphereGeometry(1, 8, 6), hairM = new THREE.MeshStandardMaterial({ color: C.hair, roughness: .55, metalness: 0 });
  const curls = []; const HN = 360;
  for (let i = 0; i < HN; i++) {
    const u = rnd() * 2 - 1, a = rnd() * PI * 2, s = Math.sqrt(1 - u * u), d3 = new V3(Math.cos(a) * s, u, Math.sin(a) * s);
    if (d3.y < -.05) continue;
    const frontal = d3.z * fwd > .45, level = d3.y;
    if (frontal && level < .5) continue;                                       /* clear forehead and face */
    if (level < .12 && rnd() < .8) continue;                                   /* fade at the sides */
    const rad = hw * .5 * (1.12 + .13 * rnd()), cx = hcx + d3.x * rad * 1.05, cy = hcy + d3.y * (hh * .5) * 1.16 + hh * .04, cz = hcz + d3.z * rad * 1.08;
    curls.push([cx, cy, cz, hw * (.07 + .04 * rnd())]);
  }
  const hairI = new THREE.InstancedMesh(curl, hairM, curls.length), m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), sc = new V3();
  curls.forEach(([x, y, z, r], i) => { const p = tl(x, y, z); m4.compose(p, qq, sc.set(r, r * (.9 + .2 * rnd()), r)); hairI.setMatrixAt(i, m4); hairI.setColorAt(i, new THREE.Color(C.hair).multiplyScalar(.75 + rnd() * .6)); });
  hairI.castShadow = true; headBone.add(hairI);
  /* beard: a groomed beard along jaw and chin, plus a moustache */
  const beardPts = [];
  for (let i = 0; i < 520; i++) {
    const a = (rnd() - .5) * PI * 1.3, y = rnd();
    const yy = hMin + hh * (.04 + y * .34), ang = fwd > 0 ? a : PI + a;
    const prof = 1 - (y * .35), rx = hw * .5 * prof * 1.03, rz = hd * .5 * prof * 1.04;
    beardPts.push([hcx + Math.sin(ang) * rx, yy, hcz + Math.cos(ang) * rz, hw * (.022 + .015 * rnd())]);
  }
  for (let i = 0; i < 60; i++) { const a = (rnd() - .5) * 1.0; beardPts.push([hcx + Math.sin(a) * hw * .2, hMin + hh * (.39 + rnd() * .03), front - fwd * hd * .02, hw * .022]); }   /* moustache */
  const beardI = new THREE.InstancedMesh(curl, hairM, beardPts.length);
  beardPts.forEach(([x, y, z, r], i) => { const p = tl(x, y, z); m4.compose(p, qq, sc.set(r, r * .9, r)); beardI.setMatrixAt(i, m4); beardI.setColorAt(i, new THREE.Color(C.hair).multiplyScalar(.8 + rnd() * .5)); });
  headBone.add(beardI);
  /* sunglasses */
  const rr = (w, h, r) => { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s; };
  const lensG = new THREE.ExtrudeGeometry(rr(hw * .36, hw * .25, hw * .06), { depth: hw * .05, bevelEnabled: true, bevelThickness: hw * .01, bevelSize: hw * .01, bevelSegments: 2 });
  const lensM = new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: .08, metalness: .3, clearcoat: 1, envMapIntensity: 1.6 }), frameM = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: .35 });
  const gl2 = new THREE.Group(), fz = front + fwd * hw * .02;
  [-1, 1].forEach(k => { const l = new THREE.Mesh(lensG, lensM); l.position.set(hcx + k * hw * .2, eyeY, fz - hw * .02); l.rotation.y = fwd > 0 ? 0 : PI; gl2.add(l); });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(hw * .1, hw * .03, hw * .03), frameM); bridge.position.set(hcx, eyeY + hw * .03, fz); gl2.add(bridge);
  const top = new THREE.Mesh(new THREE.BoxGeometry(hw * .78, hw * .035, hw * .045), frameM); top.position.set(hcx, eyeY + hw * .1, fz - hw * .005); gl2.add(top);
  [-1, 1].forEach(k => { const arm = new THREE.Mesh(new THREE.BoxGeometry(hw * .03, hw * .03, hd * .62), frameM); arm.position.set(hcx + k * hw * .485, eyeY + hw * .08, fz - fwd * hd * .3); gl2.add(arm); });
  gl2.children.forEach(c => { c.position.copy(tl(c.position.x, c.position.y, c.position.z)); }); gl2.position.set(0, 0, 0); headBone.add(gl2);
  /* earbuds */
  [-1, 1].forEach(k => { const e = new THREE.Mesh(new THREE.SphereGeometry(hw * .035, 8, 6), mat(0xf4f4f2, { roughness: .3 })); e.position.copy(tl(hcx + k * hw * .5, eyeY - hw * .08, hcz)); headBone.add(e); });
  /* hands: watch and ring */
  const findB = re => bones.find(b => re.test(b.name.toLowerCase()));
  const wb = findB(/^lowerarm_l$/); if (wb) { const w = new THREE.Group(); const strap = new THREE.Mesh(new THREE.CylinderGeometry(.043, .043, .026, 18), mat(0x151515, { roughness: .6 })), face = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .012, 20), mat(0xdedede, { roughness: .2, metalness: .85 })); strap.rotation.z = PI / 2; face.position.set(0, .043, 0); w.add(strap, face); w.position.set(0, .06, 0); w.userData.fix = true; wb.add(w); }

  /* backpack and straps, fixed to the body at the upper back */
  const pack = new THREE.Group(); const bag = new THREE.Mesh(new THREE.BoxGeometry(.25, .33, .12, 1, 1, 1), mat(C.navy, { roughness: .7 })); bag.castShadow = true;
  const flap = new THREE.Mesh(new THREE.BoxGeometry(.24, .14, .025), mat(0x252c52, { roughness: .7 })); flap.position.set(0, .09, .07);
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(.18, .12, .04), mat(0x1a2040, { roughness: .75 })); pocket.position.set(0, -.08, .075);
  const buckleG = new THREE.BoxGeometry(.03, .1, .012); [-.07, .07].forEach(x => { const b = new THREE.Mesh(buckleG, mat(C.tan, { roughness: .6 })); b.position.set(x, .1, .115); pack.add(b); });
  pack.add(bag, flap, pocket);
  const spine = findB(/^spine_03$/) || findB(/spine/);
  pack.position.set(0, .06, -.15 * fwd); pack.rotation.y = fwd > 0 ? 0 : PI; spine.add(pack);
  const strapM = mat(C.tan, { roughness: .6 }); [-1, 1].forEach(k => { const s = new THREE.Mesh(new THREE.BoxGeometry(.045, .38, .02), strapM); s.position.set(k * .1, .02, .075 * fwd); s.rotation.y = 0; spine.add(s); });
  /* scale the whole character to a believable height and stand him on the floor */
  const k = 1.82 / height; root.scale.setScalar(k);
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  const mx = new THREE.AnimationMixer(root), clip = gl.animations.find(a => a.name === 'Walk_Loop') || gl.animations[0], act = mx.clipAction(clip); act.play();
  if (FREEZE != null) { act.paused = true; act.time = parseFloat(FREEZE) * clip.duration; mx.update(0); } else act.time = 0;
  setView(VIEW === 'face' ? 'face' : VIEW);
  const clock = new THREE.Clock(); let t0 = 0;
  function frame() { const dt = Math.min(clock.getDelta(), .05); if (FREEZE == null) { mx.update(dt); } root.updateMatrixWorld(true);
    /* keep him walking on the spot: cancel the clip's travel */
    const rb = bones[0]; controls.update(); renderer.render(scene, camera); requestAnimationFrame(frame); }
  function size() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize', size); size(); requestAnimationFrame(frame);
  window.__allwyn = { root, bones, setView, src, hairI };
}, undefined, e => console.warn('character failed', e));
