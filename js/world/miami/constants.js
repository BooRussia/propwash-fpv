// Shared Miami terrain constants + height profile (mesh + physics).
export const SHORE_Z = -30;      // sand dips under water here
export const CITY_Z = 30;        // city plateau starts
export const CITY_Y = 1.5;

export const PIER_X = -150;

// ---- beachfront amusement plaza (ferris wheel + midway) ----
// Sited on the sand between the pier root and the north lifeguard stand, its
// deck flush with the boardwalk so the two read as one promenade. NOT in the
// Ocean Drive carriageway, which is where the wheel used to stand.
export const WHEEL_X = -215;
export const WHEEL_Z = 14.6;
export const WHEEL_R = 19;
export const PLAZA_X0 = -247, PLAZA_X1 = -183;
export const PLAZA_Z0 = 6.6, PLAZA_Z1 = 22.6;
export const PLAZA_Y = 1.8;        // deck top — same plane as the boardwalk deck
export const ARCH_X = WHEEL_X + 20;   // midway gate, clear of the wheel pylons

// ---- Lummus Park pergola walk (beach side, parallel to the boardwalk) ----
export const LUMMUS_X0 = -122, LUMMUS_X1 = -28;
export const LUMMUS_Z = 18.6;      // walk centre line (clear of the dune fence at 22.4)
export const LUMMUS_HALF = 1.55;   // post rows sit at LUMMUS_Z +- this
export const LUMMUS_Y = 1.46;      // level terrace top over the sand

// ---- beach volleyball courts ----
export const VBALL_X0 = 128, VBALL_X1 = 208;
export const VBALL_Z0 = 4.0, VBALL_Z1 = 20.0;

// ---- MIAMI letter sign ----
export const SIGN_X = 60, SIGN_Z = 14;

// ---- art-deco cinema (Ocean Drive, continues the hotel strip) ----
export const CINEMA_X = 166;
export const CINEMA_FRONT_Z = 57.6;   // same facade plane as the art-deco row
export const CINEMA_W = 46, CINEMA_D = 30;

// ---- marina + yacht club ----
export const MARINA_X = 300;
export const CLUB_X = 313, CLUB_Z = 12;   // between the outer two fingers
export const FUEL_Z = -30;                // fuel dock, out over the water

// ---- Ocean Drive ----
export const ROAD_Z = 44;          // road centre line
export const ROAD_HALF = 6;        // 12 m carriageway
export const ROAD_Z0 = 37.5;       // road band (nothing solid may stand inside)
export const ROAD_Z1 = 50.5;
// Thin granite curbs at the carriageway faces — NOT the old 2.4 m fat
// shoulder that ate the planting row. Sidewalk slabs sit further out.
export const CURB_BEACH_Z0 = 37.14, CURB_BEACH_Z1 = 37.52;
export const CURB_CITY_Z0 = 50.48, CURB_CITY_Z1 = 50.86;
export const CURB_Z0 = (CURB_BEACH_Z0 + CURB_BEACH_Z1) / 2;   // 37.33
export const CURB_Z1 = (CURB_CITY_Z0 + CURB_CITY_Z1) / 2;     // 50.67
export const CURB_H = 0.15;
// Dedicated sidewalk slabs (visual + collider). Planting rows 36.5 / 51.5
// sit in the tree lawn BETWEEN curb and walk — not on the slab.
export const SW_BEACH_Z0 = 33.95, SW_BEACH_Z1 = 35.85;
export const SW_CITY_Z0 = 52.05, SW_CITY_Z1 = 53.85;
export const SW_H = 0.13;
export const SW_CUT = 0.55;        // extra gap at each GAP_X beyond XS_HALF
export const PLANT_BEACH_Z = 36.5;
export const PLANT_CITY_Z = 51.5;
export const CROSS_X = [-129, 57];                        // zebra crossings near spawn
export const GAP_X = [-501, -315, -129, 57, 243, 429];    // cross-street columns
export const XS_HALF = 6.5;        // cross-street half width
export const XS_Z0 = 52.9, XS_Z1 = 268;

// ---- boardwalk + pier deck (visuals in landmarks/pier.js) ----
// Boardwalk: Box 1240 × 0.5 × 8 at (0, CITY_Y+0.05, CITY_Z-3).
// Pier deck: Box 12 × 0.6 × 165 at (PIER_X, 3.4, CITY_Z-88). Top = 3.7.
export const BOARDWALK_Z = CITY_Z - 3;
export const BOARDWALK_W = 1240;
export const BOARDWALK_D = 8;
export const BOARDWALK_H = 0.5;
export const BOARDWALK_Y = CITY_Y + 0.05;                 // mesh centre
export const BOARDWALK_TOP = BOARDWALK_Y + BOARDWALK_H / 2; // 1.8
export const BOARDWALK_SHOULDER = 1.2;                    // palm reject only
export const PIER_DECK_W = 12;
export const PIER_DECK_D = 165;
export const PIER_DECK_H = 0.6;
export const PIER_DECK_Y = 3.4;                           // mesh centre
export const PIER_DECK_TOP = PIER_DECK_Y + PIER_DECK_H / 2; // 3.7
export const PIER_DECK_Z = CITY_Z - 88;
export const PAVILION_Z = CITY_Z - 168;

