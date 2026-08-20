// Headless checks for the Miami F-park kit (347 kit +17 m).
// One file for the rest of the live E-park kit on the 364/96 hull.
// Same gardenBenchGeom / boardwalkGateGeom / gardenPathGeom.
// No three.js, no game state. Not leftoverLot. Not foliage.
// Not leftoverLotDirtGeom. Not a 4.2 m slab. Walks stay 1.6 m.
//
//   node ./tools/run-miami-park-kit-ff-test.mjs

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
  PARK_BENCH_X, PARK_BENCH_Z, PARK_BENCH_YAW, PARK_BENCH_W,
  PARK_BENCH_W_X, PARK_BENCH_W_Z,
  PARK_BENCH_E_X, PARK_BENCH_E_Z,
  PARK_BENCH_EE_X, PARK_BENCH_EE_Z, PARK_BENCH_EE_YAW,
  PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z,
  PARK_BENCH_EE_E_X, PARK_BENCH_EE_E_Z,
  PARK_BENCH_FF_X, PARK_BENCH_FF_Z, PARK_BENCH_FF_YAW, PARK_BENCH_FF_W,
  PARK_BENCH_FF_DEPTH, PARK_BENCH_FF_SEAT_H, PARK_BENCH_FF_BACK_H,
  PARK_BENCH_FF_UNDER_CLEAR,
  PARK_BENCH_FF_X0, PARK_BENCH_FF_X1, PARK_BENCH_FF_Z0, PARK_BENCH_FF_Z1,
  PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z, PARK_BENCH_FF_W_YAW, PARK_BENCH_FF_W_W,
  PARK_BENCH_FF_W_X0, PARK_BENCH_FF_W_X1, PARK_BENCH_FF_W_Z0, PARK_BENCH_FF_W_Z1,
  PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z, PARK_BENCH_FF_E_YAW, PARK_BENCH_FF_E_W,
  PARK_BENCH_FF_E_X0, PARK_BENCH_FF_E_X1, PARK_BENCH_FF_E_Z0, PARK_BENCH_FF_E_Z1,
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
  PARK_WALK_FF_W_X0, PARK_WALK_FF_W_X1, PARK_WALK_FF_W_Z, PARK_WALK_FF_W_W,
  PARK_WALK_FF_W_Z0, PARK_WALK_FF_W_Z1, PARK_WALK_FF_W_X, PARK_WALK_FF_W_LEN,
  PARK_WALK_FF_E_X0, PARK_WALK_FF_E_X1, PARK_WALK_FF_E_Z, PARK_WALK_FF_E_W,
  PARK_WALK_FF_E_Z0, PARK_WALK_FF_E_Z1, PARK_WALK_FF_E_X, PARK_WALK_FF_E_LEN,
  PARK_PERGOLA_X, PARK_PERGOLA_Z,
  PARK_PERGOLA_EE_X, PARK_PERGOLA_EE_Z,
  PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z, PARK_PERGOLA_FF_OPEN_H, PARK_PERGOLA_FF_FLY,
  PARK_PERGOLA_FF_HALF_X, PARK_PERGOLA_FF_HALF_Z, PARK_PERGOLA_FF_POST_H,
  PARK_PERGOLA_FF_W, PARK_PERGOLA_FF_D, PARK_PERGOLA_FF_AABB,
  PARK_PERGOLA_FF_X0, PARK_PERGOLA_FF_X1, PARK_PERGOLA_FF_Z0, PARK_PERGOLA_FF_Z1,
  PARK_PERGOLA_FF_COLLIDER_PAD,
  POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D,
  POCKET_PARK_X0, POCKET_PARK_X1, POCKET_PARK_Z0, POCKET_PARK_Z1,
  POCKET_PARK_COVER, POCKET_PARK_INSTANCES_MIN, POCKET_PARK_INSTANCES_MAX,
  POCKET_PARK_E_X, POCKET_PARK_E_Z, POCKET_PARK_E_X0, POCKET_PARK_E_X1,
  POCKET_PARK_E_Z0, POCKET_PARK_E_Z1,
  POCKET_PARK_E_INSTANCES_MIN, POCKET_PARK_E_INSTANCES_MAX,
  POCKET_PARK_F_X, POCKET_PARK_F_Z, POCKET_PARK_F_W, POCKET_PARK_F_D,
  POCKET_PARK_F_X0, POCKET_PARK_F_X1, POCKET_PARK_F_Z0, POCKET_PARK_F_Z1,
  POCKET_PARK_F_INSTANCES_MIN, POCKET_PARK_F_INSTANCES_MAX,
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

