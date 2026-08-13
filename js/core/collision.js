// ============================================================
// PropWash FPV — collision shapes + broadphase
//
// A tiny, allocation-free collision kernel used by the flight model
// (js/physics/quad.js). The quad is approximated as a sphere; the world
// is a bag of static shapes.
//
// EVERY shape is defined by an EXACT signed distance function (SDF) to its
// surface — negative inside, positive outside — plus the unit direction that
// points from the surface toward the query point (for an interior point, the
// direction of the shortest exit). `resolveSphere` is then a one-liner:
//
//     penetration = airframeRadius - signedDistance(shape, centre)
//
// Working from a true distance means the contact normal is automatically
// correct at faces, EDGES and CORNERS (a corner hit returns the corner
// normal, not the normal of whichever face happened to be tested first),
// and it makes `sweepSphere` — conservative advancement — exact.
//
// SHAPES (all carry a world-space AABB in `min`/`max`, so anything that
// already treats a collider as a box — e.g. camera/signal.js occlusion —
// keeps working unchanged):
//
//   {type:'aabb',    min, max}                        world-axis box (legacy)
//   {type:'cyl',     cx, cz, r, y0, y1}               Y-axis cylinder
//   {type:'obb',     cx, cy, cz, hx, hy, hz, cos, sin, yaw}
//   {type:'sphere',  cx, cy, cz, r}
//   {type:'capsule', ax, ay, az, bx, by, bz, r}       swept sphere (poles,
//                                                     cables, railings)
//   {type:'torus',   cx, cy, cz, nx, ny, nz, R, r}    round-tube ring — the
//                                                     HOLE IS OPEN, fly through
//   {type:'ring',    cx, cy, cz, nx, ny, nz, R, hw, ht}
//                                                     square-section ring
//                                                     (race gates, wheel rims)
//   {type:'compound', parts:[...]}                    one object, several
//                                                     primitives, gaps left open
//
// LEGACY COMPAT: a plain `{min, max}` object with no `type` field is
// treated as an 'aabb'. Maps that were written before this module existed
// need no changes at all — the new shapes are strictly opt-in.
//
// CONSTRUCTOR CONVENTION matches the map helper `addCollider(cx,cy,cz,sx,sy,sz)`
// that every map already uses: X/Z are CENTRED on cx/cz, Y is a BASE at cy
// growing upward by the height. (makeSphere/makeTorus/makeRing are the
// exceptions — a ball or a ring has no natural base, so their cy is the centre.)
//
// PRECISION: the airframe sphere is 0.55 * wheelbase — about 4 cm for a
// 75 mm whoop and 14 cm for a 5-inch. Every resolution pushes the centre to
// EXACTLY tangent (no skin, no bias), so a gap of width W is passable iff
// W > 2 * airframeRadius, to within float noise (~1e-7 m). Nothing here
// inflates a collider, and nothing snaps the quad out of a gap it fits in.
//
// BROADPHASE: buildGrid() returns a two-level uniform spatial hash over XZ
// (worlds are wide and thin; hashing Y as well would explode the cell count
// for towers). Y is rejected cheaply by the per-shape AABB test inside
// resolveSphere(). Compounds are flattened into their parts at build time so
// a corner between a pier deck and its pylon produces two independent
// contacts instead of one averaged shove.
// ============================================================

import * as THREE from 'three';

// Spatial-hash key packing: cell indices live in [-KEY_OFF, KEY_OFF-1].
// With a 12 m cell that covers +/-196 km, and the packed key stays a
// small integer (max 2^30) so Map lookups never fall off the fast path.
const KEY_OFF = 1 << 14;
const KEY_MUL = 1 << 15;
const MAX_CELLS_PER_SHAPE = 256;   // bigger footprints fall to the coarse level
const COARSE_MUL = 8;              // coarse cell = fine cell * this
const DEFAULT_CELL = 12;
const CELL_CANDIDATES = [2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64];
const MAX_COMPOUND_DEPTH = 4;

// Below this distance from a surface the direction to the query point is
// numerical noise, so we switch to the shape's robust interior branch (which
// picks an exact feature normal). 1 micron — four orders of magnitude below
// the smallest airframe we simulate, and far above double-precision spacing
// at map scale (~2e-13 m at 1 km from the origin).
const SURF_EPS = 1e-6;
const SURF_EPS2 = SURF_EPS * SURF_EPS;

/** Write a normal without allocating; works for THREE.Vector3 and plain {x,y,z}. */
function setN(out, x, y, z) {
  if (!out) return;
  out.x = x; out.y = y; out.z = z;
}

function fin(n, fallback) { return Number.isFinite(n) ? n : fallback; }

