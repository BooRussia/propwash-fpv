import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y,
  PARK_PERGOLA_X, PARK_PERGOLA_Z,
  PARK_PERGOLA_EE_X, PARK_PERGOLA_EE_Z,
  PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z,
  PARK_PERGOLA_GG_X, PARK_PERGOLA_GG_Z,
  PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z,
  GARAGE_X, GARAGE_FRONT_Z, GARAGE_W, GARAGE_D, GARAGE_WALL_H,
  GARAGE_AISLE_W, GARAGE_SOFFIT, GARAGE_ROOF_H,
  PROMENADE_ARCH_XS, GATE_Z,
  SW_ARCADE_CITY_XS, SW_ARCADE_BEACH_XS, SW_ARCADE_CITY_Z, SW_ARCADE_BEACH_Z,
  ALLEY_PIPE_CELLS, PARK_RING_CELLS, FIRE_ESCAPE_CELLS, LIFEGUARD_RING_CELLS,
  boardwalkGateGeom, boardwalkGateRejected, onPavement,
  sidewalkArcadeGeom, alleyPipeGeom, parkRingGeom, fireEscapeGeom,
  lifeguardRingGeom,
  installFlyColliders,
} from '../constants.js';
import { tryPlace } from '../planting.js';
import { cBox, cCyl, cTorus } from '../geo.js';
import { roofTexture } from '../textures.js';

/**
 * Fly-through kit — reserved voids published as keepouts in constants.js
 * before any scatter runs. Colliders are jambs / posts / beams / lids only.
 *
 *   boardwalk-gate   whoop sash (~2.0 × 2.2 m) on the promenade, fly +X
 *   garage-mouth     5" through-aisle facing Ocean Drive, fly ±Z
 *
 * Park pergola is the same boardwalkGateGeom kit at the signed 276/94
 * cell — not a pergolaGeom / parkPergolaGeom fork, not a slide of
 * GATE_X/GATE_Z, not a leave-behind at 276/92. Opening 2.20 m, fly +X.
 * Empty air, never a filled sash AABB. Half-span stays under 2 m so
 * z1 stays inside the park (z=96). Drop if the Z-span kisses the
 * 276/90 bench (back ~90.3). Never nudge.
 *
 * E-park pergola is the same kit at signed 347/98.5 — not
 * parkPergolaEEGeom / boardwalkGateEGeom, not a slide of 276/94.
 * Half-span 1.16 stays inside 100 and 0.54 m off spine 96.8.
 * Drop if the Z-span kisses the 347/94.4 bench or the 339→355 /
 * z=96 spine. Never nudge.
 *
 * F-park pergola is the same kit at signed 364/98.5 — 347 kit
 * +17 m, not parkPergolaFGeom / boardwalkGateFGeom, not a slide
 * of 347/98.5. Half-span 1.16 stays inside 100 and 0.54 m off
 * spine 96.8. Fly +X. 2.20 m void. Drop if the Z-span kisses
 * the 364/94.4 bench or the 356→372 / z=96 spine. Never nudge.
 * Do not merge E-park 355.
 *
 * G-park pergola is the same kit at signed 381/98.5 — 364 kit
 * +17 m, not parkPergolaGGeom / boardwalkGateGGeom, not a slide
 * of 364/98.5. Half-span 1.16 stays inside 100 and 0.54 m off
 * spine 96.8. Fly +X. 2.20 m void. Drop if the Z-span kisses
 * the 381/94.4 bench or the 373→389 / z=96 spine. Never nudge.
 * Do not merge F-park 372.
 *
 * H-park pergola is the same kit at signed 398/98.5 — 381 kit
 * +17 m, not parkPergolaHGeom / boardwalkGateHGeom, not a slide
 * of 381/98.5. Half-span 1.16 stays inside 100 and 0.54 m off
 * spine 96.8. Fly +X. 2.20 m void. Drop if the Z-span kisses
 * the 398/94.4 bench or the 390→406 / z=96 spine. Never nudge.
 * Do not merge G-park 389.
 *
 * Pier undercroft + pavilion stay in pier.js; this file does not touch them.
 *
 * Extra whoops this pass (signed cells, hash01 never drawn):
 *   sidewalk-arcade  stucco soffit on the Ocean Drive slabs, fly +X
 *   alley-pipe       steel U inland, fly +X
 *   park-ring        torus in Lummus, fly +X
 *   fire-escape      steel landing frames on inland mid-rise flanks at z=248, fly +X
 *   lifeguard-ring   torus on the west-of-240 lifeguard stands, fly +X
 */
