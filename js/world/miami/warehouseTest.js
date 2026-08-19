// Headless checks for the Miami warehouse haunt kit.
// No three.js, no game state.
//
//   node ./tools/run-miami-warehouse-test.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_Y,
  WAREHOUSE_X, WAREHOUSE_Z, WAREHOUSE_W, WAREHOUSE_D, WAREHOUSE_H,
  WAREHOUSE_WIDE, WAREHOUSE_NARROW, WAREHOUSE_VNA,
  WAREHOUSE_DOOR_W, WAREHOUSE_DOOR_H, WAREHOUSE_LEVELER, WAREHOUSE_LEVELER_T,
  WAREHOUSE_WALL, WAREHOUSE_UPRIGHT, WAREHOUSE_BEAM, WAREHOUSE_RACK,
  WAREHOUSE_SASH_W, WAREHOUSE_SASH_H,
  WAREHOUSE_Z0,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, inReserved, groundHeight,
  warehouseVoids, warehouseColliderShapes, warehouseAisleGeom,
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

export function runMiamiWarehouseTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const voids = warehouseVoids();
  const shapes = warehouseColliderShapes();
  const geom = warehouseAisleGeom();
  const wide = voids.find((v) => v.kind === 'wide');
  const narrow = voids.find((v) => v.kind === 'narrow');
  const vna = voids.find((v) => v.kind === 'vna');
  const dock = voids.find((v) => v.kind === 'dock');
  const sashes = voids.filter((v) => v.kind === 'sash');

  // ---- leftover industrial / leftover city, not a street / boardwalk ----
  ok('lot is not pavement', !onPavement(WAREHOUSE_X, WAREHOUSE_Z));
  ok('lot is not boardwalk', !onBoardwalk(WAREHOUSE_X, WAREHOUSE_Z));
  ok('lot is not roadway', !onRoadway(WAREHOUSE_Z));
  ok('lot is not a cross-street', !onCrossStreet(WAREHOUSE_X, WAREHOUSE_Z));
  ok('lot is not a sidewalk slab', !onSidewalk(WAREHOUSE_X, WAREHOUSE_Z));
  ok('lot sits on the city plateau', groundHeight(WAREHOUSE_X, WAREHOUSE_Z) === CITY_Y);
  ok('lot is reserved', inReserved(WAREHOUSE_X, WAREHOUSE_Z));
  ok('lot is a keepout', inKeepout(WAREHOUSE_X, WAREHOUSE_Z));
  ok('tryPlace drops the reserved lot', tryPlace(ctx, WAREHOUSE_X, WAREHOUSE_Z) === 0);
  ok('tryPlace does not remap the lot', tryPlace(ctx, WAREHOUSE_X, WAREHOUSE_Z) === 0);

  // ---- aisle centres + dock mouth stay open -----------------------------
  ok('warehouse ships wide + narrow + VNA + dock + sash voids',
    !!wide && !!narrow && !!vna && !!dock && sashes.length >= 2);
  for (const v of voids) {
    const hit = probeBlocked(shapes, v.x, v.y, v.z, v.probe);
    ok(`${v.id} centre open`, !hit, hit ? `blocked by ${hit.tag} ${hit.type}` : '');
  }

  ok('wide aisle is 3.7–4.3 m', WAREHOUSE_WIDE >= 3.7 && WAREHOUSE_WIDE <= 4.3);
  ok('narrow aisle is 2.4–3.0 m', WAREHOUSE_NARROW >= 2.4 && WAREHOUSE_NARROW <= 3.0);
  ok('VNA is 1.4–1.8 m', WAREHOUSE_VNA >= 1.4 && WAREHOUSE_VNA <= 1.8);
  ok('dock door is 2.4–3.0 × 3.0 m',
    WAREHOUSE_DOOR_W >= 2.4 && WAREHOUSE_DOOR_W <= 3.0
    && Math.abs(WAREHOUSE_DOOR_H - 3.0) < 1e-9);
  ok('dock leveler is 1.22 m', Math.abs(WAREHOUSE_LEVELER - 1.22) < 1e-9);
  ok('wide void uses the locked clear',
    wide.openW === WAREHOUSE_WIDE && wide.openH === WAREHOUSE_H - 0.5);
  ok('narrow void uses the locked clear', narrow.openW === WAREHOUSE_NARROW);
  ok('VNA void uses the locked clear', vna.openW === WAREHOUSE_VNA);
  ok('dock void uses the locked door',
    dock.openW === WAREHOUSE_DOOR_W && dock.openH === WAREHOUSE_DOOR_H);
  ok('sash voids use the locked punch',
    sashes.every((v) => v.openW === WAREHOUSE_SASH_W && v.openH === WAREHOUSE_SASH_H));
  ok('dock aligns with the wide aisle', Math.abs(geom.dockX - geom.wideX) < 1e-9);

  // ---- jambs / racks exist and are smaller than the opening -------------
  const jambs = shapes.filter((s) => s.tag === 'warehouse' && s.type === 'aabb');
  ok('warehouse has jamb / rack / lip colliders', jambs.length >= 8);
  ok('no filled-opening collider tagged fat',
    !jambs.some((s) => s.sx >= WAREHOUSE_W - 0.4 && s.sz >= WAREHOUSE_D - 0.4 && s.sy >= WAREHOUSE_H - 1));
  ok('wall jamb thinner than the dock door',
    WAREHOUSE_WALL < WAREHOUSE_DOOR_W - 0.5 && WAREHOUSE_WALL < WAREHOUSE_DOOR_H - 0.5);
  ok('rack upright thinner than the VNA',
    WAREHOUSE_UPRIGHT < WAREHOUSE_VNA - 0.5);
  ok('rack bay thinner than the wide aisle',
    WAREHOUSE_RACK < WAREHOUSE_WIDE - 0.5 && WAREHOUSE_BEAM < WAREHOUSE_WIDE - 0.5);
  ok('leveler plate thinner than the door',
    WAREHOUSE_LEVELER_T < WAREHOUSE_DOOR_H - 0.5);

  const midWide = probeBlocked(shapes, wide.x, CITY_Y + WAREHOUSE_H * 0.5, wide.z, 0.22);
  ok('wide aisle interior is not a filled box', !midWide);
  const midVna = probeBlocked(shapes, vna.x, CITY_Y + WAREHOUSE_H * 0.5, vna.z, 0.08);
  ok('VNA interior is not a filled box', !midVna);

  const dockJamb = probeBlocked(
    shapes,
    dock.x - WAREHOUSE_DOOR_W / 2 - WAREHOUSE_WALL * 0.45,
    dock.y,
    dock.z,
    0.03,
  );
  ok('dock jamb exists beside the opening', !!dockJamb);

  const rackHit = probeBlocked(
    shapes,
    geom.wideX0 - WAREHOUSE_UPRIGHT * 0.45,
    CITY_Y + 2.0,
    geom.midZ,
    0.03,
  );
  ok('wide-aisle rack upright exists beside the opening', !!rackHit);

  const levelerHit = probeBlocked(
    shapes,
    geom.dockX,
    CITY_Y + WAREHOUSE_LEVELER_T * 0.45,
    WAREHOUSE_Z0 - WAREHOUSE_LEVELER * 0.45,
    0.03,
  );
  ok('leveler lip exists outside the mouth', !!levelerHit);
  ok('leveler does not fill the dock mouth',
    !probeBlocked(shapes, dock.x, dock.y, dock.z, dock.probe));

  // ---- one placer; no second scatterer; look locks ----------------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const warehouse = readFileSync(join(here, 'landmarks/warehouse.js'), 'utf8');
  const drop = readFileSync(join(here, 'landmarks/drop.js'), 'utf8');
  const abando = readFileSync(join(here, 'landmarks/abando.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const blades = readFileSync(join(here, 'blades.js'), 'utf8');
  const water = readFileSync(join(here, 'bayWater.js'), 'utf8');
  const preview = readFileSync(join(here, '../../../preview.html'), 'utf8');

  ok('tryPlace is still the placer', planting.includes('export function tryPlace'));
  ok('warehouse is not a second scatterer',
    !warehouse.includes('scatterModels') && !warehouse.includes('planDirtBlades'));
  ok('warehouse does not invent a placer',
    !/export function tryPlace/.test(warehouse)
    && warehouse.includes('tryPlace')
    && warehouse.includes('onPavement'));
  ok('warehouse rejects pavement instead of remapping',
    warehouse.includes('if (onPavement(WAREHOUSE_X, WAREHOUSE_Z)) return null;')
    && !/WAREHOUSE_X\s*=/.test(warehouse));
  ok('index builds warehouse on the fly-through keepout path',
    index.includes("from './landmarks/warehouse.js'")
    && index.includes('buildWarehouse(ctx)')
    && index.indexOf('buildWarehouse') > index.indexOf('buildDrop')
    && index.indexOf('buildWarehouse') < index.indexOf('buildBlades'));
  ok('no custom mat',
    !/\bShaderMaterial\b/.test(warehouse) && !/\bonBeforeCompile\b/.test(warehouse)
    && warehouse.includes('MeshStandardMaterial'));
  ok('kit is documentary concrete + rebar, no furniture',
    warehouse.includes('REBAR') && warehouse.includes('weenie')
    && !/chair|sofa|table|crate|bench|Kenney/i.test(warehouse));
  ok('drop was not restacked',
    drop.includes('dropHoistGeom') && drop.includes('buildWell')
    && !drop.includes('WAREHOUSE_') && !drop.includes('buildWarehouse'));
  ok('abando was not restacked',
    abando.includes('abandoStairGeom') && abando.includes('buildSilo')
    && !abando.includes('WAREHOUSE_') && !abando.includes('buildWarehouse')
    && !abando.includes('DROP_') && !abando.includes('buildDrop'));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust'));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !water.includes('warehouse'));
  ok('preview.html was not restacked',
    preview.includes('url=./') && !preview.includes('warehouse'));

  if (fails.length) {
    console.error('[miami-warehouse] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-warehouse] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('warehouseTest.js');
if (isMain) {
  const r = runMiamiWarehouseTests();
  if (!r.passed) process.exit(1);
}