/** Unit vector perpendicular to a (roughly unit) direction. Degenerate paths only. */
function perpTo(dx, dy, dz, out) {
  const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz);
  let ux, uy, uz;
  if (ax <= ay && ax <= az) { ux = 0; uy = -dz; uz = dy; }
  else if (ay <= az) { ux = -dz; uy = 0; uz = dx; }
  else { ux = -dy; uy = dx; uz = 0; }
  const l2 = ux * ux + uy * uy + uz * uz;
  if (l2 < 1e-24) { setN(out, 1, 0, 0); return; }
  const inv = 1 / Math.sqrt(l2);
  setN(out, ux * inv, uy * inv, uz * inv);
}

/** Normalize an axis triple, falling back to +Y. Build-time only. */
function unitAxis(x, y, z) {
  const ax = fin(x, 0), ay = fin(y, 1), az = fin(z, 0);
  const l2 = ax * ax + ay * ay + az * az;
  if (!(l2 > 1e-18)) return [0, 1, 0];
  const inv = 1 / Math.sqrt(l2);
  return [ax * inv, ay * inv, az * inv];
}

// ------------------------------------------------------------
// shape constructors
// ------------------------------------------------------------

/**
 * World-axis-aligned box. Identical geometry to the historical
 * addCollider(): X/Z centred, Y is the base and sy the height.
 */
export function makeBox(cx, cy, cz, sx, sy, sz) {
  const x = fin(cx, 0), y = fin(cy, 0), z = fin(cz, 0);
  const hx = Math.abs(fin(sx, 0)) * 0.5;
  const hy = Math.abs(fin(sy, 0));
  const hz = Math.abs(fin(sz, 0)) * 0.5;
  return {
    type: 'aabb',
    min: new THREE.Vector3(x - hx, y, z - hz),
    max: new THREE.Vector3(x + hx, y + hy, z + hz),
  };
}

/**
 * Y-axis aligned cylinder — poles, palm trunks, columns, silos, chimneys.
 * cy is the base, `height` grows upward. Flat caps; use makeCapsule for a
 * thin round member where the rounded ends read better (and cost less).
 */
export function makeCylinder(cx, cy, cz, radius, height) {
  const x = fin(cx, 0), y = fin(cy, 0), z = fin(cz, 0);
  const r = Math.max(0, fin(radius, 0));
  const h = Math.abs(fin(height, 0));
  return {
    type: 'cyl',
    cx: x, cz: z, r,
    y0: y, y1: y + h,
    min: new THREE.Vector3(x - r, y, z - r),
    max: new THREE.Vector3(x + r, y + h, z + r),
  };
}

/**
 * Yaw-rotated box — angled buildings, boats, vehicles, ramps, signage.
 * cy is the base; yawRad follows three.js Object3D.rotation.y, so you can
 * pass a mesh's own rotation.y straight in.
 */
export function makeOBB(cx, cy, cz, sx, sy, sz, yawRad) {
  const x = fin(cx, 0), y = fin(cy, 0), z = fin(cz, 0);
  const hx = Math.abs(fin(sx, 0)) * 0.5;
  const hy = Math.abs(fin(sy, 0)) * 0.5;
  const hz = Math.abs(fin(sz, 0)) * 0.5;
  const yaw = fin(yawRad, 0);
  const c = Math.cos(yaw), s = Math.sin(yaw);
  // three.js rotateY: local +X -> ( c,0,-s), local +Z -> ( s,0, c)
  const ex = Math.abs(c) * hx + Math.abs(s) * hz;
  const ez = Math.abs(s) * hx + Math.abs(c) * hz;
  return {
    type: 'obb',
    cx: x, cy: y + hy, cz: z,      // cy stored as the CENTRE for the solver
    hx, hy, hz, cos: c, sin: s, yaw,
    min: new THREE.Vector3(x - ex, y, z - ez),
    max: new THREE.Vector3(x + ex, y + hy * 2, z + ez),
  };
}

/** Sphere — domes, buoys, boulders, water towers. cy is the CENTRE. */
export function makeSphere(cx, cy, cz, r) {
  const x = fin(cx, 0), y = fin(cy, 0), z = fin(cz, 0);
  const rad = Math.max(0, fin(r, 0));
  return {
    type: 'sphere',
    cx: x, cy: y, cz: z, r: rad,
    min: new THREE.Vector3(x - rad, y - rad, z - rad),
    max: new THREE.Vector3(x + rad, y + rad, z + rad),
  };
}

/**
 * Capsule: the volume swept by a sphere of `radius` dragged from A to B.
 * THE right primitive for anything thin and round — light poles, guy wires,
 * antenna masts, balcony railings, handrails, scaffold tube, powerlines,
 * palm trunks that lean. A box around a 4 cm rail is a 4 cm LIE at the
 * corners; a capsule is exact everywhere, and its SDF is the cheapest in
 * this module (one clamp, one length).
 *
 * NOTE the endpoints are the CENTRES of the end caps, so the solid extends
 * `radius` beyond A and beyond B along the axis. For a pole standing on the
 * ground pass the base as A — the bottom cap is buried and invisible.
 *
 * @param {number} ax,ay,az  first endpoint (world)
 * @param {number} bx,by,bz  second endpoint (world)
 * @param {number} radius
 */
