// Headless source lock for the Miami leftover-grass grass_lawn grade plate.
// Production change is leftoverGrass.js only. pocketPark.js stays.
//
//   node ./tools/run-miami-leftover-grass-lawn-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEFTOVER_GRASS_X0, LEFTOVER_GRASS_X1, LEFTOVER_GRASS_Z0, LEFTOVER_GRASS_Z1,
  LEFTOVER_GRASS_X, LEFTOVER_GRASS_Z, LEFTOVER_GRASS_W, LEFTOVER_GRASS_D,
  LEFTOVER_GRASS_LAWN_H,
  LEFTOVER_GRASS_INSTANCES_MIN, LEFTOVER_GRASS_INSTANCES_MAX,
  LEFTOVER_GRASS_HULL_COLLIDER, LEFTOVER_GRASS_AABB,
  GARDEN_PATH_X0, GARDEN_PATH_X1, GARDEN_PATH_Z, GARDEN_PATH_W,
  leftoverGrassHull, leftoverGrassDrop, leftoverGrassPlannedCount,
  leftoverGrassRejected, leftoverGrassColliderShapes, inLeftoverGrass,
  onPavement, groundHeight, inGardenPath, inGardenPathSlab, inGardenBench,
  inLeftoverLotReserved,
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

function collectCards(ctx) {
  const hull = leftoverGrassHull();
  const cells = tessellateHull(hull, leftoverGrassPlannedCount());
  const placed = [];
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    if (leftoverGrassDrop(c.x, c.z)) {
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
    const u = hash01(i + 11, (hull.seed || 1) * 19);
    if (u > CARD_KEEP) continue;
    placed.push(c);
  }
  if (placed.length <= CARD_MAX) return placed;
  const keep = [];
  const step = placed.length / CARD_MAX;
  for (let i = 0; i < CARD_MAX; i++) keep.push(placed[Math.floor(i * step)]);
  return keep;
}

