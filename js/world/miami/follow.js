// ============================================================
// Miami follow practice — documentary ghost on the haunt line.
//
// Camera job, not a second HUD. The reserved checkpoint table is
// the path (abando stair/sash → drop well/door → warehouse VNA/dock
// → house stair/window). No fifth haunt, no second line, no chase
// cam, no extra OSD. GRAVITY stays 9.81 — this file does not touch
// quad.js. Restart / R stays on createHauntLine (0.6 m past the lip).
// ============================================================
import { inKeepout } from './constants.js';
import { createHauntLine, hauntCheckpointTable } from './checkpoints.js';

/** Documentary jog / easy roll. Not a race clock. */
export const GHOST_SPEED = 4.2;

/**
 * Visual AABB about the path sample (origin = torso).
 * Rider is the weenie; muted stucco / drab, no emissive.
 */
export const GHOST_VISUAL = {
  halfW: 0.30,
  halfH: 0.84,
  halfD: 0.16,
  cloth: 0x6e5c4a,
  canvas: 0x8a7a64,
  shade: 0x4a4038,
  skin: 0x9a806c,
};

/** Sphere at the torso. Must sit inside GHOST_VISUAL. */
export const GHOST_COLLIDER = {
  radius: 0.16,
  y: 0.04,
};

const MAT_HEX = {
  cloth: GHOST_VISUAL.cloth,
  canvas: GHOST_VISUAL.canvas,
  shade: GHOST_VISUAL.shade,
  skin: GHOST_VISUAL.skin,
};

/** Box parts in local space. Each box ⊆ GHOST_VISUAL. */
export const GHOST_PARTS = [
  { id: 'torso', sx: 0.34, sy: 0.46, sz: 0.18, x: 0, y: 0.12, z: 0, mat: 'cloth' },
  { id: 'pelvis', sx: 0.30, sy: 0.14, sz: 0.16, x: 0, y: -0.14, z: 0, mat: 'canvas' },
  { id: 'head', sx: 0.16, sy: 0.18, sz: 0.16, x: 0, y: 0.50, z: 0.01, mat: 'skin' },
  { id: 'helm', sx: 0.18, sy: 0.09, sz: 0.17, x: 0, y: 0.61, z: 0.01, mat: 'shade' },
  { id: 'legL', sx: 0.11, sy: 0.50, sz: 0.13, x: -0.08, y: -0.48, z: 0, mat: 'canvas' },
  { id: 'legR', sx: 0.11, sy: 0.50, sz: 0.13, x: 0.08, y: -0.48, z: 0, mat: 'canvas' },
  { id: 'armL', sx: 0.09, sy: 0.40, sz: 0.09, x: -0.22, y: 0.10, z: 0, mat: 'cloth' },
  { id: 'armR', sx: 0.09, sy: 0.40, sz: 0.09, x: 0.22, y: 0.10, z: 0, mat: 'cloth' },
];

function yawFacing(dx, dz) {
  const len = Math.hypot(dx, dz);
  if (len < 1e-9) return 0;
  return Math.atan2(dx / len, -dz / len);
}

function pushPoint(points, cp, kind) {
  const src = kind === 'restart' ? cp.restart : cp.gate;
  points.push({
    x: src.x, y: src.y, z: src.z,
    id: cp.id, kind, haunt: cp.haunt,
    yawRad: cp.restart.yawRad,
  });
}

/**
 * Sample the published haunt table as a path.
 * Intra-haunt: gate → restart of each last lip, then the next lip.
 * Inter-haunt: cut (no city lerp — ghost stays on the reserved corridor).
 */
export function hauntFollowPath() {
  const line = createHauntLine();
  const table = line.table;
  const legs = [];
  let haunt = null;
  let points = null;
  for (let i = 0; i < table.length; i++) {
    const cp = table[i];
    if (cp.haunt !== haunt) {
      if (points) legs.push({ haunt, points });
      haunt = cp.haunt;
      points = [];
    }
    pushPoint(points, cp, 'gate');
    pushPoint(points, cp, 'restart');
  }
  if (points) legs.push({ haunt, points });
  return { table, legs, line };
}

export function sampleHauntFollowPath(stepM = 0.25) {
  const path = hauntFollowPath();
  const samples = [];
  const step = Math.max(0.05, stepM);
  for (let li = 0; li < path.legs.length; li++) {
    const leg = path.legs[li];
    for (let i = 0; i < leg.points.length - 1; i++) {
      const a = leg.points[i];
      const b = leg.points[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      const len = Math.hypot(dx, dy, dz);
      const n = Math.max(1, Math.ceil(len / step));
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        samples.push({
          x: a.x + dx * t,
          y: a.y + dy * t,
          z: a.z + dz * t,
          haunt: a.haunt,
          id: t < 1 ? a.id : b.id,
        });
      }
    }
  }
  return { path, samples };
}

function emptyGhost() {
  const pos = { x: 0, y: 0, z: 0 };
  return {
    position() { return pos; },
    yawRad() { return 0; },
    haunt() { return null; },
    checkpointId() { return null; },
    step() { return pos; },
    reset() {},
  };
}

