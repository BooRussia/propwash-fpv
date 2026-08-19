import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y,
  HOUSE_X, HOUSE_Z, HOUSE_W, HOUSE_D, HOUSE_H, HOUSE_WALL,
  HOUSE_PAD_H, HOUSE_ROOF_H, HOUSE_SLAB, HOUSE_STORY,
  HOUSE_DOOR_W, HOUSE_DOOR_H, HOUSE_WIN_W, HOUSE_WIN_H, HOUSE_WIN_SILL,
  HOUSE_LEAF_T, HOUSE_STAIR, HOUSE_STAIR_T, HOUSE_STAIR_RISE,
  HOUSE_STAIR_RUN, HOUSE_STAIR_TREAD,
  HOUSE_X0, HOUSE_X1, HOUSE_Z0, HOUSE_Z1,
  housePlanGeom, installHouseColliders, onPavement,
} from '../constants.js';
import { cBox } from '../geo.js';

/**
 * House haunt kit — fourth reserved-void schema on the Miami tryPlace graph.
 *
 * Leftover residential lot (not a street / boardwalk / path). Keepout is
 * published in constants.js before scatter; tryPlace drops palms / blades
 * on this cell. This file does not scatter. Colliders are jambs / the open
 * leaf / stair stringers — never a filled room, hall, or door.
 *
 * Kit: faded CBS stucco, rusted rebar, no furniture.
 * Whoop flies the sash / stair; 5″ flies the hall / door.
 * Weenie is the stair well.
 */

const STUCCO = 0xb8a888;
const STUCCO2 = 0xa09078;
const STUCCO3 = 0x8a7a64;
const STAIN = 0x746858;
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

function buildShell(stucco, rebar) {
  const g = housePlanGeom();
  const y0 = CITY_Y;
  const yRoof = y0 + HOUSE_H;
  const doorLeft = g.doorX - HOUSE_DOOR_W / 2;
  const doorRight = g.doorX + HOUSE_DOOR_W / 2;

  bandX(stucco, HOUSE_X0, doorLeft, g.doorZ, HOUSE_WALL, y0, HOUSE_DOOR_H, STUCCO);
  bandX(stucco, doorRight, HOUSE_X1, g.doorZ, HOUSE_WALL, y0, HOUSE_DOOR_H, STUCCO);
  bandX(stucco, HOUSE_X0, HOUSE_X1, g.doorZ, HOUSE_WALL,
    y0 + HOUSE_DOOR_H, yRoof - (y0 + HOUSE_DOOR_H), STUCCO2);
  rebarLip(rebar, g.doorX, y0 + HOUSE_DOOR_H / 2, g.doorZ - 0.04,
    HOUSE_DOOR_W, HOUSE_DOOR_H, true);

  const sill = y0 + HOUSE_WIN_SILL;
  const win1 = sill + HOUSE_WIN_H;
  const winLeft = g.winX - HOUSE_WIN_W / 2;
  const winRight = g.winX + HOUSE_WIN_W / 2;
  bandX(stucco, HOUSE_X0, HOUSE_X1, g.winZ, HOUSE_WALL, y0, HOUSE_WIN_SILL, STUCCO);
  bandX(stucco, HOUSE_X0, winLeft, g.winZ, HOUSE_WALL, sill, HOUSE_WIN_H, STUCCO2);
  bandX(stucco, winRight, HOUSE_X1, g.winZ, HOUSE_WALL, sill, HOUSE_WIN_H, STUCCO2);
  bandX(stucco, HOUSE_X0, HOUSE_X1, g.winZ, HOUSE_WALL, win1, yRoof - win1, STUCCO3);
  rebarLip(rebar, g.winX, sill + HOUSE_WIN_H / 2, g.winZ + 0.04,
    HOUSE_WIN_W, HOUSE_WIN_H, true);

  stucco.push(cBox(HOUSE_WALL, HOUSE_H, HOUSE_D, STUCCO,
    HOUSE_X0 + HOUSE_WALL / 2, y0 + HOUSE_H / 2, HOUSE_Z));
  stucco.push(cBox(HOUSE_WALL, HOUSE_H, HOUSE_D, STUCCO,
    HOUSE_X1 - HOUSE_WALL / 2, y0 + HOUSE_H / 2, HOUSE_Z));

  stucco.push(cBox(HOUSE_W + 0.2, HOUSE_PAD_H, HOUSE_D + 0.2, STUCCO3,
    HOUSE_X, y0 + HOUSE_PAD_H / 2, HOUSE_Z));
  stucco.push(cBox(HOUSE_W + 0.16, HOUSE_ROOF_H, HOUSE_D + 0.16, STAIN,
    HOUSE_X, yRoof + HOUSE_ROOF_H / 2, HOUSE_Z));

  // Open leaf — parked, never a filled door.
  stucco.push(cBox(HOUSE_DOOR_W, HOUSE_DOOR_H, HOUSE_LEAF_T, STUCCO2,
    g.leafX, y0 + HOUSE_DOOR_H / 2, g.leafZ));

  stucco.push(cBox(0.10, HOUSE_DOOR_H * 0.62, 0.04, RUST,
    doorLeft - 0.08, y0 + HOUSE_DOOR_H * 0.40, g.doorZ - 0.16));
  stucco.push(cBox(0.10, HOUSE_DOOR_H * 0.48, 0.04, RUST,
    doorRight + 0.08, y0 + HOUSE_DOOR_H * 0.36, g.doorZ - 0.16));

  // Documentary stains — not furniture.
  stucco.push(cBox(1.4, 0.85, 0.03, GRAF_A, HOUSE_X - 1.8, y0 + 3.6, g.doorZ - 0.16));
  stucco.push(cBox(0.9, 0.52, 0.03, GRAF_B, HOUSE_X + 2.1, y0 + 4.2, g.doorZ - 0.16));
}

