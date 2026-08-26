// Headless checks for the Miami leftover-city vacant lot.
// No three.js, no game state. Not a fifth haunt. Not leftover-dirt hulls.
//
//   node ./tools/run-miami-leftover-lot-test.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_Y,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_X0, LEFTOVER_LOT_X1, LEFTOVER_LOT_Z0, LEFTOVER_LOT_Z1,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z, LEFTOVER_LOT_B_W, LEFTOVER_LOT_B_D,
  LEFTOVER_LOT_B_X0, LEFTOVER_LOT_B_X1, LEFTOVER_LOT_B_Z0, LEFTOVER_LOT_B_Z1,
  LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z, LEFTOVER_LOT_C_W, LEFTOVER_LOT_C_D,
  LEFTOVER_LOT_C_X0, LEFTOVER_LOT_C_X1, LEFTOVER_LOT_C_Z0, LEFTOVER_LOT_C_Z1,
  LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z, LEFTOVER_LOT_D_W, LEFTOVER_LOT_D_D,
  LEFTOVER_LOT_D_X0, LEFTOVER_LOT_D_X1, LEFTOVER_LOT_D_Z0, LEFTOVER_LOT_D_Z1,
  LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z, LEFTOVER_LOT_E_W, LEFTOVER_LOT_E_D,
  LEFTOVER_LOT_E_X0, LEFTOVER_LOT_E_X1, LEFTOVER_LOT_E_Z0, LEFTOVER_LOT_E_Z1,
  LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z, LEFTOVER_LOT_F_W, LEFTOVER_LOT_F_D,
  LEFTOVER_LOT_F_X0, LEFTOVER_LOT_F_X1, LEFTOVER_LOT_F_Z0, LEFTOVER_LOT_F_Z1,
  LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z, LEFTOVER_LOT_G_W, LEFTOVER_LOT_G_D,
  LEFTOVER_LOT_G_X0, LEFTOVER_LOT_G_X1, LEFTOVER_LOT_G_Z0, LEFTOVER_LOT_G_Z1,
  LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z, LEFTOVER_LOT_H_W, LEFTOVER_LOT_H_D,
  LEFTOVER_LOT_H_X0, LEFTOVER_LOT_H_X1, LEFTOVER_LOT_H_Z0, LEFTOVER_LOT_H_Z1,
  GARDEN_PATH_X0, GARDEN_PATH_X1, GARDEN_PATH_Z,
  GARDEN_BENCH_X, GARDEN_BENCH_Z,
  LEFTOVER_GRASS_X0, LEFTOVER_GRASS_X1, LEFTOVER_GRASS_Z0, LEFTOVER_GRASS_Z1,
  POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D,
  POCKET_PARK_X0, POCKET_PARK_X1, POCKET_PARK_Z0, POCKET_PARK_Z1,
  POCKET_PARK_E_X, POCKET_PARK_E_Z, POCKET_PARK_E_W, POCKET_PARK_E_D,
  POCKET_PARK_E_X0, POCKET_PARK_E_X1, POCKET_PARK_E_Z0, POCKET_PARK_E_Z1,
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
  PARK_WALK_X0, PARK_WALK_X1, PARK_WALK_Z,
  PARK_WALK_E_X0, PARK_WALK_E_X1, PARK_WALK_E_Z,
  PARK_WALK_EE_X0, PARK_WALK_EE_X1, PARK_WALK_EE_Z,
  PARK_WALK_EE_W_X0, PARK_WALK_EE_W_X1, PARK_WALK_EE_W_Z,
  PARK_WALK_EE_E_X0, PARK_WALK_EE_E_X1, PARK_WALK_EE_E_Z,
  PARK_WALK_FF_X0, PARK_WALK_FF_X1, PARK_WALK_FF_Z,
  PARK_WALK_FF_W_X0, PARK_WALK_FF_W_X1, PARK_WALK_FF_W_Z,
  PARK_WALK_FF_E_X0, PARK_WALK_FF_E_X1, PARK_WALK_FF_E_Z,
  PARK_WALK_GG_X0, PARK_WALK_GG_X1, PARK_WALK_GG_Z,
  PARK_WALK_GG_W_X0, PARK_WALK_GG_W_X1, PARK_WALK_GG_W_Z,
  PARK_WALK_GG_E_X0, PARK_WALK_GG_E_X1, PARK_WALK_GG_E_Z,
  PARK_WALK_HH_X0, PARK_WALK_HH_X1, PARK_WALK_HH_Z,
  PARK_WALK_HH_W_X0, PARK_WALK_HH_W_X1, PARK_WALK_HH_W_Z,
  PARK_WALK_HH_E_X0, PARK_WALK_HH_E_X1, PARK_WALK_HH_E_Z,
  PARK_PERGOLA_X, PARK_PERGOLA_Z,
  PARK_PERGOLA_EE_X, PARK_PERGOLA_EE_Z,
  PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z,
  PARK_PERGOLA_GG_X, PARK_PERGOLA_GG_Z,
  PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z,
  PARK_BENCH_FF_X, PARK_BENCH_FF_Z,
  PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z,
  PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z,
  PARK_BENCH_GG_X, PARK_BENCH_GG_Z,
  PARK_BENCH_GG_W_X, PARK_BENCH_GG_W_Z,
  PARK_BENCH_GG_E_X, PARK_BENCH_GG_E_Z,
  PARK_BENCH_HH_X, PARK_BENCH_HH_Z,
  PARK_BENCH_HH_W_X, PARK_BENCH_HH_W_Z,
  PARK_BENCH_HH_E_X, PARK_BENCH_HH_E_Z,
  PARK_BENCH_EE_X, PARK_BENCH_EE_Z,
  PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z,
  PARK_BENCH_EE_E_X, PARK_BENCH_EE_E_Z,
  LEFTOVER_LOT_FENCE_H, LEFTOVER_LOT_FENCE_H_MIN, LEFTOVER_LOT_FENCE_H_MAX,
  LEFTOVER_LOT_GATE_W, LEFTOVER_LOT_WALK_W, LEFTOVER_LOT_WALK_H,
  LEFTOVER_LOT_SHED_DOOR_W, LEFTOVER_LOT_SHED_DOOR_H,
  LEFTOVER_LOT_MESH_T, LEFTOVER_LOT_POST, LEFTOVER_LOT_JAMB,
  WAREHOUSE_X1,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, inReserved, reservedOverlap, streetOverlap, groundHeight,
  leftoverLotGeom, leftoverLotVoids, leftoverLotColliderShapes,
  leftoverLotPlantSpots, inLeftoverLotGate, leftoverLotOverlap,
  inLeftoverLotReserved,
  HOTEL_FLAG_CELLS, HOTEL_PORCH_CELLS, COURT_WELL_CELLS, INLAND_ARCADE_CELLS, INLAND_MIDRISE_CELLS,
  MAJESTIC_X, MAJESTIC_FRONT_Z, MAJESTIC_W, MAJESTIC_SOFFIT,
  CAVALIER_X, CAVALIER_FRONT_Z, CAVALIER_W, CAVALIER_SOFFIT,
  BREAKWATER_X, BREAKWATER_FRONT_Z, BREAKWATER_W, BREAKWATER_SOFFIT,
  WINTERHAVEN_X, WINTERHAVEN_FRONT_Z, WINTERHAVEN_W, WINTERHAVEN_SOFFIT,
  GARAGE_X, GARAGE_FRONT_Z, GARAGE_W, GARAGE_D, GARAGE_STAND_CELLS,
  FLY_VOIDS,
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

export function runMiamiLeftoverLotTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const geom = leftoverLotGeom();
  const geomB = leftoverLotGeom(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z);
  const geomC = leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z);
  const geomD = leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z);
  const geomE = leftoverLotGeom(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z);
  const geomF = leftoverLotGeom(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z);
  const geomG = leftoverLotGeom(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z);
  const geomH = leftoverLotGeom(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z);
  const voids = leftoverLotVoids();
  const shapes = leftoverLotColliderShapes();
  const plants = leftoverLotPlantSpots();
  const plantsB = leftoverLotPlantSpots(geomB);
  const plantsC = leftoverLotPlantSpots(geomC);
  const plantsD = leftoverLotPlantSpots(geomD);
  const plantsE = leftoverLotPlantSpots(geomE);
  const plantsF = leftoverLotPlantSpots(geomF);
  const plantsG = leftoverLotPlantSpots(geomG);
  const plantsH = leftoverLotPlantSpots(geomH);
  const gate = voids.find((v) => v.kind === 'gate');
  const walk = voids.find((v) => v.kind === 'walk');
  const shedDoor = voids.find((v) => v.kind === 'shed-door');
  const gateB = voids.find((v) => v.kind === 'gate' && v.x === LEFTOVER_LOT_B_X);
  const gateC = voids.find((v) => v.kind === 'gate' && v.x === LEFTOVER_LOT_C_X);
  const gateD = voids.find((v) => v.kind === 'gate' && v.x === LEFTOVER_LOT_D_X);
  const gateE = voids.find((v) => v.kind === 'gate' && v.x === LEFTOVER_LOT_E_X);
  const gateF = voids.find((v) => v.kind === 'gate' && v.x === LEFTOVER_LOT_F_X);
  const gateG = voids.find((v) => v.kind === 'gate' && v.x === LEFTOVER_LOT_G_X);
  const gateH = voids.find((v) => v.kind === 'gate' && v.x === LEFTOVER_LOT_H_X);

  // ---- leftover-city vacant parcel, signed cell --------------------------
  ok('lot cell is signed 258/84', LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84);
  ok('lot plate is signed 14 × 12', LEFTOVER_LOT_W === 14 && LEFTOVER_LOT_D === 12);
  ok('lot bounds are signed',
    LEFTOVER_LOT_X0 === 251 && LEFTOVER_LOT_X1 === 265
    && LEFTOVER_LOT_Z0 === 78 && LEFTOVER_LOT_Z1 === 90);
  ok('plate was not grown',
    LEFTOVER_LOT_X1 - LEFTOVER_LOT_X0 === LEFTOVER_LOT_W
    && LEFTOVER_LOT_Z1 - LEFTOVER_LOT_Z0 === LEFTOVER_LOT_D);
  ok('depth is haunt-scale 12 m, not dirt-hull 18–28',
    LEFTOVER_LOT_D === 12 && LEFTOVER_LOT_D < 18);

  ok('lot is not pavement', !onPavement(LEFTOVER_LOT_X, LEFTOVER_LOT_Z));
  ok('lot is not boardwalk', !onBoardwalk(LEFTOVER_LOT_X, LEFTOVER_LOT_Z));
  ok('lot is not roadway', !onRoadway(LEFTOVER_LOT_Z));
  ok('lot is not a cross-street', !onCrossStreet(LEFTOVER_LOT_X, LEFTOVER_LOT_Z));
  ok('lot is not a sidewalk slab', !onSidewalk(LEFTOVER_LOT_X, LEFTOVER_LOT_Z));
  ok('lot sits on leftover-city grade',
    groundHeight(LEFTOVER_LOT_X, LEFTOVER_LOT_Z) === CITY_Y);
  ok('lot is reserved', inReserved(LEFTOVER_LOT_X, LEFTOVER_LOT_Z));
  ok('lot is a keepout', inKeepout(LEFTOVER_LOT_X, LEFTOVER_LOT_Z));
  ok('reservedOverlap covers the signed plate',
    reservedOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D));
  ok('tryPlace drops the reserved cell', tryPlace(ctx, LEFTOVER_LOT_X, LEFTOVER_LOT_Z) === 0);
  ok('tryPlace does not remap the lot', tryPlace(ctx, LEFTOVER_LOT_X, LEFTOVER_LOT_Z) === 0);

  ok('east of GAP 243', LEFTOVER_LOT_X0 >= 243 + 6.5);
  ok('west of warehouse keepout', LEFTOVER_LOT_X1 <= 269.5);
  ok('same inland band as drop/abando', LEFTOVER_LOT_Z === 84);

  // ---- leftoverLot B: second leftover-city parcel, same schema -----------
  ok('#34 stays signed 258/84', LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84);
  ok('lot B cell is signed 295/84', LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84);
  ok('lot B plate is signed 14 × 12', LEFTOVER_LOT_B_W === 14 && LEFTOVER_LOT_B_D === 12);
  ok('lot B bounds are signed',
    LEFTOVER_LOT_B_X0 === 288 && LEFTOVER_LOT_B_X1 === 302
    && LEFTOVER_LOT_B_Z0 === 78 && LEFTOVER_LOT_B_Z1 === 90);
  ok('lot B plate was not grown',
    LEFTOVER_LOT_B_X1 - LEFTOVER_LOT_B_X0 === LEFTOVER_LOT_B_W
    && LEFTOVER_LOT_B_Z1 - LEFTOVER_LOT_B_Z0 === LEFTOVER_LOT_B_D
    && LEFTOVER_LOT_B_W === LEFTOVER_LOT_W && LEFTOVER_LOT_B_D === LEFTOVER_LOT_D);
  ok('lot B reuses leftoverLotGeom',
    geomB.x0 === LEFTOVER_LOT_B_X0 && geomB.x1 === LEFTOVER_LOT_B_X1
    && geomB.z0 === LEFTOVER_LOT_B_Z0 && geomB.z1 === LEFTOVER_LOT_B_Z1
    && geomB.h === LEFTOVER_LOT_FENCE_H
    && geom.x0 === LEFTOVER_LOT_X0 && geom.x1 === LEFTOVER_LOT_X1);
  ok('lot B is not pavement', !onPavement(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z));
  ok('lot B is not boardwalk', !onBoardwalk(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z));
  ok('lot B is not roadway', !onRoadway(LEFTOVER_LOT_B_Z));
  ok('lot B is not a cross-street', !onCrossStreet(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z));
  ok('lot B is not a sidewalk slab', !onSidewalk(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z));
  ok('lot B sits on leftover-city grade',
    groundHeight(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z) === CITY_Y);
  ok('lot B is reserved', inReserved(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z));
  ok('lot B is a keepout', inKeepout(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z));
  ok('reservedOverlap covers lot B plate',
    reservedOverlap(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z, LEFTOVER_LOT_B_W, LEFTOVER_LOT_B_D));
  ok('tryPlace drops lot B', tryPlace(ctx, LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z) === 0);
  ok('tryPlace does not remap lot B', tryPlace(ctx, LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z) === 0);
  ok('lot B east of warehouse keepout', LEFTOVER_LOT_B_X0 >= WAREHOUSE_X1 + 1.8);
  ok('lot B west of helipadE', LEFTOVER_LOT_B_X1 <= 408);
  ok('lot B same inland band as #34 / drop / abando',
    LEFTOVER_LOT_B_Z === 84 && LEFTOVER_LOT_B_Z === LEFTOVER_LOT_Z);

  // ---- leftoverLot C: third leftover-city parcel, same schema ------------
  ok('#34 / #35 stay signed 258/84 and 295/84',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84);
  ok('lot C cell is signed 313/84', LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84);
  ok('lot C plate is signed 14 × 12', LEFTOVER_LOT_C_W === 14 && LEFTOVER_LOT_C_D === 12);
  ok('lot C bounds are signed',
    LEFTOVER_LOT_C_X0 === 306 && LEFTOVER_LOT_C_X1 === 320
    && LEFTOVER_LOT_C_Z0 === 78 && LEFTOVER_LOT_C_Z1 === 90);
  ok('lot C plate was not grown',
    LEFTOVER_LOT_C_X1 - LEFTOVER_LOT_C_X0 === LEFTOVER_LOT_C_W
    && LEFTOVER_LOT_C_Z1 - LEFTOVER_LOT_C_Z0 === LEFTOVER_LOT_C_D
    && LEFTOVER_LOT_C_W === LEFTOVER_LOT_W && LEFTOVER_LOT_C_D === LEFTOVER_LOT_D);
  ok('lot C reuses leftoverLotGeom',
    geomC.x0 === LEFTOVER_LOT_C_X0 && geomC.x1 === LEFTOVER_LOT_C_X1
    && geomC.z0 === LEFTOVER_LOT_C_Z0 && geomC.z1 === LEFTOVER_LOT_C_Z1
    && geomC.h === LEFTOVER_LOT_FENCE_H
    && geom.x0 === LEFTOVER_LOT_X0 && geom.x1 === LEFTOVER_LOT_X1
    && geomB.x0 === LEFTOVER_LOT_B_X0 && geomB.x1 === LEFTOVER_LOT_B_X1);
  ok('lot C is not pavement', !onPavement(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z));
  ok('lot C is not boardwalk', !onBoardwalk(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z));
  ok('lot C is not roadway', !onRoadway(LEFTOVER_LOT_C_Z));
  ok('lot C is not a cross-street', !onCrossStreet(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z));
  ok('lot C is not a sidewalk slab', !onSidewalk(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z));
  ok('lot C sits on leftover-city grade',
    groundHeight(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z) === CITY_Y);
  ok('lot C is reserved', inReserved(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z));
  ok('lot C is a keepout', inKeepout(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z));
  ok('reservedOverlap covers lot C plate',
    reservedOverlap(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z, LEFTOVER_LOT_C_W, LEFTOVER_LOT_C_D));
  ok('tryPlace drops lot C', tryPlace(ctx, LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z) === 0);
  ok('tryPlace does not remap lot C', tryPlace(ctx, LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z) === 0);
  ok('lot C east of lot B reserved', LEFTOVER_LOT_C_X0 >= LEFTOVER_LOT_B_X1 + 1.8);
  ok('lot C west of helipadE', LEFTOVER_LOT_C_X1 <= 408);
  ok('lot C same inland band as #34 / #35 / drop / abando',
    LEFTOVER_LOT_C_Z === 84 && LEFTOVER_LOT_C_Z === LEFTOVER_LOT_Z
    && LEFTOVER_LOT_C_Z === LEFTOVER_LOT_B_Z);

  // ---- leftoverLot D: fourth leftover-city parcel, same schema -----------
  ok('#34 / #35 / C stay signed 258/84, 295/84, and 313/84',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84);
  ok('lot D cell is signed 330/84', LEFTOVER_LOT_D_X === 330 && LEFTOVER_LOT_D_Z === 84);
  ok('lot D plate is signed 14 × 12', LEFTOVER_LOT_D_W === 14 && LEFTOVER_LOT_D_D === 12);
  ok('lot D bounds are signed',
    LEFTOVER_LOT_D_X0 === 323 && LEFTOVER_LOT_D_X1 === 337
    && LEFTOVER_LOT_D_Z0 === 78 && LEFTOVER_LOT_D_Z1 === 90);
  ok('lot D plate was not grown',
    LEFTOVER_LOT_D_X1 - LEFTOVER_LOT_D_X0 === LEFTOVER_LOT_D_W
    && LEFTOVER_LOT_D_Z1 - LEFTOVER_LOT_D_Z0 === LEFTOVER_LOT_D_D
    && LEFTOVER_LOT_D_W === LEFTOVER_LOT_W && LEFTOVER_LOT_D_D === LEFTOVER_LOT_D);
  ok('lot D reuses leftoverLotGeom',
    geomD.x0 === LEFTOVER_LOT_D_X0 && geomD.x1 === LEFTOVER_LOT_D_X1
    && geomD.z0 === LEFTOVER_LOT_D_Z0 && geomD.z1 === LEFTOVER_LOT_D_Z1
    && geomD.h === LEFTOVER_LOT_FENCE_H
    && geom.x0 === LEFTOVER_LOT_X0 && geom.x1 === LEFTOVER_LOT_X1
    && geomB.x0 === LEFTOVER_LOT_B_X0 && geomB.x1 === LEFTOVER_LOT_B_X1
    && geomC.x0 === LEFTOVER_LOT_C_X0 && geomC.x1 === LEFTOVER_LOT_C_X1);
  ok('lot D is not pavement', !onPavement(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z));
  ok('lot D is not boardwalk', !onBoardwalk(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z));
  ok('lot D is not roadway', !onRoadway(LEFTOVER_LOT_D_Z));
  ok('lot D is not a cross-street', !onCrossStreet(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z));
  ok('lot D is not a sidewalk slab', !onSidewalk(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z));
  ok('lot D sits on leftover-city grade',
    groundHeight(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z) === CITY_Y);
  ok('lot D is reserved', inReserved(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z));
  ok('lot D is a keepout', inKeepout(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z));
  ok('reservedOverlap covers lot D plate',
    reservedOverlap(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z, LEFTOVER_LOT_D_W, LEFTOVER_LOT_D_D));
  ok('tryPlace drops lot D', tryPlace(ctx, LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z) === 0);
  ok('tryPlace does not remap lot D', tryPlace(ctx, LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z) === 0);
  ok('lot D starts 1.2 m off C reserved',
    LEFTOVER_LOT_D_X0 === 323
    && LEFTOVER_LOT_C_X1 + 1.8 === 321.8
    && LEFTOVER_LOT_D_X0 === LEFTOVER_LOT_C_X1 + 1.8 + 1.2);
  ok('lot D east of lot C reserved', LEFTOVER_LOT_D_X0 >= LEFTOVER_LOT_C_X1 + 1.8);
  ok('lot D west of helipadE', LEFTOVER_LOT_D_X1 <= 408);
  ok('lot D same inland band as #34 / #35 / C / drop / abando',
    LEFTOVER_LOT_D_Z === 84 && LEFTOVER_LOT_D_Z === LEFTOVER_LOT_Z
    && LEFTOVER_LOT_D_Z === LEFTOVER_LOT_B_Z
    && LEFTOVER_LOT_D_Z === LEFTOVER_LOT_C_Z);
  ok('path stays 268→284 / z=84',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284 && GARDEN_PATH_Z === 84);
  ok('bench stays 276 / 82.4', GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('grass hull stays 267–285 / 81–86',
    LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0);

  // ---- leftoverLot E: fifth leftover-city parcel, same schema ------------
  ok('#34 / #35 / C / D stay signed 258/84, 295/84, 313/84, and 330/84',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84
    && LEFTOVER_LOT_D_X === 330 && LEFTOVER_LOT_D_Z === 84);
  ok('lot E cell is signed 347/84', LEFTOVER_LOT_E_X === 347 && LEFTOVER_LOT_E_Z === 84);
  ok('lot E plate is signed 14 × 12', LEFTOVER_LOT_E_W === 14 && LEFTOVER_LOT_E_D === 12);
  ok('lot E bounds are signed',
    LEFTOVER_LOT_E_X0 === 340 && LEFTOVER_LOT_E_X1 === 354
    && LEFTOVER_LOT_E_Z0 === 78 && LEFTOVER_LOT_E_Z1 === 90);
  ok('lot E plate was not grown',
    LEFTOVER_LOT_E_X1 - LEFTOVER_LOT_E_X0 === LEFTOVER_LOT_E_W
    && LEFTOVER_LOT_E_Z1 - LEFTOVER_LOT_E_Z0 === LEFTOVER_LOT_E_D
    && LEFTOVER_LOT_E_W === LEFTOVER_LOT_W && LEFTOVER_LOT_E_D === LEFTOVER_LOT_D);
  ok('lot E reuses leftoverLotGeom',
    geomE.x0 === LEFTOVER_LOT_E_X0 && geomE.x1 === LEFTOVER_LOT_E_X1
    && geomE.z0 === LEFTOVER_LOT_E_Z0 && geomE.z1 === LEFTOVER_LOT_E_Z1
    && geomE.h === LEFTOVER_LOT_FENCE_H
    && geom.x0 === LEFTOVER_LOT_X0 && geom.x1 === LEFTOVER_LOT_X1
    && geomB.x0 === LEFTOVER_LOT_B_X0 && geomB.x1 === LEFTOVER_LOT_B_X1
    && geomC.x0 === LEFTOVER_LOT_C_X0 && geomC.x1 === LEFTOVER_LOT_C_X1
    && geomD.x0 === LEFTOVER_LOT_D_X0 && geomD.x1 === LEFTOVER_LOT_D_X1);
  ok('lot E is not pavement', !onPavement(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z));
  ok('lot E is not boardwalk', !onBoardwalk(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z));
  ok('lot E is not roadway', !onRoadway(LEFTOVER_LOT_E_Z));
  ok('lot E is not a cross-street', !onCrossStreet(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z));
  ok('lot E is not a sidewalk slab', !onSidewalk(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z));
  ok('lot E sits on leftover-city grade',
    groundHeight(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z) === CITY_Y);
  ok('lot E is reserved', inReserved(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z));
  ok('lot E is a keepout', inKeepout(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z));
  ok('reservedOverlap covers lot E plate',
    reservedOverlap(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z, LEFTOVER_LOT_E_W, LEFTOVER_LOT_E_D));
  ok('leftoverLotOverlap covers lot E plate',
    leftoverLotOverlap(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z, LEFTOVER_LOT_E_W, LEFTOVER_LOT_E_D));
  ok('inLeftoverLotReserved covers lot E',
    inLeftoverLotReserved(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z));
  ok('tryPlace drops reserved E', tryPlace(ctx, LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z) === 0);
  ok('tryPlace does not remap lot E', tryPlace(ctx, LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z) === 0);
  ok('lot E starts 1.2 m off D reserved',
    LEFTOVER_LOT_E_X0 === 340
    && LEFTOVER_LOT_D_X1 + 1.8 === 338.8
    && LEFTOVER_LOT_E_X0 === LEFTOVER_LOT_D_X1 + 1.8 + 1.2);
  ok('lot E east of lot D reserved', LEFTOVER_LOT_E_X0 >= LEFTOVER_LOT_D_X1 + 1.8);
  ok('lot E west of helipadE', LEFTOVER_LOT_E_X1 <= 408);
  ok('helipad E stays ~76 m east at 430/70',
    430 - LEFTOVER_LOT_E_X1 === 76);
  ok('lot E same inland band as #34 / #35 / C / D / drop / abando',
    LEFTOVER_LOT_E_Z === 84 && LEFTOVER_LOT_E_Z === LEFTOVER_LOT_Z
    && LEFTOVER_LOT_E_Z === LEFTOVER_LOT_B_Z
    && LEFTOVER_LOT_E_Z === LEFTOVER_LOT_C_Z
    && LEFTOVER_LOT_E_Z === LEFTOVER_LOT_D_Z);
  ok('path stays 268→284 / z=84',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284 && GARDEN_PATH_Z === 84);
  ok('bench stays 276 / 82.4', GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('grass hull stays 267–285 / 81–86',
    LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0);
  ok('park / walks / pergola stay put',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && PARK_WALK_X0 === 268 && PARK_WALK_X1 === 274.2 && PARK_WALK_Z === 94
    && PARK_WALK_E_X0 === 277.8 && PARK_WALK_E_X1 === 284 && PARK_WALK_E_Z === 94
    && PARK_PERGOLA_X === 276 && PARK_PERGOLA_Z === 94);
  ok('drop if pavement / reserved / kiss D or park',
    tryPlace(ctx, 0, 27) === 0
    && tryPlace(ctx, LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z) === 0
    && leftoverLotOverlap(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z, LEFTOVER_LOT_D_W, LEFTOVER_LOT_D_D)
    && leftoverLotOverlap(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z, LEFTOVER_LOT_E_W, LEFTOVER_LOT_E_D)
    && !leftoverLotOverlap(POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D)
    && LEFTOVER_LOT_E_X0 >= LEFTOVER_LOT_D_X1 + 1.8
    && LEFTOVER_LOT_E_X0 > LEFTOVER_GRASS_X1
    && LEFTOVER_LOT_E_X0 > POCKET_PARK_X1);

  // ---- leftoverLot F: sixth leftover-city parcel, same schema ------------
  ok('#34 / #35 / C / D / E stay signed 258/84, 295/84, 313/84, 330/84, and 347/84',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84
    && LEFTOVER_LOT_D_X === 330 && LEFTOVER_LOT_D_Z === 84
    && LEFTOVER_LOT_E_X === 347 && LEFTOVER_LOT_E_Z === 84);
  ok('lot F cell is signed 364/84', LEFTOVER_LOT_F_X === 364 && LEFTOVER_LOT_F_Z === 84);
  ok('lot F plate is signed 14 × 12', LEFTOVER_LOT_F_W === 14 && LEFTOVER_LOT_F_D === 12);
  ok('lot F bounds are signed',
    LEFTOVER_LOT_F_X0 === 357 && LEFTOVER_LOT_F_X1 === 371
    && LEFTOVER_LOT_F_Z0 === 78 && LEFTOVER_LOT_F_Z1 === 90);
  ok('lot F plate was not grown',
    LEFTOVER_LOT_F_X1 - LEFTOVER_LOT_F_X0 === LEFTOVER_LOT_F_W
    && LEFTOVER_LOT_F_Z1 - LEFTOVER_LOT_F_Z0 === LEFTOVER_LOT_F_D
    && LEFTOVER_LOT_F_W === LEFTOVER_LOT_W && LEFTOVER_LOT_F_D === LEFTOVER_LOT_D);
  ok('lot F reuses leftoverLotGeom',
    geomF.x0 === LEFTOVER_LOT_F_X0 && geomF.x1 === LEFTOVER_LOT_F_X1
    && geomF.z0 === LEFTOVER_LOT_F_Z0 && geomF.z1 === LEFTOVER_LOT_F_Z1
    && geomF.h === LEFTOVER_LOT_FENCE_H
    && geom.x0 === LEFTOVER_LOT_X0 && geom.x1 === LEFTOVER_LOT_X1
    && geomB.x0 === LEFTOVER_LOT_B_X0 && geomB.x1 === LEFTOVER_LOT_B_X1
    && geomC.x0 === LEFTOVER_LOT_C_X0 && geomC.x1 === LEFTOVER_LOT_C_X1
    && geomD.x0 === LEFTOVER_LOT_D_X0 && geomD.x1 === LEFTOVER_LOT_D_X1
    && geomE.x0 === LEFTOVER_LOT_E_X0 && geomE.x1 === LEFTOVER_LOT_E_X1);
  ok('lot F is not pavement', !onPavement(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z));
  ok('lot F is not boardwalk', !onBoardwalk(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z));
  ok('lot F is not roadway', !onRoadway(LEFTOVER_LOT_F_Z));
  ok('lot F is not a cross-street', !onCrossStreet(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z));
  ok('lot F is not a sidewalk slab', !onSidewalk(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z));
  ok('lot F sits on leftover-city grade',
    groundHeight(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z) === CITY_Y);
  ok('lot F is reserved', inReserved(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z));
  ok('lot F is a keepout', inKeepout(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z));
  ok('reservedOverlap covers lot F plate',
    reservedOverlap(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z, LEFTOVER_LOT_F_W, LEFTOVER_LOT_F_D));
  ok('leftoverLotOverlap covers lot F plate',
    leftoverLotOverlap(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z, LEFTOVER_LOT_F_W, LEFTOVER_LOT_F_D));
  ok('inLeftoverLotReserved covers lot F',
    inLeftoverLotReserved(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z));
  ok('tryPlace drops reserved F', tryPlace(ctx, LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z) === 0);
  ok('tryPlace does not remap lot F', tryPlace(ctx, LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z) === 0);
  ok('lot F starts 1.2 m off E reserved',
    LEFTOVER_LOT_F_X0 === 357
    && LEFTOVER_LOT_E_X1 + 1.8 === 355.8
    && LEFTOVER_LOT_F_X0 === LEFTOVER_LOT_E_X1 + 1.8 + 1.2);
  ok('lot F east of lot E reserved', LEFTOVER_LOT_F_X0 >= LEFTOVER_LOT_E_X1 + 1.8);
  ok('lot F is 2 m east of E-park x1=355',
    POCKET_PARK_E_X1 === 355 && LEFTOVER_LOT_F_X0 === POCKET_PARK_E_X1 + 2);
  ok('lot F is 2 m ocean of E-park z0=92',
    POCKET_PARK_E_Z0 === 92 && LEFTOVER_LOT_F_Z1 === 90
    && LEFTOVER_LOT_F_Z1 === POCKET_PARK_E_Z0 - 2);
  ok('F vs E-park is a 2 m gap, not a leftoverLotOverlap kiss',
    !leftoverLotOverlap(POCKET_PARK_E_X, POCKET_PARK_E_Z, POCKET_PARK_E_W, POCKET_PARK_E_D)
    && LEFTOVER_LOT_F_X0 === 357 && POCKET_PARK_E_X1 === 355
    && LEFTOVER_LOT_F_Z1 === 90 && POCKET_PARK_E_Z0 === 92);
  ok('lot F west of helipadE', LEFTOVER_LOT_F_X1 <= 408);
  ok('helipad E stays ~59 m east at 430/70',
    430 - LEFTOVER_LOT_F_X1 === 59);
  ok('lot F same inland band as #34 / #35 / C / D / E / drop / abando',
    LEFTOVER_LOT_F_Z === 84 && LEFTOVER_LOT_F_Z === LEFTOVER_LOT_Z
    && LEFTOVER_LOT_F_Z === LEFTOVER_LOT_B_Z
    && LEFTOVER_LOT_F_Z === LEFTOVER_LOT_C_Z
    && LEFTOVER_LOT_F_Z === LEFTOVER_LOT_D_Z
    && LEFTOVER_LOT_F_Z === LEFTOVER_LOT_E_Z);
  ok('A–E lots stay 258 / 295 / 313 / 330 / 347 at z=84',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_D_X === 330
    && LEFTOVER_LOT_E_X === 347
    && LEFTOVER_LOT_Z === 84 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_Z === 84 && LEFTOVER_LOT_D_Z === 84
    && LEFTOVER_LOT_E_Z === 84
    && LEFTOVER_LOT_E_X0 === 340 && LEFTOVER_LOT_E_X1 === 354
    && LEFTOVER_LOT_E_Z0 === 78 && LEFTOVER_LOT_E_Z1 === 90);
  ok('path stays 268→284 / z=84',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284 && GARDEN_PATH_Z === 84);
  ok('bench stays 276 / 82.4', GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('grass hull stays 267–285 / 81–86',
    LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0);
  ok('276 park stays 268–284 × 88–96',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_X0 === 268 && POCKET_PARK_X1 === 284
    && POCKET_PARK_Z0 === 88 && POCKET_PARK_Z1 === 96);
  ok('E-park stays 339–355 × 92–100',
    POCKET_PARK_E_X === 347 && POCKET_PARK_E_Z === 96
    && POCKET_PARK_E_X0 === 339 && POCKET_PARK_E_X1 === 355
    && POCKET_PARK_E_Z0 === 92 && POCKET_PARK_E_Z1 === 100);
  ok('POCKET_PARK_E leftover MIN/MAX stay 8000/11000',
    POCKET_PARK_E_INSTANCES_MIN === 8000
    && POCKET_PARK_E_INSTANCES_MAX === 11000);
  ok('F-park stays 356–372 × 92–100',
    POCKET_PARK_F_X === 364 && POCKET_PARK_F_Z === 96
    && POCKET_PARK_F_X0 === 356 && POCKET_PARK_F_X1 === 372
    && POCKET_PARK_F_Z0 === 92 && POCKET_PARK_F_Z1 === 100
    && POCKET_PARK_F_W === 16 && POCKET_PARK_F_D === 8);
  ok('F-park is 2 m inland of lot F, leftoverLotOverlap of F reserved is 0',
    POCKET_PARK_F_Z0 === LEFTOVER_LOT_F_Z1 + 2
    && POCKET_PARK_F_X0 === LEFTOVER_LOT_F_X0 - 1
    && POCKET_PARK_F_X1 === LEFTOVER_LOT_F_X1 + 1
    && !leftoverLotOverlap(POCKET_PARK_F_X, POCKET_PARK_F_Z, POCKET_PARK_F_W, POCKET_PARK_F_D)
    && LEFTOVER_LOT_F_Z1 + 1.4 === 91.4
    && Math.abs((LEFTOVER_LOT_F_Z1 + 1.4) - POCKET_PARK_F_Z0 + 0.6) < 1e-9);
  ok('E-park x1=355 must not merge with F-park x0=356',
    POCKET_PARK_E_X1 === 355 && POCKET_PARK_F_X0 === 356
    && POCKET_PARK_F_X0 === POCKET_PARK_E_X1 + 1
    && POCKET_PARK_E_Z0 === POCKET_PARK_F_Z0
    && POCKET_PARK_E_Z1 === POCKET_PARK_F_Z1);
  ok('POCKET_PARK_F leftover MIN/MAX stay 8000/11000',
    POCKET_PARK_F_INSTANCES_MIN === 8000
    && POCKET_PARK_F_INSTANCES_MAX === 11000);
  ok('walks stay 84 / 276 / EE spine / west / east / FF spine',
    PARK_WALK_X0 === 268 && PARK_WALK_X1 === 274.2 && PARK_WALK_Z === 94
    && PARK_WALK_E_X0 === 277.8 && PARK_WALK_E_X1 === 284 && PARK_WALK_E_Z === 94
    && PARK_WALK_EE_X0 === 339 && PARK_WALK_EE_X1 === 355 && PARK_WALK_EE_Z === 96
    && PARK_WALK_EE_W_X0 === 339 && PARK_WALK_EE_W_X1 === 345.2 && PARK_WALK_EE_W_Z === 98.5
    && PARK_WALK_EE_E_X0 === 348.8 && PARK_WALK_EE_E_X1 === 355 && PARK_WALK_EE_E_Z === 98.5
    && PARK_WALK_FF_X0 === 356 && PARK_WALK_FF_X1 === 372 && PARK_WALK_FF_Z === 96);
  ok('benches stay 347/94.4, 340.5/94.4, 353.5/94.4',
    PARK_BENCH_EE_X === 347 && PARK_BENCH_EE_Z === 94.4
    && PARK_BENCH_EE_W_X === 340.5 && PARK_BENCH_EE_W_Z === 94.4
    && PARK_BENCH_EE_E_X === 353.5 && PARK_BENCH_EE_E_Z === 94.4);
  ok('347/98.5 pergola stays',
    PARK_PERGOLA_EE_X === 347 && PARK_PERGOLA_EE_Z === 98.5);
  ok('park / walks / pergola stay put',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && PARK_WALK_X0 === 268 && PARK_WALK_X1 === 274.2 && PARK_WALK_Z === 94
    && PARK_WALK_E_X0 === 277.8 && PARK_WALK_E_X1 === 284 && PARK_WALK_E_Z === 94
    && PARK_PERGOLA_X === 276 && PARK_PERGOLA_Z === 94);
  ok('drop if pavement / reserved / kiss E or park',
    tryPlace(ctx, 0, 27) === 0
    && tryPlace(ctx, LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z) === 0
    && leftoverLotOverlap(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z, LEFTOVER_LOT_E_W, LEFTOVER_LOT_E_D)
    && leftoverLotOverlap(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z, LEFTOVER_LOT_F_W, LEFTOVER_LOT_F_D)
    && !leftoverLotOverlap(POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D)
    && !leftoverLotOverlap(POCKET_PARK_E_X, POCKET_PARK_E_Z, POCKET_PARK_E_W, POCKET_PARK_E_D)
    && !leftoverLotOverlap(POCKET_PARK_F_X, POCKET_PARK_F_Z, POCKET_PARK_F_W, POCKET_PARK_F_D)
    && LEFTOVER_LOT_F_X0 >= LEFTOVER_LOT_E_X1 + 1.8
    && LEFTOVER_LOT_F_X0 > LEFTOVER_GRASS_X1
    && LEFTOVER_LOT_F_X0 > POCKET_PARK_X1
    && LEFTOVER_LOT_F_X0 === POCKET_PARK_E_X1 + 2);

  // ---- leftoverLot G: seventh leftover-city parcel, same schema -----------
  ok('#34 / #35 / C / D / E / F stay signed 258/84, 295/84, 313/84, 330/84, 347/84, and 364/84',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84
    && LEFTOVER_LOT_D_X === 330 && LEFTOVER_LOT_D_Z === 84
    && LEFTOVER_LOT_E_X === 347 && LEFTOVER_LOT_E_Z === 84
    && LEFTOVER_LOT_F_X === 364 && LEFTOVER_LOT_F_Z === 84);
  ok('lot G cell is signed 381/84', LEFTOVER_LOT_G_X === 381 && LEFTOVER_LOT_G_Z === 84);
  ok('lot G plate is signed 14 × 12', LEFTOVER_LOT_G_W === 14 && LEFTOVER_LOT_G_D === 12);
  ok('lot G bounds are signed',
    LEFTOVER_LOT_G_X0 === 374 && LEFTOVER_LOT_G_X1 === 388
    && LEFTOVER_LOT_G_Z0 === 78 && LEFTOVER_LOT_G_Z1 === 90);
  ok('lot G plate was not grown',
    LEFTOVER_LOT_G_X1 - LEFTOVER_LOT_G_X0 === LEFTOVER_LOT_G_W
    && LEFTOVER_LOT_G_Z1 - LEFTOVER_LOT_G_Z0 === LEFTOVER_LOT_G_D
    && LEFTOVER_LOT_G_W === LEFTOVER_LOT_W && LEFTOVER_LOT_G_D === LEFTOVER_LOT_D);
  ok('lot G reuses leftoverLotGeom',
    geomG.x0 === LEFTOVER_LOT_G_X0 && geomG.x1 === LEFTOVER_LOT_G_X1
    && geomG.z0 === LEFTOVER_LOT_G_Z0 && geomG.z1 === LEFTOVER_LOT_G_Z1
    && geomG.h === LEFTOVER_LOT_FENCE_H
    && geom.x0 === LEFTOVER_LOT_X0 && geom.x1 === LEFTOVER_LOT_X1
    && geomB.x0 === LEFTOVER_LOT_B_X0 && geomB.x1 === LEFTOVER_LOT_B_X1
    && geomC.x0 === LEFTOVER_LOT_C_X0 && geomC.x1 === LEFTOVER_LOT_C_X1
    && geomD.x0 === LEFTOVER_LOT_D_X0 && geomD.x1 === LEFTOVER_LOT_D_X1
    && geomE.x0 === LEFTOVER_LOT_E_X0 && geomE.x1 === LEFTOVER_LOT_E_X1
    && geomF.x0 === LEFTOVER_LOT_F_X0 && geomF.x1 === LEFTOVER_LOT_F_X1);
  ok('lot G is not pavement', !onPavement(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z));
  ok('lot G is not boardwalk', !onBoardwalk(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z));
  ok('lot G is not roadway', !onRoadway(LEFTOVER_LOT_G_Z));
  ok('lot G is not a cross-street', !onCrossStreet(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z));
  ok('lot G is not a sidewalk slab', !onSidewalk(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z));
  ok('lot G sits on leftover-city grade',
    groundHeight(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z) === CITY_Y);
  ok('lot G is reserved', inReserved(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z));
  ok('lot G is a keepout', inKeepout(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z));
  ok('reservedOverlap covers lot G plate',
    reservedOverlap(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z, LEFTOVER_LOT_G_W, LEFTOVER_LOT_G_D));
  ok('leftoverLotOverlap covers lot G plate',
    leftoverLotOverlap(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z, LEFTOVER_LOT_G_W, LEFTOVER_LOT_G_D));
  ok('inLeftoverLotReserved covers lot G',
    inLeftoverLotReserved(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z));
  ok('tryPlace drops reserved G', tryPlace(ctx, LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z) === 0);
  ok('tryPlace does not remap lot G', tryPlace(ctx, LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z) === 0);
  ok('lot G starts 1.2 m off F reserved',
    LEFTOVER_LOT_G_X0 === 374
    && LEFTOVER_LOT_F_X1 + 1.8 === 372.8
    && LEFTOVER_LOT_G_X0 === LEFTOVER_LOT_F_X1 + 1.8 + 1.2);
  ok('lot G east of lot F reserved', LEFTOVER_LOT_G_X0 >= LEFTOVER_LOT_F_X1 + 1.8);
  ok('lot G is 2 m east of F-park x1=372',
    POCKET_PARK_F_X1 === 372 && LEFTOVER_LOT_G_X0 === POCKET_PARK_F_X1 + 2);
  ok('G vs F reserved is a 1.2 m gap, not a leftoverLotOverlap kiss',
    LEFTOVER_LOT_G_X0 === 374 && LEFTOVER_LOT_F_X1 + 1.8 === 372.8
    && LEFTOVER_LOT_G_X0 === LEFTOVER_LOT_F_X1 + 1.8 + 1.2
    && leftoverLotOverlap(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z, LEFTOVER_LOT_F_W, LEFTOVER_LOT_F_D)
    && leftoverLotOverlap(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z, LEFTOVER_LOT_G_W, LEFTOVER_LOT_G_D));
  ok('G vs F-park is a 2 m gap, not a leftoverLotOverlap kiss',
    !leftoverLotOverlap(POCKET_PARK_F_X, POCKET_PARK_F_Z, POCKET_PARK_F_W, POCKET_PARK_F_D)
    && LEFTOVER_LOT_G_X0 === 374 && POCKET_PARK_F_X1 === 372
    && LEFTOVER_LOT_G_Z1 === 90 && POCKET_PARK_F_Z0 === 92);
  ok('lot G west of helipadE', LEFTOVER_LOT_G_X1 <= 408);
  ok('helipad E stays ~42 m east at 430/70',
    430 - LEFTOVER_LOT_G_X1 === 42);
  ok('GAP 429 stays ~41 m east',
    429 - LEFTOVER_LOT_G_X1 === 41);
  ok('lot G same inland band as #34 / #35 / C / D / E / F / drop / abando',
    LEFTOVER_LOT_G_Z === 84 && LEFTOVER_LOT_G_Z === LEFTOVER_LOT_Z
    && LEFTOVER_LOT_G_Z === LEFTOVER_LOT_B_Z
    && LEFTOVER_LOT_G_Z === LEFTOVER_LOT_C_Z
    && LEFTOVER_LOT_G_Z === LEFTOVER_LOT_D_Z
    && LEFTOVER_LOT_G_Z === LEFTOVER_LOT_E_Z
    && LEFTOVER_LOT_G_Z === LEFTOVER_LOT_F_Z);
  ok('A–G lots stay 258 / 295 / 313 / 330 / 347 / 364 / 381 at z=84',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_D_X === 330
    && LEFTOVER_LOT_E_X === 347 && LEFTOVER_LOT_F_X === 364
    && LEFTOVER_LOT_G_X === 381
    && LEFTOVER_LOT_Z === 84 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_Z === 84 && LEFTOVER_LOT_D_Z === 84
    && LEFTOVER_LOT_E_Z === 84 && LEFTOVER_LOT_F_Z === 84
    && LEFTOVER_LOT_G_Z === 84
    && LEFTOVER_LOT_F_X0 === 357 && LEFTOVER_LOT_F_X1 === 371
    && LEFTOVER_LOT_F_Z0 === 78 && LEFTOVER_LOT_F_Z1 === 90
    && LEFTOVER_LOT_G_X0 === 374 && LEFTOVER_LOT_G_X1 === 388
    && LEFTOVER_LOT_G_Z0 === 78 && LEFTOVER_LOT_G_Z1 === 90);
  ok('path stays 268→284 / z=84',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284 && GARDEN_PATH_Z === 84);
  ok('bench stays 276 / 82.4', GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('grass hull stays 267–285 / 81–86',
    LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0);
  ok('276 park stays 268–284 × 88–96',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_X0 === 268 && POCKET_PARK_X1 === 284
    && POCKET_PARK_Z0 === 88 && POCKET_PARK_Z1 === 96);
  ok('347 park stays 339–355 × 92–100',
    POCKET_PARK_E_X === 347 && POCKET_PARK_E_Z === 96
    && POCKET_PARK_E_X0 === 339 && POCKET_PARK_E_X1 === 355
    && POCKET_PARK_E_Z0 === 92 && POCKET_PARK_E_Z1 === 100);
  ok('F-park hull stays 356–372 × 92–100',
    POCKET_PARK_F_X === 364 && POCKET_PARK_F_Z === 96
    && POCKET_PARK_F_X0 === 356 && POCKET_PARK_F_X1 === 372
    && POCKET_PARK_F_Z0 === 92 && POCKET_PARK_F_Z1 === 100
    && POCKET_PARK_F_W === 16 && POCKET_PARK_F_D === 8);
  ok('F-park leftoverLotOverlap of F reserved stays 0',
    !leftoverLotOverlap(POCKET_PARK_F_X, POCKET_PARK_F_Z, POCKET_PARK_F_W, POCKET_PARK_F_D)
    && LEFTOVER_LOT_F_Z1 + 1.4 === 91.4
    && Math.abs((LEFTOVER_LOT_F_Z1 + 1.4) - POCKET_PARK_F_Z0 + 0.6) < 1e-9);
  ok('G-park is the signed 381/96 hull (373–389 × 92–100)',
    POCKET_PARK_G_X === 381 && POCKET_PARK_G_Z === 96
    && POCKET_PARK_G_X0 === 373 && POCKET_PARK_G_X1 === 389
    && POCKET_PARK_G_Z0 === 92 && POCKET_PARK_G_Z1 === 100
    && POCKET_PARK_G_W === 16 && POCKET_PARK_G_D === 8
    && LEFTOVER_LOT_G_X === 381 && LEFTOVER_LOT_G_Z === 84);
  ok('G-park is 2 m inland of lot G, leftoverLotOverlap of G reserved is 0',
    POCKET_PARK_G_Z0 === LEFTOVER_LOT_G_Z1 + 2
    && POCKET_PARK_G_X0 === LEFTOVER_LOT_G_X0 - 1
    && POCKET_PARK_G_X1 === LEFTOVER_LOT_G_X1 + 1
    && !leftoverLotOverlap(POCKET_PARK_G_X, POCKET_PARK_G_Z, POCKET_PARK_G_W, POCKET_PARK_G_D)
    && LEFTOVER_LOT_G_Z1 + 1.4 === 91.4
    && Math.abs((LEFTOVER_LOT_G_Z1 + 1.4) - POCKET_PARK_G_Z0 + 0.6) < 1e-9);
  ok('F-park x1=372 must not merge with G-park x0=373',
    POCKET_PARK_F_X1 === 372 && POCKET_PARK_G_X0 === 373
    && POCKET_PARK_G_X0 === POCKET_PARK_F_X1 + 1
    && POCKET_PARK_F_Z0 === POCKET_PARK_G_Z0
    && POCKET_PARK_F_Z1 === POCKET_PARK_G_Z1);
  ok('POCKET_PARK_G leftover MIN/MAX stay 8000/11000',
    POCKET_PARK_G_INSTANCES_MIN === 8000
    && POCKET_PARK_G_INSTANCES_MAX === 11000);
  ok('walks stay 84 / 276 / EE spine / west / east / FF spine + kit / GG spine + kit / HH spine + kit',
    PARK_WALK_X0 === 268 && PARK_WALK_X1 === 274.2 && PARK_WALK_Z === 94
    && PARK_WALK_E_X0 === 277.8 && PARK_WALK_E_X1 === 284 && PARK_WALK_E_Z === 94
    && PARK_WALK_EE_X0 === 339 && PARK_WALK_EE_X1 === 355 && PARK_WALK_EE_Z === 96
    && PARK_WALK_EE_W_X0 === 339 && PARK_WALK_EE_W_X1 === 345.2 && PARK_WALK_EE_W_Z === 98.5
    && PARK_WALK_EE_E_X0 === 348.8 && PARK_WALK_EE_E_X1 === 355 && PARK_WALK_EE_E_Z === 98.5
    && PARK_WALK_FF_X0 === 356 && PARK_WALK_FF_X1 === 372 && PARK_WALK_FF_Z === 96
    && PARK_WALK_FF_W_X0 === 356 && PARK_WALK_FF_W_X1 === 362.2 && PARK_WALK_FF_W_Z === 98.5
    && PARK_WALK_FF_E_X0 === 365.8 && PARK_WALK_FF_E_X1 === 372 && PARK_WALK_FF_E_Z === 98.5
    && PARK_WALK_GG_X0 === 373 && PARK_WALK_GG_X1 === 389 && PARK_WALK_GG_Z === 96
    && PARK_WALK_GG_W_X0 === 373 && PARK_WALK_GG_W_X1 === 379.2 && PARK_WALK_GG_W_Z === 98.5
    && PARK_WALK_GG_E_X0 === 382.8 && PARK_WALK_GG_E_X1 === 389 && PARK_WALK_GG_E_Z === 98.5
    && PARK_WALK_HH_X0 === 390 && PARK_WALK_HH_X1 === 406 && PARK_WALK_HH_Z === 96
    && PARK_WALK_HH_W_X0 === 390 && PARK_WALK_HH_W_X1 === 396.2 && PARK_WALK_HH_W_Z === 98.5
    && PARK_WALK_HH_E_X0 === 399.8 && PARK_WALK_HH_E_X1 === 406 && PARK_WALK_HH_E_Z === 98.5);
  ok('benches stay 347/94.4, 340.5/94.4, 353.5/94.4, FF 364/94.4 kit, GG 381/94.4 kit, HH 398/94.4 kit',
    PARK_BENCH_EE_X === 347 && PARK_BENCH_EE_Z === 94.4
    && PARK_BENCH_EE_W_X === 340.5 && PARK_BENCH_EE_W_Z === 94.4
    && PARK_BENCH_EE_E_X === 353.5 && PARK_BENCH_EE_E_Z === 94.4
    && PARK_BENCH_FF_X === 364 && PARK_BENCH_FF_Z === 94.4
    && PARK_BENCH_FF_W_X === 357.5 && PARK_BENCH_FF_W_Z === 94.4
    && PARK_BENCH_FF_E_X === 370.5 && PARK_BENCH_FF_E_Z === 94.4
    && PARK_BENCH_GG_X === 381 && PARK_BENCH_GG_Z === 94.4
    && PARK_BENCH_GG_W_X === 374.5 && PARK_BENCH_GG_W_Z === 94.4
    && PARK_BENCH_GG_E_X === 387.5 && PARK_BENCH_GG_E_Z === 94.4
    && PARK_BENCH_HH_X === 398 && PARK_BENCH_HH_Z === 94.4
    && PARK_BENCH_HH_W_X === 391.5 && PARK_BENCH_HH_W_Z === 94.4
    && PARK_BENCH_HH_E_X === 404.5 && PARK_BENCH_HH_E_Z === 94.4);
  ok('347/98.5, 364/98.5, 381/98.5, and 398/98.5 pergolas stay',
    PARK_PERGOLA_EE_X === 347 && PARK_PERGOLA_EE_Z === 98.5
    && PARK_PERGOLA_FF_X === 364 && PARK_PERGOLA_FF_Z === 98.5
    && PARK_PERGOLA_GG_X === 381 && PARK_PERGOLA_GG_Z === 98.5
    && PARK_PERGOLA_HH_X === 398 && PARK_PERGOLA_HH_Z === 98.5);
  ok('park / walks / pergola stay put',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && PARK_WALK_X0 === 268 && PARK_WALK_X1 === 274.2 && PARK_WALK_Z === 94
    && PARK_WALK_E_X0 === 277.8 && PARK_WALK_E_X1 === 284 && PARK_WALK_E_Z === 94
    && PARK_PERGOLA_X === 276 && PARK_PERGOLA_Z === 94);
  ok('drop if pavement / reserved / kiss F or F-park',
    tryPlace(ctx, 0, 27) === 0
    && tryPlace(ctx, LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z) === 0
    && leftoverLotOverlap(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z, LEFTOVER_LOT_F_W, LEFTOVER_LOT_F_D)
    && leftoverLotOverlap(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z, LEFTOVER_LOT_G_W, LEFTOVER_LOT_G_D)
    && !leftoverLotOverlap(POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D)
    && !leftoverLotOverlap(POCKET_PARK_E_X, POCKET_PARK_E_Z, POCKET_PARK_E_W, POCKET_PARK_E_D)
    && !leftoverLotOverlap(POCKET_PARK_F_X, POCKET_PARK_F_Z, POCKET_PARK_F_W, POCKET_PARK_F_D)
    && !leftoverLotOverlap(POCKET_PARK_G_X, POCKET_PARK_G_Z, POCKET_PARK_G_W, POCKET_PARK_G_D)
    && LEFTOVER_LOT_G_X0 >= LEFTOVER_LOT_F_X1 + 1.8
    && LEFTOVER_LOT_G_X0 > LEFTOVER_GRASS_X1
    && LEFTOVER_LOT_G_X0 > POCKET_PARK_X1
    && LEFTOVER_LOT_G_X0 === POCKET_PARK_F_X1 + 2);

  // ---- leftoverLot H: eighth leftover-city parcel, same schema -----------
  ok('#34 / #35 / C / D / E / F / G stay signed 258/84, 295/84, 313/84, 330/84, 347/84, 364/84, and 381/84',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84
    && LEFTOVER_LOT_D_X === 330 && LEFTOVER_LOT_D_Z === 84
    && LEFTOVER_LOT_E_X === 347 && LEFTOVER_LOT_E_Z === 84
    && LEFTOVER_LOT_F_X === 364 && LEFTOVER_LOT_F_Z === 84
    && LEFTOVER_LOT_G_X === 381 && LEFTOVER_LOT_G_Z === 84);
  ok('lot H cell is signed 398/84', LEFTOVER_LOT_H_X === 398 && LEFTOVER_LOT_H_Z === 84);
  ok('lot H is G+17 m',
    LEFTOVER_LOT_H_X === LEFTOVER_LOT_G_X + 17 && LEFTOVER_LOT_H_Z === LEFTOVER_LOT_G_Z);
  ok('lot H plate is signed 14 × 12', LEFTOVER_LOT_H_W === 14 && LEFTOVER_LOT_H_D === 12);
  ok('lot H bounds are signed',
    LEFTOVER_LOT_H_X0 === 391 && LEFTOVER_LOT_H_X1 === 405
    && LEFTOVER_LOT_H_Z0 === 78 && LEFTOVER_LOT_H_Z1 === 90);
  ok('lot H plate was not grown',
    LEFTOVER_LOT_H_X1 - LEFTOVER_LOT_H_X0 === LEFTOVER_LOT_H_W
    && LEFTOVER_LOT_H_Z1 - LEFTOVER_LOT_H_Z0 === LEFTOVER_LOT_H_D
    && LEFTOVER_LOT_H_W === LEFTOVER_LOT_W && LEFTOVER_LOT_H_D === LEFTOVER_LOT_D
    && LEFTOVER_LOT_H_W === LEFTOVER_LOT_G_W && LEFTOVER_LOT_H_D === LEFTOVER_LOT_G_D);
  ok('lot H reuses leftoverLotGeom',
    geomH.x0 === LEFTOVER_LOT_H_X0 && geomH.x1 === LEFTOVER_LOT_H_X1
    && geomH.z0 === LEFTOVER_LOT_H_Z0 && geomH.z1 === LEFTOVER_LOT_H_Z1
    && geomH.h === LEFTOVER_LOT_FENCE_H
    && geom.x0 === LEFTOVER_LOT_X0 && geom.x1 === LEFTOVER_LOT_X1
    && geomB.x0 === LEFTOVER_LOT_B_X0 && geomB.x1 === LEFTOVER_LOT_B_X1
    && geomC.x0 === LEFTOVER_LOT_C_X0 && geomC.x1 === LEFTOVER_LOT_C_X1
    && geomD.x0 === LEFTOVER_LOT_D_X0 && geomD.x1 === LEFTOVER_LOT_D_X1
    && geomE.x0 === LEFTOVER_LOT_E_X0 && geomE.x1 === LEFTOVER_LOT_E_X1
    && geomF.x0 === LEFTOVER_LOT_F_X0 && geomF.x1 === LEFTOVER_LOT_F_X1
    && geomG.x0 === LEFTOVER_LOT_G_X0 && geomG.x1 === LEFTOVER_LOT_G_X1);
  ok('lot H is not pavement', !onPavement(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z));
  ok('lot H is not boardwalk', !onBoardwalk(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z));
  ok('lot H is not roadway', !onRoadway(LEFTOVER_LOT_H_Z));
  ok('lot H is not a cross-street', !onCrossStreet(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z));
  ok('lot H is not a sidewalk slab', !onSidewalk(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z));
  ok('lot H sits on leftover-city grade',
    groundHeight(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z) === CITY_Y);
  ok('lot H is reserved', inReserved(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z));
  ok('lot H is a keepout', inKeepout(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z));
  ok('reservedOverlap covers lot H plate',
    reservedOverlap(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z, LEFTOVER_LOT_H_W, LEFTOVER_LOT_H_D));
  ok('leftoverLotOverlap covers lot H plate',
    leftoverLotOverlap(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z, LEFTOVER_LOT_H_W, LEFTOVER_LOT_H_D));
  ok('inLeftoverLotReserved covers lot H',
    inLeftoverLotReserved(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z));
  ok('tryPlace drops reserved H', tryPlace(ctx, LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z) === 0);
  ok('tryPlace does not remap lot H', tryPlace(ctx, LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z) === 0);
  ok('lot H starts 1.2 m off G reserved',
    LEFTOVER_LOT_H_X0 === 391
    && LEFTOVER_LOT_G_X1 + 1.8 === 389.8
    && LEFTOVER_LOT_H_X0 === LEFTOVER_LOT_G_X1 + 1.8 + 1.2);
  ok('lot H east of lot G reserved', LEFTOVER_LOT_H_X0 >= LEFTOVER_LOT_G_X1 + 1.8);
  ok('lot H is 1.2 m east of G x1=388',
    LEFTOVER_LOT_G_X1 === 388 && LEFTOVER_LOT_H_X0 === LEFTOVER_LOT_G_X1 + 3);
  ok('H vs G reserved is a 1.2 m gap, not a leftoverLotOverlap kiss',
    LEFTOVER_LOT_H_X0 === 391 && LEFTOVER_LOT_G_X1 + 1.8 === 389.8
    && LEFTOVER_LOT_H_X0 === LEFTOVER_LOT_G_X1 + 1.8 + 1.2
    && leftoverLotOverlap(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z, LEFTOVER_LOT_G_W, LEFTOVER_LOT_G_D)
    && leftoverLotOverlap(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z, LEFTOVER_LOT_H_W, LEFTOVER_LOT_H_D));
  ok('lot H does not merge with G-park 389',
    POCKET_PARK_G_X1 === 389 && LEFTOVER_LOT_H_X0 === 391
    && LEFTOVER_LOT_H_X0 === POCKET_PARK_G_X1 + 2
    && LEFTOVER_LOT_H_X0 !== 389);
  ok('H vs G-park leftoverLotOverlap is 0 (2 m south apron, not a kiss)',
    !leftoverLotOverlap(POCKET_PARK_G_X, POCKET_PARK_G_Z, POCKET_PARK_G_W, POCKET_PARK_G_D)
    && LEFTOVER_LOT_H_X0 === 391 && POCKET_PARK_G_X1 === 389
    && LEFTOVER_LOT_H_Z1 === 90 && POCKET_PARK_G_Z0 === 92
    && LEFTOVER_LOT_H_Z1 + 2 === POCKET_PARK_G_Z0
    && LEFTOVER_LOT_H_Z1 + 1.4 === 91.4
    && Math.abs((LEFTOVER_LOT_H_Z1 + 1.4) - POCKET_PARK_G_Z0 + 0.6) < 1e-9);
  ok('G-park leftoverLotOverlap of leftover reserved stays 0 after H',
    !leftoverLotOverlap(POCKET_PARK_G_X, POCKET_PARK_G_Z, POCKET_PARK_G_W, POCKET_PARK_G_D)
    && POCKET_PARK_G_X0 === 373 && POCKET_PARK_G_X1 === 389
    && POCKET_PARK_G_Z0 === 92 && POCKET_PARK_G_Z1 === 100
    && LEFTOVER_LOT_G_X0 === 374 && LEFTOVER_LOT_G_X1 === 388
    && LEFTOVER_LOT_G_Z0 === 78 && LEFTOVER_LOT_G_Z1 === 90);
  ok('lot H west of helipadE', LEFTOVER_LOT_H_X1 <= 408);
  ok('helipad E stays ~25 m east at 430/70',
    430 - LEFTOVER_LOT_H_X1 === 25);
  ok('GAP 429 stays ~24 m east',
    429 - LEFTOVER_LOT_H_X1 === 24);
  ok('lot H same inland band as #34 / #35 / C / D / E / F / G / drop / abando',
    LEFTOVER_LOT_H_Z === 84 && LEFTOVER_LOT_H_Z === LEFTOVER_LOT_Z
    && LEFTOVER_LOT_H_Z === LEFTOVER_LOT_B_Z
    && LEFTOVER_LOT_H_Z === LEFTOVER_LOT_C_Z
    && LEFTOVER_LOT_H_Z === LEFTOVER_LOT_D_Z
    && LEFTOVER_LOT_H_Z === LEFTOVER_LOT_E_Z
    && LEFTOVER_LOT_H_Z === LEFTOVER_LOT_F_Z
    && LEFTOVER_LOT_H_Z === LEFTOVER_LOT_G_Z);
  ok('A–G lots stay 258 / 295 / 313 / 330 / 347 / 364 / 381 at z=84',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_D_X === 330
    && LEFTOVER_LOT_E_X === 347 && LEFTOVER_LOT_F_X === 364
    && LEFTOVER_LOT_G_X === 381
    && LEFTOVER_LOT_Z === 84 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_Z === 84 && LEFTOVER_LOT_D_Z === 84
    && LEFTOVER_LOT_E_Z === 84 && LEFTOVER_LOT_F_Z === 84
    && LEFTOVER_LOT_G_Z === 84
    && LEFTOVER_LOT_G_X0 === 374 && LEFTOVER_LOT_G_X1 === 388
    && LEFTOVER_LOT_G_Z0 === 78 && LEFTOVER_LOT_G_Z1 === 90
    && LEFTOVER_LOT_H_X === 398 && LEFTOVER_LOT_H_X0 === 391
    && LEFTOVER_LOT_H_X1 === 405 && LEFTOVER_LOT_H_Z0 === 78
    && LEFTOVER_LOT_H_Z1 === 90);
  ok('G-park stays 373–389 × 92–100 (x1=389)',
    POCKET_PARK_G_X === 381 && POCKET_PARK_G_Z === 96
    && POCKET_PARK_G_X0 === 373 && POCKET_PARK_G_X1 === 389
    && POCKET_PARK_G_Z0 === 92 && POCKET_PARK_G_Z1 === 100
    && POCKET_PARK_G_W === 16 && POCKET_PARK_G_D === 8);
  ok('H-park is the signed 398/96 hull (390–406 × 92–100)',
    POCKET_PARK_H_X === 398 && POCKET_PARK_H_Z === 96
    && POCKET_PARK_H_X0 === 390 && POCKET_PARK_H_X1 === 406
    && POCKET_PARK_H_Z0 === 92 && POCKET_PARK_H_Z1 === 100
    && POCKET_PARK_H_W === 16 && POCKET_PARK_H_D === 8
    && LEFTOVER_LOT_H_X === 398 && LEFTOVER_LOT_H_Z === 84);
  ok('H-park is 2 m inland of lot H, leftoverLotOverlap of H reserved is 0',
    POCKET_PARK_H_Z0 === LEFTOVER_LOT_H_Z1 + 2
    && POCKET_PARK_H_X0 === LEFTOVER_LOT_H_X0 - 1
    && POCKET_PARK_H_X1 === LEFTOVER_LOT_H_X1 + 1
    && !leftoverLotOverlap(POCKET_PARK_H_X, POCKET_PARK_H_Z, POCKET_PARK_H_W, POCKET_PARK_H_D)
    && LEFTOVER_LOT_H_Z1 + 1.4 === 91.4
    && Math.abs((LEFTOVER_LOT_H_Z1 + 1.4) - POCKET_PARK_H_Z0 + 0.6) < 1e-9);
  ok('G-park x1=389 must not merge with H-park x0=390',
    POCKET_PARK_G_X1 === 389 && POCKET_PARK_H_X0 === 390
    && POCKET_PARK_H_X0 === POCKET_PARK_G_X1 + 1
    && POCKET_PARK_G_Z0 === POCKET_PARK_H_Z0
    && POCKET_PARK_G_Z1 === POCKET_PARK_H_Z1);
  ok('POCKET_PARK_H leftover MIN/MAX stay 8000/11000',
    POCKET_PARK_H_INSTANCES_MIN === 8000
    && POCKET_PARK_H_INSTANCES_MAX === 11000);
  ok('walks stay 84 / 276 / EE spine / west / east / FF spine + kit / GG spine + kit / HH spine + kit',
    PARK_WALK_X0 === 268 && PARK_WALK_X1 === 274.2 && PARK_WALK_Z === 94
    && PARK_WALK_E_X0 === 277.8 && PARK_WALK_E_X1 === 284 && PARK_WALK_E_Z === 94
    && PARK_WALK_EE_X0 === 339 && PARK_WALK_EE_X1 === 355 && PARK_WALK_EE_Z === 96
    && PARK_WALK_EE_W_X0 === 339 && PARK_WALK_EE_W_X1 === 345.2 && PARK_WALK_EE_W_Z === 98.5
    && PARK_WALK_EE_E_X0 === 348.8 && PARK_WALK_EE_E_X1 === 355 && PARK_WALK_EE_E_Z === 98.5
    && PARK_WALK_FF_X0 === 356 && PARK_WALK_FF_X1 === 372 && PARK_WALK_FF_Z === 96
    && PARK_WALK_FF_W_X0 === 356 && PARK_WALK_FF_W_X1 === 362.2 && PARK_WALK_FF_W_Z === 98.5
    && PARK_WALK_FF_E_X0 === 365.8 && PARK_WALK_FF_E_X1 === 372 && PARK_WALK_FF_E_Z === 98.5
    && PARK_WALK_GG_X0 === 373 && PARK_WALK_GG_X1 === 389 && PARK_WALK_GG_Z === 96
    && PARK_WALK_GG_W_X0 === 373 && PARK_WALK_GG_W_X1 === 379.2 && PARK_WALK_GG_W_Z === 98.5
    && PARK_WALK_GG_E_X0 === 382.8 && PARK_WALK_GG_E_X1 === 389 && PARK_WALK_GG_E_Z === 98.5
    && PARK_WALK_HH_X0 === 390 && PARK_WALK_HH_X1 === 406 && PARK_WALK_HH_Z === 96
    && PARK_WALK_HH_W_X0 === 390 && PARK_WALK_HH_W_X1 === 396.2 && PARK_WALK_HH_W_Z === 98.5
    && PARK_WALK_HH_E_X0 === 399.8 && PARK_WALK_HH_E_X1 === 406 && PARK_WALK_HH_E_Z === 98.5);
  ok('benches stay 347/94.4, 340.5/94.4, 353.5/94.4, FF 364/94.4 kit, GG 381/94.4 kit, HH 398/94.4 kit',
    PARK_BENCH_EE_X === 347 && PARK_BENCH_EE_Z === 94.4
    && PARK_BENCH_EE_W_X === 340.5 && PARK_BENCH_EE_W_Z === 94.4
    && PARK_BENCH_EE_E_X === 353.5 && PARK_BENCH_EE_E_Z === 94.4
    && PARK_BENCH_FF_X === 364 && PARK_BENCH_FF_Z === 94.4
    && PARK_BENCH_FF_W_X === 357.5 && PARK_BENCH_FF_W_Z === 94.4
    && PARK_BENCH_FF_E_X === 370.5 && PARK_BENCH_FF_E_Z === 94.4
    && PARK_BENCH_GG_X === 381 && PARK_BENCH_GG_Z === 94.4
    && PARK_BENCH_GG_W_X === 374.5 && PARK_BENCH_GG_W_Z === 94.4
    && PARK_BENCH_GG_E_X === 387.5 && PARK_BENCH_GG_E_Z === 94.4
    && PARK_BENCH_HH_X === 398 && PARK_BENCH_HH_Z === 94.4
    && PARK_BENCH_HH_W_X === 391.5 && PARK_BENCH_HH_W_Z === 94.4
    && PARK_BENCH_HH_E_X === 404.5 && PARK_BENCH_HH_E_Z === 94.4);
  ok('347/98.5, 364/98.5, 381/98.5, and 398/98.5 pergolas stay',
    PARK_PERGOLA_EE_X === 347 && PARK_PERGOLA_EE_Z === 98.5
    && PARK_PERGOLA_FF_X === 364 && PARK_PERGOLA_FF_Z === 98.5
    && PARK_PERGOLA_GG_X === 381 && PARK_PERGOLA_GG_Z === 98.5
    && PARK_PERGOLA_HH_X === 398 && PARK_PERGOLA_HH_Z === 98.5);
  ok('drop if pavement / reserved / kiss G or G-park 389',
    tryPlace(ctx, 0, 27) === 0
    && tryPlace(ctx, LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z) === 0
    && leftoverLotOverlap(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z, LEFTOVER_LOT_G_W, LEFTOVER_LOT_G_D)
    && leftoverLotOverlap(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z, LEFTOVER_LOT_H_W, LEFTOVER_LOT_H_D)
    && !leftoverLotOverlap(POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D)
    && !leftoverLotOverlap(POCKET_PARK_E_X, POCKET_PARK_E_Z, POCKET_PARK_E_W, POCKET_PARK_E_D)
    && !leftoverLotOverlap(POCKET_PARK_F_X, POCKET_PARK_F_Z, POCKET_PARK_F_W, POCKET_PARK_F_D)
    && !leftoverLotOverlap(POCKET_PARK_G_X, POCKET_PARK_G_Z, POCKET_PARK_G_W, POCKET_PARK_G_D)
    && !leftoverLotOverlap(POCKET_PARK_H_X, POCKET_PARK_H_Z, POCKET_PARK_H_W, POCKET_PARK_H_D)
    && LEFTOVER_LOT_H_X0 >= LEFTOVER_LOT_G_X1 + 1.8
    && LEFTOVER_LOT_H_X0 > LEFTOVER_GRASS_X1
    && LEFTOVER_LOT_H_X0 > POCKET_PARK_X1
    && LEFTOVER_LOT_H_X0 === POCKET_PARK_G_X1 + 2);

  // ---- leftoverLot G / H live; street tower drops, never nudge -----------
  ok('lots A/B/C/D/E/F/G/H footprints are not in the street',
    !streetOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D)
    && !streetOverlap(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z, LEFTOVER_LOT_B_W, LEFTOVER_LOT_B_D)
    && !streetOverlap(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z, LEFTOVER_LOT_C_W, LEFTOVER_LOT_C_D)
    && !streetOverlap(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z, LEFTOVER_LOT_D_W, LEFTOVER_LOT_D_D)
    && !streetOverlap(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z, LEFTOVER_LOT_E_W, LEFTOVER_LOT_E_D)
    && !streetOverlap(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z, LEFTOVER_LOT_F_W, LEFTOVER_LOT_F_D)
    && !streetOverlap(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z, LEFTOVER_LOT_G_W, LEFTOVER_LOT_G_D)
    && !streetOverlap(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z, LEFTOVER_LOT_H_W, LEFTOVER_LOT_H_D));
  ok('Ocean Drive carriageway is a street footprint',
    streetOverlap(0, 44, 20, 12));
  ok('cross-street column is a street footprint',
    streetOverlap(57, 80, 20, 20) && onPavement(57, 80));
  ok('helipad E 430/70 sits in GAP 429',
    streetOverlap(430, 70, 16, 16) && onPavement(430, 70) && onCrossStreet(430, 70));
  ok('helipad W is not in a street',
    !streetOverlap(-430, 100, 16, 16) && !onPavement(-430, 100));
  ok('tryPlace drops the street-building cell',
    tryPlace(ctx, 430, 70) === 0 && tryPlace(ctx, 57, 80) === 0);
  ok('tryPlace does not remap the street-building cell',
    tryPlace(ctx, 430, 70) === 0);

  // ---- weenie: street-front vehicle gate on ocean face -------------------
  ok('vehicle gate is 3.66 × 1.83',
    Math.abs(LEFTOVER_LOT_GATE_W - 3.66) < 1e-9
    && Math.abs(LEFTOVER_LOT_FENCE_H - 1.83) < 1e-9);
  ok('fence H never under 1.70, industrial max 2.13',
    LEFTOVER_LOT_FENCE_H >= LEFTOVER_LOT_FENCE_H_MIN
    && LEFTOVER_LOT_FENCE_H <= LEFTOVER_LOT_FENCE_H_MAX
    && LEFTOVER_LOT_FENCE_H_MIN === 1.70
    && LEFTOVER_LOT_FENCE_H_MAX === 2.13);
  ok('gate sits on the ocean face z0',
    geom.gateZ === LEFTOVER_LOT_Z0 && gate.z === LEFTOVER_LOT_Z0);
  ok('gate faces −Z / Ocean Drive', geom.gateZ === geom.z0);
  ok('walk gate is secondary 1.07 × 1.83',
    Math.abs(LEFTOVER_LOT_WALK_W - 1.07) < 1e-9
    && Math.abs(LEFTOVER_LOT_WALK_H - 1.83) < 1e-9
    && walk.z === LEFTOVER_LOT_Z1);
  ok('shed door is 0.91 × 2.03 jamb',
    Math.abs(LEFTOVER_LOT_SHED_DOOR_W - 0.91) < 1e-9
    && Math.abs(LEFTOVER_LOT_SHED_DOOR_H - 2.03) < 1e-9);

  ok('leftoverLot ships gate + walk + shed-door voids',
    !!gate && !!walk && !!shedDoor);
  for (const v of voids) {
    const hit = probeBlocked(shapes, v.x, v.y, v.z, v.probe);
    ok(`${v.id} centre open`, !hit, hit ? `blocked by ${hit.tag} ${hit.type}` : '');
  }
  ok('gate void uses the locked clear',
    gate.openW === LEFTOVER_LOT_GATE_W && gate.openH === LEFTOVER_LOT_FENCE_H);
  ok('walk void uses the locked clear',
    walk.openW === LEFTOVER_LOT_WALK_W && walk.openH === LEFTOVER_LOT_WALK_H);
  ok('shed-door void uses the locked jamb',
    shedDoor.openW === LEFTOVER_LOT_SHED_DOOR_W
    && shedDoor.openH === LEFTOVER_LOT_SHED_DOOR_H);

  // ---- jamb-not-box: no lot-AABB; interior flyable -----------------------
  const aabbs = shapes.filter((s) => s.tag === 'leftoverLot' && s.type === 'aabb');
  const posts = shapes.filter((s) => s.tag === 'leftoverLot' && s.type === 'cyl');
  ok('leftoverLot has post + mesh + jamb colliders',
    posts.length >= 8 && aabbs.length >= 8);
  ok('no lot-AABB',
    !aabbs.some((s) => s.sx >= LEFTOVER_LOT_W - 0.4
      && s.sz >= LEFTOVER_LOT_D - 0.4 && s.sy >= 1.2));
  const midLot = probeBlocked(shapes, LEFTOVER_LOT_X, CITY_Y + 1.0, LEFTOVER_LOT_Z, 0.22);
  ok('lot interior is a flyable void', !midLot);
  const midLotB = probeBlocked(shapes, LEFTOVER_LOT_B_X, CITY_Y + 1.0, LEFTOVER_LOT_B_Z, 0.22);
  ok('lot B interior is a flyable void', !midLotB);
  const midLotC = probeBlocked(shapes, LEFTOVER_LOT_C_X, CITY_Y + 1.0, LEFTOVER_LOT_C_Z, 0.22);
  ok('lot C interior is a flyable void', !midLotC);
  const midLotD = probeBlocked(shapes, LEFTOVER_LOT_D_X, CITY_Y + 1.0, LEFTOVER_LOT_D_Z, 0.22);
  ok('lot D interior is a flyable void', !midLotD);
  const midLotE = probeBlocked(shapes, LEFTOVER_LOT_E_X, CITY_Y + 1.0, LEFTOVER_LOT_E_Z, 0.22);
  ok('lot E interior is a flyable void', !midLotE);
  const midLotF = probeBlocked(shapes, LEFTOVER_LOT_F_X, CITY_Y + 1.0, LEFTOVER_LOT_F_Z, 0.22);
  ok('lot F interior is a flyable void', !midLotF);
  const midLotG = probeBlocked(shapes, LEFTOVER_LOT_G_X, CITY_Y + 1.0, LEFTOVER_LOT_G_Z, 0.22);
  ok('lot G interior is a flyable void', !midLotG);
  const midLotH = probeBlocked(shapes, LEFTOVER_LOT_H_X, CITY_Y + 1.0, LEFTOVER_LOT_H_Z, 0.22);
  ok('lot H interior is a flyable void', !midLotH);
  ok('lot B vehicle gate is open',
    !!gateB && !probeBlocked(shapes, gateB.x, gateB.y, gateB.z, gateB.probe)
    && gateB.openW === LEFTOVER_LOT_GATE_W && gateB.openH === LEFTOVER_LOT_FENCE_H
    && geomB.gateZ === LEFTOVER_LOT_B_Z0 && geomB.gateZ === geomB.z0);
  ok('lot C vehicle gate is open',
    !!gateC && !probeBlocked(shapes, gateC.x, gateC.y, gateC.z, gateC.probe)
    && gateC.openW === LEFTOVER_LOT_GATE_W && gateC.openH === LEFTOVER_LOT_FENCE_H
    && geomC.gateZ === LEFTOVER_LOT_C_Z0 && geomC.gateZ === geomC.z0);
  ok('lot D vehicle gate is open',
    !!gateD && !probeBlocked(shapes, gateD.x, gateD.y, gateD.z, gateD.probe)
    && gateD.openW === LEFTOVER_LOT_GATE_W && gateD.openH === LEFTOVER_LOT_FENCE_H
    && geomD.gateZ === LEFTOVER_LOT_D_Z0 && geomD.gateZ === geomD.z0);
  ok('lot E vehicle gate is open',
    !!gateE && !probeBlocked(shapes, gateE.x, gateE.y, gateE.z, gateE.probe)
    && gateE.openW === LEFTOVER_LOT_GATE_W && gateE.openH === LEFTOVER_LOT_FENCE_H
    && geomE.gateZ === LEFTOVER_LOT_E_Z0 && geomE.gateZ === geomE.z0);
  ok('lot F vehicle gate is open',
    !!gateF && !probeBlocked(shapes, gateF.x, gateF.y, gateF.z, gateF.probe)
    && gateF.openW === LEFTOVER_LOT_GATE_W && gateF.openH === LEFTOVER_LOT_FENCE_H
    && geomF.gateZ === LEFTOVER_LOT_F_Z0 && geomF.gateZ === geomF.z0);
  ok('lot G vehicle gate is open',
    !!gateG && !probeBlocked(shapes, gateG.x, gateG.y, gateG.z, gateG.probe)
    && gateG.openW === LEFTOVER_LOT_GATE_W && gateG.openH === LEFTOVER_LOT_FENCE_H
    && geomG.gateZ === LEFTOVER_LOT_G_Z0 && geomG.gateZ === geomG.z0);
  ok('lot H vehicle gate is open',
    !!gateH && !probeBlocked(shapes, gateH.x, gateH.y, gateH.z, gateH.probe)
    && gateH.openW === LEFTOVER_LOT_GATE_W && gateH.openH === LEFTOVER_LOT_FENCE_H
    && geomH.gateZ === LEFTOVER_LOT_H_Z0 && geomH.gateZ === geomH.z0);
  ok('mesh plane is thin', LEFTOVER_LOT_MESH_T < 0.12 && LEFTOVER_LOT_POST < 0.16);
  ok('jamb thinner than the vehicle gate',
    LEFTOVER_LOT_JAMB < LEFTOVER_LOT_GATE_W - 0.5
    && LEFTOVER_LOT_JAMB < LEFTOVER_LOT_FENCE_H - 0.5);

  const gateJamb = probeBlocked(
    shapes,
    gate.x - LEFTOVER_LOT_GATE_W / 2 - LEFTOVER_LOT_JAMB * 0.45,
    gate.y,
    gate.z,
    0.03,
  );
  ok('vehicle-gate jamb exists beside the opening', !!gateJamb);

  const dumpHit = probeBlocked(shapes, geom.dumpX, CITY_Y + geom.dumpH * 0.45, geom.dumpZ, 0.08);
  ok('dumpster collider exists', !!dumpHit);
  ok('dumpster is not in the gate',
    !inLeftoverLotGate(geom.dumpX, geom.dumpZ)
    && (Math.abs(geom.dumpZ - geom.gateZ) > 1.2
      || geom.dumpX < geom.gateLeft - 0.4
      || geom.dumpX > geom.gateRight + 0.4));
  ok('dumpster sits against the east fence',
    Math.abs((geom.dumpX + geom.dumpW / 2) - geom.x1) < 0.45);
  ok('dumpster collider is ⊆ dumpster visual',
    dumpHit.sx <= geom.dumpW + 0.15 && dumpHit.sz <= geom.dumpD + 0.15);
  const dumpHitD = probeBlocked(shapes, geomD.dumpX, CITY_Y + geomD.dumpH * 0.45, geomD.dumpZ, 0.08);
  ok('lot D dumpster collider exists', !!dumpHitD);
  ok('lot D dumpster collider is ⊆ dumpster visual',
    dumpHitD && dumpHitD.sx <= geomD.dumpW + 0.15 && dumpHitD.sz <= geomD.dumpD + 0.15);
  const dumpHitE = probeBlocked(shapes, geomE.dumpX, CITY_Y + geomE.dumpH * 0.45, geomE.dumpZ, 0.08);
  ok('lot E dumpster collider exists', !!dumpHitE);
  ok('lot E dumpster collider is ⊆ dumpster visual',
    dumpHitE && dumpHitE.sx <= geomE.dumpW + 0.15 && dumpHitE.sz <= geomE.dumpD + 0.15);
  const dumpHitF = probeBlocked(shapes, geomF.dumpX, CITY_Y + geomF.dumpH * 0.45, geomF.dumpZ, 0.08);
  ok('lot F dumpster collider exists', !!dumpHitF);
  ok('lot F dumpster collider is ⊆ dumpster visual',
    dumpHitF && dumpHitF.sx <= geomF.dumpW + 0.15 && dumpHitF.sz <= geomF.dumpD + 0.15);
  const dumpHitG = probeBlocked(shapes, geomG.dumpX, CITY_Y + geomG.dumpH * 0.45, geomG.dumpZ, 0.08);
  ok('lot G dumpster collider exists', !!dumpHitG);
  ok('lot G dumpster collider is ⊆ dumpster visual',
    dumpHitG && dumpHitG.sx <= geomG.dumpW + 0.15 && dumpHitG.sz <= geomG.dumpD + 0.15);
  const dumpHitH = probeBlocked(shapes, geomH.dumpX, CITY_Y + geomH.dumpH * 0.45, geomH.dumpZ, 0.08);
  ok('lot H dumpster collider exists', !!dumpHitH);
  ok('lot H dumpster collider is ⊆ dumpster visual',
    dumpHitH && dumpHitH.sx <= geomH.dumpW + 0.15 && dumpHitH.sz <= geomH.dumpD + 0.15);

  const shedMid = probeBlocked(shapes, geom.shedX, CITY_Y + 1.0, geom.shedZ, 0.16);
  ok('shed interior is not a filled box', !shedMid);

  // ---- palms / weeds grow-to-gap, lean at the fence, drop the gate -------
  ok('palms grow-to-gap inside the lot',
    plants.palms.length >= 2
    && plants.palms.every((p) => p.x > LEFTOVER_LOT_X0 && p.x < LEFTOVER_LOT_X1
      && p.z > LEFTOVER_LOT_Z0 && p.z < LEFTOVER_LOT_Z1
      && !onPavement(p.x, p.z) && !inLeftoverLotGate(p.x, p.z)));
  ok('palms lean at the fence',
    plants.palms.every((p) => Math.abs(p.lean) > 0.05
      && Math.min(p.x - LEFTOVER_LOT_X0, LEFTOVER_LOT_X1 - p.x,
        p.z - LEFTOVER_LOT_Z0, LEFTOVER_LOT_Z1 - p.z) < 1.4));
  ok('weeds grow-to-gap inside the lot',
    plants.weeds.length >= 8
    && plants.weeds.every((p) => !onPavement(p.x, p.z) && !inLeftoverLotGate(p.x, p.z, 0.35)));
  ok('gate void drops plants',
    inLeftoverLotGate(geom.gateX, geom.gateZ)
    && plants.weeds.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2))
    && plants.palms.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)));
  ok('lot B palms grow-to-gap inside the lot',
    plantsB.palms.length >= 2
    && plantsB.palms.every((p) => p.x > LEFTOVER_LOT_B_X0 && p.x < LEFTOVER_LOT_B_X1
      && p.z > LEFTOVER_LOT_B_Z0 && p.z < LEFTOVER_LOT_B_Z1
      && !onPavement(p.x, p.z) && !inLeftoverLotGate(p.x, p.z)));
  ok('lot B gate void drops plants',
    inLeftoverLotGate(geomB.gateX, geomB.gateZ)
    && plantsB.weeds.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2))
    && plantsB.palms.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)));
  ok('lot C palms grow-to-gap inside the lot',
    plantsC.palms.length >= 2
    && plantsC.palms.every((p) => p.x > LEFTOVER_LOT_C_X0 && p.x < LEFTOVER_LOT_C_X1
      && p.z > LEFTOVER_LOT_C_Z0 && p.z < LEFTOVER_LOT_C_Z1
      && !onPavement(p.x, p.z) && !onBoardwalk(p.x, p.z)
      && !onSidewalk(p.x, p.z) && !onCrossStreet(p.x, p.z)
      && !inLeftoverLotGate(p.x, p.z)));
  ok('lot C gate void drops plants',
    inLeftoverLotGate(geomC.gateX, geomC.gateZ)
    && plantsC.weeds.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)
      && !onPavement(p.x, p.z) && !onSidewalk(p.x, p.z))
    && plantsC.palms.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)));
  ok('lot D palms grow-to-gap inside the lot',
    plantsD.palms.length >= 2
    && plantsD.palms.every((p) => p.x > LEFTOVER_LOT_D_X0 && p.x < LEFTOVER_LOT_D_X1
      && p.z > LEFTOVER_LOT_D_Z0 && p.z < LEFTOVER_LOT_D_Z1
      && !onPavement(p.x, p.z) && !onBoardwalk(p.x, p.z)
      && !onSidewalk(p.x, p.z) && !onCrossStreet(p.x, p.z)
      && !inLeftoverLotGate(p.x, p.z)));
  ok('lot D gate void drops plants',
    inLeftoverLotGate(geomD.gateX, geomD.gateZ)
    && plantsD.weeds.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)
      && !onPavement(p.x, p.z) && !onSidewalk(p.x, p.z) && !onBoardwalk(p.x, p.z))
    && plantsD.palms.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)));
  ok('lot E palms grow-to-gap inside the lot',
    plantsE.palms.length >= 2
    && plantsE.palms.every((p) => p.x > LEFTOVER_LOT_E_X0 && p.x < LEFTOVER_LOT_E_X1
      && p.z > LEFTOVER_LOT_E_Z0 && p.z < LEFTOVER_LOT_E_Z1
      && !onPavement(p.x, p.z) && !onBoardwalk(p.x, p.z)
      && !onSidewalk(p.x, p.z) && !onCrossStreet(p.x, p.z)
      && !inLeftoverLotGate(p.x, p.z)));
  ok('lot E gate void drops plants',
    inLeftoverLotGate(geomE.gateX, geomE.gateZ)
    && plantsE.weeds.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)
      && !onPavement(p.x, p.z) && !onSidewalk(p.x, p.z) && !onBoardwalk(p.x, p.z))
    && plantsE.palms.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)));
  ok('lot F palms grow-to-gap inside the lot',
    plantsF.palms.length >= 2
    && plantsF.palms.every((p) => p.x > LEFTOVER_LOT_F_X0 && p.x < LEFTOVER_LOT_F_X1
      && p.z > LEFTOVER_LOT_F_Z0 && p.z < LEFTOVER_LOT_F_Z1
      && !onPavement(p.x, p.z) && !onBoardwalk(p.x, p.z)
      && !onSidewalk(p.x, p.z) && !onCrossStreet(p.x, p.z)
      && !inLeftoverLotGate(p.x, p.z)));
  ok('lot F gate void drops plants',
    inLeftoverLotGate(geomF.gateX, geomF.gateZ)
    && plantsF.weeds.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)
      && !onPavement(p.x, p.z) && !onSidewalk(p.x, p.z) && !onBoardwalk(p.x, p.z))
    && plantsF.palms.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)));
  ok('lot G palms grow-to-gap inside the lot',
    plantsG.palms.length >= 2
    && plantsG.palms.every((p) => p.x > LEFTOVER_LOT_G_X0 && p.x < LEFTOVER_LOT_G_X1
      && p.z > LEFTOVER_LOT_G_Z0 && p.z < LEFTOVER_LOT_G_Z1
      && !onPavement(p.x, p.z) && !onBoardwalk(p.x, p.z)
      && !onSidewalk(p.x, p.z) && !onCrossStreet(p.x, p.z)
      && !inLeftoverLotGate(p.x, p.z)));
  ok('lot G gate void drops plants',
    inLeftoverLotGate(geomG.gateX, geomG.gateZ)
    && plantsG.weeds.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)
      && !onPavement(p.x, p.z) && !onSidewalk(p.x, p.z) && !onBoardwalk(p.x, p.z))
    && plantsG.palms.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)));
  ok('lot H palms grow-to-gap inside the lot',
    plantsH.palms.length >= 2
    && plantsH.palms.every((p) => p.x > LEFTOVER_LOT_H_X0 && p.x < LEFTOVER_LOT_H_X1
      && p.z > LEFTOVER_LOT_H_Z0 && p.z < LEFTOVER_LOT_H_Z1
      && !onPavement(p.x, p.z) && !onBoardwalk(p.x, p.z)
      && !onSidewalk(p.x, p.z) && !onCrossStreet(p.x, p.z)
      && !inLeftoverLotGate(p.x, p.z)));
  ok('lot H gate void drops plants',
    inLeftoverLotGate(geomH.gateX, geomH.gateZ)
    && plantsH.weeds.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)
      && !onPavement(p.x, p.z) && !onSidewalk(p.x, p.z) && !onBoardwalk(p.x, p.z))
    && plantsH.palms.every((p) => !inLeftoverLotGate(p.x, p.z, 0.2)));

  ok('hotel-crown flags miss leftoverLot A–H',
    HOTEL_FLAG_CELLS.length === 9
    && HOTEL_FLAG_CELLS.every(([x, z]) => x < 240
      && leftoverLotOverlap(x, z, 0.2, 1.8, 0.15) === false)
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('extra court wells miss leftoverLot A–H',
    COURT_WELL_CELLS.length === 23
    && COURT_WELL_CELLS.every(([x, z]) => x < 240 && x < 251
      && leftoverLotOverlap(x, z, 6.2, 6.2, 0.15) === false)
    && COURT_WELL_CELLS.some(([x, z]) => x === -390 && z === 152)
    && COURT_WELL_CELLS.some(([x, z]) => x === 210 && z === 210)
    && COURT_WELL_CELLS.some(([x, z]) => x === -390 && z === 96)
    && COURT_WELL_CELLS.some(([x, z]) => x === -250 && z === 96)
    && COURT_WELL_CELLS.some(([x, z]) => x === -160 && z === 210)
    && COURT_WELL_CELLS.some(([x, z]) => x === -720 && z === 128)
    && COURT_WELL_CELLS.some(([x, z]) => x === -190 && z === 128)
    && !COURT_WELL_CELLS.some(([x, z]) => x === 210 && z === 96)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 210 && z === 96)
    && leftoverLotOverlap(210, 96, 6.2, 6.2, 0.15) === false
    && leftoverLotOverlap(-160, 210, 6.2, 6.2, 0.15) === false
    && leftoverLotOverlap(-720, 128, 6.2, 6.2, 0.15) === false
    && leftoverLotOverlap(-190, 128, 6.2, 6.2, 0.15) === false
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('east z=96 court well skipped — arcade occupies the plate',
    INLAND_ARCADE_CELLS.some(([x, z]) => x === 210 && z === 96)
    && !COURT_WELL_CELLS.some(([x, z]) => x === 210 && z === 96)
    && leftoverLotOverlap(210, 96, 18, 14, 0.15) === false
    && 210 < 240 && 210 < 251
    && !FLY_VOIDS.some((v) => String(v.id).startsWith('court-well-') && v.x === 210 && v.z === 96)
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('extra roof rings miss leftoverLot A–H',
    leftoverLotOverlap(-600, 259, 0.8, 2.4, 0.15) === false
    && leftoverLotOverlap(-540, 210, 0.8, 2.4, 0.15) === false
    && leftoverLotOverlap(-80, 210, 0.8, 2.4, 0.15) === false
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('z=96 roof AC gaps miss leftoverLot A–H',
    leftoverLotOverlap(-600, 96, 4, 2, 0.15) === false
    && leftoverLotOverlap(-540, 96, 4, 2, 0.15) === false
    && leftoverLotOverlap(-190, 96, 4, 2, 0.15) === false
    && leftoverLotOverlap(210, 96, 4, 2, 0.15) === false
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('mid-rise sidewalks miss leftoverLot A–H',
    leftoverLotOverlap(-80, 143.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(90, 160.4, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-250, 201.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(210, 218.4, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-40, 201.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(0, 201.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(40, 201.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-40, 218.4, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(0, 218.4, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(40, 218.4, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-50, 201.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(50, 218.4, 0.6, 0.6, 0.15) === false
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('inland z=210/152/96/128 arcades miss leftoverLot A–H',
    INLAND_ARCADE_CELLS.length === 84
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 210).length === 18
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 152).length === 12
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 96).length === 13
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 237).length === 24
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 259).length === 1
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 196).length === 5
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 128).length === 11
    && INLAND_ARCADE_CELLS.every(([x, z]) => x < 240
      && (z === 210 || z === 152 || z === 96 || z === 237 || z === 259 || z === 196 || z === 128)
      && leftoverLotOverlap(x, z, 18, 14, 0.15) === false)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -600 && z === 152)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -660 && z === 152)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -660 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -720 && z === 196)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -540 && z === 196)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -660 && z === 259)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -600 && z === 96)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -190 && z === 96)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 210 && z === 96)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -540 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -390 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -190 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -660 && z === 128)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -540 && z === 128)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -390 && z === 128)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -720 && z === 96)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -720 && z === 210)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -720 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -160 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 130 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 190 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -40 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 40 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 210 && z === 128)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -600 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 130 && z === 210)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -40 && z === 210)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -480 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 0 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 80 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 0 && z === 210)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -160 && z === 96)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 0 && z === 210)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 80 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -220 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -220 && z === 210)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -350 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -280 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -455 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -455 && z === 210)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -410 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -410 && z === 210)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -370 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -690 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -630 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -570 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -690 && z === 210)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -630 && z === 196)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -570 && z === 96)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -370 && z === 210)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -370 && z === 96)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -370 && z === 128)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -370 && z === 152)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -350 && z === 210)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -280 && z === 210)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -350 && z === 96)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -350 && z === 128)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -350 && z === 152)
    && leftoverLotOverlap(-540, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-390, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-190, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-40, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(40, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(0, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(0, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(80, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(80, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-220, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-220, 96, 18, 14, 0.15) === false
    && leftoverLotOverlap(-220, 128, 18, 14, 0.15) === false
    && leftoverLotOverlap(-220, 152, 18, 14, 0.15) === false
    && leftoverLotOverlap(110, 152, 18, 14, 0.15) === false
    && leftoverLotOverlap(-220, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-220, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-220, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(-350, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-350, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-350, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-280, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-280, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-280, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-455, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-455, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-455, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-410, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-410, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-410, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-370, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-370, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-370, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-690, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-690, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-690, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-630, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-630, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-630, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-570, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-570, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-570, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-720, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-600, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-720, 140, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-660, 140, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-600, 140, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-540, 140, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-690, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(-630, 196, 18, 14, 0.15) === false
    && leftoverLotOverlap(-570, 152, 18, 14, 0.15) === false
    && leftoverLotOverlap(-690, 128, 18, 14, 0.15) === false
    && leftoverLotOverlap(-570, 96, 18, 14, 0.15) === false
    && leftoverLotOverlap(-690, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-630, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-570, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-370, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(-370, 96, 18, 14, 0.15) === false
    && leftoverLotOverlap(-370, 128, 18, 14, 0.15) === false
    && leftoverLotOverlap(-370, 152, 18, 14, 0.15) === false
    && leftoverLotOverlap(-410, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(-410, 152, 18, 14, 0.15) === false
    && leftoverLotOverlap(-455, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(-455, 152, 18, 14, 0.15) === false
    && leftoverLotOverlap(-350, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(-280, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(-350, 96, 18, 14, 0.15) === false
    && leftoverLotOverlap(-350, 128, 18, 14, 0.15) === false
    && leftoverLotOverlap(-350, 152, 18, 14, 0.15) === false
    && leftoverLotOverlap(-280, 96, 18, 14, 0.15) === false
    && leftoverLotOverlap(-280, 128, 18, 14, 0.15) === false
    && leftoverLotOverlap(-280, 152, 18, 14, 0.15) === false
    && leftoverLotOverlap(-40, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(40, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(0, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(80, 248, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-660, 128, 18, 14, 0.15) === false
    && leftoverLotOverlap(-540, 128, 18, 14, 0.15) === false
    && leftoverLotOverlap(-390, 128, 18, 14, 0.15) === false
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('z=210 arcade sitters miss leftoverLot A–H',
    leftoverLotOverlap(-540, 210, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(-455, 210, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(-370, 210, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(-410, 210, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(-250, 210, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(-350, 210, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(-280, 210, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(-220, 210, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(-80, 210, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(90, 210, 4.4, 14, 0.15) === false
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('z=96 arcade sitters miss leftoverLot A–H',
    leftoverLotOverlap(-600, 96, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(-540, 96, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(-370, 96, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(-350, 96, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(-190, 96, 4.4, 14, 0.15) === false
    && leftoverLotOverlap(210, 96, 4.4, 14, 0.15) === false
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('z=181 alley pipes miss leftoverLot A–H',
    leftoverLotOverlap(-600, 181, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-540, 181, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-720, 181, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-660, 181, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-690, 181, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-630, 181, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-570, 181, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-720, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-660, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-540, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-455, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-410, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-370, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-350, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-390, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-220, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-190, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-160, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-480, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-110, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-40, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(0, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(40, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(80, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(130, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(160, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(190, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(210, 223, 2.4, 2.6, 0.15) === false
    && leftoverLotOverlap(-280, 223, 2.4, 2.6, 0.15) === false
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('x=-660 inland mid-rise pair misses leftoverLot A–H',
    leftoverLotOverlap(-660, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-660, 259, 18, 14, 0.15) === false
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -660 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -660 && z === 259)
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('z=237 skyline ocean sidewalks miss leftoverLot A–H',
    leftoverLotOverlap(-720, 228.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-430, 228.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-80, 228.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(210, 228.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(0, 228.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(80, 228.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-730, 228.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(230, 228.6, 0.6, 0.6, 0.15) === false
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('z=196 sidewalks miss leftoverLot A–H',
    leftoverLotOverlap(-720, 187.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-660, 204.4, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-600, 187.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-540, 204.4, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-730, 187.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-508, 204.4, 0.6, 0.6, 0.15) === false
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('z=196 inland mid-rise row misses leftoverLot A–H',
    INLAND_MIDRISE_CELLS.filter(([, z]) => z === 196).length === 7
    && INLAND_MIDRISE_CELLS.filter(([, z]) => z === 196).every(([x]) => x < 240 && x < 251
      && x < -480
      && leftoverLotOverlap(x, 196, 18, 14, 0.15) === false)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -720 && z === 196)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -540 && z === 196)
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('z=128 inland mid-rise row misses leftoverLot A–H',
    INLAND_MIDRISE_CELLS.filter(([, z]) => z === 128).length === 14
    && INLAND_MIDRISE_CELLS.filter(([, z]) => z === 128).every(([x]) => x < 240 && x < 251
      && leftoverLotOverlap(x, 128, 18, 14, 0.15) === false)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -720 && z === 128)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -350 && z === 128)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -370 && z === 128)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -190 && z === 128)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === 210 && z === 128)
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('x=-720 skyline pair misses leftoverLot A–H and stays on the city plate',
    leftoverLotOverlap(-720, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-720, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-720, 248, 1.2, 1.0, 0.15) === false
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -720 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -720 && z === 259)
    && (-720 - 18 / 2) > -750
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('z=210 east mid-rises at x=130/190 miss leftoverLot A–H',
    INLAND_MIDRISE_CELLS.some(([x, z]) => x === 130 && z === 210)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === 190 && z === 210)
    && leftoverLotOverlap(130, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(190, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(-40, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(40, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(0, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(-480, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(-480, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-160, 96, 18, 14, 0.15) === false
    && leftoverLotOverlap(0, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(80, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(80, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-720, 228.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(100, 228.6, 0.6, 0.6, 0.15) === false
    && 130 < 240 && 190 < 240 && 190 + 18 / 2 + 0.8 < 240
    && 190 < 251
    && INLAND_MIDRISE_CELLS.filter(([, z]) => z === 210).length === 28
    && INLAND_MIDRISE_CELLS.filter(([, z]) => z === 210).every(([x]) => x < 240 && x < 251
      && leftoverLotOverlap(x, 210, 18, 14, 0.15) === false)
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('z=152/210/skyline density fill misses leftoverLot A–H',
    leftoverLotOverlap(-660, 152, 18, 14, 0.15) === false
    && leftoverLotOverlap(-160, 152, 18, 14, 0.15) === false
    && leftoverLotOverlap(130, 152, 18, 14, 0.15) === false
    && leftoverLotOverlap(190, 152, 18, 14, 0.15) === false
    && leftoverLotOverlap(-660, 210, 18, 14, 0.15) === false
    && leftoverLotOverlap(-540, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(210, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(210, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(-40, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(40, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(0, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(0, 259, 18, 14, 0.15) === false
    && leftoverLotOverlap(80, 237, 18, 14, 0.15) === false
    && leftoverLotOverlap(80, 259, 18, 14, 0.15) === false
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -160 && z === 152)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === 210 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -40 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === 40 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === 0 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === 0 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === 80 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === 80 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -220 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -220 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -220 && z === 210)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -350 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -350 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -280 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -280 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -455 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -455 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -455 && z === 210)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -410 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -410 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -410 && z === 210)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -370 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -370 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -690 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -690 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -630 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -630 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -570 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -570 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -690 && z === 210)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -630 && z === 196)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -570 && z === 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -370 && z === 210)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -370 && z === 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -370 && z === 128)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -370 && z === 152)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -350 && z === 210)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -280 && z === 210)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -350 && z === 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -350 && z === 128)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -350 && z === 152)
    && INLAND_MIDRISE_CELLS.every(([x, z]) => x < 240 && x < 251
      && leftoverLotOverlap(x, z, 18, 14, 0.15) === false)
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('garage-mouth standers miss leftoverLot A–H',
    GARAGE_STAND_CELLS.length === 8
    && GARAGE_STAND_CELLS.every(([x, z]) => x < 240 && x < 251
      && leftoverLotOverlap(x, z, 0.6, 0.6, 0.15) === false
      && z > 47.8)
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('z=96 inland mid-rise row misses leftoverLot A–H',
    INLAND_MIDRISE_CELLS.filter(([, z]) => z === 96).length === 16
    && INLAND_MIDRISE_CELLS.filter(([, z]) => z === 96).every(([x]) => x < 240 && x < 251
      && leftoverLotOverlap(x, 96, 18, 14, 0.15) === false)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -720 && z === 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -160 && z === 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -660 && z === 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -600 && z === 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -350 && z === 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -370 && z === 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -190 && z === 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === 210 && z === 96)
    && !INLAND_MIDRISE_CELLS.some(([x, z]) => x === 90 && z === 96)
    && !INLAND_MIDRISE_CELLS.some(([x, z]) => x === 100 && z === 96)
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('z=96 at x=90/100 skipped — graze Casa reserved, leftoverLot A–H unmoved',
    !INLAND_MIDRISE_CELLS.some(([x, z]) => x === 90 && z === 96)
    && !INLAND_MIDRISE_CELLS.some(([x, z]) => x === 100 && z === 96)
    && reservedOverlap(90, 96, 18, 14, 0.15)
    && reservedOverlap(100, 96, 18, 14, 0.15)
    && leftoverLotOverlap(90, 96, 18, 14, 0.15) === false
    && leftoverLotOverlap(100, 96, 18, 14, 0.15) === false
    && 90 < 240 && 100 < 240 && 90 < 251 && 100 < 251
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('z=96 sidewalks miss leftoverLot A–H',
    leftoverLotOverlap(-600, 87.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-540, 104.4, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-370, 87.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-370, 104.4, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-350, 87.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-390, 87.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-250, 104.4, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-190, 87.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(-190, 104.4, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(210, 87.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(210, 104.4, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(201, 87.6, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(216, 104.4, 0.6, 0.6, 0.15) === false
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('Majestic/Cavalier porch arcades miss leftoverLot A–H',
    MAJESTIC_SOFFIT === 3.5 && CAVALIER_SOFFIT === 3.5
    && leftoverLotOverlap(MAJESTIC_X, MAJESTIC_FRONT_Z - 1.7, MAJESTIC_W, 3.4, 0.15) === false
    && leftoverLotOverlap(CAVALIER_X, CAVALIER_FRONT_Z - 1.7, CAVALIER_W, 3.4, 0.15) === false
    && MAJESTIC_X + MAJESTIC_W / 2 + 1.2 < 240
    && CAVALIER_X + CAVALIER_W / 2 + 1.2 < 240
    && FLY_VOIDS.some((v) => v.id === 'majestic-arcade')
    && FLY_VOIDS.some((v) => v.id === 'cavalier-arcade')
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('garage-mouth misses leftoverLot A–H',
    leftoverLotOverlap(GARAGE_X, GARAGE_FRONT_Z + GARAGE_D / 2, GARAGE_W, GARAGE_D, 0.15) === false
    && GARAGE_X + GARAGE_W / 2 + 0.8 < 240
    && GARAGE_X + GARAGE_W / 2 + 0.8 < 251
    && FLY_VOIDS.some((v) => v.id === 'garage-mouth')
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('Winterhaven/Breakwater porch arcades miss leftoverLot A–H',
    WINTERHAVEN_SOFFIT === 3.5 && BREAKWATER_SOFFIT === 3.5
    && leftoverLotOverlap(WINTERHAVEN_X, WINTERHAVEN_FRONT_Z - 1.7, WINTERHAVEN_W, 3.4, 0.15) === false
    && leftoverLotOverlap(BREAKWATER_X, BREAKWATER_FRONT_Z - 1.7, BREAKWATER_W, 3.4, 0.15) === false
    && WINTERHAVEN_X + WINTERHAVEN_W / 2 + 1.2 < 240
    && WINTERHAVEN_X + WINTERHAVEN_W / 2 + 1.2 < 251
    && BREAKWATER_X + BREAKWATER_W / 2 + 1.2 < 240
    && FLY_VOIDS.some((v) => v.id === 'winterhaven-arcade')
    && FLY_VOIDS.some((v) => v.id === 'breakwater-arcade')
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);
  ok('hotel porch sitters miss leftoverLot A–H',
    HOTEL_PORCH_CELLS.length === 4
    && HOTEL_PORCH_CELLS.every(([x, z, w]) => x < 240 && x < 251
      && leftoverLotOverlap(x, z, w, 3.4, 0.15) === false
      && x + w / 2 + 1.2 < 240)
    && HOTEL_PORCH_CELLS.some(([x]) => x === MAJESTIC_X)
    && HOTEL_PORCH_CELLS.some(([x]) => x === CAVALIER_X)
    && HOTEL_PORCH_CELLS.some(([x]) => x === BREAKWATER_X)
    && HOTEL_PORCH_CELLS.some(([x]) => x === WINTERHAVEN_X)
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);

  // ---- one placer; no second scatterer; look locks -----------------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const leftover = readFileSync(join(here, 'landmarks/leftoverLot.js'), 'utf8');
  const constants = readFileSync(join(here, 'constants.js'), 'utf8');
  const buildings = readFileSync(join(here, 'buildings.js'), 'utf8');
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
  ok('leftoverLot is not a second scatterer',
    !leftover.includes('scatterModels') && !leftover.includes('planDirtBlades'));
  ok('leftoverLot does not invent a placer',
    !/export function tryPlace/.test(leftover)
    && leftover.includes('tryPlace')
    && leftover.includes('onPavement'));
  ok('leftoverLot rejects pavement instead of remapping',
    leftover.includes('if (onPavement(LEFTOVER_LOT_X, LEFTOVER_LOT_Z)) return null;')
    && leftover.includes('onPavement(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z)')
    && leftover.includes('onPavement(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)')
    && leftover.includes('onPavement(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z)')
    && leftover.includes('onPavement(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z)')
    && leftover.includes('onPavement(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z)')
    && leftover.includes('onPavement(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z)')
    && leftover.includes('onPavement(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z)')
    && !/LEFTOVER_LOT_X\s*=/.test(leftover));
  ok('lot B reuses leftoverLotGeom, no leftoverLotBGeom fork',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z)')
    && leftover.includes('leftoverLotPlantSpots')
    && leftover.includes('leftoverLotGeom()')
    && !/function leftoverLotBGeom/.test(leftover)
    && !/leftoverLotBGeom\(/.test(leftover)
    && constants.includes('export function leftoverLotGeom')
    && !/export function leftoverLotBGeom/.test(constants)
    && !/leftoverLotBGeom\(/.test(constants));
  ok('lot C reuses leftoverLotGeom, no leftoverLotCGeom fork',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)')
    && leftover.includes('leftoverLotPlantSpots')
    && leftover.includes('leftoverLotGeom()')
    && leftover.includes('LEFTOVER_LOT_B_X')
    && !/function leftoverLotCGeom/.test(leftover)
    && !/leftoverLotCGeom\(/.test(leftover)
    && constants.includes('export function leftoverLotGeom')
    && constants.includes('313/84')
    && !/export function leftoverLotCGeom/.test(constants)
    && !/leftoverLotCGeom\(/.test(constants));
  ok('lot D reuses leftoverLotGeom, no leftoverLotDGeom fork',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z)')
    && leftover.includes('leftoverLotPlantSpots')
    && leftover.includes('leftoverLotGeom()')
    && leftover.includes('LEFTOVER_LOT_C_X')
    && leftover.includes('LEFTOVER_LOT_B_X')
    && !/function leftoverLotDGeom/.test(leftover)
    && !/leftoverLotDGeom\(/.test(leftover)
    && constants.includes('export function leftoverLotGeom')
    && constants.includes('330/84')
    && !/export function leftoverLotDGeom/.test(constants)
    && !/leftoverLotDGeom\(/.test(constants));
  ok('lot E reuses leftoverLotGeom, no leftoverLotEGeom fork',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z)')
    && leftover.includes('leftoverLotPlantSpots')
    && leftover.includes('leftoverLotGeom()')
    && leftover.includes('LEFTOVER_LOT_D_X')
    && leftover.includes('LEFTOVER_LOT_C_X')
    && leftover.includes('LEFTOVER_LOT_B_X')
    && leftover.includes('347/84')
    && leftover.includes('leftoverLotEGeom fork')
    && leftover.includes('not a slide of A–D')
    && !/function leftoverLotEGeom/.test(leftover)
    && !/leftoverLotEGeom\(/.test(leftover)
    && constants.includes('export function leftoverLotGeom')
    && constants.includes('347/84')
    && !/export function leftoverLotEGeom/.test(constants)
    && !/leftoverLotEGeom\(/.test(constants)
    && !leftover.includes('leftoverLotE.js'));
  ok('lot F reuses leftoverLotGeom, no leftoverLotFGeom fork',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z)')
    && leftover.includes('leftoverLotPlantSpots')
    && leftover.includes('leftoverLotGeom()')
    && leftover.includes('LEFTOVER_LOT_E_X')
    && leftover.includes('LEFTOVER_LOT_D_X')
    && leftover.includes('LEFTOVER_LOT_C_X')
    && leftover.includes('LEFTOVER_LOT_B_X')
    && leftover.includes('364/84')
    && leftover.includes('leftoverLotFGeom fork')
    && leftover.includes('not a slide of A–E')
    && !/function leftoverLotFGeom/.test(leftover)
    && !/leftoverLotFGeom\(/.test(leftover)
    && constants.includes('export function leftoverLotGeom')
    && constants.includes('364/84')
    && constants.includes('LEFTOVER_LOT_F_X = 364')
    && constants.includes('LEFTOVER_LOT_F_Z = 84')
    && constants.includes('LEFTOVER_LOT_F_W = 14')
    && constants.includes('LEFTOVER_LOT_F_D = 12')
    && constants.includes('LEFTOVER_LOT_F_X0 = 357')
    && constants.includes('LEFTOVER_LOT_F_X1 = 371')
    && constants.includes('LEFTOVER_LOT_F_Z0 = 78')
    && constants.includes('LEFTOVER_LOT_F_Z1 = 90')
    && !/export function leftoverLotFGeom/.test(constants)
    && !/leftoverLotFGeom\(/.test(constants)
    && !leftover.includes('leftoverLotF.js'));
  ok('lot G reuses leftoverLotGeom, no leftoverLotGGeom fork',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z)')
    && leftover.includes('leftoverLotPlantSpots')
    && leftover.includes('leftoverLotGeom()')
    && leftover.includes('LEFTOVER_LOT_F_X')
    && leftover.includes('LEFTOVER_LOT_E_X')
    && leftover.includes('LEFTOVER_LOT_D_X')
    && leftover.includes('LEFTOVER_LOT_C_X')
    && leftover.includes('LEFTOVER_LOT_B_X')
    && leftover.includes('381/84')
    && leftover.includes('leftoverLotGGeom fork')
    && leftover.includes('not a slide of A–F')
    && leftover.includes('signed 381/96 hull')
    && leftover.includes('1 m leftover apron')
    && leftover.includes('G-park is now the signed')
    && !leftover.includes('G-park waits')
    && !leftover.includes('POCKET_PARK_G')
    && !/function leftoverLotGGeom/.test(leftover)
    && !/leftoverLotGGeom\(/.test(leftover)
    && constants.includes('export function leftoverLotGeom')
    && constants.includes('381/84')
    && constants.includes('LEFTOVER_LOT_G_X = 381')
    && constants.includes('LEFTOVER_LOT_G_Z = 84')
    && constants.includes('LEFTOVER_LOT_G_W = 14')
    && constants.includes('LEFTOVER_LOT_G_D = 12')
    && constants.includes('LEFTOVER_LOT_G_X0 = 374')
    && constants.includes('LEFTOVER_LOT_G_X1 = 388')
    && constants.includes('LEFTOVER_LOT_G_Z0 = 78')
    && constants.includes('LEFTOVER_LOT_G_Z1 = 90')
    && constants.includes('1.2 m off')
    && constants.includes('372.8')
    && constants.includes('2 m east of F-park x1=372')
    && constants.includes('G-park is now the signed 381/96 hull')
    && !/export function leftoverLotGGeom/.test(constants)
    && !/leftoverLotGGeom\(/.test(constants)
    && !/export function leftoverLotDirtGeom/.test(constants)
    && !/leftoverLotDirtGeom\(/.test(constants)
    && !leftover.includes('leftoverLotG.js')
    && !leftover.includes('leftoverLotDirtGeom(')
    && !constants.includes('photo-mode')
    && !constants.includes('ACES')
    && !constants.includes('SSAO')
    && !constants.includes('Shackleton')
    && !constants.includes('colony HUD'));
  ok('lot H reuses leftoverLotGeom, no leftoverLotHGeom fork',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z)')
    && leftover.includes('leftoverLotPlantSpots')
    && leftover.includes('leftoverLotGeom()')
    && leftover.includes('LEFTOVER_LOT_G_X')
    && leftover.includes('LEFTOVER_LOT_F_X')
    && leftover.includes('LEFTOVER_LOT_E_X')
    && leftover.includes('LEFTOVER_LOT_D_X')
    && leftover.includes('LEFTOVER_LOT_C_X')
    && leftover.includes('LEFTOVER_LOT_B_X')
    && leftover.includes('398/84')
    && leftover.includes('leftoverLotHGeom fork')
    && leftover.includes('not a slide of A–G')
    && leftover.includes('signed 398/96 hull')
    && leftover.includes('1 m leftover apron')
    && leftover.includes('H-park is now the signed')
    && !leftover.includes('H-park waits')
    && !leftover.includes('POCKET_PARK_H')
    && !/function leftoverLotHGeom/.test(leftover)
    && !/leftoverLotHGeom\(/.test(leftover)
    && constants.includes('export function leftoverLotGeom')
    && constants.includes('398/84')
    && constants.includes('LEFTOVER_LOT_H_X = 398')
    && constants.includes('LEFTOVER_LOT_H_Z = 84')
    && constants.includes('LEFTOVER_LOT_H_W = 14')
    && constants.includes('LEFTOVER_LOT_H_D = 12')
    && constants.includes('LEFTOVER_LOT_H_X0 = 391')
    && constants.includes('LEFTOVER_LOT_H_X1 = 405')
    && constants.includes('LEFTOVER_LOT_H_Z0 = 78')
    && constants.includes('LEFTOVER_LOT_H_Z1 = 90')
    && constants.includes('1.2 m off')
    && constants.includes('389.8')
    && constants.includes('2 m east of G-park x1=389')
    && constants.includes('Do NOT merge with G-park 389')
    && constants.includes('H-park is now the signed 398/96 hull')
    && constants.includes('H is G+17 m')
    && constants.includes('LEFTOVER_LOT_G_X = 381')
    && constants.includes('LEFTOVER_LOT_G_X1 = 388')
    && !/export function leftoverLotHGeom/.test(constants)
    && !/leftoverLotHGeom\(/.test(constants)
    && !/export function leftoverLotDirtGeom/.test(constants)
    && !/leftoverLotDirtGeom\(/.test(constants)
    && !leftover.includes('leftoverLotH.js')
    && !leftover.includes('leftoverLotDirtGeom(')
    && !leftover.includes('Selo')
    && !constants.includes('Selo')
    && !constants.includes('photo-mode')
    && !constants.includes('ACES')
    && !constants.includes('SSAO')
    && !constants.includes('Shackleton')
    && !constants.includes('colony HUD'));
  ok('cullReserved drops street footprints, tryPlace drops helipad E',
    buildings.includes('streetOverlap(t.x, t.z, t.w, t.d)')
    && buildings.includes('tryPlace(ctx, hx, hz)')
    && buildings.includes('streetOverlap(hx, hz, 16, 16)')
    && buildings.includes('[[430, 70], [-430, 100]]')
    && !/430\s*\+\s*/.test(buildings) && !/hx\s*=\s*hx\s*\+/.test(buildings));
  ok('index builds leftoverLot on the keepout path',
    index.includes("from './landmarks/leftoverLot.js'")
    && index.includes('buildLeftoverLot(ctx)')
    && index.indexOf('buildLeftoverLot') > index.indexOf('buildHouse')
    && index.indexOf('buildLeftoverLot') < index.indexOf('buildBlades'));
  ok('no custom mat',
    !/\bShaderMaterial\b/.test(leftover) && !/\bonBeforeCompile\b/.test(leftover)
    && leftover.includes('MeshStandardMaterial'));
  ok('kit is chain-link + gate + shed + dumpster, no furniture',
    leftover.includes('chain-link') && leftover.includes('dumpster')
    && leftover.includes('weenie') && leftover.includes('limestone')
    && leftover.includes('extraPalms')
    && leftover.includes('grow-to-gap') && leftover.includes('lean')
    && !/chair|sofa|table|crate|bench|Kenney/i.test(leftover)
    && !/silo|hoistway|aisle/i.test(leftover));
  ok('not leftover-dirt hulls',
    !leftover.includes('planDirtBlades') && !leftover.includes('dirtHulls')
    && !planting.includes('leftoverLot'));
  ok('not a fifth haunt',
    leftover.includes('Not a fifth haunt')
    && !follow.includes('leftoverLot') && !checkpoints.includes('leftoverLot'));
  ok('house was not restacked',
    house.includes('housePlanGeom') && house.includes('weenie')
    && !house.includes('leftoverLot') && !house.includes('LEFTOVER_LOT_'));
  ok('warehouse was not restacked',
    warehouse.includes('warehouseAisleGeom') && warehouse.includes('buildRacks')
    && !warehouse.includes('leftoverLot') && !warehouse.includes('LEFTOVER_LOT_'));
  ok('drop was not restacked',
    drop.includes('dropHoistGeom') && drop.includes('buildWell')
    && !drop.includes('leftoverLot') && !drop.includes('LEFTOVER_LOT_'));
  ok('abando was not restacked',
    abando.includes('abandoStairGeom') && abando.includes('buildSilo')
    && !abando.includes('leftoverLot') && !abando.includes('LEFTOVER_LOT_'));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust')
    && !blades.includes('leftoverLot'));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !water.includes('leftoverLot'));
  ok('preview.html was not restacked',
    preview.includes('url=./') && !preview.includes('leftoverLot'));
  ok('follow.js was not restacked',
    follow.includes('hauntFollowPath') && !follow.includes('leftoverLot'));
  ok('checkpoints.js was not restacked',
    checkpoints.includes('RESTART_OFFSET') && !checkpoints.includes('leftoverLot'));
  ok('quad.js GRAVITY stays 9.81',
    /const GRAVITY = 9\.81/.test(quad) && !quad.includes('leftoverLot'));

  if (fails.length) {
    console.error('[miami-leftoverLot] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-leftoverLot] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('leftoverLotTest.js');
if (isMain) {
  const r = runMiamiLeftoverLotTests();
  if (!r.passed) process.exit(1);
}
