import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { hash01 } from './rng.js';
import { cBox, cCyl } from './geo.js';
import {
  CITY_Y, BOARDWALK_TOP, BOARDWALK_Z, BOARDWALK_W,
  SW_BEACH_Z0, SW_BEACH_Z1, SW_CITY_Z0, SW_CITY_Z1,
  SHORE_Z, ROAD_Z0, ROAD_Z1, GAP_X, XS_HALF,
  LUMMUS_X0, LUMMUS_X1, LUMMUS_Z, LUMMUS_Y,
  VBALL_X0, VBALL_X1, VBALL_Z0, VBALL_Z1,
  groundHeight, inKeepout, leftoverLotOverlap,
} from './constants.js';

// ============================================================
// Ocean Drive crowd — walkers, bikes, skaters, beach, swimmers.
//
// NOT ped.js. NOT traffic.js. Visual only: no colliders, so a
// whoop through the promenade never eats a capsule. hash01 only;
// never rng/rng2/rng3/rng4. Never stands in a travel lane.
// ============================================================

export const TRAVEL_Z0 = 40.2;
export const TRAVEL_Z1 = 47.8;
export const CROWD_X0 = -360;
export const CROWD_X1 = 400;
export const BIKE_RACK_XS = Object.freeze([-240, -170, -40, 30, 150]);
export const BIKE_RACK_N = 3;
export const LIFEGUARD_SIT_CELLS = Object.freeze([
  [-520, 12.5], [-335, 11.0], [-95, 12.0], [45, 10.5], [235, 13.0], [420, 12.0],
]);
export const LIFEGUARD_DECK = 2.52;
export const FIFTH_WALK_XS = Object.freeze([48.9, 64.7]);
export const ESPA_WALK_X = 235.3;
export const INLAND_WALK_Z0 = 92;
export const INLAND_WALK_Z1 = 168;
const VBALL_PITCH = 26;

const SKIN = [0xf3d4b8, 0xd4a574, 0x8d5524, 0xc68642, 0xffdbac, 0x6b3f2a];
const SHIRT = [0x2a6f9b, 0xe85d4c, 0xf4f1ea, 0x2fe0ff, 0xff3d8b, 0x1d6f7a, 0xf6b01f, 0x2d5a3d];
const SHORT = [0x1a2026, 0x3d4a6b, 0xc4b79a, 0xf0f0f2, 0x2a2a32];

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

function pick(arr, a, b) {
  return arr[(hash01(a, b) * arr.length) | 0];
}

function onCross(x) {
  for (let i = 0; i < GAP_X.length; i++) {
    if (Math.abs(x - GAP_X[i]) <= XS_HALF) return true;
  }
  return false;
}

function inTravelLane(z) {
  return z > TRAVEL_Z0 && z < TRAVEL_Z1;
}

function inCarriageway(z) {
  return z > ROAD_Z0 && z < ROAD_Z1;
}

function wrapX(x) {
  const span = CROWD_X1 - CROWD_X0;
  let u = x;
  while (u < CROWD_X0) u += span;
  while (u > CROWD_X1) u -= span;
  return u;
}

function skipGap(x, dir) {
  if (!onCross(x)) return x;
  return wrapX(x + dir * (XS_HALF * 2 + 1.2));
}

/**
 * Spawn a visual crowd along Ocean Drive / Lummus / the bay.
 * @returns {{ group: THREE.Group, update: function(number): void, actors: object[] }}
 */
