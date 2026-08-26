import * as THREE from 'three';
import { createPalms } from '../vegetation.js';
import {
  PIER_X, ROAD_Z0, ROAD_Z1, GAP_X, XS_HALF,
  BOARDWALK_Z, BOARDWALK_D,
  PALM_BEACH_LAWN_CELLS,
  groundHeight, stripY, inKeepout, onPavement, leftoverLotOverlap,
} from './constants.js';
import { hash01 } from './rng.js';
import { tryPlace } from './planting.js';

// ============================================================
// Palms — planned on the legacy layout stream, PLACED after every structure
// exists so each position can be rejected against the live collider bag.
//
// planPalms()        draws the candidate positions (main rng, exact legacy
//                    sequence — tower/car/hut layout depends on it)
// materializePalms() runs the rejection test, re-rolls rejects on rng5,
//                    instances the field and stamps the tree grates
//
// A palm is rejected when its TRUNK would stand inside anything solid, when
// its CROWN would push into a structure (1.2 m of clearance is demanded, per
// the crown radius), when its crown disk intersects the signed boardwalk
// deck (BOARDWALK_Z / BOARDWALK_D — kiss = drop), when it lands ocean of
// the boardwalk (z < 21.8, after the legacy draws — never a z rewrite),
// when it lands on pavement (boardwalk / Ocean Drive / cross-street /
// Lummus walk) or a ground keep-out, or when it would clip a palm already
// placed. Pavement, deck, and sand fails DROP the candidate — they are
// never nudged onto the promenade or off the rail. Colliders are trunk
// cylinders only.
// ============================================================

const CROWN_MARGIN = 1.2;      // metres of air demanded around the crown
// Crown half-span of a unit-scale field palm, MEASURED from the widest frond
// variant's geometry bounding box (vegetation.js ships three crowns; the
// broadest is 7.27 m across). Guessing low here is the classic cause of
// "palm growing through a facade": the trunk clears, the fronds do not.
const CROWN_R = 3.64;
const TRUNK_R = 0.30;          // collider radius of a unit-scale trunk
const MIN_SPACING = 3.4;       // trunk-to-trunk

/**
 * Queue extra beach tree-lawn palms. hash01 only; tryPlace drop, never remap.
 * Must run after landmarks have published colliders, before materializePalms.
 */
export function queueBeachLawnPalms(ctx) {
  const extras = ctx.extraPalms || (ctx.extraPalms = []);
  for (let i = 0; i < PALM_BEACH_LAWN_CELLS.length; i++) {
    const [x, z] = PALM_BEACH_LAWN_CELLS[i];
    if (x >= 240) continue;
    if (z > 40.2 && z < 47.8) continue;
    if (leftoverLotOverlap(x, z, 1.2, 1.2, 0.15)) continue;
    if (GAP_X.some((c) => Math.abs(x - c) < XS_HALF + 2.4)) continue;
    if (Math.abs(x - PIER_X) < 12) continue;
    if (!tryPlace(ctx, x, z, { r: 0.9, h: 6.2, minY: 0.1, keepout: 1.0 })) continue;
    extras.push({
      x, z,
      sc: 0.85 + hash01(i, 3301) * 0.35,
      rotY: hash01(i, 3311) * Math.PI * 2,
    });
  }
}

