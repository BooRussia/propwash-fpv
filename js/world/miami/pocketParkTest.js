// Headless checks for the Miami Tiny Glade leftover-city pocket park.
// No three.js, no game state. Not a haunt. Not leftoverLot. Not a path,
// bench, or leftoverGrass restack.
//
//   node ./tools/run-miami-pocket-park-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_Y,
  POCKET_PARK_X0, POCKET_PARK_X1, POCKET_PARK_Z0, POCKET_PARK_Z1,
  POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D,
  POCKET_PARK_AREA,
  POCKET_PARK_H_MIN, POCKET_PARK_H_MAX, POCKET_PARK_LAWN_H,
  POCKET_PARK_COVER, POCKET_PARK_INSTANCES_MIN, POCKET_PARK_INSTANCES_MAX,
  POCKET_PARK_HULL_H, POCKET_PARK_HULL_COLLIDER,
  POCKET_PARK_PAD_AABB, POCKET_PARK_AABB,
  GARDEN_PATH_X, GARDEN_PATH_Z, GARDEN_PATH_W, GARDEN_PATH_LEN,
  GARDEN_PATH_X0, GARDEN_PATH_X1, GARDEN_PATH_Z0, GARDEN_PATH_Z1,
  GARDEN_BENCH_X, GARDEN_BENCH_Z,
  LEFTOVER_GRASS_X0, LEFTOVER_GRASS_X1, LEFTOVER_GRASS_Z0, LEFTOVER_GRASS_Z1,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_X0, LEFTOVER_LOT_X1,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z, LEFTOVER_LOT_B_X0, LEFTOVER_LOT_B_X1,
  LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z, LEFTOVER_LOT_C_X0, LEFTOVER_LOT_C_X1,
  LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z, LEFTOVER_LOT_D_X0, LEFTOVER_LOT_D_X1,
  WAREHOUSE_X, WAREHOUSE_Z,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, groundHeight, streetOverlap,
  leftoverLotGeom, pocketParkHull, pocketParkArea,
  pocketParkDrop, pocketParkLean, pocketParkPlannedCount,
  pocketParkRejected, pocketParkColliderShapes, inPocketPark,
  inGardenPath, inLeftoverLotReserved, leftoverLotOverlap,
  inWarehouseReserved, warehouseOverlap,
} from './constants.js';
import { hullArea, tessellateHull, tryPlace } from './planting.js';

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

function placePocketPark(ctx) {
  const hull = pocketParkHull();
  const cells = tessellateHull(hull, pocketParkPlannedCount());
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
  return { cells, placed };
}

