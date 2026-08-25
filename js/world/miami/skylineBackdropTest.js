// Headless checks for the Miami cheap far-LOD skyline backdrop.
// Source lock only — no three.js, no game state.
//
//   node ./tools/run-miami-skyline-backdrop-test.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

function sliceBackdrop(src) {
  const start = src.indexOf('// backdrop city (cheap, far)');
  const end = src.indexOf('return {', start);
  if (start < 0 || end < 0 || end <= start) return '';
  return src.slice(start, end);
}

export function runMiamiSkylineBackdropTests() {
  fails.length = 0;
  passedCount = 0;

  const buildings = readFileSync(join(here, 'buildings.js'), 'utf8');
  const block = sliceBackdrop(buildings);
  const near = buildings.slice(0, buildings.indexOf('// backdrop city (cheap, far)'));

  ok('backdrop block is present', block.length > 80);
  ok('exactly 60 cheap boxes', block.includes('for (let i = 0; i < 60; i++)'));
  ok('one 60-box loop', (block.match(/for \(let i = 0; i < 60; i\+\+\)/g) || []).length === 1);
  ok('same BoxGeometry', block.includes('new THREE.BoxGeometry(w, h, d)'));
  ok('same x/w/h/d rng formula',
    block.includes('30 + rng() * 50')
    && block.includes('40 + rng() * 160')
    && block.includes('30 + rng() * 40')
    && block.includes('-800 + rng() * 1600'));
  ok('world z stays 300–620', block.includes('300 + rng() * 320'));
  ok('no leftoverLot I / new city length',
    !block.includes('leftoverLot') && !/415/.test(block) && !/i\s*<\s*(?!60)\d+/.test(block));

  ok('facadeUV per box',
    block.includes('facadeUV(g, w, h, d, TU, TV')
    || /facadeUV\(\s*g,\s*w,\s*h,\s*d/.test(block));
  ok('uses existing glass/office tile constants',
    (block.includes('GLASS_TILE_U') || block.includes('OFFICE_TILE_U'))
    && (block.includes('GLASS_TILE_V') || block.includes('OFFICE_TILE_V')));
  ok('per-box hash UV offset',
    block.includes('hash01')
    && !/facadeUV\([^)]*rng\(\)/.test(block));
  ok('stripBoxCaps per box', block.includes('stripBoxCaps(g)'));
  ok('backdrop lids use existing roof mat, not the wall atlas',
    block.includes('roofSlabGeo') && block.includes('metalRoofMat')
    && !/new THREE\.MeshStandardMaterial/.test(block));
  ok('existing facade mats, no flat slab color',
    (block.includes('glassMat') || block.includes('officeMat'))
    && !block.includes('0x3d4653')
    && !block.includes('0x2a3444')
    && !/new THREE\.MeshStandardMaterial/.test(block));
  ok('no second building engine',
    !block.includes('fenestra')
    && !block.includes('onBeforeCompile')
    && !block.includes('ShaderMaterial')
    && !block.includes('InstancedMesh')
    && (block.match(/new THREE\.BoxGeometry/g) || []).length === 1);

  ok('near towers stay',
    near.includes('function addTower')
    && near.includes('{ z: 78, hMin: 35, hMax: 90 }')
    && near.includes('{ z: 125, hMin: 55, hMax: 140 }')
    && near.includes('{ z: 185, hMin: 80, hMax: 185 }')
    && near.includes("style === 'deco'")
    && near.includes('glassMat')
    && near.includes('officeMat'));
  ok('helipad E stay put',
    buildings.includes('[[430, 70], [-430, 100]]')
    && buildings.includes('tryPlace(ctx, hx, hz)')
    && buildings.includes('streetOverlap(hx, hz, 16, 16)'));
  ok('file does not import fenestra', !buildings.includes('fenestra'));
  ok('no leftoverLot I invented here',
    !buildings.includes('LEFTOVER_LOT_I') && !buildings.includes('415/84'));

  if (fails.length) {
    console.error('[miami-skyline-backdrop] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-skyline-backdrop] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('skylineBackdropTest.js');
if (isMain) {
  const r = runMiamiSkylineBackdropTests();
  if (!r.passed) process.exit(1);
}
