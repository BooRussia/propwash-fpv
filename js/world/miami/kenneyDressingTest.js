// Headless source locks for Kenney dressing + cylinder roof caps.
//
//   node ./tools/run-miami-kenney-dressing-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

export function runMiamiKenneyDressingTests() {
  fails.length = 0;
  passedCount = 0;

  const kenney = readFileSync(join(here, 'kenneyDressing.js'), 'utf8');
  const buildings = readFileSync(join(here, 'buildings.js'), 'utf8');
  const geo = readFileSync(join(here, 'geo.js'), 'utf8');
  const assets = readFileSync(join(root, 'js/core/assets.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');

  ok('hash-driven, no rng/rng2/rng3/rng4 draws',
    !/\brng2?\(/.test(kenney) && !/\brng3\(/.test(kenney) && !/\brng4\(/.test(kenney));
  ok('uses scatterModels for GLBs', kenney.includes('scatterModels'));
  ok('dumpster / street_light / planter / stop_sign / far skyline',
    kenney.includes("'dumpster'") && kenney.includes("'street_light'")
    && kenney.includes("'planter'") && kenney.includes("'stop_sign'")
    && kenney.includes('kenney_skyscraper_a'));
  ok('beach chairs / shells / Kenney parasols instanced',
    kenney.includes("'plastic_monobloc_chair_01'")
    && kenney.includes("'lambis_shell'")
    && kenney.includes("'parasol_a'"));
  ok('street cones + potted plants + cactus instanced',
    kenney.includes("'traffic_cone'")
    && kenney.includes("'potted_plant_02'")
    && kenney.includes("'potted_plant_04'")
    && kenney.includes("'kenney_cactus'")
    && kenney.includes("'shrub_04'"));
  ok('traffic_light / kenney_palm / kenney_house_a / awning instanced',
    kenney.includes("'traffic_light'")
    && kenney.includes("'kenney_palm'")
    && kenney.includes("'kenney_house_a'")
    && kenney.includes("'awning'"));
  ok('approved stairs-entry extras hash-scattered',
    kenney.includes("'awning_wide'")
    && kenney.includes("'overhang'")
    && kenney.includes('buildStairHandrailGeo')
    && kenney.includes('hash01(i, 1103)')
    && !/\brng2?\(/.test(kenney));
  ok('2D plan owns corridor ramps/bollards/mailboxes',
    !kenney.includes('catalog-curb-ramps')
    && !kenney.includes('catalog-mailbox')
    && !kenney.includes('catalog-bollard-steel')
    && !kenney.includes('catalog-ped-signal'));
  ok('approved beach-boardwalk extras hash-scattered',
    kenney.includes("'parasol_b'")
    && kenney.includes("'wooden_picnic_table'")
    && kenney.includes("'CoffeeCart_01'")
    && kenney.includes('buildLifeRingGeo')
    && kenney.includes('hash01(i, 1601)')
    && !/\brng2?\(/.test(kenney));
  ok('approved sidewalk-furniture extras hash-scattered',
    kenney.includes('buildPayphoneKioskGeo')
    && kenney.includes('buildPaperStackGeo')
    && !/\brng2?\(/.test(kenney));
  ok('approved utilities-power extras hash-scattered',
    kenney.includes('buildUtilityPoleWoodGeo')
    && kenney.includes('buildPowerSpanGeo'));
  ok('plan owns gutter manholes; no hashed travel-lane covers',
    !kenney.includes('catalog-manholes')
    && !kenney.includes('buildManholeCoverGeo')
    && !kenney.includes('z = 44 +'));
  ok('approved alley-lot-marina extras hash-scattered',
    kenney.includes("'wooden_crate_02'")
    && kenney.includes("'Barrel_01'")
    && kenney.includes('buildDockCleatGeo')
    && kenney.includes('buildDockPileGeo')
    && kenney.includes('buildPalletWoodGeo')
    && kenney.includes('buildCardboardStackGeo')
    && kenney.includes('hash01(i, 1403)')
    && !/\brng2?\(/.test(kenney));
  ok('beach chairs sit ocean of the boardwalk kiss',
    kenney.includes('z = 5.2 + hash01(i, 103) * 11'));
  ok('signed extra beach chairs / umbrellas skip keepouts, hash01 only',
    kenney.includes('BEACH_CHAIR_CELLS') && kenney.includes('BEACH_UMBRELLA_CELLS')
    && kenney.includes("'beach-chairs-signed'") && kenney.includes("'beach-umbrellas-signed'")
    && kenney.includes('inKeepout(x, z, 0.6)') && kenney.includes('leftoverLotOverlap')
    && kenney.includes('hash01(i, 2401)') && kenney.includes('hash01(i, 2411)')
    && kenney.includes('z = 5.2 + hash01(i, 103) * 11')
    && !/\brng2?\(/.test(kenney) && !/\brng3\(/.test(kenney) && !/\brng4\(/.test(kenney));
  ok('signed boardwalk benches / lamps skip keepouts, hash01 only',
    kenney.includes('BOARDWALK_BENCH_CELLS') && kenney.includes('BOARDWALK_LAMP_CELLS')
    && kenney.includes("'boardwalk-benches-signed'") && kenney.includes("'boardwalk-lamps-signed'")
    && kenney.includes('hash01(i, 2501)') && kenney.includes('hash01(i, 2511)')
    && kenney.includes('inKeepout(x, z, 0.6)') && kenney.includes('leftoverLotOverlap')
    && !/\brng2?\(/.test(kenney) && !/\brng3\(/.test(kenney) && !/\brng4\(/.test(kenney));
  ok('signed CROSS_X ped-signals / flex posts skip travel and keepouts, hash01 only',
    kenney.includes('PED_SIGNAL_CELLS') && kenney.includes('FLEX_POST_CELLS')
    && kenney.includes("'crosswalk-ped-signals'") && kenney.includes("'crosswalk-flex-posts'")
    && kenney.includes('buildPedSignalGeo') && kenney.includes('buildBollardFlexGeo')
    && !kenney.includes("'traffic_light_horizontal'")
    && kenney.includes('hash01(i, 2601)') && kenney.includes('hash01(i, 2611)')
    && kenney.includes('z > 40.2 && z < 47.8')
    && kenney.includes('addOBB(x, y, z, 0.35, 0.7, 0.2')
    && kenney.includes('addCyl(x, y, z, 0.08, 0.85)')
    && !/\brng2?\(/.test(kenney) && !/\brng3\(/.test(kenney) && !/\brng4\(/.test(kenney));
  ok('signed hotel-crown flags sit on authored roofs, hash01 only',
    kenney.includes('HOTEL_FLAG_CELLS') && kenney.includes("'hotel-crown-flags'")
    && kenney.includes('buildHotelCrownFlagGeo') && kenney.includes('hash01(i, 3401)')
    && kenney.includes('leftoverLotOverlap')
    && kenney.includes('z > 40.2 && z < 47.8')
    && !/\brng2?\(/.test(kenney) && !/\brng3\(/.test(kenney) && !/\brng4\(/.test(kenney));
  ok('signed pier-deck dressing is hash01, leftoverLot unmoved',
    kenney.includes('PIER_CLEAT_CELLS') && kenney.includes('PIER_BENCH_CELLS')
    && kenney.includes('PIER_RING_CELLS')
    && kenney.includes("'pier-cleats-signed'") && kenney.includes("'pier-benches-signed'")
    && kenney.includes("'pier-rings-signed'")
    && kenney.includes('buildDockCleatGeo') && kenney.includes('buildLifeRingGeo')
    && kenney.includes('hash01(i, 2711)')
    && !/\brng2?\(/.test(kenney) && !/\brng3\(/.test(kenney) && !/\brng4\(/.test(kenney));
  ok('far row sits behind the 60-box LOD (z>=640)',
    kenney.includes('640 + hash01')
    && kenney.includes('kenney_skyscraper_b')
    && kenney.includes('kenney_midrise_a')
    && kenney.includes('kenney_midrise_c'));
  ok('kenney trees + covered cars are hash-scattered',
    kenney.includes("'kenney_tree_large'")
    && kenney.includes("'covered_car'"));
  ok('houses sit behind the box LOD (z 720–820)',
    kenney.includes('720 + hash01') && kenney.includes("'kenney_house_a'"));
  ok('beach-side stop signs at GAP_X',
    kenney.includes('GAP_X[i] - 3.4') && kenney.includes('z: 37.6'));
  ok('traffic lights sit on GAP_X corners (±7 m)',
    kenney.includes('GAP_X[i] + c.dx') && kenney.includes('dx: 7'));
  ok('index calls buildKenneyDressing after colliders',
    index.includes('buildKenneyDressing')
    && index.indexOf('buildKenneyDressing') > index.indexOf('buildDressing'));

  ok('stripCylinderCaps exists', geo.includes('export function stripCylinderCaps'));
  ok('glass cylinders strip cap disks',
    buildings.includes('stripCylinderCaps(geo)'));
  ok('cylinder still gets a metal roof lid',
    buildings.includes('metalRoofMat'));
  ok('loader tries .glb then .gltf',
    assets.includes("${slug}.glb") && assets.includes("${slug}.gltf"));

  const glbs = [
    'dumpster', 'street_light', 'planter', 'stop_sign', 'traffic_cone', 'parasol_a',
    'kenney_skyscraper_a', 'kenney_skyscraper_c', 'kenney_midrise_e', 'kenney_cactus',
  ];
  for (const slug of glbs) {
    ok(`${slug}.glb on disk`,
      existsSync(join(root, 'assets/models', slug, `${slug}.glb`)));
    if (slug !== 'kenney_cactus') {
      ok(`${slug} colormap sits beside the glb`,
        existsSync(join(root, 'assets/models', slug, 'Textures/colormap.png')));
    }
  }
  const gltfs = [
    'potted_plant_02', 'potted_plant_04', 'plastic_monobloc_chair_01',
    'shrub_04', 'lambis_shell',
  ];
  for (const slug of gltfs) {
    ok(`${slug}.gltf on disk`,
      existsSync(join(root, 'assets/models', slug, `${slug}.gltf`)));
  }
  ok('MODEL_KEYS lists Poly Haven extras',
    assets.includes("'potted_plant_02'")
    && assets.includes("'plastic_monobloc_chair_01'")
    && assets.includes("'lambis_shell'")
    && assets.includes("'kenney_cactus'"));

  if (fails.length) {
    console.error('[miami-kenney-dressing] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-kenney-dressing] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('kenneyDressingTest.js');
if (isMain) {
  const r = runMiamiKenneyDressingTests();
  if (!r.passed) process.exit(1);
}
