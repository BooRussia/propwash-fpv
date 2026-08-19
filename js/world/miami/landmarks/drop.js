import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y,
  DROP_X, DROP_Z, DROP_W, DROP_D, DROP_H, DROP_WALL, DROP_SLAB,
  DROP_PARAPET, DROP_PARAPET_T, DROP_HOIST_W, DROP_HOIST_D,
  DROP_DOOR_W, DROP_DOOR_H, DROP_PENT_H, DROP_COL_R, DROP_LIP,
  DROP_X0, DROP_X1, DROP_Z0, DROP_Z1, DROP_ROOF_Y,
  dropHoistGeom, installDropColliders, onPavement,
} from '../constants.js';
import { cBox, cCyl, colorFill } from '../geo.js';

/**
 * Drop haunt kit — second reserved-void schema on the Miami tryPlace graph.
 *
 * Leftover roof on leftover city (not a street / boardwalk / path).
 * Keepout is published in constants.js before scatter; tryPlace drops
 * palms / blades on this cell. This file does not scatter. Colliders
 * are parapet / jamb / well lip — never a filled hoistway or door.
 *
 * Kit: stained concrete, rebar lips, no furniture.
 * Whoop flies the 1.07 × 2.13 m door; 5″ drops the 2.5 × 2.0 m well.
 * Weenie is the open-top hoistway.
 */

const CONC = 0x6a6660;
const CONC2 = 0x58544e;
const CONC3 = 0x4a4640;
const STAIN = 0x746e64;
const REBAR = 0x6a3e28;
const REBAR2 = 0x8a5340;
const RUST = 0x5a4038;
const GRAF_A = 0x3a4240;
const GRAF_B = 0x4a4038;

function bandX(parts, x0, x1, z, sz, y0, sy, hex) {
  const w = x1 - x0;
  if (w <= 0.04) return;
  parts.push(cBox(w, sy, sz, hex, (x0 + x1) / 2, y0 + sy / 2, z));
}

function rebarLip(parts, x, y, z, w, h, alongX) {
  const t = 0.05;
  const lip = 0.07;
  if (alongX) {
    parts.push(cBox(w + t, t, lip, REBAR, x, y + h / 2, z));
    parts.push(cBox(w + t, t, lip, REBAR, x, y - h / 2, z));
    parts.push(cBox(t, h, lip, REBAR2, x - w / 2, y, z));
    parts.push(cBox(t, h, lip, REBAR2, x + w / 2, y, z));
  } else {
    parts.push(cBox(lip, t, w + t, REBAR, x, y + h / 2, z));
    parts.push(cBox(lip, t, w + t, REBAR, x, y - h / 2, z));
    parts.push(cBox(lip, h, t, REBAR2, x, y, z - w / 2));
    parts.push(cBox(lip, h, t, REBAR2, x, y, z + w / 2));
  }
}

function buildDeck(conc, rebar) {
  const h = dropHoistGeom();
  const roofY = DROP_ROOF_Y;
  const pt = DROP_PARAPET_T;
  const slabY = roofY - DROP_SLAB / 2;

  bandX(conc, DROP_X0, DROP_X1, DROP_Z0 + pt / 2, pt, roofY, DROP_PARAPET, CONC2);
  bandX(conc, DROP_X0, DROP_X1, DROP_Z1 - pt / 2, pt, roofY, DROP_PARAPET, CONC2);
  conc.push(cBox(pt, DROP_PARAPET, DROP_D - 2 * pt, CONC2,
    DROP_X0 + pt / 2, roofY + DROP_PARAPET / 2, DROP_Z));
  conc.push(cBox(pt, DROP_PARAPET, DROP_D - 2 * pt, CONC2,
    DROP_X1 - pt / 2, roofY + DROP_PARAPET / 2, DROP_Z));

  bandX(conc, DROP_X0, DROP_X1, (DROP_Z0 + h.holeZ0) / 2, h.holeZ0 - DROP_Z0,
    roofY - DROP_SLAB, DROP_SLAB, CONC);
  bandX(conc, DROP_X0, DROP_X1, (h.holeZ1 + DROP_Z1) / 2, DROP_Z1 - h.holeZ1,
    roofY - DROP_SLAB, DROP_SLAB, CONC);
  bandX(conc, DROP_X0, h.holeX0, (h.holeZ0 + h.holeZ1) / 2, DROP_HOIST_D,
    roofY - DROP_SLAB, DROP_SLAB, CONC3);
  bandX(conc, h.holeX1, DROP_X1, (h.holeZ0 + h.holeZ1) / 2, DROP_HOIST_D,
    roofY - DROP_SLAB, DROP_SLAB, STAIN);

  const lip = DROP_LIP;
  conc.push(cBox(DROP_HOIST_W, lip, lip, REBAR, h.x, roofY + lip / 2, h.holeZ0 - lip / 2));
  conc.push(cBox(DROP_HOIST_W, lip, lip, REBAR, h.x, roofY + lip / 2, h.holeZ1 + lip / 2));
  conc.push(cBox(lip, lip, DROP_HOIST_D, REBAR, h.holeX0 - lip / 2, roofY + lip / 2, h.z));
  conc.push(cBox(lip, lip, DROP_HOIST_D, REBAR, h.holeX1 + lip / 2, roofY + lip / 2, h.z));

  // Documentary stains on the leftover deck — not furniture.
  conc.push(cBox(1.6, 0.02, 0.9, GRAF_A, DROP_X + 2.4, slabY + DROP_SLAB / 2 + 0.01, DROP_Z + 1.1));
  conc.push(cBox(0.9, 0.02, 1.3, GRAF_B, DROP_X + 4.1, slabY + DROP_SLAB / 2 + 0.01, DROP_Z - 0.4));

  const inset = 0.42;
  for (const [x, z] of [
    [DROP_X0 + inset, DROP_Z0 + inset],
    [DROP_X1 - inset, DROP_Z0 + inset],
    [DROP_X0 + inset, DROP_Z1 - inset],
    [DROP_X1 - inset, DROP_Z1 - inset],
  ]) {
    conc.push(cCyl(DROP_COL_R, DROP_COL_R + 0.02, DROP_H, 8, CONC3,
      x, CITY_Y + DROP_H / 2, z));
  }
}