export function buildCrowd(ctx) {
  const { root, track } = ctx;
  const actors = [];

  const nWalk = 140;
  const nBike = 32;
  const nSkate = 32;
  const nBeach = 68;
  const nSwim = 36;
  const nSit = 28;
  const nParked = BIKE_RACK_XS.length * BIKE_RACK_N;
  const nVball = 12;
  const nGuard = LIFEGUARD_SIT_CELLS.length;
  const nInland = 36;
  const total = nWalk + nBike + nSkate + nBeach + nSwim + nSit + nParked + nVball + nGuard + nInland;

  const bodyMesh = makeInstanced(track, new THREE.BoxGeometry(0.32, 0.72, 0.2), total);
  const headMesh = makeInstanced(track, new THREE.SphereGeometry(0.13, 8, 6), total);
  const extraMesh = makeInstanced(track, new THREE.BoxGeometry(0.9, 0.08, 0.28), nBike + nSkate + nParked);

  let extraI = 0;

  const beachZ = (SW_BEACH_Z0 + SW_BEACH_Z1) * 0.5;
  const cityZ = (SW_CITY_Z0 + SW_CITY_Z1) * 0.5;

  for (let i = 0; i < nWalk; i++) {
    const side = hash01(i, 7) < 0.42 ? 'boardwalk'
      : hash01(i, 11) < 0.55 ? 'beach-sw'
        : hash01(i, 13) < 0.78 ? 'city-sw' : 'lummus';
    const dir = hash01(i, 17) < 0.5 ? 1 : -1;
    let x = CROWD_X0 + hash01(i, 19) * (CROWD_X1 - CROWD_X0);
    let z, y, yaw;
    if (side === 'boardwalk') {
      z = BOARDWALK_Z + (hash01(i, 23) - 0.5) * 4.2;
      y = BOARDWALK_TOP;
      yaw = dir > 0 ? 0 : Math.PI;
    } else if (side === 'beach-sw') {
      z = beachZ;
      y = CITY_Y + 0.06;
      yaw = dir > 0 ? 0 : Math.PI;
    } else if (side === 'city-sw') {
      z = cityZ;
      y = CITY_Y + 0.06;
      yaw = dir > 0 ? 0 : Math.PI;
    } else {
      x = LUMMUS_X0 + hash01(i, 29) * (LUMMUS_X1 - LUMMUS_X0);
      z = LUMMUS_Z + (hash01(i, 31) - 0.5) * 1.4;
      y = LUMMUS_Y;
      yaw = dir > 0 ? 0 : Math.PI;
    }
    if (inTravelLane(z) || inCarriageway(z) || inKeepout(x, z)) continue;
    actors.push({
      kind: 'walk', i: actors.length, extra: -1,
      x, z, y, dir, yaw, speed: 1.15 + hash01(i, 37) * 0.55,
      phase: hash01(i, 41) * Math.PI * 2,
      shirt: pick(SHIRT, i, 43), skin: pick(SKIN, i, 47),
    });
  }

  for (let i = 0; i < nBike; i++) {
    const dir = hash01(i + 200, 3) < 0.5 ? 1 : -1;
    const x = CROWD_X0 + hash01(i + 200, 5) * (CROWD_X1 - CROWD_X0);
    const z = BOARDWALK_Z + (hash01(i + 200, 7) < 0.5 ? -1.6 : 1.6);
    if (inTravelLane(z) || inCarriageway(z)) continue;
    actors.push({
      kind: 'bike', i: actors.length, extra: extraI++,
      x, z, y: BOARDWALK_TOP, dir, yaw: dir > 0 ? 0 : Math.PI,
      speed: 4.2 + hash01(i + 200, 11) * 1.6,
      phase: hash01(i + 200, 13) * Math.PI * 2,
      shirt: pick(SHIRT, i + 200, 17), skin: pick(SKIN, i + 200, 19),
    });
  }

  for (let i = 0; i < nSkate; i++) {
    const onWalk = hash01(i + 400, 3) < 0.45;
    const dir = hash01(i + 400, 5) < 0.5 ? 1 : -1;
    const x = CROWD_X0 + hash01(i + 400, 7) * (CROWD_X1 - CROWD_X0);
    const z = onWalk
      ? cityZ
      : BOARDWALK_Z + (hash01(i + 400, 11) - 0.5) * 3.2;
    const y = onWalk ? CITY_Y + 0.06 : BOARDWALK_TOP;
    if (inTravelLane(z) || inCarriageway(z)) continue;
    actors.push({
      kind: 'skate', i: actors.length, extra: extraI++,
      x, z, y, dir, yaw: dir > 0 ? 0 : Math.PI,
      speed: 3.4 + hash01(i + 400, 13) * 1.3,
      phase: hash01(i + 400, 17) * Math.PI * 2,
      shirt: pick(SHIRT, i + 400, 19), skin: pick(SKIN, i + 400, 23),
    });
  }

  for (let i = 0; i < nBeach; i++) {
    const x = -220 + hash01(i + 600, 3) * 480;
    const z = -16 + hash01(i + 600, 5) * 34;
    if (inTravelLane(z) || inCarriageway(z) || inKeepout(x, z)) continue;
    if (z < SHORE_Z + 1.5) continue;
    if (x >= VBALL_X0 && x <= VBALL_X1 && z >= VBALL_Z0 && z <= VBALL_Z1) continue;
    const y = groundHeight(x, z);
    actors.push({
      kind: 'beach', i: actors.length, extra: -1,
      x, z, y, dir: 0, yaw: hash01(i + 600, 7) * Math.PI * 2,
      speed: hash01(i + 600, 11) < 0.35 ? 0.85 : 0,
      phase: hash01(i + 600, 13) * Math.PI * 2,
      shirt: pick(SHIRT, i + 600, 17), skin: pick(SKIN, i + 600, 19),
    });
  }

  for (let i = 0; i < nSwim; i++) {
    const x = -180 + hash01(i + 800, 3) * 420;
    const z = -58 + hash01(i + 800, 5) * 22;
    if (z > SHORE_Z - 2) continue;
    actors.push({
      kind: 'swim', i: actors.length, extra: -1,
      x, z, y: -0.45, dir: hash01(i + 800, 7) < 0.5 ? 1 : -1,
      yaw: hash01(i + 800, 11) * Math.PI * 2,
      speed: 0.55 + hash01(i + 800, 13) * 0.4,
      phase: hash01(i + 800, 17) * Math.PI * 2,
      shirt: pick(SHIRT, i + 800, 19), skin: pick(SKIN, i + 800, 23),
    });
  }

  for (let i = 0; i < nSit; i++) {
    const x = -90 + hash01(i + 900, 3) * 220;
    const z = BOARDWALK_Z + (hash01(i + 900, 5) < 0.5 ? -3.1 : 3.1);
    if (inTravelLane(z) || inCarriageway(z) || inKeepout(x, z)) continue;
    actors.push({
      kind: 'sit', i: actors.length, extra: -1,
      x, z, y: BOARDWALK_TOP, dir: 0,
      yaw: z < BOARDWALK_Z ? Math.PI : 0,
      speed: 0, phase: hash01(i + 900, 7) * Math.PI * 2,
      shirt: pick(SHIRT, i + 900, 11), skin: pick(SKIN, i + 900, 13),
    });
  }

  for (let i = 0; i < nParked; i++) {
    const rack = BIKE_RACK_XS[(i / BIKE_RACK_N) | 0];
    const slot = i % BIKE_RACK_N;
    const x = rack + (slot - 1) * 0.7;
    const z = cityZ;
    if (inTravelLane(z) || inCarriageway(z) || inKeepout(x, z)) continue;
    actors.push({
      kind: 'parked', i: actors.length, extra: extraI++,
      x, z, y: CITY_Y + 0.06, dir: 0,
      yaw: slot === 1 ? Math.PI : 0,
      speed: 0, phase: hash01(i + 1100, 3) * Math.PI * 2,
      shirt: pick(SHIRT, i + 1100, 5), skin: pick(SKIN, i + 1100, 7),
    });
  }

  for (let i = 0; i < nVball; i++) {
    const court = i % 3;
    const cx = VBALL_X0 + 13 + court * VBALL_PITCH;
    const cz = VBALL_Z0 + 8 + (court % 2 ? 1.6 : 0);
    const side = i < 6 ? -1 : 1;
    const x = cx + side * (3.2 + hash01(i + 1200, 3) * 2.4);
    const z = cz + (hash01(i + 1200, 5) - 0.5) * 5.2;
    if (inTravelLane(z) || inCarriageway(z)) continue;
    actors.push({
      kind: 'vball', i: actors.length, extra: -1,
      x, z, y: groundHeight(x, z), dir: 0,
      yaw: side > 0 ? Math.PI : 0,
      speed: 0, phase: hash01(i + 1200, 7) * Math.PI * 2,
      shirt: pick(SHIRT, i + 1200, 11), skin: pick(SKIN, i + 1200, 13),
    });
  }

  for (let i = 0; i < nGuard; i++) {
    const [gx, gz] = LIFEGUARD_SIT_CELLS[i];
    const z = gz - 0.55;
    if (inTravelLane(z) || inCarriageway(z)) continue;
    actors.push({
      kind: 'guard', i: actors.length, extra: -1,
      x: gx, z, y: groundHeight(gx, gz) + LIFEGUARD_DECK, dir: 0,
      yaw: 0, speed: 0, phase: hash01(i + 1300, 3) * Math.PI * 2,
      shirt: pick(SHIRT, i + 1300, 5), skin: pick(SKIN, i + 1300, 7),
    });
  }

  const inlandXs = [FIFTH_WALK_XS[0], FIFTH_WALK_XS[1], ESPA_WALK_X];
  for (let i = 0; i < nInland; i++) {
    const x = inlandXs[i % inlandXs.length];
    const z = INLAND_WALK_Z0 + hash01(i + 1400, 3) * (INLAND_WALK_Z1 - INLAND_WALK_Z0);
    const dir = hash01(i + 1400, 5) < 0.5 ? 1 : -1;
    if (inTravelLane(z) || inCarriageway(z) || inKeepout(x, z)) continue;
    if (leftoverLotOverlap(x, z, 0.6, 0.6, 0.15)) continue;
    if (x >= 240 && leftoverLotOverlap(x, z, 0.6, 0.6, 0.15)) continue;
    actors.push({
      kind: 'inland', i: actors.length, extra: -1,
      x, z, y: CITY_Y + 0.06, dir,
      yaw: dir > 0 ? Math.PI / 2 : -Math.PI / 2,
      speed: 1.05 + hash01(i + 1400, 7) * 0.45,
      phase: hash01(i + 1400, 11) * Math.PI * 2,
      shirt: pick(SHIRT, i + 1400, 13), skin: pick(SKIN, i + 1400, 17),
    });
  }

  buildBikeRacks(root, track, cityZ);

  // Re-index after skips so instance slots stay dense.
  const used = actors.length;
  bodyMesh.count = used;
  headMesh.count = used;
  extraMesh.count = extraI;

  const group = new THREE.Group();
  group.name = 'ocean-drive-crowd';
  group.add(bodyMesh);
  group.add(headMesh);
  group.add(extraMesh);
  root.add(group);

  const state = { bodyMesh, headMesh, extraMesh, actors, t: 0 };
  stampAll(state);

  return {
    group,
    actors,
    update(dt) {
      state.t += dt;
      stepActors(state, dt);
      stampAll(state);
    },
  };
}

