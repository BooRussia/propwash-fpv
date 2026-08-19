import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y,
  ABANDO_X, ABANDO_Z, ABANDO_W, ABANDO_D, ABANDO_H, ABANDO_WALL,
  ABANDO_PAD_H, ABANDO_ROOF_H,
  ABANDO_BAY_W, ABANDO_BAY_H, ABANDO_BAY_SILL, ABANDO_BAY_XS,
  ABANDO_SASH_W, ABANDO_SASH_H, ABANDO_SASH_SILL, ABANDO_SASH_XS,
  ABANDO_STAIR_CLEAR, ABANDO_STAIR_T, ABANDO_STAIR_RISE, ABANDO_STAIR_RUN,
  ABANDO_STAIR_TREAD,
  ABANDO_SILO_R, ABANDO_SILO_WALL, ABANDO_SILO_H, ABANDO_MANHOLE,
  ABANDO_CROWN_H, ABANDO_STACK_H,
  ABANDO_SILO_X, ABANDO_SILO_Z, ABANDO_X0, ABANDO_X1, ABANDO_Z0, ABANDO_Z1,
  abandoStairGeom, installAbandoColliders, onPavement,
} from '../constants.js';
import { cBox, cCyl, colorFill } from '../geo.js';

/**
 * Abando haunt kit — first reserved-void schema on the Miami tryPlace graph.
 *
 * Leftover city lot (not a street / boardwalk). Keepout is published in
 * constants.js before scatter; tryPlace drops palms / blades on this cell.
 * This file does not scatter. Colliders are jambs / stringers / the silo
 * lip — never a filled bay, stair, or manhole.
 *
 * Kit: graffiti concrete, rebar lips, no furniture.
 * Whoop flies sash / stair; 5″ flies the 2.2 m bays; manhole is Ø0.61 m.
 * Weenie is the silo crown + roof stack.
 */

const CONC = 0x6e6a62;
const CONC2 = 0x5c5850;
const CONC3 = 0x4e4a44;
const STAIN = 0x7a7468;
const REBAR = 0x6a3e28;
const REBAR2 = 0x8a5340;
const GRAF_A = 0x3f4a38;
const GRAF_B = 0x4a3840;
const GRAF_C = 0x2c3338;
const RUST = 0x5a4038;

function tube(r0, r1, h, seg, hex, x, y, z) {
  const g = new THREE.CylinderGeometry(r0, r1, h, seg, 1, true);
  g.translate(x, y, z);
  return colorFill(g, hex);
}

function bandX(parts, x0, x1, z, sz, y0, sy, hex) {
  const w = x1 - x0;
  if (w <= 0.04) return;
  parts.push(cBox(w, sy, sz, hex, (x0 + x1) / 2, y0 + sy / 2, z));
}

