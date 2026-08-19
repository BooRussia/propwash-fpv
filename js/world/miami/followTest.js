// Headless checks for Miami follow practice (camera job, not a HUD).
// No three.js, no game state.
//
//   node ./tools/run-miami-follow-test.mjs

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inKeepout } from './constants.js';
import { tryPlace } from './planting.js';
import {
  hauntCheckpointTable,
  createHauntLine,
} from './checkpoints.js';
import {
  GHOST_SPEED,
  GHOST_VISUAL,
  GHOST_COLLIDER,
  GHOST_PARTS,
  hauntFollowPath,
  sampleHauntFollowPath,
  createHauntGhost,
  ghostVisualContainsCollider,
  ghostVisualContainsParts,
  ghostColliderWorld,
  ghostOnReserved,
} from './follow.js';

const here = dirname(fileURLToPath(import.meta.url));

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

const HAUNTS = ['abando', 'drop', 'warehouse', 'house'];
const LAST_KINDS = {
  abando: ['stair', 'sash'],
  drop: ['well', 'door'],
  warehouse: ['vna', 'dock'],
  house: ['stair', 'window'],
};

export function runMiamiFollowTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const table = hauntCheckpointTable();
  const path = hauntFollowPath();
  const { samples } = sampleHauntFollowPath(0.25);

  // ---- reserved line only; no fifth haunt --------------------------------
  ok('follow path uses createHauntLine table',
    !!path.line && path.table === path.line.table);
  ok('follow path table matches hauntCheckpointTable',
    path.table.length === table.length
    && path.table.every((c, i) => c.id === table[i].id
      && c.gate.x === table[i].gate.x
      && c.gate.y === table[i].gate.y
      && c.gate.z === table[i].gate.z));
  ok('four haunt kits only',
    [...new Set(path.table.map((c) => c.haunt))].sort().join() === HAUNTS.slice().sort().join());
  ok('no fifth haunt on the path',
    path.legs.every((leg) => HAUNTS.includes(leg.haunt))
    && !path.table.some((c) => c.haunt === 'canyon' || c.haunt === 'follow'));

  for (const haunt of HAUNTS) {
    const kinds = new Set(path.table.filter((c) => c.haunt === haunt).map((c) => c.kind));
    for (const kind of LAST_KINDS[haunt]) {
      ok(`follow rides ${haunt} ${kind}`, kinds.has(kind));
    }
  }

  ok('path order is abando → drop → warehouse → house',
    path.legs.map((l) => l.haunt).join() === HAUNTS.join());
  ok('each haunt is one reserved leg (no city lerp)',
    path.legs.length === 4
    && path.legs.every((leg) => leg.points.length >= 4));

  // ---- ghost stays on the reserved corridor ------------------------------
  ok('path has samples', samples.length > 20);
  for (const s of samples) {
    ok(`${s.id} sample keepout reserved`, inKeepout(s.x, s.z));
    ok(`${s.id} sample tryPlace drops`, tryPlace(ctx, s.x, s.z) === 0);
  }

  const ghost = createHauntGhost(path);
  const start = ghost.position();
  const first = path.legs[0].points[0];
  ok('ghost starts on the first last-lip',
    start.x === first.x && start.y === first.y && start.z === first.z);
  ok('ghost start is on keepout', ghostOnReserved(ghost));

  const seen = new Set();
  let leftKeepout = false;
  let colliderLeft = false;
  for (let i = 0; i < 800; i++) {
    ghost.step(0.05);
    const p = ghost.position();
    if (!inKeepout(p.x, p.z)) leftKeepout = true;
    const col = ghostColliderWorld(ghost);
    if (!inKeepout(col.x, col.z)) colliderLeft = true;
    seen.add(ghost.haunt());
  }
  ok('ghost never leaves keepout on a lap', !leftKeepout);
  ok('ghost collider never leaves keepout', !colliderLeft);
  ok('ghost visits all four reserved haunts',
    HAUNTS.every((h) => seen.has(h)));
  ok('ghost speed is documentary, not a race clock',
    GHOST_SPEED >= 2 && GHOST_SPEED <= 8);

  ghost.reset();
  const after = ghost.position();
  ok('ghost reset returns to the first lip',
    after.x === first.x && after.z === first.z);

  // ---- rider collider ⊆ visual -------------------------------------------
  ok('collider sits inside the visual AABB', ghostVisualContainsCollider());
  ok('mesh parts sit inside the visual AABB', ghostVisualContainsParts());
  ok('collider is smaller than the rider',
    GHOST_COLLIDER.radius < GHOST_VISUAL.halfW
    && GHOST_COLLIDER.radius <= GHOST_VISUAL.halfD);
  ok('visual is a person-scale weenie, not a neon slab',
    GHOST_VISUAL.halfH > 0.6 && GHOST_VISUAL.halfH < 1.2
    && GHOST_VISUAL.halfW < 0.5
    && GHOST_PARTS.some((p) => p.id === 'head')
    && GHOST_PARTS.some((p) => p.id === 'torso'));

  // ---- one placer; documentary kit; no second HUD ------------------------
  const followSrc = readFileSync(join(here, 'follow.js'), 'utf8');
  const checkpoints = readFileSync(join(here, 'checkpoints.js'), 'utf8');
  const main = readFileSync(join(here, '../../main.js'), 'utf8');
  const modes = readFileSync(join(here, '../../modes/modes.js'), 'utf8');
  const menu = readFileSync(join(here, '../../ui/menu.js'), 'utf8');
  const osd = readFileSync(join(here, '../../ui/osd.js'), 'utf8');
  const pose = readFileSync(join(here, '../../camera/pose.js'), 'utf8');
  const camIdx = readFileSync(join(here, '../../camera/index.js'), 'utf8');
  const quad = readFileSync(join(here, '../../physics/quad.js'), 'utf8');
  const state = readFileSync(join(here, '../../core/state.js'), 'utf8');
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const house = readFileSync(join(here, 'landmarks/house.js'), 'utf8');
  const warehouse = readFileSync(join(here, 'landmarks/warehouse.js'), 'utf8');
  const drop = readFileSync(join(here, 'landmarks/drop.js'), 'utf8');
  const abando = readFileSync(join(here, 'landmarks/abando.js'), 'utf8');
  const blades = readFileSync(join(here, 'blades.js'), 'utf8');
  const water = readFileSync(join(here, 'bayWater.js'), 'utf8');
  const preview = readFileSync(join(here, '../../../preview.html'), 'utf8');
  const realworld = readFileSync(join(here, '../realworld.js'), 'utf8');

  ok('tryPlace is still the placer', planting.includes('export function tryPlace'));
  ok('follow is not a second placer',
    !/export function tryPlace/.test(followSrc)
    && !/\bnudge\b/.test(followSrc)
    && followSrc.includes('hauntCheckpointTable')
    && followSrc.includes('createHauntLine'));
  ok('follow samples the checkpoint table',
    followSrc.includes('hauntFollowPath')
    && followSrc.includes("pushPoint(points, cp, 'gate')")
    && followSrc.includes("pushPoint(points, cp, 'restart')"));
  ok('inter-haunt is a cut, not a city lerp',
    followSrc.includes('Inter-haunt: cut')
    && followSrc.includes('cp.haunt !== haunt'));

  ok('GRAVITY stays 9.81',
    /const GRAVITY = 9\.81/.test(quad) && !/riderMass/.test(quad) && !/wheelMass/.test(quad));
  ok('follow does not put Dirtline rider springs in the ghost',
    !/riderMass/.test(followSrc) && !/wheelMass/.test(followSrc)
    && !/GRAVITY/.test(followSrc));
  ok('no neon / canyon GLB / shader toy',
    !/\bShaderMaterial\b/.test(followSrc)
    && !/\bonBeforeCompile\b/.test(followSrc)
    && !/\.glb/.test(followSrc)
    && !/0x29d3ff/.test(followSrc)
    && !/emissive/.test(followSrc)
    && followSrc.includes('MeshStandardMaterial'));

  ok('camera stays FPV — no chase cam',
    !/PerspectiveCamera/.test(followSrc)
    && !/losMode/.test(followSrc)
    && !/chaseCam|chase cam|lookAt/.test(followSrc)
    && pose.includes('FPV: body-locked')
    && camIdx.includes('toggleLos'));
  ok('no second HUD file dump', (() => {
    const uiDir = join(here, '../../ui');
    const uiFiles = readdirSync(uiDir);
    return !uiFiles.some((f) => /follow/i.test(f))
      && !/followHud|follow-hud|followOsd|follow-osd/i.test(followSrc)
      && !osd.includes('follow')
      && !/mode:objective/.test(followSrc)
      && !/osd:flash/.test(followSrc)
      && modes.includes("modeName === 'follow'")
      && modes.includes('createFollowMode')
      && modes.includes("emit('mode:objective'");
  })());
  ok('menu enters follow as a game mode',
    menu.includes("value: 'follow'")
    && menu.includes("title: 'Follow'"));
  ok('settings know follow',
    state.includes("'follow'")
    && /gameMode: 'freestyle'/.test(state));

  ok('main still uses haunt restart before map spawn',
    main.includes('createHauntLine')
    && main.includes('hauntLine.restartPose')
    && main.includes('hauntLine.notePosition')
    && /0\.6 m past the last cleared lip/.test(main));
  ok('checkpoints were not restacked with follow chrome',
    !/follow-mode|followMode|ghost rider/i.test(checkpoints)
    && checkpoints.includes('RESTART_OFFSET')
    && checkpoints.includes('abandoVoids'));

  ok('house was not restacked',
    house.includes('housePlanGeom') && house.includes('weenie')
    && !/follow/i.test(house));
  ok('warehouse was not restacked',
    warehouse.includes('warehouseAisleGeom') && warehouse.includes('buildRacks')
    && !/follow/i.test(warehouse));
  ok('drop was not restacked',
    drop.includes('dropHoistGeom') && drop.includes('buildWell')
    && !/follow/i.test(drop));
  ok('abando was not restacked',
    abando.includes('abandoStairGeom') && abando.includes('buildSilo')
    && !/follow/i.test(abando));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust')
    && !/follow/i.test(blades));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !/follow/i.test(water));
  ok('preview.html was not restacked',
    preview.includes('url=./') && !/follow/i.test(preview));
  ok('realworld / OSM was not started',
    realworld.includes('buildRealWorld')
    && !/follow/i.test(realworld)
    && !followSrc.includes('realworld')
    && !followSrc.includes('buildRealWorld'));

  if (fails.length) {
    console.error('[miami-follow] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-follow] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('followTest.js');
if (isMain) {
  const r = runMiamiFollowTests();
  if (!r.passed) process.exit(1);
}
