import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CITY_Y,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z,
  LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z,
  LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z,
  LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z,
  LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z,
  LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z,
  LEFTOVER_LOT_GATE_W,
  LEFTOVER_LOT_WALK_W, LEFTOVER_LOT_WALK_H,
  LEFTOVER_LOT_SHED_DOOR_W, LEFTOVER_LOT_SHED_DOOR_H,
  LEFTOVER_LOT_POST, LEFTOVER_LOT_MESH_T, LEFTOVER_LOT_JAMB, LEFTOVER_LOT_WALL,
  leftoverLotGeom, leftoverLotPlantSpots, inLeftoverLotGate,
  installLeftoverLotColliders, onPavement, groundHeight,
} from '../constants.js';
import { tryPlace } from '../planting.js';
import { cBox, cCyl, stripBoxCaps, roofSlabGeo } from '../geo.js';

/**
 * leftoverLot — leftover-city vacant parcels on the Miami tryPlace graph.
 *
 * Not leftover-dirt hulls. Not OSM. Not a fifth haunt. Not follow-mode restack.
 * Keepout is published in constants.js before scatter; tryPlace drops palms /
 * blades on these cells. Palms and weeds grow-to-gap inside the lot, lean at
 * the fence, tryPlace-drop off pavement and the gate void. Reject-or-drop,
 * never nudge. Colliders are fence posts + thin mesh plane + gate jambs —
 * never a lot-AABB, never a box in the gate.
 *
 * Kit: chain-link, one street-front vehicle gate, optional CMU shed, optional
 * dumpster. Ground is leftover-city grade (CITY_Y / crushed limestone +
 * patchy grass). weenie is the ocean-face vehicle gate (z0, facing −Z).
 * Lot B is the same leftoverLotGeom kit at the signed 295/84 cell — not a
 * leftoverLotBGeom fork, not a restack of #34 at 258/84.
 * Lot C is the same leftoverLotGeom kit at the signed 313/84 cell — not a
 * leftoverLotCGeom fork, not a slide of A or B.
 * Lot D is the same leftoverLotGeom kit at the signed 330/84 cell — not a
 * leftoverLotDGeom fork, not a slide of A, B, or C.
 * Lot E is the same leftoverLotGeom kit at the signed 347/84 cell — not a
 * leftoverLotEGeom fork, not a slide of A–D.
 * Lot F is the same leftoverLotGeom kit at the signed 364/84 cell — not a
 * leftoverLotFGeom fork, not a slide of A–E.
 * Lot G is the same leftoverLotGeom kit at the signed 381/84 cell — not a
 * leftoverLotGGeom fork, not leftoverLotDirtGeom, not a slide of A–F.
 * G-park waits — do not place a pocket park inland of G.
 */

const STEEL = 0x7a8078;
const STEEL2 = 0x6a7068;
const RUST = 0x6a4034;
const RUST2 = 0x8a5340;
const CMU = 0x8a8680;
const CMU2 = 0x7a7670;
const LID = 0x6e6a64;
const DUMP = 0x3a5a3c;
const DUMP2 = 0x2e4a30;
const LIME = 0xc4b89a;
const LIME2 = 0xb0a488;
const GRASS = 0x5a6e42;
const WEED = 0x4a6238;

function lotPlantDrop(ctx, x, z) {
  // tryPlace-drop off pavement and the gate void. Reject-or-drop, never nudge.
  if (inLeftoverLotGate(x, z)) return 0;
  if (onPavement(x, z)) return tryPlace(ctx, x, z);
  return groundHeight(x, z);
}

function buildPad(parts, g) {
  const y = CITY_Y + 0.012;
  const cols = 7, rows = 6;
  const cw = LEFTOVER_LOT_W / cols;
  const cd = LEFTOVER_LOT_D / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let h = Math.imul(i + 3, 0x27d4eb2d) ^ Math.imul(j + 11, 0x165667b1);
      h = Math.imul(h ^ (h >>> 15), 0x2545f491);
      const u = ((h ^ (h >>> 13)) >>> 0) / 4294967296;
      const hex = u < 0.28 ? GRASS : (u < 0.62 ? LIME : LIME2);
      parts.push(cBox(cw * 0.98, 0.018, cd * 0.98, hex,
        g.x0 + (i + 0.5) * cw, y, g.z0 + (j + 0.5) * cd));
    }
  }
}

