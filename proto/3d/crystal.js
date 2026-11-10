/* 02 · Living crystal
   Hero: a clear crystal rising from a dark rock (the group).
   Vision: its core lights up and the cluster turns as you scroll.
   Ventures: six new crystals grow out of the rock, one per brand, each glowing in its colour. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BRANDS, RM, setup, lerp, range, smooth, rng, glowTexture } from './common.js';

const LOOK = new THREE.Vector3(0, .35, 0);
const app = setup({ camZ: 11, look: LOOK, introRadius: 1.6, introCenter: new THREE.Vector3(0, .3, 0), bloom: .7, threshold: .72 });
const { scene } = app;

scene.add(new THREE.DirectionalLight(0xffffff, .6).translateX(-4).translateY(6).translateZ(4));
const back = new THREE.DirectionalLight(0x9fc8ff, .8); back.position.set(3, 2, -5); scene.add(back);
const coreLight = new THREE.PointLight(0x9fe8ff, 0, 4); coreLight.position.set(0, .6, 0); scene.add(coreLight);

const cluster = new THREE.Group(); scene.add(cluster);
const r = rng(5);

/* a hexagonal crystal: tapered prism with a pointed tip, base at y = 0 so it can grow upward */
function crystalGeo(rad, h) {
  const body = new THREE.CylinderGeometry(rad * .86, rad, h, 6, 1); body.translate(0, h / 2, 0);
  const tip = new THREE.ConeGeometry(rad * .86, rad * 1.7, 6, 1); tip.translate(0, h + rad * .85, 0);
  const g = mergeGeometries([body.toNonIndexed(), tip.toNonIndexed()]); g.computeVertexNormals(); return g;
}

/* dark rock: a squashed, lumpy icosphere (noise from position, so faces stay closed) */
const rockGeo = new THREE.IcosahedronGeometry(1.5, 3), P = rockGeo.attributes.position, v = new THREE.Vector3();
for (let i = 0; i < P.count; i++) {
  v.fromBufferAttribute(P, i).normalize();
  const n = 1 + .16 * Math.sin(v.x * 3.1 + 1) * Math.sin(v.y * 2.7 + 2) * Math.sin(v.z * 3.3) + .07 * Math.sin(v.x * 9 + v.z * 7);
  v.multiplyScalar(1.5 * n); P.setXYZ(i, v.x * 1.25, v.y * .55, v.z * 1.05);
}
rockGeo.computeVertexNormals();
const rock = new THREE.Mesh(rockGeo, new THREE.MeshStandardMaterial({ color: 0x050506, roughness: .8, metalness: .2,
  flatShading: true, envMapIntensity: .25 }));
rock.position.y = -1.25; cluster.add(rock);

/* the main crystal: clear glass with an inner light that wakes up in the vision stage */
const main = new THREE.Mesh(crystalGeo(.42, 2.4), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: 1.2,
  roughness: .06, ior: 1.6, iridescence: .7, iridescenceIOR: 1.3, flatShading: true, envMapIntensity: 1.3,
  attenuationColor: new THREE.Color(0xbfeaff), attenuationDistance: 3 }));
main.position.set(0, -.75, 0); main.rotation.z = .06; cluster.add(main);
const core = new THREE.Mesh(crystalGeo(.13, 2.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
core.position.set(0, .05, 0); main.add(core);

/* six brand crystals rooted around the rock, leaning outward */
const glowTex = glowTexture(), Y = new THREE.Vector3(0, 1, 0);
const sprouts = BRANDS.map((brand, i) => {
  const a = i / 6 * Math.PI * 2 + .3, lean = .5 + r() * .25, h = 1 + r() * .55, rad = .17 + r() * .07;
  const pivot = new THREE.Group();
  pivot.position.set(Math.cos(a) * .85, -.85 + r() * .1, Math.sin(a) * .7);
  pivot.quaternion.setFromUnitVectors(Y, new THREE.Vector3(Math.cos(a) * Math.sin(lean), Math.cos(lean), Math.sin(a) * Math.sin(lean)).normalize());
  const mat = new THREE.MeshPhysicalMaterial({ color: brand.color, emissive: brand.color, emissiveIntensity: 0, transmission: .55, thickness: .6,
    roughness: .12, ior: 1.5, flatShading: true, envMapIntensity: 1 });
  const mesh = new THREE.Mesh(crystalGeo(rad, h), mat); mesh.userData.brand = brand; pivot.add(mesh);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: brand.color, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.position.y = h * .6; halo.scale.setScalar(1.4); pivot.add(halo);
  cluster.add(pivot);
  return { pivot, mesh, mat, halo, hv: 0, ph: r() * 6.28 };
});
app.setPickables(sprouts.map(s => s.mesh), () => app.state.s > .72);

let spin = 0;
app.start((time, dt, st) => {
  const t = st.s;
  const wake = smooth(range(t, .16, .45));     /* vision: the core lights up */
  const k = smooth(range(t, .7, .9));          /* ventures: crystals at full glow, clickable */
  if (!RM) spin += dt * .12 * (1 - .7 * k);
  cluster.rotation.y = spin + t * Math.PI * .9 + st.px * .5;
  cluster.rotation.x = -st.py * .15;
  const pulse = .85 + .15 * Math.sin(time * 1.8);
  const f = (.2 + wake * 1.25) * pulse;
  core.material.color.setRGB(.75 * f, .93 * f, 1 * f);
  coreLight.intensity = wake * 3 * pulse;
  sprouts.forEach((s, i) => {
    const g = smooth(range(t, .3 + i * .055, .52 + i * .055));   /* each crystal grows in turn */
    s.mesh.scale.set(.35 + .65 * g, Math.max(.001, g), .35 + .65 * g);
    s.mesh.visible = g > .002;
    s.hv = lerp(s.hv, app.hovered === s.mesh ? 1 : 0, Math.min(1, dt * 8));
    const sh = 1 + .12 * s.hv; s.pivot.scale.setScalar(sh);
    s.mat.emissiveIntensity = g * (.1 + k * .16 + .04 * Math.sin(time * 2 + s.ph)) + s.hv * .45;
    s.halo.material.opacity = g * (.07 + k * .1 + s.hv * .25);
  });
  const intro = st.intro;
  cluster.scale.setScalar(.4 + .6 * intro); cluster.visible = intro > 0;
});
