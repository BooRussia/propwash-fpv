import * as THREE from 'three';
import { GROUND_Y, SPAWN } from '../constants.js';

/**
 * Distant horizon ridges only — outside flyable radius.
 * Never a near-field wall. Spawn approach (z>140, |x|<80) stays open prairie.
 */
export function buildMountains(ctx) {
  const { root, track, mats } = ctx;

  const farMat = mats.mountainFar || mats.rock || mats.concreteDark;
  const nearMat = mats.mountainNear || mats.soil || mats.concreteDark;

  const ridgeGeo = track(new THREE.ConeGeometry(1, 1, 6));
  const hillGeo = track(new THREE.CylinderGeometry(0.9, 1.2, 1, 6));

  function tooCloseToSpawn(x, z, r) {
    const dx = x - SPAWN.x, dz = z - SPAWN.z;
    // Keep pad→yard corridor open (looking -Z from spawn) and the +Z prairie
    if (z > 80 && Math.abs(x) < 90 + r) return true;
    if (Math.hypot(dx, dz) < 420 + r) return true;
    return false;
  }

  function place(geo, mat, x, z, h, r) {
    if (tooCloseToSpawn(x, z, r)) return;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, GROUND_Y + h * 0.42, z);
    mesh.scale.set(r, h, r * 0.8);
    mesh.rotation.y = (x * 0.013 + z * 0.01) % (Math.PI * 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }

  // Far ring ~620–720 m — gapped, not a continuous wall. Visual only.
  const outerR = 680;
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2 + 0.07;
    // Skip a wide southern-ish gap? Keep all far; tooCloseToSpawn filters near.
    const rr = outerR + ((i * 11) % 9) * 6;
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    const h = 48 + (i % 5) * 14;
    const rad = 18 + (i % 4) * 6;
    place(ridgeGeo, farMat, x, z, h, rad);
    place(ridgeGeo, farMat, x + Math.cos(a + 0.15) * 22, z + Math.sin(a + 0.15) * 22, h * 0.62, rad * 0.65);
  }

  // Mid hills ~520 m — sparse, gapped, never near spawn
  const midR = 540;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.2;
    const rr = midR + ((i * 7) % 5) * 8;
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    const h = 14 + (i % 3) * 6;
    const rad = 16 + (i % 3) * 5;
    place(hillGeo, nearMat, x, z, h, rad);
  }

  // Distant south silhouette behind the yard (z << 0), well past towers
  for (let i = 0; i < 6; i++) {
    const x = -160 + i * 64;
    place(ridgeGeo, farMat, x, -560, 62 + (i % 3) * 16, 22);
  }
}
