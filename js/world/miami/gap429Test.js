// Headless source-locks for GAP_X=429 — skipped east of leftoverLot A.
// No three.js, no game state.
//
//   node ./tools/run-miami-gap-429-test.mjs

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GAP429_X, GAP429_W_FRONT_X, GAP429_E_FRONT_X,
  GAP429_W_CELLS, GAP429_E_CELLS, gap429Shops,
  leftoverLotOverlap,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_H_X, CITY_Y, GAP_X, XS_HALF,
} from './constants.js';

const here = dirname(fileURLToPath(import.meta.url));

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

export function runMiamiGap429Tests() {
  fails.length = 0;
  passedCount = 0;

  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const buildings = readFileSync(join(here, 'buildings.js'), 'utf8');
  const constants = readFileSync(join(here, 'constants.js'), 'utf8');

  ok('no gap429.js landmark — column skipped',
    !existsSync(join(here, 'landmarks/gap429.js')));
  ok('index does not call buildGap429',
    !index.includes('buildGap429')
    && !index.includes("from './landmarks/gap429.js'"));
  ok('backdrop 60-box contract untouched',
    buildings.includes('for (let i = 0; i < 60; i++)'));
  ok('no layout rng in GAP429 constants',
    constants.includes('GAP429_W_CELLS')
    && !/\brng2?\s*\(/.test(constants)
    && !constants.includes('ShaderMaterial'));

  ok('GAP_X=429 west front is east of leftoverLot A and x=240',
    GAP429_X === 429 && GAP429_X === GAP_X[5]
    && GAP429_W_FRONT_X === GAP429_X - XS_HALF - 2.4
    && GAP429_E_FRONT_X === GAP429_X + XS_HALF + 2.4
    && GAP429_W_FRONT_X > 240
    && GAP429_E_FRONT_X > GAP429_W_FRONT_X
    && GAP429_W_FRONT_X > 251);
  ok('both faces skipped so leftoverLot A–H stay put',
    GAP429_W_CELLS.length === 0 && GAP429_E_CELLS.length === 0
    && gap429Shops().length === 0);
  ok('leftoverLot A–H unmoved',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));
  ok('CITY_Y unchanged', CITY_Y === 1.5);

  if (fails.length) {
    console.error('[miami-gap-429] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-gap-429] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('gap429Test.js');
if (isMain) {
  const r = runMiamiGap429Tests();
  if (!r.passed) process.exit(1);
}
