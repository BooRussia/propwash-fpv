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
  SW_ARCADE_CITY_XS, SW_ARCADE_BEACH_XS, SW_ARCADE_CITY_Z, SW_ARCADE_BEACH_Z,
  SW_ARCADE_POST_H, ALLEY_PIPE_CELLS, ALLEY_PIPE_POST_H, ALLEY_PIPE_HALF_Z,
  PARK_RING_CELLS, PARK_RING_R, PARK_RING_TUBE, PIER_EXTRA_BAY_IS, PIER_X,
  PIER_PYLON_COUNT, pierBayRingGeom,
  SW_CITY_Z0, SW_CITY_Z1, VBALL_X0, VBALL_Z0, VBALL_Z1,
  FLY_VOIDS, flyColliderShapes, pierFlyShapes, inKeepout, inFlyVoid,
  leftoverLotOverlap, reservedOverlap, inReserved, streetOverlap,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_H_X,
  CITY_Y,
  FIFTH_X, FIFTH_W_CELLS, FIFTH_E_CELLS, FIFTH_W_FRONT_X, FIFTH_E_FRONT_X,
  FIFTH_SOFFIT, FIFTH_PASS_W, FIFTH_PASS_H, fifthShops,
  ESPA_X, ESPA_W_CELLS, ESPA_W_FRONT_X, ESPA_SOFFIT, ESPA_PASS_W, ESPA_PASS_H,
  ESPA_D, espaShops, CINEMA_X, CINEMA_W, MARINA_X,
  INLAND_MIDRISE_W, INLAND_MIDRISE_D, INLAND_MIDRISE_H, INLAND_MIDRISE_CELLS,
  inlandMidrises,
  LINCOLN_Z, LINCOLN_HALF, LINCOLN_S_FRONT_Z, LINCOLN_N_FRONT_Z,
  LINCOLN_S_CELLS, LINCOLN_N_CELLS, LINCOLN_PERGOLA_CELLS, LINCOLN_WALK_RUNS,
  LINCOLN_SOFFIT, LINCOLN_PASS_W, LINCOLN_PASS_H, LINCOLN_PERGOLA_POST_H,
  lincolnShops, lincolnPergolas, onLincolnWalk,
  WASH_Z, WASH_HALF, WASH_X1, WASH_ARCADE_X, WASH_ARCADE_Z, WASH_ARCADE_POST_H,
  WASH_TRAVEL_Z0, WASH_TRAVEL_Z1, WASH_PARK_OCEAN_Z, WASH_PARK_INLAND_Z,
  washingtonRuns, washingtonCars, washingtonArcadeGeom, onWashingtonRoad,
} from './constants.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const world = join(here, '..');

