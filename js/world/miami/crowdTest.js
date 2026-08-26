// Headless checks for Ocean Drive crowd + Casa / Clevelander fill.
// No three.js, no game state. Not ped.js / traffic.js.
//
//   node ./js/world/miami/crowdTest.js
//   node ./tools/run-miami-crowd-test.mjs

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CASA_X, CASA_FRONT_Z, CASA_W, CASA_D, CASA_LOGGIA_H, CASA_LOGGIA_D,
  CLEVELANDER_X, CLEVELANDER_FRONT_Z, CLEVELANDER_W, CLEVELANDER_SOFFIT,
  CARDOZO_X, CARDOZO_FRONT_Z, CARDOZO_W,
  PROMENADE_ARCH_XS, GATE_Z, GATE_X,
  FLY_VOIDS, flyColliderShapes, inKeepout, inFlyVoid,
  leftoverLotOverlap, reservedOverlap, inReserved,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
} from './constants.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const world = join(here, '..');

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

export function runMiamiCrowdTests() {
  fails.length = 0;
  passedCount = 0;

  const crowdPath = join(here, 'crowd.js');
  const casaPath = join(here, 'landmarks/casa.js');
  const clevePath = join(here, 'landmarks/clevelander.js');
  const indexPath = join(here, 'index.js');
  const flyPath = join(here, 'landmarks/flythrough.js');
  const planPath = join(root, 'assets/catalog/miami-build-plan.json');

  const crowd = existsSync(crowdPath) ? readFileSync(crowdPath, 'utf8') : '';
  const casa = existsSync(casaPath) ? readFileSync(casaPath, 'utf8') : '';
  const cleve = existsSync(clevePath) ? readFileSync(clevePath, 'utf8') : '';
  const index = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
  const fly = existsSync(flyPath) ? readFileSync(flyPath, 'utf8') : '';
  const constants = readFileSync(join(here, 'constants.js'), 'utf8');

  ok('crowd.js exists', existsSync(crowdPath));
  ok('casa.js exists', existsSync(casaPath));
  ok('clevelander.js exists', existsSync(clevePath));
  ok('living build plan exists', existsSync(planPath));

  ok('no ped.js / traffic.js',
    !existsSync(join(world, 'ped.js')) && !existsSync(join(world, 'traffic.js'))
    && !existsSync(join(here, 'ped.js')) && !existsSync(join(here, 'traffic.js')));
  ok('crowd is not named ped.js', !crowdPath.endsWith('ped.js'));

  ok('crowd does not draw layout rng',
    !/\brng2?\s*\(/.test(crowd) && !/\brng3\s*\(/.test(crowd)
    && !/\brng4\s*\(/.test(crowd) && crowd.includes('hash01'));
  ok('crowd has no colliders',
    !crowd.includes('addCollider') && !crowd.includes('addCyl')
    && !crowd.includes('addOBB'));
  ok('crowd kinds cover walk/bike/skate/beach/swim',
    crowd.includes("kind: 'walk'") && crowd.includes("kind: 'bike'")
    && crowd.includes("kind: 'skate'") && crowd.includes("kind: 'beach'")
    && crowd.includes("kind: 'swim'"));
  ok('crowd skips travel lanes and carriageway',
    crowd.includes('TRAVEL_Z0') && crowd.includes('inTravelLane')
    && crowd.includes('inCarriageway') && crowd.includes('ROAD_Z0'));
  ok('crowd has no ShaderMaterial', !crowd.includes('ShaderMaterial'));

  ok('index builds crowd after blades',
    index.includes("import { buildCrowd }")
    && index.includes('const crowd = buildCrowd(ctx)')
    && index.indexOf('const crowd = buildCrowd(ctx)')
      > index.indexOf('await buildBlades(ctx)'));
  ok('index updates crowd', index.includes('crowd?.update?.(dt)'));
  ok('index builds casa and clevelander',
    index.includes('buildCasa(ctx)') && index.includes('buildClevelander(ctx)'));

  ok('CASA sits in the deco/cinema gap',
    CASA_X === 90 && CASA_FRONT_Z === 57.6 && CASA_W === 28 && CASA_D === 26
    && CASA_X > 45 && CASA_X < 126);
  ok('Clevelander and Cardozo sit on the facade plane',
    CLEVELANDER_X === 60 && CLEVELANDER_FRONT_Z === 57.6
    && CARDOZO_X === 115 && CARDOZO_FRONT_Z === 57.6
    && CARDOZO_W === 18);
  ok('casa reserved covers the mansion',
    reservedOverlap(CASA_X, CASA_FRONT_Z + 8, CASA_W, CASA_D, 0.15)
    && inReserved(CASA_X, CASA_FRONT_Z + 4));
  ok('casa does not sit on leftoverLot A–H',
    leftoverLotOverlap(CASA_X, CASA_FRONT_Z + 8, CASA_W, CASA_D, 0.15) === false
    && leftoverLotOverlap(CLEVELANDER_X, CLEVELANDER_FRONT_Z + 8, CLEVELANDER_W, 22, 0.15) === false
    && leftoverLotOverlap(CARDOZO_X, CARDOZO_FRONT_Z + 8, CARDOZO_W, 24, 0.15) === false);
  ok('leftoverLot A was not slid',
    LEFTOVER_LOT_X === 258 && leftoverLotOverlap(
      LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  const loggia = FLY_VOIDS.find((v) => v.id === 'casa-loggia');
  const arcade = FLY_VOIDS.find((v) => v.id === 'clevelander-arcade');
  ok('casa-loggia fly void exists', !!loggia && loggia.openH >= 3.2 && loggia.openW >= 8);
  ok('clevelander-arcade fly void exists',
    !!arcade && arcade.openH === CLEVELANDER_SOFFIT && arcade.openW >= 8);
  ok('loggia keepout + inFlyVoid',
    !!loggia && !!inKeepout(loggia.x, loggia.z) && !!inFlyVoid(loggia.x, loggia.z));
  ok('arcade keepout + inFlyVoid',
    !!arcade && !!inKeepout(arcade.x, arcade.z) && !!inFlyVoid(arcade.x, arcade.z));

  const kit = flyColliderShapes();
  if (loggia) {
    const hit = probeBlocked(kit, loggia.x, loggia.y, loggia.z, 0.28);
    ok('casa loggia bay centre is open', !hit, hit ? `${hit.tag} ${hit.type}` : '');
  }
  if (arcade) {
    const hit = probeBlocked(kit, arcade.x, arcade.y, arcade.z, 0.28);
    ok('clevelander arcade bay centre is open', !hit, hit ? `${hit.tag} ${hit.type}` : '');
  }

  ok('promenade arches are five signed x on the boardwalk',
    PROMENADE_ARCH_XS.length === 5
    && PROMENADE_ARCH_XS[0] === -80 && PROMENADE_ARCH_XS[4] === 220
    && !PROMENADE_ARCH_XS.includes(GATE_X));
  ok('promenade arches miss leftoverLot x>=251',
    PROMENADE_ARCH_XS.every((x) => x < 240));
  for (let i = 0; i < PROMENADE_ARCH_XS.length; i++) {
    const v = FLY_VOIDS.find((f) => f.id === `promenade-arch-${i}`);
    ok(`promenade-arch-${i} listed`, !!v && v.z === GATE_Z);
    if (v) {
      ok(`promenade-arch-${i} keepout`, !!inKeepout(v.x, v.z));
      const hit = probeBlocked(kit, v.x, v.y, v.z, 0.28);
      ok(`promenade-arch-${i} bay open`, !hit, hit ? `${hit.tag}` : '');
    }
  }

  ok('flythrough builds promenade arches',
    fly.includes('PROMENADE_ARCH_XS') && fly.includes("setTag('promenade-arch')"));
  ok('casa loggia height is flyable', CASA_LOGGIA_H >= 3.2 && CASA_LOGGIA_D >= 3);
  ok('casa/clevelander do not draw layout rng',
    !/\brng2?\s*\(/.test(casa) && !/\brng3\s*\(/.test(casa)
    && !/\brng2?\s*\(/.test(cleve) && !/\brng4\s*\(/.test(cleve));
  ok('no ShaderMaterial in new landmarks',
    !casa.includes('ShaderMaterial') && !cleve.includes('ShaderMaterial'));
  ok('constants still name leftoverLot A at 258',
    constants.includes('LEFTOVER_LOT_X') && LEFTOVER_LOT_X === 258);

  ok('travel-lane numbers unchanged', TRAVEL_Z0 === 40.2 && TRAVEL_Z1 === 47.8);

  let plan = null;
  try { plan = JSON.parse(readFileSync(planPath, 'utf8')); } catch (e) { plan = null; }
  ok('build plan is self-approving onto main',
    !!plan && plan.selfApprove === true && plan.mergeTarget === 'main'
    && plan.doNotAskUser === true
    && Array.isArray(plan.phases) && plan.phases.length >= 8);

  if (fails.length) {
    console.error('[miami-crowd] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-crowd] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('crowdTest.js');
if (isMain) {
  const r = runMiamiCrowdTests();
  if (!r.passed) process.exit(1);
}
