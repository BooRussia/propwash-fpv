// Headless checks for the Miami N-S park connector (garden-path slab kit).
// No three.js, no game state. Not a haunt. Not leftoverLot. Not a
// leftoverGrass / pocket-park / garden-path / west-walk / east-walk /
// pergola restack.
//
//   node ./tools/run-miami-park-walk-ns-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_Y, GATE_HALF_X, GATE_HALF_Z, GATE_POST_R,
  PARK_WALK_X0, PARK_WALK_X1, PARK_WALK_Z, PARK_WALK_W,
  PARK_WALK_Z0, PARK_WALK_Z1, PARK_WALK_X, PARK_WALK_LEN,
  PARK_WALK_E_X0, PARK_WALK_E_X1, PARK_WALK_E_Z, PARK_WALK_E_W,
  PARK_WALK_E_Z0, PARK_WALK_E_Z1, PARK_WALK_E_X, PARK_WALK_E_LEN,
  PARK_WALK_NS_X0, PARK_WALK_NS_X1, PARK_WALK_NS_Z, PARK_WALK_NS_W,
  PARK_WALK_NS_Z0, PARK_WALK_NS_Z1, PARK_WALK_NS_X, PARK_WALK_NS_LEN,
  PARK_WALK_NS_AABB,
  GARDEN_PATH_X, GARDEN_PATH_Z, GARDEN_PATH_W, GARDEN_PATH_LEN,
  GARDEN_PATH_X0, GARDEN_PATH_X1, GARDEN_PATH_Z0, GARDEN_PATH_Z1,
  GARDEN_PATH_SLAB_MIN, GARDEN_PATH_SLAB_MAX,
  GARDEN_PATH_JOINT_MIN, GARDEN_PATH_JOINT_MAX,
  GARDEN_PATH_COLLIDER_PAD, GARDEN_PATH_HULL_COLLIDER, GARDEN_PATH_AABB,
  GARDEN_BENCH_X, GARDEN_BENCH_Z, GARDEN_BENCH_DEPTH,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_X0, LEFTOVER_LOT_X1,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z, LEFTOVER_LOT_B_X0, LEFTOVER_LOT_B_X1,
  LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z, LEFTOVER_LOT_C_X0, LEFTOVER_LOT_C_X1,
  LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z, LEFTOVER_LOT_D_X0, LEFTOVER_LOT_D_X1,
  PARK_BENCH_X, PARK_BENCH_Z, PARK_BENCH_X0, PARK_BENCH_Z1,
  POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D,
  POCKET_PARK_X0, POCKET_PARK_X1, POCKET_PARK_Z0, POCKET_PARK_Z1,
  LEFTOVER_GRASS_X0, LEFTOVER_GRASS_X1, LEFTOVER_GRASS_Z0, LEFTOVER_GRASS_Z1,
  PARK_PERGOLA_X, PARK_PERGOLA_Z, PARK_PERGOLA_X0, PARK_PERGOLA_Z0, PARK_PERGOLA_Z1,
  FLY_VOIDS, flyColliderShapes,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, inReserved, reservedOverlap, inFlyVoid, streetOverlap, groundHeight,
  leftoverLotGeom,
  gardenPathGeom, gardenPathGrassHull, gardenPathSlabs, gardenPathPlantSpots,
  gardenPathVoids, gardenPathColliderShapes, gardenPathRejected,
  inGardenPath, inGardenPathSlab,
  inLeftoverLotReserved, leftoverLotOverlap,
  boardwalkGateGeom, boardwalkGateVoid,
} from './constants.js';
import { hullArea, tryPlace } from './planting.js';

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

export function runMiamiParkWalkNSTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const garden = gardenPathGeom();
  const west = gardenPathGeom(PARK_WALK_X, PARK_WALK_Z);
  const east = gardenPathGeom(PARK_WALK_E_X, PARK_WALK_E_Z);
  const geom = gardenPathGeom(PARK_WALK_NS_X, PARK_WALK_NS_Z);
  const hull = gardenPathGrassHull(geom);
  const slabs = gardenPathSlabs(geom);
  const westSlabs = gardenPathSlabs(west);
  const eastSlabs = gardenPathSlabs(east);
  const gardenSlabs = gardenPathSlabs();
  const plants = gardenPathPlantSpots(geom);
  const voids = gardenPathVoids(geom);
  const shapes = gardenPathColliderShapes(geom);
  const geomA = leftoverLotGeom();
  const gate = boardwalkGateGeom(PARK_PERGOLA_X, PARK_PERGOLA_Z);
  const sash = boardwalkGateVoid(gate, 'park-pergola');
  const fly = FLY_VOIDS.find((v) => v.id === 'park-pergola');
  const kit = flyColliderShapes();

  // ---- signed corridor (Desi + Reesy); do not invent or slide ------------
  ok('walk walks 85.2→92.8 in z', PARK_WALK_NS_Z0 === 85.2 && PARK_WALK_NS_Z1 === 92.8);
  ok('walk centre is signed x=272 / z=89', PARK_WALK_NS_X === 272
    && PARK_WALK_NS_Z === 89);
  ok('walk width is 1.6 m (x 271.2–272.8)',
    PARK_WALK_NS_W === 1.6 && PARK_WALK_NS_X0 === 271.2 && PARK_WALK_NS_X1 === 272.8
    && Math.abs(PARK_WALK_NS_X1 - PARK_WALK_NS_X0 - PARK_WALK_NS_W) < 1e-9
    && PARK_WALK_NS_W === GARDEN_PATH_W
    && PARK_WALK_NS_W === PARK_WALK_W
    && PARK_WALK_NS_W === PARK_WALK_E_W);
  ok('walk length is 7.6 m', PARK_WALK_NS_LEN === 7.6
    && Math.abs(PARK_WALK_NS_Z1 - PARK_WALK_NS_Z0 - PARK_WALK_NS_LEN) < 1e-9);
  ok('geom matches signed constants',
    geom.x0 === 271.2 && geom.x1 === 272.8 && geom.x === 272
    && geom.z0 === 85.2 && geom.z1 === 92.8 && geom.z === 89
    && geom.w === 1.6 && geom.len === 7.6);
  ok('x/z were not invented or slid',
    geom.x === PARK_WALK_NS_X && geom.z === PARK_WALK_NS_Z
    && PARK_WALK_NS_X === 272 && PARK_WALK_NS_X0 === 271.2
    && PARK_WALK_NS_X1 === 272.8 && PARK_WALK_NS_Z0 === 85.2
    && PARK_WALK_NS_Z1 === 92.8);

  ok('0.4 m off the 84 walk (z1=84.8)',
    Math.abs(PARK_WALK_NS_Z0 - GARDEN_PATH_Z1 - 0.4) < 1e-9
    && PARK_WALK_NS_Z0 === 85.2 && GARDEN_PATH_Z1 === 84.8);
  ok('0.4 m off the west walk (z0=93.2)',
    Math.abs(PARK_WALK_Z0 - PARK_WALK_NS_Z1 - 0.4) < 1e-9
    && PARK_WALK_NS_Z1 === 92.8 && PARK_WALK_Z0 === 93.2);
  ok('near-T, not a kiss — does not extend into either slab run',
    geom.z0 > GARDEN_PATH_Z1
    && geom.z1 < PARK_WALK_Z0
    && gardenSlabs.every((s) => s.z1 < geom.z0)
    && westSlabs.every((s) => s.z0 > geom.z1)
    && !gardenSlabs.some((s) => s.x1 > geom.x0 - 1e-9 && s.x0 < geom.x1 + 1e-9
      && s.z1 > geom.z0 - 1e-9 && s.z0 < geom.z1 + 1e-9)
    && !westSlabs.some((s) => s.x1 > geom.x0 - 1e-9 && s.x0 < geom.x1 + 1e-9
      && s.z1 > geom.z0 - 1e-9 && s.z0 < geom.z1 + 1e-9));
  ok("T's the west walk in x (272 sits in 268→274.2)",
    PARK_WALK_NS_X > PARK_WALK_X0 && PARK_WALK_NS_X < PARK_WALK_X1
    && PARK_WALK_X0 === 268 && PARK_WALK_X1 === 274.2
    && PARK_WALK_NS_X === 272);
  ok('misses 276/90 by ~2.3 m',
    Math.abs(PARK_BENCH_X0 - PARK_WALK_NS_X1 - 2.3) < 1e-9
    && PARK_BENCH_X === 276 && PARK_BENCH_Z === 90
    && PARK_WALK_NS_X1 === 272.8);
  ok('misses the pergola posts on x=276',
    PARK_WALK_NS_X1 < PARK_PERGOLA_X0
    && PARK_WALK_NS_X1 < (PARK_PERGOLA_X - GATE_HALF_X)
    && PARK_PERGOLA_X === 276
    && GATE_HALF_X === 1.15
    && Math.abs(PARK_PERGOLA_X0 - 274.85) < 1e-9);

  ok('walk is not pavement', !onPavement(PARK_WALK_NS_X, PARK_WALK_NS_Z));
  ok('walk is not boardwalk', !onBoardwalk(PARK_WALK_NS_X, PARK_WALK_NS_Z));
  ok('walk is not roadway', !onRoadway(PARK_WALK_NS_Z));
  ok('walk is not a cross-street', !onCrossStreet(PARK_WALK_NS_X, PARK_WALK_NS_Z));
  ok('walk is not a sidewalk slab', !onSidewalk(PARK_WALK_NS_X, PARK_WALK_NS_Z));
  ok('walk sits on leftover-city grade',
    groundHeight(PARK_WALK_NS_X, PARK_WALK_NS_Z) === CITY_Y);
  ok('walk is reserved', inReserved(PARK_WALK_NS_X, PARK_WALK_NS_Z));
  ok('walk is a keepout', inKeepout(PARK_WALK_NS_X, PARK_WALK_NS_Z));
  ok('reservedOverlap covers the signed walk',
    reservedOverlap(PARK_WALK_NS_X, PARK_WALK_NS_Z, PARK_WALK_NS_W, PARK_WALK_NS_LEN, 0.15));
  ok('tryPlace drops the reserved walk',
    tryPlace(ctx, PARK_WALK_NS_X, PARK_WALK_NS_Z) === 0);
  ok('tryPlace does not remap the walk',
    tryPlace(ctx, PARK_WALK_NS_X, PARK_WALK_NS_Z) === 0);
  ok('signed cell is not rejected', !gardenPathRejected(PARK_WALK_NS_X, PARK_WALK_NS_Z));
  ok('walk footprint is not in the street',
    !streetOverlap(PARK_WALK_NS_X, PARK_WALK_NS_Z, PARK_WALK_NS_W, PARK_WALK_NS_LEN));
  ok('inGardenPath covers the signed N-S walk',
    inGardenPath(PARK_WALK_NS_X, PARK_WALK_NS_Z)
    && inGardenPath(PARK_WALK_NS_X, PARK_WALK_NS_Z0)
    && inGardenPath(PARK_WALK_NS_X, PARK_WALK_NS_Z1)
    && inGardenPath(PARK_WALK_NS_X0, PARK_WALK_NS_Z)
    && inGardenPath(PARK_WALK_NS_X1, PARK_WALK_NS_Z));

  // ---- west / east walks / garden path / seats / pergola / lots stay put -
  ok('west park walk stays 268→274.2 / z=94',
    PARK_WALK_X0 === 268 && PARK_WALK_X1 === 274.2
    && PARK_WALK_Z === 94 && PARK_WALK_W === 1.6
    && PARK_WALK_LEN === 6.2 && PARK_WALK_X === 271.1
    && PARK_WALK_Z0 === 93.2 && PARK_WALK_Z1 === 94.8
    && west.x0 === 268 && west.x1 === 274.2 && west.z === 94);
  ok('east park walk stays 277.8→284 / z=94',
    PARK_WALK_E_X0 === 277.8 && PARK_WALK_E_X1 === 284
    && PARK_WALK_E_Z === 94 && PARK_WALK_E_W === 1.6
    && PARK_WALK_E_LEN === 6.2 && PARK_WALK_E_X === 280.9
    && PARK_WALK_E_Z0 === 93.2 && PARK_WALK_E_Z1 === 94.8
    && east.x0 === 277.8 && east.x1 === 284 && east.z === 94);
  ok('path stays 268→284 / z=84 / 1.6 m',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284
    && GARDEN_PATH_Z === 84 && GARDEN_PATH_W === 1.6
    && GARDEN_PATH_LEN === 16 && GARDEN_PATH_X === 276
    && GARDEN_PATH_Z0 === 83.2 && GARDEN_PATH_Z1 === 84.8);
  ok('default gardenPathGeom stays 268→284 / z=84',
    garden.x0 === 268 && garden.x1 === 284 && garden.z === 84
    && garden.z0 === 83.2 && garden.z1 === 84.8 && garden.len === 16);
  ok('garden path was not slid onto the N-S run',
    garden.z === 84 && garden.x1 === 284 && geom.x === 272 && geom.z0 === 85.2);
  ok('west walk was not slid onto 85.2→92.8',
    west.x0 === 268 && west.x1 === 274.2 && west.z === 94
    && geom.z0 === 85.2 && geom.z1 === 92.8);
  ok('east walk was not slid onto 271.2–272.8',
    east.x0 === 277.8 && east.x1 === 284 && east.z === 94
    && geom.x0 === 271.2 && geom.x1 === 272.8);
  ok('garden bench stays 276 / 82.4',
    GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('park bench stays 276/90', PARK_BENCH_X === 276 && PARK_BENCH_Z === 90);
  ok('pergola stays 276/94', PARK_PERGOLA_X === 276 && PARK_PERGOLA_Z === 94);
  ok('pocket park stays 276/92, 16×8 (268–284 × 88–96)',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_W === 16 && POCKET_PARK_D === 8
    && POCKET_PARK_X0 === 268 && POCKET_PARK_X1 === 284
    && POCKET_PARK_Z0 === 88 && POCKET_PARK_Z1 === 96);
  ok('leftoverLot A stays 258/84', LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84);
  ok('leftoverLot B stays 295/84', LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84);
  ok('leftoverLot C stays 313/84', LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84);
  ok('leftoverLot D stays 330/84', LEFTOVER_LOT_D_X === 330 && LEFTOVER_LOT_D_Z === 84);
  ok('leftoverGrass stays 267–285 / 81–86',
    LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0);
  ok('leftoverLot A/B/C/D geometry was not slid',
    LEFTOVER_LOT_X0 === 251 && LEFTOVER_LOT_X1 === 265
    && LEFTOVER_LOT_B_X0 === 288 && LEFTOVER_LOT_B_X1 === 302
    && LEFTOVER_LOT_C_X0 === 306 && LEFTOVER_LOT_C_X1 === 320
    && LEFTOVER_LOT_D_X0 === 323 && LEFTOVER_LOT_D_X1 === 337
    && geomA.x0 === 251 && geomA.x1 === 265
    && geomA.z0 === 78 && geomA.z1 === 90);
  ok('does not overlap leftoverLot A/B/C/D reserved',
    !leftoverLotOverlap(PARK_WALK_NS_X, PARK_WALK_NS_Z, PARK_WALK_NS_W, PARK_WALK_NS_LEN, 0.15)
    && !inLeftoverLotReserved(PARK_WALK_NS_X, PARK_WALK_NS_Z)
    && !inLeftoverLotReserved(PARK_WALK_NS_X0, PARK_WALK_NS_Z)
    && !inLeftoverLotReserved(PARK_WALK_NS_X1, PARK_WALK_NS_Z)
    && !inLeftoverLotReserved(PARK_WALK_NS_X, PARK_WALK_NS_Z0)
    && !inLeftoverLotReserved(PARK_WALK_NS_X, PARK_WALK_NS_Z1));
  ok('does not sit on garden path 268→284 / z=84',
    geom.z0 > GARDEN_PATH_Z1
    && gardenSlabs.every((s) => s.z1 < geom.z0));
  ok('does not sit on west park walk 268→274.2 / z=94',
    geom.z1 < west.z0
    && westSlabs.every((s) => s.z0 > geom.z1));
  ok('does not sit on east park walk 277.8→284 / z=94',
    geom.x1 < east.x0
    && eastSlabs.every((s) => s.x0 > geom.x1)
    && !eastSlabs.some((s) => s.x1 > geom.x0 - 1e-9 && s.x0 < geom.x1 + 1e-9
      && s.z1 > geom.z0 - 1e-9 && s.z0 < geom.z1 + 1e-9));
  ok('does not sit on 276/82.4',
    geom.z0 > GARDEN_BENCH_Z + GARDEN_BENCH_DEPTH
    && geom.x1 < GARDEN_BENCH_X);
  ok('does not sit on 276/90',
    geom.x1 < PARK_BENCH_X0
    && geom.x1 < PARK_BENCH_X);
  ok('tryPlace still drops leftoverLot A/B/C/D',
    tryPlace(ctx, LEFTOVER_LOT_X, LEFTOVER_LOT_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z) === 0);
  ok('tryPlace still drops the garden path',
    tryPlace(ctx, GARDEN_PATH_X, GARDEN_PATH_Z) === 0);
  ok('tryPlace still drops the west park walk',
    tryPlace(ctx, PARK_WALK_X, PARK_WALK_Z) === 0);
  ok('tryPlace still drops the east park walk',
    tryPlace(ctx, PARK_WALK_E_X, PARK_WALK_E_Z) === 0);
  ok('tryPlace still drops 276/82.4',
    tryPlace(ctx, GARDEN_BENCH_X, GARDEN_BENCH_Z) === 0);
  ok('tryPlace still drops 276/90',
    tryPlace(ctx, PARK_BENCH_X, PARK_BENCH_Z) === 0);
  ok('tryPlace still drops 276/94',
    tryPlace(ctx, PARK_PERGOLA_X, PARK_PERGOLA_Z) === 0);
  ok('tryPlace still drops pavement / street',
    tryPlace(ctx, 0, 27) === 0 && tryPlace(ctx, 57, 80) === 0);

  // ---- drop if it kisses 84 walk / seats / posts / z=94 / lots; never nudge
  ok('drop if the kit kisses the 84 walk',
    gardenPathRejected(GARDEN_PATH_X, GARDEN_PATH_Z + 1) === true);
  ok('drop if the kit kisses z=94 slabs',
    gardenPathRejected(PARK_WALK_X, PARK_WALK_Z - 1) === true);
  ok('drop if the kit sits on 276/90',
    gardenPathRejected(PARK_BENCH_X, PARK_BENCH_Z) === true);
  ok('drop if the kit sits on 276/82.4',
    gardenPathRejected(GARDEN_BENCH_X, GARDEN_BENCH_Z) === true);
  ok('drop if the kit sits on leftoverLot A',
    gardenPathRejected(LEFTOVER_LOT_X, LEFTOVER_LOT_Z) === true);
  ok('drop if the kit sits on leftoverLot B',
    gardenPathRejected(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z) === true);
  ok('drop if the kit sits on leftoverLot C',
    gardenPathRejected(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z) === true);
  ok('drop if the kit sits on leftoverLot D',
    gardenPathRejected(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z) === true);
  ok('drop if the kit sits on the pergola / sash at 276/94',
    gardenPathRejected(PARK_PERGOLA_X, PARK_PERGOLA_Z) === true);
  ok('drop pavement / streetOverlap, never nudge',
    gardenPathRejected(0, 27) === true && gardenPathRejected(57, 80) === true);

  // ---- shared slab kit; no gardenPathBGeom / parkWalkNSGeom fork ---------
  ok('default gardenPathGeom stays on 268→284 / z=84',
    garden.x === GARDEN_PATH_X && garden.z === GARDEN_PATH_Z
    && garden.x0 === GARDEN_PATH_X0 && garden.x1 === GARDEN_PATH_X1);
  ok('N-S reuses gardenPathGeom, same slab kit',
    geom.w === garden.w && geom.h === garden.h && geom.y0 === garden.y0
    && geom.w === GARDEN_PATH_W && geom.w === west.w && geom.w === east.w);

  // ---- flagstones 0.5–0.7 m + 60–100 mm joints; no 300 mm tiles ---------
  ok('two-abreast columns exist',
    slabs.length >= 6
    && slabs.some((s) => s.row === 0) && slabs.some((s) => s.row === 1));
  ok('slabs stay inside the signed walk',
    slabs.every((s) => s.x0 >= PARK_WALK_NS_X0 - 1e-9
      && s.x1 <= PARK_WALK_NS_X1 + 1e-9
      && s.z0 >= PARK_WALK_NS_Z0 - 1e-9
      && s.z1 <= PARK_WALK_NS_Z1 + 1e-9));
  ok('flagstones are 0.5–0.7 m',
    slabs.every((s) => s.sx >= GARDEN_PATH_SLAB_MIN - 1e-9
      && s.sx <= GARDEN_PATH_SLAB_MAX + 1e-9
      && s.sz >= GARDEN_PATH_SLAB_MIN - 1e-9
      && s.sz <= GARDEN_PATH_SLAB_MAX + 1e-9));
  ok('no 300 mm tiles',
    slabs.every((s) => s.sx >= 0.5 && s.sz >= 0.5)
    && GARDEN_PATH_SLAB_MIN === 0.5 && GARDEN_PATH_SLAB_MAX === 0.7);
  const col0 = slabs.filter((s) => s.col === 0);
  const west0 = col0.find((s) => s.row === 0);
  const east0 = col0.find((s) => s.row === 1);
  ok('centre joint is 60–100 mm grass',
    !!west0 && !!east0
    && east0.x0 - west0.x1 >= GARDEN_PATH_JOINT_MIN - 1e-9
    && east0.x0 - west0.x1 <= GARDEN_PATH_JOINT_MAX + 1e-9
    && GARDEN_PATH_JOINT_MIN === 0.06 && GARDEN_PATH_JOINT_MAX === 0.10);
  const col1west = slabs.find((s) => s.col === 1 && s.row === 0);
  ok('z joint is 60–100 mm grass',
    !!west0 && !!col1west
    && col1west.z0 - west0.z1 >= GARDEN_PATH_JOINT_MIN - 1e-9
    && col1west.z0 - west0.z1 <= GARDEN_PATH_JOINT_MAX + 1e-9);
  ok('slabs do not enter the sash',
    slabs.every((s) => s.x1 < sash.x0 && s.x1 < PARK_PERGOLA_X0));
  ok('slabs do not kiss a post',
    slabs.every((s) => {
      for (const dx of [-gate.halfX, gate.halfX]) {
        for (const dz of [-gate.halfZ, gate.halfZ]) {
          const px = gate.x + dx, pz = gate.z + dz;
          const ox = Math.min(s.x1, px + GATE_POST_R) - Math.max(s.x0, px - GATE_POST_R);
          const oz = Math.min(s.z1, pz + GATE_POST_R) - Math.max(s.z0, pz - GATE_POST_R);
          if (ox > 0 && oz > 0) return false;
        }
      }
      return true;
    }));
  ok('slabs do not enter the 84 walk or z=94 walks',
    slabs.every((s) => s.z0 > GARDEN_PATH_Z1 && s.z1 < PARK_WALK_Z0)
    && slabs.every((s) => s.z1 < west.z0 && s.x1 < east.x0));

  // ---- collider ⊆ each slab; joints + air are flyable; no path AABB -----
  const aabbs = shapes.filter((s) => s.tag === 'gardenPath' && s.type === 'aabb');
  ok('one collider per flagstone', aabbs.length === slabs.length && aabbs.length >= 6);
  ok('no filled path AABB',
    !aabbs.some((s) => s.sz >= PARK_WALK_NS_LEN - 0.4
      && s.sx >= PARK_WALK_NS_W - 0.4 && s.sy >= 0.4));
  ok('N-S park walk AABB flag is false',
    PARK_WALK_NS_AABB === false && GARDEN_PATH_AABB === false);
  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    const hit = aabbs[i];
    ok(`slab ${s.col}/${s.row} collider ⊆ slab ±0.15`,
      !!hit
      && hit.sx <= s.sx + GARDEN_PATH_COLLIDER_PAD
      && hit.sz <= s.sz + GARDEN_PATH_COLLIDER_PAD
      && Math.abs(hit.x - s.x) <= GARDEN_PATH_COLLIDER_PAD
      && Math.abs(hit.z - s.z) <= GARDEN_PATH_COLLIDER_PAD
      && hit.sx <= s.sx && hit.sz <= s.sz);
    const onStone = probeBlocked(shapes, s.x, CITY_Y + 0.03, s.z, 0.02);
    ok(`slab ${s.col}/${s.row} collider exists`, !!onStone);
  }
  ok('GARDEN_PATH_COLLIDER_PAD is ±0.15 m', GARDEN_PATH_COLLIDER_PAD === 0.15);

  const jointZ = voids.find((v) => v.id === 'gardenPath-joint-z');
  const jointX = voids.find((v) => v.id === 'gardenPath-joint-x');
  const air = voids.find((v) => v.id === 'gardenPath-air');
  ok('walk ships joint + air voids', !!jointZ && !!jointX && !!air);
  for (const v of voids) {
    const hit = probeBlocked(shapes, v.x, v.y, v.z, v.probe);
    ok(`${v.id} is flyable`, !hit, hit ? `blocked by ${hit.tag} ${hit.type}` : '');
  }
  ok('grow-to-gap joints are voids',
    !inGardenPathSlab(jointZ.x, jointZ.z) && !inGardenPathSlab(jointX.x, jointX.z)
    && inGardenPath(jointZ.x, jointZ.z) && inGardenPath(jointX.x, jointX.z));

  // ---- sash stays empty --------------------------------------------------
  ok('park-pergola fly void is still published',
    !!fly && fly.kind === 'kit' && fly.x === 276 && fly.z === 94);
  ok('opening centre is empty air',
    !probeBlocked(shapes, fly.x, fly.y, fly.z, 0.28)
    && !probeBlocked(kit, fly.x, fly.y, fly.z, 0.28));
  ok('inFlyVoid covers the signed sash', !!inFlyVoid(PARK_PERGOLA_X, PARK_PERGOLA_Z));
  ok('walk air void does not reach the sash',
    air.x1 < sash.x0 && air.x1 === PARK_WALK_NS_X1
    && air.z1 < sash.z0);

  // ---- one grass hull at grade; not per-blade colliders (Sylva) ---------
  ok('one grass hull covers the signed walk',
    hull.x0 === PARK_WALK_NS_X0 && hull.x1 === PARK_WALK_NS_X1
    && hull.z0 === PARK_WALK_NS_Z0 && hull.z1 === PARK_WALK_NS_Z1
    && hull.y0 === CITY_Y);
  ok('grass hull collider is the ground',
    hull.collider === 'ground' && GARDEN_PATH_HULL_COLLIDER === 'ground');
  ok('grass hull area is width × length',
    Math.abs(hullArea(hull) - PARK_WALK_NS_LEN * PARK_WALK_NS_W) < 1e-9);
  ok('no grass-hull AABB in the collider bag',
    !aabbs.some((s) => Math.abs(s.sz - PARK_WALK_NS_LEN) < 0.2
      && Math.abs(s.sx - PARK_WALK_NS_W) < 0.2));

  ok('weeds grow-to-gap in the joints',
    plants.weeds.length >= 2
    && plants.weeds.every((p) => !inGardenPathSlab(p.x, p.z)
      && inGardenPath(p.x, p.z)
      && !onPavement(p.x, p.z)
      && !inLeftoverLotReserved(p.x, p.z)
      && !onBoardwalk(p.x, p.z) && !onSidewalk(p.x, p.z)));
  ok('palms stay off the walk',
    !plants.palms && plants.weeds.every((p) => inGardenPath(p.x, p.z)));

  // ---- one placer; no second scatterer; look locks ----------------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const gardenSrc = readFileSync(join(here, 'landmarks/gardenPath.js'), 'utf8');
  const leftover = readFileSync(join(here, 'landmarks/leftoverLot.js'), 'utf8');
  const bench = readFileSync(join(here, 'landmarks/gardenBench.js'), 'utf8');
  const grass = readFileSync(join(here, 'landmarks/leftoverGrass.js'), 'utf8');
  const park = readFileSync(join(here, 'landmarks/pocketPark.js'), 'utf8');
  const flySrc = readFileSync(join(here, 'landmarks/flythrough.js'), 'utf8');
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
  const westTest = readFileSync(join(here, 'parkWalkTest.js'), 'utf8');
  const eastTest = readFileSync(join(here, 'parkWalkETest.js'), 'utf8');

  ok('tryPlace is still the placer', planting.includes('export function tryPlace'));
  ok('gardenPath is not a second scatterer',
    !gardenSrc.includes('scatterModels') && !gardenSrc.includes('planDirtBlades'));
  ok('gardenPath does not invent a placer',
    !/export function tryPlace/.test(gardenSrc)
    && gardenSrc.includes('tryPlace')
    && gardenSrc.includes('onPavement'));
  ok('N-S walk reuses gardenPathGeom, no parkWalkNSGeom fork',
    gardenSrc.includes('gardenPathGeom(PARK_WALK_NS_X, PARK_WALK_NS_Z)')
    && gardenSrc.includes('gardenPathRejected(PARK_WALK_NS_X, PARK_WALK_NS_Z)')
    && gardenSrc.includes('onPavement(PARK_WALK_NS_X, PARK_WALK_NS_Z)')
    && constants.includes('export function gardenPathGeom')
    && constants.includes('85.2→92.8')
    && !/export function parkWalkGeom/.test(constants)
    && !/export function parkWalkEGeom/.test(constants)
    && !/export function parkWalkNSGeom/.test(constants)
    && !/export function gardenPathBGeom/.test(constants)
    && !/export function gardenPathNSGeom/.test(constants)
    && !/function parkWalkGeom/.test(gardenSrc)
    && !/function parkWalkEGeom/.test(gardenSrc)
    && !/function parkWalkNSGeom/.test(gardenSrc)
    && !/function gardenPathBGeom/.test(gardenSrc)
    && !/function gardenPathNSGeom/.test(gardenSrc)
    && !/parkWalkGeom\(/.test(gardenSrc)
    && !/parkWalkEGeom\(/.test(gardenSrc)
    && !/parkWalkNSGeom\(/.test(gardenSrc)
    && !/gardenPathBGeom\(/.test(gardenSrc)
    && !/gardenPathNSGeom\(/.test(gardenSrc));
  ok('did not ship parkWalkNS.js / gardenPathNS.js',
    !existsSync(join(here, 'landmarks/parkWalk.js'))
    && !existsSync(join(here, 'landmarks/parkWalkE.js'))
    && !existsSync(join(here, 'landmarks/parkWalkNS.js'))
    && !existsSync(join(here, 'landmarks/gardenPathB.js'))
    && !existsSync(join(here, 'landmarks/gardenPathE.js'))
    && !existsSync(join(here, 'landmarks/gardenPathNS.js'))
    && !existsSync(join(here, 'parkWalkNS.js')));
  ok('index keeps the shared gardenPath builder',
    index.includes("from './landmarks/gardenPath.js'")
    && index.includes('buildGardenPath(ctx)')
    && !index.includes('buildParkWalk')
    && !index.includes('buildParkWalkE')
    && !index.includes('buildParkWalkNS')
    && !index.includes('parkWalkGeom')
    && !index.includes('parkWalkEGeom')
    && !index.includes('parkWalkNSGeom'));
  ok('no custom mat',
    !/\bShaderMaterial\b/.test(gardenSrc) && !/\bonBeforeCompile\b/.test(gardenSrc)
    && gardenSrc.includes('MeshStandardMaterial'));
  ok('kit is Tiny Glade flagstones + one grass hull',
    gardenSrc.includes('Tiny Glade') && gardenSrc.includes('two-abreast')
    && gardenSrc.includes('grass hull') && gardenSrc.includes('grow-to-gap')
    && gardenSrc.includes('85.2') && gardenSrc.includes('Desi')
    && !/chair|sofa|table|crate|bench|Kenney/i.test(gardenSrc)
    && !/silo|hoistway|aisle/i.test(gardenSrc));
  ok('west park walk 268→274.2 / z=94 was not restacked',
    gardenSrc.includes('268→274.2') && gardenSrc.includes('274.2')
    && westTest.includes('268→274.2') && westTest.includes('PARK_WALK_X0 === 268')
    && !westTest.includes('PARK_WALK_NS_') && !westTest.includes('85.2')
    && constants.includes('PARK_WALK_X0 = 268')
    && constants.includes('PARK_WALK_X1 = 274.2')
    && constants.includes('PARK_WALK_Z = 94'));
  ok('east park walk 277.8→284 / z=94 was not restacked',
    gardenSrc.includes('277.8→284') && gardenSrc.includes('277.8')
    && eastTest.includes('277.8→284') && eastTest.includes('PARK_WALK_E_X0 === 277.8')
    && !eastTest.includes('PARK_WALK_NS_') && !eastTest.includes('85.2')
    && constants.includes('PARK_WALK_E_X0 = 277.8')
    && constants.includes('PARK_WALK_E_X1 = 284')
    && constants.includes('PARK_WALK_E_Z = 94'));
  ok('garden path 268→284 / z=84 was not slid',
    gardenSrc.includes('268→284') && gardenSrc.includes('z=84')
    && constants.includes('GARDEN_PATH_X0 = 268')
    && constants.includes('GARDEN_PATH_X1 = 284')
    && constants.includes('GARDEN_PATH_Z = 84'));
  ok('leftoverLot A/B/C/D were not restacked',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z)')
    && leftover.includes('leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)')
    && leftover.includes('chain-link') && leftover.includes('weenie')
    && !leftover.includes('PARK_WALK_') && !leftover.includes('parkWalk')
    && constants.includes('258/84') && constants.includes('295/84')
    && constants.includes('313/84') && constants.includes('330/84')
    && constants.includes('268→284')
    && constants.includes('276 / 82.4')
    && constants.includes('276 / 94'));
  ok('gardenBench was not restacked',
    bench.includes('Tiny Glade') && bench.includes('3-seat slat')
    && bench.includes('Sit-box is a void') && bench.includes('276')
    && !bench.includes('PARK_WALK_') && !bench.includes('parkWalk'));
  ok('leftoverGrass was not restacked',
    grass.includes('Tiny Glade') && grass.includes('grow-to-gap')
    && grass.includes('leftover-city') && grass.includes('267')
    && !grass.includes('PARK_WALK_') && !grass.includes('parkWalk'));
  ok('pocketPark was not restacked',
    park.includes('Tiny Glade') && park.includes('grow-to-gap')
    && park.includes('276') && park.includes('Desi')
    && !park.includes('PARK_WALK_') && !park.includes('parkWalk'));
  ok('park pergola was not restacked',
    flySrc.includes('boardwalkGateGeom(PARK_PERGOLA_X, PARK_PERGOLA_Z)')
    && flySrc.includes('276/94')
    && !flySrc.includes('PARK_WALK_') && !flySrc.includes('parkWalk')
    && !/export function pergolaGeom/.test(constants)
    && !/export function parkPergolaGeom/.test(constants));
  ok('house was not restacked',
    house.includes('housePlanGeom') && house.includes('weenie')
    && !house.includes('PARK_WALK_') && !house.includes('parkWalk'));
  ok('warehouse was not restacked',
    warehouse.includes('warehouseAisleGeom') && warehouse.includes('buildRacks')
    && !warehouse.includes('PARK_WALK_') && !warehouse.includes('parkWalk'));
  ok('drop was not restacked',
    drop.includes('dropHoistGeom') && drop.includes('buildWell')
    && !drop.includes('PARK_WALK_') && !drop.includes('parkWalk'));
  ok('abando was not restacked',
    abando.includes('abandoStairGeom') && abando.includes('buildSilo')
    && !abando.includes('PARK_WALK_') && !abando.includes('parkWalk'));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust')
    && !blades.includes('parkWalk') && !blades.includes('PARK_WALK_'));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !water.includes('parkWalk') && !water.includes('PARK_WALK_'));
  ok('preview.html was not restacked',
    preview.includes('url=./') && !preview.includes('parkWalk'));
  ok('follow.js was not restacked',
    follow.includes('hauntFollowPath') && !follow.includes('parkWalk'));
  ok('checkpoints.js was not restacked',
    checkpoints.includes('RESTART_OFFSET') && !checkpoints.includes('parkWalk'));
  ok('quad.js GRAVITY stays 9.81',
    /const GRAVITY = 9\.81/.test(quad) && !quad.includes('parkWalk'));
  ok('planting.js was not restacked',
    planting.includes('export function tryPlace')
    && !planting.includes('parkWalk') && !planting.includes('PARK_WALK_')
    && !planting.includes('gardenBench') && !planting.includes('GARDEN_BENCH_')
    && !planting.includes('gardenPath') && !planting.includes('GARDEN_PATH_'));

  if (fails.length) {
    console.error('[miami-parkWalkNS] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-parkWalkNS] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('parkWalkNSTest.js');
if (isMain) {
  const r = runMiamiParkWalkNSTests();
  if (!r.passed) process.exit(1);
}
