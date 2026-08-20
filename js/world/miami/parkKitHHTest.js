// Headless checks for the Miami H-park kit (381 kit +17 m).
// One file for the rest of the live G-park kit on the 398/96 hull.
// Same gardenBenchGeom / boardwalkGateGeom / gardenPathGeom.
// No three.js, no game state. Not leftoverLot. Not foliage.
// Not leftoverLotDirtGeom. Not a 4.2 m slab. Walks stay 1.6 m.
//
//   node ./tools/run-miami-park-kit-hh-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_Y, GATE_HALF_X, GATE_HALF_Z, GATE_POST_H, GATE_POST_R,
  GARDEN_BENCH_X, GARDEN_BENCH_Z, GARDEN_BENCH_W, GARDEN_BENCH_DEPTH,
  GARDEN_BENCH_SEAT_H, GARDEN_BENCH_BACK_H, GARDEN_BENCH_UNDER_CLEAR,
  GARDEN_BENCH_SLAT, GARDEN_BENCH_COLLIDER_PAD,
  GARDEN_PATH_X0, GARDEN_PATH_X1, GARDEN_PATH_Z, GARDEN_PATH_Z0, GARDEN_PATH_Z1,
  GARDEN_PATH_W, GARDEN_PATH_SLAB_MIN, GARDEN_PATH_SLAB_MAX,
  GARDEN_PATH_JOINT_MIN, GARDEN_PATH_JOINT_MAX, GARDEN_PATH_HULL_COLLIDER,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z,
  LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z,
  LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z,
  LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z,
  LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z, LEFTOVER_LOT_F_X0, LEFTOVER_LOT_F_X1,
  LEFTOVER_LOT_F_Z0, LEFTOVER_LOT_F_Z1,
  LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z, LEFTOVER_LOT_G_X0, LEFTOVER_LOT_G_X1,
  LEFTOVER_LOT_G_Z0, LEFTOVER_LOT_G_Z1,
  LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z, LEFTOVER_LOT_H_X0, LEFTOVER_LOT_H_X1,
  LEFTOVER_LOT_H_Z0, LEFTOVER_LOT_H_Z1,
  PARK_BENCH_X, PARK_BENCH_Z, PARK_BENCH_YAW, PARK_BENCH_W,
  PARK_BENCH_W_X, PARK_BENCH_W_Z,
  PARK_BENCH_E_X, PARK_BENCH_E_Z,
  PARK_BENCH_EE_X, PARK_BENCH_EE_Z, PARK_BENCH_EE_YAW,
  PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z,
  PARK_BENCH_EE_E_X, PARK_BENCH_EE_E_Z,
  PARK_BENCH_FF_X, PARK_BENCH_FF_Z, PARK_BENCH_FF_YAW,
  PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z,
  PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z,
  PARK_BENCH_GG_X, PARK_BENCH_GG_Z, PARK_BENCH_GG_YAW,
  PARK_BENCH_GG_W_X, PARK_BENCH_GG_W_Z,
  PARK_BENCH_GG_E_X, PARK_BENCH_GG_E_Z,
  PARK_BENCH_HH_X, PARK_BENCH_HH_Z, PARK_BENCH_HH_YAW, PARK_BENCH_HH_W,
  PARK_BENCH_HH_DEPTH, PARK_BENCH_HH_SEAT_H, PARK_BENCH_HH_BACK_H,
  PARK_BENCH_HH_UNDER_CLEAR,
  PARK_BENCH_HH_X0, PARK_BENCH_HH_X1, PARK_BENCH_HH_Z0, PARK_BENCH_HH_Z1,
  PARK_BENCH_HH_W_X, PARK_BENCH_HH_W_Z, PARK_BENCH_HH_W_YAW, PARK_BENCH_HH_W_W,
  PARK_BENCH_HH_W_X0, PARK_BENCH_HH_W_X1, PARK_BENCH_HH_W_Z0, PARK_BENCH_HH_W_Z1,
  PARK_BENCH_HH_E_X, PARK_BENCH_HH_E_Z, PARK_BENCH_HH_E_YAW, PARK_BENCH_HH_E_W,
  PARK_BENCH_HH_E_X0, PARK_BENCH_HH_E_X1, PARK_BENCH_HH_E_Z0, PARK_BENCH_HH_E_Z1,
  PARK_WALK_X0, PARK_WALK_X1, PARK_WALK_Z,
  PARK_WALK_E_X0, PARK_WALK_E_X1, PARK_WALK_E_Z,
  PARK_WALK_NS_X, PARK_WALK_NS_Z,
  PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z,
  PARK_WALK_EE_X0, PARK_WALK_EE_X1, PARK_WALK_EE_Z, PARK_WALK_EE_W,
  PARK_WALK_EE_Z0, PARK_WALK_EE_Z1, PARK_WALK_EE_X, PARK_WALK_EE_LEN,
  PARK_WALK_EE_W_X0, PARK_WALK_EE_W_X1, PARK_WALK_EE_W_Z,
  PARK_WALK_EE_E_X0, PARK_WALK_EE_E_X1, PARK_WALK_EE_E_Z,
  PARK_WALK_FF_X0, PARK_WALK_FF_X1, PARK_WALK_FF_Z, PARK_WALK_FF_W,
  PARK_WALK_FF_Z0, PARK_WALK_FF_Z1, PARK_WALK_FF_X, PARK_WALK_FF_LEN,
  PARK_WALK_FF_W_X0, PARK_WALK_FF_W_X1, PARK_WALK_FF_W_Z,
  PARK_WALK_FF_E_X0, PARK_WALK_FF_E_X1, PARK_WALK_FF_E_Z,
  PARK_WALK_GG_X0, PARK_WALK_GG_X1, PARK_WALK_GG_Z, PARK_WALK_GG_W,
  PARK_WALK_GG_Z0, PARK_WALK_GG_Z1, PARK_WALK_GG_X, PARK_WALK_GG_LEN,
  PARK_WALK_GG_W_X0, PARK_WALK_GG_W_X1, PARK_WALK_GG_W_Z,
  PARK_WALK_GG_E_X0, PARK_WALK_GG_E_X1, PARK_WALK_GG_E_Z,
  PARK_WALK_HH_X0, PARK_WALK_HH_X1, PARK_WALK_HH_Z, PARK_WALK_HH_W,
  PARK_WALK_HH_Z0, PARK_WALK_HH_Z1, PARK_WALK_HH_X, PARK_WALK_HH_LEN,
  PARK_WALK_HH_W_X0, PARK_WALK_HH_W_X1, PARK_WALK_HH_W_Z, PARK_WALK_HH_W_W,
  PARK_WALK_HH_W_Z0, PARK_WALK_HH_W_Z1, PARK_WALK_HH_W_X, PARK_WALK_HH_W_LEN,
  PARK_WALK_HH_E_X0, PARK_WALK_HH_E_X1, PARK_WALK_HH_E_Z, PARK_WALK_HH_E_W,
  PARK_WALK_HH_E_Z0, PARK_WALK_HH_E_Z1, PARK_WALK_HH_E_X, PARK_WALK_HH_E_LEN,
  PARK_PERGOLA_X, PARK_PERGOLA_Z,
  PARK_PERGOLA_EE_X, PARK_PERGOLA_EE_Z,
  PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z,
  PARK_PERGOLA_GG_X, PARK_PERGOLA_GG_Z,
  PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z, PARK_PERGOLA_HH_OPEN_H, PARK_PERGOLA_HH_FLY,
  PARK_PERGOLA_HH_HALF_X, PARK_PERGOLA_HH_HALF_Z, PARK_PERGOLA_HH_POST_H,
  PARK_PERGOLA_HH_W, PARK_PERGOLA_HH_D, PARK_PERGOLA_HH_AABB,
  PARK_PERGOLA_HH_X0, PARK_PERGOLA_HH_X1, PARK_PERGOLA_HH_Z0, PARK_PERGOLA_HH_Z1,
  PARK_PERGOLA_HH_COLLIDER_PAD,
  POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D,
  POCKET_PARK_X0, POCKET_PARK_X1, POCKET_PARK_Z0, POCKET_PARK_Z1,
  POCKET_PARK_COVER, POCKET_PARK_INSTANCES_MIN, POCKET_PARK_INSTANCES_MAX,
  POCKET_PARK_E_X, POCKET_PARK_E_Z, POCKET_PARK_E_X0, POCKET_PARK_E_X1,
  POCKET_PARK_E_Z0, POCKET_PARK_E_Z1,
  POCKET_PARK_E_INSTANCES_MIN, POCKET_PARK_E_INSTANCES_MAX,
  POCKET_PARK_F_X, POCKET_PARK_F_Z, POCKET_PARK_F_W, POCKET_PARK_F_D,
  POCKET_PARK_F_X0, POCKET_PARK_F_X1, POCKET_PARK_F_Z0, POCKET_PARK_F_Z1,
  POCKET_PARK_F_INSTANCES_MIN, POCKET_PARK_F_INSTANCES_MAX,
  POCKET_PARK_G_X, POCKET_PARK_G_Z, POCKET_PARK_G_W, POCKET_PARK_G_D,
  POCKET_PARK_G_X0, POCKET_PARK_G_X1, POCKET_PARK_G_Z0, POCKET_PARK_G_Z1,
  POCKET_PARK_G_INSTANCES_MIN, POCKET_PARK_G_INSTANCES_MAX,
  POCKET_PARK_H_X, POCKET_PARK_H_Z, POCKET_PARK_H_W, POCKET_PARK_H_D,
  POCKET_PARK_H_X0, POCKET_PARK_H_X1, POCKET_PARK_H_Z0, POCKET_PARK_H_Z1,
  POCKET_PARK_H_INSTANCES_MIN, POCKET_PARK_H_INSTANCES_MAX,
  LEFTOVER_GRASS_X0, LEFTOVER_GRASS_X1, LEFTOVER_GRASS_Z0, LEFTOVER_GRASS_Z1,
  WAREHOUSE_X, WAREHOUSE_Z,
  FLY_VOIDS, flyColliderShapes,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, inReserved, reservedOverlap, streetOverlap, groundHeight,
  leftoverLotGeom, pocketParkHull, pocketParkPlannedCount, pocketParkDrop,
  pocketParkRejected,
  gardenPathGeom, gardenPathGrassHull, gardenPathSlabs, gardenPathPlantSpots,
  gardenPathColliderShapes, gardenPathRejected,
  inGardenPath, inGardenPathSlab, gardenPathSlabOverlap,
  gardenBenchGeom, gardenBenchParts, gardenBenchVoids, gardenBenchColliderShapes,
  gardenBenchRejected, inGardenBench,
  inLeftoverLotReserved, leftoverLotOverlap,
  inWarehouseReserved, warehouseOverlap, inHelipadReserved,
  boardwalkGateGeom, boardwalkGateRejected, boardwalkGateVoid, inFlyVoid,
} from './constants.js';
import { tessellateHull, tryPlace } from './planting.js';

