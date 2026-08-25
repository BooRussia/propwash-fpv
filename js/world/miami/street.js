import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createVehicleFleet, fleetIsRoller } from '../vehicles.js';
import {
  CITY_Y, PIER_X, GAP_X, CROSS_X, PLAZA_X0, PLAZA_X1, CLUB_X, groundHeight, stripY,
} from './constants.js';
import { colorFill, cBox, cCyl, cSph, tubeBetween } from './geo.js';
import { hash01 } from './rng.js';

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

/** Art-deco sidewalk lamp. Origin at ground.
 *  Front/back/left/right: fluted bronze pole + lantern cage; top: cream finial;
 *  bottom: limestone plinth. Milk-glass globe is the lantern volume. */
function buildDecoLampGeo() {
  const bronze = 0x4a4540, cream = 0xf0e6bb, globe = 0xddd6c4, stone = 0x9a9488;
  const G = [
    cBox(0.42, 0.12, 0.42, stone, 0, 0.06, 0),
    cBox(0.32, 0.16, 0.32, stone, 0, 0.18, 0),
    cCyl(0.055, 0.08, 2.55, 8, bronze, 0, 1.52, 0),
    cCyl(0.11, 0.11, 0.05, 8, cream, 0, 2.55, 0),
    cCyl(0.09, 0.09, 0.04, 8, cream, 0, 2.72, 0),
    cBox(0.28, 0.06, 0.28, bronze, 0, 2.88, 0),
    cBox(0.26, 0.06, 0.26, bronze, 0, 3.28, 0),
    cCyl(0.13, 0.13, 0.36, 8, globe, 0, 3.08, 0),
    cCyl(0.04, 0.02, 0.16, 6, cream, 0, 3.4, 0),
  ];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      G.push(cBox(0.03, 0.4, 0.03, bronze, sx * 0.12, 3.08, sz * 0.12));
    }
  }
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

/** Miami Herald newsbox. Origin at ground.
 *  Front: glass door + name plate; back: enamel; left: coin slot; right: enamel;
 *  top: lid + handle; bottom: recessed base. */
