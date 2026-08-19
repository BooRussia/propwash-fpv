// ============================================================
// Miami planting graph — one reject-or-drop test for everything
// that sits on leftover dirt (palms already used these predicates
// via palmFits; blades use this wrapper so they are not a second
// placer).
//
// tryPlace()  onPavement / keepout / water / blocked → DROP.
//             Never remaps x/z onto a reserved surface.
// ============================================================
import {
  BOARDWALK_D, BOARDWALK_SHOULDER, BOARDWALK_Z,
  CURB_BEACH_Z0, CURB_CITY_Z1,
  KEEPOUT,
  SW_BEACH_Z0, SW_BEACH_Z1, SW_CITY_Z0,
  groundHeight, inKeepout, onPavement,
} from './constants.js';

/** Near-field cover. Density = leftover-hull area × cover². */
export const COVER_NEAR = 3.36;
/** Far-field cover. Sparser so 20 k still reads past the 8–25 m band. */
export const COVER_FAR = 1.12;
export const BLADE_NEAR_BUDGET = 70_000;
export const BLADE_FAR_BUDGET = 20_000;
export const BLADE_CEILING = 190_000;

/** Collision is the ground hull. A per-blade AABB is a fail. */
export const BLADE_HULL_COLLIDER = 'ground';
export const BLADE_AABB = false;

const BLADE_PROBE = { r: 0.08, h: 0.36, minY: 0.12, keepout: 0.35 };

const DIRT_X0 = -580;
const DIRT_X1 = 580;
const NEAR_HALF = 220;

// Leftover dirt after boardwalk / sidewalk / curb / road are reserved.
// Boardwalk pavement occupies |z-27| <= 5.2 → [21.8, 32.2].
const BEACH_Z0 = 1.15;
const BEACH_Z1 = BOARDWALK_Z - BOARDWALK_D / 2 - BOARDWALK_SHOULDER - 0.05; // 21.75
const PROM_Z0 = BOARDWALK_Z + BOARDWALK_D / 2 + BOARDWALK_SHOULDER + 0.05; // 32.25
const PROM_Z1 = SW_BEACH_Z0 - 0.05; // 33.90 — leftover before the sidewalk slab
const PLANT_B_Z0 = SW_BEACH_Z1 + 0.01;
const PLANT_B_Z1 = CURB_BEACH_Z0 - 0.01;
const PLANT_C_Z0 = CURB_CITY_Z1 + 0.01;
const PLANT_C_Z1 = SW_CITY_Z0 - 0.01;

function hash01(a, b) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

export function hullArea(h) {
  return Math.max(0, h.x1 - h.x0) * Math.max(0, h.z1 - h.z0);
}

/**
 * Accept/reject one plant. Same predicates palms already drop on.
 * Returns ground y, or 0 when the candidate is dropped.
 * Never nudges onto pavement.
 */
export function tryPlace(ctx, x, z, probe = BLADE_PROBE) {
  if (onPavement(x, z)) return 0;
  if (inKeepout(x, z, probe.keepout ?? 0.35)) return 0;
  const y = groundHeight(x, z);
  if (y < (probe.minY ?? 0.12)) return 0;
  const r = probe.r ?? 0.08;
  const h = probe.h ?? 0.36;
  if (ctx && ctx.blocked && ctx.blocked(x, z, r, y - 0.02, y + h)) return 0;
  return y;
}

function strip(tag, x0, x1, z0, z1, seed) {
  return { tag, x0, x1, z0, z1, seed };
}

function subtractCut(h, cut, margin) {
  const cx0 = cut.x0 - margin, cx1 = cut.x1 + margin;
  const cz0 = cut.z0 - margin, cz1 = cut.z1 + margin;
  const x0 = Math.max(h.x0, cx0);
  const x1 = Math.min(h.x1, cx1);
  const z0 = Math.max(h.z0, cz0);
  const z1 = Math.min(h.z1, cz1);
  if (x1 <= x0 || z1 <= z0) return [h];
  const out = [];
  if (h.x0 < x0) out.push(strip(h.tag, h.x0, x0, h.z0, h.z1, h.seed));
  if (h.x1 > x1) out.push(strip(h.tag, x1, h.x1, h.z0, h.z1, h.seed + 1));
  if (h.z0 < z0) out.push(strip(h.tag, x0, x1, h.z0, z0, h.seed + 2));
  if (h.z1 > z1) out.push(strip(h.tag, x0, x1, z1, h.z1, h.seed + 3));
  return out.filter((r) => hullArea(r) > 0.4);
}