export function runMiamiParkKitFFTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const bench = gardenBenchGeom(PARK_BENCH_FF_X, PARK_BENCH_FF_Z);
  const benchW = gardenBenchGeom(PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z);
  const benchE = gardenBenchGeom(PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z);
  const parts = gardenBenchParts(PARK_BENCH_FF_X, PARK_BENCH_FF_Z);
  const voids = gardenBenchVoids(bench);
  const benchShapes = gardenBenchColliderShapes(bench);
  const gate = boardwalkGateGeom(PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z);
  const sash = boardwalkGateVoid(gate, 'park-pergola-ff');
  const fly = FLY_VOIDS.find((v) => v.id === 'park-pergola-ff');
  const kit = flyColliderShapes();
  const west = gardenPathGeom(PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z);
  const east = gardenPathGeom(PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z);
  const spine = gardenPathGeom(PARK_WALK_FF_X, PARK_WALK_FF_Z);
  const westSlabs = gardenPathSlabs(west);
  const eastSlabs = gardenPathSlabs(east);
  const lastWest = westSlabs.reduce((a, s) => (!a || s.x1 > a.x1 ? s : a), null);
  const lastEast = eastSlabs.reduce((a, s) => (!a || s.x1 > a.x1 ? s : a), null);
  const parkF = pocketParkHull(POCKET_PARK_F_X, POCKET_PARK_F_Z);
  const fieldF = placePocketPark(ctx, POCKET_PARK_F_X, POCKET_PARK_F_Z);
  const fieldE = placePocketPark(ctx, POCKET_PARK_E_X, POCKET_PARK_E_Z);
  const field276 = placePocketPark(ctx, POCKET_PARK_X, POCKET_PARK_Z);
  const plannedF = pocketParkPlannedCount(POCKET_PARK_F_X, POCKET_PARK_F_Z);

  // ---- signed cells (Desi + Reesy); 347 kit +17 m -----------------------
  ok('F-park bench is signed 364 / 94.4',
    PARK_BENCH_FF_X === 364 && PARK_BENCH_FF_Z === 94.4
    && bench.x === 364 && bench.z === 94.4);
  ok('F-park bench is 347 kit +17 m',
    PARK_BENCH_FF_X === PARK_BENCH_EE_X + 17
    && PARK_BENCH_FF_Z === PARK_BENCH_EE_Z
    && PARK_BENCH_EE_X === 347);
  ok('0.8 m is center-to-spine of FF z0=95.2',
    PARK_WALK_FF_Z0 === 95.2
    && Math.abs(PARK_WALK_FF_Z0 - PARK_BENCH_FF_Z - 0.8) < 1e-9);
  ok('F-park bench yaw faces +Z toward z=96',
    PARK_BENCH_FF_YAW === 0 && PARK_BENCH_FF_YAW === PARK_BENCH_EE_YAW
    && bench.yaw === 0 && bench.yaw !== PARK_BENCH_YAW);
  ok('F-park bench is the same 1.8 m 3-seat kit',
    PARK_BENCH_FF_W === 1.8 && PARK_BENCH_FF_W === GARDEN_BENCH_W
    && PARK_BENCH_FF_W === PARK_BENCH_W && bench.w === GARDEN_BENCH_W);
  ok('F-park bench seat / depth / back / under-clear match the kit',
    PARK_BENCH_FF_SEAT_H === GARDEN_BENCH_SEAT_H
    && PARK_BENCH_FF_DEPTH === GARDEN_BENCH_DEPTH
    && PARK_BENCH_FF_BACK_H === GARDEN_BENCH_BACK_H
    && PARK_BENCH_FF_UNDER_CLEAR === GARDEN_BENCH_UNDER_CLEAR
    && PARK_BENCH_FF_X0 === 363.1 && PARK_BENCH_FF_X1 === 364.9);
  ok('F-park bench sits on the 364/96 hull',
    PARK_BENCH_FF_X0 > POCKET_PARK_F_X0 && PARK_BENCH_FF_X1 < POCKET_PARK_F_X1
    && PARK_BENCH_FF_Z0 > POCKET_PARK_F_Z0 && PARK_BENCH_FF_Z1 < POCKET_PARK_F_Z1
    && parkF.x === 364 && parkF.z === 96);

  ok('F-park pergola is signed 364 / 98.5',
    PARK_PERGOLA_FF_X === 364 && PARK_PERGOLA_FF_Z === 98.5
    && gate.x === 364 && gate.z === 98.5);
  ok('F-park pergola is 347 kit +17 m',
    PARK_PERGOLA_FF_X === PARK_PERGOLA_EE_X + 17
    && PARK_PERGOLA_FF_Z === PARK_PERGOLA_EE_Z);
  ok('F-park pergola opening is 2.20 m, fly +X',
    PARK_PERGOLA_FF_OPEN_H === 2.20
    && PARK_PERGOLA_FF_OPEN_H === GATE_POST_H
    && PARK_PERGOLA_FF_POST_H === GATE_POST_H
    && PARK_PERGOLA_FF_FLY === '+X' && gate.fly === '+X');
  ok('F-park pergola half-span 1.16 stays inside 100 / off spine z1=96.8',
    PARK_PERGOLA_FF_HALF_Z === GATE_HALF_Z && GATE_HALF_Z === 1.16
    && PARK_PERGOLA_FF_HALF_X === GATE_HALF_X
    && Math.abs(PARK_PERGOLA_FF_Z0 - 97.34) < 1e-9
    && Math.abs(PARK_PERGOLA_FF_Z1 - 99.66) < 1e-9
    && PARK_PERGOLA_FF_Z1 < POCKET_PARK_F_Z1
    && Math.abs(POCKET_PARK_F_Z1 - PARK_PERGOLA_FF_Z1 - 0.34) < 1e-9
    && Math.abs(PARK_PERGOLA_FF_Z0 - PARK_WALK_FF_Z1 - 0.54) < 1e-9
    && PARK_PERGOLA_FF_Z0 > PARK_WALK_FF_Z1);

  ok('west walk is signed 356→362.2 / z=98.5',
    PARK_WALK_FF_W_X0 === 356 && PARK_WALK_FF_W_X1 === 362.2
    && PARK_WALK_FF_W_Z === 98.5 && PARK_WALK_FF_W_X === 359.1
    && west.x0 === 356 && west.x1 === 362.2 && west.z === 98.5);
  ok('west walk is 1.8 m west of 364, 347 kit +17 m',
    Math.abs(364 - PARK_WALK_FF_W_X1 - 1.8) < 1e-9
    && PARK_WALK_FF_W_X0 === PARK_WALK_EE_W_X0 + 17
    && PARK_WALK_FF_W_X1 === PARK_WALK_EE_W_X1 + 17
    && PARK_WALK_FF_W_Z === PARK_WALK_EE_W_Z);
  ok('west walk width is 1.6 m, last slab in 362.2',
    PARK_WALK_FF_W_W === 1.6 && PARK_WALK_FF_W_W === GARDEN_PATH_W
    && PARK_WALK_FF_W_W === PARK_WALK_FF_W
    && PARK_WALK_FF_W_LEN === 6.2
    && PARK_WALK_FF_W_Z0 === 97.7 && PARK_WALK_FF_W_Z1 === 99.3
    && westSlabs.every((s) => s.x1 <= 362.2 + 1e-9)
    && lastWest && lastWest.x1 <= 362.2 + 1e-9);
  ok('west walk sash stays empty (stops short of posts)',
    PARK_WALK_FF_W_X1 === 362.2
    && PARK_WALK_FF_W_X1 < (364 - GATE_HALF_Z)
    && PARK_WALK_FF_W_X1 < PARK_PERGOLA_FF_X0
    && PARK_WALK_FF_W_X1 < sash.x0
    && Math.abs((364 - GATE_HALF_Z) - 362.84) < 1e-9);

  ok('east walk is signed 365.8→372 / z=98.5',
    PARK_WALK_FF_E_X0 === 365.8 && PARK_WALK_FF_E_X1 === 372
    && PARK_WALK_FF_E_Z === 98.5 && PARK_WALK_FF_E_X === 368.9
    && east.x0 === 365.8 && east.x1 === 372 && east.z === 98.5);
  ok('east walk is 1.8 m east of 364, 347 kit +17 m',
    Math.abs(PARK_WALK_FF_E_X0 - (364 + 1.8)) < 1e-9
    && PARK_WALK_FF_E_X0 === PARK_WALK_EE_E_X0 + 17
    && PARK_WALK_FF_E_X1 === PARK_WALK_EE_E_X1 + 17
    && PARK_WALK_FF_E_Z === PARK_WALK_EE_E_Z);
  ok('east walk width is 1.6 m, last slab ≤ 372',
    PARK_WALK_FF_E_W === 1.6 && PARK_WALK_FF_E_W === GARDEN_PATH_W
    && PARK_WALK_FF_E_LEN === 6.2
    && PARK_WALK_FF_E_Z0 === 97.7 && PARK_WALK_FF_E_Z1 === 99.3
    && eastSlabs.every((s) => s.x1 <= 372 + 1e-9)
    && lastEast && lastEast.x1 <= 372 + 1e-9
    && east.x1 === 372);
  ok('east walk sash stays empty (starts east of posts)',
    PARK_WALK_FF_E_X0 === 365.8
    && PARK_WALK_FF_E_X0 > PARK_PERGOLA_FF_X1
    && Math.abs(PARK_WALK_FF_E_X0 - PARK_PERGOLA_FF_X1 - 0.65) < 1e-9
    && PARK_WALK_FF_E_X0 > sash.x1
    && Math.abs((364 + GATE_HALF_X) - 365.15) < 1e-9);

  ok('west bench is signed 357.5 / 94.4 (−6.5 m mirror)',
    PARK_BENCH_FF_W_X === 357.5 && PARK_BENCH_FF_W_Z === 94.4
    && Math.abs(PARK_BENCH_FF_X - PARK_BENCH_FF_W_X - 6.5) < 1e-9
    && PARK_BENCH_FF_W_X === PARK_BENCH_EE_W_X + 17
    && benchW.x === 357.5 && benchW.z === 94.4
    && PARK_BENCH_FF_W_X0 === 356.6 && PARK_BENCH_FF_W_X1 === 358.4
    && PARK_BENCH_FF_W_YAW === 0);
  ok('east bench is signed 370.5 / 94.4 (+6.5), x1=371.4 stays in 372',
    PARK_BENCH_FF_E_X === 370.5 && PARK_BENCH_FF_E_Z === 94.4
    && Math.abs(PARK_BENCH_FF_E_X - PARK_BENCH_FF_X - 6.5) < 1e-9
    && Math.abs(PARK_BENCH_FF_E_X + PARK_BENCH_FF_W_X - 2 * PARK_BENCH_FF_X) < 1e-9
    && PARK_BENCH_FF_E_X === PARK_BENCH_EE_E_X + 17
    && benchE.x === 370.5 && benchE.z === 94.4
    && PARK_BENCH_FF_E_X0 === 369.6 && PARK_BENCH_FF_E_X1 === 371.4
    && PARK_BENCH_FF_E_X1 < 372 && POCKET_PARK_F_X1 === 372
    && PARK_BENCH_FF_E_YAW === 0);

  // ---- stay-puts --------------------------------------------------------
  ok('lots A–F stay 258 / 295 / 313 / 330 / 347 / 364 at z=84',
    leftoverLotGeom().x0 === 251
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84
    && LEFTOVER_LOT_D_X === 330 && LEFTOVER_LOT_D_Z === 84
    && LEFTOVER_LOT_E_X === 347 && LEFTOVER_LOT_E_Z === 84
    && LEFTOVER_LOT_F_X === 364 && LEFTOVER_LOT_F_Z === 84
    && LEFTOVER_LOT_F_X0 === 357 && LEFTOVER_LOT_F_X1 === 371
    && LEFTOVER_LOT_F_Z0 === 78 && LEFTOVER_LOT_F_Z1 === 90);
  ok('276 park / 347 park / F hull stay',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_X0 === 268 && POCKET_PARK_X1 === 284
    && POCKET_PARK_Z0 === 88 && POCKET_PARK_Z1 === 96
    && POCKET_PARK_E_X === 347 && POCKET_PARK_E_Z === 96
    && POCKET_PARK_E_X0 === 339 && POCKET_PARK_E_X1 === 355
    && POCKET_PARK_F_X === 364 && POCKET_PARK_F_Z === 96
    && POCKET_PARK_F_X0 === 356 && POCKET_PARK_F_X1 === 372
    && POCKET_PARK_F_W === 16 && POCKET_PARK_F_D === 8);
  ok('FF spine stays 356→372 / z=96',
    PARK_WALK_FF_X0 === 356 && PARK_WALK_FF_X1 === 372
    && PARK_WALK_FF_Z === 96 && PARK_WALK_FF_W === 1.6
    && PARK_WALK_FF_LEN === 16 && PARK_WALK_FF_X === 364
    && spine.x0 === 356 && spine.x1 === 372 && spine.z === 96);
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
  ok('does not merge with E-park 355',
    PARK_WALK_EE_X1 === 355 && PARK_WALK_FF_X0 === 356
    && POCKET_PARK_E_X1 === 355 && POCKET_PARK_F_X0 === 356
    && PARK_WALK_FF_W_X0 === 356 && PARK_WALK_FF_W_X0 > 355);

  // ---- leftover 8000–11000; 11k ceiling; no backfill --------------------
  ok('three walks eat ~45 m²',
    Math.abs(PARK_WALK_FF_LEN * PARK_WALK_FF_W
      + PARK_WALK_FF_W_LEN * PARK_WALK_FF_W_W
      + PARK_WALK_FF_E_LEN * PARK_WALK_FF_E_W - 45.44) < 1e-9);
  ok('F leftover after the walks is 8000–11000 and < 12800',
    fieldF.placed.length >= POCKET_PARK_F_INSTANCES_MIN
    && fieldF.placed.length <= POCKET_PARK_F_INSTANCES_MAX
    && POCKET_PARK_F_INSTANCES_MIN === 8000
    && POCKET_PARK_F_INSTANCES_MAX === 11000
    && fieldF.placed.length < 12800
    && fieldF.placed.length !== 12800
    && plannedF === 12800
    && POCKET_PARK_COVER === 10,
    `placedF=${fieldF.placed.length} plannedF=${plannedF}`);
  ok('did not backfill past 11k',
    fieldF.placed.length <= 11000
    && fieldF.placed.length < plannedF
    && fieldF.cells.length === plannedF);
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
    inReserved(PARK_BENCH_FF_X, PARK_BENCH_FF_Z)
    && inKeepout(PARK_BENCH_FF_X, PARK_BENCH_FF_Z)
    && inReserved(PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z)
    && inKeepout(PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z)
    && inReserved(PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z)
    && inKeepout(PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z)
    && inReserved(PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z)
    && inKeepout(PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z)
    && inReserved(PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z)
    && inReserved(PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z)
    && groundHeight(PARK_BENCH_FF_X, PARK_BENCH_FF_Z) === CITY_Y
    && !onPavement(PARK_BENCH_FF_X, PARK_BENCH_FF_Z)
    && !onBoardwalk(PARK_BENCH_FF_X, PARK_BENCH_FF_Z)
    && !onRoadway(PARK_BENCH_FF_Z)
    && !onCrossStreet(PARK_BENCH_FF_X, PARK_BENCH_FF_Z)
    && !onSidewalk(PARK_BENCH_FF_X, PARK_BENCH_FF_Z));
  ok('signed cells are not rejected',
    !gardenBenchRejected(PARK_BENCH_FF_X, PARK_BENCH_FF_Z)
    && !gardenBenchRejected(PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z)
    && !gardenBenchRejected(PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z)
    && !boardwalkGateRejected(PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z)
    && !gardenPathRejected(PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z)
    && !gardenPathRejected(PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z)
    && !gardenPathRejected(PARK_WALK_FF_X, PARK_WALK_FF_Z)
    && !pocketParkRejected(POCKET_PARK_F_X, POCKET_PARK_F_Z));
  ok('tryPlace drops the reserved kit',
    tryPlace(ctx, PARK_BENCH_FF_X, PARK_BENCH_FF_Z) === 0
    && tryPlace(ctx, PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z) === 0
    && tryPlace(ctx, PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z) === 0
    && tryPlace(ctx, PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z) === 0
    && tryPlace(ctx, PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z) === 0
    && tryPlace(ctx, PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z) === 0);
  ok('misses leftoverLot F / E-park / helipad / 347',
    LEFTOVER_LOT_F_Z1 === 90 && PARK_BENCH_FF_Z0 > LEFTOVER_LOT_F_Z1
    && !leftoverLotOverlap(PARK_BENCH_FF_X, PARK_BENCH_FF_Z,
      PARK_BENCH_FF_W, PARK_BENCH_FF_DEPTH, 0.15)
    && !inLeftoverLotReserved(PARK_BENCH_FF_X, PARK_BENCH_FF_Z)
    && !inHelipadReserved(PARK_BENCH_FF_X, PARK_BENCH_FF_Z)
    && !inWarehouseReserved(PARK_BENCH_FF_X, PARK_BENCH_FF_Z)
    && PARK_BENCH_FF_X0 > POCKET_PARK_E_X1 && POCKET_PARK_E_X1 === 355
    && PARK_WALK_FF_W_X0 > PARK_WALK_EE_X1);
  ok('benches do not kiss the FF spine or each other',
    PARK_BENCH_FF_Z1 < PARK_WALK_FF_Z0
    && PARK_BENCH_FF_W_X1 < PARK_BENCH_FF_X0
    && PARK_BENCH_FF_X1 < PARK_BENCH_FF_E_X0
    && !gardenPathSlabOverlap(PARK_BENCH_FF_X, PARK_BENCH_FF_Z,
      PARK_BENCH_FF_W, PARK_BENCH_FF_DEPTH, 0));
  ok('spine z1=96.8 is 0.9 m south of sash walks (grow-to-gap)',
    PARK_WALK_FF_Z1 === 96.8
    && PARK_WALK_FF_W_Z0 === 97.7 && PARK_WALK_FF_E_Z0 === 97.7
    && Math.abs(PARK_WALK_FF_W_Z0 - PARK_WALK_FF_Z1 - 0.9) < 1e-9
    && west.z0 > spine.z1 && east.z0 > spine.z1);

  // ---- sit-box and sash stay flyable voids ------------------------------
  ok('F-park sit-box is a void in front of the back (+Z)',
    voids.some((v) => v.id === 'gardenBench-sit' && v.kind === 'sit')
    && voids.some((v) => v.id === 'gardenBench-under' && v.kind === 'under'));
  const sit = voids.find((v) => v.id === 'gardenBench-sit');
  const under = voids.find((v) => v.id === 'gardenBench-under');
  for (const v of voids) {
    const hit = probeBlocked(benchShapes, v.x, v.y, v.z, v.probe);
    ok(`ff ${v.id} is flyable`, !hit, hit ? `blocked by ${hit.tag}` : '');
  }
  ok('F-park sit-box faces +Z toward z=96',
    sit && sit.z > bench.z && sit.y > CITY_Y + PARK_BENCH_FF_SEAT_H);
  ok('F-park bench colliders are legs + slats + back only',
    benchShapes.every((s) => s.part === 'leg' || s.part === 'slat' || s.part === 'back')
    && parts.slats.length === 8
    && parts.slats.every((s) => Math.abs(s.sz - GARDEN_BENCH_SLAT) < 1e-9)
    && parts.backs.every((b) => b.z < bench.z));
  ok('park-pergola-ff fly void is published, sash empty',
    !!fly && fly.kind === 'kit' && fly.openH === 2.20
    && !!inFlyVoid(PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z)
    && PARK_PERGOLA_FF_AABB === false);
  const sashHit = probeBlocked(kit, sash.x, sash.y, sash.z, 0.12);
  ok('F-park pergola sash is flyable', !sashHit,
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
    && !westShapes.some((s) => Math.abs(s.sx - PARK_WALK_FF_W_LEN) < 0.2)
    && !eastShapes.some((s) => Math.abs(s.sx - PARK_WALK_FF_E_LEN) < 0.2));

  // ---- kiss = drop, never nudge -----------------------------------------
  ok('drop if the kit kisses leftoverLot F / E-park / helipad / 347',
    gardenBenchRejected(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z) === true
    && gardenPathRejected(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z) === true
    && boardwalkGateRejected(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z) === true
    && gardenBenchRejected(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z) === true
    && gardenBenchRejected(430, 70) === true
    && gardenBenchRejected(WAREHOUSE_X, WAREHOUSE_Z) === true
    && gardenBenchRejected(PARK_BENCH_EE_X, PARK_BENCH_EE_Z) === false
    && gardenBenchRejected(346.1, 94.4) === true);
  ok('drop if sit-box / sash / spine is filled by a kiss',
    gardenBenchRejected(PARK_WALK_FF_X, PARK_WALK_FF_Z) === true
    && gardenPathRejected(PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z) === true
    && gardenBenchRejected(PARK_BENCH_FF_X, PARK_BENCH_FF_Z) === false
    && gardenBenchRejected(363.1, 94.4) === true
    && gardenPathRejected(PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z) === false
    && gardenPathRejected(PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z) === false);

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

  ok('F-park kit reuses gardenBenchGeom / boardwalkGateGeom / gardenPathGeom',
    benchSrc.includes('gardenBenchGeom(PARK_BENCH_FF_X, PARK_BENCH_FF_Z)')
    && benchSrc.includes('gardenBenchGeom(PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z)')
    && benchSrc.includes('gardenBenchGeom(PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z)')
    && flySrc.includes('boardwalkGateGeom(PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z)')
    && gardenSrc.includes('gardenPathGeom(PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z)')
    && gardenSrc.includes('gardenPathGeom(PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z)')
    && constants.includes('347 kit +17 m')
    && constants.includes('Do not merge E-park 355')
    && constants.includes('leftover ~8.2k')
    && constants.includes('11k is a ceiling')
    && constants.includes('No leftover lots on this merge')
    && constants.includes('PARK_BENCH_FF_X = 364')
    && constants.includes('PARK_PERGOLA_FF_X = 364')
    && constants.includes('PARK_WALK_FF_W_X0 = 356')
    && constants.includes('PARK_WALK_FF_E_X0 = 365.8')
    && constants.includes('PARK_BENCH_FF_W_X = 357.5')
    && constants.includes('PARK_BENCH_FF_E_X = 370.5')
    && constants.includes('POCKET_PARK_F_INSTANCES_MIN = 8000')
    && constants.includes('POCKET_PARK_F_INSTANCES_MAX = 11000'));
  ok('no new geom family / leftover lots / foliage / 4.2 m slab',
    !/export function gardenBenchFGeom/.test(constants)
    && !/export function parkPergolaFGeom/.test(constants)
    && !/export function gardenPathFGeom/.test(constants)
    && !/export function leftoverLotDirtGeom/.test(constants)
    && !/export function parkWalkFFWGeom/.test(constants)
    && !/export function parkWalkFFEGeom/.test(constants)
    && !/export function parkBenchFFGeom/.test(constants)
    && !existsSync(join(here, 'landmarks/gardenBenchF.js'))
    && !existsSync(join(here, 'landmarks/parkPergolaF.js'))
    && !existsSync(join(here, 'landmarks/gardenPathF.js'))
    && !existsSync(join(here, 'landmarks/parkWalkFFW.js'))
    && !leftover.includes('PARK_BENCH_FF_')
    && !leftover.includes('PARK_WALK_FF_W_')
    && !leftover.includes('PARK_PERGOLA_FF_')
    && !grass.includes('PARK_BENCH_FF_')
    && !park.includes('PARK_BENCH_FF_')
    && !gardenSrc.includes('4.2 m')
    && !gardenSrc.includes('Selo')
    && index.includes('buildGardenPath(ctx)')
    && index.includes('buildGardenBench(ctx)')
    && index.includes('buildFlythrough(ctx)'));
  ok('photo-mode / ACES / bloom / SSAO / colony HUD / Shackleton / Starship stay off this merge',
    !constants.includes('photo-mode') && !constants.includes('ACES')
    && !constants.includes('SSAO') && !constants.includes('Shackleton')
    && !constants.includes('Starship') && !preview.includes('PARK_BENCH_FF_')
    && !follow.includes('PARK_BENCH_FF_') && !checkpoints.includes('PARK_BENCH_FF_')
    && /const GRAVITY = 9\.81/.test(quad) && !quad.includes('PARK_BENCH_FF_')
    && planting.includes('export function tryPlace')
    && !planting.includes('PARK_BENCH_FF_')
    && blades.includes('placeBladePlan') && !blades.includes('PARK_BENCH_FF_'));
  ok('E leftover / 276 leftover comments stay 8–11k',
    constants.includes('E leftover stays 8000–11000')
    && POCKET_PARK_E_INSTANCES_MIN === 8000
    && POCKET_PARK_INSTANCES_MIN === 8000
    && LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0);

  if (fails.length) {
    console.error('[miami-parkKitFF] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-parkKitFF] ok', passedCount, 'checks',
      `lastEast.x1=${lastEast && lastEast.x1} placedF=${fieldF.placed.length}/${plannedF} placedE=${fieldE.placed.length} placed276=${field276.placed.length}`);
  }
  return {
    passed: fails.length === 0, fails, passedCount,
    lastEastX1: lastEast && lastEast.x1,
    lastWestX1: lastWest && lastWest.x1,
    placedF: fieldF.placed.length, plannedF,
    placedE: fieldE.placed.length, placed276: field276.placed.length,
  };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('parkKitFFTest.js');
if (isMain) {
  const r = runMiamiParkKitFFTests();
  if (!r.passed) process.exit(1);
}
