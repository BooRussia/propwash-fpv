import * as THREE from 'three';
import { RAIL, CANAL, DUMP_CANOPY, GROUND_Y } from '../constants.js';
import { addBox, addCyl } from '../textures.js';

/** Rail spur + canal banks (water built in terrain) + dump/truck canopy. */
export function buildRailCanal(ctx) {
  const { root, track, addCollider, mats } = ctx;

  // Twin rail
  const len = RAIL.x1 - RAIL.x0;
  const mid = (RAIL.x0 + RAIL.x1) / 2;
  for (const dz of [-0.75, 0.75]) {
    addBox(ctx, mats, 'oxideDark', mid, GROUND_Y + 0.12, RAIL.z + dz, len, 0.18, 0.18, { collide: false });
  }
  // Ties
  const tieN = Math.floor(len / 1.2);
  for (let i = 0; i < tieN; i++) {
    const x = RAIL.x0 + i * 1.2;
    addBox(ctx, mats, 'oxide', x, GROUND_Y + 0.05, RAIL.z, 0.2, 0.12, 2.4, { collide: false });
  }
  // Ballast strip collider (low)
  addBox(ctx, mats, 'soil', mid, GROUND_Y, RAIL.z, len, 0.25, 3.2);

  // Canal bank walls (concrete) — water sits lower in terrain.js
  const { x0, x1, z, w } = CANAL;
  const cLen = x1 - x0;
  const cMid = (x0 + x1) / 2;
  addBox(ctx, mats, 'concrete', cMid, GROUND_Y - 2.2, z - w / 2, cLen, 2.4, 0.6);
  addBox(ctx, mats, 'concrete', cMid, GROUND_Y - 2.2, z + w / 2, cLen, 2.4, 0.6);
  // End bulkheads
  addBox(ctx, mats, 'concrete', x0, GROUND_Y - 2.2, z, 0.6, 2.4, w);
  addBox(ctx, mats, 'concrete', x1, GROUND_Y - 2.2, z, 0.6, 2.4, w);

  // Dump / truck canopy
  const D = DUMP_CANOPY;
  // Columns
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(ctx, mats, 'oxide', D.x + sx * (D.w / 2 - 0.5), GROUND_Y, D.z + sz * (D.d / 2 - 0.5), 0.45, D.h, 0.45);
    }
  }
  // Roof
  addBox(ctx, mats, 'galv', D.x, GROUND_Y + D.h, D.z, D.w + 1.5, 0.35, D.d + 1.5);
  // Hopper bins under canopy
  for (let i = 0; i < 3; i++) {
    const x = D.x - 8 + i * 8;
    addBox(ctx, mats, 'oxideDark', x, GROUND_Y, D.z, 5, 3.2, 5);
    addBox(ctx, mats, 'warnYellow', x, GROUND_Y + 3.2, D.z, 5.2, 0.2, 5.2, { collide: false });
  }

  // Small hopper car silhouettes on spur
  for (let i = 0; i < 4; i++) {
    const x = 10 + i * 14;
    addBox(ctx, mats, 'oxide', x, GROUND_Y + 0.4, RAIL.z, 10, 2.8, 2.6);
    addCyl(ctx, mats, 'oxideDark', x - 3.5, GROUND_Y, RAIL.z + 1.1, 0.45, 0.45, 0.9, { seg: 10 });
    addCyl(ctx, mats, 'oxideDark', x + 3.5, GROUND_Y, RAIL.z + 1.1, 0.45, 0.45, 0.9, { seg: 10 });
    addCyl(ctx, mats, 'oxideDark', x - 3.5, GROUND_Y, RAIL.z - 1.1, 0.45, 0.45, 0.9, { seg: 10 });
    addCyl(ctx, mats, 'oxideDark', x + 3.5, GROUND_Y, RAIL.z - 1.1, 0.45, 0.45, 0.9, { seg: 10 });
  }
}
