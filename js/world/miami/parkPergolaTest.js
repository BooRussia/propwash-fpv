// Headless checks for the Miami park pergola (boardwalk-gate kit).
// No three.js, no game state. Not a haunt. Not leftoverLot. Not a
// pocket-park / bench / path restack.
//
//   node ./tools/run-miami-park-pergola-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CITY_Y, BOARDWALK_TOP, GATE_X, GATE_Z, GATE_POST_H, GATE_HALF_X, GATE_HALF_Z,
  GATE_POST_R,
  PARK_PERGOLA_X, PARK_PERGOLA_Z, PARK_PERGOLA_OPEN_H, PARK_PERGOLA_FLY,
  PARK_PERGOLA_HALF_X, PARK_PERGOLA_HALF_Z, PARK_PERGOLA_HALF_MAX,
  PARK_PERGOLA_POST_H, PARK_PERGOLA_W, PARK_PERGOLA_D,
  PARK_PERGOLA_COLLIDER_PAD, PARK_PERGOLA_AABB,
  PARK_PERGOLA_X0, PARK_PERGOLA_X1, PARK_PERGOLA_Z0, PARK_PERGOLA_Z1,
  GARDEN_BENCH_X, GARDEN_BENCH_Z, GARDEN_BENCH_W, GARDEN_BENCH_DEPTH,
  GARDEN_PATH_X, GARDEN_PATH_Z, GARDEN_PATH_W, GARDEN_PATH_LEN,
  GARDEN_PATH_X0, GARDEN_PATH_X1, GARDEN_PATH_Z0, GARDEN_PATH_Z1,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_X0, LEFTOVER_LOT_X1,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z, LEFTOVER_LOT_B_X0, LEFTOVER_LOT_B_X1,
  LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z, LEFTOVER_LOT_C_X0, LEFTOVER_LOT_C_X1,
  LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z, LEFTOVER_LOT_D_X0, LEFTOVER_LOT_D_X1,
  PARK_BENCH_X, PARK_BENCH_Z, PARK_BENCH_W, PARK_BENCH_DEPTH,
  PARK_BENCH_X0, PARK_BENCH_X1, PARK_BENCH_Z0, PARK_BENCH_Z1,
  POCKET_PARK_X, POCKET_PARK_Z, POCKET_PARK_W, POCKET_PARK_D,
  POCKET_PARK_X0, POCKET_PARK_X1, POCKET_PARK_Z0, POCKET_PARK_Z1,
  LEFTOVER_GRASS_X0, LEFTOVER_GRASS_X1, LEFTOVER_GRASS_Z0, LEFTOVER_GRASS_Z1,
  FLY_VOIDS, flyColliderShapes,
  onPavement, onBoardwalk, onRoadway, onCrossStreet, onSidewalk,
  inKeepout, inFlyVoid, streetOverlap, groundHeight,
  leftoverLotGeom,
  gardenBenchGeom, gardenBenchRejected,
  inGardenPath, inGardenPathSlab, gardenPathSlabOverlap,
  inLeftoverLotReserved, leftoverLotOverlap,
  boardwalkGateGeom, boardwalkGateRejected, boardwalkGateColliderShapes,
  boardwalkGateVoid,
} from './constants.js';
import { tryPlace } from './planting.js';

const here = dirname(fileURLToPath(import.meta.url));

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

