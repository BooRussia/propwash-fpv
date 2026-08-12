import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createVehicleFleet } from '../vehicles.js';
import {
  CITY_Y, PIER_X, WHEEL_X, GAP_X, CROSS_X, groundHeight, stripY,
} from './constants.js';
import { colorFill, cBox, cCyl, cSph, tubeBetween } from './geo.js';

// ============================================================
// Streetscape kit — benches, bins, hydrants, meters, bike racks.
// All builders return vertex-coloured BufferGeometries
// (position/normal/uv/color) ready to merge or instance.
// ============================================================

/** Slatted park bench, facing -z (back rest at +z). Origin at ground. */
function buildBenchGeo() {
  const wood = 0xa5714a, frame = 0x2b3036;
  const G = [];
  for (const sx of [-0.78, 0.78]) {
    G.push(cBox(0.07, 0.44, 0.58, frame, sx, 0.22, 0));
    G.push(cBox(0.07, 0.55, 0.07, frame, sx, 0.66, 0.27, -0.12));
  }
  for (const dz of [-0.225, -0.075, 0.075, 0.225]) {
    G.push(cBox(1.72, 0.045, 0.13, wood, 0, 0.455, dz));
  }
  for (const dy of [0.62, 0.77, 0.92]) {
    G.push(cBox(1.72, 0.115, 0.045, wood, 0, dy, 0.285 + (dy - 0.62) * 0.12, -0.12));
  }
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

/** Classic squat fire hydrant. Origin at ground. */
function buildHydrantGeo() {
  const red = 0xd63426, cap = 0xf2ead8;
  const G = [
    cCyl(0.2, 0.23, 0.07, 10, 0x8f8a80, 0, 0.035, 0),
    cCyl(0.145, 0.17, 0.52, 10, red, 0, 0.32, 0),
    cSph(0.15, 10, 7, red, 0, 0.6, 0, 0.8),
    cCyl(0.05, 0.045, 0.1, 6, cap, 0, 0.71, 0),
  ];
  for (const a of [0, Math.PI / 2, Math.PI * 1.5]) {
    G.push(cCyl(0.075, 0.06, 0.1, 8, cap, Math.sin(a) * 0.19, 0.38, Math.cos(a) * 0.19, Math.PI / 2, a, 0));
  }
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

/** Litter bin. Origin at ground. */
function buildBinGeo() {
  const G = [
    cCyl(0.25, 0.21, 0.58, 10, 0x35594a, 0, 0.31, 0),
    cCyl(0.265, 0.265, 0.07, 10, 0x22282e, 0, 0.635, 0),
    cCyl(0.19, 0.19, 0.035, 8, 0x0c0f12, 0, 0.68, 0),
    cCyl(0.27, 0.27, 0.05, 10, 0x22282e, 0, 0.1, 0),
  ];
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

/** Parking meter, display facing +-z. Origin at ground. */
function buildMeterGeo() {
  const G = [
    cCyl(0.026, 0.032, 1.08, 6, 0x5a636b, 0, 0.54, 0),
    cBox(0.17, 0.24, 0.09, 0x37525c, 0, 1.2, 0),
    cCyl(0.095, 0.095, 0.085, 10, 0x37525c, 0, 1.33, 0, Math.PI / 2),
    cBox(0.12, 0.11, 0.096, 0xd8d3c8, 0, 1.19, 0),
  ];
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

/** 3-hoop bike rack, hoops in the YZ plane spaced along x. Origin at ground. */
function buildBikeRackGeo() {
  const steel = 0x9aa6b0;
  const G = [];
  for (const dx of [-0.5, 0, 0.5]) {
    const hoop = new THREE.TorusGeometry(0.33, 0.028, 6, 12, Math.PI);
    hoop.rotateY(Math.PI / 2);
    hoop.translate(dx, 0.55, 0);
    G.push(colorFill(hoop, steel));
    for (const dz of [-0.33, 0.33]) G.push(cCyl(0.028, 0.028, 0.56, 6, steel, dx, 0.28, dz));
  }
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

// ============================================================
/**
 * Streetlights + the parked vehicle fleet along Ocean Drive.
 * Legacy main-rng draws preserved exactly: per car (1) x jitter, (2) colour.
 * Kind selection is the NEW rng4 stream; taxi/bus colours are deterministic
 * REMAPS of the already-drawn colour value (no extra/fewer main-rng draws).
 * Returns { fleet, carSpots, shelterX } for the furniture pass + dispose.
 */
export async function buildStreet(ctx) {
  const { root, track, addCollider, rng, rng4 } = ctx;

  // curved-arm streetlight: pole + 2-segment gooseneck + fixture, merged;
  // the lamp head hangs from the arm tip out over the road
  const poleGeos = [
    new THREE.CylinderGeometry(0.07, 0.11, 5.7, 7).translate(0, 2.85, 0),
    tubeBetween(new THREE.Vector3(0, 5.62, 0), new THREE.Vector3(0, 6.32, 0.85), 0.055, 6),
    tubeBetween(new THREE.Vector3(0, 6.32, 0.85), new THREE.Vector3(0, 6.52, 1.7), 0.05, 6),
    new THREE.CylinderGeometry(0.16, 0.23, 0.2, 8).translate(0, 6.42, 1.62),
  ];
  const poleGeo = track(mergeGeometries(poleGeos));
  poleGeos.forEach((g) => g.dispose());
  const headGeo = track(new THREE.SphereGeometry(0.19, 8, 6));
  headGeo.translate(0, 6.28, 1.62);
  const poleMat = track(new THREE.MeshStandardMaterial({ color: 0x39424c, roughness: 0.6, metalness: 0.6 }));
  const headMat = ctx.regDN(track(new THREE.MeshStandardMaterial({
    color: 0xfff2cc, emissive: 0xffd27a, emissiveIntensity: 2.2,
  })), 0.15, 2.4);
  const NL = 50;
  const lp = new THREE.InstancedMesh(poleGeo, poleMat, NL);
  const lh = new THREE.InstancedMesh(headGeo, headMat, NL);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < NL; i++) {
    const x = -600 + i * 24.5;
    const z = i % 2 ? 36.5 : 51.5;
    m4.makeRotationY(i % 2 ? 0 : Math.PI);            // arm always reaches toward the road
    m4.setPosition(x, CITY_Y, z);
    lp.setMatrixAt(i, m4);
    lh.setMatrixAt(i, m4);
    addCollider(x, CITY_Y, z, 0.35, 6.4, 0.35);
  }
  lp.instanceMatrix.needsUpdate = true;
  lh.instanceMatrix.needsUpdate = true;
  lp.castShadow = true;
  root.add(lp); root.add(lh);

  // ---- vehicles: hi-fi fleet from vehicles.js, legacy box cars fallback ----
  const carSpots = [];
  const carCols = [0xff5c8a, 0x29d3ff, 0xf5e9d0, 0x9b5de5, 0x43d17a, 0xffffff, 0x22262e];
  const NC = 34;
  const BUS_I = 16;                                   // curb lane, near spawn
  const TAXI_A = 14, TAXI_B = 21;
  for (let i = 0; i < NC; i++) {
    const x = -560 + i * 34 + (rng() - 0.5) * 8;      // legacy draw
    const z = i % 2 ? 39.5 : 48.5;
    let colorHex = carCols[(rng() * carCols.length) | 0];   // legacy draw
    const roll = rng4();
    let kind = roll < 0.42 ? 'sedan' : roll < 0.72 ? 'suv' : roll < 0.88 ? 'pickup' : 'sports';
    if (i === BUS_I) { kind = 'bus'; colorHex = 0xe9eef2; }
    else if (i === TAXI_A || i === TAXI_B) { kind = 'taxi'; colorHex = 0xffc400; }
    carSpots.push({ x, z, rotY: i % 2 ? 0 : Math.PI, kind, colorHex });
    if (i === BUS_I) addCollider(x, CITY_Y, z, 11.4, 3.1, 2.6);   // bus-sized
    else addCollider(x, CITY_Y, z, 4.2, 2.1, 1.9);                // legacy per-car collider
  }
  const shelterX = carSpots[BUS_I].x + 2.2;

  let fleet = null;
  try {
    const f = await createVehicleFleet(NC);
    for (let i = 0; i < NC; i++) {
      const s = carSpots[i];
      // y = CITY_Y exactly: the fleet rests its wheels on the given plane, and
      // the road surface itself is the +0.06 slab — no double offset.
      f.placeAt(i, s.x, CITY_Y, s.z, s.rotY, s.kind, s.colorHex);
    }
    f.finalize(NC);
    root.add(f.group);
    fleet = f;
  } catch (e) {
    console.warn('[miami] vehicle fleet failed — legacy box cars:', e);
    fleet = null;
  }
  if (!fleet) {
    // legacy box cars (exact old look) driven by the same carSpots
    const carGeo = track(new THREE.BoxGeometry(4.2, 1.1, 1.9));
    carGeo.translate(0, 0.75, 0);
    const cabGeo = track(new THREE.BoxGeometry(2.2, 0.75, 1.7));
    cabGeo.translate(-0.2, 1.65, 0);
    const wheelParts = [];
    for (const wx of [-1.35, 1.35]) {
      for (const wz of [-0.78, 0.78]) {
        const g = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 10);
        g.rotateX(Math.PI / 2);
        g.translate(wx, 0.33, wz);
        wheelParts.push(g);
      }
    }
    const wheelGeo = track(mergeGeometries(wheelParts));
    wheelParts.forEach((g) => g.dispose());
    const carMat = track(new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5 }));
    const cabMat = track(new THREE.MeshStandardMaterial({ color: 0x0b1016, roughness: 0.1, metalness: 0.9 }));
    const wheelMat = track(new THREE.MeshStandardMaterial({ color: 0x14171b, roughness: 0.9, metalness: 0.1 }));
    const cars = new THREE.InstancedMesh(carGeo, carMat, NC);
    const cabs = new THREE.InstancedMesh(cabGeo, cabMat, NC);
    const wheels = new THREE.InstancedMesh(wheelGeo, wheelMat, NC);
    const col = new THREE.Color();
    const m4b = new THREE.Matrix4();
    for (let i = 0; i < NC; i++) {
      const s = carSpots[i];
      m4b.makeRotationY(s.rotY);
      m4b.setPosition(s.x, CITY_Y, s.z);
      cars.setMatrixAt(i, m4b);
      cabs.setMatrixAt(i, m4b);
      wheels.setMatrixAt(i, m4b);
      cars.setColorAt(i, col.setHex(s.colorHex));
    }
    cars.instanceMatrix.needsUpdate = true;
    cabs.instanceMatrix.needsUpdate = true;
    wheels.instanceMatrix.needsUpdate = true;
    cars.castShadow = true;
    root.add(cars); root.add(cabs); root.add(wheels);
  }

  return { fleet, carSpots, shelterX };
}

/**
 * Benches, bins, hydrants, parking meters, bike racks and the bus shelter.
 * Every placement is baked into ONE merged mesh (rng4 stream only).
 */
export function buildStreetFurniture(ctx, street) {
  const { root, track, addCollider, rng4, glassPanelGeos } = ctx;
  const { carSpots, shelterX } = street;
  const propMat = ctx.propMat || (ctx.propMat = track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.72, metalness: 0.1,
  })));

  const oneOff = [];
  const stamp = (geo, x, y, z, ry) => {
    const g = geo.clone();
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    oneOff.push(g);
  };
  const benchGeo = buildBenchGeo();
  const binGeo = buildBinGeo();
  const hydGeo = buildHydrantGeo();
  const meterGeo = buildMeterGeo();
  const rackGeo = buildBikeRackGeo();
  const blocked = (x) =>
    GAP_X.some((c) => Math.abs(x - c) < 6.5) || Math.abs(x - PIER_X) < 10 ||
    Math.abs(x - WHEEL_X) < 14 || Math.abs(x - shelterX) < 4 || Math.abs(x) > 585;

  // benches (+ bins beside every other one); both sidewalks, facing -z
  let benchColliders = 0;
  let benchIdx = 0;
  for (let x = -575; x <= 575; x += 47) {
    for (const side of [0, 1]) {
      const bx = x + (side ? 21 : 0) + (rng4() - 0.5) * 6;
      if (blocked(bx)) continue;
      const bz = side ? 52.45 : 35.5;
      const by = stripY(bz);
      stamp(benchGeo, bx, by, bz, (rng4() - 0.5) * 0.08);
      if (benchIdx % 2 === 0) stamp(binGeo, bx + 2.5, stripY(bz), bz + (side ? 0.1 : -0.1), rng4() * Math.PI);
      if (benchColliders < 6 && Math.abs(bx) < 70) {
        addCollider(bx, by, bz, 1.9, 1.15, 0.75);
        benchColliders++;
      }
      benchIdx++;
    }
  }
  // hydrants — city side, near the curb face
  for (let x = -530; x <= 570; x += 88) {
    const hx = x + (rng4() - 0.5) * 10;
    if (blocked(hx)) continue;
    stamp(hydGeo, hx, stripY(51.15), 51.15, rng4() * Math.PI);
  }
  // parking meters — one behind each curb-lane car
  for (const s of carSpots) {
    if (s.z < 44 || s.kind === 'bus') continue;                 // curb lane only
    const mx = s.x + 2.1;
    if (blocked(mx)) continue;
    stamp(meterGeo, mx, stripY(51.35), 51.35, (rng4() - 0.5) * 0.2);
  }
  // bike racks — flanking the two crosswalks + by the bus stop
  for (const cx of CROSS_X) {
    for (const s of [-1, 1]) stamp(rackGeo, cx + s * 9, stripY(52.3), 52.3, 0);
  }
  stamp(rackGeo, shelterX + 5.2, stripY(52.3), 52.3, 0);

  // bus stop shelter beside the parked bus (one-off; collider). The bus needs
  // 10.6 m of clear kerb, so the shelter sits just behind its tail.
  {
    const sz = 53.55, wood = 0xa5714a, dark = 0x2b3138;
    for (const [px, pz] of [[-2.05, -0.62], [2.05, -0.62], [-2.05, 0.66], [2.05, 0.66]]) {
      oneOff.push(cBox(0.09, 2.52, 0.09, dark, shelterX + px, CITY_Y + 1.26, sz + pz));
    }
    oneOff.push(cBox(4.6, 0.09, 1.72, dark, shelterX, CITY_Y + 2.56, sz));
    oneOff.push(cBox(3.6, 0.06, 0.45, wood, shelterX, CITY_Y + 0.62, sz + 0.32));
    for (const s of [-1.5, 1.5]) oneOff.push(cBox(0.07, 0.6, 0.4, dark, shelterX + s, CITY_Y + 0.3, sz + 0.32));
    oneOff.push(cBox(4.4, 0.1, 0.06, dark, shelterX, CITY_Y + 2.0, sz + 0.72));
    oneOff.push(cBox(4.4, 0.1, 0.06, dark, shelterX, CITY_Y + 0.12, sz + 0.72));
    glassPanelGeos.push(new THREE.BoxGeometry(4.45, 0.05, 1.6).translate(shelterX, CITY_Y + 2.63, sz));
    glassPanelGeos.push(new THREE.BoxGeometry(4.35, 1.78, 0.04).translate(shelterX, CITY_Y + 1.06, sz + 0.72));
    addCollider(shelterX, CITY_Y, sz, 4.7, 2.8, 1.9);
  }

  const furnGeo = track(mergeGeometries(oneOff));
  oneOff.forEach((g) => g.dispose());
  [benchGeo, binGeo, hydGeo, meterGeo, rackGeo].forEach((g) => g.dispose());
  const furn = new THREE.Mesh(furnGeo, propMat);
  furn.castShadow = true;
  furn.receiveShadow = true;
  root.add(furn);
}

