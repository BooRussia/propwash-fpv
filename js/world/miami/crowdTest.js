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
  AVALON_X, AVALON_FRONT_Z, AVALON_W, AVALON_D, AVALON_SOFFIT,
  MAJESTIC_X, MAJESTIC_FRONT_Z, MAJESTIC_W, MAJESTIC_D,
  BREAKWATER_X, BREAKWATER_FRONT_Z, BREAKWATER_W, BREAKWATER_D,
  CAVALIER_X, CAVALIER_FRONT_Z, CAVALIER_W, CAVALIER_D,
  WINTERHAVEN_X, WINTERHAVEN_FRONT_Z, WINTERHAVEN_W, WINTERHAVEN_D,
  PROMENADE_ARCH_XS, GATE_Z, GATE_X,
  SW_ARCADE_CITY_XS, SW_ARCADE_BEACH_XS, SW_ARCADE_CITY_Z, SW_ARCADE_BEACH_Z,
  SW_ARCADE_POST_H, ALLEY_PIPE_CELLS, ALLEY_PIPE_POST_H, ALLEY_PIPE_HALF_Z,
  FIRE_ESCAPE_CELLS, FIRE_ESCAPE_Z, FIRE_ESCAPE_POST_H, FIRE_ESCAPE_HALF_Z,
  PARK_RING_CELLS, PARK_RING_R, PARK_RING_TUBE, PIER_EXTRA_BAY_IS, PIER_X,
  LIFEGUARD_CELLS, LIFEGUARD_SAND_SIT_CELLS, LIFEGUARD_RING_CELLS,
  LIFEGUARD_RING_R, LIFEGUARD_RING_TUBE, lifeguardRingGeom,
  PIER_PYLON_COUNT, pierBayRingGeom,
  SW_CITY_Z0, SW_CITY_Z1, VBALL_X0, VBALL_Z0, VBALL_Z1,
  LUMMUS_X0, LUMMUS_X1, LUMMUS_Z, LUMMUS_Y, LUMMUS_PATH_HALF,
  LUMMUS_EXTRA_BENCH_CELLS, LUMMUS_DRINKER_CELLS,
  FLY_VOIDS, flyColliderShapes, pierFlyShapes, inKeepout, inFlyVoid,
  leftoverLotOverlap, reservedOverlap, inReserved, streetOverlap,
  helipadOverlap, inHelipadReserved,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_H_X,
  CITY_Y,
  FIFTH_X, FIFTH_W_CELLS, FIFTH_E_CELLS, FIFTH_W_FRONT_X, FIFTH_E_FRONT_X,
  FIFTH_SOFFIT, FIFTH_PASS_W, FIFTH_PASS_H, fifthShops,
  ESPA_X, ESPA_W_CELLS, ESPA_W_FRONT_X, ESPA_SOFFIT, ESPA_PASS_W, ESPA_PASS_H,
  ESPA_D, espaShops, CINEMA_X, CINEMA_W, MARINA_X,
  MARINA_FINGER_XS, MARINA_SWIM_X0, MARINA_SWIM_X1, MARINA_SWIM_Z0, MARINA_SWIM_Z1,
  MARINA_OCEAN_PILE_CELLS, MARINA_OCEAN_CLEAT_CELLS, MARINA_DOCK_Z0, MARINA_DOCK_Z1,
  INLAND_MIDRISE_W, INLAND_MIDRISE_D, INLAND_MIDRISE_H, INLAND_MIDRISE_CELLS,
  inlandMidrises,
  ALLEY_DUMPSTER_CELLS, ALLEY_DOCK_CELLS, ALLEY_DUMP_W, ALLEY_DUMP_D,
  ALLEY_DOCK_W, ALLEY_DOCK_D, alleySolidHitsWhoop,
  LINCOLN_Z, LINCOLN_HALF, LINCOLN_S_FRONT_Z, LINCOLN_N_FRONT_Z,
  LINCOLN_S_CELLS, LINCOLN_N_CELLS, LINCOLN_PERGOLA_CELLS, LINCOLN_WALK_RUNS,
  LINCOLN_SOFFIT, LINCOLN_PASS_W, LINCOLN_PASS_H, LINCOLN_PERGOLA_POST_H,
  lincolnShops, lincolnPergolas, onLincolnWalk,
  WASH_Z, WASH_HALF, WASH_X1, WASH_ARCADE_X, WASH_ARCADE_Z, WASH_ARCADE_POST_H,
  WASH_TRAVEL_Z0, WASH_TRAVEL_Z1, WASH_PARK_OCEAN_Z, WASH_PARK_INLAND_Z,
  WASH_SW_OCEAN_Z, WASH_SW_INLAND_Z,
  washingtonRuns, washingtonCars, washingtonArcadeGeom, onWashingtonRoad,
  onWashingtonWalk,
  EIGHTH_X, EIGHTH_W_CELLS, EIGHTH_E_CELLS, EIGHTH_W_FRONT_X, EIGHTH_E_FRONT_X,
  EIGHTH_SOFFIT, EIGHTH_PASS_W, EIGHTH_PASS_H, EIGHTH_D, eighthShops,
  GAP315_X, GAP315_W_CELLS, GAP315_E_CELLS, GAP315_W_FRONT_X, GAP315_E_FRONT_X,
  GAP315_SOFFIT, GAP315_PASS_W, GAP315_PASS_H, GAP315_D, gap315Shops,
  GAP501_X, GAP501_W_CELLS, GAP501_E_CELLS, GAP501_W_FRONT_X, GAP501_E_FRONT_X,
  GAP501_SOFFIT, GAP501_PASS_W, GAP501_PASS_H, GAP501_D, gap501Shops,
  GAP429_X, GAP429_W_FRONT_X, GAP429_E_FRONT_X, GAP429_W_CELLS, GAP429_E_CELLS,
  gap429Shops, GAP_X,
  COLLINS_WALK_Z, COLLINS_WALK_RUNS, onCollinsWalk,
  XS_HALF,
  BEACH_CHAIR_CELLS, BEACH_UMBRELLA_CELLS, BEACH_CHAIR_WALK_RUNS,
  BOARDWALK_BENCH_CELLS, BOARDWALK_LAMP_CELLS, BOARDWALK_Z, BOARDWALK_TOP,
  CROSS_X, PED_SIGNAL_CELLS, FLEX_POST_CELLS,
} from './constants.js';
import { hash01 } from './rng.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const world = join(here, '..');

