// Headless checks for the Miami Tiny Glade leftover-city grass hull.
// No three.js, no game state. Not a haunt. Not leftoverLot. Not a path
// or bench restack.
//
//   node ./tools/run-miami-leftover-grass-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_Y,
  LEFTOVER_GRASS_X0, LEFTOVER_GRASS_X1, LEFTOVER_GRASS_Z0, LEFTOVER_GRASS_Z1,
  LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z, LEFTOVER_GRASS_W, LEFTOVER_GRASS_D,
  LEFTOVER_GRASS_AREA, LEFTOVER_GRASS_LEFTOVER,
  LEFTOVER_GRASS_H_MIN, LEFTOVER_GRASS_H_MAX, LEFTOVER_GRASS_LAWN_H,
  LEFTOVER_GRASS_COVER, LEFTOVER_GRASS_INSTANCES_MIN, LEFTOVER_GRASS_INSTANCES_MAX,
  LEFTOVER_GRASS_HULL_H, LEFTOVER_GRASS_HULL_COLLIDER,
  LEFTOVER_GRASS_PAD_AABB, LEFTOVER_GRASS_AABB,
  GARDEN_PATH_X, GARDEN_PATH_Z, GARDEN_PATH_W, GARDEN_PATH_LEN,
  GARDEN_PATH_X0, GARDEN_PATH_X1, GARDEN_PATH_Z0, GARDEN_PATH_Z1,
  GARDEN_PATH_JOINT_MIN, GARDEN_PATH_JOINT_MAX,
  GARDEN_BENCH_X, GARDEN_BENCH_Z, GARDEN_BENCH_W, GARDEN_BENCH_DEPTH,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_X0, LEFTOVER_LOT_X1,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z, LEFTOVER_LOT_B_X0, LEFTOVER_LOT_B_X1,
  LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z, LEFTOVER_LOT_C_X0, LEFTOVER_LOT_C_X1,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, groundHeight, streetOverlap,
  leftoverLotGeom, leftoverGrassHull, leftoverGrassArea, leftoverGrassLeftoverArea,
  leftoverGrassDrop, leftoverGrassLean, leftoverGrassPlannedCount,
  leftoverGrassRejected, leftoverGrassColliderShapes, inLeftoverGrass,
  gardenPathVoids, gardenPathSlabs, gardenBenchParts,
  inGardenPath, inGardenPathSlab, inGardenBench,
  inLeftoverLotReserved, leftoverLotOverlap,
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