export function buildFlythrough(ctx) {
  const { root, track, addCollider, addCyl, setTag } = ctx;

  setTag('boardwalk-gate');
  buildBoardwalkGate(ctx);
  const parkGeom = boardwalkGateGeom(PARK_PERGOLA_X, PARK_PERGOLA_Z);
  if (!boardwalkGateRejected(parkGeom.x, parkGeom.z)
      && !onPavement(parkGeom.x, parkGeom.z)) {
    buildBoardwalkGate(ctx, parkGeom);
  } else if (onPavement(parkGeom.x, parkGeom.z)) {
    tryPlace(ctx, parkGeom.x, parkGeom.z);
  }
  const parkEEGeom = boardwalkGateGeom(PARK_PERGOLA_EE_X, PARK_PERGOLA_EE_Z);
  if (!boardwalkGateRejected(parkEEGeom.x, parkEEGeom.z)
      && !onPavement(parkEEGeom.x, parkEEGeom.z)) {
    buildBoardwalkGate(ctx, parkEEGeom);
  } else if (onPavement(parkEEGeom.x, parkEEGeom.z)) {
    tryPlace(ctx, parkEEGeom.x, parkEEGeom.z);
  }
  const parkFFGeom = boardwalkGateGeom(PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z);
  if (!boardwalkGateRejected(parkFFGeom.x, parkFFGeom.z)
      && !onPavement(parkFFGeom.x, parkFFGeom.z)) {
    buildBoardwalkGate(ctx, parkFFGeom);
  } else if (onPavement(parkFFGeom.x, parkFFGeom.z)) {
    tryPlace(ctx, parkFFGeom.x, parkFFGeom.z);
  }
  const parkGGGeom = boardwalkGateGeom(PARK_PERGOLA_GG_X, PARK_PERGOLA_GG_Z);
  if (!boardwalkGateRejected(parkGGGeom.x, parkGGGeom.z)
      && !onPavement(parkGGGeom.x, parkGGGeom.z)) {
    buildBoardwalkGate(ctx, parkGGGeom);
  } else if (onPavement(parkGGGeom.x, parkGGGeom.z)) {
    tryPlace(ctx, parkGGGeom.x, parkGGGeom.z);
  }
  const parkHHGeom = boardwalkGateGeom(PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z);
  if (!boardwalkGateRejected(parkHHGeom.x, parkHHGeom.z)
      && !onPavement(parkHHGeom.x, parkHHGeom.z)) {
    buildBoardwalkGate(ctx, parkHHGeom);
  } else if (onPavement(parkHHGeom.x, parkHHGeom.z)) {
    tryPlace(ctx, parkHHGeom.x, parkHHGeom.z);
  }
  installFlyColliders(addCyl, addCollider, 'boardwalk-gate');

  setTag('promenade-arch');
  for (let i = 0; i < PROMENADE_ARCH_XS.length; i++) {
    const arch = boardwalkGateGeom(PROMENADE_ARCH_XS[i], GATE_Z);
    buildBoardwalkGate(ctx, arch);
  }
  installFlyColliders(addCyl, addCollider, 'promenade-arch');

  setTag('garage');
  buildGarageMouth(ctx);
  installFlyColliders(addCyl, addCollider, 'garage');

  setTag('sidewalk-arcade');
  for (let i = 0; i < SW_ARCADE_CITY_XS.length; i++) {
    buildSidewalkArcade(ctx, sidewalkArcadeGeom(SW_ARCADE_CITY_XS[i], SW_ARCADE_CITY_Z));
  }
  for (let i = 0; i < SW_ARCADE_BEACH_XS.length; i++) {
    buildSidewalkArcade(ctx, sidewalkArcadeGeom(SW_ARCADE_BEACH_XS[i], SW_ARCADE_BEACH_Z));
  }
  installFlyColliders(addCyl, addCollider, 'sidewalk-arcade');

  setTag('alley-pipe');
  for (let i = 0; i < ALLEY_PIPE_CELLS.length; i++) {
    buildAlleyPipe(ctx, alleyPipeGeom(ALLEY_PIPE_CELLS[i][0], ALLEY_PIPE_CELLS[i][1]));
  }
  installFlyColliders(addCyl, addCollider, 'alley-pipe');

  setTag('park-ring');
  for (let i = 0; i < PARK_RING_CELLS.length; i++) {
    buildParkRing(ctx, parkRingGeom(PARK_RING_CELLS[i][0], PARK_RING_CELLS[i][1]));
  }
  installFlyColliders(addCyl, addCollider, 'park-ring');

  setTag('lifeguard-ring');
  for (let i = 0; i < LIFEGUARD_RING_CELLS.length; i++) {
    buildLifeguardRing(ctx, lifeguardRingGeom(LIFEGUARD_RING_CELLS[i][0], LIFEGUARD_RING_CELLS[i][1]));
  }
  installFlyColliders(addCyl, addCollider, 'lifeguard-ring');

  setTag('fire-escape');
  for (let i = 0; i < FIRE_ESCAPE_CELLS.length; i++) {
    buildFireEscape(ctx, fireEscapeGeom(FIRE_ESCAPE_CELLS[i][0], FIRE_ESCAPE_CELLS[i][1]));
  }
  installFlyColliders(addCyl, addCollider, 'fire-escape');

  setTag('world');
}

