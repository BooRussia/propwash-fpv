// Headless checks for Dirtline-style haunt checkpoints.
// No three.js, no game state.
//
//   node ./tools/run-miami-checkpoint-test.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  inKeepout,
  abandoVoids, dropVoids, warehouseVoids, houseVoids,
  abandoColliderShapes, dropColliderShapes,
  warehouseColliderShapes, houseColliderShapes,
} from './constants.js';
import { tryPlace } from './planting.js';
import {
  RESTART_OFFSET,
  hauntCheckpointTable,
  pointInCheckpoint,
  createHauntLine,
} from './checkpoints.js';

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

const SHAPES = {
  abando: abandoColliderShapes,
  drop: dropColliderShapes,
  warehouse: warehouseColliderShapes,
  house: houseColliderShapes,
};

const LAST_KINDS = {
  abando: ['stair', 'sash'],
  drop: ['well', 'door'],
  warehouse: ['vna', 'dock'],
  house: ['stair', 'window'],
};

const OPENING_KINDS = {
  abando: ['bay', 'manhole'],
  drop: ['hoistway'],
  warehouse: ['wide', 'narrow', 'sash'],
  house: ['door', 'hall'],
};

const WALL_PUNCH = new Set(['sash', 'door', 'dock', 'window']);

export function runMiamiCheckpointTests() {
  fails.length = 0;
  passedCount = 0;

  const ctx = { blocked: () => false };
  const table = hauntCheckpointTable();
  const byHaunt = (h) => table.filter((c) => c.haunt === h);
  const source = {
    abando: abandoVoids(),
    drop: dropVoids(),
    warehouse: warehouseVoids(),
    house: houseVoids(),
  };

  // ---- Dirtline offset; last lips only ------------------------------------
  ok('Dirtline restart offset is 0.6 m', RESTART_OFFSET === 0.6);
  ok('four haunt kits publish checkpoints',
    ['abando', 'drop', 'warehouse', 'house'].every((h) => byHaunt(h).length > 0));

  for (const haunt of Object.keys(LAST_KINDS)) {
    const kinds = new Set(byHaunt(haunt).map((c) => c.kind));
    for (const kind of LAST_KINDS[haunt]) {
      ok(`${haunt} ${kind} is a checkpoint`, kinds.has(kind));
    }
    for (const kind of OPENING_KINDS[haunt]) {
      ok(`${haunt} ${kind} is not a checkpoint`, !kinds.has(kind));
    }
    const srcIds = new Set(source[haunt].filter((v) => LAST_KINDS[haunt].includes(v.kind)).map((v) => v.id));
    const tabIds = new Set(byHaunt(haunt).map((c) => c.id));
    ok(`${haunt} table uses existing void ids`,
      srcIds.size === tabIds.size && [...srcIds].every((id) => tabIds.has(id)));
  }

  ok('promenade fly-throughs are not haunt checkpoints',
    !table.some((c) => c.id === 'boardwalk-gate' || c.id === 'garage-mouth'));

  // ---- each checkpoint rides the reserved keepout; restart is past the lip
  for (const cp of table) {
    const g = cp.gate;
    const r = cp.restart;
    const src = source[cp.haunt].find((v) => v.id === cp.id);
    ok(`${cp.id} gate is the existing void centre`,
      !!src && src.x === g.x && src.y === g.y && src.z === g.z);
    ok(`${cp.id} keepout reserved`, inKeepout(g.x, g.z));
    ok(`${cp.id} restart keepout reserved`, inKeepout(r.x, r.z));
    ok(`${cp.id} tryPlace drops the gate`, tryPlace(ctx, g.x, g.z) === 0);
    ok(`${cp.id} tryPlace drops the restart`, tryPlace(ctx, r.x, r.z) === 0);
    ok(`${cp.id} tryPlace does not remap`,
      tryPlace(ctx, r.x, r.z) === 0 && tryPlace(ctx, g.x, g.z) === 0);

    const axis = cp.axis;
    const d = r[axis] - g[axis];
    ok(`${cp.id} restart is Dirtline +0.6 past the lip`,
      Math.abs(d - cp.sign * RESTART_OFFSET) < 1e-9);
    ok(`${cp.id} restart is not the mouth`, Math.abs(d) > 0.5);
    ok(`${cp.id} other axes stay on the void`,
      (axis === 'x' || r.x === g.x)
      && (axis === 'y' || r.y === g.y)
      && (axis === 'z' || r.z === g.z));

    if (WALL_PUNCH.has(cp.kind)) {
      ok(`${cp.id} restart sits past the punch`,
        !pointInCheckpoint(cp, r.x, r.y, r.z));
    }

    const hit = probeBlocked(SHAPES[cp.haunt](), r.x, r.y, r.z, 0.08);
    ok(`${cp.id} restart is open`, !hit, hit ? `blocked by ${hit.tag} ${hit.type}` : '');

    const mouth = { x: g.x, y: g.y, z: g.z };
    ok(`${cp.id} gate centre is the opening`,
      pointInCheckpoint(cp, mouth.x, mouth.y, mouth.z));
  }

  // ---- session: clear last lip → R / crash uses that restart, not map spawn
  const line = createHauntLine();
  ok('no checkpoint yet → no haunt restart', line.restartPose() === null);
  ok('lastCleared starts empty', line.lastCleared() === null);

  const first = table[0];
  const cleared = line.notePosition(first.gate.x, first.gate.y, first.gate.z);
  ok('flying the last lip clears it', !!cleared && cleared.id === first.id);
  ok('repeat pass does not re-clear',
    line.notePosition(first.gate.x, first.gate.y, first.gate.z) === null);
  const pose = line.restartPose();
  ok('R after clear is the offset restart',
    !!pose
    && pose.x === first.restart.x
    && pose.y === first.restart.y
    && pose.z === first.restart.z);
  ok('R after clear is not the map pad',
    !(Math.abs(pose.x) < 1 && Math.abs(pose.z - 8) < 1));

  const later = table.find((c) => c.haunt !== first.haunt);
  ok('a later haunt lip exists', !!later);
  const next = line.notePosition(later.gate.x, later.gate.y, later.gate.z);
  ok('a later lip replaces the last cleared', !!next && next.id === later.id);
  ok('restart follows the last cleared lip',
    line.restartPose().x === later.restart.x
    && line.restartPose().z === later.restart.z);

  const opening = source.house.find((v) => v.kind === 'door');
  const before = line.lastCleared().id;
  line.notePosition(opening.x, opening.y, opening.z);
  ok('opening / drop-in does not become a checkpoint',
    line.lastCleared().id === before);

  line.reset();
  ok('full line reset drops the haunt restart', line.restartPose() === null);

  // ---- one placer; documentary kit; do not restack prior files ------------
  const planting = readFileSync(join(here, 'planting.js'), 'utf8');
  const checkpoints = readFileSync(join(here, 'checkpoints.js'), 'utf8');
  const main = readFileSync(join(here, '../../main.js'), 'utf8');
  const quad = readFileSync(join(here, '../../physics/quad.js'), 'utf8');
  const points = readFileSync(join(here, 'points.js'), 'utf8');
  const fly = readFileSync(join(here, 'landmarks/flythrough.js'), 'utf8');
  const house = readFileSync(join(here, 'landmarks/house.js'), 'utf8');
  const warehouse = readFileSync(join(here, 'landmarks/warehouse.js'), 'utf8');
  const drop = readFileSync(join(here, 'landmarks/drop.js'), 'utf8');
  const abando = readFileSync(join(here, 'landmarks/abando.js'), 'utf8');
  const blades = readFileSync(join(here, 'blades.js'), 'utf8');
  const water = readFileSync(join(here, 'bayWater.js'), 'utf8');
  const preview = readFileSync(join(here, '../../../preview.html'), 'utf8');

  ok('tryPlace is still the placer', planting.includes('export function tryPlace'));
  ok('checkpoints are not a second placer',
    !/export function tryPlace/.test(checkpoints)
    && checkpoints.includes('abandoVoids')
    && checkpoints.includes('RESTART_OFFSET'));
  ok('main uses haunt restart before map spawn',
    main.includes('createHauntLine')
    && main.includes('hauntLine.restartPose')
    && main.includes('hauntLine.notePosition'));
  ok('GRAVITY stays 9.81',
    /const GRAVITY = 9\.81/.test(quad) && !/riderMass/.test(quad) && !/wheelMass/.test(quad));
  ok('no Dirtline rider in checkpoints',
    !/riderMass/.test(checkpoints) && !/wheelMass/.test(checkpoints)
    && !/follow-mode|followMode|ghost rider/i.test(checkpoints));
  ok('no neon / canyon GLB',
    !/\bShaderMaterial\b/.test(checkpoints)
    && !/\bonBeforeCompile\b/.test(checkpoints)
    && !/\.glb/.test(checkpoints)
    && !/new THREE\./.test(checkpoints));
  ok('points.js was not restacked',
    points.includes('retrievalPoints') && !/checkpoint/i.test(points));
  ok('flythrough.js was not restacked',
    fly.includes('buildBoardwalkGate') && !/checkpoint/i.test(fly));
  ok('house was not restacked',
    house.includes('housePlanGeom') && house.includes('weenie')
    && !/checkpoint/i.test(house));
  ok('warehouse was not restacked',
    warehouse.includes('warehouseAisleGeom') && warehouse.includes('buildRacks')
    && !/checkpoint/i.test(warehouse));
  ok('drop was not restacked',
    drop.includes('dropHoistGeom') && drop.includes('buildWell')
    && !/checkpoint/i.test(drop));
  ok('abando was not restacked',
    abando.includes('abandoStairGeom') && abando.includes('buildSilo')
    && !/checkpoint/i.test(abando));
  ok('blades.js was not restacked', blades.includes('placeBladePlan')
    && blades.includes('Craft writes the gust'));
  ok('bay water was not restacked', water.includes('MeshPhysicalMaterial')
    && !water.includes('checkpoint'));
  ok('preview.html was not restacked',
    preview.includes('url=./') && !preview.includes('checkpoint'));

  if (fails.length) {
    console.error('[miami-checkpoint] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-checkpoint] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('checkpointTest.js');
if (isMain) {
  const r = runMiamiCheckpointTests();
  if (!r.passed) process.exit(1);
}
