// Headless checks for the Miami drop haunt kit.
// No three.js, no game state.
//
//   node ./tools/run-miami-drop-test.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_Y,
  DROP_X, DROP_Z, DROP_W, DROP_D, DROP_H,
  DROP_HOIST_W, DROP_HOIST_D, DROP_DOOR_W, DROP_DOOR_H,
  DROP_PARAPET, DROP_PARAPET_T, DROP_SETBACK, DROP_WALL, DROP_ROOF_Y,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, inReserved, groundHeight,
  dropVoids, dropColliderShapes, dropHoistGeom,
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

export function runMiamiDropTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const voids = dropVoids();
  const shapes = dropColliderShapes();
  const hoist = voids.find((v) => v.kind === 'hoistway');
  const well = voids.find((v) => v.kind === 'well');
  const door = voids.find((v) => v.kind === 'door');
  const geom = dropHoistGeom();

  // ---- leftover roof / leftover city, not a street / boardwalk ----------
  ok('lot is not pavement', !onPavement(DROP_X, DROP_Z));
  ok('lot is not boardwalk', !onBoardwalk(DROP_X, DROP_Z));
  ok('lot is not roadway', !onRoadway(DROP_Z));
  ok('lot is not a cross-street', !onCrossStreet(DROP_X, DROP_Z));
  ok('lot is not a sidewalk slab', !onSidewalk(DROP_X, DROP_Z));
  ok('lot sits on the city plateau', groundHeight(DROP_X, DROP_Z) === CITY_Y);
  ok('lot is reserved', inReserved(DROP_X, DROP_Z));
  ok('lot is a keepout', inKeepout(DROP_X, DROP_Z));
  ok('tryPlace drops the reserved lot', tryPlace(ctx, DROP_X, DROP_Z) === 0);
  ok('tryPlace does not remap the lot', tryPlace(ctx, DROP_X, DROP_Z) === 0);

  // ---- hoistway / door / well centres stay open -------------------------
  ok('drop ships hoistway + door + well voids', !!hoist && !!door && !!well);
  for (const v of voids) {
    const hit = probeBlocked(shapes, v.x, v.y, v.z, v.probe);
    ok(`${v.id} centre open`, !hit, hit ? `blocked by ${hit.tag} ${hit.type}` : '');
  }

  ok('hoistway is ~2.5 × 2.0 m',
    Math.abs(DROP_HOIST_W - 2.5) < 1e-9 && Math.abs(DROP_HOIST_D - 2.0) < 1e-9);
  ok('door is 1.07 × 2.13 m',
    Math.abs(DROP_DOOR_W - 1.07) < 1e-9 && Math.abs(DROP_DOOR_H - 2.13) < 1e-9);
  ok('parapet is 0.9–1.2 m', DROP_PARAPET >= 0.9 && DROP_PARAPET <= 1.2);
  ok('setback lip is 1–3 m', DROP_SETBACK >= 1 && DROP_SETBACK <= 3);
  ok('hoistway void uses the locked clear',
    hoist.openW === DROP_HOIST_W && hoist.openH === DROP_HOIST_D);
  ok('well void uses the locked clear',
    well.openW === DROP_HOIST_W && well.openH === DROP_HOIST_D);
  ok('door void uses the locked clear',
    door.openW === DROP_DOOR_W && door.openH === DROP_DOOR_H);

  // ---- jambs / parapet exist and are smaller than the opening -----------
  const jambs = shapes.filter((s) => s.tag === 'drop' && s.type === 'aabb');
  ok('drop has jamb / lip / parapet colliders', jambs.length >= 8);
  ok('no filled-opening collider tagged fat',
    !jambs.some((s) => s.sx >= DROP_W - 0.4 && s.sz >= DROP_D - 0.4 && s.sy >= DROP_H - 1));
  ok('parapet thinner than the hoistway',
    DROP_PARAPET_T < DROP_HOIST_W - 0.5 && DROP_PARAPET_T < DROP_HOIST_D - 0.5);
  ok('wall jamb thinner than the door',
    DROP_WALL < DROP_DOOR_W - 0.5 && DROP_WALL < DROP_DOOR_H - 0.5);
  ok('wall jamb thinner than the hoistway',
    DROP_WALL < DROP_HOIST_W - 0.5 && DROP_WALL < DROP_HOIST_D - 0.5);

  const midWell = probeBlocked(shapes, hoist.x, CITY_Y + DROP_H * 0.5, hoist.z, 0.22);
  ok('hoistway interior is not a filled box', !midWell);

  const doorJamb = probeBlocked(
    shapes,
    door.x,
    door.y,
    door.z - DROP_DOOR_W / 2 - DROP_WALL * 0.45,
    0.03,
  );
  ok('door jamb exists beside the opening', !!doorJamb);

  const parapetHit = probeBlocked(
    shapes,
    DROP_X,
    DROP_ROOF_Y + DROP_PARAPET * 0.5,
    DROP_Z0 + DROP_PARAPET_T * 0.45,
    0.04,
  );
  ok('parapet exists on the leftover roof', !!parapetHit);

  const setback = geom.holeX0 - (DROP_X0 + DROP_PARAPET_T);
  ok('well sits on the locked setback', Math.abs(setback - DROP_SETBACK) < 1e-9);

  // ---- one placer; no second scatterer; look locks ----------------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const drop = readFileSync(join(here, 'landmarks/drop.js'), 'utf8');
  const abando = readFileSync(join(here, 'landmarks/abando.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const blades = readFileSync(join(here, 'blades.js'), 'utf8');
  const water = readFileSync(join(here, 'bayWater.js'), 'utf8');
  const preview = readFileSync(join(here, '../../preview.html'), 'utf8');

  ok('tryPlace is still the placer', planting.includes('export function tryPlace'));
  ok('drop is not a second scatterer',
    !drop.includes('scatterModels') && !drop.includes('planDirtBlades'));
  ok('drop does not invent a placer',
    !/export function tryPlace/.test(drop)
    && drop.includes('tryPlace')
    && drop.includes('onPavement'));
  ok('drop rejects pavement instead of remapping',
    drop.includes('if (onPavement(DROP_X, DROP_Z)) return null;')
    && !/DROP_X\s*=/.test(drop));
  ok('index builds drop on the fly-through keepout path',
    index.includes("from './landmarks/drop.js'")
    && index.includes('buildDrop(ctx)')
    && index.indexOf('buildDrop') > index.indexOf('buildAbando')
    && index.indexOf('buildDrop') < index.indexOf('buildBlades'));
  ok('no custom mat',
    !/\bShaderMaterial\b/.test(drop) && !/\bonBeforeCompile\b/.test(drop)
    && drop.includes('MeshStandardMaterial'));
  ok('kit is documentary concrete + rebar, no furniture',
    drop.includes('REBAR') && drop.includes('weenie')
    && !/chair|sofa|table|crate|bench|Kenney/i.test(drop));
  ok('abando was not restacked',
    abando.includes('abandoStairGeom') && abando.includes('buildSilo')
    && !abando.includes('DROP_') && !abando.includes('buildDrop'));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust'));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !water.includes('drop'));
  ok('preview.html was not restacked',
    preview.includes('url=./') && !preview.includes('drop'));

  if (fails.length) {
    console.error('[miami-drop] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-drop] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('dropTest.js');
if (isMain) {
  const r = runMiamiDropTests();
  if (!r.passed) process.exit(1);
}
