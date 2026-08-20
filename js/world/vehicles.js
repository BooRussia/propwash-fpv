// ============================================================
// PropWash FPV — procedural high-fidelity vehicle kit
//
// Four vehicle kinds (sedan / taxi / pickup / bus)
// built entirely from code — no external assets, so this module
// works unchanged when assets/ is empty.
// SUV / sports stay off this file: unknown kinds remap to sedan.
//
// Each body is ONE smooth hull extruded from a bezier side
// profile (bevelled shoulders + tumblehome), with real window
// openings, tinted glass panels, arched wheels, emissive lights,
// grille, mirrors, trim and plates.
//
// Contract (the streetscape agent codes against this):
//   const fleet = await createVehicleFleet(maxCount);
//   fleet.group                       -> THREE.Group (add to scene)
//   fleet.placeAt(i, x, y, z, rotY, kind, colorHex)
//        kind: 'sedan'|'taxi'|'pickup'|'bus' (unknown → sedan)
//        wheels rest exactly on y; vehicle nose faces +X at rotY=0
//   fleet.finalize(used)              -> uploads matrices, culls
//   fleet.update(dt)                  -> rolls signed curb cars (no-op if none)
//   fleet.dispose()                   -> frees instance buffers
//
// Perf: shared geometry built once at module level.
// 6 InstancedMeshes per kind (body/glass/dark/chrome/lightW/lightR)
// => 24 draw calls for a full mixed fleet (<= 40 budget).
// ~2.9-3.6k tris per vehicle.
//
// ---- greenhouse construction note -------------------------------
// The hull is a solid extrusion, so glass, trim and handles only read
// if they stand PROUD of the hull's real surface. Predicting that
// surface analytically does not work: the extrude bevel puts the flat
// side wall at |z| = W/2 (not W/2 - BEVEL_T), and because the side cap
// is triangulated only between outline vertices, the interpolated
// surface wanders up to ~25mm from any closed-form guess. Panels
// placed by formula end up buried inside the bodywork.
// So every surface-mounted part is positioned by RAYCASTING the
// finished hull (see makeProbe) and offsetting outward from the hit.
// That is exact for any profile, including ones added later.
// ============================================================
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const VEHICLE_KINDS = ['sedan', 'taxi', 'pickup', 'bus'];

const BEVEL_T = 0.055;      // extrude bevel thickness (shoulder roundover, in z)
const GLASS_PROUD = 0.020;  // glass stands this far off the probed hull surface
const SEAL_PROUD = 0.006;   // black seal sits between hull and glass
const SEAL_GROW = 0.026;    // seal outline inflates this far around the glass
const CROSS_PROUD = 0.026;  // windshield / backlight offset along the profile normal
const TRIM_PROUD = 0.010;   // chrome trim / handles / rocker stand-off

// ---------------- shared materials (module singletons) ----------------
// Body enamel is 1957 factory, not candy: modest metalness + a thin
// clearcoat. Per-instance colour via setColorAt.
let MATS = null;
function buildMats() {
  if (MATS) return MATS;
  MATS = {
    body: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0.18, roughness: 0.38,
      clearcoat: 0.28, clearcoatRoughness: 0.06, envMapIntensity: 1.0,
    }),
    // Glass is a DIELECTRIC. Making it metallic with a near-black albedo
    // tints the reflection to black and it reads as flat paint. Equally,
    // a clearcoat layer plus a strong envMap turns these flat panels into
    // pure sky mirrors — blank white rectangles. Modest env, no clearcoat:
    // fresnel alone gives the grazing-angle sheen that reads as glazing.
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x0d1219, metalness: 0.0, roughness: 0.10,
      reflectivity: 0.38, envMapIntensity: 0.55, side: THREE.DoubleSide,
    }),
    dark: new THREE.MeshStandardMaterial({
      color: 0x141619, metalness: 0.2, roughness: 0.85, side: THREE.DoubleSide,
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: 0xe9edf1, metalness: 1.0, roughness: 0.08, envMapIntensity: 1.2,
    }),
    lightW: new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2, roughness: 0.25,
    }),
    lightR: new THREE.MeshStandardMaterial({
      color: 0x330508, emissive: 0xff1a1a, emissiveIntensity: 1.5, roughness: 0.3,
    }),
  };
  return MATS;
}

const SLOTS = ['body', 'glass', 'dark', 'chrome', 'lightW', 'lightR'];

// 1957 Chevy factory (Desi + Reesy). Published digital approx. Do not re-candy.
// Tropical #3cb7ab is factory 799, not leftover candy teal.
const PAINT = [
  0x16181a, // Onyx
  0xf2ead4, // Ivory
  0x4b6f9e, // Larkspur
  0x2c4570, // Harbor
  0xa9c79c, // Surf
  0x3cb7ab, // Tropical
  0xf0e6bb, // Cream
  0xe0826e, // Coral
  0x9c2226, // Matador
  0xb9bdc0, // Inca
  0xc79a5b, // Sierra
  0xddcaa6, // Adobe
];
const TAXI_YELLOW = 0xffc21a;
const BUS_LIVERY = [0x2f7fd8, 0x35a371, 0xe8e4da, 0xc9772f];

