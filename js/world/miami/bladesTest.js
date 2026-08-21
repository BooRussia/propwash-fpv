// Headless checks for the Miami leftover-dirt blade fill.
// No three.js, no game state.
//
//   node ./tools/run-miami-blades-test.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BOARDWALK_Z, ROAD_Z, PLANT_BEACH_Z, PLANT_CITY_Z,
  SW_BEACH_Z0, SW_BEACH_Z1, SW_CITY_Z0, SW_CITY_Z1,
  onPavement, onBoardwalk, onSidewalk, onRoadway, onCrossStreet,
  GAP_X,
} from './constants.js';
import {
  BLADE_AABB, BLADE_CEILING, BLADE_FAR_BUDGET, BLADE_HULL_COLLIDER,
  BLADE_NEAR_BUDGET, COVER_FAR, COVER_NEAR,
  dirtHulls, hullArea, placeBladePlan, planDirtBlades, tryPlace,
} from './planting.js';

const here = dirname(fileURLToPath(import.meta.url));

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

export function runMiamiBladesTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };

  // ---- tryPlace is reject-or-drop, same graph as palms -------------------
  ok('boardwalk centre drops', tryPlace(ctx, 0, BOARDWALK_Z) === 0);
  ok('Ocean Drive drops', tryPlace(ctx, 0, ROAD_Z) === 0);
  ok('beach sidewalk drops', tryPlace(ctx, 0, (SW_BEACH_Z0 + SW_BEACH_Z1) / 2) === 0);
  ok('city sidewalk drops', tryPlace(ctx, 0, (SW_CITY_Z0 + SW_CITY_Z1) / 2) === 0);
  ok('cross-street drops', tryPlace(ctx, GAP_X[2], 80) === 0);
  ok('sand keeps', tryPlace(ctx, 40, 12) > 0 && !onPavement(40, 12));
  ok('planting row keeps', tryPlace(ctx, 0, PLANT_BEACH_Z) > 0
    && tryPlace(ctx, 0, PLANT_CITY_Z) > 0);
  ok('tryPlace does not remap pavement', tryPlace(ctx, 0, BOARDWALK_Z) === 0);

  ok('blocked candidate drops', tryPlace({ blocked: () => true }, 0, 8) === 0);

  // ---- tessellated hull: density = area × cover² -------------------------
  const planned = planDirtBlades();
  ok('near budget is 70k', BLADE_NEAR_BUDGET === 70_000);
  ok('far budget is 20k', BLADE_FAR_BUDGET === 20_000);
  ok('190k is a ceiling', BLADE_CEILING === 190_000);
  ok('near raw is area × cover²',
    Math.abs(planned.nearRaw - Math.round(planned.nearArea * COVER_NEAR * COVER_NEAR)) < 1);
  ok('far raw is area × cover²',
    Math.abs(planned.farRaw - Math.round(planned.farArea * COVER_FAR * COVER_FAR)) < 1);
  ok('near tessellation respects budget',
    planned.nearPlan.length <= BLADE_NEAR_BUDGET
    && planned.nearBudgeted <= BLADE_NEAR_BUDGET);
  ok('far tessellation respects budget',
    planned.farPlan.length <= BLADE_FAR_BUDGET
    && planned.farBudgeted <= BLADE_FAR_BUDGET);
  ok('sum under the 190k ceiling',
    planned.nearPlan.length + planned.farPlan.length <= BLADE_CEILING);
  ok('near hull has area', planned.nearArea > 1000);
  ok('far hull has area', planned.farArea > 1000);

  const nearHulls = dirtHulls('near');
  const farHulls = dirtHulls('far');
  const allHulls = nearHulls.concat(farHulls);
  let hulledPavement = 0;
  for (let i = 0; i < nearHulls.length; i++) {
    const h = nearHulls[i];
    if (h.z0 <= BOARDWALK_Z && h.z1 >= BOARDWALK_Z && h.x0 <= 0 && h.x1 >= 0) {
      hulledPavement++;
    }
  }
  ok('hulls do not contain the boardwalk centre', hulledPavement === 0);
  ok('beach-dirt band is gone',
    !allHulls.some((h) => String(h.tag).includes('beach-dirt'))
    && !allHulls.some((h) => Math.abs(h.z0 - 1.15) < 0.05
      && Math.abs(h.z1 - 21.75) < 0.05));
  ok('promenade and plant leftover bands stay',
    allHulls.some((h) => String(h.tag).includes('promenade-dirt'))
    && allHulls.some((h) => String(h.tag).includes('plant-beach'))
    && allHulls.some((h) => String(h.tag).includes('plant-city')));
  ok('leftover hulls punch the spawn keepout',
    !nearHulls.some((h) => h.x0 <= 0 && h.x1 >= 0 && h.z0 <= 8 && h.z1 >= 8));
  ok('hull area helper is width × depth',
    Math.abs(hullArea({ x0: 0, x1: 10, z0: 0, z1: 2 }) - 20) < 1e-9);

  // ---- placed blades stay off pavement ----------------------------------
  const nearPlaced = placeBladePlan(ctx, planned.nearPlan);
  const farPlaced = placeBladePlan(ctx, planned.farPlan);
  let paved = 0;
  const check = (list) => {
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (onPavement(p.x, p.z) || onBoardwalk(p.x, p.z) || onSidewalk(p.x, p.z)
        || onRoadway(p.z) || onCrossStreet(p.x, p.z)) paved++;
    }
  };
  check(nearPlaced);
  check(farPlaced);
  ok('no placed blade on pavement', paved === 0);
  ok('near field produced blades', nearPlaced.length > 1000);
  ok('far field produced blades', farPlaced.length > 200);
  ok('tryPlace still drops a keepout cell', tryPlace(ctx, 0, 8) === 0);

  const forced = placeBladePlan(ctx, [
    { x: 0, z: BOARDWALK_Z, yaw: 0, sc: 1 },
    { x: 0, z: ROAD_Z, yaw: 0, sc: 1 },
    { x: 40, z: 12, yaw: 0, sc: 1 },
  ]);
  ok('forced pavement candidates are dropped, sand kept',
    forced.length === 1 && !onPavement(forced[0].x, forced[0].z));

  // ---- one hull collider; a blade AABB fails -----------------------------
  ok('hull collider is the ground', BLADE_HULL_COLLIDER === 'ground');
  ok('blade AABB is forbidden', BLADE_AABB === false);

  // ---- source locks ------------------------------------------------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const blades = readFileSync(join(here, 'blades.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const main = readFileSync(join(here, '../../main.js'), 'utf8');

  ok('tryPlace is the placer', planting.includes('export function tryPlace')
    && blades.includes('placeBladePlan')
    && blades.includes("from './planting.js'"));
  ok('tessellate is a grid, not a retry loop',
    planting.includes('export function tessellateHull')
    && !/while\s*\(\s*placed\s*<\s*N/.test(planting)
    && !/while\s*\(\s*blades/.test(planting));
  ok('no scatterModels second scatterer',
    !blades.includes('scatterModels') && !planting.includes('scatterModels'));
  ok('no blade AABB / addCollider',
    !/\baddCollider\b/.test(blades) && !/\baddCyl\b/.test(blades)
    && !/\baddOBB\b/.test(blades) && !/\baddSphere\b/.test(blades)
    && !/\bmakeBox\b/.test(blades));
  ok('no Sylva WIND_GLSL paste',
    !blades.includes('WIND_GLSL') && !planting.includes('WIND_GLSL'));
  ok('no ShaderMaterial',
    !/\bShaderMaterial\b/.test(blades) && !/\bonBeforeCompile\b/.test(blades));
  ok('TSL wind graph is authored',
    blades.includes('three/tsl') && blades.includes('positionNode')
    && blades.includes('MeshStandardNodeMaterial'));
  ok('craft writes the gust, not a cursor demo',
    blades.includes('Craft writes the gust')
    && !blades.includes('clientX') && !blades.includes('mousemove')
    && !blades.includes('pointermove')
    && index.includes('extras.craft')
    && main.includes('craft: quad'));
  ok('index builds blades after dressing',
    index.includes("from './blades.js'") && index.includes('buildBlades(ctx)')
    && index.indexOf('buildBlades') > index.indexOf('buildDressing'));
  ok('water path is not restacked',
    index.includes('water.update') && !index.includes('objects/Water.js'));

  if (fails.length) {
    console.error('[miami-blades] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-blades] ok', passedCount, 'checks',
      `near=${nearPlaced.length}/${planned.nearBudgeted}`,
      `far=${farPlaced.length}/${planned.farBudgeted}`);
  }
  return {
    passed: fails.length === 0,
    fails,
    passedCount,
    nearCount: nearPlaced.length,
    farCount: farPlaced.length,
  };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('bladesTest.js');
if (isMain) {
  const r = runMiamiBladesTests();
  if (!r.passed) process.exit(1);
}