const here = dirname(fileURLToPath(import.meta.url));

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

function probeBlocked(shapes, x, y, z, r) {
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    const y0 = s.y0;
    const y1 = y0 + (s.h !== undefined ? s.h : s.sy);
    if (y + r < y0 || y - r > y1) continue;
    if (s.type === 'cyl') {
      const dx = x - s.x, dz = z - s.z;
      if (Math.sqrt(dx * dx + dz * dz) < s.r + r) return s;
    } else {
      const ex = Math.abs(x - s.x) - s.sx / 2;
      const ez = Math.abs(z - s.z) - s.sz / 2;
      if (ex <= 0 && ez <= 0) return s;
      const gx = Math.max(ex, 0), gz = Math.max(ez, 0);
      if (Math.sqrt(gx * gx + gz * gz) < r) return s;
    }
  }
  return null;
}

function placePocketPark(ctx, cx, cz) {
  const hull = pocketParkHull(cx, cz);
  const cells = tessellateHull(hull, pocketParkPlannedCount(cx, cz));
  const placed = [];
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    if (pocketParkDrop(c.x, c.z)) {
      tryPlace(ctx, c.x, c.z);
      continue;
    }
    if (onPavement(c.x, c.z)) {
      tryPlace(ctx, c.x, c.z);
      continue;
    }
    const y = groundHeight(c.x, c.z);
    if (!y) continue;
    placed.push(c);
  }
  return { cells, placed, hull };
}