// ---- pier fly-under (pylons + open bays; numbers owned here) ----
export const PIER_PYLON_DX = 5;
export const PIER_PYLON_R = 0.4;
export const PIER_PYLON_H = 10;
export const PIER_PYLON_Y0 = -6.5;
export const PIER_PYLON_Z0 = CITY_Z - 16;
export const PIER_PYLON_STEP = 17;
export const PIER_PYLON_COUNT = 10;
export const PAVILION_POST_R = 0.20;
export const PAVILION_POST_H = 3.35;
export const PAVILION_POST_XS = [-4.4, 4.4];
export const PAVILION_POST_ZS = [-3.8, 0, 3.8];

// ---- fly-through kit (reserved voids + mesh-tight jambs) ----
// Boardwalk pergola gate: whoop sash across the promenade (fly along +X).
export const GATE_X = 92;
export const GATE_Z = BOARDWALK_Z;
export const GATE_POST_R = 0.16;
export const GATE_POST_H = 2.20;
export const GATE_HALF_Z = 1.16;     // clear Z = 2.00 m (whoop sash)
export const GATE_HALF_X = 1.15;     // short bay along the walk
export const GATE_BEAM_H = 0.22;
export const GATE_BEAM_W = 0.24;
// Parking-garage mouth facing Ocean Drive: 5" through-aisle (fly along ±Z).
export const GARAGE_X = 200;
export const GARAGE_FRONT_Z = 56.20;
export const GARAGE_W = 15.2;
export const GARAGE_D = 13.6;
export const GARAGE_WALL_H = 4.40;
export const GARAGE_AISLE_W = 6.40;  // clear between inner jambs
export const GARAGE_SOFFIT = 3.60;
export const GARAGE_ROOF_H = 0.28;

// ---- abando haunt kit (leftover lot; punched voids; jambs only) ----
// Vacant city parcel east of the cinema, west of GAP 243. Not a street
// and not the boardwalk. Scatter still uses tryPlace — this reservation
// is one more keepout, not a second placer.
export const ABANDO_X = 224;
export const ABANDO_Z = 84;
export const ABANDO_W = 14.0;
export const ABANDO_D = 9.2;
export const ABANDO_H = 7.40;
export const ABANDO_WALL = 0.32;
export const ABANDO_PAD_H = 0.08;
export const ABANDO_ROOF_H = 0.16;
// 5″ through-bays (locked 1.2–2.4 m). Whoop sash is the smaller punch.
export const ABANDO_BAY_W = 2.20;
export const ABANDO_BAY_H = 2.36;
export const ABANDO_BAY_SILL = 0.46;
export const ABANDO_SASH_W = 1.24;
export const ABANDO_SASH_H = 1.36;
export const ABANDO_SASH_SILL = 4.15;
export const ABANDO_BAY_XS = [220.35, 227.65];
export const ABANDO_SASH_XS = [219.10, 224.00, 228.90];
// Stair clear 0.91–1.12 m (whoop). Stringers are the collider, not a box.
export const ABANDO_STAIR_CLEAR = 1.02;
export const ABANDO_STAIR_T = 0.10;
export const ABANDO_STAIR_RISE = 0.24;
export const ABANDO_STAIR_RUN = 0.24;
export const ABANDO_STAIR_TREAD = 0.04;
// Silo weenie + Ø0.61 m crown manhole. Wall is a ring, never a filled cyl.
export const ABANDO_SILO_DX = 8.55;
export const ABANDO_SILO_R = 2.06;
export const ABANDO_SILO_WALL = 0.28;
export const ABANDO_SILO_H = 14.6;
export const ABANDO_MANHOLE = 0.61;
export const ABANDO_CROWN_H = 0.22;
export const ABANDO_STACK_H = 4.8;
export const ABANDO_SILO_X = ABANDO_X + ABANDO_SILO_DX;
export const ABANDO_SILO_Z = ABANDO_Z;
export const ABANDO_X0 = ABANDO_X - ABANDO_W / 2;
export const ABANDO_X1 = ABANDO_X + ABANDO_W / 2;
export const ABANDO_Z0 = ABANDO_Z - ABANDO_D / 2;
export const ABANDO_Z1 = ABANDO_Z + ABANDO_D / 2;

// Street furniture rests on the sidewalk / curb slabs, everything else on grade.
export function stripY(z) {
  if ((z > SW_BEACH_Z0 && z < SW_BEACH_Z1) || (z > SW_CITY_Z0 && z < SW_CITY_Z1)) {
    return CITY_Y + SW_H;
  }
  if ((z > CURB_BEACH_Z0 && z < CURB_BEACH_Z1) || (z > CURB_CITY_Z0 && z < CURB_CITY_Z1)) {
    return CITY_Y + CURB_H;
  }
  return CITY_Y;
}

// ---- hero-landmark reservations ----
// Blocks where a hand-built landmark replaces the procedural skyline. Towers
// whose FOOTPRINT overlaps one are culled after the skyline pass (the rng
// stream is untouched — they are drawn, then removed), and the street-level
// planting pass filters its instanced spots against the same boxes.
export const RESERVED = [
  { x0: -100, x1: 45, z0: 55.6, z1: 100, tag: 'artdeco' },
  { x0: -112, x1: 16, z0: 104, z1: 166, tag: 'convention' },
  { x0: 126, x1: 208, z0: 55.6, z1: 100, tag: 'cinema' },
  { x0: 190, x1: 210, z0: 54.4, z1: 72.4, tag: 'garage' },
  { x0: ABANDO_X0 - 2.6, x1: ABANDO_SILO_X + ABANDO_SILO_R + 0.7,
    z0: ABANDO_Z0 - 1.6, z1: ABANDO_Z1 + 1.4, tag: 'abando' },
  { x0: -452, x1: -408, z0: 74, z1: 128, tag: 'helipadW' },
  { x0: 408, x1: 452, z0: 44, z1: 98, tag: 'helipadE' },
];

