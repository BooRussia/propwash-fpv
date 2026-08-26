// Headless source-locks for the 8th-street analogue (GAP_X=-129).
// No three.js, no game state.
//
//   node ./tools/run-miami-eighth-test.mjs

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EIGHTH_X, EIGHTH_W_FRONT_X, EIGHTH_E_FRONT_X,
  EIGHTH_W_CELLS, EIGHTH_E_CELLS,
  EIGHTH_SOFFIT, EIGHTH_PASS_W, EIGHTH_PASS_H, EIGHTH_D, EIGHTH_H,
  eighthShops,
  FLY_VOIDS, flyColliderShapes, inKeepout, inReserved, inFlyVoid,
  leftoverLotOverlap, streetOverlap, reservedOverlap,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_H_X, CITY_Y, GAP_X, XS_HALF,
  COLONY_X, COLONY_W, WASH_Z0, WASH_Z1, WASH_X0, WASH_X1,
  INLAND_MIDRISE_CELLS, INLAND_MIDRISE_W, INLAND_MIDRISE_D,
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

export function runMiamiEighthTests() {
  fails.length = 0;
  passedCount = 0;

  const eighth = readFileSync(join(here, 'landmarks/eighth.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const buildings = readFileSync(join(here, 'buildings.js'), 'utf8');
  const crowd = readFileSync(join(here, 'crowd.js'), 'utf8');
  const kit = flyColliderShapes();

  ok('eighth.js exists', existsSync(join(here, 'landmarks/eighth.js')));
  ok('no layout rng',
    !/\brng2?\s*\(/.test(eighth)
    && !/\brng3\s*\(/.test(eighth)
    && !/\brng4\s*\(/.test(eighth));
  ok('no ShaderMaterial / ped / traffic',
    !eighth.includes('ShaderMaterial')
    && !eighth.includes('ped.js') && !eighth.includes('traffic.js'));
  ok('index calls buildEighth after washington, before flythrough',
    index.includes('buildEighth(ctx)')
    && index.indexOf('buildEighth(ctx)') > index.indexOf('buildWashington(ctx)')
    && index.indexOf('buildEighth(ctx)') < index.indexOf('buildFlythrough(ctx)'));
  ok('backdrop 60-box contract untouched',
    buildings.includes('for (let i = 0; i < 60; i++)'));

  ok('8th-street is GAP_X=-129, west of leftoverLot A',
    EIGHTH_X === -129 && EIGHTH_X === GAP_X[2]
    && EIGHTH_W_FRONT_X === EIGHTH_X - XS_HALF - 2.4
    && EIGHTH_E_FRONT_X === EIGHTH_X + XS_HALF + 2.4
    && EIGHTH_W_FRONT_X < EIGHTH_X && EIGHTH_E_FRONT_X > EIGHTH_X
    && EIGHTH_E_FRONT_X + EIGHTH_D < 240
    && EIGHTH_W_FRONT_X < 240);
  ok('shop cells are signed inland of Ocean Drive',
    EIGHTH_W_CELLS.length === 4 && EIGHTH_E_CELLS.length === 2
    && EIGHTH_W_CELLS.every(([, len]) => len >= 8)
    && EIGHTH_E_CELLS.every(([, len]) => len >= 8)
    && EIGHTH_E_CELLS[0][0] === 95 && EIGHTH_E_CELLS[0][1] === 8
    && EIGHTH_W_CELLS[0][0] === 114);
  ok('soffit and passage are flyable',
    EIGHTH_SOFFIT >= 3.2 && EIGHTH_PASS_W >= 2.0 && EIGHTH_PASS_H >= 2.0
    && EIGHTH_D === 12 && EIGHTH_H >= 8);

  const shops = eighthShops();
  ok('six signed 8th-street shops', shops.length === 6);
  for (let i = 0; i < shops.length; i++) {
    const g = shops[i];
    ok(`${g.id} reserved + keepout west of 240`,
      g.x1 + 1.8 < 240 && g.x1 < 251 && inReserved(g.x, g.z) && inKeepout(g.x, g.z));
    ok(`${g.id} misses leftoverLot / street / travel`,
      leftoverLotOverlap(g.x, g.z, g.x1 - g.x0, g.len, 0.15) === false
      && streetOverlap(g.x, g.z, g.x1 - g.x0, g.len) === false
      && g.z0 > TRAVEL_Z1
      && !(g.z0 < TRAVEL_Z1 && g.z1 > TRAVEL_Z0)
      && g.x1 < 251);
    ok(`${g.id} misses colony / Washington carriageway / mid-rises`,
      reservedOverlap(COLONY_X, 70.8, COLONY_W + 2.4, 30.4, 0.15) === true
      && !(g.z0 < 86 && g.z1 > 55.6 && g.x1 > COLONY_X - COLONY_W / 2 - 1.2
        && g.x0 < COLONY_X + COLONY_W / 2 + 1.2)
      && !(g.z1 > WASH_Z0 && g.z0 < WASH_Z1
        && g.x1 > WASH_X0 && g.x0 < Math.min(WASH_X1, 240))
      && INLAND_MIDRISE_CELLS.every(([mx, mz]) => {
        const ox = Math.min(g.x1, mx + INLAND_MIDRISE_W / 2)
          - Math.max(g.x0, mx - INLAND_MIDRISE_W / 2);
        const oz = Math.min(g.z1, mz + INLAND_MIDRISE_D / 2)
          - Math.max(g.z0, mz - INLAND_MIDRISE_D / 2);
        return ox <= 0.15 || oz <= 0.15;
      }));
    const arcade = FLY_VOIDS.find((v) => v.id === `${g.id}-arcade`);
    const pass = FLY_VOIDS.find((v) => v.id === `${g.id}-pass`);
    ok(`${g.id}-arcade void`,
      !!arcade && arcade.openH === EIGHTH_SOFFIT && inFlyVoid(arcade.x, arcade.z));
    ok(`${g.id}-pass void`,
      !!pass && pass.openW === EIGHTH_PASS_W && inFlyVoid(pass.x, pass.z));
    if (arcade) {
      const hit = probeBlocked(kit, arcade.x, arcade.y, arcade.z, 0.28);
      const high = probeBlocked(kit, arcade.x, CITY_Y + EIGHTH_SOFFIT - 0.45, arcade.z, 0.28);
      ok(`${g.id}-arcade keepout + open`,
        !!inKeepout(arcade.x, arcade.z) && !hit, hit ? `${hit.tag}` : '');
      ok(`${g.id}-arcade high ±Z is open`, !high, high ? `${high.tag}` : '');
    }
    if (pass) {
      const hit = probeBlocked(kit, pass.x, pass.y, pass.z, 0.28);
      ok(`${g.id}-pass keepout + open`,
        !!inKeepout(pass.x, pass.z) && !hit, hit ? `${hit.tag}` : '');
    }
  }

  const hitsTravel = kit.filter((s) => {
    const z0 = s.type === 'cyl' ? s.z - s.r : s.z - s.sz / 2;
    const z1 = s.type === 'cyl' ? s.z + s.r : s.z + s.sz / 2;
    return s.tag === 'eighth' && z0 < TRAVEL_Z1 && z1 > TRAVEL_Z0;
  });
  ok('no eighth collider in travel lanes 40.2–47.8',
    hitsTravel.length === 0, hitsTravel.slice(0, 3).map((s) => `${s.type}`).join(','));

  ok('crowd has no colliders (NPCs stay visual-only)',
    !crowd.includes('addCollider') && !crowd.includes('addCyl'));
  ok('leftoverLot A–H unmoved',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));
  ok('CITY_Y unchanged', CITY_Y === 1.5);

  if (fails.length) {
    console.error('[miami-eighth] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-eighth] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('eighthTest.js');
if (isMain) {
  const r = runMiamiEighthTests();
  if (!r.passed) process.exit(1);
}
