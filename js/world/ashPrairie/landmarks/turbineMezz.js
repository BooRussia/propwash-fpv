import * as THREE from 'three';
import { TURBINE, GROUND_Y } from '../constants.js';
import { addBox, addCyl } from '../textures.js';

/**
 * Whoop-scale mezzanine inside the existing turbine hall shell.
 * Catwalks with 0.4–0.8 m gaps, pillar proximity, open bailout to bay doors.
 * 5″ still owns the big hall volume above / through open ends.
 */
export function buildTurbineMezz(ctx) {
  const { root, track, addCollider, mats } = ctx;
  const T = TURBINE;
  const mezY = GROUND_Y + 8.2;
  const deckT = 0.18;
  const railH = 0.95;

  // Three longitudinal catwalk runs with fly gaps between (≈0.55–0.75 m)
  const runs = [
    { z: T.z - 7.2, w: 1.35 },
    { z: T.z, w: 1.5 },
    { z: T.z + 7.2, w: 1.35 },
  ];
  for (const run of runs) {
    // Split deck into segments leaving whoop gaps over turbine casings
    const segs = [
      { x0: T.x - T.w / 2 + 2, x1: T.x - 10 },
      { x0: T.x - 8.5, x1: T.x - 2 },
      { x0: T.x + 2, x1: T.x + 8.5 },
      { x0: T.x + 10, x1: T.x + T.w / 2 - 2 },
    ];
    for (const s of segs) {
      const len = s.x1 - s.x0;
      const mx = (s.x0 + s.x1) / 2;
      if (len < 1.2) continue;
      addBox(ctx, mats, 'oxideDark', mx, mezY, run.z, len, deckT, run.w);
      addBox(ctx, mats, 'voidDark', mx, mezY - 0.12, run.z, len * 0.98, 0.08, run.w * 0.9, { collide: false });
      // Handrail posts + top rail (thin readable steel; collide posts only)
      addBox(ctx, mats, 'oxide', mx, mezY + deckT, run.z + run.w / 2 - 0.05, len, 0.06, 0.06, { collide: false });
      addBox(ctx, mats, 'oxide', mx, mezY + deckT, run.z - run.w / 2 + 0.05, len, 0.06, 0.06, { collide: false });
      const postN = Math.max(2, Math.floor(len / 2.4));
      for (let i = 0; i <= postN; i++) {
        const px = s.x0 + (i / postN) * len;
        addBox(ctx, mats, 'galv', px, mezY + deckT, run.z + run.w / 2 - 0.05, 0.08, railH, 0.08);
        addBox(ctx, mats, 'galv', px, mezY + deckT, run.z - run.w / 2 + 0.05, 0.08, railH, 0.08);
      }
    }
  }

  // Cross bridges every ~14 m (pillar proximity weave)
  for (let i = 0; i < 4; i++) {
    const x = T.x - 18 + i * 12;
    addBox(ctx, mats, 'oxideDark', x, mezY, T.z, 1.2, deckT, T.d - 4);
    // Support columns to floor — thick enough to read in FPV
    addBox(ctx, mats, 'oxide', x, GROUND_Y + 0.4, T.z - 6, 0.45, mezY - 0.4, 0.45);
    addBox(ctx, mats, 'oxide', x, GROUND_Y + 0.4, T.z + 6, 0.45, mezY - 0.4, 0.45);
  }

  // Stair / ladder bailout on +X end (open to bay)
  const stairX = T.x + T.w / 2 - 3.5;
  for (let step = 0; step < 10; step++) {
    const y = GROUND_Y + 0.5 + step * 0.75;
    const z = T.z + 4 - step * 0.35;
    addBox(ctx, mats, 'concreteDark', stairX, y, z, 1.4, 0.16, 0.7);
    if (step % 3 === 0) {
      addBox(ctx, mats, 'rustHot', stairX, y + 0.16, z, 1.4, 0.04, 0.12, { collide: false });
    }
  }
  // Landing pad at mezz level toward open bay (outdoor bailout path)
  addBox(ctx, mats, 'concrete', stairX + 1.5, mezY, T.z + T.d / 2 - 1.2, 2.2, 0.2, 2.0);

  // Cable trays under mezz (whoop scrape clutter — merged collider slabs)
  for (const z of [T.z - 3.5, T.z + 3.5]) {
    addBox(ctx, mats, 'galv', T.x, mezY - 1.1, z, T.w * 0.7, 0.22, 0.55);
  }

  // Mid-height duct elbows (visual + thick collide members)
  for (let i = 0; i < 3; i++) {
    const x = T.x - 14 + i * 14;
    addCyl(ctx, mats, 'oxideDark', x, mezY - 2.4, T.z - 2, 0.55, 0.55, 3.2, { seg: 12 });
    addBox(ctx, mats, 'warnYellow', x, mezY - 0.7, T.z - 2, 1.2, 0.12, 0.12, { collide: false });
  }

  // Sparse commit-edge rust on gap lips (no continuous neon hazard)
  for (const z of [T.z - 7.2, T.z + 7.2]) {
    for (const x of [T.x - 12, T.x, T.x + 12]) {
      addBox(ctx, mats, 'rustHot', x, mezY + deckT + 0.02, z, 1.2, 0.04, 0.1, { collide: false });
    }
  }
}