const TRAVEL_Z0 = 40.2;
const TRAVEL_Z1 = 47.8;
const BIKE_RACK_XS = [-240, -170, -40, 30, 150];
const LIFEGUARD_SIT_CELLS = LIFEGUARD_CELLS;
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
  const artdecoPath = join(here, 'landmarks/artdeco.js');
  const cinemaPath = join(here, 'landmarks/cinema.js');
  const indexPath = join(here, 'index.js');
  const flyPath = join(here, 'landmarks/flythrough.js');
  const fifthPath = join(here, 'landmarks/fifth.js');
  const espaPath = join(here, 'landmarks/espa.js');
  const inlandPath = join(here, 'landmarks/inland.js');
  const lincolnPath = join(here, 'landmarks/lincoln.js');
  const washingtonPath = join(here, 'landmarks/washington.js');
  const eighthPath = join(here, 'landmarks/eighth.js');
  const gap315Path = join(here, 'landmarks/gap315.js');
  const gap501Path = join(here, 'landmarks/gap501.js');
  const marinaPath = join(here, 'landmarks/marina.js');
  const lummusPath = join(here, 'landmarks/lummus.js');
  const planPath = join(root, 'assets/catalog/miami-build-plan.json');

  const crowd = existsSync(crowdPath) ? readFileSync(crowdPath, 'utf8') : '';
  const casa = existsSync(casaPath) ? readFileSync(casaPath, 'utf8') : '';
  const cleve = existsSync(clevePath) ? readFileSync(clevePath, 'utf8') : '';
  const deco = existsSync(decoPath) ? readFileSync(decoPath, 'utf8') : '';
  const artdeco = existsSync(artdecoPath) ? readFileSync(artdecoPath, 'utf8') : '';
  const cinema = existsSync(cinemaPath) ? readFileSync(cinemaPath, 'utf8') : '';
  const index = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
  const fly = existsSync(flyPath) ? readFileSync(flyPath, 'utf8') : '';
  const fifth = existsSync(fifthPath) ? readFileSync(fifthPath, 'utf8') : '';
  const espa = existsSync(espaPath) ? readFileSync(espaPath, 'utf8') : '';
  const inland = existsSync(inlandPath) ? readFileSync(inlandPath, 'utf8') : '';
  const lincoln = existsSync(lincolnPath) ? readFileSync(lincolnPath, 'utf8') : '';
  const washington = existsSync(washingtonPath) ? readFileSync(washingtonPath, 'utf8') : '';
  const eighth = existsSync(eighthPath) ? readFileSync(eighthPath, 'utf8') : '';
  const gap315 = existsSync(gap315Path) ? readFileSync(gap315Path, 'utf8') : '';
  const gap501 = existsSync(gap501Path) ? readFileSync(gap501Path, 'utf8') : '';
  const marina = existsSync(marinaPath) ? readFileSync(marinaPath, 'utf8') : '';
  const lummus = existsSync(lummusPath) ? readFileSync(lummusPath, 'utf8') : '';
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
  ok('crowd people have torso + limbs, not a single box',
    crowd.includes('personTorsoGeo') && crowd.includes('personLimbGeo')
    && crowd.includes('limbMesh') && crowd.includes('extraPropGeo')
    && !crowd.includes('BoxGeometry(0.32, 0.72, 0.2)'));
  ok('crowd is thicker',
    crowd.includes('const nWalk = 140') && crowd.includes('const nBike = 32')
    && crowd.includes('const nBeach = 68') && crowd.includes('const nSwim = 36')
    && crowd.includes('const nInland = 36'));
  ok('crowd swims the marina fingers',
    crowd.includes("kind: 'marina-swim'") && crowd.includes('const nMarinaSwim = 24')
    && crowd.includes('MARINA_SWIM_X0') && crowd.includes('onMarinaDock')
    && !crowd.includes('addCollider'));
  ok('crowd walks Lummus under the pergola',
    crowd.includes("kind: 'lummus'") && crowd.includes('const nLummus = 24')
    && crowd.includes("kind: 'lummus-sit'") && crowd.includes('LUMMUS_EXTRA_BENCH_CELLS')
    && !crowd.includes('addCollider'));
  ok('lummus extra benches and drinkers are signed, miss leftoverLot / travel',
    LUMMUS_EXTRA_BENCH_CELLS.length === 4 && LUMMUS_DRINKER_CELLS.length === 4
    && LUMMUS_X0 === -122 && LUMMUS_X1 === -28 && LUMMUS_Z === 18.6
    && LUMMUS_Z < TRAVEL_Z0 && LUMMUS_Y === 1.46
    && LUMMUS_EXTRA_BENCH_CELLS.every(([x]) => x > LUMMUS_X0 && x < LUMMUS_X1 && x < 240)
    && LUMMUS_DRINKER_CELLS.every(([x]) => x > LUMMUS_X0 && x < LUMMUS_X1)
    && LUMMUS_EXTRA_BENCH_CELLS.every(([x, s]) => {
      const z = LUMMUS_Z + s * (LUMMUS_PATH_HALF - 0.62);
      return leftoverLotOverlap(x, z, 1.9, 0.62, 0.15) === false
        && !(z > TRAVEL_Z0 && z < TRAVEL_Z1);
    })
    && lummus.includes('LUMMUS_EXTRA_BENCH_CELLS') && lummus.includes('LUMMUS_DRINKER_CELLS')
    && lummus.includes('hash01') && !/\brng2?\s*\(/.test(lummus)
    && !/\brng3\s*\(/.test(lummus) && !/\brng4\s*\(/.test(lummus)
    && !lummus.includes('ShaderMaterial')
    && !lummus.includes('ped.js') && !lummus.includes('traffic.js'));
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
  ok('sand sitters sit at the west-of-240 lifeguard stands, no colliders',
    LIFEGUARD_SAND_SIT_CELLS.length === 10
    && LIFEGUARD_SAND_SIT_CELLS.every(([x, z]) => x < 240 && z < TRAVEL_Z0
      && leftoverLotOverlap(x, z, 0.6, 0.6, 0.15) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)
      && inKeepout(x, z) === false)
    && crowd.includes("kind: 'guard-sand'")
    && crowd.includes('LIFEGUARD_SAND_SIT_CELLS')
    && crowd.includes('const nGuardSand = LIFEGUARD_SAND_SIT_CELLS.length')
    && crowd.includes('hash01(i + 2800')
    && !crowd.includes('addCollider') && !crowd.includes('addOBB')
    && LIFEGUARD_SIT_CELLS.length === 6
    && LIFEGUARD_SIT_CELLS.every(([x, z], i) => x === LIFEGUARD_CELLS[i][0] && z === LIFEGUARD_CELLS[i][1]));

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
    && !deco.includes('ShaderMaterial')
    && !artdeco.includes('ShaderMaterial') && !cinema.includes('ShaderMaterial'));
  ok('extra neon outlines on Ocean Drive hotels, dayNight only, no rng',
    artdeco.includes('extra neon outline') && artdeco.includes('regDN')
    && !/\brng2?\s*\(/.test(artdeco) && !/\brng3\s*\(/.test(artdeco)
    && !/\brng4\s*\(/.test(artdeco)
    && cleve.includes('extra neon outline') && cleve.includes('regDN')
    && !/\brng2?\s*\(/.test(cleve)
    && deco.includes('extra neon outline') && deco.includes('Colony corner tubes')
    && deco.includes('Avalon corner tubes')
    && deco.includes('Majestic corner tubes')
    && deco.includes('Breakwater corner tubes')
    && deco.includes('Cavalier corner tubes')
    && deco.includes('Winterhaven corner tubes')
    && !/\brng2?\s*\(/.test(deco) && !/\brng3\s*\(/.test(deco)
    && !/\brng4\s*\(/.test(deco));
  ok('cinema blade extra neon outline, dayNight only, no rng',
    cinema.includes('extra neon outline') && cinema.includes('blade top/bottom rails')
    && cinema.includes('regDN') && cinema.includes('neonMat')
    && !/\brng2?\s*\(/.test(cinema) && !/\brng3\s*\(/.test(cinema)
    && !/\brng4\s*\(/.test(cinema)
    && !cinema.includes('ShaderMaterial'));
  ok('extra neon tubes sit on the 57.6 facade, not travel lanes',
    artdeco.includes('zF - 0.28') && FRONT_Z_OK()
    && leftoverLotOverlap(-75, 57.6, 2, 2, 0.15) === false
    && leftoverLotOverlap(-152, 57.6, 2, 2, 0.15) === false
    && leftoverLotOverlap(-178, 57.6, 2, 2, 0.15) === false
    && leftoverLotOverlap(166, 57.6, 2, 2, 0.15) === false);

function FRONT_Z_OK() {
  return CASA_FRONT_Z === 57.6 && CLEVELANDER_FRONT_Z === 57.6
    && CARDOZO_FRONT_Z === 57.6 && COLONY_FRONT_Z === 57.6
    && AVALON_FRONT_Z === 57.6 && MAJESTIC_FRONT_Z === 57.6
    && 57.6 > TRAVEL_Z1;
}
  ok('constants still name leftoverLot A at 258',
    constants.includes('LEFTOVER_LOT_X') && LEFTOVER_LOT_X === 258);

  ok('travel-lane numbers unchanged', TRAVEL_Z0 === 40.2 && TRAVEL_Z1 === 47.8);

  ok('Colony sits west of the deco row on the facade plane',
    COLONY_X === -108 && COLONY_FRONT_Z === 57.6 && COLONY_W === 20
    && COLONY_D === 24 && COLONY_SOFFIT === 3.5
    && COLONY_X + COLONY_W / 2 < -88);
  ok('Avalon sits west of Colony / GAP -129 on the facade plane',
    AVALON_X === -152 && AVALON_FRONT_Z === 57.6 && AVALON_W === 18
    && AVALON_D === 24 && AVALON_SOFFIT === 3.5
    && AVALON_X + AVALON_W / 2 + 1.2 < -129 - XS_HALF
    && AVALON_X + AVALON_W / 2 < COLONY_X - COLONY_W / 2
    && AVALON_FRONT_Z - 3.4 > TRAVEL_Z1);
  ok('Majestic sits west of Avalon, east of GAP -315, west of x=240',
    MAJESTIC_X === -178 && MAJESTIC_FRONT_Z === 57.6
    && MAJESTIC_W === 16 && MAJESTIC_D === 22
    && MAJESTIC_X + MAJESTIC_W / 2 + 1.2 < AVALON_X - AVALON_W / 2 - 1.2
    && MAJESTIC_X - MAJESTIC_W / 2 - 1.2 > -315 + XS_HALF
    && MAJESTIC_X + MAJESTIC_W / 2 + 1.2 < 240
    && MAJESTIC_FRONT_Z > TRAVEL_Z1);
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
    && reservedOverlap(AVALON_X, AVALON_FRONT_Z + 8, AVALON_W, AVALON_D, 0.15)
    && reservedOverlap(MAJESTIC_X, MAJESTIC_FRONT_Z + 8, MAJESTIC_W, MAJESTIC_D, 0.15)
    && reservedOverlap(BREAKWATER_X, BREAKWATER_FRONT_Z + 8, BREAKWATER_W, BREAKWATER_D, 0.15)
    && reservedOverlap(CAVALIER_X, CAVALIER_FRONT_Z + 8, CAVALIER_W, CAVALIER_D, 0.15)
    && reservedOverlap(WINTERHAVEN_X, WINTERHAVEN_FRONT_Z + 8, WINTERHAVEN_W, WINTERHAVEN_D, 0.15)
    && leftoverLotOverlap(COLONY_X, COLONY_FRONT_Z + 8, COLONY_W, COLONY_D, 0.15) === false
    && leftoverLotOverlap(AVALON_X, AVALON_FRONT_Z + 8, AVALON_W, AVALON_D, 0.15) === false
    && leftoverLotOverlap(MAJESTIC_X, MAJESTIC_FRONT_Z + 8, MAJESTIC_W, MAJESTIC_D, 0.15) === false
    && leftoverLotOverlap(BREAKWATER_X, BREAKWATER_FRONT_Z + 8, BREAKWATER_W, BREAKWATER_D, 0.15) === false
    && leftoverLotOverlap(CAVALIER_X, CAVALIER_FRONT_Z + 8, CAVALIER_W, CAVALIER_D, 0.15) === false
    && leftoverLotOverlap(WINTERHAVEN_X, WINTERHAVEN_FRONT_Z + 8, WINTERHAVEN_W, WINTERHAVEN_D, 0.15) === false);
  ok('named deco hotels miss the carriageway and travel lanes',
    streetOverlap(COLONY_X, COLONY_FRONT_Z + COLONY_D / 2, COLONY_W, COLONY_D) === false
    && streetOverlap(AVALON_X, AVALON_FRONT_Z + AVALON_D / 2, AVALON_W, AVALON_D) === false
    && streetOverlap(MAJESTIC_X, MAJESTIC_FRONT_Z + MAJESTIC_D / 2, MAJESTIC_W, MAJESTIC_D) === false
    && streetOverlap(BREAKWATER_X, BREAKWATER_FRONT_Z + BREAKWATER_D / 2, BREAKWATER_W, BREAKWATER_D) === false
    && streetOverlap(CAVALIER_X, CAVALIER_FRONT_Z + CAVALIER_D / 2, CAVALIER_W, CAVALIER_D) === false
    && streetOverlap(WINTERHAVEN_X, WINTERHAVEN_FRONT_Z + WINTERHAVEN_D / 2, WINTERHAVEN_W, WINTERHAVEN_D) === false
    && COLONY_FRONT_Z - 3.4 > TRAVEL_Z1
    && AVALON_FRONT_Z - 3.4 > TRAVEL_Z1
    && MAJESTIC_FRONT_Z > TRAVEL_Z1
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
  const avalonArcade = FLY_VOIDS.find((v) => v.id === 'avalon-arcade');
  ok('avalon-arcade fly void exists',
    !!avalonArcade && avalonArcade.openH === AVALON_SOFFIT && avalonArcade.openW >= 8);
  ok('avalon-arcade keepout + inFlyVoid',
    !!avalonArcade && !!inKeepout(avalonArcade.x, avalonArcade.z)
    && !!inFlyVoid(avalonArcade.x, avalonArcade.z)
    && avalonArcade.z > TRAVEL_Z1);
  if (avalonArcade) {
    const hit = probeBlocked(kit, avalonArcade.x, avalonArcade.y, avalonArcade.z, 0.28);
    ok('avalon arcade bay centre is open', !hit, hit ? `${hit.tag} ${hit.type}` : '');
    ok('avalon arcade misses leftoverLot / street / travel',
      leftoverLotOverlap(avalonArcade.x, avalonArcade.z, 2.4, 2.0, 0.15) === false
      && streetOverlap(avalonArcade.x, avalonArcade.z, 2.4, 1.8) === false
      && avalonArcade.z > TRAVEL_Z1);
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

  ok('fire escapes are eight signed flank cells at z=248 west of 240',
    FIRE_ESCAPE_CELLS.length === 8
    && FIRE_ESCAPE_CELLS.every(([x, z]) => x < 240 && z === FIRE_ESCAPE_Z)
    && FIRE_ESCAPE_Z === 248 && FIRE_ESCAPE_POST_H >= 2.0
    && FIRE_ESCAPE_HALF_Z * 2 - 0.16 >= 1.15
    && FIRE_ESCAPE_Z > TRAVEL_Z1);
  ok('fire-escape flanks sit on inland mid-rise x ± 9',
    FIRE_ESCAPE_CELLS[0][0] === -430 - INLAND_MIDRISE_W / 2
    && FIRE_ESCAPE_CELLS[1][0] === -430 + INLAND_MIDRISE_W / 2
    && FIRE_ESCAPE_CELLS[6][0] === 100 - INLAND_MIDRISE_W / 2
    && FIRE_ESCAPE_CELLS[7][0] === 100 + INLAND_MIDRISE_W / 2);
  ok('flythrough builds fire escapes, jambs only, no layout rng',
    fly.includes('FIRE_ESCAPE_CELLS') && fly.includes("setTag('fire-escape')")
    && fly.includes('buildFireEscape') && fly.includes("installFlyColliders(addCyl, addCollider, 'fire-escape')")
    && !/\brng2?\s*\(/.test(fly) && !/\brng3\s*\(/.test(fly) && !/\brng4\s*\(/.test(fly)
    && !fly.includes('ShaderMaterial'));
  for (let i = 0; i < FIRE_ESCAPE_CELLS.length; i++) {
    const v = FLY_VOIDS.find((f) => f.id === `fire-escape-${i}`);
    const [x, z] = FIRE_ESCAPE_CELLS[i];
    ok(`fire-escape-${i} listed`, !!v && v.x === x && v.z === z);
    if (v) {
      ok(`fire-escape-${i} reserved keepout open`,
        !!inReserved(v.x, v.z) && !!inKeepout(v.x, v.z)
        && v.openW >= 1.15 && v.openH >= 2.0
        && !probeBlocked(kit, v.x, v.y, v.z, 0.28));
      ok(`fire-escape-${i} misses leftoverLot A–H / street / travel`,
        leftoverLotOverlap(v.x, v.z, 2.4, 2.6, 0.15) === false
        && streetOverlap(v.x, v.z, 0.4, 2.6) === false
        && v.z > TRAVEL_Z1 && v.x < 240);
    }
  }
  const fireHitsTravel = kit.filter((s) => {
    const z0 = s.type === 'cyl' ? s.z - s.r : s.z - s.sz / 2;
    const z1 = s.type === 'cyl' ? s.z + s.r : s.z + s.sz / 2;
    return s.tag === 'fire-escape' && z0 < TRAVEL_Z1 && z1 > TRAVEL_Z0;
  });
  ok('no fire-escape collider in travel lanes 40.2–47.8',
    fireHitsTravel.length === 0);

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

  ok('lifeguard rings are five stand whoops west of 240',
    LIFEGUARD_RING_CELLS.length === 5
    && LIFEGUARD_RING_CELLS.every(([x, z]) => x < 240 && z < TRAVEL_Z0)
    && LIFEGUARD_RING_R - LIFEGUARD_RING_TUBE >= 1.0
    && LIFEGUARD_RING_CELLS.every(([x, z]) => leftoverLotOverlap(x, z, 0.4, 2.4, 0.15) === false)
    && !LIFEGUARD_RING_CELLS.some(([x]) => x >= 240));
  ok('flythrough builds lifeguard rings',
    fly.includes('LIFEGUARD_RING_CELLS') && fly.includes("setTag('lifeguard-ring')")
    && fly.includes('buildLifeguardRing') && fly.includes('lifeguardRingGeom')
    && !/\brng2?\s*\(/.test(fly) && !/\brng3\s*\(/.test(fly)
    && !/\brng4\s*\(/.test(fly) && !fly.includes('ShaderMaterial'));
  for (let i = 0; i < LIFEGUARD_RING_CELLS.length; i++) {
    const v = FLY_VOIDS.find((f) => f.id === `lifeguard-ring-${i}`);
    const g = lifeguardRingGeom(LIFEGUARD_RING_CELLS[i][0], LIFEGUARD_RING_CELLS[i][1]);
    ok(`lifeguard-ring-${i} listed`, !!v && v.x === LIFEGUARD_RING_CELLS[i][0]
      && v.z === LIFEGUARD_RING_CELLS[i][1]);
    if (v) {
      ok(`lifeguard-ring-${i} keepout + open disc`,
        !!inKeepout(v.x, v.z) && !probeBlocked(kit, v.x, v.y, v.z, 0.28)
        && v.openW >= 2.0 && v.openH >= 2.0);
      ok(`lifeguard-ring-${i} misses leftoverLot / travel / x>=240`,
        leftoverLotOverlap(v.x, v.z, 0.4, 2.4, 0.15) === false
        && v.z < TRAVEL_Z0 && v.x < 240
        && !(v.z0 < TRAVEL_Z1 && v.z1 > TRAVEL_Z0)
        && g.fly === '+X');
    }
  }
  const lgRingHitsTravel = kit.filter((s) => {
    const z0 = s.type === 'cyl' ? s.z - s.r : s.z - s.sz / 2;
    const z1 = s.type === 'cyl' ? s.z + s.r : s.z + s.sz / 2;
    return s.tag === 'lifeguard-ring' && z0 < TRAVEL_Z1 && z1 > TRAVEL_Z0;
  });
  ok('no lifeguard-ring collider in travel lanes 40.2–47.8',
    lgRingHitsTravel.length === 0);
  ok('leftoverLot A–H still signed after lifeguard fill',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  const pierKit = pierFlyShapes();
  ok('pier still has ten pylon stations', PIER_PYLON_COUNT === 10);
  ok('pier extra bays are four signed undercroft whoops',
    PIER_EXTRA_BAY_IS.length === 4 && PIER_EXTRA_BAY_IS[0] === 1
    && PIER_EXTRA_BAY_IS[1] === 2 && PIER_EXTRA_BAY_IS[2] === 6
    && PIER_EXTRA_BAY_IS[3] === 7);
  ok('new pier-bay rings sit seaward of the original extra bays',
    pierBayRingGeom(2).z < pierBayRingGeom(1).z
    && pierBayRingGeom(7).z < pierBayRingGeom(6).z
    && pierBayRingGeom(2).z < TRAVEL_Z0
    && pierBayRingGeom(7).z < TRAVEL_Z0
    && leftoverLotOverlap(PIER_X, pierBayRingGeom(2).z, 2.4, 2.4, 0.15) === false
    && leftoverLotOverlap(PIER_X, pierBayRingGeom(7).z, 2.4, 2.4, 0.15) === false);
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
    INLAND_MIDRISE_CELLS.length === 10
    && INLAND_MIDRISE_W === 18 && INLAND_MIDRISE_D === 14 && INLAND_MIDRISE_H === 32
    && INLAND_MIDRISE_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1)
    && INLAND_MIDRISE_CELLS.filter(([x]) => x < -430).length === 2
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -600 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -600 && z === 259)
    && inland.includes('buildDecoMidriseGeos')
    && inland.includes('buildRooftopKitGeo'));
  ok('inland does not draw layout rng, ShaderMaterial, or ped/traffic',
    !/\brng2?\s*\(/.test(inland) && !/\brng3\s*\(/.test(inland)
    && !/\brng4\s*\(/.test(inland) && inland.includes('hash01')
    && !inland.includes('ShaderMaterial')
    && !inland.includes('ped.js') && !inland.includes('traffic.js'));
  ok('inland mid-rise windows are warm regDN emissives after dusk',
    inland.includes('regDN') && inland.includes('emissiveMap: decoTex.emissive')
    && inland.includes('0xffb060') && inland.includes('2.45')
    && !inland.includes('ShaderMaterial'));

  const inlandList = inlandMidrises();
  ok('ten signed inland mid-rises', inlandList.length === 10);
  ok('helipad W reserved still signed',
    inHelipadReserved(-430, 100) && helipadOverlap(-430, 101, 44, 54, 0.15));
  for (let i = 0; i < inlandList.length; i++) {
    const g = inlandList[i];
    ok(`${g.id} reserved west of 240`, g.x1 + 0.8 < 240 && inReserved(g.x, g.z));
    ok(`${g.id} misses leftoverLot / street / travel / helipad W`,
      leftoverLotOverlap(g.x, g.z, g.w, g.d, 0.15) === false
      && streetOverlap(g.x, g.z, g.w, g.d) === false
      && helipadOverlap(g.x, g.z, g.w, g.d, 0.15) === false
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
  ok('signed alley dumpsters and docks miss pipe / fire-escape / leftoverLot',
    ALLEY_DUMPSTER_CELLS.length === 4 && ALLEY_DOCK_CELLS.length === 4
    && inland.includes('ALLEY_DUMPSTER_CELLS') && inland.includes('inland-alley-dumpsters')
    && ALLEY_DUMPSTER_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1
      && leftoverLotOverlap(x, z, ALLEY_DUMP_W, ALLEY_DUMP_D, 0.15) === false
      && alleySolidHitsWhoop(x, z, ALLEY_DUMP_W, ALLEY_DUMP_D) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1))
    && ALLEY_DOCK_CELLS.every(([x, z]) => x < 240
      && leftoverLotOverlap(x, z, ALLEY_DOCK_W, ALLEY_DOCK_D, 0.15) === false
      && alleySolidHitsWhoop(x, z, ALLEY_DOCK_W, ALLEY_DOCK_D) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)));
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
    && crowd.includes('const nLincoln = 40')
    && crowd.includes("kind: 'lincoln-sit'")
    && crowd.includes('const nLincolnSit = 14')
    && crowd.includes('onLincolnWalk')
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
    && crowd.includes('const nWashington = 36')
    && crowd.includes('onWashingtonWalk')
    && crowd.includes('WASH_TRAVEL_Z0')
    && !crowd.includes('addCollider'));
  ok('crowd walks 8th-street sidewalks',
    crowd.includes("kind: 'eighth'") && crowd.includes('EIGHTH_WALK_XS')
    && crowd.includes('const nEighth = 36')
    && crowd.includes('EIGHTH_WALK_Z_RUNS')
    && crowd.includes('npcOffLimits')
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

  const lincolnSpots = [];
  for (let i = 0; i < 40; i++) {
    const run = LINCOLN_WALK_RUNS[i % LINCOLN_WALK_RUNS.length];
    const x = run[0] + hash01(i + 1600, 3) * (run[1] - run[0]);
    const z = LINCOLN_Z + (hash01(i + 1600, 5) - 0.5) * 6.0;
    if (x >= 240) continue;
    if (leftoverLotOverlap(x, z, 0.6, 0.6, 0.15)) continue;
    if (z > TRAVEL_Z0 && z < TRAVEL_Z1) continue;
    if (!onLincolnWalk(x, z)) continue;
    lincolnSpots.push({ x, z });
  }
  const lincolnSitSpots = [];
  for (let i = 0; i < 14; i++) {
    const run = LINCOLN_WALK_RUNS[i % LINCOLN_WALK_RUNS.length];
    const x = run[0] + hash01(i + 1700, 3) * (run[1] - run[0]);
    const z = LINCOLN_Z + (hash01(i + 1700, 5) < 0.5 ? -3.6 : 3.6);
    if (x >= 240) continue;
    if (leftoverLotOverlap(x, z, 0.6, 0.6, 0.15)) continue;
    if (z > TRAVEL_Z0 && z < TRAVEL_Z1) continue;
    if (!onLincolnWalk(x, z)) continue;
    lincolnSitSpots.push({ x, z });
  }
  ok('lincoln walkers fill the mall, miss leftoverLot / travel / x>=240',
    lincolnSpots.length >= 36
    && lincolnSpots.every((p) => onLincolnWalk(p.x, p.z)
      && p.x < 240 && leftoverLotOverlap(p.x, p.z, 0.6, 0.6, 0.15) === false
      && !(p.z > TRAVEL_Z0 && p.z < TRAVEL_Z1)));
  ok('lincoln sitters sit on the mall, miss leftoverLot / travel',
    lincolnSitSpots.length >= 12
    && lincolnSitSpots.every((p) => onLincolnWalk(p.x, p.z)
      && p.x < 240 && leftoverLotOverlap(p.x, p.z, 0.6, 0.6, 0.15) === false
      && !(p.z > TRAVEL_Z0 && p.z < TRAVEL_Z1)));

  const washRunsForCrowd = washingtonRuns();
  const washSpots = [];
  for (let i = 0; i < 36; i++) {
    const run = washRunsForCrowd[i % washRunsForCrowd.length];
    const x = run.x0 + hash01(i + 1800, 3) * (run.x1 - run.x0);
    const ocean = hash01(i + 1800, 5) < 0.5;
    const zc = ocean ? WASH_SW_OCEAN_Z : WASH_SW_INLAND_Z;
    const z = zc + (hash01(i + 1800, 13) - 0.5) * 0.8;
    if (x >= 240) continue;
    if (leftoverLotOverlap(x, z, 0.6, 0.6, 0.15)) continue;
    if (z > TRAVEL_Z0 && z < TRAVEL_Z1) continue;
    if (z > WASH_TRAVEL_Z0 && z < WASH_TRAVEL_Z1) continue;
    if (!onWashingtonWalk(x, z)) continue;
    washSpots.push({ x, z });
  }
  ok('washington walkers fill both sidewalks, miss travel / leftoverLot',
    washSpots.length >= 32
    && washSpots.every((p) => onWashingtonWalk(p.x, p.z)
      && p.x < 240 && leftoverLotOverlap(p.x, p.z, 0.6, 0.6, 0.15) === false
      && !(p.z > TRAVEL_Z0 && p.z < TRAVEL_Z1)
      && !(p.z > WASH_TRAVEL_Z0 && p.z < WASH_TRAVEL_Z1))
    && washSpots.some((p) => Math.abs(p.z - WASH_SW_OCEAN_Z) < 0.6)
    && washSpots.some((p) => Math.abs(p.z - WASH_SW_INLAND_Z) < 0.6));
  ok('lincoln/washington NPCs have no colliders',
    !crowd.includes('addCollider') && !crowd.includes('addOBB')
    && crowd.includes('npcOffLimits'));

  ok('eighth.js exists', existsSync(eighthPath));
  ok('index builds 8th-street storefronts after Washington Ave',
    index.includes("from './landmarks/eighth.js'")
    && index.includes('buildEighth(ctx)')
    && index.indexOf('buildEighth(ctx)') > index.indexOf('buildWashington(ctx)')
    && index.indexOf('buildEighth(ctx)') < index.indexOf('buildFlythrough(ctx)'));
  ok('8th-street is GAP_X=-129, west of x=240',
    EIGHTH_X === -129 && EIGHTH_W_FRONT_X < EIGHTH_X && EIGHTH_E_FRONT_X > EIGHTH_X
    && EIGHTH_E_FRONT_X + EIGHTH_D < 240);
  ok('8th-street cells are signed inland of Ocean Drive',
    EIGHTH_W_CELLS.length === 4 && EIGHTH_E_CELLS.length === 2
    && EIGHTH_W_CELLS.every(([, len]) => len >= 8)
    && EIGHTH_E_CELLS[0][0] === 95 && EIGHTH_E_CELLS[0][1] === 8);
  ok('8th-street soffit and passage are flyable',
    EIGHTH_SOFFIT >= 3.2 && EIGHTH_PASS_W >= 2.0 && EIGHTH_PASS_H >= 2.0);
  ok('eighth does not draw layout rng, ShaderMaterial, or ped/traffic',
    !/\brng2?\s*\(/.test(eighth) && !/\brng3\s*\(/.test(eighth)
    && !/\brng4\s*\(/.test(eighth) && !eighth.includes('ShaderMaterial')
    && !eighth.includes('ped.js') && !eighth.includes('traffic.js')
    && eighth.includes('installFlyColliders'));

  const eighthList = eighthShops();
  ok('six signed 8th-street shops', eighthList.length === 6);
  for (let i = 0; i < eighthList.length; i++) {
    const g = eighthList[i];
    ok(`${g.id} reserved west of 240`, g.x1 + 1.8 < 240 && inReserved(g.x, g.z));
    ok(`${g.id} misses leftoverLot / street / travel`,
      leftoverLotOverlap(g.x, g.z, g.x1 - g.x0, g.len, 0.15) === false
      && streetOverlap(g.x, g.z, g.x1 - g.x0, g.len) === false
      && g.z0 > TRAVEL_Z1);
    const arcade = FLY_VOIDS.find((v) => v.id === `${g.id}-arcade`);
    const pass = FLY_VOIDS.find((v) => v.id === `${g.id}-pass`);
    ok(`${g.id}-arcade listed`, !!arcade && arcade.openH === EIGHTH_SOFFIT);
    ok(`${g.id}-pass listed`, !!pass && pass.openW === EIGHTH_PASS_W);
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
  ok('leftoverLot A–H still signed after 8th-street',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  const EIGHTH_WALK_XS = [-136.7, -121.3];
  const EIGHTH_WALK_Z_RUNS = [[92, 168], [190, 220]];
  const eighthSpots = [];
  for (let i = 0; i < 36; i++) {
    const x = EIGHTH_WALK_XS[i % EIGHTH_WALK_XS.length];
    const runI = ((i / EIGHTH_WALK_XS.length) | 0) % EIGHTH_WALK_Z_RUNS.length;
    const run = EIGHTH_WALK_Z_RUNS[runI];
    const z = run[0] + hash01(i + 2100, 3) * (run[1] - run[0]);
    if (x >= 240) continue;
    if (leftoverLotOverlap(x, z, 0.6, 0.6, 0.15)) continue;
    if (z > TRAVEL_Z0 && z < TRAVEL_Z1) continue;
    if (z > WASH_TRAVEL_Z0 && z < WASH_TRAVEL_Z1) continue;
    eighthSpots.push({ x, z });
  }
  ok('eighth walkers fill both sidewalks, miss travel / leftoverLot / x>=240',
    eighthSpots.length >= 32
    && eighthSpots.every((p) => p.x < 240
      && leftoverLotOverlap(p.x, p.z, 0.6, 0.6, 0.15) === false
      && !(p.z > TRAVEL_Z0 && p.z < TRAVEL_Z1)
      && !(p.z > WASH_TRAVEL_Z0 && p.z < WASH_TRAVEL_Z1)
      && p.z > TRAVEL_Z1)
    && eighthSpots.some((p) => Math.abs(p.x - EIGHTH_WALK_XS[0]) < 0.05)
    && eighthSpots.some((p) => Math.abs(p.x - EIGHTH_WALK_XS[1]) < 0.05)
    && eighthSpots.some((p) => p.z >= 92 && p.z <= 168)
    && eighthSpots.some((p) => p.z >= 190 && p.z <= 220));
  ok('eighth NPCs have no colliders and skip keepout so frontage fills',
    !crowd.includes('addCollider') && !crowd.includes('addOBB')
    && crowd.includes("kind: 'eighth'")
    && crowd.includes('npcOffLimits')
    && EIGHTH_WALK_XS.every((x) => x < 240 && Math.abs(x - EIGHTH_X) > XS_HALF)
    && EIGHTH_WALK_XS.every((x) => leftoverLotOverlap(x, 114, 0.6, 0.6, 0.15) === false)
    && EIGHTH_WALK_Z_RUNS.every((run) => run[0] > TRAVEL_Z1
      && !(run[0] < WASH_TRAVEL_Z1 && run[1] > WASH_TRAVEL_Z0)));

  ok('crowd walks Collins sidewalk in front of Avalon/Majestic/Colony',
    crowd.includes("kind: 'collins'") && crowd.includes('COLLINS_WALK_RUNS')
    && crowd.includes('const nCollins = 36')
    && crowd.includes('onCollinsWalk')
    && crowd.includes('npcOffLimits')
    && crowd.includes('hash01')
    && !/\brng2?\s*\(/.test(crowd) && !/\brng3\s*\(/.test(crowd)
    && !/\brng4\s*\(/.test(crowd)
    && !crowd.includes('addCollider') && !crowd.includes('addOBB'));
  ok('Collins walk runs sit on the city sidewalk, west of leftoverLot A',
    COLLINS_WALK_Z === (SW_CITY_Z0 + SW_CITY_Z1) / 2
    && COLLINS_WALK_Z > TRAVEL_Z1
    && COLLINS_WALK_RUNS.length === 3
    && COLLINS_WALK_RUNS.every(([x0, x1]) => x0 < x1 && x1 < 240 && x0 > -315 + XS_HALF)
    && Math.abs(COLLINS_WALK_RUNS[0][0] - (MAJESTIC_X - MAJESTIC_W / 2)) < 1e-6
    && Math.abs(COLLINS_WALK_RUNS[1][0] - (AVALON_X - AVALON_W / 2)) < 1e-6
    && Math.abs(COLLINS_WALK_RUNS[2][0] - (COLONY_X - COLONY_W / 2)) < 1e-6
    && COLLINS_WALK_RUNS.every(([x0, x1]) => {
      const mid = (x0 + x1) / 2;
      return leftoverLotOverlap(mid, COLLINS_WALK_Z, 0.6, 0.6, 0.15) === false
        && Math.abs(mid + 129) > XS_HALF + 0.55
        && onCollinsWalk(mid, COLLINS_WALK_Z)
        && !(COLLINS_WALK_Z > TRAVEL_Z0 && COLLINS_WALK_Z < TRAVEL_Z1);
    })
    && !onCollinsWalk(258, COLLINS_WALK_Z)
    && !onCollinsWalk(-129, COLLINS_WALK_Z));

  const collinsSpots = [];
  for (let i = 0; i < 36; i++) {
    const run = COLLINS_WALK_RUNS[i % COLLINS_WALK_RUNS.length];
    const x = run[0] + hash01(i + 2200, 3) * (run[1] - run[0]);
    const z = COLLINS_WALK_Z + (hash01(i + 2200, 13) - 0.5) * 0.8;
    if (x >= 240) continue;
    if (leftoverLotOverlap(x, z, 0.6, 0.6, 0.15)) continue;
    if (z > TRAVEL_Z0 && z < TRAVEL_Z1) continue;
    if (!onCollinsWalk(x, z)) continue;
    collinsSpots.push({ x, z });
  }
  ok('collins walkers fill Avalon/Majestic/Colony sidewalks, miss travel / leftoverLot',
    collinsSpots.length >= 32
    && collinsSpots.every((p) => onCollinsWalk(p.x, p.z)
      && p.x < 240 && p.x < 251
      && leftoverLotOverlap(p.x, p.z, 0.6, 0.6, 0.15) === false
      && !(p.z > TRAVEL_Z0 && p.z < TRAVEL_Z1)
      && p.z >= SW_CITY_Z0 && p.z <= SW_CITY_Z1
      && Math.abs(p.x + 129) > XS_HALF)
    && collinsSpots.some((p) => p.x >= MAJESTIC_X - MAJESTIC_W / 2
      && p.x <= MAJESTIC_X + MAJESTIC_W / 2)
    && collinsSpots.some((p) => p.x >= AVALON_X - AVALON_W / 2
      && p.x <= AVALON_X + AVALON_W / 2)
    && collinsSpots.some((p) => p.x >= COLONY_X - COLONY_W / 2
      && p.x <= COLONY_X + COLONY_W / 2));
  ok('collins NPCs have no colliders and leftoverLot A–H unmoved',
    !crowd.includes('addCollider') && !crowd.includes('addOBB')
    && crowd.includes("kind: 'collins'")
    && crowd.includes('npcOffLimits')
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  ok('gap315.js exists', existsSync(gap315Path));
  ok('index builds GAP_X=-315 storefronts after 8th-street',
    index.includes("from './landmarks/gap315.js'")
    && index.includes('buildGap315(ctx)')
    && index.indexOf('buildGap315(ctx)') > index.indexOf('buildEighth(ctx)')
    && index.indexOf('buildGap315(ctx)') < index.indexOf('buildFlythrough(ctx)'));
  ok('GAP_X=-315 is west of x=240',
    GAP315_X === -315 && GAP315_W_FRONT_X < GAP315_X && GAP315_E_FRONT_X > GAP315_X
    && GAP315_E_FRONT_X + GAP315_D < 240);
  ok('GAP_X=-315 cells are signed inland of Ocean Drive',
    GAP315_W_CELLS.length === 4 && GAP315_E_CELLS.length === 5
    && GAP315_W_CELLS.every(([, len]) => len >= 8)
    && GAP315_E_CELLS[0][0] === 95 && GAP315_E_CELLS[0][1] === 8);
  ok('GAP_X=-315 soffit and passage are flyable',
    GAP315_SOFFIT >= 3.2 && GAP315_PASS_W >= 2.0 && GAP315_PASS_H >= 2.0);
  ok('gap315 does not draw layout rng, ShaderMaterial, or ped/traffic',
    !/\brng2?\s*\(/.test(gap315) && !/\brng3\s*\(/.test(gap315)
    && !/\brng4\s*\(/.test(gap315) && !gap315.includes('ShaderMaterial')
    && !gap315.includes('ped.js') && !gap315.includes('traffic.js')
    && gap315.includes('installFlyColliders'));

  const gap315List = gap315Shops();
  ok('nine signed GAP_X=-315 shops', gap315List.length === 9);
  for (let i = 0; i < gap315List.length; i++) {
    const g = gap315List[i];
    ok(`${g.id} reserved west of 240`, g.x1 + 1.8 < 240 && inReserved(g.x, g.z));
    ok(`${g.id} misses leftoverLot / street / travel`,
      leftoverLotOverlap(g.x, g.z, g.x1 - g.x0, g.len, 0.15) === false
      && streetOverlap(g.x, g.z, g.x1 - g.x0, g.len) === false
      && g.z0 > TRAVEL_Z1);
    const arcade = FLY_VOIDS.find((v) => v.id === `${g.id}-arcade`);
    const pass = FLY_VOIDS.find((v) => v.id === `${g.id}-pass`);
    ok(`${g.id}-arcade listed`, !!arcade && arcade.openH === GAP315_SOFFIT);
    ok(`${g.id}-pass listed`, !!pass && pass.openW === GAP315_PASS_W);
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
  ok('leftoverLot A–H still signed after GAP_X=-315',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

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
  ok('gap315 walkers fill both sidewalks, miss travel / leftoverLot / x>=240',
    gap315Spots.length >= 32
    && gap315Spots.every((p) => p.x < 240
      && leftoverLotOverlap(p.x, p.z, 0.6, 0.6, 0.15) === false
      && !(p.z > TRAVEL_Z0 && p.z < TRAVEL_Z1)
      && !(p.z > WASH_TRAVEL_Z0 && p.z < WASH_TRAVEL_Z1)
      && p.z > TRAVEL_Z1)
    && gap315Spots.some((p) => Math.abs(p.x - GAP315_WALK_XS[0]) < 0.05)
    && gap315Spots.some((p) => Math.abs(p.x - GAP315_WALK_XS[1]) < 0.05)
    && gap315Spots.some((p) => p.z >= 92 && p.z <= 168)
    && gap315Spots.some((p) => p.z >= 190 && p.z <= 220));
  ok('gap315 NPCs have no colliders and skip keepout so frontage fills',
    !crowd.includes('addCollider') && !crowd.includes('addOBB')
    && crowd.includes("kind: 'gap315'")
    && crowd.includes('const nGap315 = 36')
    && crowd.includes('GAP315_WALK_XS')
    && crowd.includes('GAP315_WALK_Z_RUNS')
    && crowd.includes('npcOffLimits')
    && GAP315_WALK_XS.every((x) => x < 240 && Math.abs(x - GAP315_X) > XS_HALF)
    && GAP315_WALK_XS.every((x) => leftoverLotOverlap(x, 114, 0.6, 0.6, 0.15) === false)
    && GAP315_WALK_Z_RUNS.every((run) => run[0] > TRAVEL_Z1
      && !(run[0] < WASH_TRAVEL_Z1 && run[1] > WASH_TRAVEL_Z0))
    && Math.abs(GAP315_WALK_XS[0] - (GAP315_X - XS_HALF - 1.2)) < 1e-6
    && Math.abs(GAP315_WALK_XS[1] - (GAP315_X + XS_HALF + 1.2)) < 1e-6);

  ok('gap501.js exists', existsSync(gap501Path));
  ok('index builds GAP_X=-501 storefronts after GAP_X=-315',
    index.includes("from './landmarks/gap501.js'")
    && index.includes('buildGap501(ctx)')
    && index.indexOf('buildGap501(ctx)') > index.indexOf('buildGap315(ctx)')
    && index.indexOf('buildGap501(ctx)') < index.indexOf('buildFlythrough(ctx)'));
  ok('GAP_X=-501 is west of x=240',
    GAP501_X === -501 && GAP501_W_FRONT_X < GAP501_X && GAP501_E_FRONT_X > GAP501_X
    && GAP501_E_FRONT_X + GAP501_D < 240);
  ok('GAP_X=-501 cells are signed inland of Ocean Drive',
    GAP501_W_CELLS.length === 4 && GAP501_E_CELLS.length === 5
    && GAP501_W_CELLS.every(([, len]) => len >= 8)
    && GAP501_E_CELLS[0][0] === 95 && GAP501_E_CELLS[0][1] === 8);
  ok('GAP_X=-501 soffit and passage are flyable',
    GAP501_SOFFIT >= 3.2 && GAP501_PASS_W >= 2.0 && GAP501_PASS_H >= 2.0);
  ok('gap501 does not draw layout rng, ShaderMaterial, or ped/traffic',
    !/\brng2?\s*\(/.test(gap501) && !/\brng3\s*\(/.test(gap501)
    && !/\brng4\s*\(/.test(gap501) && !gap501.includes('ShaderMaterial')
    && !gap501.includes('ped.js') && !gap501.includes('traffic.js')
    && gap501.includes('installFlyColliders'));

  const gap501List = gap501Shops();
  ok('nine signed GAP_X=-501 shops', gap501List.length === 9);
  for (let i = 0; i < gap501List.length; i++) {
    const g = gap501List[i];
    ok(`${g.id} reserved west of 240`, g.x1 + 1.8 < 240 && inReserved(g.x, g.z));
    ok(`${g.id} misses leftoverLot / street / travel`,
      leftoverLotOverlap(g.x, g.z, g.x1 - g.x0, g.len, 0.15) === false
      && streetOverlap(g.x, g.z, g.x1 - g.x0, g.len) === false
      && g.z0 > TRAVEL_Z1);
    const arcade = FLY_VOIDS.find((v) => v.id === `${g.id}-arcade`);
    const pass = FLY_VOIDS.find((v) => v.id === `${g.id}-pass`);
    ok(`${g.id}-arcade listed`, !!arcade && arcade.openH === GAP501_SOFFIT);
    ok(`${g.id}-pass listed`, !!pass && pass.openW === GAP501_PASS_W);
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
  ok('leftoverLot A–H still signed after GAP_X=-501',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  const GAP501_WALK_XS = [-508.7, -493.3];
  const GAP501_WALK_Z_RUNS = [[92, 168], [190, 220]];
  const gap501Spots = [];
  for (let i = 0; i < 36; i++) {
    const x = GAP501_WALK_XS[i % GAP501_WALK_XS.length];
    const runI = ((i / GAP501_WALK_XS.length) | 0) % GAP501_WALK_Z_RUNS.length;
    const run = GAP501_WALK_Z_RUNS[runI];
    const z = run[0] + hash01(i + 2700, 3) * (run[1] - run[0]);
    if (x >= 240) continue;
    if (leftoverLotOverlap(x, z, 0.6, 0.6, 0.15)) continue;
    if (z > TRAVEL_Z0 && z < TRAVEL_Z1) continue;
    if (z > WASH_TRAVEL_Z0 && z < WASH_TRAVEL_Z1) continue;
    gap501Spots.push({ x, z });
  }
  ok('gap501 walkers fill both sidewalks, miss travel / leftoverLot / x>=240',
    gap501Spots.length >= 32
    && gap501Spots.every((p) => p.x < 240
      && leftoverLotOverlap(p.x, p.z, 0.6, 0.6, 0.15) === false
      && !(p.z > TRAVEL_Z0 && p.z < TRAVEL_Z1)
      && !(p.z > WASH_TRAVEL_Z0 && p.z < WASH_TRAVEL_Z1)
      && p.z > TRAVEL_Z1)
    && gap501Spots.some((p) => Math.abs(p.x - GAP501_WALK_XS[0]) < 0.05)
    && gap501Spots.some((p) => Math.abs(p.x - GAP501_WALK_XS[1]) < 0.05)
    && gap501Spots.some((p) => p.z >= 92 && p.z <= 168)
    && gap501Spots.some((p) => p.z >= 190 && p.z <= 220));
  ok('gap501 NPCs have no colliders and skip keepout so frontage fills',
    !crowd.includes('addCollider') && !crowd.includes('addOBB')
    && crowd.includes("kind: 'gap501'")
    && crowd.includes('const nGap501 = 36')
    && crowd.includes('GAP501_WALK_XS')
    && crowd.includes('GAP501_WALK_Z_RUNS')
    && crowd.includes('npcOffLimits')
    && GAP501_WALK_XS.every((x) => x < 240 && Math.abs(x - GAP501_X) > XS_HALF)
    && GAP501_WALK_XS.every((x) => leftoverLotOverlap(x, 114, 0.6, 0.6, 0.15) === false)
    && GAP501_WALK_Z_RUNS.every((run) => run[0] > TRAVEL_Z1
      && !(run[0] < WASH_TRAVEL_Z1 && run[1] > WASH_TRAVEL_Z0))
    && Math.abs(GAP501_WALK_XS[0] - (GAP501_X - XS_HALF - 1.2)) < 1e-6
    && Math.abs(GAP501_WALK_XS[1] - (GAP501_X + XS_HALF + 1.2)) < 1e-6);

  ok('GAP_X=429 west face sits east of leftoverLot A — skip shops',
    GAP429_X === 429 && GAP429_X === GAP_X[5]
    && GAP429_W_FRONT_X === GAP429_X - XS_HALF - 2.4
    && GAP429_E_FRONT_X === GAP429_X + XS_HALF + 2.4
    && GAP429_W_FRONT_X > 240 && GAP429_E_FRONT_X > 240
    && GAP429_W_FRONT_X > 251
    && GAP429_W_CELLS.length === 0 && GAP429_E_CELLS.length === 0
    && gap429Shops().length === 0);
  ok('index does not restack leftoverLot with GAP_X=429 shops',
    !index.includes('buildGap429')
    && !existsSync(join(here, 'landmarks/gap429.js'))
    && !/\brng2?\s*\(/.test(constants) && constants.includes('GAP429_W_CELLS'));
  ok('leftoverLot A–H still signed after GAP_X=429 skip',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  ok('marina.js exists', existsSync(marinaPath));
  ok('marina ocean dressing is hash01, leftoverLot unmoved',
    marina.includes('hash01') && marina.includes('buildMarinaOceanDressing')
    && marina.includes('MARINA_OCEAN_PILE_CELLS')
    && marina.includes('leftoverLotOverlap')
    && !marina.includes('ShaderMaterial')
    && !marina.includes('ped.js') && !marina.includes('traffic.js'));
  ok('marina boat rng stream still legacy-ordered',
    marina.includes('const sizeDraw = 0.8 + rng() * 0.5')
    && marina.includes('const isSail = rng() < 0.6'));
  ok('marina fingers and swim basin sit in the water, not leftoverLot A–H',
    MARINA_FINGER_XS.length === 3 && MARINA_FINGER_XS[0] === MARINA_X
    && MARINA_SWIM_Z1 < -30 && MARINA_SWIM_Z0 < MARINA_SWIM_Z1
    && MARINA_DOCK_Z0 < MARINA_DOCK_Z1
    && MARINA_OCEAN_PILE_CELLS.length === 12
    && MARINA_OCEAN_CLEAT_CELLS.length === 12
    && MARINA_OCEAN_PILE_CELLS.every(([x, z]) => z < -30 && z > TRAVEL_Z1 === false
      && leftoverLotOverlap(x, z, 0.5, 0.5, 0.15) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1))
    && MARINA_OCEAN_CLEAT_CELLS.every(([x, z]) => z < -30
      && leftoverLotOverlap(x, z, 0.4, 0.3, 0.15) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)));
  const marinaSwimSpots = [];
  for (let i = 0; i < 24; i++) {
    const x = MARINA_SWIM_X0 + hash01(i + 2000, 3) * (MARINA_SWIM_X1 - MARINA_SWIM_X0);
    const z = MARINA_SWIM_Z0 + hash01(i + 2000, 5) * (MARINA_SWIM_Z1 - MARINA_SWIM_Z0);
    if (z > TRAVEL_Z0 && z < TRAVEL_Z1) continue;
    if (leftoverLotOverlap(x, z, 0.6, 0.6, 0.15)) continue;
    const onDock = z >= MARINA_DOCK_Z0 && z <= MARINA_DOCK_Z1
      && MARINA_FINGER_XS.some((fx) => Math.abs(x - fx) < 2.2);
    if (onDock) continue;
    if (z > -32) continue;
    marinaSwimSpots.push({ x, z });
  }
  ok('marina swimmers fill the fingers, miss leftoverLot / travel / docks',
    marinaSwimSpots.length >= 16
    && marinaSwimSpots.every((p) => leftoverLotOverlap(p.x, p.z, 0.6, 0.6, 0.15) === false
      && !(p.z > TRAVEL_Z0 && p.z < TRAVEL_Z1)
      && p.z < -30
      && !MARINA_FINGER_XS.some((fx) => Math.abs(p.x - fx) < 2.2
        && p.z >= MARINA_DOCK_Z0 && p.z <= MARINA_DOCK_Z1)));
  ok('leftoverLot A–H still signed after marina fill',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  const kenneyPath = join(here, 'kenneyDressing.js');
  const kenney = existsSync(kenneyPath) ? readFileSync(kenneyPath, 'utf8') : '';
  ok('signed beach chairs and umbrellas sit on the sand, skip keepouts',
    BEACH_CHAIR_CELLS.length === 12 && BEACH_UMBRELLA_CELLS.length === 8
    && BEACH_CHAIR_CELLS.every(([x, z]) => x < 240 && z < TRAVEL_Z0 && z > 4
      && leftoverLotOverlap(x, z, 0.64, 0.63, 0.15) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)
      && inKeepout(x, z, 0.6) === false)
    && BEACH_UMBRELLA_CELLS.every(([x, z]) => x < 240 && z < TRAVEL_Z0 && z > 4
      && leftoverLotOverlap(x, z, 1.8, 1.8, 0.15) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)
      && inKeepout(x, z, 0.6) === false)
    && kenney.includes('BEACH_CHAIR_CELLS') && kenney.includes('BEACH_UMBRELLA_CELLS')
    && kenney.includes("'beach-chairs-signed'") && kenney.includes("'beach-umbrellas-signed'")
    && kenney.includes('inKeepout(x, z, 0.6)') && kenney.includes('leftoverLotOverlap')
    && kenney.includes('hash01(i, 2401)') && kenney.includes('z = 5.2 + hash01(i, 103) * 11')
    && !/\brng2?\s*\(/.test(kenney) && !/\brng3\s*\(/.test(kenney)
    && !/\brng4\s*\(/.test(kenney)
    && !kenney.includes('ShaderMaterial')
    && !kenney.includes('ped.js') && !kenney.includes('traffic.js'));
  ok('leftoverLot A–H still signed after beach chairs',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  ok('signed boardwalk benches and lamps sit on the deck, skip keepouts',
    BOARDWALK_BENCH_CELLS.length === 6 && BOARDWALK_LAMP_CELLS.length === 6
    && BOARDWALK_BENCH_CELLS.every(([x, z]) => x < 240 && z < TRAVEL_Z0
      && Math.abs(z - BOARDWALK_Z) < BOARDWALK_TOP
      && leftoverLotOverlap(x, z, 1.8, 0.7, 0.15) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)
      && inKeepout(x, z, 0.6) === false
      && GAP_X.every((gx) => Math.abs(x - gx) > XS_HALF + 0.55))
    && BOARDWALK_LAMP_CELLS.every(([x, z]) => x < 240 && z < TRAVEL_Z0
      && leftoverLotOverlap(x, z, 0.4, 0.4, 0.15) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)
      && inKeepout(x, z, 0.6) === false)
    && kenney.includes('BOARDWALK_BENCH_CELLS') && kenney.includes('BOARDWALK_LAMP_CELLS')
    && kenney.includes("'boardwalk-benches-signed'") && kenney.includes("'boardwalk-lamps-signed'")
    && kenney.includes('hash01(i, 2501)') && kenney.includes('hash01(i, 2511)')
    && !/\brng2?\s*\(/.test(kenney) && !kenney.includes('ShaderMaterial'));
  ok('crowd adds boardwalk skaters, no colliders',
    crowd.includes('const nBoardwalkSkate = 16')
    && crowd.includes('hash01(i + 2600')
    && !crowd.includes('addCollider') && !crowd.includes('addOBB'));
  ok('leftoverLot A–H still signed after boardwalk fill',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  ok('signed ped-signals and flex posts sit at CROSS_X, miss travel 40.2–47.8',
    CROSS_X.length === 2 && CROSS_X[0] === -129 && CROSS_X[1] === 57
    && PED_SIGNAL_CELLS.length === 8 && FLEX_POST_CELLS.length === 8
    && PED_SIGNAL_CELLS.every(([x, z]) => x < 240
      && leftoverLotOverlap(x, z, 0.4, 0.4, 0.15) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)
      && inKeepout(x, z, 0.6) === false
      && CROSS_X.some((cx) => Math.abs(x - cx) > XS_HALF && Math.abs(x - cx) < 12))
    && FLEX_POST_CELLS.every(([x, z]) => x < 240
      && leftoverLotOverlap(x, z, 0.3, 0.3, 0.15) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)
      && inKeepout(x, z, 0.6) === false
      && CROSS_X.some((cx) => Math.abs(x - cx) > XS_HALF && Math.abs(x - cx) < 12))
    && kenney.includes('PED_SIGNAL_CELLS') && kenney.includes('FLEX_POST_CELLS')
    && kenney.includes("'crosswalk-ped-signals'") && kenney.includes("'crosswalk-flex-posts'")
    && kenney.includes('hash01(i, 2601)') && kenney.includes('hash01(i, 2611)')
    && kenney.includes("'traffic_light_horizontal'")
    && !/\brng2?\s*\(/.test(kenney) && !kenney.includes('ShaderMaterial')
    && !kenney.includes('ped.js') && !kenney.includes('traffic.js'));
  ok('leftoverLot A–H still signed after crosswalk props',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  ok('crowd walks the signed beach chair rows',
    crowd.includes("kind: 'chair-walk'") && crowd.includes('const nChairWalk = 24')
    && crowd.includes("kind: 'towel-sit'") && crowd.includes('BEACH_CHAIR_CELLS')
    && crowd.includes('BEACH_CHAIR_WALK_RUNS')
    && crowd.includes('const nTowelSit = BEACH_CHAIR_CELLS.length')
    && crowd.includes('npcOffLimits')
    && !crowd.includes('addCollider')
    && !/\brng2?\s*\(/.test(crowd) && !/\brng3\s*\(/.test(crowd)
    && !/\brng4\s*\(/.test(crowd) && crowd.includes('hash01'));
  ok('chair-walk runs sit on the sand, miss leftoverLot / travel / x>=240',
    BEACH_CHAIR_WALK_RUNS.length === 6
    && BEACH_CHAIR_WALK_RUNS.length === BEACH_CHAIR_CELLS.length / 2
    && BEACH_CHAIR_WALK_RUNS.every(([x0, x1]) => x1 < 240 && x0 < x1
      && leftoverLotOverlap((x0 + x1) / 2, 7.2, 0.6, 0.6, 0.15) === false)
    && BEACH_CHAIR_CELLS.every(([x, z], i) => {
      const run = BEACH_CHAIR_WALK_RUNS[(i / 2) | 0];
      return x >= run[0] && x <= run[1] && z < TRAVEL_Z0 && z > 4
        && !(z > TRAVEL_Z0 && z < TRAVEL_Z1);
    }));

  const chairWalkSpots = [];
  for (let i = 0; i < 24; i++) {
    const run = BEACH_CHAIR_WALK_RUNS[i % BEACH_CHAIR_WALK_RUNS.length];
    const x = run[0] + hash01(i + 2500, 3) * (run[1] - run[0]);
    const z = 7.2 + (hash01(i + 2500, 5) - 0.5) * 4.0;
    if (x >= 240) continue;
    if (leftoverLotOverlap(x, z, 0.6, 0.6, 0.15)) continue;
    if (z > TRAVEL_Z0 && z < TRAVEL_Z1) continue;
    if (inKeepout(x, z)) continue;
    if (z < -28.5) continue;
    if (x >= VBALL_X0 && x <= VBALL_X1 && z >= VBALL_Z0 && z <= VBALL_Z1) continue;
    chairWalkSpots.push({ x, z });
  }
  const towelSitSpots = [];
  for (let i = 0; i < BEACH_CHAIR_CELLS.length; i++) {
    const [cx, cz] = BEACH_CHAIR_CELLS[i];
    const side = hash01(i + 2511, 3) < 0.5 ? -1 : 1;
    const x = cx + side * 0.85;
    const z = cz - 1.55;
    if (x >= 240) continue;
    if (leftoverLotOverlap(x, z, 0.6, 0.6, 0.15)) continue;
    if (z > TRAVEL_Z0 && z < TRAVEL_Z1) continue;
    if (inKeepout(x, z)) continue;
    if (z < -28.5) continue;
    if (x >= VBALL_X0 && x <= VBALL_X1 && z >= VBALL_Z0 && z <= VBALL_Z1) continue;
    towelSitSpots.push({ x, z, cx, cz });
  }
  ok('chair-row walkers fill the sand, miss leftoverLot / travel / x>=240',
    chairWalkSpots.length >= 20
    && chairWalkSpots.every((p) => p.x < 240 && p.x < 251
      && leftoverLotOverlap(p.x, p.z, 0.6, 0.6, 0.15) === false
      && !(p.z > TRAVEL_Z0 && p.z < TRAVEL_Z1)
      && p.z < TRAVEL_Z0 && p.z > 4
      && inKeepout(p.x, p.z) === false)
    && chairWalkSpots.some((p) => p.x < -500)
    && chairWalkSpots.some((p) => p.x > 18));
  ok('towel sitters sit ocean of the chair rows, miss leftoverLot / travel',
    towelSitSpots.length >= 10
    && towelSitSpots.every((p) => p.x < 240
      && leftoverLotOverlap(p.x, p.z, 0.6, 0.6, 0.15) === false
      && !(p.z > TRAVEL_Z0 && p.z < TRAVEL_Z1)
      && p.z < TRAVEL_Z0 && p.z > 4
      && Math.abs(p.x - p.cx) < 1.0 && p.z < p.cz
      && inKeepout(p.x, p.z) === false));
  ok('chair-row NPCs have no colliders and leftoverLot A–H unmoved',
    !crowd.includes('addCollider') && !crowd.includes('addOBB')
    && crowd.includes("kind: 'chair-walk'") && crowd.includes("kind: 'towel-sit'")
    && crowd.includes('npcOffLimits')
    && LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
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