export function inReserved(x, z) {
  for (let i = 0; i < RESERVED.length; i++) {
    const r = RESERVED[i];
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return true;
  }
  return false;
}

/**
 * True when an axis-aligned footprint (centre x/z, size w/d) overlaps a
 * reservation by more than `margin` metres on both axes. Used by the skyline
 * cull so a hero block is never grazed by a procedural tower's corner.
 */
export function reservedOverlap(x, z, w, d, margin = 2) {
  const hw = w / 2, hd = d / 2;
  for (let i = 0; i < RESERVED.length; i++) {
    const r = RESERVED[i];
    const ox = Math.min(x + hw, r.x1) - Math.max(x - hw, r.x0);
    if (ox <= margin) continue;
    const oz = Math.min(z + hd, r.z1) - Math.max(z - hd, r.z0);
    if (oz > margin) return true;
  }
  return false;
}

// ---- ground keep-outs ----
// Rectangles of beach/plaza that belong to a built feature. Scatter passes
// (palms, shrubs, parasols, towels, rocks) test against these as well as the
// live collider bag, so a prop is rejected even when the feature it would
// have landed on is built later in the sequence.
export const KEEPOUT = [
  { x0: PLAZA_X0 - 1.5, x1: PLAZA_X1 + 1.5, z0: PLAZA_Z0 - 1.5, z1: PLAZA_Z1 + 1.5, tag: 'amusement' },
  { x0: LUMMUS_X0 - 3, x1: LUMMUS_X1 + 3, z0: LUMMUS_Z - 4.2, z1: LUMMUS_Z + 4.2, tag: 'lummus' },
  { x0: VBALL_X0 - 2, x1: VBALL_X1 + 2, z0: VBALL_Z0 - 2, z1: VBALL_Z1 + 2, tag: 'volleyball' },
  { x0: PIER_X - 13, x1: PIER_X + 13, z0: -160, z1: 32, tag: 'pier' },
  { x0: SIGN_X - 4, x1: SIGN_X + 56, z0: SIGN_Z - 5, z1: SIGN_Z + 5, tag: 'sign' },
  { x0: -9, x1: 9, z0: -1, z1: 17, tag: 'spawn' },
  { x0: MARINA_X - 16, x1: MARINA_X + 68, z0: -110, z1: 26, tag: 'marina' },
  { x0: 452, x1: 492, z0: -86, z1: 4, tag: 'lighthouse' },
  // reserved fly-through bays — published before scatter, never filled
  { x0: GATE_X - GATE_HALF_X - 0.8, x1: GATE_X + GATE_HALF_X + 0.8,
    z0: GATE_Z - GATE_HALF_Z - 0.8, z1: GATE_Z + GATE_HALF_Z + 0.8, tag: 'boardwalk-gate' },
  { x0: GARAGE_X - GARAGE_W / 2 - 0.6, x1: GARAGE_X + GARAGE_W / 2 + 0.6,
    z0: GARAGE_FRONT_Z - 0.8, z1: GARAGE_FRONT_Z + GARAGE_D + 0.6, tag: 'garage' },
  { x0: ABANDO_X0 - 2.4, x1: ABANDO_SILO_X + ABANDO_SILO_R + 0.55,
    z0: ABANDO_Z0 - 1.4, z1: ABANDO_Z1 + 1.2, tag: 'abando' },
];

export function inKeepout(x, z, margin = 0) {
  for (let i = 0; i < KEEPOUT.length; i++) {
    const k = KEEPOUT[i];
    if (x >= k.x0 - margin && x <= k.x1 + margin &&
        z >= k.z0 - margin && z <= k.z1 + margin) return true;
  }
  return false;
}

/** True when x sits in a cross-street cut — sidewalks stop, paint continues. */
export function sidewalkInterrupted(x) {
  for (let i = 0; i < GAP_X.length; i++) {
    if (Math.abs(x - GAP_X[i]) <= XS_HALF + SW_CUT) return true;
  }
  return false;
}

/** Contiguous Ocean Drive sidewalk runs (gaps at every GAP_X). */
export function sidewalkRuns(x0 = -620, x1 = 620) {
  const half = XS_HALF + SW_CUT;
  const cuts = GAP_X.slice().sort((a, b) => a - b);
  const runs = [];
  let x = x0;
  for (let i = 0; i < cuts.length; i++) {
    const a = cuts[i] - half, b = cuts[i] + half;
    if (a > x + 1.5) runs.push({ x0: x, x1: a });
    if (b > x) x = b;
  }
  if (x1 - x > 1.5) runs.push({ x0: x, x1 });
  return runs;
}

/** Carriageway only. Sidewalks and planting rows are not roadway. */
export function onRoadway(z) {
  return z > ROAD_Z0 && z < ROAD_Z1;
}

/** Thin curb faces. */
export function onCurb(z) {
  return (z >= CURB_BEACH_Z0 && z <= CURB_BEACH_Z1)
      || (z >= CURB_CITY_Z0 && z <= CURB_CITY_Z1);
}

/** Raised sidewalk slab (not the tree-lawn planting row). */
export function onSidewalk(x, z) {
  if (sidewalkInterrupted(x)) return false;
  return (z >= SW_BEACH_Z0 && z <= SW_BEACH_Z1)
      || (z >= SW_CITY_Z0 && z <= SW_CITY_Z1);
}

