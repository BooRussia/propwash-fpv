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
export const CURB_Z0 = 36.3;       // raised paver strip centres
export const CURB_Z1 = 51.7;
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

// Street furniture rests on the raised curb strips, everything else on the slab.
export function stripY(z) {
  return ((z > 35.1 && z < 37.5) || (z > 50.5 && z < 52.9)) ? CITY_Y + 0.13 : CITY_Y;
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
];

export function inKeepout(x, z, margin = 0) {
  for (let i = 0; i < KEEPOUT.length; i++) {
    const k = KEEPOUT[i];
    if (x >= k.x0 - margin && x <= k.x1 + margin &&
        z >= k.z0 - margin && z <= k.z1 + margin) return true;
  }
  return false;
}

/** Carriageway + curb strips. Sidewalk planting rows (36.5 / 51.5) stay open. */
export function onRoadway(z) {
  return (z > CURB_Z0 - 1.2 && z < CURB_Z1 + 1.2 && !(z > 35.6 && z < 37.4) && !(z > 50.6 && z < 52.4));
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
 */
export function onPavement(x, z) {
  return onRoadway(z) || onBoardwalk(x, z) || onCrossStreet(x, z) || onLummusWalk(x, z);
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
