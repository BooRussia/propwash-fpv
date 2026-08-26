// Ocean Drive 2D site plan — parse, travel-lane guard, 3D bake.
// The JSON at assets/catalog/miami-ocean-drive-plan.json is the source of
// truth for paint + corridor stamps. Does not draw rng/rng2/rng3/rng4.

import * as THREE from 'three';
import {
  CITY_Y, ROAD_Z, GAP_X, CROSS_X,
} from './constants.js';
import { setAoUVs } from './textures.js';
import {
  buildMailboxGeo,
  buildDogBagDispenserGeo,
  buildStreetFountainGeo,
} from './props/sidewalk-furniture.js';
import {
  buildBollardSteelGeo,
  buildPedSignalGeo,
} from './props/traffic-control.js';
import { buildCurbRampGeo } from './props/stairs-entry.js';
import { buildTreeGrateGeo } from './props/planting-landscape.js';
import {
  buildTrafficCabinetGeo,
  buildManholeCoverGeo,
} from './props/utilities-power.js';

export const PLAN_URL = 'assets/catalog/miami-ocean-drive-plan.json';

/** Travel lanes + yellow median. Solids may not sit here (flush paint/gutters ok). */
export const TRAVEL_Z0 = 40.2;
export const TRAVEL_Z1 = 47.8;

export function parseSitePlan(data) {
  if (!data || data.version !== 1 || data.crs !== 'miami-xz-meters') {
    throw new Error('ocean-drive site plan v1 / miami-xz-meters required');
  }
  return data;
}

export function isTravelLane(z) {
  return z > TRAVEL_Z0 && z < TRAVEL_Z1;
}

export function assertPlan(plan) {
  const fails = [];
  const stamps = plan.stamps || [];
  for (let i = 0; i < stamps.length; i++) {
    const s = stamps[i];
    if (!s || !s.id || !Number.isFinite(s.x) || !Number.isFinite(s.z)) {
      fails.push(`stamp[${i}] missing id/x/z`);
      continue;
    }
    if (s.flush) continue;
    if (isTravelLane(s.z)) fails.push(`${s.id} @ ${s.x.toFixed(1)},${s.z.toFixed(1)} sits in a travel lane`);
  }
  const paint = plan.paint || [];
  for (let i = 0; i < paint.length; i++) {
    const p = paint[i];
    if (!p || !p.kind) fails.push(`paint[${i}] missing kind`);
  }
  return fails;
}

function paintMat(track, hex) {
  return track(new THREE.MeshStandardMaterial({
    color: hex, roughness: 0.6, metalness: 0, depthWrite: false,
  }));
}

function addPlate(root, track, w, d, x, y, z, mat) {
  const g = track(new THREE.PlaneGeometry(w, d));
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  m.receiveShadow = true;
  root.add(m);
  return m;
}

/**
 * Bake plan paint on top of the asphalt. Replaces guessed dashes in road.js.
 */