/** Tree lawn between curb and sidewalk — palms may stand here. */
export function onPlantingRow(z) {
  return (z > SW_BEACH_Z1 && z < CURB_BEACH_Z0)
      || (z > CURB_CITY_Z1 && z < SW_CITY_Z0);
}

/** Boardwalk deck strip plus the ~1.2 m shoulder. Drop, never nudge. */
export function onBoardwalk(x, z) {
  return Math.abs(x) <= BOARDWALK_W / 2
      && Math.abs(z - BOARDWALK_Z) <= BOARDWALK_D / 2 + BOARDWALK_SHOULDER;
}

/** Asphalt columns of the cross streets (GAP_X × XS_Z0..XS_Z1). */
export function onCrossStreet(x, z) {
  if (z < XS_Z0 || z > XS_Z1) return false;
  for (let i = 0; i < GAP_X.length; i++) {
    if (Math.abs(x - GAP_X[i]) <= XS_HALF) return true;
  }
  return false;
}

/** Lummus pergola walk (paver terrace between the post rows). */
export function onLummusWalk(x, z) {
  return x >= LUMMUS_X0 && x <= LUMMUS_X1
      && Math.abs(z - LUMMUS_Z) <= LUMMUS_HALF + 1.2;
}

/**
 * Hard pavement: palms that fail this are dropped, never slid onto the deck.
 * inKeepout is a separate test (plaza / pier / spawn / marina…).
 * Planting rows (36.5 / 51.5) stay off this list.
 */
export function onPavement(x, z) {
  return onRoadway(z) || onCurb(z) || onSidewalk(x, z)
      || onBoardwalk(x, z) || onCrossStreet(x, z) || onLummusWalk(x, z);
}

/**
 * Reserved fly-through openings. Each bay is a keepout (see KEEPOUT) and a
 * documented void: collider is the jamb/post/beam, never a box in the hole.
 * `kind: 'kit'` lines are new this pass; `existing` are the pier lines #21 left open.
 */
export const FLY_VOIDS = [
  {
    id: 'pier-undercroft', kind: 'existing',
    x: PIER_X,
    z: PIER_PYLON_Z0 - 3.5 * PIER_PYLON_STEP,
    y: 0.85,
    x0: PIER_X - (PIER_PYLON_DX - PIER_PYLON_R - 0.15),
    x1: PIER_X + (PIER_PYLON_DX - PIER_PYLON_R - 0.15),
    z0: PIER_PYLON_Z0 - 4 * PIER_PYLON_STEP + PIER_PYLON_R + 0.2,
    z1: PIER_PYLON_Z0 - 3 * PIER_PYLON_STEP - PIER_PYLON_R - 0.2,
    y0: -1.2, y1: PIER_DECK_Y - PIER_DECK_H / 2 - 0.05,
    openW: (PIER_PYLON_DX - PIER_PYLON_R) * 2,
    openH: (PIER_DECK_Y - PIER_DECK_H / 2) - (-1.2),
  },
  {
    id: 'pier-pavilion', kind: 'existing',
    x: PIER_X, z: PAVILION_Z, y: PIER_DECK_TOP + PAVILION_POST_H * 0.48,
    x0: PIER_X + PAVILION_POST_XS[0] + PAVILION_POST_R + 0.1,
    x1: PIER_X + PAVILION_POST_XS[1] - PAVILION_POST_R - 0.1,
    z0: PAVILION_Z + PAVILION_POST_ZS[0] + PAVILION_POST_R + 0.1,
    z1: PAVILION_Z + PAVILION_POST_ZS[2] - PAVILION_POST_R - 0.1,
    y0: PIER_DECK_TOP + 0.08, y1: PIER_DECK_TOP + PAVILION_POST_H - 0.05,
    openW: (PAVILION_POST_XS[1] - PAVILION_POST_XS[0]) - 2 * PAVILION_POST_R,
    openH: PAVILION_POST_H,
  },
  {
    id: 'boardwalk-gate', kind: 'kit',
    x: GATE_X, z: GATE_Z, y: BOARDWALK_TOP + GATE_POST_H * 0.48,
    x0: GATE_X - GATE_HALF_X + GATE_POST_R + 0.08,
    x1: GATE_X + GATE_HALF_X - GATE_POST_R - 0.08,
    z0: GATE_Z - GATE_HALF_Z + GATE_POST_R + 0.08,
    z1: GATE_Z + GATE_HALF_Z - GATE_POST_R - 0.08,
    y0: BOARDWALK_TOP + 0.06, y1: BOARDWALK_TOP + GATE_POST_H - 0.04,
    openW: GATE_HALF_Z * 2 - 2 * GATE_POST_R,
    openH: GATE_POST_H,
  },
  {
    id: 'garage-mouth', kind: 'kit',
    x: GARAGE_X, z: GARAGE_FRONT_Z + GARAGE_D * 0.5,
    y: CITY_Y + GARAGE_SOFFIT * 0.48,
    x0: GARAGE_X - GARAGE_AISLE_W / 2 + 0.08,
    x1: GARAGE_X + GARAGE_AISLE_W / 2 - 0.08,
    z0: GARAGE_FRONT_Z + 0.15,
    z1: GARAGE_FRONT_Z + GARAGE_D - 0.15,
    y0: CITY_Y + 0.08, y1: CITY_Y + GARAGE_SOFFIT - 0.06,
    openW: GARAGE_AISLE_W,
    openH: GARAGE_SOFFIT,
  },
];

