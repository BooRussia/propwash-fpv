// Headless checks for the Miami abando haunt kit.
// No three.js, no game state.
//
//   node ./tools/run-miami-abando-test.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_Y,
  ABANDO_X, ABANDO_Z, ABANDO_BAY_W, ABANDO_BAY_H,
  ABANDO_SASH_W, ABANDO_STAIR_CLEAR, ABANDO_STAIR_T,
  ABANDO_MANHOLE, ABANDO_WALL, ABANDO_SILO_WALL,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, inReserved, groundHeight,
  abandoVoids, abandoColliderShapes,
} from './constants.js';
import { tryPlace } from './planting.js';

const here = dirname(fileURLToPath(import.meta.url));
const ABANDO_W_FILL = 13.5;
const ABANDO_D_FILL = 8.8;

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

export function runMiamiAbandoTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const voids = abandoVoids();
  const shapes = abandoColliderShapes();
  const bays = voids.filter((v) => v.kind === 'bay' || v.kind === 'sash');
  const stair = voids.find((v) => v.kind === 'stair');
  const hole = voids.find((v) => v.kind === 'manhole');

  // ---- leftover lot, not a street / boardwalk ----------------------------
  ok('lot is not pavement', !onPavement(ABANDO_X, ABANDO_Z));
  ok('lot is not boardwalk', !onBoardwalk(ABANDO_X, ABANDO_Z));
  ok('lot is not roadway', !onRoadway(ABANDO_Z));
  ok('lot is not a cross-street', !onCrossStreet(ABANDO_X, ABANDO_Z));
  ok('lot is not a sidewalk slab', !onSidewalk(ABANDO_X, ABANDO_Z));
  ok('lot sits on the city plateau', groundHeight(ABANDO_X, ABANDO_Z) === CITY_Y);
  ok('lot is reserved', inReserved(ABANDO_X, ABANDO_Z));
  ok('lot is a keepout', inKeepout(ABANDO_X, ABANDO_Z));
  ok('tryPlace drops the reserved lot', tryPlace(ctx, ABANDO_X, ABANDO_Z) === 0);
  ok('tryPlace does not remap the lot', tryPlace(ctx, ABANDO_X, ABANDO_Z) === 0);

  // ---- each bay / stair / manhole probe is open --------------------------
  ok('abando ships bay + stair + manhole voids',
    bays.length >= 3 && !!stair && !!hole);
  for (const v of voids) {
    const hit = probeBlocked(shapes, v.x, v.y, v.z, v.probe);
    ok(`${v.id} centre open`, !hit, hit ? `blocked by ${hit.tag} ${hit.type}` : '');
  }

  ok('5" bay is 1.2–2.4 m', ABANDO_BAY_W >= 1.2 && ABANDO_BAY_W <= 2.4
    && ABANDO_BAY_H >= 1.2 && ABANDO_BAY_H <= 2.4);
  ok('whoop sash is a punched bay', ABANDO_SASH_W >= 1.2 && ABANDO_SASH_W <= 2.4);
  ok('stair clear is 0.91–1.12 m', ABANDO_STAIR_CLEAR >= 0.91 && ABANDO_STAIR_CLEAR <= 1.12);
  ok('manhole is Ø0.61 m', Math.abs(ABANDO_MANHOLE - 0.61) < 1e-9);
  ok('bay voids use the locked width', bays.filter((v) => v.kind === 'bay')
    .every((v) => v.openW === ABANDO_BAY_W && v.openH === ABANDO_BAY_H));
  ok('stair void uses the locked clear', stair.openW === ABANDO_STAIR_CLEAR);
  ok('manhole void uses Ø0.61', hole.openW === ABANDO_MANHOLE);

  // ---- jambs exist and are smaller than the opening ----------------------
  const jambs = shapes.filter((s) => s.tag === 'abando' && s.type === 'aabb');
  ok('abando has jamb / lip colliders', jambs.length >= 8);
  ok('no filled-opening collider tagged fat',
    !jambs.some((s) => s.sx >= ABANDO_W_FILL && s.sz >= ABANDO_D_FILL && s.sy >= 6));
  ok('wall jamb thinner than the 5" bay',
    ABANDO_WALL < ABANDO_BAY_W - 0.5 && ABANDO_WALL < ABANDO_BAY_H - 0.5);
  ok('stringer thinner than the stair clear',
    ABANDO_STAIR_T < ABANDO_STAIR_CLEAR - 0.5);
  ok('silo wall thinner than the manhole',
    ABANDO_SILO_WALL < ABANDO_MANHOLE - 0.15);

  const oceanBay = voids.find((v) => v.id === 'abando-bay-ocean-0');
  const jambHit = probeBlocked(
    shapes,
    oceanBay.x - ABANDO_BAY_W / 2 - ABANDO_WALL * 0.45,
    oceanBay.y,
    oceanBay.z,
    0.04,
  );
  ok('ocean-bay jamb exists beside the opening', !!jambHit);

  const stairJamb = probeBlocked(
    shapes,
    stair.x - ABANDO_STAIR_CLEAR / 2 - ABANDO_STAIR_T * 0.45,
    stair.y,
    stair.z,
    0.03,
  );
  ok('stair stringer exists beside the clear', !!stairJamb);

  const crown = shapes.filter((s) => s.y0 >= CITY_Y + 14.0 && s.sy <= 0.4);
  ok('silo crown lip exists', crown.length >= 4);
  ok('crown slabs stay outside the manhole',
    crown.every((s) => {
      const dx = Math.abs(s.x - hole.x) - s.sx / 2;
      const dz = Math.abs(s.z - hole.z) - s.sz / 2;
      return dx > -0.02 || dz > -0.02;
    }));

  const midSilo = probeBlocked(shapes, hole.x, CITY_Y + 7.2, hole.z, 0.22);
  ok('silo interior is not a filled cylinder', !midSilo);

  // ---- one placer; no second scatterer; look locks -----------------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const abando = readFileSync(join(here, 'landmarks/abando.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const blades = readFileSync(join(here, 'blades.js'), 'utf8');
  const water = readFileSync(join(here, 'bayWater.js'), 'utf8');

  ok('tryPlace is still the placer', planting.includes('export function tryPlace'));
  ok('abando is not a second scatterer',
    !abando.includes('scatterModels') && !abando.includes('planDirtBlades'));
  ok('abando does not invent a placer',
    !/export function tryPlace/.test(abando)
    && abando.includes('tryPlace')
    && abando.includes('onPavement'));
  ok('abando rejects pavement instead of remapping',
    abando.includes('if (onPavement(ABANDO_X, ABANDO_Z)) return null;')
    && !/ABANDO_X\s*=/.test(abando));
  ok('index builds abando on the fly-through keepout path',
    index.includes("from './landmarks/abando.js'")
    && index.includes('buildAbando(ctx)')
    && index.indexOf('buildAbando') > index.indexOf('buildFlythrough')
    && index.indexOf('buildAbando') < index.indexOf('buildBlades'));
  ok('no custom mat',
    !/\bShaderMaterial\b/.test(abando) && !/\bonBeforeCompile\b/.test(abando)
    && abando.includes('MeshStandardMaterial'));
  ok('kit is graffiti concrete + rebar, no furniture',
    abando.includes('GRAF_') && abando.includes('REBAR')
    && !/chair|sofa|table|crate|bench/i.test(abando));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust'));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !water.includes('abando'));

  if (fails.length) {
    console.error('[miami-abando] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-abando] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('abandoTest.js');
if (isMain) {
  const r = runMiamiAbandoTests();
  if (!r.passed) process.exit(1);
}