export function runMiamiPocketParkTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const hull = pocketParkHull();
  const shapes = pocketParkColliderShapes();
  const geomA = leftoverLotGeom();

  // ---- signed plate (Desi + Reesy); do not invent or slide the box ------
  ok('plate is signed x 268–284', POCKET_PARK_X0 === 268 && POCKET_PARK_X1 === 284);
  ok('plate is signed z 88–96', POCKET_PARK_Z0 === 88 && POCKET_PARK_Z1 === 96);
  ok('plate width × depth is 16 × 8',
    POCKET_PARK_W === 16 && POCKET_PARK_D === 8
    && POCKET_PARK_X1 - POCKET_PARK_X0 === 16
    && POCKET_PARK_Z1 - POCKET_PARK_Z0 === 8);
  ok('plate centre is 276 / 92',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92);
  ok('geom matches signed constants',
    hull.x0 === 268 && hull.x1 === 284
    && hull.z0 === 88 && hull.z1 === 96
    && hull.x === 276 && hull.z === 92
    && hull.w === 16 && hull.d === 8);
  ok('x/z were not invented or slid',
    hull.x0 === POCKET_PARK_X0 && hull.x1 === POCKET_PARK_X1
    && hull.z0 === POCKET_PARK_Z0 && hull.z1 === POCKET_PARK_Z1);

  ok('plate is 128 m²',
    POCKET_PARK_AREA === 128
    && pocketParkArea() === 128
    && Math.abs(hullArea(hull) - 128) < 1e-9);

  ok('plate is not pavement', !onPavement(POCKET_PARK_X, POCKET_PARK_Z));
  ok('plate is not boardwalk', !onBoardwalk(POCKET_PARK_X, POCKET_PARK_Z));
  ok('plate is not roadway', !onRoadway(POCKET_PARK_Z));
  ok('plate is not a cross-street', !onCrossStreet(POCKET_PARK_X, POCKET_PARK_Z));
  ok('plate is not a sidewalk slab', !onSidewalk(POCKET_PARK_X, POCKET_PARK_Z));
  ok('plate sits on leftover-city grade',
    groundHeight(POCKET_PARK_X, POCKET_PARK_Z) === CITY_Y);
  ok('plate is a keepout', inKeepout(POCKET_PARK_X, POCKET_PARK_Z));
  ok('inPocketPark covers the signed box',
    inPocketPark(POCKET_PARK_X, POCKET_PARK_Z)
    && inPocketPark(POCKET_PARK_X0, POCKET_PARK_Z0)
    && inPocketPark(POCKET_PARK_X1, POCKET_PARK_Z1));
  ok('signed plate is not rejected', !pocketParkRejected());
  ok('plate footprint is not in the street',
    !streetOverlap(POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D));

  // ---- path / lots / bench / leftoverGrass stay put ----------------------
  ok('path stays 268→284 / z=84 / 1.6 m',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284
    && GARDEN_PATH_Z === 84 && GARDEN_PATH_W === 1.6
    && GARDEN_PATH_LEN === 16 && GARDEN_PATH_X === 276
    && GARDEN_PATH_Z0 === 83.2 && GARDEN_PATH_Z1 === 84.8);
  ok('leftoverLot A stays 258/84', LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84);
  ok('leftoverLot B stays 295/84', LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84);
  ok('leftoverLot C stays 313/84', LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84);
  ok('leftoverLot D stays 330/84', LEFTOVER_LOT_D_X === 330 && LEFTOVER_LOT_D_Z === 84);
  ok('bench stays 276 / 82.4', GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('leftoverGrass stays 267–285 / 81–86',
    LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0);
  ok('hull sits inland of path z1=84.8',
    POCKET_PARK_Z0 === 88 && GARDEN_PATH_Z1 === 84.8
    && POCKET_PARK_Z0 > GARDEN_PATH_Z1);
  ok('hull sits just off leftoverLot A x1=265',
    POCKET_PARK_X0 > LEFTOVER_LOT_X1 && LEFTOVER_LOT_X1 === 265);
  ok('hull sits just off leftoverLot B x0=288',
    POCKET_PARK_X1 < LEFTOVER_LOT_B_X0 && LEFTOVER_LOT_B_X0 === 288);
  ok('hull does not overlap leftoverLot A/B/C/D reserved',
    !leftoverLotOverlap(POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D, 0.15)
    && !inLeftoverLotReserved(POCKET_PARK_X0, POCKET_PARK_Z)
    && !inLeftoverLotReserved(POCKET_PARK_X1, POCKET_PARK_Z));
  ok('hull does not overlap warehouse reserved',
    !warehouseOverlap(POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D, 0.15)
    && !inWarehouseReserved(POCKET_PARK_X, POCKET_PARK_Z)
    && !inWarehouseReserved(POCKET_PARK_X, POCKET_PARK_Z1));
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
  ok('tryPlace still drops the garden path',
    tryPlace(ctx, GARDEN_PATH_X, GARDEN_PATH_Z) === 0);
  ok('tryPlace still drops the garden bench',
    tryPlace(ctx, GARDEN_BENCH_X, GARDEN_BENCH_Z) === 0);
  ok('tryPlace still drops the warehouse',
    tryPlace(ctx, WAREHOUSE_X, WAREHOUSE_Z) === 0);
  ok('tryPlace still drops pavement / street',
    tryPlace(ctx, 0, 27) === 0 && tryPlace(ctx, 57, 80) === 0);

  // ---- tryPlace drop on warehouse / lots / path --------------------------
  ok('pocketParkDrop rejects leftoverLot A/B/C/D',
    pocketParkDrop(LEFTOVER_LOT_X, LEFTOVER_LOT_Z)
    && pocketParkDrop(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z)
    && pocketParkDrop(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)
    && pocketParkDrop(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z));
  ok('pocketParkDrop rejects the warehouse',
    pocketParkDrop(WAREHOUSE_X, WAREHOUSE_Z)
    && inWarehouseReserved(WAREHOUSE_X, WAREHOUSE_Z));
  ok('pocketParkDrop rejects the garden path',
    pocketParkDrop(GARDEN_PATH_X, GARDEN_PATH_Z)
    && inGardenPath(GARDEN_PATH_X, GARDEN_PATH_Z));
  ok('leftover-city grade on the signed plate keeps',
    !pocketParkDrop(276, 92) && inPocketPark(276, 92)
    && !inGardenPath(276, 92) && !inLeftoverLotReserved(276, 92)
    && !inWarehouseReserved(276, 92));

  // ---- plant from the grid; leftover 8–11k after walks; not dirt ---------
  const plannedN = pocketParkPlannedCount();
  const raw = Math.round(POCKET_PARK_AREA * POCKET_PARK_COVER * POCKET_PARK_COVER);
  ok('density is area × cover², not dirt 3.36',
    POCKET_PARK_COVER === 10
    && raw === 12800
    && plannedN === raw
    && POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_W === 16 && POCKET_PARK_D === 8);
  ok('planned count is a grid over the signed plate',
    plannedN === Math.round(POCKET_PARK_AREA * POCKET_PARK_COVER * POCKET_PARK_COVER));

  const field = placePocketPark(ctx);
  ok('plant from the grid',
    field.cells.length === plannedN && field.cells.length > 0);
  ok('placed instances are leftover ~8–11k',
    field.placed.length >= POCKET_PARK_INSTANCES_MIN
    && field.placed.length <= POCKET_PARK_INSTANCES_MAX
    && POCKET_PARK_INSTANCES_MIN === 8000
    && POCKET_PARK_INSTANCES_MAX === 11000,
    `placed=${field.placed.length} planned=${plannedN}`);
  ok('no placed blade on a lot / warehouse / path / pavement',
    field.placed.every((p) => !pocketParkDrop(p.x, p.z)
      && !onPavement(p.x, p.z)
      && !inGardenPath(p.x, p.z)
      && !inLeftoverLotReserved(p.x, p.z)
      && !inWarehouseReserved(p.x, p.z)));
  ok('blades stay inside the signed plate',
    field.placed.every((p) => inPocketPark(p.x, p.z)));
  ok('not leftover-dirt 190k',
    field.placed.length < 20000 && plannedN < 20000
    && POCKET_PARK_INSTANCES_MAX === 11000);

  // ---- blade H 0.12–0.22 m; 50 mm lawn disappears ------------------------
  ok('blade H is 0.12–0.22 m',
    POCKET_PARK_H_MIN === 0.12 && POCKET_PARK_H_MAX === 0.22
    && POCKET_PARK_H_MIN < POCKET_PARK_H_MAX);
  ok('50 mm lawn is forbidden',
    POCKET_PARK_LAWN_H === 0.05
    && POCKET_PARK_H_MIN > POCKET_PARK_LAWN_H);

  // ---- lean at leftoverLot fences / path if they reach -------------------
  const nearFenceA = pocketParkLean(LEFTOVER_LOT_X1, 89);
  const nearFenceB = pocketParkLean(LEFTOVER_LOT_B_X0, 89);
  const nearPath = pocketParkLean(276, GARDEN_PATH_Z1 + 0.04);
  const midPark = pocketParkLean(276, 92);
  ok('lean at leftoverLot A fence if it reaches',
    nearFenceA > midPark && nearFenceA >= 0.14 && LEFTOVER_LOT_X1 === 265);
  ok('lean at leftoverLot B fence if it reaches',
    nearFenceB > midPark && nearFenceB >= 0.14 && LEFTOVER_LOT_B_X0 === 288);
  ok('lean at the garden path if it reaches',
    nearPath > midPark && nearPath >= 0.14 && GARDEN_PATH_Z1 === 84.8);
  ok('mid-park lean is weak (path / fences do not reach)',
    midPark === 0.04);

  // ---- one thin grade hull collider; no 0.3 m pad; no per-blade ----------
  const aabbs = shapes.filter((s) => s.tag === 'pocketPark' && s.type === 'aabb');
  ok('one thin grade hull collider',
    aabbs.length === 1 && shapes.length === 1
    && aabbs[0].part === 'grade'
    && aabbs[0].sy === POCKET_PARK_HULL_H
    && POCKET_PARK_HULL_H === 0.014);
  ok('grade hull covers the signed box',
    aabbs[0].sx === POCKET_PARK_W && aabbs[0].sz === POCKET_PARK_D
    && aabbs[0].x === POCKET_PARK_X && aabbs[0].z === POCKET_PARK_Z
    && aabbs[0].y0 === CITY_Y);
  ok('hull collider is the ground',
    hull.collider === 'ground' && POCKET_PARK_HULL_COLLIDER === 'ground');
  ok('no filled grass AABB', POCKET_PARK_AABB === false);
  ok('a 0.3 m pad AABB fails',
    POCKET_PARK_PAD_AABB === 0.3
    && aabbs.every((s) => s.sy < POCKET_PARK_PAD_AABB)
    && !aabbs.some((s) => s.sy >= 0.3));
  ok('thin hull exists at grade',
    !!probeBlocked(shapes, POCKET_PARK_X, CITY_Y + 0.006, POCKET_PARK_Z, 0.004));
  ok('no per-blade colliders',
    shapes.length === 1 && !shapes.some((s) => s.part === 'blade'));

  // ---- one placer; no second scatterer; look locks -----------------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const park = readFileSync(join(here, 'landmarks/pocketPark.js'), 'utf8');
  const grass = readFileSync(join(here, 'landmarks/leftoverGrass.js'), 'utf8');
  const garden = readFileSync(join(here, 'landmarks/gardenPath.js'), 'utf8');
  const bench = readFileSync(join(here, 'landmarks/gardenBench.js'), 'utf8');
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
  ok('pocketPark is not a second scatterer',
    !park.includes('scatterModels') && !park.includes('planDirtBlades'));
  ok('pocketPark does not invent a placer',
    !/export function tryPlace/.test(park)
    && park.includes('tryPlace')
    && park.includes('tessellateHull')
    && park.includes('onPavement'));
  ok('pocketPark rejects warehouse / lots / path instead of remapping',
    park.includes('pocketParkRejected()')
    && park.includes('pocketParkDrop')
    && !/POCKET_PARK_X0\s*=/.test(park)
    && !/POCKET_PARK_Z0\s*=/.test(park));
  ok('index builds pocketPark on the keepout path after leftoverGrass',
    index.includes("from './landmarks/pocketPark.js'")
    && index.includes('buildPocketPark(ctx)')
    && index.indexOf('buildPocketPark') > index.indexOf('buildLeftoverGrass')
    && index.indexOf('buildPocketPark') < index.indexOf('buildBlades'));
  ok('no custom mat',
    !/\bShaderMaterial\b/.test(park) && !/\bonBeforeCompile\b/.test(park)
    && park.includes('MeshStandardMaterial'));
  ok('kit is Tiny Glade grow-to-gap leftover-city plate',
    park.includes('Tiny Glade') && park.includes('grow-to-gap')
    && park.includes('leftover-city') && park.includes('268')
    && park.includes('Desi') && park.includes('St. Augustine')
    && park.includes('10–13k')
    && !/Kenney|silo|hoistway|aisle/i.test(park)
    && !park.includes('planDirtBlades') && !park.includes('dirtHulls'));
  ok('Sylva methods only, no per-blade colliders',
    park.includes('Sylva') && park.includes('POCKET_PARK_HULL_COLLIDER')
    && park.includes('pocketParkHull')
    && park.includes('InstancedMesh')
    && !park.includes('planDirtBlades')
    && constants.includes("POCKET_PARK_HULL_COLLIDER = 'ground'"));
  ok('did not ship gardenPark.js / pocketLawn.js',
    !existsSync(join(here, 'landmarks/gardenPark.js'))
    && !existsSync(join(here, 'gardenPark.js'))
    && !existsSync(join(here, 'landmarks/pocketLawn.js'))
    && existsSync(join(here, 'landmarks/pocketPark.js')));
  ok('leftoverGrass was not restacked',
    grass.includes('Tiny Glade') && grass.includes('grow-to-gap')
    && grass.includes('leftover-city') && grass.includes('267')
    && grass.includes('Desi') && grass.includes('St. Augustine')
    && grass.includes('8–12k')
    && !grass.includes('pocketPark') && !grass.includes('POCKET_PARK_'));
  ok('gardenPath was not restacked',
    garden.includes('Tiny Glade') && garden.includes('two-abreast')
    && garden.includes('grass hull') && garden.includes('grow-to-gap')
    && garden.includes('268') && garden.includes('Desi')
    && !garden.includes('pocketPark') && !garden.includes('POCKET_PARK_')
    && !garden.includes('leftoverGrass') && !garden.includes('LEFTOVER_GRASS_')
    && !garden.includes('gardenBench') && !garden.includes('GARDEN_BENCH_'));
  ok('gardenBench was not restacked',
    bench.includes('Tiny Glade') && bench.includes('3-seat slat')
    && bench.includes('Sit-box is a void') && bench.includes('276')
    && !bench.includes('pocketPark') && !bench.includes('POCKET_PARK_')
    && !bench.includes('leftoverGrass') && !bench.includes('LEFTOVER_GRASS_')
    && !bench.includes('planDirtBlades') && !bench.includes('gardenPathGrassHull'));
  ok('leftoverLot A/B/C/D were not restacked',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z)')
    && leftover.includes('leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)')
    && leftover.includes('chain-link') && leftover.includes('weenie')
    && !leftover.includes('pocketPark') && !leftover.includes('POCKET_PARK_')
    && !leftover.includes('leftoverGrass') && !leftover.includes('LEFTOVER_GRASS_')
    && !leftover.includes('gardenPath') && !leftover.includes('GARDEN_PATH_')
    && !leftover.includes('gardenBench') && !leftover.includes('GARDEN_BENCH_')
    && constants.includes('258/84') && constants.includes('295/84')
    && constants.includes('313/84') && constants.includes('330/84')
    && constants.includes('268→284') && constants.includes('276 / 82.4')
    && constants.includes('267–285') && constants.includes('276/92'));
  ok('house was not restacked',
    house.includes('housePlanGeom') && house.includes('weenie')
    && !house.includes('pocketPark') && !house.includes('POCKET_PARK_'));
  ok('warehouse was not restacked',
    warehouse.includes('warehouseAisleGeom') && warehouse.includes('buildRacks')
    && !warehouse.includes('pocketPark') && !warehouse.includes('POCKET_PARK_'));
  ok('drop was not restacked',
    drop.includes('dropHoistGeom') && drop.includes('buildWell')
    && !drop.includes('pocketPark') && !drop.includes('POCKET_PARK_'));
  ok('abando was not restacked',
    abando.includes('abandoStairGeom') && abando.includes('buildSilo')
    && !abando.includes('pocketPark') && !abando.includes('POCKET_PARK_'));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust')
    && !blades.includes('pocketPark'));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !water.includes('pocketPark'));
  ok('preview.html was not restacked',
    preview.includes('url=./') && !preview.includes('pocketPark'));
  ok('follow.js was not restacked',
    follow.includes('hauntFollowPath') && !follow.includes('pocketPark'));
  ok('checkpoints.js was not restacked',
    checkpoints.includes('RESTART_OFFSET') && !checkpoints.includes('pocketPark'));
  ok('quad.js GRAVITY stays 9.81',
    /const GRAVITY = 9\.81/.test(quad) && !quad.includes('pocketPark'));
  ok('planting.js was not restacked',
    planting.includes('export function tryPlace')
    && planting.includes('export function tessellateHull')
    && !planting.includes('pocketPark') && !planting.includes('POCKET_PARK_')
    && !planting.includes('leftoverGrass') && !planting.includes('LEFTOVER_GRASS_')
    && !planting.includes('gardenBench') && !planting.includes('GARDEN_BENCH_')
    && !planting.includes('gardenPath') && !planting.includes('GARDEN_PATH_')
    && !planting.includes('leftoverLot'));

  if (fails.length) {
    console.error('[miami-pocketPark] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-pocketPark] ok', passedCount, 'checks',
      `placed=${field.placed.length}/${plannedN}`);
  }
  return {
    passed: fails.length === 0,
    fails,
    passedCount,
    placed: field.placed.length,
    planned: plannedN,
  };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('pocketParkTest.js');
if (isMain) {
  const r = runMiamiPocketParkTests();
  if (!r.passed) process.exit(1);
}