function buildFence(steel, rust, g) {
  const y0 = CITY_Y;
  const midY = y0 + g.h / 2;
  for (let i = 0; i < g.posts.length; i++) {
    const p = g.posts[i];
    steel.push(cCyl(LEFTOVER_LOT_POST / 2, LEFTOVER_LOT_POST / 2, g.h, 8, STEEL,
      p.x, midY, p.z));
  }
  for (let i = 0; i < g.meshRuns.length; i++) {
    const run = g.meshRuns[i];
    if (run.axis === 'x') {
      const w = run.x1 - run.x0;
      if (w <= 0.04) continue;
      const cx = (run.x0 + run.x1) / 2;
      steel.push(cBox(w, 0.04, LEFTOVER_LOT_POST, STEEL2, cx, y0 + g.h - 0.03, run.z));
      steel.push(cBox(w, 0.03, LEFTOVER_LOT_POST * 0.7, STEEL2, cx, y0 + 0.12, run.z));
    } else {
      const d = run.z1 - run.z0;
      if (d <= 0.04) continue;
      const cz = (run.z0 + run.z1) / 2;
      steel.push(cBox(LEFTOVER_LOT_POST, 0.04, d, STEEL2, run.x, y0 + g.h - 0.03, cz));
      steel.push(cBox(LEFTOVER_LOT_POST * 0.7, 0.03, d, STEEL2, run.x, y0 + 0.12, cz));
    }
  }
  // Weenie: rusted vehicle-gate jamb on the ocean face. Opening is empty air.
  rust.push(cBox(LEFTOVER_LOT_JAMB, g.h, LEFTOVER_LOT_JAMB, RUST,
    g.gateLeft, midY, g.gateZ));
  rust.push(cBox(LEFTOVER_LOT_JAMB, g.h, LEFTOVER_LOT_JAMB, RUST,
    g.gateRight, midY, g.gateZ));
  rust.push(cBox(LEFTOVER_LOT_GATE_W + LEFTOVER_LOT_JAMB, 0.08, LEFTOVER_LOT_JAMB, RUST2,
    g.gateX, y0 + g.h + 0.04, g.gateZ));
  rust.push(cBox(0.06, g.h * 0.55, 0.04, RUST2,
    g.gateLeft - 0.08, y0 + g.h * 0.42, g.gateZ - 0.08));
  rust.push(cBox(0.06, g.h * 0.42, 0.04, RUST,
    g.gateRight + 0.08, y0 + g.h * 0.38, g.gateZ - 0.08));

  rust.push(cBox(LEFTOVER_LOT_JAMB, LEFTOVER_LOT_WALK_H, LEFTOVER_LOT_JAMB, RUST,
    g.walkLeft, y0 + LEFTOVER_LOT_WALK_H / 2, g.walkZ));
  rust.push(cBox(LEFTOVER_LOT_JAMB, LEFTOVER_LOT_WALK_H, LEFTOVER_LOT_JAMB, RUST,
    g.walkRight, y0 + LEFTOVER_LOT_WALK_H / 2, g.walkZ));
  rust.push(cBox(LEFTOVER_LOT_WALK_W + LEFTOVER_LOT_JAMB, 0.08, LEFTOVER_LOT_JAMB, RUST2,
    g.walkX, y0 + LEFTOVER_LOT_WALK_H + 0.04, g.walkZ));
}