export function inFlyVoid(x, z, margin = 0) {
  for (let i = 0; i < FLY_VOIDS.length; i++) {
    const v = FLY_VOIDS[i];
    if (x >= v.x0 - margin && x <= v.x1 + margin &&
        z >= v.z0 - margin && z <= v.z1 + margin) return v;
  }
  return null;
}

/** Mesh-tight jamb/post/beam/roof shapes. Never a box that fills a bay. */
export function flyColliderShapes() {
  const shapes = [];
  // boardwalk gate — four posts + lintels + lid (lid sits ON the soffit)
  for (const dx of [-GATE_HALF_X, GATE_HALF_X]) {
    for (const dz of [-GATE_HALF_Z, GATE_HALF_Z]) {
      shapes.push({
        type: 'cyl', tag: 'boardwalk-gate',
        x: GATE_X + dx, z: GATE_Z + dz, r: GATE_POST_R,
        y0: BOARDWALK_TOP, h: GATE_POST_H,
      });
    }
  }
  const beamY = BOARDWALK_TOP + GATE_POST_H;
  const spanX = GATE_HALF_X * 2;
  const spanZ = GATE_HALF_Z * 2;
  for (const dz of [-GATE_HALF_Z, GATE_HALF_Z]) {
    shapes.push({
      type: 'aabb', tag: 'boardwalk-gate',
      x: GATE_X, z: GATE_Z + dz, sx: spanX + GATE_BEAM_W, sz: GATE_BEAM_W,
      y0: beamY, sy: GATE_BEAM_H,
    });
  }
  for (const dx of [-GATE_HALF_X, GATE_HALF_X]) {
    shapes.push({
      type: 'aabb', tag: 'boardwalk-gate',
      x: GATE_X + dx, z: GATE_Z, sx: GATE_BEAM_W, sz: spanZ + GATE_BEAM_W,
      y0: beamY, sy: GATE_BEAM_H,
    });
  }
  shapes.push({
    type: 'aabb', tag: 'boardwalk-gate',
    x: GATE_X, z: GATE_Z, sx: spanX + 1.1, sz: spanZ + 1.0,
    y0: beamY + GATE_BEAM_H, sy: 0.12,
  });

  // garage — side masses + soffit/roof. Aisle is empty.
  const aisle = GARAGE_AISLE_W;
  const sideW = (GARAGE_W - aisle) / 2;
  const gz = GARAGE_FRONT_Z + GARAGE_D / 2;
  for (const s of [-1, 1]) {
    shapes.push({
      type: 'aabb', tag: 'garage',
      x: GARAGE_X + s * (aisle / 2 + sideW / 2), z: gz,
      sx: sideW, sz: GARAGE_D, y0: CITY_Y, sy: GARAGE_WALL_H,
    });
  }
  shapes.push({
    type: 'aabb', tag: 'garage',
    x: GARAGE_X, z: gz, sx: GARAGE_W + 0.3, sz: GARAGE_D + 0.3,
    y0: CITY_Y + GARAGE_SOFFIT, sy: GARAGE_ROOF_H,
  });
  return shapes;
}

export function pierFlyShapes() {
  const shapes = [];
  for (let i = 0; i < PIER_PYLON_COUNT; i++) {
    const z = PIER_PYLON_Z0 - i * PIER_PYLON_STEP;
    for (const s of [-1, 1]) {
      shapes.push({
        type: 'cyl', tag: 'pier',
        x: PIER_X + s * PIER_PYLON_DX, z, r: PIER_PYLON_R,
        y0: PIER_PYLON_Y0, h: PIER_PYLON_H,
      });
    }
  }
  for (let i = 0; i < PAVILION_POST_XS.length; i++) {
    for (let j = 0; j < PAVILION_POST_ZS.length; j++) {
      shapes.push({
        type: 'cyl', tag: 'pier',
        x: PIER_X + PAVILION_POST_XS[i], z: PAVILION_Z + PAVILION_POST_ZS[j],
        r: PAVILION_POST_R, y0: PIER_DECK_TOP, h: PAVILION_POST_H,
      });
    }
  }
  return shapes;
}

/** Push kit colliders into the live bag. Pass `tag` to install one structure. */
export function installFlyColliders(addCyl, addCollider, tag) {
  const shapes = flyColliderShapes();
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    if (tag && s.tag !== tag) continue;
    if (s.type === 'cyl') addCyl(s.x, s.y0, s.z, s.r, s.h);
    else addCollider(s.x, s.y0, s.z, s.sx, s.sy, s.sz);
  }
}

/**
 * Abando reserved voids. Collider is the jamb / stringer / silo lip —
 * never a box that fills a bay, stair, or manhole.
 */
