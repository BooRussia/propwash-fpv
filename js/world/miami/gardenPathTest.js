// Headless checks for the Miami Tiny Glade garden path.
// No three.js, no game state. Not a haunt. Not leftoverLot.
//
//   node ./tools/run-miami-garden-path-test.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_Y,
  GARDEN_PATH_X, GARDEN_PATH_Z, GARDEN_PATH_W, GARDEN_PATH_LEN,
  GARDEN_PATH_X0, GARDEN_PATH_X1, GARDEN_PATH_Z0, GARDEN_PATH_Z1,
  GARDEN_PATH_SLAB_MIN, GARDEN_PATH_SLAB_MAX,
  GARDEN_PATH_JOINT_MIN, GARDEN_PATH_JOINT_MAX,
  GARDEN_PATH_COLLIDER_PAD, GARDEN_PATH_HULL_COLLIDER, GARDEN_PATH_AABB,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_X0, LEFTOVER_LOT_X1,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z, LEFTOVER_LOT_B_X0, LEFTOVER_LOT_B_X1,
  LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z, LEFTOVER_LOT_C_X0, LEFTOVER_LOT_C_X1,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, inReserved, reservedOverlap, streetOverlap, groundHeight,
  leftoverLotGeom,
  gardenPathGeom, gardenPathGrassHull, gardenPathSlabs, gardenPathPlantSpots,
  gardenPathVoids, gardenPathColliderShapes, gardenPathRejected,
  inGardenPath, inGardenPathSlab, inLeftoverLotReserved, leftoverLotOverlap,
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