/** Boardwalk seaward edge: dune fence, beach showers, warm lamp bollards. */
export function buildBoardwalkEdge(ctx) {
  const { root, track, rng4 } = ctx;
  const propMat = ctx.propMat || (ctx.propMat = track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.72, metalness: 0.1,
  })));
  const edgeGeos = [];
  const postCol = 0xa9977a, railCol = 0xbfae8d;
  const FZ = 22.4;
  const fenceGap = (x) =>
    Math.abs(x) < 7 || Math.abs(x - PIER_X) < 11 ||
    (x > 52 && x < 80) || ((x + 620) % 123) < 5 || Math.abs(x) > 578;
  let prev = null;
  for (let x = -578; x <= 578; x += 2.9) {
    if (fenceGap(x)) { prev = null; continue; }
    const y = groundHeight(x, FZ);
    const pg = new THREE.BoxGeometry(0.09, 1.15, 0.075);
    pg.rotateZ((rng4() - 0.5) * 0.12);
    pg.translate(x, y + 0.52, FZ);
    edgeGeos.push(colorFill(pg, postCol));
    if (prev) {
      for (const ry of [0.88, 0.5]) {
        edgeGeos.push(colorFill(tubeBetween(
          new THREE.Vector3(prev.x, prev.y + ry, FZ),
          new THREE.Vector3(x, y + ry, FZ), 0.03, 5), railCol));
      }
    }
    prev = { x, y };
  }
  // warm lamp bollards on the boardwalk's seaward edge (deck top = CITY_Y+0.3)
  const bolls = [];
  for (let x = -570; x <= 570; x += 31) {
    if (Math.abs(x - PIER_X) < 10 || Math.abs(x) < 4) continue;
    edgeGeos.push(cCyl(0.09, 0.115, 0.8, 8, 0x2c3339, x, CITY_Y + 0.7, 24.3));
    bolls.push(x);
  }
  // beach showers
  for (const sx of [-62, 132]) {
    const gy = groundHeight(sx, 21.4);
    edgeGeos.push(cCyl(0.75, 0.85, 0.09, 12, 0x9aa0a4, sx, gy + 0.045, 21.4));
    edgeGeos.push(cCyl(0.055, 0.07, 2.75, 8, 0x3c444b, sx, gy + 1.38, 21.4));
    edgeGeos.push(cBox(0.62, 0.06, 0.06, 0x3c444b, sx - 0.28, gy + 2.72, 21.4));
    edgeGeos.push(cCyl(0.16, 0.05, 0.1, 8, 0x8f979c, sx - 0.56, gy + 2.62, 21.4));
    edgeGeos.push(cCyl(0.03, 0.03, 0.3, 5, 0xcfd3d6, sx + 0.14, gy + 1.55, 21.4, 0, 0, 1.2));
  }
  const edgeGeo = track(mergeGeometries(edgeGeos));
  edgeGeos.forEach((g) => g.dispose());
  const edgeMesh = new THREE.Mesh(edgeGeo, propMat);
  edgeMesh.receiveShadow = true;
  root.add(edgeMesh);

  const glowGeo = track(new THREE.CylinderGeometry(0.075, 0.075, 0.1, 8));
  const glowMat = ctx.regDN(track(new THREE.MeshStandardMaterial({
    color: 0xfff0d8, emissive: 0xffc37a, emissiveIntensity: 1.9,
  })), 0.12, 2.1);
  const glows = new THREE.InstancedMesh(glowGeo, glowMat, bolls.length);
  const mGl = new THREE.Matrix4();
  for (let i = 0; i < bolls.length; i++) {
    mGl.makeTranslation(bolls[i], CITY_Y + 1.05, 24.3);
    glows.setMatrixAt(i, mGl);
  }
  glows.instanceMatrix.needsUpdate = true;
  root.add(glows);
}