export function makeCapsule(ax, ay, az, bx, by, bz, radius) {
  const x0 = fin(ax, 0), y0 = fin(ay, 0), z0 = fin(az, 0);
  const x1 = fin(bx, 0), y1 = fin(by, 0), z1 = fin(bz, 0);
  const r = Math.max(0, fin(radius, 0));
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
  return {
    type: 'capsule',
    ax: x0, ay: y0, az: z0,
    bx: x1, by: y1, bz: z1,
    dx, dy, dz,
    len2: dx * dx + dy * dy + dz * dz,
    r,
    min: new THREE.Vector3(Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.min(z0, z1) - r),
    max: new THREE.Vector3(Math.max(x0, x1) + r, Math.max(y0, y1) + r, Math.max(z0, z1) + r),
  };
}

/**
 * Vertical capsule in the map's base-at-cy convention: the axis runs from
 * (cx, cy, cz) to (cx, cy + height, cz), so the solid spans
 * [cy - radius, cy + height + radius] — exactly like standing a real pole
 * with a rounded top on the deck.
 */
export function makeCapsuleY(cx, cy, cz, radius, height) {
  const y = fin(cy, 0);
  return makeCapsule(cx, y, cz, cx, y + Math.abs(fin(height, 0)), cz, radius);
}

/**
 * Torus — a ring with a ROUND tube section, and an OPEN HOLE. This is the
 * shape a ferris-wheel rim or a race gate actually is: a box there would
 * wall off the very gap the pilot is aiming at.
 *
 * cy is the CENTRE of the ring. The ring lies in the plane perpendicular to
 * the axis (nx,ny,nz) — default +Y (flat, like a hoop lying on the ground).
 * A vertical gate you fly THROUGH along Z has axis (0,0,1); a ferris wheel
 * standing in the XY plane has axis (0,0,1) too.
 *
 * @param {number} majorR  centre of the ring to centre of the tube
 * @param {number} tubeR   tube radius (the solid is majorR +/- tubeR)
 */
export function makeTorus(cx, cy, cz, majorR, tubeR, nx, ny, nz) {
  const x = fin(cx, 0), y = fin(cy, 0), z = fin(cz, 0);
  const R = Math.max(0, fin(majorR, 0));
  const r = Math.max(0, fin(tubeR, 0));
  const [ux, uy, uz] = unitAxis(nx, ny, nz);
  // Extent along world axis i: the core circle reaches R*sqrt(1 - n_i^2),
  // and the tube adds at most r in every direction.
  const ex = R * Math.sqrt(Math.max(0, 1 - ux * ux)) + r;
  const ey = R * Math.sqrt(Math.max(0, 1 - uy * uy)) + r;
  const ez = R * Math.sqrt(Math.max(0, 1 - uz * uz)) + r;
  return {
    type: 'torus',
    cx: x, cy: y, cz: z,
    nx: ux, ny: uy, nz: uz,
    R, r,
    min: new THREE.Vector3(x - ex, y - ey, z - ez),
    max: new THREE.Vector3(x + ex, y + ey, z + ez),
  };
}

/**
 * Ring — same open hole as a torus, but with a RECTANGULAR tube section:
 * a flat wide band (a wheel rim, a gate built from square tube, a pipe
 * collar). Cross-section is 2*hw wide radially and 2*ht thick along the
 * axis, so the solid occupies radii [majorR-hw, majorR+hw].
 *
 * cy is the CENTRE. Axis defaults to +Y (hoop lying flat).
 */
export function makeRing(cx, cy, cz, majorR, halfWidth, halfThick, nx, ny, nz) {
  const x = fin(cx, 0), y = fin(cy, 0), z = fin(cz, 0);
  const R = Math.max(0, fin(majorR, 0));
  const hw = Math.max(0, fin(halfWidth, 0));
  const ht = Math.max(0, fin(halfThick, 0));
  const [ux, uy, uz] = unitAxis(nx, ny, nz);
  const rad = R + hw;
  const ex = rad * Math.sqrt(Math.max(0, 1 - ux * ux)) + ht * Math.abs(ux);
  const ey = rad * Math.sqrt(Math.max(0, 1 - uy * uy)) + ht * Math.abs(uy);
  const ez = rad * Math.sqrt(Math.max(0, 1 - uz * uz)) + ht * Math.abs(uz);
  return {
    type: 'ring',
    cx: x, cy: y, cz: z,
    nx: ux, ny: uy, nz: uz,
    R, hw, ht,
    min: new THREE.Vector3(x - ex, y - ey, z - ez),
    max: new THREE.Vector3(x + ex, y + ey, z + ez),
  };
}