export function bakePlanPaint(ctx, plan) {
  const { root, track } = ctx;
  const Y = CITY_Y + 0.082;
  const white = paintMat(track, 0xe9e9e2);
  const yellow = paintMat(track, 0xe8c545);
  const m4 = new THREE.Matrix4();

  const strips = (plan.paint || []).filter((p) => p.kind === 'strip');
  for (const p of strips) {
    const mat = p.color === 'yellow' ? yellow : white;
    addPlate(root, track, p.w, p.d, p.x, Y, p.z, mat);
  }

  const dashes = (plan.paint || []).filter((p) => p.kind === 'dash');
  if (dashes.length) {
    const geo = track(new THREE.PlaneGeometry(3.2, 0.1));
    geo.rotateX(-Math.PI / 2);
    const im = new THREE.InstancedMesh(geo, white, dashes.length);
    im.name = 'plan-lane-dashes';
    for (let i = 0; i < dashes.length; i++) {
      m4.makeTranslation(dashes[i].x, Y, dashes[i].z);
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
    im.receiveShadow = true;
    root.add(im);
  }

  const ticks = (plan.paint || []).filter((p) => p.kind === 'stall-tick');
  if (ticks.length) {
    const geo = track(new THREE.PlaneGeometry(0.1, 2.15));
    geo.rotateX(-Math.PI / 2);
    const im = new THREE.InstancedMesh(geo, white, ticks.length);
    im.name = 'plan-stall-ticks';
    for (let i = 0; i < ticks.length; i++) {
      m4.makeTranslation(ticks[i].x, Y, ticks[i].z);
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
    im.receiveShadow = true;
    root.add(im);
  }

  const zebras = (plan.paint || []).filter((p) => p.kind === 'zebra-bar');
  if (zebras.length) {
    const geo = track(new THREE.BoxGeometry(3.6, 0.022, 0.62));
    const im = new THREE.InstancedMesh(geo, white, zebras.length);
    im.name = 'plan-zebras';
    for (let i = 0; i < zebras.length; i++) {
      m4.makeTranslation(zebras[i].x, CITY_Y + 0.072, zebras[i].z);
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
    im.receiveShadow = true;
    root.add(im);
  }

  const bars = (plan.paint || []).filter((p) => p.kind === 'stop-bar');
  if (bars.length) {
    const geo = track(new THREE.BoxGeometry(0.45, 0.02, 3.4));
    const im = new THREE.InstancedMesh(geo, white, bars.length);
    im.name = 'plan-stop-bars';
    for (let i = 0; i < bars.length; i++) {
      m4.makeTranslation(bars[i].x, CITY_Y + 0.072, bars[i].z);
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
    root.add(im);
  }

  void ROAD_Z;
  void GAP_X;
  void CROSS_X;
  void setAoUVs;
}

/**
 * Bake flush manholes / gutter stamps that are tagged flush:true.
 * Other corridor furniture is stamped by bakePlanStamps.
 */
export function bakePlanFlush(ctx, plan, builders) {
  const { root, track } = ctx;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);
  const byId = new Map();
  for (const st of plan.stamps || []) {
    if (!st.flush) continue;
    const list = byId.get(st.id) || [];
    list.push(st);
    byId.set(st.id, list);
  }
  for (const [id, list] of byId) {
    const spec = builders[id];
    if (!spec || typeof spec.geo !== 'function') continue;
    const geo = track(spec.geo());
    const mat = track(spec.mat ? spec.mat() : new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.72, metalness: 0.08,
    }));
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    im.name = `plan-${id}`;
    for (let i = 0; i < list.length; i++) {
      const st = list[i];
      p.set(st.x, st.y != null ? st.y : CITY_Y + 0.07, st.z);
      q.setFromAxisAngle(up, st.yaw || 0);
      m4.compose(p, q, s);
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
    root.add(im);
  }
}

export function bakePlanStamps(ctx, plan, builders) {
  const { root, track, addCyl, addCollider } = ctx;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const svec = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const byId = new Map();
  for (const st of plan.stamps || []) {
    if (st.flush) continue;
    const list = byId.get(st.id) || [];
    list.push(st);
    byId.set(st.id, list);
  }
  for (const [id, list] of byId) {
    const spec = builders[id];
    if (!spec || typeof spec.geo !== 'function') continue;
    const geo = track(spec.geo());
    const mat = track(spec.mat ? spec.mat() : new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.72, metalness: 0.08,
    }));
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    im.name = `plan-${id}`;
    im.castShadow = true;
    for (let i = 0; i < list.length; i++) {
      const st = list[i];
      const sc = st.scale == null ? 1 : st.scale;
      p.set(st.x, st.y != null ? st.y : CITY_Y, st.z);
      q.setFromAxisAngle(up, st.yaw || 0);
      svec.set(sc, sc, sc);
      m4.compose(p, q, svec);
      im.setMatrixAt(i, m4);
      if (spec.collider === 'cyl' && addCyl) {
        addCyl(st.x, p.y, st.z, spec.r || 0.15, spec.h || 1);
      } else if (spec.collider === 'box' && addCollider) {
        addCollider(st.x, p.y, st.z, spec.w || 0.5, spec.h || 1, spec.d || 0.5);
      }
    }
    im.instanceMatrix.needsUpdate = true;
    root.add(im);
  }
}

/**
 * Catalog-id → bake spec for bakePlanStamps / bakePlanFlush.
 * Skipped (street.js builders are not exported, or already instanced):
 *   gooseneck-lamp — buildStreet already instances the gooseneck poles
 *   deco-lamp, bench-slat, bin-drum, hydrant, meter, newsbox, bike-rack
 *   stop-sign — Kenney GLB; kenneyDressing already scatters stop_sign
 *   traffic-signal — authored in road.js
 */
export function sitePlanBuilders() {
  return {
    'mail-box': { geo: buildMailboxGeo, collider: 'box', w: 0.55, h: 1.3, d: 0.5 },
    'dog-bag': { geo: buildDogBagDispenserGeo, collider: 'cyl', r: 0.08, h: 1.1 },
    'water-fountain': { geo: buildStreetFountainGeo, collider: 'cyl', r: 0.28, h: 0.95 },
    'bollard': { geo: buildBollardSteelGeo, collider: 'cyl', r: 0.12, h: 1.05 },
    'ped-signal': { geo: buildPedSignalGeo, collider: 'box', w: 0.35, h: 0.7, d: 0.2 },
    'ramp': { geo: buildCurbRampGeo, collider: 'box', w: 1.68, h: 0.22, d: 2.24 },
    'tree-grate': { geo: buildTreeGrateGeo },
    'traffic-cabinet': { geo: buildTrafficCabinetGeo, collider: 'box', w: 0.7, h: 1.35, d: 0.5 },
    'manhole': { geo: buildManholeCoverGeo },
  };
}
