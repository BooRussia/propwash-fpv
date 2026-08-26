import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { hash01 } from '../rng.js';
import {
  CITY_Y, SW_H, CURB_H,
  WASH_Z, WASH_VISUAL_W,
  WASH_SW_OCEAN_Z0, WASH_SW_OCEAN_Z1, WASH_SW_INLAND_Z0, WASH_SW_INLAND_Z1,
  WASH_CURB_OCEAN_Z0, WASH_CURB_OCEAN_Z1, WASH_CURB_INLAND_Z0, WASH_CURB_INLAND_Z1,
  WASH_ARCADE_X,
  washingtonRuns, washingtonCars, washingtonArcadeGeom, installFlyColliders,
} from '../constants.js';
import { cBox, cCyl } from '../geo.js';

// ============================================================
// Washington Ave analogue — second N-S street west of Ocean Drive.
// Painted 14 m carriageway at z=180, parked cars on the shoulders,
// one fly-under sidewalk arcade (fly +X). Jambs + car hulls only.
// hash01 for paint-adjacent car colour; never rng/rng2/rng3/rng4.
// New RESERVED west of x=240. Not leftoverLot. Not a travel-lane solid
// on Ocean Drive 40.2–47.8. leftoverLot A–H unmoved.
// ============================================================

const CAR_COLS = [0xff5c8a, 0x29d3ff, 0xf5e9d0, 0x9b5de5, 0x43d17a, 0xffffff, 0x22262e];
const CREAM = 0xf6f2e9, CREAM2 = 0xe8e0d2, TRIM = 0x7fd4c1;

/**
 * Build signed Washington Ave: asphalt + paint, curbs, walks, parked cars, arcade.
 * @returns {{ group: THREE.Group }}
 */
export function buildWashington(ctx) {
  const { root, track, addCollider, addCyl, setTag, asphaltSet } = ctx;
  setTag('washington');

  const group = new THREE.Group();
  group.name = 'washington-ave';

  const runs = washingtonRuns();
  buildCarriageway(ctx, group, runs, asphaltSet);
  buildPaint(ctx, group, runs);
  buildCurbsAndWalks(ctx, group, runs, addCollider);
  buildParkedCars(ctx, group, addCollider);
  buildArcade(ctx, group);

  installFlyColliders(addCyl, addCollider, 'washington');

  root.add(group);
  setTag('world');
  return { group };
}

function buildCarriageway(ctx, group, runs, asphaltSet) {
  const { track } = ctx;
  const geos = [];
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    const g = new THREE.PlaneGeometry(r.w, WASH_VISUAL_W);
    g.rotateX(-Math.PI / 2);
    g.translate(r.x, CITY_Y + 0.06, WASH_Z);
    geos.push(g);
  }
  if (!geos.length) return;
  const geo = track(mergeGeometries(geos));
  geos.forEach((g) => g.dispose());
  let mat;
  if (asphaltSet && asphaltSet.map) {
    mat = track(new THREE.MeshStandardMaterial({
      map: asphaltSet.map, color: 0x7c8288, roughness: 0.95, metalness: 0,
    }));
  } else {
    mat = track(new THREE.MeshStandardMaterial({
      color: 0x33363a, roughness: 0.96, metalness: 0,
    }));
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'washington-asphalt';
  group.add(mesh);
}

