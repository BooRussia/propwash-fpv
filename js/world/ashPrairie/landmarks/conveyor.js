import * as THREE from 'three';
import { CONVEYOR, GROUND_Y } from '../constants.js';
import { addBox } from '../textures.js';

/** Elevated conveyor bridge — fly-under corridor beneath. */
export function buildConveyor(ctx) {
  const { root, track, addCollider, mats } = ctx;
  const C = CONVEYOR;
  const len = C.x1 - C.x0;
  const midX = (C.x0 + C.x1) / 2;

  // Truss box
  addBox(ctx, mats, 'galv', midX, C.y, C.z, len, 2.2, C.w);
  // Belt deck inside
  addBox(ctx, mats, 'oxideDark', midX, C.y + 0.3, C.z, len - 1, 0.25, C.w - 0.8, { collide: false });

  // Support legs every ~18 m — leave fly-under clear between
  const spacing = 18;
  const n = Math.floor(len / spacing);
  for (let i = 0; i <= n; i++) {
    const x = C.x0 + i * spacing;
    addBox(ctx, mats, 'oxide', x, GROUND_Y, C.z - C.w * 0.45, 0.55, C.y, 0.55);
    addBox(ctx, mats, 'oxide', x, GROUND_Y, C.z + C.w * 0.45, 0.55, C.y, 0.55);
    // Cross brace
    addBox(ctx, mats, 'galv', x, GROUND_Y + C.y * 0.5, C.z, 0.2, 0.2, C.w);
  }

  // Transfer houses at ends
  for (const x of [C.x0 - 3, C.x1 + 3]) {
    addBox(ctx, mats, 'concreteDark', x, GROUND_Y, C.z, 7, C.y + 3, 8);
    addBox(ctx, mats, 'warnRed', x, GROUND_Y + 2, C.z + 4.05, 5, 0.3, 0.12, { collide: false });
  }

  // Cable tray under deck (whoop scrape)
  addBox(ctx, mats, 'galv', midX, C.y - 0.9, C.z, len * 0.9, 0.2, 0.6);
}