/**
 * Compound — ONE object made of several primitives, with the gaps between
 * them left OPEN. A pier is a deck box plus a row of pylon cylinders and you
 * can fly underneath it; a lifeguard tower is a hut OBB on four legs; a
 * radio mast is a capsule with guy-wire capsules.
 *
 * The compound carries the union AABB so occlusion code (camera/signal.js)
 * and the debug visualiser still see one object, while buildGrid() indexes
 * the PARTS individually — so a deck/pylon corner produces two independent
 * contacts and the quad slides out of it correctly instead of being shoved
 * along one averaged normal.
 *
 * Parts may be any shape from this module, a legacy {min,max}, or another
 * compound (nesting is depth-limited to 4).
 *
 * @param {Array} parts
 */
export function makeCompound(parts) {
  const src = Array.isArray(parts) ? parts : [];
  const list = [];
  let nx = Infinity, ny = Infinity, nz = Infinity;
  let xx = -Infinity, xy = -Infinity, xz = -Infinity;
  for (let i = 0; i < src.length; i++) {
    const p = src[i];
    if (!p || !p.min || !p.max) continue;
    const a = p.min, b = p.max;
    if (!Number.isFinite(a.x + a.y + a.z + b.x + b.y + b.z)) continue;
    if (b.x < a.x || b.y < a.y || b.z < a.z) continue;
    list.push(p);
    if (a.x < nx) nx = a.x;
    if (a.y < ny) ny = a.y;
    if (a.z < nz) nz = a.z;
    if (b.x > xx) xx = b.x;
    if (b.y > xy) xy = b.y;
    if (b.z > xz) xz = b.z;
  }
  if (!list.length) { nx = ny = nz = 0; xx = xy = xz = 0; }
  return {
    type: 'compound',
    parts: list,
    min: new THREE.Vector3(nx, ny, nz),
    max: new THREE.Vector3(xx, xy, xz),
  };
}

/** Normalized type tag for any collider, including untyped legacy boxes. */
export function shapeType(shape) {
  if (!shape) return null;
  const t = shape.type;
  if (t === 'cyl' || t === 'obb' || t === 'sphere' || t === 'capsule' ||
      t === 'torus' || t === 'ring' || t === 'compound' || t === 'aabb') return t;
  return (shape.min && shape.max) ? 'aabb' : null;
}

// ------------------------------------------------------------
// narrowphase — exact signed distance, sphere centre vs shape
//
// Every sd*() returns the signed distance from the point to the shape
// surface (negative inside) and writes the unit direction pointing from the
// surface TOWARD the point (for an interior point: the shortest way out).
// ------------------------------------------------------------

/**
 * Box in whatever space the caller hands over (world for AABB, local for OBB).
 * Outside: exact closest-point distance, so the normal is the true face,
 * edge or corner normal. Inside: shortest exit through the nearest face.
 */
function sdBox(px, py, pz, ax, ay, az, bx, by, bz, out) {
  const qx = px < ax ? ax : (px > bx ? bx : px);
  const qy = py < ay ? ay : (py > by ? by : py);
  const qz = pz < az ? az : (pz > bz ? bz : pz);
  const dx = px - qx, dy = py - qy, dz = pz - qz;
  const d2 = dx * dx + dy * dy + dz * dz;
  if (d2 > SURF_EPS2) {
    const d = Math.sqrt(d2);
    const inv = 1 / d;
    setN(out, dx * inv, dy * inv, dz * inv);
    return d;
  }
  // Centre inside (or on) the box: leave through the nearest face.
  let best = px - ax, nx = -1, ny = 0, nz = 0;
  let t = bx - px;
  if (t < best) { best = t; nx = 1; ny = 0; nz = 0; }
  t = py - ay;
  if (t < best) { best = t; nx = 0; ny = -1; nz = 0; }
  t = by - py;
  if (t < best) { best = t; nx = 0; ny = 1; nz = 0; }
  t = pz - az;
  if (t < best) { best = t; nx = 0; ny = 0; nz = -1; }
  t = bz - pz;
  if (t < best) { best = t; nx = 0; ny = 0; nz = 1; }
  setN(out, nx, ny, nz);
  return -(best > 0 ? best : 0);
}

function sdCyl(s, px, py, pz, out) {
  const dx = px - s.cx, dz = pz - s.cz;
  const dr = Math.sqrt(dx * dx + dz * dz);
  const r = s.r;
  // Closest point on the SOLID cylinder: clamp radially, clamp in Y.
  let qx = px, qz = pz;
  if (dr > r && dr > 1e-9) {
    const k = r / dr;
    qx = s.cx + dx * k;
    qz = s.cz + dz * k;
  }
  const qy = py < s.y0 ? s.y0 : (py > s.y1 ? s.y1 : py);
  const ex = px - qx, ey = py - qy, ez = pz - qz;
  const d2 = ex * ex + ey * ey + ez * ez;
  if (d2 > SURF_EPS2) {
    const d = Math.sqrt(d2);
    const inv = 1 / d;
    setN(out, ex * inv, ey * inv, ez * inv);
    return d;                                  // exact — rim hits get rim normals
  }
  // Inside the solid: leave through the cheapest of side / top / bottom.
  const side = r - dr;
  const top = s.y1 - py;
  const bot = py - s.y0;
  if (side <= top && side <= bot) {
    if (dr > 1e-9) setN(out, dx / dr, 0, dz / dr);
    else setN(out, 1, 0, 0);                   // dead on the axis — any radial works
    return -(side > 0 ? side : 0);
  }
  if (top <= bot) { setN(out, 0, 1, 0); return -(top > 0 ? top : 0); }
  setN(out, 0, -1, 0);
  return -(bot > 0 ? bot : 0);
}

