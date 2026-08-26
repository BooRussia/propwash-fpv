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
  COLONY_X, COLONY_FRONT_Z, COLONY_W, COLONY_D, COLONY_SOFFIT,
  BREAKWATER_X, BREAKWATER_FRONT_Z, BREAKWATER_W, BREAKWATER_D,
  CAVALIER_X, CAVALIER_FRONT_Z, CAVALIER_W, CAVALIER_D,
  WINTERHAVEN_X, WINTERHAVEN_FRONT_Z, WINTERHAVEN_W, WINTERHAVEN_D,
  PROMENADE_ARCH_XS, GATE_Z, GATE_X,
  FLY_VOIDS, flyColliderShapes, inKeepout, inFlyVoid,
  leftoverLotOverlap, reservedOverlap, inReserved, streetOverlap,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_H_X,
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
  const decoPath = join(here, 'landmarks/decoHotels.js');
  const indexPath = join(here, 'index.js');
  const flyPath = join(here, 'landmarks/flythrough.js');
  const planPath = join(root, 'assets/catalog/miami-build-plan.json');

  const crowd = existsSync(crowdPath) ? readFileSync(crowdPath, 'utf8') : '';
  const casa = existsSync(casaPath) ? readFileSync(casaPath, 'utf8') : '';
  const cleve = existsSync(clevePath) ? readFileSync(clevePath, 'utf8') : '';
  const deco = existsSync(decoPath) ? readFileSync(decoPath, 'utf8') : '';
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
  ok('index builds named deco hotels',
    existsSync(decoPath)
    && index.includes("from './landmarks/decoHotels.js'")
    && index.includes('buildDecoHotels(ctx)')
    && index.indexOf('buildDecoHotels(ctx)') > index.indexOf('buildCasa(ctx)'));

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
    !casa.includes('ShaderMaterial') && !cleve.includes('ShaderMaterial')
    && !deco.includes('ShaderMaterial'));
  ok('constants still name leftoverLot A at 258',
    constants.includes('LEFTOVER_LOT_X') && LEFTOVER_LOT_X === 258);

  ok('travel-lane numbers unchanged', TRAVEL_Z0 === 40.2 && TRAVEL_Z1 === 47.8);

  ok('Colony sits west of the deco row on the facade plane',
    COLONY_X === -108 && COLONY_FRONT_Z === 57.6 && COLONY_W === 20
    && COLONY_D === 24 && COLONY_SOFFIT === 3.5
    && COLONY_X + COLONY_W / 2 < -88);
  ok('Breakwater sits in the deco / Clevelander gap',
    BREAKWATER_X === 42 && BREAKWATER_FRONT_Z === 57.6
    && BREAKWATER_W === 12 && BREAKWATER_D === 22
    && BREAKWATER_X - BREAKWATER_W / 2 >= 35
    && BREAKWATER_X + BREAKWATER_W / 2 <= 49);
  ok('Cavalier sits in the Cardozo / cinema gap',
    CAVALIER_X === 134 && CAVALIER_FRONT_Z === 57.6
    && CAVALIER_W === 16 && CAVALIER_D === 24
    && CAVALIER_X - CAVALIER_W / 2 >= 124
    && CAVALIER_X + CAVALIER_W / 2 <= 143);
  ok('Winterhaven sits east of the garage, west of GAP 243 and x=240',
    WINTERHAVEN_X === 222 && WINTERHAVEN_FRONT_Z === 57.6
    && WINTERHAVEN_W === 16 && WINTERHAVEN_D === 18
    && WINTERHAVEN_X - WINTERHAVEN_W / 2 >= 210
    && WINTERHAVEN_X + WINTERHAVEN_W / 2 + 1.2 < 240
    && WINTERHAVEN_FRONT_Z + WINTERHAVEN_D <= 76);
  ok('named deco hotels are reserved and miss leftoverLot A–H',
    reservedOverlap(COLONY_X, COLONY_FRONT_Z + 8, COLONY_W, COLONY_D, 0.15)
    && reservedOverlap(BREAKWATER_X, BREAKWATER_FRONT_Z + 8, BREAKWATER_W, BREAKWATER_D, 0.15)
    && reservedOverlap(CAVALIER_X, CAVALIER_FRONT_Z + 8, CAVALIER_W, CAVALIER_D, 0.15)
    && reservedOverlap(WINTERHAVEN_X, WINTERHAVEN_FRONT_Z + 8, WINTERHAVEN_W, WINTERHAVEN_D, 0.15)
    && leftoverLotOverlap(COLONY_X, COLONY_FRONT_Z + 8, COLONY_W, COLONY_D, 0.15) === false
    && leftoverLotOverlap(BREAKWATER_X, BREAKWATER_FRONT_Z + 8, BREAKWATER_W, BREAKWATER_D, 0.15) === false
    && leftoverLotOverlap(CAVALIER_X, CAVALIER_FRONT_Z + 8, CAVALIER_W, CAVALIER_D, 0.15) === false
    && leftoverLotOverlap(WINTERHAVEN_X, WINTERHAVEN_FRONT_Z + 8, WINTERHAVEN_W, WINTERHAVEN_D, 0.15) === false);
  ok('named deco hotels miss the carriageway and travel lanes',
    streetOverlap(COLONY_X, COLONY_FRONT_Z + COLONY_D / 2, COLONY_W, COLONY_D) === false
    && streetOverlap(BREAKWATER_X, BREAKWATER_FRONT_Z + BREAKWATER_D / 2, BREAKWATER_W, BREAKWATER_D) === false
    && streetOverlap(CAVALIER_X, CAVALIER_FRONT_Z + CAVALIER_D / 2, CAVALIER_W, CAVALIER_D) === false
    && streetOverlap(WINTERHAVEN_X, WINTERHAVEN_FRONT_Z + WINTERHAVEN_D / 2, WINTERHAVEN_W, WINTERHAVEN_D) === false
    && COLONY_FRONT_Z - 3.4 > TRAVEL_Z1
    && WINTERHAVEN_FRONT_Z > TRAVEL_Z1);
  ok('leftoverLot A–H were not slid',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  const colonyArcade = FLY_VOIDS.find((v) => v.id === 'colony-arcade');
  ok('colony-arcade fly void exists',
    !!colonyArcade && colonyArcade.openH === COLONY_SOFFIT && colonyArcade.openW >= 8);
  ok('colony-arcade keepout + inFlyVoid',
    !!colonyArcade && !!inKeepout(colonyArcade.x, colonyArcade.z)
    && !!inFlyVoid(colonyArcade.x, colonyArcade.z));
  if (colonyArcade) {
    const hit = probeBlocked(kit, colonyArcade.x, colonyArcade.y, colonyArcade.z, 0.28);
    ok('colony arcade bay centre is open', !hit, hit ? `${hit.tag} ${hit.type}` : '');
  }
  ok('decoHotels does not draw layout rng',
    !/\brng2?\s*\(/.test(deco) && !/\brng3\s*\(/.test(deco)
    && !/\brng4\s*\(/.test(deco));
  ok('decoHotels has no ShaderMaterial and no ped/traffic',
    !deco.includes('ShaderMaterial') && !deco.includes('ped.js')
    && !deco.includes('traffic.js'));
  ok('Winterhaven reserved stays west of leftoverLot A',
    WINTERHAVEN_X + WINTERHAVEN_W / 2 + 1.2 < 251
    && inReserved(258, 84));

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
