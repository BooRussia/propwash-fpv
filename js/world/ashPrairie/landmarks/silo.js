import * as THREE from 'three';
import { SILO_LF, GROUND_Y } from '../constants.js';
import { addBox, addCyl } from '../textures.js';

/**
 * Minuteman-style launch facility silo tube — dive well.
 * Open vertical cylinder with collar, ladder, and bailout apron.
 */
export function buildSiloLF(ctx) {
  const { root, track, addCollider, mats } = ctx;
  const S = SILO_LF;

  // Outer collar ring at grade
  addCyl(ctx, mats, 'concrete', S.x, GROUND_Y, S.z, S.r + 2.2, S.r + 2.8, S.collarH, { seg: 32 });

  // Tube wall: use open-ended cylinder (inner visible). Colliders are a ring of AABBs.
  const wallH = S.depth + 1.5;
  const wallGeo = track(new THREE.CylinderGeometry(S.r, S.r, wallH, 36, 1, true));
  const wallMat = mats.concreteDark.clone();
  track(wallMat);
  wallMat.side = THREE.DoubleSide;
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(S.x, GROUND_Y - S.depth / 2 + 0.5, S.z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  root.add(wall);

  const sectors = 12;
  for (let i = 0; i < sectors; i++) {
    const a = (i / sectors) * Math.PI * 2;
    const cx = S.x + Math.cos(a) * S.r;
    const cz = S.z + Math.sin(a) * S.r;
    addCollider(cx, GROUND_Y - S.depth, cz, 1.3, wallH, 1.3);
  }

  // Floor plate at bottom
  const floor = new THREE.Mesh(
    track(new THREE.CircleGeometry(S.r - 0.15, 28)),
    mats.oxideDark
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(S.x, GROUND_Y - S.depth + 0.05, S.z);
  floor.receiveShadow = true;
  root.add(floor);
  addCollider(S.x, GROUND_Y - S.depth, S.z, S.r * 2, 0.3, S.r * 2);

  // Blast door leaf parked open (horizontal) — flyable gap beside
  addBox(ctx, mats, 'oxide', S.x + S.r + 3.5, GROUND_Y + 0.2, S.z, 6.5, 0.45, 6.5);
  addBox(ctx, mats, 'warnYellow', S.x + S.r + 3.5, GROUND_Y + 0.65, S.z, 6.2, 0.12, 0.3, { collide: false });

  // Ladder down the tube
  addBox(ctx, mats, 'galv', S.x + S.r - 0.25, GROUND_Y - S.depth, S.z, 0.2, S.depth + 0.5, 0.15);

  // Hardened hut
  addBox(ctx, mats, 'concrete', S.x - 10, GROUND_Y, S.z + 6, 8, 3.2, 6);
  addBox(ctx, mats, 'concreteDark', S.x - 10, GROUND_Y + 3.2, S.z + 6, 8.4, 0.4, 6.4);
  // Antenna mast
  addCyl(ctx, mats, 'galv', S.x - 10, GROUND_Y + 3.6, S.z + 6, 0.12, 0.12, 8, { seg: 8 });

  // Chain-link post ring (visual posts + low rail)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const px = S.x + Math.cos(a) * (S.r + 7);
    const pz = S.z + Math.sin(a) * (S.r + 7);
    addCyl(ctx, mats, 'galv', px, GROUND_Y, pz, 0.08, 0.08, 2.2, { seg: 6 });
  }
}