function buildNewsboxGeo() {
  const body = 0x2f6f7a, cream = 0xf0e6bb, glass = 0x1a2830, chrome = 0xb8c0c6;
  const G = [
    cBox(0.42, 0.72, 0.36, body, 0, 0.46, 0),
    cBox(0.32, 0.38, 0.03, glass, 0, 0.54, -0.185),
    cBox(0.34, 0.1, 0.04, cream, 0, 0.82, -0.185),
    cBox(0.42, 0.72, 0.03, 0x245860, 0, 0.46, 0.165),
    cBox(0.08, 0.12, 0.04, chrome, -0.22, 0.62, 0),
    cBox(0.44, 0.05, 0.38, 0x245860, 0, 0.845, 0),
    cBox(0.16, 0.04, 0.04, chrome, 0, 0.88, -0.08),
    cBox(0.38, 0.08, 0.32, 0x1e252c, 0, 0.06, 0),
  ];
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

/** Rectangular enamel trash can (city sidewalk). Origin at ground.
 *  Front: hopper door; back/left/right: enamel; top: lid + handle; bottom: base. */
function buildTrashCanGeo() {
  const enamel = 0x35594a, lid = 0x2a2f36, hop = 0x2a4538;
  const G = [
    cBox(0.48, 0.78, 0.42, enamel, 0, 0.45, 0),
    cBox(0.36, 0.28, 0.04, hop, 0, 0.58, -0.22),
    cBox(0.5, 0.06, 0.44, lid, 0, 0.87, 0),
    cBox(0.16, 0.04, 0.04, 0x8d949a, 0, 0.92, 0),
    cBox(0.44, 0.08, 0.38, 0x1e252c, 0, 0.04, 0),
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
  const { root, track, addCollider, addCyl, setTag, rng, rng4 } = ctx;
  setTag('streetlight');

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
    // the column IS a 0.11 m cylinder — the old 0.35 m box was three times
    // the pole and squared off the gap between the column and the kerb
    addCyl(x, CITY_Y, z, 0.12, 5.7);
    // gooseneck + lamp head, out over the carriageway at 6.3 m
    addCollider(x, CITY_Y + 5.55, z + (i % 2 ? 0.85 : -0.85), 0.24, 1.0, 1.9);
  }
  lp.instanceMatrix.needsUpdate = true;
  lh.instanceMatrix.needsUpdate = true;
  lp.castShadow = true;
  root.add(lp); root.add(lh);

  // ---- vehicles: hi-fi fleet from vehicles.js, legacy box cars fallback ----
  // Per-kind hull boxes measured off the vehicles.js profiles (length, height,
  // width) instead of one 4.2 x 2.1 x 1.9 box for everything — a sports car is
  // 0.6 m lower than an SUV and the bus is more than twice as long.
  setTag('vehicle');
  const CAR_BOX = {
    sedan: [4.70, 1.50, 1.90], suv: [4.82, 1.75, 2.00], pickup: [5.40, 1.83, 2.02],
    sports: [4.45, 1.28, 1.98], taxi: [4.70, 1.62, 1.90], bus: [10.75, 3.02, 2.56],
  };
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
    const b = CAR_BOX[kind] || CAR_BOX.sedan;
    // Rollers drop the parked AABB — the physics grid is baked once, so a
    // moving box goes stale. Kiss = ghost; stay in lane, never dodge.
    if (!fleetIsRoller(i)) addCollider(x, CITY_Y, z, b[0], b[1], b[2]);
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

  setTag('world');
  return { fleet, carSpots, shelterX };
}

/**
 * Benches, bins, hydrants, parking meters, bike racks and the bus shelter.
 * Every placement is baked into ONE merged mesh (rng4 stream only).
 */
export function buildStreetFurniture(ctx, street) {
  const { root, track, addCollider, addCyl, addOBB, setTag, rng4, glassPanelGeos } = ctx;
  const { carSpots, shelterX } = street;
  setTag('furniture');
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
  const lampGeo = buildDecoLampGeo();
  const newsGeo = buildNewsboxGeo();
  const canGeo = buildTrashCanGeo();
  const blocked = (x) =>
    GAP_X.some((c) => Math.abs(x - c) < 6.5) || Math.abs(x - PIER_X) < 10 ||
    Math.abs(x - shelterX) < 4 || Math.abs(x) > 585;

  // benches (+ bins beside every other one); both sidewalks, facing -z.
  // EVERY piece of furniture is solid — the old pass gave colliders to six
  // benches near spawn and left the other forty as ghosts.
  let benchIdx = 0;
  for (let x = -575; x <= 575; x += 47) {
    for (const side of [0, 1]) {
      const bx = x + (side ? 21 : 0) + (rng4() - 0.5) * 6;
      if (blocked(bx)) continue;
      const bz = side ? 52.45 : 35.5;
      const by = stripY(bz);
      const yaw = (rng4() - 0.5) * 0.08;
      stamp(benchGeo, bx, by, bz, yaw);
      addOBB(bx, by, bz, 1.78, 0.99, 0.66, yaw);
      if (benchIdx % 2 === 0) {
        const binZ = bz + (side ? 0.1 : -0.1);
        stamp(binGeo, bx + 2.5, stripY(bz), binZ, rng4() * Math.PI);
        addCyl(bx + 2.5, stripY(bz), binZ, 0.28, 0.7);
      }
      if (benchIdx % 3 === 1) {
        const nx = bx - 1.55;
        const nz = bz + (side ? -0.12 : 0.12);
        stamp(newsGeo, nx, by, nz, side ? Math.PI : 0);
        addCollider(nx, by, nz, 0.46, 0.9, 0.4);
      }
      benchIdx++;
    }
  }
  // hydrants — city side, near the curb face
  for (let x = -530; x <= 570; x += 88) {
    const hx = x + (rng4() - 0.5) * 10;
    if (blocked(hx)) continue;
    stamp(hydGeo, hx, stripY(51.15), 51.15, rng4() * Math.PI);
    addCyl(hx, stripY(51.15), 51.15, 0.2, 0.72);
    const cx = hx + 1.85;
    if (!blocked(cx)) {
      stamp(canGeo, cx, stripY(51.2), 51.2, 0);
      addCollider(cx, stripY(51.2), 51.2, 0.5, 0.92, 0.44);
    }
  }
  // deco lamps — city sidewalk, hash yaw only (no layout-stream draws)
  for (let x = -540; x <= 540; x += 74) {
    if (blocked(x)) continue;
    const lz = 53.45;
    const ly = stripY(lz);
    stamp(lampGeo, x, ly, lz, (hash01(x, 53) - 0.5) * 0.16);
    addCyl(x, ly, lz, 0.14, 3.45);
  }
  // parking meters — one behind each curb-lane car
  for (const s of carSpots) {
    if (s.z < 44 || s.kind === 'bus') continue;                 // curb lane only
    const mx = s.x + 2.1;
    if (blocked(mx)) continue;
    stamp(meterGeo, mx, stripY(51.35), 51.35, (rng4() - 0.5) * 0.2);
    addCyl(mx, stripY(51.35), 51.35, 0.11, 1.42);
  }
  // bike racks — flanking the two crosswalks + by the bus stop
  const rack = (rx) => {
    stamp(rackGeo, rx, stripY(52.3), 52.3, 0);
    addCollider(rx, stripY(52.3), 52.3, 1.16, 0.89, 0.72);
  };
  for (const cx of CROSS_X) for (const s of [-1, 1]) rack(cx + s * 9);
  rack(shelterX + 5.2);

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
    addCollider(shelterX, CITY_Y, sz + 0.06, 4.72, 2.7, 1.55);
  }

  const furnGeo = track(mergeGeometries(oneOff));
  oneOff.forEach((g) => g.dispose());
  [benchGeo, binGeo, hydGeo, meterGeo, rackGeo, lampGeo, newsGeo, canGeo].forEach((g) => g.dispose());
  const furn = new THREE.Mesh(furnGeo, propMat);
  furn.castShadow = true;
  furn.receiveShadow = true;
  root.add(furn);
}

