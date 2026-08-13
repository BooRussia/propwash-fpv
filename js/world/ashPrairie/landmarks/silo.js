import * as THREE from 'three';
import { SILO_LF, GROUND_Y } from '../constants.js';
import { addBox, addCyl } from '../textures.js';

/**
 * Minuteman-style launch facility silo tube — dive well.
 * Open vertical cylinder with collar, ladder, blast-door exit slit, bailout apron.
 */
export function buildSiloLF(ctx) {
  const { root, track, addCollider, mats } = ctx;
  const S = SILO_LF;

  // Outer collar ring at grade
  addCyl(ctx, mats, 'concrete', S.x, GROUND_Y, S.z, S.r + 2.2, S.r + 2.8, S.collarH, { seg: 32 });

  // Tube wall: open-ended cylinder
  const wallH = S.depth + 1.5;
  const wallGeo = track(new THREE.CylinderGeometry(S.r, S.r, wallH, 36, 1, true));
  const wallMat = (mats.voidDark || mats.concreteDark).clone();
  track(wallMat);
  wallMat.side = THREE.DoubleSide;
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(S.x, GROUND_Y - S.depth / 2 + 0.5, S.z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  root.add(wall);

  // Overlapping wall ring with a vertical exit slit toward +X (blast door / apron).
  // Slit ~2.6 m wide so whoops and 5" can bail laterally — not a dead-end kill box.
  const sectors = 22;
  const chord = 2 * S.r * Math.sin(Math.PI / sectors);
  const size = chord * 1.4;
  const doorDir = 0; // +X
  const slitHalf = 0.22; // radians ~ ±12.5° around door
  for (let i = 0; i < sectors; i++) {
    const a = (i / sectors) * Math.PI * 2;
    let da = Math.abs(a - doorDir);
    if (da > Math.PI) da = Math.PI * 2 - da;
    if (da < slitHalf) continue; // open exit toward blast door
    const cx = S.x + Math.cos(a) * S.r;
    const cz = S.z + Math.sin(a) * S.r;
    addCollider(cx, GROUND_Y - S.depth, cz, size, wallH, size);
  }

  // Floor plate at bottom (slightly raised + polygonOffset vs any ground seam)
  const floorMat = mats.oxideDark.clone();
  track(floorMat);
  floorMat.polygonOffset = true;
  floorMat.polygonOffsetFactor = 1;
  floorMat.polygonOffsetUnits = 1;
  const floor = new THREE.Mesh(
    track(new THREE.CircleGeometry(S.r - 0.15, 28)),
    floorMat
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(S.x, GROUND_Y - S.depth + 0.05, S.z);
  floor.receiveShadow = true;
  root.add(floor);
  addCollider(S.x, GROUND_Y - S.depth, S.z, S.r * 2, 0.3, S.r * 2);

  // Interior bailout ledges (rest / climb assists) — open toward door slit
  for (const yOff of [6, 12, 17]) {
    const ledgeY = GROUND_Y - S.depth + yOff;
    const ring = new THREE.Mesh(
      track(new THREE.RingGeometry(S.r - 1.1, S.r - 0.15, 28, 1, slitHalf, Math.PI * 2 - slitHalf * 2)),
      mats.galv
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(S.x, ledgeY, S.z);
    root.add(ring);
  }

  // Blast door leaf parked open (horizontal) — flyable gap beside
  addBox(ctx, mats, 'oxide', S.x + S.r + 3.5, GROUND_Y + 0.2, S.z, 6.5, 0.45, 6.5);
  addBox(ctx, mats, 'warnYellow', S.x + S.r + 3.5, GROUND_Y + 0.65, S.z, 6.2, 0.12, 0.3, { collide: false });
  // Dashed warnYellow collar lip (4–6 segments — not continuous neon)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.15;
    const lx = S.x + Math.cos(a) * (S.r + 1.6);
    const lz = S.z + Math.sin(a) * (S.r + 1.6);
    addBox(ctx, mats, 'warnYellow', lx, GROUND_Y + S.collarH, lz, 1.1, 0.12, 0.35, { collide: false, rotY: -a });
  }

  // Short exit apron pad outside the slit (clear bailout landing)
  addBox(ctx, mats, 'concrete', S.x + S.r + 1.6, GROUND_Y, S.z, 2.8, 0.18, 3.2, { collide: false });

  // Ladder down the tube (thin; doesn't seal the shaft)
  addBox(ctx, mats, 'galv', S.x - S.r + 0.25, GROUND_Y - S.depth, S.z, 0.2, S.depth + 0.5, 0.15);

  // Hardened hut
  addBox(ctx, mats, 'concrete', S.x - 10, GROUND_Y, S.z + 6, 8, 3.2, 6);
  addBox(ctx, mats, 'concreteDark', S.x - 10, GROUND_Y + 3.2, S.z + 6, 8.4, 0.4, 6.4);
  addCyl(ctx, mats, 'galv', S.x - 10, GROUND_Y + 3.6, S.z + 6, 0.12, 0.12, 8, { seg: 8 });

  // Chain-link post ring (visual)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const px = S.x + Math.cos(a) * (S.r + 7);
    const pz = S.z + Math.sin(a) * (S.r + 7);
    addCyl(ctx, mats, 'galv', px, GROUND_Y, pz, 0.08, 0.08, 2.2, { seg: 6, collide: false });
  }
}