function buildBoardwalkGate(ctx, g = boardwalkGateGeom()) {
  const { root, track } = ctx;
  const timber = [];
  const TIMBER = 0x6e5340, TIMBER2 = 0x7a5c45, SOFFIT = 0xc4b79a;
  const y0 = g.y0;
  const gx = g.x;
  const gz = g.z;
  const halfX = g.halfX;
  const halfZ = g.halfZ;
  const postR = g.postR;
  const postH = g.postH;
  const beamH = g.beamH;
  const beamW = g.beamW;

  for (const dx of [-halfX, halfX]) {
    for (const dz of [-halfZ, halfZ]) {
      timber.push(cCyl(
        postR, postR + 0.02, postH, 10, TIMBER,
        gx + dx, y0 + postH / 2, gz + dz,
      ));
      timber.push(cBox(0.36, 0.08, 0.36, TIMBER2, gx + dx, y0 + 0.04, gz + dz));
    }
  }
  const beamY = y0 + postH + beamH / 2;
  const spanX = halfX * 2;
  const spanZ = halfZ * 2;
  for (const dz of [-halfZ, halfZ]) {
    timber.push(cBox(spanX + beamW, beamH, beamW, TIMBER2,
      gx, beamY, gz + dz));
  }
  for (const dx of [-halfX, halfX]) {
    timber.push(cBox(beamW, beamH, spanZ + beamW, TIMBER2,
      gx + dx, beamY, gz));
  }
  timber.push(cBox(spanX + 1.1, 0.12, spanZ + 1.0, SOFFIT,
    gx, y0 + postH + beamH + 0.06, gz));

  const geo = track(mergeGeometries(timber));
  timber.forEach((x) => x.dispose());
  const mesh = new THREE.Mesh(geo, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.88,
  })));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'boardwalk-gate';
  root.add(mesh);

  const roofTex = track(roofTexture('metal', 11));
  roofTex.repeat.set(2, 1.4);
  const lid = new THREE.Mesh(
    track(new THREE.BoxGeometry(spanX + 1.24, 0.08, spanZ + 1.14)),
    track(new THREE.MeshStandardMaterial({
      map: roofTex, color: 0xc8cdd2, roughness: 0.42, metalness: 0.48,
    })),
  );
  lid.position.set(gx, y0 + postH + beamH + 0.16, gz);
  lid.castShadow = true;
  lid.name = 'boardwalk-gate-roof';
  root.add(lid);
}

