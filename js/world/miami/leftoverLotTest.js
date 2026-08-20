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
  LEFTOVER_LOT_FENCE_H, LEFTOVER_LOT_FENCE_H_MIN, LEFTOVER_LOT_FENCE_H_MAX,
  LEFTOVER_LOT_GATE_W, LEFTOVER_LOT_WALK_W, LEFTOVER_LOT_WALK_H,
  LEFTOVER_LOT_SHED_DOOR_W, LEFTOVER_LOT_SHED_DOOR_H,
  LEFTOVER_LOT_MESH_T, LEFTOVER_LOT_POST, LEFTOVER_LOT_JAMB,
  WAREHOUSE_X1,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, inReserved, reservedOverlap, streetOverlap, groundHeight,
  leftoverLotGeom, leftoverLotVoids, leftoverLotColliderShapes,
  leftoverLotPlantSpots, inLeftoverLotGate,
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
  const voids = leftoverLotVoids();
  const shapes = leftoverLotColliderShapes();
  const plants = leftoverLotPlantSpots();
  const plantsB = leftoverLotPlantSpots(geomB);
  const plantsC = leftoverLotPlantSpots(geomC);
  const gate = voids.find((v) => v.kind === 'gate');
  const walk = voids.find((v) => v.kind === 'walk');
  const shedDoor = voids.find((v) => v.kind === 'shed-door');
  const gateB = voids.find((v) => v.kind === 'gate' && v.x === LEFTOVER_LOT_B_X);
  const gateC = voids.find((v) => v.kind === 'gate' && v.x === LEFTOVER_LOT_C_X);

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

  // ---- leftoverLot C live; street tower drops, never nudge ---------------
  ok('lots A/B/C footprints are not in the street',
    !streetOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D)
    && !streetOverlap(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z, LEFTOVER_LOT_B_W, LEFTOVER_LOT_B_D)
    && !streetOverlap(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z, LEFTOVER_LOT_C_W, LEFTOVER_LOT_C_D));
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
  ok('lot B vehicle gate is open',
    !!gateB && !probeBlocked(shapes, gateB.x, gateB.y, gateB.z, gateB.probe)
    && gateB.openW === LEFTOVER_LOT_GATE_W && gateB.openH === LEFTOVER_LOT_FENCE_H
    && geomB.gateZ === LEFTOVER_LOT_B_Z0 && geomB.gateZ === geomB.z0);
  ok('lot C vehicle gate is open',
    !!gateC && !probeBlocked(shapes, gateC.x, gateC.y, gateC.z, gateC.probe)
    && gateC.openW === LEFTOVER_LOT_GATE_W && gateC.openH === LEFTOVER_LOT_FENCE_H
    && geomC.gateZ === LEFTOVER_LOT_C_Z0 && geomC.gateZ === geomC.z0);
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