/**
 * Boardwalk seaward edge: dune fence, beach showers, warm lamp bollards.
 *
 * The bollards were broken: the emissive lens was a 0.075 m cylinder buried
 * inside a 0.09–0.115 m opaque post, so the light source was literally inside
 * the bollard and nothing lit up after dark. They are rebuilt as a proper
 * luminaire — post, a lens ring that stands PROUD of the post, a dark cap
 * over it and an additive pool of light on the deck — at half the old spacing
 * and 1.05 m tall so they read from the air. Every emissive part is
 * registered with regDN, so they are inert by day and blaze after dusk.
 */
export function buildBoardwalkEdge(ctx) {
  const { root, track, addCollider, addCyl, setTag, rng4 } = ctx;
  setTag('boardwalk');
  const propMat = ctx.propMat || (ctx.propMat = track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.72, metalness: 0.1,
  })));
  const edgeGeos = [];
  const postCol = 0xa9977a, railCol = 0xbfae8d;
  const FZ = 22.4;
  const fenceGap = (x) =>
    Math.abs(x) < 7 || Math.abs(x - PIER_X) < 11 ||
    (x > 52 && x < 80) ||
    (x > PLAZA_X0 - 2 && x < PLAZA_X1 + 2) ||            // amusement plaza entrance
    (x > CLUB_X - 24 && x < CLUB_X + 24) ||              // yacht club forecourt
    ((x + 620) % 123) < 5 || Math.abs(x) > 578;
  let prev = null;
  let runStart = null;
  const closeRun = (endX) => {
    if (runStart === null || endX - runStart < 1) { runStart = null; return; }
    // one thin box per continuous fence run instead of 400 post colliders
    addCollider((runStart + endX) / 2, groundHeight((runStart + endX) / 2, FZ),
      FZ, endX - runStart, 1.06, 0.14);
    runStart = null;
  };
  for (let x = -578; x <= 578; x += 2.9) {
    if (fenceGap(x)) { prev = null; closeRun(x - 2.9); continue; }
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
    } else {
      runStart = x;
    }
    prev = { x, y };
  }
  closeRun(578);

  // ---- lamp bollards along the boardwalk's seaward edge ----
  // Deck top is CITY_Y + 0.3 = 1.8; the luminaire stands 1.05 m above it.
  const DECK_TOP = CITY_Y + 0.3;
  const BOLL_Z = 24.3;
  const bolls = [];
  for (let x = -572; x <= 572; x += 15.5) {
    if (Math.abs(x - PIER_X) < 10 || Math.abs(x) < 4.5) continue;
    edgeGeos.push(cCyl(0.075, 0.105, 0.86, 10, 0x2c3339, x, DECK_TOP + 0.43, BOLL_Z));
    edgeGeos.push(cCyl(0.135, 0.135, 0.045, 10, 0x22282e, x, DECK_TOP + 0.865, BOLL_Z));  // lens shroud
    edgeGeos.push(cCyl(0.15, 0.09, 0.13, 10, 0x363e45, x, DECK_TOP + 1.015, BOLL_Z));     // cap
    bolls.push(x);
    addCyl(x, DECK_TOP, BOLL_Z, 0.15, 1.08);
  }
  // beach showers
  for (const sx of [-62, 132]) {
    const gy = groundHeight(sx, 21.4);
    edgeGeos.push(cCyl(0.75, 0.85, 0.09, 12, 0x9aa0a4, sx, gy + 0.045, 21.4));
    edgeGeos.push(cCyl(0.055, 0.07, 2.75, 8, 0x3c444b, sx, gy + 1.38, 21.4));
    edgeGeos.push(cBox(0.62, 0.06, 0.06, 0x3c444b, sx - 0.28, gy + 2.72, 21.4));
    edgeGeos.push(cCyl(0.16, 0.05, 0.1, 8, 0x8f979c, sx - 0.56, gy + 2.62, 21.4));
    edgeGeos.push(cCyl(0.03, 0.03, 0.3, 5, 0xcfd3d6, sx + 0.14, gy + 1.55, 21.4, 0, 0, 1.2));
    addCyl(sx, gy, 21.4, 0.1, 2.78);
  }
  const edgeGeo = track(mergeGeometries(edgeGeos));
  edgeGeos.forEach((g) => g.dispose());
  const edgeMesh = new THREE.Mesh(edgeGeo, propMat);
  edgeMesh.castShadow = true;
  edgeMesh.receiveShadow = true;
  root.add(edgeMesh);

  const m4 = new THREE.Matrix4();
  // the lens: 0.155 m radius so it stands proud of the 0.075 m post top and
  // is actually visible — the old 0.075 m lens sat inside the post
  {
    const lensGeo = track(new THREE.CylinderGeometry(0.155, 0.155, 0.145, 12));
    const lensMat = ctx.regDN(track(new THREE.MeshStandardMaterial({
      color: 0x2a2318, emissive: 0xffc37a, emissiveIntensity: 2.4, roughness: 0.5,
    })), 0.05, 2.9);
    const lens = new THREE.InstancedMesh(lensGeo, lensMat, bolls.length);
    for (let i = 0; i < bolls.length; i++) {
      m4.makeTranslation(bolls[i], DECK_TOP + 0.885, BOLL_Z);
      lens.setMatrixAt(i, m4);
    }
    lens.instanceMatrix.needsUpdate = true;
    lens.computeBoundingSphere();
    lens.name = 'boardwalk-lamp-lens';
    root.add(lens);
  }
  // Pool of light on the planks. UNLIT (MeshBasicMaterial): a black *standard*
  // material still returns the dielectric specular term from the HDRI, and
  // additive blending paints that as a pale disc hanging in mid-air all over
  // the frame at noon. Basic + black is genuinely zero, and the night glow
  // rides on the colour via regDNColor.
  {
    const poolGeo = track(new THREE.CircleGeometry(1.7, 18));
    poolGeo.rotateX(-Math.PI / 2);
    const poolMat = ctx.regDNColor(track(new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true, opacity: 0.85, depthWrite: false,
      blending: THREE.AdditiveBlending,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    })), 0x8c6437);
    const pools = new THREE.InstancedMesh(poolGeo, poolMat, bolls.length);
    for (let i = 0; i < bolls.length; i++) {
      m4.makeTranslation(bolls[i], DECK_TOP + 0.02, BOLL_Z - 0.35);
      pools.setMatrixAt(i, m4);
    }
    pools.instanceMatrix.needsUpdate = true;
    pools.computeBoundingSphere();
    pools.renderOrder = 3;
    pools.name = 'boardwalk-lamp-pools';
    root.add(pools);
  }
  setTag('world');
}
