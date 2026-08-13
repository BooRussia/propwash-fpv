import * as THREE from 'three';
import {
  GROUND_Y, groundHeight, COOP, RAIL, SWITCHYARD, DUMP_CANOPY, ADMIN,
  PIPE_RACK, TURBINE, CONTAINMENT, TOWER_SITES,
} from '../constants.js';

/**
 * Chernobyl wave 2 — higher-quality abandoned vehicles (5 unique kits),
 * denser moss/crack weeds, collapsed fence debris.
 * InstancedMesh pools; colliders on vehicles / poles / large rubble only.
 */
export function buildAbandonment(ctx) {
  const { root, track, addCollider, mats, rng } = ctx;
  const tmp = new THREE.Object3D();

  function makePool(geo, mat, count, name) {
    const mesh = new THREE.InstancedMesh(track(geo), mat, count);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.count = 0;
    root.add(mesh);
    return mesh;
  }

  function addInstance(pool, x, y, z, sx, sy, sz, rotY = 0, rotZ = 0) {
    if (pool.count >= pool.instanceMatrix.count) return false;
    tmp.position.set(x, y, z);
    tmp.rotation.set(0, rotY, rotZ);
    tmp.scale.set(sx, sy, sz);
    tmp.updateMatrix();
    pool.setMatrixAt(pool.count++, tmp.matrix);
    return true;
  }

  function gy(x, z) {
    try { return groundHeight(x, z); } catch (e) { return GROUND_Y; }
  }

  // --- Vehicle part pools (5 kits × a few instances = ~12–20 mid-ground) ---
  const sedanBody = makePool(new THREE.BoxGeometry(4.2, 1.15, 1.75), mats.carBodyA || mats.oxide, 8, 'sedanBody');
  const sedanCabin = makePool(new THREE.BoxGeometry(2.0, 0.85, 1.65), mats.glassDead || mats.voidDark, 8, 'sedanCabin');
  const hatchBody = makePool(new THREE.BoxGeometry(3.6, 1.25, 1.7), mats.carBodyB || mats.oxide, 6, 'hatchBody');
  const hatchCabin = makePool(new THREE.BoxGeometry(2.2, 0.95, 1.6), mats.glassDead || mats.voidDark, 6, 'hatchCabin');
  const vanBody = makePool(new THREE.BoxGeometry(5.2, 2.1, 2.05), mats.carBodyC || mats.oxideDark, 5, 'vanBody');
  const vanCabin = makePool(new THREE.BoxGeometry(1.6, 1.1, 1.95), mats.glassDead || mats.voidDark, 5, 'vanCabin');
  const pickupBody = makePool(new THREE.BoxGeometry(4.8, 1.2, 1.9), mats.carBodyA || mats.oxide, 6, 'pickupBody');
  const pickupBed = makePool(new THREE.BoxGeometry(2.2, 0.55, 1.75), mats.carBodyC || mats.oxideDark, 6, 'pickupBed');
  const pickupCabin = makePool(new THREE.BoxGeometry(1.7, 0.95, 1.8), mats.glassDead || mats.voidDark, 6, 'pickupCabin');
  const busBody = makePool(new THREE.BoxGeometry(8.5, 2.6, 2.4), mats.carBodyB || mats.oxide, 3, 'busBody');
  const busCabin = makePool(new THREE.BoxGeometry(7.5, 1.0, 2.2), mats.glassDead || mats.voidDark, 3, 'busCabin');
  const wheel = makePool(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 8), mats.voidDark || mats.concreteDark, 120, 'wheels');
  const bumper = makePool(new THREE.BoxGeometry(1, 0.25, 0.2), mats.galv || mats.steel, 40, 'bumpers');

  const barrel = makePool(new THREE.CylinderGeometry(0.45, 0.5, 1.1, 8), mats.rustCool || mats.oxide, 400, 'barrels');
  const rubble = makePool(new THREE.BoxGeometry(1, 1, 1), mats.concreteDark || mats.concrete, 700, 'rubble');
  const post = makePool(new THREE.BoxGeometry(0.12, 1, 0.12), mats.galv || mats.steel, 500, 'fencePosts');
  const rail = makePool(new THREE.BoxGeometry(1, 0.08, 0.08), mats.oxideDark || mats.oxide, 400, 'fenceRails');
  const pole = makePool(new THREE.CylinderGeometry(0.12, 0.16, 1, 6), mats.oxideDark || mats.oxide, 80, 'poles');
  const shrub = makePool(new THREE.ConeGeometry(0.6, 1.2, 5), mats.overgrow || mats.poisonGrass || mats.grass, 1600, 'shrubs');
  const weed = makePool(new THREE.BoxGeometry(0.12, 0.55, 0.12), mats.overgrowDark || mats.moss || mats.grass, 2200, 'weeds');
  const mossClump = makePool(new THREE.SphereGeometry(0.45, 5, 4), mats.moss || mats.grass, 900, 'moss');
  const crackWeed = makePool(new THREE.BoxGeometry(0.08, 0.35, 0.08), mats.mossDark || mats.moss || mats.grass, 1400, 'crackWeeds');

  const kits = ['sedan', 'hatch', 'van', 'pickup', 'bus'];
  let vehicleCount = 0;

  function placeWheels(x, z, y, L, W, rot, n = 4) {
    const pairs = n === 6
      ? [[-0.35, 0.42], [0, 0.42], [0.32, 0.42], [-0.35, -0.42], [0, -0.42], [0.32, -0.42]]
      : [[-0.32, 0.42], [0.3, 0.42], [-0.32, -0.42], [0.3, -0.42]];
    for (const [fx, fz] of pairs) {
      const dx = fx * L, dz = fz * W;
      const wx = x + dx * Math.cos(rot) - dz * Math.sin(rot);
      const wz = z + dx * Math.sin(rot) + dz * Math.cos(rot);
      addInstance(wheel, wx, y + 0.38, wz, 1, 1, 1, rot + Math.PI / 2);
    }
  }

  function overgrowVehicle(x, z, L, W) {
    for (let i = 0; i < 7; i++) {
      const ox = x + (rng() - 0.5) * L * 1.3;
      const oz = z + (rng() - 0.5) * W * 1.5;
      addInstance(shrub, ox, gy(ox, oz) + 0.45, oz, 0.7 + rng() * 0.9, 0.8 + rng() * 1.2, 0.7 + rng() * 0.9, rng() * 6);
    }
    for (let i = 0; i < 10; i++) {
      const ox = x + (rng() - 0.5) * L;
      const oz = z + (rng() - 0.5) * W;
      addInstance(weed, ox, gy(ox, oz) + 0.22, oz, 1, 0.7 + rng(), 1, rng() * 6);
    }
    for (let i = 0; i < 4; i++) {
      const ox = x + (rng() - 0.5) * L * 0.9;
      const oz = z + (rng() - 0.5) * W * 0.9;
      addInstance(mossClump, ox, gy(ox, oz) + 0.12, oz, 0.9 + rng() * 0.5, 0.3, 0.9 + rng() * 0.5, 0);
    }
  }

  function placeVehicle(kit, x, z, rot) {
    // Don't park cars in the pad look-corridor
    if (z > 140 && Math.abs(x) < 50) return;
    const y = gy(x, z);
    const sink = rng() * 0.15; // slightly settled
    const yy = y - sink;
    if (kit === 'sedan') {
      addInstance(sedanBody, x, yy + 0.7, z, 1, 1, 1, rot);
      addInstance(sedanCabin, x - 0.15 * Math.cos(rot), yy + 1.45, z - 0.15 * Math.sin(rot), 1, 1, 1, rot);
      addInstance(bumper, x + 2.0 * Math.cos(rot), yy + 0.45, z + 2.0 * Math.sin(rot), 1.6, 1, 1, rot);
      placeWheels(x, z, yy, 4.2, 1.75, rot);
      addCollider(x, yy, z, 4.2, 1.8, 1.75);
      overgrowVehicle(x, z, 4.2, 1.75);
    } else if (kit === 'hatch') {
      addInstance(hatchBody, x, yy + 0.75, z, 1, 1, 1, rot);
      addInstance(hatchCabin, x + 0.1 * Math.cos(rot), yy + 1.55, z + 0.1 * Math.sin(rot), 1, 1, 1, rot);
      placeWheels(x, z, yy, 3.6, 1.7, rot);
      addCollider(x, yy, z, 3.6, 1.9, 1.7);
      overgrowVehicle(x, z, 3.6, 1.7);
    } else if (kit === 'van') {
      addInstance(vanBody, x, yy + 1.15, z, 1, 1, 1, rot);
      addInstance(vanCabin, x + 1.6 * Math.cos(rot), yy + 1.55, z + 1.6 * Math.sin(rot), 1, 1, 1, rot);
      placeWheels(x, z, yy, 5.2, 2.05, rot);
      addCollider(x, yy, z, 5.2, 2.4, 2.05);
      overgrowVehicle(x, z, 5.2, 2.05);
    } else if (kit === 'pickup') {
      addInstance(pickupBody, x, yy + 0.75, z, 1, 1, 1, rot);
      addInstance(pickupCabin, x + 1.1 * Math.cos(rot), yy + 1.5, z + 1.1 * Math.sin(rot), 1, 1, 1, rot);
      addInstance(pickupBed, x - 1.2 * Math.cos(rot), yy + 1.05, z - 1.2 * Math.sin(rot), 1, 1, 1, rot);
      placeWheels(x, z, yy, 4.8, 1.9, rot);
      addCollider(x, yy, z, 4.8, 1.9, 1.9);
      overgrowVehicle(x, z, 4.8, 1.9);
    } else {
      addInstance(busBody, x, yy + 1.4, z, 1, 1, 1, rot);
      addInstance(busCabin, x, yy + 2.3, z, 1, 1, 1, rot);
      placeWheels(x, z, yy, 8.5, 2.4, rot, 6);
      addCollider(x, yy, z, 8.5, 2.8, 2.4);
      overgrowVehicle(x, z, 8.5, 2.4);
    }
    vehicleCount++;
  }

  // Mid-ground featured lots — ~16–20 vehicles total across kits
  const lots = [
    [COOP.x - 18, COOP.z + 22, 4],
    [ADMIN.x - 12, ADMIN.z + 16, 3],
    [RAIL.x0 + 55, RAIL.z + 10, 4],
    [DUMP_CANOPY.x + 22, DUMP_CANOPY.z + 12, 3],
    [SWITCHYARD.x + 45, SWITCHYARD.z + 30, 3],
    [60, 35, 2],
    [-35, 65, 2],
  ];
  let kitIdx = 0;
  for (const [cx, cz, n] of lots) {
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2;
      const d = 3 + rng() * 10;
      placeVehicle(kits[kitIdx % kits.length], cx + Math.cos(a) * d, cz + Math.sin(a) * d, rng() * Math.PI * 2);
      kitIdx++;
    }
  }

  // --- Collapsed fence push (tilted posts + fallen rails) ---
  function collapsedFence(x0, z0, x1, z1, posts = 10) {
    const dx = x1 - x0, dz = z1 - z0;
    for (let i = 0; i < posts; i++) {
      const t = i / (posts - 1);
      const x = x0 + dx * t + (rng() - 0.5) * 0.8;
      const z = z0 + dz * t + (rng() - 0.5) * 0.8;
      const y = gy(x, z);
      const lean = (rng() - 0.5) * 0.9;
      const broken = rng() > 0.45;
      if (broken) {
        // Fallen post
        addInstance(post, x, y + 0.12, z, 1, 0.25, 2.4, Math.atan2(dx, dz) + lean, Math.PI / 2 * (0.7 + rng() * 0.3));
        addInstance(rail, x + (rng() - 0.5) * 1.5, y + 0.08, z + (rng() - 0.5) * 1.5, 2.2 + rng(), 1, 1, rng() * 6);
        if (i % 2 === 0) addCollider(x, y, z, 2.2, 0.4, 0.8);
      } else {
        addInstance(post, x, y + 1.0, z, 1, 2.0 + rng() * 0.4, 1, Math.atan2(dx, dz), lean * 0.35);
        if (i % 3 === 0) addCollider(x, y, z, 0.25, 2.1, 0.25);
      }
    }
  }
  collapsedFence(SWITCHYARD.x - 38, SWITCHYARD.z - 38, SWITCHYARD.x + 48, SWITCHYARD.z - 36, 14);
  collapsedFence(COOP.x - 38, COOP.z + 28, ADMIN.x + 18, COOP.z + 32, 12);
  collapsedFence(RAIL.x0 + 20, RAIL.z + 7, RAIL.x0 + 160, RAIL.z + 9, 16);
  collapsedFence(PIPE_RACK.x1 + 8, PIPE_RACK.z0 - 8, TURBINE.x + 20, TURBINE.z + 25, 10);
  collapsedFence(CONTAINMENT.x + 30, CONTAINMENT.z + 10, COOP.x - 20, COOP.z - 15, 12);

  // Debris piles near switchyard / coop
  for (const [cx, cz, n] of [[SWITCHYARD.x + 20, SWITCHYARD.z - 25, 40], [COOP.x + 15, COOP.z + 20, 35], [DUMP_CANOPY.x - 10, DUMP_CANOPY.z + 8, 25]]) {
    for (let i = 0; i < n; i++) {
      const x = cx + (rng() - 0.5) * 18;
      const z = cz + (rng() - 0.5) * 14;
      const y = gy(x, z);
      const s = 0.35 + rng() * 1.3;
      addInstance(rubble, x, y + s * 0.3, z, s, s * (0.35 + rng() * 0.5), s * (0.5 + rng()), rng() * 6);
      if (rng() > 0.55) addInstance(barrel, x + rng(), y + 0.55, z + rng(), 1, 1, 1, rng() * 6);
      if (s > 1.0 && i % 3 === 0) addCollider(x, y, z, s, s * 0.6, s);
    }
  }

  // --- Moss on major concrete + asphalt crack weeds ---
  // Tower / containment aprons
  for (const t of TOWER_SITES) {
    for (let i = 0; i < 28; i++) {
      const a = rng() * Math.PI * 2;
      const d = t.baseR * 0.7 + rng() * 14;
      const x = t.x + Math.cos(a) * d;
      const z = t.z + Math.sin(a) * d;
      addInstance(mossClump, x, gy(x, z) + 0.1, z, 1.2 + rng(), 0.25 + rng() * 0.2, 1.2 + rng(), 0);
    }
  }
  for (let i = 0; i < 35; i++) {
    const a = rng() * Math.PI * 2;
    const d = CONTAINMENT.r + 2 + rng() * 12;
    const x = CONTAINMENT.x + Math.cos(a) * d;
    const z = CONTAINMENT.z + Math.sin(a) * d;
    addInstance(mossClump, x, gy(x, z) + 0.1, z, 1 + rng(), 0.22, 1 + rng(), 0);
  }

  // Asphalt crack lines with weeds (apron reclaim)
  for (let c = 0; c < 24; c++) {
    let x = (rng() - 0.5) * 280;
    let z = -40 + (rng() - 0.5) * 160;
    const ang = rng() * Math.PI;
    const len = 8 + rng() * 28;
    const steps = Math.floor(len / 0.55);
    for (let s = 0; s < steps; s++) {
      x += Math.cos(ang) * 0.55 + (rng() - 0.5) * 0.15;
      z += Math.sin(ang) * 0.55 + (rng() - 0.5) * 0.15;
      if (Math.abs(x) > 220) continue;
      addInstance(crackWeed, x, gy(x, z) + 0.12, z, 0.8, 0.5 + rng() * 0.7, 0.8, ang);
      if (s % 4 === 0) addInstance(mossClump, x, gy(x, z) + 0.08, z, 0.6, 0.18, 0.6, 0);
    }
  }

  // Sparse approach prairie fill (not void)
  for (let i = 0; i < 80; i++) {
    const x = (rng() - 0.5) * 80;
    const z = 155 + rng() * 50;
    addInstance(shrub, x, gy(x, z) + 0.5, z, 0.8 + rng(), 1 + rng(), 0.8 + rng(), rng() * 6);
  }

  for (const p of [sedanBody, sedanCabin, hatchBody, hatchCabin, vanBody, vanCabin, pickupBody, pickupBed, pickupCabin, busBody, busCabin, wheel, bumper, barrel, rubble, post, rail, pole, shrub, weed, mossClump, crackWeed]) {
    p.instanceMatrix.needsUpdate = true;
    p.computeBoundingSphere?.();
  }

  ctx._abandonmentCounts = { vehicles: vehicleCount };
}
