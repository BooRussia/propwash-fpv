import * as THREE from 'three';
import { ADMIN, GROUND_Y } from '../constants.js';
import { addBox } from '../textures.js';

/**
 * Admin / security building — whoop-scale indoor near pad/coop approach.
 * Broken windows with sill depth (flyable apertures), corridors 0.6–1.0 m,
 * optional tight 0.2–0.5 m clutter lanes, outdoor bailout via open door + annex gap.
 * Colliders match visible solids only — no invisible walls.
 */
export function buildAdmin(ctx) {
  const { mats } = ctx;
  const A = ADMIN;
  const wallT = 0.35;
  const floorY = GROUND_Y;

  // Floor slab
  addBox(ctx, mats, 'concrete', A.x, floorY, A.z, A.w, 0.25, A.d);

  // Exterior walls as segments with door/window apertures (honest openings)
  // --- North wall (+Z) — main entry: two solid spans + door gap ---
  const nZ = A.z + A.d / 2 - wallT / 2;
  addBox(ctx, mats, 'brick', A.x - 7, floorY, nZ, 6, A.h, wallT);
  addBox(ctx, mats, 'brick', A.x + 7, floorY, nZ, 6, A.h, wallT);
  // Door aperture: jambs + sill, dark recess (no collider in opening)
  addBox(ctx, mats, 'concreteDark', A.x, floorY, nZ, 3.2, 0.28, wallT + 0.25); // sill
  addBox(ctx, mats, 'brick', A.x - 1.85, floorY, nZ, 0.4, 3.4, wallT + 0.15); // jamb L
  addBox(ctx, mats, 'brick', A.x + 1.85, floorY, nZ, 0.4, 3.4, wallT + 0.15); // jamb R
  addBox(ctx, mats, 'brick', A.x, floorY + 3.4, nZ, 4.1, A.h - 3.4, wallT); // lintel
  addBox(ctx, mats, 'oxideDark', A.x, floorY + 0.28, nZ, 2.9, 3.1, 0.2, { collide: false });

  // --- South wall (−Z) — three broken windows ---
  const sZ = A.z - A.d / 2 + wallT / 2;
  const winSlots = [-7, 0, 7];
  const segXs = [A.x - A.w / 2 + 2.5, A.x - 3.5, A.x + 3.5, A.x + A.w / 2 - 2.5];
  for (const sx of segXs) {
    addBox(ctx, mats, 'brick', sx, floorY, sZ, 4.2, A.h, wallT);
  }
  for (const wx of winSlots) {
    const x = A.x + wx;
    const winW = 1.6, winH = 1.5, sillH = 1.1;
    // Sill depth (collide) + dark aperture (no collide) + frame lips
    addBox(ctx, mats, 'concreteDark', x, floorY + sillH, sZ, winW + 0.25, 0.18, wallT + 0.45);
    addBox(ctx, mats, 'brick', x - winW / 2 - 0.12, floorY + sillH, sZ, 0.24, winH, wallT + 0.2);
    addBox(ctx, mats, 'brick', x + winW / 2 + 0.12, floorY + sillH, sZ, 0.24, winH, wallT + 0.2);
    addBox(ctx, mats, 'brick', x, floorY + sillH + winH, sZ, winW + 0.5, 0.25, wallT + 0.15);
    addBox(ctx, mats, 'oxideDark', x, floorY + sillH + 0.18, sZ, winW, winH - 0.2, 0.15, { collide: false });
    // Broken glass shard lip (visual)
    addBox(ctx, mats, 'galv', x + 0.3, floorY + sillH + 0.5, sZ - 0.05, 0.08, 0.7, 0.05, { collide: false });
  }
  // Lower solid under windows + upper band
  addBox(ctx, mats, 'brick', A.x, floorY, sZ, A.w, 1.1, wallT);
  addBox(ctx, mats, 'brick', A.x, floorY + 2.8, sZ, A.w, A.h - 2.8, wallT);

  // --- East / West end walls (one window each on east) ---
  const eX = A.x + A.w / 2 - wallT / 2;
  const wX = A.x - A.w / 2 + wallT / 2;
  addBox(ctx, mats, 'brick', wX, floorY, A.z, wallT, A.h, A.d);
  // East: solid with one flyable window
  addBox(ctx, mats, 'brick', eX, floorY, A.z - 4, wallT, A.h, 6);
  addBox(ctx, mats, 'brick', eX, floorY, A.z + 4.5, wallT, A.h, 5);
  addBox(ctx, mats, 'concreteDark', eX, floorY + 1.0, A.z + 0.5, wallT + 0.4, 0.18, 1.7);
  addBox(ctx, mats, 'brick', eX, floorY + 1.0, A.z + 0.5 - 0.95, wallT + 0.15, 1.6, 0.25);
  addBox(ctx, mats, 'brick', eX, floorY + 1.0, A.z + 0.5 + 0.95, wallT + 0.15, 1.6, 0.25);
  addBox(ctx, mats, 'brick', eX, floorY + 2.6, A.z + 0.5, wallT, A.h - 2.6, 2.2);
  addBox(ctx, mats, 'oxideDark', eX, floorY + 1.18, A.z + 0.5, 0.12, 1.4, 1.5, { collide: false });

  // Roof (partial — open monitor for bailout up)
  addBox(ctx, mats, 'oxide', A.x - 4, floorY + A.h, A.z, A.w - 6, 0.3, A.d + 0.6);
  addBox(ctx, mats, 'oxide', A.x + 6, floorY + A.h, A.z, 8, 0.3, A.d + 0.6);
  // Center roof gap ~2.5 m (vertical bailout) — no collider across gap
  addBox(ctx, mats, 'galv', A.x + 1, floorY + A.h + 0.4, A.z, 3.5, 0.8, 3.5); // monitor box sides via posts
  for (const [dx, dz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) {
    addBox(ctx, mats, 'galv', A.x + 1 + dx, floorY + A.h, A.z + dz, 0.2, 1.0, 0.2);
  }

  // Interior columns (whoop weave) — 0.6–1.0 m corridor clearances
  const cols = [
    { x: A.x - 4, z: A.z - 2 },
    { x: A.x - 4, z: A.z + 2.5 },
    { x: A.x + 3, z: A.z - 2 },
    { x: A.x + 3, z: A.z + 2.5 },
  ];
  for (const c of cols) {
    addBox(ctx, mats, 'concreteDark', c.x, floorY + 0.25, c.z, 0.45, A.h - 0.4, 0.45);
  }

  // Desk / counter blocks (corridors ~0.7 m beside)
  addBox(ctx, mats, 'oxide', A.x - 5.5, floorY + 0.25, A.z + 0.2, 3.2, 1.1, 1.0);
  addBox(ctx, mats, 'oxideDark', A.x + 5, floorY + 0.25, A.z - 3, 2.4, 0.9, 1.6);
  // Filing cabinet row — tight 0.35 m gap to wall (optional squeeze)
  addBox(ctx, mats, 'galv', A.x + 8.2, floorY + 0.25, A.z - 1, 1.0, 1.8, 3.5);
  addBox(ctx, mats, 'warnYellow', A.x + 8.2, floorY + 2.1, A.z - 1, 1.05, 0.08, 3.5, { collide: false });

  // Interior partition with doorway (corridor 0.85 m)
  addBox(ctx, mats, 'concrete', A.x - 0.5, floorY + 0.25, A.z - 1.5, 0.2, 3.2, 5);
  addBox(ctx, mats, 'concrete', A.x - 0.5, floorY + 0.25, A.z + 4.2, 0.2, 3.2, 3.2);
  // Door gap in partition ~0.9 m clear — no collider

  // Security desk monitor shelf + chair blocks
  addBox(ctx, mats, 'oxideDark', A.x - 5.5, floorY + 1.35, A.z + 0.2, 2.4, 0.08, 0.5, { collide: false });
  addBox(ctx, mats, 'oxide', A.x - 4.2, floorY + 0.25, A.z + 1.6, 0.55, 0.7, 0.55);

  // Outdoor bailout apron + bollards (clear exit from north door)
  addBox(ctx, mats, 'concrete', A.x, floorY, A.z + A.d / 2 + 2.5, 8, 0.12, 4, { collide: false });
  addBox(ctx, mats, 'warnYellow', A.x - 2.5, floorY, A.z + A.d / 2 + 3.5, 0.25, 0.9, 0.25);
  addBox(ctx, mats, 'warnYellow', A.x + 2.5, floorY, A.z + A.d / 2 + 3.5, 0.25, 0.9, 0.25);

  // Side lean-to porch (covered bailout)
  addBox(ctx, mats, 'galv', A.x - A.w / 2 - 2.5, floorY + 3.2, A.z, 5, 0.2, A.d * 0.7);
  addBox(ctx, mats, 'oxide', A.x - A.w / 2 - 4.5, floorY, A.z - 4, 0.3, 3.2, 0.3);
  addBox(ctx, mats, 'oxide', A.x - A.w / 2 - 4.5, floorY, A.z + 4, 0.3, 3.2, 0.3);
}