function makeInstanced(track, geo, count) {
  const mat = track(new THREE.MeshStandardMaterial({
    vertexColors: false, roughness: 0.78, metalness: 0.02,
  }));
  const mesh = new THREE.InstancedMesh(track(geo), mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

function stepActors(state, dt) {
  const { actors } = state;
  for (let i = 0; i < actors.length; i++) {
    const a = actors[i];
    if (a.kind === 'sit' || a.kind === 'parked' || a.kind === 'guard') continue;
    if (a.kind === 'vball') continue;
    if (a.kind === 'beach' && a.speed === 0) continue;
    if (a.kind === 'inland') {
      a.z += a.dir * a.speed * dt;
      if (a.z > INLAND_WALK_Z1) { a.z = INLAND_WALK_Z1; a.dir = -1; a.yaw = -Math.PI / 2; }
      if (a.z < INLAND_WALK_Z0) { a.z = INLAND_WALK_Z0; a.dir = 1; a.yaw = Math.PI / 2; }
      if (inTravelLane(a.z) || inCarriageway(a.z)) {
        a.dir *= -1;
        a.yaw = a.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      continue;
    }
    if (a.kind === 'swim') {
      a.x = wrapX(a.x + Math.cos(a.yaw) * a.speed * dt);
      a.z += Math.sin(a.yaw) * a.speed * dt * 0.35;
      if (a.z > SHORE_Z - 2) { a.z = SHORE_Z - 2; a.yaw += Math.PI; }
      if (a.z < -62) { a.z = -62; a.yaw += Math.PI; }
      a.y = -0.45 + Math.sin(state.t * 2.2 + a.phase) * 0.12;
      continue;
    }
    a.x = wrapX(a.x + a.dir * a.speed * dt);
    a.x = skipGap(a.x, a.dir);
    if (a.kind === 'walk' || a.kind === 'beach') {
      a.y += Math.sin(state.t * 8 + a.phase) * 0; // y stays on the path
    }
  }
}

function stampAll(state) {
  const { bodyMesh, headMesh, extraMesh, actors, t } = state;
  for (let i = 0; i < actors.length; i++) {
    const a = actors[i];
    const bob = (a.kind === 'walk' || a.kind === 'skate' || a.kind === 'vball'
      || a.kind === 'inland' || (a.kind === 'beach' && a.speed))
      ? Math.abs(Math.sin(t * (a.kind === 'skate' ? 10 : a.kind === 'vball' ? 5 : 7) + a.phase)) * 0.06
      : a.kind === 'bike' ? Math.sin(t * 12 + a.phase) * 0.02
        : 0;
    const crouch = (a.kind === 'sit' || a.kind === 'guard') ? 0.28
      : a.kind === 'swim' ? 0.12 : a.kind === 'parked' ? 0.22 : 0.36;
    const bodyY = a.kind === 'swim' ? a.y : a.y + crouch + bob;
    const rx = a.kind === 'swim' ? Math.PI / 2 : 0;

    _dummy.position.set(a.x, bodyY, a.z);
    _dummy.rotation.set(rx, a.yaw, 0);
    _dummy.scale.set(1, (a.kind === 'sit' || a.kind === 'guard') ? 0.72 : 1, 1);
    _dummy.updateMatrix();
    bodyMesh.setMatrixAt(i, _dummy.matrix);
    _color.setHex(a.shirt);
    if (bodyMesh.setColorAt) bodyMesh.setColorAt(i, _color);

    _dummy.position.set(a.x, a.kind === 'swim' ? a.y + 0.35 : bodyY + 0.48, a.z);
    _dummy.rotation.set(rx, a.yaw, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    headMesh.setMatrixAt(i, _dummy.matrix);
    _color.setHex(a.skin);
    if (headMesh.setColorAt) headMesh.setColorAt(i, _color);

    if (a.extra >= 0) {
      const ez = a.kind === 'bike' ? 0.55 : 0.22;
      _dummy.position.set(a.x, a.y + 0.12, a.z);
      _dummy.rotation.set(0, a.yaw, 0);
      _dummy.scale.set(a.kind === 'skate' ? 0.7 : 1.1, 1, a.kind === 'skate' ? 1.1 : 0.45);
      _dummy.updateMatrix();
      extraMesh.setMatrixAt(a.extra, _dummy.matrix);
      _color.setHex(a.kind === 'skate' ? pick(SHORT, a.i, 3) : 0x1a1c22);
      if (extraMesh.setColorAt) extraMesh.setColorAt(a.extra, _color);
      void ez;
    }
  }
  bodyMesh.instanceMatrix.needsUpdate = true;
  headMesh.instanceMatrix.needsUpdate = true;
  extraMesh.instanceMatrix.needsUpdate = true;
  if (bodyMesh.instanceColor) bodyMesh.instanceColor.needsUpdate = true;
  if (headMesh.instanceColor) headMesh.instanceColor.needsUpdate = true;
  if (extraMesh.instanceColor) extraMesh.instanceColor.needsUpdate = true;
}

function buildBikeRacks(root, track, cityZ) {
  const IRON = 0x4a5158;
  const bits = [];
  for (let i = 0; i < BIKE_RACK_XS.length; i++) {
    const x = BIKE_RACK_XS[i];
    const z = cityZ;
    if (inTravelLane(z) || inCarriageway(z)) continue;
    const y = CITY_Y + 0.06;
    bits.push(cCyl(0.03, 0.03, 0.85, 6, IRON, x - 1.1, y + 0.42, z));
    bits.push(cCyl(0.03, 0.03, 0.85, 6, IRON, x + 1.1, y + 0.42, z));
    bits.push(cBox(2.3, 0.05, 0.05, IRON, x, y + 0.38, z));
    bits.push(cBox(2.3, 0.05, 0.05, IRON, x, y + 0.62, z));
  }
  if (!bits.length) return;
  const geo = track(mergeGeometries(bits));
  bits.forEach((g) => g.dispose());
  const mesh = new THREE.Mesh(geo, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.45, metalness: 0.5,
  })));
  mesh.name = 'bike-racks';
  root.add(mesh);
}

/** True when a crowd actor would be illegal (travel lane / carriageway). */
export function crowdPointIllegal(z) {
  return inTravelLane(z) || inCarriageway(z);
}
