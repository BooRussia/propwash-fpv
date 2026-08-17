// Headless checks for the Miami reject ticket: palms off pavement,
// crash-cam floor, deck tops. No three.js, no game state.
//
//   node ./js/world/miami/rejectsTest.js

import {
  CITY_Z, CITY_Y, PIER_X, GAP_X, XS_HALF, XS_Z0, XS_Z1,
  LUMMUS_X0, LUMMUS_X1, LUMMUS_Z, LUMMUS_HALF,
  ROAD_Z, BOARDWALK_Z, BOARDWALK_TOP, PIER_DECK_TOP, PIER_DECK_Z, PAVILION_Z,
  onPavement, onRoadway, onBoardwalk, onCrossStreet, onLummusWalk,
  inKeepout, groundHeight, deckTop, cameraFloor,
} from './constants.js';
import { minCameraY, clampCameraToFloor, CAM_FLOOR_SLACK } from '../../camera/floor.js';

const fails = [];
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
};

export function runMiamiRejectsTests() {
  fails.length = 0;

  // ---- 1. pavement reject ------------------------------------------------
  ok('boardwalk centre is pavement', onPavement(0, BOARDWALK_Z));
  ok('boardwalk shoulder is pavement', onPavement(10, BOARDWALK_Z - 4 - 1.0));
  ok('hero on deck dropped', onPavement(-4, 22.5) && onPavement(11, 23));
  ok('hero on sand kept', !onPavement(-10, 14) && !onPavement(4, 17) && !onPavement(17, 14.5));
  ok('scatter-on-deck band dropped', onBoardwalk(0, 24));
  ok('Ocean Drive carriageway', onRoadway(ROAD_Z) && onPavement(0, ROAD_Z));
  ok('sidewalk planting row open', !onRoadway(36.5) && !onPavement(0, 36.5));
  ok('cross-street column', onCrossStreet(GAP_X[0], (XS_Z0 + XS_Z1) / 2)
    && onPavement(GAP_X[2], 80));
  ok('off the cross-street', !onCrossStreet(GAP_X[0] + XS_HALF + 1.2, 80));
  ok('Lummus walk', onLummusWalk((LUMMUS_X0 + LUMMUS_X1) / 2, LUMMUS_Z)
    && onPavement(-80, LUMMUS_Z));
  ok('Lummus flanking palm off the walk', !onLummusWalk(-80, LUMMUS_Z - 5.4));
  ok('plaza keepout still a keepout', inKeepout(-215, 14.6, 1.0));
  ok('sand is not pavement', !onPavement(0, 8) && !onPavement(40, 12));

  // drop, never nudge: a fail is a boolean reject, not a remapped z
  ok('onPavement is a predicate', onPavement(0, BOARDWALK_Z) === true);

  // ---- 2. deck tops / camera floor --------------------------------------
  ok('boardwalk deck top', Math.abs(deckTop(0, BOARDWALK_Z) - BOARDWALK_TOP) < 1e-6);
  ok('pier deck top', Math.abs(deckTop(PIER_X, PIER_DECK_Z) - PIER_DECK_TOP) < 1e-6);
  ok('sand has no deck', !Number.isFinite(deckTop(0, 8)) || deckTop(0, 8) === -Infinity);
  ok('cameraFloor over boardwalk is deck', cameraFloor(0, BOARDWALK_Z) === BOARDWALK_TOP);
  ok('cameraFloor over pier is deck', cameraFloor(PIER_X, PIER_DECK_Z) === PIER_DECK_TOP);
  ok('cameraFloor over sand is ground',
    Math.abs(cameraFloor(0, 8) - groundHeight(0, 8)) < 1e-9);
  ok('pavilion sits on the pier deck',
    Math.abs(PAVILION_Z - (CITY_Z - 168)) < 1e-9
    && deckTop(PIER_X, PAVILION_Z) === PIER_DECK_TOP);

  const near = 0.06;
  const floor = (x, z) => cameraFloor(x, z);
  ok('minCameraY clears near plane on deck',
    minCameraY(0, BOARDWALK_Z, floor, near) >= BOARDWALK_TOP + near + CAM_FLOOR_SLACK - 1e-9);
  ok('minCameraY clears near plane on pier',
    minCameraY(PIER_X, PIER_DECK_Z, floor, near) >= PIER_DECK_TOP + near);
  const punched = { x: 0, y: 0.02, z: BOARDWALK_Z };
  clampCameraToFloor(punched, floor, near);
  ok('crash cam cannot punch the boardwalk', punched.y >= BOARDWALK_TOP + near);
  const throughPier = { x: PIER_X, y: 0.4, z: PIER_DECK_Z };
  clampCameraToFloor(throughPier, floor, near);
  ok('crash cam cannot punch the pier deck', throughPier.y >= PIER_DECK_TOP + near);
  const overWater = { x: 0, y: -2, z: -40 };
  clampCameraToFloor(overWater, floor, near);
  ok('crash cam stays above the water plane', overWater.y >= groundHeight(0, -40) + near);
  ok('missing floor is a no-op', (() => {
    const p = { x: 0, y: -4, z: 0 };
    clampCameraToFloor(p, null, near);
    return p.y === -4;
  })());

  ok('CITY_Y unchanged', CITY_Y === 1.5);

  if (fails.length) {
    console.error('[miami-rejects] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-rejects] ok', 24, 'checks');
  }
  return { passed: fails.length === 0, fails };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('rejectsTest.js');
if (isMain) {
  const r = runMiamiRejectsTests();
  if (!r.passed) process.exit(1);
}
