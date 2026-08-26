// Headless source-locks for the Washington Ave analogue.
// No three.js, no game state.
//
//   node ./tools/run-miami-washington-test.mjs

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WASH_Z, WASH_HALF, WASH_VISUAL_W, WASH_Z0, WASH_Z1,
  WASH_TRAVEL_Z0, WASH_TRAVEL_Z1, WASH_PARK_OCEAN_Z, WASH_PARK_INLAND_Z,
  WASH_X0, WASH_X1, WASH_ARCADE_X, WASH_ARCADE_Z,
  WASH_ARCADE_POST_H, WASH_ARCADE_HALF_Z, WASH_ARCADE_POST_R,
  WASH_CAR_CELLS, WASH_SW_OCEAN_Z, WASH_SW_INLAND_Z,
  washingtonRuns, washingtonCars, washingtonArcadeGeom,
  FLY_VOIDS, flyColliderShapes, inKeepout, inReserved, inFlyVoid,
  leftoverLotOverlap, streetOverlap, onWashingtonRoad, onWashingtonWalk, onPavement,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_H_X, CITY_Y, GAP_X, XS_HALF,
} from './constants.js';

const here = dirname(fileURLToPath(import.meta.url));
const TRAVEL_Z0 = 40.2;
const TRAVEL_Z1 = 47.8;

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

