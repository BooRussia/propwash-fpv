// Headless checks for the Miami Tiny Glade garden bench.
// No three.js, no game state. Not a haunt. Not leftoverLot. Not a path restack.
//
//   node ./tools/run-miami-garden-bench-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_Y,
  GARDEN_BENCH_X, GARDEN_BENCH_Z, GARDEN_BENCH_W, GARDEN_BENCH_DEPTH,
  GARDEN_BENCH_SEAT_H, GARDEN_BENCH_BACK_H, GARDEN_BENCH_UNDER_CLEAR,
  GARDEN_BENCH_SLAT, GARDEN_BENCH_GAP, GARDEN_BENCH_LEG,
  GARDEN_BENCH_COLLIDER_PAD, GARDEN_BENCH_AABB,
  GARDEN_BENCH_X0, GARDEN_BENCH_X1, GARDEN_BENCH_Z0, GARDEN_BENCH_Z1,
  GARDEN_PATH_X, GARDEN_PATH_Z, GARDEN_PATH_W, GARDEN_PATH_LEN,
  GARDEN_PATH_X0, GARDEN_PATH_X1, GARDEN_PATH_Z0, GARDEN_PATH_Z1,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_X0, LEFTOVER_LOT_X1,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z, LEFTOVER_LOT_B_X0, LEFTOVER_LOT_B_X1,
  LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z, LEFTOVER_LOT_C_X0, LEFTOVER_LOT_C_X1,
  LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z, LEFTOVER_LOT_D_X0, LEFTOVER_LOT_D_X1,
  PARK_BENCH_X, PARK_BENCH_Z, PARK_BENCH_YAW, PARK_BENCH_W,
  PARK_BENCH_DEPTH, PARK_BENCH_SEAT_H, PARK_BENCH_BACK_H, PARK_BENCH_UNDER_CLEAR,
  PARK_BENCH_X0, PARK_BENCH_X1, PARK_BENCH_Z0, PARK_BENCH_Z1,
  PARK_BENCH_W_X, PARK_BENCH_W_Z, PARK_BENCH_W_YAW, PARK_BENCH_W_W,
  PARK_BENCH_W_DEPTH, PARK_BENCH_W_SEAT_H, PARK_BENCH_W_BACK_H,
  PARK_BENCH_W_UNDER_CLEAR,
  PARK_BENCH_W_X0, PARK_BENCH_W_X1, PARK_BENCH_W_Z0, PARK_BENCH_W_Z1,
  PARK_WALK_X0, PARK_WALK_X1, PARK_WALK_Z,
  PARK_WALK_E_X0, PARK_WALK_E_X1, PARK_WALK_E_Z,
  PARK_WALK_NS_X, PARK_WALK_NS_Z, PARK_WALK_NS_X0, PARK_WALK_NS_X1,
  PARK_WALK_NS_Z0, PARK_WALK_NS_Z1,
  PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z, PARK_WALK_NS_E_X0, PARK_WALK_NS_E_X1,
  PARK_PERGOLA_X, PARK_PERGOLA_Z,
  POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D,
  POCKET_PARK_X0, POCKET_PARK_X1, POCKET_PARK_Z0, POCKET_PARK_Z1,
  LEFTOVER_GRASS_X0, LEFTOVER_GRASS_X1, LEFTOVER_GRASS_Z0, LEFTOVER_GRASS_Z1,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, inReserved, reservedOverlap, streetOverlap, groundHeight,
  leftoverLotGeom,
  gardenBenchGeom, gardenBenchParts, gardenBenchVoids, gardenBenchColliderShapes,
  gardenBenchRejected, inGardenBench,
  inGardenPathSlab, gardenPathSlabOverlap, inLeftoverLotReserved, leftoverLotOverlap,
} from './constants.js';
import { tryPlace } from './planting.js';

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

