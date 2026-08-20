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
  POCKET_PARK_E_X0, POCKET_PARK_E_X1, POCKET_PARK_E_Z0, POCKET_PARK_E_Z1,
  POCKET_PARK_E_X, POCKET_PARK_E_Z, POCKET_PARK_E_W, POCKET_PARK_E_D,
  POCKET_PARK_E_INSTANCES_MIN, POCKET_PARK_E_INSTANCES_MAX,
  POCKET_PARK_F_X0, POCKET_PARK_F_X1, POCKET_PARK_F_Z0, POCKET_PARK_F_Z1,
  POCKET_PARK_F_X, POCKET_PARK_F_Z, POCKET_PARK_F_W, POCKET_PARK_F_D,
  POCKET_PARK_F_INSTANCES_MIN, POCKET_PARK_F_INSTANCES_MAX,
  POCKET_PARK_G_X0, POCKET_PARK_G_X1, POCKET_PARK_G_Z0, POCKET_PARK_G_Z1,
  POCKET_PARK_G_X, POCKET_PARK_G_Z, POCKET_PARK_G_W, POCKET_PARK_G_D,
  POCKET_PARK_G_INSTANCES_MIN, POCKET_PARK_G_INSTANCES_MAX,
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
  LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z, LEFTOVER_LOT_E_X0, LEFTOVER_LOT_E_X1,
  LEFTOVER_LOT_E_Z0, LEFTOVER_LOT_E_Z1,
  LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z, LEFTOVER_LOT_F_X0, LEFTOVER_LOT_F_X1,
  LEFTOVER_LOT_F_Z0, LEFTOVER_LOT_F_Z1, LEFTOVER_LOT_F_W, LEFTOVER_LOT_F_D,
  LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z, LEFTOVER_LOT_G_X0, LEFTOVER_LOT_G_X1,
  LEFTOVER_LOT_G_Z0, LEFTOVER_LOT_G_Z1, LEFTOVER_LOT_G_W, LEFTOVER_LOT_G_D,
  WAREHOUSE_X, WAREHOUSE_Z,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, inReserved, groundHeight, streetOverlap,
  leftoverLotGeom, pocketParkHull, pocketParkArea,
  pocketParkDrop, pocketParkLean, pocketParkPlannedCount,
  pocketParkRejected, pocketParkColliderShapes, inPocketPark,
  inGardenPath, inLeftoverLotReserved, leftoverLotOverlap,
  inWarehouseReserved, warehouseOverlap, inHelipadReserved,
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

