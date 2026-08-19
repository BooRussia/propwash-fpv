// ============================================================
// Miami haunt line — Dirtline-style checkpoints on existing voids.
//
// Not a fifth haunt. Not race gates (points.js). Not the promenade
// fly-through kit. Last lip of each reserved haunt is a checkpoint;
// crash / R restarts 0.6 m past that lip (Dirtline: gate 55.0 →
// spawn 55.6), never a full reset to the map pad.
//
// Geometry is borrowed from abandoVoids / dropVoids / warehouseVoids /
// houseVoids. No new opening, no second placer, no neon, no canyon GLB.
// GRAVITY stays 9.81 — this file does not touch quad.js.
// ============================================================
import {
  abandoVoids,
  dropVoids,
  warehouseVoids,
  houseVoids,
} from './constants.js';

/** Dirtline restart offset: past the gate, not in the mouth. */
export const RESTART_OFFSET = 0.6;

/**
 * Last void / lip of each haunt. Drop-in mouths (bay, hoistway, wide /
 * narrow / sash, door / hall) stay openings — they are not checkpoints.
 * `axis` + `sign` is the documented fly-through: through the lip, along
 * the existing line. Restart = gate + sign * RESTART_OFFSET on that axis.
 */
const LAST_LIPS = [
  { haunt: 'abando', kind: 'stair', axis: 'z', sign: 1 },
  { haunt: 'abando', kind: 'sash', axis: 'z', sign: 1 },
  { haunt: 'drop', kind: 'well', axis: 'y', sign: -1 },
  { haunt: 'drop', kind: 'door', axis: 'x', sign: 1 },
  { haunt: 'warehouse', kind: 'vna', axis: 'z', sign: 1 },
  { haunt: 'warehouse', kind: 'dock', axis: 'z', sign: 1 },
  { haunt: 'house', kind: 'stair', axis: 'z', sign: 1 },
  { haunt: 'house', kind: 'window', axis: 'z', sign: 1 },
];

const VOID_SOURCE = {
  abando: abandoVoids,
  drop: dropVoids,
  warehouse: warehouseVoids,
  house: houseVoids,
};

/** Body-forward is local −Z. yaw 0 faces −Z; +π/2 faces +X. */
function yawFacing(dx, dz) {
  const len = Math.hypot(dx, dz);
  if (len < 1e-9) return 0;
  return Math.atan2(dx / len, -dz / len);
}

function makeCheckpoint(spec, v) {
  const restart = { x: v.x, y: v.y, z: v.z };
  restart[spec.axis] = v[spec.axis] + spec.sign * RESTART_OFFSET;
  const dx = spec.axis === 'x' ? spec.sign : 0;
  const dz = spec.axis === 'z' ? spec.sign : 0;
  return {
    id: v.id,
    haunt: spec.haunt,
    kind: v.kind,
    axis: spec.axis,
    sign: spec.sign,
    gate: { x: v.x, y: v.y, z: v.z },
    restart: {
      x: restart.x,
      y: restart.y,
      z: restart.z,
      yawRad: yawFacing(dx, dz),
    },
    x0: v.x0, x1: v.x1,
    y0: v.y0, y1: v.y1,
    z0: v.z0, z1: v.z1,
  };
}

/** Published checkpoint table. One row per last-lip void. */
export function hauntCheckpointTable() {
  const table = [];
  for (let i = 0; i < LAST_LIPS.length; i++) {
    const spec = LAST_LIPS[i];
    const voids = VOID_SOURCE[spec.haunt]();
    for (let j = 0; j < voids.length; j++) {
      const v = voids[j];
      if (v.kind === spec.kind) table.push(makeCheckpoint(spec, v));
    }
  }
  return table;
}

export function pointInCheckpoint(cp, x, y, z) {
  return x >= cp.x0 && x <= cp.x1
      && y >= cp.y0 && y <= cp.y1
      && z >= cp.z0 && z <= cp.z1;
}

/**
 * Session tracker. notePosition marks the last cleared lip.
 * restartPose() is that lip + 0.6 m — or null so the caller keeps map spawn.
 */
export function createHauntLine() {
  const table = hauntCheckpointTable();
  let last = null;
  return {
    table,
    lastCleared() { return last; },
    notePosition(x, y, z) {
      let hit = null;
      for (let i = 0; i < table.length; i++) {
        if (pointInCheckpoint(table[i], x, y, z)) hit = table[i];
      }
      if (hit && (!last || last.id !== hit.id)) {
        last = hit;
        return hit;
      }
      return null;
    },
    restartPose() {
      return last ? last.restart : null;
    },
    reset() { last = null; },
  };
}