function sdSphere(s, px, py, pz, out) {
  const dx = px - s.cx, dy = py - s.cy, dz = pz - s.cz;
  const d2 = dx * dx + dy * dy + dz * dz;
  if (d2 > SURF_EPS2) {
    const d = Math.sqrt(d2);
    const inv = 1 / d;
    setN(out, dx * inv, dy * inv, dz * inv);
    return d - s.r;
  }
  setN(out, 0, 1, 0);                          // dead centre — any direction
  return -s.r;
}

function sdOBB(s, px, py, pz, out) {
  const dx = px - s.cx, dy = py - s.cy, dz = pz - s.cz;
  const c = s.cos, sn = s.sin;
  // world -> local (inverse of a +Y rotation)
  const lx = dx * c - dz * sn;
  const lz = dx * sn + dz * c;
  const d = sdBox(lx, dy, lz, -s.hx, -s.hy, -s.hz, s.hx, s.hy, s.hz, out);
  if (out) {                                   // local -> world
    const nx = out.x, nz = out.z;
    out.x = c * nx + sn * nz;
    out.z = -sn * nx + c * nz;
  }
  return d;
}

function sdCapsule(s, px, py, pz, out) {
  const ex0 = px - s.ax, ey0 = py - s.ay, ez0 = pz - s.az;
  let t = 0;
  if (s.len2 > 1e-18) {
    t = (ex0 * s.dx + ey0 * s.dy + ez0 * s.dz) / s.len2;
    if (t < 0) t = 0; else if (t > 1) t = 1;
  }
  const ex = ex0 - s.dx * t, ey = ey0 - s.dy * t, ez = ez0 - s.dz * t;
  const d2 = ex * ex + ey * ey + ez * ez;
  if (d2 > SURF_EPS2) {
    const d = Math.sqrt(d2);
    const inv = 1 / d;
    setN(out, ex * inv, ey * inv, ez * inv);
    return d - s.r;                            // exact everywhere, caps included
  }
  perpTo(s.dx, s.dy, s.dz, out);               // dead on the axis
  return -s.r;
}

/**
 * Torus. Distance from P to the core circle is sqrt((radial - R)^2 + axial^2);
 * subtract the tube radius. The hole is genuinely empty: a point on the axis
 * is sqrt(R^2 + axial^2) - r away, which is why you can fly through a gate.
 */
function sdTorus(s, px, py, pz, out) {
  const dx = px - s.cx, dy = py - s.cy, dz = pz - s.cz;
  const h = dx * s.nx + dy * s.ny + dz * s.nz;          // along the axis
  let rx = dx - h * s.nx, ry = dy - h * s.ny, rz = dz - h * s.nz;
  const rl2 = rx * rx + ry * ry + rz * rz;
  let u = 0;
  if (rl2 > 1e-18) {
    const rl = Math.sqrt(rl2);
    const inv = 1 / rl;
    rx *= inv; ry *= inv; rz *= inv;                    // radial unit
    u = rl - s.R;                                       // signed radial offset
  } else {
    perpTo(s.nx, s.ny, s.nz, TMP_U);                    // on the axis: pick any radial
    rx = TMP_U.x; ry = TMP_U.y; rz = TMP_U.z;
    u = -s.R;
  }
  const d2 = u * u + h * h;                             // distance^2 to the core circle
  if (d2 > SURF_EPS2) {
    const d = Math.sqrt(d2);
    const inv = 1 / d;
    const eu = u * inv, eh = h * inv;
    setN(out, rx * eu + s.nx * eh, ry * eu + s.ny * eh, rz * eu + s.nz * eh);
    return d - s.r;
  }
  setN(out, rx, ry, rz);                                // dead on the core circle
  return -s.r;
}

/**
 * Ring (rectangular tube section). The cross-section in the
 * (radial-offset, axial-offset) plane is a box, so this is sdBox in 2D
 * lifted back into 3D — exact at the four section edges too.
 */
