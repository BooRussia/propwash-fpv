// Headless source-locks for inland six-sided mid-rises + alley pipes.
// No three.js, no game state.
//
//   node ./tools/run-miami-inland-test.mjs

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INLAND_MIDRISE_W, INLAND_MIDRISE_D, INLAND_MIDRISE_H, INLAND_MIDRISE_CELLS,
  inlandMidrises, ALLEY_PIPE_CELLS, FLY_VOIDS, inKeepout, inReserved,
  leftoverLotOverlap, streetOverlap, helipadOverlap, inHelipadReserved,
  FIRE_ESCAPE_CELLS, FIRE_ESCAPE_Z, FIRE_ESCAPE_POST_H, FIRE_ESCAPE_HALF_Z,
  ALLEY_DUMPSTER_CELLS, ALLEY_DOCK_CELLS,
  ALLEY_DUMP_W, ALLEY_DUMP_D, ALLEY_DOCK_W, ALLEY_DOCK_D,
  alleySolidHitsWhoop,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_H_X,
  ROOF_AC_CELLS, ROOF_RING_CELLS, ROOF_AC_CLEAR, ROOF_AC_H,
  ROOF_RING_R, ROOF_RING_TUBE, flyColliderShapes,
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

export function runMiamiInlandTests() {
  fails.length = 0;
  passedCount = 0;

  const inland = readFileSync(join(here, 'landmarks/inland.js'), 'utf8');
  const buildings = readFileSync(join(here, 'buildings.js'), 'utf8');
  const kenney = readFileSync(join(here, 'kenneyDressing.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');

  ok('inland.js exists', existsSync(join(here, 'landmarks/inland.js')));
  ok('hash01 only — no layout rng',
    inland.includes('hash01')
    && !/\brng2?\s*\(/.test(inland)
    && !/\brng3\s*\(/.test(inland)
    && !/\brng4\s*\(/.test(inland));
  ok('six-sided deco helper + rooftop kits',
    inland.includes('buildDecoMidriseGeos')
    && inland.includes('buildRooftopKitGeo')
    && inland.includes('buildRooftopDishGeo')
    && inland.includes('buildRooftopTankGeo')
    && inland.includes('buildRoofAcUnitGeo'));
  ok('no ShaderMaterial / ped / traffic',
    !inland.includes('ShaderMaterial')
    && !inland.includes('ped.js') && !inland.includes('traffic.js'));
  ok('index calls buildInland after espa, before flythrough',
    index.includes('buildInland(ctx)')
    && index.indexOf('buildInland(ctx)') > index.indexOf('buildEspa(ctx)')
    && index.indexOf('buildInland(ctx)') < index.indexOf('buildFlythrough(ctx)'));
  ok('rooftop kit geos stay exported from buildings.js',
    buildings.includes('export function buildRooftopKitGeo')
    && buildings.includes('export function buildRooftopDishGeo')
    && buildings.includes('export function buildRooftopTankGeo'));
  ok('backdrop 60-box contract untouched',
    buildings.includes('for (let i = 0; i < 60; i++)'));
  ok('far Kenney gained midrise_c behind the 60-box LOD',
    kenney.includes('kenney_midrise_c') && kenney.includes('640 + hash01'));

  ok('ten signed plates west of 240',
    INLAND_MIDRISE_CELLS.length === 10
    && INLAND_MIDRISE_W === 18 && INLAND_MIDRISE_D === 14 && INLAND_MIDRISE_H >= 28
    && INLAND_MIDRISE_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1 && z < 300)
    && INLAND_MIDRISE_CELLS.filter(([x]) => x < -430).length === 2
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -600 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -600 && z === 259));

  const plates = inlandMidrises();
  ok('geom count matches cells', plates.length === 10);
  ok('helipad W reserved still signed',
    inHelipadReserved(-430, 100) && helipadOverlap(-430, 101, 44, 54, 0.15));
  for (let i = 0; i < plates.length; i++) {
    const g = plates[i];
    ok(`${g.id} reserved + keepout west of 240`,
      g.x1 + 0.8 < 240 && inReserved(g.x, g.z) && inKeepout(g.x, g.z));
    ok(`${g.id} misses leftoverLot / street / travel / helipad W`,
      leftoverLotOverlap(g.x, g.z, g.w, g.d, 0.15) === false
      && streetOverlap(g.x, g.z, g.w, g.d) === false
      && helipadOverlap(g.x, g.z, g.w, g.d, 0.15) === false
      && g.z0 > TRAVEL_Z1 && g.z1 < 300
      && !(g.z0 < TRAVEL_Z1 && g.z1 > TRAVEL_Z0));
  }

  ok('four inland alley pipes at z=248',
    ALLEY_PIPE_CELLS.length === 8
    && ALLEY_PIPE_CELLS.filter(([, z]) => z === 248).length === 4);
  for (const [x, z] of ALLEY_PIPE_CELLS.filter(([, zz]) => zz === 248)) {
    const v = FLY_VOIDS.find((f) => f.x === x && f.z === z && String(f.id).startsWith('alley-pipe-'));
    ok(`pipe ${x}/${z} void + keepout`, !!v && inKeepout(x, z) && x < 240);
    ok(`pipe ${x}/${z} misses leftoverLot / street`,
      leftoverLotOverlap(x, z, 2.4, 2.6, 0.15) === false
      && streetOverlap(x, z, 0.4, 2.6) === false);
  }

  ok('eight fire-escape frames on mid-rise flanks at z=248',
    FIRE_ESCAPE_CELLS.length === 8 && FIRE_ESCAPE_Z === 248
    && FIRE_ESCAPE_POST_H >= 3.2
    && FIRE_ESCAPE_HALF_Z * 2 - 0.16 >= 1.15
    && FIRE_ESCAPE_CELLS.every(([x, z]) => x < 240 && z === 248 && x < 251));
  const fly = readFileSync(join(here, 'landmarks/flythrough.js'), 'utf8');
  ok('flythrough builds fire-escape jambs, no layout rng',
    fly.includes('FIRE_ESCAPE_CELLS') && fly.includes('buildFireEscape')
    && fly.includes("setTag('fire-escape')")
    && !/\brng2?\s*\(/.test(fly) && !/\brng3\s*\(/.test(fly) && !/\brng4\s*\(/.test(fly));
  for (let i = 0; i < FIRE_ESCAPE_CELLS.length; i++) {
    const [x, z] = FIRE_ESCAPE_CELLS[i];
    const v = FLY_VOIDS.find((f) => f.id === `fire-escape-${i}`);
    ok(`fire-escape-${i} void + keepout west of 240`,
      !!v && v.x === x && v.z === z && inKeepout(x, z) && inReserved(x, z)
      && x < 240 && v.openH >= 2 && v.openW >= 1.15);
    ok(`fire-escape-${i} misses leftoverLot / street / travel`,
      leftoverLotOverlap(x, z, 2.4, 2.6, 0.15) === false
      && streetOverlap(x, z, 0.4, 2.6) === false
      && z > TRAVEL_Z1);
  }

  ok('four signed alley dumpsters + four loading docks at z=248',
    ALLEY_DUMPSTER_CELLS.length === 4 && ALLEY_DOCK_CELLS.length === 4
    && ALLEY_DUMPSTER_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1 && z < 252)
    && ALLEY_DOCK_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1 && x < 251));
  ok('inland.js builds alley dumpsters, hash01, no layout rng',
    inland.includes('ALLEY_DUMPSTER_CELLS') && inland.includes('ALLEY_DOCK_CELLS')
    && inland.includes('inland-alley-dumpsters')
    && inland.includes('alleySolidHitsWhoop')
    && !/\brng2?\s*\(/.test(inland) && !/\brng3\s*\(/.test(inland)
    && !/\brng4\s*\(/.test(inland));
  for (let i = 0; i < ALLEY_DUMPSTER_CELLS.length; i++) {
    const [x, z] = ALLEY_DUMPSTER_CELLS[i];
    ok(`dumpster ${x}/${z} misses leftoverLot / street / travel / whoops`,
      leftoverLotOverlap(x, z, ALLEY_DUMP_W, ALLEY_DUMP_D, 0.15) === false
      && streetOverlap(x, z, ALLEY_DUMP_W, ALLEY_DUMP_D) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)
      && alleySolidHitsWhoop(x, z, ALLEY_DUMP_W, ALLEY_DUMP_D) === false
      && x < 240);
  }
  for (let i = 0; i < ALLEY_DOCK_CELLS.length; i++) {
    const [x, z] = ALLEY_DOCK_CELLS[i];
    ok(`dock ${x}/${z} misses leftoverLot / street / travel / whoops`,
      leftoverLotOverlap(x, z, ALLEY_DOCK_W, ALLEY_DOCK_D, 0.15) === false
      && streetOverlap(x, z, ALLEY_DOCK_W, ALLEY_DOCK_D) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)
      && alleySolidHitsWhoop(x, z, ALLEY_DOCK_W, ALLEY_DOCK_D) === false
      && x < 240);
  }

  ok('leftoverLot A–H unmoved',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  ok('four signed rooftop AC gaps + two billboard rings',
    ROOF_AC_CELLS.length === 4 && ROOF_RING_CELLS.length === 2
    && ROOF_AC_CLEAR >= 2.0 && ROOF_AC_H >= 2.0
    && 2 * (ROOF_RING_R - ROOF_RING_TUBE) >= 2.0
    && ROOF_AC_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1)
    && ROOF_RING_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1)
    && ROOF_AC_CELLS.some(([x, z]) => x === -430 && z === 237)
    && ROOF_AC_CELLS.some(([x, z]) => x === -80 && z === 237)
    && ROOF_AC_CELLS.every(([x, z]) =>
      INLAND_MIDRISE_CELLS.some(([mx, mz]) => mx === x && mz === z)));
  ok('inland.js builds roof whoops with hash01 skip, no layout rng',
    inland.includes('roof-whoop') && inland.includes('ROOF_AC_CELLS')
    && inland.includes('cTorus') && !/\brng2?\s*\(/.test(inland));
  const kit = flyColliderShapes();
  function probe(x, y, z, r) {
    for (let i = 0; i < kit.length; i++) {
      const s = kit[i];
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
      }
    }
    return null;
  }
  for (let i = 0; i < ROOF_AC_CELLS.length; i++) {
    const [x, z] = ROOF_AC_CELLS[i];
    const v = FLY_VOIDS.find((f) => f.id === `roof-ac-${i}`);
    ok(`roof-ac-${i} listed + open`,
      !!v && v.x === x && v.z === z && v.openH >= 2 && v.openW >= 2
      && inKeepout(x, z) && !probe(v.x, v.y, v.z, 0.28)
      && leftoverLotOverlap(x, z, 4, 2, 0.15) === false);
  }
  for (let i = 0; i < ROOF_RING_CELLS.length; i++) {
    const [x, z] = ROOF_RING_CELLS[i];
    const v = FLY_VOIDS.find((f) => f.id === `roof-ring-${i}`);
    ok(`roof-ring-${i} listed + open disc`,
      !!v && v.x === x && v.z === z && v.openH >= 2
      && inKeepout(x, z) && !probe(v.x, v.y, v.z, 0.28)
      && leftoverLotOverlap(x, z, 0.8, 2.4, 0.15) === false);
  }

  if (fails.length) {
    console.error('[miami-inland] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-inland] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('inlandTest.js');
if (isMain) {
  const r = runMiamiInlandTests();
  if (!r.passed) process.exit(1);
}
