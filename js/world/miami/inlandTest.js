// Headless source-locks for inland six-sided mid-rises + alley pipes.
// No three.js, no game state.
//
//   node ./tools/run-miami-inland-test.mjs

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INLAND_MIDRISE_W, INLAND_MIDRISE_D, INLAND_MIDRISE_H, INLAND_MIDRISE_CELLS,
  inlandMidrises, ALLEY_PIPE_CELLS, FLY_VOIDS, inKeepout, inReserved,
  leftoverLotOverlap, streetOverlap,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_H_X,
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

export function runMiamiInlandTests() {
  fails.length = 0;
  passedCount = 0;

  const inland = readFileSync(join(here, 'landmarks/inland.js'), 'utf8');
  const buildings = readFileSync(join(here, 'buildings.js'), 'utf8');
  const kenney = readFileSync(join(here, 'kenneyDressing.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');

  ok('inland.js exists', existsSync(join(here, 'landmarks/inland.js')));
  ok('hash01 only — no layout rng',
    inland.includes('hash01')
    && !/\brng2?\s*\(/.test(inland)
    && !/\brng3\s*\(/.test(inland)
    && !/\brng4\s*\(/.test(inland));
  ok('six-sided deco helper + rooftop kits',
    inland.includes('buildDecoMidriseGeos')
    && inland.includes('buildRooftopKitGeo')
    && inland.includes('buildRooftopDishGeo')
    && inland.includes('buildRooftopTankGeo')
    && inland.includes('buildRoofAcUnitGeo'));
  ok('no ShaderMaterial / ped / traffic',
    !inland.includes('ShaderMaterial')
    && !inland.includes('ped.js') && !inland.includes('traffic.js'));
  ok('index calls buildInland after espa, before flythrough',
    index.includes('buildInland(ctx)')
    && index.indexOf('buildInland(ctx)') > index.indexOf('buildEspa(ctx)')
    && index.indexOf('buildInland(ctx)') < index.indexOf('buildFlythrough(ctx)'));
  ok('rooftop kit geos stay exported from buildings.js',
    buildings.includes('export function buildRooftopKitGeo')
    && buildings.includes('export function buildRooftopDishGeo')
    && buildings.includes('export function buildRooftopTankGeo'));
  ok('backdrop 60-box contract untouched',
    buildings.includes('for (let i = 0; i < 60; i++)'));
  ok('far Kenney gained midrise_c behind the 60-box LOD',
    kenney.includes('kenney_midrise_c') && kenney.includes('640 + hash01'));

  ok('eight signed plates west of 240',
    INLAND_MIDRISE_CELLS.length === 8
    && INLAND_MIDRISE_W === 18 && INLAND_MIDRISE_D === 14 && INLAND_MIDRISE_H >= 28
    && INLAND_MIDRISE_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1 && z < 300));

  const plates = inlandMidrises();
  ok('geom count matches cells', plates.length === 8);
  for (let i = 0; i < plates.length; i++) {
    const g = plates[i];
    ok(`${g.id} reserved + keepout west of 240`,
      g.x1 + 0.8 < 240 && inReserved(g.x, g.z) && inKeepout(g.x, g.z));
    ok(`${g.id} misses leftoverLot / street / travel`,
      leftoverLotOverlap(g.x, g.z, g.w, g.d, 0.15) === false
      && streetOverlap(g.x, g.z, g.w, g.d) === false
      && g.z0 > TRAVEL_Z1 && g.z1 < 300
      && !(g.z0 < TRAVEL_Z1 && g.z1 > TRAVEL_Z0));
  }

  ok('four inland alley pipes at z=248',
    ALLEY_PIPE_CELLS.length === 8
    && ALLEY_PIPE_CELLS.filter(([, z]) => z === 248).length === 4);
  for (const [x, z] of ALLEY_PIPE_CELLS.filter(([, zz]) => zz === 248)) {
    const v = FLY_VOIDS.find((f) => f.x === x && f.z === z && String(f.id).startsWith('alley-pipe-'));
    ok(`pipe ${x}/${z} void + keepout`, !!v && inKeepout(x, z) && x < 240);
    ok(`pipe ${x}/${z} misses leftoverLot / street`,
      leftoverLotOverlap(x, z, 2.4, 2.6, 0.15) === false
      && streetOverlap(x, z, 0.4, 2.6) === false);
  }

  ok('leftoverLot A–H unmoved',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  if (fails.length) {
    console.error('[miami-inland] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-inland] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('inlandTest.js');
if (isMain) {
  const r = runMiamiInlandTests();
  if (!r.passed) process.exit(1);
}
