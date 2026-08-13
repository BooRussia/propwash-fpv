import * as THREE from 'three';
import { COOP, GROUND_Y } from '../constants.js';
import { addBox, addCyl } from '../textures.js';

/** Grain co-op warehouse + truck alley whoop gaps. */
export function buildCoop(ctx) {
  const { root, track, addCollider, mats, rng } = ctx;
  const C = COOP;

  // Main shed
  addBox(ctx, mats, 'brick', C.x, GROUND_Y, C.z, C.w, C.h, C.d);
  // Corrugated roof pitch (two slabs)
  const roofMat = mats.galv;
  {
    const geo = track(new THREE.BoxGeometry(C.w + 1.2, 0.25, C.d * 0.56));
    const a = new THREE.Mesh(geo, roofMat);
    a.position.set(C.x, GROUND_Y + C.h + 1.2, C.z - C.d * 0.22);
    a.rotation.x = 0.18;
    a.castShadow = true;
    root.add(a);
    const b = new THREE.Mesh(geo.clone(), roofMat);
    track(b.geometry);
    b.position.set(C.x, GROUND_Y + C.h + 1.2, C.z + C.d * 0.22);
    b.rotation.x = -0.18;
    b.castShadow = true;
    root.add(b);
    addCollider(C.x, GROUND_Y + C.h, C.z, C.w + 1.2, 2.2, C.d + 1);
  }

  // Truck alley: parallel loading bays with 0.3–0.7 m whoop gaps between bumpers / bollards
  const alleyZ = C.z + C.d / 2 + 6;
  for (let i = 0; i < 5; i++) {
    const x = C.x - 18 + i * 9;
    // Bay door recess + sill
    addBox(ctx, mats, 'oxideDark', x, GROUND_Y + 0.35, C.z + C.d / 2 - 0.15, 5.5, 4.5, 0.6, { collide: false });
    addBox(ctx, mats, 'concreteDark', x, GROUND_Y, C.z + C.d / 2 - 0.05, 5.8, 0.35, 0.9);
    // Dock bumpers
    addBox(ctx, mats, 'warnRed', x - 2.4, GROUND_Y + 0.9, alleyZ - 2.5, 0.35, 0.7, 0.35);
    addBox(ctx, mats, 'warnRed', x + 2.4, GROUND_Y + 0.9, alleyZ - 2.5, 0.35, 0.7, 0.35);
    // Bollards with whoop gap ~0.45 m
    addCyl(ctx, mats, 'warnYellow', x - 1.1, GROUND_Y, alleyZ, 0.18, 0.18, 1.1, { seg: 8 });
    addCyl(ctx, mats, 'warnYellow', x - 0.45, GROUND_Y, alleyZ, 0.18, 0.18, 1.1, { seg: 8 });
    addCyl(ctx, mats, 'warnYellow', x + 0.45, GROUND_Y, alleyZ, 0.18, 0.18, 1.1, { seg: 8 });
    addCyl(ctx, mats, 'warnYellow', x + 1.1, GROUND_Y, alleyZ, 0.18, 0.18, 1.1, { seg: 8 });
  }

  // Parked truck silhouettes forming alley gaps
  for (let i = 0; i < 3; i++) {
    const x = C.x - 12 + i * 14;
    const z = alleyZ + 5;
    addBox(ctx, mats, 'oxide', x, GROUND_Y + 0.6, z, 8.5, 2.6, 2.5);
    addBox(ctx, mats, 'oxideDark', x - 3.2, GROUND_Y + 0.5, z, 2.8, 2.2, 2.3);
    addCyl(ctx, mats, 'oxideDark', x - 2.5, GROUND_Y, z + 1.1, 0.5, 0.5, 1.0, { seg: 10 });
    addCyl(ctx, mats, 'oxideDark', x + 2.5, GROUND_Y, z + 1.1, 0.5, 0.5, 1.0, { seg: 10 });
  }

  // Silo pair beside co-op
  for (let i = 0; i < 2; i++) {
    addCyl(ctx, mats, 'galv', C.x + C.w / 2 + 6 + i * 8, GROUND_Y, C.z - 4, 3.2, 3.2, 18, { seg: 20 });
    addCyl(ctx, mats, 'oxide', C.x + C.w / 2 + 6 + i * 8, GROUND_Y + 18, C.z - 4, 3.3, 0.4, 1.2, { seg: 16 });
  }

  // Office lean-to
  addBox(ctx, mats, 'concrete', C.x - C.w / 2 - 5, GROUND_Y, C.z - 4, 9, 4.5, 10);
  addBox(ctx, mats, 'warnYellow', C.x - C.w / 2 - 5, GROUND_Y + 3.2, C.z + 1.1, 7, 0.2, 0.12, { collide: false });

  // Pallet / crate clutter (whoop)
  for (let i = 0; i < 10; i++) {
    const x = C.x - 20 + rng() * 40;
    const z = C.z - C.d / 2 - 3 - rng() * 6;
    addBox(ctx, mats, 'oxide', x, GROUND_Y, z, 1.1, 0.9 + rng() * 0.6, 1.1);
  }
}
