// Headless checks for the Miami E-park west bench (Tiny Glade 3-seat slat).
// No three.js, no game state. Not a haunt. Not leftoverLot. Not a
// leftoverGrass / pocket-park / garden-path / 276-walk / pergola restack.
//
//   node ./tools/run-miami-garden-bench-ee-w-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_Y,
  GARDEN_BENCH_X, GARDEN_BENCH_Z, GARDEN_BENCH_W, GARDEN_BENCH_DEPTH,
  GARDEN_BENCH_SEAT_H, GARDEN_BENCH_BACK_H, GARDEN_BENCH_UNDER_CLEAR,
  GARDEN_BENCH_SLAT, GARDEN_BENCH_COLLIDER_PAD,
  GARDEN_PATH_X0, GARDEN_PATH_X1, GARDEN_PATH_Z, GARDEN_PATH_Z0, GARDEN_PATH_Z1,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z,
  LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z,
  LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z,
  LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z, LEFTOVER_LOT_E_X0, LEFTOVER_LOT_E_X1,
  LEFTOVER_LOT_E_Z0, LEFTOVER_LOT_E_Z1,
  PARK_BENCH_X, PARK_BENCH_Z, PARK_BENCH_YAW, PARK_BENCH_W,
  PARK_BENCH_W_X, PARK_BENCH_W_Z, PARK_BENCH_W_YAW,
  PARK_BENCH_E_X, PARK_BENCH_E_Z, PARK_BENCH_E_YAW,
  PARK_BENCH_EE_X, PARK_BENCH_EE_Z, PARK_BENCH_EE_YAW, PARK_BENCH_EE_W,
  PARK_BENCH_EE_DEPTH, PARK_BENCH_EE_SEAT_H, PARK_BENCH_EE_BACK_H,
  PARK_BENCH_EE_UNDER_CLEAR,
  PARK_BENCH_EE_X0, PARK_BENCH_EE_X1, PARK_BENCH_EE_Z0, PARK_BENCH_EE_Z1,
  PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z, PARK_BENCH_EE_W_YAW, PARK_BENCH_EE_W_W,
  PARK_BENCH_EE_W_DEPTH, PARK_BENCH_EE_W_SEAT_H, PARK_BENCH_EE_W_BACK_H,
  PARK_BENCH_EE_W_UNDER_CLEAR,
  PARK_BENCH_EE_W_X0, PARK_BENCH_EE_W_X1, PARK_BENCH_EE_W_Z0, PARK_BENCH_EE_W_Z1,
  PARK_WALK_X0, PARK_WALK_X1, PARK_WALK_Z,
  PARK_WALK_E_X0, PARK_WALK_E_X1, PARK_WALK_E_Z,
  PARK_WALK_NS_X, PARK_WALK_NS_Z, PARK_WALK_NS_X0, PARK_WALK_NS_X1,
  PARK_WALK_NS_Z0, PARK_WALK_NS_Z1,
  PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z, PARK_WALK_NS_E_X0, PARK_WALK_NS_E_X1,
  PARK_WALK_EE_X, PARK_WALK_EE_Z, PARK_WALK_EE_X0, PARK_WALK_EE_X1,
  PARK_WALK_EE_Z0, PARK_WALK_EE_Z1, PARK_WALK_EE_LEN, PARK_WALK_EE_W,
  PARK_WALK_EE_W_X0, PARK_WALK_EE_W_X1, PARK_WALK_EE_W_Z,
  PARK_WALK_EE_W_Z0, PARK_WALK_EE_W_Z1, PARK_WALK_EE_W_X, PARK_WALK_EE_W_LEN,
  PARK_WALK_EE_E_X0, PARK_WALK_EE_E_X1, PARK_WALK_EE_E_Z,
  PARK_WALK_EE_E_Z0, PARK_WALK_EE_E_Z1, PARK_WALK_EE_E_X, PARK_WALK_EE_E_LEN,
  PARK_PERGOLA_X, PARK_PERGOLA_Z,
  PARK_PERGOLA_EE_X, PARK_PERGOLA_EE_Z,
  POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D,
  POCKET_PARK_X0, POCKET_PARK_X1, POCKET_PARK_Z0, POCKET_PARK_Z1,
  POCKET_PARK_E_X, POCKET_PARK_E_Z, POCKET_PARK_E_W, POCKET_PARK_E_D,
  POCKET_PARK_E_X0, POCKET_PARK_E_X1, POCKET_PARK_E_Z0, POCKET_PARK_E_Z1,
  POCKET_PARK_E_INSTANCES_MIN, POCKET_PARK_E_INSTANCES_MAX,
  POCKET_PARK_INSTANCES_MIN, POCKET_PARK_INSTANCES_MAX, POCKET_PARK_COVER,
  LEFTOVER_GRASS_X0, LEFTOVER_GRASS_X1, LEFTOVER_GRASS_Z0, LEFTOVER_GRASS_Z1,
  WAREHOUSE_X, WAREHOUSE_Z,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, inReserved, reservedOverlap, streetOverlap, groundHeight,
  leftoverLotGeom, gardenPathGeom, gardenPathSlabs,
  gardenBenchGeom, gardenBenchParts, gardenBenchVoids, gardenBenchColliderShapes,
  gardenBenchRejected, inGardenBench,
  inGardenPathSlab, gardenPathSlabOverlap, inLeftoverLotReserved, leftoverLotOverlap,
  pocketParkHull, pocketParkPlannedCount, pocketParkDrop,
  inWarehouseReserved, inHelipadReserved, warehouseOverlap,
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

export function runMiamiGardenBenchEEWTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const geom = gardenBenchGeom(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z);
  const parts = gardenBenchParts(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z);
  const voids = gardenBenchVoids(geom);
  const shapes = gardenBenchColliderShapes(geom);
  const geomEE = gardenBenchGeom(PARK_BENCH_EE_X, PARK_BENCH_EE_Z);
  const eeSlabs = gardenPathSlabs(gardenPathGeom(PARK_WALK_EE_X, PARK_WALK_EE_Z));
  const eeLastSlab = eeSlabs.reduce((a, s) => (!a || s.x1 > a.x1 ? s : a), null);
  const westWalk = gardenPathGeom(PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z);
  const eastWalk = gardenPathGeom(PARK_WALK_EE_E_X, PARK_WALK_EE_E_Z);
  const geomA = leftoverLotGeom();
  const fieldE = placePocketPark(ctx, POCKET_PARK_E_X, POCKET_PARK_E_Z);
  const field276 = placePocketPark(ctx, POCKET_PARK_X, POCKET_PARK_Z);
  const plannedE = pocketParkPlannedCount(POCKET_PARK_E_X, POCKET_PARK_E_Z);

  // ---- signed cell (Desi); do not invent or slide x/z --------------------
  ok('E-park west bench cell is signed 340.5 / 94.4',
    PARK_BENCH_EE_W_X === 340.5 && PARK_BENCH_EE_W_Z === 94.4);
  ok('−6.5 m off 347 (347 − 6.5 = 340.5)',
    Math.abs(PARK_BENCH_EE_X - PARK_BENCH_EE_W_X - 6.5) < 1e-9
    && PARK_BENCH_EE_X === 347);
  ok('E-park west bench x/z were not invented or slid',
    geom.x === 340.5 && geom.z === 94.4
    && geom.x === PARK_BENCH_EE_W_X && geom.z === PARK_BENCH_EE_W_Z
    && PARK_BENCH_EE_X === 347 && PARK_BENCH_EE_Z === 94.4
    && PARK_BENCH_X === 276 && PARK_BENCH_Z === 90
    && PARK_BENCH_W_X === 269.5 && PARK_BENCH_W_Z === 90
    && PARK_BENCH_E_X === 282.5 && PARK_BENCH_E_Z === 90
    && GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('E-park west bench yaw faces +Z toward the spine at z=96',
    PARK_BENCH_EE_W_YAW === 0 && PARK_BENCH_EE_W_YAW === PARK_BENCH_EE_YAW
    && geom.yaw === PARK_BENCH_EE_W_YAW
    && geom.yaw === 0 && geom.yaw !== PARK_BENCH_YAW
    && geomEE.yaw === 0);
  ok('E-park west bench is the same 1.8 m 3-seat kit',
    PARK_BENCH_EE_W_W === 1.8 && PARK_BENCH_EE_W_W === GARDEN_BENCH_W
    && PARK_BENCH_EE_W_W === PARK_BENCH_W && geom.w === GARDEN_BENCH_W
    && PARK_BENCH_EE_W === 1.8);
  ok('E-park west bench seat H is 0.43–0.46 m',
    PARK_BENCH_EE_W_SEAT_H >= 0.43 && PARK_BENCH_EE_W_SEAT_H <= 0.46
    && PARK_BENCH_EE_W_SEAT_H === GARDEN_BENCH_SEAT_H
    && geom.seatH === GARDEN_BENCH_SEAT_H);
  ok('E-park west bench depth is ~0.45 m',
    Math.abs(PARK_BENCH_EE_W_DEPTH - 0.45) < 1e-9
    && PARK_BENCH_EE_W_DEPTH === GARDEN_BENCH_DEPTH
    && geom.depth === GARDEN_BENCH_DEPTH);
  ok('E-park west bench back crown is 0.80–0.90 m',
    PARK_BENCH_EE_W_BACK_H >= 0.80 && PARK_BENCH_EE_W_BACK_H <= 0.90
    && PARK_BENCH_EE_W_BACK_H === GARDEN_BENCH_BACK_H
    && geom.backH === GARDEN_BENCH_BACK_H);
  ok('E-park west bench under-slat clear is ~0.40 m',
    Math.abs(PARK_BENCH_EE_W_UNDER_CLEAR - 0.40) < 1e-9
    && PARK_BENCH_EE_W_UNDER_CLEAR === GARDEN_BENCH_UNDER_CLEAR
    && geom.underClear === GARDEN_BENCH_UNDER_CLEAR);
  ok('E-park west bench geom matches signed constants',
    geom.x === 340.5 && geom.z === 94.4 && geom.w === 1.8
    && Math.abs(geom.x0 - PARK_BENCH_EE_W_X0) < 1e-9
    && Math.abs(geom.x1 - PARK_BENCH_EE_W_X1) < 1e-9
    && Math.abs(geom.z0 - PARK_BENCH_EE_W_Z0) < 1e-9
    && Math.abs(geom.z1 - PARK_BENCH_EE_W_Z1) < 1e-9
    && PARK_BENCH_EE_W_X0 === 339.6 && PARK_BENCH_EE_W_X1 === 341.4);
  ok('0.8 m is 82.4 center-to-spine, not 269.5 edge-to-walk',
    PARK_WALK_EE_Z0 === 95.2
    && Math.abs(PARK_WALK_EE_Z0 - PARK_BENCH_EE_W_Z - 0.8) < 1e-9
    && Math.abs(PARK_WALK_EE_Z0 - PARK_BENCH_EE_W_Z1) !== 0.8
    && GARDEN_PATH_Z0 === 83.2
    && Math.abs(GARDEN_PATH_Z0 - GARDEN_BENCH_Z - 0.8) < 1e-9);
  ok('bench plate is ~0.8 m²',
    Math.abs(PARK_BENCH_EE_W_W * PARK_BENCH_EE_W_DEPTH - 0.81) < 1e-9);
  ok('sits on the E park hull (339–355 × 92–100)',
    PARK_BENCH_EE_W_X0 > POCKET_PARK_E_X0 && PARK_BENCH_EE_W_X1 < POCKET_PARK_E_X1
    && PARK_BENCH_EE_W_Z0 > POCKET_PARK_E_Z0 && PARK_BENCH_EE_W_Z1 < POCKET_PARK_E_Z1
    && POCKET_PARK_E_X0 === 339 && POCKET_PARK_E_X1 === 355
    && POCKET_PARK_E_Z0 === 92 && POCKET_PARK_E_Z1 === 100
    && POCKET_PARK_E_X === 347 && POCKET_PARK_E_Z === 96);
  ok('west end 339.6 is inside 339',
    PARK_BENCH_EE_W_X0 === 339.6 && PARK_BENCH_EE_W_X0 > 339
    && POCKET_PARK_E_X0 === 339);
  ok('east end 341.4 stays west of 347/94.4 (x0=346.1)',
    PARK_BENCH_EE_W_X1 === 341.4 && PARK_BENCH_EE_X0 === 346.1
    && PARK_BENCH_EE_W_X1 < PARK_BENCH_EE_X0
    && Math.abs(PARK_BENCH_EE_X0 - PARK_BENCH_EE_W_X1 - 4.7) < 1e-9);
  ok('misses leftoverLot E (E z1=90)',
    LEFTOVER_LOT_E_Z1 === 90 && PARK_BENCH_EE_W_Z0 > LEFTOVER_LOT_E_Z1
    && !leftoverLotOverlap(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z,
      PARK_BENCH_EE_W_W, PARK_BENCH_EE_W_DEPTH, 0.15)
    && !inLeftoverLotReserved(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z)
    && !inLeftoverLotReserved(PARK_BENCH_EE_W_X0, PARK_BENCH_EE_W_Z)
    && !inLeftoverLotReserved(PARK_BENCH_EE_W_X1, PARK_BENCH_EE_W_Z));

  // ---- stay-puts (do not restack) ----------------------------------------
  ok('347/94.4 stays',
    PARK_BENCH_EE_X === 347 && PARK_BENCH_EE_Z === 94.4
    && geomEE.x === 347 && geomEE.z === 94.4
    && PARK_BENCH_EE_X0 === 346.1 && PARK_BENCH_EE_X1 === 347.9
    && PARK_BENCH_EE_YAW === 0);
  ok('347/98.5 pergola stays',
    PARK_PERGOLA_EE_X === 347 && PARK_PERGOLA_EE_Z === 98.5);
  ok('existing benches stay 276/82.4, 276/90, 269.5/90, 282.5/90, 347/94.4',
    GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4
    && PARK_BENCH_X === 276 && PARK_BENCH_Z === 90
    && PARK_BENCH_W_X === 269.5 && PARK_BENCH_W_Z === 90
    && PARK_BENCH_E_X === 282.5 && PARK_BENCH_E_Z === 90
    && PARK_BENCH_EE_X === 347 && PARK_BENCH_EE_Z === 94.4
    && gardenBenchGeom().x === 276 && gardenBenchGeom().z === 82.4
    && gardenBenchGeom(PARK_BENCH_X, PARK_BENCH_Z).x === 276
    && gardenBenchGeom(PARK_BENCH_X, PARK_BENCH_Z).z === 90
    && gardenBenchGeom(PARK_BENCH_W_X, PARK_BENCH_W_Z).x === 269.5
    && gardenBenchGeom(PARK_BENCH_W_X, PARK_BENCH_W_Z).z === 90
    && gardenBenchGeom(PARK_BENCH_E_X, PARK_BENCH_E_Z).x === 282.5
    && gardenBenchGeom(PARK_BENCH_E_X, PARK_BENCH_E_Z).z === 90
    && gardenBenchGeom(PARK_BENCH_EE_X, PARK_BENCH_EE_Z).x === 347
    && gardenBenchGeom(PARK_BENCH_EE_X, PARK_BENCH_EE_Z).z === 94.4);
  ok('276 bench yaws did not flip',
    gardenBenchGeom().yaw === 0
    && gardenBenchGeom(PARK_BENCH_X, PARK_BENCH_Z).yaw === Math.PI
    && gardenBenchGeom(PARK_BENCH_W_X, PARK_BENCH_W_Z).yaw === Math.PI
    && gardenBenchGeom(PARK_BENCH_E_X, PARK_BENCH_E_Z).yaw === Math.PI
    && PARK_BENCH_YAW === Math.PI && PARK_BENCH_W_YAW === Math.PI
    && PARK_BENCH_E_YAW === Math.PI);
  ok('EE spine stays 339→355 / z=96',
    PARK_WALK_EE_X0 === 339 && PARK_WALK_EE_X1 === 355
    && PARK_WALK_EE_Z === 96 && PARK_WALK_EE_Z0 === 95.2
    && PARK_WALK_EE_Z1 === 96.8 && PARK_WALK_EE_X === 347
    && PARK_WALK_EE_LEN === 16 && PARK_WALK_EE_W === 1.6);
  ok('west walk stays 339→345.2 / z=98.5',
    PARK_WALK_EE_W_X0 === 339 && PARK_WALK_EE_W_X1 === 345.2
    && PARK_WALK_EE_W_Z === 98.5 && PARK_WALK_EE_W_Z0 === 97.7
    && PARK_WALK_EE_W_Z1 === 99.3 && PARK_WALK_EE_W_X === 342.1
    && PARK_WALK_EE_W_LEN === 6.2
    && westWalk.x0 === 339 && westWalk.x1 === 345.2 && westWalk.z === 98.5);
  ok('east walk stays 348.8→355 / z=98.5',
    PARK_WALK_EE_E_X0 === 348.8 && PARK_WALK_EE_E_X1 === 355
    && PARK_WALK_EE_E_Z === 98.5 && PARK_WALK_EE_E_Z0 === 97.7
    && PARK_WALK_EE_E_Z1 === 99.3 && PARK_WALK_EE_E_X === 351.9
    && PARK_WALK_EE_E_LEN === 6.2
    && eastWalk.x0 === 348.8 && eastWalk.x1 === 355 && eastWalk.z === 98.5);
  ok('walks stay 84 / west 268→274.2 / east 277.8→284 / N-S 272 / N-S 280',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284 && GARDEN_PATH_Z === 84
    && GARDEN_PATH_Z0 === 83.2 && GARDEN_PATH_Z1 === 84.8
    && PARK_WALK_X0 === 268 && PARK_WALK_X1 === 274.2 && PARK_WALK_Z === 94
    && PARK_WALK_E_X0 === 277.8 && PARK_WALK_E_X1 === 284 && PARK_WALK_E_Z === 94
    && PARK_WALK_NS_X === 272 && PARK_WALK_NS_X0 === 271.2
    && PARK_WALK_NS_X1 === 272.8 && PARK_WALK_NS_Z0 === 85.2
    && PARK_WALK_NS_Z1 === 92.8 && PARK_WALK_NS_Z === 89
    && PARK_WALK_NS_E_X === 280 && PARK_WALK_NS_E_X0 === 279.2
    && PARK_WALK_NS_E_X1 === 280.8 && PARK_WALK_NS_E_Z === 89);
  ok('garden path 268→284 / z=84 stays',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284 && GARDEN_PATH_Z === 84);
  ok('EE last slab still ≤ 355',
    PARK_WALK_EE_X1 === 355
    && eeSlabs.every((s) => s.x1 <= 355 + 1e-9)
    && eeLastSlab && eeLastSlab.x1 <= 355 + 1e-9);
  ok('276 park stays 268–284 × 88–96',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_W === 16 && POCKET_PARK_D === 8
    && POCKET_PARK_X0 === 268 && POCKET_PARK_X1 === 284
    && POCKET_PARK_Z0 === 88 && POCKET_PARK_Z1 === 96);
  ok('pergola stays 276/94', PARK_PERGOLA_X === 276 && PARK_PERGOLA_Z === 94);
  ok('A–E lots stay 258 / 295 / 313 / 330 / 347 at z=84',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84
    && LEFTOVER_LOT_D_X === 330 && LEFTOVER_LOT_D_Z === 84
    && LEFTOVER_LOT_E_X === 347 && LEFTOVER_LOT_E_Z === 84
    && LEFTOVER_LOT_E_X0 === 340 && LEFTOVER_LOT_E_X1 === 354
    && LEFTOVER_LOT_E_Z0 === 78 && LEFTOVER_LOT_E_Z1 === 90
    && geomA.x0 === 251 && geomA.x1 === 265);
  ok('leftoverGrass stays 267–285 / 81–86',
    LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0);

  // ---- leftover MIN/MAX stay 8000 / 11000; do not restack grass ----------
  ok('E leftover stays 8000–11000, not 12800',
    fieldE.placed.length >= POCKET_PARK_E_INSTANCES_MIN
    && fieldE.placed.length <= POCKET_PARK_E_INSTANCES_MAX
    && POCKET_PARK_E_INSTANCES_MIN === 8000
    && POCKET_PARK_E_INSTANCES_MAX === 11000
    && fieldE.placed.length !== 12800
    && plannedE === 12800
    && pocketParkPlannedCount(POCKET_PARK_E_X, POCKET_PARK_E_Z) === 12800
    && POCKET_PARK_COVER === 10
    && POCKET_PARK_INSTANCES_MIN === 8000
    && POCKET_PARK_INSTANCES_MAX === 11000,
    `placedE=${fieldE.placed.length}`);
  ok('did not backfill the grass floor to 12800',
    fieldE.placed.length < plannedE
    && fieldE.cells.length === plannedE);
  ok('276 leftover stays 8000–11000',
    field276.placed.length >= POCKET_PARK_INSTANCES_MIN
    && field276.placed.length <= POCKET_PARK_INSTANCES_MAX,
    `placed276=${field276.placed.length}`);

  // ---- reserved / keepout / tryPlace / grade -----------------------------
  ok('E-park west bench is not pavement',
    !onPavement(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z));
  ok('E-park west bench is not boardwalk',
    !onBoardwalk(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z));
  ok('E-park west bench is not roadway', !onRoadway(PARK_BENCH_EE_W_Z));
  ok('E-park west bench is not a cross-street',
    !onCrossStreet(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z));
  ok('E-park west bench is not a sidewalk slab',
    !onSidewalk(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z));
  ok('E-park west bench sits on leftover-city grade',
    groundHeight(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z) === CITY_Y);
  ok('E-park west bench is reserved',
    inReserved(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z));
  ok('E-park west bench is a keepout',
    inKeepout(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z));
  ok('reservedOverlap covers the E-park west slat',
    reservedOverlap(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z,
      PARK_BENCH_EE_W_W, PARK_BENCH_EE_W_DEPTH, 0.15));
  ok('tryPlace drops the reserved E-park west bench',
    tryPlace(ctx, PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z) === 0);
  ok('tryPlace does not remap the E-park west bench',
    tryPlace(ctx, PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z) === 0);
  ok('E-park west bench cell is not rejected',
    !gardenBenchRejected(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z));
  ok('E-park west bench footprint is not in the street',
    !streetOverlap(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z,
      PARK_BENCH_EE_W_W, PARK_BENCH_EE_W_DEPTH));
  ok('inGardenBench covers the E-park west plate',
    inGardenBench(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z)
    && inGardenBench(PARK_BENCH_EE_W_X0, PARK_BENCH_EE_W_Z)
    && inGardenBench(PARK_BENCH_EE_W_X1, PARK_BENCH_EE_W_Z));
  ok('E-park west bench does not kiss a garden-path slab',
    !inGardenPathSlab(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z)
    && !inGardenPathSlab(PARK_BENCH_EE_W_X0, PARK_BENCH_EE_W_Z0)
    && !inGardenPathSlab(PARK_BENCH_EE_W_X1, PARK_BENCH_EE_W_Z0)
    && !inGardenPathSlab(PARK_BENCH_EE_W_X0, PARK_BENCH_EE_W_Z1)
    && !inGardenPathSlab(PARK_BENCH_EE_W_X1, PARK_BENCH_EE_W_Z1)
    && !gardenPathSlabOverlap(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z,
      PARK_BENCH_EE_W_W, PARK_BENCH_EE_W_DEPTH, 0));
  ok('E-park west bench does not kiss the EE spine slabs',
    PARK_BENCH_EE_W_Z1 < PARK_WALK_EE_Z0
    && Math.abs(PARK_WALK_EE_Z0 - PARK_BENCH_EE_W_Z - 0.8) < 1e-9);
  ok('E-park west bench does not kiss 347/94.4',
    PARK_BENCH_EE_W_X1 < PARK_BENCH_EE_X0
    && PARK_BENCH_EE_W_Z === PARK_BENCH_EE_Z
    && !gardenBenchRejected(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z)
    && !gardenBenchRejected(PARK_BENCH_EE_X, PARK_BENCH_EE_Z));
  ok('E-park west bench does not kiss west walk 339→345.2 / z=98.5',
    PARK_BENCH_EE_W_Z1 < PARK_WALK_EE_W_Z0
    && PARK_WALK_EE_W_Z0 === 97.7);
  ok('E-park west bench does not kiss east walk 348.8→355 / z=98.5',
    PARK_BENCH_EE_W_X1 < PARK_WALK_EE_E_X0
    && PARK_WALK_EE_E_X0 === 348.8);
  ok('E-park west bench misses warehouse / helipad / 276 park',
    !warehouseOverlap(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z,
      PARK_BENCH_EE_W_W, PARK_BENCH_EE_W_DEPTH, 0.15)
    && !inWarehouseReserved(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z)
    && !inHelipadReserved(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z)
    && PARK_BENCH_EE_W_X0 > POCKET_PARK_X1 && POCKET_PARK_X1 === 284);

  // ---- sit-box is a void; collider ⊆ legs + slats + back -----------------
  ok('E-park west bench back sits inland (−Z) so the seat faces +Z / z=96',
    parts.backs.every((b) => b.z < geom.z)
    && parts.legs.filter((l) => l.sy === geom.backH).every((l) => l.z < geom.z)
    && parts.zBack < parts.zFront);
  ok('E-park west bench slats are the same 40–50 mm kit',
    parts.slats.length === 8
    && parts.slats.every((s) => Math.abs(s.sz - GARDEN_BENCH_SLAT) < 1e-9));
  const aabbs = shapes.filter((s) => s.tag === 'gardenBench' && s.type === 'aabb');
  const meshParts = parts.legs.concat(parts.slats, parts.backs);
  ok('E-park west bench one collider per leg / slat / back',
    aabbs.length === meshParts.length);
  ok('E-park west bench colliders are only legs + slats + back',
    aabbs.every((s) => s.part === 'leg' || s.part === 'slat' || s.part === 'back'));
  ok('E-park west bench has no filled sit AABB',
    !aabbs.some((s) => s.y0 >= CITY_Y + PARK_BENCH_EE_W_SEAT_H - 0.02
      && s.sy >= 0.20 && s.sz >= 0.20 && s.sx >= 1.0));
  for (let i = 0; i < meshParts.length; i++) {
    const p = meshParts[i];
    const hit = aabbs[i];
    ok(`eew ${p.id} collider ⊆ part ±0.15`,
      !!hit
      && hit.sx <= p.sx + GARDEN_BENCH_COLLIDER_PAD
      && hit.sz <= p.sz + GARDEN_BENCH_COLLIDER_PAD
      && Math.abs(hit.x - p.x) <= GARDEN_BENCH_COLLIDER_PAD
      && Math.abs(hit.z - p.z) <= GARDEN_BENCH_COLLIDER_PAD
      && hit.sx <= p.sx && hit.sz <= p.sz);
    const onPart = probeBlocked(shapes, p.x, p.y0 + Math.min(0.06, p.sy / 2), p.z, 0.015);
    ok(`eew ${p.id} collider exists`, !!onPart);
  }
  const under = voids.find((v) => v.id === 'gardenBench-under');
  const sit = voids.find((v) => v.id === 'gardenBench-sit');
  ok('E-park west bench ships under-clear + sit voids', !!under && !!sit);
  for (const v of voids) {
    const hit = probeBlocked(shapes, v.x, v.y, v.z, v.probe);
    ok(`eew ${v.id} is flyable`, !hit, hit ? `blocked by ${hit.tag} ${hit.part || hit.type}` : '');
  }
  ok('E-park west sit-box is a void', sit && sit.kind === 'sit'
    && sit.y > CITY_Y + PARK_BENCH_EE_W_SEAT_H);
  ok('E-park west sit-box is in front of the back (+Z of centre, toward z=96)',
    sit && sit.z > geom.z);

  // ---- kiss = drop, never nudge ------------------------------------------
  ok('drop if the kit kisses 347/94.4',
    gardenBenchRejected(PARK_BENCH_EE_X, PARK_BENCH_EE_Z) === false
    && gardenBenchRejected(346.1, 94.4) === true);
  ok('drop if the kit kisses 340.5/94.4',
    gardenBenchRejected(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z) === false
    && gardenBenchRejected(339.6, 94.4) === true);
  ok('drop if the kit sits on the EE spine',
    gardenBenchRejected(PARK_WALK_EE_X, PARK_WALK_EE_Z) === true);
  ok('drop if the kit sits on leftoverLot E',
    gardenBenchRejected(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z) === true);
  ok('drop if the kit sits on leftoverLot A/B/C/D',
    gardenBenchRejected(LEFTOVER_LOT_X, LEFTOVER_LOT_Z) === true
    && gardenBenchRejected(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z) === true
    && gardenBenchRejected(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z) === true
    && gardenBenchRejected(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z) === true);
  ok('drop if the kit sits on warehouse / helipad E',
    gardenBenchRejected(WAREHOUSE_X, WAREHOUSE_Z) === true
    && gardenBenchRejected(430, 70) === true);
  ok('drop if the kit sits on 276/90',
    gardenBenchRejected(PARK_BENCH_X, PARK_BENCH_Z) === false
    && gardenBenchRejected(275.1, 90) === true);
  ok('drop if the kit sits on 269.5/90',
    gardenBenchRejected(PARK_BENCH_W_X, PARK_BENCH_W_Z) === false
    && gardenBenchRejected(270.4, 90) === true);
  ok('drop if the kit sits on 282.5/90',
    gardenBenchRejected(PARK_BENCH_E_X, PARK_BENCH_E_Z) === false
    && gardenBenchRejected(281.6, 90) === true);
  ok('drop if the kit sits on x=272 N-S',
    gardenBenchRejected(PARK_WALK_NS_X, PARK_WALK_NS_Z) === true);
  ok('drop if the kit sits on x=280 N-S',
    gardenBenchRejected(PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z) === true);
  ok('drop if the kit sits on pavement / street',
    gardenBenchRejected(0, 27) === true && gardenBenchRejected(57, 80) === true);
  ok('tryPlace drops spine / leftoverLot E / helipad / warehouse / 276',
    tryPlace(ctx, PARK_WALK_EE_X, PARK_WALK_EE_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z) === 0
    && tryPlace(ctx, 430, 70) === 0
    && tryPlace(ctx, WAREHOUSE_X, WAREHOUSE_Z) === 0
    && tryPlace(ctx, POCKET_PARK_X, POCKET_PARK_Z) === 0
    && tryPlace(ctx, PARK_BENCH_X, PARK_BENCH_Z) === 0
    && tryPlace(ctx, PARK_WALK_X0 + 1, PARK_WALK_Z) === 0
    && tryPlace(ctx, PARK_BENCH_EE_X, PARK_BENCH_EE_Z) === 0
    && tryPlace(ctx, PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z) === 0
    && tryPlace(ctx, PARK_WALK_EE_E_X, PARK_WALK_EE_E_Z) === 0);

  // ---- one placer; no new geom function; look locks ----------------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const bench = readFileSync(join(here, 'landmarks/gardenBench.js'), 'utf8');
  const garden = readFileSync(join(here, 'landmarks/gardenPath.js'), 'utf8');
  const leftover = readFileSync(join(here, 'landmarks/leftoverLot.js'), 'utf8');
  const grass = readFileSync(join(here, 'landmarks/leftoverGrass.js'), 'utf8');
  const park = readFileSync(join(here, 'landmarks/pocketPark.js'), 'utf8');
  const constants = readFileSync(join(here, 'constants.js'), 'utf8');
  const house = readFileSync(join(here, 'landmarks/house.js'), 'utf8');
  const warehouse = readFileSync(join(here, 'landmarks/warehouse.js'), 'utf8');
  const drop = readFileSync(join(here, 'landmarks/drop.js'), 'utf8');
  const abando = readFileSync(join(here, 'landmarks/abando.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const blades = readFileSync(join(here, 'blades.js'), 'utf8');
  const water = readFileSync(join(here, 'bayWater.js'), 'utf8');
  const preview = readFileSync(join(here, '../../../preview.html'), 'utf8');
  const follow = readFileSync(join(here, 'follow.js'), 'utf8');
  const checkpoints = readFileSync(join(here, 'checkpoints.js'), 'utf8');
  const quad = readFileSync(join(here, '../../physics/quad.js'), 'utf8');

  ok('tryPlace is still the placer', planting.includes('export function tryPlace'));
  ok('gardenBench is not a second scatterer',
    !bench.includes('scatterModels') && !bench.includes('planDirtBlades'));
  ok('E-park west bench reuses gardenBenchGeom, no E/F/G/EEW/F Geom fork',
    bench.includes('gardenBenchGeom(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z)')
    && bench.includes('gardenBenchParts(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z)')
    && bench.includes('onPavement(PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z)')
    && !/function gardenBenchEGeom/.test(bench)
    && !/gardenBenchEGeom\(/.test(bench)
    && !/function gardenBenchFGeom/.test(bench)
    && !/gardenBenchFGeom\(/.test(bench)
    && !/function gardenBenchGGeom/.test(bench)
    && !/gardenBenchGGeom\(/.test(bench)
    && !/function parkBenchEEWGeom/.test(bench)
    && !/parkBenchEEWGeom\(/.test(bench)
    && !/function parkBenchFGeom/.test(bench)
    && !/parkBenchFGeom\(/.test(bench)
    && constants.includes('export function gardenBenchGeom')
    && constants.includes('340.5 / 94.4')
    && constants.includes('PARK_BENCH_EE_W_X = 340.5')
    && constants.includes('PARK_BENCH_EE_W_Z = 94.4')
    && !/export function gardenBenchEGeom/.test(constants)
    && !/gardenBenchEGeom\(/.test(constants)
    && !/export function gardenBenchFGeom/.test(constants)
    && !/gardenBenchFGeom\(/.test(constants)
    && !/export function gardenBenchGGeom/.test(constants)
    && !/gardenBenchGGeom\(/.test(constants)
    && !/export function parkBenchEEWGeom/.test(constants)
    && !/parkBenchEEWGeom\(/.test(constants)
    && !/export function parkBenchFGeom/.test(constants)
    && !/parkBenchFGeom\(/.test(constants)
    && !existsSync(join(here, 'landmarks/parkBenchEEW.js'))
    && !existsSync(join(here, 'parkBenchEEW.js'))
    && !existsSync(join(here, 'landmarks/gardenBenchE.js'))
    && !existsSync(join(here, 'landmarks/gardenBenchG.js')));
  ok('347/94.4 still reuses gardenBenchGeom',
    bench.includes('gardenBenchGeom(PARK_BENCH_EE_X, PARK_BENCH_EE_Z)')
    && bench.includes('gardenBenchParts(PARK_BENCH_EE_X, PARK_BENCH_EE_Z)'));
  ok('index builds gardenBench on the keepout path after gardenPath',
    index.includes("from './landmarks/gardenBench.js'")
    && index.includes('buildGardenBench(ctx)')
    && index.indexOf('buildGardenBench') > index.indexOf('buildGardenPath')
    && index.indexOf('buildGardenBench') < index.indexOf('buildBlades'));
  ok('no custom mat',
    !/\bShaderMaterial\b/.test(bench) && !/\bonBeforeCompile\b/.test(bench)
    && bench.includes('MeshStandardMaterial'));
  ok('gardenPath was not restacked',
    garden.includes('Tiny Glade') && garden.includes('two-abreast')
    && garden.includes('268') && garden.includes('Desi')
    && !garden.includes('PARK_BENCH_EE_W_'));
  ok('leftoverGrass was not restacked',
    grass.includes('Tiny Glade') && grass.includes('grow-to-gap')
    && grass.includes('leftover-city') && grass.includes('267')
    && !grass.includes('PARK_BENCH_EE_W_') && !grass.includes('parkBenchEEW'));
  ok('pocketPark was not restacked',
    park.includes('Tiny Glade') && park.includes('grow-to-gap')
    && park.includes('276') && park.includes('Desi')
    && !park.includes('PARK_BENCH_EE_W_') && !park.includes('parkBenchEEW'));
  ok('leftoverLot A/B/C/D/E were not restacked',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z)')
    && leftover.includes('chain-link') && leftover.includes('weenie')
    && !leftover.includes('PARK_BENCH_EE_W_')
    && constants.includes('258/84') && constants.includes('295/84')
    && constants.includes('313/84') && constants.includes('330/84')
    && constants.includes('268→284')
    && constants.includes('347 / 94.4')
    && constants.includes('340.5 / 94.4'));
  ok('house was not restacked',
    house.includes('housePlanGeom') && house.includes('weenie')
    && !house.includes('PARK_BENCH_EE_W_'));
  ok('warehouse was not restacked',
    warehouse.includes('warehouseAisleGeom') && warehouse.includes('buildRacks')
    && !warehouse.includes('PARK_BENCH_EE_W_'));
  ok('drop was not restacked',
    drop.includes('dropHoistGeom') && drop.includes('buildWell')
    && !drop.includes('PARK_BENCH_EE_W_'));
  ok('abando was not restacked',
    abando.includes('abandoStairGeom') && abando.includes('buildSilo')
    && !abando.includes('PARK_BENCH_EE_W_'));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust')
    && !blades.includes('PARK_BENCH_EE_W_'));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !water.includes('PARK_BENCH_EE_W_'));
  ok('preview.html was not restacked',
    preview.includes('url=./') && !preview.includes('PARK_BENCH_EE_W_'));
  ok('follow.js was not restacked',
    follow.includes('hauntFollowPath') && !follow.includes('PARK_BENCH_EE_W_'));
  ok('checkpoints.js was not restacked',
    checkpoints.includes('RESTART_OFFSET') && !checkpoints.includes('PARK_BENCH_EE_W_'));
  ok('quad.js GRAVITY stays 9.81',
    /const GRAVITY = 9\.81/.test(quad) && !quad.includes('PARK_BENCH_EE_W_'));
  ok('planting.js was not restacked',
    planting.includes('export function tryPlace')
    && !planting.includes('PARK_BENCH_EE_W_') && !planting.includes('gardenBench'));

  if (fails.length) {
    console.error('[miami-gardenBench-ee-w] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-gardenBench-ee-w] ok', passedCount, 'checks');
  }
  return {
    passed: fails.length === 0, fails, passedCount,
    placedE: fieldE.placed.length, plannedE,
    x: PARK_BENCH_EE_W_X, z: PARK_BENCH_EE_W_Z,
    x0: PARK_BENCH_EE_W_X0, x1: PARK_BENCH_EE_W_X1,
    yaw: PARK_BENCH_EE_W_YAW,
  };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('gardenBenchEEWTest.js');
if (isMain) {
  const r = runMiamiGardenBenchEEWTests();
  if (!r.passed) process.exit(1);
}