/** Legacy candidate draw. Consumes exactly the rng draws it always did. */
export function planPalms(ctx) {
  const { rng } = ctx;
  const plan = [];
  const N = 170;
  let placed = 0;
  while (placed < N) {
    const x = (rng() - 0.5) * 1200;
    let z = rng() < 0.72 ? 26 + rng() * 32 : 6 + rng() * 18;   // road rows + scattered sand
    // never in the road lanes: snap to the nearest sidewalk row (deterministic
    // remap — consumes no extra draws, so the legacy stream is untouched)
    if (z > ROAD_Z0 && z < ROAD_Z1) z = z < 44 ? 36.5 : 51.5;
    if (Math.abs(x - PIER_X) < 12 && z < 36) continue;
    if (groundHeight(x, z) < 0.1) continue;
    const sc = 0.8 + rng() * 0.55;
    const legacyTiltX = (rng() - 0.5) * 0.12;   // draws preserved from the old
    const rotY = rng() * Math.PI * 2;           // Euler(tiltX, yaw, tiltZ) — the
    const legacyTiltZ = (rng() - 0.5) * 0.12;   // tilts are no longer applied
    void legacyTiltX; void legacyTiltZ;
    // Slot consumed. Sand (z < 21.8) is skipped AFTER these draws so the
    // main stream does not refill to 170 and shift towers / cars / huts.
    placed++;
    if (z < 21.8) continue;
    plan.push({ x, z, sc, rotY });
  }
  return plan;
}

/**
 * Accept/reject one palm position.
 * Two probes: a trunk probe at ground level and a wider crown probe up in the
 * canopy band, because a palm can legitimately stand beside a low wall but
 * never with its head inside a facade. After those probes, the crown disk
 * is failed against the signed boardwalk deck (BOARDWALK_Z / BOARDWALK_D).
 */
function palmFits(ctx, x, z, sc, taken, curated) {
  if (Math.abs(x) > 600) return 0;
  // pavement (boardwalk, carriageway, cross-street, Lummus walk) is a hard
  // drop for everyone — including curated rows
  if (onPavement(x, z)) return 0;
  // curated rows requested by a landmark are exempt from the ground keep-outs
  // (they belong to the feature that owns that ground) but still have to pass
  // the collider test like everything else. Never nudge onto the walk.
  if (!curated && inKeepout(x, z, 1.0)) return 0;
  const y = groundHeight(x, z);
  if (y < 0.1) return 0;
  const crown = CROWN_R * sc + CROWN_MARGIN;
  if (ctx.blocked(x, z, 0.9, y - 0.2, y + 2.4)) return 0;
  if (ctx.blocked(x, z, crown, y + 3.4, y + 7.6 * sc)) return 0;
  // crown vs signed deck (|z - BOARDWALK_Z| <= BOARDWALK_D / 2). Kiss = drop.
  // onPavement already drops a trunk ON the deck; this is the frond reach.
  if (Math.abs(z - BOARDWALK_Z) <= BOARDWALK_D / 2 + crown) return 0;
  for (let i = 0; i < taken.length; i++) {
    const t = taken[i];
    const dx = x - t.x, dz = z - t.z;
    if (dx * dx + dz * dz < MIN_SPACING * MIN_SPACING) return 0;
  }
  return y;
}

/**
 * Materialise the palm field. Runs LAST, once every structure has published
 * its colliders.
 * @returns {{ palms: object|null, palmPlacements: Array, rejected: number }}
 */
