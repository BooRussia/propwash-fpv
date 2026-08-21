// Headless source lock for the Miami pocket-park grass_lawn grade plate.
// Production change for #83 is pocketPark.js only. leftoverGrass.js is
// a separate leftover-city cell (lawn plate signed next).
//
//   node ./tools/run-miami-pocket-park-lawn-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  POCKET_PARK_X, POCKET_PARK_Z,
  POCKET_PARK_E_X, POCKET_PARK_E_Z,
  POCKET_PARK_F_X, POCKET_PARK_F_Z,
  POCKET_PARK_G_X, POCKET_PARK_G_Z,
  POCKET_PARK_H_X, POCKET_PARK_H_Z,
  POCKET_PARK_LAWN_H,
  POCKET_PARK_INSTANCES_MIN, POCKET_PARK_INSTANCES_MAX,
  POCKET_PARK_E_INSTANCES_MIN, POCKET_PARK_E_INSTANCES_MAX,
  POCKET_PARK_F_INSTANCES_MIN, POCKET_PARK_F_INSTANCES_MAX,
  POCKET_PARK_G_INSTANCES_MIN, POCKET_PARK_G_INSTANCES_MAX,
  POCKET_PARK_H_INSTANCES_MIN, POCKET_PARK_H_INSTANCES_MAX,
  POCKET_PARK_HULL_COLLIDER, POCKET_PARK_AABB,
  pocketParkHull, pocketParkDrop, pocketParkPlannedCount,
  pocketParkRejected, onPavement, groundHeight, inGardenPath,
} from './constants.js';
import { tessellateHull, tryPlace } from './planting.js';

const here = dirname(fileURLToPath(import.meta.url));

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

function hash01(a, b) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

const CARD_BAND = 1.2;
const CARD_KEEP = 0.055;
const CARD_MAX = 1800;

function acceptedHulls() {
  const hulls = [];
  if (!pocketParkRejected() && !onPavement(POCKET_PARK_X, POCKET_PARK_Z)) {
    hulls.push(pocketParkHull());
  }
  if (!pocketParkRejected(POCKET_PARK_E_X, POCKET_PARK_E_Z)
    && !onPavement(POCKET_PARK_E_X, POCKET_PARK_E_Z)) {
    hulls.push(pocketParkHull(POCKET_PARK_E_X, POCKET_PARK_E_Z));
  }
  if (!pocketParkRejected(POCKET_PARK_F_X, POCKET_PARK_F_Z)
    && !onPavement(POCKET_PARK_F_X, POCKET_PARK_F_Z)) {
    hulls.push(pocketParkHull(POCKET_PARK_F_X, POCKET_PARK_F_Z));
  }
  if (!pocketParkRejected(POCKET_PARK_G_X, POCKET_PARK_G_Z)
    && !onPavement(POCKET_PARK_G_X, POCKET_PARK_G_Z)) {
    hulls.push(pocketParkHull(POCKET_PARK_G_X, POCKET_PARK_G_Z));
  }
  if (!pocketParkRejected(POCKET_PARK_H_X, POCKET_PARK_H_Z)
    && !onPavement(POCKET_PARK_H_X, POCKET_PARK_H_Z)) {
    hulls.push(pocketParkHull(POCKET_PARK_H_X, POCKET_PARK_H_Z));
  }
  return hulls;
}

function collectCards(ctx, hulls) {
  const placed = [];
  for (let n = 0; n < hulls.length; n++) {
    const hull = hulls[n];
    const cells = tessellateHull(hull, pocketParkPlannedCount(hull.x, hull.z));
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (pocketParkDrop(c.x, c.z)) {
        tryPlace(ctx, c.x, c.z);
        continue;
      }
      if (onPavement(c.x, c.z)) {
        tryPlace(ctx, c.x, c.z);
        continue;
      }
      const y = groundHeight(c.x, c.z);
      if (!y) continue;
      if (!inGardenPath(c.x, c.z, CARD_BAND)) continue;
      const u = hash01(i + 11 + n * 97, (hull.seed || 1) * 19);
      if (u > CARD_KEEP) continue;
      placed.push(c);
    }
  }
  if (placed.length <= CARD_MAX) return placed;
  const keep = [];
  const step = placed.length / CARD_MAX;
  for (let i = 0; i < CARD_MAX; i++) keep.push(placed[Math.floor(i * step)]);
  return keep;
}

