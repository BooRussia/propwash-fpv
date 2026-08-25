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
  ok('far row sits behind the 60-box LOD (z>=640)',
    kenney.includes('640 + hash01'));
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
    'dumpster', 'street_light', 'planter', 'stop_sign',
    'kenney_skyscraper_a', 'kenney_skyscraper_c', 'kenney_midrise_e',
  ];
  for (const slug of glbs) {
    ok(`${slug}.glb on disk`,
      existsSync(join(root, 'assets/models', slug, `${slug}.glb`)));
    ok(`${slug} colormap sits beside the glb`,
      existsSync(join(root, 'assets/models', slug, 'Textures/colormap.png')));
  }

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
