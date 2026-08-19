import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y,
  WAREHOUSE_X, WAREHOUSE_Z, WAREHOUSE_W, WAREHOUSE_D, WAREHOUSE_H,
  WAREHOUSE_WALL, WAREHOUSE_PAD_H, WAREHOUSE_ROOF_H, WAREHOUSE_RACK_H,
  WAREHOUSE_UPRIGHT, WAREHOUSE_BEAM, WAREHOUSE_DOOR_W, WAREHOUSE_DOOR_H,
  WAREHOUSE_LEVELER, WAREHOUSE_LEVELER_T,
  WAREHOUSE_SASH_W, WAREHOUSE_SASH_H, WAREHOUSE_SASH_SILL,
  WAREHOUSE_X0, WAREHOUSE_X1, WAREHOUSE_Z0, WAREHOUSE_Z1,
  warehouseAisleGeom, warehouseSashXs, installWarehouseColliders, onPavement,
} from '../constants.js';
import { cBox } from '../geo.js';

/**
 * Warehouse haunt kit — third reserved-void schema on the Miami tryPlace graph.
 *
 * Leftover industrial lot (not a street / boardwalk / path). Keepout is
 * published in constants.js before scatter; tryPlace drops palms / blades
 * on this cell. This file does not scatter. Colliders are jambs / rack
 * uprights / the leveler lip — never a filled aisle or dock mouth.
 *
 * Kit: stained concrete, rusted rack steel, no furniture.
 * Whoop flies the VNA / sash; 5″ flies the wide aisle / dock.
 * Weenie is the dock mouth.
 */

const CONC = 0x6a6660;
const CONC2 = 0x58544e;
const CONC3 = 0x4a4640;
const STAIN = 0x746e64;
const STEEL = 0x5a5450;
const STEEL2 = 0x6a6460;
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

function buildShell(conc, rebar) {
  const g = warehouseAisleGeom();
  const y0 = CITY_Y;
  const yRoof = y0 + WAREHOUSE_H;
  const doorLeft = g.dockX - WAREHOUSE_DOOR_W / 2;
  const doorRight = g.dockX + WAREHOUSE_DOOR_W / 2;

  bandX(conc, WAREHOUSE_X0, doorLeft, g.oceanZ, WAREHOUSE_WALL, y0, WAREHOUSE_DOOR_H, CONC);
  bandX(conc, doorRight, WAREHOUSE_X1, g.oceanZ, WAREHOUSE_WALL, y0, WAREHOUSE_DOOR_H, CONC);
  bandX(conc, WAREHOUSE_X0, WAREHOUSE_X1, g.oceanZ, WAREHOUSE_WALL,
    y0 + WAREHOUSE_DOOR_H, yRoof - (y0 + WAREHOUSE_DOOR_H), CONC2);
  rebarLip(rebar, g.dockX, y0 + WAREHOUSE_DOOR_H / 2, g.oceanZ - 0.04,
    WAREHOUSE_DOOR_W, WAREHOUSE_DOOR_H, true);

  const sashXs = warehouseSashXs();
  const sill = y0 + WAREHOUSE_SASH_SILL;
  const sash1 = sill + WAREHOUSE_SASH_H;
  bandX(conc, WAREHOUSE_X0, WAREHOUSE_X1, g.inlandZ, WAREHOUSE_WALL, y0, WAREHOUSE_SASH_SILL, CONC);
  let cursor = WAREHOUSE_X0;
  for (let i = 0; i < sashXs.length; i++) {
    const x = sashXs[i];
    bandX(conc, cursor, x - WAREHOUSE_SASH_W / 2, g.inlandZ, WAREHOUSE_WALL, sill, WAREHOUSE_SASH_H, CONC2);
    rebarLip(rebar, x, sill + WAREHOUSE_SASH_H / 2, g.inlandZ + 0.04,
      WAREHOUSE_SASH_W, WAREHOUSE_SASH_H, true);
    cursor = x + WAREHOUSE_SASH_W / 2;
  }
  bandX(conc, cursor, WAREHOUSE_X1, g.inlandZ, WAREHOUSE_WALL, sill, WAREHOUSE_SASH_H, CONC2);
  bandX(conc, WAREHOUSE_X0, WAREHOUSE_X1, g.inlandZ, WAREHOUSE_WALL, sash1, yRoof - sash1, CONC3);

  conc.push(cBox(WAREHOUSE_WALL, WAREHOUSE_H, WAREHOUSE_D, CONC,
    WAREHOUSE_X0 + WAREHOUSE_WALL / 2, y0 + WAREHOUSE_H / 2, WAREHOUSE_Z));
  conc.push(cBox(WAREHOUSE_WALL, WAREHOUSE_H, WAREHOUSE_D, CONC,
    WAREHOUSE_X1 - WAREHOUSE_WALL / 2, y0 + WAREHOUSE_H / 2, WAREHOUSE_Z));

  conc.push(cBox(WAREHOUSE_W + 0.2, WAREHOUSE_PAD_H, WAREHOUSE_D + 0.2, CONC3,
    WAREHOUSE_X, y0 + WAREHOUSE_PAD_H / 2, WAREHOUSE_Z));
  conc.push(cBox(WAREHOUSE_W + 0.16, WAREHOUSE_ROOF_H, WAREHOUSE_D + 0.16, STAIN,
    WAREHOUSE_X, yRoof + WAREHOUSE_ROOF_H / 2, WAREHOUSE_Z));

  // Leveler apron — weenie lip outside the mouth, never a filled door.
  conc.push(cBox(WAREHOUSE_DOOR_W, WAREHOUSE_LEVELER_T, WAREHOUSE_LEVELER, STEEL2,
    g.dockX, y0 + WAREHOUSE_LEVELER_T / 2, WAREHOUSE_Z0 - WAREHOUSE_LEVELER / 2));

  // rust streaks on the dock jambs
  conc.push(cBox(0.10, WAREHOUSE_DOOR_H * 0.72, 0.04, RUST,
    doorLeft - 0.08, y0 + WAREHOUSE_DOOR_H * 0.42, g.oceanZ - 0.16));
  conc.push(cBox(0.10, WAREHOUSE_DOOR_H * 0.58, 0.04, RUST,
    doorRight + 0.08, y0 + WAREHOUSE_DOOR_H * 0.38, g.oceanZ - 0.16));

  // Documentary stains — not furniture.
  conc.push(cBox(1.7, 1.05, 0.03, GRAF_A, WAREHOUSE_X - 2.2, y0 + 4.1, g.oceanZ - 0.16));
  conc.push(cBox(1.1, 0.62, 0.03, GRAF_B, WAREHOUSE_X + 3.4, y0 + 4.6, g.oceanZ - 0.16));
}