function placePocketPark(ctx, cx = POCKET_PARK_X, cz = POCKET_PARK_Z) {
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

export function runMiamiPocketParkTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const hull = pocketParkHull();
  const hullE = pocketParkHull(POCKET_PARK_E_X, POCKET_PARK_E_Z);
  const hullF = pocketParkHull(POCKET_PARK_F_X, POCKET_PARK_F_Z);
  const hullG = pocketParkHull(POCKET_PARK_G_X, POCKET_PARK_G_Z);
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
  ok('leftoverLot E stays 347/84', LEFTOVER_LOT_E_X === 347 && LEFTOVER_LOT_E_Z === 84);
  ok('leftoverLot F stays 364/84', LEFTOVER_LOT_F_X === 364 && LEFTOVER_LOT_F_Z === 84);
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
  ok('leftoverLot E geometry was not slid',
    LEFTOVER_LOT_E_X0 === 340 && LEFTOVER_LOT_E_X1 === 354
    && LEFTOVER_LOT_E_Z0 === 78 && LEFTOVER_LOT_E_Z1 === 90);
  ok('leftoverLot F geometry was not slid',
    LEFTOVER_LOT_F_X0 === 357 && LEFTOVER_LOT_F_X1 === 371
    && LEFTOVER_LOT_F_Z0 === 78 && LEFTOVER_LOT_F_Z1 === 90);
  ok('tryPlace still drops leftoverLot A/B/C/D',
    tryPlace(ctx, LEFTOVER_LOT_X, LEFTOVER_LOT_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z) === 0);
  ok('tryPlace still drops leftoverLot E',
    tryPlace(ctx, LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z) === 0);
  ok('tryPlace still drops leftoverLot F',
    tryPlace(ctx, LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z) === 0);
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
  ok('pocketParkDrop rejects leftoverLot E',
    pocketParkDrop(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z)
    && inLeftoverLotReserved(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z));
  ok('pocketParkDrop rejects leftoverLot F',
    pocketParkDrop(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z)
    && inLeftoverLotReserved(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z));
  ok('pocketParkDrop rejects leftoverLot G',
    pocketParkDrop(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z)
    && inLeftoverLotReserved(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z));
  ok('pocketParkDrop rejects the warehouse',
    pocketParkDrop(WAREHOUSE_X, WAREHOUSE_Z)
    && inWarehouseReserved(WAREHOUSE_X, WAREHOUSE_Z));
  ok('pocketParkDrop rejects helipad E (~430/70)',
    pocketParkDrop(430, 70) && inHelipadReserved(430, 70)
    && inReserved(430, 70));
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
  const aabb276 = aabbs.find((s) => s.x === POCKET_PARK_X && s.z === POCKET_PARK_Z);
  ok('one thin grade hull collider',
    !!aabb276 && aabb276.part === 'grade'
    && aabb276.sy === POCKET_PARK_HULL_H
    && POCKET_PARK_HULL_H === 0.014);
  ok('grade hull covers the signed box',
    aabb276.sx === POCKET_PARK_W && aabb276.sz === POCKET_PARK_D
    && aabb276.x === POCKET_PARK_X && aabb276.z === POCKET_PARK_Z
    && aabb276.y0 === CITY_Y);
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
    aabbs.every((s) => s.part === 'grade') && !shapes.some((s) => s.part === 'blade'));

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
  ok('leftoverLot E was not restacked',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z)')
    && leftover.includes('347/84')
    && !leftover.includes('pocketParkE')
    && constants.includes('347/84'));
  ok('leftoverLot F was not restacked',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z)')
    && leftover.includes('364/84')
    && leftover.includes('leftoverLotFGeom fork')
    && leftover.includes('leftoverLotGeom(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z)')
    && leftover.includes('381/84')
    && leftover.includes('leftoverLotGGeom fork')
    && !leftover.includes('pocketParkF')
    && !leftover.includes('POCKET_PARK_F')
    && !leftover.includes('POCKET_PARK_G')
    && constants.includes('364/84')
    && constants.includes('LEFTOVER_LOT_F_X = 364')
    && constants.includes('LEFTOVER_LOT_F_Z = 84')
    && constants.includes('LEFTOVER_LOT_G_X = 381')
    && constants.includes('LEFTOVER_LOT_G_Z = 84')
    && !/export function leftoverLotFGeom/.test(constants)
    && !/leftoverLotFGeom\(/.test(constants)
    && !/export function leftoverLotGGeom/.test(constants)
    && !/leftoverLotGGeom\(/.test(constants));
  ok('leftoverLot G was not restacked',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z)')
    && leftover.includes('381/84')
    && leftover.includes('leftoverLotGGeom fork')
    && !leftover.includes('POCKET_PARK_G')
    && constants.includes('LEFTOVER_LOT_G_X = 381')
    && constants.includes('LEFTOVER_LOT_G_Z = 84')
    && constants.includes('LEFTOVER_LOT_G_X0 = 374')
    && constants.includes('LEFTOVER_LOT_G_X1 = 388')
    && constants.includes('LEFTOVER_LOT_G_Z0 = 78')
    && constants.includes('LEFTOVER_LOT_G_Z1 = 90')
    && !/export function leftoverLotGGeom/.test(constants)
    && !/leftoverLotGGeom\(/.test(constants));
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

  // ---- second hull at signed 347/96; same kit, not a fork ---------------
  ok('E cell is signed 347/96', POCKET_PARK_E_X === 347 && POCKET_PARK_E_Z === 96);
  ok('E plate is signed 16 × 8',
    POCKET_PARK_E_W === 16 && POCKET_PARK_E_D === 8
    && POCKET_PARK_E_X1 - POCKET_PARK_E_X0 === 16
    && POCKET_PARK_E_Z1 - POCKET_PARK_E_Z0 === 8
    && POCKET_PARK_E_W === POCKET_PARK_W && POCKET_PARK_E_D === POCKET_PARK_D);
  ok('E plate is signed 339–355 × 92–100',
    POCKET_PARK_E_X0 === 339 && POCKET_PARK_E_X1 === 355
    && POCKET_PARK_E_Z0 === 92 && POCKET_PARK_E_Z1 === 100);
  ok('E hull reuses pocketParkHull',
    hullE.x === 347 && hullE.z === 96
    && hullE.x0 === 339 && hullE.x1 === 355
    && hullE.z0 === 92 && hullE.z1 === 100
    && hullE.w === 16 && hullE.d === 8
    && hullE.collider === 'ground');
  ok('E is 2 m inland of leftoverLot E z1=90',
    LEFTOVER_LOT_E_Z1 === 90 && POCKET_PARK_E_Z0 === 92
    && POCKET_PARK_E_Z0 === LEFTOVER_LOT_E_Z1 + 2);
  ok('E is 1 m leftover apron past lot E, not a leftoverLotOverlap kiss',
    POCKET_PARK_E_X0 === 339 && LEFTOVER_LOT_E_X0 === 340
    && POCKET_PARK_E_X1 === 355 && LEFTOVER_LOT_E_X1 === 354
    && POCKET_PARK_E_X0 === LEFTOVER_LOT_E_X0 - 1
    && POCKET_PARK_E_X1 === LEFTOVER_LOT_E_X1 + 1
    && !leftoverLotOverlap(POCKET_PARK_E_X, POCKET_PARK_E_Z, POCKET_PARK_E_W, POCKET_PARK_E_D, 0.15)
    && !inLeftoverLotReserved(POCKET_PARK_E_X, POCKET_PARK_E_Z)
    && !inLeftoverLotReserved(POCKET_PARK_E_X0, POCKET_PARK_E_Z)
    && !inLeftoverLotReserved(POCKET_PARK_E_X1, POCKET_PARK_E_Z));
  ok('276 park stays 276/92 (x1=284 < 339)',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_X1 === 284 && POCKET_PARK_X1 < POCKET_PARK_E_X0
    && POCKET_PARK_E_X0 === 339
    && hull.x === 276 && hull.z === 92
    && hull.x0 === 268 && hull.x1 === 284);
  ok('A–E stay 258/295/313/330/347 at z=84',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_D_X === 330
    && LEFTOVER_LOT_E_X === 347
    && LEFTOVER_LOT_Z === 84 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_Z === 84 && LEFTOVER_LOT_D_Z === 84
    && LEFTOVER_LOT_E_Z === 84);
  ok('reuses pocketParkHull, no pocketParkEGeom',
    park.includes('pocketParkHull(POCKET_PARK_E_X, POCKET_PARK_E_Z)')
    && park.includes('pocketParkHull()')
    && constants.includes('export function pocketParkHull')
    && !/export function pocketParkEGeom/.test(constants)
    && !/function pocketParkEGeom/.test(park)
    && !/pocketParkEGeom\(/.test(constants)
    && !/pocketParkEGeom\(/.test(park)
    && !existsSync(join(here, 'landmarks/pocketParkE.js'))
    && !existsSync(join(here, 'pocketParkE.js')));
  ok('E plate is 128 m²',
    pocketParkArea(POCKET_PARK_E_X, POCKET_PARK_E_Z) === 128
    && Math.abs(hullArea(hullE) - 128) < 1e-9);
  ok('E plate is not pavement / street',
    !onPavement(POCKET_PARK_E_X, POCKET_PARK_E_Z)
    && !onBoardwalk(POCKET_PARK_E_X, POCKET_PARK_E_Z)
    && !onRoadway(POCKET_PARK_E_Z)
    && !onCrossStreet(POCKET_PARK_E_X, POCKET_PARK_E_Z)
    && !onSidewalk(POCKET_PARK_E_X, POCKET_PARK_E_Z)
    && !streetOverlap(POCKET_PARK_E_X, POCKET_PARK_E_Z, POCKET_PARK_E_W, POCKET_PARK_E_D));
  ok('E plate sits on leftover-city grade',
    groundHeight(POCKET_PARK_E_X, POCKET_PARK_E_Z) === CITY_Y);
  ok('E plate is reserved and a keepout',
    inReserved(POCKET_PARK_E_X, POCKET_PARK_E_Z)
    && inKeepout(POCKET_PARK_E_X, POCKET_PARK_E_Z));
  ok('inPocketPark covers both signed boxes',
    inPocketPark(POCKET_PARK_X, POCKET_PARK_Z)
    && inPocketPark(POCKET_PARK_E_X, POCKET_PARK_E_Z)
    && inPocketPark(POCKET_PARK_E_X0, POCKET_PARK_E_Z0)
    && inPocketPark(POCKET_PARK_E_X1, POCKET_PARK_E_Z1));
  ok('E signed plate is not rejected',
    !pocketParkRejected(POCKET_PARK_E_X, POCKET_PARK_E_Z)
    && !pocketParkRejected());
  ok('E hull does not overlap warehouse reserved',
    !warehouseOverlap(POCKET_PARK_E_X, POCKET_PARK_E_Z, POCKET_PARK_E_W, POCKET_PARK_E_D, 0.15)
    && !inWarehouseReserved(POCKET_PARK_E_X, POCKET_PARK_E_Z));

  const plannedE = pocketParkPlannedCount(POCKET_PARK_E_X, POCKET_PARK_E_Z);
  const fieldE = placePocketPark(ctx, POCKET_PARK_E_X, POCKET_PARK_E_Z);
  ok('E density is area × cover², not dirt 3.36',
    POCKET_PARK_COVER === 10
    && plannedE === 12800
    && plannedE === Math.round(128 * POCKET_PARK_COVER * POCKET_PARK_COVER)
    && POCKET_PARK_E_X === 347 && POCKET_PARK_E_Z === 96);
  ok('E plant from the grid',
    fieldE.cells.length === plannedE && fieldE.cells.length > 0);
  ok('E leftover after the 348.8→355 / z=98.5 east walk is 8000–11000, not 12800',
    fieldE.placed.length >= POCKET_PARK_E_INSTANCES_MIN
    && fieldE.placed.length <= POCKET_PARK_E_INSTANCES_MAX
    && POCKET_PARK_E_INSTANCES_MIN === 8000
    && POCKET_PARK_E_INSTANCES_MAX === 11000
    && fieldE.placed.length !== 12800
    && fieldE.placed.length < plannedE
    && POCKET_PARK_INSTANCES_MIN === 8000
    && POCKET_PARK_INSTANCES_MAX === 11000,
    `placedE=${fieldE.placed.length} plannedE=${plannedE}`);
  ok('276 leftover floor stays 8000–11000 after walks',
    field.placed.length >= POCKET_PARK_INSTANCES_MIN
    && field.placed.length <= POCKET_PARK_INSTANCES_MAX
    && POCKET_PARK_INSTANCES_MIN === 8000
    && POCKET_PARK_INSTANCES_MAX === 11000);
  ok('no E blade on a lot / helipad / warehouse / pavement',
    fieldE.placed.every((p) => !pocketParkDrop(p.x, p.z)
      && !onPavement(p.x, p.z)
      && !inLeftoverLotReserved(p.x, p.z)
      && !inWarehouseReserved(p.x, p.z)
      && !inHelipadReserved(p.x, p.z)));
  ok('E blades stay inside the E plate',
    fieldE.placed.every((p) => inPocketPark(p.x, p.z)
      && p.x >= POCKET_PARK_E_X0 && p.x <= POCKET_PARK_E_X1
      && p.z >= POCKET_PARK_E_Z0 && p.z <= POCKET_PARK_E_Z1));
  ok('E blade H is 0.12–0.22 m, thin grade hull only',
    POCKET_PARK_H_MIN === 0.12 && POCKET_PARK_H_MAX === 0.22
    && hullE.collider === 'ground'
    && POCKET_PARK_HULL_COLLIDER === 'ground');

  const aabbE = aabbs.find((s) => s.x === POCKET_PARK_E_X && s.z === POCKET_PARK_E_Z);
  ok('E thin grade hull collider',
    !!aabbE && aabbE.part === 'grade'
    && aabbE.sy === POCKET_PARK_HULL_H
    && aabbE.sx === POCKET_PARK_E_W && aabbE.sz === POCKET_PARK_E_D
    && aabbE.y0 === CITY_Y);
  ok('E thin hull exists at grade',
    !!probeBlocked(shapes, POCKET_PARK_E_X, CITY_Y + 0.006, POCKET_PARK_E_Z, 0.004));

  const nearFenceE = pocketParkLean(LEFTOVER_LOT_E_X1, 89);
  const midParkE = pocketParkLean(347, 96);
  ok('lean at leftoverLot E fence if it reaches',
    nearFenceE > midParkE && nearFenceE >= 0.14 && LEFTOVER_LOT_E_Z1 === 90);
  ok('mid-park-E lean is weak (2 m inland, fence does not reach)',
    midParkE === 0.04);

  ok('walks / 276 park / leftoverGrass stay put',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284 && GARDEN_PATH_Z === 84
    && POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_X0 === 268 && POCKET_PARK_X1 === 284
    && POCKET_PARK_Z0 === 88 && POCKET_PARK_Z1 === 96
    && LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0
    && GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('kit comment names the second hull, not a fork',
    park.includes('347/96') && park.includes('pocketParkEGeom fork')
    && park.includes('Not a slide of 276')
    && park.includes('leftoverLot A–G')
    && constants.includes('347/96')
    && constants.includes('never pocketParkEGeom'));

  // ---- third hull at signed 364/96; same kit, not a fork -----------------
  ok('F cell is signed 364/96', POCKET_PARK_F_X === 364 && POCKET_PARK_F_Z === 96);
  ok('F plate is signed 16 × 8',
    POCKET_PARK_F_W === 16 && POCKET_PARK_F_D === 8
    && POCKET_PARK_F_X1 - POCKET_PARK_F_X0 === 16
    && POCKET_PARK_F_Z1 - POCKET_PARK_F_Z0 === 8
    && POCKET_PARK_F_W === POCKET_PARK_W && POCKET_PARK_F_D === POCKET_PARK_D);
  ok('F plate is signed 356–372 × 92–100',
    POCKET_PARK_F_X0 === 356 && POCKET_PARK_F_X1 === 372
    && POCKET_PARK_F_Z0 === 92 && POCKET_PARK_F_Z1 === 100);
  ok('F hull reuses pocketParkHull',
    hullF.x === 364 && hullF.z === 96
    && hullF.x0 === 356 && hullF.x1 === 372
    && hullF.z0 === 92 && hullF.z1 === 100
    && hullF.w === 16 && hullF.d === 8
    && hullF.collider === 'ground');
  ok('F is 2 m inland of leftoverLot F z1=90',
    LEFTOVER_LOT_F_Z1 === 90 && POCKET_PARK_F_Z0 === 92
    && POCKET_PARK_F_Z0 === LEFTOVER_LOT_F_Z1 + 2);
  ok('F is 1 m leftover apron past lot F, leftoverLotOverlap of F reserved is 0',
    POCKET_PARK_F_X0 === 356 && LEFTOVER_LOT_F_X0 === 357
    && POCKET_PARK_F_X1 === 372 && LEFTOVER_LOT_F_X1 === 371
    && POCKET_PARK_F_X0 === LEFTOVER_LOT_F_X0 - 1
    && POCKET_PARK_F_X1 === LEFTOVER_LOT_F_X1 + 1
    && LEFTOVER_LOT_F_Z1 + 1.4 === 91.4
    && Math.abs((LEFTOVER_LOT_F_Z1 + 1.4) - POCKET_PARK_F_Z0 + 0.6) < 1e-9
    && !leftoverLotOverlap(POCKET_PARK_F_X, POCKET_PARK_F_Z, POCKET_PARK_F_W, POCKET_PARK_F_D, 0.15)
    && !inLeftoverLotReserved(POCKET_PARK_F_X, POCKET_PARK_F_Z)
    && !inLeftoverLotReserved(POCKET_PARK_F_X0, POCKET_PARK_F_Z)
    && !inLeftoverLotReserved(POCKET_PARK_F_X1, POCKET_PARK_F_Z));
  ok('leftoverLotOverlap vs leftoverLot E reserved is oz-negative',
    !leftoverLotOverlap(POCKET_PARK_F_X, POCKET_PARK_F_Z, POCKET_PARK_F_W, POCKET_PARK_F_D, 0.15)
    && POCKET_PARK_F_X0 === 356 && LEFTOVER_LOT_E_X1 + 1.8 === 355.8);
  ok('E-park x1=355 must not merge with this hull',
    POCKET_PARK_E_X1 === 355 && POCKET_PARK_F_X0 === 356
    && POCKET_PARK_F_X0 === POCKET_PARK_E_X1 + 1
    && POCKET_PARK_E_Z0 === POCKET_PARK_F_Z0
    && POCKET_PARK_E_Z1 === POCKET_PARK_F_Z1
    && hullE.x1 === 355 && hullF.x0 === 356
    && hullE.x1 < hullF.x0);
  ok('276 park stays 276/92 (x1=284 < 339)',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_X1 === 284 && POCKET_PARK_X1 < POCKET_PARK_E_X0
    && hull.x === 276 && hull.z === 92);
  ok('347 park stays 347/96 (x1=355 < 356)',
    POCKET_PARK_E_X === 347 && POCKET_PARK_E_Z === 96
    && POCKET_PARK_E_X1 === 355 && POCKET_PARK_E_X1 < POCKET_PARK_F_X0
    && hullE.x === 347 && hullE.z === 96);
  ok('A–F stay 258/295/313/330/347/364 at z=84',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_D_X === 330
    && LEFTOVER_LOT_E_X === 347 && LEFTOVER_LOT_F_X === 364
    && LEFTOVER_LOT_Z === 84 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_Z === 84 && LEFTOVER_LOT_D_Z === 84
    && LEFTOVER_LOT_E_Z === 84 && LEFTOVER_LOT_F_Z === 84);
  ok('reuses pocketParkHull, no pocketParkFGeom',
    park.includes('pocketParkHull(POCKET_PARK_F_X, POCKET_PARK_F_Z)')
    && park.includes('pocketParkHull(POCKET_PARK_E_X, POCKET_PARK_E_Z)')
    && park.includes('pocketParkHull()')
    && constants.includes('export function pocketParkHull')
    && !/export function pocketParkFGeom/.test(constants)
    && !/function pocketParkFGeom/.test(park)
    && !/pocketParkFGeom\(/.test(constants)
    && !/pocketParkFGeom\(/.test(park)
    && !existsSync(join(here, 'landmarks/pocketParkF.js'))
    && !existsSync(join(here, 'pocketParkF.js')));
  ok('F plate is 128 m²',
    pocketParkArea(POCKET_PARK_F_X, POCKET_PARK_F_Z) === 128
    && Math.abs(hullArea(hullF) - 128) < 1e-9);
  ok('F plate is not pavement / street',
    !onPavement(POCKET_PARK_F_X, POCKET_PARK_F_Z)
    && !onBoardwalk(POCKET_PARK_F_X, POCKET_PARK_F_Z)
    && !onRoadway(POCKET_PARK_F_Z)
    && !onCrossStreet(POCKET_PARK_F_X, POCKET_PARK_F_Z)
    && !onSidewalk(POCKET_PARK_F_X, POCKET_PARK_F_Z)
    && !streetOverlap(POCKET_PARK_F_X, POCKET_PARK_F_Z, POCKET_PARK_F_W, POCKET_PARK_F_D));
  ok('F plate sits on leftover-city grade',
    groundHeight(POCKET_PARK_F_X, POCKET_PARK_F_Z) === CITY_Y);
  ok('F plate is reserved and a keepout',
    inReserved(POCKET_PARK_F_X, POCKET_PARK_F_Z)
    && inKeepout(POCKET_PARK_F_X, POCKET_PARK_F_Z));
  ok('inPocketPark covers all three signed boxes',
    inPocketPark(POCKET_PARK_X, POCKET_PARK_Z)
    && inPocketPark(POCKET_PARK_E_X, POCKET_PARK_E_Z)
    && inPocketPark(POCKET_PARK_F_X, POCKET_PARK_F_Z)
    && inPocketPark(POCKET_PARK_F_X0, POCKET_PARK_F_Z0)
    && inPocketPark(POCKET_PARK_F_X1, POCKET_PARK_F_Z1));
  ok('F signed plate is not rejected',
    !pocketParkRejected(POCKET_PARK_F_X, POCKET_PARK_F_Z)
    && !pocketParkRejected(POCKET_PARK_E_X, POCKET_PARK_E_Z)
    && !pocketParkRejected());
  ok('pocketParkRejected fails leftoverLot A–G kiss / warehouse / helipad / pavement / street',
    leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, 14, 12)
    && leftoverLotOverlap(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z, 14, 12)
    && leftoverLotOverlap(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z, 14, 12)
    && leftoverLotOverlap(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z, 14, 12)
    && leftoverLotOverlap(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z, 14, 12)
    && leftoverLotOverlap(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z, LEFTOVER_LOT_F_W, LEFTOVER_LOT_F_D)
    && leftoverLotOverlap(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z, LEFTOVER_LOT_G_W, LEFTOVER_LOT_G_D)
    && pocketParkRejected(LEFTOVER_LOT_X, LEFTOVER_LOT_Z)
    && pocketParkRejected(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z)
    && pocketParkRejected(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)
    && pocketParkRejected(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z)
    && pocketParkRejected(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z)
    && pocketParkRejected(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z)
    && pocketParkRejected(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z)
    && pocketParkRejected(WAREHOUSE_X, WAREHOUSE_Z)
    && pocketParkRejected(430, 70)
    && pocketParkRejected(0, 27)
    && streetOverlap(57, 80, 20, 20));
  ok('F hull does not overlap warehouse / helipad reserved',
    !warehouseOverlap(POCKET_PARK_F_X, POCKET_PARK_F_Z, POCKET_PARK_F_W, POCKET_PARK_F_D, 0.15)
    && !inWarehouseReserved(POCKET_PARK_F_X, POCKET_PARK_F_Z)
    && !inHelipadReserved(POCKET_PARK_F_X, POCKET_PARK_F_Z)
    && inHelipadReserved(430, 70));

  const plannedF = pocketParkPlannedCount(POCKET_PARK_F_X, POCKET_PARK_F_Z);
  const fieldF = placePocketPark(ctx, POCKET_PARK_F_X, POCKET_PARK_F_Z);
  ok('F density is area × cover², not dirt 3.36',
    POCKET_PARK_COVER === 10
    && plannedF === 12800
    && plannedF === Math.round(128 * POCKET_PARK_COVER * POCKET_PARK_COVER)
    && POCKET_PARK_F_X === 364 && POCKET_PARK_F_Z === 96);
  ok('F plant from the grid',
    fieldF.cells.length === plannedF && fieldF.cells.length > 0);
  ok('F leftover after the 347 kit +17 m walks is 8000–11000, below 12800',
    fieldF.placed.length >= POCKET_PARK_F_INSTANCES_MIN
    && fieldF.placed.length <= POCKET_PARK_F_INSTANCES_MAX
    && POCKET_PARK_F_INSTANCES_MIN === 8000
    && POCKET_PARK_F_INSTANCES_MAX === 11000
    && fieldF.placed.length !== POCKET_PARK_F_INSTANCES_MAX
    && fieldF.placed.length < 12800
    && fieldF.placed.length !== 12800
    && plannedF === 12800,
    `placedF=${fieldF.placed.length} plannedF=${plannedF}`);
  ok('E leftover floor stays 8000–11000 after walks',
    fieldE.placed.length >= POCKET_PARK_E_INSTANCES_MIN
    && fieldE.placed.length <= POCKET_PARK_E_INSTANCES_MAX
    && POCKET_PARK_E_INSTANCES_MIN === 8000
    && POCKET_PARK_E_INSTANCES_MAX === 11000);
  ok('276 leftover floor stays 8000–11000 after F hull',
    field.placed.length >= POCKET_PARK_INSTANCES_MIN
    && field.placed.length <= POCKET_PARK_INSTANCES_MAX
    && POCKET_PARK_INSTANCES_MIN === 8000
    && POCKET_PARK_INSTANCES_MAX === 11000);
  ok('no F blade on a lot / helipad / warehouse / pavement',
    fieldF.placed.every((p) => !pocketParkDrop(p.x, p.z)
      && !onPavement(p.x, p.z)
      && !inLeftoverLotReserved(p.x, p.z)
      && !inWarehouseReserved(p.x, p.z)
      && !inHelipadReserved(p.x, p.z)));
  ok('F blades stay inside the F plate',
    fieldF.placed.every((p) => inPocketPark(p.x, p.z)
      && p.x >= POCKET_PARK_F_X0 && p.x <= POCKET_PARK_F_X1
      && p.z >= POCKET_PARK_F_Z0 && p.z <= POCKET_PARK_F_Z1));
  ok('F blade H is 0.12–0.22 m, thin grade hull only',
    POCKET_PARK_H_MIN === 0.12 && POCKET_PARK_H_MAX === 0.22
    && hullF.collider === 'ground'
    && POCKET_PARK_HULL_COLLIDER === 'ground');

  const aabbF = aabbs.find((s) => s.x === POCKET_PARK_F_X && s.z === POCKET_PARK_F_Z);
  ok('F thin grade hull collider is its own plate, not merged with E',
    !!aabbF && aabbF.part === 'grade'
    && aabbF.sy === POCKET_PARK_HULL_H
    && aabbF.sx === POCKET_PARK_F_W && aabbF.sz === POCKET_PARK_F_D
    && aabbF.y0 === CITY_Y
    && !!aabbE     && aabbE.x === 347 && aabbF.x === 364
    && aabbs.length === 4);
  ok('F thin hull exists at grade',
    !!probeBlocked(shapes, POCKET_PARK_F_X, CITY_Y + 0.006, POCKET_PARK_F_Z, 0.004));

  const nearFenceF = pocketParkLean(LEFTOVER_LOT_F_X1, 89);
  const midParkF = pocketParkLean(364, 96);
  ok('lean at leftoverLot F fence if it reaches',
    nearFenceF > midParkF && nearFenceF >= 0.14 && LEFTOVER_LOT_F_Z1 === 90);
  ok('mid-park-F lean is weak (2 m inland, fence does not reach)',
    midParkF === 0.04);

  ok('walks / 276 park / 347 park / leftoverGrass stay put',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284 && GARDEN_PATH_Z === 84
    && POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_X0 === 268 && POCKET_PARK_X1 === 284
    && POCKET_PARK_Z0 === 88 && POCKET_PARK_Z1 === 96
    && POCKET_PARK_E_X === 347 && POCKET_PARK_E_Z === 96
    && POCKET_PARK_E_X0 === 339 && POCKET_PARK_E_X1 === 355
    && POCKET_PARK_E_Z0 === 92 && POCKET_PARK_E_Z1 === 100
    && LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0
    && GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('kit comment names the third hull, not a fork',
    park.includes('364/96') && park.includes('pocketParkFGeom fork')
    && park.includes('leftoverLotOverlap of F')
    && park.includes('E-park x1=355')
    && park.includes('leftoverLot A–G')
    && constants.includes('364/96')
    && constants.includes('never pocketParkFGeom')
    && constants.includes('leftoverLotOverlap of F reserved is 0')
    && constants.includes('E-park x1=355 must not merge'));

  // ---- fourth hull at signed 381/96; same kit, not a fork -----------------
  ok('G cell is signed 381/96', POCKET_PARK_G_X === 381 && POCKET_PARK_G_Z === 96);
  ok('G plate is signed 16 × 8',
    POCKET_PARK_G_W === 16 && POCKET_PARK_G_D === 8
    && POCKET_PARK_G_X1 - POCKET_PARK_G_X0 === 16
    && POCKET_PARK_G_Z1 - POCKET_PARK_G_Z0 === 8
    && POCKET_PARK_G_W === POCKET_PARK_W && POCKET_PARK_G_D === POCKET_PARK_D);
  ok('G plate is signed 373–389 × 92–100',
    POCKET_PARK_G_X0 === 373 && POCKET_PARK_G_X1 === 389
    && POCKET_PARK_G_Z0 === 92 && POCKET_PARK_G_Z1 === 100);
  ok('G hull reuses pocketParkHull',
    hullG.x === 381 && hullG.z === 96
    && hullG.x0 === 373 && hullG.x1 === 389
    && hullG.z0 === 92 && hullG.z1 === 100
    && hullG.w === 16 && hullG.d === 8
    && hullG.collider === 'ground');
  ok('G is 2 m inland of leftoverLot G z1=90',
    LEFTOVER_LOT_G_Z1 === 90 && POCKET_PARK_G_Z0 === 92
    && POCKET_PARK_G_Z0 === LEFTOVER_LOT_G_Z1 + 2);
  ok('G is 1 m leftover apron past lot G, leftoverLotOverlap of G reserved is 0',
    POCKET_PARK_G_X0 === 373 && LEFTOVER_LOT_G_X0 === 374
    && POCKET_PARK_G_X1 === 389 && LEFTOVER_LOT_G_X1 === 388
    && POCKET_PARK_G_X0 === LEFTOVER_LOT_G_X0 - 1
    && POCKET_PARK_G_X1 === LEFTOVER_LOT_G_X1 + 1
    && LEFTOVER_LOT_G_Z1 + 1.4 === 91.4
    && Math.abs((LEFTOVER_LOT_G_Z1 + 1.4) - POCKET_PARK_G_Z0 + 0.6) < 1e-9
    && !leftoverLotOverlap(POCKET_PARK_G_X, POCKET_PARK_G_Z, POCKET_PARK_G_W, POCKET_PARK_G_D, 0.15)
    && !inLeftoverLotReserved(POCKET_PARK_G_X, POCKET_PARK_G_Z)
    && !inLeftoverLotReserved(POCKET_PARK_G_X0, POCKET_PARK_G_Z)
    && !inLeftoverLotReserved(POCKET_PARK_G_X1, POCKET_PARK_G_Z));
  ok('leftoverLotOverlap vs leftoverLot F reserved is oz-negative',
    !leftoverLotOverlap(POCKET_PARK_G_X, POCKET_PARK_G_Z, POCKET_PARK_G_W, POCKET_PARK_G_D, 0.15)
    && POCKET_PARK_G_X0 === 373 && LEFTOVER_LOT_F_X1 + 1.8 === 372.8);
  ok('F-park x1=372 must not merge with this hull',
    POCKET_PARK_F_X1 === 372 && POCKET_PARK_G_X0 === 373
    && POCKET_PARK_G_X0 === POCKET_PARK_F_X1 + 1
    && POCKET_PARK_F_Z0 === POCKET_PARK_G_Z0
    && POCKET_PARK_F_Z1 === POCKET_PARK_G_Z1
    && hullF.x1 === 372 && hullG.x0 === 373
    && hullF.x1 < hullG.x0);
  ok('276 park stays 276/92 (x1=284 < 339)',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_X1 === 284 && POCKET_PARK_X1 < POCKET_PARK_E_X0
    && hull.x === 276 && hull.z === 92);
  ok('347 park stays 347/96 (x1=355 < 356)',
    POCKET_PARK_E_X === 347 && POCKET_PARK_E_Z === 96
    && POCKET_PARK_E_X1 === 355 && POCKET_PARK_E_X1 < POCKET_PARK_F_X0
    && hullE.x === 347 && hullE.z === 96);
  ok('364 park stays 364/96 (x1=372 < 373)',
    POCKET_PARK_F_X === 364 && POCKET_PARK_F_Z === 96
    && POCKET_PARK_F_X1 === 372 && POCKET_PARK_F_X1 < POCKET_PARK_G_X0
    && hullF.x === 364 && hullF.z === 96);
  ok('A–G stay 258/295/313/330/347/364/381 at z=84',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295
    && LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_D_X === 330
    && LEFTOVER_LOT_E_X === 347 && LEFTOVER_LOT_F_X === 364
    && LEFTOVER_LOT_G_X === 381
    && LEFTOVER_LOT_Z === 84 && LEFTOVER_LOT_B_Z === 84
    && LEFTOVER_LOT_C_Z === 84 && LEFTOVER_LOT_D_Z === 84
    && LEFTOVER_LOT_E_Z === 84 && LEFTOVER_LOT_F_Z === 84
    && LEFTOVER_LOT_G_Z === 84);
  ok('reuses pocketParkHull, no pocketParkGGeom',
    park.includes('pocketParkHull(POCKET_PARK_G_X, POCKET_PARK_G_Z)')
    && park.includes('pocketParkHull(POCKET_PARK_F_X, POCKET_PARK_F_Z)')
    && park.includes('pocketParkHull(POCKET_PARK_E_X, POCKET_PARK_E_Z)')
    && park.includes('pocketParkHull()')
    && constants.includes('export function pocketParkHull')
    && !/export function pocketParkGGeom/.test(constants)
    && !/function pocketParkGGeom/.test(park)
    && !/pocketParkGGeom\(/.test(constants)
    && !/pocketParkGGeom\(/.test(park)
    && !existsSync(join(here, 'landmarks/pocketParkG.js'))
    && !existsSync(join(here, 'pocketParkG.js')));
  ok('G plate is 128 m²',
    pocketParkArea(POCKET_PARK_G_X, POCKET_PARK_G_Z) === 128
    && Math.abs(hullArea(hullG) - 128) < 1e-9);
  ok('G plate is not pavement / street',
    !onPavement(POCKET_PARK_G_X, POCKET_PARK_G_Z)
    && !onBoardwalk(POCKET_PARK_G_X, POCKET_PARK_G_Z)
    && !onRoadway(POCKET_PARK_G_Z)
    && !onCrossStreet(POCKET_PARK_G_X, POCKET_PARK_G_Z)
    && !onSidewalk(POCKET_PARK_G_X, POCKET_PARK_G_Z)
    && !streetOverlap(POCKET_PARK_G_X, POCKET_PARK_G_Z, POCKET_PARK_G_W, POCKET_PARK_G_D));
  ok('G plate sits on leftover-city grade',
    groundHeight(POCKET_PARK_G_X, POCKET_PARK_G_Z) === CITY_Y);
  ok('G plate is reserved and a keepout',
    inReserved(POCKET_PARK_G_X, POCKET_PARK_G_Z)
    && inKeepout(POCKET_PARK_G_X, POCKET_PARK_G_Z));
  ok('inPocketPark covers all four signed boxes',
    inPocketPark(POCKET_PARK_X, POCKET_PARK_Z)
    && inPocketPark(POCKET_PARK_E_X, POCKET_PARK_E_Z)
    && inPocketPark(POCKET_PARK_F_X, POCKET_PARK_F_Z)
    && inPocketPark(POCKET_PARK_G_X, POCKET_PARK_G_Z)
    && inPocketPark(POCKET_PARK_G_X0, POCKET_PARK_G_Z0)
    && inPocketPark(POCKET_PARK_G_X1, POCKET_PARK_G_Z1));
  ok('G signed plate is not rejected',
    !pocketParkRejected(POCKET_PARK_G_X, POCKET_PARK_G_Z)
    && !pocketParkRejected(POCKET_PARK_F_X, POCKET_PARK_F_Z)
    && !pocketParkRejected(POCKET_PARK_E_X, POCKET_PARK_E_Z)
    && !pocketParkRejected());
  ok('pocketParkRejected fails leftoverLot A–G kiss / warehouse / helipad / pavement / street',
    leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, 14, 12)
    && leftoverLotOverlap(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z, 14, 12)
    && leftoverLotOverlap(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z, 14, 12)
    && leftoverLotOverlap(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z, 14, 12)
    && leftoverLotOverlap(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z, 14, 12)
    && leftoverLotOverlap(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z, LEFTOVER_LOT_F_W, LEFTOVER_LOT_F_D)
    && leftoverLotOverlap(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z, LEFTOVER_LOT_G_W, LEFTOVER_LOT_G_D)
    && pocketParkRejected(LEFTOVER_LOT_X, LEFTOVER_LOT_Z)
    && pocketParkRejected(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z)
    && pocketParkRejected(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)
    && pocketParkRejected(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z)
    && pocketParkRejected(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z)
    && pocketParkRejected(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z)
    && pocketParkRejected(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z)
    && pocketParkRejected(WAREHOUSE_X, WAREHOUSE_Z)
    && pocketParkRejected(430, 70)
    && pocketParkRejected(0, 27)
    && streetOverlap(57, 80, 20, 20));
  ok('G hull does not overlap warehouse / helipad reserved',
    !warehouseOverlap(POCKET_PARK_G_X, POCKET_PARK_G_Z, POCKET_PARK_G_W, POCKET_PARK_G_D, 0.15)
    && !inWarehouseReserved(POCKET_PARK_G_X, POCKET_PARK_G_Z)
    && !inHelipadReserved(POCKET_PARK_G_X, POCKET_PARK_G_Z)
    && inHelipadReserved(430, 70));

  const plannedG = pocketParkPlannedCount(POCKET_PARK_G_X, POCKET_PARK_G_Z);
  const fieldG = placePocketPark(ctx, POCKET_PARK_G_X, POCKET_PARK_G_Z);
  ok('G density is area × cover², not dirt 3.36',
    POCKET_PARK_COVER === 10
    && plannedG === 12800
    && plannedG === Math.round(128 * POCKET_PARK_COVER * POCKET_PARK_COVER)
    && POCKET_PARK_G_X === 381 && POCKET_PARK_G_Z === 96);
  ok('G plant from the grid',
    fieldG.cells.length === plannedG && fieldG.cells.length > 0);
  ok('G leftover after the 364 kit +17 m walks is 8000–11000, below 12800',
    fieldG.placed.length >= POCKET_PARK_G_INSTANCES_MIN
    && fieldG.placed.length <= POCKET_PARK_G_INSTANCES_MAX
    && POCKET_PARK_G_INSTANCES_MIN === 8000
    && POCKET_PARK_G_INSTANCES_MAX === 11000
    && fieldG.placed.length !== POCKET_PARK_G_INSTANCES_MAX
    && fieldG.placed.length < 12800
    && fieldG.placed.length !== 12800
    && plannedG === 12800,
    `placedG=${fieldG.placed.length} plannedG=${plannedG}`);
  ok('F leftover floor stays 8000–11000 after walks',
    fieldF.placed.length >= POCKET_PARK_F_INSTANCES_MIN
    && fieldF.placed.length <= POCKET_PARK_F_INSTANCES_MAX
    && POCKET_PARK_F_INSTANCES_MIN === 8000
    && POCKET_PARK_F_INSTANCES_MAX === 11000);
  ok('E leftover floor stays 8000–11000 after walks',
    fieldE.placed.length >= POCKET_PARK_E_INSTANCES_MIN
    && fieldE.placed.length <= POCKET_PARK_E_INSTANCES_MAX
    && POCKET_PARK_E_INSTANCES_MIN === 8000
    && POCKET_PARK_E_INSTANCES_MAX === 11000);
  ok('276 leftover floor stays 8000–11000 after G hull',
    field.placed.length >= POCKET_PARK_INSTANCES_MIN
    && field.placed.length <= POCKET_PARK_INSTANCES_MAX
    && POCKET_PARK_INSTANCES_MIN === 8000
    && POCKET_PARK_INSTANCES_MAX === 11000);
  ok('no G blade on a lot / helipad / warehouse / pavement',
    fieldG.placed.every((p) => !pocketParkDrop(p.x, p.z)
      && !onPavement(p.x, p.z)
      && !inLeftoverLotReserved(p.x, p.z)
      && !inWarehouseReserved(p.x, p.z)
      && !inHelipadReserved(p.x, p.z)));
  ok('G blades stay inside the G plate',
    fieldG.placed.every((p) => inPocketPark(p.x, p.z)
      && p.x >= POCKET_PARK_G_X0 && p.x <= POCKET_PARK_G_X1
      && p.z >= POCKET_PARK_G_Z0 && p.z <= POCKET_PARK_G_Z1));
  ok('G blade H is 0.12–0.22 m, thin grade hull only',
    POCKET_PARK_H_MIN === 0.12 && POCKET_PARK_H_MAX === 0.22
    && hullG.collider === 'ground'
    && POCKET_PARK_HULL_COLLIDER === 'ground');

  const aabbG = aabbs.find((s) => s.x === POCKET_PARK_G_X && s.z === POCKET_PARK_G_Z);
  ok('G thin grade hull collider is its own plate, not merged with F',
    !!aabbG && aabbG.part === 'grade'
    && aabbG.sy === POCKET_PARK_HULL_H
    && aabbG.sx === POCKET_PARK_G_W && aabbG.sz === POCKET_PARK_G_D
    && aabbG.y0 === CITY_Y
    && !!aabbF && aabbF.x === 364 && aabbG.x === 381
    && aabbs.length === 4);
  ok('G thin hull exists at grade',
    !!probeBlocked(shapes, POCKET_PARK_G_X, CITY_Y + 0.006, POCKET_PARK_G_Z, 0.004));

  const nearFenceG = pocketParkLean(LEFTOVER_LOT_G_X1, 89);
  const midParkG = pocketParkLean(381, 96);
  ok('lean at leftoverLot G fence if it reaches',
    nearFenceG > midParkG && nearFenceG >= 0.14 && LEFTOVER_LOT_G_Z1 === 90);
  ok('mid-park-G lean is weak (2 m inland, fence does not reach)',
    midParkG === 0.04);

  ok('walks / 276 park / 347 park / 364 park / leftoverGrass stay put',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284 && GARDEN_PATH_Z === 84
    && POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_X0 === 268 && POCKET_PARK_X1 === 284
    && POCKET_PARK_Z0 === 88 && POCKET_PARK_Z1 === 96
    && POCKET_PARK_E_X === 347 && POCKET_PARK_E_Z === 96
    && POCKET_PARK_E_X0 === 339 && POCKET_PARK_E_X1 === 355
    && POCKET_PARK_E_Z0 === 92 && POCKET_PARK_E_Z1 === 100
    && POCKET_PARK_F_X === 364 && POCKET_PARK_F_Z === 96
    && POCKET_PARK_F_X0 === 356 && POCKET_PARK_F_X1 === 372
    && POCKET_PARK_F_Z0 === 92 && POCKET_PARK_F_Z1 === 100
    && LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0
    && GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('kit comment names the fourth hull, not a fork',
    park.includes('381/96') && park.includes('pocketParkGGeom fork')
    && park.includes('leftoverLotOverlap of G')
    && park.includes('F-park x1=372')
    && park.includes('leftoverLot A–G')
    && constants.includes('381/96')
    && constants.includes('never pocketParkGGeom')
    && constants.includes('leftoverLotOverlap of G reserved is 0')
    && constants.includes('F-park x1=372 must not merge'));

  if (fails.length) {
    console.error('[miami-pocketPark] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-pocketPark] ok', passedCount, 'checks',
      `placed=${field.placed.length}/${plannedN}`,
      `placedE=${fieldE.placed.length}/${plannedE}`,
      `placedF=${fieldF.placed.length}/${plannedF}`,
      `placedG=${fieldG.placed.length}/${plannedG}`);
  }
  return {
    passed: fails.length === 0,
    fails,
    passedCount,
    placed: field.placed.length,
    planned: plannedN,
    placedE: fieldE.placed.length,
    plannedE,
    placedF: fieldF.placed.length,
    plannedF,
    placedG: fieldG.placed.length,
    plannedG,
  };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('pocketParkTest.js');
if (isMain) {
  const r = runMiamiPocketParkTests();
  if (!r.passed) process.exit(1);
}
