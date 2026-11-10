/* 03 · Constellation core
   Hero: a faceted glass core with a light at its heart (the group).
   Vision: six points of light emerge and swing out on tilted orbits, fed by streams of particles.
   Ventures: the orbits settle into a calm ring; each light is a brand you can click. */
import * as THREE from 'three';
import { BRANDS, RM, MOBILE, setup, lerp, range, smooth, rng, glowTexture } from './common.js';

const app = setup({ camZ: 12, introRadius: 1.3, bloom: .6, threshold: .78 });
const { scene } = app;

scene.add(new THREE.DirectionalLight(0xffffff, .8).translateX(-4).translateY(5).translateZ(4));
const group = new THREE.Group(); scene.add(group);
const r = rng(9), glowTex = glowTexture();

/* core */
const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: 1.4,
  roughness: .05, ior: 1.45, iridescence: .8, iridescenceIOR: 1.25, flatShading: true, envMapIntensity: 1.2 }));
const heart = new THREE.Mesh(new THREE.IcosahedronGeometry(.26, 3), new THREE.MeshBasicMaterial({ color: 0xcfefff }));
const heartGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9fdcff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false }));
heartGlow.scale.setScalar(2.4);
const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.45, 1)),
  new THREE.LineBasicMaterial({ color: 0xaabfff, transparent: true, opacity: .16 }));
group.add(core, heart, heartGlow, shell);

/* six brand lights on tilted orbits */
const circle = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 129 }, (_, i) => {
  const a = i / 128 * Math.PI * 2; return new THREE.Vector3(Math.cos(a), 0, Math.sin(a)); }));
const STREAM = MOBILE ? 36 : 80;
const streamPos = new Float32Array(6 * STREAM * 3), streamCol = new Float32Array(6 * STREAM * 3);
const nodes = BRANDS.map((brand, i) => {
  const col = new THREE.Color(brand.color);
  const g = new THREE.Group();
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.17, 0), new THREE.MeshStandardMaterial({ color: brand.color, emissive: brand.color,
    emissiveIntensity: 1.1, roughness: .3, flatShading: true }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: brand.color, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.setScalar(1);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hit.userData.brand = brand;
  g.add(gem, halo, hit); group.add(g);
  const orbit = new THREE.Line(circle, new THREE.LineBasicMaterial({ color: brand.color, transparent: true, opacity: 0 }));
  const tilt = new THREE.Euler((r() - .5) * 1.4, r() * Math.PI, (r() - .5) * 1.4);
  orbit.rotation.copy(tilt); group.add(orbit);
  for (let j = 0; j < STREAM; j++) streamCol.set([col.r, col.g, col.b], (i * STREAM + j) * 3);
  return { g, gem, halo, hit, orbit, tilt, q: new THREE.Quaternion().setFromEuler(tilt), R: 2.3 + r() * .7,
    speed: .28 + r() * .22, ang: i / 6 * Math.PI * 2, hv: 0, ph: r() * 6.28, col };
});
app.setPickables(nodes.map(n => n.hit), () => app.state.s > .8);

/* particle streams flowing from the core out to each light */
const sGeo = new THREE.BufferGeometry();
sGeo.setAttribute('position', new THREE.BufferAttribute(streamPos, 3));
sGeo.setAttribute('color', new THREE.BufferAttribute(streamCol, 3));
const streams = new THREE.Points(sGeo, new THREE.PointsMaterial({ size: .09, map: glowTex, vertexColors: true, transparent: true, opacity: 0,
  blending: THREE.AdditiveBlending, depthWrite: false }));
group.add(streams);

function ringPos(i, out) {
  const a = Math.PI / 2 - i * Math.PI / 3;
  return app.portrait ? out.set(Math.cos(a) * 1.55, Math.sin(a) * 2.9, 0) : out.set(Math.cos(a) * 3.6, Math.sin(a) * 2.15, 0);
}

const vO = new THREE.Vector3(), vR = new THREE.Vector3(), p0 = new THREE.Vector3(), c1 = new THREE.Vector3(), tmp = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
app.start((time, dt, st) => {
  const t = st.s;
  const e = smooth(range(t, .14, .5));    /* vision: lights emerge and orbit outward */
  const k = smooth(range(t, .56, .86));   /* ventures: orbits settle into a ring */
  nodes.forEach((n, i) => {
    if (!RM) n.ang += dt * n.speed * (1 - k);
    const R = lerp(.3, n.R, e);
    vO.set(Math.cos(n.ang) * R, 0, Math.sin(n.ang) * R).applyQuaternion(n.q);
    ringPos(i, vR); vR.y += Math.sin(time * .9 + n.ph) * .06;
    n.g.position.lerpVectors(vO, vR, k);
    n.hv = lerp(n.hv, app.hovered === n.hit ? 1 : 0, Math.min(1, dt * 8));
    n.g.scale.setScalar(Math.max(.001, e) * (1 + .5 * n.hv));
    n.gem.rotation.y = time * .8 + n.ph; n.gem.rotation.x = time * .5;
    n.halo.material.opacity = .22 + .08 * Math.sin(time * 2 + n.ph) + n.hv * .3;
    n.halo.scale.setScalar(1 + k * .4 + n.hv * .6);
    n.orbit.scale.setScalar(R); n.orbit.material.opacity = e * (1 - k) * .3;
    /* stream: quadratic curve from the core surface, bowing sideways, to the light */
    p0.copy(n.g.position).normalize();
    c1.copy(n.g.position).multiplyScalar(.5).add(tmp.crossVectors(p0, Z).normalize().multiplyScalar(.55));
    for (let j = 0; j < STREAM; j++) {
      const u = (j / STREAM + time * .22 * (.6 + n.speed)) % 1, a = 1 - u;
      tmp.set(0, 0, 0).addScaledVector(p0, a * a).addScaledVector(c1, 2 * a * u).addScaledVector(n.g.position, u * u);
      streamPos.set([tmp.x, tmp.y, tmp.z], (i * STREAM + j) * 3);
    }
  });
  sGeo.attributes.position.needsUpdate = true;
  streams.material.opacity = e * (.75 - .35 * k);
  const pulse = 1 + .06 * Math.sin(time * 2);
  const f = (.9 + e * .5) * (1 - .2 * k);
  heart.material.color.setRGB(.8 * f, .94 * f, 1 * f); heart.scale.setScalar(pulse);
  heartGlow.material.opacity = (.14 + .1 * e) * (1 - .3 * k) * pulse;
  core.rotation.y = time * .12; core.rotation.x = time * .05; shell.rotation.y = -time * .06;
  const cs = lerp(1, .72, k); core.scale.setScalar(cs); shell.scale.setScalar(cs);
  const intro = st.intro;
  group.scale.setScalar(.4 + .6 * intro); group.visible = intro > 0;
  group.rotation.y = st.px * .4; group.rotation.x = -st.py * .2;
});