function buildRacks(conc) {
  const g = warehouseAisleGeom();
  const y0 = CITY_Y;
  const nPost = 5;
  const beamY0 = [1.35, 2.85, 4.35];
  for (let b = 0; b < g.rackBays.length; b++) {
    const bay = g.rackBays[b];
    const xW = bay[0] + WAREHOUSE_UPRIGHT / 2;
    const xE = bay[1] - WAREHOUSE_UPRIGHT / 2;
    for (let i = 0; i < nPost; i++) {
      const t = nPost === 1 ? 0.5 : i / (nPost - 1);
      const z = g.z0 + 0.45 + t * (g.aisleD - 0.90);
      conc.push(cBox(WAREHOUSE_UPRIGHT, WAREHOUSE_RACK_H, WAREHOUSE_UPRIGHT, STEEL,
        xW, y0 + WAREHOUSE_RACK_H / 2, z));
      conc.push(cBox(WAREHOUSE_UPRIGHT, WAREHOUSE_RACK_H, WAREHOUSE_UPRIGHT, STEEL,
        xE, y0 + WAREHOUSE_RACK_H / 2, z));
    }
    const faceW = bay[0] + WAREHOUSE_BEAM / 2;
    const faceE = bay[1] - WAREHOUSE_BEAM / 2;
    for (let k = 0; k < beamY0.length; k++) {
      conc.push(cBox(WAREHOUSE_BEAM, WAREHOUSE_BEAM, g.aisleD - 0.35, STEEL2,
        faceW, y0 + beamY0[k] + WAREHOUSE_BEAM / 2, g.midZ));
      conc.push(cBox(WAREHOUSE_BEAM, WAREHOUSE_BEAM, g.aisleD - 0.35, STEEL2,
        faceE, y0 + beamY0[k] + WAREHOUSE_BEAM / 2, g.midZ));
    }
  }
}

/**
 * Build one warehouse kit on the leftover lot. Rejects if the lot is pavement.
 * Never remaps x/z. Scatter stays on tryPlace.
 */
export function buildWarehouse(ctx) {
  if (onPavement(WAREHOUSE_X, WAREHOUSE_Z)) return null;
  const { root, track, addCollider, addCyl, setTag } = ctx;
  setTag('warehouse');

  const conc = [];
  const rebar = [];
  buildShell(conc, rebar);
  buildRacks(conc);

  const concG = track(mergeGeometries(conc));
  conc.forEach((g) => g.dispose());
  const concMesh = new THREE.Mesh(concG, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.94, metalness: 0.02, side: THREE.DoubleSide,
  })));
  concMesh.castShadow = true;
  concMesh.receiveShadow = true;
  concMesh.name = 'warehouse';
  root.add(concMesh);

  const rebarG = track(mergeGeometries(rebar));
  rebar.forEach((g) => g.dispose());
  const rebarMesh = new THREE.Mesh(rebarG, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.58, metalness: 0.42,
  })));
  rebarMesh.castShadow = true;
  rebarMesh.name = 'warehouse-rebar';
  root.add(rebarMesh);

  installWarehouseColliders(addCyl, addCollider);
  setTag('world');
  return { group: concMesh };
}