export function abandoVoids() {
  const yBay = CITY_Y + ABANDO_BAY_SILL + ABANDO_BAY_H * 0.48;
  const ySash = CITY_Y + ABANDO_SASH_SILL + ABANDO_SASH_H * 0.48;
  const voids = [];
  for (let i = 0; i < ABANDO_BAY_XS.length; i++) {
    const x = ABANDO_BAY_XS[i];
    voids.push({
      id: `abando-bay-ocean-${i}`, kind: 'bay',
      x, z: ABANDO_Z0 + ABANDO_WALL * 0.5, y: yBay,
      x0: x - ABANDO_BAY_W / 2, x1: x + ABANDO_BAY_W / 2,
      z0: ABANDO_Z0 - 0.2, z1: ABANDO_Z0 + ABANDO_WALL + 0.2,
      y0: CITY_Y + ABANDO_BAY_SILL, y1: CITY_Y + ABANDO_BAY_SILL + ABANDO_BAY_H,
      openW: ABANDO_BAY_W, openH: ABANDO_BAY_H, probe: 0.20,
    });
    voids.push({
      id: `abando-bay-inland-${i}`, kind: 'bay',
      x, z: ABANDO_Z1 - ABANDO_WALL * 0.5, y: yBay,
      x0: x - ABANDO_BAY_W / 2, x1: x + ABANDO_BAY_W / 2,
      z0: ABANDO_Z1 - ABANDO_WALL - 0.2, z1: ABANDO_Z1 + 0.2,
      y0: CITY_Y + ABANDO_BAY_SILL, y1: CITY_Y + ABANDO_BAY_SILL + ABANDO_BAY_H,
      openW: ABANDO_BAY_W, openH: ABANDO_BAY_H, probe: 0.20,
    });
  }
  for (let i = 0; i < ABANDO_SASH_XS.length; i++) {
    const x = ABANDO_SASH_XS[i];
    voids.push({
      id: `abando-sash-ocean-${i}`, kind: 'sash',
      x, z: ABANDO_Z0 + ABANDO_WALL * 0.5, y: ySash,
      x0: x - ABANDO_SASH_W / 2, x1: x + ABANDO_SASH_W / 2,
      z0: ABANDO_Z0 - 0.15, z1: ABANDO_Z0 + ABANDO_WALL + 0.15,
      y0: CITY_Y + ABANDO_SASH_SILL, y1: CITY_Y + ABANDO_SASH_SILL + ABANDO_SASH_H,
      openW: ABANDO_SASH_W, openH: ABANDO_SASH_H, probe: 0.08,
    });
  }
  voids.push({
    id: 'abando-bay-silo', kind: 'bay',
    x: ABANDO_X1 - ABANDO_WALL * 0.5, z: ABANDO_Z, y: yBay,
    x0: ABANDO_X1 - ABANDO_WALL - 0.2, x1: ABANDO_X1 + 0.2,
    z0: ABANDO_Z - ABANDO_BAY_W / 2, z1: ABANDO_Z + ABANDO_BAY_W / 2,
    y0: CITY_Y + ABANDO_BAY_SILL, y1: CITY_Y + ABANDO_BAY_SILL + ABANDO_BAY_H,
    openW: ABANDO_BAY_W, openH: ABANDO_BAY_H, probe: 0.20,
  });
  const stair = abandoStairGeom();
  const step = Math.floor(stair.nRise * 0.42);
  const treadY = CITY_Y + step * ABANDO_STAIR_RISE;
  const riserGap = ABANDO_STAIR_RISE - ABANDO_STAIR_TREAD;
  voids.push({
    id: 'abando-stair', kind: 'stair',
    x: stair.clearX, z: stair.z0 + step * ABANDO_STAIR_RUN,
    y: treadY + ABANDO_STAIR_TREAD + riserGap * 0.5,
    x0: stair.outerX + ABANDO_STAIR_T, x1: stair.innerX,
    z0: stair.z0 + 0.15, z1: stair.z0 + stair.length - 0.15,
    y0: CITY_Y + 0.12, y1: CITY_Y + ABANDO_H - 0.2,
    openW: ABANDO_STAIR_CLEAR, openH: ABANDO_H - 0.3, probe: 0.08,
  });
  const mhR = ABANDO_MANHOLE / 2;
  voids.push({
    id: 'abando-manhole', kind: 'manhole',
    x: ABANDO_SILO_X, z: ABANDO_SILO_Z,
    y: CITY_Y + ABANDO_SILO_H + ABANDO_CROWN_H * 0.5,
    x0: ABANDO_SILO_X - mhR, x1: ABANDO_SILO_X + mhR,
    z0: ABANDO_SILO_Z - mhR, z1: ABANDO_SILO_Z + mhR,
    y0: CITY_Y + ABANDO_SILO_H - 0.15,
    y1: CITY_Y + ABANDO_SILO_H + ABANDO_CROWN_H + 0.25,
    openW: ABANDO_MANHOLE, openH: ABANDO_CROWN_H + 0.4, probe: 0.10,
  });
  return voids;
}

/** Exterior west-face stair. Clear sits between the two stringers. */
export function abandoStairGeom() {
  const nRise = Math.round(ABANDO_H / ABANDO_STAIR_RISE);
  const length = (nRise - 1) * ABANDO_STAIR_RUN;
  const innerX = ABANDO_X0 - 0.02;
  const outerX = innerX - ABANDO_STAIR_CLEAR - ABANDO_STAIR_T;
  const clearX = innerX - ABANDO_STAIR_CLEAR / 2;
  const z0 = ABANDO_Z0 + 0.55;
  return { nRise, length, innerX, outerX, clearX, z0 };
}

function pushAabb(shapes, x, z, sx, sz, y0, sy) {
  shapes.push({ type: 'aabb', tag: 'abando', x, z, sx, sz, y0, sy });
}

function wallBand(shapes, x0, x1, z, sz, y0, sy) {
  const w = x1 - x0;
  if (w <= 0.04) return;
  pushAabb(shapes, (x0 + x1) / 2, z, w, sz, y0, sy);
}