function buildGarageMouth(ctx) {
  const { root, track, regDN } = ctx;
  const CONC = 0x6a655c, CONC2 = 0x5a564e, REVEAL = 0x3f3c37;
  const aisle = GARAGE_AISLE_W;
  const sideW = (GARAGE_W - aisle) / 2;
  const gz = GARAGE_FRONT_Z + GARAGE_D / 2;
  const shell = [];

  for (const s of [-1, 1]) {
    const cx = GARAGE_X + s * (aisle / 2 + sideW / 2);
    shell.push(cBox(sideW, GARAGE_WALL_H, GARAGE_D, CONC, cx, CITY_Y + GARAGE_WALL_H / 2, gz));
    // inner jamb reveal — reads as a mouth, not a punched hole
    shell.push(cBox(0.16, GARAGE_SOFFIT, GARAGE_D - 0.3, CONC2,
      GARAGE_X + s * (aisle / 2 + 0.08), CITY_Y + GARAGE_SOFFIT / 2, gz));
    // pilaster at the Ocean Drive face
    shell.push(cBox(0.42, GARAGE_WALL_H, 0.36, CONC2,
      GARAGE_X + s * (aisle / 2 + 0.22), CITY_Y + GARAGE_WALL_H / 2, GARAGE_FRONT_Z + 0.12));
  }
  // lintel over the mouth (visual; collider is the soffit slab)
  shell.push(cBox(aisle + 0.5, 0.36, 0.42, REVEAL,
    GARAGE_X, CITY_Y + GARAGE_SOFFIT - 0.08, GARAGE_FRONT_Z + 0.12));
  shell.push(cBox(aisle + 0.5, 0.36, 0.42, REVEAL,
    GARAGE_X, CITY_Y + GARAGE_SOFFIT - 0.08, GARAGE_FRONT_Z + GARAGE_D - 0.12));
  // apron — thin pad, not a wall
  shell.push(cBox(aisle + 1.6, 0.06, 1.8, 0x5c5a54,
    GARAGE_X, CITY_Y + 0.03, GARAGE_FRONT_Z - 0.7));

  const g = track(mergeGeometries(shell));
  shell.forEach((x) => x.dispose());
  const mesh = new THREE.Mesh(g, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.9,
  })));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'garage-mouth';
  root.add(mesh);

  const roofTex = track(roofTexture('tpo', 7));
  roofTex.repeat.set(3.2, 2.6);
  const lid = new THREE.Mesh(
    track(new THREE.BoxGeometry(GARAGE_W + 0.3, GARAGE_ROOF_H, GARAGE_D + 0.3)),
    track(new THREE.MeshStandardMaterial({
      map: roofTex, color: 0xffffff, roughness: 0.86, metalness: 0.02,
    })),
  );
  lid.position.set(GARAGE_X, CITY_Y + GARAGE_SOFFIT + GARAGE_ROOF_H / 2, gz);
  lid.castShadow = true;
  lid.receiveShadow = true;
  lid.name = 'garage-roof';
  root.add(lid);

  // Soffit underside + night strips. Visual only — never a box in the aisle.
  // MeshStandardMaterial + regDN. leftoverLot A–H unmoved.
  const soffit = new THREE.Mesh(
    track(new THREE.BoxGeometry(aisle - 0.24, 0.06, GARAGE_D - 0.4)),
    track(new THREE.MeshStandardMaterial({
      color: 0xe8dcc8, roughness: 0.92, metalness: 0.02,
    })),
  );
  soffit.position.set(GARAGE_X, CITY_Y + GARAGE_SOFFIT - 0.03, gz);
  soffit.receiveShadow = true;
  soffit.name = 'garage-mouth-soffit';
  root.add(soffit);

  const stripGeo = track(new THREE.BoxGeometry(0.12, 0.04, GARAGE_D - 0.8));
  const stripMat = regDN(track(new THREE.MeshStandardMaterial({
    color: 0xfff2cc, emissive: 0xffd27a, emissiveIntensity: 0, roughness: 0.45,
  })), 0.15, 2.4);
  for (const s of [-1, 1]) {
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(
      GARAGE_X + s * (aisle / 2 - 0.28),
      CITY_Y + GARAGE_SOFFIT - 0.08,
      gz,
    );
    strip.name = 'garage-mouth-strip';
    root.add(strip);
  }
  const mouthGlow = new THREE.Mesh(
    track(new THREE.BoxGeometry(aisle - 0.4, 0.06, 0.08)),
    stripMat,
  );
  mouthGlow.position.set(GARAGE_X, CITY_Y + GARAGE_SOFFIT - 0.14, GARAGE_FRONT_Z + 0.18);
  mouthGlow.name = 'garage-mouth-lintel-glow';
  root.add(mouthGlow);
}

function buildSidewalkArcade(ctx, g) {
  const { root, track } = ctx;
  const CREAM = 0xf6f2e9, CREAM2 = 0xe8e0d2, TRIM = 0x7fd4c1;
  const bits = [];
  const y0 = g.y0;
  const gx = g.x;
  const gz = g.z;
  const halfX = g.halfX;
  const halfZ = g.halfZ;
  const postR = g.postR;
  const postH = g.postH;
  const beamH = g.beamH;
  const beamW = g.beamW;

  for (const dx of [-halfX, halfX]) {
    for (const dz of [-halfZ, halfZ]) {
      bits.push(cCyl(
        postR, postR + 0.02, postH, 10, CREAM,
        gx + dx, y0 + postH / 2, gz + dz,
      ));
      bits.push(cBox(0.40, 0.08, 0.40, CREAM2, gx + dx, y0 + 0.04, gz + dz));
    }
  }
  const beamY = y0 + postH + beamH / 2;
  const spanX = halfX * 2;
  const spanZ = halfZ * 2;
  for (const dz of [-halfZ, halfZ]) {
    bits.push(cBox(spanX + beamW, beamH, beamW, TRIM, gx, beamY, gz + dz));
  }
  for (const dx of [-halfX, halfX]) {
    bits.push(cBox(beamW, beamH, spanZ + beamW, TRIM, gx + dx, beamY, gz));
  }
  bits.push(cBox(spanX + 1.0, 0.12, spanZ + 0.8, CREAM2,
    gx, y0 + postH + beamH + 0.06, gz));

  const geo = track(mergeGeometries(bits));
  bits.forEach((x) => x.dispose());
  const mesh = new THREE.Mesh(geo, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.86,
  })));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'sidewalk-arcade';
  root.add(mesh);
}