export async function materializePalms(ctx, plan) {
  const { root, track, addCyl, setTag, rng5 } = ctx;
  setTag('palm');
  const palmPlacements = [];
  let rejected = 0;

  // curated rows requested by the landmarks (pergola walk, cinema forecourt,
  // yacht club) go down first so they win the spacing contest
  for (const e of (ctx.extraPalms || [])) {
    const sc = e.sc === undefined ? 0.95 : e.sc;
    const y = palmFits(ctx, e.x, e.z, sc, palmPlacements, true);
    if (!y) { rejected++; continue; }
    palmPlacements.push({
      x: e.x, y, z: e.z, sc,
      rotY: e.rotY !== undefined ? e.rotY : rng5() * Math.PI * 2,
    });
    addCyl(e.x, y, e.z, TRUNK_R * sc, 6.2 * sc);
  }

  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    let x = p.x, z = p.z, sc = p.sc;
    let y = palmFits(ctx, x, z, sc, palmPlacements);
    let tries = 0;
    while (!y && tries < 36) {
      tries++;
      rejected++;
      // re-roll on the dedicated stream so no other layout shifts
      x = (rng5() - 0.5) * 1180;
      z = rng5() < 0.72 ? 26 + rng5() * 32 : 6 + rng5() * 18;
      if (z < 21.8) continue;                       // sand: draw, then reject
      // planting row, never the sidewalk slab — drop via onPavement if it still fails
      if (z > ROAD_Z0 && z < ROAD_Z1) z = z < 44 ? 36.5 : 51.5;
      sc = 0.8 + rng5() * 0.55;
      y = palmFits(ctx, x, z, sc, palmPlacements);
    }
    if (!y) continue;                                   // nowhere left: drop it
    palmPlacements.push({ x, y, z, sc, rotY: p.rotY });
    // trunk only: fronds are not solid, and a fat box around the canopy is
    // exactly the "oversized collider swallowing a gap" this pass removes
    addCyl(x, y, z, TRUNK_R * sc, 6.2 * sc);
  }

  let palms = null;
  try {
    palms = await createPalms(palmPlacements.length);
  } catch (e) {
    console.warn('[miami] createPalms failed — using legacy cone palms:', e);
    palms = null;
  }
  if (palms && palms.group) {
    for (let i = 0; i < palmPlacements.length; i++) {
      const p = palmPlacements[i];
      palms.placeAt(i, p.x, p.y, p.z, p.sc, p.rotY);
    }
    palms.finalize(palmPlacements.length);
    root.add(palms.group);
  } else {
    palms = null;
    // legacy instanced cone palms (colliders above already cover them)
    const trunkGeo = track(new THREE.CylinderGeometry(0.14, 0.22, 6.5, 6));
    trunkGeo.translate(0, 3.25, 0);
    const trunkMat = track(new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 1 }));
    const crownGeo = track(new THREE.ConeGeometry(2.2, 1.4, 7));
    crownGeo.translate(0, 6.9, 0);
    const crownMat = track(new THREE.MeshStandardMaterial({ color: 0x2c7a3c, roughness: 0.9, side: THREE.DoubleSide }));
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palmPlacements.length);
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, palmPlacements.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const eul = new THREE.Euler();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (let i = 0; i < palmPlacements.length; i++) {
      const pl = palmPlacements[i];
      eul.set(0, pl.rotY, 0);
      q.setFromEuler(eul);
      s.set(pl.sc, pl.sc, pl.sc);
      p.set(pl.x, pl.y, pl.z);
      m4.compose(p, q, s);
      trunks.setMatrixAt(i, m4);
      crowns.setMatrixAt(i, m4);
    }
    trunks.castShadow = true; crowns.castShadow = true;
    trunks.name = 'palm-field-lo';
    root.add(trunks); root.add(crowns);
  }

  // ---- tree grates: the paved-promenade palms get a cast-iron surround ----
  {
    const grateSpots = [];
    for (const pp of palmPlacements) {
      if (grateSpots.length >= 260) break;
      if (pp.z < 33 || pp.z > 58 || Math.abs(pp.x) > 600) continue;
      grateSpots.push(pp);
    }
    if (grateSpots.length) {
      const grateGeo = track(new THREE.RingGeometry(0.62, 1.15, 10, 1));
      grateGeo.rotateX(-Math.PI / 2);
      const grateMat = track(new THREE.MeshStandardMaterial({
        color: 0x3a3d40, roughness: 0.65, metalness: 0.45, side: THREE.DoubleSide,
        polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
      }));
      const grates = new THREE.InstancedMesh(grateGeo, grateMat, grateSpots.length);
      const m4 = new THREE.Matrix4();
      for (let i = 0; i < grateSpots.length; i++) {
        const g = grateSpots[i];
        m4.makeTranslation(g.x, stripY(g.z) + 0.012, g.z);
        grates.setMatrixAt(i, m4);
      }
      grates.instanceMatrix.needsUpdate = true;
      grates.computeBoundingSphere();
      grates.name = 'palm-grates';
      root.add(grates);
    }
  }

  setTag('world');
  return { palms, palmPlacements, rejected };
}