function punchKeepouts(hulls, margin = 0.35) {
  let cur = hulls;
  for (let k = 0; k < KEEPOUT.length; k++) {
    const next = [];
    for (let i = 0; i < cur.length; i++) {
      const pieces = subtractCut(cur[i], KEEPOUT[k], margin);
      for (let p = 0; p < pieces.length; p++) next.push(pieces[p]);
    }
    cur = next;
  }
  return cur;
}

/** Tessellated leftover-dirt hulls. Near = |x| < 220 (8–25 m fly band). */
export function dirtHulls(band) {
  const zBands = [
    ['beach-dirt', BEACH_Z0, BEACH_Z1, 0x51],
    ['promenade-dirt', PROM_Z0, PROM_Z1, 0x52],
    ['plant-beach', PLANT_B_Z0, PLANT_B_Z1, 0x53],
    ['plant-city', PLANT_C_Z0, PLANT_C_Z1, 0x54],
  ];
  const ranges = band === 'far'
    ? [[DIRT_X0, -NEAR_HALF], [NEAR_HALF, DIRT_X1]]
    : [[-NEAR_HALF, NEAR_HALF]];
  const hulls = [];
  for (let r = 0; r < ranges.length; r++) {
    const [x0, x1] = ranges[r];
    for (let i = 0; i < zBands.length; i++) {
      const [tag, z0, z1, seed] = zBands[i];
      if (z1 <= z0 || x1 <= x0) continue;
      hulls.push(strip(`${band}-${tag}`, x0, x1, z0, z1, seed + r * 17));
    }
  }
  return punchKeepouts(hulls);
}

/**
 * Regular grid over one hull. O(1) per cell — jitter stays inside the
 * cell. Not a rejection-sample of a noise surface.
 */
export function tessellateHull(hull, n) {
  const out = [];
  if (n <= 0) return out;
  const w = hull.x1 - hull.x0;
  const d = hull.z1 - hull.z0;
  if (w <= 0 || d <= 0) return out;
  const cols = Math.max(1, Math.round(Math.sqrt(n * (w / d))));
  const rows = Math.max(1, Math.round(n / cols));
  const cellW = w / cols;
  const cellD = d / rows;
  const seed = (hull.seed || 1) >>> 0;
  for (let j = 0; j < rows && out.length < n; j++) {
    for (let i = 0; i < cols && out.length < n; i++) {
      const u = hash01(i + seed, j + seed * 3);
      const v = hash01(i * 17 + seed, j * 31 + 9);
      out.push({
        x: hull.x0 + (i + 0.5 + (u - 0.5) * 0.84) * cellW,
        z: hull.z0 + (j + 0.5 + (v - 0.5) * 0.84) * cellD,
        yaw: hash01(i + 3, j + 5 + seed) * Math.PI * 2,
        sc: 0.82 + hash01(j + 11, i + 19 + seed) * 0.42,
      });
    }
  }
  return out;
}

/** n = min(budget, area × cover², ceiling), split across hulls by area. */
export function planBand(hulls, cover, budget) {
  let area = 0;
  for (let i = 0; i < hulls.length; i++) area += hullArea(hulls[i]);
  const raw = Math.round(area * cover * cover);
  const n = Math.min(budget, raw, BLADE_CEILING);
  const plan = [];
  let used = 0;
  for (let i = 0; i < hulls.length; i++) {
    const share = area > 0 ? hullArea(hulls[i]) / area : 0;
    const left = n - used;
    const count = i === hulls.length - 1 ? left : Math.min(left, Math.round(n * share));
    const cells = tessellateHull(hulls[i], count);
    for (let k = 0; k < cells.length; k++) plan.push(cells[k]);
    used += cells.length;
  }
  return { plan, area, raw, n };
}

export function planDirtBlades() {
  const nearHulls = dirtHulls('near');
  const farHulls = dirtHulls('far');
  const near = planBand(nearHulls, COVER_NEAR, BLADE_NEAR_BUDGET);
  const far = planBand(farHulls, COVER_FAR, BLADE_FAR_BUDGET);
  return {
    nearPlan: near.plan,
    farPlan: far.plan,
    nearHulls,
    farHulls,
    nearArea: near.area,
    farArea: far.area,
    nearRaw: near.raw,
    farRaw: far.raw,
    nearBudgeted: near.n,
    farBudgeted: far.n,
  };
}

/** Drop-only materialisation. No re-roll, no nudge. */
export function placeBladePlan(ctx, plan, probe = BLADE_PROBE) {
  const placed = [];
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    const y = tryPlace(ctx, p.x, p.z, probe);
    if (!y) continue;
    placed.push({ x: p.x, y, z: p.z, yaw: p.yaw, sc: p.sc });
  }
  return placed;
}

export const BLADE_PROBE_SPEC = BLADE_PROBE;