function buildPaint(ctx, group, runs) {
  const { track } = ctx;
  const Y = CITY_Y + 0.082;
  const whiteMat = track(new THREE.MeshStandardMaterial({
    color: 0xe9e9e2, roughness: 0.62, metalness: 0, depthWrite: false,
  }));
  const yellowMat = track(new THREE.MeshStandardMaterial({
    color: 0xe8c545, roughness: 0.58, metalness: 0, depthWrite: false,
  }));
  const stamp = (w, d, x, z, mat) => {
    const g = track(new THREE.PlaneGeometry(w, d));
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, Y, z);
    m.receiveShadow = true;
    group.add(m);
  };
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    stamp(r.w, 0.12, r.x, WASH_Z - 6.88, whiteMat);
    stamp(r.w, 0.12, r.x, WASH_Z + 6.88, whiteMat);
    stamp(r.w, 0.09, r.x, WASH_Z - 0.12, yellowMat);
    stamp(r.w, 0.09, r.x, WASH_Z + 0.12, yellowMat);
  }

  const dashGeo = track(new THREE.PlaneGeometry(3.2, 0.1));
  dashGeo.rotateX(-Math.PI / 2);
  const dashZ = [WASH_Z - 3.9, WASH_Z + 3.9];
  const dashSpots = [];
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    for (let x = r.x0 + 2.4; x <= r.x1 - 2.4; x += 9.5) {
      for (let k = 0; k < dashZ.length; k++) dashSpots.push([x, dashZ[k]]);
    }
  }
  if (dashSpots.length) {
    const dashes = new THREE.InstancedMesh(dashGeo, whiteMat, dashSpots.length);
    const mDash = new THREE.Matrix4();
    for (let i = 0; i < dashSpots.length; i++) {
      mDash.makeTranslation(dashSpots[i][0], Y, dashSpots[i][1]);
      dashes.setMatrixAt(i, mDash);
    }
    dashes.instanceMatrix.needsUpdate = true;
    dashes.receiveShadow = true;
    group.add(dashes);
  }

  const tickGeo = track(new THREE.PlaneGeometry(0.1, 2.15));
  tickGeo.rotateX(-Math.PI / 2);
  const tickSpots = [];
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    for (let x = r.x0 + 3.2; x <= r.x1 - 3.2; x += 6.4) {
      tickSpots.push([x, WASH_Z - 5.75]);
      tickSpots.push([x, WASH_Z + 5.75]);
    }
  }
  if (tickSpots.length) {
    const ticks = new THREE.InstancedMesh(tickGeo, whiteMat, tickSpots.length);
    const mTick = new THREE.Matrix4();
    for (let i = 0; i < tickSpots.length; i++) {
      mTick.makeTranslation(tickSpots[i][0], Y, tickSpots[i][1]);
      ticks.setMatrixAt(i, mTick);
    }
    ticks.instanceMatrix.needsUpdate = true;
    ticks.receiveShadow = true;
    group.add(ticks);
  }
}

function buildCurbsAndWalks(ctx, group, runs, addCollider) {
  const { track } = ctx;
  const curbGeos = [];
  const swGeos = [];
  const addRun = (geos, x0, x1, z0, z1, h) => {
    const len = x1 - x0, depth = z1 - z0;
    if (len < 1.2 || depth < 0.12) return;
    geos.push(new THREE.BoxGeometry(len, h, depth)
      .translate((x0 + x1) / 2, CITY_Y + h / 2, (z0 + z1) / 2));
  };
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    addRun(curbGeos, r.x0, r.x1, WASH_CURB_OCEAN_Z0, WASH_CURB_OCEAN_Z1, CURB_H);
    addRun(curbGeos, r.x0, r.x1, WASH_CURB_INLAND_Z0, WASH_CURB_INLAND_Z1, CURB_H);
    addCollider((r.x0 + r.x1) / 2, CITY_Y, (WASH_CURB_OCEAN_Z0 + WASH_CURB_OCEAN_Z1) / 2,
      r.x1 - r.x0, CURB_H, WASH_CURB_OCEAN_Z1 - WASH_CURB_OCEAN_Z0);
    addCollider((r.x0 + r.x1) / 2, CITY_Y, (WASH_CURB_INLAND_Z0 + WASH_CURB_INLAND_Z1) / 2,
      r.x1 - r.x0, CURB_H, WASH_CURB_INLAND_Z1 - WASH_CURB_INLAND_Z0);

    addRun(swGeos, r.x0, r.x1, WASH_SW_OCEAN_Z0, WASH_SW_OCEAN_Z1, SW_H);
    addRun(swGeos, r.x0, r.x1, WASH_SW_INLAND_Z0, WASH_SW_INLAND_Z1, SW_H);
    addCollider((r.x0 + r.x1) / 2, CITY_Y, (WASH_SW_OCEAN_Z0 + WASH_SW_OCEAN_Z1) / 2,
      r.x1 - r.x0, SW_H, WASH_SW_OCEAN_Z1 - WASH_SW_OCEAN_Z0);
    addCollider((r.x0 + r.x1) / 2, CITY_Y, (WASH_SW_INLAND_Z0 + WASH_SW_INLAND_Z1) / 2,
      r.x1 - r.x0, SW_H, WASH_SW_INLAND_Z1 - WASH_SW_INLAND_Z0);
  }
  if (curbGeos.length) {
    const curbGeo = track(mergeGeometries(curbGeos));
    curbGeos.forEach((g) => g.dispose());
    const curbMat = track(new THREE.MeshStandardMaterial({
      color: 0x7a7670, roughness: 0.92, metalness: 0.02,
    }));
    const curbs = new THREE.Mesh(curbGeo, curbMat);
    curbs.receiveShadow = true;
    curbs.name = 'washington-curbs';
    group.add(curbs);
  }
  if (swGeos.length) {
    const swGeo = track(mergeGeometries(swGeos));
    swGeos.forEach((g) => g.dispose());
    const swMat = track(new THREE.MeshStandardMaterial({
      color: 0xb4b0a6, roughness: 0.94, metalness: 0,
    }));
    const walks = new THREE.Mesh(swGeo, swMat);
    walks.receiveShadow = true;
    walks.name = 'washington-sidewalks';
    group.add(walks);
  }
}