export function runMiamiWashingtonTests() {
  fails.length = 0;
  passedCount = 0;

  const washington = readFileSync(join(here, 'landmarks/washington.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const buildings = readFileSync(join(here, 'buildings.js'), 'utf8');
  const crowd = readFileSync(join(here, 'crowd.js'), 'utf8');
  const kit = flyColliderShapes();

  ok('washington.js exists', existsSync(join(here, 'landmarks/washington.js')));
  ok('no layout rng',
    !/\brng2?\s*\(/.test(washington)
    && !/\brng3\s*\(/.test(washington)
    && !/\brng4\s*\(/.test(washington)
    && washington.includes('hash01'));
  ok('no ShaderMaterial / ped / traffic',
    !washington.includes('ShaderMaterial')
    && !washington.includes('ped.js') && !washington.includes('traffic.js'));
  ok('index calls buildWashington after lincoln, before flythrough',
    index.includes('buildWashington(ctx)')
    && index.indexOf('buildWashington(ctx)') > index.indexOf('buildLincoln(ctx)')
    && index.indexOf('buildWashington(ctx)') < index.indexOf('buildFlythrough(ctx)'));
  ok('backdrop 60-box contract untouched',
    buildings.includes('for (let i = 0; i < 60; i++)'));

  ok('street centre is z=180 west of leftoverLot A',
    WASH_Z === 180 && WASH_HALF === 7 && WASH_VISUAL_W === 14
    && WASH_Z0 === 173 && WASH_Z1 === 187
    && WASH_X1 < 240 && WASH_X1 < 251 && WASH_X0 < WASH_X1);
  ok('travel / park splits leave the middle empty',
    WASH_TRAVEL_Z0 === 176.2 && WASH_TRAVEL_Z1 === 183.8
    && WASH_PARK_OCEAN_Z === 174.45 && WASH_PARK_INLAND_Z === 185.55
    && WASH_PARK_OCEAN_Z < WASH_TRAVEL_Z0
    && WASH_PARK_INLAND_Z > WASH_TRAVEL_Z1
    && !(WASH_Z0 < TRAVEL_Z1 && WASH_Z1 > TRAVEL_Z0));
  ok('arcade opening is flyable',
    WASH_ARCADE_POST_H >= 3.2
    && WASH_ARCADE_HALF_Z * 2 - 2 * WASH_ARCADE_POST_R >= 1.15
    && WASH_ARCADE_X === 96 && WASH_ARCADE_X < 240
    && WASH_ARCADE_Z === WASH_SW_OCEAN_Z
    && WASH_ARCADE_Z > TRAVEL_Z1);

  const runs = washingtonRuns();
  ok('four carriageway runs west of x=240',
    runs.length === 4 && runs.every((r) => r.x1 < 240 && r.z === WASH_Z));
  ok('runs skip GAP_X columns',
    runs.every((r) => GAP_X.every((gx) => r.x1 < gx - XS_HALF + 1e-6 || r.x0 > gx + XS_HALF - 1e-6)));
  ok('asphalt is pavement, not leftoverLot A',
    onWashingtonRoad(-400, WASH_Z) && onPavement(-400, WASH_Z)
    && onWashingtonRoad(96, WASH_Z) && onWashingtonWalk(96, WASH_SW_OCEAN_Z)
    && onWashingtonWalk(96, WASH_SW_INLAND_Z)
    && !onWashingtonRoad(258, WASH_Z) && !onWashingtonWalk(258, WASH_SW_OCEAN_Z)
    && leftoverLotOverlap(96, WASH_Z, 4, 4, 0.15) === false);

  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    ok(`${r.id} reserved west of 240`,
      r.x1 + 1.8 <= 240 && inReserved(r.x, r.z));
    ok(`${r.id} misses leftoverLot / Ocean Drive travel`,
      leftoverLotOverlap(r.x, r.z, Math.min(r.w, 8), r.d, 0.15) === false
      && r.z0 > TRAVEL_Z1
      && !(r.z0 < TRAVEL_Z1 && r.z1 > TRAVEL_Z0)
      && r.x1 < 251);
  }

  const cars = washingtonCars();
  ok('twelve signed parked cars',
    cars.length === 12 && WASH_CAR_CELLS.length === 12);
  for (let i = 0; i < cars.length; i++) {
    const c = cars[i];
    ok(`${c.id} on a park shoulder, not travel`,
      (c.z === WASH_PARK_OCEAN_Z || c.z === WASH_PARK_INLAND_Z)
      && !(c.z > WASH_TRAVEL_Z0 && c.z < WASH_TRAVEL_Z1)
      && !(c.z0 < TRAVEL_Z1 && c.z1 > TRAVEL_Z0)
      && c.x1 < 240);
    ok(`${c.id} reserved + misses leftoverLot`,
      inReserved(c.x, c.z)
      && leftoverLotOverlap(c.x, c.z, c.sx, c.sz, 0.15) === false
      && c.x1 < 251);
  }

  const arcade = washingtonArcadeGeom();
  const v = FLY_VOIDS.find((f) => f.id === 'washington-arcade');
  ok('washington-arcade void listed',
    !!v && v.x === WASH_ARCADE_X && v.z === WASH_ARCADE_Z
    && v.openH === WASH_ARCADE_POST_H && v.openW >= 1.15);
  ok('arcade reserved + keepout + inFlyVoid',
    !!v && inReserved(arcade.x, arcade.z) && inKeepout(arcade.x, arcade.z)
    && !!inFlyVoid(arcade.x, arcade.z) && arcade.x1 < 240);
  if (v) {
    ok('arcade bay centre is open',
      !probeBlocked(kit, v.x, v.y, v.z, 0.28)
      && v.openW >= 1.15 && v.openH >= 2);
    ok('arcade misses leftoverLot / Ocean Drive travel / street-overlap of lots',
      leftoverLotOverlap(v.x, v.z, 2.4, 2.0, 0.15) === false
      && v.z > TRAVEL_Z1
      && !(v.z0 < TRAVEL_Z1 && v.z1 > TRAVEL_Z0));
  }

  const hitsTravel = kit.filter((s) => {
    const z0 = s.type === 'cyl' ? s.z - s.r : s.z - s.sz / 2;
    const z1 = s.type === 'cyl' ? s.z + s.r : s.z + s.sz / 2;
    return s.tag === 'washington' && z0 < TRAVEL_Z1 && z1 > TRAVEL_Z0;
  });
  ok('no washington collider in travel lanes 40.2–47.8',
    hitsTravel.length === 0, hitsTravel.slice(0, 3).map((s) => `${s.type}`).join(','));

  const washTravelHits = kit.filter((s) => {
    const z0 = s.type === 'cyl' ? s.z - s.r : s.z - s.sz / 2;
    const z1 = s.type === 'cyl' ? s.z + s.r : s.z + s.sz / 2;
    return s.tag === 'washington' && z0 < WASH_TRAVEL_Z1 && z1 > WASH_TRAVEL_Z0;
  });
  ok('no washington kit collider in Washington travel 176.2–183.8',
    washTravelHits.length === 0, washTravelHits.slice(0, 3).map((s) => `${s.type}`).join(','));

  ok('crowd walks Washington sidewalks, no colliders',
    crowd.includes("kind: 'washington'") && crowd.includes('WASH_WALK_Z_OCEAN')
    && crowd.includes('const nWashington = 16')
    && !crowd.includes('addCollider') && !crowd.includes('addCyl'));
  ok('leftoverLot A–H unmoved',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));
  ok('CITY_Y unchanged', CITY_Y === 1.5);
  ok('streetOverlap sees Washington but not leftoverLot A',
    streetOverlap(96, WASH_Z, 4, 4) === true
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15)
    && streetOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D) === false);

  if (fails.length) {
    console.error('[miami-washington] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-washington] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('washingtonTest.js');
if (isMain) {
  const r = runMiamiWashingtonTests();
  if (!r.passed) process.exit(1);
}