export function runMiamiLeftoverGrassLawnTests() {
  fails.length = 0;
  passedCount = 0;

  const grass = readFileSync(join(here, 'landmarks/leftoverGrass.js'), 'utf8');
  const park = readFileSync(join(here, 'landmarks/pocketPark.js'), 'utf8');
  const blades = readFileSync(join(here, 'blades.js'), 'utf8');
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const constants = readFileSync(join(here, 'constants.js'), 'utf8');

  ok('production file is leftoverGrass.js',
    existsSync(join(here, 'landmarks/leftoverGrass.js')));
  ok('did not invent leftoverLot I / *HGeom / a new box',
    !existsSync(join(here, 'landmarks/leftoverLotI.js'))
    && !existsSync(join(here, 'landmarks/leftoverGrassI.js'))
    && !/function leftoverGrassIGeom/.test(grass)
    && !/function leftoverLotIGeom/.test(constants)
    && !grass.includes('leftoverLot I')
    && !grass.includes('415/84')
    && !grass.includes('PARK_WALK_HH')
    && !/LEFTOVER_GRASS_X0\s*=/.test(grass)
    && !/LEFTOVER_GRASS_Z0\s*=/.test(grass));

  ok('folds existing grass_lawn via assetLib',
    grass.includes("from '../../../core/assets.js'")
    && grass.includes('assetLib')
    && grass.includes("textureSet('grass_lawn')")
    && grass.includes("pbrMaterial('grass_lawn', { repeat: [7, 4.5] })")
    && grass.includes('0x4c7a3d')
    && !grass.includes('grass_wild')
    && !grass.includes('sparse_grass'));
  ok('grade plate uses leftoverGrassHull bounds and LEFTOVER_GRASS_LAWN_H 0.05',
    grass.includes('LEFTOVER_GRASS_LAWN_H')
    && LEFTOVER_GRASS_LAWN_H === 0.05
    && grass.includes('BoxGeometry(hull.w, LEFTOVER_GRASS_LAWN_H, hull.d)')
    && grass.includes('hull.y0 + LEFTOVER_GRASS_LAWN_H * 0.5')
    && grass.includes('leftoverGrass-lawn'));
  ok('cone bladeGeo field is gone',
    !grass.includes('function bladeGeo')
    && !grass.includes('bladeGeo()')
    && !grass.includes('leftoverGrass-blades')
    && grass.includes('function cardGeo')
    && grass.includes('PlaneGeometry(0.16, 1)')
    && grass.includes('InstancedMesh')
    && grass.includes('leftoverGrass-cards'));
  ok('MeshStandardMaterial stays (no custom mat)',
    grass.includes('MeshStandardMaterial')
    && !/\bShaderMaterial\b/.test(grass)
    && !/\bonBeforeCompile\b/.test(grass));

  const ctx = { blocked: () => false };
  const hull = leftoverGrassHull();
  ok('signed leftover-city hull is the one plate',
    !leftoverGrassRejected()
    && hull.x === LEFTOVER_GRASS_X && hull.z === LEFTOVER_GRASS_Z
    && hull.x === 276 && hull.z === 83.5
    && hull.x0 === 267 && hull.x1 === 285
    && hull.z0 === 81.0 && hull.z1 === 86.0
    && hull.w === 18 && hull.d === 5
    && hull.collider === LEFTOVER_GRASS_HULL_COLLIDER
    && hull.y0 !== undefined);
  ok('constants leftoverGrass box and lawn H were not rewritten',
    LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0
    && LEFTOVER_GRASS_W === 18 && LEFTOVER_GRASS_D === 5
    && LEFTOVER_GRASS_LAWN_H === 0.05
    && constants.includes('LEFTOVER_GRASS_LAWN_H = 0.05')
    && constants.includes('LEFTOVER_GRASS_X0 = 267'));
  ok('path 268→284 / z=84 / 1.6 m stays',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284
    && GARDEN_PATH_Z === 84 && GARDEN_PATH_W === 1.6);

  const cards = collectCards(ctx);
  ok('sparse cards stay under 2000 total',
    cards.length > 0 && cards.length < 2000 && cards.length <= CARD_MAX,
    `cards=${cards.length}`);
  ok('cards stay on leftover-city grade and off stones / lots / bench',
    cards.every((c) => !leftoverGrassDrop(c.x, c.z)
      && !onPavement(c.x, c.z)
      && inGardenPath(c.x, c.z, CARD_BAND)
      && inLeftoverGrass(c.x, c.z)
      && !inGardenPathSlab(c.x, c.z)
      && !inGardenBench(c.x, c.z)
      && !inLeftoverLotReserved(c.x, c.z)
      && groundHeight(c.x, c.z)));
  ok('same tryPlace / leftoverGrassDrop reject-or-drop',
    grass.includes('leftoverGrassDrop')
    && grass.includes('tryPlace')
    && grass.includes('tessellateHull')
    && grass.includes('onPavement')
    && grass.includes('never nudge')
    && grass.includes('Kiss = drop')
    && !/export function tryPlace/.test(grass));

  ok('leftover 8–12k ceiling was not rewritten',
    LEFTOVER_GRASS_INSTANCES_MIN === 8000 && LEFTOVER_GRASS_INSTANCES_MAX === 12000
    && !grass.includes('LEFTOVER_GRASS_INSTANCES_MIN =')
    && grass.includes('8–12k'));
  ok('no filled grass AABB / per-blade collider',
    LEFTOVER_GRASS_AABB === false
    && grass.includes('installLeftoverGrassColliders')
    && grass.includes('Never a filled grass AABB')
    && !grass.includes('part: \'blade\'')
    && leftoverGrassColliderShapes().every((s) => s.part === 'grade'));
  ok('pocketPark.js was not restacked',
    park.includes('Tiny Glade') && park.includes('grow-to-gap')
    && park.includes('pocketPark-lawn')
    && park.includes('function cardGeo')
    && !park.includes('function bladeGeo')
    && park.includes('347/96') && park.includes('364/96')
    && park.includes('381/96') && park.includes('398/96')
    && park.includes('G-park x1=389')
    && park.includes('leftoverLot A–H')
    && !park.includes('leftoverGrass-lawn'));
  ok('planting.js / blades.js were not restacked',
    planting.includes('export function tryPlace')
    && planting.includes('export function tessellateHull')
    && !planting.includes('leftoverGrass')
    && blades.includes('placeBladePlan')
    && !blades.includes('leftoverGrass'));
  ok('kit comment names the plate as the mid read',
    grass.includes('8–25 m St. Augustine')
    && grass.includes('LEFTOVER_GRASS_LAWN_H 0.05')
    && grass.includes('not the card budget')
    && grass.includes('Near-corridor cards stay under 2k')
    && grass.includes('Desi')
    && grass.includes('267–285')
    && !grass.includes('A 50 mm lawn disappears'));

  if (fails.length) {
    console.error('[miami-leftoverGrass-lawn] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-leftoverGrass-lawn] ok', passedCount, 'checks',
      `cards=${cards.length} hull=${hull.x}/${hull.z}`);
  }
  return {
    passed: fails.length === 0,
    fails,
    passedCount,
    cards: cards.length,
    hulls: 1,
  };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('leftoverGrassLawnTest.js');
if (isMain) {
  const r = runMiamiLeftoverGrassLawnTests();
  if (!r.passed) process.exit(1);
}
