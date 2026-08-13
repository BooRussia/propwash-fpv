import * as THREE from 'three';
import { GROUND_Y, SPAWN } from '../constants.js';

/**
 * Continuous far ridge band (Desi c1).
 * Overlapping squat hills — one connected silhouette, not sparse cones.
 * Northern spawn approach stays open prairie. Visual only (no colliders).
 */
export function buildMountains(ctx) {
  const { root, track, mats } = ctx;

  const farMat = mats.mountainFar || mats.rock || mats.concreteDark;
  const nearMat = mats.mountainNear || mats.soil || mats.concreteDark;

  // Squat hills (not pointy cones) so they merge into a range
  const hillGeo = track(new THREE.CylinderGeometry(0.85, 1.2, 1, 7));
  const peakGeo = track(new THREE.CylinderGeometry(0.35, 0.9, 1, 6));

  const tmp = new THREE.Object3D();

  function makePool(geo, mat, count) {
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.count = 0;
    mesh.frustumCulled = false;
    root.add(mesh);
    return mesh;
  }

  const farPool = makePool(hillGeo, farMat, 160);
  const nearPool = makePool(hillGeo, nearMat, 120);
  const peakPool = makePool(peakGeo, farMat, 80);

  function addHill(pool, x, z, h, rx, rz, rotY = 0) {
    if (z > 50 && Math.abs(x) < 120) return; // spawn/north prairie open
    const dx = x - SPAWN.x, dz = z - SPAWN.z;
    if (Math.hypot(dx, dz) < 280) return; // never mid-ground toys
    if (pool.count >= pool.instanceMatrix.count) return;
    tmp.position.set(x, GROUND_Y + h * 0.48, z);
    tmp.rotation.set(0, rotY, 0);
    tmp.scale.set(rx, h, rz);
    tmp.updateMatrix();
    pool.setMatrixAt(pool.count++, tmp.matrix);
  }

  // Outer continuous ring — overlap spacing < hill radius
  const outerR = 430;
  const outerN = 56;
  for (let i = 0; i < outerN; i++) {
    const a = (i / outerN) * Math.PI * 2;
    const jitter = ((i * 13) % 7) - 3;
    const rr = outerR + jitter * 4;
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    const h = 92 + 38 * Math.sin(i * 0.73 + 0.4);
    const rx = 62 + 18 * Math.sin(i * 1.1);
    const rz = rx * 0.85;
    addHill(farPool, x, z, h, rx, rz, a);
    addHill(nearPool, x + Math.cos(a) * 18, z + Math.sin(a) * 18, h * 0.72, rx * 0.8, rz * 0.8, a + 0.1);
    if (i % 2 === 0) {
      addHill(peakPool, x, z, h * 0.55, rx * 0.45, rz * 0.4, a);
    }
  }

  // Inner thickening band (still far) so the silhouette has depth
  const innerR = 390;
  const innerN = 40;
  for (let i = 0; i < innerN; i++) {
    const a = (i / innerN) * Math.PI * 2 + 0.08;
    const x = Math.cos(a) * innerR;
    const z = Math.sin(a) * innerR;
    const h = 70 + 24 * Math.sin(i * 0.9);
    const rx = 50 + 12 * Math.cos(i);
    addHill(nearPool, x, z, h, rx, rx * 0.9, a);
  }

  // Extra south wall behind cooling towers (break skyline at 15–25 m tower views)
  for (let i = 0; i < 18; i++) {
    const x = -280 + i * 32;
    const z = -400 - (i % 3) * 12;
    const h = 100 + (i % 5) * 14;
    addHill(farPool, x, z, h, 48, 40, 0.2 * i);
    addHill(nearPool, x + 10, z + 16, h * 0.7, 40, 34, 0.15 * i);
  }

  for (const p of [farPool, nearPool, peakPool]) {
    p.instanceMatrix.needsUpdate = true;
    p.computeBoundingSphere?.();
  }
}