export function runMiamiGardenBenchTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const geom = gardenBenchGeom();
  const parts = gardenBenchParts();
  const voids = gardenBenchVoids();
  const shapes = gardenBenchColliderShapes();
  const geomA = leftoverLotGeom();

  // ---- signed cell (Desi + Reesy); do not slide x/z ----------------------
  ok('bench cell is signed 276 / 82.4', GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('1.8 m is a 3-seat slat', GARDEN_BENCH_W === 1.8);
  ok('seat H is 0.43–0.46 m',
    GARDEN_BENCH_SEAT_H >= 0.43 && GARDEN_BENCH_SEAT_H <= 0.46
    && geom.seatH === GARDEN_BENCH_SEAT_H);
  ok('depth is ~0.45 m',
    Math.abs(GARDEN_BENCH_DEPTH - 0.45) < 1e-9 && geom.depth === GARDEN_BENCH_DEPTH);
  ok('back crown is 0.80–0.90 m',
    GARDEN_BENCH_BACK_H >= 0.80 && GARDEN_BENCH_BACK_H <= 0.90
    && geom.backH === GARDEN_BENCH_BACK_H);
  ok('under-slat clear is ~0.40 m',
    Math.abs(GARDEN_BENCH_UNDER_CLEAR - 0.40) < 1e-9
    && geom.underClear === GARDEN_BENCH_UNDER_CLEAR);
  ok('geom matches signed constants',
    geom.x === 276 && geom.z === 82.4 && geom.w === 1.8
    && Math.abs(geom.x0 - GARDEN_BENCH_X0) < 1e-9
    && Math.abs(geom.x1 - GARDEN_BENCH_X1) < 1e-9
    && Math.abs(geom.z0 - GARDEN_BENCH_Z0) < 1e-9
    && Math.abs(geom.z1 - GARDEN_BENCH_Z1) < 1e-9);
  ok('x/z were not invented or slid',
    geom.x === GARDEN_BENCH_X && geom.z === GARDEN_BENCH_Z
    && GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);

  ok('bench sits 0.8 m ocean of path z0=83.2',
    GARDEN_PATH_Z0 === 83.2
    && Math.abs(GARDEN_PATH_Z0 - GARDEN_BENCH_Z - 0.8) < 1e-9);
  ok('path stays 268→284 / z=84 / 1.6 m',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284
    && GARDEN_PATH_Z === 84 && GARDEN_PATH_W === 1.6
    && GARDEN_PATH_LEN === 16 && GARDEN_PATH_X === 276
    && GARDEN_PATH_Z0 === 83.2 && GARDEN_PATH_Z1 === 84.8);

  ok('bench is not pavement', !onPavement(GARDEN_BENCH_X, GARDEN_BENCH_Z));
  ok('bench is not boardwalk', !onBoardwalk(GARDEN_BENCH_X, GARDEN_BENCH_Z));
  ok('bench is not roadway', !onRoadway(GARDEN_BENCH_Z));
  ok('bench is not a cross-street', !onCrossStreet(GARDEN_BENCH_X, GARDEN_BENCH_Z));
  ok('bench is not a sidewalk slab', !onSidewalk(GARDEN_BENCH_X, GARDEN_BENCH_Z));
  ok('bench sits on leftover-city grade',
    groundHeight(GARDEN_BENCH_X, GARDEN_BENCH_Z) === CITY_Y);
  ok('bench is reserved', inReserved(GARDEN_BENCH_X, GARDEN_BENCH_Z));
  ok('bench is a keepout', inKeepout(GARDEN_BENCH_X, GARDEN_BENCH_Z));
  ok('reservedOverlap covers the signed slat',
    reservedOverlap(GARDEN_BENCH_X, GARDEN_BENCH_Z, GARDEN_BENCH_W, GARDEN_BENCH_DEPTH, 0.15));
  ok('tryPlace drops the reserved bench',
    tryPlace(ctx, GARDEN_BENCH_X, GARDEN_BENCH_Z) === 0);
  ok('tryPlace does not remap the bench',
    tryPlace(ctx, GARDEN_BENCH_X, GARDEN_BENCH_Z) === 0);
  ok('signed cell is not rejected', !gardenBenchRejected());
  ok('bench footprint is not in the street',
    !streetOverlap(GARDEN_BENCH_X, GARDEN_BENCH_Z, GARDEN_BENCH_W, GARDEN_BENCH_DEPTH));
  ok('inGardenBench covers the signed plate',
    inGardenBench(GARDEN_BENCH_X, GARDEN_BENCH_Z)
    && inGardenBench(GARDEN_BENCH_X0, GARDEN_BENCH_Z)
    && inGardenBench(GARDEN_BENCH_X1, GARDEN_BENCH_Z));

  // ---- leftoverLot A/B/C stay put; path stays put ------------------------
  ok('leftoverLot A stays 258/84', LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84);
  ok('leftoverLot B stays 295/84', LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84);
  ok('leftoverLot C stays 313/84', LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84);
  ok('leftoverLot D stays 330/84', LEFTOVER_LOT_D_X === 330 && LEFTOVER_LOT_D_Z === 84);
  ok('path sits off leftoverLot A x1=265',
    GARDEN_PATH_X0 >= LEFTOVER_LOT_X1 && LEFTOVER_LOT_X1 === 265);
  ok('path sits off leftoverLot B x0=288',
    GARDEN_PATH_X1 <= LEFTOVER_LOT_B_X0 && LEFTOVER_LOT_B_X0 === 288);
  ok('bench does not overlap leftoverLot A/B/C reserved',
    !leftoverLotOverlap(GARDEN_BENCH_X, GARDEN_BENCH_Z, GARDEN_BENCH_W, GARDEN_BENCH_DEPTH, 0.15)
    && !inLeftoverLotReserved(GARDEN_BENCH_X, GARDEN_BENCH_Z)
    && !inLeftoverLotReserved(GARDEN_BENCH_X0, GARDEN_BENCH_Z)
    && !inLeftoverLotReserved(GARDEN_BENCH_X1, GARDEN_BENCH_Z));
  ok('leftoverLot A/B/C/D geometry was not slid',
    LEFTOVER_LOT_X0 === 251 && LEFTOVER_LOT_X1 === 265
    && LEFTOVER_LOT_B_X0 === 288 && LEFTOVER_LOT_B_X1 === 302
    && LEFTOVER_LOT_C_X0 === 306 && LEFTOVER_LOT_C_X1 === 320
    && LEFTOVER_LOT_D_X0 === 323 && LEFTOVER_LOT_D_X1 === 337
    && geomA.x0 === LEFTOVER_LOT_X0 && geomA.x1 === LEFTOVER_LOT_X1);
  ok('tryPlace still drops leftoverLot A/B/C/D',
    tryPlace(ctx, LEFTOVER_LOT_X, LEFTOVER_LOT_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z) === 0);
  ok('leftoverGrass stays 267–285 / 81–86',
    LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0);
  ok('pocket park stays 276/92, 16×8 (268–284 × 88–96)',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_W === 16 && POCKET_PARK_D === 8
    && POCKET_PARK_X0 === 268 && POCKET_PARK_X1 === 284
    && POCKET_PARK_Z0 === 88 && POCKET_PARK_Z1 === 96);
  ok('tryPlace still drops the garden path',
    tryPlace(ctx, GARDEN_PATH_X, GARDEN_PATH_Z) === 0);
  ok('tryPlace still drops pavement / street',
    tryPlace(ctx, 0, 27) === 0 && tryPlace(ctx, 57, 80) === 0);

  // ---- does not kiss a garden-path slab ----------------------------------
  ok('bench centre is not in a flagstone',
    !inGardenPathSlab(GARDEN_BENCH_X, GARDEN_BENCH_Z));
  ok('bench corners are not in a flagstone',
    !inGardenPathSlab(GARDEN_BENCH_X0, GARDEN_BENCH_Z0)
    && !inGardenPathSlab(GARDEN_BENCH_X1, GARDEN_BENCH_Z0)
    && !inGardenPathSlab(GARDEN_BENCH_X0, GARDEN_BENCH_Z1)
    && !inGardenPathSlab(GARDEN_BENCH_X1, GARDEN_BENCH_Z1));
  ok('bench footprint does not overlap a slab',
    !gardenPathSlabOverlap(GARDEN_BENCH_X, GARDEN_BENCH_Z,
      GARDEN_BENCH_W, GARDEN_BENCH_DEPTH, 0));

  // ---- park bench (same kit at signed 276 / 90; yaw −Z to the walk) ------
  const geomP = gardenBenchGeom(PARK_BENCH_X, PARK_BENCH_Z);
  const partsP = gardenBenchParts(PARK_BENCH_X, PARK_BENCH_Z);
  const voidsP = gardenBenchVoids(geomP);
  const shapesP = gardenBenchColliderShapes(geomP);
  ok('park bench cell is signed 276 / 90', PARK_BENCH_X === 276 && PARK_BENCH_Z === 90);
  ok('park bench x/z were not invented or slid',
    geomP.x === 276 && geomP.z === 90
    && geomP.x === PARK_BENCH_X && geomP.z === PARK_BENCH_Z
    && GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('park bench yaw faces −Z / south toward the walk',
    PARK_BENCH_YAW === Math.PI && geomP.yaw === PARK_BENCH_YAW
    && geomP.yaw === Math.PI);
  ok('park bench is the same 1.8 m 3-seat kit',
    PARK_BENCH_W === 1.8 && PARK_BENCH_W === GARDEN_BENCH_W
    && geomP.w === GARDEN_BENCH_W);
  ok('park bench seat H is 0.43–0.46 m',
    PARK_BENCH_SEAT_H >= 0.43 && PARK_BENCH_SEAT_H <= 0.46
    && PARK_BENCH_SEAT_H === GARDEN_BENCH_SEAT_H
    && geomP.seatH === GARDEN_BENCH_SEAT_H);
  ok('park bench depth is ~0.45 m',
    Math.abs(PARK_BENCH_DEPTH - 0.45) < 1e-9
    && PARK_BENCH_DEPTH === GARDEN_BENCH_DEPTH
    && geomP.depth === GARDEN_BENCH_DEPTH);
  ok('park bench back crown is 0.80–0.90 m',
    PARK_BENCH_BACK_H >= 0.80 && PARK_BENCH_BACK_H <= 0.90
    && PARK_BENCH_BACK_H === GARDEN_BENCH_BACK_H
    && geomP.backH === GARDEN_BENCH_BACK_H);
  ok('park bench under-slat clear is ~0.40 m',
    Math.abs(PARK_BENCH_UNDER_CLEAR - 0.40) < 1e-9
    && PARK_BENCH_UNDER_CLEAR === GARDEN_BENCH_UNDER_CLEAR
    && geomP.underClear === GARDEN_BENCH_UNDER_CLEAR);
  ok('park bench geom matches signed constants',
    geomP.x === 276 && geomP.z === 90 && geomP.w === 1.8
    && Math.abs(geomP.x0 - PARK_BENCH_X0) < 1e-9
    && Math.abs(geomP.x1 - PARK_BENCH_X1) < 1e-9
    && Math.abs(geomP.z0 - PARK_BENCH_Z0) < 1e-9
    && Math.abs(geomP.z1 - PARK_BENCH_Z1) < 1e-9);
  ok('garden bench at 276 / 82.4 was not slid',
    gardenBenchGeom().x === 276 && gardenBenchGeom().z === 82.4
    && gardenBenchGeom().yaw === 0
    && GARDEN_BENCH_Z === 82.4);
  ok('park bench sits inland of path z1=84.8',
    PARK_BENCH_Z0 > GARDEN_PATH_Z1 && GARDEN_PATH_Z1 === 84.8);
  ok('park bench is not pavement', !onPavement(PARK_BENCH_X, PARK_BENCH_Z));
  ok('park bench is not boardwalk', !onBoardwalk(PARK_BENCH_X, PARK_BENCH_Z));
  ok('park bench is not roadway', !onRoadway(PARK_BENCH_Z));
  ok('park bench is not a cross-street', !onCrossStreet(PARK_BENCH_X, PARK_BENCH_Z));
  ok('park bench is not a sidewalk slab', !onSidewalk(PARK_BENCH_X, PARK_BENCH_Z));
  ok('park bench sits on leftover-city grade',
    groundHeight(PARK_BENCH_X, PARK_BENCH_Z) === CITY_Y);
  ok('park bench is reserved', inReserved(PARK_BENCH_X, PARK_BENCH_Z));
  ok('park bench is a keepout', inKeepout(PARK_BENCH_X, PARK_BENCH_Z));
  ok('reservedOverlap covers the park slat',
    reservedOverlap(PARK_BENCH_X, PARK_BENCH_Z, PARK_BENCH_W, PARK_BENCH_DEPTH, 0.15));
  ok('tryPlace drops the reserved park bench',
    tryPlace(ctx, PARK_BENCH_X, PARK_BENCH_Z) === 0);
  ok('tryPlace does not remap the park bench',
    tryPlace(ctx, PARK_BENCH_X, PARK_BENCH_Z) === 0);
  ok('park bench cell is not rejected',
    !gardenBenchRejected(PARK_BENCH_X, PARK_BENCH_Z));
  ok('park bench footprint is not in the street',
    !streetOverlap(PARK_BENCH_X, PARK_BENCH_Z, PARK_BENCH_W, PARK_BENCH_DEPTH));
  ok('inGardenBench covers the park plate',
    inGardenBench(PARK_BENCH_X, PARK_BENCH_Z)
    && inGardenBench(PARK_BENCH_X0, PARK_BENCH_Z)
    && inGardenBench(PARK_BENCH_X1, PARK_BENCH_Z));
  ok('park bench does not overlap leftoverLot A/B/C/D reserved',
    !leftoverLotOverlap(PARK_BENCH_X, PARK_BENCH_Z, PARK_BENCH_W, PARK_BENCH_DEPTH, 0.15)
    && !inLeftoverLotReserved(PARK_BENCH_X, PARK_BENCH_Z)
    && !inLeftoverLotReserved(PARK_BENCH_X0, PARK_BENCH_Z)
    && !inLeftoverLotReserved(PARK_BENCH_X1, PARK_BENCH_Z));
  ok('park bench does not kiss a garden-path slab',
    !inGardenPathSlab(PARK_BENCH_X, PARK_BENCH_Z)
    && !inGardenPathSlab(PARK_BENCH_X0, PARK_BENCH_Z0)
    && !inGardenPathSlab(PARK_BENCH_X1, PARK_BENCH_Z0)
    && !inGardenPathSlab(PARK_BENCH_X0, PARK_BENCH_Z1)
    && !inGardenPathSlab(PARK_BENCH_X1, PARK_BENCH_Z1)
    && !gardenPathSlabOverlap(PARK_BENCH_X, PARK_BENCH_Z,
      PARK_BENCH_W, PARK_BENCH_DEPTH, 0));
  ok('park bench back sits inland (+Z) so the seat faces −Z',
    partsP.backs.every((b) => b.z > geomP.z)
    && partsP.legs.filter((l) => l.sy === geomP.backH).every((l) => l.z > geomP.z)
    && partsP.zBack > partsP.zFront);
  ok('park bench slats are the same 40–50 mm kit',
    partsP.slats.length === 8
    && partsP.slats.every((s) => Math.abs(s.sz - GARDEN_BENCH_SLAT) < 1e-9));
  const aabbsP = shapesP.filter((s) => s.tag === 'gardenBench' && s.type === 'aabb');
  const meshPartsP = partsP.legs.concat(partsP.slats, partsP.backs);
  ok('park bench one collider per leg / slat / back', aabbsP.length === meshPartsP.length);
  ok('park bench colliders are only legs + slats + back',
    aabbsP.every((s) => s.part === 'leg' || s.part === 'slat' || s.part === 'back'));
  ok('park bench has no filled sit AABB',
    !aabbsP.some((s) => s.y0 >= CITY_Y + PARK_BENCH_SEAT_H - 0.02
      && s.sy >= 0.20 && s.sz >= 0.20 && s.sx >= 1.0));
  for (let i = 0; i < meshPartsP.length; i++) {
    const p = meshPartsP[i];
    const hit = aabbsP[i];
    ok(`park ${p.id} collider ⊆ part ±0.15`,
      !!hit
      && hit.sx <= p.sx + GARDEN_BENCH_COLLIDER_PAD
      && hit.sz <= p.sz + GARDEN_BENCH_COLLIDER_PAD
      && Math.abs(hit.x - p.x) <= GARDEN_BENCH_COLLIDER_PAD
      && Math.abs(hit.z - p.z) <= GARDEN_BENCH_COLLIDER_PAD
      && hit.sx <= p.sx && hit.sz <= p.sz);
    const onPart = probeBlocked(shapesP, p.x, p.y0 + Math.min(0.06, p.sy / 2), p.z, 0.015);
    ok(`park ${p.id} collider exists`, !!onPart);
  }
  const underP = voidsP.find((v) => v.id === 'gardenBench-under');
  const sitP = voidsP.find((v) => v.id === 'gardenBench-sit');
  ok('park bench ships under-clear + sit voids', !!underP && !!sitP);
  for (const v of voidsP) {
    const hit = probeBlocked(shapesP, v.x, v.y, v.z, v.probe);
    ok(`park ${v.id} is flyable`, !hit, hit ? `blocked by ${hit.tag} ${hit.part || hit.type}` : '');
  }
  ok('park sit-box is a void', sitP && sitP.kind === 'sit'
    && sitP.y > CITY_Y + PARK_BENCH_SEAT_H);
  ok('park sit-box is in front of the back (−Z of centre)',
    sitP && sitP.z < geomP.z);

  // ---- west park bench (same kit at signed 269.5 / 90; yaw −Z to the walk)
  const geomW = gardenBenchGeom(PARK_BENCH_W_X, PARK_BENCH_W_Z);
  const partsW = gardenBenchParts(PARK_BENCH_W_X, PARK_BENCH_W_Z);
  const voidsW = gardenBenchVoids(geomW);
  const shapesW = gardenBenchColliderShapes(geomW);
  ok('west park bench cell is signed 269.5 / 90',
    PARK_BENCH_W_X === 269.5 && PARK_BENCH_W_Z === 90);
  ok('west park bench x/z were not invented or slid',
    geomW.x === 269.5 && geomW.z === 90
    && geomW.x === PARK_BENCH_W_X && geomW.z === PARK_BENCH_W_Z
    && PARK_BENCH_X === 276 && PARK_BENCH_Z === 90
    && GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('west park bench yaw faces −Z / south toward the walk',
    PARK_BENCH_W_YAW === Math.PI && geomW.yaw === PARK_BENCH_W_YAW
    && geomW.yaw === PARK_BENCH_YAW && geomW.yaw === Math.PI);
  ok('west park bench is the same 1.8 m 3-seat kit',
    PARK_BENCH_W_W === 1.8 && PARK_BENCH_W_W === GARDEN_BENCH_W
    && PARK_BENCH_W_W === PARK_BENCH_W && geomW.w === GARDEN_BENCH_W);
  ok('west park bench seat H is 0.43–0.46 m',
    PARK_BENCH_W_SEAT_H >= 0.43 && PARK_BENCH_W_SEAT_H <= 0.46
    && PARK_BENCH_W_SEAT_H === GARDEN_BENCH_SEAT_H
    && geomW.seatH === GARDEN_BENCH_SEAT_H);
  ok('west park bench depth is ~0.45 m',
    Math.abs(PARK_BENCH_W_DEPTH - 0.45) < 1e-9
    && PARK_BENCH_W_DEPTH === GARDEN_BENCH_DEPTH
    && geomW.depth === GARDEN_BENCH_DEPTH);
  ok('west park bench back crown is 0.80–0.90 m',
    PARK_BENCH_W_BACK_H >= 0.80 && PARK_BENCH_W_BACK_H <= 0.90
    && PARK_BENCH_W_BACK_H === GARDEN_BENCH_BACK_H
    && geomW.backH === GARDEN_BENCH_BACK_H);
  ok('west park bench under-slat clear is ~0.40 m',
    Math.abs(PARK_BENCH_W_UNDER_CLEAR - 0.40) < 1e-9
    && PARK_BENCH_W_UNDER_CLEAR === GARDEN_BENCH_UNDER_CLEAR
    && geomW.underClear === GARDEN_BENCH_UNDER_CLEAR);
  ok('west park bench geom matches signed constants',
    geomW.x === 269.5 && geomW.z === 90 && geomW.w === 1.8
    && Math.abs(geomW.x0 - PARK_BENCH_W_X0) < 1e-9
    && Math.abs(geomW.x1 - PARK_BENCH_W_X1) < 1e-9
    && Math.abs(geomW.z0 - PARK_BENCH_W_Z0) < 1e-9
    && Math.abs(geomW.z1 - PARK_BENCH_W_Z1) < 1e-9
    && PARK_BENCH_W_X0 === 268.6 && PARK_BENCH_W_X1 === 270.4);
  ok('0.8 m is edge-to-walk, not center',
    PARK_BENCH_W_X1 === 270.4 && PARK_WALK_NS_X0 === 271.2
    && Math.abs(PARK_BENCH_W_X1 + 0.8 - PARK_WALK_NS_X0) < 1e-9
    && Math.abs(PARK_WALK_NS_X0 - PARK_BENCH_W_X) !== 0.8);
  ok('west end 268.6 stays inside the lawn (lawn west 268)',
    PARK_BENCH_W_X0 === 268.6 && PARK_BENCH_W_X0 > 268
    && LEFTOVER_GRASS_X0 === 267 && POCKET_PARK_X0 === 268);
  ok('misses 276/90 by ~4.7 m',
    Math.abs(PARK_BENCH_X0 - PARK_BENCH_W_X1 - 4.7) < 1e-9
    && PARK_BENCH_X === 276 && PARK_BENCH_Z === 90
    && PARK_BENCH_X0 === 275.1 && PARK_BENCH_W_X1 === 270.4);
  ok('existing benches stay 276/90 and 276/82.4',
    PARK_BENCH_X === 276 && PARK_BENCH_Z === 90
    && GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4
    && gardenBenchGeom().x === 276 && gardenBenchGeom().z === 82.4
    && gardenBenchGeom(PARK_BENCH_X, PARK_BENCH_Z).x === 276
    && gardenBenchGeom(PARK_BENCH_X, PARK_BENCH_Z).z === 90);
  ok('walks stay 84 / west 268→274.2 / east 277.8→284 / N-S 272 / N-S 280',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284 && GARDEN_PATH_Z === 84
    && PARK_WALK_X0 === 268 && PARK_WALK_X1 === 274.2 && PARK_WALK_Z === 94
    && PARK_WALK_E_X0 === 277.8 && PARK_WALK_E_X1 === 284 && PARK_WALK_E_Z === 94
    && PARK_WALK_NS_X === 272 && PARK_WALK_NS_X0 === 271.2
    && PARK_WALK_NS_X1 === 272.8 && PARK_WALK_NS_Z0 === 85.2
    && PARK_WALK_NS_Z1 === 92.8 && PARK_WALK_NS_Z === 89
    && PARK_WALK_NS_E_X === 280 && PARK_WALK_NS_E_X0 === 279.2
    && PARK_WALK_NS_E_X1 === 280.8 && PARK_WALK_NS_E_Z === 89);
  ok('pergola stays 276/94', PARK_PERGOLA_X === 276 && PARK_PERGOLA_Z === 94);
  ok('west park bench sits inland of path z1=84.8',
    PARK_BENCH_W_Z0 > GARDEN_PATH_Z1 && GARDEN_PATH_Z1 === 84.8);
  ok('west park bench is not pavement', !onPavement(PARK_BENCH_W_X, PARK_BENCH_W_Z));
  ok('west park bench is not boardwalk', !onBoardwalk(PARK_BENCH_W_X, PARK_BENCH_W_Z));
  ok('west park bench is not roadway', !onRoadway(PARK_BENCH_W_Z));
  ok('west park bench is not a cross-street',
    !onCrossStreet(PARK_BENCH_W_X, PARK_BENCH_W_Z));
  ok('west park bench is not a sidewalk slab',
    !onSidewalk(PARK_BENCH_W_X, PARK_BENCH_W_Z));
  ok('west park bench sits on leftover-city grade',
    groundHeight(PARK_BENCH_W_X, PARK_BENCH_W_Z) === CITY_Y);
  ok('west park bench is reserved', inReserved(PARK_BENCH_W_X, PARK_BENCH_W_Z));
  ok('west park bench is a keepout', inKeepout(PARK_BENCH_W_X, PARK_BENCH_W_Z));
  ok('reservedOverlap covers the west park slat',
    reservedOverlap(PARK_BENCH_W_X, PARK_BENCH_W_Z,
      PARK_BENCH_W_W, PARK_BENCH_W_DEPTH, 0.15));
  ok('tryPlace drops the reserved west park bench',
    tryPlace(ctx, PARK_BENCH_W_X, PARK_BENCH_W_Z) === 0);
  ok('tryPlace does not remap the west park bench',
    tryPlace(ctx, PARK_BENCH_W_X, PARK_BENCH_W_Z) === 0);
  ok('west park bench cell is not rejected',
    !gardenBenchRejected(PARK_BENCH_W_X, PARK_BENCH_W_Z));
  ok('west park bench footprint is not in the street',
    !streetOverlap(PARK_BENCH_W_X, PARK_BENCH_W_Z,
      PARK_BENCH_W_W, PARK_BENCH_W_DEPTH));
  ok('inGardenBench covers the west park plate',
    inGardenBench(PARK_BENCH_W_X, PARK_BENCH_W_Z)
    && inGardenBench(PARK_BENCH_W_X0, PARK_BENCH_W_Z)
    && inGardenBench(PARK_BENCH_W_X1, PARK_BENCH_W_Z));
  ok('west park bench does not overlap leftoverLot A/B/C/D reserved',
    !leftoverLotOverlap(PARK_BENCH_W_X, PARK_BENCH_W_Z,
      PARK_BENCH_W_W, PARK_BENCH_W_DEPTH, 0.15)
    && !inLeftoverLotReserved(PARK_BENCH_W_X, PARK_BENCH_W_Z)
    && !inLeftoverLotReserved(PARK_BENCH_W_X0, PARK_BENCH_W_Z)
    && !inLeftoverLotReserved(PARK_BENCH_W_X1, PARK_BENCH_W_Z));
  ok('west park bench does not kiss a garden-path slab',
    !inGardenPathSlab(PARK_BENCH_W_X, PARK_BENCH_W_Z)
    && !inGardenPathSlab(PARK_BENCH_W_X0, PARK_BENCH_W_Z0)
    && !inGardenPathSlab(PARK_BENCH_W_X1, PARK_BENCH_W_Z0)
    && !inGardenPathSlab(PARK_BENCH_W_X0, PARK_BENCH_W_Z1)
    && !inGardenPathSlab(PARK_BENCH_W_X1, PARK_BENCH_W_Z1)
    && !gardenPathSlabOverlap(PARK_BENCH_W_X, PARK_BENCH_W_Z,
      PARK_BENCH_W_W, PARK_BENCH_W_DEPTH, 0));
  ok('west park bench does not kiss x=272 N-S',
    PARK_BENCH_W_X1 < PARK_WALK_NS_X0
    && Math.abs(PARK_WALK_NS_X0 - PARK_BENCH_W_X1 - 0.8) < 1e-9);
  ok('west park bench back sits inland (+Z) so the seat faces −Z',
    partsW.backs.every((b) => b.z > geomW.z)
    && partsW.legs.filter((l) => l.sy === geomW.backH).every((l) => l.z > geomW.z)
    && partsW.zBack > partsW.zFront);
  ok('west park bench slats are the same 40–50 mm kit',
    partsW.slats.length === 8
    && partsW.slats.every((s) => Math.abs(s.sz - GARDEN_BENCH_SLAT) < 1e-9));
  const aabbsW = shapesW.filter((s) => s.tag === 'gardenBench' && s.type === 'aabb');
  const meshPartsW = partsW.legs.concat(partsW.slats, partsW.backs);
  ok('west park bench one collider per leg / slat / back',
    aabbsW.length === meshPartsW.length);
  ok('west park bench colliders are only legs + slats + back',
    aabbsW.every((s) => s.part === 'leg' || s.part === 'slat' || s.part === 'back'));
  ok('west park bench has no filled sit AABB',
    !aabbsW.some((s) => s.y0 >= CITY_Y + PARK_BENCH_W_SEAT_H - 0.02
      && s.sy >= 0.20 && s.sz >= 0.20 && s.sx >= 1.0));
  for (let i = 0; i < meshPartsW.length; i++) {
    const p = meshPartsW[i];
    const hit = aabbsW[i];
    ok(`west ${p.id} collider ⊆ part ±0.15`,
      !!hit
      && hit.sx <= p.sx + GARDEN_BENCH_COLLIDER_PAD
      && hit.sz <= p.sz + GARDEN_BENCH_COLLIDER_PAD
      && Math.abs(hit.x - p.x) <= GARDEN_BENCH_COLLIDER_PAD
      && Math.abs(hit.z - p.z) <= GARDEN_BENCH_COLLIDER_PAD
      && hit.sx <= p.sx && hit.sz <= p.sz);
    const onPart = probeBlocked(shapesW, p.x, p.y0 + Math.min(0.06, p.sy / 2), p.z, 0.015);
    ok(`west ${p.id} collider exists`, !!onPart);
  }
  const underW = voidsW.find((v) => v.id === 'gardenBench-under');
  const sitW = voidsW.find((v) => v.id === 'gardenBench-sit');
  ok('west park bench ships under-clear + sit voids', !!underW && !!sitW);
  for (const v of voidsW) {
    const hit = probeBlocked(shapesW, v.x, v.y, v.z, v.probe);
    ok(`west ${v.id} is flyable`, !hit, hit ? `blocked by ${hit.tag} ${hit.part || hit.type}` : '');
  }
  ok('west sit-box is a void', sitW && sitW.kind === 'sit'
    && sitW.y > CITY_Y + PARK_BENCH_W_SEAT_H);
  ok('west sit-box is in front of the back (−Z of centre)',
    sitW && sitW.z < geomW.z);

  // ---- drop if it kisses x=272 N-S / 276/90 / lots / pavement; never nudge
  ok('drop if the kit sits on x=272 N-S',
    gardenBenchRejected(PARK_WALK_NS_X, PARK_WALK_NS_Z) === true);
  ok('drop if the kit sits on 276/90',
    gardenBenchRejected(PARK_BENCH_X, PARK_BENCH_Z) === false
    && gardenBenchRejected(275.1, 90) === true);
  ok('drop if the kit sits on leftoverLot A/B/C/D',
    gardenBenchRejected(LEFTOVER_LOT_X, LEFTOVER_LOT_Z) === true
    && gardenBenchRejected(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z) === true
    && gardenBenchRejected(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z) === true
    && gardenBenchRejected(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z) === true);
  ok('drop if the kit sits on pavement / street',
    gardenBenchRejected(0, 27) === true && gardenBenchRejected(57, 80) === true);

  // ---- slats 40–50 mm / gaps 10–15 mm ------------------------------------
  ok('slat width is 40–50 mm',
    GARDEN_BENCH_SLAT >= 0.040 && GARDEN_BENCH_SLAT <= 0.050);
  ok('slat gap is 10–15 mm',
    GARDEN_BENCH_GAP >= 0.010 && GARDEN_BENCH_GAP <= 0.015);
  ok('seat thickness is 40–50 mm',
    geom.seatH - geom.underClear >= 0.040
    && geom.seatH - geom.underClear <= 0.050);
  ok('eight seat slats span the 0.45 m depth',
    parts.slats.length === 8
    && parts.slats.every((s) => Math.abs(s.sz - GARDEN_BENCH_SLAT) < 1e-9));
  const seat0 = parts.slats[0];
  const seat1 = parts.slats[1];
  ok('seat slat gap is 10–15 mm',
    !!seat0 && !!seat1
    && (seat1.z - seat1.sz / 2) - (seat0.z + seat0.sz / 2) >= 0.010 - 1e-9
    && (seat1.z - seat1.sz / 2) - (seat0.z + seat0.sz / 2) <= 0.015 + 1e-9);
  ok('four legs so grass can lean',
    parts.legs.length === 4 && GARDEN_BENCH_LEG > 0.05 && GARDEN_BENCH_LEG < 0.12);
  ok('back crown piece sits at backH',
    parts.backs.some((b) => b.id === 'back-crown'
      && Math.abs((b.y0 + b.sy) - (CITY_Y + GARDEN_BENCH_BACK_H)) < 1e-9));

  // ---- collider ⊆ legs + slats + back; sit-box is a void -----------------
  const aabbs = shapes.filter((s) => s.tag === 'gardenBench' && s.type === 'aabb');
  const meshParts = parts.legs.concat(parts.slats, parts.backs);
  ok('one collider per leg / slat / back', aabbs.length === meshParts.length);
  ok('colliders are only legs + slats + back',
    aabbs.every((s) => s.part === 'leg' || s.part === 'slat' || s.part === 'back'));
  ok('no filled bench AABB',
    !aabbs.some((s) => s.sx >= GARDEN_BENCH_W - 0.4
      && s.sz >= GARDEN_BENCH_DEPTH - 0.4 && s.sy >= 0.4));
  ok('gardenBench AABB flag is false', GARDEN_BENCH_AABB === false);
  ok('no filled sit AABB',
    !aabbs.some((s) => s.y0 >= CITY_Y + GARDEN_BENCH_SEAT_H - 0.02
      && s.sy >= 0.20 && s.sz >= 0.20 && s.sx >= 1.0));
  for (let i = 0; i < meshParts.length; i++) {
    const p = meshParts[i];
    const hit = aabbs[i];
    ok(`${p.id} collider ⊆ part ±0.15`,
      !!hit
      && hit.sx <= p.sx + GARDEN_BENCH_COLLIDER_PAD
      && hit.sz <= p.sz + GARDEN_BENCH_COLLIDER_PAD
      && Math.abs(hit.x - p.x) <= GARDEN_BENCH_COLLIDER_PAD
      && Math.abs(hit.z - p.z) <= GARDEN_BENCH_COLLIDER_PAD
      && hit.sx <= p.sx && hit.sz <= p.sz);
    const onPart = probeBlocked(shapes, p.x, p.y0 + Math.min(0.06, p.sy / 2), p.z, 0.015);
    ok(`${p.id} collider exists`, !!onPart);
  }
  ok('GARDEN_BENCH_COLLIDER_PAD is ±0.15 m', GARDEN_BENCH_COLLIDER_PAD === 0.15);

  const under = voids.find((v) => v.id === 'gardenBench-under');
  const sit = voids.find((v) => v.id === 'gardenBench-sit');
  ok('bench ships under-clear + sit voids', !!under && !!sit);
  for (const v of voids) {
    const hit = probeBlocked(shapes, v.x, v.y, v.z, v.probe);
    ok(`${v.id} is flyable`, !hit, hit ? `blocked by ${hit.tag} ${hit.part || hit.type}` : '');
  }
  ok('under-clear is whoop + 5″ knife',
    !!under && Math.abs(under.openH - 0.40) < 1e-9 && under.probe >= 0.08);
  ok('sit-box is a void', sit && sit.kind === 'sit' && sit.y > CITY_Y + GARDEN_BENCH_SEAT_H);

  // ---- one placer; no second scatterer; look locks ----------------------
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
  ok('gardenBench does not invent a placer',
    !/export function tryPlace/.test(bench)
    && bench.includes('tryPlace')
    && bench.includes('onPavement'));
  ok('gardenBench rejects pavement / street / leftover lots / slabs instead of remapping',
    bench.includes('gardenBenchRejected()')
    && bench.includes('if (onPavement(GARDEN_BENCH_X, GARDEN_BENCH_Z))')
    && !/GARDEN_BENCH_X\s*=/.test(bench)
    && !/GARDEN_BENCH_Z\s*=/.test(bench));
  ok('park bench reuses gardenBenchGeom, no gardenBenchBGeom fork',
    bench.includes('gardenBenchGeom(PARK_BENCH_X, PARK_BENCH_Z)')
    && bench.includes('gardenBenchParts(PARK_BENCH_X, PARK_BENCH_Z)')
    && bench.includes('onPavement(PARK_BENCH_X, PARK_BENCH_Z)')
    && !/function gardenBenchBGeom/.test(bench)
    && !/gardenBenchBGeom\(/.test(bench)
    && constants.includes('export function gardenBenchGeom')
    && constants.includes('276 / 90')
    && !/export function gardenBenchBGeom/.test(constants)
    && !/gardenBenchBGeom\(/.test(constants));
  ok('west park bench reuses gardenBenchGeom, no gardenBenchCGeom fork',
    bench.includes('gardenBenchGeom(PARK_BENCH_W_X, PARK_BENCH_W_Z)')
    && bench.includes('gardenBenchParts(PARK_BENCH_W_X, PARK_BENCH_W_Z)')
    && bench.includes('onPavement(PARK_BENCH_W_X, PARK_BENCH_W_Z)')
    && !/function gardenBenchCGeom/.test(bench)
    && !/gardenBenchCGeom\(/.test(bench)
    && constants.includes('export function gardenBenchGeom')
    && constants.includes('269.5 / 90')
    && !/export function gardenBenchCGeom/.test(constants)
    && !/gardenBenchCGeom\(/.test(constants));
  ok('index builds gardenBench on the keepout path after gardenPath',
    index.includes("from './landmarks/gardenBench.js'")
    && index.includes('buildGardenBench(ctx)')
    && index.indexOf('buildGardenBench') > index.indexOf('buildGardenPath')
    && index.indexOf('buildGardenBench') < index.indexOf('buildBlades'));
  ok('no custom mat',
    !/\bShaderMaterial\b/.test(bench) && !/\bonBeforeCompile\b/.test(bench)
    && bench.includes('MeshStandardMaterial'));
  ok('kit is Tiny Glade 3-seat slat, sit-box void, no grass kit',
    bench.includes('Tiny Glade') && bench.includes('3-seat slat')
    && bench.includes('Sit-box is a void') && bench.includes('whoop')
    && bench.includes('276') && bench.includes('Desi')
    && bench.includes('grass can lean at the legs')
    && !/Kenney|silo|hoistway|aisle/i.test(bench)
    && !bench.includes('planDirtBlades') && !bench.includes('gardenPathGrassHull'));
  ok('no grow-to-gap grass kit file',
    !existsSync(join(here, 'landmarks/gardenGrass.js'))
    && !existsSync(join(here, 'gardenGrass.js'))
    && !existsSync(join(here, 'landmarks/growToGap.js')));
  ok('gardenPath was not restacked',
    garden.includes('Tiny Glade') && garden.includes('two-abreast')
    && garden.includes('grass hull') && garden.includes('grow-to-gap')
    && garden.includes('268') && garden.includes('Desi')
    && !garden.includes('gardenBench') && !garden.includes('GARDEN_BENCH_')
    && !/chair|sofa|table|crate|bench|Kenney/i.test(garden));
  ok('leftoverGrass was not restacked',
    grass.includes('Tiny Glade') && grass.includes('grow-to-gap')
    && grass.includes('leftover-city') && grass.includes('267')
    && !grass.includes('PARK_BENCH_') && !grass.includes('parkBench')
    && !grass.includes('gardenBenchBGeom'));
  ok('pocketPark was not restacked',
    park.includes('Tiny Glade') && park.includes('grow-to-gap')
    && park.includes('276') && park.includes('Desi')
    && !park.includes('PARK_BENCH_') && !park.includes('parkBench')
    && !park.includes('gardenBenchBGeom'));
  ok('leftoverLot A/B/C/D were not restacked',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z)')
    && leftover.includes('leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)')
    && leftover.includes('chain-link') && leftover.includes('weenie')
    && !leftover.includes('gardenBench') && !leftover.includes('GARDEN_BENCH_')
    && !leftover.includes('gardenPath') && !leftover.includes('GARDEN_PATH_')
    && constants.includes('258/84') && constants.includes('295/84')
    && constants.includes('313/84') && constants.includes('330/84')
    && constants.includes('268→284')
    && constants.includes('276 / 82.4')
    && constants.includes('269.5 / 90'));
  ok('house was not restacked',
    house.includes('housePlanGeom') && house.includes('weenie')
    && !house.includes('gardenBench') && !house.includes('GARDEN_BENCH_'));
  ok('warehouse was not restacked',
    warehouse.includes('warehouseAisleGeom') && warehouse.includes('buildRacks')
    && !warehouse.includes('gardenBench') && !warehouse.includes('GARDEN_BENCH_'));
  ok('drop was not restacked',
    drop.includes('dropHoistGeom') && drop.includes('buildWell')
    && !drop.includes('gardenBench') && !drop.includes('GARDEN_BENCH_'));
  ok('abando was not restacked',
    abando.includes('abandoStairGeom') && abando.includes('buildSilo')
    && !abando.includes('gardenBench') && !abando.includes('GARDEN_BENCH_'));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust')
    && !blades.includes('gardenBench'));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !water.includes('gardenBench'));
  ok('preview.html was not restacked',
    preview.includes('url=./') && !preview.includes('gardenBench'));
  ok('follow.js was not restacked',
    follow.includes('hauntFollowPath') && !follow.includes('gardenBench'));
  ok('checkpoints.js was not restacked',
    checkpoints.includes('RESTART_OFFSET') && !checkpoints.includes('gardenBench'));
  ok('quad.js GRAVITY stays 9.81',
    /const GRAVITY = 9\.81/.test(quad) && !quad.includes('gardenBench'));
  ok('planting.js was not restacked',
    planting.includes('export function tryPlace')
    && !planting.includes('gardenBench') && !planting.includes('GARDEN_BENCH_')
    && !planting.includes('gardenPath') && !planting.includes('GARDEN_PATH_'));

  if (fails.length) {
    console.error('[miami-gardenBench] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-gardenBench] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('gardenBenchTest.js');
if (isMain) {
  const r = runMiamiGardenBenchTests();
  if (!r.passed) process.exit(1);
}
