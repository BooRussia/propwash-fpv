import * as THREE from 'three';
import {
  BUCKET_ELEV, ELEVATORS, RAIL, GROUND_Y, SWITCHYARD, COOP, PIPE_RACK, TURBINE,
  DUMP_CANOPY, TOWER_SITES, CONTAINMENT, STEEL_BINS, ADMIN,
} from '../constants.js';
import { addBox, addCyl } from '../textures.js';

/**
 * v2 accents + Desi mid-clutter: bucket elev, hoppers, fences, transformers,
 * pipe spurs, cooling manifolds, containment berms, steel bins.
 */
export function buildAccents(ctx) {
  const { root, track, mats } = ctx;
  const B = BUCKET_ELEV;

  // Bucket elevator leg + headhouse
  addBox(ctx, mats, 'galv', B.x, GROUND_Y, B.z, B.w * 0.55, B.h, B.d * 0.55);
  addBox(ctx, mats, 'oxide', B.x, GROUND_Y + B.h, B.z, B.w, 4.5, B.d);
  addBox(ctx, mats, 'oxideDark', B.x, GROUND_Y + B.h + 4.5, B.z, B.w * 0.7, 1.2, B.d * 0.7);
  addBox(ctx, mats, 'galv', (B.x + ELEVATORS.x) / 2, GROUND_Y + B.h - 2, (B.z + ELEVATORS.z) / 2,
    Math.abs(ELEVATORS.x - B.x) * 0.6, 0.7, 0.7);
  addBox(ctx, mats, 'galv', B.x + B.w * 0.4, GROUND_Y, B.z + B.d * 0.4, 0.2, B.h * 0.95, 0.2);
  addBox(ctx, mats, 'warnYellow', B.x, GROUND_Y + B.h - 0.35, B.z, B.w + 0.15, 0.35, B.d + 0.15, { collide: false });
  addBox(ctx, mats, 'concretePad', B.x, GROUND_Y, B.z, B.w + 1.5, 0.5, B.d + 1.5);

  // Hopper cars on rail z≈95, x 20→90
  for (let i = 0; i < 4; i++) {
    const hx = 20 + i * 18;
    const hz = RAIL.z;
    addBox(ctx, mats, 'rustHot', hx, GROUND_Y + 0.45, hz, 12, 3.0, 2.8);
    addBox(ctx, mats, 'oxideDark', hx, GROUND_Y + 3.45, hz, 11.5, 0.35, 2.5);
    for (const dx of [-4, -1.3, 1.3, 4]) {
      addCyl(ctx, mats, 'oxideDark', hx + dx, GROUND_Y, hz + 1.15, 0.48, 0.48, 0.95, { seg: 10 });
      addCyl(ctx, mats, 'oxideDark', hx + dx, GROUND_Y, hz - 1.15, 0.48, 0.48, 0.95, { seg: 10 });
    }
    addBox(ctx, mats, 'warnRed', hx - 5.8, GROUND_Y + 0.5, hz, 0.18, 2.6, 2.6, { collide: false });
  }

  // Fence corridors — switchyard + coop alley (gate gaps)
  function fenceRun(x0, z0, x1, z1, postN, gateAt = -1) {
    for (let i = 0; i < postN; i++) {
      if (i === gateAt || i === gateAt + 1) continue;
      const t = i / (postN - 1);
      const x = x0 + (x1 - x0) * t;
      const z = z0 + (z1 - z0) * t;
      addBox(ctx, mats, 'galv', x, GROUND_Y, z, 0.12, 2.4, 0.12);
      if (i < postN - 1 && i !== gateAt - 1 && i !== gateAt) {
        const x2 = x0 + (x1 - x0) * ((i + 1) / (postN - 1));
        const z2 = z0 + (z1 - z0) * ((i + 1) / (postN - 1));
        addBox(ctx, mats, 'galv', (x + x2) / 2, GROUND_Y + 1.9, (z + z2) / 2,
          Math.hypot(x2 - x, z2 - z), 0.08, 0.08, { collide: false });
        addBox(ctx, mats, 'galv', (x + x2) / 2, GROUND_Y + 0.7, (z + z2) / 2,
          Math.hypot(x2 - x, z2 - z), 0.08, 0.08, { collide: false });
      }
    }
  }
  const S = SWITCHYARD;
  fenceRun(S.x - S.w / 2, S.z - S.d / 2, S.x + S.w / 2, S.z - S.d / 2, 12, 5);
  fenceRun(S.x - S.w / 2, S.z + S.d / 2, S.x + S.w / 2, S.z + S.d / 2, 12, 6);
  fenceRun(S.x - S.w / 2, S.z - S.d / 2, S.x - S.w / 2, S.z + S.d / 2, 8, 3);
  fenceRun(COOP.x - COOP.w / 2 - 2, COOP.z - COOP.d / 2, COOP.x - COOP.w / 2 - 2, COOP.z + COOP.d / 2, 8, 3);
  fenceRun(COOP.x - COOP.w / 2 - 2, COOP.z + COOP.d / 2, ADMIN.x - 4, COOP.z + COOP.d / 2, 6, 2);

  // Extra transformer clutter inside switchyard
  for (let i = 0; i < 5; i++) {
    const x = S.x - 24 + (i % 5) * 12;
    const z = S.z + ((i % 2) * 14 - 7);
    addBox(ctx, mats, 'oxide', x, GROUND_Y, z, 4.2, 3.6, 3.2);
    addBox(ctx, mats, 'galv', x, GROUND_Y + 3.6, z, 4.4, 0.25, 3.4);
    addCyl(ctx, mats, 'rustHot', x + 1.6, GROUND_Y + 3.8, z, 0.55, 0.55, 0.9, { seg: 8 });
  }

  // Duct/pipe spurs off PIPE_RACK toward turbine & dump
  const R = PIPE_RACK;
  addBox(ctx, mats, 'oxideDark', (R.x1 + TURBINE.x) / 2, GROUND_Y + 6.5, (R.z1 + TURBINE.z) / 2,
    Math.abs(TURBINE.x - R.x1) * 0.85, 0.85, 0.85);
  addBox(ctx, mats, 'oxide', (R.x1 + DUMP_CANOPY.x) / 2, GROUND_Y + 4.2, (R.z0 + DUMP_CANOPY.z) / 2,
    0.7, 0.7, Math.abs(DUMP_CANOPY.z - R.z0) * 0.75);
  // Cut tip hazard only
  addBox(ctx, mats, 'warnYellow', TURBINE.x - TURBINE.w / 2 - 0.5, GROUND_Y + 6.2, TURBINE.z, 0.35, 0.35, 0.35, { collide: false });

  // Cooling fill manifolds at T0 / T1 bases
  for (const ti of [0, 1]) {
    const t = TOWER_SITES[ti];
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.4;
      const px = t.x + Math.cos(a) * (t.baseR * 0.55);
      const pz = t.z + Math.sin(a) * (t.baseR * 0.55);
      addCyl(ctx, mats, 'rustCool', px, GROUND_Y, pz, 0.55, 0.65, 3.2, { seg: 10 });
      addCyl(ctx, mats, 'rustHot', px, GROUND_Y + 3.2, pz, 0.85, 0.85, 0.35, { seg: 10 }); // flange disc
    }
    // Radial header
    addBox(ctx, mats, 'oxideDark', t.x, GROUND_Y + 1.2, t.z + t.baseR * 0.35, t.baseR * 0.7, 0.7, 0.7);
  }

  // Gravel berm ring at containment (chunky boxes)
  const C = CONTAINMENT;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const bx = C.x + Math.cos(a) * (C.r + 6);
    const bz = C.z + Math.sin(a) * (C.r + 6);
    addBox(ctx, mats, 'soil', bx, GROUND_Y, bz, 4.5, 1.4, 2.2, { rotY: -a });
  }

  // 3 steel bins near elevators
  const SB = STEEL_BINS;
  for (let i = 0; i < (SB.n || 3); i++) {
    const x = SB.x + (i - 1) * 7;
    addCyl(ctx, mats, 'galv', x, GROUND_Y, SB.z, 2.6, 2.6, 8.5, { seg: 16 });
    addCyl(ctx, mats, 'oxide', x, GROUND_Y + 8.5, SB.z, 2.7, 0.4, 1.0, { seg: 12 });
  }

  // Optional turbine inlet hoods
  for (let i = 0; i < 3; i++) {
    const x = TURBINE.x - 16 + i * 16;
    addBox(ctx, mats, 'oxideDark', x, GROUND_Y + 6.5, TURBINE.z - TURBINE.d / 2 - 1.5, 6, 2.2, 3.5);
  }
  // Truck scale under dump canopy
  addBox(ctx, mats, 'concretePad', DUMP_CANOPY.x, GROUND_Y, DUMP_CANOPY.z, 10, 0.35, 4);
  addBox(ctx, mats, 'steel', DUMP_CANOPY.x, GROUND_Y + 0.35, DUMP_CANOPY.z, 9.5, 0.12, 3.6);
}
