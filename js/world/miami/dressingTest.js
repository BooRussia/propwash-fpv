// Headless checks for the Miami boardwalk shrub kiss-drop.
// Source lock only — no three.js, no game state. Tufts are the
// dressing.js shrubs, not palms, leftoverGrass, or blades.
//
//   node ./tools/run-miami-dressing-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BOARDWALK_Z, BOARDWALK_D, BOARDWALK_SHOULDER,
} from './constants.js';

const here = dirname(fileURLToPath(import.meta.url));

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

function sliceShrubLoop(src) {
  const start = src.indexOf('// shrubs + broadleafs along boardwalk planters');
  const end = src.indexOf("await scatterSafe('shrub_02'", start);
  if (start < 0 || end < 0 || end <= start) return '';
  return src.slice(start, end);
}

export function runMiamiDressingTests() {
  fails.length = 0;
  passedCount = 0;

  const dressing = readFileSync(join(here, 'dressing.js'), 'utf8');
  const loop = sliceShrubLoop(dressing);

  ok('shrub loop is present', loop.length > 80);
  ok('same planter / x / z rng2 draws',
    loop.includes('const planter = rng2() < 0.55')
    && loop.includes('const x = -580 + rng2() * 1160')
    && loop.includes('const z = planter ? 31.8 + rng2() * 4.6 : 18 + rng2() * 6'));
  ok('kiss-drop after the z draw',
    loop.includes('if (z < 21.8) continue')
    && loop.indexOf('if (z < 21.8) continue')
      > loop.indexOf('const z = planter ? 31.8 + rng2() * 4.6 : 18 + rng2() * 6'));
  ok('did not remint z onto the promenade',
    !/z\s*=\s*Math\.(max|min)/.test(loop)
    && !/z\s*=\s*21\.8/.test(loop)
    && !/z\s*\+=/.test(loop)
    && !/z\s*=\s*planter\s*\?\s*31\.8/.test(loop.replace(
      'const z = planter ? 31.8 + rng2() * 4.6 : 18 + rng2() * 6', '')));
  ok('planter row stays 31.8–36.4',
    loop.includes('31.8 + rng2() * 4.6')
    && 31.8 + 4.6 === 36.4);
  ok('pier keepout stays', loop.includes('Math.abs(x - PIER_X) < 14'));
  ok('clear / inKeepout / blocked stay',
    dressing.includes('const clear = (x, z, r, y0, h) => !inKeepout(x, z, 0.6) && !blocked(x, z, r, y0, y0 + h)')
    && loop.includes('if (!clear(x, z, 0.95 * scale, y, 1.6 * scale)) continue'));
  ok('placedS < 40 / tries < 400 stay',
    loop.includes('placedS < 40 && tries++ < 400'));
  ok('21.8 is the boardwalk face seaward edge',
    BOARDWALK_Z - BOARDWALK_D / 2 - BOARDWALK_SHOULDER === 21.8);

  const shrubZ = (planter, u) => (planter ? 31.8 + u * 4.6 : 18 + u * 6);
  ok('non-planter 18 is a kiss', shrubZ(false, 0) < 21.8);
  ok('non-planter 21.8 keeps', shrubZ(false, (21.8 - 18) / 6) === 21.8);
  ok('non-planter 24 keeps', shrubZ(false, 1) >= 21.8);
  ok('planter 31.8–36.4 keeps',
    shrubZ(true, 0) >= 21.8 && shrubZ(true, 1) === 36.4);

  ok('beach rocks stay on sand',
    dressing.includes('const z = 3 + rng2() * 15'));
  ok('ferns / entrance shrubs stay',
    dressing.includes("await scatterSafe('fern_02', ferns, 'ferns')")
    && dressing.includes("'entrance-shrubs'"));
  ok('no leftoverLot I / leftoverGrass / palms restack',
    !dressing.includes('leftoverLot I')
    && !dressing.includes('LEFTOVER_LOT_I')
    && !dressing.includes('leftoverGrass')
    && !dressing.includes('LEFTOVER_GRASS_')
    && !existsSync(join(here, 'landmarks/leftoverLotI.js')));

  if (fails.length) {
    console.error('[miami-dressing] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-dressing] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('dressingTest.js');
if (isMain) {
  const r = runMiamiDressingTests();
  if (!r.passed) process.exit(1);
}
