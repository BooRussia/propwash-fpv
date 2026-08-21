// Headless checks for the Miami palm sand drop + crown-vs-deck fail.
// Source lock only — no three.js, no game state. Production cell
// is palms.js. Fronds are not solid; leftoverLot I stays dropped.
//
//   node ./tools/run-miami-palms-test.mjs

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

function slicePalmFits(src) {
  const start = src.indexOf('function palmFits(');
  const end = src.indexOf('export async function materializePalms');
  if (start < 0 || end < 0 || end <= start) return '';
  return src.slice(start, end);
}

function slicePlanPalms(src) {
  const start = src.indexOf('export function planPalms');
  const end = src.indexOf('function palmFits(');
  if (start < 0 || end < 0 || end <= start) return '';
  return src.slice(start, end);
}

function sliceReroll(src) {
  const start = src.indexOf('while (!y && tries < 36)');
  const end = src.indexOf('if (!y) continue');
  if (start < 0 || end < 0 || end <= start) return '';
  return src.slice(start, end);
}

export function runMiamiPalmsTests() {
  fails.length = 0;
  passedCount = 0;

  const palms = readFileSync(join(here, 'palms.js'), 'utf8');
  const fits = slicePalmFits(palms);
  const plan = slicePlanPalms(palms);
  const reroll = sliceReroll(palms);

  ok('palmFits is present', fits.includes('function palmFits(') && fits.length > 80);
  ok('planPalms / rng5 re-roll slices are present',
    plan.includes('export function planPalms') && plan.length > 80
    && reroll.includes('while (!y && tries < 36)') && reroll.length > 40);

  ok('signed deck is BOARDWALK_Z 27 / BOARDWALK_D 8',
    BOARDWALK_Z === 27 && BOARDWALK_D === 8
    && BOARDWALK_Z - BOARDWALK_D / 2 === 23
    && BOARDWALK_Z + BOARDWALK_D / 2 === 31);

  const planDraw = 'let z = rng() < 0.72 ? 26 + rng() * 32 : 6 + rng() * 18';
  const rerollDraw = 'z = rng5() < 0.72 ? 26 + rng5() * 32 : 6 + rng5() * 18';
  const sandContinue = 'if (z < 21.8) continue';
  const tiltDraw = 'const legacyTiltZ = (rng() - 0.5) * 0.12';
  ok('planPalms still draws sand scatter and field rows',
    palms.includes(planDraw)
    && palms.includes('6 + rng() * 18')
    && palms.includes('26 + rng() * 32'));
  ok('rng5 re-roll keeps the same sand / field draws',
    palms.includes(rerollDraw)
    && palms.includes('6 + rng5() * 18')
    && palms.includes('26 + rng5() * 32'));
  ok('planPalms rejects sand after all candidate draws',
    plan.includes(sandContinue)
    && plan.indexOf(planDraw) < plan.indexOf(tiltDraw)
    && plan.indexOf(tiltDraw) < plan.indexOf(sandContinue)
    && plan.indexOf('placed++') < plan.indexOf(sandContinue)
    && plan.indexOf(sandContinue) < plan.indexOf('plan.push'));
  ok('rng5 re-roll rejects sand after the z draw',
    reroll.includes(sandContinue)
    && reroll.indexOf(rerollDraw) < reroll.indexOf(sandContinue));
  ok('21.8 is the boardwalk ocean face',
    BOARDWALK_Z - BOARDWALK_D / 2 - BOARDWALK_SHOULDER === 21.8);
  ok('sand scatter 6 is a kiss; 21.8 / field 26 keep',
    6 < 21.8
    && 6 + 18 * ((21.8 - 6) / 18) === 21.8
    && 26 >= 21.8);
  ok('did not rewrite the sand / field z formula',
    !/z\s*=\s*21\.8/.test(plan)
    && !/z\s*=\s*Math\.(max|min)/.test(plan)
    && !/z\s*\+=/.test(plan)
    && plan.includes(planDraw));
  ok('HERO_POS spawn-side beach heroes are gone',
    !palms.includes('const HERO_POS = [')
    && !palms.includes('[-17, 19.5], [-10, 14], [-4, 22.5], [4, 17],')
    && !palms.includes('[11, 23], [17, 14.5], [24, 20.5], [30, 16.5,]')
    && !palms.includes('buildPalm'));

  ok('imports BOARDWALK_Z / BOARDWALK_D, no new box',
    palms.includes('BOARDWALK_Z, BOARDWALK_D')
    && !palms.includes('CROWN_DECK')
    && !palms.includes('DECK_Z0')
    && !palms.includes('PALM_DECK'));

  const crownLine = 'const crown = CROWN_R * sc + CROWN_MARGIN';
  const deckFail = 'if (Math.abs(z - BOARDWALK_Z) <= BOARDWALK_D / 2 + crown) return 0';
  ok('crown disk is CROWN_R * sc + CROWN_MARGIN', fits.includes(crownLine));
  ok('palmFits drops when crown intersects the signed deck',
    fits.includes(deckFail));
  ok('deck fail is after trunk / pavement / keepout / blocked probes',
    fits.indexOf('if (onPavement(x, z)) return 0') < fits.indexOf(deckFail)
    && fits.indexOf('if (!curated && inKeepout(x, z, 1.0)) return 0')
      < fits.indexOf(deckFail)
    && fits.indexOf('if (ctx.blocked(x, z, 0.9, y - 0.2, y + 2.4)) return 0')
      < fits.indexOf(deckFail)
    && fits.indexOf('if (ctx.blocked(x, z, crown, y + 3.4, y + 7.6 * sc)) return 0')
      < fits.indexOf(deckFail)
    && fits.indexOf(crownLine) < fits.indexOf(deckFail));
  ok('did not remint x/z onto the promenade or off the rail',
    !/z\s*=\s*BOARDWALK_/.test(fits)
    && !/x\s*=\s*BOARDWALK_/.test(fits)
    && !/z\s*\+=/.test(fits)
    && !/x\s*\+=/.test(fits)
    && !/z\s*=\s*Math\.(max|min)/.test(fits));

  const CROWN_R = 3.64;
  const CROWN_MARGIN = 1.2;
  ok('CROWN_R / CROWN_MARGIN stay measured',
    palms.includes('const CROWN_R = 3.64')
    && palms.includes('const CROWN_MARGIN = 1.2'));

  const crown = (sc) => CROWN_R * sc + CROWN_MARGIN;
  const hitsDeck = (z, sc) => Math.abs(z - BOARDWALK_Z) <= BOARDWALK_D / 2 + crown(sc);
  ok('sand beside the deck (z=19, sc=1) is a crown hit', hitsDeck(19, 1));
  ok('kiss at the seaward face drops',
    hitsDeck(BOARDWALK_Z - BOARDWALK_D / 2 - crown(1), 1));
  ok('far sand (z=14, sc=1) misses the deck', !hitsDeck(14, 1));
  ok('field row 36.5 at unit scale misses', !hitsDeck(36.5, 1));

  ok('colliders stay trunk cylinders',
    palms.includes('addCyl(x, y, z, TRUNK_R * sc, 6.2 * sc)')
    && palms.includes('const TRUNK_R = 0.30')
    && palms.includes('trunk only: fronds are not solid'));
  ok('no fat canopy AABB added',
    palms.includes('a fat box around the canopy is')
    && !/addBox\(.*crown/.test(palms)
    && !/addAabb\(/.test(palms));

  ok('no leftoverLot I / dressing / leftoverGrass / blades / beachProps restack',
    !palms.includes('leftoverLot I')
    && !palms.includes('LEFTOVER_LOT_I')
    && !palms.includes('leftoverGrass')
    && !palms.includes('LEFTOVER_GRASS_')
    && !palms.includes('beachProps')
    && !palms.includes('dressing.js')
    && !palms.includes('blades.js')
    && !palms.includes('pocketPark')
    && !existsSync(join(here, 'landmarks/leftoverLotI.js')));

  if (fails.length) {
    console.error('[miami-palms] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-palms] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('palmsTest.js');
if (isMain) {
  const r = runMiamiPalmsTests();
  if (!r.passed) process.exit(1);
}
