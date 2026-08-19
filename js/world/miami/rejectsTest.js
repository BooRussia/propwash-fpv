// Headless checks for the Miami reject ticket: palms off pavement,
// crash-cam floor, deck tops, sidewalks, fly-through voids.
// No three.js, no game state.
//
//   node ./js/world/miami/rejectsTest.js

import {
  CITY_Z, CITY_Y, PIER_X, GAP_X, XS_HALF, XS_Z0, XS_Z1,
  LUMMUS_X0, LUMMUS_X1, LUMMUS_Z, LUMMUS_HALF,
  ROAD_Z, BOARDWALK_Z, BOARDWALK_TOP, PIER_DECK_TOP, PIER_DECK_Z, PAVILION_Z,
  PLANT_BEACH_Z, PLANT_CITY_Z, CROSS_X,
  SW_BEACH_Z0, SW_BEACH_Z1, SW_CITY_Z0, SW_CITY_Z1,
  GATE_POST_R, GARAGE_AISLE_W,
  onPavement, onRoadway, onBoardwalk, onCrossStreet, onLummusWalk,
  onSidewalk, onCurb, onPlantingRow, sidewalkInterrupted, sidewalkRuns,
  inKeepout, inFlyVoid, FLY_VOIDS, flyColliderShapes, pierFlyShapes,
  groundHeight, deckTop, cameraFloor,
} from './constants.js';
import { minCameraY, clampCameraToFloor, CAM_FLOOR_SLACK } from '../../camera/floor.js';

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

/** 3D probe against published jamb/post/beam shapes. Allocation-free. */
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

export function runMiamiRejectsTests() {
  fails.length = 0;
  passedCount = 0;

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

  // ---- 3. sidewalks are not onRoadway planting rows -----------------------
  ok('planting 36.5 is a planting row', onPlantingRow(PLANT_BEACH_Z));
  ok('planting 51.5 is a planting row', onPlantingRow(PLANT_CITY_Z));
  ok('planting row is not roadway', !onRoadway(PLANT_BEACH_Z) && !onRoadway(PLANT_CITY_Z));
  ok('planting row is not sidewalk', !onSidewalk(0, PLANT_BEACH_Z) && !onSidewalk(0, PLANT_CITY_Z));
  ok('planting row is not pavement', !onPavement(0, PLANT_BEACH_Z) && !onPavement(0, PLANT_CITY_Z));
  ok('beach walk is sidewalk', onSidewalk(0, (SW_BEACH_Z0 + SW_BEACH_Z1) / 2));
  ok('city walk is sidewalk', onSidewalk(0, (SW_CITY_Z0 + SW_CITY_Z1) / 2));
  ok('sidewalk is pavement (drop, never nudge)',
    onPavement(0, (SW_BEACH_Z0 + SW_BEACH_Z1) / 2)
    && onPavement(0, (SW_CITY_Z0 + SW_CITY_Z1) / 2));
  ok('sidewalk is not roadway',
    !onRoadway((SW_BEACH_Z0 + SW_BEACH_Z1) / 2)
    && !onRoadway((SW_CITY_Z0 + SW_CITY_Z1) / 2));
  ok('curb is not a planting row', !onPlantingRow((37.14 + 37.52) / 2) && onCurb(37.33));
  ok('crosswalk cut is not a sidewalk wall',
    sidewalkInterrupted(CROSS_X[0]) && sidewalkInterrupted(CROSS_X[1]));
  ok('walk runs skip every GAP_X', sidewalkRuns().every((run) =>
    !GAP_X.some((cx) => cx >= run.x0 && cx <= run.x1)));
  ok('sidewalk slab misses the planting row',
    SW_BEACH_Z1 < PLANT_BEACH_Z && SW_CITY_Z0 > PLANT_CITY_Z);
  ok('legacy 34.4/53.6 remap would be sidewalk — do not snap there',
    onSidewalk(0, 34.4) && onSidewalk(0, 53.6));
  ok('plan snap 36.5/51.5 stays off the walk',
    !onSidewalk(0, 36.5) && !onSidewalk(0, 51.5) && !onPavement(0, 36.5));

  // ---- 4. fly-through voids stay open; jambs smaller than the opening -----
  const kit = flyColliderShapes();
  const pier = pierFlyShapes();
  const all = kit.concat(pier);
  const kitVoids = FLY_VOIDS.filter((v) => v.kind === 'kit');
  ok('two new kit fly-throughs', kitVoids.length >= 2);
  ok('pier lines still listed',
    FLY_VOIDS.some((v) => v.id === 'pier-undercroft')
    && FLY_VOIDS.some((v) => v.id === 'pier-pavilion'));

  for (const v of FLY_VOIDS) {
    const hit = probeBlocked(all, v.x, v.y, v.z, 0.28);
    ok(`${v.id} bay centre open`, !hit, hit ? `blocked by ${hit.tag} ${hit.type}` : '');
    ok(`${v.id} keepout reserved`, !!inKeepout(v.x, v.z) || v.kind === 'existing');
    ok(`${v.id} inFlyVoid`, !!inFlyVoid(v.x, v.z));
    ok(`${v.id} opening is flyable`, v.openW >= 1.15 && v.openH >= 2.0);
  }

  const gatePosts = kit.filter((s) => s.tag === 'boardwalk-gate' && s.type === 'cyl');
  const garageWalls = kit.filter((s) => s.tag === 'garage' && s.type === 'aabb' && s.sy > 2);
  ok('gate has post colliders', gatePosts.length === 4);
  ok('gate posts smaller than sash',
    gatePosts.every((p) => p.r * 2 < 2.0 - 1e-6) && GATE_POST_R * 2 < 2.0);
  ok('gate post occupies its own footprint',
    !!probeBlocked(kit, gatePosts[0].x, gatePosts[0].y0 + 1.0, gatePosts[0].z, 0.02));
  ok('garage has jamb masses', garageWalls.length === 2);
  ok('garage jamb thinner than aisle',
    garageWalls.every((w) => w.sx < GARAGE_AISLE_W - 0.5));
  ok('garage jamb exists beside the mouth',
    !!probeBlocked(kit, garageWalls[0].x, CITY_Y + 1.6, garageWalls[0].z, 0.05));
  const pylon = pier.find((s) => s.tag === 'pier' && s.type === 'cyl' && s.y0 < 0);
  ok('pier pylon collider exists', !!pylon && pylon.r === 0.4);
  ok('pier pylon smaller than bay', pylon && pylon.r * 2 < 8.8);

  if (fails.length) {
    console.error('[miami-rejects] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-rejects] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('rejectsTest.js');
if (isMain) {
  const r = runMiamiRejectsTests();
  if (!r.passed) process.exit(1);
}