export function runMiamiGardenPathTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const geom = gardenPathGeom();
  const hull = gardenPathGrassHull();
  const slabs = gardenPathSlabs();
  const plants = gardenPathPlantSpots();
  const voids = gardenPathVoids();
  const shapes = gardenPathColliderShapes();
  const geomA = leftoverLotGeom();

  // ---- signed corridor (Desi + Reesy); do not slide z --------------------
  ok('path walks 268→284 in x', GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284);
  ok('path centre is signed z=84', GARDEN_PATH_Z === 84 && GARDEN_PATH_X === 276);
  ok('path width is 1.6 m (z 83.2–84.8)',
    GARDEN_PATH_W === 1.6 && GARDEN_PATH_Z0 === 83.2 && GARDEN_PATH_Z1 === 84.8
    && Math.abs(GARDEN_PATH_Z1 - GARDEN_PATH_Z0 - GARDEN_PATH_W) < 1e-9);
  ok('path length is 16 m', GARDEN_PATH_LEN === 16
    && GARDEN_PATH_X1 - GARDEN_PATH_X0 === GARDEN_PATH_LEN);
  ok('geom matches signed constants',
    geom.x0 === 268 && geom.x1 === 284 && geom.z === 84
    && geom.z0 === 83.2 && geom.z1 === 84.8 && geom.w === 1.6);
  ok('z was not invented or slid', geom.z === GARDEN_PATH_Z && geom.z === 84);

  ok('path is not pavement', !onPavement(GARDEN_PATH_X, GARDEN_PATH_Z));
  ok('path is not boardwalk', !onBoardwalk(GARDEN_PATH_X, GARDEN_PATH_Z));
  ok('path is not roadway', !onRoadway(GARDEN_PATH_Z));
  ok('path is not a cross-street', !onCrossStreet(GARDEN_PATH_X, GARDEN_PATH_Z));
  ok('path is not a sidewalk slab', !onSidewalk(GARDEN_PATH_X, GARDEN_PATH_Z));
  ok('path sits on leftover-city grade',
    groundHeight(GARDEN_PATH_X, GARDEN_PATH_Z) === CITY_Y);
  ok('path is reserved', inReserved(GARDEN_PATH_X, GARDEN_PATH_Z));
  ok('path is a keepout', inKeepout(GARDEN_PATH_X, GARDEN_PATH_Z));
  ok('reservedOverlap covers the signed walk',
    reservedOverlap(GARDEN_PATH_X, GARDEN_PATH_Z, GARDEN_PATH_LEN, GARDEN_PATH_W, 0.15));
  ok('tryPlace drops the reserved path',
    tryPlace(ctx, GARDEN_PATH_X, GARDEN_PATH_Z) === 0);
  ok('tryPlace does not remap the path',
    tryPlace(ctx, GARDEN_PATH_X, GARDEN_PATH_Z) === 0);
  ok('signed cell is not rejected', !gardenPathRejected());
  ok('path footprint is not in the street',
    !streetOverlap(GARDEN_PATH_X, GARDEN_PATH_Z, GARDEN_PATH_LEN, GARDEN_PATH_W));

  // ---- leftoverLot A/B/C stay put; path sits off A/B (265 / 288) --------
  ok('leftoverLot A stays 258/84', LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84);
  ok('leftoverLot B stays 295/84', LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84);
  ok('leftoverLot C stays 313/84', LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84);
  ok('path sits off leftoverLot A x1=265',
    GARDEN_PATH_X0 >= LEFTOVER_LOT_X1 && LEFTOVER_LOT_X1 === 265);
  ok('path sits off leftoverLot B x0=288',
    GARDEN_PATH_X1 <= LEFTOVER_LOT_B_X0 && LEFTOVER_LOT_B_X0 === 288);
  ok('path does not overlap leftoverLot A/B/C reserved',
    !leftoverLotOverlap(GARDEN_PATH_X, GARDEN_PATH_Z, GARDEN_PATH_LEN, GARDEN_PATH_W, 0.15)
    && !inLeftoverLotReserved(GARDEN_PATH_X, GARDEN_PATH_Z)
    && !inLeftoverLotReserved(GARDEN_PATH_X0, GARDEN_PATH_Z)
    && !inLeftoverLotReserved(GARDEN_PATH_X1, GARDEN_PATH_Z));
  ok('leftoverLot A/B/C geometry was not slid',
    LEFTOVER_LOT_X0 === 251 && LEFTOVER_LOT_X1 === 265
    && LEFTOVER_LOT_B_X0 === 288 && LEFTOVER_LOT_B_X1 === 302
    && LEFTOVER_LOT_C_X0 === 306 && LEFTOVER_LOT_C_X1 === 320
    && geomA.x0 === LEFTOVER_LOT_X0 && geomA.x1 === LEFTOVER_LOT_X1);
  ok('tryPlace still drops leftoverLot A/B/C',
    tryPlace(ctx, LEFTOVER_LOT_X, LEFTOVER_LOT_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z) === 0);
  ok('tryPlace still drops pavement / street',
    tryPlace(ctx, 0, 27) === 0 && tryPlace(ctx, 57, 80) === 0);

  // ---- flagstones 0.5–0.7 m + 60–100 mm joints; no 300 mm tiles ---------
  ok('two-abreast columns exist',
    slabs.length >= 8
    && slabs.some((s) => s.row === 0) && slabs.some((s) => s.row === 1));
  ok('slabs stay inside the signed walk',
    slabs.every((s) => s.x0 >= GARDEN_PATH_X0 - 1e-9
      && s.x1 <= GARDEN_PATH_X1 + 1e-9
      && s.z0 >= GARDEN_PATH_Z0 - 1e-9
      && s.z1 <= GARDEN_PATH_Z1 + 1e-9));
  ok('flagstones are 0.5–0.7 m',
    slabs.every((s) => s.sx >= GARDEN_PATH_SLAB_MIN - 1e-9
      && s.sx <= GARDEN_PATH_SLAB_MAX + 1e-9
      && s.sz >= GARDEN_PATH_SLAB_MIN - 1e-9
      && s.sz <= GARDEN_PATH_SLAB_MAX + 1e-9));
  ok('no 300 mm tiles',
    slabs.every((s) => s.sx >= 0.5 && s.sz >= 0.5)
    && GARDEN_PATH_SLAB_MIN === 0.5 && GARDEN_PATH_SLAB_MAX === 0.7);
  const col0 = slabs.filter((s) => s.col === 0);
  const south0 = col0.find((s) => s.row === 0);
  const north0 = col0.find((s) => s.row === 1);
  ok('centre joint is 60–100 mm grass',
    !!south0 && !!north0
    && north0.z0 - south0.z1 >= GARDEN_PATH_JOINT_MIN - 1e-9
    && north0.z0 - south0.z1 <= GARDEN_PATH_JOINT_MAX + 1e-9
    && GARDEN_PATH_JOINT_MIN === 0.06 && GARDEN_PATH_JOINT_MAX === 0.10);
  const col1south = slabs.find((s) => s.col === 1 && s.row === 0);
  ok('x joint is 60–100 mm grass',
    !!south0 && !!col1south
    && col1south.x0 - south0.x1 >= GARDEN_PATH_JOINT_MIN - 1e-9
    && col1south.x0 - south0.x1 <= GARDEN_PATH_JOINT_MAX + 1e-9);

  // ---- collider ⊆ each slab; joints + air are flyable; no path AABB -----
  const aabbs = shapes.filter((s) => s.tag === 'gardenPath' && s.type === 'aabb');
  ok('one collider per flagstone', aabbs.length === slabs.length && aabbs.length >= 8);
  ok('no filled path AABB',
    !aabbs.some((s) => s.sx >= GARDEN_PATH_LEN - 0.4
      && s.sz >= GARDEN_PATH_W - 0.4 && s.sy >= 0.4));
  ok('gardenPath AABB flag is false', GARDEN_PATH_AABB === false);
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
  ok('path ships joint + air voids', !!jointZ && !!jointX && !!air);
  for (const v of voids) {
    const hit = probeBlocked(shapes, v.x, v.y, v.z, v.probe);
    ok(`${v.id} is flyable`, !hit, hit ? `blocked by ${hit.tag} ${hit.type}` : '');
  }
  ok('grow-to-gap joints are voids',
    !inGardenPathSlab(jointZ.x, jointZ.z) && !inGardenPathSlab(jointX.x, jointX.z)
    && inGardenPath(jointZ.x, jointZ.z) && inGardenPath(jointX.x, jointX.z));

  // ---- one grass hull at grade; not per-blade colliders (Sylva) ---------
  ok('one grass hull covers the signed walk',
    hull.x0 === GARDEN_PATH_X0 && hull.x1 === GARDEN_PATH_X1
    && hull.z0 === GARDEN_PATH_Z0 && hull.z1 === GARDEN_PATH_Z1
    && hull.y0 === CITY_Y);
  ok('grass hull collider is the ground',
    hull.collider === 'ground' && GARDEN_PATH_HULL_COLLIDER === 'ground');
  ok('grass hull area is width × length',
    Math.abs(hullArea(hull) - GARDEN_PATH_LEN * GARDEN_PATH_W) < 1e-9);
  ok('no grass-hull AABB in the collider bag',
    !aabbs.some((s) => Math.abs(s.sx - GARDEN_PATH_LEN) < 0.2
      && Math.abs(s.sz - GARDEN_PATH_W) < 0.2));

  ok('weeds grow-to-gap in the joints',
    plants.weeds.length >= 4
    && plants.weeds.every((p) => !inGardenPathSlab(p.x, p.z)
      && inGardenPath(p.x, p.z)
      && !onPavement(p.x, p.z)
      && !inLeftoverLotReserved(p.x, p.z)
      && !onBoardwalk(p.x, p.z) && !onSidewalk(p.x, p.z)));
  ok('palms stay off the path',
    !plants.palms && plants.weeds.every((p) => inGardenPath(p.x, p.z)));

  // ---- one placer; no second scatterer; look locks ----------------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
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
  ok('gardenPath is not a second scatterer',
    !garden.includes('scatterModels') && !garden.includes('planDirtBlades'));
  ok('gardenPath does not invent a placer',
    !/export function tryPlace/.test(garden)
    && garden.includes('tryPlace')
    && garden.includes('onPavement'));
  ok('gardenPath rejects pavement / street / leftover lots instead of remapping',
    garden.includes('gardenPathRejected()')
    && garden.includes('if (onPavement(GARDEN_PATH_X, GARDEN_PATH_Z)) return null;')
    && !/GARDEN_PATH_X\s*=/.test(garden)
    && !/GARDEN_PATH_Z\s*=/.test(garden));
  ok('index builds gardenPath on the keepout path after leftoverLot',
    index.includes("from './landmarks/gardenPath.js'")
    && index.includes('buildGardenPath(ctx)')
    && index.indexOf('buildGardenPath') > index.indexOf('buildLeftoverLot')
    && index.indexOf('buildGardenPath') < index.indexOf('buildBlades'));
  ok('no custom mat',
    !/\bShaderMaterial\b/.test(garden) && !/\bonBeforeCompile\b/.test(garden)
    && garden.includes('MeshStandardMaterial'));
  ok('kit is Tiny Glade flagstones + one grass hull, no bench',
    garden.includes('Tiny Glade') && garden.includes('two-abreast')
    && garden.includes('grass hull') && garden.includes('grow-to-gap')
    && garden.includes('268') && garden.includes('Desi')
    && !/chair|sofa|table|crate|bench|Kenney/i.test(garden)
    && !/silo|hoistway|aisle/i.test(garden));
  ok('Sylva methods only, no per-blade colliders',
    garden.includes('Sylva') && garden.includes('GARDEN_PATH_HULL_COLLIDER')
    && garden.includes('gardenPathGrassHull')
    && !garden.includes('planDirtBlades')
    && constants.includes("GARDEN_PATH_HULL_COLLIDER = 'ground'"));
  ok('leftoverLot A/B/C were not restacked',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)')
    && leftover.includes('chain-link') && leftover.includes('weenie')
    && !leftover.includes('gardenPath') && !leftover.includes('GARDEN_PATH_')
    && constants.includes('258/84') && constants.includes('295/84')
    && constants.includes('313/84') && constants.includes('268→284'));
  ok('house was not restacked',
    house.includes('housePlanGeom') && house.includes('weenie')
    && !house.includes('gardenPath') && !house.includes('GARDEN_PATH_'));
  ok('warehouse was not restacked',
    warehouse.includes('warehouseAisleGeom') && warehouse.includes('buildRacks')
    && !warehouse.includes('gardenPath') && !warehouse.includes('GARDEN_PATH_'));
  ok('drop was not restacked',
    drop.includes('dropHoistGeom') && drop.includes('buildWell')
    && !drop.includes('gardenPath') && !drop.includes('GARDEN_PATH_'));
  ok('abando was not restacked',
    abando.includes('abandoStairGeom') && abando.includes('buildSilo')
    && !abando.includes('gardenPath') && !abando.includes('GARDEN_PATH_'));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust')
    && !blades.includes('gardenPath'));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !water.includes('gardenPath'));
  ok('preview.html was not restacked',
    preview.includes('url=./') && !preview.includes('gardenPath'));
  ok('follow.js was not restacked',
    follow.includes('hauntFollowPath') && !follow.includes('gardenPath'));
  ok('checkpoints.js was not restacked',
    checkpoints.includes('RESTART_OFFSET') && !checkpoints.includes('gardenPath'));
  ok('quad.js GRAVITY stays 9.81',
    /const GRAVITY = 9\.81/.test(quad) && !quad.includes('gardenPath'));
  ok('planting.js was not restacked',
    planting.includes('export function tryPlace')
    && !planting.includes('gardenPath') && !planting.includes('GARDEN_PATH_'));

  if (fails.length) {
    console.error('[miami-gardenPath] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-gardenPath] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('gardenPathTest.js');
if (isMain) {
  const r = runMiamiGardenPathTests();
  if (!r.passed) process.exit(1);
}