// ---- Ocean Drive curb roll (Desi + Reesy) --------------------------------
// Fold eight of the 34 street.js carSpots. Lanes and wrap are that ribbon:
//   x = -560 + i*34 …, z = i%2 ? 39.5 : 48.5, rotY = i%2 ? 0 : π
// Odds travel +X, evens −X. BUS_I=16 stays at the shelter. No ped.js / traffic.js.
export const FLEET_ROLL_I = Object.freeze([3, 6, 11, 14, 19, 22, 27, 30]);
export const FLEET_BUS_I = 16;
export const FLEET_X0 = -560;
export const FLEET_DX = 34;
export const FLEET_N = 34;
export const FLEET_WRAP0 = FLEET_X0;
export const FLEET_WRAP_SPAN = FLEET_N * FLEET_DX;
export const FLEET_CROSS_X = Object.freeze([-129, 57]);
export const FLEET_ZEBRA_HALF = 1.8;   // road.js zebra BoxGeometry(3.6, …)
export const FLEET_HOLD = 2;
export const FLEET_SPEED_MIN = 6;      // 13–18 mph so enamel still reads
export const FLEET_SPEED_MAX = 8;
export const FLEET_LANE_BEACH_Z = 39.5;
export const FLEET_LANE_CITY_Z = 48.5;

const FLEET_ROLL_SET = new Set(FLEET_ROLL_I);

export function fleetIsRoller(i) {
  return FLEET_ROLL_SET.has(i);
}

/** street.js carSpots lane. Odds +X on z=39.5; evens −X on z=48.5. */
export function fleetLaneOf(i) {
  return (i % 2)
    ? { z: FLEET_LANE_BEACH_Z, rotY: 0, dir: 1 }
    : { z: FLEET_LANE_CITY_Z, rotY: Math.PI, dir: -1 };
}

export function fleetCrawlSpeed(i) {
  return FLEET_SPEED_MIN
    + ((i * 5 + 3) % 11) / 10 * (FLEET_SPEED_MAX - FLEET_SPEED_MIN);
}

export function fleetWrapX(x) {
  let t = (x - FLEET_WRAP0) % FLEET_WRAP_SPAN;
  if (t < 0) t += FLEET_WRAP_SPAN;
  return FLEET_WRAP0 + t;
}

/** Near zebra edge ahead of x along dir. Only CROSS_X −129 / 57. */
export function fleetStopAhead(x, dir) {
  let best = null;
  for (let k = 0; k < FLEET_CROSS_X.length; k++) {
    const stop = FLEET_CROSS_X[k] - dir * FLEET_ZEBRA_HALF;
    if (dir > 0) {
      if (stop > x && (best === null || stop < best)) best = stop;
    } else if (stop < x && (best === null || stop > best)) {
      best = stop;
    }
  }
  return best;
}

/** Advance one roller. Mutates {x, hold}. z / rotY stay put. */
export function stepFleetRoller(state, dt) {
  if (!(dt > 0) || !Number.isFinite(dt)) return state;
  if (state.hold > 0) {
    state.hold -= dt;
    if (state.hold > 0) return state;
    dt = -state.hold;
    state.hold = 0;
    if (!(dt > 0)) return state;
  }
  const dir = state.dir;
  const travel = dir * state.speed * dt;
  const stop = fleetStopAhead(state.x, dir);
  if (stop !== null) {
    const toStop = stop - state.x;
    if (toStop * dir >= 0 && Math.abs(toStop) <= Math.abs(travel) + 1e-9) {
      state.x = stop;
      state.hold = FLEET_HOLD;
      return state;
    }
  }
  state.x = fleetWrapX(state.x + travel);
  return state;
}

// ---------------- small geometry helpers ----------------
function ss(t) { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); }

/** strip UVs and de-index so every part merges cleanly */
function prep(geo) {
  geo.deleteAttribute('uv');
  geo.deleteAttribute('uv1');
  return geo.index ? geo.toNonIndexed() : geo;
}
function box(w, h, d) { return prep(new THREE.BoxGeometry(w, h, d)); }

/** analytic hull half-width at height y — only a fallback for the probe */
function sideAt(spec, y) {
  const t = (y - spec.belt) / (spec.roof - spec.belt);
  return (spec.W / 2) * (1 - spec.tumble * ss(Math.max(0, Math.min(1, t))));
}

/**
 * Surface probe: raycasts the finished hull so surface-mounted parts land
 * exactly on it. z(x, y) returns the hull's +z surface at that profile point;
 * everything mounted on the flanks is placed at z() + a stand-off.
 */
function makeProbe(geo, spec) {
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
  mesh.updateMatrixWorld(true);
  const rc = new THREE.Raycaster();
  const o = new THREE.Vector3(), d = new THREE.Vector3(0, 0, -1);
  const far = spec.W + 1;
  const cache = new Map();
  function z(x, y) {
    const key = `${x.toFixed(4)},${y.toFixed(4)}`;
    let v = cache.get(key);
    if (v !== undefined) return v;
    o.set(x, y, far);
    rc.set(o, d);
    const hit = rc.intersectObject(mesh, false);
    v = hit.length ? hit[0].point.z : sideAt(spec, y);
    cache.set(key, v);
    return v;
  }
  const o2 = new THREE.Vector3(), d2 = new THREE.Vector3();
  return {
    z,
    /** d(surface)/dy, for panel normals that lean with the tumblehome */
    slope(x, y) { const e = 0.03; return (z(x, y + e) - z(x, y - e)) / (2 * e); },
    /**
     * Where the hull's outline actually sits along direction (nx, ny) through
     * (x, y), measured in the z=0 plane. Windshields and backlights ride on
     * this: offsetting from the authored profile point alone leaves steeply
     * raked panels sunk inside the bodywork.
     */
    surf(x, y, nx, ny) {
      o2.set(x + nx * far, y + ny * far, 0);
      d2.set(-nx, -ny, 0);
      rc.set(o2, d2);
      const hit = rc.intersectObject(mesh, false);
      return hit.length ? { x: hit[0].point.x, y: hit[0].point.y } : { x, y };
    },
    dispose() { mesh.material.dispose(); cache.clear(); },
  };
}
/** append a wheel-arch arc to the bottom edge (travelling rear -> front) */
function archTo(shape, ax, spec) {
  const cy = spec.wheelR;
  const dy = cy - spec.gc;
  const dx = Math.sqrt(Math.max(0.005, spec.archR * spec.archR - dy * dy));
  shape.lineTo(ax - dx, spec.gc);
  const a0 = Math.atan2(-dy, -dx);
  const a1 = Math.atan2(-dy, dx);
  shape.absarc(ax, cy, spec.archR, a0, a1, true);   // clockwise => over the top
}