/** Punch one axis-aligned face into jamb / sill / lintel boxes. */
function punchFaceX(shapes, z, openings, y0, y1, faceY0, faceY1) {
  const zs = ABANDO_WALL;
  const sorted = openings.slice().sort((a, b) => a.x - b.x);
  let cursor = ABANDO_X0;
  for (let i = 0; i < sorted.length; i++) {
    const o = sorted[i];
    wallBand(shapes, cursor, o.x - o.w / 2, z, zs, y0, y1 - y0);
    cursor = o.x + o.w / 2;
  }
  wallBand(shapes, cursor, ABANDO_X1, z, zs, y0, y1 - y0);
  for (let i = 0; i < sorted.length; i++) {
    const o = sorted[i];
    if (o.sill > faceY0 + 0.02) {
      pushAabb(shapes, o.x, z, o.w, zs, faceY0, o.sill - faceY0);
    }
    const lintelY = o.sill + o.h;
    if (faceY1 - lintelY > 0.04) {
      pushAabb(shapes, o.x, z, o.w, zs, lintelY, faceY1 - lintelY);
    }
  }
}

/** Jamb / lip / ring shapes. Never a filled opening. */
export function abandoColliderShapes() {
  const shapes = [];
  const y0 = CITY_Y;
  const yRoof = CITY_Y + ABANDO_H;
  const oceanZ = ABANDO_Z0 + ABANDO_WALL / 2;
  const inlandZ = ABANDO_Z1 - ABANDO_WALL / 2;
  const bays = ABANDO_BAY_XS.map((x) => ({
    x, w: ABANDO_BAY_W, h: ABANDO_BAY_H, sill: y0 + ABANDO_BAY_SILL,
  }));
  const sashes = ABANDO_SASH_XS.map((x) => ({
    x, w: ABANDO_SASH_W, h: ABANDO_SASH_H, sill: y0 + ABANDO_SASH_SILL,
  }));

  // Ocean / inland faces — punched bands, not a filled wall box.
  punchFaceX(shapes, oceanZ, bays, y0, y0 + ABANDO_BAY_SILL + ABANDO_BAY_H, y0, y0 + ABANDO_BAY_SILL + ABANDO_BAY_H);
  punchFaceX(shapes, oceanZ, sashes, y0 + ABANDO_SASH_SILL, y0 + ABANDO_SASH_SILL + ABANDO_SASH_H,
    y0 + ABANDO_SASH_SILL, y0 + ABANDO_SASH_SILL + ABANDO_SASH_H);
  wallBand(shapes, ABANDO_X0, ABANDO_X1, oceanZ, ABANDO_WALL,
    y0 + ABANDO_BAY_SILL + ABANDO_BAY_H,
    ABANDO_SASH_SILL - (ABANDO_BAY_SILL + ABANDO_BAY_H));
  wallBand(shapes, ABANDO_X0, ABANDO_X1, oceanZ, ABANDO_WALL,
    y0 + ABANDO_SASH_SILL + ABANDO_SASH_H,
    yRoof - (y0 + ABANDO_SASH_SILL + ABANDO_SASH_H));

  punchFaceX(shapes, inlandZ, bays, y0, y0 + ABANDO_BAY_SILL + ABANDO_BAY_H, y0, y0 + ABANDO_BAY_SILL + ABANDO_BAY_H);
  wallBand(shapes, ABANDO_X0, ABANDO_X1, inlandZ, ABANDO_WALL,
    y0 + ABANDO_BAY_SILL + ABANDO_BAY_H, yRoof - (y0 + ABANDO_BAY_SILL + ABANDO_BAY_H));

  // West wall (solid). Stair is outside this plane.
  pushAabb(shapes, ABANDO_X0 + ABANDO_WALL / 2, ABANDO_Z, ABANDO_WALL, ABANDO_D, y0, ABANDO_H);

  // East wall — one punched bay into the silo, jambs only.
  const eastX = ABANDO_X1 - ABANDO_WALL / 2;
  const eastBayW = ABANDO_BAY_W;
  const eastJambD = (ABANDO_D - eastBayW) / 2;
  pushAabb(shapes, eastX, ABANDO_Z0 + eastJambD / 2,
    ABANDO_WALL, eastJambD, y0, ABANDO_BAY_SILL + ABANDO_BAY_H);
  pushAabb(shapes, eastX, ABANDO_Z1 - eastJambD / 2,
    ABANDO_WALL, eastJambD, y0, ABANDO_BAY_SILL + ABANDO_BAY_H);
  pushAabb(shapes, eastX, ABANDO_Z, ABANDO_WALL, eastBayW, y0, ABANDO_BAY_SILL);
  pushAabb(shapes, eastX, ABANDO_Z, ABANDO_WALL, eastBayW,
    y0 + ABANDO_BAY_SILL + ABANDO_BAY_H,
    ABANDO_H - (ABANDO_BAY_SILL + ABANDO_BAY_H));

  // Floor pad + roof lid. Neither fills the volume.
  pushAabb(shapes, ABANDO_X, ABANDO_Z, ABANDO_W + 0.2, ABANDO_D + 0.2, y0, ABANDO_PAD_H);
  pushAabb(shapes, ABANDO_X, ABANDO_Z, ABANDO_W + 0.16, ABANDO_D + 0.16, yRoof, ABANDO_ROOF_H);

  // Weenie stack on the roof — solid, no opening.
  pushAabb(shapes, ABANDO_X0 + 2.1, ABANDO_Z1 - 2.0, 0.62, 0.62, yRoof, ABANDO_STACK_H);

  // Stair stringers + thin treads. Clear between stringers is empty.
  const st = abandoStairGeom();
  pushAabb(shapes, st.innerX + ABANDO_STAIR_T / 2, st.z0 + st.length / 2,
    ABANDO_STAIR_T, st.length + 0.12, y0, ABANDO_H);
  pushAabb(shapes, st.outerX + ABANDO_STAIR_T / 2, st.z0 + st.length / 2,
    ABANDO_STAIR_T, st.length + 0.12, y0, ABANDO_H);
  for (let i = 0; i < st.nRise; i++) {
    const tz = st.z0 + i * ABANDO_STAIR_RUN;
    const ty = y0 + i * ABANDO_STAIR_RISE;
    pushAabb(shapes, st.clearX, tz, ABANDO_STAIR_CLEAR, ABANDO_STAIR_RUN * 0.72,
      ty, ABANDO_STAIR_TREAD);
  }

  // Silo wall ring — sector AABBs. Interior + manhole stay open.
  const sectors = 12;
  const openWest = 0.62; // skip sectors facing the east-wall bay
  const wallR = ABANDO_SILO_R - ABANDO_SILO_WALL / 2;
  const chord = 2 * ABANDO_SILO_R * Math.sin(Math.PI / sectors);
  for (let i = 0; i < sectors; i++) {
    const a = (i / sectors) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    if (ca < -openWest) continue;
    const cx = ABANDO_SILO_X + ca * wallR;
    const cz = ABANDO_SILO_Z + sa * wallR;
    const thick = ABANDO_SILO_WALL + 0.04;
    const along = chord * 0.88;
    const sx = Math.abs(ca) >= Math.abs(sa) ? thick : along;
    const sz = Math.abs(ca) >= Math.abs(sa) ? along : thick;
    pushAabb(shapes, cx, cz, sx, sz, y0, ABANDO_SILO_H);
  }

  // Crown lid: four cardinal slabs around the Ø0.61 m hole. Never a filled cap.
  const mhR = ABANDO_MANHOLE / 2;
  const lidOuter = ABANDO_SILO_R + 0.04;
  const lidDepth = lidOuter - mhR;
  const lidMid = mhR + lidDepth / 2;
  const crownY = y0 + ABANDO_SILO_H;
  const span = lidOuter * 2;
  pushAabb(shapes, ABANDO_SILO_X, ABANDO_SILO_Z + lidMid, span, lidDepth, crownY, ABANDO_CROWN_H);
  pushAabb(shapes, ABANDO_SILO_X, ABANDO_SILO_Z - lidMid, span, lidDepth, crownY, ABANDO_CROWN_H);
  pushAabb(shapes, ABANDO_SILO_X + lidMid, ABANDO_SILO_Z, lidDepth, ABANDO_MANHOLE, crownY, ABANDO_CROWN_H);
  pushAabb(shapes, ABANDO_SILO_X - lidMid, ABANDO_SILO_Z, lidDepth, ABANDO_MANHOLE, crownY, ABANDO_CROWN_H);
  return shapes;
}