function buildInterior(stucco) {
  const g = housePlanGeom();
  const y0 = CITY_Y;
  const yMid = y0 + HOUSE_H / 2;

  stucco.push(cBox(HOUSE_WALL, HOUSE_H, HOUSE_D - 2 * HOUSE_WALL, STUCCO2,
    g.stairX0, yMid, HOUSE_Z));
  const eastZ0 = g.ocean + HOUSE_LEAF_T + 0.08;
  const eastD = g.inland - eastZ0;
  stucco.push(cBox(HOUSE_WALL, HOUSE_H, eastD, STUCCO2,
    g.hallX1, y0 + HOUSE_H / 2, (eastZ0 + g.inland) / 2));

  stucco.push(cBox(HOUSE_STAIR_T, HOUSE_H, g.stairLen + 0.12, STUCCO3,
    g.stairX1, yMid, g.stairZ));
  for (let i = 0; i < g.nRise - 1; i++) {
    const tz = g.stairZ0 + i * HOUSE_STAIR_RUN;
    const ty = y0 + i * HOUSE_STAIR_RISE;
    stucco.push(cBox(HOUSE_STAIR - 0.04, HOUSE_STAIR_TREAD, HOUSE_STAIR_RUN * 0.72, STAIN,
      g.stairX, ty + HOUSE_STAIR_TREAD / 2, tz));
  }

  const slabY = y0 + HOUSE_STORY - HOUSE_SLAB / 2;
  stucco.push(cBox(g.stairX0 - HOUSE_X0, HOUSE_SLAB, HOUSE_D, STUCCO3,
    (HOUSE_X0 + g.stairX0) / 2, slabY, HOUSE_Z));
  stucco.push(cBox(HOUSE_X1 - g.hallX1, HOUSE_SLAB, HOUSE_D, STUCCO3,
    (g.hallX1 + HOUSE_X1) / 2, slabY, HOUSE_Z));
  const southD = g.stairZ0 - HOUSE_Z0;
  const northD = HOUSE_Z1 - g.stairZ1;
  if (southD > 0.08) {
    stucco.push(cBox(HOUSE_STAIR, HOUSE_SLAB, southD, STAIN,
      g.stairX, slabY, (HOUSE_Z0 + g.stairZ0) / 2));
  }
  if (northD > 0.08) {
    stucco.push(cBox(HOUSE_STAIR, HOUSE_SLAB, northD, STAIN,
      g.stairX, slabY, (g.stairZ1 + HOUSE_Z1) / 2));
  }
}

/**
 * Build one house kit on the leftover lot. Rejects if the lot is pavement.
 * Never remaps x/z. Scatter stays on tryPlace.
 */
export function buildHouse(ctx) {
  if (onPavement(HOUSE_X, HOUSE_Z)) return null;
  const { root, track, addCollider, addCyl, setTag } = ctx;
  setTag('house');

  const stucco = [];
  const rebar = [];
  buildShell(stucco, rebar);
  buildInterior(stucco);

  const stuccoG = track(mergeGeometries(stucco));
  stucco.forEach((g) => g.dispose());
  const stuccoMesh = new THREE.Mesh(stuccoG, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.94, metalness: 0.02, side: THREE.DoubleSide,
  })));
  stuccoMesh.castShadow = true;
  stuccoMesh.receiveShadow = true;
  stuccoMesh.name = 'house';
  root.add(stuccoMesh);

  const rebarG = track(mergeGeometries(rebar));
  rebar.forEach((g) => g.dispose());
  const rebarMesh = new THREE.Mesh(rebarG, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.58, metalness: 0.42,
  })));
  rebarMesh.castShadow = true;
  rebarMesh.name = 'house-rebar';
  root.add(rebarMesh);

  installHouseColliders(addCyl, addCollider);
  setTag('world');
  return { group: stuccoMesh };
}
