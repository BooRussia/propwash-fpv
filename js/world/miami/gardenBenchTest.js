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
  ok('path sits off leftoverLot A x1=265',
    GARDEN_PATH_X0 >= LEFTOVER_LOT_X1 && LEFTOVER_LOT_X1 === 265);
  ok('path sits off leftoverLot B x0=288',
    GARDEN_PATH_X1 <= LEFTOVER_LOT_B_X0 && LEFTOVER_LOT_B_X0 === 288);
  ok('bench does not overlap leftoverLot A/B/C reserved',
    !leftoverLotOverlap(GARDEN_BENCH_X, GARDEN_BENCH_Z, GARDEN_BENCH_W, GARDEN_BENCH_DEPTH, 0.15)
    && !inLeftoverLotReserved(GARDEN_BENCH_X, GARDEN_BENCH_Z)
    && !inLeftoverLotReserved(GARDEN_BENCH_X0, GARDEN_BENCH_Z)
    && !inLeftoverLotReserved(GARDEN_BENCH_X1, GARDEN_BENCH_Z));
  ok('leftoverLot A/B/C geometry was not slid',
    LEFTOVER_LOT_X0 === 251 && LEFTOVER_LOT_X1 === 265
    && LEFTOVER_LOT_B_X0 === 288 && LEFTOVER_LOT_B_X1 === 302
    && LEFTOVER_LOT_C_X0 === 306 && LEFTOVER_LOT_C_X1 === 320
    && geomA.x0 === LEFTOVER_LOT_X0 && geomA.x1 === LEFTOVER_LOT_X1);
  ok('tryPlace still drops leftoverLot A/B/C',
    tryPlace(ctx, LEFTOVER_LOT_X, LEFTOVER_LOT_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z) === 0);
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
  ok('leftoverLot A/B/C were not restacked',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)')
    && leftover.includes('chain-link') && leftover.includes('weenie')
    && !leftover.includes('gardenBench') && !leftover.includes('GARDEN_BENCH_')
    && !leftover.includes('gardenPath') && !leftover.includes('GARDEN_PATH_')
    && constants.includes('258/84') && constants.includes('295/84')
    && constants.includes('313/84') && constants.includes('268→284')
    && constants.includes('276 / 82.4'));
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