export function runMiamiParkPergolaTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const promenade = boardwalkGateGeom();
  const geom = boardwalkGateGeom(PARK_PERGOLA_X, PARK_PERGOLA_Z);
  const shapes = boardwalkGateColliderShapes(geom);
  const voids = [boardwalkGateVoid(geom, 'park-pergola')];
  const fly = FLY_VOIDS.find((v) => v.id === 'park-pergola');
  const kit = flyColliderShapes();
  const geomA = leftoverLotGeom();

  // ---- signed cell (Desi + Reesy); do not leave it at 92 ----------------
  ok('pergola cell is signed 276 / 94', PARK_PERGOLA_X === 276 && PARK_PERGOLA_Z === 94);
  ok('pergola was not left at 276/92', PARK_PERGOLA_Z === 94 && PARK_PERGOLA_Z !== 92);
  ok('x/z were not invented or slid',
    geom.x === 276 && geom.z === 94
    && geom.x === PARK_PERGOLA_X && geom.z === PARK_PERGOLA_Z
    && PARK_PERGOLA_X === 276 && PARK_PERGOLA_Z === 94);
  ok('276/94 is 3.7 m north of the park-bench back (~90.3)',
    Math.abs(PARK_PERGOLA_Z - 90.3 - 3.7) < 1e-9);
  ok('opening H is 2.20 m whoop sash',
    PARK_PERGOLA_OPEN_H === 2.20
    && PARK_PERGOLA_OPEN_H === GATE_POST_H
    && PARK_PERGOLA_POST_H === GATE_POST_H
    && geom.openH === 2.20);
  ok('fly axis is +X',
    PARK_PERGOLA_FLY === '+X' && geom.fly === '+X');
  ok('kit half-span is the boardwalk-gate half',
    PARK_PERGOLA_HALF_X === GATE_HALF_X && PARK_PERGOLA_HALF_Z === GATE_HALF_Z
    && geom.halfX === GATE_HALF_X && geom.halfZ === GATE_HALF_Z);
  ok('kit Z-span is 2 × GATE_HALF_Z',
    Math.abs(PARK_PERGOLA_D - GATE_HALF_Z * 2) < 1e-9
    && Math.abs(geom.spanZ - 2.32) < 1e-9
    && Math.abs(PARK_PERGOLA_Z1 - PARK_PERGOLA_Z0 - geom.spanZ) < 1e-9);
  ok('Z-span is 92.84 → 95.16',
    Math.abs(PARK_PERGOLA_Z0 - 92.84) < 1e-9
    && Math.abs(PARK_PERGOLA_Z1 - 95.16) < 1e-9
    && Math.abs(geom.z0 - 92.84) < 1e-9
    && Math.abs(geom.z1 - 95.16) < 1e-9);
  ok('half-span stays under 2 m so z1 stays inside the park',
    GATE_HALF_Z < PARK_PERGOLA_HALF_MAX
    && PARK_PERGOLA_HALF_Z < 2
    && PARK_PERGOLA_HALF_MAX === 2
    && PARK_PERGOLA_Z1 < POCKET_PARK_Z1
    && POCKET_PARK_Z1 === 96);
  ok('did not slide to 96',
    PARK_PERGOLA_Z === 94 && PARK_PERGOLA_Z1 !== 96 && geom.z !== 96);
  ok('Z-span does not kiss the park-bench back (~90.3)',
    PARK_PERGOLA_Z0 > PARK_BENCH_Z1
    && PARK_PERGOLA_Z0 > 90.3
    && geom.z0 > 90.3);
  ok('geom matches signed constants',
    geom.x === 276 && geom.z === 94
    && Math.abs(geom.x0 - PARK_PERGOLA_X0) < 1e-9
    && Math.abs(geom.x1 - PARK_PERGOLA_X1) < 1e-9
    && Math.abs(geom.z0 - PARK_PERGOLA_Z0) < 1e-9
    && Math.abs(geom.z1 - PARK_PERGOLA_Z1) < 1e-9);
  ok('sits on leftover-city grade, not the boardwalk deck',
    geom.y0 === CITY_Y && geom.y0 !== BOARDWALK_TOP
    && groundHeight(PARK_PERGOLA_X, PARK_PERGOLA_Z) === CITY_Y);

  // ---- pocket park / benches / path / lots stay put ----------------------
  ok('pocket park stays 276/92, 16×8 (268–284 × 88–96)',
    POCKET_PARK_X === 276 && POCKET_PARK_Z === 92
    && POCKET_PARK_W === 16 && POCKET_PARK_D === 8
    && POCKET_PARK_X0 === 268 && POCKET_PARK_X1 === 284
    && POCKET_PARK_Z0 === 88 && POCKET_PARK_Z1 === 96);
  ok('park bench stays 276/90', PARK_BENCH_X === 276 && PARK_BENCH_Z === 90);
  ok('garden bench stays 276 / 82.4',
    GARDEN_BENCH_X === 276 && GARDEN_BENCH_Z === 82.4);
  ok('path stays 268→284 / z=84 / 1.6 m',
    GARDEN_PATH_X0 === 268 && GARDEN_PATH_X1 === 284
    && GARDEN_PATH_Z === 84 && GARDEN_PATH_W === 1.6
    && GARDEN_PATH_LEN === 16 && GARDEN_PATH_X === 276
    && GARDEN_PATH_Z0 === 83.2 && GARDEN_PATH_Z1 === 84.8);
  ok('leftoverLot A stays 258/84', LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_Z === 84);
  ok('leftoverLot B stays 295/84', LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_B_Z === 84);
  ok('leftoverLot C stays 313/84', LEFTOVER_LOT_C_X === 313 && LEFTOVER_LOT_C_Z === 84);
  ok('leftoverLot D stays 330/84', LEFTOVER_LOT_D_X === 330 && LEFTOVER_LOT_D_Z === 84);
  ok('leftoverGrass stays 267–285 / 81–86',
    LEFTOVER_GRASS_X0 === 267 && LEFTOVER_GRASS_X1 === 285
    && LEFTOVER_GRASS_Z0 === 81.0 && LEFTOVER_GRASS_Z1 === 86.0);
  ok('leftoverLot A/B/C/D geometry was not slid',
    LEFTOVER_LOT_X0 === 251 && LEFTOVER_LOT_X1 === 265
    && LEFTOVER_LOT_B_X0 === 288 && LEFTOVER_LOT_B_X1 === 302
    && LEFTOVER_LOT_C_X0 === 306 && LEFTOVER_LOT_C_X1 === 320
    && LEFTOVER_LOT_D_X0 === 323 && LEFTOVER_LOT_D_X1 === 337
    && geomA.x === 258 && geomA.z === 84);

  ok('pergola is not pavement', !onPavement(PARK_PERGOLA_X, PARK_PERGOLA_Z));
  ok('pergola is not boardwalk', !onBoardwalk(PARK_PERGOLA_X, PARK_PERGOLA_Z));
  ok('pergola is not roadway', !onRoadway(PARK_PERGOLA_Z));
  ok('pergola is not a cross-street', !onCrossStreet(PARK_PERGOLA_X, PARK_PERGOLA_Z));
  ok('pergola is not a sidewalk slab', !onSidewalk(PARK_PERGOLA_X, PARK_PERGOLA_Z));
  ok('pergola is a keepout', inKeepout(PARK_PERGOLA_X, PARK_PERGOLA_Z));
  ok('tryPlace drops the reserved pergola',
    tryPlace(ctx, PARK_PERGOLA_X, PARK_PERGOLA_Z) === 0);
  ok('tryPlace does not remap the pergola',
    tryPlace(ctx, PARK_PERGOLA_X, PARK_PERGOLA_Z) === 0);
  ok('signed cell is not rejected', !boardwalkGateRejected());
  ok('signed cell is not rejected at 276/94',
    !boardwalkGateRejected(PARK_PERGOLA_X, PARK_PERGOLA_Z));
  ok('footprint is not in the street',
    !streetOverlap(PARK_PERGOLA_X, PARK_PERGOLA_Z, PARK_PERGOLA_W, PARK_PERGOLA_D));
  ok('does not overlap leftoverLot A/B/C/D reserved',
    !leftoverLotOverlap(PARK_PERGOLA_X, PARK_PERGOLA_Z, PARK_PERGOLA_W, PARK_PERGOLA_D, 0.15)
    && !inLeftoverLotReserved(PARK_PERGOLA_X, PARK_PERGOLA_Z)
    && !inLeftoverLotReserved(PARK_PERGOLA_X0, PARK_PERGOLA_Z)
    && !inLeftoverLotReserved(PARK_PERGOLA_X1, PARK_PERGOLA_Z));
  ok('does not sit on the garden path',
    !inGardenPath(PARK_PERGOLA_X, PARK_PERGOLA_Z)
    && !inGardenPathSlab(PARK_PERGOLA_X, PARK_PERGOLA_Z)
    && !gardenPathSlabOverlap(PARK_PERGOLA_X, PARK_PERGOLA_Z,
      PARK_PERGOLA_W, PARK_PERGOLA_D, 0));
  ok('does not sit on garden bench 276/82.4',
    PARK_PERGOLA_Z0 > GARDEN_BENCH_Z + GARDEN_BENCH_DEPTH
    && !boardwalkGateRejected(PARK_PERGOLA_X, PARK_PERGOLA_Z));
  ok('does not sit on park bench 276/90',
    PARK_PERGOLA_Z0 > PARK_BENCH_Z1);
  ok('tryPlace still drops leftoverLot A/B/C/D',
    tryPlace(ctx, LEFTOVER_LOT_X, LEFTOVER_LOT_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z) === 0
    && tryPlace(ctx, LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z) === 0);
  ok('tryPlace still drops the garden path',
    tryPlace(ctx, GARDEN_PATH_X, GARDEN_PATH_Z) === 0);
  ok('tryPlace still drops garden bench 276/82.4',
    tryPlace(ctx, GARDEN_BENCH_X, GARDEN_BENCH_Z) === 0);
  ok('tryPlace still drops park bench 276/90',
    tryPlace(ctx, PARK_BENCH_X, PARK_BENCH_Z) === 0);
  ok('tryPlace still drops pavement / street',
    tryPlace(ctx, 0, 27) === 0 && tryPlace(ctx, 57, 80) === 0);
  ok('park bench signed cell is still not rejected',
    !gardenBenchRejected(PARK_BENCH_X, PARK_BENCH_Z));
  ok('garden bench signed cell is still not rejected', !gardenBenchRejected());

  // ---- drop if it sits on a bench / path / lot; never nudge --------------
  ok('drop if the kit sits on park bench 276/90',
    boardwalkGateRejected(PARK_BENCH_X, PARK_BENCH_Z) === true);
  ok('drop if the kit sits on garden bench 276/82.4',
    boardwalkGateRejected(GARDEN_BENCH_X, GARDEN_BENCH_Z) === true);
  ok('drop if the kit sits on the garden path',
    boardwalkGateRejected(GARDEN_PATH_X, GARDEN_PATH_Z) === true);
  ok('drop if the kit sits on leftoverLot A',
    boardwalkGateRejected(LEFTOVER_LOT_X, LEFTOVER_LOT_Z) === true);

  // ---- shared boardwalk-gate kit; no pergolaGeom fork --------------------
  ok('default boardwalkGateGeom stays on the promenade',
    promenade.x === GATE_X && promenade.z === GATE_Z
    && promenade.y0 === BOARDWALK_TOP
    && promenade.tag === 'boardwalk-gate');
  ok('park reuses boardwalkGateGeom, same posts + lintel',
    geom.halfX === promenade.halfX && geom.halfZ === promenade.halfZ
    && geom.postR === promenade.postR && geom.postH === promenade.postH
    && geom.beamH === promenade.beamH && geom.beamW === promenade.beamW
    && geom.openH === promenade.openH && geom.openW === promenade.openW
    && geom.fly === promenade.fly && geom.tag === 'boardwalk-gate');
  ok('post radius is the gate kit', geom.postR === GATE_POST_R);

  // ---- opening is empty air; collider ⊆ posts + lintel -------------------
  ok('park-pergola fly void is published',
    !!fly && fly.kind === 'kit' && fly.x === 276 && fly.z === 94
    && fly.openH === 2.20 && Math.abs(fly.openW - (GATE_HALF_Z * 2 - 2 * GATE_POST_R)) < 1e-9);
  ok('inFlyVoid covers the signed sash', !!inFlyVoid(PARK_PERGOLA_X, PARK_PERGOLA_Z));
  const sashHit = probeBlocked(shapes, fly.x, fly.y, fly.z, 0.28);
  ok('opening centre is empty air', !sashHit,
    sashHit ? `blocked by ${sashHit.tag} ${sashHit.type}` : '');
  const kitHit = probeBlocked(kit, fly.x, fly.y, fly.z, 0.28);
  ok('opening stays open in the shared fly bag', !kitHit);
  ok('no filled sash AABB',
    PARK_PERGOLA_AABB === false
    && !shapes.some((s) => s.type === 'aabb'
      && s.sx >= geom.spanX - 0.2 && s.sz >= geom.spanZ - 0.2
      && s.y0 < geom.y0 + geom.openH - 0.05
      && s.sy > 1.0));
  const posts = shapes.filter((s) => s.type === 'cyl');
  const lintels = shapes.filter((s) => s.type === 'aabb' && s.sy === geom.beamH);
  ok('kit ships four posts', posts.length === 4);
  ok('kit ships lintel beams', lintels.length === 4);
  ok('posts are smaller than the sash',
    posts.every((p) => p.r * 2 < fly.openW - 1e-6) && GATE_POST_R * 2 < 2.0);
  ok('a post occupies its own footprint',
    !!probeBlocked(shapes, posts[0].x, posts[0].y0 + 1.0, posts[0].z, 0.02));
  ok('colliders stay ⊆ visual ±0.15 m',
    PARK_PERGOLA_COLLIDER_PAD === 0.15
    && posts.every((p) => p.r <= geom.postR + PARK_PERGOLA_COLLIDER_PAD)
    && lintels.every((s) => s.sz <= geom.beamW + PARK_PERGOLA_COLLIDER_PAD
      || s.sx <= geom.beamW + PARK_PERGOLA_COLLIDER_PAD));
  ok('shared fly bag includes the park posts',
    kit.filter((s) => s.tag === 'boardwalk-gate' && s.type === 'cyl'
      && Math.abs(s.x - PARK_PERGOLA_X) <= GATE_HALF_X + 1e-6).length === 4);
  ok('promenade gate posts were not restacked away',
    kit.filter((s) => s.tag === 'boardwalk-gate' && s.type === 'cyl'
      && Math.abs(s.x - GATE_X) <= GATE_HALF_X + 1e-6).length === 4);
  void voids;

  // ---- one placer; no second scatterer; look locks ----------------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const flySrc = readFileSync(join(here, 'landmarks/flythrough.js'), 'utf8');
  const leftover = readFileSync(join(here, 'landmarks/leftoverLot.js'), 'utf8');
  const garden = readFileSync(join(here, 'landmarks/gardenPath.js'), 'utf8');
  const bench = readFileSync(join(here, 'landmarks/gardenBench.js'), 'utf8');
  const grass = readFileSync(join(here, 'landmarks/leftoverGrass.js'), 'utf8');
  const park = readFileSync(join(here, 'landmarks/pocketPark.js'), 'utf8');
  const constants = readFileSync(join(here, 'constants.js'), 'utf8');
  const house = readFileSync(join(here, 'landmarks/house.js'), 'utf8');
  const warehouse = readFileSync(join(here, 'landmarks/warehouse.js'), 'utf8');
  const drop = readFileSync(join(here, 'landmarks/drop.js'), 'utf8');
  const abando = readFileSync(join(here, 'landmarks/abando.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  const blades = readFileSync(join(here, 'blades.js'), 'utf8');
  const water = readFileSync(join(here, 'bayWater.js'), 'utf8');
  const preview = readFileSync(join(here, '../../../preview.html'), 'utf8');
  const follow = readFileSync(join(here, 'follow.js'), 'utf8');
  const checkpoints = readFileSync(join(here, 'checkpoints.js'), 'utf8');
  const quad = readFileSync(join(here, '../../physics/quad.js'), 'utf8');

  ok('tryPlace is still the placer', planting.includes('export function tryPlace'));
  ok('flythrough is not a second scatterer',
    !flySrc.includes('scatterModels') && !flySrc.includes('planDirtBlades'));
  ok('flythrough does not invent a placer',
    !/export function tryPlace/.test(flySrc)
    && flySrc.includes('tryPlace')
    && flySrc.includes('onPavement'));
  ok('park pergola reuses boardwalkGateGeom, no pergolaGeom fork',
    flySrc.includes('boardwalkGateGeom(PARK_PERGOLA_X, PARK_PERGOLA_Z)')
    && flySrc.includes('boardwalkGateRejected')
    && constants.includes('export function boardwalkGateGeom')
    && constants.includes('276 / 94')
    && !/export function pergolaGeom/.test(constants)
    && !/export function parkPergolaGeom/.test(constants)
    && !/function pergolaGeom/.test(flySrc)
    && !/function parkPergolaGeom/.test(flySrc)
    && !/pergolaGeom\(/.test(flySrc)
    && !/parkPergolaGeom\(/.test(flySrc));
  ok('did not ship parkPergola.js / pergola.js',
    !existsSync(join(here, 'landmarks/parkPergola.js'))
    && !existsSync(join(here, 'landmarks/pergola.js'))
    && !existsSync(join(here, 'parkPergola.js')));
  ok('index keeps the shared flythrough builder',
    index.includes("from './landmarks/flythrough.js'")
    && index.includes('buildFlythrough(ctx)')
    && !index.includes('buildParkPergola')
    && !index.includes('parkPergolaGeom'));
  ok('no custom mat',
    !/\bShaderMaterial\b/.test(flySrc) && !/\bonBeforeCompile\b/.test(flySrc)
    && flySrc.includes('MeshStandardMaterial'));
  ok('kit is boardwalk-gate posts + lintel, whoop sash, fly +X',
    flySrc.includes('boardwalk-gate') && flySrc.includes('276/94')
    && flySrc.includes('2.20') && flySrc.includes('+X')
    && constants.includes('Desi')
    && !/Kenney|silo|hoistway/i.test(flySrc));
  ok('gardenPath was not restacked',
    garden.includes('Tiny Glade') && garden.includes('two-abreast')
    && garden.includes('268') && garden.includes('Desi')
    && !garden.includes('PARK_PERGOLA_') && !garden.includes('parkPergola')
    && !garden.includes('boardwalkGateGeom'));
  ok('gardenBench was not restacked',
    bench.includes('Tiny Glade') && bench.includes('3-seat slat')
    && bench.includes('Sit-box is a void') && bench.includes('276')
    && !bench.includes('PARK_PERGOLA_') && !bench.includes('parkPergola')
    && !bench.includes('boardwalkGateGeom'));
  ok('leftoverGrass was not restacked',
    grass.includes('Tiny Glade') && grass.includes('grow-to-gap')
    && grass.includes('leftover-city') && grass.includes('267')
    && !grass.includes('PARK_PERGOLA_') && !grass.includes('parkPergola'));
  ok('pocketPark was not restacked',
    park.includes('Tiny Glade') && park.includes('grow-to-gap')
    && park.includes('276') && park.includes('Desi')
    && !park.includes('PARK_PERGOLA_') && !park.includes('parkPergola')
    && !park.includes('boardwalkGateGeom'));
  ok('leftoverLot A/B/C/D were not restacked',
    leftover.includes('leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z)')
    && leftover.includes('leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)')
    && leftover.includes('chain-link') && leftover.includes('weenie')
    && !leftover.includes('PARK_PERGOLA_') && !leftover.includes('parkPergola')
    && !leftover.includes('boardwalkGateGeom')
    && constants.includes('258/84') && constants.includes('295/84')
    && constants.includes('313/84') && constants.includes('330/84')
    && constants.includes('268→284')
    && constants.includes('276 / 82.4')
    && constants.includes('276 / 94'));
  ok('house was not restacked',
    house.includes('housePlanGeom') && house.includes('weenie')
    && !house.includes('PARK_PERGOLA_') && !house.includes('parkPergola'));
  ok('warehouse was not restacked',
    warehouse.includes('warehouseAisleGeom') && warehouse.includes('buildRacks')
    && !warehouse.includes('PARK_PERGOLA_') && !warehouse.includes('parkPergola'));
  ok('drop was not restacked',
    drop.includes('dropHoistGeom') && drop.includes('buildWell')
    && !drop.includes('PARK_PERGOLA_') && !drop.includes('parkPergola'));
  ok('abando was not restacked',
    abando.includes('abandoStairGeom') && abando.includes('buildSilo')
    && !abando.includes('PARK_PERGOLA_') && !abando.includes('parkPergola'));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust')
    && !blades.includes('parkPergola') && !blades.includes('PARK_PERGOLA_'));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !water.includes('parkPergola') && !water.includes('PARK_PERGOLA_'));
  ok('preview.html was not restacked',
    preview.includes('url=./') && !preview.includes('parkPergola'));
  ok('follow.js was not restacked',
    follow.includes('hauntFollowPath') && !follow.includes('parkPergola'));
  ok('checkpoints.js was not restacked',
    checkpoints.includes('RESTART_OFFSET') && !checkpoints.includes('parkPergola'));
  ok('quad.js GRAVITY stays 9.81',
    /const GRAVITY = 9\.81/.test(quad) && !quad.includes('parkPergola'));
  ok('planting.js was not restacked',
    planting.includes('export function tryPlace')
    && !planting.includes('parkPergola') && !planting.includes('PARK_PERGOLA_')
    && !planting.includes('gardenBench') && !planting.includes('GARDEN_BENCH_')
    && !planting.includes('gardenPath') && !planting.includes('GARDEN_PATH_'));

  if (fails.length) {
    console.error('[miami-parkPergola] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-parkPergola] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('parkPergolaTest.js');
if (isMain) {
  const r = runMiamiParkPergolaTests();
  if (!r.passed) process.exit(1);
}
