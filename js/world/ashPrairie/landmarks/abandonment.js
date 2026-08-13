import * as THREE from 'three';
import { GROUND_Y, groundHeight, COOP, RAIL, SWITCHYARD, DUMP_CANOPY, ADMIN, PIPE_RACK, TURBINE } from '../constants.js';

/**
 * Chernobyl/Pripyat abandonment clutter — InstancedMesh pools.
 * Cars/trucks overgrown, barrels, rubble, fence posts, poles, shrubs.
 * Colliders only on cars / poles / larger rubble clusters.
 */
export function buildAbandonment(ctx) {
  const { root, track, addCollider, mats, rng } = ctx;

  const tmp = new THREE.Object3D();
  const pools = [];

  function makePool(geo, mat, count, name) {
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.count = 0;
    root.add(mesh);
    track(geo);
    pools.push(mesh);
    return mesh;
  }

  function addInstance(pool, x, y, z, sx, sy, sz, rotY = 0) {
    if (pool.count >= pool.instanceMatrix.count) return;
    tmp.position.set(x, y, z);
    tmp.rotation.set(0, rotY, 0);
    tmp.scale.set(sx, sy, sz);
    tmp.updateMatrix();
    pool.setMatrixAt(pool.count++, tmp.matrix);
  }

  const carBody = makePool(new THREE.BoxGeometry(1, 1, 1), mats.rustHot || mats.oxide, 420, 'cars');
  const carCab = makePool(new THREE.BoxGeometry(1, 1, 1), mats.oxideDark || mats.oxide, 420, 'cabs');
  const wheel = makePool(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 8), mats.voidDark || mats.concreteDark, 1600, 'wheels');
  const barrel = makePool(new THREE.CylinderGeometry(0.45, 0.5, 1.1, 8), mats.rustCool || mats.oxide, 800, 'barrels');
  const rubble = makePool(new THREE.BoxGeometry(1, 1, 1), mats.concreteDark || mats.concrete, 1200, 'rubble');
  const post = makePool(new THREE.BoxGeometry(0.12, 1, 0.12), mats.galv || mats.steel, 900, 'fencePosts');
  const pole = makePool(new THREE.CylinderGeometry(0.12, 0.16, 1, 6), mats.oxideDark || mats.oxide, 180, 'poles');
  const shrub = makePool(new THREE.ConeGeometry(0.6, 1.2, 5), mats.grass || mats.soil, 2200, 'shrubs');
  const weed = makePool(new THREE.BoxGeometry(0.15, 0.5, 0.15), mats.grass || mats.soil, 1800, 'weeds');

  function gy(x, z) {
    try { return groundHeight(x, z); } catch (e) { return GROUND_Y; }
  }

  function placeCar(x, z, rot, truck = false) {
    const y = gy(x, z);
    const L = truck ? 7.2 : 4.4;
    const W = truck ? 2.4 : 1.8;
    const H = truck ? 2.2 : 1.45;
    addInstance(carBody, x, y + H * 0.45, z, L, H, W, rot);
    addInstance(carCab, x + (truck ? -1.6 : -0.7) * Math.cos(rot), y + H * 0.95, z + (truck ? -1.6 : -0.7) * Math.sin(rot),
      truck ? 2.4 : 1.8, H * 0.7, W * 0.9, rot);
    // wheels
    for (const [dx, dz] of [[-L * 0.32, W * 0.42], [L * 0.28, W * 0.42], [-L * 0.32, -W * 0.42], [L * 0.28, -W * 0.42]]) {
      const wx = x + dx * Math.cos(rot) - dz * Math.sin(rot);
      const wz = z + dx * Math.sin(rot) + dz * Math.cos(rot);
      addInstance(wheel, wx, y + 0.35, wz, 0.7, 0.7, 0.7, rot + Math.PI / 2);
    }
    addCollider(x, y, z, L, H + 0.4, W);
    // overgrowth on/around car
    for (let i = 0; i < 6; i++) {
      const ox = x + (rng() - 0.5) * L * 1.2;
      const oz = z + (rng() - 0.5) * W * 1.4;
      addInstance(shrub, ox, gy(ox, oz) + 0.4, oz, 0.6 + rng() * 0.8, 0.7 + rng() * 1.1, 0.6 + rng() * 0.8, rng() * 6);
    }
    for (let i = 0; i < 8; i++) {
      const ox = x + (rng() - 0.5) * L;
      const oz = z + (rng() - 0.5) * W;
      addInstance(weed, ox, gy(ox, oz) + 0.2, oz, 0.8, 0.6 + rng(), 0.8, rng() * 6);
    }
  }

  // Cluster seeds: mid-ground between landmarks + reclaiming asphalt
  const clusters = [
    [COOP.x - 20, COOP.z + 25, 18, 0.7],
    [COOP.x + 30, COOP.z - 10, 14, 0.5],
    [ADMIN.x - 15, ADMIN.z + 18, 12, 0.55],
    [RAIL.x0 + 40, RAIL.z + 12, 22, 0.65],
    [RAIL.x0 + 120, RAIL.z - 8, 20, 0.6],
    [DUMP_CANOPY.x + 25, DUMP_CANOPY.z + 15, 16, 0.55],
    [SWITCHYARD.x + 40, SWITCHYARD.z + 35, 18, 0.5],
    [TURBINE.x + 30, TURBINE.z + 40, 14, 0.45],
    [PIPE_RACK.x1 + 15, PIPE_RACK.z0 - 20, 16, 0.5],
    [60, 40, 20, 0.55],
    [-40, 70, 18, 0.5],
    [20, -60, 16, 0.45],
    [-160, 40, 14, 0.4],
    [170, 20, 14, 0.4],
    // lighter approach prairie (z>145) — sparse not void
    [-30, 175, 20, 0.22],
    [40, 180, 18, 0.2],
    [0, 200, 24, 0.18],
    // far-ish field light fill
    [-240, 0, 30, 0.15],
    [250, -40, 28, 0.15],
  ];

  for (const [cx, cz, radius, density] of clusters) {
    const nCars = Math.floor(4 + density * 14);
    for (let i = 0; i < nCars; i++) {
      const a = rng() * Math.PI * 2;
      const d = rng() * radius;
      const x = cx + Math.cos(a) * d;
      const z = cz + Math.sin(a) * d;
      if (z > 145 && density > 0.3) continue; // keep approach lighter via density already
      placeCar(x, z, rng() * Math.PI * 2, rng() > 0.7);
    }
    const nBarrel = Math.floor(8 + density * 40);
    for (let i = 0; i < nBarrel; i++) {
      const x = cx + (rng() - 0.5) * radius * 2;
      const z = cz + (rng() - 0.5) * radius * 2;
      const y = gy(x, z);
      addInstance(barrel, x, y + 0.55, z, 1, 1, 1, rng() * 6);
      if (i % 5 === 0) addCollider(x, y, z, 1.0, 1.2, 1.0);
    }
    const nRub = Math.floor(10 + density * 50);
    for (let i = 0; i < nRub; i++) {
      const x = cx + (rng() - 0.5) * radius * 2.2;
      const z = cz + (rng() - 0.5) * radius * 2.2;
      const y = gy(x, z);
      const s = 0.4 + rng() * 1.4;
      addInstance(rubble, x, y + s * 0.35, z, s, s * (0.4 + rng() * 0.6), s * (0.6 + rng() * 0.8), rng() * 6);
      if (s > 1.1 && i % 4 === 0) addCollider(x, y, z, s, s * 0.7, s);
    }
    const nShrub = Math.floor(20 + density * 90);
    for (let i = 0; i < nShrub; i++) {
      const x = cx + (rng() - 0.5) * radius * 2.4;
      const z = cz + (rng() - 0.5) * radius * 2.4;
      const y = gy(x, z);
      const s = 0.7 + rng() * 1.8;
      addInstance(shrub, x, y + s * 0.45, z, s * 0.6, s, s * 0.6, rng() * 6);
    }
  }

  // Fence corridors reclaiming — long post runs
  function fenceLine(x0, z0, x1, z1, spacing = 2.8) {
    const dx = x1 - x0, dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const n = Math.floor(len / spacing);
    for (let i = 0; i <= n; i++) {
      const t = i / Math.max(1, n);
      const x = x0 + dx * t, z = z0 + dz * t;
      const y = gy(x, z);
      addInstance(post, x, y + 1.1, z, 1, 2.2, 1, Math.atan2(dx, dz));
      if (i % 3 === 0) addCollider(x, y, z, 0.25, 2.2, 0.25);
    }
  }
  fenceLine(SWITCHYARD.x - 40, SWITCHYARD.z - 40, SWITCHYARD.x + 50, SWITCHYARD.z - 40);
  fenceLine(COOP.x - 40, COOP.z + 30, ADMIN.x + 20, COOP.z + 30);
  fenceLine(RAIL.x0 + 10, RAIL.z + 8, RAIL.x0 + 180, RAIL.z + 8, 3.2);
  fenceLine(-20, 50, 80, -20, 3.0);

  // Utility poles along roads
  for (let i = 0; i < 40; i++) {
    const x = -180 + i * 12 + (rng() - 0.5) * 4;
    const z = 50 + Math.sin(i * 0.7) * 30;
    const y = gy(x, z);
    addInstance(pole, x, y + 5, z, 1, 10, 1, 0);
    if (i % 2 === 0) addCollider(x, y, z, 0.4, 10, 0.4);
  }

  // Crack weeds on apron (asphalt reclaim)
  for (let i = 0; i < 600; i++) {
    const x = (rng() - 0.5) * 300;
    const z = -20 + (rng() - 0.5) * 200;
    if (Math.abs(x) > 230) continue;
    const y = gy(x, z);
    addInstance(weed, x, y + 0.15, z, 0.5 + rng(), 0.4 + rng() * 0.8, 0.5 + rng(), rng() * 6);
  }

  for (const p of pools) {
    p.instanceMatrix.needsUpdate = true;
    p.computeBoundingSphere?.();
  }

  // Expose counts for REPORT via console-less side channel
  ctx._abandonmentCounts = Object.fromEntries(pools.map((p) => [p.name, p.count]));
}
