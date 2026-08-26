import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { assetLib } from '../../core/assets.js';
import {
  CITY_Y, PIER_X, SHORE_Z, seabedHeight, meshHeight,
} from './constants.js';
import { setAoUVs } from './textures.js';
import { hash01 } from './rng.js';
import { cBox, cCyl, cSph, cTorus } from './geo.js';

const WATER_Z0 = -520;
const WATER_Z1 = SHORE_Z + 8;       // -22 — overlaps the beach mesh, no rng2
const REEF_X = PIER_X + 36;         // east of the pier piles
const REEF_Z = -118;
const FISH_N = 14;
const SPLASH_N = 48;

function coralHead(hex, x, y, z, sc) {
  const G = [];
  G.push(cCyl(0.18 * sc, 0.28 * sc, 0.22 * sc, 7, 0xc4b89a, x, y + 0.08 * sc, z));
  G.push(cSph(0.42 * sc, 8, 6, hex, x, y + 0.45 * sc, z, 0.85));
  for (let k = 0; k < 5; k++) {
    const a = k * 1.256 + hash01((x * 10) | 0, k) * 0.4;
    const r = 0.22 * sc;
    G.push(cCyl(0.045 * sc, 0.07 * sc, 0.38 * sc, 6, hex,
      x + Math.cos(a) * r, y + 0.62 * sc, z + Math.sin(a) * r, 0.35, a, 0));
  }
  return G;
}

