import * as THREE from 'three';
import { GROUND_Y, PAL } from '../constants.js';

/**
 * Horizon ridge / mountain ring — Chernobyl-scale depth.
 * Far ridges: visual impostors (no collide). Nearer foothills: light colliders.
 */
export function buildMountains(ctx) {
  const { root, track, addCollider, mats } = ctx;

  const rockMat = mats.mountainFar || mats.rock || mats.concreteDark;
  const soilMat = mats.mountainNear || mats.soil || mats.concreteDark;

  // Shared low-poly ridge segment (wedge)
  const ridgeGeo = track(new THREE.ConeGeometry(1, 1, 5));
  const foothillGeo = track(new THREE.CylinderGeometry(1, 1.35, 1, 6));

  function placeRidge(x, z, h, r, collide) {
    const mesh = new THREE.Mesh(ridgeGeo, rockMat);
    mesh.position.set(x, GROUND_Y + h * 0.45, z);
    mesh.scale.set(r, h, r * 0.85);
    mesh.rotation.y = (x * 0.01 + z * 0.013) % (Math.PI * 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    if (collide) {
      addCollider(x, GROUND_Y, z, r * 1.2, h * 0.7, r * 1.0);
    }
  }

  function placeFoothill(x, z, h, r, collide) {
    const mesh = new THREE.Mesh(foothillGeo, soilMat);
    mesh.position.set(x, GROUND_Y + h * 0.5, z);
    mesh.scale.set(r, h, r);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    if (collide) addCollider(x, GROUND_Y, z, r * 1.6, h * 0.85, r * 1.6);
  }

  // Outer ring ~420–520 m — visual only
  const outerR = 480;
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const jitter = ((i * 17) % 7) - 3;
    const rr = outerR + jitter * 8;
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    const h = 55 + (i % 5) * 18 + (i % 3) * 8;
    const rad = 28 + (i % 4) * 10;
    placeRidge(x, z, h, rad, false);
    // Secondary peak
    placeRidge(x + Math.cos(a + 0.2) * 35, z + Math.sin(a + 0.2) * 35, h * 0.65, rad * 0.7, false);
  }

  // Mid foothills ~280–340 m — light collide if near play approaches
  const midR = 310;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + 0.1;
    const rr = midR + ((i * 13) % 9) * 4;
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    const h = 18 + (i % 4) * 7;
    const rad = 22 + (i % 3) * 6;
    const nearPlay = Math.abs(x) < 260 && Math.abs(z) < 260;
    placeFoothill(x, z, h, rad, nearPlay);
  }

  // Soft northern bluff behind spawn (horizon read when looking +Z / -Z into yard)
  for (let i = 0; i < 8; i++) {
    const x = -140 + i * 40;
    placeRidge(x, -420, 70 + (i % 3) * 20, 40, false);
  }
}