function buildParkedCars(ctx, group, addCollider) {
  const { track } = ctx;
  const cars = washingtonCars();
  const geos = [];
  for (let i = 0; i < cars.length; i++) {
    const c = cars[i];
    const col = CAR_COLS[(hash01(c.x | 0, (c.z * 11) | 0) * CAR_COLS.length) | 0];
    const sign = c.side < 0 ? 1 : -1;
    geos.push(cBox(4.2, 1.10, 1.90, col, c.x, CITY_Y + 0.75, c.z));
    geos.push(cBox(2.2, 0.75, 1.70, 0x1a2026,
      c.x - sign * 0.20, CITY_Y + 1.65, c.z));
    geos.push(cBox(0.55, 0.22, 0.12, 0xe9edf1,
      c.x + sign * 2.15, CITY_Y + 0.62, c.z));
    for (const wx of [-1.35, 1.35]) {
      for (const wz of [-0.78, 0.78]) {
        geos.push(cCyl(0.32, 0.32, 0.22, 8, 0x141619,
          c.x + wx, CITY_Y + 0.32, c.z + wz, 0, 0, Math.PI / 2));
      }
    }
    addCollider(c.x, CITY_Y, c.z, c.sx, c.sy, c.sz);
  }
  if (!geos.length) return;
  const geo = track(mergeGeometries(geos));
  geos.forEach((g) => g.dispose());
  const mat = track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.46, metalness: 0.18,
  }));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'washington-cars';
  group.add(mesh);
}

function buildArcade(ctx, group) {
  const { track } = ctx;
  const g = washingtonArcadeGeom(WASH_ARCADE_X);
  const bits = [];
  const y0 = g.y0;
  for (const dx of [-g.halfX, g.halfX]) {
    for (const dz of [-g.halfZ, g.halfZ]) {
      bits.push(cCyl(
        g.postR, g.postR + 0.02, g.postH, 10, CREAM,
        g.x + dx, y0 + g.postH / 2, g.z + dz,
      ));
      bits.push(cBox(0.40, 0.08, 0.40, CREAM2, g.x + dx, y0 + 0.04, g.z + dz));
    }
  }
  const beamY = y0 + g.postH + g.beamH / 2;
  for (const dz of [-g.halfZ, g.halfZ]) {
    bits.push(cBox(g.spanX + g.beamW, g.beamH, g.beamW, TRIM,
      g.x, beamY, g.z + dz));
  }
  for (const dx of [-g.halfX, g.halfX]) {
    bits.push(cBox(g.beamW, g.beamH, g.spanZ + g.beamW, TRIM,
      g.x + dx, beamY, g.z));
  }
  bits.push(cBox(g.spanX + 1.0, 0.12, g.spanZ + 0.8, CREAM2,
    g.x, y0 + g.postH + g.beamH + 0.06, g.z));

  const geo = track(mergeGeometries(bits));
  bits.forEach((x) => x.dispose());
  const mesh = new THREE.Mesh(geo, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.86, metalness: 0,
  })));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'washington-arcade';
  group.add(mesh);
}