function punchFace(parts, z, openings, y0, y1, hex) {
  const sorted = openings.slice().sort((a, b) => a.x - b.x);
  let cursor = ABANDO_X0;
  for (let i = 0; i < sorted.length; i++) {
    const o = sorted[i];
    bandX(parts, cursor, o.x - o.w / 2, z, ABANDO_WALL, y0, y1 - y0, hex);
    cursor = o.x + o.w / 2;
  }
  bandX(parts, cursor, ABANDO_X1, z, ABANDO_WALL, y0, y1 - y0, hex);
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
  const y0 = CITY_Y;
  const yRoof = y0 + ABANDO_H;
  const oceanZ = ABANDO_Z0 + ABANDO_WALL / 2;
  const inlandZ = ABANDO_Z1 - ABANDO_WALL / 2;
  const bays = ABANDO_BAY_XS.map((x) => ({ x, w: ABANDO_BAY_W }));
  const sashes = ABANDO_SASH_XS.map((x) => ({ x, w: ABANDO_SASH_W }));
  const groundTop = y0 + ABANDO_BAY_SILL + ABANDO_BAY_H;
  const sash0 = y0 + ABANDO_SASH_SILL;
  const sash1 = sash0 + ABANDO_SASH_H;

  punchFace(conc, oceanZ, bays, y0, groundTop, CONC);
  for (const x of ABANDO_BAY_XS) {
    conc.push(cBox(ABANDO_BAY_W, ABANDO_BAY_SILL, ABANDO_WALL, CONC2,
      x, y0 + ABANDO_BAY_SILL / 2, oceanZ));
    rebarLip(rebar, x, y0 + ABANDO_BAY_SILL + ABANDO_BAY_H / 2, oceanZ - 0.04,
      ABANDO_BAY_W, ABANDO_BAY_H, true);
  }
  bandX(conc, ABANDO_X0, ABANDO_X1, oceanZ, ABANDO_WALL, groundTop, sash0 - groundTop, CONC2);
  punchFace(conc, oceanZ, sashes, sash0, sash1, CONC);
  for (const x of ABANDO_SASH_XS) {
    rebarLip(rebar, x, sash0 + ABANDO_SASH_H / 2, oceanZ - 0.04,
      ABANDO_SASH_W, ABANDO_SASH_H, true);
  }
  bandX(conc, ABANDO_X0, ABANDO_X1, oceanZ, ABANDO_WALL, sash1, yRoof - sash1, CONC3);

  punchFace(conc, inlandZ, bays, y0, groundTop, CONC);
  for (const x of ABANDO_BAY_XS) {
    conc.push(cBox(ABANDO_BAY_W, ABANDO_BAY_SILL, ABANDO_WALL, CONC2,
      x, y0 + ABANDO_BAY_SILL / 2, inlandZ));
    rebarLip(rebar, x, y0 + ABANDO_BAY_SILL + ABANDO_BAY_H / 2, inlandZ + 0.04,
      ABANDO_BAY_W, ABANDO_BAY_H, true);
  }
  bandX(conc, ABANDO_X0, ABANDO_X1, inlandZ, ABANDO_WALL, groundTop, yRoof - groundTop, CONC2);

  conc.push(cBox(ABANDO_WALL, ABANDO_H, ABANDO_D, CONC,
    ABANDO_X0 + ABANDO_WALL / 2, y0 + ABANDO_H / 2, ABANDO_Z));

  const eastX = ABANDO_X1 - ABANDO_WALL / 2;
  const eastJambD = (ABANDO_D - ABANDO_BAY_W) / 2;
  conc.push(cBox(ABANDO_WALL, groundTop - y0, eastJambD, CONC,
    eastX, y0 + (groundTop - y0) / 2, ABANDO_Z0 + eastJambD / 2));
  conc.push(cBox(ABANDO_WALL, groundTop - y0, eastJambD, CONC,
    eastX, y0 + (groundTop - y0) / 2, ABANDO_Z1 - eastJambD / 2));
  conc.push(cBox(ABANDO_WALL, ABANDO_BAY_SILL, ABANDO_BAY_W, CONC2,
    eastX, y0 + ABANDO_BAY_SILL / 2, ABANDO_Z));
  conc.push(cBox(ABANDO_WALL, yRoof - groundTop, ABANDO_BAY_W, CONC3,
    eastX, groundTop + (yRoof - groundTop) / 2, ABANDO_Z));
  rebarLip(rebar, eastX + 0.04, y0 + ABANDO_BAY_SILL + ABANDO_BAY_H / 2, ABANDO_Z,
    ABANDO_BAY_W, ABANDO_BAY_H, false);

  conc.push(cBox(ABANDO_W + 0.2, ABANDO_PAD_H, ABANDO_D + 0.2, CONC3,
    ABANDO_X, y0 + ABANDO_PAD_H / 2, ABANDO_Z));
  conc.push(cBox(ABANDO_W + 0.16, ABANDO_ROOF_H, ABANDO_D + 0.16, STAIN,
    ABANDO_X, yRoof + ABANDO_ROOF_H / 2, ABANDO_Z));

  // Weenie stack — soot brick, no opening.
  conc.push(cBox(0.62, ABANDO_STACK_H, 0.62, RUST,
    ABANDO_X0 + 2.1, yRoof + ABANDO_STACK_H / 2, ABANDO_Z1 - 2.0));
  conc.push(cCyl(0.18, 0.16, 0.55, 8, REBAR,
    ABANDO_X0 + 2.1, yRoof + ABANDO_STACK_H + 0.22, ABANDO_Z1 - 2.0));

  // Documentary tags — stained rectangles, not neon.
  conc.push(cBox(1.8, 1.1, 0.03, GRAF_A, 218.2, y0 + 3.6, oceanZ - 0.17));
  conc.push(cBox(1.35, 0.7, 0.03, GRAF_B, 225.0, y0 + 3.35, oceanZ - 0.17));
  conc.push(cBox(0.95, 1.4, 0.03, GRAF_C, 229.6, y0 + 3.8, oceanZ - 0.17));
  conc.push(cBox(1.1, 0.55, 0.03, GRAF_B, 221.8, y0 + 6.05, oceanZ - 0.17));
}

