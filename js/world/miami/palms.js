import * as THREE from 'three';
import { buildPalm, createPalms } from '../vegetation.js';
import { groundHeight, PIER_X } from './constants.js';

/**
 * Deterministic palm placement (main rng) + hero palms (rng2).
 * Returns { palms } handle for update/dispose (null if legacy cones used).
 */
export async function buildPalms(ctx) {
  const { root, track, addCollider, rng, rng2 } = ctx;
  const palmPlacements = [];
  {
    const N = 170;
    let placed = 0;
    while (placed < N) {
      const x = (rng() - 0.5) * 1200;
      const z = rng() < 0.72 ? 26 + rng() * 32 : 6 + rng() * 18;   // road rows + scattered sand
      if (Math.abs(x - PIER_X) < 12 && z < 36) continue;
      const y = groundHeight(x, z);
      if (y < 0.1) continue;
      const sc = 0.8 + rng() * 0.55;
      const legacyTiltX = (rng() - 0.5) * 0.12;   // draws preserved from the old
      const rotY = rng() * Math.PI * 2;           // Euler(tiltX, yaw, tiltZ) — the
      const legacyTiltZ = (rng() - 0.5) * 0.12;   // tilts are no longer applied
      void legacyTiltX; void legacyTiltZ;
      palmPlacements.push({ x, y, z, sc, rotY });
      addCollider(x, y, z, 0.5, 6.5 * sc, 0.5);   // every trunk is solid (unchanged)
      placed++;
    }
  }
  let palms = null;
  try {
    palms = await createPalms(palmPlacements.length);
  } catch (e) {
    console.warn('[miami] createPalms failed — using legacy cone palms:', e);
    palms = null;
  }
  if (palms && palms.group) {
    for (let i = 0; i < palmPlacements.length; i++) {
      const p = palmPlacements[i];
      palms.placeAt(i, p.x, p.y, p.z, p.sc, p.rotY);
    }
    palms.finalize(palmPlacements.length);
    root.add(palms.group);
  } else {
    palms = null;
    // legacy instanced cone palms (colliders above already cover them)
    const trunkGeo = track(new THREE.CylinderGeometry(0.14, 0.22, 6.5, 6));
    trunkGeo.translate(0, 3.25, 0);
    const trunkMat = track(new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 1 }));
    const crownGeo = track(new THREE.ConeGeometry(2.2, 1.4, 7));
    crownGeo.translate(0, 6.9, 0);
    const crownMat = track(new THREE.MeshStandardMaterial({ color: 0x2c7a3c, roughness: 0.9, side: THREE.DoubleSide }));
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palmPlacements.length);
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, palmPlacements.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const eul = new THREE.Euler();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (let i = 0; i < palmPlacements.length; i++) {
      const pl = palmPlacements[i];
      eul.set(0, pl.rotY, 0);
      q.setFromEuler(eul);
      s.set(pl.sc, pl.sc, pl.sc);
      p.set(pl.x, pl.y, pl.z);
      m4.compose(p, q, s);
      trunks.setMatrixAt(i, m4);
      crowns.setMatrixAt(i, m4);
    }
    trunks.castShadow = true; crowns.castShadow = true;
    root.add(trunks); root.add(crowns);
  }

  // hero palms — full buildPalm() models clustered by the spawn/boardwalk,
  // right where the FPV camera starts (the money shot)
  {
    const HERO_POS = [
      [-17, 19.5], [-10, 14], [-4, 22.5], [4, 17],
      [11, 23], [17, 14.5], [24, 20.5], [30, 16.5],
    ];
    for (const [hx, hz] of HERO_POS) {
      let hero = null;
      try { hero = await buildPalm(rng2); } catch (e) { hero = null; }
      if (!hero) break;                       // vegetation absent — instanced palms still cover the area
      const s = 0.95 + rng2() * 0.35;
      const hy = groundHeight(hx, hz);
      hero.scale.multiplyScalar(s);
      hero.rotation.y = rng2() * Math.PI * 2;
      hero.position.set(hx, hy, hz);
      hero.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
      root.add(hero);
      addCollider(hx, hy, hz, 0.6, 7.5 * s, 0.6);   // thin trunk collider per hero
    }
  }
  return { palms };
}