function fishGeo() {
  const body = 0xe8c45a, fin = 0xd45a3a, eye = 0x1a1d22;
  const G = [
    cSph(0.16, 8, 6, body, 0, 0, 0, 0.55),
    cBox(0.04, 0.14, 0.1, fin, 0, 0.12, -0.02),
    cBox(0.02, 0.1, 0.12, fin, 0, 0, -0.16),
    cSph(0.025, 6, 5, eye, 0.07, 0.03, 0.1),
    cSph(0.025, 6, 5, eye, -0.07, 0.03, 0.1),
  ];
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

/**
 * Seabed plate, a small coral pocket east of the pier, a circling fish
 * school, and a splash burst when the craft crosses the waterline.
 * Hash-driven — no rng/rng2/rng3/rng4 draws.
 */
export async function buildUnderwater(ctx) {
  const { root, track, addCyl, setTag } = ctx;
  setTag('reef');

  // ---- far seabed (beach mesh already covers z > -130) ----
  {
    const Z0 = WATER_Z0, Z1 = WATER_Z1;
    const depth = Z1 - Z0;
    const geo = track(new THREE.PlaneGeometry(1800, depth, 90, 36));
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, (Z0 + Z1) / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, seabedHeight(x, z));
    }
    geo.computeVertexNormals();
    setAoUVs(geo);
    let mat;
    if (ctx.sandSet && ctx.sandSet.map) {
      mat = await assetLib.pbrMaterial('sand_beach', {
        repeat: [1800 / 30, depth / 30], color: 0xb8a070,
      });
    } else {
      mat = track(new THREE.MeshStandardMaterial({
        color: 0xc4a56a, roughness: 0.96, metalness: 0,
      }));
    }
    const bed = new THREE.Mesh(geo, mat);
    bed.receiveShadow = true;
    bed.name = 'biscayne-seabed';
    root.add(bed);
  }

  // ---- coral heads ----
  const coralCols = [0xd4786a, 0xe8a05a, 0xc45a8a, 0x7ab0a0, 0xd4c4a0];
  const coralParts = [];
  for (let i = 0; i < 18; i++) {
    if (hash01(i, 17) < 0.18) continue;
    const x = REEF_X + (hash01(i, 3) - 0.5) * 22;
    const z = REEF_Z + (hash01(i, 5) - 0.5) * 18;
    if (Math.abs(x - PIER_X) < 10) continue;
    const y = meshHeight(x, z);
    const sc = 0.7 + hash01(i, 11) * 1.1;
    const hex = coralCols[(hash01(i, 13) * coralCols.length) | 0];
    coralParts.push(...coralHead(hex, x, y, z, sc));
    addCyl(x, y, z, 0.35 * sc, 0.7 * sc);
  }
  // a few brain-coral rings
  for (let i = 0; i < 6; i++) {
    const x = REEF_X + (hash01(i, 41) - 0.5) * 16;
    const z = REEF_Z + (hash01(i, 43) - 0.5) * 12;
    const y = meshHeight(x, z) + 0.12;
    const r = 0.35 + hash01(i, 47) * 0.28;
    coralParts.push(cTorus(r, 0.09, 6, 12, 0xd48a78, x, y, z, Math.PI / 2));
  }
  if (coralParts.length) {
    const cg = track(mergeGeometries(coralParts));
    coralParts.forEach((g) => g.dispose());
    const cm = track(new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.78, metalness: 0.04,
    }));
    const coral = new THREE.Mesh(cg, cm);
    coral.castShadow = true;
    coral.name = 'biscayne-reef';
    root.add(coral);
  }

  // ---- fish school ----
  const fGeo = track(fishGeo());
  const fMat = track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.45, metalness: 0.08,
  }));
  const fish = new THREE.InstancedMesh(fGeo, fMat, FISH_N);
  fish.name = 'biscayne-fish';
  fish.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  root.add(fish);
  const fishState = [];
  for (let i = 0; i < FISH_N; i++) {
    fishState.push({
      a: hash01(i, 61) * Math.PI * 2,
      r: 3.4 + hash01(i, 67) * 5.2,
      y: meshHeight(REEF_X, REEF_Z) + 0.9 + hash01(i, 71) * 2.4,
      w: 0.55 + hash01(i, 73) * 0.7,
      tilt: (hash01(i, 79) - 0.5) * 0.4,
    });
  }

  // ---- splash droplets ----
  const dropGeo = track(new THREE.SphereGeometry(0.07, 6, 5));
  dropGeo.scale(1, 0.45, 1);
  const dropMat = track(new THREE.MeshBasicMaterial({
    color: 0xeef6f4, transparent: true, opacity: 0.85, depthWrite: false,
  }));
  const splash = new THREE.InstancedMesh(dropGeo, dropMat, SPLASH_N);
  splash.name = 'water-splash';
  splash.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  splash.count = 0;
  root.add(splash);
  const drops = [];
  for (let i = 0; i < SPLASH_N; i++) {
    drops.push({
      x: 0, y: -8, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 0.4,
    });
  }
  const m4 = new THREE.Matrix4();
  const q4 = new THREE.Quaternion();
  const s4 = new THREE.Vector3();
  const v4 = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let lastY = CITY_Y;
  let cool = 0;

  const burst = (x, y, z, speed) => {
    const n = Math.min(SPLASH_N, 18 + ((speed * 4) | 0));
    for (let i = 0; i < n; i++) {
      const d = drops[i];
      const a = hash01(i, (x * 10) | 0) * Math.PI * 2;
      const sp = 1.4 + hash01(i, 101) * (1.2 + speed * 0.35);
      d.x = x; d.y = y + 0.04; d.z = z;
      d.vx = Math.cos(a) * sp;
      d.vz = Math.sin(a) * sp;
      d.vy = 2.2 + hash01(i, 103) * 3.4 + speed * 0.25;
      d.life = 0.45 + hash01(i, 107) * 0.35;
      d.max = d.life;
    }
  };

  const writeFish = (t) => {
    for (let i = 0; i < FISH_N; i++) {
      const f = fishState[i];
      const a = f.a + t * f.w;
      const x = REEF_X + Math.cos(a) * f.r;
      const z = REEF_Z + Math.sin(a) * f.r * 0.72;
      const y = f.y + Math.sin(t * 1.4 + i) * 0.18;
      q4.setFromAxisAngle(up, -a + Math.PI / 2);
      v4.set(x, y, z);
      s4.set(1, 1, 1);
      m4.compose(v4, q4, s4);
      fish.setMatrixAt(i, m4);
    }
    fish.instanceMatrix.needsUpdate = true;
  };
  writeFish(0);

  const writeSplash = () => {
    let n = 0;
    for (let i = 0; i < SPLASH_N; i++) {
      const d = drops[i];
      if (d.life <= 0) continue;
      const k = Math.max(0.25, d.life / d.max);
      v4.set(d.x, d.y, d.z);
      s4.set(k, k, k);
      q4.identity();
      m4.compose(v4, q4, s4);
      splash.setMatrixAt(n++, m4);
    }
    splash.count = n;
    splash.instanceMatrix.needsUpdate = true;
    splash.visible = n > 0;
  };
  writeSplash();

  setTag('world');
  return {
    reef: { x: REEF_X, z: REEF_Z },
    update(dt, extras = {}) {
      const t = extras.time != null ? extras.time : 0;
      writeFish(t);
      cool = Math.max(0, cool - dt);
      const craft = extras.craft;
      if (craft && Number.isFinite(craft.y)) {
        const y = craft.y;
        const crossed = lastY >= 0 && y < 0 && cool <= 0;
        if (crossed) {
          const spd = extras.speed != null ? extras.speed : Math.abs(y - lastY) / Math.max(dt, 1e-3);
          burst(craft.x, 0.02, craft.z, Math.min(12, spd));
          cool = 0.28;
          if (extras.stampWake) extras.stampWake(craft.x, craft.z, 0.55, 2.4);
        }
        lastY = y;
      }
      for (let i = 0; i < SPLASH_N; i++) {
        const d = drops[i];
        if (d.life <= 0) continue;
        d.life -= dt;
        d.vy -= 14 * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.z += d.vz * dt;
        d.vx *= 0.92;
        d.vz *= 0.92;
        if (d.y < -0.15) d.life = 0;
      }
      writeSplash();
    },
  };
}

export const UNDERWATER = Object.freeze({
  waterZ0: WATER_Z0, waterZ1: WATER_Z1,
  reefX: REEF_X, reefZ: REEF_Z,
  fishN: FISH_N, splashN: SPLASH_N,
});
