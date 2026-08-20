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

// ---- drop haunt kit (leftover roof; hoistway well; jambs / lip only) ----
// Vacant city parcel west of the cinema, east of GAP 57. Leftover roof
// on leftover city — not a street, boardwalk, or path. Scatter still
// uses tryPlace; this reservation is one more keepout, not a second placer.
// Whoop flies the 1.07 × 2.13 m door; 5″ drops the ~2.5 × 2.0 m well.
export const DROP_X = 92;
export const DROP_Z = 84;
export const DROP_W = 15.2;
export const DROP_D = 11.0;
export const DROP_H = 12.4;
export const DROP_WALL = 0.28;
export const DROP_SLAB = 0.18;
export const DROP_PARAPET = 1.05;
export const DROP_PARAPET_T = 0.15;
export const DROP_SETBACK = 2.15;
export const DROP_HOIST_W = 2.50;
export const DROP_HOIST_D = 2.00;
export const DROP_DOOR_W = 1.07;
export const DROP_DOOR_H = 2.13;
export const DROP_PENT_H = 2.50;
export const DROP_COL_R = 0.16;
export const DROP_LIP = 0.08;
export const DROP_X0 = DROP_X - DROP_W / 2;
export const DROP_X1 = DROP_X + DROP_W / 2;
export const DROP_Z0 = DROP_Z - DROP_D / 2;
export const DROP_Z1 = DROP_Z + DROP_D / 2;
export const DROP_ROOF_Y = CITY_Y + DROP_H;

/** Hoistway well — set back from the ocean / west parapet. Open top. */
export function dropHoistGeom() {
  const holeX0 = DROP_X0 + DROP_PARAPET_T + DROP_SETBACK;
  const holeZ0 = DROP_Z0 + DROP_PARAPET_T + DROP_SETBACK;
  const holeX1 = holeX0 + DROP_HOIST_W;
  const holeZ1 = holeZ0 + DROP_HOIST_D;
  const x = (holeX0 + holeX1) / 2;
  const z = (holeZ0 + holeZ1) / 2;
  const eastX = holeX1 + DROP_WALL / 2;
  return { holeX0, holeX1, holeZ0, holeZ1, x, z, eastX };
}

// ---- warehouse haunt kit (leftover industrial; aisles + dock; jambs / racks) ----
// Vacant industrial parcel east of GAP 243, inland of the hotel strip.
// Leftover industrial / leftover city — not a street, boardwalk, or path.
// Scatter still uses tryPlace; this reservation is one more keepout, not a
// second placer. Whoop flies the VNA / sash; 5″ flies the wide aisle / dock.
// Weenie is the dock mouth. Collider is the jamb / rack upright / leveler
// lip — never a filled aisle or door.
export const WAREHOUSE_X = 278;
export const WAREHOUSE_Z = 108;
export const WAREHOUSE_WALL = 0.28;
export const WAREHOUSE_RACK = 1.05;
export const WAREHOUSE_UPRIGHT = 0.10;
export const WAREHOUSE_BEAM = 0.08;
export const WAREHOUSE_WIDE = 4.00;
export const WAREHOUSE_NARROW = 2.70;
export const WAREHOUSE_VNA = 1.60;
export const WAREHOUSE_W = 2 * WAREHOUSE_WALL + 4 * WAREHOUSE_RACK
  + WAREHOUSE_WIDE + WAREHOUSE_NARROW + WAREHOUSE_VNA;
export const WAREHOUSE_D = 15.60;
export const WAREHOUSE_H = 7.20;
export const WAREHOUSE_PAD_H = 0.08;
export const WAREHOUSE_ROOF_H = 0.18;
export const WAREHOUSE_RACK_H = 6.40;
export const WAREHOUSE_DOOR_W = 2.70;
export const WAREHOUSE_DOOR_H = 3.00;
export const WAREHOUSE_LEVELER = 1.22;
export const WAREHOUSE_LEVELER_T = 0.12;
export const WAREHOUSE_SASH_W = 1.36;
export const WAREHOUSE_SASH_H = 1.40;
export const WAREHOUSE_SASH_SILL = 3.85;
export const WAREHOUSE_LIP = 0.08;
export const WAREHOUSE_X0 = WAREHOUSE_X - WAREHOUSE_W / 2;
export const WAREHOUSE_X1 = WAREHOUSE_X + WAREHOUSE_W / 2;
export const WAREHOUSE_Z0 = WAREHOUSE_Z - WAREHOUSE_D / 2;
export const WAREHOUSE_Z1 = WAREHOUSE_Z + WAREHOUSE_D / 2;

/** Aisle centres + dock mouth. Racks sit in the leftover strips, not the clear. */
export function warehouseAisleGeom() {
  const west = WAREHOUSE_X0 + WAREHOUSE_WALL;
  const r = WAREHOUSE_RACK;
  const wideX0 = west + r;
  const wideX1 = wideX0 + WAREHOUSE_WIDE;
  const narrowX0 = wideX1 + r;
  const narrowX1 = narrowX0 + WAREHOUSE_NARROW;
  const vnaX0 = narrowX1 + r;
  const vnaX1 = vnaX0 + WAREHOUSE_VNA;
  const z0 = WAREHOUSE_Z0 + WAREHOUSE_WALL;
  const z1 = WAREHOUSE_Z1 - WAREHOUSE_WALL;
  return {
    wideX0, wideX1, wideX: (wideX0 + wideX1) / 2,
    narrowX0, narrowX1, narrowX: (narrowX0 + narrowX1) / 2,
    vnaX0, vnaX1, vnaX: (vnaX0 + vnaX1) / 2,
    z0, z1, midZ: (z0 + z1) / 2, aisleD: z1 - z0,
    dockX: (wideX0 + wideX1) / 2,
    oceanZ: WAREHOUSE_Z0 + WAREHOUSE_WALL / 2,
    inlandZ: WAREHOUSE_Z1 - WAREHOUSE_WALL / 2,
    rackBays: [
      [wideX0 - r, wideX0],
      [wideX1, wideX1 + r],
      [narrowX1, narrowX1 + r],
      [vnaX1, vnaX1 + r],
    ],
  };
}

/** Whoop sashes on the inland wall, centred on the narrow + VNA aisles. */
export function warehouseSashXs() {
  const g = warehouseAisleGeom();
  return [g.narrowX, g.vnaX];
}

// ---- house haunt kit (leftover residential; hall + stair well; jambs / leaf) ----
// Vacant residential parcel inland of the cinema, west of GAP 243.
// Leftover house / leftover city — not a street, boardwalk, or path.
// Scatter still uses tryPlace; this reservation is one more keepout, not a
// second placer. Whoop flies the sash / stair; 5″ flies the hall / door.
// Weenie is the stair well. Collider is the jamb / open leaf / stringer —
// never a filled room, hall, or door.
export const HOUSE_X = 166;
export const HOUSE_Z = 132;
export const HOUSE_WALL = 0.16;
export const HOUSE_HALL = 1.00;
export const HOUSE_STAIR = 0.91;
export const HOUSE_ROOM = 2.70;
export const HOUSE_INNER_D = 10.20;
export const HOUSE_W = 2 * HOUSE_WALL + HOUSE_ROOM + HOUSE_STAIR + HOUSE_HALL + HOUSE_ROOM;
export const HOUSE_D = 2 * HOUSE_WALL + HOUSE_INNER_D;
export const HOUSE_STORY = 3.06;
export const HOUSE_H = 6.20;
export const HOUSE_PAD_H = 0.08;
export const HOUSE_ROOF_H = 0.16;
export const HOUSE_SLAB = 0.14;
export const HOUSE_DOOR_W = 0.81;
export const HOUSE_DOOR_H = 1.98;
export const HOUSE_WIN_W = 0.56;
export const HOUSE_WIN_H = 0.66;
export const HOUSE_WIN_SILL = 0.91;
export const HOUSE_LEAF_T = 0.04;
export const HOUSE_STAIR_T = 0.08;
export const HOUSE_STAIR_RISE = 0.18;
export const HOUSE_STAIR_RUN = 0.25;
export const HOUSE_STAIR_TREAD = 0.04;
export const HOUSE_X0 = HOUSE_X - HOUSE_W / 2;
export const HOUSE_X1 = HOUSE_X + HOUSE_W / 2;
export const HOUSE_Z0 = HOUSE_Z - HOUSE_D / 2;
export const HOUSE_Z1 = HOUSE_Z + HOUSE_D / 2;

/**
 * Hall / stair-well / door / leaf. Rooms are leftover voids beside the hall.
 * Never remaps x/z. Scatter stays on tryPlace.
 */
export function housePlanGeom() {
  const west = HOUSE_X0 + HOUSE_WALL;
  const east = HOUSE_X1 - HOUSE_WALL;
  const ocean = HOUSE_Z0 + HOUSE_WALL;
  const inland = HOUSE_Z1 - HOUSE_WALL;
  const westRoomX1 = west + HOUSE_ROOM;
  const stairX0 = westRoomX1;
  const stairX1 = stairX0 + HOUSE_STAIR;
  const hallX0 = stairX1;
  const hallX1 = hallX0 + HOUSE_HALL;
  const hallX = (hallX0 + hallX1) / 2;
  const stairX = (stairX0 + stairX1) / 2;
  const nRise = Math.round(HOUSE_STORY / HOUSE_STAIR_RISE);
  const stairLen = (nRise - 1) * HOUSE_STAIR_RUN;
  const stairZ0 = ocean + 0.45;
  const stairZ1 = stairZ0 + stairLen;
  const stairZ = (stairZ0 + stairZ1) / 2;
  const doorX = hallX;
  const doorZ = HOUSE_Z0 + HOUSE_WALL / 2;
  const winX = hallX;
  const winZ = HOUSE_Z1 - HOUSE_WALL / 2;
  // Open leaf parked 180° against the interior ocean wall, east of the jamb.
  const leafX = doorX + HOUSE_DOOR_W;
  const leafZ = ocean + HOUSE_LEAF_T / 2;
  return {
    west, east, ocean, inland,
    westRoomX1, stairX0, stairX1, stairX,
    hallX0, hallX1, hallX,
    stairZ0, stairZ1, stairZ, stairLen, nRise,
    doorX, doorZ, winX, winZ, leafX, leafZ,
    midZ: (ocean + inland) / 2,
    innerD: inland - ocean,
  };
}

// ---- leftoverLot (leftover-city vacant parcel; not a haunt; not dirt hulls) ----
// Vacant city parcel east of GAP 243 (243+XS_HALF=249.5), west of the
// warehouse keepout (~269.5), same inland band as drop/abando (z=84).
// Desi re-signed the cell. Do not invent or slide x/z. Do not grow the plate.
// Scatter still uses tryPlace; this reservation is one more keepout, not a
// second placer. Not a fifth haunt. Not leftover-dirt hulls. Not OSM.
export const LEFTOVER_LOT_X = 258;
export const LEFTOVER_LOT_Z = 84;
export const LEFTOVER_LOT_W = 14.0;
export const LEFTOVER_LOT_D = 12.0;
export const LEFTOVER_LOT_X0 = 251;
export const LEFTOVER_LOT_X1 = 265;
export const LEFTOVER_LOT_Z0 = 78;
export const LEFTOVER_LOT_Z1 = 90;
// Fence H 1.83 m. Industrial leftover may jitter to 2.13, never under 1.70.
export const LEFTOVER_LOT_FENCE_H = 1.83;
export const LEFTOVER_LOT_FENCE_H_MIN = 1.70;
export const LEFTOVER_LOT_FENCE_H_MAX = 2.13;
export const LEFTOVER_LOT_GATE_W = 3.66;
export const LEFTOVER_LOT_WALK_W = 1.07;
export const LEFTOVER_LOT_WALK_H = 1.83;
export const LEFTOVER_LOT_SHED_DOOR_W = 0.91;
export const LEFTOVER_LOT_SHED_DOOR_H = 2.03;
export const LEFTOVER_LOT_POST = 0.08;
export const LEFTOVER_LOT_MESH_T = 0.04;
export const LEFTOVER_LOT_JAMB = 0.10;
export const LEFTOVER_LOT_WALL = 0.15;

// ---- leftoverLot B (second leftover-city vacant parcel; same schema) ----
// Vacant city parcel east of warehouse RESERVED (WAREHOUSE_X1+1.8 ≈ 286.33),
// west of helipadE (408), same inland band as leftoverLot #34 / drop / abando
// (z=84). 1.7 m gap off the warehouse keepout, same as #34 sat off GAP 243.
// Desi signed the cell. Do not invent or slide x/z. Do not grow the plate.
// Same leftoverLotGeom / leftoverLotColliderShapes / leftoverLotVoids — not
// leftoverLotBGeom, not OSM, not a fifth haunt.
export const LEFTOVER_LOT_B_X = 295;
export const LEFTOVER_LOT_B_Z = 84;
export const LEFTOVER_LOT_B_W = 14.0;
export const LEFTOVER_LOT_B_D = 12.0;
export const LEFTOVER_LOT_B_X0 = 288;
export const LEFTOVER_LOT_B_X1 = 302;
export const LEFTOVER_LOT_B_Z0 = 78;
export const LEFTOVER_LOT_B_Z1 = 90;

// ---- leftoverLot C (third leftover-city vacant parcel; same schema) ----
// Vacant city parcel at signed 313/84, east of leftoverLot B RESERVED
// (B x1 + 1.8 = 303.8), west of helipadE (408), same inland band as
// leftoverLot #34 / #35 / drop / abando (z=84). Desi signed the cell.
// Do not invent or slide x/z.
// Do not grow the plate. Do not slide A (258/84) or B (295/84).
// Same leftoverLotGeom / leftoverLotColliderShapes / leftoverLotVoids — not
// leftoverLotCGeom, not OSM, not a fifth haunt.
export const LEFTOVER_LOT_C_X = 313;
export const LEFTOVER_LOT_C_Z = 84;
export const LEFTOVER_LOT_C_W = 14.0;
export const LEFTOVER_LOT_C_D = 12.0;
export const LEFTOVER_LOT_C_X0 = 306;
export const LEFTOVER_LOT_C_X1 = 320;
export const LEFTOVER_LOT_C_Z0 = 78;
export const LEFTOVER_LOT_C_Z1 = 90;