function buildStair(conc, rebar) {
  const st = abandoStairGeom();
  const y0 = CITY_Y;
  conc.push(cBox(ABANDO_STAIR_T, ABANDO_H, st.length + 0.12, CONC3,
    st.innerX + ABANDO_STAIR_T / 2, y0 + ABANDO_H / 2, st.z0 + st.length / 2));
  conc.push(cBox(ABANDO_STAIR_T, ABANDO_H, st.length + 0.12, CONC3,
    st.outerX + ABANDO_STAIR_T / 2, y0 + ABANDO_H / 2, st.z0 + st.length / 2));
  for (let i = 0; i < st.nRise; i++) {
    const tz = st.z0 + i * ABANDO_STAIR_RUN;
    const ty = y0 + i * ABANDO_STAIR_RISE;
    conc.push(cBox(ABANDO_STAIR_CLEAR, ABANDO_STAIR_TREAD, ABANDO_STAIR_RUN * 0.72, STAIN,
      st.clearX, ty + ABANDO_STAIR_TREAD / 2, tz));
  }
  // rust rail along the outer stringer — visual lip, not a filled well
  rebar.push(cBox(0.04, ABANDO_H * 0.92, st.length, REBAR,
    st.outerX - 0.02, y0 + ABANDO_H * 0.5, st.z0 + st.length / 2));
}

function buildSilo(conc, rebar) {
  const y0 = CITY_Y;
  const h = ABANDO_SILO_H;
  const rOut = ABANDO_SILO_R;
  const rIn = ABANDO_SILO_R - ABANDO_SILO_WALL;
  conc.push(tube(rOut, rOut, h, 18, CONC, ABANDO_SILO_X, y0 + h / 2, ABANDO_SILO_Z));
  conc.push(tube(rIn, rIn, h, 16, CONC2, ABANDO_SILO_X, y0 + h / 2, ABANDO_SILO_Z));
  // rust streaks
  for (const a of [0.4, 1.7, 3.3, 4.8]) {
    const x = ABANDO_SILO_X + Math.cos(a) * (rOut + 0.02);
    const z = ABANDO_SILO_Z + Math.sin(a) * (rOut + 0.02);
    conc.push(cBox(0.18, h * 0.72, 0.04, RUST, x, y0 + h * 0.42, z));
  }
  const mhR = ABANDO_MANHOLE / 2;
  const ring = new THREE.RingGeometry(mhR + 0.02, rOut + 0.05, 20);
  ring.rotateX(-Math.PI / 2);
  ring.translate(ABANDO_SILO_X, y0 + h + ABANDO_CROWN_H * 0.15, ABANDO_SILO_Z);
  conc.push(colorFill(ring, CONC3));
  // manhole lip + rust hat — tubes, never a filled cap
  rebar.push(tube(mhR + 0.045, mhR + 0.03, ABANDO_CROWN_H, 12, REBAR,
    ABANDO_SILO_X, y0 + h + ABANDO_CROWN_H / 2, ABANDO_SILO_Z));
  rebar.push(tube(rOut + 0.07, rOut + 0.01, 0.20, 14, REBAR2,
    ABANDO_SILO_X, y0 + h + 0.28, ABANDO_SILO_Z));
}

/**
 * Build one abando kit on the leftover lot. Rejects if the lot is pavement.
 * Never remaps x/z. Scatter stays on tryPlace.
 */
export function buildAbando(ctx) {
  if (onPavement(ABANDO_X, ABANDO_Z)) return null;
  const { root, track, addCollider, addCyl, setTag } = ctx;
  setTag('abando');

  const conc = [];
  const rebar = [];
  buildShell(conc, rebar);
  buildStair(conc, rebar);
  buildSilo(conc, rebar);

  const concG = track(mergeGeometries(conc));
  conc.forEach((g) => g.dispose());
  const concMesh = new THREE.Mesh(concG, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.94, metalness: 0.02, side: THREE.DoubleSide,
  })));
  concMesh.castShadow = true;
  concMesh.receiveShadow = true;
  concMesh.name = 'abando';
  root.add(concMesh);

  const rebarG = track(mergeGeometries(rebar));
  rebar.forEach((g) => g.dispose());
  const rebarMesh = new THREE.Mesh(rebarG, track(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.58, metalness: 0.42,
  })));
  rebarMesh.castShadow = true;
  rebarMesh.name = 'abando-rebar';
  root.add(rebarMesh);

  installAbandoColliders(addCyl, addCollider);
  setTag('world');
  return { group: concMesh };
}
