import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y, BOARDWALK_TOP,
  GATE_X, GATE_Z, GATE_POST_R, GATE_POST_H, GATE_HALF_X, GATE_HALF_Z,
  GATE_BEAM_H, GATE_BEAM_W,
  GARAGE_X, GARAGE_FRONT_Z, GARAGE_W, GARAGE_D, GARAGE_WALL_H,
  GARAGE_AISLE_W, GARAGE_SOFFIT, GARAGE_ROOF_H,
  installFlyColliders,
} from '../constants.js';
import { cBox, cCyl } from '../geo.js';
import { roofTexture } from '../textures.js';

/**
 * Fly-through kit — reserved voids published as keepouts in constants.js
 * before any scatter runs. Colliders are jambs / posts / beams / lids only.
 *
 *   boardwalk-gate   whoop sash (~2.0 × 2.2 m) on the promenade, fly +X
 *   garage-mouth     5" through-aisle facing Ocean Drive, fly ±Z
 *
 * Pier undercroft + pavilion stay in pier.js; this file does not touch them.
 */
export function buildFlythrough(ctx) {
  const { root, track, addCollider, addCyl, setTag } = ctx;

  setTag('boardwalk-gate');
  buildBoardwalkGate(ctx);
  installFlyColliders(addCyl, addCollider, 'boardwalk-gate');

  setTag('garage');
  buildGarageMouth(ctx);
  installFlyColliders(addCyl, addCollider, 'garage');

  setTag('world');
}

function buildBoardwalkGate(ctx) {
  const { root, track } = ctx;
  const timber = [];
  const TIMBER = 0x6e5340, TIMBER2 = 0x7a5c45, SOFFIT = 0xc4b79a;
  const y0 = BOARDWALK_TOP;

  for (const dx of [-GATE_HALF_X, GATE_HALF_X]) {
    for (const dz of [-GATE_HALF_Z, GATE_HALF_Z]) {
      timber.push(cCyl(
        GATE_POST_R, GATE_POST_R + 0.02, GATE_POST_H, 10, TIMBER,
        GATE_X + dx, y0 + GATE_POST_H / 2, GATE_Z + dz,
      ));
      timber.push(cBox(0.36, 0.08, 0.36, TIMBER2, GATE_X + dx, y0 + 0.04, GATE_Z + dz));
    }
  }
  const beamY = y0 + GATE_POST_H + GATE_BEAM_H / 2;
  const spanX = GATE_HALF_X * 2;
  const spanZ = GATE_HALF_Z * 2;
  for (const dz of [-GATE_HALF_Z, GATE_HALF_Z]) {
    timber.push(cBox(spanX + GATE_BEAM_W, GATE_BEAM_H, GATE_BEAM_W, TIMBER2,
      GATE_X, beamY, GATE_Z + dz));
  }
  for (const dx of [-GATE_HALF_X, GATE_HALF_X]) {
    timber.push(cBox(GATE_BEAM_W, GATE_BEAM_H, spanZ + GATE_BEAM_W, TIMBER2,
      GATE_X + dx, beamY, GATE_Z));
  }
  timber.push(cBox(spanX + 1.1, 0.12, spanZ + 1.0, SOFFIT,
    GATE_X, y0 + GATE_POST_H + GATE_BEAM_H + 0.06, GATE_Z));

  const g = track(mergeGeometries(timber));
  timber.forEach((x) => x.dispose());
  const mesh = new THREE.Mesh(g, track(new THREE.MeshStandardMaterial({
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
  lid.position.set(GATE_X, y0 + GATE_POST_H + GATE_BEAM_H + 0.16, GATE_Z);
  lid.castShadow = true;
  lid.name = 'boardwalk-gate-roof';
  root.add(lid);
}

function buildGarageMouth(ctx) {
  const { root, track } = ctx;
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
}
