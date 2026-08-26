// Headless source-locks for the Lincoln Road pedestrian mall analogue.
// No three.js, no game state.
//
//   node ./tools/run-miami-lincoln-test.mjs

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LINCOLN_Z, LINCOLN_HALF, LINCOLN_S_FRONT_Z, LINCOLN_N_FRONT_Z,
  LINCOLN_S_CELLS, LINCOLN_N_CELLS, LINCOLN_PERGOLA_CELLS, LINCOLN_WALK_RUNS,
  LINCOLN_SOFFIT, LINCOLN_PASS_W, LINCOLN_PASS_H, LINCOLN_D, LINCOLN_H,
  LINCOLN_PERGOLA_POST_H, LINCOLN_PERGOLA_HALF_X, LINCOLN_PERGOLA_HALF_Z,
  lincolnShops, lincolnPergolas, lincolnWalkRuns,
  FLY_VOIDS, flyColliderShapes, inKeepout, inReserved, inFlyVoid,
  leftoverLotOverlap, streetOverlap, onLincolnWalk, onPavement,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_H_X, CITY_Y,
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

export function runMiamiLincolnTests() {
  fails.length = 0;
  passedCount = 0;

  const lincoln = readFileSync(join(here, 'landmarks/lincoln.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const buildings = readFileSync(join(here, 'buildings.js'), 'utf8');
  const crowd = readFileSync(join(here, 'crowd.js'), 'utf8');
  const kit = flyColliderShapes();

  ok('lincoln.js exists', existsSync(join(here, 'landmarks/lincoln.js')));
  ok('no layout rng',
    !/\brng2?\s*\(/.test(lincoln)
    && !/\brng3\s*\(/.test(lincoln)
    && !/\brng4\s*\(/.test(lincoln));
  ok('no ShaderMaterial / ped / traffic',
    !lincoln.includes('ShaderMaterial')
    && !lincoln.includes('ped.js') && !lincoln.includes('traffic.js'));
  ok('index calls buildLincoln after inland, before flythrough',
    index.includes('buildLincoln(ctx)')
    && index.indexOf('buildLincoln(ctx)') > index.indexOf('buildInland(ctx)')
    && index.indexOf('buildLincoln(ctx)') < index.indexOf('buildFlythrough(ctx)'));
  ok('backdrop 60-box contract untouched',
    buildings.includes('for (let i = 0; i < 60; i++)'));

  ok('mall centre is z=120 west of leftoverLot A',
    LINCOLN_Z === 120 && LINCOLN_HALF === 5
    && LINCOLN_S_FRONT_Z === 115 && LINCOLN_N_FRONT_Z === 125
    && LINCOLN_D === 10 && LINCOLN_H >= 8
    && LINCOLN_PERGOLA_CELLS.length === 4
    && LINCOLN_PERGOLA_CELLS.every(([x, z]) => x < 240 && z === LINCOLN_Z && x < 251));
  ok('shop cells are signed pairs, four per face',
    LINCOLN_S_CELLS.length === 4 && LINCOLN_N_CELLS.length === 4
    && LINCOLN_S_CELLS.every(([, len]) => len >= 8)
    && LINCOLN_N_CELLS.every(([, len]) => len >= 8));
  ok('pergola opening is flyable',
    LINCOLN_PERGOLA_POST_H >= 3.2
    && LINCOLN_PERGOLA_HALF_Z * 2 - 0.32 >= 1.15
    && LINCOLN_PERGOLA_HALF_X >= 2
    && LINCOLN_SOFFIT >= 3.2 && LINCOLN_PASS_W >= 2 && LINCOLN_PASS_H >= 2);

  const shops = lincolnShops();
  ok('eight shops', shops.length === 8);
  for (let i = 0; i < shops.length; i++) {
    const g = shops[i];
    ok(`${g.id} reserved + keepout west of 240`,
      g.x1 + 1.8 < 240 && inReserved(g.x, g.z) && inKeepout(g.x, g.z));
    ok(`${g.id} misses leftoverLot / street / travel`,
      leftoverLotOverlap(g.x, g.z, g.x1 - g.x0, g.z1 - g.z0, 0.15) === false
      && streetOverlap(g.x, g.z, g.x1 - g.x0, g.z1 - g.z0) === false
      && g.z0 > TRAVEL_Z1
      && !(g.z0 < TRAVEL_Z1 && g.z1 > TRAVEL_Z0)
      && g.x1 < 251);
    const arcade = FLY_VOIDS.find((v) => v.id === `${g.id}-arcade`);
    const pass = FLY_VOIDS.find((v) => v.id === `${g.id}-pass`);
    ok(`${g.id}-arcade void`, !!arcade && arcade.openH === LINCOLN_SOFFIT && inFlyVoid(arcade.x, arcade.z));
    ok(`${g.id}-pass void`, !!pass && pass.openW === LINCOLN_PASS_W && inFlyVoid(pass.x, pass.z));
    if (arcade) {
      ok(`${g.id}-arcade open`, !probeBlocked(kit, arcade.x, arcade.y, arcade.z, 0.28));
    }
    if (pass) {
      ok(`${g.id}-pass open`, !probeBlocked(kit, pass.x, pass.y, pass.z, 0.28));
    }
  }

  const pergolas = lincolnPergolas();
  ok('four pergolas', pergolas.length === 4);
  for (let i = 0; i < pergolas.length; i++) {
    const g = pergolas[i];
    const v = FLY_VOIDS.find((f) => f.id === `lincoln-pergola-${i}`);
    ok(`pergola ${g.x}/${g.z} reserved + void`,
      !!v && inReserved(g.x, g.z) && inKeepout(g.x, g.z)
      && g.x1 < 240 && g.z === LINCOLN_Z);
    ok(`pergola ${g.x} open bay`,
      !!v && !probeBlocked(kit, v.x, v.y, v.z, 0.28)
      && v.openW >= 1.15 && v.openH >= 2);
    ok(`pergola ${g.x} misses leftoverLot / street / travel`,
      leftoverLotOverlap(g.x, g.z, g.spanX, g.spanZ, 0.15) === false
      && streetOverlap(g.x, g.z, g.spanX, g.spanZ) === false
      && g.z0 > TRAVEL_Z1);
  }

  const runs = lincolnWalkRuns();
  ok('three mall runs west of x=240',
    runs.length === 3 && LINCOLN_WALK_RUNS.length === 3
    && runs.every((r) => r.x1 < 240 && r.z === LINCOLN_Z));
  ok('pavers are pavement, not leftoverLot A',
    onLincolnWalk(96, LINCOLN_Z) && onPavement(96, LINCOLN_Z)
    && onLincolnWalk(-250, LINCOLN_Z) && onLincolnWalk(190, LINCOLN_Z)
    && !onLincolnWalk(258, 84) && !onLincolnWalk(258, LINCOLN_Z)
    && leftoverLotOverlap(96, LINCOLN_Z, 4, 4, 0.15) === false);

  const hitsTravel = kit.filter((s) => {
    const z0 = s.type === 'cyl' ? s.z - s.r : s.z - s.sz / 2;
    const z1 = s.type === 'cyl' ? s.z + s.r : s.z + s.sz / 2;
    return s.tag === 'lincoln' && z0 < TRAVEL_Z1 && z1 > TRAVEL_Z0;
  });
  ok('no lincoln collider in travel lanes 40.2–47.8',
    hitsTravel.length === 0, hitsTravel.slice(0, 3).map((s) => `${s.type}`).join(','));

  ok('crowd walks Lincoln, no colliders',
    crowd.includes("kind: 'lincoln'") && crowd.includes('LINCOLN_WALK_Z')
    && crowd.includes('const nLincoln = 20')
    && !crowd.includes('addCollider') && !crowd.includes('addCyl'));
  ok('leftoverLot A–H unmoved',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));
  ok('CITY_Y unchanged', CITY_Y === 1.5);

  if (fails.length) {
    console.error('[miami-lincoln] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-lincoln] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('lincolnTest.js');
if (isMain) {
  const r = runMiamiLincolnTests();
  if (!r.passed) process.exit(1);
}
