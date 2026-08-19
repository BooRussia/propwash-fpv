// Headless checks for the Miami house haunt kit.
// No three.js, no game state.
//
//   node ./tools/run-miami-house-test.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_Y,
  HOUSE_X, HOUSE_Z, HOUSE_W, HOUSE_D, HOUSE_H,
  HOUSE_HALL, HOUSE_STAIR, HOUSE_DOOR_W, HOUSE_DOOR_H,
  HOUSE_WIN_W, HOUSE_WIN_H, HOUSE_WIN_SILL,
  HOUSE_WALL, HOUSE_LEAF_T, HOUSE_STAIR_T, HOUSE_STAIR_TREAD,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, inReserved, groundHeight,
  houseVoids, houseColliderShapes, housePlanGeom,
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

export function runMiamiHouseTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const voids = houseVoids();
  const shapes = houseColliderShapes();
  const geom = housePlanGeom();
  const door = voids.find((v) => v.kind === 'door');
  const hall = voids.find((v) => v.kind === 'hall');
  const stair = voids.find((v) => v.kind === 'stair');
  const win = voids.find((v) => v.kind === 'window');

  // ---- leftover house / leftover city, not a street / boardwalk ----------
  ok('lot is not pavement', !onPavement(HOUSE_X, HOUSE_Z));
  ok('lot is not boardwalk', !onBoardwalk(HOUSE_X, HOUSE_Z));
  ok('lot is not roadway', !onRoadway(HOUSE_Z));
  ok('lot is not a cross-street', !onCrossStreet(HOUSE_X, HOUSE_Z));
  ok('lot is not a sidewalk slab', !onSidewalk(HOUSE_X, HOUSE_Z));
  ok('lot sits on the city plateau', groundHeight(HOUSE_X, HOUSE_Z) === CITY_Y);
  ok('lot is reserved', inReserved(HOUSE_X, HOUSE_Z));
  ok('lot is a keepout', inKeepout(HOUSE_X, HOUSE_Z));
  ok('tryPlace drops the reserved lot', tryPlace(ctx, HOUSE_X, HOUSE_Z) === 0);
  ok('tryPlace does not remap the lot', tryPlace(ctx, HOUSE_X, HOUSE_Z) === 0);

  // ---- door / hall / stair / window centres stay open --------------------
  ok('house ships door + hall + stair + window voids',
    !!door && !!hall && !!stair && !!win);
  for (const v of voids) {
    const hit = probeBlocked(shapes, v.x, v.y, v.z, v.probe);
    ok(`${v.id} centre open`, !hit, hit ? `blocked by ${hit.tag} ${hit.type}` : '');
  }

  ok('egress door is 0.81 × 1.98 m',
    Math.abs(HOUSE_DOOR_W - 0.81) < 1e-9 && Math.abs(HOUSE_DOOR_H - 1.98) < 1e-9);
  ok('hall is 0.91–1.07 m', HOUSE_HALL >= 0.91 && HOUSE_HALL <= 1.07);
  ok('stair is 0.91 m', Math.abs(HOUSE_STAIR - 0.91) < 1e-9);
  ok('egress window is ≥0.51 × 0.61 m',
    HOUSE_WIN_W >= 0.51 && HOUSE_WIN_H >= 0.61);
  ok('door void uses the locked clear',
    door.openW === HOUSE_DOOR_W && door.openH === HOUSE_DOOR_H);
  ok('hall void uses the locked clear', hall.openW === HOUSE_HALL);
  ok('stair void uses the locked clear', stair.openW === HOUSE_STAIR);
  ok('window void uses the locked punch',
    win.openW === HOUSE_WIN_W && win.openH === HOUSE_WIN_H);
  ok('door and window align on the hall',
    Math.abs(geom.doorX - geom.hallX) < 1e-9
    && Math.abs(geom.winX - geom.hallX) < 1e-9);

  // ---- jambs / leaf exist and are smaller than the opening ---------------
  const jambs = shapes.filter((s) => s.tag === 'house' && s.type === 'aabb');
  ok('house has jamb / leaf / stringer colliders', jambs.length >= 8);
  ok('no filled-room AABB',
    !jambs.some((s) => s.sx >= HOUSE_W - 0.4 && s.sz >= HOUSE_D - 0.4 && s.sy >= HOUSE_H - 1));
  ok('wall jamb thinner than the door',
    HOUSE_WALL < HOUSE_DOOR_W - 0.5 && HOUSE_WALL < HOUSE_DOOR_H - 0.5);
  ok('wall jamb thinner than the hall',
    HOUSE_WALL < HOUSE_HALL - 0.5);
  ok('stringer thinner than the stair clear',
    HOUSE_STAIR_T < HOUSE_STAIR - 0.5);
  ok('open leaf thinner than the door',
    HOUSE_LEAF_T < HOUSE_DOOR_W - 0.5 && HOUSE_LEAF_T < HOUSE_DOOR_H - 0.5);
  ok('wall jamb thinner than the window',
    HOUSE_WALL < HOUSE_WIN_W - 0.15 && HOUSE_WALL < HOUSE_WIN_H - 0.15);
  ok('tread thinner than the stair rise gap',
    HOUSE_STAIR_TREAD < HOUSE_STAIR - 0.5);

  const midHall = probeBlocked(shapes, hall.x, CITY_Y + HOUSE_H * 0.5, hall.z, 0.12);
  ok('hall interior is not a filled box', !midHall);
  const midStair = probeBlocked(shapes, geom.stairX, CITY_Y + HOUSE_H * 0.72, geom.stairZ, 0.08);
  ok('stair well is not a filled box', !midStair);
  const westRoom = probeBlocked(
    shapes,
    (HOUSE_X0 + geom.stairX0) / 2,
    CITY_Y + 1.2,
    geom.midZ,
    0.20,
  );
  ok('west room is not a filled AABB', !westRoom);
  const eastRoom = probeBlocked(
    shapes,
    (geom.hallX1 + HOUSE_X1) / 2,
    CITY_Y + 1.2,
    geom.midZ,
    0.20,
  );
  ok('east room is not a filled AABB', !eastRoom);

  const doorJamb = probeBlocked(
    shapes,
    door.x - HOUSE_DOOR_W / 2 - HOUSE_WALL * 0.45,
    door.y,
    door.z,
    0.03,
  );
  ok('door jamb exists beside the opening', !!doorJamb);

  const leafHit = probeBlocked(
    shapes,
    geom.leafX,
    CITY_Y + HOUSE_DOOR_H * 0.48,
    geom.leafZ,
    0.02,
  );
  ok('open leaf exists beside the jamb', !!leafHit);
  ok('open leaf does not fill the door',
    !probeBlocked(shapes, door.x, door.y, door.z, door.probe));

  const stairJamb = probeBlocked(
    shapes,
    stair.x - HOUSE_STAIR / 2 - HOUSE_WALL * 0.45,
    stair.y,
    stair.z,
    0.03,
  );
  ok('stair stringer exists beside the well', !!stairJamb);

  const winJamb = probeBlocked(
    shapes,
    win.x - HOUSE_WIN_W / 2 - HOUSE_WALL * 0.45,
    win.y,
    win.z,
    0.03,
  );
  ok('window jamb exists beside the opening', !!winJamb);
  ok('window sill is below the sash', HOUSE_WIN_SILL > 0.4 && HOUSE_WIN_SILL < 1.2);

  // ---- one placer; no second scatterer; look locks ----------------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const house = readFileSync(join(here, 'landmarks/house.js'), 'utf8');
  const warehouse = readFileSync(join(here, 'landmarks/warehouse.js'), 'utf8');
  const drop = readFileSync(join(here, 'landmarks/drop.js'), 'utf8');
  const abando = readFileSync(join(here, 'landmarks/abando.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const blades = readFileSync(join(here, 'blades.js'), 'utf8');
  const water = readFileSync(join(here, 'bayWater.js'), 'utf8');
  const preview = readFileSync(join(here, '../../../preview.html'), 'utf8');

  ok('tryPlace is still the placer', planting.includes('export function tryPlace'));
  ok('house is not a second scatterer',
    !house.includes('scatterModels') && !house.includes('planDirtBlades'));
  ok('house does not invent a placer',
    !/export function tryPlace/.test(house)
    && house.includes('tryPlace')
    && house.includes('onPavement'));
  ok('house rejects pavement instead of remapping',
    house.includes('if (onPavement(HOUSE_X, HOUSE_Z)) return null;')
    && !/HOUSE_X\s*=/.test(house));
  ok('index builds house on the fly-through keepout path',
    index.includes("from './landmarks/house.js'")
    && index.includes('buildHouse(ctx)')
    && index.indexOf('buildHouse') > index.indexOf('buildWarehouse')
    && index.indexOf('buildHouse') < index.indexOf('buildBlades'));
  ok('no custom mat',
    !/\bShaderMaterial\b/.test(house) && !/\bonBeforeCompile\b/.test(house)
    && house.includes('MeshStandardMaterial'));
  ok('kit is documentary stucco + rebar, no furniture',
    house.includes('REBAR') && house.includes('weenie')
    && !/chair|sofa|table|crate|bench|Kenney/i.test(house));
  ok('warehouse was not restacked',
    warehouse.includes('warehouseAisleGeom') && warehouse.includes('buildRacks')
    && !warehouse.includes('HOUSE_') && !warehouse.includes('buildHouse'));
  ok('drop was not restacked',
    drop.includes('dropHoistGeom') && drop.includes('buildWell')
    && !drop.includes('HOUSE_') && !drop.includes('buildHouse')
    && !drop.includes('WAREHOUSE_') && !drop.includes('buildWarehouse'));
  ok('abando was not restacked',
    abando.includes('abandoStairGeom') && abando.includes('buildSilo')
    && !abando.includes('HOUSE_') && !abando.includes('buildHouse')
    && !abando.includes('WAREHOUSE_') && !abando.includes('buildWarehouse')
    && !abando.includes('DROP_') && !abando.includes('buildDrop'));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust'));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !water.includes('house'));
  ok('preview.html was not restacked',
    preview.includes('url=./') && !preview.includes('house'));

  if (fails.length) {
    console.error('[miami-house] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-house] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('houseTest.js');
if (isMain) {
  const r = runMiamiHouseTests();
  if (!r.passed) process.exit(1);
}