/** Kinematic ghost. Stays on hauntFollowPath; no rider-spring, no quad.js. */
export function createHauntGhost(path = hauntFollowPath()) {
  const segs = [];
  const legs = path && path.legs ? path.legs : [];
  for (let li = 0; li < legs.length; li++) {
    const leg = legs[li];
    for (let i = 0; i < leg.points.length - 1; i++) {
      const a = leg.points[i];
      const b = leg.points[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      const len = Math.hypot(dx, dy, dz);
      const yaw = Math.hypot(dx, dz) > 1e-9 ? yawFacing(dx, dz) : (a.yawRad || 0);
      segs.push({ a, b, len, yaw, haunt: leg.haunt });
    }
  }
  if (!segs.length) return emptyGhost();

  let si = 0;
  let along = 0;
  const pos = { x: segs[0].a.x, y: segs[0].a.y, z: segs[0].a.z };
  let yaw = segs[0].yaw;

  function place() {
    const s = segs[si];
    const t = s.len > 1e-9 ? along / s.len : 0;
    pos.x = s.a.x + (s.b.x - s.a.x) * t;
    pos.y = s.a.y + (s.b.y - s.a.y) * t;
    pos.z = s.a.z + (s.b.z - s.a.z) * t;
    yaw = s.yaw;
  }

  return {
    position() { return pos; },
    yawRad() { return yaw; },
    haunt() { return segs[si].haunt; },
    checkpointId() { return segs[si].a.id; },
    step(dt) {
      let remain = GHOST_SPEED * Math.max(0, dt);
      while (remain > 0) {
        const s = segs[si];
        const left = s.len - along;
        if (remain < left || left <= 1e-12) {
          along = Math.min(s.len, along + remain);
          remain = 0;
        } else {
          remain -= Math.max(left, 0);
          si = (si + 1) % segs.length;
          along = 0;
        }
      }
      place();
      return pos;
    },
    reset() { si = 0; along = 0; place(); },
  };
}

export function ghostPartExtents(part) {
  return {
    x0: part.x - part.sx / 2, x1: part.x + part.sx / 2,
    y0: part.y - part.sy / 2, y1: part.y + part.sy / 2,
    z0: part.z - part.sz / 2, z1: part.z + part.sz / 2,
  };
}

export function ghostVisualContainsCollider() {
  const v = GHOST_VISUAL;
  const c = GHOST_COLLIDER;
  return c.radius <= v.halfW + 1e-9
      && c.radius <= v.halfD + 1e-9
      && (c.y - c.radius) >= -v.halfH - 1e-9
      && (c.y + c.radius) <= v.halfH + 1e-9;
}

export function ghostVisualContainsParts() {
  const v = GHOST_VISUAL;
  for (let i = 0; i < GHOST_PARTS.length; i++) {
    const e = ghostPartExtents(GHOST_PARTS[i]);
    if (e.x0 < -v.halfW - 1e-9 || e.x1 > v.halfW + 1e-9) return false;
    if (e.y0 < -v.halfH - 1e-9 || e.y1 > v.halfH + 1e-9) return false;
    if (e.z0 < -v.halfD - 1e-9 || e.z1 > v.halfD + 1e-9) return false;
  }
  return true;
}

export function ghostColliderWorld(ghost) {
  const p = ghost.position();
  return {
    x: p.x,
    y: p.y + GHOST_COLLIDER.y,
    z: p.z,
    r: GHOST_COLLIDER.radius,
  };
}

export function ghostOnReserved(ghost, margin = 0) {
  const p = ghost.position();
  return inKeepout(p.x, p.z, margin);
}

/**
 * Quiet documentary figure. THREE is passed in so this module stays
 * importable from the headless harness. No ShaderMaterial, no chase cam.
 */
export function attachFollowGhost(THREE, scene, ghost) {
  const geos = [];
  const mats = [];
  const matCache = Object.create(null);
  const material = (key) => {
    if (matCache[key]) return matCache[key];
    const m = new THREE.MeshStandardMaterial({
      color: MAT_HEX[key],
      roughness: 0.92,
      metalness: 0.04,
    });
    matCache[key] = m;
    mats.push(m);
    return m;
  };

  const group = new THREE.Group();
  group.name = 'pw-follow-ghost';
  for (let i = 0; i < GHOST_PARTS.length; i++) {
    const p = GHOST_PARTS[i];
    const geo = new THREE.BoxGeometry(p.sx, p.sy, p.sz);
    geos.push(geo);
    const mesh = new THREE.Mesh(geo, material(p.mat));
    mesh.position.set(p.x, p.y, p.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  scene.add(group);

  const sync = () => {
    const p = ghost.position();
    group.position.set(p.x, p.y, p.z);
    group.rotation.y = ghost.yawRad();
  };
  sync();

  return {
    group,
    sync,
    dispose() {
      scene.remove(group);
      for (let i = 0; i < geos.length; i++) geos[i].dispose();
      for (let i = 0; i < mats.length; i++) mats[i].dispose();
    },
  };
}

/**
 * Mode object consumed by ModeManager. Chrome stays quiet:
 * no mode:objective, no follow HUD, camera stays FPV.
 */
export function createFollowMode(THREE, scene) {
  const path = hauntFollowPath();
  const live = path.table.length > 0;
  const ghost = live ? createHauntGhost(path) : null;
  const viz = ghost ? attachFollowGhost(THREE, scene, ghost) : null;
  return {
    ghost,
    update(dt) {
      if (!ghost) return;
      ghost.step(dt);
      viz.sync();
    },
    dispose() {
      viz?.dispose();
    },
  };
}

// Re-export the table factory so the harness can prove we did not invent a line.
export { hauntCheckpointTable, createHauntLine };