function buildAlleyPipe(ctx, g) {
  const { root, track } = ctx;
  const GALV = 0x8a9298, GALV2 = 0x6d747c, FLANGE = 0x3a3e42;
  const bits = [];
  const y0 = g.y0;
  const topY = y0 + g.postH;
  for (const dz of [-g.halfZ, g.halfZ]) {
    bits.push(cCyl(g.postR, g.postR + 0.015, g.postH, 10, GALV,
      g.x, y0 + g.postH / 2, g.z + dz));
    bits.push(cCyl(g.postR + 0.03, g.postR + 0.03, 0.06, 10, FLANGE,
      g.x, y0 + 0.04, g.z + dz));
    bits.push(cCyl(g.postR + 0.025, g.postR + 0.025, 0.05, 10, FLANGE,
      g.x, topY, g.z + dz));
  }
  bits.push(cCyl(g.beamR, g.beamR, g.halfZ * 2, 10, GALV2,
    g.x, topY, g.z, Math.PI / 2, 0, 0));

  const geo = track(mergeGeometries(bits));
  bits.forEach((x) => x.dispose());
  const mesh = new THREE.Mesh(geo, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.42, metalness: 0.55,
  })));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'alley-pipe';
  root.add(mesh);
}

function buildFireEscape(ctx, g) {
  const { root, track } = ctx;
  const GALV = 0x8a9298, GALV2 = 0x6d747c, RUST = 0x5c3a2e;
  const bits = [];
  const y0 = g.y0;
  const topY = y0 + g.postH;
  for (const dz of [-g.halfZ, g.halfZ]) {
    bits.push(cCyl(g.postR, g.postR + 0.01, g.postH, 8, GALV,
      g.x, y0 + g.postH / 2, g.z + dz));
    bits.push(cBox(0.70, g.beamH, g.beamW, GALV2,
      g.x, topY, g.z + dz));
  }
  bits.push(cBox(g.beamW, g.beamH, g.halfZ * 2 + g.postR * 2, GALV2,
    g.x, topY, g.z));
  const inlandZ = g.z + g.halfZ;
  for (let k = 0; k < 5; k++) {
    const ry = y0 + 0.45 + k * 0.55;
    bits.push(cBox(0.36, 0.04, 0.04, RUST, g.x, ry, inlandZ));
  }
  const geo = track(mergeGeometries(bits));
  bits.forEach((x) => x.dispose());
  const mesh = new THREE.Mesh(geo, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.46, metalness: 0.52,
  })));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'fire-escape';
  root.add(mesh);
}

function buildParkRing(ctx, g) {
  const { root, track } = ctx;
  const PAINT = 0x2fe0ff, PAINT2 = 0x1d6f7a;
  const bits = [
    cTorus(g.r, g.tube, 8, 20, PAINT, g.x, g.y, g.z, 0, Math.PI / 2, 0),
    cTorus(g.r, g.tube * 0.45, 6, 16, PAINT2, g.x, g.y, g.z, 0, Math.PI / 2, 0),
  ];
  const geo = track(mergeGeometries(bits));
  bits.forEach((x) => x.dispose());
  const mesh = new THREE.Mesh(geo, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.38, metalness: 0.42,
  })));
  mesh.castShadow = true;
  mesh.name = 'park-ring';
  root.add(mesh);
}

function buildLifeguardRing(ctx, g) {
  const { root, track } = ctx;
  const PAINT = 0xff5330, PAINT2 = 0xf5f1e4;
  const bits = [
    cTorus(g.r, g.tube, 8, 20, PAINT, g.x, g.y, g.z, 0, Math.PI / 2, 0),
    cTorus(g.r, g.tube * 0.45, 6, 16, PAINT2, g.x, g.y, g.z, 0, Math.PI / 2, 0),
  ];
  const geo = track(mergeGeometries(bits));
  bits.forEach((x) => x.dispose());
  const mesh = new THREE.Mesh(geo, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.38, metalness: 0.42,
  })));
  mesh.castShadow = true;
  mesh.name = 'lifeguard-ring';
  root.add(mesh);
}