export function runMiamiParkKitHHTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const bench = gardenBenchGeom(PARK_BENCH_HH_X, PARK_BENCH_HH_Z);
  const benchW = gardenBenchGeom(PARK_BENCH_HH_W_X, PARK_BENCH_HH_W_Z);
  const benchE = gardenBenchGeom(PARK_BENCH_HH_E_X, PARK_BENCH_HH_E_Z);
  const parts = gardenBenchParts(PARK_BENCH_HH_X, PARK_BENCH_HH_Z);
  const voids = gardenBenchVoids(bench);
  const benchShapes = gardenBenchColliderShapes(bench);
  const gate = boardwalkGateGeom(PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z);
  const sash = boardwalkGateVoid(gate, 'park-pergola-hh');
  const fly = FLY_VOIDS.find((v) => v.id === 'park-pergola-hh');
  const kit = flyColliderShapes();
  const west = gardenPathGeom(PARK_WALK_HH_W_X, PARK_WALK_HH_W_Z);
  const east = gardenPathGeom(PARK_WALK_HH_E_X, PARK_WALK_HH_E_Z);
  const spine = gardenPathGeom(PARK_WALK_HH_X, PARK_WALK_HH_Z);
  const westSlabs = gardenPathSlabs(west);
  const eastSlabs = gardenPathSlabs(east);
  const lastWest = westSlabs.reduce((a, s) => (!a || s.x1 > a.x1 ? s : a), null);
  const lastEast = eastSlabs.reduce((a, s) => (!a || s.x1 > a.x1 ? s : a), null);
  const parkH = pocketParkHull(POCKET_PARK_H_X, POCKET_PARK_H_Z);
  const fieldH = placePocketPark(ctx, POCKET_PARK_H_X, POCKET_PARK_H_Z);
  const fieldG = placePocketPark(ctx, POCKET_PARK_G_X, POCKET_PARK_G_Z);
  const fieldF = placePocketPark(ctx, POCKET_PARK_F_X, POCKET_PARK_F_Z);
  const fieldE = placePocketPark(ctx, POCKET_PARK_E_X, POCKET_PARK_E_Z);
  const field276 = placePocketPark(ctx, POCKET_PARK_X, POCKET_PARK_Z);
  const plannedH = pocketParkPlannedCount(POCKET_PARK_H_X, POCKET_PARK_H_Z);

  // ---- signed cells (Desi); 381 kit +17 m -------------------------------
  ok('H-park bench is signed 398 / 94.4',
    PARK_BENCH_HH_X === 398 && PARK_BENCH_HH_Z === 94.4
    && bench.x === 398 && bench.z === 94.4);
  ok('H-park bench is 381 kit +17 m',
    PARK_BENCH_HH_X === PARK_BENCH_GG_X + 17
    && PARK_BENCH_HH_Z === PARK_BENCH_GG_Z
    && PARK_BENCH_GG_X === 381);
  ok('0.8 m is center-to-spine of HH z0=95.2',
    PARK_WALK_HH_Z0 === 95.2
    && Math.abs(PARK_WALK_HH_Z0 - PARK_BENCH_HH_Z - 0.8) < 1e-9);
  ok('H-park bench yaw faces +Z toward z=96',
    PARK_BENCH_HH_YAW === 0 && PARK_BENCH_HH_YAW === PARK_BENCH_GG_YAW
    && bench.yaw === 0 && bench.yaw !== PARK_BENCH_YAW);
  ok('H-park bench is the same 1.8 m 3-seat kit',
    PARK_BENCH_HH_W === 1.8 && PARK_BENCH_HH_W === GARDEN_BENCH_W
    && PARK_BENCH_HH_W === PARK_BENCH_W && bench.w === GARDEN_BENCH_W);
  ok('H-park bench seat / depth / back / under-clear match the kit',
    PARK_BENCH_HH_SEAT_H === GARDEN_BENCH_SEAT_H
    && PARK_BENCH_HH_DEPTH === GARDEN_BENCH_DEPTH
    && PARK_BENCH_HH_BACK_H === GARDEN_BENCH_BACK_H
    && PARK_BENCH_HH_UNDER_CLEAR === GARDEN_BENCH_UNDER_CLEAR
    && PARK_BENCH_HH_X0 === 397.1 && PARK_BENCH_HH_X1 === 398.9);
  ok('H-park bench sits on the 398/96 hull',
    PARK_BENCH_HH_X0 > POCKET_PARK_H_X0 && PARK_BENCH_HH_X1 < POCKET_PARK_H_X1
    && PARK_BENCH_HH_Z0 > POCKET_PARK_H_Z0 && PARK_BENCH_HH_Z1 < POCKET_PARK_H_Z1
    && parkH.x === 398 && parkH.z === 96);

  ok('H-park pergola is signed 398 / 98.5',
    PARK_PERGOLA_HH_X === 398 && PARK_PERGOLA_HH_Z === 98.5
    && gate.x === 398 && gate.z === 98.5);
  ok('H-park pergola is 381 kit +17 m',
    PARK_PERGOLA_HH_X === PARK_PERGOLA_GG_X + 17
    && PARK_PERGOLA_HH_Z === PARK_PERGOLA_GG_Z);
  ok('H-park pergola opening is 2.20 m, fly +X',
    PARK_PERGOLA_HH_OPEN_H === 2.20
    && PARK_PERGOLA_HH_OPEN_H === GATE_POST_H
    && PARK_PERGOLA_HH_POST_H === GATE_POST_H
    && PARK_PERGOLA_HH_FLY === '+X' && gate.fly === '+X');
  ok('H-park pergola half-span 1.16 stays inside 100 / off spine z1=96.8',
    PARK_PERGOLA_HH_HALF_Z === GATE_HALF_Z && GATE_HALF_Z === 1.16
    && PARK_PERGOLA_HH_HALF_X === GATE_HALF_X
    && Math.abs(PARK_PERGOLA_HH_Z0 - 97.34) < 1e-9
    && Math.abs(PARK_PERGOLA_HH_Z1 - 99.66) < 1e-9
    && PARK_PERGOLA_HH_Z1 < POCKET_PARK_H_Z1
    && Math.abs(POCKET_PARK_H_Z1 - PARK_PERGOLA_HH_Z1 - 0.34) < 1e-9
    && Math.abs(PARK_PERGOLA_HH_Z0 - PARK_WALK_HH_Z1 - 0.54) < 1e-9
    && PARK_PERGOLA_HH_Z0 > PARK_WALK_HH_Z1);

  ok('west walk is signed 390→396.2 / z=98.5',
    PARK_WALK_HH_W_X0 === 390 && PARK_WALK_HH_W_X1 === 396.2
    && PARK_WALK_HH_W_Z === 98.5 && PARK_WALK_HH_W_X === 393.1
    && west.x0 === 390 && west.x1 === 396.2 && west.z === 98.5);
  ok('west walk is 1.8 m west of 398, 381 kit +17 m',
    Math.abs(398 - PARK_WALK_HH_W_X1 - 1.8) < 1e-9
    && PARK_WALK_HH_W_X0 === PARK_WALK_GG_W_X0 + 17
    && PARK_WALK_HH_W_X1 === PARK_WALK_GG_W_X1 + 17
    && PARK_WALK_HH_W_Z === PARK_WALK_GG_W_Z);
  ok('west walk width is 1.6 m, last slab in 396.2',
    PARK_WALK_HH_W_W === 1.6 && PARK_WALK_HH_W_W === GARDEN_PATH_W
    && PARK_WALK_HH_W_W === PARK_WALK_HH_W
    && PARK_WALK_HH_W_LEN === 6.2
    && PARK_WALK_HH_W_Z0 === 97.7 && PARK_WALK_HH_W_Z1 === 99.3
    && westSlabs.every((s) => s.x1 <= 396.2 + 1e-9)
    && lastWest && lastWest.x1 <= 396.2 + 1e-9);
  ok('west walk sash stays empty (stops short of posts)',
    PARK_WALK_HH_W_X1 === 396.2
    && PARK_WALK_HH_W_X1 < (398 - GATE_HALF_Z)
    && PARK_WALK_HH_W_X1 < PARK_PERGOLA_HH_X0
    && PARK_WALK_HH_W_X1 < sash.x0
    && Math.abs((398 - GATE_HALF_Z) - 396.84) < 1e-9);

  ok('east walk is signed 399.8→406 / z=98.5',
    PARK_WALK_HH_E_X0 === 399.8 && PARK_WALK_HH_E_X1 === 406
    && PARK_WALK_HH_E_Z === 98.5 && PARK_WALK_HH_E_X === 402.9
    && east.x0 === 399.8 && east.x1 === 406 && east.z === 98.5);
  ok('east walk is 1.8 m east of 398, 381 kit +17 m',
    Math.abs(PARK_WALK_HH_E_X0 - (398 + 1.8)) < 1e-9
    && PARK_WALK_HH_E_X0 === PARK_WALK_GG_E_X0 + 17
    && PARK_WALK_HH_E_X1 === PARK_WALK_GG_E_X1 + 17
    && PARK_WALK_HH_E_Z === PARK_WALK_GG_E_Z);
  ok('east walk width is 1.6 m, last slab ≤ 406',
    PARK_WALK_HH_E_W === 1.6 && PARK_WALK_HH_E_W === GARDEN_PATH_W
    && PARK_WALK_HH_E_LEN === 6.2
    && PARK_WALK_HH_E_Z0 === 97.7 && PARK_WALK_HH_E_Z1 === 99.3
    && eastSlabs.every((s) => s.x1 <= 406 + 1e-9)
    && lastEast && lastEast.x1 <= 406 + 1e-9
    && east.x1 === 406);
  ok('east walk sash stays empty (starts east of posts)',
    PARK_WALK_HH_E_X0 === 399.8
    && PARK_WALK_HH_E_X0 > PARK_PERGOLA_HH_X1
    && Math.abs(PARK_WALK_HH_E_X0 - PARK_PERGOLA_HH_X1 - 0.65) < 1e-9
    && PARK_WALK_HH_E_X0 > sash.x1
    && Math.abs((398 + GATE_HALF_X) - 399.15) < 1e-9);

  ok('west bench is signed 391.5 / 94.4 (−6.5 m mirror)',
    PARK_BENCH_HH_W_X === 391.5 && PARK_BENCH_HH_W_Z === 94.4
    && Math.abs(PARK_BENCH_HH_X - PARK_BENCH_HH_W_X - 6.5) < 1e-9
    && PARK_BENCH_HH_W_X === PARK_BENCH_GG_W_X + 17
    && benchW.x === 391.5 && benchW.z === 94.4
    && PARK_BENCH_HH_W_X0 === 390.6 && PARK_BENCH_HH_W_X1 === 392.4
    && PARK_BENCH_HH_W_YAW === 0);
  ok('east bench is signed 404.5 / 94.4 (+6.5), x1=405.4 stays in 406',
    PARK_BENCH_HH_E_X === 404.5 && PARK_BENCH_HH_E_Z === 94.4
    && Math.abs(PARK_BENCH_HH_E_X - PARK_BENCH_HH_X - 6.5) < 1e-9
    && Math.abs(PARK_BENCH_HH_E_X + PARK_BENCH_HH_W_X - 2 * PARK_BENCH_HH_X) < 1e-9
    && PARK_BENCH_HH_E_X === PARK_BENCH_GG_E_X + 17
    && benchE.x === 404.5 && benchE.z === 94.4
    && PARK_BENCH_HH_E_X0 === 403.6 && PARK_BENCH_HH_E_X1 === 405.4
    && PARK_BENCH_HH_E_X1 < 406 && POCKET_PARK_H_X1 === 406
    && PARK_BENCH_HH_E_YAW === 0);

  // ---- stay-puts --------------------------------------------------------
  ok('lots A–H stay 258 / 295 / 313 / 330 / 347 / 364 / 381 / 398 at z=84',
    leftoverLotGeom().x0 === 251
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84
    && LEFTOVER_LOT_D_X === 330 && LEFTOVER_LOT_D_Z === 84
    && LEFTOVER_LOT_E_X === 347 && LEFTOVER_LOT_E_Z === 84
    && LEFTOVER_LOT_F_X === 364 && LEFTOVER_LOT_F_Z === 84
    && LEFTOVER_LOT_F_X0 === 357 && LEFTOVER_LOT_F_X1 === 371
    && LEFTOVER_LOT_F_Z0 === 78 && LEFTOVER_LOT_F_Z1 === 90
    && LEFTOVER_LOT_G_X === 381 && LEFTOVER_LOT_G_Z === 84
    && LEFTOVER_LOT_G_X0 === 374 && LEFTOVER_LOT_G_X1 === 388
    && LEFTOVER_LOT_G_Z0 === 78 && LEFTOVER_LOT_G_Z1 === 90
    && LEFTOVER_LOT_H_X === 398 && LEFTOVER_LOT_H_Z === 84
    && LEFTOVER_LOT_H_X0 === 391 && LEFTOVER_LOT_H_X1 === 405
    && LEFTOVER_LOT_H_Z0 === 78 && LEFTOVER_LOT_H_Z1 === 90);
  ok('276 park / 347 park / F hull / G hull / H hull stay',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_X0 === 268 && POCKET_PARK_X1 === 284
    && POCKET_PARK_Z0 === 88 && POCKET_PARK_Z1 === 96
    && POCKET_PARK_E_X === 347 && POCKET_PARK_E_Z === 96
    && POCKET_PARK_E_X0 === 339 && POCKET_PARK_E_X1 === 355
    && POCKET_PARK_F_X === 364 && POCKET_PARK_F_Z === 96
    && POCKET_PARK_F_X0 === 356 && POCKET_PARK_F_X1 === 372
    && POCKET_PARK_F_W === 16 && POCKET_PARK_F_D === 8
    && POCKET_PARK_G_X === 381 && POCKET_PARK_G_Z === 96
    && POCKET_PARK_G_X0 === 373 && POCKET_PARK_G_X1 === 389
    && POCKET_PARK_G_W === 16 && POCKET_PARK_G_D === 8
    && POCKET_PARK_H_X === 398 && POCKET_PARK_H_Z === 96
    && POCKET_PARK_H_X0 === 390 && POCKET_PARK_H_X1 === 406
    && POCKET_PARK_H_W === 16 && POCKET_PARK_H_D === 8);
  ok('HH spine stays 390→406 / z=96',
    PARK_WALK_HH_X0 === 390 && PARK_WALK_HH_X1 === 406
    && PARK_WALK_HH_Z === 96 && PARK_WALK_HH_W === 1.6
    && PARK_WALK_HH_LEN === 16 && PARK_WALK_HH_X === 398
    && spine.x0 === 390 && spine.x1 === 406 && spine.z === 96);
  ok('GG spine and G kit stay',
    PARK_WALK_GG_X0 === 373 && PARK_WALK_GG_X1 === 389
    && PARK_WALK_GG_Z === 96 && PARK_WALK_GG_LEN === 16
    && PARK_WALK_GG_W_X0 === 373 && PARK_WALK_GG_W_X1 === 379.2
    && PARK_WALK_GG_W_Z === 98.5
    && PARK_WALK_GG_E_X0 === 382.8 && PARK_WALK_GG_E_X1 === 389
    && PARK_WALK_GG_E_Z === 98.5
    && PARK_BENCH_GG_X === 381 && PARK_BENCH_GG_Z === 94.4
    && PARK_BENCH_GG_W_X === 374.5 && PARK_BENCH_GG_E_X === 387.5
    && PARK_PERGOLA_GG_X === 381 && PARK_PERGOLA_GG_Z === 98.5);
  ok('FF spine and F kit stay',
    PARK_WALK_FF_X0 === 356 && PARK_WALK_FF_X1 === 372
    && PARK_WALK_FF_Z === 96 && PARK_WALK_FF_LEN === 16
    && PARK_WALK_FF_W_X0 === 356 && PARK_WALK_FF_W_X1 === 362.2
    && PARK_WALK_FF_W_Z === 98.5
    && PARK_WALK_FF_E_X0 === 365.8 && PARK_WALK_FF_E_X1 === 372
    && PARK_WALK_FF_E_Z === 98.5
    && PARK_BENCH_FF_X === 364 && PARK_BENCH_FF_Z === 94.4
    && PARK_BENCH_FF_W_X === 357.5 && PARK_BENCH_FF_E_X === 370.5
    && PARK_PERGOLA_FF_X === 364 && PARK_PERGOLA_FF_Z === 98.5);
  ok('EE spine and 276/347 kit stay',
    PARK_WALK_EE_X0 === 339 && PARK_WALK_EE_X1 === 355
    && PARK_WALK_EE_Z === 96 && PARK_WALK_EE_LEN === 16
    && PARK_WALK_EE_W_X0 === 339 && PARK_WALK_EE_W_X1 === 345.2
    && PARK_WALK_EE_W_Z === 98.5
    && PARK_WALK_EE_E_X0 === 348.8 && PARK_WALK_EE_E_X1 === 355
    && PARK_WALK_EE_E_Z === 98.5
    && PARK_BENCH_EE_X === 347 && PARK_BENCH_EE_Z === 94.4
    && PARK_BENCH_EE_W_X === 340.5 && PARK_BENCH_EE_E_X === 353.5
    && PARK_PERGOLA_EE_X === 347 && PARK_PERGOLA_EE_Z === 98.5
    && PARK_PERGOLA_X === 276 && PARK_PERGOLA_Z === 94
    && PARK_BENCH_X === 276 && PARK_BENCH_Z === 90
    && PARK_WALK_X0 === 268 && PARK_WALK_X1 === 274.2 && PARK_WALK_Z === 94
    && PARK_WALK_E_X0 === 277.8 && PARK_WALK_E_X1 === 284 && PARK_WALK_E_Z === 94
    && PARK_WALK_NS_X === 272 && PARK_WALK_NS_E_X === 280
    && GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284 && GARDEN_PATH_Z === 84);
  ok('does not merge with G-park 389',
    PARK_WALK_GG_X1 === 389 && PARK_WALK_HH_X0 === 390
    && POCKET_PARK_G_X1 === 389 && POCKET_PARK_H_X0 === 390
    && PARK_WALK_HH_W_X0 === 390 && PARK_WALK_HH_W_X0 > 389);

  // ---- leftover 8000–11000; 11k ceiling; no backfill --------------------
  ok('three walks eat ~45 m²',
    Math.abs(PARK_WALK_HH_LEN * PARK_WALK_HH_W
      + PARK_WALK_HH_W_LEN * PARK_WALK_HH_W_W
      + PARK_WALK_HH_E_LEN * PARK_WALK_HH_E_W - 45.44) < 1e-9);
  ok('H leftover after the walks is 8000–11000 and < 12800',
    fieldH.placed.length >= POCKET_PARK_H_INSTANCES_MIN
    && fieldH.placed.length <= POCKET_PARK_H_INSTANCES_MAX
    && POCKET_PARK_H_INSTANCES_MIN === 8000
    && POCKET_PARK_H_INSTANCES_MAX === 11000
    && fieldH.placed.length < 12800
    && fieldH.placed.length !== 12800
    && plannedH === 12800
    && POCKET_PARK_COVER === 10,
    `placedH=${fieldH.placed.length} plannedH=${plannedH}`);
  ok('did not backfill past 11k',
    fieldH.placed.length <= 11000
    && fieldH.placed.length < plannedH
    && fieldH.cells.length === plannedH);
  ok('G leftover stays 8000–11000',
    fieldG.placed.length >= POCKET_PARK_G_INSTANCES_MIN
    && fieldG.placed.length <= POCKET_PARK_G_INSTANCES_MAX
    && POCKET_PARK_G_INSTANCES_MIN === 8000
    && POCKET_PARK_G_INSTANCES_MAX === 11000);
  ok('F leftover stays 8000–11000',
    fieldF.placed.length >= POCKET_PARK_F_INSTANCES_MIN
    && fieldF.placed.length <= POCKET_PARK_F_INSTANCES_MAX
    && POCKET_PARK_F_INSTANCES_MIN === 8000
    && POCKET_PARK_F_INSTANCES_MAX === 11000);
  ok('E leftover stays 8000–11000',
    fieldE.placed.length >= POCKET_PARK_E_INSTANCES_MIN
    && fieldE.placed.length <= POCKET_PARK_E_INSTANCES_MAX
    && POCKET_PARK_E_INSTANCES_MIN === 8000
    && POCKET_PARK_E_INSTANCES_MAX === 11000);
  ok('276 leftover stays 8–11k',
    field276.placed.length >= POCKET_PARK_INSTANCES_MIN
    && field276.placed.length <= POCKET_PARK_INSTANCES_MAX
    && POCKET_PARK_INSTANCES_MIN === 8000
    && POCKET_PARK_INSTANCES_MAX === 11000);

  // ---- reserved / keepout / reject-or-drop ------------------------------
  ok('cells are reserved keepouts on leftover-city grade',
    inReserved(PARK_BENCH_HH_X, PARK_BENCH_HH_Z)
    && inKeepout(PARK_BENCH_HH_X, PARK_BENCH_HH_Z)
    && inReserved(PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z)
    && inKeepout(PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z)
    && inReserved(PARK_WALK_HH_W_X, PARK_WALK_HH_W_Z)
    && inKeepout(PARK_WALK_HH_W_X, PARK_WALK_HH_W_Z)
    && inReserved(PARK_WALK_HH_E_X, PARK_WALK_HH_E_Z)
    && inKeepout(PARK_WALK_HH_E_X, PARK_WALK_HH_E_Z)
    && inReserved(PARK_BENCH_HH_W_X, PARK_BENCH_HH_W_Z)
    && inReserved(PARK_BENCH_HH_E_X, PARK_BENCH_HH_E_Z)
    && groundHeight(PARK_BENCH_HH_X, PARK_BENCH_HH_Z) === CITY_Y
    && !onPavement(PARK_BENCH_HH_X, PARK_BENCH_HH_Z)
    && !onBoardwalk(PARK_BENCH_HH_X, PARK_BENCH_HH_Z)
    && !onRoadway(PARK_BENCH_HH_Z)
    && !onCrossStreet(PARK_BENCH_HH_X, PARK_BENCH_HH_Z)
    && !onSidewalk(PARK_BENCH_HH_X, PARK_BENCH_HH_Z));
  ok('signed cells are not rejected',
    !gardenBenchRejected(PARK_BENCH_HH_X, PARK_BENCH_HH_Z)
    && !gardenBenchRejected(PARK_BENCH_HH_W_X, PARK_BENCH_HH_W_Z)
    && !gardenBenchRejected(PARK_BENCH_HH_E_X, PARK_BENCH_HH_E_Z)
    && !boardwalkGateRejected(PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z)
    && !gardenPathRejected(PARK_WALK_HH_W_X, PARK_WALK_HH_W_Z)
    && !gardenPathRejected(PARK_WALK_HH_E_X, PARK_WALK_HH_E_Z)
    && !gardenPathRejected(PARK_WALK_HH_X, PARK_WALK_HH_Z)
    && !pocketParkRejected(POCKET_PARK_H_X, POCKET_PARK_H_Z));
  ok('tryPlace drops the reserved kit',
    tryPlace(ctx, PARK_BENCH_HH_X, PARK_BENCH_HH_Z) === 0
    && tryPlace(ctx, PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z) === 0
    && tryPlace(ctx, PARK_WALK_HH_W_X, PARK_WALK_HH_W_Z) === 0
    && tryPlace(ctx, PARK_WALK_HH_E_X, PARK_WALK_HH_E_Z) === 0
    && tryPlace(ctx, PARK_BENCH_HH_W_X, PARK_BENCH_HH_W_Z) === 0
    && tryPlace(ctx, PARK_BENCH_HH_E_X, PARK_BENCH_HH_E_Z) === 0);
  ok('misses leftoverLot H / G-park / helipad / 381',
    LEFTOVER_LOT_H_Z1 === 90 && PARK_BENCH_HH_Z0 > LEFTOVER_LOT_H_Z1
    && leftoverLotOverlap(PARK_BENCH_HH_X, PARK_BENCH_HH_Z,
      PARK_BENCH_HH_W, PARK_BENCH_HH_DEPTH, 0.15) === false
    && leftoverLotOverlap(POCKET_PARK_H_X, POCKET_PARK_H_Z,
      POCKET_PARK_H_W, POCKET_PARK_H_D, 0.15) === false
    && leftoverLotOverlap(PARK_WALK_HH_X, PARK_WALK_HH_Z,
      PARK_WALK_HH_LEN, PARK_WALK_HH_W, 0.15) === false
    && !inLeftoverLotReserved(PARK_BENCH_HH_X, PARK_BENCH_HH_Z)
    && !inHelipadReserved(PARK_BENCH_HH_X, PARK_BENCH_HH_Z)
    && !inWarehouseReserved(PARK_BENCH_HH_X, PARK_BENCH_HH_Z)
    && PARK_BENCH_HH_X0 > POCKET_PARK_G_X1 && POCKET_PARK_G_X1 === 389
    && PARK_WALK_HH_W_X0 > PARK_WALK_GG_X1);
  ok('benches do not kiss the HH spine or each other',
    PARK_BENCH_HH_Z1 < PARK_WALK_HH_Z0
    && PARK_BENCH_HH_W_X1 < PARK_BENCH_HH_X0
    && PARK_BENCH_HH_X1 < PARK_BENCH_HH_E_X0
    && !gardenPathSlabOverlap(PARK_BENCH_HH_X, PARK_BENCH_HH_Z,
      PARK_BENCH_HH_W, PARK_BENCH_HH_DEPTH, 0));
  ok('spine z1=96.8 is 0.9 m south of sash walks (grow-to-gap)',
    PARK_WALK_HH_Z1 === 96.8
    && PARK_WALK_HH_W_Z0 === 97.7 && PARK_WALK_HH_E_Z0 === 97.7
    && Math.abs(PARK_WALK_HH_W_Z0 - PARK_WALK_HH_Z1 - 0.9) < 1e-9
    && west.z0 > spine.z1 && east.z0 > spine.z1);

  // ---- sit-box and sash stay flyable voids ------------------------------
  ok('H-park sit-box is a void in front of the back (+Z)',
    voids.some((v) => v.id === 'gardenBench-sit' && v.kind === 'sit')
    && voids.some((v) => v.id === 'gardenBench-under' && v.kind === 'under'));
  const sit = voids.find((v) => v.id === 'gardenBench-sit');
  const under = voids.find((v) => v.id === 'gardenBench-under');
  void under;
  for (const v of voids) {
    const hit = probeBlocked(benchShapes, v.x, v.y, v.z, v.probe);
    ok(`hh ${v.id} is flyable`, !hit, hit ? `blocked by ${hit.tag}` : '');
  }
  ok('H-park sit-box faces +Z toward z=96',
    sit && sit.z > bench.z && sit.y > CITY_Y + PARK_BENCH_HH_SEAT_H);
  ok('H-park bench colliders are legs + slats + back only',
    benchShapes.every((s) => s.part === 'leg' || s.part === 'slat' || s.part === 'back')
    && parts.slats.length === 8
    && parts.slats.every((s) => Math.abs(s.sz - GARDEN_BENCH_SLAT) < 1e-9)
    && parts.backs.every((b) => b.z < bench.z));
  ok('park-pergola-hh fly void is published, sash empty',
    !!fly && fly.kind === 'kit' && fly.openH === 2.20
    && !!inFlyVoid(PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z)
    && PARK_PERGOLA_HH_AABB === false);
  const sashHit = probeBlocked(kit, sash.x, sash.y, sash.z, 0.12);
  ok('H-park pergola sash is flyable', !sashHit,
    sashHit ? `blocked by ${sashHit.tag}` : '');
  ok('walks are 0.5–0.7 m slabs + 60–100 mm joints, not 4.2 m',
    GARDEN_PATH_SLAB_MIN === 0.5 && GARDEN_PATH_SLAB_MAX === 0.7
    && GARDEN_PATH_JOINT_MIN === 0.06 && GARDEN_PATH_JOINT_MAX === 0.10
    && westSlabs.every((s) => s.sx <= 0.7 + 1e-9 && s.sz <= 0.7 + 1e-9)
    && eastSlabs.every((s) => s.sx <= 0.7 + 1e-9 && s.sz <= 0.7 + 1e-9)
    && gardenPathGrassHull(west).collider === GARDEN_PATH_HULL_COLLIDER
    && gardenPathGrassHull(east).collider === 'ground');
  const westShapes = gardenPathColliderShapes(west);
  const eastShapes = gardenPathColliderShapes(east);
  ok('walk colliders are per-slab, not a path AABB',
    westShapes.length === westSlabs.length
    && eastShapes.length === eastSlabs.length
    && !westShapes.some((s) => Math.abs(s.sx - PARK_WALK_HH_W_LEN) < 0.2)
    && !eastShapes.some((s) => Math.abs(s.sx - PARK_WALK_HH_E_LEN) < 0.2));

  // ---- kiss = drop, never nudge -----------------------------------------
  ok('drop if the kit kisses leftoverLot H / G-park / helipad / 381',
    gardenBenchRejected(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z) === true
    && gardenPathRejected(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z) === true
    && boardwalkGateRejected(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z) === true
    && gardenBenchRejected(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z) === true
    && gardenBenchRejected(430, 70) === true
    && gardenBenchRejected(WAREHOUSE_X, WAREHOUSE_Z) === true
    && gardenBenchRejected(PARK_BENCH_GG_X, PARK_BENCH_GG_Z) === false
    && gardenBenchRejected(380.1, 94.4) === true);
  ok('drop if sit-box / sash / spine is filled by a kiss',
    gardenBenchRejected(PARK_WALK_HH_X, PARK_WALK_HH_Z) === true
    && gardenPathRejected(PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z) === true
    && gardenBenchRejected(PARK_BENCH_HH_X, PARK_BENCH_HH_Z) === false
    && gardenBenchRejected(397.1, 94.4) === true
    && gardenPathRejected(PARK_WALK_HH_W_X, PARK_WALK_HH_W_Z) === false
    && gardenPathRejected(PARK_WALK_HH_E_X, PARK_WALK_HH_E_Z) === false);

  // ---- one file / shared kit; no third geom family ----------------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const benchSrc = readFileSync(join(here, 'landmarks/gardenBench.js'), 'utf8');
  const gardenSrc = readFileSync(join(here, 'landmarks/gardenPath.js'), 'utf8');
  const flySrc = readFileSync(join(here, 'landmarks/flythrough.js'), 'utf8');
  const leftover = readFileSync(join(here, 'landmarks/leftoverLot.js'), 'utf8');
  const grass = readFileSync(join(here, 'landmarks/leftoverGrass.js'), 'utf8');
  const park = readFileSync(join(here, 'landmarks/pocketPark.js'), 'utf8');
  const constants = readFileSync(join(here, 'constants.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const blades = readFileSync(join(here, 'blades.js'), 'utf8');
  const preview = readFileSync(join(here, '../../../preview.html'), 'utf8');
  const follow = readFileSync(join(here, 'follow.js'), 'utf8');
  const checkpoints = readFileSync(join(here, 'checkpoints.js'), 'utf8');
  const quad = readFileSync(join(here, '../../physics/quad.js'), 'utf8');

  ok('H-park kit reuses gardenBenchGeom / boardwalkGateGeom / gardenPathGeom',
    benchSrc.includes('gardenBenchGeom(PARK_BENCH_HH_X, PARK_BENCH_HH_Z)')
    && benchSrc.includes('gardenBenchGeom(PARK_BENCH_HH_W_X, PARK_BENCH_HH_W_Z)')
    && benchSrc.includes('gardenBenchGeom(PARK_BENCH_HH_E_X, PARK_BENCH_HH_E_Z)')
    && flySrc.includes('boardwalkGateGeom(PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z)')
    && gardenSrc.includes('gardenPathGeom(PARK_WALK_HH_W_X, PARK_WALK_HH_W_Z)')
    && gardenSrc.includes('gardenPathGeom(PARK_WALK_HH_E_X, PARK_WALK_HH_E_Z)')
    && constants.includes('381 kit +17 m')
    && constants.includes('Do not merge G-park 389')
    && constants.includes('leftover ~8.2k')
    && constants.includes('11k is a ceiling')
    && constants.includes('No leftover lots on this merge')
    && constants.includes('PARK_BENCH_HH_X = 398')
    && constants.includes('PARK_PERGOLA_HH_X = 398')
    && constants.includes('PARK_WALK_HH_W_X0 = 390')
    && constants.includes('PARK_WALK_HH_E_X0 = 399.8')
    && constants.includes('PARK_BENCH_HH_W_X = 391.5')
    && constants.includes('PARK_BENCH_HH_E_X = 404.5')
    && constants.includes('POCKET_PARK_H_INSTANCES_MIN = 8000')
    && constants.includes('POCKET_PARK_H_INSTANCES_MAX = 11000')
    && constants.includes('PARK_WALK_HH_X0 = 390')
    && constants.includes('PARK_WALK_HH_X1 = 406')
    && constants.includes('PARK_WALK_HH_Z = 96'));
  ok('no new geom family / leftover lots / foliage / 4.2 m slab',
    !/export function gardenBenchHGeom/.test(constants)
    && !/export function parkPergolaHGeom/.test(constants)
    && !/export function gardenPathHGeom/.test(constants)
    && !/export function leftoverLotDirtGeom/.test(constants)
    && !/export function parkWalkHHWGeom/.test(constants)
    && !/export function parkWalkHHEGeom/.test(constants)
    && !/export function parkWalkHHGeom/.test(constants)
    && !/export function parkBenchHHGeom/.test(constants)
    && !existsSync(join(here, 'landmarks/gardenBenchH.js'))
    && !existsSync(join(here, 'landmarks/parkPergolaH.js'))
    && !existsSync(join(here, 'landmarks/gardenPathH.js'))
    && !existsSync(join(here, 'landmarks/parkWalkHHW.js'))
    && !leftover.includes('PARK_BENCH_HH_')
    && !leftover.includes('PARK_WALK_HH_W_')
    && !leftover.includes('PARK_PERGOLA_HH_')
    && !grass.includes('PARK_BENCH_HH_')
    && !park.includes('PARK_BENCH_HH_')
    && !gardenSrc.includes('4.2 m')
    && !gardenSrc.includes('Selo')
    && index.includes('buildGardenPath(ctx)')
    && index.includes('buildGardenBench(ctx)')
    && index.includes('buildFlythrough(ctx)'));
  ok('photo-mode / ACES / bloom / SSAO / colony HUD / Shackleton / Starship stay off this merge',
    !constants.includes('photo-mode') && !constants.includes('ACES')
    && !constants.includes('SSAO') && !constants.includes('Shackleton')
    && !constants.includes('Starship') && !preview.includes('PARK_BENCH_HH_')
    && !follow.includes('PARK_BENCH_HH_') && !checkpoints.includes('PARK_BENCH_HH_')
    && /const GRAVITY = 9\.81/.test(quad) && !quad.includes('PARK_BENCH_HH_')
    && planting.includes('export function tryPlace')
    && !planting.includes('PARK_BENCH_HH_')
    && blades.includes('placeBladePlan') && !blades.includes('PARK_BENCH_HH_'));
  ok('G leftover / F leftover / E leftover / 276 leftover comments stay 8–11k',
    constants.includes('G leftover stays 8000–11000')
    && constants.includes('F leftover stays 8000–11000')
    && constants.includes('E leftover stays 8000–11000')
    && POCKET_PARK_G_INSTANCES_MIN === 8000
    && POCKET_PARK_F_INSTANCES_MIN === 8000
    && POCKET_PARK_E_INSTANCES_MIN === 8000
    && POCKET_PARK_INSTANCES_MIN === 8000
    && LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0);

  if (fails.length) {
    console.error('[miami-parkKitHH] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-parkKitHH] ok', passedCount, 'checks',
      `lastEast.x1=${lastEast && lastEast.x1} placedH=${fieldH.placed.length}/${plannedH} placedG=${fieldG.placed.length} placedF=${fieldF.placed.length} placedE=${fieldE.placed.length} placed276=${field276.placed.length}`);
  }
  return {
    passed: fails.length === 0, fails, passedCount,
    lastEastX1: lastEast && lastEast.x1,
    lastWestX1: lastWest && lastWest.x1,
    placedH: fieldH.placed.length, plannedH,
    placedG: fieldG.placed.length,
    placedF: fieldF.placed.length, placedE: fieldE.placed.length,
    placed276: field276.placed.length,
  };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('parkKitHHTest.js');
if (isMain) {
  const r = runMiamiParkKitHHTests();
  if (!r.passed) process.exit(1);
}