function buildWell(conc, rebar) {
  const h = dropHoistGeom();
  const y0 = CITY_Y;
  const roofY = DROP_ROOF_Y;
  const shaftH = DROP_H + DROP_PENT_H;
  const midY = y0 + shaftH / 2;

  conc.push(cBox(DROP_WALL, shaftH, DROP_HOIST_D, CONC,
    h.holeX0 - DROP_WALL / 2, midY, h.z));
  conc.push(cBox(DROP_HOIST_W, shaftH, DROP_WALL, CONC,
    h.x, midY, h.holeZ0 - DROP_WALL / 2));
  conc.push(cBox(DROP_HOIST_W, shaftH, DROP_WALL, CONC,
    h.x, midY, h.holeZ1 + DROP_WALL / 2));

  conc.push(cBox(DROP_WALL, DROP_H, DROP_HOIST_D, CONC2,
    h.eastX, y0 + DROP_H / 2, h.z));
  const jamb = (DROP_HOIST_D - DROP_DOOR_W) / 2;
  conc.push(cBox(DROP_WALL, DROP_DOOR_H, jamb, CONC,
    h.eastX, roofY + DROP_DOOR_H / 2, h.holeZ0 + jamb / 2));
  conc.push(cBox(DROP_WALL, DROP_DOOR_H, jamb, CONC,
    h.eastX, roofY + DROP_DOOR_H / 2, h.holeZ1 - jamb / 2));
  const lintel = DROP_PENT_H - DROP_DOOR_H;
  if (lintel > 0.04) {
    conc.push(cBox(DROP_WALL, lintel, DROP_HOIST_D, CONC3,
      h.eastX, roofY + DROP_DOOR_H + lintel / 2, h.z));
  }
  rebarLip(rebar, h.eastX + 0.04, roofY + DROP_DOOR_H / 2, h.z,
    DROP_DOOR_W, DROP_DOOR_H, false);

  // rust streaks on the weenie
  for (const [dx, dz] of [[-0.02, 0], [0, -0.02]]) {
    const wx = dx < 0 ? h.holeX0 - DROP_WALL - 0.01 : h.x + 0.55;
    const wz = dz < 0 ? h.holeZ0 - DROP_WALL - 0.01 : h.z + 0.4;
    conc.push(cBox(dx < 0 ? 0.04 : 0.16, shaftH * 0.62, dz < 0 ? 0.04 : 0.16, RUST,
      wx, y0 + shaftH * 0.38, wz));
  }

  // Open-top rim — the well stays the weenie, never a filled cap.
  const rimY = roofY + DROP_PENT_H;
  const lip = DROP_LIP;
  conc.push(cBox(DROP_HOIST_W + DROP_WALL, lip, DROP_WALL, REBAR2,
    h.x, rimY + lip / 2, h.holeZ0 - DROP_WALL / 2));
  conc.push(cBox(DROP_HOIST_W + DROP_WALL, lip, DROP_WALL, REBAR2,
    h.x, rimY + lip / 2, h.holeZ1 + DROP_WALL / 2));
  conc.push(cBox(DROP_WALL, lip, DROP_HOIST_D, REBAR2,
    h.holeX0 - DROP_WALL / 2, rimY + lip / 2, h.z));
  conc.push(cBox(DROP_WALL, lip, DROP_HOIST_D, REBAR2,
    h.holeX1 + DROP_WALL / 2, rimY + lip / 2, h.z));
}

/**
 * Build one drop kit on the leftover roof. Rejects if the lot is pavement.
 * Never remaps x/z. Scatter stays on tryPlace.
 */
export function buildDrop(ctx) {
  if (onPavement(DROP_X, DROP_Z)) return null;
  const { root, track, addCollider, addCyl, setTag } = ctx;
  setTag('drop');

  const conc = [];
  const rebar = [];
  buildDeck(conc, rebar);
  buildWell(conc, rebar);

  const concG = track(mergeGeometries(conc));
  conc.forEach((g) => g.dispose());
  const concMesh = new THREE.Mesh(concG, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.94, metalness: 0.02, side: THREE.DoubleSide,
  })));
  concMesh.castShadow = true;
  concMesh.receiveShadow = true;
  concMesh.name = 'drop';
  root.add(concMesh);

  const rebarG = track(mergeGeometries(rebar));
  rebar.forEach((g) => g.dispose());
  const rebarMesh = new THREE.Mesh(rebarG, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.58, metalness: 0.42,
  })));
  rebarMesh.castShadow = true;
  rebarMesh.name = 'drop-rebar';
  root.add(rebarMesh);

  installDropColliders(addCyl, addCollider);
  setTag('world');
  return { group: concMesh };
}