function sdRing(s, px, py, pz, out) {
  const dx = px - s.cx, dy = py - s.cy, dz = pz - s.cz;
  const h = dx * s.nx + dy * s.ny + dz * s.nz;
  let rx = dx - h * s.nx, ry = dy - h * s.ny, rz = dz - h * s.nz;
  const rl2 = rx * rx + ry * ry + rz * rz;
  let u;
  if (rl2 > 1e-18) {
    const rl = Math.sqrt(rl2);
    const inv = 1 / rl;
    rx *= inv; ry *= inv; rz *= inv;
    u = rl - s.R;
  } else {
    perpTo(s.nx, s.ny, s.nz, TMP_U);
    rx = TMP_U.x; ry = TMP_U.y; rz = TMP_U.z;
    u = -s.R;
  }
  const hw = s.hw, ht = s.ht;
  const cu = u < -hw ? -hw : (u > hw ? hw : u);
  const ch = h < -ht ? -ht : (h > ht ? ht : h);
  const du = u - cu, dh = h - ch;
  const d2 = du * du + dh * dh;
  if (d2 > SURF_EPS2) {
    const d = Math.sqrt(d2);
    const inv = 1 / d;
    const eu = du * inv, eh = dh * inv;
    setN(out, rx * eu + s.nx * eh, ry * eu + s.ny * eh, rz * eu + s.nz * eh);
    return d;
  }
  // Inside the section: shortest exit through one of its four sides.
  let best = hw - u, su = 1, sh = 0;
  let t = u + hw;
  if (t < best) { best = t; su = -1; sh = 0; }
  t = ht - h;
  if (t < best) { best = t; su = 0; sh = 1; }
  t = h + ht;
  if (t < best) { best = t; su = 0; sh = -1; }
  setN(out, rx * su + s.nx * sh, ry * su + s.ny * sh, rz * su + s.nz * sh);
  return -(best > 0 ? best : 0);
}

// Scratch normals for compound recursion — one per nesting level, allocated
// once at module load so the hot path never touches the allocator.
const TMP_U = { x: 0, y: 0, z: 0 };    // radial fallback inside sdTorus / sdRing
const TMP_CP = { x: 0, y: 0, z: 0 };   // normal buffer for closestPoint()
const SCRATCH_N = [];
for (let i = 0; i <= MAX_COMPOUND_DEPTH; i++) SCRATCH_N.push({ x: 0, y: 0, z: 0 });

/** Signed distance dispatch. `depth` guards compound nesting. */
function sdShape(shape, px, py, pz, out, depth) {
  const t = shape.type;
  if (t === 'cyl') return sdCyl(shape, px, py, pz, out);
  if (t === 'obb') return sdOBB(shape, px, py, pz, out);
  if (t === 'sphere') return sdSphere(shape, px, py, pz, out);
  if (t === 'capsule') return sdCapsule(shape, px, py, pz, out);
  if (t === 'torus') return sdTorus(shape, px, py, pz, out);
  if (t === 'ring') return sdRing(shape, px, py, pz, out);
  if (t === 'compound') {
    const parts = shape.parts;
    if (!parts || !parts.length || depth >= MAX_COMPOUND_DEPTH) return Infinity;
    const scratch = SCRATCH_N[depth];
    let best = Infinity;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (!p) continue;
      // Cheap lower bound: a part is never nearer than its own AABB, so once
      // we hold a contact the rest of a 20-pylon pier costs six compares each.
      if (best > 0) {
        const mn = p.min, mx = p.max;
        if (mn && mx) {
          const ox = px < mn.x ? mn.x - px : (px > mx.x ? px - mx.x : 0);
          const oy = py < mn.y ? mn.y - py : (py > mx.y ? py - mx.y : 0);
          const oz = pz < mn.z ? mn.z - pz : (pz > mx.z ? pz - mx.z : 0);
          if (ox * ox + oy * oy + oz * oz >= best * best) continue;
        }
      }
      const d = sdShape(p, px, py, pz, scratch, depth + 1);
      if (d < best) {
        best = d;
        setN(out, scratch.x, scratch.y, scratch.z);
      }
    }
    return best;
  }
  const mn = shape.min, mx = shape.max;
  if (!mn || !mx) return Infinity;             // legacy bag entry, unusable
  return sdBox(px, py, pz, mn.x, mn.y, mn.z, mx.x, mx.y, mx.z, out);
}

/**
 * Signed distance from a point to a collider's surface: negative inside,
 * positive outside, in metres. `outNormal` (optional) receives the unit
 * direction from the surface toward the point.
 *
 * This is the single source of truth every other query is built on, so a
 * distance printed by the debug visualiser is exactly the distance the
 * flight model is resolving against.
 *
 * @param {object} shape
 * @param {{x,y,z}} p
 * @param {{x,y,z}} [outNormal]
 * @returns {number} metres (Infinity for an unusable collider)
 */
export function distanceToShape(shape, p, outNormal) {
  if (!shape || !p) return Infinity;
  return sdShape(shape, p.x, p.y, p.z, outNormal, 0);
}

/**
 * Closest point ON a collider's surface to `p`, written into `out`.
 * Returns the signed distance (negative when `p` is inside).
 */
export function closestPoint(shape, p, out) {
  const d = distanceToShape(shape, p, TMP_CP);
  if (!Number.isFinite(d)) return d;
  if (out) {
    out.x = p.x - TMP_CP.x * d;
    out.y = p.y - TMP_CP.y * d;
    out.z = p.z - TMP_CP.z * d;
  }
  return d;
}