function buildMeshPlanes(root, track, g) {
  const y0 = CITY_Y;
  const mat = track(new THREE.MeshStandardMaterial({
    color: 0x8a9088, roughness: 0.42, metalness: 0.55,
    transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false,
  }));
  for (let i = 0; i < g.meshRuns.length; i++) {
    const run = g.meshRuns[i];
    let geo;
    if (run.axis === 'x') {
      const w = run.x1 - run.x0;
      if (w <= 0.04) continue;
      geo = new THREE.BoxGeometry(w, g.h, LEFTOVER_LOT_MESH_T);
      geo.translate((run.x0 + run.x1) / 2, y0 + g.h / 2, run.z);
    } else {
      const d = run.z1 - run.z0;
      if (d <= 0.04) continue;
      geo = new THREE.BoxGeometry(LEFTOVER_LOT_MESH_T, g.h, d);
      geo.translate(run.x, y0 + g.h / 2, (run.z0 + run.z1) / 2);
    }
    const mesh = new THREE.Mesh(track(geo), mat);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.name = 'leftoverLot-mesh';
    root.add(mesh);
  }
}

function buildShed(cmu, lidParts, g) {
  const y0 = CITY_Y;
  const wt = LEFTOVER_LOT_WALL;
  const midY = y0 + g.shedH / 2;
  const wall = (w, h, d, hex, x, y, z) => {
    const geo = cBox(w, h, d, hex, x, y, z);
    stripBoxCaps(geo);
    return geo;
  };
  cmu.push(wall(wt, g.shedH, g.shedD, CMU,
    g.shedX - g.shedW / 2 + wt / 2, midY, g.shedZ));
  cmu.push(wall(g.shedW, g.shedH, wt, CMU2,
    g.shedX, midY, g.shedZ + g.shedD / 2 - wt / 2));
  cmu.push(wall(g.shedW, g.shedH, wt, CMU2,
    g.shedX, midY, g.shedZ - g.shedD / 2 + wt / 2));

  const doorLeft = g.shedDoorZ - LEFTOVER_LOT_SHED_DOOR_W / 2;
  const doorRight = g.shedDoorZ + LEFTOVER_LOT_SHED_DOOR_W / 2;
  const eastX = g.shedX + g.shedW / 2 - wt / 2;
  const southJamb = doorLeft - (g.shedZ - g.shedD / 2);
  const northJamb = (g.shedZ + g.shedD / 2) - doorRight;
  if (southJamb > 0.04) {
    cmu.push(cBox(wt, LEFTOVER_LOT_SHED_DOOR_H, southJamb, CMU,
      eastX, y0 + LEFTOVER_LOT_SHED_DOOR_H / 2,
      g.shedZ - g.shedD / 2 + southJamb / 2));
  }
  if (northJamb > 0.04) {
    cmu.push(cBox(wt, LEFTOVER_LOT_SHED_DOOR_H, northJamb, CMU,
      eastX, y0 + LEFTOVER_LOT_SHED_DOOR_H / 2,
      g.shedZ + g.shedD / 2 - northJamb / 2));
  }
  const lintel = g.shedH - LEFTOVER_LOT_SHED_DOOR_H;
  if (lintel > 0.04) {
    cmu.push(cBox(wt, lintel, g.shedD, CMU2,
      eastX, y0 + LEFTOVER_LOT_SHED_DOOR_H + lintel / 2, g.shedZ));
  }
  // Honest lid — wall atlas dies at soffit; no windows on the roof.
  const lid = roofSlabGeo(g.shedW, g.shedD, g.shedX, y0 + g.shedH, g.shedZ, 0, 0.12);
  lidParts.push(lid);
}

function buildDumpster(parts, g) {
  const y0 = CITY_Y;
  parts.push(cBox(g.dumpW, g.dumpH, g.dumpD, DUMP,
    g.dumpX, y0 + g.dumpH / 2, g.dumpZ));
  parts.push(cBox(g.dumpW + 0.04, 0.06, g.dumpD + 0.04, DUMP2,
    g.dumpX, y0 + g.dumpH + 0.02, g.dumpZ));
  parts.push(cBox(0.06, 0.22, g.dumpD * 0.55, RUST,
    g.dumpX + g.dumpW / 2 + 0.02, y0 + g.dumpH * 0.62, g.dumpZ));
}

