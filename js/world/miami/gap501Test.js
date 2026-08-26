// Headless source-locks for GAP_X=-501 inland storefronts.
// No three.js, no game state.
//
//   node ./tools/run-miami-gap-501-test.mjs

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GAP501_X, GAP501_W_FRONT_X, GAP501_E_FRONT_X,
  GAP501_W_CELLS, GAP501_E_CELLS,
  GAP501_SOFFIT, GAP501_PASS_W, GAP501_PASS_H, GAP501_D, GAP501_H,
  gap501Shops,
  FLY_VOIDS, flyColliderShapes, inKeepout, inReserved, inFlyVoid,
  leftoverLotOverlap, streetOverlap, reservedOverlap,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_H_X, CITY_Y, GAP_X, XS_HALF,
  WASH_Z0, WASH_Z1, WASH_X0, WASH_X1,
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

export function runMiamiGap501Tests() {
  fails.length = 0;
  passedCount = 0;

  const gap501 = readFileSync(join(here, 'landmarks/gap501.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const buildings = readFileSync(join(here, 'buildings.js'), 'utf8');
  const crowd = readFileSync(join(here, 'crowd.js'), 'utf8');
  const kit = flyColliderShapes();

  ok('gap501.js exists', existsSync(join(here, 'landmarks/gap501.js')));
  ok('no layout rng',
    !/\brng2?\s*\(/.test(gap501)
    && !/\brng3\s*\(/.test(gap501)
    && !/\brng4\s*\(/.test(gap501));
  ok('no ShaderMaterial / ped / traffic',
    !gap501.includes('ShaderMaterial')
    && !gap501.includes('ped.js') && !gap501.includes('traffic.js'));
  ok('index calls buildGap501 after gap315, before flythrough',
    index.includes('buildGap501(ctx)')
    && index.indexOf('buildGap501(ctx)') > index.indexOf('buildGap315(ctx)')
    && index.indexOf('buildGap501(ctx)') < index.indexOf('buildFlythrough(ctx)'));
  ok('backdrop 60-box contract untouched',
    buildings.includes('for (let i = 0; i < 60; i++)'));

  ok('GAP_X=-501, west of leftoverLot A',
    GAP501_X === -501 && GAP501_X === GAP_X[0]
    && GAP501_W_FRONT_X === GAP501_X - XS_HALF - 2.4
    && GAP501_E_FRONT_X === GAP501_X + XS_HALF + 2.4
    && GAP501_W_FRONT_X < GAP501_X && GAP501_E_FRONT_X > GAP501_X
    && GAP501_E_FRONT_X + GAP501_D < 240
    && GAP501_W_FRONT_X < 240
    && GAP501_E_FRONT_X + GAP501_D < 251);
  ok('shop cells are signed inland of Ocean Drive',
    GAP501_W_CELLS.length === 4 && GAP501_E_CELLS.length === 5
    && GAP501_W_CELLS.every(([, len]) => len >= 8)
    && GAP501_E_CELLS.every(([, len]) => len >= 8)
    && GAP501_E_CELLS[0][0] === 95 && GAP501_E_CELLS[0][1] === 8
    && GAP501_W_CELLS[0][0] === 114);
  ok('soffit and passage are flyable',
    GAP501_SOFFIT >= 3.2 && GAP501_PASS_W >= 2.0 && GAP501_PASS_H >= 2.0
    && GAP501_D === 12 && GAP501_H >= 8);

  const shops = gap501Shops();
  ok('nine signed GAP_X=-501 shops', shops.length === 9);
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
    ok(`${g.id} misses helipadW / Washington carriageway / mid-rises`,
      reservedOverlap(-430, 101, 44, 54, 0.15) === true
      && g.x1 < -452
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
      !!arcade && arcade.openH === GAP501_SOFFIT && inFlyVoid(arcade.x, arcade.z));
    ok(`${g.id}-pass void`,
      !!pass && pass.openW === GAP501_PASS_W && inFlyVoid(pass.x, pass.z));
    if (arcade) {
      const hit = probeBlocked(kit, arcade.x, arcade.y, arcade.z, 0.28);
      const high = probeBlocked(kit, arcade.x, CITY_Y + GAP501_SOFFIT - 0.45, arcade.z, 0.28);
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
    return s.tag === 'gap501' && z0 < TRAVEL_Z1 && z1 > TRAVEL_Z0;
  });
  ok('no gap501 collider in travel lanes 40.2–47.8',
    hitsTravel.length === 0, hitsTravel.slice(0, 3).map((s) => `${s.type}`).join(','));

  ok('crowd has no colliders (NPCs stay visual-only)',
    !crowd.includes('addCollider') && !crowd.includes('addCyl'));
  ok('leftoverLot A–H unmoved',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));
  ok('CITY_Y unchanged', CITY_Y === 1.5);

  if (fails.length) {
    console.error('[miami-gap-501] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-gap-501] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('gap501Test.js');
if (isMain) {
  const r = runMiamiGap501Tests();
  if (!r.passed) process.exit(1);
}