/**
 * Sphere-vs-shape. Returns the penetration depth (>0 when overlapping,
 * 0 when separate) and writes the unit contact normal — pointing from the
 * shape toward the sphere — into `outNormal`.
 *
 * The depth is exactly how far the sphere centre must travel along the
 * normal to sit TANGENT to the surface: no skin, no inflation. That is what
 * keeps a gap of width W passable for any airframe with 2R < W.
 *
 * Allocation-free: every intermediate is a stack scalar.
 *
 * @param {object} shape   any shape from this module, or a legacy {min,max}
 * @param {{x,y,z}} p      sphere centre
 * @param {number} R       sphere radius
 * @param {{x,y,z}} outNormal
 * @returns {number} penetration depth in metres
 */
export function resolveSphere(shape, p, R, outNormal) {
  if (!shape || !p) return 0;
  const r = R > 0 ? R : 0;
  const px = p.x, py = p.y, pz = p.z;
  const mn = shape.min, mx = shape.max;
  // Conservative AABB reject — every shape type carries valid bounds.
  if (mn && mx) {
    if (px < mn.x - r || px > mx.x + r ||
        py < mn.y - r || py > mx.y + r ||
        pz < mn.z - r || pz > mx.z + r) return 0;
  }
  const d = sdShape(shape, px, py, pz, outNormal, 0);
  return d < r ? r - d : 0;
}

/**
 * Swept sphere vs one shape, by conservative advancement. Every shape here
 * exposes a TRUE distance, so this converges to the exact time of impact
 * without stepping — useful for gate-crossing tests, laser/ray probes and
 * for any future caller that wants a continuous test instead of substeps.
 *
 * @param {object} shape
 * @param {{x,y,z}} p0     sphere centre at t = 0
 * @param {{x,y,z}} p1     sphere centre at t = 1
 * @param {number} R       sphere radius
 * @param {{x,y,z}} [outNormal] surface normal at the hit
 * @returns {number} t in [0,1] at first contact, or -1 if the sweep is clear
 */
export function sweepSphere(shape, p0, p1, R, outNormal) {
  if (!shape || !p0 || !p1) return -1;
  const r = R > 0 ? R : 0;
  const sx = p1.x - p0.x, sy = p1.y - p0.y, sz = p1.z - p0.z;
  const len = Math.sqrt(sx * sx + sy * sy + sz * sz);
  if (!(len > 0)) {
    return resolveSphere(shape, p0, r, outNormal) > 0 ? 0 : -1;
  }
  const tol = Math.max(1e-6, r * 1e-4);
  let t = 0;
  for (let i = 0; i < 32; i++) {
    const d = sdShape(shape, p0.x + sx * t, p0.y + sy * t, p0.z + sz * t, outNormal, 0);
    if (!Number.isFinite(d)) return -1;
    const gap = d - r;
    if (gap <= tol) return t;
    t += gap / len;
    if (t > 1) return -1;
  }
  return t <= 1 ? t : -1;
}

// ------------------------------------------------------------
// broadphase — two-level uniform spatial hash over XZ
// ------------------------------------------------------------

function cellKey(ix, iz) { return (ix + KEY_OFF) * KEY_MUL + (iz + KEY_OFF); }
function clampIdx(v) { return v < -KEY_OFF ? -KEY_OFF : (v > KEY_OFF - 1 ? KEY_OFF - 1 : v); }

/**
 * Pick the FINEST cell size whose total (shape, cell) insertion count stays
 * inside a budget. Directly optimising the real cost beats guessing from a
 * mean footprint, which one 400 m ground plane can skew by two orders of
 * magnitude.
 */
function autoCellSize(items) {
  const n = items.length;
  if (!n) return DEFAULT_CELL;
  const budget = n * 6 + 64;
  for (let c = 0; c < CELL_CANDIDATES.length; c++) {
    const cs = CELL_CANDIDATES[c];
    const inv = 1 / cs;
    let total = 0;
    for (let i = 0; i < n; i++) {
      const s = items[i];
      const w = Math.floor(s.max.x * inv) - Math.floor(s.min.x * inv) + 1;
      const h = Math.floor(s.max.z * inv) - Math.floor(s.min.z * inv) + 1;
      const span = w * h;
      total += span > MAX_CELLS_PER_SHAPE ? 1 : span;   // oversized: coarse tier
      if (total > budget) break;
    }
    if (total <= budget) return cs;
  }
  return CELL_CANDIDATES[CELL_CANDIDATES.length - 1];
}

/** Validate + flatten compounds so each primitive is indexed on its own. */
function collect(src, out, depth) {
  for (let i = 0; i < src.length; i++) {
    const s = src[i];
    if (!s) continue;
    if (s.type === 'compound') {
      if (Array.isArray(s.parts) && depth < MAX_COMPOUND_DEPTH) collect(s.parts, out, depth + 1);
      continue;
    }
    const mn = s.min, mx = s.max;
    if (!mn || !mx) continue;
    if (!Number.isFinite(mn.x + mn.y + mn.z + mx.x + mx.y + mx.z)) continue;
    if (mx.x < mn.x || mx.y < mn.y || mx.z < mn.z) continue;
    out.push(s);
  }
}