function placeLeftoverGrass(ctx) {
  const hull = leftoverGrassHull();
  const cells = tessellateHull(hull, leftoverGrassPlannedCount());
  const placed = [];
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    if (leftoverGrassDrop(c.x, c.z)) {
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

export function runMiamiLeftoverGrassTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const hull = leftoverGrassHull();
  const shapes = leftoverGrassColliderShapes();
  const slabs = gardenPathSlabs();
  const voids = gardenPathVoids();
  const parts = gardenBenchParts();
  const geomA = leftoverLotGeom();

  // ---- signed hull (Desi + Reesy); do not invent or slide the box --------
  ok('hull is signed x 267–285', LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285);
  ok('hull is signed z 81.0–86.0', LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0);
  ok('hull width × depth is 18 × 5',
    LEFTOVER_GRASS_W === 18 && LEFTOVER_GRASS_D === 5
    && LEFTOVER_GRASS_X1 - LEFTOVER_GRASS_X0 === 18
    && Math.abs(LEFTOVER_GRASS_Z1 - LEFTOVER_GRASS_Z0 - 5) < 1e-9);
  ok('hull centre is 276 / 83.5',
    LEFTOVER_GRASS_X === 276 && LEFTOVER_GRASS_Z === 83.5);
  ok('geom matches signed constants',
    hull.x0 === 267 && hull.x1 === 285
    && hull.z0 === 81.0 && hull.z1 === 86.0
    && hull.x === 276 && hull.z === 83.5);
  ok('x/z were not invented or slid',
    hull.x0 === LEFTOVER_GRASS_X0 && hull.x1 === LEFTOVER_GRASS_X1
    && hull.z0 === LEFTOVER_GRASS_Z0 && hull.z1 === LEFTOVER_GRASS_Z1);

  ok('hull is ≈ 90 m²',
    LEFTOVER_GRASS_AREA === 90
    && leftoverGrassArea() === 90
    && Math.abs(hullArea(hull) - 90) < 1e-9);
  ok('leftover after path+bench is ≈ 63 m²',
    LEFTOVER_GRASS_LEFTOVER === 63
    && Math.abs(leftoverGrassLeftoverArea() - 63) < 1);

  ok('hull is not pavement', !onPavement(LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z));
  ok('hull is not boardwalk', !onBoardwalk(LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z));
  ok('hull is not roadway', !onRoadway(LEFTOVER_GRASS_Z));
  ok('hull is not a cross-street', !onCrossStreet(LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z));
  ok('hull is not a sidewalk slab', !onSidewalk(LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z));
  ok('hull sits on leftover-city grade',
    groundHeight(LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z) === CITY_Y);
  ok('hull is a keepout', inKeepout(LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z));
  ok('inLeftoverGrass covers the signed box',
    inLeftoverGrass(LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z)
    && inLeftoverGrass(LEFTOVER_GRASS_X0, LEFTOVER_GRASS_Z0)
    && inLeftoverGrass(LEFTOVER_GRASS_X1, LEFTOVER_GRASS_Z1));
  ok('signed hull is not rejected', !leftoverGrassRejected());
  ok('hull footprint is not in the street',
    !streetOverlap(LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z, LEFTOVER_GRASS_W, LEFTOVER_GRASS_D));

  // ---- path / lots / bench stay put --------------------------------------
  ok('path stays 268→284 / z=84 / 1.6 m',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284
    && GARDEN_PATH_Z === 84 && GARDEN_PATH_W === 1.6
    && GARDEN_PATH_LEN === 16 && GARDEN_PATH_X === 276
    && GARDEN_PATH_Z0 === 83.2 && GARDEN_PATH_Z1 === 84.8);
  ok('leftoverLot A stays 258/84', LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84);
  ok('leftoverLot B stays 295/84', LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84);
  ok('leftoverLot C stays 313/84', LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84);
  ok('bench stays 276 / 82.4', GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('path sits off leftoverLot A x1=265',
    GARDEN_PATH_X0 >= LEFTOVER_LOT_X1 && LEFTOVER_LOT_X1 === 265);
  ok('path sits off leftoverLot B x0=288',
    GARDEN_PATH_X1 <= LEFTOVER_LOT_B_X0 && LEFTOVER_LOT_B_X0 === 288);
  ok('hull sits just off leftoverLot A x1=265',
    LEFTOVER_GRASS_X0 > LEFTOVER_LOT_X1 && LEFTOVER_LOT_X1 === 265);
  ok('hull sits just off leftoverLot B x0=288',
    LEFTOVER_GRASS_X1 < LEFTOVER_LOT_B_X0 && LEFTOVER_LOT_B_X0 === 288);
  ok('hull does not overlap leftoverLot A/B/C reserved',
    !leftoverLotOverlap(LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z, LEFTOVER_GRASS_W, LEFTOVER_GRASS_D, 0.15)
    && !inLeftoverLotReserved(LEFTOVER_GRASS_X0, LEFTOVER_GRASS_Z)
    && !inLeftoverLotReserved(LEFTOVER_GRASS_X1, LEFTOVER_GRASS_Z));
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
  ok('tryPlace still drops the garden bench',
    tryPlace(ctx, GARDEN_BENCH_X, GARDEN_BENCH_Z) === 0);
  ok('tryPlace still drops pavement / street',
    tryPlace(ctx, 0, 27) === 0 && tryPlace(ctx, 57, 80) === 0);

  // ---- tryPlace drop on stones / lots / bench; grow into joints ----------
  const jointZ = voids.find((v) => v.id === 'gardenPath-joint-z');
  const jointX = voids.find((v) => v.id === 'gardenPath-joint-x');
  ok('path joints are 60–100 mm',
    GARDEN_PATH_JOINT_MIN === 0.06 && GARDEN_PATH_JOINT_MAX === 0.10
    && !!jointZ && !!jointX
    && jointZ.openW >= GARDEN_PATH_JOINT_MIN - 1e-9
    && jointZ.openW <= GARDEN_PATH_JOINT_MAX + 1e-9);
  ok('tryPlace drops a flagstone',
    !!slabs[0] && tryPlace(ctx, slabs[0].x, slabs[0].z) === 0);
  ok('leftoverGrassDrop rejects flagstones',
    leftoverGrassDrop(slabs[0].x, slabs[0].z)
    && leftoverGrassDrop(slabs[1].x, slabs[1].z));
  ok('leftoverGrassDrop rejects leftoverLot A/B/C',
    leftoverGrassDrop(LEFTOVER_LOT_X, LEFTOVER_LOT_Z)
    && leftoverGrassDrop(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z)
    && leftoverGrassDrop(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z));
  ok('leftoverGrassDrop rejects the bench plate',
    leftoverGrassDrop(GARDEN_BENCH_X, GARDEN_BENCH_Z)
    && inGardenBench(GARDEN_BENCH_X, GARDEN_BENCH_Z));
  ok('grow-to-gap keeps the path joints',
    !!jointZ && !!jointX
    && !leftoverGrassDrop(jointZ.x, jointZ.z)
    && !leftoverGrassDrop(jointX.x, jointX.z)
    && !inGardenPathSlab(jointZ.x, jointZ.z)
    && !inGardenPathSlab(jointX.x, jointX.z)
    && inGardenPath(jointZ.x, jointZ.z) && inGardenPath(jointX.x, jointX.z)
    && inLeftoverGrass(jointZ.x, jointZ.z));
  ok('leftover-city grade beside the path keeps',
    !leftoverGrassDrop(270, 81.5) && inLeftoverGrass(270, 81.5)
    && !inGardenPathSlab(270, 81.5) && !inGardenBench(270, 81.5));

  // ---- plant from the grid; 8–12k; not leftover-dirt density -------------
  const plannedN = leftoverGrassPlannedCount();
  const raw = Math.round(
    LEFTOVER_GRASS_LEFTOVER * LEFTOVER_GRASS_COVER * LEFTOVER_GRASS_COVER,
  );
  ok('density is leftover × cover², not dirt 3.36',
    LEFTOVER_GRASS_COVER === 12.6
    && raw >= LEFTOVER_GRASS_INSTANCES_MIN
    && raw <= LEFTOVER_GRASS_INSTANCES_MAX
    && plannedN > raw);
  ok('planned count is a grid over the signed hull',
    plannedN === Math.round(raw * leftoverGrassArea() / LEFTOVER_GRASS_LEFTOVER));

  const field = placeLeftoverGrass(ctx);
  ok('plant from the grid',
    field.cells.length === plannedN && field.cells.length > 0);
  ok('placed instances are ~8–12k',
    field.placed.length >= LEFTOVER_GRASS_INSTANCES_MIN
    && field.placed.length <= LEFTOVER_GRASS_INSTANCES_MAX,
    `placed=${field.placed.length} planned=${plannedN}`);
  ok('no placed blade on a stone / lot / bench / pavement',
    field.placed.every((p) => !leftoverGrassDrop(p.x, p.z)
      && !onPavement(p.x, p.z)
      && !inGardenPathSlab(p.x, p.z)
      && !inGardenBench(p.x, p.z)
      && !inLeftoverLotReserved(p.x, p.z)));
  ok('some blades grow into the joints',
    field.placed.some((p) => inGardenPath(p.x, p.z) && !inGardenPathSlab(p.x, p.z)));
  ok('blades stay inside the signed hull',
    field.placed.every((p) => inLeftoverGrass(p.x, p.z)));
  ok('not leftover-dirt 190k',
    field.placed.length < 20000 && plannedN < 20000
    && LEFTOVER_GRASS_INSTANCES_MAX === 12000);

  // ---- blade H 0.12–0.22 m; 50 mm lawn disappears ------------------------
  ok('blade H is 0.12–0.22 m',
    LEFTOVER_GRASS_H_MIN === 0.12 && LEFTOVER_GRASS_H_MAX === 0.22
    && LEFTOVER_GRASS_H_MIN < LEFTOVER_GRASS_H_MAX);
  ok('50 mm lawn is forbidden',
    LEFTOVER_GRASS_LAWN_H === 0.05
    && LEFTOVER_GRASS_H_MIN > LEFTOVER_GRASS_LAWN_H);

  // ---- lean at slabs / bench legs / leftoverLot fences -------------------
  const nearSlab = leftoverGrassLean(slabs[0].x0 - 0.04, slabs[0].z);
  const nearLeg = leftoverGrassLean(parts.legs[0].x, parts.legs[0].z + 0.12);
  const nearFenceA = leftoverGrassLean(LEFTOVER_GRASS_X0, 83.5);
  const nearFenceB = leftoverGrassLean(LEFTOVER_GRASS_X1, 83.5);
  const midYard = leftoverGrassLean(270, 81.5);
  ok('lean at a slab is stronger than mid-yard',
    nearSlab > midYard && nearSlab >= 0.14);
  ok('lean at a bench leg is stronger than mid-yard',
    nearLeg > midYard && nearLeg >= 0.14);
  ok('lean at leftoverLot A fence (x1=265)',
    nearFenceA >= 0.04 && LEFTOVER_LOT_X1 === 265);
  ok('lean at leftoverLot B fence (x0=288)',
    nearFenceB >= 0.04 && LEFTOVER_LOT_B_X0 === 288);
  ok('joint lean is grow-to-gap',
    leftoverGrassLean(jointZ.x, jointZ.z) >= 0.14);

  // ---- one thin grade hull collider; no 0.3 m pad; no per-blade ----------
  const aabbs = shapes.filter((s) => s.tag === 'leftoverGrass' && s.type === 'aabb');
  ok('one thin grade hull collider',
    aabbs.length === 1 && shapes.length === 1
    && aabbs[0].part === 'grade'
    && aabbs[0].sy === LEFTOVER_GRASS_HULL_H
    && LEFTOVER_GRASS_HULL_H === 0.014);
  ok('grade hull covers the signed box',
    aabbs[0].sx === LEFTOVER_GRASS_W && aabbs[0].sz === LEFTOVER_GRASS_D
    && aabbs[0].x === LEFTOVER_GRASS_X && aabbs[0].z === LEFTOVER_GRASS_Z
    && aabbs[0].y0 === CITY_Y);
  ok('hull collider is the ground',
    hull.collider === 'ground' && LEFTOVER_GRASS_HULL_COLLIDER === 'ground');
  ok('no filled grass AABB', LEFTOVER_GRASS_AABB === false);
  ok('a 0.3 m pad AABB fails',
    LEFTOVER_GRASS_PAD_AABB === 0.3
    && aabbs.every((s) => s.sy < LEFTOVER_GRASS_PAD_AABB)
    && !aabbs.some((s) => s.sy >= 0.3));
  ok('thin hull exists at grade',
    !!probeBlocked(shapes, LEFTOVER_GRASS_X, CITY_Y + 0.006, LEFTOVER_GRASS_Z, 0.004));
  ok('no per-blade colliders',
    shapes.length === 1 && !shapes.some((s) => s.part === 'blade'));

  // ---- one placer; no second scatterer; look locks -----------------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
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
  ok('leftoverGrass is not a second scatterer',
    !grass.includes('scatterModels') && !grass.includes('planDirtBlades'));
  ok('leftoverGrass does not invent a placer',
    !/export function tryPlace/.test(grass)
    && grass.includes('tryPlace')
    && grass.includes('tessellateHull')
    && grass.includes('onPavement'));
  ok('leftoverGrass rejects stones / lots / bench instead of remapping',
    grass.includes('leftoverGrassRejected()')
    && grass.includes('leftoverGrassDrop')
    && !/LEFTOVER_GRASS_X0\s*=/.test(grass)
    && !/LEFTOVER_GRASS_Z0\s*=/.test(grass));
  ok('index builds leftoverGrass on the keepout path after gardenBench',
    index.includes("from './landmarks/leftoverGrass.js'")
    && index.includes('buildLeftoverGrass(ctx)')
    && index.indexOf('buildLeftoverGrass') > index.indexOf('buildGardenBench')
    && index.indexOf('buildLeftoverGrass') < index.indexOf('buildBlades'));
  ok('no custom mat',
    !/\bShaderMaterial\b/.test(grass) && !/\bonBeforeCompile\b/.test(grass)
    && grass.includes('MeshStandardMaterial'));
  ok('kit is Tiny Glade grow-to-gap leftover-city hull',
    grass.includes('Tiny Glade') && grass.includes('grow-to-gap')
    && grass.includes('leftover-city') && grass.includes('267')
    && grass.includes('Desi') && grass.includes('St. Augustine')
    && grass.includes('8–12k')
    && !/Kenney|silo|hoistway|aisle/i.test(grass)
    && !grass.includes('planDirtBlades') && !grass.includes('dirtHulls'));
  ok('Sylva methods only, no per-blade colliders',
    grass.includes('Sylva') && grass.includes('LEFTOVER_GRASS_HULL_COLLIDER')
    && grass.includes('leftoverGrassHull')
    && grass.includes('InstancedMesh')
    && !grass.includes('planDirtBlades')
    && constants.includes("LEFTOVER_GRASS_HULL_COLLIDER = 'ground'"));
  ok('did not ship gardenGrass.js / growToGap.js',
    !existsSync(join(here, 'landmarks/gardenGrass.js'))
    && !existsSync(join(here, 'gardenGrass.js'))
    && !existsSync(join(here, 'landmarks/growToGap.js'))
    && existsSync(join(here, 'landmarks/leftoverGrass.js')));
  ok('gardenPath was not restacked',
    garden.includes('Tiny Glade') && garden.includes('two-abreast')
    && garden.includes('grass hull') && garden.includes('grow-to-gap')
    && garden.includes('268') && garden.includes('Desi')
    && !garden.includes('leftoverGrass') && !garden.includes('LEFTOVER_GRASS_')
    && !garden.includes('gardenBench') && !garden.includes('GARDEN_BENCH_'));
  ok('gardenBench was not restacked',
    bench.includes('Tiny Glade') && bench.includes('3-seat slat')
    && bench.includes('Sit-box is a void') && bench.includes('276')
    && !bench.includes('leftoverGrass') && !bench.includes('LEFTOVER_GRASS_')
    && !bench.includes('planDirtBlades') && !bench.includes('gardenPathGrassHull'));
  ok('leftoverLot A/B/C were not restacked',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)')
    && leftover.includes('chain-link') && leftover.includes('weenie')
    && !leftover.includes('leftoverGrass') && !leftover.includes('LEFTOVER_GRASS_')
    && !leftover.includes('gardenPath') && !leftover.includes('GARDEN_PATH_')
    && !leftover.includes('gardenBench') && !leftover.includes('GARDEN_BENCH_')
    && constants.includes('258/84') && constants.includes('295/84')
    && constants.includes('313/84') && constants.includes('268→284')
    && constants.includes('276 / 82.4') && constants.includes('267–285'));
  ok('house was not restacked',
    house.includes('housePlanGeom') && house.includes('weenie')
    && !house.includes('leftoverGrass') && !house.includes('LEFTOVER_GRASS_'));
  ok('warehouse was not restacked',
    warehouse.includes('warehouseAisleGeom') && warehouse.includes('buildRacks')
    && !warehouse.includes('leftoverGrass') && !warehouse.includes('LEFTOVER_GRASS_'));
  ok('drop was not restacked',
    drop.includes('dropHoistGeom') && drop.includes('buildWell')
    && !drop.includes('leftoverGrass') && !drop.includes('LEFTOVER_GRASS_'));
  ok('abando was not restacked',
    abando.includes('abandoStairGeom') && abando.includes('buildSilo')
    && !abando.includes('leftoverGrass') && !abando.includes('LEFTOVER_GRASS_'));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust')
    && !blades.includes('leftoverGrass'));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !water.includes('leftoverGrass'));
  ok('preview.html was not restacked',
    preview.includes('url=./') && !preview.includes('leftoverGrass'));
  ok('follow.js was not restacked',
    follow.includes('hauntFollowPath') && !follow.includes('leftoverGrass'));
  ok('checkpoints.js was not restacked',
    checkpoints.includes('RESTART_OFFSET') && !checkpoints.includes('leftoverGrass'));
  ok('quad.js GRAVITY stays 9.81',
    /const GRAVITY = 9\.81/.test(quad) && !quad.includes('leftoverGrass'));
  ok('planting.js was not restacked',
    planting.includes('export function tryPlace')
    && planting.includes('export function tessellateHull')
    && !planting.includes('leftoverGrass') && !planting.includes('LEFTOVER_GRASS_')
    && !planting.includes('gardenBench') && !planting.includes('GARDEN_BENCH_')
    && !planting.includes('gardenPath') && !planting.includes('GARDEN_PATH_')
    && !planting.includes('leftoverLot'));

  if (fails.length) {
    console.error('[miami-leftoverGrass] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-leftoverGrass] ok', passedCount, 'checks',
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
  && process.argv[1] && process.argv[1].endsWith('leftoverGrassTest.js');
if (isMain) {
  const r = runMiamiLeftoverGrassTests();
  if (!r.passed) process.exit(1);
}