function buildWeeds(parts, spots) {
  const y0 = CITY_Y;
  for (let i = 0; i < spots.length; i++) {
    const s = spots[i];
    const h = 0.18 + s.sc * 0.16;
    parts.push(cBox(0.07, h, 0.05, WEED,
      s.x, y0 + h / 2, s.z, 0, 0, s.lean));
    parts.push(cBox(0.05, h * 0.82, 0.04, GRASS,
      s.x + 0.04, y0 + h * 0.40, s.z + 0.03, 0, 0.6, -s.lean * 0.6));
  }
}

/**
 * Instance the leftoverLot kit on each leftover-city parcel. Rejects if the
 * lot is pavement. Never remaps x/z. Scatter stays on tryPlace.
 */
export function buildLeftoverLot(ctx) {
  if (onPavement(LEFTOVER_LOT_X, LEFTOVER_LOT_Z)) return null;
  const { root, track, addCollider, addCyl, setTag } = ctx;
  setTag('leftoverLot');

  const pad = [];
  const steel = [];
  const rust = [];
  const cmu = [];
  const lid = [];
  const dump = [];
  const weeds = [];
  const keptWeeds = [];

  const lots = [leftoverLotGeom()];
  if (!onPavement(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z)) {
    lots.push(leftoverLotGeom(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z));
  }
  if (!onPavement(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)) {
    lots.push(leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z));
  }
  if (!onPavement(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z)) {
    lots.push(leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z));
  }
  if (!onPavement(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z)) {
    lots.push(leftoverLotGeom(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z));
  }
  if (!onPavement(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z)) {
    lots.push(leftoverLotGeom(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z));
  }
  if (!onPavement(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z)) {
    lots.push(leftoverLotGeom(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z));
  }

  for (let n = 0; n < lots.length; n++) {
    const g = lots[n];
    buildPad(pad, g);
    buildFence(steel, rust, g);
    buildShed(cmu, lid, g);
    buildDumpster(dump, g);
    buildMeshPlanes(root, track, g);

    const plants = leftoverLotPlantSpots(g);
    for (let i = 0; i < plants.weeds.length; i++) {
      const p = plants.weeds[i];
      if (!lotPlantDrop(ctx, p.x, p.z)) continue;
      keptWeeds.push(p);
    }
    for (let i = 0; i < plants.palms.length; i++) {
      const p = plants.palms[i];
      if (!lotPlantDrop(ctx, p.x, p.z)) continue;
      ctx.extraPalms.push({ x: p.x, z: p.z, sc: p.sc });
    }
  }
  buildWeeds(weeds, keptWeeds);

  const mergeAdd = (geos, name, extra = {}) => {
    if (!geos.length) return null;
    const g = track(mergeGeometries(geos));
    geos.forEach((geo) => geo.dispose());
    const mesh = new THREE.Mesh(g, track(new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.92, metalness: 0.04, side: THREE.DoubleSide,
      ...extra,
    })));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    root.add(mesh);
    return mesh;
  };

  const padMesh = mergeAdd(pad, 'leftoverLot-pad', { roughness: 0.96, metalness: 0 });
  if (padMesh) padMesh.castShadow = false;
  mergeAdd(steel, 'leftoverLot-steel', { roughness: 0.48, metalness: 0.46 });
  mergeAdd(rust, 'leftoverLot-jamb', { roughness: 0.58, metalness: 0.38 });
  mergeAdd(cmu, 'leftoverLot-shed');
  if (lid.length) {
    const lidG = track(mergeGeometries(lid));
    lid.forEach((geo) => geo.dispose());
    const lidMesh = new THREE.Mesh(lidG, track(new THREE.MeshStandardMaterial({
      color: LID, roughness: 0.94, metalness: 0.02,
    })));
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    lidMesh.name = 'leftoverLot-lid';
    root.add(lidMesh);
  }
  mergeAdd(dump, 'leftoverLot-dumpster', { roughness: 0.72, metalness: 0.18 });
  mergeAdd(weeds, 'leftoverLot-weeds', { roughness: 1, metalness: 0 });

  installLeftoverLotColliders(addCyl, addCollider);
  setTag('world');
  return { group: padMesh };
}