/**
 * Build a uniform spatial hash over the XZ footprints of `shapes`.
 * Cheap enough to rebuild whenever a map's collider list changes identity
 * or length; a few thousand shapes builds in well under a millisecond.
 *
 * Two levels: most colliders land in a fine grid, footprints too wide for it
 * fall to a grid COARSE_MUL times coarser, and only genuinely map-sized
 * geometry ends up in the unconditional "always test" list.
 *
 * The returned object is read-only from the caller's point of view:
 *   grid.query(x, z, radius, outArray) -> outArray   (reused, never grows
 *                                                     unboundedly, no alloc)
 *
 * @param {Array} shapes    collider bag (new shapes and/or legacy {min,max})
 * @param {number} [cellSize]  metres; omitted = derived from the real cost
 */
export function buildGrid(shapes, cellSize) {
  const src = Array.isArray(shapes) ? shapes : [];
  const items = [];
  collect(src, items, 0);

  const cs = (Number.isFinite(cellSize) && cellSize > 0) ? cellSize : autoCellSize(items);
  const inv = 1 / cs;
  const coarseCs = cs * COARSE_MUL;
  const coarseInv = 1 / coarseCs;
  const fine = new Map();
  const coarse = new Map();
  const always = [];                    // shapes too large to bucket sanely
  let maxBucket = 0;

  const insert = (map, idx, mnx, mnz, mxx, mxz, iv) => {
    const i0 = clampIdx(Math.floor(mnx * iv));
    const i1 = clampIdx(Math.floor(mxx * iv));
    const k0 = clampIdx(Math.floor(mnz * iv));
    const k1 = clampIdx(Math.floor(mxz * iv));
    for (let ix = i0; ix <= i1; ix++) {
      for (let iz = k0; iz <= k1; iz++) {
        const key = cellKey(ix, iz);
        let bucket = map.get(key);
        if (!bucket) { bucket = []; map.set(key, bucket); }
        bucket.push(idx);
        if (bucket.length > maxBucket) maxBucket = bucket.length;
      }
    }
  };

  for (let i = 0; i < items.length; i++) {
    const s = items[i];
    const mnx = s.min.x, mnz = s.min.z, mxx = s.max.x, mxz = s.max.z;
    const fw = Math.floor(mxx * inv) - Math.floor(mnx * inv) + 1;
    const fh = Math.floor(mxz * inv) - Math.floor(mnz * inv) + 1;
    if (fw * fh <= MAX_CELLS_PER_SHAPE) { insert(fine, i, mnx, mnz, mxx, mxz, inv); continue; }
    const cw = Math.floor(mxx * coarseInv) - Math.floor(mnx * coarseInv) + 1;
    const ch = Math.floor(mxz * coarseInv) - Math.floor(mnz * coarseInv) + 1;
    if (cw * ch <= MAX_CELLS_PER_SHAPE) { insert(coarse, i, mnx, mnz, mxx, mxz, coarseInv); continue; }
    always.push(s);
  }

  const stamp = new Int32Array(items.length);
  const state = { tick: 0 };

  function gather(map, iv, x, z, rad, list, tick) {
    if (!map.size) return;
    const i0 = clampIdx(Math.floor((x - rad) * iv));
    const i1 = clampIdx(Math.floor((x + rad) * iv));
    const k0 = clampIdx(Math.floor((z - rad) * iv));
    const k1 = clampIdx(Math.floor((z + rad) * iv));
    for (let ix = i0; ix <= i1; ix++) {
      for (let iz = k0; iz <= k1; iz++) {
        const bucket = map.get(cellKey(ix, iz));
        if (!bucket) continue;
        for (let b = 0; b < bucket.length; b++) {
          const idx = bucket[b];
          if (stamp[idx] === tick) continue;
          stamp[idx] = tick;
          list.push(items[idx]);
        }
      }
    }
  }

  function query(x, z, radius, out) {
    const list = out || [];
    list.length = 0;
    for (let i = 0; i < always.length; i++) list.push(always[i]);
    if (!items.length) return list;
    const rad = radius > 0 ? radius : 0;
    if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(rad)) return list;

    // Visit stamps dedupe shapes that straddle several cells or levels.
    if (++state.tick >= 0x3fffffff) { stamp.fill(0); state.tick = 1; }
    const tick = state.tick;
    gather(fine, inv, x, z, rad, list, tick);
    gather(coarse, coarseInv, x, z, rad, list, tick);
    return list;
  }

  return {
    query,
    cellSize: cs,
    coarseCellSize: coarseCs,
    shapes: items,
    itemCount: items.length,
    sourceCount: src.length,
    cellCount: fine.size + coarse.size,
    coarseCount: coarse.size,
    alwaysCount: always.length,
    maxBucket,
  };
}