// ---------------- the one smooth hull ----------------
function buildBodyGeo(spec) {
  const s = new THREE.Shape();
  s.moveTo(spec.fbx, spec.gc);
  spec.top(s);                                       // front bumper -> hood -> roof -> tail
  archTo(s, spec.rax, spec);                         // bottom edge with arch cutouts
  archTo(s, spec.fax, spec);
  s.lineTo(spec.fbx, spec.gc);

  const bevelS = spec.bevel !== undefined ? spec.bevel : 0.07;
  const depth = spec.W - 2 * BEVEL_T;
  let g = new THREE.ExtrudeGeometry(s, {
    steps: 1, depth,
    bevelEnabled: true, bevelThickness: BEVEL_T, bevelSize: bevelS,
    bevelOffset: -bevelS, bevelSegments: 3, curveSegments: 8,
  });
  g.translate(0, 0, -depth / 2);

  // weld -> smooth normals across the whole shell (the "one hull" look)
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-4);

  // tumblehome: pull the greenhouse in as it rises
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) - spec.belt) / (spec.roof - spec.belt);
    if (t > 0) p.setZ(i, p.getZ(i) * (1 - spec.tumble * ss(Math.min(t, 1))));
  }
  g.computeVertexNormals();
  return g.toNonIndexed();
}

// ---------------- glass panels ----------------
/**
 * Inflate a convex-ish polygon by d, pushing every vertex away from the
 * centroid along its own radial direction (a true offset for convex shapes,
 * which is all the window outlines are).
 */
function growPoly(pts, d) {
  let cx = 0, cy = 0;
  for (const p of pts) { cx += p[0]; cy += p[1]; }
  cx /= pts.length; cy /= pts.length;
  return pts.map(([x, y]) => {
    const dx = x - cx, dy = y - cy;
    const l = Math.hypot(dx, dy) || 1;
    return [x + (dx / l) * d, y + (dy / l) * d];
  });
}

/**
 * Side panel: triangulate a window polygon in the profile plane, then lift
 * every vertex out onto the hull's side wall (+proud). Returns both sides.
 * This is what makes glass follow the cabin outline instead of being a
 * rectangle that pokes through the roof.
 */
function sidePanels(spec, probe, pts, proud) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const base = prep(new THREE.ShapeGeometry(shape));
  const out = [];
  for (const sgn of [1, -1]) {
    const g = base.clone();
    const p = g.attributes.position;
    const n = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      p.setZ(i, sgn * (probe.z(x, y) + proud));
      const dz = probe.slope(x, y);
      const l = Math.hypot(dz, 1);
      n[i * 3] = 0; n[i * 3 + 1] = -dz / l; n[i * 3 + 2] = sgn / l;
    }
    g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
    p.needsUpdate = true;
    out.push(g);
  }
  base.dispose();
  return out;
}

/**
 * Cross panel: a trapezoid spanning the full width along a profile segment —
 * windshields and backlights. Narrower at the top so it follows the
 * tumblehome, and pushed out along the segment's outward normal so it clears
 * the hull surface.
 */
function crossPanel(spec, probe, x0, y0, x1, y1, trim, proud) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dy / len, ny = -dx / len;               // outward (outline direction)
  // probe just inside the outline — a ray aimed exactly at the edge can miss
  const w0 = Math.max(0.05, probe.z(x0 - nx * 0.07, y0 - ny * 0.07) - trim);
  const w1 = Math.max(0.05, probe.z(x1 - nx * 0.07, y1 - ny * 0.07) - trim);
  // ride on the hull's real outline, not the authored profile point
  const s0 = probe.surf(x0, y0, nx, ny), s1 = probe.surf(x1, y1, nx, ny);
  const ax = s0.x + nx * proud, ay = s0.y + ny * proud;
  const bx = s1.x + nx * proud, by = s1.y + ny * proud;
  const pos = [
    ax, ay, w0, ax, ay, -w0, bx, by, w1,
    bx, by, w1, ax, ay, -w0, bx, by, -w1,
  ];
  const norm = [];
  for (let i = 0; i < 6; i++) norm.push(nx, ny, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  return g;
}

/**
 * The same, but hugging a quadratic bezier (curved backlights). Emitted as ONE
 * continuous strip with shared vertices — chaining independent crossPanel quads
 * leaves visible cracks between segments where their normals diverge.
 */
