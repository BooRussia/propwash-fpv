// Headless checks for Miami dive / pier undercroft / reef.
//
//   node ./tools/run-miami-underwater-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cameraFloor, deckBottom, deckTop, groundHeight, seabedHeight,
  PIER_X, PIER_DECK_Z, PIER_DECK_TOP, PIER_DECK_H, SHORE_Z,
} from './constants.js';
import { clampCameraToFloor } from '../../camera/floor.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

export function runMiamiUnderwaterTests() {
  fails.length = 0;
  passedCount = 0;

  const constants = readFileSync(join(here, 'constants.js'), 'utf8');
  const floor = readFileSync(join(root, 'js/camera/floor.js'), 'utf8');
  const quad = readFileSync(join(root, 'js/physics/quad.js'), 'utf8');
  const main = readFileSync(join(root, 'js/main.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const bay = readFileSync(join(here, 'bayWater.js'), 'utf8');
  const uw = readFileSync(join(here, 'underwater.js'), 'utf8');

  ok('groundHeight no longer clamps the bay to y=0',
    !constants.includes('water surface counts as ground')
    && groundHeight(0, -40) < -0.2
    && groundHeight(0, -40) === seabedHeight(0, -40));
  ok('city plateau is unchanged', groundHeight(0, 80) > 1.4);
  ok('2-arg cameraFloor over the pier is still the deck',
    cameraFloor(PIER_X, PIER_DECK_Z) === PIER_DECK_TOP);
  ok('3-arg undercroft uses the seabed',
    cameraFloor(PIER_X, PIER_DECK_Z, 0.4) === groundHeight(PIER_X, PIER_DECK_Z)
    && cameraFloor(PIER_X, PIER_DECK_Z, 0.4) < PIER_DECK_TOP - 1);
  ok('on-deck probe still lifts',
    cameraFloor(PIER_X, PIER_DECK_Z, PIER_DECK_TOP + 0.2) === PIER_DECK_TOP);
  ok('deckBottom is the plank underside',
    Math.abs(deckBottom(PIER_X, PIER_DECK_Z) - (PIER_DECK_TOP - PIER_DECK_H)) < 1e-9
    && deckTop(PIER_X, PIER_DECK_Z) === PIER_DECK_TOP);

  const under = { x: PIER_X, y: 0.5, z: PIER_DECK_Z };
  clampCameraToFloor(under, cameraFloor, 0.06);
  ok('clamp does not teleport undercroft to the deck',
    under.y < PIER_DECK_TOP - 1 && Math.abs(under.y - 0.5) < 1e-6);

  ok('floor clamp passes y through',
    floor.includes('getFloor.length >= 3') && floor.includes('pos.y'));
  ok('quad applies fluid drag when submerged',
    quad.includes('env.fluid') && quad.includes('fluid.level') && quad.includes('fluid.drag'));
  ok('main forwards map fluid', main.includes('mapHandle.fluid'));
  ok('miami exposes a waterline fluid',
    index.includes('fluid: { level: 0') && index.includes('buildUnderwater'));
  ok('bay plate is double-sided for the dive',
    bay.includes('DoubleSide') && bay.includes('uCamUnder'));
  ok('reef sits east of the pier, not on the piles',
    uw.includes('PIER_X + 36') && uw.includes('REEF_Z = -118')
    && uw.includes('biscayne-reef') && uw.includes('biscayne-fish')
    && uw.includes('water-splash'));
  ok('underwater does not draw layout rng',
    !/\brng2?\(/.test(uw) && !/\brng3\(/.test(uw) && !/\brng4\(/.test(uw));
  ok('underwater module exists on disk',
    existsSync(join(here, 'underwater.js')));

  if (fails.length) {
    console.error('[miami-underwater] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-underwater] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('underwaterTest.js');
if (isMain) {
  const r = runMiamiUnderwaterTests();
  if (!r.passed) process.exit(1);
}
