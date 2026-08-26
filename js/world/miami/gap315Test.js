// Headless source-locks for GAP_X=-315 inland storefronts.
// No three.js, no game state.
//
//   node ./tools/run-miami-gap-315-test.mjs

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GAP315_X, GAP315_W_FRONT_X, GAP315_E_FRONT_X,
  GAP315_W_CELLS, GAP315_E_CELLS,
  GAP315_SOFFIT, GAP315_PASS_W, GAP315_PASS_H, GAP315_D, GAP315_H,
  gap315Shops,
  FLY_VOIDS, flyColliderShapes, inKeepout, inReserved, inFlyVoid,
  leftoverLotOverlap, streetOverlap, reservedOverlap,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_H_X, CITY_Y, GAP_X, XS_HALF,
  MAJESTIC_X, MAJESTIC_W, WASH_Z0, WASH_Z1, WASH_X0, WASH_X1,
  WASH_TRAVEL_Z0, WASH_TRAVEL_Z1,
  INLAND_MIDRISE_CELLS, INLAND_MIDRISE_W, INLAND_MIDRISE_D,
} from './constants.js';
import { hash01 } from './rng.js';

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

export function runMiamiGap315Tests() {
  fails.length = 0;
  passedCount = 0;

  const gap315 = readFileSync(join(here, 'landmarks/gap315.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const buildings = readFileSync(join(here, 'buildings.js'), 'utf8');
  const crowd = readFileSync(join(here, 'crowd.js'), 'utf8');
  const kit = flyColliderShapes();

  ok('gap315.js exists', existsSync(join(here, 'landmarks/gap315.js')));
  ok('no layout rng',
    !/\brng2?\s*\(/.test(gap315)
    && !/\brng3\s*\(/.test(gap315)
    && !/\brng4\s*\(/.test(gap315));
  ok('no ShaderMaterial / ped / traffic',
    !gap315.includes('ShaderMaterial')
    && !gap315.includes('ped.js') && !gap315.includes('traffic.js'));
  ok('index calls buildGap315 after eighth, before flythrough',
    index.includes('buildGap315(ctx)')
    && index.indexOf('buildGap315(ctx)') > index.indexOf('buildEighth(ctx)')
    && index.indexOf('buildGap315(ctx)') < index.indexOf('buildFlythrough(ctx)'));
  ok('backdrop 60-box contract untouched',
    buildings.includes('for (let i = 0; i < 60; i++)'));

  ok('GAP_X=-315, west of leftoverLot A',
    GAP315_X === -315 && GAP315_X === GAP_X[1]
    && GAP315_W_FRONT_X === GAP315_X - XS_HALF - 2.4
    && GAP315_E_FRONT_X === GAP315_X + XS_HALF + 2.4
    && GAP315_W_FRONT_X < GAP315_X && GAP315_E_FRONT_X > GAP315_X
    && GAP315_E_FRONT_X + GAP315_D < 240
    && GAP315_W_FRONT_X < 240);
  ok('shop cells are signed inland of Ocean Drive',
    GAP315_W_CELLS.length === 4 && GAP315_E_CELLS.length === 5
    && GAP315_W_CELLS.every(([, len]) => len >= 8)
    && GAP315_E_CELLS.every(([, len]) => len >= 8)
    && GAP315_E_CELLS[0][0] === 95 && GAP315_E_CELLS[0][1] === 8
    && GAP315_W_CELLS[0][0] === 114);
  ok('soffit and passage are flyable',
    GAP315_SOFFIT >= 3.2 && GAP315_PASS_W >= 2.0 && GAP315_PASS_H >= 2.0
    && GAP315_D === 12 && GAP315_H >= 8);

  const shops = gap315Shops();
  ok('nine signed GAP_X=-315 shops', shops.length === 9);
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
    ok(`${g.id} misses Majestic / Washington carriageway / mid-rises`,
      reservedOverlap(MAJESTIC_X, 70.8, MAJESTIC_W + 2.4, 30.4, 0.15) === true
      && !(g.z0 < 86 && g.z1 > 55.6 && g.x1 > MAJESTIC_X - MAJESTIC_W / 2 - 1.2
        && g.x0 < MAJESTIC_X + MAJESTIC_W / 2 + 1.2)
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
      !!arcade && arcade.openH === GAP315_SOFFIT && inFlyVoid(arcade.x, arcade.z));
    ok(`${g.id}-pass void`,
      !!pass && pass.openW === GAP315_PASS_W && inFlyVoid(pass.x, pass.z));
    if (arcade) {
      const hit = probeBlocked(kit, arcade.x, arcade.y, arcade.z, 0.28);
      const high = probeBlocked(kit, arcade.x, CITY_Y + GAP315_SOFFIT - 0.45, arcade.z, 0.28);
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
    return s.tag === 'gap315' && z0 < TRAVEL_Z1 && z1 > TRAVEL_Z0;
  });
  ok('no gap315 collider in travel lanes 40.2–47.8',
    hitsTravel.length === 0, hitsTravel.slice(0, 3).map((s) => `${s.type}`).join(','));

  ok('crowd has no colliders (NPCs stay visual-only)',
    !crowd.includes('addCollider') && !crowd.includes('addCyl'));
  ok('crowd walks GAP_X=-315 sidewalks, no colliders',
    crowd.includes("kind: 'gap315'") && crowd.includes('GAP315_WALK_XS')
    && crowd.includes('const nGap315 = 36')
    && crowd.includes('GAP315_WALK_Z_RUNS')
    && crowd.includes('npcOffLimits')
    && !crowd.includes('addCollider') && !crowd.includes('addOBB')
    && !/\brng2?\s*\(/.test(crowd) && crowd.includes('hash01'));

  const GAP315_WALK_XS = [-322.7, -307.3];
  const GAP315_WALK_Z_RUNS = [[92, 168], [190, 220]];
  const gap315Spots = [];
  for (let i = 0; i < 36; i++) {
    const x = GAP315_WALK_XS[i % GAP315_WALK_XS.length];
    const runI = ((i / GAP315_WALK_XS.length) | 0) % GAP315_WALK_Z_RUNS.length;
    const run = GAP315_WALK_Z_RUNS[runI];
    const z = run[0] + hash01(i + 2300, 3) * (run[1] - run[0]);
    if (x >= 240) continue;
    if (leftoverLotOverlap(x, z, 0.6, 0.6, 0.15)) continue;
    if (z > TRAVEL_Z0 && z < TRAVEL_Z1) continue;
    if (z > WASH_TRAVEL_Z0 && z < WASH_TRAVEL_Z1) continue;
    gap315Spots.push({ x, z });
  }
  ok('gap315 walkers fill both sidewalks west of leftoverLot A',
    gap315Spots.length >= 32
    && gap315Spots.every((p) => p.x < 240 && p.x < 251
      && leftoverLotOverlap(p.x, p.z, 0.6, 0.6, 0.15) === false
      && !(p.z > TRAVEL_Z0 && p.z < TRAVEL_Z1)
      && !(p.z > WASH_TRAVEL_Z0 && p.z < WASH_TRAVEL_Z1)
      && !(p.z > WASH_Z0 && p.z < WASH_Z1)
      && p.z > TRAVEL_Z1)
    && gap315Spots.some((p) => Math.abs(p.x + 322.7) < 0.05)
    && gap315Spots.some((p) => Math.abs(p.x + 307.3) < 0.05)
    && Math.abs(GAP315_WALK_XS[0] - (GAP315_X - XS_HALF - 1.2)) < 1e-6
    && Math.abs(GAP315_WALK_XS[1] - (GAP315_X + XS_HALF + 1.2)) < 1e-6);
  ok('leftoverLot A–H unmoved',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84
    && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));
  ok('CITY_Y unchanged', CITY_Y === 1.5);

  if (fails.length) {
    console.error('[miami-gap-315] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-gap-315] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('gap315Test.js');
if (isMain) {
  const r = runMiamiGap315Tests();
  if (!r.passed) process.exit(1);
}