function curvedCross(spec, probe, seg, trim, proud) {
  const [x0, y0] = seg.p0, [cx, cy] = seg.c, [x1, y1] = seg.p1;
  const t0 = seg.t0 !== undefined ? seg.t0 : 0.05;
  const t1 = seg.t1 !== undefined ? seg.t1 : 0.95;
  const N = 5;
  const pos = [], norm = [];
  const rows = [];
  for (let i = 0; i <= N; i++) {
    const t = t0 + (t1 - t0) * i / N, mt = 1 - t;
    const qx = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
    const qy = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    const dx = 2 * (mt * (cx - x0) + t * (x1 - cx));
    const dy = 2 * (mt * (cy - y0) + t * (y1 - cy));
    const dl = Math.hypot(dx, dy) || 1;
    const nx = dy / dl, ny = -dx / dl;                // outward (outline direction)
    const s = probe.surf(qx, qy, nx, ny);
    const w = Math.max(0.05, probe.z(qx - nx * 0.07, qy - ny * 0.07) - trim);
    rows.push({ x: s.x + nx * proud, y: s.y + ny * proud, w, nx, ny });
  }
  for (let i = 0; i < N; i++) {
    const a = rows[i], b = rows[i + 1];
    pos.push(a.x, a.y, a.w, a.x, a.y, -a.w, b.x, b.y, b.w);
    pos.push(b.x, b.y, b.w, a.x, a.y, -a.w, b.x, b.y, -b.w);
    for (let k = 0; k < 3; k++) norm.push(a.nx, a.ny, 0);
    for (let k = 0; k < 3; k++) norm.push(b.nx, b.ny, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  return [g];
}

// ---------------- wheels ----------------
function buildWheels(spec, dark, chrome) {
  const wz = spec.W / 2 - spec.tireW / 2 - 0.06;
  const rimR = spec.wheelR * 0.64;                   // low-profile: rim ~64% of wheel
  for (const ax of [spec.fax, spec.rax]) {
    for (const sz of [wz, -wz]) {
      // tire: tread band + flat sidewalls (modern low-profile proportions)
      const tread = prep(new THREE.CylinderGeometry(spec.wheelR, spec.wheelR, spec.tireW, 18, 1, true));
      tread.rotateX(Math.PI / 2);
      tread.translate(ax, spec.wheelR, sz);
      dark.push(tread);
      for (const f of [1, -1]) {
        const wall = prep(new THREE.RingGeometry(rimR * 0.94, spec.wheelR, 18, 1));
        if (f < 0) wall.rotateY(Math.PI);
        wall.translate(ax, spec.wheelR, sz + f * spec.tireW / 2);
        dark.push(wall);
        // dark rim barrel backdrop, recessed
        const disc = prep(new THREE.CircleGeometry(rimR * 0.96, 14));
        if (f < 0) disc.rotateY(Math.PI);
        disc.translate(ax, spec.wheelR, sz + f * (spec.tireW / 2 - 0.045));
        dark.push(disc);
        // chrome rim lip + 6 spokes (3 diameter bars)
        const lip = prep(new THREE.RingGeometry(rimR * 0.84, rimR * 0.96, 14, 1));
        if (f < 0) lip.rotateY(Math.PI);
        lip.translate(ax, spec.wheelR, sz + f * (spec.tireW / 2 - 0.018));
        chrome.push(lip);
        for (let k = 0; k < 3; k++) {
          const sp = box(rimR * 1.76, 0.042, 0.022);
          sp.rotateZ(k * Math.PI / 3 + Math.PI / 6);
          sp.translate(ax, spec.wheelR, sz + f * (spec.tireW / 2 - 0.022));
          chrome.push(sp);
        }
      }
      // hub
      const hub = prep(new THREE.CylinderGeometry(rimR * 0.20, rimR * 0.20, spec.tireW * 0.95, 8));
      hub.rotateX(Math.PI / 2);
      hub.translate(ax, spec.wheelR, sz);
      chrome.push(hub);
    }
    // arch liner: dark half-shell blocking see-through, one per axle
    const r = spec.archR - 0.02;
    const liner = prep(new THREE.CylinderGeometry(r, r, spec.W - 0.14, 10, 1, true, -0.45, Math.PI + 0.9));
    liner.rotateX(Math.PI / 2);
    liner.rotateZ(Math.PI / 2);
    liner.translate(ax, spec.wheelR, 0);
    dark.push(liner);
  }
}

// ---------------- lights / trim / details ----------------
function buildDetails(spec, probe, P) {
  const { body, dark, chrome, lightW, lightR } = P;
  // headlight lenses
  if (spec.head) {
    for (const sgn of [1, -1]) {
      const g = box(0.10, spec.head.h, spec.head.w);
      g.translate(spec.head.x, spec.head.y, sgn * (spec.W / 2 - spec.head.inset));
      lightW.push(g);
    }
  }
  // taillight clusters (+ optional full-width bar)
  if (spec.tail) {
    for (const sgn of [1, -1]) {
      const g = box(0.09, spec.tail.h, spec.tail.w);
      g.translate(spec.tail.x, spec.tail.y, sgn * (spec.W / 2 - spec.tail.inset));
      lightR.push(g);
    }
    if (spec.tail.bar) {
      const bar = box(0.07, 0.045, spec.W - 2 * spec.tail.inset);
      bar.translate(spec.tail.x, spec.tail.y, 0);
      lightR.push(bar);
    }
  }
  // grille: dark inset panel + chrome brow
  if (spec.grille) {
    const g = box(0.06, spec.grille.h, spec.grille.w);
    g.translate(spec.grille.x, spec.grille.y, 0);
    dark.push(g);
    const brow = box(0.035, 0.035, spec.grille.w * 0.92);
    brow.translate(spec.grille.x + 0.005, spec.grille.y + spec.grille.h / 2 + 0.035, 0);
    chrome.push(brow);
  }
  // lower valance / air intake under the grille
  if (spec.valance) {
    const g = box(0.05, spec.valance.h, spec.valance.w);
    g.translate(spec.valance.x, spec.valance.y, 0);
    dark.push(g);
  }
  // license plates (slightly emissive white — plate lamps at night)
  for (const pl of [spec.plateF, spec.plateR]) {
    if (!pl) continue;
    const g = box(0.025, 0.135, 0.36);
    g.translate(pl.x, pl.y, 0);
    lightW.push(g);
  }
  // side mirrors: body-coloured housing + arm, with a dark glass face
  if (spec.mirror) {
    for (const sgn of [1, -1]) {
      // tucked in close with a chunky arm — a long thin stalk reads as a
      // detached floating box once the arm falls below a pixel or two
      const z = probe.z(spec.mirror.x, spec.mirror.y);
      const housing = box(0.11, 0.10, 0.15);
      housing.translate(spec.mirror.x, spec.mirror.y, sgn * (z + 0.105));
      body.push(housing);
      const face = box(0.02, 0.078, 0.12);
      face.translate(spec.mirror.x - 0.06, spec.mirror.y, sgn * (z + 0.105));
      dark.push(face);
      const arm = box(0.05, 0.05, 0.10);
      arm.translate(spec.mirror.x, spec.mirror.y - 0.028, sgn * (z + 0.035));
      body.push(arm);
    }
  }
  // door handles: chrome nubs
  if (spec.handles) {
    for (const hx of spec.handles.xs) {
      for (const sgn of [1, -1]) {
        const g = box(0.15, 0.032, 0.030);
        g.translate(hx, spec.handles.y, sgn * (probe.z(hx, spec.handles.y) + TRIM_PROUD));
        chrome.push(g);
      }
    }
  }
  // door shut lines: hairline dark strips
  if (spec.doorSeams) {
    for (const sx of spec.doorSeams) {
      for (const sgn of [1, -1]) {
        const sy = (spec.belt + 0.38) / 2;
        const g = box(0.016, spec.belt - 0.38, 0.018);
        g.translate(sx, sy, sgn * (probe.z(sx, sy) + 0.006));
        dark.push(g);
      }
    }
  }
  // chrome beltline trim, running under the window band
  if (spec.beltTrim) {
    const { x0, x1, y } = spec.beltTrim;
    const cx = (x0 + x1) / 2;
    for (const sgn of [1, -1]) {
      const g = box(Math.abs(x0 - x1), 0.026, 0.02);
      g.translate(cx, y, sgn * (probe.z(cx, y) + TRIM_PROUD));
      chrome.push(g);
    }
  }
  // Rocker skirt: dark sill band. Spanned automatically between the wheel
  // arches — hand-authored lengths overshot into the arch openings and read
  // as a black slab floating in front of the wheels.
  if (spec.rocker) {
    const h = spec.rocker.h;
    const x0 = spec.rax + spec.archR + 0.04;
    const x1 = spec.fax - spec.archR - 0.04;
    const cx = (x0 + x1) / 2, cy = spec.gc + h / 2 + 0.015;
    for (const sgn of [1, -1]) {
      const g = box(x1 - x0, h, 0.03);
      g.translate(cx, cy, sgn * (probe.z(cx, cy) + 0.004));
      dark.push(g);
    }
  }
  // exhaust tips
  if (spec.exhaust) {
    for (const ez of spec.exhaust.zs) {
      const g = prep(new THREE.CylinderGeometry(0.038, 0.038, 0.14, 8));
      g.rotateZ(Math.PI / 2);
      g.translate(spec.exhaust.x, spec.exhaust.y, ez);
      chrome.push(g);
    }
  }
}

// ============================================================
// per-kind specs — the side profiles that make each silhouette.
// spec.windows entries are authored to sit clear of the outline
// so the extrude bevel can never swallow them (see header note).
// ============================================================
const S = {};

S.sedan = {
  W: 1.82, belt: 0.95, roof: 1.425, tumble: 0.13, gc: 0.17, bevel: 0.07,
  wheelR: 0.33, tireW: 0.24, archR: 0.43, fax: 1.42, rax: -1.45,
  fbx: 2.02,
  top(s) {
    s.quadraticCurveTo(2.26, 0.20, 2.295, 0.42);    // bumper roundover
    s.quadraticCurveTo(2.33, 0.56, 2.27, 0.70);     // nose
    s.quadraticCurveTo(1.60, 0.87, 0.85, 0.915);    // hood
    s.lineTo(0.10, 1.40);                            // windshield
    s.quadraticCurveTo(-0.55, 1.47, -1.25, 1.385);  // roof
    s.quadraticCurveTo(-1.62, 1.12, -1.87, 1.00);   // rear glass
    s.lineTo(-2.16, 0.96);                           // deck
    s.quadraticCurveTo(-2.34, 0.84, -2.31, 0.58);   // tail face
    s.quadraticCurveTo(-2.30, 0.22, -2.02, 0.17);   // under-bumper
  },
  windshield: [0.85, 0.915, 0.10, 1.40],
  backlight: { p0: [-1.25, 1.385], c: [-1.62, 1.12], p1: [-1.87, 1.00], t1: 0.88 },
  windows: [
    [[0.42, 0.99], [0.16, 1.27], [-0.52, 1.27], [-0.52, 0.99]],
    [[-0.64, 0.99], [-0.64, 1.26], [-1.22, 1.26], [-1.44, 1.04], [-1.44, 0.99]],
  ],
  beltTrim: { x0: 0.44, x1: -1.46, y: 0.955 },
  rocker: { h: 0.10 },
  doorSeams: [-0.02],
  mirror: { x: 0.78, y: 1.04 },
  handles: { xs: [0.20, -0.86], y: 0.86 },
  head: { x: 2.24, y: 0.64, w: 0.38, h: 0.12, inset: 0.33 },
  tail: { x: -2.28, y: 0.82, w: 0.42, h: 0.11, inset: 0.35, bar: false },
  grille: { x: 2.28, y: 0.47, w: 0.95, h: 0.17 },
  valance: { x: 2.30, y: 0.27, w: 1.20, h: 0.10 },
  plateF: { x: 2.315, y: 0.32 }, plateR: { x: -2.325, y: 0.52 },
  exhaust: { x: -2.27, y: 0.26, zs: [-0.52] },
};

S.pickup = {
  W: 1.95, belt: 1.10, roof: 1.80, tumble: 0.10, gc: 0.285, bevel: 0.075,
  wheelR: 0.37, tireW: 0.27, archR: 0.465, fax: 1.72, rax: -1.60,
  fbx: 2.36,
  top(s) {
    s.quadraticCurveTo(2.60, 0.32, 2.635, 0.56);
    s.quadraticCurveTo(2.68, 0.76, 2.62, 0.95);
    s.quadraticCurveTo(1.85, 1.09, 1.02, 1.135);
    s.lineTo(0.38, 1.745);
    s.quadraticCurveTo(-0.02, 1.80, -0.34, 1.78);   // cab roof
    s.lineTo(-0.48, 1.16);                           // cab back
    s.lineTo(-0.52, 0.86);
    s.lineTo(-2.56, 0.86);                           // bed floor line
    s.lineTo(-2.61, 0.50);
    s.quadraticCurveTo(-2.60, 0.31, -2.36, 0.285);
  },
  windshield: [1.02, 1.135, 0.38, 1.745],
  backlight: { p0: [-0.34, 1.78], c: [-0.40, 1.47], p1: [-0.465, 1.18], t0: 0.1, t1: 0.9 },
  windows: [
    [[0.66, 1.18], [0.34, 1.61], [0.06, 1.61], [0.06, 1.18]],
    [[-0.04, 1.18], [-0.04, 1.60], [-0.26, 1.60], [-0.30, 1.18]],
  ],
  beltTrim: { x0: 0.68, x1: -0.32, y: 1.145 },
  rocker: { h: 0.12 },
  doorSeams: [0.02],
  bed: { x0: -0.42, x1: -2.58, railY: 1.09, floorY: 0.86 },
  mirror: { x: 0.95, y: 1.22 },
  handles: { xs: [0.36, -0.12], y: 1.02 },
  head: { x: 2.62, y: 0.87, w: 0.40, h: 0.15, inset: 0.34 },
  tail: { x: -2.63, y: 0.80, w: 0.16, h: 0.32, inset: 0.17, bar: false },
  grille: { x: 2.65, y: 0.64, w: 1.10, h: 0.28 },
  valance: { x: 2.66, y: 0.40, w: 1.30, h: 0.12 },
  plateF: { x: 2.67, y: 0.44 }, plateR: { x: -2.655, y: 0.55 },
  exhaust: { x: -2.58, y: 0.33, zs: [-0.60] },
};

S.bus = {
  W: 2.50, belt: 1.55, roof: 2.98, tumble: 0.06, gc: 0.32, bevel: 0.10,
  wheelR: 0.46, tireW: 0.30, archR: 0.565, fax: 3.55, rax: -3.10,
  fbx: 4.98,
  top(s) {
    s.quadraticCurveTo(5.24, 0.36, 5.28, 0.62);
    s.lineTo(5.315, 1.90);                           // near-vertical face
    s.quadraticCurveTo(5.33, 2.62, 5.05, 2.86);     // rounded crown
    s.quadraticCurveTo(4.90, 2.95, 4.55, 2.975);
    s.lineTo(-4.55, 2.975);                          // long roof
    s.quadraticCurveTo(-5.12, 2.92, -5.23, 2.45);   // rear corner
    s.lineTo(-5.28, 0.66);
    s.quadraticCurveTo(-5.25, 0.35, -4.98, 0.32);
  },
  windshield: [5.27, 1.60, 5.325, 2.62],
  backlight: null,
  // five glazed bays; the gaps between them read as pillars
  windows: [
    [[4.05, 1.66], [4.05, 2.76], [2.45, 2.76], [2.45, 1.66]],
    [[2.31, 1.66], [2.31, 2.76], [0.71, 2.76], [0.71, 1.66]],
    [[0.57, 1.66], [0.57, 2.76], [-1.03, 2.76], [-1.03, 1.66]],
    [[-1.17, 1.66], [-1.17, 2.76], [-2.77, 2.76], [-2.77, 1.66]],
    [[-2.91, 1.66], [-2.91, 2.76], [-4.51, 2.76], [-4.51, 1.66]],
  ],
  beltTrim: { x0: 4.10, x1: -4.55, y: 1.60 },
  rocker: null,                                      // wheel skirts carry the sill line
  busDoor: { x: 4.63, y0: 0.62, y1: 2.55, w: 0.90 },
  wheelSkirt: true,
  roofBox: { x: -0.50, y: 3.05, len: 2.4, w: 1.5 },
  mirror: null,
  handles: null,
  head: { x: 5.26, y: 0.95, w: 0.35, h: 0.18, inset: 0.30 },
  tail: { x: -5.265, y: 1.30, w: 0.16, h: 0.45, inset: 0.25, bar: false },
  grille: { x: 5.295, y: 0.55, w: 1.60, h: 0.25 },
  plateF: { x: 5.315, y: 0.42 }, plateR: { x: -5.29, y: 0.60 },
  exhaust: { x: -5.24, y: 0.40, zs: [-0.85] },
};

// ============================================================
// kit assembly — merged geometry per material slot, per kind
// ============================================================
function buildKit(spec) {
  const P = { body: [], glass: [], dark: [], chrome: [], lightW: [], lightR: [] };

  const hull = buildBodyGeo(spec);
  P.body.push(hull);
  // everything mounted on the skin is positioned against the real hull
  const probe = makeProbe(hull, spec);

  // ---- greenhouse ----
  if (spec.windshield) {
    const w = spec.windshield;
    P.glass.push(crossPanel(spec, probe, w[0], w[1], w[2], w[3], 0.10, CROSS_PROUD));
  }
  if (spec.backlight) P.glass.push(...curvedCross(spec, probe, spec.backlight, 0.12, CROSS_PROUD));
  if (spec.windows) {
    for (const poly of spec.windows) {
      // black seal first, glass proud of it — gives the window a crisp edge
      P.dark.push(...sidePanels(spec, probe, growPoly(poly, SEAL_GROW), SEAL_PROUD));
      P.glass.push(...sidePanels(spec, probe, poly, GLASS_PROUD));
    }
  }

  buildWheels(spec, P.dark, P.chrome);
  buildDetails(spec, probe, P);

  // ---- kind-specific extras ----
  if (spec.roofRails) {
    const r = spec.roofRails;
    for (const sgn of [1, -1]) {
      const g = box(r.len, 0.05, 0.07);
      g.translate(r.x, r.y, sgn * r.z);
      P.dark.push(g);
    }
  }
  if (spec.bed) {
    const b = spec.bed;
    const len = Math.abs(b.x0 - b.x1), cx = (b.x0 + b.x1) / 2;
    const wallH = b.railY - b.floorY + 0.02;
    for (const sgn of [1, -1]) {                     // bed side walls (body colour)
      const g = box(len, wallH, 0.10);
      g.translate(cx, (b.railY + b.floorY) / 2, sgn * (spec.W / 2 - 0.075));
      P.body.push(g);
    }
    const gate = box(0.09, wallH, spec.W - 0.34);    // tailgate
    gate.translate(b.x1 - 0.02, (b.railY + b.floorY) / 2, 0);
    P.body.push(gate);
    const liner = box(len - 0.10, 0.03, spec.W - 0.42); // dark bed liner
    liner.translate(cx, b.floorY + 0.015, 0);
    P.dark.push(liner);
  }
  if (spec.spoiler) {
    const g = box(spec.spoiler.len, 0.05, spec.W - spec.spoiler.w);
    g.translate(spec.spoiler.x, spec.spoiler.y, 0);
    P.body.push(g);
  }
  if (spec.busDoor) {
    const d = spec.busDoor;
    const mid = (d.y0 + d.y1) / 2;
    const dz = probe.z(d.x, mid);
    const g = box(d.w, d.y1 - d.y0, 0.04);
    g.translate(d.x, mid, dz + SEAL_PROUD);
    P.dark.push(g);
    const glassG = box(d.w - 0.12, (d.y1 - d.y0) - 0.5, 0.03);
    glassG.translate(d.x, mid + 0.12, dz + GLASS_PROUD);
    P.glass.push(glassG);
  }
  if (spec.wheelSkirt) {                             // bus: panels closing the arches
    const sy = spec.gc + 0.18;
    for (const ax of [spec.fax, spec.rax]) {
      for (const sgn of [1, -1]) {
        const g = box(spec.archR * 2.1, 0.30, 0.03);
        g.translate(ax, sy, sgn * (probe.z(ax, sy) + 0.004));
        P.dark.push(g);
      }
    }
  }
  if (spec.roofBox) {
    const r = spec.roofBox;
    const g = box(r.len, 0.17, r.w);
    g.translate(r.x, r.y, 0);
    P.body.push(g);
  }

  probe.dispose();

  const kit = {};
  for (const slot of SLOTS) {
    kit[slot] = P[slot].length ? mergeGeometries(P[slot], false) : null;
    if (P[slot].length && !kit[slot]) console.warn(`[vehicles] merge failed for slot ${slot}`);
    // parts are one-time scaffolding; the merged copies own the data
    for (const g of P[slot]) g.dispose();
  }
  return kit;
}

let KITS = null;
function buildKits() {
  if (KITS) return KITS;
  KITS = {};
  for (const kind of ['sedan', 'pickup', 'bus']) KITS[kind] = buildKit(S[kind]);

  // taxi = sedan geometry + a roof sign in the emissive-white slot
  // (the yellow paint is applied per-instance at placement time)
  const sedan = KITS.sedan;
  // sits over the windshield header, big enough to read from the air
  const sign = box(0.46, 0.17, 0.34);
  sign.translate(-0.28, S.sedan.roof + 0.095, 0);
  KITS.taxi = {
    body: sedan.body, glass: sedan.glass, dark: sedan.dark, chrome: sedan.chrome,
    lightW: mergeGeometries([sedan.lightW.clone(), sign], false),
    lightR: sedan.lightR,
  };
  sign.dispose();
  return KITS;
}

// ============================================================
// public factory
// ============================================================
/**
 * One shared fleet covering every vehicle kind.
 * @param {number} maxCount max total vehicles this fleet can hold
 */
export async function createVehicleFleet(maxCount) {
  const kits = buildKits();
  const mats = buildMats();
  const group = new THREE.Group();
  group.name = 'vehicleFleet';

  const perKind = {};
  for (const kind of VEHICLE_KINDS) {
    const kit = kits[kind];
    const meshes = {};
    for (const slot of SLOTS) {
      if (!kit[slot]) continue;
      const im = new THREE.InstancedMesh(kit[slot], mats[slot], maxCount);
      im.count = 0;
      im.castShadow = (slot === 'body');       // one caster per car is enough
      im.receiveShadow = true;
      im.name = `veh_${kind}_${slot}`;
      group.add(im);
      meshes[slot] = im;
    }
    perKind[kind] = { meshes, used: 0 };
  }

  const slotOf = new Map();          // caller index -> { kind, slot, pose }
  const _m4 = new THREE.Matrix4();
  const _zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const _c = new THREE.Color();
  let warned = false;

  function writeMatrix(rec) {
    _m4.makeRotationY(rec.rotY);
    _m4.setPosition(rec.x, rec.y, rec.z);
    const K = perKind[rec.kind];
    for (const slot of SLOTS) {
      const im = K.meshes[slot];
      if (!im) continue;
      im.setMatrixAt(rec.slot, _m4);
      im.instanceMatrix.needsUpdate = true;
    }
  }

  function placeAt(i, x, y, z, rotY, kind, colorHex) {
    if (!perKind[kind]) kind = 'sedan';
    let rec = slotOf.get(i);
    if (rec && rec.kind !== kind) {
      // re-kind: hide the old slot, take a fresh one
      const old = perKind[rec.kind];
      for (const slot of SLOTS) {
        const im = old.meshes[slot];
        if (im) { im.setMatrixAt(rec.slot, _zero); im.instanceMatrix.needsUpdate = true; }
      }
      rec = null;
    }
    const K = perKind[kind];
    if (!rec) {
      if (K.used >= maxCount) {
        if (!warned) { console.warn('[vehicles] fleet capacity exceeded, placeAt ignored'); warned = true; }
        return;
      }
      rec = { kind, slot: K.used++, hold: 0, speed: 0, dir: 1 };
      slotOf.set(i, rec);
    }
    rec.x = x; rec.y = y; rec.z = z; rec.rotY = rotY;
    rec.dir = Math.cos(rotY) >= 0 ? 1 : -1;
    if (fleetIsRoller(i)) rec.speed = fleetCrawlSpeed(i);
    writeMatrix(rec);
    let hex;
    if (kind === 'taxi') hex = TAXI_YELLOW;
    else if (kind === 'bus') hex = BUS_LIVERY[rec.slot % BUS_LIVERY.length];
    // Factory PAINT wins over caller candy hexes (street.js curb rolls).
    else hex = (colorHex !== undefined && colorHex !== null && PAINT.includes(colorHex))
      ? colorHex
      : PAINT[Math.abs((i * 2654435761) | 0) % PAINT.length];
    K.meshes.body.setColorAt(rec.slot, _c.setHex(hex));
    if (K.meshes.body.instanceColor) K.meshes.body.instanceColor.needsUpdate = true;
  }

  function finalize(/* used (total) — the per-kind counters are authoritative */) {
    for (const kind of VEHICLE_KINDS) {
      const K = perKind[kind];
      for (const slot of SLOTS) {
        const im = K.meshes[slot];
        if (!im) continue;
        im.count = K.used;
        im.visible = K.used > 0;
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        if (K.used > 0) im.computeBoundingSphere();
      }
    }
  }

  function update(dt) {
    if (!(dt > 0) || !Number.isFinite(dt)) return;
    // Clamp so a backgrounded tab cannot skip a zebra. Sub-frame leftover
    // after a hold still rolls through in stepFleetRoller.
    if (dt > 0.25) dt = 0.25;
    const dirty = new Set();
    for (let n = 0; n < FLEET_ROLL_I.length; n++) {
      const i = FLEET_ROLL_I[n];
      if (i === FLEET_BUS_I) continue;          // bus stays at the shelter
      const rec = slotOf.get(i);
      if (!rec || rec.kind === 'bus') continue;
      stepFleetRoller(rec, dt);
      rec.z = rec.dir > 0 ? FLEET_LANE_BEACH_Z : FLEET_LANE_CITY_Z;
      rec.rotY = rec.dir > 0 ? 0 : Math.PI;
      writeMatrix(rec);
      dirty.add(rec.kind);
    }
    for (const kind of dirty) {
      const K = perKind[kind];
      for (const slot of SLOTS) {
        const im = K.meshes[slot];
        if (im && im.count > 0) im.computeBoundingSphere();
      }
    }
  }

  function dispose() {
    for (const kind of VEHICLE_KINDS) {
      for (const slot of SLOTS) {
        const im = perKind[kind].meshes[slot];
        if (im) im.dispose();          // instance buffers only; geometry/materials are shared
      }
    }
    group.clear();
    slotOf.clear();
  }

  return { group, placeAt, finalize, update, dispose };
}