const TRAVEL_Z0 = 40.2;
const TRAVEL_Z1 = 47.8;
const BIKE_RACK_XS = [-240, -170, -40, 30, 150];
const LIFEGUARD_SIT_CELLS = [
  [-520, 12.5], [-335, 11.0], [-95, 12.0], [45, 10.5], [235, 13.0], [420, 12.0],
];
const cityZ = (SW_CITY_Z0 + SW_CITY_Z1) * 0.5;
const BIKE_RACK_TRAVEL = cityZ > TRAVEL_Z0 && cityZ < TRAVEL_Z1
  || LIFEGUARD_SIT_CELLS.some(([, z]) => z > TRAVEL_Z0 && z < TRAVEL_Z1)
  || VBALL_Z1 > TRAVEL_Z0;

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
  const fifthPath = join(here, 'landmarks/fifth.js');
  const espaPath = join(here, 'landmarks/espa.js');
  const inlandPath = join(here, 'landmarks/inland.js');
  const lincolnPath = join(here, 'landmarks/lincoln.js');
  const washingtonPath = join(here, 'landmarks/washington.js');
  const planPath = join(root, 'assets/catalog/miami-build-plan.json');

  const crowd = existsSync(crowdPath) ? readFileSync(crowdPath, 'utf8') : '';
  const casa = existsSync(casaPath) ? readFileSync(casaPath, 'utf8') : '';
  const cleve = existsSync(clevePath) ? readFileSync(clevePath, 'utf8') : '';
  const deco = existsSync(decoPath) ? readFileSync(decoPath, 'utf8') : '';
  const index = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
  const fly = existsSync(flyPath) ? readFileSync(flyPath, 'utf8') : '';
  const fifth = existsSync(fifthPath) ? readFileSync(fifthPath, 'utf8') : '';
  const espa = existsSync(espaPath) ? readFileSync(espaPath, 'utf8') : '';
  const inland = existsSync(inlandPath) ? readFileSync(inlandPath, 'utf8') : '';
  const lincoln = existsSync(lincolnPath) ? readFileSync(lincolnPath, 'utf8') : '';
  const washington = existsSync(washingtonPath) ? readFileSync(washingtonPath, 'utf8') : '';
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
  ok('crowd is thicker',
    crowd.includes('const nWalk = 140') && crowd.includes('const nBike = 32')
    && crowd.includes('const nBeach = 68') && crowd.includes('const nSwim = 36')
    && crowd.includes('const nInland = 36'));
  ok('crowd has parked bikes, volleyball, lifeguard sitters',
    crowd.includes("kind: 'parked'") && crowd.includes("kind: 'vball'")
    && crowd.includes("kind: 'guard'") && crowd.includes('BIKE_RACK_XS')
    && crowd.includes('LIFEGUARD_SIT_CELLS') && crowd.includes('buildBikeRacks'));
  ok('crowd walks Fifth and Española sidewalks',
    crowd.includes("kind: 'inland'") && crowd.includes('FIFTH_WALK_XS')
    && crowd.includes('ESPA_WALK_X') && crowd.includes('INLAND_WALK_Z0')
    && crowd.includes('leftoverLotOverlap'));
  ok('parked bikes sit on the city walk, not travel lanes',
    crowd.includes('BIKE_RACK_XS') && !BIKE_RACK_TRAVEL
    && cityZ > TRAVEL_Z1 && VBALL_Z1 < TRAVEL_Z0
    && VBALL_X0 > 0);
  ok('racks and sitters have no colliders',
    !crowd.includes('addCollider') && !crowd.includes('addCyl')
    && crowd.includes('bike-racks'));
  ok('racks miss leftoverLot A–H',
    BIKE_RACK_XS.every((x) => leftoverLotOverlap(x, cityZ, 2.4, 0.4, 0.15) === false)
    && LIFEGUARD_SIT_CELLS.every(([x, z]) => leftoverLotOverlap(x, z, 3.4, 3.0, 0.15) === false));

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

  ok('sidewalk arcades are five signed x, west of 240',
    SW_ARCADE_CITY_XS.length === 3 && SW_ARCADE_BEACH_XS.length === 2
    && [...SW_ARCADE_CITY_XS, ...SW_ARCADE_BEACH_XS].every((x) => x < 240)
    && !SW_ARCADE_CITY_XS.includes(GATE_X));
  ok('sidewalk arcade z sits on the slabs, not in travel lanes',
    SW_ARCADE_CITY_Z > TRAVEL_Z1 && SW_ARCADE_BEACH_Z < TRAVEL_Z0
    && SW_ARCADE_POST_H >= 2.0);
  ok('flythrough builds sidewalk arcades',
    fly.includes('SW_ARCADE_CITY_XS') && fly.includes("setTag('sidewalk-arcade')")
    && fly.includes('buildSidewalkArcade'));

  for (let i = 0; i < SW_ARCADE_CITY_XS.length; i++) {
    const v = FLY_VOIDS.find((f) => f.id === `sidewalk-arcade-city-${i}`);
    ok(`sidewalk-arcade-city-${i} listed`, !!v && v.z === SW_ARCADE_CITY_Z && v.openH >= 2);
    if (v) {
      ok(`sidewalk-arcade-city-${i} keepout + open`,
        !!inKeepout(v.x, v.z) && !probeBlocked(kit, v.x, v.y, v.z, 0.28));
      ok(`sidewalk-arcade-city-${i} misses leftoverLot / travel / street`,
        leftoverLotOverlap(v.x, v.z, 2.4, 2.0, 0.15) === false
        && v.z > TRAVEL_Z1
        && streetOverlap(v.x, v.z, 2.4, 1.8) === false);
    }
  }
  for (let i = 0; i < SW_ARCADE_BEACH_XS.length; i++) {
    const v = FLY_VOIDS.find((f) => f.id === `sidewalk-arcade-beach-${i}`);
    ok(`sidewalk-arcade-beach-${i} listed`, !!v && v.z === SW_ARCADE_BEACH_Z);
    if (v) {
      ok(`sidewalk-arcade-beach-${i} keepout + open`,
        !!inKeepout(v.x, v.z) && !probeBlocked(kit, v.x, v.y, v.z, 0.28));
      ok(`sidewalk-arcade-beach-${i} misses leftoverLot / travel`,
        leftoverLotOverlap(v.x, v.z, 2.4, 2.0, 0.15) === false
        && v.z < TRAVEL_Z0);
    }
  }

  ok('alley pipes are eight signed cells west of 240',
    ALLEY_PIPE_CELLS.length === 8
    && ALLEY_PIPE_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1)
    && ALLEY_PIPE_POST_H >= 2.0 && ALLEY_PIPE_HALF_Z >= 1.1);
  ok('inland service-alley pipes sit at z=248',
    ALLEY_PIPE_CELLS.filter(([, z]) => z === 248).length === 4
    && ALLEY_PIPE_CELLS.slice(4).every(([x]) => x < 240));
  ok('flythrough builds alley pipes',
    fly.includes('ALLEY_PIPE_CELLS') && fly.includes("setTag('alley-pipe')")
    && fly.includes('buildAlleyPipe') && !/\brng2?\s*\(/.test(fly)
    && !/\brng3\s*\(/.test(fly) && !/\brng4\s*\(/.test(fly));
  for (let i = 0; i < ALLEY_PIPE_CELLS.length; i++) {
    const v = FLY_VOIDS.find((f) => f.id === `alley-pipe-${i}`);
    const [x, z] = ALLEY_PIPE_CELLS[i];
    ok(`alley-pipe-${i} listed`, !!v && v.x === x && v.z === z);
    if (v) {
      ok(`alley-pipe-${i} reserved keepout open`,
        !!inReserved(v.x, v.z) && !!inKeepout(v.x, v.z)
        && !probeBlocked(kit, v.x, v.y, v.z, 0.28));
      ok(`alley-pipe-${i} misses leftoverLot A–H / street / travel`,
        leftoverLotOverlap(v.x, v.z, 2.4, 2.6, 0.15) === false
        && streetOverlap(v.x, v.z, 0.4, 2.6) === false
        && v.z > TRAVEL_Z1);
    }
  }

  ok('park rings are three Lummus whoops west of 240',
    PARK_RING_CELLS.length === 3
    && PARK_RING_CELLS.every(([x, z]) => x < 240 && z < TRAVEL_Z0)
    && PARK_RING_R - PARK_RING_TUBE >= 1.0);
  ok('flythrough builds park rings',
    fly.includes('PARK_RING_CELLS') && fly.includes("setTag('park-ring')")
    && fly.includes('buildParkRing'));
  for (let i = 0; i < PARK_RING_CELLS.length; i++) {
    const v = FLY_VOIDS.find((f) => f.id === `park-ring-${i}`);
    ok(`park-ring-${i} listed`, !!v && v.x === PARK_RING_CELLS[i][0]);
    if (v) {
      ok(`park-ring-${i} keepout + open disc`,
        !!inKeepout(v.x, v.z) && !probeBlocked(kit, v.x, v.y, v.z, 0.28));
      ok(`park-ring-${i} misses leftoverLot / travel`,
        leftoverLotOverlap(v.x, v.z, 0.4, 2.4, 0.15) === false
        && v.z < TRAVEL_Z0);
    }
  }

  const pierKit = pierFlyShapes();
  ok('pier still has ten pylon stations', PIER_PYLON_COUNT === 10);
  ok('pier extra bays are two signed undercroft whoops',
    PIER_EXTRA_BAY_IS.length === 2 && PIER_EXTRA_BAY_IS[0] === 1
    && PIER_EXTRA_BAY_IS[1] === 6);
  for (let i = 0; i < PIER_EXTRA_BAY_IS.length; i++) {
    const bayI = PIER_EXTRA_BAY_IS[i];
    const under = FLY_VOIDS.find((f) => f.id === `pier-undercroft-${bayI}`);
    const ring = FLY_VOIDS.find((f) => f.id === `pier-bay-ring-${bayI}`);
    const g = pierBayRingGeom(bayI);
    ok(`pier-undercroft-${bayI} listed`, !!under && under.x === PIER_X);
    ok(`pier-bay-ring-${bayI} listed`, !!ring && ring.x === PIER_X && ring.z === g.z);
    if (under) {
      ok(`pier-undercroft-${bayI} open`,
        !probeBlocked(kit.concat(pierKit), under.x, under.y, under.z, 0.28));
    }
    if (ring) {
      ok(`pier-bay-ring-${bayI} keepout + open disc`,
        !!inKeepout(ring.x, ring.z)
        && !probeBlocked(kit.concat(pierKit), ring.x, ring.y, ring.z, 0.28));
    }
  }
  const pierSrc = existsSync(join(here, 'landmarks/pier.js'))
    ? readFileSync(join(here, 'landmarks/pier.js'), 'utf8') : '';
  ok('pier.js builds extra bay rings',
    pierSrc.includes('buildPierBayRings') && pierSrc.includes('PIER_EXTRA_BAY_IS')
    && !/\brng[2-4]?\s*\(/.test(pierSrc) && !pierSrc.includes('ShaderMaterial'));
  ok('obstacles do not draw layout rng or ShaderMaterial',
    !/\brng2?\s*\(/.test(fly) && !/\brng3\s*\(/.test(fly)
    && !/\brng4\s*\(/.test(fly) && !fly.includes('ShaderMaterial')
    && !fly.includes('ped.js') && !fly.includes('traffic.js'));
  ok('leftoverLot A–H still signed after obstacles',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  ok('fifth.js exists', existsSync(fifthPath));
  ok('index builds 5th-street storefronts after convention',
    index.includes("from './landmarks/fifth.js'")
    && index.includes('buildFifth(ctx)')
    && index.indexOf('buildFifth(ctx)') > index.indexOf('buildConvention(ctx)'));
  ok('5th-street is GAP_X=57, west of x=240',
    FIFTH_X === 57 && FIFTH_W_FRONT_X < FIFTH_X && FIFTH_E_FRONT_X > FIFTH_X
    && FIFTH_E_FRONT_X + 12 < 240);
  ok('5th-street cells are signed inland of Ocean Drive',
    FIFTH_W_CELLS.length === 3 && FIFTH_E_CELLS.length === 4
    && FIFTH_W_CELLS.every(([, len]) => len >= 8)
    && FIFTH_E_CELLS[0][0] === 95 && FIFTH_E_CELLS[0][1] === 8);
  ok('5th-street soffit and passage are flyable',
    FIFTH_SOFFIT >= 3.2 && FIFTH_PASS_W >= 2.0 && FIFTH_PASS_H >= 2.0);
  ok('fifth does not draw layout rng, ShaderMaterial, or ped/traffic',
    !/\brng2?\s*\(/.test(fifth) && !/\brng3\s*\(/.test(fifth)
    && !/\brng4\s*\(/.test(fifth) && !fifth.includes('ShaderMaterial')
    && !fifth.includes('ped.js') && !fifth.includes('traffic.js')
    && fifth.includes('installFlyColliders'));

  const shops = fifthShops();
  ok('seven signed 5th-street shops', shops.length === 7);
  for (let i = 0; i < shops.length; i++) {
    const g = shops[i];
    ok(`${g.id} reserved west of 240`, g.x1 + 1.8 < 240 && inReserved(g.x, g.z));
    ok(`${g.id} misses leftoverLot / street / travel`,
      leftoverLotOverlap(g.x, g.z, g.x1 - g.x0, g.len, 0.15) === false
      && streetOverlap(g.x, g.z, g.x1 - g.x0, g.len) === false
      && g.z0 > TRAVEL_Z1);
    const arcade = FLY_VOIDS.find((v) => v.id === `${g.id}-arcade`);
    const pass = FLY_VOIDS.find((v) => v.id === `${g.id}-pass`);
    ok(`${g.id}-arcade listed`, !!arcade && arcade.openH === FIFTH_SOFFIT);
    ok(`${g.id}-pass listed`, !!pass && pass.openW === FIFTH_PASS_W);
    if (arcade) {
      const hit = probeBlocked(kit, arcade.x, arcade.y, arcade.z, 0.28);
      const high = probeBlocked(kit, arcade.x, CITY_Y + FIFTH_SOFFIT - 0.45, arcade.z, 0.28);
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
  ok('leftoverLot A–H still signed after 5th-street',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);

  ok('espa.js exists', existsSync(espaPath));
  ok('index builds Espanola storefronts after 5th-street',
    index.includes("from './landmarks/espa.js'")
    && index.includes('buildEspa(ctx)')
    && index.indexOf('buildEspa(ctx)') > index.indexOf('buildFifth(ctx)'));
  ok('Espanola is GAP_X=243 west face, west of x=240',
    ESPA_X === 243 && ESPA_W_FRONT_X < ESPA_X
    && ESPA_W_FRONT_X + ESPA_D === ESPA_X - 6.5 - 2.4 + ESPA_D
    && ESPA_W_FRONT_X < 240);
  ok('Espanola sits east of cinema toward marina',
    ESPA_X > CINEMA_X && ESPA_X < MARINA_X
    && ESPA_W_FRONT_X > CINEMA_X + 20);
  ok('Espanola cells are signed inland of Ocean Drive',
    ESPA_W_CELLS.length === 3
    && ESPA_W_CELLS.every(([, len]) => len >= 8)
    && ESPA_W_CELLS[0][0] === 114 && ESPA_W_CELLS[0][1] === 16);
  ok('Espanola soffit and passage are flyable',
    ESPA_SOFFIT >= 3.2 && ESPA_PASS_W >= 2.0 && ESPA_PASS_H >= 2.0);
  ok('espa does not draw layout rng, ShaderMaterial, or ped/traffic',
    !/\brng2?\s*\(/.test(espa) && !/\brng3\s*\(/.test(espa)
    && !/\brng4\s*\(/.test(espa) && !espa.includes('ShaderMaterial')
    && !espa.includes('ped.js') && !espa.includes('traffic.js')
    && espa.includes('installFlyColliders'));

  const espaList = espaShops();
  ok('three signed Espanola west-face shops', espaList.length === 3);
  for (let i = 0; i < espaList.length; i++) {
    const g = espaList[i];
    ok(`${g.id} reserved west of 240`, g.x1 + 1.8 < 240 && inReserved(g.x, g.z));
    ok(`${g.id} misses leftoverLot / street / travel`,
      leftoverLotOverlap(g.x, g.z, g.x1 - g.x0, g.len, 0.15) === false
      && streetOverlap(g.x, g.z, g.x1 - g.x0, g.len) === false
      && g.z0 > TRAVEL_Z1);
    const arcade = FLY_VOIDS.find((v) => v.id === `${g.id}-arcade`);
    const pass = FLY_VOIDS.find((v) => v.id === `${g.id}-pass`);
    ok(`${g.id}-arcade listed`, !!arcade && arcade.openH === ESPA_SOFFIT);
    ok(`${g.id}-pass listed`, !!pass && pass.openW === ESPA_PASS_W);
    if (arcade) {
      const hit = probeBlocked(kit, arcade.x, arcade.y, arcade.z, 0.28);
      const high = probeBlocked(kit, arcade.x, CITY_Y + ESPA_SOFFIT - 0.45, arcade.z, 0.28);
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
  ok('leftoverLot A–H still signed after Espanola',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398);

  ok('inland.js exists', existsSync(inlandPath));
  ok('index builds inland mid-rises after Espanola',
    index.includes("from './landmarks/inland.js'")
    && index.includes('buildInland(ctx)')
    && index.indexOf('buildInland(ctx)') > index.indexOf('buildEspa(ctx)'));
  ok('inland mid-rises are six-sided deco plates west of x=240',
    INLAND_MIDRISE_CELLS.length === 8
    && INLAND_MIDRISE_W === 18 && INLAND_MIDRISE_D === 14 && INLAND_MIDRISE_H === 32
    && INLAND_MIDRISE_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1)
    && inland.includes('buildDecoMidriseGeos')
    && inland.includes('buildRooftopKitGeo'));
  ok('inland does not draw layout rng, ShaderMaterial, or ped/traffic',
    !/\brng2?\s*\(/.test(inland) && !/\brng3\s*\(/.test(inland)
    && !/\brng4\s*\(/.test(inland) && inland.includes('hash01')
    && !inland.includes('ShaderMaterial')
    && !inland.includes('ped.js') && !inland.includes('traffic.js'));

  const inlandList = inlandMidrises();
  ok('eight signed inland mid-rises', inlandList.length === 8);
  for (let i = 0; i < inlandList.length; i++) {
    const g = inlandList[i];
    ok(`${g.id} reserved west of 240`, g.x1 + 0.8 < 240 && inReserved(g.x, g.z));
    ok(`${g.id} misses leftoverLot / street / travel`,
      leftoverLotOverlap(g.x, g.z, g.w, g.d, 0.15) === false
      && streetOverlap(g.x, g.z, g.w, g.d) === false
      && g.z0 > TRAVEL_Z1);
    ok(`${g.id} keepout`, !!inKeepout(g.x, g.z));
  }
  const inlandPipes = ALLEY_PIPE_CELLS.filter(([, z]) => z === 248);
  for (let i = 0; i < inlandPipes.length; i++) {
    const [x, z] = inlandPipes[i];
    const v = FLY_VOIDS.find((f) => f.x === x && f.z === z && f.id.startsWith('alley-pipe-'));
    ok(`inland alley-pipe ${x}/${z} listed + open`,
      !!v && !!inKeepout(x, z) && !probeBlocked(kit, v.x, v.y, v.z, 0.28));
  }
  ok('leftoverLot A–H still signed after inland mid-rises',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));
  ok('inland sidewalks miss travel lanes and leftoverLot A–H',
    crowd.includes('INLAND_WALK_Z0') && crowd.includes('92')
    && crowd.includes('ESPA_WALK_X') && crowd.includes('235.3')
    && leftoverLotOverlap(235.3, 92, 0.6, 0.6, 0.15) === false
    && leftoverLotOverlap(48.9, 114, 0.6, 0.6, 0.15) === false
    && 92 > TRAVEL_Z1 && 235.3 < 240);

  ok('lincoln.js exists', existsSync(lincolnPath));
  ok('index builds Lincoln mall after inland mid-rises',
    index.includes("from './landmarks/lincoln.js'")
    && index.includes('buildLincoln(ctx)')
    && index.indexOf('buildLincoln(ctx)') > index.indexOf('buildInland(ctx)'));
  ok('Lincoln mall is z=120, west of leftoverLot A',
    LINCOLN_Z === 120 && LINCOLN_HALF === 5
    && LINCOLN_S_FRONT_Z === 115 && LINCOLN_N_FRONT_Z === 125
    && LINCOLN_PERGOLA_CELLS.every(([x, z]) => x < 240 && z === 120)
    && LINCOLN_WALK_RUNS.every(([x0, x1]) => x1 < 240));
  ok('Lincoln soffit and passage are flyable',
    LINCOLN_SOFFIT >= 3.2 && LINCOLN_PASS_W >= 2.0 && LINCOLN_PASS_H >= 2.0
    && LINCOLN_PERGOLA_POST_H >= 2.0);
  ok('lincoln does not draw layout rng, ShaderMaterial, or ped/traffic',
    !/\brng2?\s*\(/.test(lincoln) && !/\brng3\s*\(/.test(lincoln)
    && !/\brng4\s*\(/.test(lincoln) && !lincoln.includes('ShaderMaterial')
    && !lincoln.includes('ped.js') && !lincoln.includes('traffic.js')
    && lincoln.includes('installFlyColliders'));
  ok('crowd walks the Lincoln mall',
    crowd.includes("kind: 'lincoln'") && crowd.includes('LINCOLN_WALK_Z')
    && crowd.includes('const nLincoln = 20')
    && !crowd.includes('addCollider'));

  const lincolnList = lincolnShops();
  ok('eight signed Lincoln shops', lincolnList.length === 8
    && LINCOLN_S_CELLS.length === 4 && LINCOLN_N_CELLS.length === 4);
  for (let i = 0; i < lincolnList.length; i++) {
    const g = lincolnList[i];
    ok(`${g.id} reserved west of 240`, g.x1 + 1.8 < 240 && inReserved(g.x, g.z));
    ok(`${g.id} misses leftoverLot / street / travel`,
      leftoverLotOverlap(g.x, g.z, g.x1 - g.x0, g.z1 - g.z0, 0.15) === false
      && streetOverlap(g.x, g.z, g.x1 - g.x0, g.z1 - g.z0) === false
      && g.z0 > TRAVEL_Z1 && g.x1 < 251);
    const arcade = FLY_VOIDS.find((v) => v.id === `${g.id}-arcade`);
    const pass = FLY_VOIDS.find((v) => v.id === `${g.id}-pass`);
    ok(`${g.id}-arcade listed`, !!arcade && arcade.openH === LINCOLN_SOFFIT);
    ok(`${g.id}-pass listed`, !!pass && pass.openW === LINCOLN_PASS_W);
    if (arcade) {
      const hit = probeBlocked(kit, arcade.x, arcade.y, arcade.z, 0.28);
      ok(`${g.id}-arcade keepout + open`,
        !!inKeepout(arcade.x, arcade.z) && !hit, hit ? `${hit.tag}` : '');
    }
    if (pass) {
      const hit = probeBlocked(kit, pass.x, pass.y, pass.z, 0.28);
      ok(`${g.id}-pass keepout + open`,
        !!inKeepout(pass.x, pass.z) && !hit, hit ? `${hit.tag}` : '');
    }
  }
  const pergolaList = lincolnPergolas();
  ok('four signed Lincoln pergolas', pergolaList.length === 4);
  for (let i = 0; i < pergolaList.length; i++) {
    const g = pergolaList[i];
    const v = FLY_VOIDS.find((f) => f.id === `lincoln-pergola-${i}`);
    ok(`lincoln-pergola-${i} listed + open`,
      !!v && v.z === LINCOLN_Z && v.openH >= 2
      && !!inKeepout(g.x, g.z)
      && !probeBlocked(kit, v.x, v.y, v.z, 0.28));
    ok(`lincoln-pergola-${i} misses leftoverLot / travel / street`,
      leftoverLotOverlap(g.x, g.z, g.spanX, g.spanZ, 0.15) === false
      && g.z0 > TRAVEL_Z1 && g.x1 < 240
      && streetOverlap(g.x, g.z, g.spanX, g.spanZ) === false);
  }
  ok('Lincoln pavers are pavement west of leftoverLot A',
    onLincolnWalk(96, LINCOLN_Z) && onLincolnWalk(-250, LINCOLN_Z)
    && onLincolnWalk(190, LINCOLN_Z)
    && !onLincolnWalk(258, LINCOLN_Z)
    && leftoverLotOverlap(96, LINCOLN_Z, 2, 2, 0.15) === false);
  ok('leftoverLot A–H still signed after Lincoln mall',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  ok('washington.js exists', existsSync(washingtonPath));
  ok('index builds Washington Ave after Lincoln mall',
    index.includes("from './landmarks/washington.js'")
    && index.includes('buildWashington(ctx)')
    && index.indexOf('buildWashington(ctx)') > index.indexOf('buildLincoln(ctx)')
    && index.indexOf('buildWashington(ctx)') < index.indexOf('buildFlythrough(ctx)'));
  ok('Washington Ave is z=180, west of leftoverLot A',
    WASH_Z === 180 && WASH_HALF === 7 && WASH_X1 < 240
    && WASH_ARCADE_X === 96 && WASH_ARCADE_X < 240
    && WASH_TRAVEL_Z0 > TRAVEL_Z1);
  ok('Washington arcade soffit is flyable',
    WASH_ARCADE_POST_H >= 3.2 && WASH_ARCADE_Z === washingtonArcadeGeom().z);
  ok('washington does not draw layout rng, ShaderMaterial, or ped/traffic',
    !/\brng2?\s*\(/.test(washington) && !/\brng3\s*\(/.test(washington)
    && !/\brng4\s*\(/.test(washington) && washington.includes('hash01')
    && !washington.includes('ShaderMaterial')
    && !washington.includes('ped.js') && !washington.includes('traffic.js')
    && washington.includes('installFlyColliders'));
  ok('crowd walks Washington sidewalks',
    crowd.includes("kind: 'washington'") && crowd.includes('WASH_WALK_Z_OCEAN')
    && crowd.includes('const nWashington = 16')
    && !crowd.includes('addCollider'));

  const washRuns = washingtonRuns();
  ok('four signed Washington runs west of 240',
    washRuns.length === 4 && washRuns.every((r) => r.x1 < 240 && r.z === WASH_Z)
    && onWashingtonRoad(96, WASH_Z));
  const washCars = washingtonCars();
  ok('twelve signed Washington parked cars on shoulders',
    washCars.length === 12
    && washCars.every((c) => c.x1 < 240
      && (c.z === WASH_PARK_OCEAN_Z || c.z === WASH_PARK_INLAND_Z)
      && !(c.z > WASH_TRAVEL_Z0 && c.z < WASH_TRAVEL_Z1)
      && leftoverLotOverlap(c.x, c.z, c.sx, c.sz, 0.15) === false));
  const washArcade = FLY_VOIDS.find((f) => f.id === 'washington-arcade');
  ok('washington-arcade listed + open',
    !!washArcade && washArcade.z === WASH_ARCADE_Z && washArcade.openH >= 2
    && !!inKeepout(WASH_ARCADE_X, WASH_ARCADE_Z)
    && !probeBlocked(kit, washArcade.x, washArcade.y, washArcade.z, 0.28));
  ok('leftoverLot A–H still signed after Washington Ave',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

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