// ---- leftoverLot D (fourth leftover-city vacant parcel; same schema) ----
// Vacant city parcel at signed 330/84, east of leftoverLot C RESERVED
// (C x1=320 + 1.8 = 321.8; D starts 323, 1.2 m off). West of helipadE
// (408), same inland band as leftoverLot #34 / #35 / C / drop / abando
// (z=84). Desi + Reesy signed the cell. Do not invent or slide x/z.
// Do not grow the plate. Do not slide A (258/84), B (295/84), or C
// (313/84). Same leftoverLotGeom / leftoverLotColliderShapes /
// leftoverLotVoids — not leftoverLotDGeom, not OSM, not a fifth haunt.
export const LEFTOVER_LOT_D_X = 330;
export const LEFTOVER_LOT_D_Z = 84;
export const LEFTOVER_LOT_D_W = 14.0;
export const LEFTOVER_LOT_D_D = 12.0;
export const LEFTOVER_LOT_D_X0 = 323;
export const LEFTOVER_LOT_D_X1 = 337;
export const LEFTOVER_LOT_D_Z0 = 78;
export const LEFTOVER_LOT_D_Z1 = 90;

// ---- gardenPath (Tiny Glade two-abreast walk; not a haunt; not leftoverLot) ----
// Signed 268→284 in x, centre z=84, width 1.6 m (z 83.2–84.8). Desi + Reesy
// signed the cell. Do not invent or slide z. Path sits off leftoverLot A
// x1=265 and leftoverLot B x0=288. Do not slide A (258/84), B (295/84), or
// C (313/84). Scatter still uses tryPlace; this reservation is one more
// keepout, not a second placer. Flagstones 0.5–0.7 m + 60–100 mm grass
// joints so they read at 8–25 m. No 300 mm tiles. Not OSM. No seating.
export const GARDEN_PATH_X0 = 268;
export const GARDEN_PATH_X1 = 284;
export const GARDEN_PATH_Z = 84;
export const GARDEN_PATH_W = 1.6;
export const GARDEN_PATH_Z0 = 83.2;
export const GARDEN_PATH_Z1 = 84.8;
export const GARDEN_PATH_X = 276;
export const GARDEN_PATH_LEN = 16;
export const GARDEN_PATH_SLAB_MIN = 0.5;
export const GARDEN_PATH_SLAB_MAX = 0.7;
export const GARDEN_PATH_JOINT_MIN = 0.06;
export const GARDEN_PATH_JOINT_MAX = 0.10;
export const GARDEN_PATH_SLAB_H = 0.06;
export const GARDEN_PATH_COLLIDER_PAD = 0.15;
export const GARDEN_PATH_HULL_COLLIDER = 'ground';
export const GARDEN_PATH_AABB = false;

// ---- gardenBench (Tiny Glade 3-seat slat; not a haunt; not leftoverLot) ----
// Signed 276 / 82.4. Desi + Reesy signed the cell. Do not invent or slide
// x/z. Never nudge. Sits 0.8 m ocean of garden-path z0=83.2. Path stays
// 268→284 / z=84 / 1.6 m. Do not slide leftoverLot A (258/84), B (295/84),
// or C (313/84). Scatter still uses tryPlace; this reservation is one more
// keepout, not a second placer. 1.8 m is a 3-seat slat. Seat H 0.43–0.46 m,
// depth ~0.45 m, back crown 0.80–0.90 m. Clear under the slats ~0.40 m
// (whoop + 5″ knife). Sit-box is a void (flyable). Never a filled sit AABB.
// Slats 40–50 mm / gaps 10–15 mm so grass can lean at the legs later —
// do not start grow-to-gap grass as a new kit. Collider ⊆ legs + slats +
// back only (±0.15 m). Not OSM. Not a path restack.
export const GARDEN_BENCH_X = 276;
export const GARDEN_BENCH_Z = 82.4;
export const GARDEN_BENCH_W = 1.8;
export const GARDEN_BENCH_DEPTH = 0.45;
export const GARDEN_BENCH_SEAT_H = 0.45;
export const GARDEN_BENCH_BACK_H = 0.85;
export const GARDEN_BENCH_UNDER_CLEAR = 0.40;
export const GARDEN_BENCH_SLAT = 0.045;
export const GARDEN_BENCH_GAP = 0.012;
export const GARDEN_BENCH_LEG = 0.08;
export const GARDEN_BENCH_COLLIDER_PAD = 0.15;
export const GARDEN_BENCH_AABB = false;
export const GARDEN_BENCH_X0 = GARDEN_BENCH_X - GARDEN_BENCH_W / 2;
export const GARDEN_BENCH_X1 = GARDEN_BENCH_X + GARDEN_BENCH_W / 2;
export const GARDEN_BENCH_Z0 = GARDEN_BENCH_Z - GARDEN_BENCH_DEPTH / 2;
export const GARDEN_BENCH_Z1 = GARDEN_BENCH_Z + GARDEN_BENCH_DEPTH / 2;

// ---- park bench (same Tiny Glade 3-seat slat kit; signed 276 / 90) ----
// Desi signed the cell. Do not invent or slide x/z. Never nudge. Same
// gardenBenchGeom / gardenBenchParts — not gardenBenchBGeom, not a slide
// of 276 / 82.4. Yaw faces −Z / south toward the garden path (z=84).
// Path stays 268→284 / z=84 / 1.6 m. leftoverLot A 258/84, B 295/84,
// C 313/84, D 330/84. leftoverGrass stays 267–285 / 81–86. Pocket park
// stays 276/92, 16×8 (268–284 × 88–96). Scatter still uses tryPlace.
export const PARK_BENCH_X = 276;
export const PARK_BENCH_Z = 90;
export const PARK_BENCH_YAW = Math.PI;
export const PARK_BENCH_W = GARDEN_BENCH_W;
export const PARK_BENCH_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_X0 = PARK_BENCH_X - PARK_BENCH_W / 2;
export const PARK_BENCH_X1 = PARK_BENCH_X + PARK_BENCH_W / 2;
export const PARK_BENCH_Z0 = PARK_BENCH_Z - PARK_BENCH_DEPTH / 2;
export const PARK_BENCH_Z1 = PARK_BENCH_Z + PARK_BENCH_DEPTH / 2;

// ---- leftoverGrass (Tiny Glade grow-to-gap; leftover-city hull) ----
// Signed x 267–285 / z 81.0–86.0. Desi + Reesy signed the box. Do not
// invent or slide it. One hull around the path and bench, not OSM, not
// leftover-dirt 190k. Hull ≈ 90 m². Leftover after path+bench ≈ 63 m².
// Path stays 268→284 / z=84 / 1.6 m. leftoverLot A 258/84, B 295/84,
// C 313/84 (A x1=265 and B x0=288 sit just off this hull). Bench stays
// 276 / 82.4. Path's thin joint hull stays. Scatter stays on tryPlace;
// this reservation is one more keepout, not a second placer. Blade H
// 0.12–0.22 m (unmowed St. Augustine) so it reads at 8–25 m. A 50 mm
// lawn disappears — do not ship that. Cell is ~8–12k instances. Lean at
// nearest slab / bench leg / leftoverLot fence. Grow into the path's
// 60–100 mm joints. Collider is the thin grade hull only. Blades are
// visual. A 0.3 m pad AABB fails. Never per-blade colliders.
export const LEFTOVER_GRASS_X0 = 267;
export const LEFTOVER_GRASS_X1 = 285;
export const LEFTOVER_GRASS_Z0 = 81.0;
export const LEFTOVER_GRASS_Z1 = 86.0;
export const LEFTOVER_GRASS_X = 276;
export const LEFTOVER_GRASS_Z = 83.5;
export const LEFTOVER_GRASS_W = 18;
export const LEFTOVER_GRASS_D = 5;
export const LEFTOVER_GRASS_AREA = 90;
export const LEFTOVER_GRASS_LEFTOVER = 63;
export const LEFTOVER_GRASS_H_MIN = 0.12;
export const LEFTOVER_GRASS_H_MAX = 0.22;
export const LEFTOVER_GRASS_LAWN_H = 0.05;
export const LEFTOVER_GRASS_COVER = 12.6;
export const LEFTOVER_GRASS_INSTANCES_MIN = 8000;
export const LEFTOVER_GRASS_INSTANCES_MAX = 12000;
export const LEFTOVER_GRASS_HULL_H = 0.014;
export const LEFTOVER_GRASS_HULL_COLLIDER = 'ground';
export const LEFTOVER_GRASS_PAD_AABB = 0.3;
export const LEFTOVER_GRASS_AABB = false;

// ---- pocketPark (Tiny Glade grow-to-gap; leftover-city plate) ----
// Signed centre 276/92, plate 16×8, bounds x0=268 x1=284 z0=88 z1=96.
// Desi + Reesy signed the cell. Do not invent or slide x/z. One hull
// inland of the garden strip, not OSM, not leftover-dirt 190k, not a
// leftoverLot / path / bench / leftoverGrass restack. Path stays
// 268→284 / z=84 / 1.6 m (z1=84.8). z0=88 sits inland of the path —
// do not slide the hull onto the path. leftoverLot A 258/84, B 295/84,
// C 313/84, D 330/84. Bench stays 276 / 82.4. leftoverGrass stays
// 267–285 / 81–86. Scatter stays on tryPlace; this reservation is one
// more keepout, not a second placer. Blade H 0.12–0.22 m (unmowed
// St. Augustine) so it reads at 8–25 m. A 50 mm lawn disappears — do
// not ship that. Cell is ~10–13k instances. Lean at nearest leftoverLot
// fence or garden path if it reaches. Collider is the thin grade hull
// only. Blades are visual. A 0.3 m pad AABB fails. Never per-blade
// colliders.
export const POCKET_PARK_X0 = 268;
export const POCKET_PARK_X1 = 284;
export const POCKET_PARK_Z0 = 88;
export const POCKET_PARK_Z1 = 96;
export const POCKET_PARK_X = 276;
export const POCKET_PARK_Z = 92;
export const POCKET_PARK_W = 16;
export const POCKET_PARK_D = 8;
export const POCKET_PARK_AREA = 128;
export const POCKET_PARK_H_MIN = 0.12;
export const POCKET_PARK_H_MAX = 0.22;
export const POCKET_PARK_LAWN_H = 0.05;
export const POCKET_PARK_COVER = 10;
export const POCKET_PARK_INSTANCES_MIN = 10000;
export const POCKET_PARK_INSTANCES_MAX = 13000;
export const POCKET_PARK_HULL_H = 0.014;
export const POCKET_PARK_HULL_COLLIDER = 'ground';
export const POCKET_PARK_PAD_AABB = 0.3;
export const POCKET_PARK_AABB = false;

// ---- park pergola (same boardwalk-gate kit; signed 276 / 94) ----
// Desi + Reesy signed the cell. Do not invent or slide x/z. Never nudge.
// Do not leave it at 92. Same boardwalkGateGeom / posts + lintel — not
// pergolaGeom, not parkPergolaGeom, not a slide of GATE_X/GATE_Z.
// Opening height 2.20 m (whoop sash). Fly along +X. Opening is empty
// air — never a filled sash AABB. Collider ⊆ posts + lintel (jamb/lip),
// not the fly-through. Collider ⊆ visual ±0.15 m. 276/94 is 3.7 m
// north of the park-bench back (~90.3). Lawn / park ends z=96. Kit
// half-span must stay under 2 m or it exits the park — drop, never
// slide to 96. If the Z-span kisses the 276/90 bench (back ~90.3),
// drop, never nudge. Pocket park stays 276/92, 16×8 (268–284 × 88–96).
// Park bench stays 276/90. Garden bench stays 276 / 82.4. Path stays
// 268→284 / z=84. leftoverLot A 258/84, B 295/84, C 313/84, D 330/84.
// leftoverGrass stays 267–285 / 81–86. Scatter stays on tryPlace;
// this reservation is one more keepout, not a second placer.
export const PARK_PERGOLA_X = 276;
export const PARK_PERGOLA_Z = 94;
export const PARK_PERGOLA_OPEN_H = GATE_POST_H;
export const PARK_PERGOLA_FLY = '+X';
export const PARK_PERGOLA_HALF_X = GATE_HALF_X;
export const PARK_PERGOLA_HALF_Z = GATE_HALF_Z;
export const PARK_PERGOLA_HALF_MAX = 2;
export const PARK_PERGOLA_POST_R = GATE_POST_R;
export const PARK_PERGOLA_POST_H = GATE_POST_H;
export const PARK_PERGOLA_BEAM_H = GATE_BEAM_H;
export const PARK_PERGOLA_BEAM_W = GATE_BEAM_W;
export const PARK_PERGOLA_W = GATE_HALF_X * 2;
export const PARK_PERGOLA_D = GATE_HALF_Z * 2;
export const PARK_PERGOLA_COLLIDER_PAD = 0.15;
export const PARK_PERGOLA_AABB = false;
export const PARK_PERGOLA_X0 = PARK_PERGOLA_X - PARK_PERGOLA_W / 2;
export const PARK_PERGOLA_X1 = PARK_PERGOLA_X + PARK_PERGOLA_W / 2;
export const PARK_PERGOLA_Z0 = PARK_PERGOLA_Z - PARK_PERGOLA_D / 2;
export const PARK_PERGOLA_Z1 = PARK_PERGOLA_Z + PARK_PERGOLA_D / 2;

/**
 * Boardwalk-gate kit (posts + lintel). Default is GATE_X / GATE_Z on
 * the promenade. Pass (PARK_PERGOLA_X, PARK_PERGOLA_Z) for the park
 * pergola. Same schema — never pergolaGeom / parkPergolaGeom.
 * Never remaps x/z. Scatter stays on tryPlace. Fly along +X.
 * Opening is empty air. Collider is posts + lintel only.
 */
export function boardwalkGateGeom(cx = GATE_X, cz = GATE_Z) {
  const onDeck = Math.abs(cz - BOARDWALK_Z) <= BOARDWALK_D / 2
    && Math.abs(cx) <= BOARDWALK_W / 2;
  const y0 = onDeck ? BOARDWALK_TOP : CITY_Y;
  const halfX = GATE_HALF_X;
  const halfZ = GATE_HALF_Z;
  const postR = GATE_POST_R;
  const postH = GATE_POST_H;
  return {
    x: cx, z: cz, y0,
    halfX, halfZ, postR, postH,
    beamH: GATE_BEAM_H, beamW: GATE_BEAM_W,
    spanX: halfX * 2, spanZ: halfZ * 2,
    x0: cx - halfX, x1: cx + halfX,
    z0: cz - halfZ, z1: cz + halfZ,
    openW: halfZ * 2 - 2 * postR,
    openH: postH,
    fly: '+X',
    tag: 'boardwalk-gate',
  };
}