/** Push abando jamb / lip colliders. Same bag as the fly-through kit. */
export function installAbandoColliders(addCyl, addCollider) {
  void addCyl;
  const shapes = abandoColliderShapes();
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    addCollider(s.x, s.y0, s.z, s.sx, s.sy, s.sz);
  }
}

/** Top of the boardwalk or pier deck at (x,z), or -Infinity if over neither. */
export function deckTop(x, z) {
  let top = -Infinity;
  if (Math.abs(x) <= BOARDWALK_W / 2 && Math.abs(z - BOARDWALK_Z) <= BOARDWALK_D / 2) {
    top = BOARDWALK_TOP;
  }
  if (Math.abs(x - PIER_X) <= PIER_DECK_W / 2 && Math.abs(z - PIER_DECK_Z) <= PIER_DECK_D / 2) {
    if (PIER_DECK_TOP > top) top = PIER_DECK_TOP;
  }
  return top;
}

/**
 * Surface the FPV camera must stay above: terrain / water plane, or the
 * boardwalk / pier deck top when the probe is over those colliders.
 */
export function cameraFloor(x, z) {
  const g = groundHeight(x, z);
  const d = deckTop(x, z);
  return d > g ? d : g;
}

export function sandNoise(x, z) {
  return 0.14 * Math.sin(x * 0.11 + 1.7) * Math.sin(z * 0.17 + 0.4)
       + 0.08 * Math.sin(x * 0.031) * Math.sin(z * 0.043 + 2.0);
}

export function baseProfile(z) {
  if (z >= CITY_Z) return CITY_Y;
  if (z <= SHORE_Z) return Math.max(-6, -0.4 + (z - SHORE_Z) * 0.08);
  const t = (z - SHORE_Z) / (CITY_Z - SHORE_Z);          // 0..1
  const s = t * t * (3 - 2 * t);                          // smoothstep
  return -0.4 + s * (CITY_Y + 0.4);
}

export function groundHeight(x, z) {
  let g = baseProfile(z);
  if (z < CITY_Z - 2 && z > SHORE_Z - 30) g += sandNoise(x, z) * Math.max(0, 1 - Math.abs(z - 0) / 60);
  return g < 0.02 && z < 8 ? 0 : g;                       // water surface counts as ground
}

// mesh displacement — same formula the physics-adjacent vertex loop always used
export function meshHeight(x, z) {
  return baseProfile(z) + (z < CITY_Z - 2 ? sandNoise(x, z) * Math.max(0, 1 - Math.abs(z) / 60) : 0);
}

// seabed under the waterline (no "water counts as ground" clamp)
export function seabedHeight(x, z) {
  return baseProfile(z) + sandNoise(x, z) * Math.max(0, 1 - Math.abs(z) / 60);
}
