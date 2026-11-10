/* 01 · Splitting monolith
   Hero: one dark obsidian monolith (the group), turning slowly.
   Vision: glowing fractures open across it, one colour per brand.
   Ventures: it splits into six shards that settle into a ring; each shard is a brand. */
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { BRANDS, RM, setup, lerp, range, smooth, rng, glowTexture } from './common.js';

const app = setup({ camZ: 14, introRadius: 1.4, bloom: 1, threshold: .5 });
const { scene } = app;

scene.add(new THREE.DirectionalLight(0xffffff, .55).translateX(-5).translateY(4).translateZ(-2));
const teal = new THREE.PointLight(0x2de2c8, 30, 14); teal.position.set(3.2, 1.5, 3); scene.add(teal);
const violet = new THREE.PointLight(0x9b6bff, 30, 14); violet.position.set(-3.2, -2, 2.5); scene.add(violet);

const group = new THREE.Group(); scene.add(group);

/* build the monolith as six stacked slabs with tilted cut planes; neighbouring slabs share
   their cut, so together they form one solid block */
const W = 1.15, D = .78, H = 4.4, r = rng(7);
const cuts = [];
for (let i = 0; i <= 6; i++) {
  const tilt = i === 0 || i === 6 ? .1 : .3;
  const ring = [];
  /* an irregular octagon cross-section, shared by the two slabs on either side of the cut */
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2 + Math.PI / 8, bulge = k % 2 ? 1.05 + r() * .08 : .96 + r() * .06;
    const taper = 1 - (i / 6) * .14;
    ring.push([Math.cos(a) * W * bulge * taper, Math.sin(a) * D * bulge * taper]);
  }
  cuts.push({ h: -H / 2 + H * i / 6, a: (r() - .5) * tilt, b: (r() - .5) * tilt, ring });
}
const yAt = (c, x, z) => c.h + c.a * x + c.b * z;
const tipPoint = new THREE.Vector3(.12, H / 2 + .35, -.05);

const shards = [];
const order = [0, 3, 1, 4, 2, 5];
for (let i = 0; i < 6; i++) {
  const pts = [];
  for (const c of [cuts[i], cuts[i + 1]]) for (const [x, z] of c.ring) pts.push(new THREE.Vector3(x, yAt(c, x, z), z));
  if (i === 5) pts.push(tipPoint.clone());
  const geo = new ConvexGeometry(pts);
  geo.computeBoundingBox(); const ctr = geo.boundingBox.getCenter(new THREE.Vector3()); geo.translate(-ctr.x, -ctr.y, -ctr.z);
  const brand = BRANDS[order[i]];
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x030304, roughness: .14, metalness: 0, clearcoat: .7, clearcoatRoughness: .06,
    envMapIntensity: .14, emissive: brand.color, emissiveIntensity: 0, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat); mesh.position.copy(ctr); mesh.userData.brand = brand;
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), new THREE.LineBasicMaterial({ color: brand.color, transparent: true, opacity: 0 }));
  mesh.add(edge); group.add(mesh);
  const tilt = new THREE.Euler((r() - .5) * .5, (r() - .5) * 1.2, (r() - .5) * .5);
  shards.push({ mesh, mat, edge, home: ctr, ringQ0: new THREE.Quaternion().setFromEuler(tilt), hv: 0, ph: r() * 6.28 });
}
/* light leaking from the fractures: a thin glowing plane inside each internal cut */
const glowTex = glowTexture();
const cracks = [];
for (let i = 1; i < 6; i++) {
  const c = cuts[i], v = [0, 0, 0];
  for (let k = 0; k <= 8; k++) { const [x, z] = c.ring[k % 8]; v.push(x * 1.06, c.a * x + c.b * z, z * 1.06); }
  const idx = []; for (let k = 1; k <= 8; k++) idx.push(0, k, k + 1 > 8 ? 1 : k + 1);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx);
  const col = new THREE.Color(BRANDS[order[i - 1]].color).lerp(new THREE.Color(BRANDS[order[i]].color), .5);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col.multiplyScalar(1.5), transparent: true, opacity: 0, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false }));
  group.add(m); cracks.push({ m, h: c.h, i });
}
/* soft brand-coloured halo behind each shard once it is a venture */
shards.forEach((s, i) => {
  s.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: s.mesh.userData.brand.color, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false }));
  s.halo.scale.setScalar(3); group.add(s.halo);
});
app.setPickables(shards.map(s => s.mesh), () => app.state.s > .8);

function ringPos(i, out) {
  const a = Math.PI / 2 - i * Math.PI / 3;
  return app.portrait ? out.set(Math.cos(a) * 1.6, Math.sin(a) * 3.1, 0) : out.set(Math.cos(a) * 4.1, Math.sin(a) * 2.45, 0);
}

const Y = new THREE.Vector3(0, 1, 0), qSpin = new THREE.Quaternion(), qRing = new THREE.Quaternion(), qT = new THREE.Quaternion();
const vMono = new THREE.Vector3(), vRing = new THREE.Vector3();
let spin = .6;

app.start((time, dt, st) => {
  const t = st.s;
  const crack = smooth(range(t, .18, .5));     /* vision: fractures glow */
  const k = smooth(range(t, .54, .86));        /* ventures: shards fly into the ring */
  if (!RM) spin += dt * .2 * (1 - k);
  qSpin.setFromAxisAngle(Y, spin);
  shards.forEach((s, i) => {
    vMono.copy(s.home); vMono.y += crack * .2 * (i - 2.5) + Math.sin(time * 1.4 + s.ph) * .025 * crack;
    vMono.applyQuaternion(qSpin);
    ringPos(i, vRing); vRing.y += Math.sin(time * .8 + s.ph) * .07;
    s.mesh.position.lerpVectors(vMono, vRing, k);
    qRing.copy(s.ringQ0).multiply(qT.setFromAxisAngle(Y, RM ? 0 : time * .22 + s.ph));
    s.mesh.quaternion.slerpQuaternions(qSpin, qRing, k);
    s.hv = lerp(s.hv, app.hovered === s.mesh ? 1 : 0, Math.min(1, dt * 8));
    s.mesh.scale.setScalar(lerp(1, .95, k) * (1 + .14 * s.hv));
    const pulse = Math.max(0, Math.sin(time * 2.2 + s.ph));
    s.mat.emissiveIntensity = k * .05 + s.hv * .22;
    s.edge.material.opacity = crack * .25 * (1 - k) + k * (.55 + pulse * .25) + s.hv * .2;
    s.halo.position.copy(s.mesh.position).z -= .9;
    s.halo.material.opacity = k * (.16 + s.hv * .3);
    s.halo.scale.setScalar(2.6 + s.hv * .8);
  });
  cracks.forEach(c => {
    c.m.position.set(0, c.h + crack * .2 * (c.i - 3), 0).applyQuaternion(qSpin);
    c.m.quaternion.copy(qSpin);
    c.m.material.opacity = crack * (1 - k) * (.75 + .25 * Math.sin(time * 2 + c.i));
  });
  teal.intensity = violet.intensity = 30 * (1 - k);
  const intro = st.intro;
  group.scale.setScalar(.4 + .6 * intro); group.visible = intro > 0;
  group.rotation.y = st.px * .45; group.rotation.x = -st.py * .22;
  shards.forEach(s => { s.mat.opacity = intro; s.mat.transparent = intro < 1; });
});