export function runMiamiPocketParkLawnTests() {
  fails.length = 0;
  passedCount = 0;

  const park = readFileSync(join(here, 'landmarks/pocketPark.js'), 'utf8');
  const grass = readFileSync(join(here, 'landmarks/leftoverGrass.js'), 'utf8');
  const blades = readFileSync(join(here, 'blades.js'), 'utf8');
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const constants = readFileSync(join(here, 'constants.js'), 'utf8');

  ok('production file is pocketPark.js',
    existsSync(join(here, 'landmarks/pocketPark.js')));
  ok('did not invent leftoverGrass.js / leftoverLot I / *HGeom',
    existsSync(join(here, 'landmarks/leftoverGrass.js'))
    && !existsSync(join(here, 'landmarks/leftoverLotI.js'))
    && !existsSync(join(here, 'landmarks/pocketParkH.js'))
    && !/function pocketParkHGeom/.test(park)
    && !/pocketParkEGeom\(/.test(park)
    && !park.includes('leftoverLot I')
    && !park.includes('415/84')
    && !park.includes('PARK_WALK_HH'));

  ok('folds existing grass_lawn via assetLib',
    park.includes("from '../../../core/assets.js'")
    && park.includes('assetLib')
    && park.includes("textureSet('grass_lawn')")
    && park.includes("pbrMaterial('grass_lawn', { repeat: [7, 4.5] })")
    && park.includes('0x4c7a3d')
    && !park.includes('grass_wild')
    && !park.includes('sparse_grass'));
  ok('grade plate uses pocketParkHull bounds and POCKET_PARK_LAWN_H 0.05',
    park.includes('POCKET_PARK_LAWN_H')
    && POCKET_PARK_LAWN_H === 0.05
    && park.includes('BoxGeometry(hull.w, POCKET_PARK_LAWN_H, hull.d)')
    && park.includes('hull.y0 + POCKET_PARK_LAWN_H * 0.5')
    && park.includes('pocketPark-lawn'));
  ok('cone bladeGeo field is gone',
    !park.includes('function bladeGeo')
    && !park.includes('bladeGeo()')
    && !park.includes('pocketPark-blades')
    && park.includes('function cardGeo')
    && park.includes('InstancedMesh')
    && park.includes('pocketPark-cards'));
  ok('MeshStandardMaterial stays (no custom mat)',
    park.includes('MeshStandardMaterial')
    && !/\bShaderMaterial\b/.test(park)
    && !/\bonBeforeCompile\b/.test(park));

  const ctx = { blocked: () => false };
  const hulls = acceptedHulls();
  ok('accepted hulls are A/E/F/G/H',
    hulls.length === 5
    && hulls[0].x === 276 && hulls[0].z === 92
    && hulls[1].x === 347 && hulls[1].z === 96
    && hulls[2].x === 364 && hulls[2].z === 96
    && hulls[3].x === 381 && hulls[3].z === 96
    && hulls[4].x === 398 && hulls[4].z === 96);
  ok('each plate matches signed hull bounds',
    hulls.every((h) => h.w === 16 && h.d === 8
      && h.collider === POCKET_PARK_HULL_COLLIDER
      && h.y0 !== undefined));
  ok('G-park x1=389 does not merge with H 398/96',
    hulls[3].x1 === 389 && hulls[4].x0 === 390
    && hulls[3].x1 < hulls[4].x0);

  const cards = collectCards(ctx, hulls);
  ok('sparse cards stay under 2000 total',
    cards.length > 0 && cards.length < 2000 && cards.length <= CARD_MAX,
    `cards=${cards.length}`);
  ok('cards stay on leftover-city grade and off walks',
    cards.every((c) => !pocketParkDrop(c.x, c.z)
      && !onPavement(c.x, c.z)
      && inGardenPath(c.x, c.z, CARD_BAND)
      && groundHeight(c.x, c.z)));
  ok('same tryPlace / pocketParkDrop reject-or-drop',
    park.includes('pocketParkDrop')
    && park.includes('tryPlace')
    && park.includes('tessellateHull')
    && park.includes('onPavement')
    && park.includes('never nudge')
    && !/export function tryPlace/.test(park));

  ok('leftover 8–11k ceiling was not rewritten',
    POCKET_PARK_INSTANCES_MIN === 8000 && POCKET_PARK_INSTANCES_MAX === 11000
    && POCKET_PARK_E_INSTANCES_MIN === 8000 && POCKET_PARK_E_INSTANCES_MAX === 11000
    && POCKET_PARK_F_INSTANCES_MIN === 8000 && POCKET_PARK_F_INSTANCES_MAX === 11000
    && POCKET_PARK_G_INSTANCES_MIN === 8000 && POCKET_PARK_G_INSTANCES_MAX === 11000
    && POCKET_PARK_H_INSTANCES_MIN === 8000 && POCKET_PARK_H_INSTANCES_MAX === 11000
    && !park.includes('POCKET_PARK_INSTANCES_MIN =')
    && park.includes('10–13k'));
  ok('no filled grass AABB / per-blade collider',
    POCKET_PARK_AABB === false
    && park.includes('installPocketParkColliders')
    && park.includes('Never a filled grass AABB')
    && !park.includes('part: \'blade\''));
  ok('leftoverGrass.js is not a pocketPark fork',
    grass.includes('Tiny Glade') && grass.includes('grow-to-gap')
    && grass.includes('leftover-city') && grass.includes('267')
    && !grass.includes('pocketPark') && !grass.includes('POCKET_PARK_'));
  ok('planting.js / blades.js were not restacked',
    planting.includes('export function tryPlace')
    && planting.includes('export function tessellateHull')
    && !planting.includes('pocketPark')
    && blades.includes('placeBladePlan')
    && !blades.includes('pocketPark'));
  ok('kit comments still name the five hulls',
    park.includes('347/96') && park.includes('364/96')
    && park.includes('381/96') && park.includes('398/96')
    && park.includes('pocketParkEGeom fork')
    && park.includes('pocketParkFGeom fork')
    && park.includes('pocketParkGGeom fork')
    && park.includes('pocketParkHGeom fork')
    && park.includes('G-park x1=389')
    && park.includes('leftoverLot A–H')
    && constants.includes('never pocketParkHGeom'));

  if (fails.length) {
    console.error('[miami-pocketPark-lawn] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-pocketPark-lawn] ok', passedCount, 'checks',
      `cards=${cards.length} hulls=${hulls.length}`);
  }
  return {
    passed: fails.length === 0,
    fails,
    passedCount,
    cards: cards.length,
    hulls: hulls.length,
  };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('pocketParkLawnTest.js');
if (isMain) {
  const r = runMiamiPocketParkLawnTests();
  if (!r.passed) process.exit(1);
}