/**
 * Fence / gate / shed / dumpster on a signed leftover-city plate.
 * Default is leftoverLot #34 (258/84). Pass (LEFTOVER_LOT_B_X,
 * LEFTOVER_LOT_B_Z) for lot B, (LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)
 * for lot C, or (LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z) for lot D.
 * Same schema — never leftoverLotBGeom / leftoverLotCGeom /
 * leftoverLotDGeom.
 * Never remaps x/z. Scatter stays on tryPlace.
 */
export function leftoverLotGeom(cx = LEFTOVER_LOT_X, cz = LEFTOVER_LOT_Z) {
  const x0 = cx - LEFTOVER_LOT_W / 2;
  const x1 = cx + LEFTOVER_LOT_W / 2;
  const z0 = cz - LEFTOVER_LOT_D / 2;
  const z1 = cz + LEFTOVER_LOT_D / 2;
  const y0 = CITY_Y;
  const h = LEFTOVER_LOT_FENCE_H;
  const gateX = cx;
  const gateZ = z0;
  const gateLeft = gateX - LEFTOVER_LOT_GATE_W / 2;
  const gateRight = gateX + LEFTOVER_LOT_GATE_W / 2;
  const walkX = cx + 3.55;
  const walkZ = z1;
  const walkLeft = walkX - LEFTOVER_LOT_WALK_W / 2;
  const walkRight = walkX + LEFTOVER_LOT_WALK_W / 2;
  const shedW = 2.40;
  const shedD = 2.10;
  const shedH = 2.24;
  const shedInset = 0.42 + LEFTOVER_LOT_MESH_T;
  const shedX = x0 + shedInset + shedW / 2;
  const shedZ = z1 - shedInset - shedD / 2;
  const shedDoorX = shedX + shedW / 2;
  const shedDoorZ = shedZ;
  const dumpW = 1.68;
  const dumpD = 0.92;
  const dumpH = 1.12;
  const dumpX = x1 - LEFTOVER_LOT_MESH_T - 0.22 - dumpW / 2;
  const dumpZ = cz + 1.85;
  const postStep = 2.45;
  const meshRuns = [
    { axis: 'x', x0, x1: gateLeft, z: z0 },
    { axis: 'x', x0: gateRight, x1, z: z0 },
    { axis: 'x', x0, x1: walkLeft, z: z1 },
    { axis: 'x', x0: walkRight, x1, z: z1 },
    { axis: 'z', z0, z1, x: x0 },
    { axis: 'z', z0, z1, x: x1 },
  ];
  const rawPosts = [
    { x: x0, z: z0 }, { x: x1, z: z0 }, { x: x0, z: z1 }, { x: x1, z: z1 },
    { x: gateLeft, z: gateZ }, { x: gateRight, z: gateZ },
    { x: walkLeft, z: walkZ }, { x: walkRight, z: walkZ },
  ];
  for (let i = 0; i < meshRuns.length; i++) {
    const run = meshRuns[i];
    if (run.axis === 'x') {
      const span = run.x1 - run.x0;
      const n = Math.max(1, Math.round(span / postStep));
      for (let k = 0; k <= n; k++) {
        rawPosts.push({ x: run.x0 + (span * k) / n, z: run.z });
      }
    } else {
      const span = run.z1 - run.z0;
      const n = Math.max(1, Math.round(span / postStep));
      for (let k = 0; k <= n; k++) {
        rawPosts.push({ x: run.x, z: run.z0 + (span * k) / n });
      }
    }
  }
  const seen = new Set();
  const posts = [];
  for (let i = 0; i < rawPosts.length; i++) {
    const p = rawPosts[i];
    const key = `${p.x.toFixed(3)},${p.z.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    posts.push(p);
  }
  return {
    x0, x1, z0, z1, y0, h,
    gateX, gateZ, gateLeft, gateRight,
    walkX, walkZ, walkLeft, walkRight,
    shedW, shedD, shedH, shedX, shedZ, shedDoorX, shedDoorZ,
    dumpW, dumpD, dumpH, dumpX, dumpZ,
    meshRuns, posts,
  };
}

/** Street-front vehicle gate + secondary walk gate. Empty air. */
function leftoverLotGateAt(g, x, z, margin) {
  const inVehicle = x >= g.gateLeft - margin && x <= g.gateRight + margin
    && Math.abs(z - g.gateZ) <= LEFTOVER_LOT_MESH_T + 0.55 + margin;
  const inWalk = x >= g.walkLeft - margin && x <= g.walkRight + margin
    && Math.abs(z - g.walkZ) <= LEFTOVER_LOT_MESH_T + 0.45 + margin;
  return inVehicle || inWalk;
}

export function inLeftoverLotGate(x, z, margin = 0.15) {
  return leftoverLotGateAt(leftoverLotGeom(), x, z, margin)
    || leftoverLotGateAt(leftoverLotGeom(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z), x, z, margin)
    || leftoverLotGateAt(leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z), x, z, margin)
    || leftoverLotGateAt(leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z), x, z, margin);
}

/**
 * Palms + weeds grow-to-gap inside the lot, lean at the fence.
 * tryPlace-drop off pavement and the gate void. Reject-or-drop, never nudge.
 * Default is leftoverLot #34. Pass leftoverLotGeom(B), leftoverLotGeom(C),
 * or leftoverLotGeom(D).
 */
export function leftoverLotPlantSpots(g = leftoverLotGeom()) {
  const palms = [
    { x: g.x0 + 1.15, z: g.z0 + 3.60, sc: 0.72, lean: 0.18 },
    { x: g.x1 - 1.15, z: g.z1 - 3.40, sc: 0.68, lean: -0.16 },
    { x: g.x0 + 1.20, z: g.z1 - 4.80, sc: 0.64, lean: 0.14 },
  ];
  const weeds = [];
  for (let x = g.x0 + 0.55; x <= g.x1 - 0.55; x += 1.55) {
    for (let z = g.z0 + 0.55; z <= g.z1 - 0.55; z += 1.45) {
      if (onPavement(x, z) || inLeftoverLotGate(x, z, 0.35)) continue;
      if (Math.abs(x - g.shedX) < g.shedW / 2 + 0.22
        && Math.abs(z - g.shedZ) < g.shedD / 2 + 0.22) continue;
      if (Math.abs(x - g.dumpX) < g.dumpW / 2 + 0.16
        && Math.abs(z - g.dumpZ) < g.dumpD / 2 + 0.16) continue;
      const toFence = Math.min(x - g.x0, g.x1 - x, z - g.z0, g.z1 - z);
      let h = Math.imul(Math.round(x * 10), 0x27d4eb2d) ^ Math.imul(Math.round(z * 10), 0x165667b1);
      h = Math.imul(h ^ (h >>> 15), 0x2545f491);
      const u = ((h ^ (h >>> 13)) >>> 0) / 4294967296;
      if (toFence > 2.8 && u > 0.34) continue;
      weeds.push({ x, z, lean: toFence < 1.1 ? 0.22 : 0.04, sc: 0.7 + u * 0.45 });
    }
  }
  return { palms, weeds };
}

function pathHash01(a, b) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

/**
 * Signed Tiny Glade two-abreast walk. Never remaps x/z. Scatter stays on
 * tryPlace. One grass hull at grade; flagstones jitter size + joint only.
 */
export function gardenPathGeom() {
  return {
    x0: GARDEN_PATH_X0, x1: GARDEN_PATH_X1,
    z0: GARDEN_PATH_Z0, z1: GARDEN_PATH_Z1,
    x: GARDEN_PATH_X, z: GARDEN_PATH_Z,
    w: GARDEN_PATH_W, len: GARDEN_PATH_LEN,
    y0: CITY_Y, h: GARDEN_PATH_SLAB_H,
  };
}

/** One grass hull at grade for grow-to-gap joints. Collider is the ground. */
export function gardenPathGrassHull() {
  return {
    tag: 'gardenPath-grass',
    x0: GARDEN_PATH_X0, x1: GARDEN_PATH_X1,
    z0: GARDEN_PATH_Z0, z1: GARDEN_PATH_Z1,
    y0: CITY_Y,
    seed: 0x61,
    collider: GARDEN_PATH_HULL_COLLIDER,
  };
}

/**
 * Two-abreast flagstones. Local jitter on slab size (0.5–0.7 m) and grass
 * joints (60–100 mm). Shared kit, not a second scatterer. No 300 mm tiles.
 */
export function gardenPathSlabs() {
  const slabs = [];
  let col = 0;
  let x = GARDEN_PATH_X0 + GARDEN_PATH_JOINT_MIN;
  const xLimit = GARDEN_PATH_X1 - GARDEN_PATH_JOINT_MIN;
  while (x < xLimit - GARDEN_PATH_SLAB_MIN) {
    const u = pathHash01(col, 17);
    let sx = GARDEN_PATH_SLAB_MIN
      + u * (GARDEN_PATH_SLAB_MAX - GARDEN_PATH_SLAB_MIN);
    if (x + sx > xLimit) {
      sx = xLimit - x;
      if (sx < GARDEN_PATH_SLAB_MIN) break;
      if (sx > GARDEN_PATH_SLAB_MAX) sx = GARDEN_PATH_SLAB_MAX;
    }
    const jointX = GARDEN_PATH_JOINT_MIN
      + pathHash01(col, 41) * (GARDEN_PATH_JOINT_MAX - GARDEN_PATH_JOINT_MIN);
    const jointZ = GARDEN_PATH_JOINT_MIN
      + pathHash01(col, 31) * (GARDEN_PATH_JOINT_MAX - GARDEN_PATH_JOINT_MIN);
    const sz0 = GARDEN_PATH_SLAB_MIN
      + pathHash01(col, 5) * (GARDEN_PATH_SLAB_MAX - GARDEN_PATH_SLAB_MIN);
    const sz1 = GARDEN_PATH_SLAB_MIN
      + pathHash01(col, 7) * (GARDEN_PATH_SLAB_MAX - GARDEN_PATH_SLAB_MIN);
    const pair = sz0 + jointZ + sz1;
    const edge = Math.max(0, (GARDEN_PATH_W - pair) / 2);
    const zSouth0 = GARDEN_PATH_Z0 + edge;
    const zNorth0 = zSouth0 + sz0 + jointZ;
    slabs.push({
      x: x + sx / 2, z: zSouth0 + sz0 / 2, sx, sz: sz0,
      x0: x, x1: x + sx, z0: zSouth0, z1: zSouth0 + sz0,
      row: 0, col,
    });
    slabs.push({
      x: x + sx / 2, z: zNorth0 + sz1 / 2, sx, sz: sz1,
      x0: x, x1: x + sx, z0: zNorth0, z1: zNorth0 + sz1,
      row: 1, col,
    });
    x += sx + jointX;
    col++;
  }
  return slabs;
}

export function inGardenPath(x, z, margin = 0) {
  return x >= GARDEN_PATH_X0 - margin && x <= GARDEN_PATH_X1 + margin
    && z >= GARDEN_PATH_Z0 - margin && z <= GARDEN_PATH_Z1 + margin;
}

export function inGardenPathSlab(x, z, margin = 0) {
  const slabs = gardenPathSlabs();
  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    if (x >= s.x0 - margin && x <= s.x1 + margin
      && z >= s.z0 - margin && z <= s.z1 + margin) return s;
  }
  return null;
}

/**
 * Axis-aligned footprint vs garden-path flagstones. Bench uses this so it
 * cannot kiss a slab. Reject-or-drop, never nudge.
 */
export function gardenPathSlabOverlap(x, z, w, d, margin = 0) {
  const x0 = x - w / 2, x1 = x + w / 2;
  const z0 = z - d / 2, z1 = z + d / 2;
  const slabs = gardenPathSlabs();
  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    const ox = Math.min(x1, s.x1 + margin) - Math.max(x0, s.x0 - margin);
    if (ox <= 0) continue;
    const oz = Math.min(z1, s.z1 + margin) - Math.max(z0, s.z0 - margin);
    if (oz > 0) return s;
  }
  return null;
}

/**
 * Grow-to-gap tufts in the grass joints. tryPlace-drop off pavement,
 * leftoverLot A/B/C reserved, and the flagstone slabs. Reject-or-drop,
 * never nudge. Palms stay off the path.
 */
export function gardenPathPlantSpots() {
  const weeds = [];
  const slabs = gardenPathSlabs();
  const byCol = [];
  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    if (!byCol[s.col]) byCol[s.col] = [];
    byCol[s.col][s.row] = s;
  }
  for (let c = 0; c < byCol.length; c++) {
    const rows = byCol[c];
    if (!rows) continue;
    const a = rows[0], b = rows[1];
    if (a && b) {
      const x = (a.x0 + a.x1) / 2;
      const z = (a.z1 + b.z0) / 2;
      if (!onPavement(x, z) && !inGardenPathSlab(x, z)) {
        weeds.push({ x, z, sc: 0.82, lean: 0.04 });
      }
    }
    const next = byCol[c + 1];
    if (a && next && next[0]) {
      const x = (a.x1 + next[0].x0) / 2;
      const z = a.z;
      if (!onPavement(x, z) && !inGardenPathSlab(x, z)) {
        weeds.push({ x, z, sc: 0.70, lean: 0.03 });
      }
    }
  }
  return { weeds };
}

/**
 * Signed Tiny Glade 3-seat slat. Default is 276 / 82.4. Pass
 * (PARK_BENCH_X, PARK_BENCH_Z) for the park bench. Same schema —
 * never gardenBenchBGeom. Yaw faces the walk at z=84 (−Z when
 * inland of the path). Never remaps x/z. Scatter stays on tryPlace.
 * Sit-box is empty air. Under-slat clear is whoop + 5″ knife.
 */
export function gardenBenchGeom(cx = GARDEN_BENCH_X, cz = GARDEN_BENCH_Z) {
  const w = GARDEN_BENCH_W;
  const depth = GARDEN_BENCH_DEPTH;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - depth / 2;
  const z1 = cz + depth / 2;
  const yaw = cz > GARDEN_PATH_Z ? PARK_BENCH_YAW : 0;
  return {
    x: cx, z: cz, yaw,
    w, depth,
    seatH: GARDEN_BENCH_SEAT_H, backH: GARDEN_BENCH_BACK_H,
    underClear: GARDEN_BENCH_UNDER_CLEAR,
    x0, x1, z0, z1,
    y0: CITY_Y,
    slat: GARDEN_BENCH_SLAT, gap: GARDEN_BENCH_GAP, leg: GARDEN_BENCH_LEG,
  };
}

export function inGardenBench(x, z, margin = 0) {
  const a = gardenBenchGeom();
  const b = gardenBenchGeom(PARK_BENCH_X, PARK_BENCH_Z);
  return (x >= a.x0 - margin && x <= a.x1 + margin
      && z >= a.z0 - margin && z <= a.z1 + margin)
    || (x >= b.x0 - margin && x <= b.x1 + margin
      && z >= b.z0 - margin && z <= b.z1 + margin);
}

/**
 * Legs + seat slats + back slats. Shared kit, not a second scatterer.
 * Rear posts run to the back crown so the sit-box stays a void.
 * Default is 276 / 82.4. Pass (PARK_BENCH_X, PARK_BENCH_Z) for the
 * park bench — never gardenBenchBParts.
 */
export function gardenBenchParts(cx = GARDEN_BENCH_X, cz = GARDEN_BENCH_Z) {
  const g = gardenBenchGeom(cx, cz);
  const slat = g.slat;
  const gap = g.gap;
  const leg = g.leg;
  const y0 = g.y0;
  const xL = g.x0 + leg / 2;
  const xR = g.x1 - leg / 2;
  const faceNegZ = Math.abs(g.yaw) > Math.PI / 2;
  const zFront = faceNegZ ? (g.z0 + leg / 2) : (g.z1 - leg / 2);
  const zBack = faceNegZ ? (g.z1 - leg / 2) : (g.z0 + leg / 2);
  const legs = [
    { id: 'leg-sw', kind: 'leg', x: xL, z: zFront, sx: leg, sz: leg, y0, sy: g.underClear },
    { id: 'leg-se', kind: 'leg', x: xR, z: zFront, sx: leg, sz: leg, y0, sy: g.underClear },
    { id: 'leg-nw', kind: 'leg', x: xL, z: zBack, sx: leg, sz: leg, y0, sy: g.backH },
    { id: 'leg-ne', kind: 'leg', x: xR, z: zBack, sx: leg, sz: leg, y0, sy: g.backH },
  ];
  const slats = [];
  const nSeat = 8;
  const seatSpan = nSeat * slat + (nSeat - 1) * gap;
  const zSeat0 = g.z0 + (g.depth - seatSpan) / 2;
  const seatT = g.seatH - g.underClear;
  for (let i = 0; i < nSeat; i++) {
    slats.push({
      id: `seat-${i}`, kind: 'slat',
      x: g.x, z: zSeat0 + slat / 2 + i * (slat + gap),
      sx: g.w, sz: slat,
      y0: y0 + g.underClear, sy: seatT,
    });
  }
  const backs = [];
  const nBack = 6;
  const backZ = faceNegZ ? (g.z1 - slat / 2) : (g.z0 + slat / 2);
  const backSx = g.w - leg * 2;
  let y = y0 + g.seatH + gap;
  for (let i = 0; i < nBack; i++) {
    backs.push({
      id: `back-${i}`, kind: 'back',
      x: g.x, z: backZ, sx: backSx, sz: slat,
      y0: y, sy: slat,
    });
    y += slat + gap;
  }
  backs.push({
    id: 'back-crown', kind: 'back',
    x: g.x, z: backZ, sx: backSx, sz: slat,
    y0: y0 + g.backH - slat, sy: slat,
  });
  return { g, legs, slats, backs, xL, xR, zFront, zBack };
}

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
  { x0: DROP_X0 - 2.2, x1: DROP_X1 + 1.8,
    z0: DROP_Z0 - 1.5, z1: DROP_Z1 + 1.4, tag: 'drop' },
  { x0: WAREHOUSE_X0 - 2.2, x1: WAREHOUSE_X1 + 1.8,
    z0: WAREHOUSE_Z0 - WAREHOUSE_LEVELER - 1.5, z1: WAREHOUSE_Z1 + 1.4, tag: 'warehouse' },
  { x0: HOUSE_X0 - 2.2, x1: HOUSE_X1 + 1.8,
    z0: HOUSE_Z0 - 1.5, z1: HOUSE_Z1 + 1.4, tag: 'house' },
  { x0: LEFTOVER_LOT_X0 - 2.2, x1: LEFTOVER_LOT_X1 + 1.8,
    z0: LEFTOVER_LOT_Z0 - 1.5, z1: LEFTOVER_LOT_Z1 + 1.4, tag: 'leftoverLot' },
  { x0: LEFTOVER_LOT_B_X0 - 2.2, x1: LEFTOVER_LOT_B_X1 + 1.8,
    z0: LEFTOVER_LOT_B_Z0 - 1.5, z1: LEFTOVER_LOT_B_Z1 + 1.4, tag: 'leftoverLot' },
  { x0: LEFTOVER_LOT_C_X0 - 2.2, x1: LEFTOVER_LOT_C_X1 + 1.8,
    z0: LEFTOVER_LOT_C_Z0 - 1.5, z1: LEFTOVER_LOT_C_Z1 + 1.4, tag: 'leftoverLot' },
  { x0: LEFTOVER_LOT_D_X0 - 2.2, x1: LEFTOVER_LOT_D_X1 + 1.8,
    z0: LEFTOVER_LOT_D_Z0 - 1.5, z1: LEFTOVER_LOT_D_Z1 + 1.4, tag: 'leftoverLot' },
  { x0: GARDEN_PATH_X0 - 2.2, x1: GARDEN_PATH_X1 + 1.8,
    z0: GARDEN_PATH_Z0 - 1.5, z1: GARDEN_PATH_Z1 + 1.4, tag: 'gardenPath' },
  { x0: GARDEN_BENCH_X0 - 2.2, x1: GARDEN_BENCH_X1 + 1.8,
    z0: GARDEN_BENCH_Z0 - 1.5, z1: GARDEN_BENCH_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_X0 - 2.2, x1: PARK_BENCH_X1 + 1.8,
    z0: PARK_BENCH_Z0 - 1.5, z1: PARK_BENCH_Z1 + 1.4, tag: 'gardenBench' },
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

/**
 * True when an axis-aligned footprint overlaps Ocean Drive's carriageway
 * or a GAP_X cross-street column. Used by the skyline cull so a tower
 * whose corner sits in the street is dropped, never nudged. Sidewalks
 * and planting rows are not streets.
 */
export function streetOverlap(x, z, w, d, margin = 0.15) {
  const x0 = x - w / 2, x1 = x + w / 2;
  const z0 = z - d / 2, z1 = z + d / 2;
  const ozRoad = Math.min(z1, ROAD_Z1) - Math.max(z0, ROAD_Z0);
  if (ozRoad > margin && x1 > x0) return true;
  if (z1 <= XS_Z0 || z0 >= XS_Z1) return false;
  const ozXs = Math.min(z1, XS_Z1) - Math.max(z0, XS_Z0);
  if (ozXs <= margin) return false;
  for (let i = 0; i < GAP_X.length; i++) {
    const gx0 = GAP_X[i] - XS_HALF, gx1 = GAP_X[i] + XS_HALF;
    const ox = Math.min(x1, gx1) - Math.max(x0, gx0);
    if (ox > margin) return true;
  }
  return false;
}

/** True when (x,z) sits in leftoverLot A, B, C, or D reserved boxes. */
export function inLeftoverLotReserved(x, z) {
  for (let i = 0; i < RESERVED.length; i++) {
    const r = RESERVED[i];
    if (r.tag !== 'leftoverLot') continue;
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return true;
  }
  return false;
}

/**
 * Axis-aligned footprint vs leftoverLot A/B/C/D reserved only.
 * Garden path uses this so it cannot slide onto a leftover lot.
 */
export function leftoverLotOverlap(x, z, w, d, margin = 0.15) {
  const hw = w / 2, hd = d / 2;
  for (let i = 0; i < RESERVED.length; i++) {
    const r = RESERVED[i];
    if (r.tag !== 'leftoverLot') continue;
    const ox = Math.min(x + hw, r.x1) - Math.max(x - hw, r.x0);
    if (ox <= margin) continue;
    const oz = Math.min(z + hd, r.z1) - Math.max(z - hd, r.z0);
    if (oz > margin) return true;
  }
  return false;
}

/** True when (x,z) sits in the warehouse reserved box. */
export function inWarehouseReserved(x, z) {
  for (let i = 0; i < RESERVED.length; i++) {
    const r = RESERVED[i];
    if (r.tag !== 'warehouse') continue;
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return true;
  }
  return false;
}

/**
 * Axis-aligned footprint vs warehouse reserved only.
 * Pocket park uses this so it cannot slide onto the warehouse.
 */
export function warehouseOverlap(x, z, w, d, margin = 0.15) {
  const hw = w / 2, hd = d / 2;
  for (let i = 0; i < RESERVED.length; i++) {
    const r = RESERVED[i];
    if (r.tag !== 'warehouse') continue;
    const ox = Math.min(x + hw, r.x1) - Math.max(x - hw, r.x0);
    if (ox <= margin) continue;
    const oz = Math.min(z + hd, r.z1) - Math.max(z - hd, r.z0);
    if (oz > margin) return true;
  }
  return false;
}

/**
 * Reject-or-drop for the signed garden path cell. Fail if pavement,
 * streetOverlap, or leftoverLot A/B/C reserved. Never nudges x/z.
 */
export function gardenPathRejected() {
  const g = gardenPathGeom();
  if (onPavement(g.x, g.z) || onPavement(g.x0, g.z) || onPavement(g.x1, g.z)) {
    return true;
  }
  if (streetOverlap(g.x, g.z, g.len, g.w)) return true;
  if (leftoverLotOverlap(g.x, g.z, g.len, g.w, 0.15)) return true;
  if (inLeftoverLotReserved(g.x, g.z)
    || inLeftoverLotReserved(g.x0, g.z)
    || inLeftoverLotReserved(g.x1, g.z)) return true;
  return false;
}

/**
 * Reject-or-drop for a signed Tiny Glade bench cell. Default is 276 / 82.4.
 * Pass (PARK_BENCH_X, PARK_BENCH_Z) for the park bench. Fail if pavement,
 * streetOverlap, leftoverLot A/B/C/D reserved, other reserved (haunts), or
 * a garden-path slab kiss. Path keepout padding is expected (0.8 m ocean
 * of z0=83.2) and is not a fail. Never nudges x/z.
 */
export function gardenBenchRejected(cx = GARDEN_BENCH_X, cz = GARDEN_BENCH_Z) {
  const g = gardenBenchGeom(cx, cz);
  if (onPavement(g.x, g.z) || onPavement(g.x0, g.z) || onPavement(g.x1, g.z)) {
    return true;
  }
  if (streetOverlap(g.x, g.z, g.w, g.depth)) return true;
  if (leftoverLotOverlap(g.x, g.z, g.w, g.depth, 0.15)) return true;
  if (inLeftoverLotReserved(g.x, g.z)
    || inLeftoverLotReserved(g.x0, g.z)
    || inLeftoverLotReserved(g.x1, g.z)) return true;
  if (inGardenPathSlab(g.x, g.z)
    || inGardenPathSlab(g.x0, g.z) || inGardenPathSlab(g.x1, g.z)
    || inGardenPathSlab(g.x, g.z0) || inGardenPathSlab(g.x, g.z1)
    || inGardenPathSlab(g.x0, g.z0) || inGardenPathSlab(g.x1, g.z0)
    || inGardenPathSlab(g.x0, g.z1) || inGardenPathSlab(g.x1, g.z1)) {
    return true;
  }
  if (gardenPathSlabOverlap(g.x, g.z, g.w, g.depth, 0)) return true;
  const hw = g.w / 2, hd = g.depth / 2;
  for (let i = 0; i < RESERVED.length; i++) {
    const r = RESERVED[i];
    if (r.tag === 'gardenPath' || r.tag === 'gardenBench') continue;
    const ox = Math.min(g.x + hw, r.x1) - Math.max(g.x - hw, r.x0);
    if (ox <= 0.15) continue;
    const oz = Math.min(g.z + hd, r.z1) - Math.max(g.z - hd, r.z0);
    if (oz > 0.15) return true;
  }
  return false;
}

/**
 * One leftover-city hull at grade around the path and bench.
 * Signed 267–285 / 81.0–86.0. Collider is the ground / thin grade hull.
 * Never remaps x/z. Scatter stays on tryPlace.
 */
export function leftoverGrassHull() {
  return {
    tag: 'leftoverGrass',
    x0: LEFTOVER_GRASS_X0, x1: LEFTOVER_GRASS_X1,
    z0: LEFTOVER_GRASS_Z0, z1: LEFTOVER_GRASS_Z1,
    x: LEFTOVER_GRASS_X, z: LEFTOVER_GRASS_Z,
    w: LEFTOVER_GRASS_W, d: LEFTOVER_GRASS_D,
    y0: CITY_Y,
    seed: 0x67,
    collider: LEFTOVER_GRASS_HULL_COLLIDER,
  };
}

export function leftoverGrassArea() {
  return (LEFTOVER_GRASS_X1 - LEFTOVER_GRASS_X0)
    * (LEFTOVER_GRASS_Z1 - LEFTOVER_GRASS_Z0);
}

/** Hull minus the signed path rectangle minus the signed bench plate. */
export function leftoverGrassLeftoverArea() {
  return leftoverGrassArea()
    - GARDEN_PATH_LEN * GARDEN_PATH_W
    - GARDEN_BENCH_W * GARDEN_BENCH_DEPTH;
}

export function inLeftoverGrass(x, z, margin = 0) {
  return x >= LEFTOVER_GRASS_X0 - margin && x <= LEFTOVER_GRASS_X1 + margin
    && z >= LEFTOVER_GRASS_Z0 - margin && z <= LEFTOVER_GRASS_Z1 + margin;
}

/**
 * tryPlace-drop on flagstones, leftoverLot A/B/C reserved, the bench
 * plate, and pavement. Reject-or-drop, never nudge. Joints keep.
 */
export function leftoverGrassDrop(x, z) {
  if (onPavement(x, z)) return true;
  if (inLeftoverLotReserved(x, z)) return true;
  if (inGardenBench(x, z)) return true;
  if (inGardenPathSlab(x, z)) return true;
  return false;
}

function distToAabb(x, z, x0, x1, z0, z1) {
  const dx = x < x0 ? x0 - x : (x > x1 ? x - x1 : 0);
  const dz = z < z0 ? z0 - z : (z > z1 ? z - z1 : 0);
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Lean at the nearest flagstone slab, bench leg, or leftoverLot fence
 * (A x1=265, B x0=288 sit just off this hull). Grow-to-gap at joints.
 */
export function leftoverGrassLean(x, z) {
  let d = Math.min(x - LEFTOVER_LOT_X1, LEFTOVER_LOT_B_X0 - x);
  const slabs = gardenPathSlabs();
  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    d = Math.min(d, distToAabb(x, z, s.x0, s.x1, s.z0, s.z1));
  }
  const parts = gardenBenchParts();
  for (let i = 0; i < parts.legs.length; i++) {
    const p = parts.legs[i];
    d = Math.min(d, distToAabb(
      x, z, p.x - p.sx / 2, p.x + p.sx / 2, p.z - p.sz / 2, p.z + p.sz / 2,
    ));
  }
  if (d < 0.35) return 0.22;
  if (d < 1.1) return 0.14;
  return 0.04;
}

/**
 * n = leftover × cover², clamped to 8–12k, then scaled by hull/leftover
 * so the grid still covers the signed box. Not leftover-dirt 3.36 / 190k.
 */
export function leftoverGrassPlannedCount() {
  const raw = Math.round(
    LEFTOVER_GRASS_LEFTOVER * LEFTOVER_GRASS_COVER * LEFTOVER_GRASS_COVER,
  );
  const n = Math.min(
    LEFTOVER_GRASS_INSTANCES_MAX,
    Math.max(LEFTOVER_GRASS_INSTANCES_MIN, raw),
  );
  return Math.round(n * leftoverGrassArea() / LEFTOVER_GRASS_LEFTOVER);
}

/**
 * Reject-or-drop for the signed leftover-city grass hull. Fail if
 * pavement, streetOverlap, or leftoverLot A/B/C reserved. Path and
 * bench live inside this hull by design. Never nudges x/z.
 */
export function leftoverGrassRejected() {
  const g = leftoverGrassHull();
  if (onPavement(g.x, g.z) || onPavement(g.x0, g.z) || onPavement(g.x1, g.z)) {
    return true;
  }
  if (streetOverlap(g.x, g.z, g.w, g.d)) return true;
  if (leftoverLotOverlap(g.x, g.z, g.w, g.d, 0.15)) return true;
  if (inLeftoverLotReserved(g.x, g.z)
    || inLeftoverLotReserved(g.x0, g.z)
    || inLeftoverLotReserved(g.x1, g.z)) return true;
  return false;
}

/**
 * One leftover-city plate at grade inland of the garden strip.
 * Signed 268–284 / 88–96. Collider is the ground / thin grade hull.
 * Never remaps x/z. Scatter stays on tryPlace. z0=88 sits inland of
 * path z1=84.8 — do not slide the hull onto the path.
 */
export function pocketParkHull() {
  return {
    tag: 'pocketPark',
    x0: POCKET_PARK_X0, x1: POCKET_PARK_X1,
    z0: POCKET_PARK_Z0, z1: POCKET_PARK_Z1,
    x: POCKET_PARK_X, z: POCKET_PARK_Z,
    w: POCKET_PARK_W, d: POCKET_PARK_D,
    y0: CITY_Y,
    seed: 0x70,
    collider: POCKET_PARK_HULL_COLLIDER,
  };
}

export function pocketParkArea() {
  return (POCKET_PARK_X1 - POCKET_PARK_X0)
    * (POCKET_PARK_Z1 - POCKET_PARK_Z0);
}

export function inPocketPark(x, z, margin = 0) {
  return x >= POCKET_PARK_X0 - margin && x <= POCKET_PARK_X1 + margin
    && z >= POCKET_PARK_Z0 - margin && z <= POCKET_PARK_Z1 + margin;
}

/**
 * tryPlace-drop on warehouse, leftoverLot A/B/C/D reserved, the garden
 * path, and pavement. Reject-or-drop, never nudge.
 */
export function pocketParkDrop(x, z) {
  if (onPavement(x, z)) return true;
  if (inLeftoverLotReserved(x, z)) return true;
  if (inWarehouseReserved(x, z)) return true;
  if (inGardenPath(x, z)) return true;
  return false;
}

/**
 * Lean at the nearest leftoverLot fence (A/B/C/D) or garden path if
 * it reaches. Hull z0=88 sits inland of path z1=84.8 — do not slide.
 */
export function pocketParkLean(x, z) {
  let d = distToAabb(
    x, z, LEFTOVER_LOT_X0, LEFTOVER_LOT_X1, LEFTOVER_LOT_Z0, LEFTOVER_LOT_Z1,
  );
  d = Math.min(d, distToAabb(
    x, z, LEFTOVER_LOT_B_X0, LEFTOVER_LOT_B_X1, LEFTOVER_LOT_B_Z0, LEFTOVER_LOT_B_Z1,
  ));
  d = Math.min(d, distToAabb(
    x, z, LEFTOVER_LOT_C_X0, LEFTOVER_LOT_C_X1, LEFTOVER_LOT_C_Z0, LEFTOVER_LOT_C_Z1,
  ));
  d = Math.min(d, distToAabb(
    x, z, LEFTOVER_LOT_D_X0, LEFTOVER_LOT_D_X1, LEFTOVER_LOT_D_Z0, LEFTOVER_LOT_D_Z1,
  ));
  d = Math.min(d, distToAabb(
    x, z, GARDEN_PATH_X0, GARDEN_PATH_X1, GARDEN_PATH_Z0, GARDEN_PATH_Z1,
  ));
  if (d < 0.35) return 0.22;
  if (d < 1.1) return 0.14;
  return 0.04;
}

/**
 * n = area × cover², clamped to 10–13k. Not leftover-dirt 3.36 / 190k.
 */
export function pocketParkPlannedCount() {
  const raw = Math.round(
    POCKET_PARK_AREA * POCKET_PARK_COVER * POCKET_PARK_COVER,
  );
  return Math.min(
    POCKET_PARK_INSTANCES_MAX,
    Math.max(POCKET_PARK_INSTANCES_MIN, raw),
  );
}

/**
 * Reject-or-drop for the signed pocket-park plate. Fail if pavement,
 * streetOverlap, leftoverLot A/B/C/D reserved, warehouse reserved, or
 * the garden path. Never nudges x/z.
 */
export function pocketParkRejected() {
  const g = pocketParkHull();
  if (onPavement(g.x, g.z) || onPavement(g.x0, g.z) || onPavement(g.x1, g.z)) {
    return true;
  }
  if (streetOverlap(g.x, g.z, g.w, g.d)) return true;
  if (leftoverLotOverlap(g.x, g.z, g.w, g.d, 0.15)) return true;
  if (inLeftoverLotReserved(g.x, g.z)
    || inLeftoverLotReserved(g.x0, g.z)
    || inLeftoverLotReserved(g.x1, g.z)) return true;
  if (warehouseOverlap(g.x, g.z, g.w, g.d, 0.15)) return true;
  if (inWarehouseReserved(g.x, g.z)
    || inWarehouseReserved(g.x0, g.z)
    || inWarehouseReserved(g.x1, g.z)
    || inWarehouseReserved(g.x, g.z0)
    || inWarehouseReserved(g.x, g.z1)) return true;
  if (inGardenPath(g.x, g.z)
    || inGardenPath(g.x0, g.z) || inGardenPath(g.x1, g.z)
    || inGardenPath(g.x, g.z0) || inGardenPath(g.x, g.z1)
    || inGardenPath(g.x0, g.z0) || inGardenPath(g.x1, g.z0)
    || inGardenPath(g.x0, g.z1) || inGardenPath(g.x1, g.z1)) {
    return true;
  }
  return false;
}

function gateFootprintOverlaps(g, bx, bz, bw, bd, margin) {
  const ox = Math.min(g.x1, bx + bw / 2) - Math.max(g.x0, bx - bw / 2);
  const oz = Math.min(g.z1, bz + bd / 2) - Math.max(g.z0, bz - bd / 2);
  return ox > margin && oz > margin;
}

/**
 * Reject-or-drop for a boardwalk-gate kit cell. Default is the signed
 * park pergola 276 / 94. Fail if pavement, streetOverlap, leftoverLot
 * A/B/C/D reserved, garden path, garden bench 276/82.4, park bench
 * 276/90 (including a kiss of the back at ~90.3), half-span ≥ 2 m
 * (would exit the park at z=96 — drop, never slide), or the plate
 * exits the pocket park. Never nudges x/z.
 */
export function boardwalkGateRejected(cx = PARK_PERGOLA_X, cz = PARK_PERGOLA_Z) {
  const g = boardwalkGateGeom(cx, cz);
  if (g.halfX >= PARK_PERGOLA_HALF_MAX || g.halfZ >= PARK_PERGOLA_HALF_MAX) {
    return true;
  }
  if (g.z1 >= POCKET_PARK_Z1 || g.z0 < POCKET_PARK_Z0
      || g.x0 < POCKET_PARK_X0 || g.x1 > POCKET_PARK_X1) {
    return true;
  }
  if (onPavement(g.x, g.z) || onPavement(g.x0, g.z) || onPavement(g.x1, g.z)
      || onPavement(g.x, g.z0) || onPavement(g.x, g.z1)) {
    return true;
  }
  if (streetOverlap(g.x, g.z, g.spanX, g.spanZ)) return true;
  if (leftoverLotOverlap(g.x, g.z, g.spanX, g.spanZ, 0.15)) return true;
  if (inLeftoverLotReserved(g.x, g.z)
    || inLeftoverLotReserved(g.x0, g.z)
    || inLeftoverLotReserved(g.x1, g.z)) return true;
  if (inGardenPath(g.x, g.z)
    || inGardenPath(g.x0, g.z) || inGardenPath(g.x1, g.z)
    || inGardenPath(g.x, g.z0) || inGardenPath(g.x, g.z1)
    || inGardenPath(g.x0, g.z0) || inGardenPath(g.x1, g.z0)
    || inGardenPath(g.x0, g.z1) || inGardenPath(g.x1, g.z1)
    || gardenPathSlabOverlap(g.x, g.z, g.spanX, g.spanZ, 0)) {
    return true;
  }
  const garden = gardenBenchGeom();
  const park = gardenBenchGeom(PARK_BENCH_X, PARK_BENCH_Z);
  if (gateFootprintOverlaps(g, garden.x, garden.z, garden.w, garden.depth, 0)) {
    return true;
  }
  if (gateFootprintOverlaps(g, park.x, park.z, park.w, park.depth, 0)) {
    return true;
  }
  if (g.z0 <= park.z1) return true;
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
  { x0: DROP_X0 - 2.0, x1: DROP_X1 + 1.6,
    z0: DROP_Z0 - 1.3, z1: DROP_Z1 + 1.2, tag: 'drop' },
  { x0: WAREHOUSE_X0 - 2.0, x1: WAREHOUSE_X1 + 1.6,
    z0: WAREHOUSE_Z0 - WAREHOUSE_LEVELER - 1.3, z1: WAREHOUSE_Z1 + 1.2, tag: 'warehouse' },
  { x0: HOUSE_X0 - 2.0, x1: HOUSE_X1 + 1.6,
    z0: HOUSE_Z0 - 1.3, z1: HOUSE_Z1 + 1.2, tag: 'house' },
  { x0: LEFTOVER_LOT_X0 - 2.0, x1: LEFTOVER_LOT_X1 + 1.6,
    z0: LEFTOVER_LOT_Z0 - 1.3, z1: LEFTOVER_LOT_Z1 + 1.2, tag: 'leftoverLot' },
  { x0: LEFTOVER_LOT_B_X0 - 2.0, x1: LEFTOVER_LOT_B_X1 + 1.6,
    z0: LEFTOVER_LOT_B_Z0 - 1.3, z1: LEFTOVER_LOT_B_Z1 + 1.2, tag: 'leftoverLot' },
  { x0: LEFTOVER_LOT_C_X0 - 2.0, x1: LEFTOVER_LOT_C_X1 + 1.6,
    z0: LEFTOVER_LOT_C_Z0 - 1.3, z1: LEFTOVER_LOT_C_Z1 + 1.2, tag: 'leftoverLot' },
  { x0: LEFTOVER_LOT_D_X0 - 2.0, x1: LEFTOVER_LOT_D_X1 + 1.6,
    z0: LEFTOVER_LOT_D_Z0 - 1.3, z1: LEFTOVER_LOT_D_Z1 + 1.2, tag: 'leftoverLot' },
  { x0: GARDEN_PATH_X0 - 2.0, x1: GARDEN_PATH_X1 + 1.6,
    z0: GARDEN_PATH_Z0 - 1.3, z1: GARDEN_PATH_Z1 + 1.2, tag: 'gardenPath' },
  { x0: GARDEN_BENCH_X0 - 2.0, x1: GARDEN_BENCH_X1 + 1.6,
    z0: GARDEN_BENCH_Z0 - 1.3, z1: GARDEN_BENCH_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_X0 - 2.0, x1: PARK_BENCH_X1 + 1.6,
    z0: PARK_BENCH_Z0 - 1.3, z1: PARK_BENCH_Z1 + 1.2, tag: 'gardenBench' },
  { x0: LEFTOVER_GRASS_X0, x1: LEFTOVER_GRASS_X1,
    z0: LEFTOVER_GRASS_Z0, z1: LEFTOVER_GRASS_Z1, tag: 'leftoverGrass' },
  { x0: POCKET_PARK_X0, x1: POCKET_PARK_X1,
    z0: POCKET_PARK_Z0, z1: POCKET_PARK_Z1, tag: 'pocketPark' },
  { x0: PARK_PERGOLA_X - GATE_HALF_X - 0.8, x1: PARK_PERGOLA_X + GATE_HALF_X + 0.8,
    z0: PARK_PERGOLA_Z - GATE_HALF_Z - 0.8, z1: PARK_PERGOLA_Z + GATE_HALF_Z + 0.8,
    tag: 'boardwalk-gate' },
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
 * Boardwalk-gate reserved void. Opening is empty air. Fly along +X.
 * Same kit at GATE_X/GATE_Z and PARK_PERGOLA_X/PARK_PERGOLA_Z.
 */
export function boardwalkGateVoid(g, id) {
  return {
    id, kind: 'kit',
    x: g.x, z: g.z, y: g.y0 + g.postH * 0.48,
    x0: g.x - g.halfX + g.postR + 0.08,
    x1: g.x + g.halfX - g.postR - 0.08,
    z0: g.z - g.halfZ + g.postR + 0.08,
    z1: g.z + g.halfZ - g.postR - 0.08,
    y0: g.y0 + 0.06, y1: g.y0 + g.postH - 0.04,
    openW: g.openW,
    openH: g.openH,
  };
}

function boardwalkGateColliderShapesAt(shapes, g) {
  for (const dx of [-g.halfX, g.halfX]) {
    for (const dz of [-g.halfZ, g.halfZ]) {
      shapes.push({
        type: 'cyl', tag: 'boardwalk-gate',
        x: g.x + dx, z: g.z + dz, r: g.postR,
        y0: g.y0, h: g.postH,
      });
    }
  }
  const beamY = g.y0 + g.postH;
  for (const dz of [-g.halfZ, g.halfZ]) {
    shapes.push({
      type: 'aabb', tag: 'boardwalk-gate',
      x: g.x, z: g.z + dz, sx: g.spanX + g.beamW, sz: g.beamW,
      y0: beamY, sy: g.beamH,
    });
  }
  for (const dx of [-g.halfX, g.halfX]) {
    shapes.push({
      type: 'aabb', tag: 'boardwalk-gate',
      x: g.x + dx, z: g.z, sx: g.beamW, sz: g.spanZ + g.beamW,
      y0: beamY, sy: g.beamH,
    });
  }
  shapes.push({
    type: 'aabb', tag: 'boardwalk-gate',
    x: g.x, z: g.z, sx: g.spanX + 1.1, sz: g.spanZ + 1.0,
    y0: beamY + g.beamH, sy: 0.12,
  });
}

/**
 * Posts + lintel + lid-on-soffit. Never a box that fills the sash.
 * No-arg covers the promenade gate and the signed park pergola via
 * boardwalkGateGeom. Pass a geom for one kit.
 */
export function boardwalkGateColliderShapes(g) {
  const shapes = [];
  if (!g) {
    boardwalkGateColliderShapesAt(shapes, boardwalkGateGeom());
    const park = boardwalkGateGeom(PARK_PERGOLA_X, PARK_PERGOLA_Z);
    if (!boardwalkGateRejected(park.x, park.z)) {
      boardwalkGateColliderShapesAt(shapes, park);
    }
  } else {
    boardwalkGateColliderShapesAt(shapes, g);
  }
  return shapes;
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
  boardwalkGateVoid(boardwalkGateGeom(), 'boardwalk-gate'),
  boardwalkGateVoid(boardwalkGateGeom(PARK_PERGOLA_X, PARK_PERGOLA_Z), 'park-pergola'),
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
  const shapes = boardwalkGateColliderShapes();

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

/**
 * Drop reserved voids. Collider is the jamb / parapet / well lip —
 * never a box that fills the hoistway, door, or roof hole.
 */
export function dropVoids() {
  const h = dropHoistGeom();
  const roofY = DROP_ROOF_Y;
  return [
    {
      id: 'drop-hoistway', kind: 'hoistway',
      x: h.x, z: h.z, y: CITY_Y + DROP_H * 0.48,
      x0: h.holeX0, x1: h.holeX1, z0: h.holeZ0, z1: h.holeZ1,
      y0: CITY_Y + 0.16, y1: roofY - 0.04,
      openW: DROP_HOIST_W, openH: DROP_HOIST_D, probe: 0.20,
    },
    {
      id: 'drop-well', kind: 'well',
      x: h.x, z: h.z, y: roofY,
      x0: h.holeX0, x1: h.holeX1, z0: h.holeZ0, z1: h.holeZ1,
      y0: roofY - DROP_SLAB - 0.04, y1: roofY + DROP_PENT_H,
      openW: DROP_HOIST_W, openH: DROP_HOIST_D, probe: 0.20,
    },
    {
      id: 'drop-door', kind: 'door',
      x: h.eastX, z: h.z, y: roofY + DROP_DOOR_H * 0.48,
      x0: h.eastX - DROP_WALL, x1: h.eastX + DROP_WALL,
      z0: h.z - DROP_DOOR_W / 2, z1: h.z + DROP_DOOR_W / 2,
      y0: roofY, y1: roofY + DROP_DOOR_H,
      openW: DROP_DOOR_W, openH: DROP_DOOR_H, probe: 0.08,
    },
  ];
}

function pushDropAabb(shapes, x, z, sx, sz, y0, sy) {
  shapes.push({ type: 'aabb', tag: 'drop', x, z, sx, sz, y0, sy });
}

function pushDropCyl(shapes, x, z, r, y0, h) {
  shapes.push({ type: 'cyl', tag: 'drop', x, z, r, y0, h });
}

function dropBand(shapes, x0, x1, z, sz, y0, sy) {
  const w = x1 - x0;
  if (w <= 0.04) return;
  pushDropAabb(shapes, (x0 + x1) / 2, z, w, sz, y0, sy);
}

/** Jamb / parapet / lip shapes. Never a filled well or door. */
export function dropColliderShapes() {
  const shapes = [];
  const h = dropHoistGeom();
  const y0 = CITY_Y;
  const roofY = DROP_ROOF_Y;
  const pt = DROP_PARAPET_T;
  const slabY0 = roofY - DROP_SLAB;

  // Parapet ring — thin bands on the leftover roof edge, not a filled deck.
  dropBand(shapes, DROP_X0, DROP_X1, DROP_Z0 + pt / 2, pt, roofY, DROP_PARAPET);
  dropBand(shapes, DROP_X0, DROP_X1, DROP_Z1 - pt / 2, pt, roofY, DROP_PARAPET);
  pushDropAabb(shapes, DROP_X0 + pt / 2, DROP_Z, pt, DROP_D - 2 * pt, roofY, DROP_PARAPET);
  pushDropAabb(shapes, DROP_X1 - pt / 2, DROP_Z, pt, DROP_D - 2 * pt, roofY, DROP_PARAPET);

  // Roof slab punched around the well. Four leftovers, never a filled lid.
  dropBand(shapes, DROP_X0, DROP_X1, (DROP_Z0 + h.holeZ0) / 2, h.holeZ0 - DROP_Z0, slabY0, DROP_SLAB);
  dropBand(shapes, DROP_X0, DROP_X1, (h.holeZ1 + DROP_Z1) / 2, DROP_Z1 - h.holeZ1, slabY0, DROP_SLAB);
  dropBand(shapes, DROP_X0, h.holeX0, (h.holeZ0 + h.holeZ1) / 2, DROP_HOIST_D, slabY0, DROP_SLAB);
  dropBand(shapes, h.holeX1, DROP_X1, (h.holeZ0 + h.holeZ1) / 2, DROP_HOIST_D, slabY0, DROP_SLAB);

  // Hoistway walls — shaft from grade to penthouse. Interior stays open.
  const shaftH = DROP_H + DROP_PENT_H;
  pushDropAabb(shapes, h.holeX0 - DROP_WALL / 2, h.z, DROP_WALL, DROP_HOIST_D, y0, shaftH);
  pushDropAabb(shapes, h.x, h.holeZ0 - DROP_WALL / 2, DROP_HOIST_W, DROP_WALL, y0, shaftH);
  pushDropAabb(shapes, h.x, h.holeZ1 + DROP_WALL / 2, DROP_HOIST_W, DROP_WALL, y0, shaftH);

  // East wall: solid below the deck; door punched at roof (jambs + lintel).
  pushDropAabb(shapes, h.eastX, h.z, DROP_WALL, DROP_HOIST_D, y0, DROP_H);
  const jamb = (DROP_HOIST_D - DROP_DOOR_W) / 2;
  pushDropAabb(shapes, h.eastX, h.holeZ0 + jamb / 2, DROP_WALL, jamb, roofY, DROP_DOOR_H);
  pushDropAabb(shapes, h.eastX, h.holeZ1 - jamb / 2, DROP_WALL, jamb, roofY, DROP_DOOR_H);
  const lintel = DROP_PENT_H - DROP_DOOR_H;
  if (lintel > 0.04) {
    pushDropAabb(shapes, h.eastX, h.z, DROP_WALL, DROP_HOIST_D, roofY + DROP_DOOR_H, lintel);
  }

  // Well lip at the deck — curb outside the opening.
  const lip = DROP_LIP;
  pushDropAabb(shapes, h.x, h.holeZ0 - lip / 2, DROP_HOIST_W, lip, roofY, lip);
  pushDropAabb(shapes, h.x, h.holeZ1 + lip / 2, DROP_HOIST_W, lip, roofY, lip);
  pushDropAabb(shapes, h.holeX0 - lip / 2, h.z, lip, DROP_HOIST_D, roofY, lip);
  pushDropAabb(shapes, h.holeX1 + lip / 2, h.z, lip, DROP_HOIST_D, roofY, lip);

  // Open-top penthouse rim — weenie crown, not a cap.
  const rimY = roofY + DROP_PENT_H;
  pushDropAabb(shapes, h.x, h.holeZ0 - DROP_WALL / 2, DROP_HOIST_W + DROP_WALL, DROP_WALL, rimY, lip);
  pushDropAabb(shapes, h.x, h.holeZ1 + DROP_WALL / 2, DROP_HOIST_W + DROP_WALL, DROP_WALL, rimY, lip);
  pushDropAabb(shapes, h.holeX0 - DROP_WALL / 2, h.z, DROP_WALL, DROP_HOIST_D, rimY, lip);
  pushDropAabb(shapes, h.holeX1 + DROP_WALL / 2, h.z, DROP_WALL, DROP_HOIST_D, rimY, lip);

  // Corner columns hold the leftover slab. Thin, not a filled volume.
  const inset = 0.42;
  const cols = [
    [DROP_X0 + inset, DROP_Z0 + inset],
    [DROP_X1 - inset, DROP_Z0 + inset],
    [DROP_X0 + inset, DROP_Z1 - inset],
    [DROP_X1 - inset, DROP_Z1 - inset],
  ];
  for (let i = 0; i < cols.length; i++) {
    pushDropCyl(shapes, cols[i][0], cols[i][1], DROP_COL_R, y0, DROP_H);
  }
  return shapes;
}

/** Push drop jamb / lip colliders. Same bag as the fly-through kit. */
export function installDropColliders(addCyl, addCollider) {
  const shapes = dropColliderShapes();
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    if (s.type === 'cyl') addCyl(s.x, s.y0, s.z, s.r, s.h);
    else addCollider(s.x, s.y0, s.z, s.sx, s.sy, s.sz);
  }
}

/**
 * Warehouse reserved voids. Collider is the jamb / rack upright / leveler
 * lip — never a box that fills an aisle, sash, or the dock mouth.
 */
export function warehouseVoids() {
  const g = warehouseAisleGeom();
  const yFly = CITY_Y + 1.55;
  const y0 = CITY_Y + 0.16;
  const y1 = CITY_Y + WAREHOUSE_H - 0.3;
  const aisles = [
    { id: 'warehouse-aisle-wide', kind: 'wide', x: g.wideX, x0: g.wideX0, x1: g.wideX1,
      openW: WAREHOUSE_WIDE, probe: 0.22 },
    { id: 'warehouse-aisle-narrow', kind: 'narrow', x: g.narrowX, x0: g.narrowX0, x1: g.narrowX1,
      openW: WAREHOUSE_NARROW, probe: 0.16 },
    { id: 'warehouse-aisle-vna', kind: 'vna', x: g.vnaX, x0: g.vnaX0, x1: g.vnaX1,
      openW: WAREHOUSE_VNA, probe: 0.08 },
  ];
  const voids = aisles.map((a) => ({
    ...a,
    z: g.midZ, y: yFly,
    z0: g.z0, z1: g.z1, y0, y1,
    openH: WAREHOUSE_H - 0.5,
  }));
  voids.push({
    id: 'warehouse-dock', kind: 'dock',
    x: g.dockX, z: g.oceanZ, y: CITY_Y + WAREHOUSE_DOOR_H * 0.48,
    x0: g.dockX - WAREHOUSE_DOOR_W / 2, x1: g.dockX + WAREHOUSE_DOOR_W / 2,
    z0: WAREHOUSE_Z0 - 0.2, z1: WAREHOUSE_Z0 + WAREHOUSE_WALL + 0.2,
    y0: CITY_Y + 0.08, y1: CITY_Y + WAREHOUSE_DOOR_H,
    openW: WAREHOUSE_DOOR_W, openH: WAREHOUSE_DOOR_H, probe: 0.20,
  });
  const sashXs = warehouseSashXs();
  const ySash = CITY_Y + WAREHOUSE_SASH_SILL + WAREHOUSE_SASH_H * 0.48;
  for (let i = 0; i < sashXs.length; i++) {
    const x = sashXs[i];
    voids.push({
      id: `warehouse-sash-inland-${i}`, kind: 'sash',
      x, z: g.inlandZ, y: ySash,
      x0: x - WAREHOUSE_SASH_W / 2, x1: x + WAREHOUSE_SASH_W / 2,
      z0: WAREHOUSE_Z1 - WAREHOUSE_WALL - 0.15, z1: WAREHOUSE_Z1 + 0.15,
      y0: CITY_Y + WAREHOUSE_SASH_SILL, y1: CITY_Y + WAREHOUSE_SASH_SILL + WAREHOUSE_SASH_H,
      openW: WAREHOUSE_SASH_W, openH: WAREHOUSE_SASH_H, probe: 0.08,
    });
  }
  return voids;
}

function pushWhAabb(shapes, x, z, sx, sz, y0, sy) {
  shapes.push({ type: 'aabb', tag: 'warehouse', x, z, sx, sz, y0, sy });
}

function whBand(shapes, x0, x1, z, sz, y0, sy) {
  const w = x1 - x0;
  if (w <= 0.04) return;
  pushWhAabb(shapes, (x0 + x1) / 2, z, w, sz, y0, sy);
}

/** Jamb / rack / leveler-lip shapes. Never a filled aisle or dock. */
export function warehouseColliderShapes() {
  const shapes = [];
  const g = warehouseAisleGeom();
  const y0 = CITY_Y;
  const yRoof = CITY_Y + WAREHOUSE_H;
  const zs = WAREHOUSE_WALL;

  // Ocean face — dock punched. Jambs + lintel only; mouth stays open.
  const doorLeft = g.dockX - WAREHOUSE_DOOR_W / 2;
  const doorRight = g.dockX + WAREHOUSE_DOOR_W / 2;
  whBand(shapes, WAREHOUSE_X0, doorLeft, g.oceanZ, zs, y0, WAREHOUSE_DOOR_H);
  whBand(shapes, doorRight, WAREHOUSE_X1, g.oceanZ, zs, y0, WAREHOUSE_DOOR_H);
  whBand(shapes, WAREHOUSE_X0, WAREHOUSE_X1, g.oceanZ, zs,
    y0 + WAREHOUSE_DOOR_H, yRoof - (y0 + WAREHOUSE_DOOR_H));

  // Inland face — whoop sashes punched. Sill + jambs + lintel.
  const sashXs = warehouseSashXs();
  const sill = y0 + WAREHOUSE_SASH_SILL;
  const sash1 = sill + WAREHOUSE_SASH_H;
  whBand(shapes, WAREHOUSE_X0, WAREHOUSE_X1, g.inlandZ, zs, y0, WAREHOUSE_SASH_SILL);
  let cursor = WAREHOUSE_X0;
  for (let i = 0; i < sashXs.length; i++) {
    const x = sashXs[i];
    whBand(shapes, cursor, x - WAREHOUSE_SASH_W / 2, g.inlandZ, zs, sill, WAREHOUSE_SASH_H);
    cursor = x + WAREHOUSE_SASH_W / 2;
  }
  whBand(shapes, cursor, WAREHOUSE_X1, g.inlandZ, zs, sill, WAREHOUSE_SASH_H);
  whBand(shapes, WAREHOUSE_X0, WAREHOUSE_X1, g.inlandZ, zs, sash1, yRoof - sash1);

  // Side walls — solid. Aisles run ±Z between the racks, not through these.
  pushWhAabb(shapes, WAREHOUSE_X0 + WAREHOUSE_WALL / 2, WAREHOUSE_Z,
    WAREHOUSE_WALL, WAREHOUSE_D, y0, WAREHOUSE_H);
  pushWhAabb(shapes, WAREHOUSE_X1 - WAREHOUSE_WALL / 2, WAREHOUSE_Z,
    WAREHOUSE_WALL, WAREHOUSE_D, y0, WAREHOUSE_H);

  // Floor pad + roof lid. Neither fills the volume.
  pushWhAabb(shapes, WAREHOUSE_X, WAREHOUSE_Z,
    WAREHOUSE_W + 0.2, WAREHOUSE_D + 0.2, y0, WAREHOUSE_PAD_H);
  pushWhAabb(shapes, WAREHOUSE_X, WAREHOUSE_Z,
    WAREHOUSE_W + 0.16, WAREHOUSE_D + 0.16, yRoof, WAREHOUSE_ROOF_H);

  // Dock leveler — thin apron outside the mouth, not a box in the door.
  pushWhAabb(shapes, g.dockX, WAREHOUSE_Z0 - WAREHOUSE_LEVELER / 2,
    WAREHOUSE_DOOR_W, WAREHOUSE_LEVELER, y0, WAREHOUSE_LEVELER_T);

  // Rack uprights + beam lips. Stay inside the rack bay; aisles stay empty.
  const nPost = 5;
  const beamY0 = [1.35, 2.85, 4.35];
  for (let b = 0; b < g.rackBays.length; b++) {
    const bay = g.rackBays[b];
    const xW = bay[0] + WAREHOUSE_UPRIGHT / 2;
    const xE = bay[1] - WAREHOUSE_UPRIGHT / 2;
    for (let i = 0; i < nPost; i++) {
      const t = nPost === 1 ? 0.5 : i / (nPost - 1);
      const z = g.z0 + 0.45 + t * (g.aisleD - 0.90);
      pushWhAabb(shapes, xW, z, WAREHOUSE_UPRIGHT, WAREHOUSE_UPRIGHT, y0, WAREHOUSE_RACK_H);
      pushWhAabb(shapes, xE, z, WAREHOUSE_UPRIGHT, WAREHOUSE_UPRIGHT, y0, WAREHOUSE_RACK_H);
    }
    const faceW = bay[0] + WAREHOUSE_BEAM / 2;
    const faceE = bay[1] - WAREHOUSE_BEAM / 2;
    for (let k = 0; k < beamY0.length; k++) {
      pushWhAabb(shapes, faceW, g.midZ, WAREHOUSE_BEAM, g.aisleD - 0.35,
        y0 + beamY0[k], WAREHOUSE_BEAM);
      pushWhAabb(shapes, faceE, g.midZ, WAREHOUSE_BEAM, g.aisleD - 0.35,
        y0 + beamY0[k], WAREHOUSE_BEAM);
    }
  }
  return shapes;
}

/** Push warehouse jamb / rack colliders. Same bag as the fly-through kit. */
export function installWarehouseColliders(addCyl, addCollider) {
  void addCyl;
  const shapes = warehouseColliderShapes();
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    addCollider(s.x, s.y0, s.z, s.sx, s.sy, s.sz);
  }
}

/**
 * House reserved voids. Collider is the jamb / open leaf / stringer —
 * never a box that fills a room, hall, stair well, or door.
 */
export function houseVoids() {
  const g = housePlanGeom();
  const y0 = CITY_Y;
  return [
    {
      id: 'house-door', kind: 'door',
      x: g.doorX, z: g.doorZ, y: y0 + HOUSE_DOOR_H * 0.48,
      x0: g.doorX - HOUSE_DOOR_W / 2, x1: g.doorX + HOUSE_DOOR_W / 2,
      z0: HOUSE_Z0 - 0.2, z1: HOUSE_Z0 + HOUSE_WALL + 0.2,
      y0: y0 + 0.04, y1: y0 + HOUSE_DOOR_H,
      openW: HOUSE_DOOR_W, openH: HOUSE_DOOR_H, probe: 0.08,
    },
    {
      id: 'house-hall', kind: 'hall',
      x: g.hallX, z: g.midZ, y: y0 + 1.15,
      x0: g.hallX0, x1: g.hallX1, z0: g.ocean, z1: g.inland,
      y0: y0 + HOUSE_PAD_H + 0.08, y1: y0 + HOUSE_H - 0.3,
      openW: HOUSE_HALL, openH: HOUSE_H - 0.4, probe: 0.12,
    },
    {
      id: 'house-stair', kind: 'stair',
      x: g.stairX, z: g.stairZ, y: y0 + HOUSE_STORY + 1.15,
      x0: g.stairX0, x1: g.stairX1,
      z0: g.stairZ0 + 0.12, z1: g.stairZ1 - 0.12,
      y0: y0 + HOUSE_STORY + 0.08, y1: y0 + HOUSE_H - 0.2,
      openW: HOUSE_STAIR, openH: HOUSE_H - HOUSE_STORY - 0.3, probe: 0.08,
    },
    {
      id: 'house-window', kind: 'window',
      x: g.winX, z: g.winZ, y: y0 + HOUSE_WIN_SILL + HOUSE_WIN_H * 0.48,
      x0: g.winX - HOUSE_WIN_W / 2, x1: g.winX + HOUSE_WIN_W / 2,
      z0: HOUSE_Z1 - HOUSE_WALL - 0.15, z1: HOUSE_Z1 + 0.15,
      y0: y0 + HOUSE_WIN_SILL, y1: y0 + HOUSE_WIN_SILL + HOUSE_WIN_H,
      openW: HOUSE_WIN_W, openH: HOUSE_WIN_H, probe: 0.08,
    },
  ];
}

function pushHouseAabb(shapes, x, z, sx, sz, y0, sy) {
  shapes.push({ type: 'aabb', tag: 'house', x, z, sx, sz, y0, sy });
}

function houseBand(shapes, x0, x1, z, sz, y0, sy) {
  const w = x1 - x0;
  if (w <= 0.04) return;
  pushHouseAabb(shapes, (x0 + x1) / 2, z, w, sz, y0, sy);
}

/** Jamb / open-leaf / stringer shapes. Never a filled room or door. */
export function houseColliderShapes() {
  const shapes = [];
  const g = housePlanGeom();
  const y0 = CITY_Y;
  const yRoof = y0 + HOUSE_H;
  const zs = HOUSE_WALL;

  // Ocean face — egress door punched. Jambs + lintel only; mouth stays open.
  const doorLeft = g.doorX - HOUSE_DOOR_W / 2;
  const doorRight = g.doorX + HOUSE_DOOR_W / 2;
  houseBand(shapes, HOUSE_X0, doorLeft, g.doorZ, zs, y0, HOUSE_DOOR_H);
  houseBand(shapes, doorRight, HOUSE_X1, g.doorZ, zs, y0, HOUSE_DOOR_H);
  houseBand(shapes, HOUSE_X0, HOUSE_X1, g.doorZ, zs,
    y0 + HOUSE_DOOR_H, yRoof - (y0 + HOUSE_DOOR_H));

  // Inland face — whoop egress sash punched. Sill + jambs + lintel.
  const winLeft = g.winX - HOUSE_WIN_W / 2;
  const winRight = g.winX + HOUSE_WIN_W / 2;
  const sill = y0 + HOUSE_WIN_SILL;
  const win1 = sill + HOUSE_WIN_H;
  houseBand(shapes, HOUSE_X0, HOUSE_X1, g.winZ, zs, y0, HOUSE_WIN_SILL);
  houseBand(shapes, HOUSE_X0, winLeft, g.winZ, zs, sill, HOUSE_WIN_H);
  houseBand(shapes, winRight, HOUSE_X1, g.winZ, zs, sill, HOUSE_WIN_H);
  houseBand(shapes, HOUSE_X0, HOUSE_X1, g.winZ, zs, win1, yRoof - win1);

  // Side walls — solid. Hall runs ±Z between the partitions, not through these.
  pushHouseAabb(shapes, HOUSE_X0 + HOUSE_WALL / 2, HOUSE_Z, HOUSE_WALL, HOUSE_D, y0, HOUSE_H);
  pushHouseAabb(shapes, HOUSE_X1 - HOUSE_WALL / 2, HOUSE_Z, HOUSE_WALL, HOUSE_D, y0, HOUSE_H);

  // Floor pad + roof lid. Neither fills the volume.
  pushHouseAabb(shapes, HOUSE_X, HOUSE_Z, HOUSE_W + 0.2, HOUSE_D + 0.2, y0, HOUSE_PAD_H);
  pushHouseAabb(shapes, HOUSE_X, HOUSE_Z, HOUSE_W + 0.16, HOUSE_D + 0.16, yRoof, HOUSE_ROOF_H);

  // Open leaf — parked against the interior ocean wall, east of the jamb.
  pushHouseAabb(shapes, g.leafX, g.leafZ, HOUSE_DOOR_W, HOUSE_LEAF_T, y0, HOUSE_DOOR_H);

  // West partition (room / stair). East partition starts after the leaf.
  pushHouseAabb(shapes, g.stairX0, HOUSE_Z, HOUSE_WALL, HOUSE_D - 2 * HOUSE_WALL, y0, HOUSE_H);
  const eastZ0 = g.ocean + HOUSE_LEAF_T + 0.08;
  const eastD = g.inland - eastZ0;
  pushHouseAabb(shapes, g.hallX1, (eastZ0 + g.inland) / 2, HOUSE_WALL, eastD, y0, HOUSE_H);

  // Stair stringers + thin treads. Well between stringers stays open.
  pushHouseAabb(shapes, g.stairX1, g.stairZ, HOUSE_STAIR_T, g.stairLen + 0.12, y0, HOUSE_H);
  for (let i = 0; i < g.nRise - 1; i++) {
    const tz = g.stairZ0 + i * HOUSE_STAIR_RUN;
    const ty = y0 + i * HOUSE_STAIR_RISE;
    pushHouseAabb(shapes, g.stairX, tz, HOUSE_STAIR - 0.04, HOUSE_STAIR_RUN * 0.72,
      ty, HOUSE_STAIR_TREAD);
  }

  // Second-floor leftover slabs — rooms only. Hall + well stay open.
  const slabY0 = y0 + HOUSE_STORY - HOUSE_SLAB;
  const westCx = (HOUSE_X0 + g.stairX0) / 2;
  const westSx = g.stairX0 - HOUSE_X0;
  pushHouseAabb(shapes, westCx, HOUSE_Z, westSx, HOUSE_D, slabY0, HOUSE_SLAB);
  const eastCx = (g.hallX1 + HOUSE_X1) / 2;
  const eastSx = HOUSE_X1 - g.hallX1;
  pushHouseAabb(shapes, eastCx, HOUSE_Z, eastSx, HOUSE_D, slabY0, HOUSE_SLAB);
  const southD = g.stairZ0 - HOUSE_Z0;
  const northD = HOUSE_Z1 - g.stairZ1;
  if (southD > 0.08) {
    pushHouseAabb(shapes, g.stairX, (HOUSE_Z0 + g.stairZ0) / 2, HOUSE_STAIR, southD,
      slabY0, HOUSE_SLAB);
  }
  if (northD > 0.08) {
    pushHouseAabb(shapes, g.stairX, (g.stairZ1 + HOUSE_Z1) / 2, HOUSE_STAIR, northD,
      slabY0, HOUSE_SLAB);
  }
  return shapes;
}

/** Push house jamb / leaf colliders. Same bag as the fly-through kit. */
export function installHouseColliders(addCyl, addCollider) {
  void addCyl;
  const shapes = houseColliderShapes();
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    addCollider(s.x, s.y0, s.z, s.sx, s.sy, s.sz);
  }
}

/**
 * leftoverLot reserved voids. Collider is the fence post / thin mesh /
 * gate jamb — never a lot-AABB, never a box in the gate.
 * No-arg covers #34, lot B, lot C, and lot D via leftoverLotGeom. Pass a geom for one plate.
 */
function leftoverLotVoidsAt(g) {
  const y0 = CITY_Y;
  return [
    {
      id: 'leftoverLot-gate', kind: 'gate',
      x: g.gateX, z: g.gateZ, y: y0 + g.h * 0.48,
      x0: g.gateLeft, x1: g.gateRight,
      z0: g.gateZ - 0.25, z1: g.gateZ + 0.25,
      y0: y0 + 0.04, y1: y0 + g.h,
      openW: LEFTOVER_LOT_GATE_W, openH: LEFTOVER_LOT_FENCE_H, probe: 0.16,
    },
    {
      id: 'leftoverLot-walk', kind: 'walk',
      x: g.walkX, z: g.walkZ, y: y0 + LEFTOVER_LOT_WALK_H * 0.48,
      x0: g.walkLeft, x1: g.walkRight,
      z0: g.walkZ - 0.22, z1: g.walkZ + 0.22,
      y0: y0 + 0.04, y1: y0 + LEFTOVER_LOT_WALK_H,
      openW: LEFTOVER_LOT_WALK_W, openH: LEFTOVER_LOT_WALK_H, probe: 0.08,
    },
    {
      id: 'leftoverLot-shed-door', kind: 'shed-door',
      x: g.shedDoorX, z: g.shedDoorZ, y: y0 + LEFTOVER_LOT_SHED_DOOR_H * 0.48,
      x0: g.shedDoorX - 0.08, x1: g.shedDoorX + 0.08,
      z0: g.shedDoorZ - LEFTOVER_LOT_SHED_DOOR_W / 2,
      z1: g.shedDoorZ + LEFTOVER_LOT_SHED_DOOR_W / 2,
      y0: y0 + 0.04, y1: y0 + LEFTOVER_LOT_SHED_DOOR_H,
      openW: LEFTOVER_LOT_SHED_DOOR_W, openH: LEFTOVER_LOT_SHED_DOOR_H, probe: 0.08,
    },
  ];
}

export function leftoverLotVoids(g) {
  if (g === undefined) {
    return leftoverLotVoidsAt(leftoverLotGeom())
      .concat(leftoverLotVoidsAt(leftoverLotGeom(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z)))
      .concat(leftoverLotVoidsAt(leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)))
      .concat(leftoverLotVoidsAt(leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z)));
  }
  return leftoverLotVoidsAt(g);
}

function pushLotAabb(shapes, x, z, sx, sz, y0, sy) {
  shapes.push({ type: 'aabb', tag: 'leftoverLot', x, z, sx, sz, y0, sy });
}

function pushLotCyl(shapes, x, z, r, y0, h) {
  shapes.push({ type: 'cyl', tag: 'leftoverLot', x, z, r, y0, h });
}

/** Posts + thin mesh + gate jambs + shed/dumpster. Never a lot-AABB. */
function leftoverLotColliderShapesAt(shapes, g) {
  const y0 = CITY_Y;
  const postR = LEFTOVER_LOT_POST / 2;

  for (let i = 0; i < g.posts.length; i++) {
    const p = g.posts[i];
    pushLotCyl(shapes, p.x, p.z, postR, y0, g.h);
  }

  for (let i = 0; i < g.meshRuns.length; i++) {
    const run = g.meshRuns[i];
    if (run.axis === 'x') {
      const w = run.x1 - run.x0;
      if (w <= 0.04) continue;
      pushLotAabb(shapes, (run.x0 + run.x1) / 2, run.z, w, LEFTOVER_LOT_MESH_T, y0, g.h);
    } else {
      const d = run.z1 - run.z0;
      if (d <= 0.04) continue;
      pushLotAabb(shapes, run.x, (run.z0 + run.z1) / 2, LEFTOVER_LOT_MESH_T, d, y0, g.h);
    }
  }

  // Vehicle-gate jambs + lintel. Opening stays empty air.
  pushLotAabb(shapes, g.gateLeft, g.gateZ, LEFTOVER_LOT_JAMB, LEFTOVER_LOT_JAMB, y0, g.h);
  pushLotAabb(shapes, g.gateRight, g.gateZ, LEFTOVER_LOT_JAMB, LEFTOVER_LOT_JAMB, y0, g.h);
  pushLotAabb(shapes, g.gateX, g.gateZ, LEFTOVER_LOT_GATE_W + LEFTOVER_LOT_JAMB,
    LEFTOVER_LOT_JAMB, y0 + g.h, 0.08);

  // Walk-gate jambs + lintel. Secondary only.
  pushLotAabb(shapes, g.walkLeft, g.walkZ, LEFTOVER_LOT_JAMB, LEFTOVER_LOT_JAMB, y0, LEFTOVER_LOT_WALK_H);
  pushLotAabb(shapes, g.walkRight, g.walkZ, LEFTOVER_LOT_JAMB, LEFTOVER_LOT_JAMB, y0, LEFTOVER_LOT_WALK_H);
  pushLotAabb(shapes, g.walkX, g.walkZ, LEFTOVER_LOT_WALK_W + LEFTOVER_LOT_JAMB,
    LEFTOVER_LOT_JAMB, y0 + LEFTOVER_LOT_WALK_H, 0.08);

  // CMU shed — walls + honest lid. Door jamb only; interior stays open.
  const wt = LEFTOVER_LOT_WALL;
  pushLotAabb(shapes, g.shedX - g.shedW / 2 + wt / 2, g.shedZ, wt, g.shedD, y0, g.shedH);
  pushLotAabb(shapes, g.shedX, g.shedZ + g.shedD / 2 - wt / 2, g.shedW, wt, y0, g.shedH);
  pushLotAabb(shapes, g.shedX, g.shedZ - g.shedD / 2 + wt / 2, g.shedW, wt, y0, g.shedH);
  const doorLeft = g.shedDoorZ - LEFTOVER_LOT_SHED_DOOR_W / 2;
  const doorRight = g.shedDoorZ + LEFTOVER_LOT_SHED_DOOR_W / 2;
  const eastX = g.shedX + g.shedW / 2 - wt / 2;
  const southJamb = doorLeft - (g.shedZ - g.shedD / 2);
  const northJamb = (g.shedZ + g.shedD / 2) - doorRight;
  if (southJamb > 0.04) {
    pushLotAabb(shapes, eastX, g.shedZ - g.shedD / 2 + southJamb / 2, wt, southJamb, y0,
      LEFTOVER_LOT_SHED_DOOR_H);
  }
  if (northJamb > 0.04) {
    pushLotAabb(shapes, eastX, g.shedZ + g.shedD / 2 - northJamb / 2, wt, northJamb, y0,
      LEFTOVER_LOT_SHED_DOOR_H);
  }
  const lintel = g.shedH - LEFTOVER_LOT_SHED_DOOR_H;
  if (lintel > 0.04) {
    pushLotAabb(shapes, eastX, g.shedZ, wt, g.shedD, y0 + LEFTOVER_LOT_SHED_DOOR_H, lintel);
  }
  pushLotAabb(shapes, g.shedX, g.shedZ, g.shedW + 0.10, g.shedD + 0.10, y0 + g.shedH, 0.12);

  // Dumpster — ⊆ dumpster visual, against the east fence, never in the gate.
  pushLotAabb(shapes, g.dumpX, g.dumpZ, g.dumpW - 0.08, g.dumpD - 0.08, y0, g.dumpH);
}

/** Posts + thin mesh + gate jambs + shed/dumpster. Never a lot-AABB.
 *  No-arg covers #34, lot B, lot C, and lot D via leftoverLotGeom. Pass a geom for one plate. */
export function leftoverLotColliderShapes(g) {
  const shapes = [];
  if (g === undefined) {
    leftoverLotColliderShapesAt(shapes, leftoverLotGeom());
    leftoverLotColliderShapesAt(shapes, leftoverLotGeom(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z));
    leftoverLotColliderShapesAt(shapes, leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z));
    leftoverLotColliderShapesAt(shapes, leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z));
  } else {
    leftoverLotColliderShapesAt(shapes, g);
  }
  return shapes;
}

/** Push leftoverLot post / mesh / jamb colliders. Same bag as the haunt kits. */
export function installLeftoverLotColliders(addCyl, addCollider) {
  const shapes = leftoverLotColliderShapes();
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    if (s.type === 'cyl') addCyl(s.x, s.y0, s.z, s.r, s.h);
    else addCollider(s.x, s.y0, s.z, s.sx, s.sy, s.sz);
  }
}

/**
 * Garden-path reserved voids. Collider is ⊆ each flagstone (±0.15 m).
 * Joints + grow-to-gap grass are empty air. Never a filled path AABB.
 */
export function gardenPathVoids() {
  const slabs = gardenPathSlabs();
  const y0 = CITY_Y;
  const voids = [];
  const south = slabs.find((s) => s.col === 0 && s.row === 0);
  const north = slabs.find((s) => s.col === 0 && s.row === 1);
  if (south && north) {
    voids.push({
      id: 'gardenPath-joint-z', kind: 'joint',
      x: south.x, z: (south.z1 + north.z0) / 2, y: y0 + 0.04,
      x0: south.x0, x1: south.x1, z0: south.z1, z1: north.z0,
      y0: y0 + 0.02, y1: y0 + 1.6,
      openW: north.z0 - south.z1, openH: 1.6, probe: 0.02,
    });
  }
  const next = slabs.find((s) => s.col === 1 && s.row === 0);
  if (south && next) {
    voids.push({
      id: 'gardenPath-joint-x', kind: 'joint',
      x: (south.x1 + next.x0) / 2, z: south.z, y: y0 + 0.04,
      x0: south.x1, x1: next.x0, z0: south.z0, z1: south.z1,
      y0: y0 + 0.02, y1: y0 + 1.6,
      openW: next.x0 - south.x1, openH: 1.6, probe: 0.02,
    });
  }
  voids.push({
    id: 'gardenPath-air', kind: 'air',
    x: GARDEN_PATH_X, z: GARDEN_PATH_Z, y: y0 + 1.0,
    x0: GARDEN_PATH_X0, x1: GARDEN_PATH_X1,
    z0: GARDEN_PATH_Z0, z1: GARDEN_PATH_Z1,
    y0: y0 + GARDEN_PATH_SLAB_H + 0.08, y1: y0 + 2.4,
    openW: GARDEN_PATH_W, openH: 2.4, probe: 0.22,
  });
  return voids;
}

function pushPathAabb(shapes, x, z, sx, sz, y0, sy) {
  shapes.push({ type: 'aabb', tag: 'gardenPath', x, z, sx, sz, y0, sy });
}

/**
 * Per-slab colliders only. Inset so each collider is ⊆ its flagstone
 * (±0.15 m). Grass hull / joints have no collider.
 */
export function gardenPathColliderShapes() {
  const shapes = [];
  const slabs = gardenPathSlabs();
  const inset = 0.04;
  const y0 = CITY_Y + 0.012;
  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    const sx = Math.max(0.12, s.sx - 2 * inset);
    const sz = Math.max(0.12, s.sz - 2 * inset);
    pushPathAabb(shapes, s.x, s.z, sx, sz, y0, GARDEN_PATH_SLAB_H - 0.01);
  }
  return shapes;
}

/** Push per-slab colliders. Same bag as the haunt kits. Never a path AABB. */
export function installGardenPathColliders(addCyl, addCollider) {
  void addCyl;
  const shapes = gardenPathColliderShapes();
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    addCollider(s.x, s.y0, s.z, s.sx, s.sy, s.sz);
  }
}

/**
 * Bench reserved voids. Sit-box + under-slat clear are empty air.
 * Whoop + 5″ knife fit under the slats. Never a filled sit AABB.
 */
export function gardenBenchVoids(g) {
  const parts = g ? gardenBenchParts(g.x, g.z) : gardenBenchParts();
  const geom = parts.g;
  const y0 = geom.y0;
  const slat = geom.slat;
  const faceNegZ = Math.abs(geom.yaw) > Math.PI / 2;
  const sitZ = geom.z + (faceNegZ ? -0.05 : 0.05);
  const sitZ0 = faceNegZ ? geom.z0 + 0.05 : geom.z0 + slat + 0.05;
  const sitZ1 = faceNegZ ? geom.z1 - slat - 0.05 : geom.z1 - 0.05;
  const voids = [];
  voids.push({
    id: 'gardenBench-under', kind: 'under',
    x: geom.x, z: geom.z, y: y0 + geom.underClear * 0.5,
    x0: parts.xL + geom.leg / 2 + 0.04, x1: parts.xR - geom.leg / 2 - 0.04,
    z0: geom.z0 + 0.08, z1: geom.z1 - 0.08,
    y0: y0 + 0.02, y1: y0 + geom.underClear - 0.02,
    openW: (parts.xR - parts.xL) - geom.leg, openH: geom.underClear, probe: 0.10,
  });
  voids.push({
    id: 'gardenBench-sit', kind: 'sit',
    x: geom.x, z: sitZ, y: y0 + geom.seatH + (geom.backH - geom.seatH) * 0.42,
    x0: parts.xL + 0.14, x1: parts.xR - 0.14,
    z0: sitZ0, z1: sitZ1,
    y0: y0 + geom.seatH + 0.05, y1: y0 + geom.backH - 0.08,
    openW: geom.w - geom.leg * 2 - 0.20, openH: geom.backH - geom.seatH - 0.13, probe: 0.08,
  });
  return voids;
}

function pushBenchAabb(shapes, part, x, z, sx, sz, y0, sy) {
  shapes.push({ type: 'aabb', tag: 'gardenBench', part, x, z, sx, sz, y0, sy });
}

/**
 * Per-piece colliders only: legs + slats + back. Inset so each collider
 * is ⊆ its mesh (±0.15 m). Sit volume / under-clear have no collider.
 * Never a bench AABB.
 */
export function gardenBenchColliderShapes(g) {
  const shapes = [];
  const parts = g ? gardenBenchParts(g.x, g.z) : gardenBenchParts();
  const inset = 0.02;
  const all = parts.legs.concat(parts.slats, parts.backs);
  for (let i = 0; i < all.length; i++) {
    const p = all[i];
    const sx = Math.max(0.04, p.sx - 2 * inset);
    const sz = Math.max(0.04, p.sz - 2 * inset);
    const sy = Math.max(0.03, p.sy - 0.01);
    pushBenchAabb(shapes, p.kind, p.x, p.z, sx, sz, p.y0, sy);
  }
  return shapes;
}

/** Push leg / slat / back colliders. Never a sit-box, never a bench AABB. */
export function installGardenBenchColliders(addCyl, addCollider) {
  void addCyl;
  const shapes = gardenBenchColliderShapes()
    .concat(gardenBenchColliderShapes(gardenBenchGeom(PARK_BENCH_X, PARK_BENCH_Z)));
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    addCollider(s.x, s.y0, s.z, s.sx, s.sy, s.sz);
  }
}

/**
 * One thin grade hull. Blades are visual. Never a 0.3 m pad AABB.
 * Never per-blade colliders. Collider is the ground hull.
 */
export function leftoverGrassColliderShapes() {
  const h = leftoverGrassHull();
  return [{
    type: 'aabb', tag: 'leftoverGrass', part: 'grade',
    x: h.x, z: h.z, sx: h.w, sz: h.d,
    y0: CITY_Y, sy: LEFTOVER_GRASS_HULL_H,
  }];
}

/** Push the thin grade hull. Same bag as the haunt kits. */
export function installLeftoverGrassColliders(addCyl, addCollider) {
  void addCyl;
  const shapes = leftoverGrassColliderShapes();
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    addCollider(s.x, s.y0, s.z, s.sx, s.sy, s.sz);
  }
}

/**
 * One thin grade hull. Blades are visual. Never a 0.3 m pad AABB.
 * Never per-blade colliders. Collider is the ground hull.
 */
export function pocketParkColliderShapes() {
  const h = pocketParkHull();
  return [{
    type: 'aabb', tag: 'pocketPark', part: 'grade',
    x: h.x, z: h.z, sx: h.w, sz: h.d,
    y0: CITY_Y, sy: POCKET_PARK_HULL_H,
  }];
}

/** Push the thin grade hull. Same bag as the haunt kits. */
export function installPocketParkColliders(addCyl, addCollider) {
  void addCyl;
  const shapes = pocketParkColliderShapes();
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
