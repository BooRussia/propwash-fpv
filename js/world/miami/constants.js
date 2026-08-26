// Shared Miami terrain constants + height profile (mesh + physics).
export const SHORE_Z = -30;      // sand dips under water here
// Extra ocean swimmers. West of the pier piles / near the reef pocket.
// Ocean of travel 40.2–47.8. leftoverLot A–H unmoved. hash01 never at const-eval.
export const WEST_SWIM_X0 = -420;
export const WEST_SWIM_X1 = -168;
export const WEST_SWIM_Z0 = -68;
export const WEST_SWIM_Z1 = -36;
export const REEF_SWIM_X = -114;
export const REEF_SWIM_Z = -118;
export const REEF_SWIM_HALF = 16;
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
export const LUMMUS_PATH_HALF = 2.45;
// Extra benches and drinkers under the pergola. Ocean of travel 40.2–47.8.
// West of leftoverLot A. hash01 never at const-eval.
export const LUMMUS_EXTRA_BENCH_CELLS = Object.freeze([
  [-106, 1], [-90, -1], [-74, 1], [-44, -1],
]);
export const LUMMUS_DRINKER_CELLS = Object.freeze([
  [-115, -1], [-85, 1], [-55, -1], [-35, 1],
]);

// ---- beach volleyball courts ----
export const VBALL_X0 = 128, VBALL_X1 = 208;
export const VBALL_Z0 = 4.0, VBALL_Z1 = 20.0;

// Extra signed beach chairs + umbrellas on the sand (ocean of the boardwalk).
// Skip keepouts at place time. Ocean of travel 40.2–47.8. leftoverLot A–H unmoved.
// hash01 never at const-eval.
export const BEACH_CHAIR_CELLS = Object.freeze([
  [-522.4, 7.5], [-517.6, 10.4],
  [-382.2, 7.0], [-377.8, 9.8],
  [-282.2, 6.2], [-277.8, 9.0],
  [-92.2, 7.4], [-87.8, 10.2],
  [-42.2, 6.0], [-37.8, 8.6],
  [25.8, 6.0], [30.2, 8.8],
]);
export const BEACH_UMBRELLA_CELLS = Object.freeze([
  [-520, 9.0], [-380, 8.4], [-280, 7.6], [-90, 8.8],
  [-40, 7.2], [28, 7.4], [110, 6.8], [220, 8.0],
]);
// Patrol X around each signed chair pair. Ocean of travel 40.2–47.8.
// West of leftoverLot A. hash01 never at const-eval.
export const BEACH_CHAIR_WALK_RUNS = Object.freeze([
  [-528.4, -511.6],
  [-388.2, -371.8],
  [-288.2, -271.8],
  [-98.2, -81.8],
  [-48.2, -31.8],
  [19.8, 36.2],
]);
// Extra beach-walk patrols on the sand (ocean of the boardwalk). Walk +X.
// Miss vball courts (x 128–208). West of leftoverLot A (x>=251) and x=240.
// Ocean of travel 40.2–47.8. hash01 never at const-eval.
export const BEACH_WALK_RUNS = Object.freeze([
  [-540, -400],
  [-360, -250],
  [-170, -110],
  [-20, 110],
  [212, 232],
]);
// Extra boardwalk bike patrol on the deck. West of leftoverLot A and x=240.
// Ocean of travel 40.2–47.8. hash01 never at const-eval.
export const BOARDWALK_BIKE_X0 = -350;
export const BOARDWALK_BIKE_X1 = 230;
// Extra signed benches + bollard lamps on the boardwalk deck. West of leftoverLot A.
// Ocean of travel 40.2–47.8. Skip GAP_X / pier / keepout at place time. hash01 never at const-eval.
export const BOARDWALK_BENCH_CELLS = Object.freeze([
  [-480, 28.4], [-360, 28.4], [-220, 28.4],
  [-60, 28.4], [80, 28.4], [180, 28.4],
]);
export const BOARDWALK_LAMP_CELLS = Object.freeze([
  [-420, 29.6], [-300, 29.6], [-180, 29.6],
  [20, 29.6], [100, 29.6], [200, 29.6],
]);
// Ped-signal extras + flex posts at CROSS_X zebras. Sit on Ocean Drive
// sidewalks / tree lawns, never in travel 40.2–47.8 and never on the
// 37.5–50.5 carriageway. Off the XS cut (XS_HALF+2). West of leftoverLot A.
// hash01 never at const-eval.
export const PED_SIGNAL_CELLS = Object.freeze([
  [-137.5, 34.9], [-120.5, 34.9], [-137.5, 52.9], [-120.5, 52.9],
  [48.5, 34.9], [65.5, 34.9], [48.5, 52.9], [65.5, 52.9],
]);
export const FLEX_POST_CELLS = Object.freeze([
  [-138.2, 36.5], [-119.8, 36.5], [-138.2, 51.5], [-119.8, 51.5],
  [48.2, 36.5], [65.8, 36.5], [48.2, 51.5], [65.8, 51.5],
]);

// ---- MIAMI letter sign ----
export const SIGN_X = 60, SIGN_Z = 14;

// ---- art-deco cinema (Ocean Drive, continues the hotel strip) ----
export const CINEMA_X = 166;
export const CINEMA_FRONT_Z = 57.6;   // same facade plane as the art-deco row
export const CINEMA_W = 46, CINEMA_D = 30;

// ---- Clevelander-style open-air hotel (gap east of deco row) ----
export const CLEVELANDER_X = 60;
export const CLEVELANDER_FRONT_Z = 57.6;
export const CLEVELANDER_W = 22;
export const CLEVELANDER_D = 22;
export const CLEVELANDER_SOFFIT = 3.6;

// ---- Casa Casuarina / Versace mansion (1116 Ocean Drive analogue) ----
export const CASA_X = 90;
export const CASA_FRONT_Z = 57.6;
export const CASA_W = 28;
export const CASA_D = 26;
export const CASA_LOGGIA_D = 3.4;
export const CASA_LOGGIA_H = 3.4;

// ---- Cardozo-style streamline hotel filling the remaining facade gap ----
export const CARDOZO_X = 115;
export const CARDOZO_FRONT_Z = 57.6;
export const CARDOZO_W = 18;
export const CARDOZO_D = 24;

// ---- Colony Hotel analogue (736 Ocean Drive; west of deco row, east of GAP -129) ----
export const COLONY_X = -108;
export const COLONY_FRONT_Z = 57.6;
export const COLONY_W = 20;
export const COLONY_D = 24;
export const COLONY_SOFFIT = 3.5;

// ---- Avalon analogue (700 Ocean Drive; west of Colony / GAP -129) ----
// Porch arcade you can fly under (soffit AVALON_SOFFIT). East of GAP -315.
// New RESERVED west of x=240. Miss travel lanes 40.2–47.8. leftoverLot A–H unmoved.
export const AVALON_X = -152;
export const AVALON_FRONT_Z = 57.6;
export const AVALON_W = 18;
export const AVALON_D = 24;
export const AVALON_SOFFIT = 3.5;

// ---- Majestic analogue (660 Ocean Drive; west of Avalon, east of GAP -315) ----
// Porch arcade you can fly under (soffit MAJESTIC_SOFFIT). New RESERVED west of x=240.
// Miss travel lanes 40.2–47.8. leftoverLot A–H unmoved.
export const MAJESTIC_X = -178;
export const MAJESTIC_FRONT_Z = 57.6;
export const MAJESTIC_W = 16;
export const MAJESTIC_D = 22;
export const MAJESTIC_SOFFIT = 3.5;

// ---- Breakwater analogue (940 Ocean Drive; deco-row / Clevelander gap) ----
export const BREAKWATER_X = 42;
export const BREAKWATER_FRONT_Z = 57.6;
export const BREAKWATER_W = 12;
export const BREAKWATER_D = 22;

// ---- Cavalier analogue (1320 Ocean Drive; Cardozo / cinema gap) ----
// Porch arcade you can fly under (soffit CAVALIER_SOFFIT). West of leftoverLot A.
// Miss travel lanes 40.2–47.8. leftoverLot A–H unmoved.
export const CAVALIER_X = 134;
export const CAVALIER_FRONT_Z = 57.6;
export const CAVALIER_W = 16;
export const CAVALIER_D = 24;
export const CAVALIER_SOFFIT = 3.5;

// ---- Winterhaven analogue (1400 Ocean Drive; garage / GAP 243) ----
// Shallow plate: mass z1 = 75.6, reserved z1 = 76, west of x=240.
// Misses abando reserved z0 ≈ 77.8. Do not slide leftoverLot A–H.
export const WINTERHAVEN_X = 222;
export const WINTERHAVEN_FRONT_Z = 57.6;
export const WINTERHAVEN_W = 16;
export const WINTERHAVEN_D = 18;

// Signed flags on Ocean Drive hotel crowns. [x, z, y] with y on the
// parapet / crown deck. West of leftoverLot A. Inland of travel 40.2–47.8.
// hash01 never at const-eval. Art-deco xs already fly a crown pole — skip.
export const HOTEL_FLAG_CELLS = Object.freeze([
  [-178, 58.8, 15.4],
  [-152, 58.8, 15.4],
  [-108, 58.8, 15.4],
  [42, 58.8, 15.9],
  [60, 58.8, 13.7],
  [90, 62.8, 13.0],
  [115, 59.4, 17.4],
  [134, 58.8, 15.4],
  [222, 58.8, 12.6],
]);

// ---- marina + yacht club ----
export const MARINA_X = 300;
export const MARINA_FINGER_XS = Object.freeze([300, 326, 352]);
export const MARINA_DOCK_HALF_X = 2.2;
export const MARINA_DOCK_Z0 = -100;
export const MARINA_DOCK_Z1 = -10;
export const MARINA_SWIM_X0 = 284;
export const MARINA_SWIM_X1 = 368;
export const MARINA_SWIM_Z0 = -98;
export const MARINA_SWIM_Z1 = -34;
// Ocean-half finger dressing. Signed cells. hash01 never at const-eval.
// East of leftoverLot A (x>=251 z~84) but in the water (z<=-44). Do not
// slide leftoverLot A–H. Not a new RESERVED east of 240 — marina keepout
// already covers the fingers.
export const MARINA_OCEAN_PILE_CELLS = Object.freeze([
  [297.5, -88], [302.5, -88], [297.5, -56], [302.5, -56],
  [323.5, -88], [328.5, -88], [323.5, -56], [328.5, -56],
  [349.5, -88], [354.5, -88], [349.5, -56], [354.5, -56],
]);
export const MARINA_OCEAN_CLEAT_CELLS = Object.freeze([
  [298.35, -82], [301.65, -82], [298.35, -50], [301.65, -50],
  [324.35, -82], [327.65, -82], [324.35, -50], [327.65, -50],
  [350.35, -82], [353.65, -82], [350.35, -50], [353.65, -50],
]);
export const CLUB_X = 313, CLUB_Z = 12;   // between the outer two fingers
export const FUEL_Z = -30;                // fuel dock, out over the water

// ---- Ocean Drive ----
export const ROAD_Z = 44;          // road centre line
export const ROAD_HALF = 6;        // legacy keep-out half (ROAD_Z0–Z1)
export const ROAD_VISUAL_W = 14;   // painted carriageway: 2 park + 2 travel
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
// Extra hash01 palms on remaining beach tree-lawn cells (z=36.5).
// Skip GAP_X / pier. West of leftoverLot A. Ocean of travel 40.2–47.8.
// tryPlace at queue time. hash01 never at const-eval.
export const PALM_BEACH_LAWN_CELLS = Object.freeze([
  [-560, 36.5], [-520, 36.5], [-440, 36.5], [-380, 36.5],
  [-260, 36.5], [-200, 36.5], [-80, 36.5], [-40, 36.5],
  [10, 36.5], [90, 36.5], [130, 36.5], [180, 36.5], [210, 36.5],
]);
export const CROSS_X = [-129, 57];                        // zebra crossings near spawn
export const GAP_X = [-501, -315, -129, 57, 243, 429];    // cross-street columns
export const XS_HALF = 6.5;        // cross-street half width
export const XS_Z0 = 52.9, XS_Z1 = 268;
// City sidewalk in front of Majestic / Avalon / Colony. Walk +X.
// Skip GAP_X=-129. Miss travel 40.2–47.8. leftoverLot A–H unmoved.
export const COLLINS_WALK_Z = (SW_CITY_Z0 + SW_CITY_Z1) / 2;
export const COLLINS_WALK_RUNS = Object.freeze([
  [MAJESTIC_X - MAJESTIC_W / 2, MAJESTIC_X + MAJESTIC_W / 2],
  [AVALON_X - AVALON_W / 2, AVALON_X + AVALON_W / 2],
  [COLONY_X - COLONY_W / 2, COLONY_X + COLONY_W / 2],
]);

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
// Signed pier-deck dressing. On the planks, ocean of travel 40.2–47.8.
// Miss pavilion (PAVILION_Z=-138). West of leftoverLot A. hash01 never at const-eval.
export const PIER_CLEAT_CELLS = Object.freeze([
  [-155.4, -18], [-144.6, -18],
  [-155.4, -48], [-144.6, -48],
  [-155.4, -78], [-144.6, -78],
  [-155.4, -108], [-144.6, -108],
]);
export const PIER_BENCH_CELLS = Object.freeze([
  [-150, -28],
  [-150, -64],
  [-150, -96],
]);
export const PIER_RING_CELLS = Object.freeze([
  [-155.35, -22],
  [-144.65, -22],
  [-155.35, -88],
  [-144.65, -88],
]);

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
// Extra boardwalk whoops. Not park pergolas. Not GATE_X=92.
// Keep off GAP_X columns (esp. 243) and leftoverLot A–H (x>=251).
export const PROMENADE_ARCH_XS = Object.freeze([-80, -20, 40, 160, 220]);
// Sidewalk arcades: whoop soffit over the Ocean Drive slabs, fly +X.
// Posts sit on the walk edges (halfZ 0.90). Not hotel arcades, not GATE_X.
// Keep off GAP_X columns, travel lanes 40.2–47.8, leftoverLot A–H (x>=251).
export const SW_ARCADE_HALF_X = GATE_HALF_X;
export const SW_ARCADE_HALF_Z = 0.90;
export const SW_ARCADE_POST_R = GATE_POST_R;
export const SW_ARCADE_POST_H = 3.20;
export const SW_ARCADE_BEAM_H = 0.24;
export const SW_ARCADE_BEAM_W = 0.28;
export const SW_ARCADE_CITY_Z = (SW_CITY_Z0 + SW_CITY_Z1) / 2;
export const SW_ARCADE_BEACH_Z = (SW_BEACH_Z0 + SW_BEACH_Z1) / 2;
export const SW_ARCADE_CITY_XS = Object.freeze([-340, -210, -90, 18, 110, 178]);
export const SW_ARCADE_BEACH_XS = Object.freeze([-60, 80]);
// Alley pipe gantries: U of steel, fly +X. Inland leftover city, west of x=240.
// Not leftoverLot A–H. Not a cross-street column. Collider is the pipe, not the bay.
export const ALLEY_PIPE_POST_R = 0.10;
export const ALLEY_PIPE_POST_H = 2.40;
export const ALLEY_PIPE_HALF_Z = 1.20;
export const ALLEY_PIPE_BEAM_R = 0.09;
export const ALLEY_PIPE_CELLS = Object.freeze([
  [-220, 108],
  [-80, 102],
  [78, 102],
  [155, 108],
  // Inland service alleys between six-sided mid-rise pairs (z 237/259).
  // Fly +X. West of x=240. Miss leftoverLot A–H, GAP_X, travel lanes.
  [-430, 248],
  [-250, 248],
  [-80, 248],
  [100, 248],
  // Service alleys between z=210 fill and the 237 skyline row. Fly +X.
  [-600, 223],
  [-430, 223],
  [-250, 223],
  [-80, 223],
  [100, 223],
]);
// Park rings: standing torus whoops in Lummus (ocean of the pergola walk).
// Fly +X. Tube is the collider; disc stays empty. West of x=240.
export const PARK_RING_R = 1.15;
export const PARK_RING_TUBE = 0.08;
export const PARK_RING_Y0 = 1.20;
export const PARK_RING_SEGS = 12;
export const PARK_RING_CELLS = Object.freeze([
  [-105, 14.6],
  [-75, 14.6],
  [-45, 14.6],
]);
// Lifeguard stands on the sand (same six as beachProps). Deck sitters use
// these cells. Extra sand sitters + whoop rings skip the x=420 stand
// (east of x=240 / leftoverLot A). hash01 never at const-eval.
export const LIFEGUARD_CELLS = Object.freeze([
  [-520, 12.5], [-335, 11.0], [-95, 12.0], [45, 10.5], [235, 13.0], [420, 12.0],
]);
export const LIFEGUARD_DECK = 2.52;
// Two sitters on the sand at each west-of-240 stand. Miss ring keepouts,
// lummus, leftoverLot, travel 40.2–47.8. Not on the x=420 stand.
export const LIFEGUARD_SAND_SIT_CELLS = Object.freeze([
  [-523.0, 13.2], [-517.0, 13.4],
  [-338.0, 11.7], [-332.0, 11.9],
  [-98.0, 12.7], [-92.2, 11.2],
  [42.0, 11.2], [48.0, 11.4],
  [232.0, 13.7], [238.2, 12.4],
]);
// Extra whoop rings on the five west-of-240 stands. Fly +X. Tube is the
// collider; disc stays empty. Offset from the hut AABB / ramp / drums.
// Miss lummus, park rings, leftoverLot A–H, travel, x>=240.
export const LIFEGUARD_RING_R = PARK_RING_R;
export const LIFEGUARD_RING_TUBE = PARK_RING_TUBE;
export const LIFEGUARD_RING_Y0 = PARK_RING_Y0;
export const LIFEGUARD_RING_SEGS = PARK_RING_SEGS;
export const LIFEGUARD_RING_CELLS = Object.freeze([
  [-520, 16.2],
  [-335, 14.8],
  [-90.4, 12.0],
  [45, 14.2],
  [235, 16.6],
]);
// Extra pier undercroft bays (existing pylons) plus timber rings.
// Bays 2 and 7 sit seaward of 1 and 6. Fly ±Z along the pier.
// Not a slide of leftoverLot A–H. Pylon count stays 10.
export const PIER_EXTRA_BAY_IS = Object.freeze([1, 2, 6, 7]);
export const PIER_BAY_RING_R = 1.15;
export const PIER_BAY_RING_TUBE = 0.08;
export const PIER_BAY_RING_Y = 0.95;
// Parking-garage mouth facing Ocean Drive: 5" through-aisle (fly along ±Z).
export const GARAGE_X = 200;
export const GARAGE_FRONT_Z = 56.20;
export const GARAGE_W = 15.2;
export const GARAGE_D = 13.6;
export const GARAGE_WALL_H = 4.40;
export const GARAGE_AISLE_W = 6.40;  // clear between inner jambs
export const GARAGE_SOFFIT = 3.60;
export const GARAGE_ROOF_H = 0.28;

// ---- 5th-street analogue (GAP_X=57): inland storefronts + fly-unders ----
// Facades face the cross-street column. Arcade fly ±Z along the walk;
// mid-block passage fly ±X through the plate. Not leftoverLot A–H.
// New RESERVED west of x=240. Miss Clevelander z1=86, Casa z1=90,
// Drop, Convention x1=16, alley pipe 78/102, travel lanes 40.2–47.8.
export const FIFTH_X = 57;
export const FIFTH_SOFFIT = 3.40;
export const FIFTH_ARCADE_D = 3.20;
export const FIFTH_PASS_W = 2.20;
export const FIFTH_PASS_H = 3.20;
export const FIFTH_D = 12.0;
export const FIFTH_H = 8.40;
export const FIFTH_JAMB = 0.28;
export const FIFTH_W_FRONT_X = FIFTH_X - XS_HALF - 2.4;
export const FIFTH_E_FRONT_X = FIFTH_X + XS_HALF + 2.4;
export const FIFTH_W_CELLS = Object.freeze([[114, 16], [136, 16], [158, 16]]);
export const FIFTH_E_CELLS = Object.freeze([[95, 8], [114, 16], [136, 16], [158, 16]]);

/** One 5th-street shop. side 'W' faces +X; 'E' faces −X. Never remaps x/z. */
export function fifthShopGeom(side, z, len, id) {
  const frontX = side === 'W' ? FIFTH_W_FRONT_X : FIFTH_E_FRONT_X;
  const inward = side === 'W' ? -1 : 1;
  const xBack = frontX + inward * FIFTH_D;
  const xArcadeInner = frontX + inward * FIFTH_ARCADE_D;
  const x0 = Math.min(frontX, xBack);
  const x1 = Math.max(frontX, xBack);
  const x = (x0 + x1) / 2;
  const arcadeX = (frontX + xArcadeInner) / 2;
  const z0 = z - len / 2;
  const z1 = z + len / 2;
  const passZ0 = z - FIFTH_PASS_W / 2;
  const passZ1 = z + FIFTH_PASS_W / 2;
  const jamb = FIFTH_JAMB;
  return {
    id, side, z, len, x, frontX, inward, xBack, xArcadeInner, x0, x1,
    z0, z1, arcadeX, passZ0, passZ1,
    openArcadeW: len - 2.4, openArcadeH: FIFTH_SOFFIT,
    openPassW: FIFTH_PASS_W, openPassH: FIFTH_PASS_H,
    jamb, tag: 'fifth',
  };
}

export function fifthShops() {
  const shops = [];
  for (let i = 0; i < FIFTH_W_CELLS.length; i++) {
    const [z, len] = FIFTH_W_CELLS[i];
    shops.push(fifthShopGeom('W', z, len, `fifth-w-${i}`));
  }
  for (let i = 0; i < FIFTH_E_CELLS.length; i++) {
    const [z, len] = FIFTH_E_CELLS[i];
    shops.push(fifthShopGeom('E', z, len, `fifth-e-${i}`));
  }
  return shops;
}

export function fifthArcadeVoid(g) {
  const xLo = Math.min(g.frontX, g.xArcadeInner);
  const xHi = Math.max(g.frontX, g.xArcadeInner);
  return {
    id: `${g.id}-arcade`, kind: 'kit',
    x: g.arcadeX, z: g.z, y: CITY_Y + FIFTH_SOFFIT * 0.48,
    x0: xLo + 0.12, x1: xHi - 0.12,
    z0: g.z0 + 1.2, z1: g.z1 - 1.2,
    y0: CITY_Y + 0.08, y1: CITY_Y + FIFTH_SOFFIT - 0.06,
    openW: g.openArcadeW, openH: g.openArcadeH,
  };
}

export function fifthPassVoid(g) {
  return {
    id: `${g.id}-pass`, kind: 'kit',
    x: g.x, z: g.z, y: CITY_Y + FIFTH_PASS_H * 0.48,
    x0: g.x0 + 0.10, x1: g.x1 - 0.10,
    z0: g.passZ0 + 0.06, z1: g.passZ1 - 0.06,
    y0: CITY_Y + 0.08, y1: CITY_Y + FIFTH_PASS_H - 0.06,
    openW: g.openPassW, openH: g.openPassH,
  };
}

// ---- Espanola Way analogue (GAP_X=243): inland storefronts + fly-unders ----
// East past cinema (x=166) toward marina (x=300) / leftover city.
// West face only — east face would restack leftoverLot A (x0=251 z~84).
// New RESERVED west of x=240. Miss winterhaven z1=76, abando z1≈90,
// cinema x1=208, garage, house, warehouse, leftoverLot A–H, travel lanes.
export const ESPA_X = 243;
export const ESPA_SOFFIT = 3.40;
export const ESPA_ARCADE_D = 3.20;
export const ESPA_PASS_W = 2.20;
export const ESPA_PASS_H = 3.20;
export const ESPA_D = 12.0;
export const ESPA_H = 8.40;
export const ESPA_JAMB = 0.28;
export const ESPA_W_FRONT_X = ESPA_X - XS_HALF - 2.4;
export const ESPA_W_CELLS = Object.freeze([[114, 16], [136, 16], [158, 16]]);

/** One Espanola shop. side 'W' faces +X. Never remaps x/z. No east face. */
export function espaShopGeom(side, z, len, id) {
  const frontX = ESPA_W_FRONT_X;
  const inward = -1;
  const xBack = frontX + inward * ESPA_D;
  const xArcadeInner = frontX + inward * ESPA_ARCADE_D;
  const x0 = Math.min(frontX, xBack);
  const x1 = Math.max(frontX, xBack);
  const x = (x0 + x1) / 2;
  const arcadeX = (frontX + xArcadeInner) / 2;
  const z0 = z - len / 2;
  const z1 = z + len / 2;
  const passZ0 = z - ESPA_PASS_W / 2;
  const passZ1 = z + ESPA_PASS_W / 2;
  const jamb = ESPA_JAMB;
  return {
    id, side, z, len, x, frontX, inward, xBack, xArcadeInner, x0, x1,
    z0, z1, arcadeX, passZ0, passZ1,
    openArcadeW: len - 2.4, openArcadeH: ESPA_SOFFIT,
    openPassW: ESPA_PASS_W, openPassH: ESPA_PASS_H,
    jamb, tag: 'espa',
  };
}

export function espaShops() {
  const shops = [];
  for (let i = 0; i < ESPA_W_CELLS.length; i++) {
    const [z, len] = ESPA_W_CELLS[i];
    shops.push(espaShopGeom('W', z, len, `espa-w-${i}`));
  }
  return shops;
}

export function espaArcadeVoid(g) {
  const xLo = Math.min(g.frontX, g.xArcadeInner);
  const xHi = Math.max(g.frontX, g.xArcadeInner);
  return {
    id: `${g.id}-arcade`, kind: 'kit',
    x: g.arcadeX, z: g.z, y: CITY_Y + ESPA_SOFFIT * 0.48,
    x0: xLo + 0.12, x1: xHi - 0.12,
    z0: g.z0 + 1.2, z1: g.z1 - 1.2,
    y0: CITY_Y + 0.08, y1: CITY_Y + ESPA_SOFFIT - 0.06,
    openW: g.openArcadeW, openH: g.openArcadeH,
  };
}

export function espaPassVoid(g) {
  return {
    id: `${g.id}-pass`, kind: 'kit',
    x: g.x, z: g.z, y: CITY_Y + ESPA_PASS_H * 0.48,
    x0: g.x0 + 0.10, x1: g.x1 - 0.10,
    z0: g.passZ0 + 0.06, z1: g.passZ1 - 0.06,
    y0: CITY_Y + 0.08, y1: CITY_Y + ESPA_PASS_H - 0.06,
    openW: g.openPassW, openH: g.openPassH,
  };
}

// ---- 8th-street analogue (GAP_X=-129): inland storefronts + fly-unders ----
// Facades face the cross-street column. Arcade fly ±Z along the walk;
// mid-block passage fly ±X through the plate. Both faces west of leftoverLot A
// (x>=251) and west of x=240. East face skips convention x0=-112 z 104–166
// and colony z1=86; both faces skip Washington z 173–187. Inland z=210 sits
// ocean of mid-rise z=237. Travel lanes 40.2–47.8 stay empty. hash01 never
// drawn. Collider is jamb / soffit, never a filled sash.
export const EIGHTH_X = -129;
export const EIGHTH_SOFFIT = 3.40;
export const EIGHTH_ARCADE_D = 3.20;
export const EIGHTH_PASS_W = 2.20;
export const EIGHTH_PASS_H = 3.20;
export const EIGHTH_D = 12.0;
export const EIGHTH_H = 8.40;
export const EIGHTH_JAMB = 0.28;
export const EIGHTH_W_FRONT_X = EIGHTH_X - XS_HALF - 2.4;
export const EIGHTH_E_FRONT_X = EIGHTH_X + XS_HALF + 2.4;
export const EIGHTH_W_CELLS = Object.freeze([
  [114, 16], [136, 16], [158, 16], [210, 16],
]);
export const EIGHTH_E_CELLS = Object.freeze([
  [95, 8], [210, 16],
]);

/** One 8th-street shop. side 'W' faces +X; 'E' faces −X. Never remaps x/z. */
export function eighthShopGeom(side, z, len, id) {
  const frontX = side === 'W' ? EIGHTH_W_FRONT_X : EIGHTH_E_FRONT_X;
  const inward = side === 'W' ? -1 : 1;
  const xBack = frontX + inward * EIGHTH_D;
  const xArcadeInner = frontX + inward * EIGHTH_ARCADE_D;
  const x0 = Math.min(frontX, xBack);
  const x1 = Math.max(frontX, xBack);
  const x = (x0 + x1) / 2;
  const arcadeX = (frontX + xArcadeInner) / 2;
  const z0 = z - len / 2;
  const z1 = z + len / 2;
  const passZ0 = z - EIGHTH_PASS_W / 2;
  const passZ1 = z + EIGHTH_PASS_W / 2;
  const jamb = EIGHTH_JAMB;
  return {
    id, side, z, len, x, frontX, inward, xBack, xArcadeInner, x0, x1,
    z0, z1, arcadeX, passZ0, passZ1,
    openArcadeW: len - 2.4, openArcadeH: EIGHTH_SOFFIT,
    openPassW: EIGHTH_PASS_W, openPassH: EIGHTH_PASS_H,
    jamb, tag: 'eighth',
  };
}

export function eighthShops() {
  const shops = [];
  for (let i = 0; i < EIGHTH_W_CELLS.length; i++) {
    const [z, len] = EIGHTH_W_CELLS[i];
    shops.push(eighthShopGeom('W', z, len, `eighth-w-${i}`));
  }
  for (let i = 0; i < EIGHTH_E_CELLS.length; i++) {
    const [z, len] = EIGHTH_E_CELLS[i];
    shops.push(eighthShopGeom('E', z, len, `eighth-e-${i}`));
  }
  return shops;
}

export function eighthArcadeVoid(g) {
  const xLo = Math.min(g.frontX, g.xArcadeInner);
  const xHi = Math.max(g.frontX, g.xArcadeInner);
  return {
    id: `${g.id}-arcade`, kind: 'kit',
    x: g.arcadeX, z: g.z, y: CITY_Y + EIGHTH_SOFFIT * 0.48,
    x0: xLo + 0.12, x1: xHi - 0.12,
    z0: g.z0 + 1.2, z1: g.z1 - 1.2,
    y0: CITY_Y + 0.08, y1: CITY_Y + EIGHTH_SOFFIT - 0.06,
    openW: g.openArcadeW, openH: g.openArcadeH,
  };
}

export function eighthPassVoid(g) {
  return {
    id: `${g.id}-pass`, kind: 'kit',
    x: g.x, z: g.z, y: CITY_Y + EIGHTH_PASS_H * 0.48,
    x0: g.x0 + 0.10, x1: g.x1 - 0.10,
    z0: g.passZ0 + 0.06, z1: g.passZ1 - 0.06,
    y0: CITY_Y + 0.08, y1: CITY_Y + EIGHTH_PASS_H - 0.06,
    openW: g.openPassW, openH: g.openPassH,
  };
}

// ---- GAP_X=-315 inland storefronts + fly-unders ----
// Facades face the cross-street column. Arcade fly ±Z along the walk;
// mid-block passage fly ±X through the plate. Both faces west of leftoverLot A
// (x>=251) and west of x=240. Both faces skip Washington z 173–187. Inland
// z=210 sits ocean of mid-rise z=237 (mid-rises are at x=-430/-250, not here).
// East face has the short z=95 bay (no convention / Majestic in this column).
// Travel lanes 40.2–47.8 stay empty. hash01 never drawn. Collider is jamb /
// soffit, never a filled sash. New RESERVED west of x=240.
export const GAP315_X = -315;
export const GAP315_SOFFIT = 3.40;
export const GAP315_ARCADE_D = 3.20;
export const GAP315_PASS_W = 2.20;
export const GAP315_PASS_H = 3.20;
export const GAP315_D = 12.0;
export const GAP315_H = 8.40;
export const GAP315_JAMB = 0.28;
export const GAP315_W_FRONT_X = GAP315_X - XS_HALF - 2.4;
export const GAP315_E_FRONT_X = GAP315_X + XS_HALF + 2.4;
export const GAP315_W_CELLS = Object.freeze([
  [114, 16], [136, 16], [158, 16], [210, 16],
]);
export const GAP315_E_CELLS = Object.freeze([
  [95, 8], [114, 16], [136, 16], [158, 16], [210, 16],
]);

/** One GAP_X=-315 shop. side 'W' faces +X; 'E' faces −X. Never remaps x/z. */
export function gap315ShopGeom(side, z, len, id) {
  const frontX = side === 'W' ? GAP315_W_FRONT_X : GAP315_E_FRONT_X;
  const inward = side === 'W' ? -1 : 1;
  const xBack = frontX + inward * GAP315_D;
  const xArcadeInner = frontX + inward * GAP315_ARCADE_D;
  const x0 = Math.min(frontX, xBack);
  const x1 = Math.max(frontX, xBack);
  const x = (x0 + x1) / 2;
  const arcadeX = (frontX + xArcadeInner) / 2;
  const z0 = z - len / 2;
  const z1 = z + len / 2;
  const passZ0 = z - GAP315_PASS_W / 2;
  const passZ1 = z + GAP315_PASS_W / 2;
  const jamb = GAP315_JAMB;
  return {
    id, side, z, len, x, frontX, inward, xBack, xArcadeInner, x0, x1,
    z0, z1, arcadeX, passZ0, passZ1,
    openArcadeW: len - 2.4, openArcadeH: GAP315_SOFFIT,
    openPassW: GAP315_PASS_W, openPassH: GAP315_PASS_H,
    jamb, tag: 'gap315',
  };
}

export function gap315Shops() {
  const shops = [];
  for (let i = 0; i < GAP315_W_CELLS.length; i++) {
    const [z, len] = GAP315_W_CELLS[i];
    shops.push(gap315ShopGeom('W', z, len, `gap315-w-${i}`));
  }
  for (let i = 0; i < GAP315_E_CELLS.length; i++) {
    const [z, len] = GAP315_E_CELLS[i];
    shops.push(gap315ShopGeom('E', z, len, `gap315-e-${i}`));
  }
  return shops;
}

export function gap315ArcadeVoid(g) {
  const xLo = Math.min(g.frontX, g.xArcadeInner);
  const xHi = Math.max(g.frontX, g.xArcadeInner);
  return {
    id: `${g.id}-arcade`, kind: 'kit',
    x: g.arcadeX, z: g.z, y: CITY_Y + GAP315_SOFFIT * 0.48,
    x0: xLo + 0.12, x1: xHi - 0.12,
    z0: g.z0 + 1.2, z1: g.z1 - 1.2,
    y0: CITY_Y + 0.08, y1: CITY_Y + GAP315_SOFFIT - 0.06,
    openW: g.openArcadeW, openH: g.openArcadeH,
  };
}

export function gap315PassVoid(g) {
  return {
    id: `${g.id}-pass`, kind: 'kit',
    x: g.x, z: g.z, y: CITY_Y + GAP315_PASS_H * 0.48,
    x0: g.x0 + 0.10, x1: g.x1 - 0.10,
    z0: g.passZ0 + 0.06, z1: g.passZ1 - 0.06,
    y0: CITY_Y + 0.08, y1: CITY_Y + GAP315_PASS_H - 0.06,
    openW: g.openPassW, openH: g.openPassH,
  };
}

// ---- GAP_X=-501 inland storefronts + fly-unders ----
// Facades face the cross-street column. Arcade fly ±Z along the walk;
// mid-block passage fly ±X through the plate. Both faces west of leftoverLot A
// (x>=251) and west of x=240. Both faces skip Washington z 173–187. Inland
// z=210 sits ocean of mid-rise z=237 (mid-rises are at x=-430, not here).
// East face has the short z=95 bay (helipad W is at x -452..-408, not this
// column). Travel lanes 40.2–47.8 stay empty. hash01 never drawn. Collider
// is jamb / soffit, never a filled sash. New RESERVED west of x=240.
export const GAP501_X = -501;
export const GAP501_SOFFIT = 3.40;
export const GAP501_ARCADE_D = 3.20;
export const GAP501_PASS_W = 2.20;
export const GAP501_PASS_H = 3.20;
export const GAP501_D = 12.0;
export const GAP501_H = 8.40;
export const GAP501_JAMB = 0.28;
export const GAP501_W_FRONT_X = GAP501_X - XS_HALF - 2.4;
export const GAP501_E_FRONT_X = GAP501_X + XS_HALF + 2.4;
export const GAP501_W_CELLS = Object.freeze([
  [114, 16], [136, 16], [158, 16], [210, 16],
]);
export const GAP501_E_CELLS = Object.freeze([
  [95, 8], [114, 16], [136, 16], [158, 16], [210, 16],
]);

/** One GAP_X=-501 shop. side 'W' faces +X; 'E' faces −X. Never remaps x/z. */
export function gap501ShopGeom(side, z, len, id) {
  const frontX = side === 'W' ? GAP501_W_FRONT_X : GAP501_E_FRONT_X;
  const inward = side === 'W' ? -1 : 1;
  const xBack = frontX + inward * GAP501_D;
  const xArcadeInner = frontX + inward * GAP501_ARCADE_D;
  const x0 = Math.min(frontX, xBack);
  const x1 = Math.max(frontX, xBack);
  const x = (x0 + x1) / 2;
  const arcadeX = (frontX + xArcadeInner) / 2;
  const z0 = z - len / 2;
  const z1 = z + len / 2;
  const passZ0 = z - GAP501_PASS_W / 2;
  const passZ1 = z + GAP501_PASS_W / 2;
  const jamb = GAP501_JAMB;
  return {
    id, side, z, len, x, frontX, inward, xBack, xArcadeInner, x0, x1,
    z0, z1, arcadeX, passZ0, passZ1,
    openArcadeW: len - 2.4, openArcadeH: GAP501_SOFFIT,
    openPassW: GAP501_PASS_W, openPassH: GAP501_PASS_H,
    jamb, tag: 'gap501',
  };
}

export function gap501Shops() {
  const shops = [];
  for (let i = 0; i < GAP501_W_CELLS.length; i++) {
    const [z, len] = GAP501_W_CELLS[i];
    shops.push(gap501ShopGeom('W', z, len, `gap501-w-${i}`));
  }
  for (let i = 0; i < GAP501_E_CELLS.length; i++) {
    const [z, len] = GAP501_E_CELLS[i];
    shops.push(gap501ShopGeom('E', z, len, `gap501-e-${i}`));
  }
  return shops;
}

export function gap501ArcadeVoid(g) {
  const xLo = Math.min(g.frontX, g.xArcadeInner);
  const xHi = Math.max(g.frontX, g.xArcadeInner);
  return {
    id: `${g.id}-arcade`, kind: 'kit',
    x: g.arcadeX, z: g.z, y: CITY_Y + GAP501_SOFFIT * 0.48,
    x0: xLo + 0.12, x1: xHi - 0.12,
    z0: g.z0 + 1.2, z1: g.z1 - 1.2,
    y0: CITY_Y + 0.08, y1: CITY_Y + GAP501_SOFFIT - 0.06,
    openW: g.openArcadeW, openH: g.openArcadeH,
  };
}

export function gap501PassVoid(g) {
  return {
    id: `${g.id}-pass`, kind: 'kit',
    x: g.x, z: g.z, y: CITY_Y + GAP501_PASS_H * 0.48,
    x0: g.x0 + 0.10, x1: g.x1 - 0.10,
    z0: g.passZ0 + 0.06, z1: g.passZ1 - 0.06,
    y0: CITY_Y + 0.08, y1: CITY_Y + GAP501_PASS_H - 0.06,
    openW: g.openPassW, openH: g.openPassH,
  };
}

// ---- GAP_X=429 inland storefronts — skipped ----
// West front = 429 − XS_HALF − 2.4 = 420.1, east of leftoverLot A (x>=251)
// and east of the x=240 RESERVED line. East face is further east (437.9).
// Espanola (GAP 243) could keep its west face because frontX=234.1 < 240;
// this column cannot. Both faces stay empty. leftoverLot A–H unmoved.
export const GAP429_X = 429;
export const GAP429_W_FRONT_X = GAP429_X - XS_HALF - 2.4;
export const GAP429_E_FRONT_X = GAP429_X + XS_HALF + 2.4;
export const GAP429_W_CELLS = Object.freeze([]);
export const GAP429_E_CELLS = Object.freeze([]);

export function gap429Shops() {
  return [];
}

// ---- inland six-sided mid-rises (hash01; no layout rng) ----
// Ocean of the 60-box backdrop (z 300), inland of the back tower row
// (z~185). Paired on X so a 8 m E–W service alley sits at z=248 with
// an alley-pipe whoop (fly +X). West of x=240. Miss GAP_X, leftoverLot
// A–H, convention z1=166, helipad W (x -452..-408, z1=128), travel
// lanes 40.2–47.8. West pair at x=-600 is west of x=-430 and misses
// helipad W on both axes. New RESERVED west of x=240. Do not slide
// leftoverLot A–H.
export const INLAND_MIDRISE_W = 18;
export const INLAND_MIDRISE_D = 14;
export const INLAND_MIDRISE_H = 32;
export const INLAND_MIDRISE_CELLS = Object.freeze([
  [-600, 237], [-600, 259],
  [-430, 237], [-430, 259],
  [-250, 237], [-250, 259],
  [-80, 237], [-80, 259],
  [100, 237], [100, 259],
  // Dense fill: Lincoln–Washington band (z=152) and Washington–skyline (z=210).
  // Miss convention (-112..16, z 104–166), GAP_X columns, helipad W, leftoverLot A–H.
  [-600, 152], [-540, 152], [-430, 152], [-390, 152], [-250, 152], [-190, 152],
  [90, 152], [160, 152], [210, 152],
  [-600, 210], [-540, 210], [-430, 210], [-390, 210], [-250, 210], [-190, 210],
  [-80, 210], [90, 210], [160, 210], [210, 210],
]);

/** One inland mid-rise plate. Never remaps x/z. hash01 only at build. */
export function inlandMidriseGeom(x, z, id) {
  const w = INLAND_MIDRISE_W, d = INLAND_MIDRISE_D, h = INLAND_MIDRISE_H;
  return {
    id, x, z, w, d, h,
    x0: x - w / 2, x1: x + w / 2,
    z0: z - d / 2, z1: z + d / 2,
    tag: 'inland-midrise',
  };
}

export function inlandMidrises() {
  const out = [];
  for (let i = 0; i < INLAND_MIDRISE_CELLS.length; i++) {
    const [x, z] = INLAND_MIDRISE_CELLS[i];
    out.push(inlandMidriseGeom(x, z, `inland-midrise-${i}`));
  }
  return out;
}

// Courtyard drop-wells: open air through the plate. Fly −Y. Jambs are the
// four wall masses, never a box in the well. Extra pair on remaining z=152/210
// plates that miss roof-AC whoops. leftoverLot A–H unmoved.
export const COURT_WELL_W = 6.2;
export const COURT_WELL_D = 6.2;
export const COURT_WELL_CELLS = Object.freeze([
  [-250, 152], [90, 152], [-430, 210], [160, 210], [-600, 210],
  [-390, 152], [210, 210],
]);

export function isCourtWellCell(x, z) {
  for (let i = 0; i < COURT_WELL_CELLS.length; i++) {
    if (COURT_WELL_CELLS[i][0] === x && COURT_WELL_CELLS[i][1] === z) return true;
  }
  return false;
}

export function courtWellGeom(x, z, id) {
  const w = COURT_WELL_W, d = COURT_WELL_D, h = INLAND_MIDRISE_H;
  const y0 = CITY_Y;
  return {
    id, x, z, w, d, h, y0,
    x0: x - w / 2, x1: x + w / 2,
    z0: z - d / 2, z1: z + d / 2,
    y1: y0 + h,
    openW: w - 0.4, openH: h,
    fly: '-Y', tag: 'court-well',
  };
}

export function courtWellVoid(g) {
  return {
    id: g.id, kind: 'kit',
    x: g.x, z: g.z, y: g.y0 + g.h * 0.48,
    x0: g.x0 + 0.12, x1: g.x1 - 0.12,
    z0: g.z0 + 0.12, z1: g.z1 - 0.12,
    y0: g.y0 + 0.08, y1: g.y1 + 0.2,
    openW: g.openW, openH: g.openH,
  };
}

export function courtWellColliderShapesAt(shapes, g) {
  const plate = inlandMidriseGeom(g.x, g.z, g.id);
  const sideW = (plate.w - g.w) / 2;
  const frontD = (plate.d - g.d) / 2;
  const y0 = CITY_Y, h = plate.h;
  shapes.push({
    type: 'aabb', tag: 'court-well',
    x: g.x - (g.w / 2 + sideW / 2), z: g.z,
    sx: sideW, sz: plate.d, y0, sy: h,
  });
  shapes.push({
    type: 'aabb', tag: 'court-well',
    x: g.x + (g.w / 2 + sideW / 2), z: g.z,
    sx: sideW, sz: plate.d, y0, sy: h,
  });
  shapes.push({
    type: 'aabb', tag: 'court-well',
    x: g.x, z: g.z - (g.d / 2 + frontD / 2),
    sx: g.w, sz: frontD, y0, sy: h,
  });
  shapes.push({
    type: 'aabb', tag: 'court-well',
    x: g.x, z: g.z + (g.d / 2 + frontD / 2),
    sx: g.w, sz: frontD, y0, sy: h,
  });
}

// Ground-floor fly-through arcades on z=210 and z=152 mid-rises. Jambs + soffit
// only, never a box in the bay. Fly ±Z. Miss court wells. West of x=240.
// leftoverLot A–H unmoved. hash01 never at const-eval.
export const INLAND_ARCADE_SOFFIT = 3.40;
export const INLAND_ARCADE_OPEN_W = 4.40;
export const INLAND_ARCADE_CELLS = Object.freeze([
  [-540, 210], [-250, 210], [-80, 210], [90, 210],
  [-600, 152], [-430, 152], [-190, 152], [160, 152],
]);

export function isInlandArcadeCell(x, z) {
  for (let i = 0; i < INLAND_ARCADE_CELLS.length; i++) {
    if (INLAND_ARCADE_CELLS[i][0] === x && INLAND_ARCADE_CELLS[i][1] === z) return true;
  }
  return false;
}

export function inlandArcadeGeom(x, z, id) {
  const plate = inlandMidriseGeom(x, z, id);
  const soffit = INLAND_ARCADE_SOFFIT;
  const openW = INLAND_ARCADE_OPEN_W;
  const jambW = (plate.w - openW) / 2;
  return {
    id, x, z,
    w: plate.w, d: plate.d, h: plate.h,
    x0: x - openW / 2, x1: x + openW / 2,
    z0: plate.z0, z1: plate.z1,
    y0: CITY_Y, y1: CITY_Y + soffit,
    soffit, openW, openH: soffit, jambW,
    fly: '±Z', tag: 'inland-arcade',
  };
}

export function inlandArcadeVoid(g) {
  return {
    id: g.id, kind: 'kit',
    x: g.x, z: g.z, y: g.y0 + g.soffit * 0.48,
    x0: g.x0 + 0.12, x1: g.x1 - 0.12,
    z0: g.z0 + 0.08, z1: g.z1 - 0.08,
    y0: g.y0 + 0.08, y1: g.y1 - 0.06,
    openW: g.openW - 0.4, openH: g.openH,
  };
}

export function inlandArcadeColliderShapesAt(shapes, g) {
  const plate = inlandMidriseGeom(g.x, g.z, g.id);
  const jambW = g.jambW;
  const soffit = g.soffit;
  shapes.push({
    type: 'aabb', tag: 'inland-arcade',
    x: g.x - (g.openW / 2 + jambW / 2), z: g.z,
    sx: jambW, sz: plate.d, y0: CITY_Y, sy: soffit,
  });
  shapes.push({
    type: 'aabb', tag: 'inland-arcade',
    x: g.x + (g.openW / 2 + jambW / 2), z: g.z,
    sx: jambW, sz: plate.d, y0: CITY_Y, sy: soffit,
  });
  shapes.push({
    type: 'aabb', tag: 'inland-arcade',
    x: g.x, z: g.z,
    sx: plate.w, sz: plate.d, y0: CITY_Y + soffit, sy: plate.h - soffit,
  });
}

// ---- rooftop whoops (signed AC gaps + billboard rings; hash01 never at const-eval) ----
// Sit on inland mid-rise plates west of x=240. Fly +X through the gap / disc.
// Collider is the unit / tube, never a filled sash. leftoverLot A–H unmoved.
export const ROOF_WHOOP_Y = CITY_Y + INLAND_MIDRISE_H;
export const ROOF_AC_CELLS = Object.freeze([
  [-250, 237], [100, 237], [-430, 237], [-80, 237],
  [-540, 152], [-190, 152], [210, 152], [90, 210],
]);
export const ROOF_RING_CELLS = Object.freeze([
  [-80, 259], [100, 259],
  [-600, 259], [-430, 259], [-250, 259],
  [-540, 210], [-390, 210], [-250, 210], [-190, 210], [-80, 210],
]);
export const ROOF_AC_CLEAR = 2.20;
export const ROOF_AC_H = 2.40;
export const ROOF_AC_W = 1.70;
export const ROOF_AC_D = 1.36;
export const ROOF_RING_R = 1.15;
export const ROOF_RING_TUBE = 0.08;
export const ROOF_RING_SEGS = 12;

export function roofAcGapGeom(x, z, id) {
  const y0 = ROOF_WHOOP_Y;
  const gap = ROOF_AC_CLEAR;
  const unitW = ROOF_AC_W;
  return {
    id, x, z, y0,
    unitW, unitH: ROOF_AC_H, unitD: ROOF_AC_D,
    leftX: x - (gap / 2 + unitW / 2),
    rightX: x + (gap / 2 + unitW / 2),
    openW: gap, openH: ROOF_AC_H,
    x0: x - gap / 2, x1: x + gap / 2,
    z0: z - ROOF_AC_D / 2 + 0.08, z1: z + ROOF_AC_D / 2 - 0.08,
    fly: '+X', tag: 'roof-whoop',
  };
}

export function roofRingGeom(x, z, id) {
  const r = ROOF_RING_R;
  const tube = ROOF_RING_TUBE;
  const y = ROOF_WHOOP_Y + r;
  return {
    id, x, z, y0: ROOF_WHOOP_Y, y, r, tube,
    segs: ROOF_RING_SEGS,
    openW: 2 * (r - tube), openH: 2 * (r - tube),
    x0: x - 0.40, x1: x + 0.40,
    z0: z - r - tube, z1: z + r + tube,
    fly: '+X', tag: 'roof-whoop',
  };
}

export function roofAcGapVoid(g) {
  return {
    id: g.id, kind: 'kit',
    x: g.x, z: g.z, y: g.y0 + g.openH * 0.48,
    x0: g.x0 + 0.06, x1: g.x1 - 0.06,
    z0: g.z0, z1: g.z1,
    y0: g.y0 + 0.08, y1: g.y0 + g.openH - 0.06,
    openW: g.openW, openH: g.openH,
  };
}

export function roofRingVoid(g) {
  const inner = g.r - g.tube;
  return {
    id: g.id, kind: 'kit',
    x: g.x, z: g.z, y: g.y,
    x0: g.x - 0.40, x1: g.x + 0.40,
    z0: g.z - inner + 0.10, z1: g.z + inner - 0.10,
    y0: g.y - inner + 0.10, y1: g.y + inner - 0.10,
    openW: g.openW, openH: g.openH,
  };
}

export function roofWhoops() {
  const out = [];
  for (let i = 0; i < ROOF_AC_CELLS.length; i++) {
    const [x, z] = ROOF_AC_CELLS[i];
    out.push(roofAcGapGeom(x, z, `roof-ac-${i}`));
  }
  for (let i = 0; i < ROOF_RING_CELLS.length; i++) {
    const [x, z] = ROOF_RING_CELLS[i];
    out.push(roofRingGeom(x, z, `roof-ring-${i}`));
  }
  return out;
}

// ---- alley fire-escape whoops (inland mid-rise flanks at z=248) ----
// Steel landing frames on the east/west flanks of each z=237/259 pair.
// Fly +X through the empty landing. Collider is stringer / lintel, never
// a filled sash. Signed cells west of x=240. Miss leftoverLot A–H, GAP_X,
// travel 40.2–47.8, alley-pipe bays at the pair x. hash01 never at const-eval.
export const FIRE_ESCAPE_Z = 248;
export const FIRE_ESCAPE_POST_R = 0.08;
export const FIRE_ESCAPE_POST_H = 3.40;
export const FIRE_ESCAPE_HALF_Z = 1.10;
export const FIRE_ESCAPE_BEAM_W = 0.10;
export const FIRE_ESCAPE_BEAM_H = 0.12;
export const FIRE_ESCAPE_CELLS = Object.freeze([
  [-439, 248], [-421, 248],
  [-259, 248], [-241, 248],
  [-89, 248], [-71, 248],
  [91, 248], [109, 248],
]);

/** One fire-escape landing frame. Fly +X. Opening is empty air. */
export function fireEscapeGeom(cx, cz = FIRE_ESCAPE_Z) {
  const y0 = CITY_Y;
  const halfZ = FIRE_ESCAPE_HALF_Z;
  const postR = FIRE_ESCAPE_POST_R;
  const postH = FIRE_ESCAPE_POST_H;
  return {
    x: cx, z: cz, y0,
    halfZ, postR, postH,
    beamW: FIRE_ESCAPE_BEAM_W, beamH: FIRE_ESCAPE_BEAM_H,
    x0: cx - postR - 0.04, x1: cx + postR + 0.04,
    z0: cz - halfZ, z1: cz + halfZ,
    openW: halfZ * 2 - 2 * postR,
    openH: postH,
    fly: '+X',
    tag: 'fire-escape',
  };
}

export function fireEscapeVoid(g, id) {
  return {
    id, kind: 'kit',
    x: g.x, z: g.z, y: g.y0 + g.postH * 0.48,
    x0: g.x - 0.45, x1: g.x + 0.45,
    z0: g.z - g.halfZ + g.postR + 0.08,
    z1: g.z + g.halfZ - g.postR - 0.08,
    y0: g.y0 + 0.06, y1: g.y0 + g.postH - 0.04,
    openW: g.openW, openH: g.openH,
  };
}

export function fireEscapes() {
  const out = [];
  for (let i = 0; i < FIRE_ESCAPE_CELLS.length; i++) {
    const [x, z] = FIRE_ESCAPE_CELLS[i];
    out.push(fireEscapeGeom(x, z));
  }
  return out;
}

// ---- inland alley dumpsters + loading docks (z=248 band) ----
// Signed solids on the service alleys between inland mid-rise pairs.
// West of x=240. Miss leftoverLot A–H, travel 40.2–47.8, alley-pipe bays
// at pair x, and fire-escape flanks at plateX±9. hash01 never at const-eval.
export const ALLEY_DUMP_W = 1.68;
export const ALLEY_DUMP_D = 0.92;
export const ALLEY_DUMP_H = 1.12;
export const ALLEY_DUMPSTER_CELLS = Object.freeze([
  [-433.2, 244.8],
  [-253.2, 244.8],
  [-83.2, 244.8],
  [96.8, 244.8],
]);
export const ALLEY_DOCK_W = 2.40;
export const ALLEY_DOCK_D = 1.20;
export const ALLEY_DOCK_H = 0.36;
export const ALLEY_DOCK_CELLS = Object.freeze([
  [-426.8, 251.2],
  [-246.8, 251.2],
  [-76.8, 251.2],
  [103.2, 251.2],
]);
// Gooseneck poles against mid-rise alley faces. Arm hangs over the
// 8 m service lane (not a street gooseneck). Night head via regDN.
// West of x=240. Miss leftoverLot A–H, travel 40.2–47.8, alley-pipe
// bays at pair x, fire-escape flanks at plateX±9, dumpsters/docks.
// hash01 never at const-eval.
export const ALLEY_LAMP_H = 4.20;
export const ALLEY_LAMP_R = 0.10;
export const ALLEY_LAMP_ARM = 1.28;
export const ALLEY_LAMP_CELLS = Object.freeze([
  [-607.2, 244.8], [-592.8, 251.2],
  [-437.2, 244.8], [-422.8, 251.2],
  [-257.2, 244.8], [-242.8, 251.2],
  [-87.2, 244.8], [-72.8, 251.2],
  [92.8, 244.8], [107.2, 251.2],
]);

/** Gooseneck over the z=248 service alley. Arm toward alley centre. */
export function alleyLampGeom(x, z) {
  return {
    x, z,
    yaw: z < 248 ? 0 : Math.PI,
    h: ALLEY_LAMP_H, r: ALLEY_LAMP_R, arm: ALLEY_LAMP_ARM,
    tag: 'inland-alley-lamp',
  };
}

/** True when an alley solid would sit in a pipe or fire-escape bay. */
export function alleySolidHitsWhoop(x, z, w, d) {
  const hw = w / 2, hd = d / 2;
  for (let i = 0; i < ALLEY_PIPE_CELLS.length; i++) {
    const px = ALLEY_PIPE_CELLS[i][0], pz = ALLEY_PIPE_CELLS[i][1];
    if (Math.abs(x - px) < hw + 1.2 && Math.abs(z - pz) < hd + ALLEY_PIPE_HALF_Z) {
      return true;
    }
  }
  for (let i = 0; i < FIRE_ESCAPE_CELLS.length; i++) {
    const fx = FIRE_ESCAPE_CELLS[i][0], fz = FIRE_ESCAPE_CELLS[i][1];
    if (Math.abs(x - fx) < hw + 1.2 && Math.abs(z - fz) < hd + FIRE_ESCAPE_HALF_Z) {
      return true;
    }
  }
  return false;
}

// ---- Lincoln Road analogue (z=120): E–W pedestrian mall + fly-under pergolas ----
// Inland of Ocean Drive, parallel to the facade plane. West of leftoverLot A
// (x>=251). New RESERVED west of x=240. Miss GAP_X, fifth/espa plates, house
// (166/132), convention (−112..16 / 104..166), helipad W, alley pipes, cinema
// z1=100, leftoverLot A–H, travel lanes 40.2–47.8. hash01 never drawn.
// Shop arcade fly ±X along the front; mid-block pass fly ±Z; pergolas fly +X
// down the mall. Collider is jamb / post / beam, never a filled sash.
export const LINCOLN_Z = 120;
export const LINCOLN_HALF = 5.0;
export const LINCOLN_SOFFIT = 3.40;
export const LINCOLN_ARCADE_D = 3.20;
export const LINCOLN_PASS_W = 2.20;
export const LINCOLN_PASS_H = 3.20;
export const LINCOLN_D = 10.0;
export const LINCOLN_H = 8.40;
export const LINCOLN_JAMB = 0.28;
export const LINCOLN_S_FRONT_Z = LINCOLN_Z - LINCOLN_HALF; // 115
export const LINCOLN_N_FRONT_Z = LINCOLN_Z + LINCOLN_HALF; // 125
export const LINCOLN_S_CELLS = Object.freeze([
  [-250, 16], [96, 16], [136, 16], [190, 16],
]);
export const LINCOLN_N_CELLS = Object.freeze([
  [-250, 16], [96, 16], [136, 16], [190, 16],
]);
export const LINCOLN_PERGOLA_CELLS = Object.freeze([
  [-250, 120], [96, 120], [136, 120], [190, 120],
]);
export const LINCOLN_PERGOLA_HALF_X = 3.0;
export const LINCOLN_PERGOLA_HALF_Z = 3.8;
export const LINCOLN_PERGOLA_POST_R = 0.16;
export const LINCOLN_PERGOLA_POST_H = 3.40;
export const LINCOLN_PERGOLA_BEAM_H = 0.24;
export const LINCOLN_PERGOLA_BEAM_W = 0.28;
export const LINCOLN_WALK_RUNS = Object.freeze([
  [-258, -242],
  [88, 144],
  [182, 198],
]);

/** One Lincoln mall shop. side 'S' faces +Z; 'N' faces −Z. Never remaps x/z. */
export function lincolnShopGeom(side, x, len, id) {
  const frontZ = side === 'S' ? LINCOLN_S_FRONT_Z : LINCOLN_N_FRONT_Z;
  const inward = side === 'S' ? -1 : 1;
  const zBack = frontZ + inward * LINCOLN_D;
  const zArcadeInner = frontZ + inward * LINCOLN_ARCADE_D;
  const z0 = Math.min(frontZ, zBack);
  const z1 = Math.max(frontZ, zBack);
  const z = (z0 + z1) / 2;
  const arcadeZ = (frontZ + zArcadeInner) / 2;
  const x0 = x - len / 2;
  const x1 = x + len / 2;
  const passX0 = x - LINCOLN_PASS_W / 2;
  const passX1 = x + LINCOLN_PASS_W / 2;
  return {
    id, side, x, len, z, frontZ, inward, zBack, zArcadeInner, x0, x1,
    z0, z1, arcadeZ, passX0, passX1,
    openArcadeW: len - 2.4, openArcadeH: LINCOLN_SOFFIT,
    openPassW: LINCOLN_PASS_W, openPassH: LINCOLN_PASS_H,
    jamb: LINCOLN_JAMB, tag: 'lincoln',
  };
}

export function lincolnShops() {
  const shops = [];
  for (let i = 0; i < LINCOLN_S_CELLS.length; i++) {
    const [x, len] = LINCOLN_S_CELLS[i];
    shops.push(lincolnShopGeom('S', x, len, `lincoln-s-${i}`));
  }
  for (let i = 0; i < LINCOLN_N_CELLS.length; i++) {
    const [x, len] = LINCOLN_N_CELLS[i];
    shops.push(lincolnShopGeom('N', x, len, `lincoln-n-${i}`));
  }
  return shops;
}

export function lincolnArcadeVoid(g) {
  const zLo = Math.min(g.frontZ, g.zArcadeInner);
  const zHi = Math.max(g.frontZ, g.zArcadeInner);
  return {
    id: `${g.id}-arcade`, kind: 'kit',
    x: g.x, z: g.arcadeZ, y: CITY_Y + LINCOLN_SOFFIT * 0.48,
    x0: g.x0 + 1.2, x1: g.x1 - 1.2,
    z0: zLo + 0.12, z1: zHi - 0.12,
    y0: CITY_Y + 0.08, y1: CITY_Y + LINCOLN_SOFFIT - 0.06,
    openW: g.openArcadeW, openH: g.openArcadeH,
  };
}

export function lincolnPassVoid(g) {
  return {
    id: `${g.id}-pass`, kind: 'kit',
    x: g.x, z: g.z, y: CITY_Y + LINCOLN_PASS_H * 0.48,
    x0: g.passX0 + 0.06, x1: g.passX1 - 0.06,
    z0: g.z0 + 0.10, z1: g.z1 - 0.10,
    y0: CITY_Y + 0.08, y1: CITY_Y + LINCOLN_PASS_H - 0.06,
    openW: g.openPassW, openH: g.openPassH,
  };
}

/** Mall-centre pergola. Fly +X. Opening is empty air. Never remaps x/z. */
export function lincolnPergolaGeom(x, z = LINCOLN_Z) {
  const halfX = LINCOLN_PERGOLA_HALF_X;
  const halfZ = LINCOLN_PERGOLA_HALF_Z;
  const postR = LINCOLN_PERGOLA_POST_R;
  const postH = LINCOLN_PERGOLA_POST_H;
  return {
    x, z, y0: CITY_Y,
    halfX, halfZ, postR, postH,
    beamH: LINCOLN_PERGOLA_BEAM_H, beamW: LINCOLN_PERGOLA_BEAM_W,
    spanX: halfX * 2, spanZ: halfZ * 2,
    x0: x - halfX, x1: x + halfX,
    z0: z - halfZ, z1: z + halfZ,
    openW: halfZ * 2 - 2 * postR,
    openH: postH,
    fly: '+X',
    tag: 'lincoln',
  };
}

export function lincolnPergolas() {
  const out = [];
  for (let i = 0; i < LINCOLN_PERGOLA_CELLS.length; i++) {
    const [x, z] = LINCOLN_PERGOLA_CELLS[i];
    out.push(lincolnPergolaGeom(x, z));
  }
  return out;
}

export function lincolnPergolaVoid(g, id) {
  return {
    id, kind: 'kit',
    x: g.x, z: g.z, y: g.y0 + g.postH * 0.48,
    x0: g.x - g.halfX + g.postR + 0.08,
    x1: g.x + g.halfX - g.postR - 0.08,
    z0: g.z - g.halfZ + g.postR + 0.08,
    z1: g.z + g.halfZ - g.postR - 0.08,
    y0: g.y0 + 0.06, y1: g.y0 + g.postH - 0.04,
    openW: g.openW, openH: g.openH,
  };
}

export function lincolnWalkRuns() {
  return LINCOLN_WALK_RUNS.map(([x0, x1], i) => ({
    id: `lincoln-walk-${i}`,
    x0, x1, x: (x0 + x1) / 2,
    z: LINCOLN_Z,
    z0: LINCOLN_Z - LINCOLN_HALF,
    z1: LINCOLN_Z + LINCOLN_HALF,
    w: x1 - x0,
    d: LINCOLN_HALF * 2,
    tag: 'lincoln',
  }));
}

// ---- Washington Ave analogue (z=180): second N-S street west of Ocean Drive ----
// Parallel to Ocean Drive / the facade plane, inland of Lincoln (z=120) and
// convention z1=166. Painted 14 m carriageway (park + travel + travel + park),
// parked cars on the shoulders, one fly-under sidewalk arcade. West of
// leftoverLot A (x>=251). New RESERVED west of x=240. Miss GAP_X columns,
// fifth/espa plates, lincoln, inland midrises z=237, leftoverLot A–H, Ocean
// Drive travel 40.2–47.8. hash01 never drawn at const-eval. Collider is
// curb / car hull / arcade jamb, never a filled travel bay.
export const WASH_Z = 180;
export const WASH_VISUAL_W = 14;
export const WASH_HALF = 7;
export const WASH_Z0 = 173;
export const WASH_Z1 = 187;
export const WASH_TRAVEL_Z0 = 176.2;
export const WASH_TRAVEL_Z1 = 183.8;
export const WASH_PARK_OCEAN_Z = 174.45;
export const WASH_PARK_INLAND_Z = 185.55;
export const WASH_SW_OCEAN_Z0 = 169.95;
export const WASH_SW_OCEAN_Z1 = 171.85;
export const WASH_SW_INLAND_Z0 = 188.05;
export const WASH_SW_INLAND_Z1 = 189.85;
export const WASH_SW_OCEAN_Z = 170.9;
export const WASH_SW_INLAND_Z = 188.95;
export const WASH_CURB_OCEAN_Z0 = 172.64;
export const WASH_CURB_OCEAN_Z1 = 173.02;
export const WASH_CURB_INLAND_Z0 = 186.98;
export const WASH_CURB_INLAND_Z1 = 187.36;
export const WASH_X0 = -480;
export const WASH_X1 = 228;
export const WASH_RUN_XS = Object.freeze([
  [-480, -321.5],
  [-308.5, -135.5],
  [-122.5, 50.5],
  [63.5, 228],
]);
export const WASH_ARCADE_X = 96;
export const WASH_ARCADE_Z = WASH_SW_OCEAN_Z;
export const WASH_ARCADE_HALF_X = SW_ARCADE_HALF_X;
export const WASH_ARCADE_HALF_Z = SW_ARCADE_HALF_Z;
export const WASH_ARCADE_POST_R = SW_ARCADE_POST_R;
export const WASH_ARCADE_POST_H = SW_ARCADE_POST_H;
export const WASH_ARCADE_BEAM_H = SW_ARCADE_BEAM_H;
export const WASH_ARCADE_BEAM_W = SW_ARCADE_BEAM_W;
export const WASH_CAR_SX = 4.70;
export const WASH_CAR_SY = 1.50;
export const WASH_CAR_SZ = 1.90;
export const WASH_CAR_CELLS = Object.freeze([
  [-400, -1], [-360, 1], [-220, -1], [-180, 1],
  [-80, -1], [-40, 1], [20, -1], [80, 1],
  [120, -1], [160, 1], [200, -1], [210, 1],
]);

/** Washington carriageway runs. Signed cuts at GAP_X. Never remaps x/z. West of 240. */
export function washingtonRuns() {
  const out = [];
  for (let i = 0; i < WASH_RUN_XS.length; i++) {
    const x0 = WASH_RUN_XS[i][0], x1 = WASH_RUN_XS[i][1];
    out.push({
      id: `washington-run-${i}`,
      x0, x1, x: (x0 + x1) / 2,
      z: WASH_Z, z0: WASH_Z0, z1: WASH_Z1,
      w: x1 - x0, d: WASH_VISUAL_W, tag: 'washington',
    });
  }
  return out;
}

/** One parked hull on a Washington shoulder. side −1 ocean / +1 inland. */
export function washingtonCarGeom(x, side, id) {
  const z = side < 0 ? WASH_PARK_OCEAN_Z : WASH_PARK_INLAND_Z;
  return {
    id, x, z, side,
    rotY: side < 0 ? 0 : Math.PI,
    sx: WASH_CAR_SX, sy: WASH_CAR_SY, sz: WASH_CAR_SZ,
    x0: x - WASH_CAR_SX / 2, x1: x + WASH_CAR_SX / 2,
    z0: z - WASH_CAR_SZ / 2, z1: z + WASH_CAR_SZ / 2,
    tag: 'washington',
  };
}

export function washingtonCars() {
  const out = [];
  for (let i = 0; i < WASH_CAR_CELLS.length; i++) {
    const [x, side] = WASH_CAR_CELLS[i];
    out.push(washingtonCarGeom(x, side, `washington-car-${i}`));
  }
  return out;
}

/** One fly-under sidewalk arcade on the ocean walk. Fly +X. Opening is empty air. */
export function washingtonArcadeGeom(cx = WASH_ARCADE_X, cz = WASH_ARCADE_Z) {
  const y0 = CITY_Y + SW_H;
  const halfX = WASH_ARCADE_HALF_X;
  const halfZ = WASH_ARCADE_HALF_Z;
  const postR = WASH_ARCADE_POST_R;
  const postH = WASH_ARCADE_POST_H;
  return {
    x: cx, z: cz, y0,
    halfX, halfZ, postR, postH,
    beamH: WASH_ARCADE_BEAM_H, beamW: WASH_ARCADE_BEAM_W,
    spanX: halfX * 2, spanZ: halfZ * 2,
    x0: cx - halfX, x1: cx + halfX,
    z0: cz - halfZ, z1: cz + halfZ,
    openW: halfZ * 2 - 2 * postR,
    openH: postH,
    fly: '+X',
    tag: 'washington',
  };
}

export function washingtonArcadeVoid(g, id) {
  return {
    id, kind: 'kit',
    x: g.x, z: g.z, y: g.y0 + g.postH * 0.48,
    x0: g.x - g.halfX + g.postR + 0.08,
    x1: g.x + g.halfX - g.postR - 0.08,
    z0: g.z - g.halfZ + g.postR + 0.08,
    z1: g.z + g.halfZ - g.postR - 0.08,
    y0: g.y0 + 0.06, y1: g.y0 + g.postH - 0.04,
    openW: g.openW, openH: g.openH,
  };
}

/** True when (x,z) sits on a Washington carriageway run. West of leftoverLot A. */
export function onWashingtonRoad(x, z) {
  if (x >= 240) return false;
  if (z < WASH_Z0 || z > WASH_Z1) return false;
  for (let i = 0; i < WASH_RUN_XS.length; i++) {
    if (x >= WASH_RUN_XS[i][0] && x <= WASH_RUN_XS[i][1]) return true;
  }
  return false;
}

/** True when (x,z) sits on a Washington sidewalk run. West of leftoverLot A. */
export function onWashingtonWalk(x, z) {
  if (x >= 240) return false;
  const onOcean = z >= WASH_SW_OCEAN_Z0 && z <= WASH_SW_OCEAN_Z1;
  const onInland = z >= WASH_SW_INLAND_Z0 && z <= WASH_SW_INLAND_Z1;
  if (!onOcean && !onInland) return false;
  for (let i = 0; i < WASH_RUN_XS.length; i++) {
    if (x >= WASH_RUN_XS[i][0] && x <= WASH_RUN_XS[i][1]) return true;
  }
  return false;
}

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

// ---- leftoverLot E (fifth leftover-city vacant parcel; same schema) ----
// Vacant city parcel at signed 347/84, east of leftoverLot D RESERVED
// (D x1=337 + 1.8 = 338.8; E starts 340, 1.2 m off). West of helipadE
// (408), same inland band as leftoverLot #34 / #35 / C / D / drop /
// abando (z=84). Helipad E stays ~76 m east at 430/70. Desi + Reesy
// signed the cell. Do not invent or slide x/z. Do not grow the plate.
// Do not slide A (258/84), B (295/84), C (313/84), or D (330/84).
// Same leftoverLotGeom / leftoverLotColliderShapes / leftoverLotVoids
// — not leftoverLotEGeom, not OSM, not a fifth haunt.
export const LEFTOVER_LOT_E_X = 347;
export const LEFTOVER_LOT_E_Z = 84;
export const LEFTOVER_LOT_E_W = 14.0;
export const LEFTOVER_LOT_E_D = 12.0;
export const LEFTOVER_LOT_E_X0 = 340;
export const LEFTOVER_LOT_E_X1 = 354;
export const LEFTOVER_LOT_E_Z0 = 78;
export const LEFTOVER_LOT_E_Z1 = 90;

// ---- leftoverLot F (sixth leftover-city vacant parcel; same schema) ----
// Vacant city parcel at signed 364/84, east of leftoverLot E RESERVED
// (E x1=354 + 1.8 = 355.8; F starts 357, 1.2 m off). Same D→E
// convention. 2 m east of E-park x1=355 and 2 m ocean of E-park
// z0=92 (F z1=90). Not a leftoverLotOverlap kiss of the park
// (1 m leftover apron is the E-park vs E rule; F vs E-park is a
// 2 m gap). F-park at signed 364/96 sits 2 m inland of this lot
// (F z1=90, park z0=92). x 356–372 is 1 m past F’s 357–371 —
// leftoverLotOverlap of F reserved is 0 (oz = −0.6 vs z1+1.4
// = 91.4), not a kiss. F-park spine 356→372 / z=96 leftoverLotOverlap
// of F reserved is 0 (walk z0=95.2 vs reserved z1+1.4=91.4).
// E-park x1=355 must not merge with
// F-park x0=356 (1 m west gap, same z band). West of helipadE
// (408), same inland band as leftoverLot
// #34 / #35 / C / D / E / drop / abando (z=84). Helipad E stays
// ~59 m east at 430/70 (from F x1=371). Desi + Reesy signed the
// cell. Do not invent or slide x/z. Do not grow the plate.
// Do not slide A (258/84), B (295/84), C (313/84), D (330/84),
// or E (347/84). Same leftoverLotGeom / leftoverLotColliderShapes /
// leftoverLotVoids — not leftoverLotFGeom, not OSM, not a fifth haunt.
export const LEFTOVER_LOT_F_X = 364;
export const LEFTOVER_LOT_F_Z = 84;
export const LEFTOVER_LOT_F_W = 14.0;
export const LEFTOVER_LOT_F_D = 12.0;
export const LEFTOVER_LOT_F_X0 = 357;
export const LEFTOVER_LOT_F_X1 = 371;
export const LEFTOVER_LOT_F_Z0 = 78;
export const LEFTOVER_LOT_F_Z1 = 90;

// ---- leftoverLot G (seventh leftover-city vacant parcel; same schema) ----
// Vacant city parcel at signed 381/84, east of leftoverLot F RESERVED
// (F x1=371 + 1.8 = 372.8; G starts 374, 1.2 m off). Same E→F
// convention. 2 m east of F-park x1=372. Not a leftoverLotOverlap
// kiss of F or F-park. G-park is now the signed 381/96 hull
// (373–389 × 92–100), 2 m inland, 1 m leftover apron, not a
// kiss. G-park spine 373→389 / z=96 leftoverLotOverlap of G
// reserved is 0 (walk z0=95.2 vs reserved z1+1.4=91.4).
// West of helipadE (408), same inland band as
// leftoverLot #34 / #35 / C / D / E / F / drop / abando (z=84).
// Helipad E stays ~42 m east at 430/70 (from G x1=388). GAP 429
// stays ~41 m east. Desi + Reesy signed the cell. Donny cleared
// #65 on live `/`. Do not invent or slide x/z. Do not grow the
// plate. Do not slide A (258/84), B (295/84), C (313/84), D
// (330/84), E (347/84), or F (364/84). Same leftoverLotGeom /
// leftoverLotColliderShapes / leftoverLotVoids — not
// leftoverLotGGeom, not leftoverLotDirtGeom, not OSM, not a
// fifth haunt.
export const LEFTOVER_LOT_G_X = 381;
export const LEFTOVER_LOT_G_Z = 84;
export const LEFTOVER_LOT_G_W = 14.0;
export const LEFTOVER_LOT_G_D = 12.0;
export const LEFTOVER_LOT_G_X0 = 374;
export const LEFTOVER_LOT_G_X1 = 388;
export const LEFTOVER_LOT_G_Z0 = 78;
export const LEFTOVER_LOT_G_Z1 = 90;

// ---- leftoverLot H (eighth leftover-city vacant parcel; same schema) ----
// Vacant city parcel at signed 398/84, east of leftoverLot G RESERVED
// (G x1=388 + 1.8 = 389.8; H starts 391, 1.2 m off). Same F→G
// convention. 2 m east of G-park x1=389. Not a leftoverLotOverlap
// kiss of G or G-park. Do NOT merge with G-park 389. 2 m south
// of G-park (H z1=90, park z0=92) is an apron, not a kiss.
// H-park is now the signed 398/96 hull (390–406 × 92–100),
// 2 m inland, 1 m leftover apron, not a kiss. leftoverLotOverlap
// of H reserved is 0 (oz = −0.6 vs reserved z1+1.4 = 91.4).
// H-park spine 390→406 / z=96 leftoverLotOverlap of H
// reserved is 0 (walk z0=95.2 vs reserved z1+1.4=91.4).
// G-park x1=389 must not merge with H-park x0=390. West of helipadE (408), same inland band as
// leftoverLot #34 / #35 / C / D / E / F / G / drop / abando (z=84).
// Helipad E stays ~25 m east at 430/70 (from H x1=405). GAP 429
// stays ~24 m east. Desi signed the cell. H is G+17 m. Do not
// invent or slide x/z. Do not grow the plate. Do not slide A
// (258/84), B (295/84), C (313/84), D (330/84), E (347/84), F
// (364/84), or G (381/84). Same leftoverLotGeom /
// leftoverLotColliderShapes / leftoverLotVoids — not
// leftoverLotHGeom, not leftoverLotDirtGeom, not OSM, not a
// fifth haunt.
export const LEFTOVER_LOT_H_X = 398;
export const LEFTOVER_LOT_H_Z = 84;
export const LEFTOVER_LOT_H_W = 14.0;
export const LEFTOVER_LOT_H_D = 12.0;
export const LEFTOVER_LOT_H_X0 = 391;
export const LEFTOVER_LOT_H_X1 = 405;
export const LEFTOVER_LOT_H_Z0 = 78;
export const LEFTOVER_LOT_H_Z1 = 90;

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

// ---- west park bench (same Tiny Glade 3-seat slat kit; signed 269.5 / 90) ----
// Desi + Reesy signed the cell. Do not invent or slide x/z. Never nudge.
// Same gardenBenchGeom / gardenBenchParts — not gardenBenchCGeom, not a
// slide of 276 / 90. Yaw faces −Z / south toward the garden path (z=84).
// 0.8 m is edge-to-walk, not center. East end 270.4, west N-S walk x0
// 271.2 (270.4 + 0.8 = 271.2). West end 268.6 stays inside the lawn
// (lawn west 268). Misses 276/90 (~4.7 m). Kiss x=272 N-S / 276/90 /
// leftoverLot A/B/C/D / pavement / streetOverlap / path slabs = drop,
// never nudge. Existing benches stay 276/90 and 276 / 82.4. Walks stay
// 84 / west 268→274.2 / east 277.8→284 / N-S 272 / N-S 280. Pergola
// stays 276/94. Pocket park stays 276/92, 16×8. leftoverGrass stays
// 267–285 / 81–86. leftoverLot A 258/84, B 295/84, C 313/84, D 330/84.
// Scatter still uses tryPlace.
export const PARK_BENCH_W_X = 269.5;
export const PARK_BENCH_W_Z = 90;
export const PARK_BENCH_W_YAW = PARK_BENCH_YAW;
export const PARK_BENCH_W_W = GARDEN_BENCH_W;
export const PARK_BENCH_W_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_W_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_W_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_W_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_W_X0 = PARK_BENCH_W_X - PARK_BENCH_W_W / 2;
export const PARK_BENCH_W_X1 = PARK_BENCH_W_X + PARK_BENCH_W_W / 2;
export const PARK_BENCH_W_Z0 = PARK_BENCH_W_Z - PARK_BENCH_W_DEPTH / 2;
export const PARK_BENCH_W_Z1 = PARK_BENCH_W_Z + PARK_BENCH_W_DEPTH / 2;

// ---- east park bench (same Tiny Glade 3-seat slat kit; signed 282.5 / 90) ----
// Desi + Reesy signed the cell. Do not invent or slide x/z. Never nudge.
// Same gardenBenchGeom / gardenBenchParts — not gardenBenchDGeom, not a
// slide of 269.5 / 90. +6.5 m mirror of 269.5 (282.5 is +6.5 off 276;
// 269.5 is −6.5). Yaw faces −Z / south toward the garden path (z=84).
// 0.8 m is edge-to-walk, not center. West end 281.6, east N-S walk x1
// 280.8 (281.6 − 280.8 = 0.8). East end 283.4 stays inside 284.
// Misses 276/90 (~4.7 m). Kiss x=280 N-S / 276/90 / 269.5/90 /
// leftoverLot A/B/C/D / pavement / streetOverlap / path slabs = drop,
// never nudge. Existing benches stay 276/82.4, 276/90, 269.5/90.
// Walks stay 84 / west 268→274.2 / east 277.8→284 / N-S 272 / N-S 280.
// Pergola stays 276/94. Pocket park stays 276/92, 16×8. leftoverGrass
// stays 267–285 / 81–86. leftoverLot A 258/84, B 295/84, C 313/84,
// D 330/84. Scatter still uses tryPlace.
export const PARK_BENCH_E_X = 282.5;
export const PARK_BENCH_E_Z = 90;
export const PARK_BENCH_E_YAW = PARK_BENCH_YAW;
export const PARK_BENCH_E_W = GARDEN_BENCH_W;
export const PARK_BENCH_E_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_E_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_E_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_E_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_E_X0 = PARK_BENCH_E_X - PARK_BENCH_E_W / 2;
export const PARK_BENCH_E_X1 = PARK_BENCH_E_X + PARK_BENCH_E_W / 2;
export const PARK_BENCH_E_Z0 = PARK_BENCH_E_Z - PARK_BENCH_E_DEPTH / 2;
export const PARK_BENCH_E_Z1 = PARK_BENCH_E_Z + PARK_BENCH_E_DEPTH / 2;

// ---- E-park bench (same Tiny Glade 3-seat slat kit; signed 347 / 94.4) ----
// Desi + Reesy signed the cell. Do not invent or slide x/z. Never nudge.
// Same gardenBenchGeom / gardenBenchParts — not gardenBenchEGeom /
// gardenBenchFGeom / parkBenchEEGeom, not a slide of 282.5 / 90.
// Yaw faces +Z / ocean-of-walk toward the EE spine (z=96). PARK_BENCH_EE_YAW
// is 0 so the shared geom does not fork or flip 276/82.4 / 276/90 /
// 269.5 / 282.5. 0.8 m is the 82.4 convention: center-to-spine
// (spine z0=95.2; 95.2 − 0.8 = 94.4), not the 269.5 edge-to-walk rule.
// Misses leftoverLot E (E z1=90). Sits on the E park hull by design
// (339–355 × 92–100). Kiss 339→355 / z=96 spine / leftoverLot E /
// helipad / warehouse / 276 park / 276 benches / 276 walks = drop,
// never nudge. Existing benches stay 276/82.4, 276/90, 269.5/90,
// 282.5/90. Walks stay 84 / west 268→274.2 / east 277.8→284 / N-S
// 272 / N-S 280 / EE 339→355 / z=96. A–E lots stay 258 / 295 / 313 /
// 330 / 347 at z=84. Pocket park 276 stays 268–284 × 88–96. E leftover
// band stays 9000–11000 (~10k after the spine). Bench plate is ~0.8 m²
// — do not restack the grass floor. Scatter still uses tryPlace.
export const PARK_BENCH_EE_X = 347;
export const PARK_BENCH_EE_Z = 94.4;
export const PARK_BENCH_EE_YAW = 0;
export const PARK_BENCH_EE_W = GARDEN_BENCH_W;
export const PARK_BENCH_EE_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_EE_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_EE_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_EE_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_EE_X0 = PARK_BENCH_EE_X - PARK_BENCH_EE_W / 2;
export const PARK_BENCH_EE_X1 = PARK_BENCH_EE_X + PARK_BENCH_EE_W / 2;
export const PARK_BENCH_EE_Z0 = PARK_BENCH_EE_Z - PARK_BENCH_EE_DEPTH / 2;
export const PARK_BENCH_EE_Z1 = PARK_BENCH_EE_Z + PARK_BENCH_EE_DEPTH / 2;

// ---- E-park west bench (same Tiny Glade 3-seat slat kit; signed 340.5 / 94.4) ----
// Desi signed the cell. Do not invent or slide x/z. Never nudge.
// Same gardenBenchGeom / gardenBenchParts — not gardenBenchEGeom /
// gardenBenchFGeom / gardenBenchGGeom / parkBenchEEWGeom /
// parkBenchFGeom, not a slide of 347 / 94.4. −6.5 m off 347
// (347 − 6.5 = 340.5). Width 1.8 → x0=339.6, x1=341.4. East end
// 341.4 stays west of 347/94.4 (that bench x0=346.1). Yaw faces
// +Z / toward the EE spine at z=96. PARK_BENCH_EE_W_YAW is
// PARK_BENCH_EE_YAW (0) so the shared geom does not fork or flip
// 276/82.4 / 276/90 / 269.5 / 282.5 / 347/94.4. 0.8 m is the 82.4
// convention: center-to-spine (spine z0=95.2; 95.2 − 0.8 = 94.4),
// not the 269.5 edge-to-walk rule. Lives on the signed 347/96 hull
// (339–355 × 92–100) by design. West end 339.6 is inside 339.
// Misses leftoverLot E (E z1=90). Kiss 347/94.4 / 339→355 / z=96
// spine / leftoverLot E / helipad / warehouse / 276 park / 276
// benches / 276 walks / pavement / streetOverlap = drop, never
// nudge. 347/94.4 stays. 347/98.5 pergola stays. EE spine
// 339→355 / z=96 stays. West walk 339→345.2 / z=98.5 stays. East
// walk 348.8→355 / z=98.5 stays. 276 park 268–284 × 88–96 and all
// 276 walks/benches/pergola stay. leftoverLot A–E stay 258 / 295 /
// 313 / 330 / 347 at z=84. Garden path 268→284 / z=84 stays.
// E leftover band stays 8000–11000 (placedE after #59 was 8256).
// Bench plate is ~0.8 m² — do not restack the grass floor. Do not
// backfill to 12800. Do not change MIN/MAX. Scatter still uses
// tryPlace.
export const PARK_BENCH_EE_W_X = 340.5;
export const PARK_BENCH_EE_W_Z = 94.4;
export const PARK_BENCH_EE_W_YAW = PARK_BENCH_EE_YAW;
export const PARK_BENCH_EE_W_W = GARDEN_BENCH_W;
export const PARK_BENCH_EE_W_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_EE_W_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_EE_W_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_EE_W_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_EE_W_X0 = PARK_BENCH_EE_W_X - PARK_BENCH_EE_W_W / 2;
export const PARK_BENCH_EE_W_X1 = PARK_BENCH_EE_W_X + PARK_BENCH_EE_W_W / 2;
export const PARK_BENCH_EE_W_Z0 = PARK_BENCH_EE_W_Z - PARK_BENCH_EE_W_DEPTH / 2;
export const PARK_BENCH_EE_W_Z1 = PARK_BENCH_EE_W_Z + PARK_BENCH_EE_W_DEPTH / 2;

// ---- E-park east bench (same Tiny Glade 3-seat slat kit; signed 353.5 / 94.4) ----
// Desi signed the cell. Do not invent or slide x/z. Never nudge.
// Same gardenBenchGeom / gardenBenchParts — not gardenBenchEGeom /
// gardenBenchFGeom / gardenBenchGGeom / gardenBenchHGeom /
// parkBenchEEEGeom / leftoverLotEGeom, not a slide of 347 / 94.4
// or 340.5 / 94.4. +6.5 m off 347 (347 + 6.5 = 353.5). Mirror of
// 340.5 (347 − 6.5). Width 1.8 → x0=352.6, x1=354.4. East end
// 354.4 MUST stay inside hull x1=355. Yaw faces +Z / toward the
// EE spine at z=96. PARK_BENCH_EE_E_YAW is PARK_BENCH_EE_YAW (0)
// so the shared geom does not fork or flip 276/82.4 / 276/90 /
// 269.5 / 282.5 / 347/94.4 / 340.5/94.4. 0.8 m is the 82.4
// convention: center-to-spine (spine z0=95.2; 95.2 − 0.8 = 94.4),
// not the 269.5 edge-to-walk rule. Lives on the signed 347/96
// hull (339–355 × 92–100) by design. Misses leftoverLot E (E
// z1=90). Kiss 347/94.4 / 340.5/94.4 / 339→355 / z=96 spine /
// leftoverLot E / helipad / warehouse / 276 park / pavement /
// streetOverlap = drop, never nudge. 347/94.4 stays. 340.5/94.4
// stays. 347/98.5 pergola stays. EE spine 339→355 / z=96 stays.
// West walk 339→345.2 / z=98.5 stays. East walk 348.8→355 /
// z=98.5 stays. 276 park 268–284 × 88–96 and all 276
// walks/benches/pergola stay. leftoverLot A–E stay 258 / 295 /
// 313 / 330 / 347 at z=84. Garden path 268→284 / z=84 stays.
// E leftover band stays 8000–11000. Bench plate is ~0.8 m² —
// do not restack the grass floor. Do not backfill to 12800. Do
// not change MIN/MAX. Scatter still uses tryPlace.
export const PARK_BENCH_EE_E_X = 353.5;
export const PARK_BENCH_EE_E_Z = 94.4;
export const PARK_BENCH_EE_E_YAW = PARK_BENCH_EE_YAW;
export const PARK_BENCH_EE_E_W = GARDEN_BENCH_W;
export const PARK_BENCH_EE_E_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_EE_E_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_EE_E_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_EE_E_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_EE_E_X0 = PARK_BENCH_EE_E_X - PARK_BENCH_EE_E_W / 2;
export const PARK_BENCH_EE_E_X1 = PARK_BENCH_EE_E_X + PARK_BENCH_EE_E_W / 2;
export const PARK_BENCH_EE_E_Z0 = PARK_BENCH_EE_E_Z - PARK_BENCH_EE_E_DEPTH / 2;
export const PARK_BENCH_EE_E_Z1 = PARK_BENCH_EE_E_Z + PARK_BENCH_EE_E_DEPTH / 2;

// ---- F-park bench (same Tiny Glade 3-seat slat kit; signed 364 / 94.4) ----
// Desi + Reesy signed the cell. 347 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenBenchGeom / gardenBenchParts
// — not gardenBenchEGeom / gardenBenchFGeom / parkBenchFFGeom /
// leftoverLotDirtGeom, not a slide of 347 / 94.4. Yaw faces +Z /
// ocean-of-walk toward the FF spine (z=96). PARK_BENCH_FF_YAW is
// PARK_BENCH_EE_YAW (0) so the shared geom does not fork or flip
// 276/82.4 / 276/90 / 269.5 / 282.5 / 347/94.4. 0.8 m is the
// 82.4 convention: center-to-spine (spine z0=95.2; 95.2 − 0.8 =
// 94.4), not the 269.5 edge-to-walk rule. Misses leftoverLot F
// (F z1=90). Sits on the F park hull by design (356–372 ×
// 92–100). Does not merge with E-park 355. Kiss 356→372 / z=96
// spine / leftoverLot F / E-park / helipad / 347 / sit-box
// filled = drop, never nudge. Existing benches stay 276/82.4,
// 276/90, 269.5/90, 282.5/90, 347/94.4, 340.5/94.4, 353.5/94.4.
// Walks stay 84 / west 268→274.2 / east 277.8→284 / N-S 272 /
// N-S 280 / EE 339→355 / z=96 / FF 356→372 / z=96. A–F lots
// stay 258 / 295 / 313 / 330 / 347 / 364 at z=84. 276 park
// stays 268–284 × 88–96. 347 park stays 339–355 × 92–100.
// E leftover stays 8000–11000. F leftover after the walks is
// 8000–11000 (~8.2k). 11k is a ceiling. Do not backfill.
// No leftover lots on this merge. Bench plate is ~0.8 m² —
// do not restack the grass floor. Scatter still uses tryPlace.
export const PARK_BENCH_FF_X = 364;
export const PARK_BENCH_FF_Z = 94.4;
export const PARK_BENCH_FF_YAW = PARK_BENCH_EE_YAW;
export const PARK_BENCH_FF_W = GARDEN_BENCH_W;
export const PARK_BENCH_FF_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_FF_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_FF_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_FF_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_FF_X0 = PARK_BENCH_FF_X - PARK_BENCH_FF_W / 2;
export const PARK_BENCH_FF_X1 = PARK_BENCH_FF_X + PARK_BENCH_FF_W / 2;
export const PARK_BENCH_FF_Z0 = PARK_BENCH_FF_Z - PARK_BENCH_FF_DEPTH / 2;
export const PARK_BENCH_FF_Z1 = PARK_BENCH_FF_Z + PARK_BENCH_FF_DEPTH / 2;

// ---- F-park west bench (same Tiny Glade 3-seat slat kit; signed 357.5 / 94.4) ----
// Desi + Reesy signed the cell. 347 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenBenchGeom / gardenBenchParts
// — not gardenBenchEGeom / gardenBenchFGeom / gardenBenchGGeom /
// parkBenchFFWGeom / leftoverLotDirtGeom, not a slide of
// 364 / 94.4. −6.5 m off 364 (364 − 6.5 = 357.5). Mirror of
// 347/94.4 west bench. Width 1.8 → x0=356.6, x1=358.4. East
// end 358.4 stays west of 364/94.4 (that bench x0=363.1). Yaw
// faces +Z / toward the FF spine at z=96. PARK_BENCH_FF_W_YAW
// is PARK_BENCH_FF_YAW (0) so the shared geom does not fork.
// 0.8 m is the 82.4 convention: center-to-spine (spine z0=95.2;
// 95.2 − 0.8 = 94.4). Lives on the signed 364/96 hull
// (356–372 × 92–100) by design. West end 356.6 is inside 356.
// Misses leftoverLot F (F z1=90). Does not merge with E-park
// 355. Kiss 364/94.4 / 356→372 / z=96 spine / leftoverLot F /
// E-park / helipad / 347 / sit-box filled = drop, never nudge.
// 364/94.4 stays. 364/98.5 pergola stays. FF spine 356→372 /
// z=96 stays. West walk 356→362.2 / z=98.5 stays. East walk
// 365.8→372 / z=98.5 stays. 276 park and all 276
// walks/benches/pergola stay. 347 park and all 347
// walks/benches/pergola stay. leftoverLot A–F stay 258 / 295 /
// 313 / 330 / 347 / 364 at z=84. E leftover stays 8000–11000.
// F leftover after the walks is 8000–11000 (~8.2k). 11k is a
// ceiling. Do not backfill. No leftover lots on this merge.
// Bench plate is ~0.8 m² — do not restack the grass floor.
// Scatter still uses tryPlace.
export const PARK_BENCH_FF_W_X = 357.5;
export const PARK_BENCH_FF_W_Z = 94.4;
export const PARK_BENCH_FF_W_YAW = PARK_BENCH_FF_YAW;
export const PARK_BENCH_FF_W_W = GARDEN_BENCH_W;
export const PARK_BENCH_FF_W_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_FF_W_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_FF_W_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_FF_W_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_FF_W_X0 = PARK_BENCH_FF_W_X - PARK_BENCH_FF_W_W / 2;
export const PARK_BENCH_FF_W_X1 = PARK_BENCH_FF_W_X + PARK_BENCH_FF_W_W / 2;
export const PARK_BENCH_FF_W_Z0 = PARK_BENCH_FF_W_Z - PARK_BENCH_FF_W_DEPTH / 2;
export const PARK_BENCH_FF_W_Z1 = PARK_BENCH_FF_W_Z + PARK_BENCH_FF_W_DEPTH / 2;

// ---- F-park east bench (same Tiny Glade 3-seat slat kit; signed 370.5 / 94.4) ----
// Desi + Reesy signed the cell. 347 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenBenchGeom / gardenBenchParts
// — not gardenBenchEGeom / gardenBenchFGeom / gardenBenchGGeom /
// gardenBenchHGeom / parkBenchFFEGeom / leftoverLotDirtGeom, not
// a slide of 364 / 94.4 or 357.5 / 94.4. +6.5 m off 364
// (364 + 6.5 = 370.5). Mirror of 357.5 (364 − 6.5). Width 1.8
// → x0=369.6, x1=371.4. East end 371.4 MUST stay inside hull
// x1=372. Yaw faces +Z / toward the FF spine at z=96.
// PARK_BENCH_FF_E_YAW is PARK_BENCH_FF_YAW (0) so the shared
// geom does not fork. 0.8 m is the 82.4 convention:
// center-to-spine (spine z0=95.2; 95.2 − 0.8 = 94.4). Lives on
// the signed 364/96 hull (356–372 × 92–100) by design. Misses
// leftoverLot F (F z1=90). Does not merge with E-park 355.
// Kiss 364/94.4 / 357.5/94.4 / 356→372 / z=96 spine /
// leftoverLot F / E-park / helipad / 347 / sit-box filled =
// drop, never nudge. 364/94.4 stays. 357.5/94.4 stays.
// 364/98.5 pergola stays. FF spine 356→372 / z=96 stays. West
// walk 356→362.2 / z=98.5 stays. East walk 365.8→372 / z=98.5
// stays. 276 park and all 276 walks/benches/pergola stay.
// 347 park and all 347 walks/benches/pergola stay.
// leftoverLot A–F stay 258 / 295 / 313 / 330 / 347 / 364 at
// z=84. E leftover stays 8000–11000. F leftover after the
// walks is 8000–11000 (~8.2k). 11k is a ceiling. Do not
// backfill. No leftover lots on this merge. Bench plate is
// ~0.8 m² — do not restack the grass floor. Scatter still
// uses tryPlace.
export const PARK_BENCH_FF_E_X = 370.5;
export const PARK_BENCH_FF_E_Z = 94.4;
export const PARK_BENCH_FF_E_YAW = PARK_BENCH_FF_YAW;
export const PARK_BENCH_FF_E_W = GARDEN_BENCH_W;
export const PARK_BENCH_FF_E_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_FF_E_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_FF_E_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_FF_E_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_FF_E_X0 = PARK_BENCH_FF_E_X - PARK_BENCH_FF_E_W / 2;
export const PARK_BENCH_FF_E_X1 = PARK_BENCH_FF_E_X + PARK_BENCH_FF_E_W / 2;
export const PARK_BENCH_FF_E_Z0 = PARK_BENCH_FF_E_Z - PARK_BENCH_FF_E_DEPTH / 2;
export const PARK_BENCH_FF_E_Z1 = PARK_BENCH_FF_E_Z + PARK_BENCH_FF_E_DEPTH / 2;

// ---- G-park bench (same Tiny Glade 3-seat slat kit; signed 381 / 94.4) ----
// Desi signed the cell. 364 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenBenchGeom / gardenBenchParts
// — not gardenBenchEGeom / gardenBenchFGeom / gardenBenchGGeom /
// parkBenchGGGeom / leftoverLotDirtGeom, not a slide of 364 / 94.4.
// Yaw faces +Z / ocean-of-walk toward the GG spine (z=96).
// PARK_BENCH_GG_YAW is PARK_BENCH_FF_YAW (0) so the shared geom
// does not fork or flip 276/82.4 / 276/90 / 269.5 / 282.5 /
// 347/94.4 / 364/94.4. 0.8 m is the 82.4 convention:
// center-to-spine (spine z0=95.2; 95.2 − 0.8 = 94.4), not the
// 269.5 edge-to-walk rule. Misses leftoverLot G (G z1=90). Sits
// on the G park hull by design (373–389 × 92–100). Does not
// merge with F-park 372. Kiss 373→389 / z=96 spine / leftoverLot G
// / F-park / helipad / 364 / sit-box filled = drop, never nudge.
// Existing benches stay 276/82.4, 276/90, 269.5/90, 282.5/90,
// 347/94.4, 340.5/94.4, 353.5/94.4, 364/94.4, 357.5/94.4,
// 370.5/94.4. Walks stay 84 / west 268→274.2 / east 277.8→284 /
// N-S 272 / N-S 280 / EE 339→355 / z=96 / FF 356→372 / z=96 /
// GG 373→389 / z=96. A–G lots stay 258 / 295 / 313 / 330 / 347 /
// 364 / 381 at z=84. 276 park stays 268–284 × 88–96. 347 park
// stays 339–355 × 92–100. F-park hull stays 364/96. E leftover
// stays 8000–11000. F leftover stays 8000–11000. G leftover after
// the walks is 8000–11000 (~8.2k). 11k is a ceiling. Do not
// backfill. No leftover lots on this merge. Never leftoverLotDirtGeom
// / gardenPathGGeom. Bench plate is ~0.8 m² — do not restack the
// grass floor. Scatter still uses tryPlace.
export const PARK_BENCH_GG_X = 381;
export const PARK_BENCH_GG_Z = 94.4;
export const PARK_BENCH_GG_YAW = PARK_BENCH_FF_YAW;
export const PARK_BENCH_GG_W = GARDEN_BENCH_W;
export const PARK_BENCH_GG_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_GG_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_GG_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_GG_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_GG_X0 = PARK_BENCH_GG_X - PARK_BENCH_GG_W / 2;
export const PARK_BENCH_GG_X1 = PARK_BENCH_GG_X + PARK_BENCH_GG_W / 2;
export const PARK_BENCH_GG_Z0 = PARK_BENCH_GG_Z - PARK_BENCH_GG_DEPTH / 2;
export const PARK_BENCH_GG_Z1 = PARK_BENCH_GG_Z + PARK_BENCH_GG_DEPTH / 2;

// ---- G-park west bench (same Tiny Glade 3-seat slat kit; signed 374.5 / 94.4) ----
// Desi signed the cell. 364 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenBenchGeom / gardenBenchParts
// — not gardenBenchEGeom / gardenBenchFGeom / gardenBenchGGeom /
// parkBenchGGWGeom / leftoverLotDirtGeom, not a slide of
// 381 / 94.4. −6.5 m off 381 (381 − 6.5 = 374.5). Mirror of
// 364/94.4 west bench. Width 1.8 → x0=373.6, x1=375.4. East
// end 375.4 stays west of 381/94.4 (that bench x0=380.1). Yaw
// faces +Z / toward the GG spine at z=96. PARK_BENCH_GG_W_YAW
// is PARK_BENCH_GG_YAW (0) so the shared geom does not fork.
// 0.8 m is the 82.4 convention: center-to-spine (spine z0=95.2;
// 95.2 − 0.8 = 94.4). Lives on the signed 381/96 hull
// (373–389 × 92–100) by design. West end 373.6 is inside 373.
// Misses leftoverLot G (G z1=90). Does not merge with F-park
// 372. Kiss 381/94.4 / 373→389 / z=96 spine / leftoverLot G /
// F-park / helipad / 364 / sit-box filled = drop, never nudge.
// 381/94.4 stays. 381/98.5 pergola stays. GG spine 373→389 /
// z=96 stays. West walk 373→379.2 / z=98.5 stays. East walk
// 382.8→389 / z=98.5 stays. 276 park and all 276
// walks/benches/pergola stay. 347 park and all 347
// walks/benches/pergola stay. F-park hull and all F kit stay.
// leftoverLot A–G stay 258 / 295 / 313 / 330 / 347 / 364 /
// 381 at z=84. E leftover stays 8000–11000. F leftover stays
// 8000–11000. G leftover after the walks is 8000–11000 (~8.2k).
// 11k is a ceiling. Do not backfill. No leftover lots on this
// merge. Never leftoverLotDirtGeom / gardenPathGGeom. Bench
// plate is ~0.8 m² — do not restack the grass floor. Scatter
// still uses tryPlace.
export const PARK_BENCH_GG_W_X = 374.5;
export const PARK_BENCH_GG_W_Z = 94.4;
export const PARK_BENCH_GG_W_YAW = PARK_BENCH_GG_YAW;
export const PARK_BENCH_GG_W_W = GARDEN_BENCH_W;
export const PARK_BENCH_GG_W_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_GG_W_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_GG_W_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_GG_W_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_GG_W_X0 = PARK_BENCH_GG_W_X - PARK_BENCH_GG_W_W / 2;
export const PARK_BENCH_GG_W_X1 = PARK_BENCH_GG_W_X + PARK_BENCH_GG_W_W / 2;
export const PARK_BENCH_GG_W_Z0 = PARK_BENCH_GG_W_Z - PARK_BENCH_GG_W_DEPTH / 2;
export const PARK_BENCH_GG_W_Z1 = PARK_BENCH_GG_W_Z + PARK_BENCH_GG_W_DEPTH / 2;

// ---- G-park east bench (same Tiny Glade 3-seat slat kit; signed 387.5 / 94.4) ----
// Desi signed the cell. 364 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenBenchGeom / gardenBenchParts
// — not gardenBenchEGeom / gardenBenchFGeom / gardenBenchGGeom /
// gardenBenchHGeom / parkBenchGGEGeom / leftoverLotDirtGeom, not
// a slide of 381 / 94.4 or 374.5 / 94.4. +6.5 m off 381
// (381 + 6.5 = 387.5). Mirror of 374.5 (381 − 6.5). Width 1.8
// → x0=386.6, x1=388.4. East end 388.4 MUST stay inside hull
// x1=389. Yaw faces +Z / toward the GG spine at z=96.
// PARK_BENCH_GG_E_YAW is PARK_BENCH_GG_YAW (0) so the shared
// geom does not fork. 0.8 m is the 82.4 convention:
// center-to-spine (spine z0=95.2; 95.2 − 0.8 = 94.4). Lives on
// the signed 381/96 hull (373–389 × 92–100) by design. Misses
// leftoverLot G (G z1=90). Does not merge with F-park 372.
// Kiss 381/94.4 / 374.5/94.4 / 373→389 / z=96 spine /
// leftoverLot G / F-park / helipad / 364 / sit-box filled =
// drop, never nudge. 381/94.4 stays. 374.5/94.4 stays.
// 381/98.5 pergola stays. GG spine 373→389 / z=96 stays. West
// walk 373→379.2 / z=98.5 stays. East walk 382.8→389 / z=98.5
// stays. 276 park and all 276 walks/benches/pergola stay.
// 347 park and all 347 walks/benches/pergola stay. F-park hull
// and all F kit stay. leftoverLot A–G stay 258 / 295 / 313 /
// 330 / 347 / 364 / 381 at z=84. E leftover stays 8000–11000.
// F leftover stays 8000–11000. G leftover after the walks is
// 8000–11000 (~8.2k). 11k is a ceiling. Do not backfill. No
// leftover lots on this merge. Never leftoverLotDirtGeom /
// gardenPathGGeom. Bench plate is ~0.8 m² — do not restack the
// grass floor. Scatter still uses tryPlace.
export const PARK_BENCH_GG_E_X = 387.5;
export const PARK_BENCH_GG_E_Z = 94.4;
export const PARK_BENCH_GG_E_YAW = PARK_BENCH_GG_YAW;
export const PARK_BENCH_GG_E_W = GARDEN_BENCH_W;
export const PARK_BENCH_GG_E_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_GG_E_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_GG_E_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_GG_E_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_GG_E_X0 = PARK_BENCH_GG_E_X - PARK_BENCH_GG_E_W / 2;
export const PARK_BENCH_GG_E_X1 = PARK_BENCH_GG_E_X + PARK_BENCH_GG_E_W / 2;
export const PARK_BENCH_GG_E_Z0 = PARK_BENCH_GG_E_Z - PARK_BENCH_GG_E_DEPTH / 2;
export const PARK_BENCH_GG_E_Z1 = PARK_BENCH_GG_E_Z + PARK_BENCH_GG_E_DEPTH / 2;

// ---- H-park bench (same Tiny Glade 3-seat slat kit; signed 398 / 94.4) ----
// Desi signed the cell. 381 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenBenchGeom / gardenBenchParts
// — not gardenBenchEGeom / gardenBenchFGeom / gardenBenchGGeom /
// gardenBenchHGeom / parkBenchHHGeom / leftoverLotDirtGeom, not a
// slide of 381 / 94.4. Yaw faces +Z / ocean-of-walk toward the
// HH spine (z=96). PARK_BENCH_HH_YAW is PARK_BENCH_GG_YAW (0) so
// the shared geom does not fork or flip 276/82.4 / 276/90 /
// 269.5 / 282.5 / 347/94.4 / 364/94.4 / 381/94.4. 0.8 m is the
// 82.4 convention: center-to-spine (spine z0=95.2; 95.2 − 0.8
// = 94.4), not the 269.5 edge-to-walk rule. Misses leftoverLot H
// (H z1=90). Sits on the H park hull by design (390–406 ×
// 92–100). Does not merge with G-park 389. Kiss 390→406 / z=96
// spine / leftoverLot H / G-park / helipad / 381 / sit-box
// filled = drop, never nudge. Existing benches stay 276/82.4,
// 276/90, 269.5/90, 282.5/90, 347/94.4, 340.5/94.4, 353.5/94.4,
// 364/94.4, 357.5/94.4, 370.5/94.4, 381/94.4, 374.5/94.4,
// 387.5/94.4. Walks stay 84 / west 268→274.2 / east 277.8→284 /
// N-S 272 / N-S 280 / EE 339→355 / z=96 / FF 356→372 / z=96 /
// GG 373→389 / z=96 / HH 390→406 / z=96. A–H lots stay 258 /
// 295 / 313 / 330 / 347 / 364 / 381 / 398 at z=84. 276 park
// stays 268–284 × 88–96. 347 park stays 339–355 × 92–100.
// F-park hull stays 364/96. G-park hull stays 381/96. E leftover
// stays 8000–11000. F leftover stays 8000–11000. G leftover
// stays 8000–11000. H leftover after the walks is 8000–11000
// (~8.2k). 11k is a ceiling. Do not backfill. No leftover lots
// on this merge. Never leftoverLotDirtGeom / gardenPathHGeom.
// Bench plate is ~0.8 m² — do not restack the grass floor.
// Scatter still uses tryPlace.
export const PARK_BENCH_HH_X = 398;
export const PARK_BENCH_HH_Z = 94.4;
export const PARK_BENCH_HH_YAW = PARK_BENCH_GG_YAW;
export const PARK_BENCH_HH_W = GARDEN_BENCH_W;
export const PARK_BENCH_HH_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_HH_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_HH_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_HH_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_HH_X0 = PARK_BENCH_HH_X - PARK_BENCH_HH_W / 2;
export const PARK_BENCH_HH_X1 = PARK_BENCH_HH_X + PARK_BENCH_HH_W / 2;
export const PARK_BENCH_HH_Z0 = PARK_BENCH_HH_Z - PARK_BENCH_HH_DEPTH / 2;
export const PARK_BENCH_HH_Z1 = PARK_BENCH_HH_Z + PARK_BENCH_HH_DEPTH / 2;

// ---- H-park west bench (same Tiny Glade 3-seat slat kit; signed 391.5 / 94.4) ----
// Desi signed the cell. 381 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenBenchGeom / gardenBenchParts
// — not gardenBenchEGeom / gardenBenchFGeom / gardenBenchGGeom /
// gardenBenchHGeom / parkBenchHHWGeom / leftoverLotDirtGeom, not
// a slide of 398 / 94.4. −6.5 m off 398 (398 − 6.5 = 391.5).
// Mirror of 381/94.4 west bench. Width 1.8 → x0=390.6, x1=392.4.
// East end 392.4 stays west of 398/94.4 (that bench x0=397.1).
// Yaw faces +Z / toward the HH spine at z=96.
// PARK_BENCH_HH_W_YAW is PARK_BENCH_HH_YAW (0) so the shared
// geom does not fork. 0.8 m is the 82.4 convention:
// center-to-spine (spine z0=95.2; 95.2 − 0.8 = 94.4). Lives on
// the signed 398/96 hull (390–406 × 92–100) by design. West
// end 390.6 is inside 390. Misses leftoverLot H (H z1=90).
// Does not merge with G-park 389. Kiss 398/94.4 / 390→406 /
// z=96 spine / leftoverLot H / G-park / helipad / 381 /
// sit-box filled = drop, never nudge. 398/94.4 stays.
// 398/98.5 pergola stays. HH spine 390→406 / z=96 stays.
// West walk 390→396.2 / z=98.5 stays. East walk 399.8→406 /
// z=98.5 stays. 276 park and all 276 walks/benches/pergola
// stay. 347 park and all 347 walks/benches/pergola stay.
// F-park hull and all F kit stay. G-park hull and all G kit
// stay. leftoverLot A–H stay 258 / 295 / 313 / 330 / 347 /
// 364 / 381 / 398 at z=84. E leftover stays 8000–11000. F
// leftover stays 8000–11000. G leftover stays 8000–11000. H
// leftover after the walks is 8000–11000 (~8.2k). 11k is a
// ceiling. Do not backfill. No leftover lots on this merge.
// Never leftoverLotDirtGeom / gardenPathHGeom. Bench plate is
// ~0.8 m² — do not restack the grass floor. Scatter still
// uses tryPlace.
export const PARK_BENCH_HH_W_X = 391.5;
export const PARK_BENCH_HH_W_Z = 94.4;
export const PARK_BENCH_HH_W_YAW = PARK_BENCH_HH_YAW;
export const PARK_BENCH_HH_W_W = GARDEN_BENCH_W;
export const PARK_BENCH_HH_W_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_HH_W_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_HH_W_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_HH_W_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_HH_W_X0 = PARK_BENCH_HH_W_X - PARK_BENCH_HH_W_W / 2;
export const PARK_BENCH_HH_W_X1 = PARK_BENCH_HH_W_X + PARK_BENCH_HH_W_W / 2;
export const PARK_BENCH_HH_W_Z0 = PARK_BENCH_HH_W_Z - PARK_BENCH_HH_W_DEPTH / 2;
export const PARK_BENCH_HH_W_Z1 = PARK_BENCH_HH_W_Z + PARK_BENCH_HH_W_DEPTH / 2;

// ---- H-park east bench (same Tiny Glade 3-seat slat kit; signed 404.5 / 94.4) ----
// Desi signed the cell. 381 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenBenchGeom / gardenBenchParts
// — not gardenBenchEGeom / gardenBenchFGeom / gardenBenchGGeom /
// gardenBenchHGeom / parkBenchHHEGeom / leftoverLotDirtGeom, not
// a slide of 398 / 94.4 or 391.5 / 94.4. +6.5 m off 398
// (398 + 6.5 = 404.5). Mirror of 391.5 (398 − 6.5). Width 1.8
// → x0=403.6, x1=405.4. East end 405.4 MUST stay inside hull
// x1=406. Yaw faces +Z / toward the HH spine at z=96.
// PARK_BENCH_HH_E_YAW is PARK_BENCH_HH_YAW (0) so the shared
// geom does not fork. 0.8 m is the 82.4 convention:
// center-to-spine (spine z0=95.2; 95.2 − 0.8 = 94.4). Lives on
// the signed 398/96 hull (390–406 × 92–100) by design. Misses
// leftoverLot H (H z1=90). Does not merge with G-park 389.
// Kiss 398/94.4 / 391.5/94.4 / 390→406 / z=96 spine /
// leftoverLot H / G-park / helipad / 381 / sit-box filled =
// drop, never nudge. 398/94.4 stays. 391.5/94.4 stays.
// 398/98.5 pergola stays. HH spine 390→406 / z=96 stays. West
// walk 390→396.2 / z=98.5 stays. East walk 399.8→406 / z=98.5
// stays. 276 park and all 276 walks/benches/pergola stay.
// 347 park and all 347 walks/benches/pergola stay. F-park hull
// and all F kit stay. G-park hull and all G kit stay.
// leftoverLot A–H stay 258 / 295 / 313 / 330 / 347 / 364 /
// 381 / 398 at z=84. E leftover stays 8000–11000. F leftover
// stays 8000–11000. G leftover stays 8000–11000. H leftover
// after the walks is 8000–11000 (~8.2k). 11k is a ceiling. Do
// not backfill. No leftover lots on this merge. Never
// leftoverLotDirtGeom / gardenPathHGeom. Bench plate is
// ~0.8 m² — do not restack the grass floor. Scatter still
// uses tryPlace.
export const PARK_BENCH_HH_E_X = 404.5;
export const PARK_BENCH_HH_E_Z = 94.4;
export const PARK_BENCH_HH_E_YAW = PARK_BENCH_HH_YAW;
export const PARK_BENCH_HH_E_W = GARDEN_BENCH_W;
export const PARK_BENCH_HH_E_DEPTH = GARDEN_BENCH_DEPTH;
export const PARK_BENCH_HH_E_SEAT_H = GARDEN_BENCH_SEAT_H;
export const PARK_BENCH_HH_E_BACK_H = GARDEN_BENCH_BACK_H;
export const PARK_BENCH_HH_E_UNDER_CLEAR = GARDEN_BENCH_UNDER_CLEAR;
export const PARK_BENCH_HH_E_X0 = PARK_BENCH_HH_E_X - PARK_BENCH_HH_E_W / 2;
export const PARK_BENCH_HH_E_X1 = PARK_BENCH_HH_E_X + PARK_BENCH_HH_E_W / 2;
export const PARK_BENCH_HH_E_Z0 = PARK_BENCH_HH_E_Z - PARK_BENCH_HH_E_DEPTH / 2;
export const PARK_BENCH_HH_E_Z1 = PARK_BENCH_HH_E_Z + PARK_BENCH_HH_E_DEPTH / 2;

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
// Second hull at signed 347/96, same 16×8 kit, bounds 339–355 × 92–100.
// Third hull at signed 364/96, same 16×8 kit, bounds 356–372 × 92–100.
// Fourth hull at signed 381/96, same 16×8 kit, bounds 373–389 × 92–100.
// Fifth hull at signed 398/96, same 16×8 kit, bounds 390–406 × 92–100.
// Same pocketParkHull — never pocketParkEGeom, never pocketParkFGeom,
// never pocketParkGGeom, never pocketParkHGeom, never leftoverLotDirtGeom, never a slide
// of 276 / 347 / 364 / 381. Desi + Reesy signed all five cells. Do not
// invent or slide x/z. Five hulls inland of the garden strip /
// leftoverLot E / leftoverLot F / leftoverLot G / leftoverLot H, not OSM, not
// leftover-dirt 190k, not a leftoverLot / path / bench /
// leftoverGrass restack. Path stays 268→284 / z=84 / 1.6 m
// (z1=84.8). 276 z0=88 sits inland of the path — do not slide
// that hull onto the path.
// leftoverLot A 258/84, B 295/84, C 313/84, D 330/84, E 347/84,
// F 364/84, G 381/84, H 398/84. leftoverLot A–H stay.
// E park sits 2 m inland of leftoverLot E (E z1=90, park z0=92).
// x 339–355 is a 1 m leftover apron past E’s 340–354 — not a
// leftoverLotOverlap kiss. F park sits 2 m inland of leftoverLot F
// (F z1=90, park z0=92). x 356–372 is 1 m past F’s 357–371 —
// leftoverLotOverlap of F reserved is 0 (1 m leftover apron, not
// a kiss; oz = −0.6 vs reserved z1+1.4 = 91.4). E-park x1=355
// must not merge with this hull (F x0=356, 1 m west gap, same z
// band). Do not merge the two hulls into one plate. G park sits
// 2 m inland of leftoverLot G (G z1=90, park z0=92). x 373–389
// is 1 m past G’s 374–388 — leftoverLotOverlap of G reserved
// is 0 (1 m leftover apron, not a kiss; oz = −0.6 vs reserved
// z1+1.4 = 91.4). F-park x1=372 must not merge with this hull
// (G x0=373, 1 m east gap, same z band). Do not merge the two
// hulls into one plate. H park sits 2 m inland of leftoverLot H
// (H z1=90, park z0=92). x 390–406 is 1 m past H’s 391–405 —
// leftoverLotOverlap of H reserved is 0 (1 m leftover apron, not
// a kiss; oz = −0.6 vs reserved z1+1.4 = 91.4). G-park x1=389
// must not merge with this hull (H x0=390, 1 m east gap, same z
// band). Do not merge the two hulls into one plate. 276 park stays
// (x1=284 < 339). 347 park stays (x1=355 < 356). 364 park stays
// (x1=372 < 373). 381 park stays (x1=389 < 390). Bench
// stays 276 / 82.4. leftoverGrass stays 267–285 / 81–86. Scatter
// stays on tryPlace; this reservation is one more keepout, not a
// second placer. Blade H 0.12–0.22 m (unmowed St. Augustine) so it
// reads at 8–25 m. A 50 mm lawn disappears — do not ship that.
// Empty-park 10–13k is dead on 276. Leftover after walks is the
// honest 276 cell: 8000–11000. Do not restack the 276 kit or raise
// its cover. E empty-hull 10000–13000 is dead after the 339→355 /
// z=96 spine (walk eats ~26 m²). Honest leftover on the E hull is
// ~102 m² → ~10k. The 339→345.2 / z=98.5 west walk eats ~10 m²
// more; leftover stayed 9000–11000. The 348.8→355 / z=98.5 east
// walk eats ~10 m² more. Reesy signed the leftover band at
// 8000–11000 (~8.2k expected from 9248 minus ~10 m²). The
// 340.5 / 94.4 west bench plate is ~0.8 m² — do not restack
// the grass floor. The 353.5 / 94.4 east bench plate is the
// same ~0.8 m² — do not restack the grass floor. Do not
// backfill to 12800. Do not change
// MIN/MAX. POCKET_PARK_E_INSTANCES is that leftover
// band (8000–11000), not the empty 10000–13000. F empty-hull
// 10000–13000 is dead after the 356→372 / z=96 spine (walk
// eats ~26 m² of 128 m²). The 347 kit +17 m (west 356→362.2
// / z=98.5, east 365.8→372 / z=98.5) eats ~20 m² more.
// Three walks eat ~45 m² → leftover ~8.2k. Reesy signed the
// leftover band at 8000–11000. 11k is a ceiling. Do not
// backfill to 12800. Do not merge E-park 355. Do not change
// E leftover 8000–11000. 276 stays 8–11k. No leftover lots
// on this merge. POCKET_PARK_F_INSTANCES is that leftover
// band after the walks, not a forced 12800. G empty-hull
// 10000–13000 is dead after the 373→389 / z=96 spine (walk
// eats ~26 m² of 128 m²). The 364 kit +17 m (west 373→379.2
// / z=98.5, east 382.8→389 / z=98.5) eats ~20 m² more.
// Three walks eat ~45 m² → leftover ~8.2k. Reesy signed the
// leftover band at 8000–11000. 11k is a ceiling. Do not
// backfill to 12800. Do not merge F-park 372. Do not change
// E leftover 8000–11000 or F leftover 8000–11000. 276 stays
// 8–11k. No leftover lots on this merge. Do not leave G at
// empty-hull 10000–13000. POCKET_PARK_G_INSTANCES is that
// leftover band after the walks, not a forced 12800.
// leftoverLot A–G stay. never pocketParkGGeom /
// leftoverLotDirtGeom / gardenPathGGeom.
// H empty-hull 10000–13000 is dead after the 390→406 / z=96
// spine (walk eats ~26 m² of 128 m²). The 381 kit +17 m
// (west 390→396.2 / z=98.5, east 399.8→406 / z=98.5) eats
// ~20 m² more. Three walks eat ~45 m² → leftover ~8.2k.
// Reesy signed the leftover band at 8000–11000. 11k is a
// ceiling. Do not backfill to 12800. Do not merge G-park 389.
// Do not change E leftover 8000–11000, F leftover 8000–11000,
// or G leftover 8000–11000. 276 stays 8–11k. No leftover lots
// on this merge. Do not leave H at empty-hull 10000–13000.
// POCKET_PARK_H_INSTANCES is that leftover band after the
// walks, not a forced 12800. leftoverLot A–H stay. never
// pocketParkHGeom / leftoverLotDirtGeom / gardenPathHGeom.
// Lean at nearest leftoverLot fence (including E, 2 m inland, and
// F, 2 m inland of F-park / 2 m east / 2 m ocean of the E-park,
// and G, 2 m inland of G-park, and H, 2 m inland of H-park)
// or garden path if it reaches. Collider is the thin grade hull
// only.
// Blades are visual.
// A 0.3 m pad AABB fails. Never per-blade colliders.
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
export const POCKET_PARK_INSTANCES_MIN = 8000;
export const POCKET_PARK_INSTANCES_MAX = 11000;
export const POCKET_PARK_E_X0 = 339;
export const POCKET_PARK_E_X1 = 355;
export const POCKET_PARK_E_Z0 = 92;
export const POCKET_PARK_E_Z1 = 100;
export const POCKET_PARK_E_X = 347;
export const POCKET_PARK_E_Z = 96;
export const POCKET_PARK_E_W = 16;
export const POCKET_PARK_E_D = 8;
export const POCKET_PARK_E_INSTANCES_MIN = 8000;
export const POCKET_PARK_E_INSTANCES_MAX = 11000;
export const POCKET_PARK_F_X0 = 356;
export const POCKET_PARK_F_X1 = 372;
export const POCKET_PARK_F_Z0 = 92;
export const POCKET_PARK_F_Z1 = 100;
export const POCKET_PARK_F_X = 364;
export const POCKET_PARK_F_Z = 96;
export const POCKET_PARK_F_W = 16;
export const POCKET_PARK_F_D = 8;
export const POCKET_PARK_F_INSTANCES_MIN = 8000;
export const POCKET_PARK_F_INSTANCES_MAX = 11000;
export const POCKET_PARK_G_X0 = 373;
export const POCKET_PARK_G_X1 = 389;
export const POCKET_PARK_G_Z0 = 92;
export const POCKET_PARK_G_Z1 = 100;
export const POCKET_PARK_G_X = 381;
export const POCKET_PARK_G_Z = 96;
export const POCKET_PARK_G_W = 16;
export const POCKET_PARK_G_D = 8;
export const POCKET_PARK_G_INSTANCES_MIN = 8000;
export const POCKET_PARK_G_INSTANCES_MAX = 11000;
export const POCKET_PARK_H_X0 = 390;
export const POCKET_PARK_H_X1 = 406;
export const POCKET_PARK_H_Z0 = 92;
export const POCKET_PARK_H_Z1 = 100;
export const POCKET_PARK_H_X = 398;
export const POCKET_PARK_H_Z = 96;
export const POCKET_PARK_H_W = 16;
export const POCKET_PARK_H_D = 8;
export const POCKET_PARK_H_INSTANCES_MIN = 8000;
export const POCKET_PARK_H_INSTANCES_MAX = 11000;
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

// ---- E-park pergola (same boardwalk-gate kit; signed 347 / 98.5) ----
// Desi + Reesy signed the cell. Do not invent or slide x/z. Never nudge.
// Same boardwalkGateGeom / posts + lintel — not pergolaGeom, not
// parkPergolaGeom, not parkPergolaEEGeom, not boardwalkGateEGeom, not
// a slide of 276/94 or GATE_X/GATE_Z. Opening height 2.20 m (whoop
// sash). Fly along +X. Opening is empty air — never a filled sash
// AABB. Collider ⊆ posts + lintel (jamb/lip), not the fly-through.
// Collider ⊆ visual ±0.15 m. Half-span is GATE_HALF_Z (1.16) — do
// not grow it. Half-span ≥ 2 m would exit the E park at z=100 —
// drop, never slide. Z-span 97.34–99.66 stays 0.34 m inside 100
// and 0.54 m off the EE spine z1=96.8. Bench 347/94.4 is ~3 m
// south of the south post. If the Z-span kisses the bench or the
// 339→355 / z=96 spine, drop, never nudge. Kiss leftoverLot E /
// helipad / warehouse / 276 park / 276/94 pergola = drop, never
// nudge. 276 park stays 268–284 × 88–96. 276/94 pergola stays.
// 347/94.4 bench stays. EE spine stays 339→355 / z=96. A–E lots
// stay 258 / 295 / 313 / 330 / 347 at z=84. E leftover band stays
// 9000–11000. Do not backfill. Scatter still uses tryPlace.
export const PARK_PERGOLA_EE_X = 347;
export const PARK_PERGOLA_EE_Z = 98.5;
export const PARK_PERGOLA_EE_OPEN_H = GATE_POST_H;
export const PARK_PERGOLA_EE_FLY = '+X';
export const PARK_PERGOLA_EE_HALF_X = GATE_HALF_X;
export const PARK_PERGOLA_EE_HALF_Z = GATE_HALF_Z;
export const PARK_PERGOLA_EE_POST_R = GATE_POST_R;
export const PARK_PERGOLA_EE_POST_H = GATE_POST_H;
export const PARK_PERGOLA_EE_BEAM_H = GATE_BEAM_H;
export const PARK_PERGOLA_EE_BEAM_W = GATE_BEAM_W;
export const PARK_PERGOLA_EE_W = GATE_HALF_X * 2;
export const PARK_PERGOLA_EE_D = GATE_HALF_Z * 2;
export const PARK_PERGOLA_EE_COLLIDER_PAD = PARK_PERGOLA_COLLIDER_PAD;
export const PARK_PERGOLA_EE_AABB = false;
export const PARK_PERGOLA_EE_X0 = PARK_PERGOLA_EE_X - PARK_PERGOLA_EE_W / 2;
export const PARK_PERGOLA_EE_X1 = PARK_PERGOLA_EE_X + PARK_PERGOLA_EE_W / 2;
export const PARK_PERGOLA_EE_Z0 = PARK_PERGOLA_EE_Z - PARK_PERGOLA_EE_D / 2;
export const PARK_PERGOLA_EE_Z1 = PARK_PERGOLA_EE_Z + PARK_PERGOLA_EE_D / 2;

// ---- F-park pergola (same boardwalk-gate kit; signed 364 / 98.5) ----
// Desi + Reesy signed the cell. 347 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same boardwalkGateGeom / posts + lintel
// — not pergolaGeom, not parkPergolaGeom, not parkPergolaEEGeom,
// not parkPergolaFGeom, not boardwalkGateEGeom, not
// leftoverLotDirtGeom, not a slide of 347/98.5 or 276/94.
// Opening height 2.20 m (whoop sash). Fly along +X. Opening is
// empty air — never a filled sash AABB. Collider ⊆ posts +
// lintel (jamb/lip), not the fly-through. Collider ⊆ visual
// ±0.15 m. Half-span is GATE_HALF_Z (1.16) — do not grow it.
// Half-span ≥ 2 m would exit the F park at z=100 — drop, never
// slide. Z-span 97.34–99.66 stays 0.34 m inside 100 and 0.54 m
// off the FF spine z1=96.8. Bench 364/94.4 is ~3 m south of the
// south post. If the Z-span kisses the bench or the 356→372 /
// z=96 spine, drop, never nudge. Does not merge with E-park
// 355. Kiss leftoverLot F / E-park / helipad / 347 / 347/98.5
// / sash filled = drop, never nudge. 276 park stays
// 268–284 × 88–96. 276/94 pergola stays. 347/98.5 pergola
// stays. 347/94.4 bench stays. EE spine stays 339→355 / z=96.
// FF spine stays 356→372 / z=96. A–F lots stay 258 / 295 /
// 313 / 330 / 347 / 364 at z=84. E leftover stays 8000–11000.
// F leftover after the walks is 8000–11000 (~8.2k). 11k is a
// ceiling. Do not backfill. No leftover lots on this merge.
// Scatter still uses tryPlace.
export const PARK_PERGOLA_FF_X = 364;
export const PARK_PERGOLA_FF_Z = 98.5;
export const PARK_PERGOLA_FF_OPEN_H = GATE_POST_H;
export const PARK_PERGOLA_FF_FLY = '+X';
export const PARK_PERGOLA_FF_HALF_X = GATE_HALF_X;
export const PARK_PERGOLA_FF_HALF_Z = GATE_HALF_Z;
export const PARK_PERGOLA_FF_POST_R = GATE_POST_R;
export const PARK_PERGOLA_FF_POST_H = GATE_POST_H;
export const PARK_PERGOLA_FF_BEAM_H = GATE_BEAM_H;
export const PARK_PERGOLA_FF_BEAM_W = GATE_BEAM_W;
export const PARK_PERGOLA_FF_W = GATE_HALF_X * 2;
export const PARK_PERGOLA_FF_D = GATE_HALF_Z * 2;
export const PARK_PERGOLA_FF_COLLIDER_PAD = PARK_PERGOLA_COLLIDER_PAD;
export const PARK_PERGOLA_FF_AABB = false;
export const PARK_PERGOLA_FF_X0 = PARK_PERGOLA_FF_X - PARK_PERGOLA_FF_W / 2;
export const PARK_PERGOLA_FF_X1 = PARK_PERGOLA_FF_X + PARK_PERGOLA_FF_W / 2;
export const PARK_PERGOLA_FF_Z0 = PARK_PERGOLA_FF_Z - PARK_PERGOLA_FF_D / 2;
export const PARK_PERGOLA_FF_Z1 = PARK_PERGOLA_FF_Z + PARK_PERGOLA_FF_D / 2;

// ---- G-park pergola (same boardwalk-gate kit; signed 381 / 98.5) ----
// Desi signed the cell. 364 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same boardwalkGateGeom / posts + lintel
// — not pergolaGeom, not parkPergolaGeom, not parkPergolaEEGeom,
// not parkPergolaFGeom, not parkPergolaGGeom, not boardwalkGateEGeom,
// not leftoverLotDirtGeom, not a slide of 364/98.5 or 347/98.5
// or 276/94. Opening height 2.20 m (whoop sash). Fly along +X.
// Opening is empty air — never a filled sash AABB. Collider ⊆
// posts + lintel (jamb/lip), not the fly-through. Collider ⊆
// visual ±0.15 m. Half-span is GATE_HALF_Z (1.16) — do not grow
// it. Half-span ≥ 2 m would exit the G park at z=100 — drop,
// never slide. Z-span 97.34–99.66 stays 0.34 m inside 100 and
// 0.54 m off the GG spine z1=96.8. Bench 381/94.4 is ~3 m south
// of the south post. If the Z-span kisses the bench or the
// 373→389 / z=96 spine, drop, never nudge. Does not merge with
// F-park 372. Kiss leftoverLot G / F-park / helipad / 364 /
// 364/98.5 / sash filled = drop, never nudge. 276 park stays
// 268–284 × 88–96. 276/94 pergola stays. 347/98.5 pergola
// stays. 364/98.5 pergola stays. 364/94.4 bench stays. EE
// spine stays 339→355 / z=96. FF spine stays 356→372 / z=96.
// GG spine stays 373→389 / z=96. A–G lots stay 258 / 295 /
// 313 / 330 / 347 / 364 / 381 at z=84. E leftover stays
// 8000–11000. F leftover stays 8000–11000. G leftover after
// the walks is 8000–11000 (~8.2k). 11k is a ceiling. Do not
// backfill. No leftover lots on this merge. Never leftoverLotDirtGeom
// / gardenPathGGeom. Scatter still uses tryPlace.
export const PARK_PERGOLA_GG_X = 381;
export const PARK_PERGOLA_GG_Z = 98.5;
export const PARK_PERGOLA_GG_OPEN_H = GATE_POST_H;
export const PARK_PERGOLA_GG_FLY = '+X';
export const PARK_PERGOLA_GG_HALF_X = GATE_HALF_X;
export const PARK_PERGOLA_GG_HALF_Z = GATE_HALF_Z;
export const PARK_PERGOLA_GG_POST_R = GATE_POST_R;
export const PARK_PERGOLA_GG_POST_H = GATE_POST_H;
export const PARK_PERGOLA_GG_BEAM_H = GATE_BEAM_H;
export const PARK_PERGOLA_GG_BEAM_W = GATE_BEAM_W;
export const PARK_PERGOLA_GG_W = GATE_HALF_X * 2;
export const PARK_PERGOLA_GG_D = GATE_HALF_Z * 2;
export const PARK_PERGOLA_GG_COLLIDER_PAD = PARK_PERGOLA_COLLIDER_PAD;
export const PARK_PERGOLA_GG_AABB = false;
export const PARK_PERGOLA_GG_X0 = PARK_PERGOLA_GG_X - PARK_PERGOLA_GG_W / 2;
export const PARK_PERGOLA_GG_X1 = PARK_PERGOLA_GG_X + PARK_PERGOLA_GG_W / 2;
export const PARK_PERGOLA_GG_Z0 = PARK_PERGOLA_GG_Z - PARK_PERGOLA_GG_D / 2;
export const PARK_PERGOLA_GG_Z1 = PARK_PERGOLA_GG_Z + PARK_PERGOLA_GG_D / 2;

// ---- H-park pergola (same boardwalk-gate kit; signed 398 / 98.5) ----
// Desi signed the cell. 381 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same boardwalkGateGeom / posts + lintel
// — not pergolaGeom, not parkPergolaGeom, not parkPergolaEEGeom,
// not parkPergolaFGeom, not parkPergolaGGeom, not parkPergolaHGeom,
// not boardwalkGateEGeom, not leftoverLotDirtGeom, not a slide of
// 381/98.5 or 364/98.5 or 347/98.5 or 276/94. Opening height
// 2.20 m (whoop sash). Fly along +X. Opening is empty air —
// never a filled sash AABB. Collider ⊆ posts + lintel
// (jamb/lip), not the fly-through. Collider ⊆ visual ±0.15 m.
// Half-span is GATE_HALF_Z (1.16) — do not grow it. Half-span
// ≥ 2 m would exit the H park at z=100 — drop, never slide.
// Z-span 97.34–99.66 stays 0.34 m inside 100 and 0.54 m off
// the HH spine z1=96.8. Bench 398/94.4 is ~3 m south of the
// south post. If the Z-span kisses the bench or the 390→406 /
// z=96 spine, drop, never nudge. Does not merge with G-park
// 389. Kiss leftoverLot H / G-park / helipad / 381 / 381/98.5
// / sash filled = drop, never nudge. 276 park stays 268–284 ×
// 88–96. 276/94 pergola stays. 347/98.5 pergola stays.
// 364/98.5 pergola stays. 381/98.5 pergola stays. 381/94.4
// stays. EE spine stays 339→355 / z=96. FF spine stays
// 356→372 / z=96. GG spine stays 373→389 / z=96. HH spine
// stays 390→406 / z=96. A–H lots stay 258 / 295 / 313 / 330 /
// 347 / 364 / 381 / 398 at z=84. E leftover stays 8000–11000.
// F leftover stays 8000–11000. G leftover stays 8000–11000. H
// leftover after the walks is 8000–11000 (~8.2k). 11k is a
// ceiling. Do not backfill. No leftover lots on this merge.
// Never leftoverLotDirtGeom / gardenPathHGeom. Scatter still
// uses tryPlace.
export const PARK_PERGOLA_HH_X = 398;
export const PARK_PERGOLA_HH_Z = 98.5;
export const PARK_PERGOLA_HH_OPEN_H = GATE_POST_H;
export const PARK_PERGOLA_HH_FLY = '+X';
export const PARK_PERGOLA_HH_HALF_X = GATE_HALF_X;
export const PARK_PERGOLA_HH_HALF_Z = GATE_HALF_Z;
export const PARK_PERGOLA_HH_POST_R = GATE_POST_R;
export const PARK_PERGOLA_HH_POST_H = GATE_POST_H;
export const PARK_PERGOLA_HH_BEAM_H = GATE_BEAM_H;
export const PARK_PERGOLA_HH_BEAM_W = GATE_BEAM_W;
export const PARK_PERGOLA_HH_W = GATE_HALF_X * 2;
export const PARK_PERGOLA_HH_D = GATE_HALF_Z * 2;
export const PARK_PERGOLA_HH_COLLIDER_PAD = PARK_PERGOLA_COLLIDER_PAD;
export const PARK_PERGOLA_HH_AABB = false;
export const PARK_PERGOLA_HH_X0 = PARK_PERGOLA_HH_X - PARK_PERGOLA_HH_W / 2;
export const PARK_PERGOLA_HH_X1 = PARK_PERGOLA_HH_X + PARK_PERGOLA_HH_W / 2;
export const PARK_PERGOLA_HH_Z0 = PARK_PERGOLA_HH_Z - PARK_PERGOLA_HH_D / 2;
export const PARK_PERGOLA_HH_Z1 = PARK_PERGOLA_HH_Z + PARK_PERGOLA_HH_D / 2;

// ---- park walk (same Tiny Glade two-abreast kit; signed 268→274.2 / z=94) ----
// Desi + Reesy signed the cell. Do not invent or slide x/z. Never nudge.
// Same gardenPathGeom / gardenPathSlabs — not gardenPathBGeom, not
// parkWalkGeom, not a slide of 268→284 / z=84. Width 1.6 m (z 93.2–94.8).
// Ends 1.8 m west of 276. Pergola posts sit on x=276 (Z half-span 1.16,
// z 92.84–95.16). 274.85 is 276−1.16 — that is the Z number reused as X,
// NOT post x0. Do not extend the walk into the sash. Opening stays empty.
// Flagstones 0.5–0.7 m + 60–100 mm joints. Collider ⊆ each slab.
// Kiss posts / 276/90 / 276/82.4 / leftoverLot A/B/C/D / pavement /
// streetOverlap = drop, never nudge. Garden path stays 268→284 / z=84.
// 276 / 82.4 stays. Pergola stays 276/94. 276/90 stays. Pocket park
// stays 276/92, 16×8 (268–284 × 88–96). leftoverGrass stays 267–285 /
// 81–86. leftoverLot A 258/84, B 295/84, C 313/84, D 330/84.
// Scatter still uses tryPlace.
export const PARK_WALK_X0 = 268;
export const PARK_WALK_X1 = 274.2;
export const PARK_WALK_Z = 94;
export const PARK_WALK_W = GARDEN_PATH_W;
export const PARK_WALK_Z0 = 93.2;
export const PARK_WALK_Z1 = 94.8;
export const PARK_WALK_X = 271.1;
export const PARK_WALK_LEN = 6.2;
export const PARK_WALK_AABB = GARDEN_PATH_AABB;

// ---- east park walk (same Tiny Glade two-abreast kit; signed 277.8→284 / z=94) ----
// Desi + Reesy signed the cell. Do not invent or slide x/z. Never nudge.
// Same gardenPathGeom / gardenPathSlabs — not gardenPathBGeom, not
// parkWalkGeom, not parkWalkEGeom, not a slide of 268→274.2 or of
// 268→284 / z=84. Width 1.6 m (z 93.2–94.8). Length 6.2 m (mirror of
// 268→274.2). Starts 1.8 m east of 276 (276+1.8=277.8). Posts stay on
// x=276. Do not extend the walk into the sash. Opening stays empty.
// Last slab stays inside 284. leftoverLot B starts 288. Do not grow
// past 284. Flagstones 0.5–0.7 m + 60–100 mm joints. Collider ⊆ each
// slab. Kiss posts / 276/90 / 276/82.4 / leftoverLot A/B/C/D /
// pavement / streetOverlap = drop, never nudge. West park walk stays
// 268→274.2 / z=94. Garden path stays 268→284 / z=84. 276 / 82.4
// stays. Pergola stays 276/94. 276/90 stays. Pocket park stays
// 276/92, 16×8 (268–284 × 88–96). leftoverGrass stays 267–285 /
// 81–86. leftoverLot A 258/84, B 295/84, C 313/84, D 330/84.
// Scatter still uses tryPlace.
export const PARK_WALK_E_X0 = 277.8;
export const PARK_WALK_E_X1 = 284;
export const PARK_WALK_E_Z = 94;
export const PARK_WALK_E_W = GARDEN_PATH_W;
export const PARK_WALK_E_Z0 = 93.2;
export const PARK_WALK_E_Z1 = 94.8;
export const PARK_WALK_E_X = 280.9;
export const PARK_WALK_E_LEN = 6.2;
export const PARK_WALK_E_AABB = GARDEN_PATH_AABB;

// ---- N-S park connector (same Tiny Glade two-abreast kit; signed 272 / 85.2→92.8) ----
// Desi + Reesy signed the cell. Do not invent or slide x/z. Never nudge.
// Same gardenPathGeom / gardenPathSlabs — not gardenPathBGeom, not
// parkWalkGeom, not parkWalkEGeom, not parkWalkNSGeom, not a slide of
// 268→274.2 or of 268→284 / z=84. Width 1.6 m (x 271.2–272.8).
// Walks z 85.2→92.8. Near-T, not a kiss: 0.4 m off the 84 walk
// (z1=84.8) and 0.4 m off the west walk (z0=93.2). Those gaps are
// grow-to-gap — do not extend into either slab run. T's the west
// walk in x (272 sits in 268→274.2). Misses 276/90 (~2.3 m) and the
// pergola posts on x=276. Flagstones 0.5–0.7 m + 60–100 mm joints.
// Collider ⊆ each slab. Kiss 84 walk / 276/82.4 / 276/90 / posts /
// z=94 slabs / leftoverLot A/B/C/D / pavement / streetOverlap =
// drop, never nudge. West park walk stays 268→274.2 / z=94. East
// park walk stays 277.8→284 / z=94. Garden path stays 268→284 /
// z=84. 276 / 82.4 stays. Pergola stays 276/94. 276/90 stays.
// Pocket park stays 276/92, 16×8 (268–284 × 88–96). leftoverGrass
// stays 267–285 / 81–86. leftoverLot A 258/84, B 295/84, C 313/84,
// D 330/84. Scatter still uses tryPlace.
export const PARK_WALK_NS_X = 272;
export const PARK_WALK_NS_Z = 89;
export const PARK_WALK_NS_X0 = 271.2;
export const PARK_WALK_NS_X1 = 272.8;
export const PARK_WALK_NS_Z0 = 85.2;
export const PARK_WALK_NS_Z1 = 92.8;
export const PARK_WALK_NS_W = GARDEN_PATH_W;
export const PARK_WALK_NS_LEN = 7.6;
export const PARK_WALK_NS_AABB = GARDEN_PATH_AABB;

// ---- east N-S park connector (same Tiny Glade two-abreast kit; signed 280 / 85.2→92.8) ----
// Desi + Reesy signed the cell. Do not invent or slide x/z. Never nudge.
// Same gardenPathGeom / gardenPathSlabs — not gardenPathBGeom, not
// parkWalkGeom, not parkWalkEGeom, not parkWalkNSGeom, not
// parkWalkNSEGeom, not a slide of 272 or of 268→274.2 or of
// 268→284 / z=84. Width 1.6 m (x 279.2–280.8). Walks z 85.2→92.8.
// Mirror of x=272 (280 is +4 m off 276; 272 is −4). Near-T, not a
// kiss: 0.4 m off the 84 walk (z1=84.8) and 0.4 m off the east walk
// (z0=93.2). Those gaps are grow-to-gap — do not extend into either
// slab run. T's the east walk in x (280 sits in 277.8→284), not 272.
// Misses 276/90 (~2.3 m) and the pergola posts on x=276.
// Flagstones 0.5–0.7 m + 60–100 mm joints. Collider ⊆ each slab.
// Kiss 84 walk / 276/82.4 / 276/90 / posts / z=94 slabs /
// leftoverLot A/B/C/D / pavement / streetOverlap = drop, never
// nudge. West N-S stays x=272, 85.2→92.8. West park walk stays
// 268→274.2 / z=94. East park walk stays 277.8→284 / z=94. Garden
// path stays 268→284 / z=84. 276 / 82.4 stays. Pergola stays
// 276/94. 276/90 stays. Pocket park stays 276/92, 16×8
// (268–284 × 88–96). leftoverGrass stays 267–285 / 81–86.
// leftoverLot A 258/84, B 295/84, C 313/84, D 330/84.
// Scatter still uses tryPlace.
export const PARK_WALK_NS_E_X = 280;
export const PARK_WALK_NS_E_Z = 89;
export const PARK_WALK_NS_E_X0 = 279.2;
export const PARK_WALK_NS_E_X1 = 280.8;
export const PARK_WALK_NS_E_Z0 = 85.2;
export const PARK_WALK_NS_E_Z1 = 92.8;
export const PARK_WALK_NS_E_W = GARDEN_PATH_W;
export const PARK_WALK_NS_E_LEN = 7.6;
export const PARK_WALK_NS_E_AABB = GARDEN_PATH_AABB;

// ---- E-park spine (same Tiny Glade two-abreast kit; signed 339→355 / z=96) ----
// Desi + Reesy signed the cell. Do not invent or slide x/z. Never nudge.
// Same gardenPathGeom / gardenPathSlabs — not gardenPathBGeom, not
// parkWalkGeom, not parkWalkEGeom, not parkWalkE2Geom, not
// parkWalkEEGeom, not gardenPathFGeom, not a slide of 268→284 / z=84
// or of 277.8→284 / z=94. Width 1.6 m (z 95.2–96.8). Length 16 m
// (full 16×1.6 on the 347/96 hull). 6 m inland of leftoverLot E
// (E z1=90; walk centre z=96). Last slab stays inside 355. Do not
// grow past 355. Flagstones 0.5–0.7 m + 60–100 mm joints. Collider
// ⊆ each slab. Kiss leftoverLot E / helipad / warehouse / 276 park
// / 276 walks / benches / pergola / pavement / streetOverlap =
// drop, never nudge. Walk eats ~26 m². Leftover on the E park hull
// ~102 m² → ~10k. Do not backfill to 12800. 276 park stays
// 268–284 × 88–96. West park walk stays 268→274.2 / z=94. East
// park walk stays 277.8→284 / z=94. N-S stays 272 / 85.2→92.8.
// East N-S stays 280 / 85.2→92.8. Garden path stays 268→284 /
// z=84. leftoverLot A 258/84, B 295/84, C 313/84, D 330/84,
// E 347/84. Scatter still uses tryPlace.
export const PARK_WALK_EE_X0 = 339;
export const PARK_WALK_EE_X1 = 355;
export const PARK_WALK_EE_Z = 96;
export const PARK_WALK_EE_W = GARDEN_PATH_W;
export const PARK_WALK_EE_Z0 = 95.2;
export const PARK_WALK_EE_Z1 = 96.8;
export const PARK_WALK_EE_X = 347;
export const PARK_WALK_EE_LEN = 16;
export const PARK_WALK_EE_AABB = GARDEN_PATH_AABB;

// ---- E-park west walk (same Tiny Glade two-abreast kit; signed 339→345.2 / z=98.5) ----
// Desi + Reesy signed the cell. Do not invent or slide x/z. Never nudge.
// Same gardenPathGeom / gardenPathSlabs — not gardenPathBGeom, not
// parkWalkGeom, not parkWalkEGeom, not parkWalkE2Geom, not
// parkWalkEEGeom, not parkWalkEEWGeom, not gardenPathFGeom, not
// gardenPathGGeom, not parkWalkFGeom, not a slide of 268→274.2 /
// z=94 or of 339→355 / z=96. Width 1.6 m (z 97.7–99.3). Length
// 6.2 m (mirror of 268→274.2 / z=94). Ends 1.8 m west of 347.
// Posts sit on x=347 (Z half-span 1.16). 345.85 is 347−1.16 —
// that is the Z number reused as X, NOT post x0. Do not treat
// 345.2 as post x0. Do not extend the walk into the sash.
// Opening stays empty. Lives on the signed 347/96 hull and sits
// in the sash band in Z the same way 268→274.2 sits in the
// 276/94 sash band — not a fail if it stops short of the posts
// in X. Spine z1=96.8 is 0.9 m south of walk z0=97.7 (grow-to-gap,
// not a kiss). Flagstones 0.5–0.7 m + 60–100 mm joints. Collider
// ⊆ each slab. Kiss posts / EE spine / 347/94.4 / leftoverLot E /
// helipad / warehouse / 276 park = drop, never nudge. This cell
// is not a 276 walk. Walk eats ~10 m². E leftover band after
// the east walk is 8000–11000 (Reesy signed). Do not backfill
// to 12800. 276 park stays
// 268–284 × 88–96. 276 walks stay (including 268→274.2 / z=94).
// 347/98.5 pergola stays. 347/94.4 stays. EE spine stays
// 339→355 / z=96. Garden path stays 268→284 / z=84. leftoverLot
// A 258/84, B 295/84, C 313/84, D 330/84, E 347/84. Scatter
// still uses tryPlace.
export const PARK_WALK_EE_W_X0 = 339;
export const PARK_WALK_EE_W_X1 = 345.2;
export const PARK_WALK_EE_W_Z = 98.5;
export const PARK_WALK_EE_W_W = GARDEN_PATH_W;
export const PARK_WALK_EE_W_Z0 = 97.7;
export const PARK_WALK_EE_W_Z1 = 99.3;
export const PARK_WALK_EE_W_X = 342.1;
export const PARK_WALK_EE_W_LEN = 6.2;
export const PARK_WALK_EE_W_AABB = GARDEN_PATH_AABB;

// ---- E-park east walk (same Tiny Glade two-abreast kit; signed 348.8→355 / z=98.5) ----
// Desi + Reesy signed the cell. Do not invent or slide x/z. Never nudge.
// Same gardenPathGeom / gardenPathSlabs — not gardenPathBGeom, not
// parkWalkGeom, not parkWalkEGeom, not parkWalkE2Geom, not
// parkWalkEEGeom, not parkWalkEEWGeom, not parkWalkEEEGeom, not
// gardenPathFGeom, not gardenPathGGeom, not gardenPathHGeom, not
// parkWalkFGeom, not parkWalkGGeom, not a slide of 277.8→284 /
// z=94 or of 339→345.2 / z=98.5 or of 339→355 / z=96. Width
// 1.6 m (z 97.7–99.3). Length 6.2 m (mirror of 277.8→284 / z=94;
// east twin of 339→345.2 / z=98.5). Starts 1.8 m east of 347
// (347+1.8=348.8). Posts sit on x=347 (GATE_HALF_X = 1.15).
// Post x1 is 348.15. Walk x0 348.8 is 0.65 m east of the post —
// do not treat 348.8 as post x1. Do not extend the walk into the
// sash. Opening stays empty. Last slab x1 ≤ 355. Do not grow
// past 355. Lives on the signed 347/96 hull and sits in the sash
// band in Z the same way 277.8→284 sits in the 276/94 sash band
// — not a fail if it starts east of the posts in X. Spine
// z1=96.8 is 0.9 m south of walk z0=97.7 (grow-to-gap, not a
// kiss). Flagstones 0.5–0.7 m + 60–100 mm joints. Collider ⊆
// each slab. Kiss posts / EE spine / 347/94.4 / leftoverLot E /
// helipad / warehouse / kiss of 339→345.2 west walk / 276 park
// = drop, never nudge. This cell is not a 276 walk. Walk eats
// ~10 m². E leftover band is 8000–11000 (Reesy signed after the
// east walk). Do not backfill to 12800. 276 park stays
// 268–284 × 88–96. 276 walks stay. 347/98.5 pergola stays.
// 347/94.4 stays. EE spine stays 339→355 / z=96. West walk
// stays 339→345.2 / z=98.5. Garden path stays 268→284 / z=84.
// leftoverLot A 258/84, B 295/84, C 313/84, D 330/84, E 347/84.
// Scatter still uses tryPlace.
export const PARK_WALK_EE_E_X0 = 348.8;
export const PARK_WALK_EE_E_X1 = 355;
export const PARK_WALK_EE_E_Z = 98.5;
export const PARK_WALK_EE_E_W = GARDEN_PATH_W;
export const PARK_WALK_EE_E_Z0 = 97.7;
export const PARK_WALK_EE_E_Z1 = 99.3;
export const PARK_WALK_EE_E_X = 351.9;
export const PARK_WALK_EE_E_LEN = 6.2;
export const PARK_WALK_EE_E_AABB = GARDEN_PATH_AABB;

// ---- F-park spine (same Tiny Glade two-abreast kit; signed 356→372 / z=96) ----
// Desi + Reesy signed the cell. Do not invent or slide x/z. Never nudge.
// Same gardenPathGeom / gardenPathSlabs — not gardenPathBGeom, not
// parkWalkGeom, not parkWalkEGeom, not parkWalkE2Geom, not
// parkWalkEEGeom, not parkWalkEEWGeom, not parkWalkEEEGeom, not
// parkWalkFFGeom, not gardenPathFGeom, not gardenPathGGeom, not
// gardenPathHGeom, not gardenPathIGeom, not parkWalkFGeom, not
// parkWalkGGeom, not a slide of 339→355 / z=96 or of 268→284 /
// z=84. Width 1.6 m (z 95.2–96.8). Length 16 m (full 16×1.6 on
// the 364/96 hull). Lives on the F-park hull (356–372 × 92–100)
// by design. Last slab stays inside 372. Do not grow past 372.
// Does not merge with PARK_WALK_EE_X1=355 (1 m west gap, same z;
// EE ends 355, this cell starts 356). Do not merge the two
// spines into one plate. leftoverLot F reserved z1+1.4=91.4 vs
// walk z0=95.2 — leftoverLotOverlap is 0. Flagstones 0.5–0.7 m
// + 60–100 mm joints. Collider ⊆ each slab. Kiss leftoverLot F /
// leftoverLot A–F reserved / E-park hull merge / helipad /
// warehouse / 276 park / 276 walks / benches / pergola /
// pavement / streetOverlap = drop, never nudge. Walk eats
// ~26 m². F leftover after this walk drops below 12800 (of
// 128 m²). Do not backfill to 12800. 13k stays a ceiling.
// E leftover stays 8000–11000. 276 park stays 268–284 × 88–96.
// 347 park stays 339–355 × 92–100. F-park hull stays 364/96.
// EE spine stays 339→355 / z=96. West park walk stays
// 268→274.2 / z=94. East park walk stays 277.8→284 / z=94.
// N-S stays 272 / 85.2→92.8. East N-S stays 280 / 85.2→92.8.
// Garden path stays 268→284 / z=84. leftoverLot A 258/84,
// B 295/84, C 313/84, D 330/84, E 347/84, F 364/84. Scatter
// still uses tryPlace.
export const PARK_WALK_FF_X0 = 356;
export const PARK_WALK_FF_X1 = 372;
export const PARK_WALK_FF_Z = 96;
export const PARK_WALK_FF_W = GARDEN_PATH_W;
export const PARK_WALK_FF_Z0 = 95.2;
export const PARK_WALK_FF_Z1 = 96.8;
export const PARK_WALK_FF_X = 364;
export const PARK_WALK_FF_LEN = 16;
export const PARK_WALK_FF_AABB = GARDEN_PATH_AABB;

// ---- F-park west walk (same Tiny Glade two-abreast kit; signed 356→362.2 / z=98.5) ----
// Desi + Reesy signed the cell. 347 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenPathGeom / gardenPathSlabs
// — not gardenPathBGeom, not parkWalkGeom, not parkWalkFFGeom,
// not parkWalkFFWGeom, not gardenPathFGeom, not leftoverLotDirtGeom,
// not a 4.2 m slab, not a slide of 339→345.2 / z=98.5 or of
// 356→372 / z=96. Width 1.6 m (z 97.7–99.3). Length 6.2 m
// (mirror of 339→345.2 / z=98.5). Ends 1.8 m west of 364.
// Posts sit on x=364 (Z half-span 1.16). 362.85 is 364−1.16 —
// that is the Z number reused as X, NOT post x0. Do not treat
// 362.2 as post x0. Do not extend the walk into the sash.
// Opening stays empty. Lives on the signed 364/96 hull and sits
// in the sash band in Z the same way 339→345.2 sits in the
// 347/98.5 sash band — not a fail if it stops short of the
// posts in X. Spine z1=96.8 is 0.9 m south of walk z0=97.7
// (grow-to-gap, not a kiss). Last slab stays inside 362.2.
// Does not merge with E-park 355. Flagstones 0.5–0.7 m +
// 60–100 mm joints. Collider ⊆ each slab. Kiss posts / FF
// spine / 364/94.4 / leftoverLot F / E-park / helipad / 347 /
// sash filled = drop, never nudge. This cell is not a 276 or
// 347 walk. Walk eats ~10 m². Three walks eat ~45 m² →
// leftover ~8.2k. F leftover band after this file is
// 8000–11000. 11k is a ceiling. Do not backfill. No leftover
// lots on this merge. 276 park stays 268–284 × 88–96. 347
// park stays 339–355 × 92–100. 364/98.5 pergola stays.
// 364/94.4 stays. FF spine stays 356→372 / z=96. EE spine
// stays 339→355 / z=96. leftoverLot A–F stay 258 / 295 /
// 313 / 330 / 347 / 364 at z=84. Scatter still uses tryPlace.
export const PARK_WALK_FF_W_X0 = 356;
export const PARK_WALK_FF_W_X1 = 362.2;
export const PARK_WALK_FF_W_Z = 98.5;
export const PARK_WALK_FF_W_W = GARDEN_PATH_W;
export const PARK_WALK_FF_W_Z0 = 97.7;
export const PARK_WALK_FF_W_Z1 = 99.3;
export const PARK_WALK_FF_W_X = 359.1;
export const PARK_WALK_FF_W_LEN = 6.2;
export const PARK_WALK_FF_W_AABB = GARDEN_PATH_AABB;

// ---- F-park east walk (same Tiny Glade two-abreast kit; signed 365.8→372 / z=98.5) ----
// Desi + Reesy signed the cell. 347 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenPathGeom / gardenPathSlabs
// — not gardenPathBGeom, not parkWalkGeom, not parkWalkFFGeom,
// not parkWalkFFWGeom, not parkWalkFFEGeom, not gardenPathFGeom,
// not leftoverLotDirtGeom, not a 4.2 m slab, not a slide of
// 348.8→355 / z=98.5 or of 356→362.2 / z=98.5. Width 1.6 m
// (z 97.7–99.3). Length 6.2 m (mirror of 348.8→355 / z=98.5;
// east twin of 356→362.2 / z=98.5). Starts 1.8 m east of 364
// (364+1.8=365.8). Posts sit on x=364 (GATE_HALF_X = 1.15).
// Post x1 is 365.15. Walk x0 365.8 is 0.65 m east of the post
// — do not treat 365.8 as post x1. Do not extend the walk into
// the sash. Opening stays empty. Last slab x1 ≤ 372. Do not
// grow past 372. Lives on the signed 364/96 hull and sits in
// the sash band in Z the same way 348.8→355 sits in the
// 347/98.5 sash band — not a fail if it starts east of the
// posts in X. Spine z1=96.8 is 0.9 m south of walk z0=97.7
// (grow-to-gap, not a kiss). Does not merge with E-park 355.
// Flagstones 0.5–0.7 m + 60–100 mm joints. Collider ⊆ each
// slab. Kiss posts / FF spine / 364/94.4 / leftoverLot F /
// E-park / helipad / kiss of 356→362.2 west walk / 347 / sash
// filled = drop, never nudge. This cell is not a 276 or 347
// walk. Walk eats ~10 m². Three walks eat ~45 m² → leftover
// ~8.2k. F leftover band after this file is 8000–11000. 11k
// is a ceiling. Do not backfill. No leftover lots on this
// merge. 276 park stays 268–284 × 88–96. 347 park stays
// 339–355 × 92–100. 364/98.5 pergola stays. 364/94.4 stays.
// FF spine stays 356→372 / z=96. West walk stays 356→362.2 /
// z=98.5. EE spine stays 339→355 / z=96. leftoverLot A–F
// stay 258 / 295 / 313 / 330 / 347 / 364 at z=84. Scatter
// still uses tryPlace.
export const PARK_WALK_FF_E_X0 = 365.8;
export const PARK_WALK_FF_E_X1 = 372;
export const PARK_WALK_FF_E_Z = 98.5;
export const PARK_WALK_FF_E_W = GARDEN_PATH_W;
export const PARK_WALK_FF_E_Z0 = 97.7;
export const PARK_WALK_FF_E_Z1 = 99.3;
export const PARK_WALK_FF_E_X = 368.9;
export const PARK_WALK_FF_E_LEN = 6.2;
export const PARK_WALK_FF_E_AABB = GARDEN_PATH_AABB;

// ---- G-park spine (same Tiny Glade two-abreast kit; signed 373→389 / z=96) ----
// Desi + Reesy signed the cell. F-park spine +17 m. Do not invent
// or slide x/z. Never nudge. Same gardenPathGeom / gardenPathSlabs
// — not gardenPathBGeom, not parkWalkGeom, not parkWalkEGeom, not
// parkWalkE2Geom, not parkWalkEEGeom, not parkWalkEEWGeom, not
// parkWalkEEEGeom, not parkWalkFFGeom, not parkWalkGGGeom, not
// gardenPathFGeom, not gardenPathGGeom, not gardenPathHGeom, not
// gardenPathIGeom, not parkWalkFGeom, not parkWalkGGeom, not
// leftoverLotDirtGeom, not a 4.2 m slab, not a slide of
// 356→372 / z=96 or of 339→355 / z=96 or of 268→284 / z=84.
// Width 1.6 m (z 95.2–96.8). Length 16 m (full 16×1.6 on the
// 381/96 hull). Lives on the G-park hull (373–389 × 92–100) by
// design. Last slab stays inside 389. Do not grow past 389.
// Starts 1 m east of F-park 372 (FF ends 372, this cell starts
// 373). Does not merge with PARK_WALK_FF_X1=372 (1 m west gap,
// same z). Do not merge the two spines into one plate.
// leftoverLot G reserved z1+1.4=91.4 vs walk z0=95.2 —
// leftoverLotOverlap is 0. Flagstones 0.5–0.7 m + 60–100 mm
// joints. Collider ⊆ each slab. Kiss leftoverLot G / leftoverLot
// A–G reserved / F-park hull merge / helipad / warehouse / 276
// park / 347 park / 276 walks / benches / pergola / pavement /
// streetOverlap = drop, never nudge. Walk eats ~26 m². The 364
// kit +17 m west/east walks eat ~20 m² more. Three walks eat
// ~45 m² → leftover ~8.2k. G leftover band after the walks is
// 8000–11000. 11k is a ceiling. Do not backfill. Do not leave
// G at empty-hull 10000–13000. F leftover stays 8000–11000. E
// leftover stays 8000–11000. 276 park stays 268–284 × 88–96.
// 347 park stays 339–355 × 92–100. F-park hull stays 364/96
// (x1=372). G-park hull stays 381/96. FF spine stays 356→372 /
// z=96. EE spine stays 339→355 / z=96.
// West park walk stays 268→274.2 / z=94. East park walk stays
// 277.8→284 / z=94. N-S stays 272 / 85.2→92.8. East N-S stays
// 280 / 85.2→92.8. Garden path stays 268→284 / z=84.
// leftoverLot A 258/84, B 295/84, C 313/84, D 330/84, E 347/84,
// F 364/84, G 381/84. Scatter still uses tryPlace.
export const PARK_WALK_GG_X0 = 373;
export const PARK_WALK_GG_X1 = 389;
export const PARK_WALK_GG_Z = 96;
export const PARK_WALK_GG_W = GARDEN_PATH_W;
export const PARK_WALK_GG_Z0 = 95.2;
export const PARK_WALK_GG_Z1 = 96.8;
export const PARK_WALK_GG_X = 381;
export const PARK_WALK_GG_LEN = 16;
export const PARK_WALK_GG_AABB = GARDEN_PATH_AABB;

// ---- G-park west walk (same Tiny Glade two-abreast kit; signed 373→379.2 / z=98.5) ----
// Desi signed the cell. 364 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenPathGeom / gardenPathSlabs
// — not gardenPathBGeom, not parkWalkGeom, not parkWalkGGGeom,
// not parkWalkGGWGeom, not gardenPathGGeom, not leftoverLotDirtGeom,
// not a 4.2 m slab, not a slide of 356→362.2 / z=98.5 or of
// 373→389 / z=96. Width 1.6 m (z 97.7–99.3). Length 6.2 m
// (mirror of 356→362.2 / z=98.5). Ends 1.8 m west of 381.
// Posts sit on x=381 (Z half-span 1.16). 379.84 is 381−1.16 —
// that is the Z number reused as X, NOT post x0. Do not treat
// 379.2 as post x0. Do not extend the walk into the sash.
// Opening stays empty. Lives on the signed 381/96 hull and sits
// in the sash band in Z the same way 356→362.2 sits in the
// 364/98.5 sash band — not a fail if it stops short of the
// posts in X. Spine z1=96.8 is 0.9 m south of walk z0=97.7
// (grow-to-gap, not a kiss). Last slab stays inside 379.2.
// Does not merge with F-park 372. Flagstones 0.5–0.7 m +
// 60–100 mm joints. Collider ⊆ each slab. Kiss posts / GG
// spine / 381/94.4 / leftoverLot G / F-park / helipad / 364 /
// sash filled = drop, never nudge. This cell is not a 276, 347,
// or 364 walk. Walk eats ~10 m². Three walks eat ~45 m² →
// leftover ~8.2k. G leftover band after this file is
// 8000–11000. 11k is a ceiling. Do not backfill. No leftover
// lots on this merge. Never leftoverLotDirtGeom / gardenPathGGeom.
// 276 park stays 268–284 × 88–96. 347 park stays 339–355 ×
// 92–100. F-park hull and all F kit stay. 381/98.5 pergola
// stays. 381/94.4 stays. GG spine stays 373→389 / z=96. FF
// spine stays 356→372 / z=96. leftoverLot A–G stay 258 / 295 /
// 313 / 330 / 347 / 364 / 381 at z=84. Scatter still uses
// tryPlace.
export const PARK_WALK_GG_W_X0 = 373;
export const PARK_WALK_GG_W_X1 = 379.2;
export const PARK_WALK_GG_W_Z = 98.5;
export const PARK_WALK_GG_W_W = GARDEN_PATH_W;
export const PARK_WALK_GG_W_Z0 = 97.7;
export const PARK_WALK_GG_W_Z1 = 99.3;
export const PARK_WALK_GG_W_X = 376.1;
export const PARK_WALK_GG_W_LEN = 6.2;
export const PARK_WALK_GG_W_AABB = GARDEN_PATH_AABB;

// ---- G-park east walk (same Tiny Glade two-abreast kit; signed 382.8→389 / z=98.5) ----
// Desi signed the cell. 364 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenPathGeom / gardenPathSlabs
// — not gardenPathBGeom, not parkWalkGeom, not parkWalkGGGeom,
// not parkWalkGGWGeom, not parkWalkGGEGeom, not gardenPathGGeom,
// not leftoverLotDirtGeom, not a 4.2 m slab, not a slide of
// 365.8→372 / z=98.5 or of 373→379.2 / z=98.5. Width 1.6 m
// (z 97.7–99.3). Length 6.2 m (mirror of 365.8→372 / z=98.5;
// east twin of 373→379.2 / z=98.5). Starts 1.8 m east of 381
// (381+1.8=382.8). Posts sit on x=381 (GATE_HALF_X = 1.15).
// Post x1 is 382.15. Walk x0 382.8 is 0.65 m east of the post
// — do not treat 382.8 as post x1. Do not extend the walk into
// the sash. Opening stays empty. Last slab x1 ≤ 389. Do not
// grow past 389. Lives on the signed 381/96 hull and sits in
// the sash band in Z the same way 365.8→372 sits in the
// 364/98.5 sash band — not a fail if it starts east of the
// posts in X. Spine z1=96.8 is 0.9 m south of walk z0=97.7
// (grow-to-gap, not a kiss). Does not merge with F-park 372.
// Flagstones 0.5–0.7 m + 60–100 mm joints. Collider ⊆ each
// slab. Kiss posts / GG spine / 381/94.4 / leftoverLot G /
// F-park / helipad / kiss of 373→379.2 west walk / 364 / sash
// filled = drop, never nudge. This cell is not a 276, 347, or
// 364 walk. Walk eats ~10 m². Three walks eat ~45 m² → leftover
// ~8.2k. G leftover band after this file is 8000–11000. 11k
// is a ceiling. Do not backfill. No leftover lots on this
// merge. Never leftoverLotDirtGeom / gardenPathGGeom. 276 park
// stays 268–284 × 88–96. 347 park stays 339–355 × 92–100.
// F-park hull and all F kit stay. 381/98.5 pergola stays.
// 381/94.4 stays. GG spine stays 373→389 / z=96. West walk
// stays 373→379.2 / z=98.5. FF spine stays 356→372 / z=96.
// leftoverLot A–G stay 258 / 295 / 313 / 330 / 347 / 364 /
// 381 at z=84. Scatter still uses tryPlace.
export const PARK_WALK_GG_E_X0 = 382.8;
export const PARK_WALK_GG_E_X1 = 389;
export const PARK_WALK_GG_E_Z = 98.5;
export const PARK_WALK_GG_E_W = GARDEN_PATH_W;
export const PARK_WALK_GG_E_Z0 = 97.7;
export const PARK_WALK_GG_E_Z1 = 99.3;
export const PARK_WALK_GG_E_X = 385.9;
export const PARK_WALK_GG_E_LEN = 6.2;
export const PARK_WALK_GG_E_AABB = GARDEN_PATH_AABB;

// ---- H-park spine (same Tiny Glade two-abreast kit; signed 390→406 / z=96) ----
// Desi signed the cell. G-park spine +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenPathGeom / gardenPathSlabs
// — not gardenPathBGeom, not parkWalkGeom, not parkWalkEGeom, not
// parkWalkE2Geom, not parkWalkEEGeom, not parkWalkEEWGeom, not
// parkWalkEEEGeom, not parkWalkFFGeom, not parkWalkGGGeom, not
// parkWalkHHGeom, not gardenPathFGeom, not gardenPathGGeom, not
// gardenPathHGeom, not gardenPathIGeom, not parkWalkFGeom, not
// parkWalkGGeom, not leftoverLotDirtGeom, not a 4.2 m slab, not
// a slide of 373→389 / z=96 or of 356→372 / z=96 or of
// 339→355 / z=96 or of 268→284 / z=84. Width 1.6 m
// (z 95.2–96.8). Length 16 m (full 16×1.6 on the 398/96 hull).
// Lives on the H-park hull (390–406 × 92–100) by design. Last
// slab stays inside 406. Do not grow past 406. Starts 1 m east
// of G-park 389 (GG ends 389, this cell starts 390). Does not
// merge with PARK_WALK_GG_X1=389 (1 m west gap, same z). Do
// not merge the two spines into one plate. leftoverLot H
// reserved z1+1.4=91.4 vs walk z0=95.2 — leftoverLotOverlap
// is 0. Flagstones 0.5–0.7 m + 60–100 mm joints. Collider ⊆
// each slab. Kiss leftoverLot H / leftoverLot A–H reserved /
// G-park hull merge / helipad / warehouse / 276 park / 347
// park / 364 park / 276 walks / benches / pergola / pavement /
// streetOverlap = drop, never nudge. Walk eats ~26 m². The 381
// kit +17 m west/east walks eat ~20 m² more. Three walks eat
// ~45 m² → leftover ~8.2k. H leftover band after the walks is
// 8000–11000. 11k is a ceiling. Do not backfill. Do not leave
// H at empty-hull 10000–13000. G leftover stays 8000–11000. F
// leftover stays 8000–11000. E leftover stays 8000–11000. 276
// park stays 268–284 × 88–96. 347 park stays 339–355 × 92–100.
// F-park hull stays 364/96 (x1=372). G-park hull stays 381/96
// (x1=389). GG spine stays 373→389 / z=96. FF spine stays
// 356→372 / z=96. EE spine stays 339→355 / z=96.
// West park walk stays 268→274.2 / z=94. East park walk stays
// 277.8→284 / z=94. N-S stays 272 / 85.2→92.8. East N-S stays
// 280 / 85.2→92.8. Garden path stays 268→284 / z=84.
// leftoverLot A 258/84, B 295/84, C 313/84, D 330/84, E 347/84,
// F 364/84, G 381/84, H 398/84. leftoverLot H stays 398/84,
// 391–405 × 78–90. Do not slide A–H lots. No leftover lots
// on this merge. Scatter still uses tryPlace.
export const PARK_WALK_HH_X0 = 390;
export const PARK_WALK_HH_X1 = 406;
export const PARK_WALK_HH_Z = 96;
export const PARK_WALK_HH_W = GARDEN_PATH_W;
export const PARK_WALK_HH_Z0 = 95.2;
export const PARK_WALK_HH_Z1 = 96.8;
export const PARK_WALK_HH_X = 398;
export const PARK_WALK_HH_LEN = 16;
export const PARK_WALK_HH_AABB = GARDEN_PATH_AABB;

// ---- H-park west walk (same Tiny Glade two-abreast kit; signed 390→396.2 / z=98.5) ----
// Desi signed the cell. 381 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenPathGeom / gardenPathSlabs
// — not gardenPathBGeom, not parkWalkGeom, not parkWalkHHGeom,
// not parkWalkHHWGeom, not gardenPathHGeom, not leftoverLotDirtGeom,
// not a 4.2 m slab, not a slide of 373→379.2 / z=98.5 or of
// 390→406 / z=96. Width 1.6 m (z 97.7–99.3). Length 6.2 m
// (mirror of 373→379.2 / z=98.5). Ends 1.8 m west of 398.
// Posts sit on x=398 (Z half-span 1.16). 396.84 is 398−1.16 —
// that is the Z number reused as X, NOT post x0. Do not treat
// 396.2 as post x0. Do not extend the walk into the sash.
// Opening stays empty. Lives on the signed 398/96 hull and sits
// in the sash band in Z the same way 373→379.2 sits in the
// 381/98.5 sash band — not a fail if it stops short of the
// posts in X. Spine z1=96.8 is 0.9 m south of walk z0=97.7
// (grow-to-gap, not a kiss). Last slab stays inside 396.2.
// Does not merge with G-park 389. Flagstones 0.5–0.7 m +
// 60–100 mm joints. Collider ⊆ each slab. Kiss posts / HH
// spine / 398/94.4 / leftoverLot H / G-park / helipad / 381 /
// sash filled = drop, never nudge. This cell is not a 276, 347,
// 364, or 381 walk. Walk eats ~10 m². Three walks eat ~45 m² →
// leftover ~8.2k. H leftover band after this file is
// 8000–11000. 11k is a ceiling. Do not backfill. No leftover
// lots on this merge. Never leftoverLotDirtGeom / gardenPathHGeom.
// 276 park stays 268–284 × 88–96. 347 park stays 339–355 ×
// 92–100. F-park hull and all F kit stay. G-park hull and all
// G kit stay. 398/98.5 pergola stays. 398/94.4 stays. HH spine
// stays 390→406 / z=96. GG spine stays 373→389 / z=96. leftoverLot
// A–H stay 258 / 295 / 313 / 330 / 347 / 364 / 381 / 398 at
// z=84. Scatter still uses tryPlace.
export const PARK_WALK_HH_W_X0 = 390;
export const PARK_WALK_HH_W_X1 = 396.2;
export const PARK_WALK_HH_W_Z = 98.5;
export const PARK_WALK_HH_W_W = GARDEN_PATH_W;
export const PARK_WALK_HH_W_Z0 = 97.7;
export const PARK_WALK_HH_W_Z1 = 99.3;
export const PARK_WALK_HH_W_X = 393.1;
export const PARK_WALK_HH_W_LEN = 6.2;
export const PARK_WALK_HH_W_AABB = GARDEN_PATH_AABB;

// ---- H-park east walk (same Tiny Glade two-abreast kit; signed 399.8→406 / z=98.5) ----
// Desi signed the cell. 381 kit +17 m. Do not invent or
// slide x/z. Never nudge. Same gardenPathGeom / gardenPathSlabs
// — not gardenPathBGeom, not parkWalkGeom, not parkWalkHHGeom,
// not parkWalkHHWGeom, not parkWalkHHEGeom, not gardenPathHGeom,
// not leftoverLotDirtGeom, not a 4.2 m slab, not a slide of
// 382.8→389 / z=98.5 or of 390→396.2 / z=98.5. Width 1.6 m
// (z 97.7–99.3). Length 6.2 m (mirror of 382.8→389 / z=98.5;
// east twin of 390→396.2 / z=98.5). Starts 1.8 m east of 398
// (398+1.8=399.8). Posts sit on x=398 (GATE_HALF_X = 1.15).
// Post x1 is 399.15. Walk x0 399.8 is 0.65 m east of the post
// — do not treat 399.8 as post x1. Do not extend the walk into
// the sash. Opening stays empty. Last slab x1 ≤ 406. Do not
// grow past 406. Lives on the signed 398/96 hull and sits in
// the sash band in Z the same way 382.8→389 sits in the
// 381/98.5 sash band — not a fail if it starts east of the
// posts in X. Spine z1=96.8 is 0.9 m south of walk z0=97.7
// (grow-to-gap, not a kiss). Does not merge with G-park 389.
// Flagstones 0.5–0.7 m + 60–100 mm joints. Collider ⊆ each
// slab. Kiss posts / HH spine / 398/94.4 / leftoverLot H /
// G-park / helipad / kiss of 390→396.2 west walk / 381 / sash
// filled = drop, never nudge. This cell is not a 276, 347, 364,
// or 381 walk. Walk eats ~10 m². Three walks eat ~45 m² → leftover
// ~8.2k. H leftover band after this file is 8000–11000. 11k
// is a ceiling. Do not backfill. No leftover lots on this
// merge. Never leftoverLotDirtGeom / gardenPathHGeom. 276 park
// stays 268–284 × 88–96. 347 park stays 339–355 × 92–100.
// F-park hull and all F kit stay. G-park hull and all G kit
// stay. 398/98.5 pergola stays. 398/94.4 stays. HH spine stays
// 390→406 / z=96. West walk stays 390→396.2 / z=98.5. GG spine
// stays 373→389 / z=96. leftoverLot A–H stay 258 / 295 / 313 /
// 330 / 347 / 364 / 381 / 398 at z=84. Scatter still uses
// tryPlace.
export const PARK_WALK_HH_E_X0 = 399.8;
export const PARK_WALK_HH_E_X1 = 406;
export const PARK_WALK_HH_E_Z = 98.5;
export const PARK_WALK_HH_E_W = GARDEN_PATH_W;
export const PARK_WALK_HH_E_Z0 = 97.7;
export const PARK_WALK_HH_E_Z1 = 99.3;
export const PARK_WALK_HH_E_X = 402.9;
export const PARK_WALK_HH_E_LEN = 6.2;
export const PARK_WALK_HH_E_AABB = GARDEN_PATH_AABB;

/**
 * Boardwalk-gate kit (posts + lintel). Default is GATE_X / GATE_Z on
 * the promenade. Pass (PARK_PERGOLA_X, PARK_PERGOLA_Z) for the park
 * pergola. Pass (PARK_PERGOLA_EE_X, PARK_PERGOLA_EE_Z) for the
 * E-park pergola at 347 / 98.5. Pass (PARK_PERGOLA_FF_X,
 * PARK_PERGOLA_FF_Z) for the F-park pergola at 364 / 98.5
 * (347 kit +17 m). Pass (PARK_PERGOLA_GG_X,
 * PARK_PERGOLA_GG_Z) for the G-park pergola at 381 / 98.5
 * (364 kit +17 m). Pass (PARK_PERGOLA_HH_X,
 * PARK_PERGOLA_HH_Z) for the H-park pergola at 398 / 98.5
 * (381 kit +17 m). Same schema — never pergolaGeom /
 * parkPergolaGeom / parkPergolaEEGeom / parkPergolaFGeom /
 * parkPergolaGGeom / parkPergolaHGeom / boardwalkGateEGeom.
 * Never remaps x/z.
 * Scatter stays on tryPlace. Fly along +X. Opening is empty
 * air. Collider is posts + lintel only.
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

/** Sidewalk arcade kit. Posts on the slab edges. Fly +X. Opening is empty air. */
export function sidewalkArcadeGeom(cx, cz = SW_ARCADE_CITY_Z) {
  const y0 = CITY_Y + SW_H;
  const halfX = SW_ARCADE_HALF_X;
  const halfZ = SW_ARCADE_HALF_Z;
  const postR = SW_ARCADE_POST_R;
  const postH = SW_ARCADE_POST_H;
  return {
    x: cx, z: cz, y0,
    halfX, halfZ, postR, postH,
    beamH: SW_ARCADE_BEAM_H, beamW: SW_ARCADE_BEAM_W,
    spanX: halfX * 2, spanZ: halfZ * 2,
    x0: cx - halfX, x1: cx + halfX,
    z0: cz - halfZ, z1: cz + halfZ,
    openW: halfZ * 2 - 2 * postR,
    openH: postH,
    fly: '+X',
    tag: 'sidewalk-arcade',
  };
}

/** Alley pipe U. Risers + lintel pipe. Fly +X. Opening is empty air. */
export function alleyPipeGeom(cx, cz) {
  const y0 = CITY_Y;
  const halfZ = ALLEY_PIPE_HALF_Z;
  const postR = ALLEY_PIPE_POST_R;
  const postH = ALLEY_PIPE_POST_H;
  return {
    x: cx, z: cz, y0,
    halfZ, postR, postH,
    beamR: ALLEY_PIPE_BEAM_R,
    x0: cx - postR - 0.04, x1: cx + postR + 0.04,
    z0: cz - halfZ, z1: cz + halfZ,
    openW: halfZ * 2 - 2 * postR,
    openH: postH,
    fly: '+X',
    tag: 'alley-pipe',
  };
}

/** Lummus park ring. Torus in YZ, fly +X. Disc is empty. */
export function parkRingGeom(cx, cz) {
  const r = PARK_RING_R;
  const tube = PARK_RING_TUBE;
  const y0 = PARK_RING_Y0;
  const y = y0 + r;
  return {
    x: cx, z: cz, y0, y, r, tube,
    segs: PARK_RING_SEGS,
    x0: cx - tube - 0.04, x1: cx + tube + 0.04,
    z0: cz - r - tube, z1: cz + r + tube,
    openW: 2 * (r - tube),
    openH: 2 * (r - tube),
    fly: '+X',
    tag: 'park-ring',
  };
}

/** Lifeguard-stand whoop ring. Torus in YZ, fly +X. Disc is empty. */
export function lifeguardRingGeom(cx, cz) {
  const r = LIFEGUARD_RING_R;
  const tube = LIFEGUARD_RING_TUBE;
  const y0 = LIFEGUARD_RING_Y0;
  const y = y0 + r;
  return {
    x: cx, z: cz, y0, y, r, tube,
    segs: LIFEGUARD_RING_SEGS,
    x0: cx - tube - 0.04, x1: cx + tube + 0.04,
    z0: cz - r - tube, z1: cz + r + tube,
    openW: 2 * (r - tube),
    openH: 2 * (r - tube),
    fly: '+X',
    tag: 'lifeguard-ring',
  };
}

/** Extra pier undercroft bay between pylons `bayI` and `bayI+1`. Fly ±Z. */
export function pierUndercroftVoid(bayI, id) {
  const z = PIER_PYLON_Z0 - (bayI + 0.5) * PIER_PYLON_STEP;
  return {
    id, kind: 'existing',
    x: PIER_X, z, y: 0.85,
    x0: PIER_X - (PIER_PYLON_DX - PIER_PYLON_R - 0.15),
    x1: PIER_X + (PIER_PYLON_DX - PIER_PYLON_R - 0.15),
    z0: PIER_PYLON_Z0 - (bayI + 1) * PIER_PYLON_STEP + PIER_PYLON_R + 0.2,
    z1: PIER_PYLON_Z0 - bayI * PIER_PYLON_STEP - PIER_PYLON_R - 0.2,
    y0: -1.2, y1: PIER_DECK_Y - PIER_DECK_H / 2 - 0.05,
    openW: (PIER_PYLON_DX - PIER_PYLON_R) * 2,
    openH: (PIER_DECK_Y - PIER_DECK_H / 2) - (-1.2),
  };
}

/** Timber whoop ring in an extra pier bay. Torus in XY, fly ±Z. Disc empty. */
export function pierBayRingGeom(bayI) {
  const z = PIER_PYLON_Z0 - (bayI + 0.5) * PIER_PYLON_STEP;
  const r = PIER_BAY_RING_R;
  const tube = PIER_BAY_RING_TUBE;
  const y = PIER_BAY_RING_Y;
  return {
    bayI, x: PIER_X, z, y, r, tube,
    segs: PARK_RING_SEGS,
    openW: 2 * (r - tube),
    openH: 2 * (r - tube),
    fly: '+Z',
    tag: 'pier',
  };
}

export function sidewalkArcadeVoid(g, id) {
  return {
    id, kind: 'kit',
    x: g.x, z: g.z, y: g.y0 + g.postH * 0.48,
    x0: g.x - g.halfX + g.postR + 0.08,
    x1: g.x + g.halfX - g.postR - 0.08,
    z0: g.z - g.halfZ + g.postR + 0.08,
    z1: g.z + g.halfZ - g.postR - 0.08,
    y0: g.y0 + 0.06, y1: g.y0 + g.postH - 0.04,
    openW: g.openW, openH: g.openH,
  };
}

export function alleyPipeVoid(g, id) {
  return {
    id, kind: 'kit',
    x: g.x, z: g.z, y: g.y0 + g.postH * 0.48,
    x0: g.x - 0.45, x1: g.x + 0.45,
    z0: g.z - g.halfZ + g.postR + 0.08,
    z1: g.z + g.halfZ - g.postR - 0.08,
    y0: g.y0 + 0.06, y1: g.y0 + g.postH - 0.04,
    openW: g.openW, openH: g.openH,
  };
}

export function parkRingVoid(g, id) {
  const inner = g.r - g.tube;
  return {
    id, kind: 'kit',
    x: g.x, z: g.z, y: g.y,
    x0: g.x - 0.40, x1: g.x + 0.40,
    z0: g.z - inner + 0.10, z1: g.z + inner - 0.10,
    y0: g.y - inner + 0.10, y1: g.y + inner - 0.10,
    openW: g.openW, openH: g.openH,
  };
}

export function lifeguardRingVoid(g, id) {
  return parkRingVoid(g, id);
}

export function pierBayRingVoid(g, id) {
  const inner = g.r - g.tube;
  return {
    id, kind: 'kit',
    x: g.x, z: g.z, y: g.y,
    x0: g.x - inner + 0.10, x1: g.x + inner - 0.10,
    z0: g.z - 0.40, z1: g.z + 0.40,
    y0: g.y - inner + 0.10, y1: g.y + inner - 0.10,
    openW: g.openW, openH: g.openH,
  };
}

function boardwalkGateSignedCells() {
  return [
    [PARK_PERGOLA_X, PARK_PERGOLA_Z],
    [PARK_PERGOLA_EE_X, PARK_PERGOLA_EE_Z],
    [PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z],
    [PARK_PERGOLA_GG_X, PARK_PERGOLA_GG_Z],
    [PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z],
  ];
}

function boardwalkGateParkPlate(cx, cz) {
  if (cx === PARK_PERGOLA_EE_X && cz === PARK_PERGOLA_EE_Z) {
    return pocketParkHull(POCKET_PARK_E_X, POCKET_PARK_E_Z);
  }
  if (cx === PARK_PERGOLA_FF_X && cz === PARK_PERGOLA_FF_Z) {
    return pocketParkHull(POCKET_PARK_F_X, POCKET_PARK_F_Z);
  }
  if (cx === PARK_PERGOLA_GG_X && cz === PARK_PERGOLA_GG_Z) {
    return pocketParkHull(POCKET_PARK_G_X, POCKET_PARK_G_Z);
  }
  if (cx === PARK_PERGOLA_HH_X && cz === PARK_PERGOLA_HH_Z) {
    return pocketParkHull(POCKET_PARK_H_X, POCKET_PARK_H_Z);
  }
  return pocketParkHull();
}

function boardwalkGatePathKiss(g, cx, cz) {
  const gate = boardwalkGateGeom(cx, cz);
  for (const dx of [-gate.halfX, gate.halfX]) {
    for (const dz of [-gate.halfZ, gate.halfZ]) {
      if (pathFootprintOverlaps(g, gate.x + dx, gate.z + dz,
        gate.postR * 2, gate.postR * 2, 0)) {
        return true;
      }
    }
  }
  const sash = boardwalkGateVoid(gate, 'park-pergola');
  if (pathFootprintOverlaps(g, (sash.x0 + sash.x1) / 2, (sash.z0 + sash.z1) / 2,
    sash.x1 - sash.x0, sash.z1 - sash.z0, 0)) {
    return true;
  }
  return false;
}

/**
 * Fence / gate / shed / dumpster on a signed leftover-city plate.
 * Default is leftoverLot #34 (258/84). Pass (LEFTOVER_LOT_B_X,
 * LEFTOVER_LOT_B_Z) for lot B, (LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z)
 * for lot C, (LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z) for lot D,
 * (LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z) for lot E, or
 * (LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z) for lot F, or
 * (LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z) for lot G, or
 * (LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z) for lot H.
 * Same schema — never leftoverLotBGeom / leftoverLotCGeom /
 * leftoverLotDGeom / leftoverLotEGeom / leftoverLotFGeom /
 * leftoverLotGGeom / leftoverLotHGeom / leftoverLotDirtGeom.
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
    || leftoverLotGateAt(leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z), x, z, margin)
    || leftoverLotGateAt(leftoverLotGeom(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z), x, z, margin)
    || leftoverLotGateAt(leftoverLotGeom(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z), x, z, margin)
    || leftoverLotGateAt(leftoverLotGeom(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z), x, z, margin)
    || leftoverLotGateAt(leftoverLotGeom(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z), x, z, margin);
}

/**
 * Palms + weeds grow-to-gap inside the lot, lean at the fence.
 * tryPlace-drop off pavement and the gate void. Reject-or-drop, never nudge.
 * Default is leftoverLot #34. Pass leftoverLotGeom(B), leftoverLotGeom(C),
 * leftoverLotGeom(D), leftoverLotGeom(E), leftoverLotGeom(F), leftoverLotGeom(G), or leftoverLotGeom(H).
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
 * Signed Tiny Glade two-abreast walk. Default is 268→284 / z=84.
 * Pass (PARK_WALK_X, PARK_WALK_Z) for the west park walk (268→274.2 /
 * z=94). Pass (PARK_WALK_E_X, PARK_WALK_E_Z) for the east twin
 * (277.8→284 / z=94). Pass (PARK_WALK_NS_X, PARK_WALK_NS_Z) for the
 * N-S connector (272 / 85.2→92.8). Pass (PARK_WALK_NS_E_X,
 * PARK_WALK_NS_E_Z) for the east N-S twin (280 / 85.2→92.8). Pass
 * (PARK_WALK_EE_X, PARK_WALK_EE_Z) for the E-park spine (339→355 /
 * z=96). Pass (PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z) for the E-park
 * west walk (339→345.2 / z=98.5). Pass (PARK_WALK_EE_E_X,
 * PARK_WALK_EE_E_Z) for the E-park east walk (348.8→355 / z=98.5).
 * Pass (PARK_WALK_FF_X, PARK_WALK_FF_Z) for the F-park spine
 * (356→372 / z=96). Pass (PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z)
 * for the F-park west walk (356→362.2 / z=98.5). Pass
 * (PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z) for the F-park east
 * walk (365.8→372 / z=98.5). Pass (PARK_WALK_GG_X, PARK_WALK_GG_Z)
 * for the G-park spine (373→389 / z=96). Pass
 * (PARK_WALK_GG_W_X, PARK_WALK_GG_W_Z) for the G-park west
 * walk (373→379.2 / z=98.5). Pass (PARK_WALK_GG_E_X,
 * PARK_WALK_GG_E_Z) for the G-park east walk (382.8→389 /
 * z=98.5). Pass (PARK_WALK_HH_X, PARK_WALK_HH_Z) for the
 * H-park spine (390→406 / z=96). Pass
 * (PARK_WALK_HH_W_X, PARK_WALK_HH_W_Z) for the H-park west
 * walk (390→396.2 / z=98.5). Pass (PARK_WALK_HH_E_X,
 * PARK_WALK_HH_E_Z) for the H-park east walk (399.8→406 /
 * z=98.5). Same schema — never
 * gardenPathBGeom / parkWalkGeom / parkWalkEGeom / parkWalkNSGeom /
 * parkWalkNSEGeom / parkWalkE2Geom / parkWalkEEGeom / parkWalkEEWGeom
 * / parkWalkEEEGeom / parkWalkFFGeom / parkWalkFFWGeom /
 * parkWalkGGGeom / parkWalkHHGeom / parkWalkHHWGeom /
 * parkWalkHHEGeom / gardenPathFGeom / gardenPathGGeom /
 * gardenPathHGeom / gardenPathIGeom / parkWalkFGeom / parkWalkGGeom
 * / leftoverLotDirtGeom. Never remaps x/z. Scatter stays on
 * tryPlace. One grass hull at grade; flagstones jitter size +
 * joint only. West walk uses the signed bounds (ends 1.8 m west
 * of 276). East walk uses the signed bounds (starts 1.8 m east of
 * 276; last slab inside 284). N-S uses the signed bounds (0.4 m
 * off the 84 walk and 0.4 m off the west walk). East N-S uses the
 * signed bounds (0.4 m off the 84 walk and 0.4 m off the east
 * walk). E-park spine uses the signed bounds (last slab inside
 * 355). E-park west walk uses the signed bounds (ends 1.8 m west
 * of 347; last slab inside 345.2). E-park east walk uses the
 * signed bounds (starts 1.8 m east of 347; last slab inside 355).
 * F-park spine uses the signed bounds (last slab inside 372).
 * F-park west walk uses the signed bounds (ends 1.8 m west of
 * 364; last slab inside 362.2). F-park east walk uses the signed
 * bounds (starts 1.8 m east of 364; last slab inside 372). G-park
 * spine uses the signed bounds (last slab inside 389). G-park
 * west walk uses the signed bounds (ends 1.8 m west of 381;
 * last slab inside 379.2). G-park east walk uses the signed
 * bounds (starts 1.8 m east of 381; last slab inside 389).
 * H-park spine uses the signed bounds (last slab inside 406).
 * H-park west walk uses the signed bounds (ends 1.8 m west of
 * 398; last slab inside 396.2). H-park east walk uses the signed
 * bounds (starts 1.8 m east of 398; last slab inside 406).
 * Does not merge with PARK_WALK_GG_X1=389 (1 m west gap, same
 * z). Does not merge with PARK_WALK_FF_X1=372 (1 m west gap,
 * same z). Does not merge with PARK_WALK_EE_X1=355 (1 m west
 * gap, same z). Do not slide 268→284 onto z=94. Do not slide
 * 277.8→284 onto z=96. Do not slide 268→274.2, 339→345.2,
 * the EE spine, 347/98.5, 356→372, 356→362.2, 373→389,
 * 373→379.2, 390→406, or 390→396.2.
 */
export function gardenPathGeom(cx = GARDEN_PATH_X, cz = GARDEN_PATH_Z) {
  const park = cx === PARK_WALK_X && cz === PARK_WALK_Z;
  const east = cx === PARK_WALK_E_X && cz === PARK_WALK_E_Z;
  const ee = cx === PARK_WALK_EE_X && cz === PARK_WALK_EE_Z;
  const eeW = cx === PARK_WALK_EE_W_X && cz === PARK_WALK_EE_W_Z;
  const eeE = cx === PARK_WALK_EE_E_X && cz === PARK_WALK_EE_E_Z;
  const ff = cx === PARK_WALK_FF_X && cz === PARK_WALK_FF_Z;
  const ffW = cx === PARK_WALK_FF_W_X && cz === PARK_WALK_FF_W_Z;
  const ffE = cx === PARK_WALK_FF_E_X && cz === PARK_WALK_FF_E_Z;
  const gg = cx === PARK_WALK_GG_X && cz === PARK_WALK_GG_Z;
  const ggW = cx === PARK_WALK_GG_W_X && cz === PARK_WALK_GG_W_Z;
  const ggE = cx === PARK_WALK_GG_E_X && cz === PARK_WALK_GG_E_Z;
  const hh = cx === PARK_WALK_HH_X && cz === PARK_WALK_HH_Z;
  const hhW = cx === PARK_WALK_HH_W_X && cz === PARK_WALK_HH_W_Z;
  const hhE = cx === PARK_WALK_HH_E_X && cz === PARK_WALK_HH_E_Z;
  const ns = cx === PARK_WALK_NS_X && cz === PARK_WALK_NS_Z;
  const nsE = cx === PARK_WALK_NS_E_X && cz === PARK_WALK_NS_E_Z;
  const w = GARDEN_PATH_W;
  if (ns) {
    return {
      x0: PARK_WALK_NS_X0, x1: PARK_WALK_NS_X1,
      z0: PARK_WALK_NS_Z0, z1: PARK_WALK_NS_Z1,
      x: PARK_WALK_NS_X, z: PARK_WALK_NS_Z,
      w, len: PARK_WALK_NS_LEN,
      y0: CITY_Y, h: GARDEN_PATH_SLAB_H,
    };
  }
  if (nsE) {
    return {
      x0: PARK_WALK_NS_E_X0, x1: PARK_WALK_NS_E_X1,
      z0: PARK_WALK_NS_E_Z0, z1: PARK_WALK_NS_E_Z1,
      x: PARK_WALK_NS_E_X, z: PARK_WALK_NS_E_Z,
      w, len: PARK_WALK_NS_E_LEN,
      y0: CITY_Y, h: GARDEN_PATH_SLAB_H,
    };
  }
  const len = park ? PARK_WALK_LEN
    : east ? PARK_WALK_E_LEN
    : ee ? PARK_WALK_EE_LEN
    : eeW ? PARK_WALK_EE_W_LEN
    : eeE ? PARK_WALK_EE_E_LEN
    : ff ? PARK_WALK_FF_LEN
    : ffW ? PARK_WALK_FF_W_LEN
    : ffE ? PARK_WALK_FF_E_LEN
    : gg ? PARK_WALK_GG_LEN
    : ggW ? PARK_WALK_GG_W_LEN
    : ggE ? PARK_WALK_GG_E_LEN
    : hh ? PARK_WALK_HH_LEN
    : hhW ? PARK_WALK_HH_W_LEN
    : hhE ? PARK_WALK_HH_E_LEN
    : GARDEN_PATH_LEN;
  const x0 = park ? PARK_WALK_X0
    : east ? PARK_WALK_E_X0
    : ee ? PARK_WALK_EE_X0
    : eeW ? PARK_WALK_EE_W_X0
    : eeE ? PARK_WALK_EE_E_X0
    : ff ? PARK_WALK_FF_X0
    : ffW ? PARK_WALK_FF_W_X0
    : ffE ? PARK_WALK_FF_E_X0
    : gg ? PARK_WALK_GG_X0
    : ggW ? PARK_WALK_GG_W_X0
    : ggE ? PARK_WALK_GG_E_X0
    : hh ? PARK_WALK_HH_X0
    : hhW ? PARK_WALK_HH_W_X0
    : hhE ? PARK_WALK_HH_E_X0
    : cx - len / 2;
  const x1 = park ? PARK_WALK_X1
    : east ? PARK_WALK_E_X1
    : ee ? PARK_WALK_EE_X1
    : eeW ? PARK_WALK_EE_W_X1
    : eeE ? PARK_WALK_EE_E_X1
    : ff ? PARK_WALK_FF_X1
    : ffW ? PARK_WALK_FF_W_X1
    : ffE ? PARK_WALK_FF_E_X1
    : gg ? PARK_WALK_GG_X1
    : ggW ? PARK_WALK_GG_W_X1
    : ggE ? PARK_WALK_GG_E_X1
    : hh ? PARK_WALK_HH_X1
    : hhW ? PARK_WALK_HH_W_X1
    : hhE ? PARK_WALK_HH_E_X1
    : cx + len / 2;
  const z0 = cz - w / 2;
  const z1 = cz + w / 2;
  return {
    x0, x1, z0, z1,
    x: park ? PARK_WALK_X
      : east ? PARK_WALK_E_X
      : ee ? PARK_WALK_EE_X
      : eeW ? PARK_WALK_EE_W_X
      : eeE ? PARK_WALK_EE_E_X
      : ff ? PARK_WALK_FF_X
      : ffW ? PARK_WALK_FF_W_X
      : ffE ? PARK_WALK_FF_E_X
      : gg ? PARK_WALK_GG_X
      : ggW ? PARK_WALK_GG_W_X
      : ggE ? PARK_WALK_GG_E_X
      : hh ? PARK_WALK_HH_X
      : hhW ? PARK_WALK_HH_W_X
      : hhE ? PARK_WALK_HH_E_X
      : cx,
    z: cz,
    w, len,
    y0: CITY_Y, h: GARDEN_PATH_SLAB_H,
  };
}

function gardenPathSignedCells() {
  return [
    [GARDEN_PATH_X, GARDEN_PATH_Z],
    [PARK_WALK_X, PARK_WALK_Z],
    [PARK_WALK_E_X, PARK_WALK_E_Z],
    [PARK_WALK_NS_X, PARK_WALK_NS_Z],
    [PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z],
    [PARK_WALK_EE_X, PARK_WALK_EE_Z],
    [PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z],
    [PARK_WALK_EE_E_X, PARK_WALK_EE_E_Z],
    [PARK_WALK_FF_X, PARK_WALK_FF_Z],
    [PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z],
    [PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z],
    [PARK_WALK_GG_X, PARK_WALK_GG_Z],
    [PARK_WALK_GG_W_X, PARK_WALK_GG_W_Z],
    [PARK_WALK_GG_E_X, PARK_WALK_GG_E_Z],
    [PARK_WALK_HH_X, PARK_WALK_HH_Z],
    [PARK_WALK_HH_W_X, PARK_WALK_HH_W_Z],
    [PARK_WALK_HH_E_X, PARK_WALK_HH_E_Z],
  ];
}

function pathAlongZ(g) {
  return (g.z1 - g.z0) > (g.x1 - g.x0);
}

/** One grass hull at grade for grow-to-gap joints. Collider is the ground.
 *  Default is 268→284 / z=84. Pass gardenPathGeom(PARK_WALK_X, PARK_WALK_Z). */
export function gardenPathGrassHull(g = gardenPathGeom()) {
  return {
    tag: 'gardenPath-grass',
    x0: g.x0, x1: g.x1,
    z0: g.z0, z1: g.z1,
    y0: CITY_Y,
    seed: 0x61,
    collider: GARDEN_PATH_HULL_COLLIDER,
  };
}

/**
 * Two-abreast flagstones. Local jitter on slab size (0.5–0.7 m) and grass
 * joints (60–100 mm). Shared kit, not a second scatterer. No 300 mm tiles.
 * Default is 268→284 / z=84. Pass gardenPathGeom(PARK_WALK_X, PARK_WALK_Z).
 */
export function gardenPathSlabs(g = gardenPathGeom()) {
  if (pathAlongZ(g)) return gardenPathSlabsAlongZ(g);
  const slabs = [];
  let col = 0;
  let x = g.x0 + GARDEN_PATH_JOINT_MIN;
  const xLimit = g.x1 - GARDEN_PATH_JOINT_MIN;
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
    const edge = Math.max(0, (g.w - pair) / 2);
    const zSouth0 = g.z0 + edge;
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

/** Same two-abreast kit, marched along Z. Shared jitter, not a second kit. */
function gardenPathSlabsAlongZ(g) {
  const slabs = [];
  let col = 0;
  let z = g.z0 + GARDEN_PATH_JOINT_MIN;
  const zLimit = g.z1 - GARDEN_PATH_JOINT_MIN;
  while (z < zLimit - GARDEN_PATH_SLAB_MIN) {
    const u = pathHash01(col, 17);
    let sz = GARDEN_PATH_SLAB_MIN
      + u * (GARDEN_PATH_SLAB_MAX - GARDEN_PATH_SLAB_MIN);
    if (z + sz > zLimit) {
      sz = zLimit - z;
      if (sz < GARDEN_PATH_SLAB_MIN) break;
      if (sz > GARDEN_PATH_SLAB_MAX) sz = GARDEN_PATH_SLAB_MAX;
    }
    const jointZ = GARDEN_PATH_JOINT_MIN
      + pathHash01(col, 41) * (GARDEN_PATH_JOINT_MAX - GARDEN_PATH_JOINT_MIN);
    const jointX = GARDEN_PATH_JOINT_MIN
      + pathHash01(col, 31) * (GARDEN_PATH_JOINT_MAX - GARDEN_PATH_JOINT_MIN);
    const sx0 = GARDEN_PATH_SLAB_MIN
      + pathHash01(col, 5) * (GARDEN_PATH_SLAB_MAX - GARDEN_PATH_SLAB_MIN);
    const sx1 = GARDEN_PATH_SLAB_MIN
      + pathHash01(col, 7) * (GARDEN_PATH_SLAB_MAX - GARDEN_PATH_SLAB_MIN);
    const pair = sx0 + jointX + sx1;
    const edge = Math.max(0, (g.w - pair) / 2);
    const xWest0 = g.x0 + edge;
    const xEast0 = xWest0 + sx0 + jointX;
    slabs.push({
      x: xWest0 + sx0 / 2, z: z + sz / 2, sx: sx0, sz,
      x0: xWest0, x1: xWest0 + sx0, z0: z, z1: z + sz,
      row: 0, col,
    });
    slabs.push({
      x: xEast0 + sx1 / 2, z: z + sz / 2, sx: sx1, sz,
      x0: xEast0, x1: xEast0 + sx1, z0: z, z1: z + sz,
      row: 1, col,
    });
    z += sz + jointZ;
    col++;
  }
  return slabs;
}

function inPathGeom(g, x, z, margin) {
  return x >= g.x0 - margin && x <= g.x1 + margin
    && z >= g.z0 - margin && z <= g.z1 + margin;
}

export function inGardenPath(x, z, margin = 0) {
  const cells = gardenPathSignedCells();
  for (let i = 0; i < cells.length; i++) {
    if (inPathGeom(gardenPathGeom(cells[i][0], cells[i][1]), x, z, margin)) {
      return true;
    }
  }
  return false;
}

function slabHit(slabs, x, z, margin) {
  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    if (x >= s.x0 - margin && x <= s.x1 + margin
      && z >= s.z0 - margin && z <= s.z1 + margin) return s;
  }
  return null;
}

export function inGardenPathSlab(x, z, margin = 0) {
  const cells = gardenPathSignedCells();
  for (let i = 0; i < cells.length; i++) {
    if (slabHit(gardenPathSlabs(gardenPathGeom(cells[i][0], cells[i][1])), x, z, margin)) {
      return true;
    }
  }
  return false;
}

/**
 * Axis-aligned footprint vs garden-path flagstones. Bench uses this so it
 * cannot kiss a slab. Reject-or-drop, never nudge. Covers both signed walks.
 */
export function gardenPathSlabOverlap(x, z, w, d, margin = 0) {
  const x0 = x - w / 2, x1 = x + w / 2;
  const z0 = z - d / 2, z1 = z + d / 2;
  const cells = gardenPathSignedCells();
  const bags = [];
  for (let i = 0; i < cells.length; i++) {
    bags.push(gardenPathSlabs(gardenPathGeom(cells[i][0], cells[i][1])));
  }
  for (let b = 0; b < bags.length; b++) {
    const slabs = bags[b];
    for (let i = 0; i < slabs.length; i++) {
      const s = slabs[i];
      const ox = Math.min(x1, s.x1 + margin) - Math.max(x0, s.x0 - margin);
      if (ox <= 0) continue;
      const oz = Math.min(z1, s.z1 + margin) - Math.max(z0, s.z0 - margin);
      if (oz > 0) return s;
    }
  }
  return null;
}

/**
 * Grow-to-gap tufts in the grass joints. tryPlace-drop off pavement,
 * leftoverLot A/B/C reserved, and the flagstone slabs. Reject-or-drop,
 * never nudge. Palms stay off the path. Default is 268→284 / z=84.
 * Pass gardenPathGeom(PARK_WALK_X, PARK_WALK_Z).
 */
export function gardenPathPlantSpots(g = gardenPathGeom()) {
  const weeds = [];
  const slabs = gardenPathSlabs(g);
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
      const alongZ = pathAlongZ(g);
      const x = alongZ ? (a.x1 + b.x0) / 2 : (a.x0 + a.x1) / 2;
      const z = alongZ ? (a.z0 + a.z1) / 2 : (a.z1 + b.z0) / 2;
      if (!onPavement(x, z) && !inGardenPathSlab(x, z)) {
        weeds.push({ x, z, sc: 0.82, lean: 0.04 });
      }
    }
    const next = byCol[c + 1];
    if (a && next && next[0]) {
      const alongZ = pathAlongZ(g);
      const x = alongZ ? a.x : (a.x1 + next[0].x0) / 2;
      const z = alongZ ? (a.z1 + next[0].z0) / 2 : a.z;
      if (!onPavement(x, z) && !inGardenPathSlab(x, z)) {
        weeds.push({ x, z, sc: 0.70, lean: 0.03 });
      }
    }
  }
  return { weeds };
}

/**
 * Signed Tiny Glade 3-seat slat. Default is 276 / 82.4. Pass
 * (PARK_BENCH_X, PARK_BENCH_Z) for the park bench. Pass
 * (PARK_BENCH_W_X, PARK_BENCH_W_Z) for the west park bench at
 * 269.5 / 90. Pass (PARK_BENCH_E_X, PARK_BENCH_E_Z) for the
 * east twin at 282.5 / 90. Pass (PARK_BENCH_EE_X, PARK_BENCH_EE_Z)
 * for the E-park bench at 347 / 94.4. Pass (PARK_BENCH_EE_W_X,
 * PARK_BENCH_EE_W_Z) for the E-park west bench at 340.5 / 94.4.
 * Pass (PARK_BENCH_EE_E_X, PARK_BENCH_EE_E_Z) for the E-park
 * east bench at 353.5 / 94.4. Pass (PARK_BENCH_FF_X,
 * PARK_BENCH_FF_Z) for the F-park bench at 364 / 94.4
 * (347 kit +17 m). Pass (PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z)
 * for the F-park west bench at 357.5 / 94.4. Pass
 * (PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z) for the F-park east
 * bench at 370.5 / 94.4. Pass (PARK_BENCH_GG_X,
 * PARK_BENCH_GG_Z) for the G-park bench at 381 / 94.4
 * (364 kit +17 m). Pass (PARK_BENCH_GG_W_X, PARK_BENCH_GG_W_Z)
 * for the G-park west bench at 374.5 / 94.4. Pass
 * (PARK_BENCH_GG_E_X, PARK_BENCH_GG_E_Z) for the G-park east
 * bench at 387.5 / 94.4. Pass (PARK_BENCH_HH_X,
 * PARK_BENCH_HH_Z) for the H-park bench at 398 / 94.4
 * (381 kit +17 m). Pass (PARK_BENCH_HH_W_X, PARK_BENCH_HH_W_Z)
 * for the H-park west bench at 391.5 / 94.4. Pass
 * (PARK_BENCH_HH_E_X, PARK_BENCH_HH_E_Z) for the H-park east
 * bench at 404.5 / 94.4. Same schema — never
 * gardenBenchBGeom / gardenBenchCGeom / gardenBenchDGeom /
 * gardenBenchEGeom / gardenBenchFGeom / gardenBenchGGeom /
 * gardenBenchHGeom / parkBenchEEGeom / parkBenchEEWGeom /
 * parkBenchEEEGeom / parkBenchFFGeom / parkBenchGGGeom /
 * parkBenchHHGeom / parkBenchFGeom / leftoverLotEGeom /
 * leftoverLotDirtGeom.
 * Yaw faces the walk at z=84 (−Z when inland of the path)
 * unless the signed cell publishes its own yaw (347 / 94.4,
 * 340.5 / 94.4, 353.5 / 94.4, 364 / 94.4, 357.5 / 94.4,
 * 370.5 / 94.4, 381 / 94.4, 374.5 / 94.4, 387.5 / 94.4,
 * 398 / 94.4, 391.5 / 94.4, and 404.5 / 94.4
 * face +Z toward the EE / FF / GG / HH spine at z=96). Never remaps
 * x/z.
 * Scatter stays on tryPlace. Sit-box is empty air. Under-slat
 * clear is whoop + 5″ knife.
 */
export function gardenBenchGeom(cx = GARDEN_BENCH_X, cz = GARDEN_BENCH_Z) {
  const w = GARDEN_BENCH_W;
  const depth = GARDEN_BENCH_DEPTH;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - depth / 2;
  const z1 = cz + depth / 2;
  const yaw = (cx === PARK_BENCH_EE_X && cz === PARK_BENCH_EE_Z)
    ? PARK_BENCH_EE_YAW
    : (cx === PARK_BENCH_EE_W_X && cz === PARK_BENCH_EE_W_Z)
      ? PARK_BENCH_EE_W_YAW
      : (cx === PARK_BENCH_EE_E_X && cz === PARK_BENCH_EE_E_Z)
        ? PARK_BENCH_EE_E_YAW
        : (cx === PARK_BENCH_FF_X && cz === PARK_BENCH_FF_Z)
          ? PARK_BENCH_FF_YAW
          : (cx === PARK_BENCH_FF_W_X && cz === PARK_BENCH_FF_W_Z)
            ? PARK_BENCH_FF_W_YAW
            : (cx === PARK_BENCH_FF_E_X && cz === PARK_BENCH_FF_E_Z)
              ? PARK_BENCH_FF_E_YAW
              : (cx === PARK_BENCH_GG_X && cz === PARK_BENCH_GG_Z)
                ? PARK_BENCH_GG_YAW
                : (cx === PARK_BENCH_GG_W_X && cz === PARK_BENCH_GG_W_Z)
                  ? PARK_BENCH_GG_W_YAW
                  : (cx === PARK_BENCH_GG_E_X && cz === PARK_BENCH_GG_E_Z)
                    ? PARK_BENCH_GG_E_YAW
                    : (cx === PARK_BENCH_HH_X && cz === PARK_BENCH_HH_Z)
                      ? PARK_BENCH_HH_YAW
                      : (cx === PARK_BENCH_HH_W_X && cz === PARK_BENCH_HH_W_Z)
                        ? PARK_BENCH_HH_W_YAW
                        : (cx === PARK_BENCH_HH_E_X && cz === PARK_BENCH_HH_E_Z)
                          ? PARK_BENCH_HH_E_YAW
                          : (cz > GARDEN_PATH_Z ? PARK_BENCH_YAW : 0);
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

function gardenBenchSignedCells() {
  return [
    [GARDEN_BENCH_X, GARDEN_BENCH_Z],
    [PARK_BENCH_X, PARK_BENCH_Z],
    [PARK_BENCH_W_X, PARK_BENCH_W_Z],
    [PARK_BENCH_E_X, PARK_BENCH_E_Z],
    [PARK_BENCH_EE_X, PARK_BENCH_EE_Z],
    [PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z],
    [PARK_BENCH_EE_E_X, PARK_BENCH_EE_E_Z],
    [PARK_BENCH_FF_X, PARK_BENCH_FF_Z],
    [PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z],
    [PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z],
    [PARK_BENCH_GG_X, PARK_BENCH_GG_Z],
    [PARK_BENCH_GG_W_X, PARK_BENCH_GG_W_Z],
    [PARK_BENCH_GG_E_X, PARK_BENCH_GG_E_Z],
    [PARK_BENCH_HH_X, PARK_BENCH_HH_Z],
    [PARK_BENCH_HH_W_X, PARK_BENCH_HH_W_Z],
    [PARK_BENCH_HH_E_X, PARK_BENCH_HH_E_Z],
  ];
}

export function inGardenBench(x, z, margin = 0) {
  const cells = gardenBenchSignedCells();
  for (let i = 0; i < cells.length; i++) {
    const g = gardenBenchGeom(cells[i][0], cells[i][1]);
    if (x >= g.x0 - margin && x <= g.x1 + margin
        && z >= g.z0 - margin && z <= g.z1 + margin) {
      return true;
    }
  }
  return false;
}

/**
 * Legs + seat slats + back slats. Shared kit, not a second scatterer.
 * Rear posts run to the back crown so the sit-box stays a void.
 * Default is 276 / 82.4. Pass (PARK_BENCH_X, PARK_BENCH_Z) for the
 * park bench. Pass (PARK_BENCH_W_X, PARK_BENCH_W_Z) for 269.5 / 90.
 * Pass (PARK_BENCH_E_X, PARK_BENCH_E_Z) for 282.5 / 90. Pass
 * (PARK_BENCH_EE_X, PARK_BENCH_EE_Z) for 347 / 94.4. Pass
 * (PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z) for 340.5 / 94.4.
 * Pass (PARK_BENCH_EE_E_X, PARK_BENCH_EE_E_Z) for 353.5 /
 * 94.4 — never gardenBenchBParts / gardenBenchCParts /
 * gardenBenchDParts / gardenBenchEParts / gardenBenchFParts /
 * gardenBenchGParts / gardenBenchHParts / parkBenchEEParts /
 * parkBenchEEWParts / parkBenchEEEParts / parkBenchFParts.
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
  { x0: CLEVELANDER_X - CLEVELANDER_W / 2 - 1.2, x1: CLEVELANDER_X + CLEVELANDER_W / 2 + 1.2,
    z0: 55.6, z1: 86, tag: 'clevelander' },
  { x0: CASA_X - CASA_W / 2 - 1.4, x1: CASA_X + CASA_W / 2 + 1.4,
    z0: 55.6, z1: 90, tag: 'casa' },
  { x0: CARDOZO_X - CARDOZO_W / 2 - 1.2, x1: CARDOZO_X + CARDOZO_W / 2 + 1.2,
    z0: 55.6, z1: 86, tag: 'cardozo' },
  { x0: COLONY_X - COLONY_W / 2 - 1.2, x1: COLONY_X + COLONY_W / 2 + 1.2,
    z0: 55.6, z1: 86, tag: 'colony' },
  { x0: AVALON_X - AVALON_W / 2 - 1.2, x1: AVALON_X + AVALON_W / 2 + 1.2,
    z0: 55.6, z1: 86, tag: 'avalon' },
  { x0: MAJESTIC_X - MAJESTIC_W / 2 - 1.2, x1: MAJESTIC_X + MAJESTIC_W / 2 + 1.2,
    z0: 55.6, z1: 86, tag: 'majestic' },
  { x0: BREAKWATER_X - BREAKWATER_W / 2 - 1.2, x1: BREAKWATER_X + BREAKWATER_W / 2 + 1.2,
    z0: 55.6, z1: 86, tag: 'breakwater' },
  { x0: CAVALIER_X - CAVALIER_W / 2 - 1.2, x1: CAVALIER_X + CAVALIER_W / 2 + 1.2,
    z0: 55.6, z1: 86, tag: 'cavalier' },
  { x0: WINTERHAVEN_X - WINTERHAVEN_W / 2 - 1.2, x1: WINTERHAVEN_X + WINTERHAVEN_W / 2 + 1.2,
    z0: 55.6, z1: 76, tag: 'winterhaven' },
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
  { x0: LEFTOVER_LOT_E_X0 - 2.2, x1: LEFTOVER_LOT_E_X1 + 1.8,
    z0: LEFTOVER_LOT_E_Z0 - 1.5, z1: LEFTOVER_LOT_E_Z1 + 1.4, tag: 'leftoverLot' },
  { x0: LEFTOVER_LOT_F_X0 - 2.2, x1: LEFTOVER_LOT_F_X1 + 1.8,
    z0: LEFTOVER_LOT_F_Z0 - 1.5, z1: LEFTOVER_LOT_F_Z1 + 1.4, tag: 'leftoverLot' },
  { x0: LEFTOVER_LOT_G_X0 - 2.2, x1: LEFTOVER_LOT_G_X1 + 1.8,
    z0: LEFTOVER_LOT_G_Z0 - 1.5, z1: LEFTOVER_LOT_G_Z1 + 1.4, tag: 'leftoverLot' },
  { x0: LEFTOVER_LOT_H_X0 - 2.2, x1: LEFTOVER_LOT_H_X1 + 1.8,
    z0: LEFTOVER_LOT_H_Z0 - 1.5, z1: LEFTOVER_LOT_H_Z1 + 1.4, tag: 'leftoverLot' },
  { x0: POCKET_PARK_E_X0 - 2.2, x1: POCKET_PARK_E_X1 + 1.8,
    z0: POCKET_PARK_E_Z0 - 1.5, z1: POCKET_PARK_E_Z1 + 1.4, tag: 'pocketPark' },
  { x0: POCKET_PARK_F_X0 - 2.2, x1: POCKET_PARK_F_X1 + 1.8,
    z0: POCKET_PARK_F_Z0 - 1.5, z1: POCKET_PARK_F_Z1 + 1.4, tag: 'pocketPark' },
  { x0: POCKET_PARK_G_X0 - 2.2, x1: POCKET_PARK_G_X1 + 1.8,
    z0: POCKET_PARK_G_Z0 - 1.5, z1: POCKET_PARK_G_Z1 + 1.4, tag: 'pocketPark' },
  { x0: POCKET_PARK_H_X0 - 2.2, x1: POCKET_PARK_H_X1 + 1.8,
    z0: POCKET_PARK_H_Z0 - 1.5, z1: POCKET_PARK_H_Z1 + 1.4, tag: 'pocketPark' },
  { x0: GARDEN_PATH_X0 - 2.2, x1: GARDEN_PATH_X1 + 1.8,
    z0: GARDEN_PATH_Z0 - 1.5, z1: GARDEN_PATH_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_X0 - 2.2, x1: PARK_WALK_X1 + 1.8,
    z0: PARK_WALK_Z0 - 1.5, z1: PARK_WALK_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_E_X0 - 2.2, x1: PARK_WALK_E_X1 + 1.8,
    z0: PARK_WALK_E_Z0 - 1.5, z1: PARK_WALK_E_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_NS_X0 - 2.2, x1: PARK_WALK_NS_X1 + 1.8,
    z0: PARK_WALK_NS_Z0 - 1.5, z1: PARK_WALK_NS_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_NS_E_X0 - 2.2, x1: PARK_WALK_NS_E_X1 + 1.8,
    z0: PARK_WALK_NS_E_Z0 - 1.5, z1: PARK_WALK_NS_E_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_EE_X0 - 2.2, x1: PARK_WALK_EE_X1 + 1.8,
    z0: PARK_WALK_EE_Z0 - 1.5, z1: PARK_WALK_EE_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_EE_W_X0 - 2.2, x1: PARK_WALK_EE_W_X1 + 1.8,
    z0: PARK_WALK_EE_W_Z0 - 1.5, z1: PARK_WALK_EE_W_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_EE_E_X0 - 2.2, x1: PARK_WALK_EE_E_X1 + 1.8,
    z0: PARK_WALK_EE_E_Z0 - 1.5, z1: PARK_WALK_EE_E_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_FF_X0 - 2.2, x1: PARK_WALK_FF_X1 + 1.8,
    z0: PARK_WALK_FF_Z0 - 1.5, z1: PARK_WALK_FF_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_FF_W_X0 - 2.2, x1: PARK_WALK_FF_W_X1 + 1.8,
    z0: PARK_WALK_FF_W_Z0 - 1.5, z1: PARK_WALK_FF_W_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_FF_E_X0 - 2.2, x1: PARK_WALK_FF_E_X1 + 1.8,
    z0: PARK_WALK_FF_E_Z0 - 1.5, z1: PARK_WALK_FF_E_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_GG_X0 - 2.2, x1: PARK_WALK_GG_X1 + 1.8,
    z0: PARK_WALK_GG_Z0 - 1.5, z1: PARK_WALK_GG_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_GG_W_X0 - 2.2, x1: PARK_WALK_GG_W_X1 + 1.8,
    z0: PARK_WALK_GG_W_Z0 - 1.5, z1: PARK_WALK_GG_W_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_GG_E_X0 - 2.2, x1: PARK_WALK_GG_E_X1 + 1.8,
    z0: PARK_WALK_GG_E_Z0 - 1.5, z1: PARK_WALK_GG_E_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_HH_X0 - 2.2, x1: PARK_WALK_HH_X1 + 1.8,
    z0: PARK_WALK_HH_Z0 - 1.5, z1: PARK_WALK_HH_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_HH_W_X0 - 2.2, x1: PARK_WALK_HH_W_X1 + 1.8,
    z0: PARK_WALK_HH_W_Z0 - 1.5, z1: PARK_WALK_HH_W_Z1 + 1.4, tag: 'gardenPath' },
  { x0: PARK_WALK_HH_E_X0 - 2.2, x1: PARK_WALK_HH_E_X1 + 1.8,
    z0: PARK_WALK_HH_E_Z0 - 1.5, z1: PARK_WALK_HH_E_Z1 + 1.4, tag: 'gardenPath' },
  { x0: GARDEN_BENCH_X0 - 2.2, x1: GARDEN_BENCH_X1 + 1.8,
    z0: GARDEN_BENCH_Z0 - 1.5, z1: GARDEN_BENCH_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_X0 - 2.2, x1: PARK_BENCH_X1 + 1.8,
    z0: PARK_BENCH_Z0 - 1.5, z1: PARK_BENCH_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_W_X0 - 2.2, x1: PARK_BENCH_W_X1 + 1.8,
    z0: PARK_BENCH_W_Z0 - 1.5, z1: PARK_BENCH_W_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_E_X0 - 2.2, x1: PARK_BENCH_E_X1 + 1.8,
    z0: PARK_BENCH_E_Z0 - 1.5, z1: PARK_BENCH_E_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_EE_X0 - 2.2, x1: PARK_BENCH_EE_X1 + 1.8,
    z0: PARK_BENCH_EE_Z0 - 1.5, z1: PARK_BENCH_EE_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_EE_W_X0 - 2.2, x1: PARK_BENCH_EE_W_X1 + 1.8,
    z0: PARK_BENCH_EE_W_Z0 - 1.5, z1: PARK_BENCH_EE_W_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_EE_E_X0 - 2.2, x1: PARK_BENCH_EE_E_X1 + 1.8,
    z0: PARK_BENCH_EE_E_Z0 - 1.5, z1: PARK_BENCH_EE_E_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_FF_X0 - 2.2, x1: PARK_BENCH_FF_X1 + 1.8,
    z0: PARK_BENCH_FF_Z0 - 1.5, z1: PARK_BENCH_FF_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_FF_W_X0 - 2.2, x1: PARK_BENCH_FF_W_X1 + 1.8,
    z0: PARK_BENCH_FF_W_Z0 - 1.5, z1: PARK_BENCH_FF_W_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_FF_E_X0 - 2.2, x1: PARK_BENCH_FF_E_X1 + 1.8,
    z0: PARK_BENCH_FF_E_Z0 - 1.5, z1: PARK_BENCH_FF_E_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_GG_X0 - 2.2, x1: PARK_BENCH_GG_X1 + 1.8,
    z0: PARK_BENCH_GG_Z0 - 1.5, z1: PARK_BENCH_GG_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_GG_W_X0 - 2.2, x1: PARK_BENCH_GG_W_X1 + 1.8,
    z0: PARK_BENCH_GG_W_Z0 - 1.5, z1: PARK_BENCH_GG_W_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_GG_E_X0 - 2.2, x1: PARK_BENCH_GG_E_X1 + 1.8,
    z0: PARK_BENCH_GG_E_Z0 - 1.5, z1: PARK_BENCH_GG_E_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_HH_X0 - 2.2, x1: PARK_BENCH_HH_X1 + 1.8,
    z0: PARK_BENCH_HH_Z0 - 1.5, z1: PARK_BENCH_HH_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_HH_W_X0 - 2.2, x1: PARK_BENCH_HH_W_X1 + 1.8,
    z0: PARK_BENCH_HH_W_Z0 - 1.5, z1: PARK_BENCH_HH_W_Z1 + 1.4, tag: 'gardenBench' },
  { x0: PARK_BENCH_HH_E_X0 - 2.2, x1: PARK_BENCH_HH_E_X1 + 1.8,
    z0: PARK_BENCH_HH_E_Z0 - 1.5, z1: PARK_BENCH_HH_E_Z1 + 1.4, tag: 'gardenBench' },
  { x0: -452, x1: -408, z0: 74, z1: 128, tag: 'helipadW' },
  { x0: 408, x1: 452, z0: 44, z1: 98, tag: 'helipadE' },
  ...ALLEY_PIPE_CELLS.map(([x, z]) => ({
    x0: x - 2.2, x1: x + 1.8,
    z0: z - ALLEY_PIPE_HALF_Z - 1.5, z1: z + ALLEY_PIPE_HALF_Z + 1.4,
    tag: 'alley-pipe',
  })),
  ...FIRE_ESCAPE_CELLS.map(([x, z]) => ({
    x0: x - 2.2, x1: x + 1.8,
    z0: z - FIRE_ESCAPE_HALF_Z - 1.5, z1: z + FIRE_ESCAPE_HALF_Z + 1.4,
    tag: 'fire-escape',
  })),
  ...fifthShops().map((g) => ({
    x0: g.x0 - 2.2, x1: g.x1 + 1.8,
    z0: g.z0 - 1.5, z1: g.z1 + 1.4,
    tag: 'fifth',
  })),
  ...espaShops().map((g) => ({
    x0: g.x0 - 2.2, x1: g.x1 + 1.8,
    z0: g.z0 - 1.5, z1: g.z1 + 1.4,
    tag: 'espa',
  })),
  ...eighthShops().map((g) => ({
    x0: g.x0 - 2.2, x1: g.x1 + 1.8,
    z0: g.z0 - 1.5, z1: g.z1 + 1.4,
    tag: 'eighth',
  })),
  ...gap315Shops().map((g) => ({
    x0: g.x0 - 2.2, x1: g.x1 + 1.8,
    z0: g.z0 - 1.5, z1: g.z1 + 1.4,
    tag: 'gap315',
  })),
  ...gap501Shops().map((g) => ({
    x0: g.x0 - 2.2, x1: g.x1 + 1.8,
    z0: g.z0 - 1.5, z1: g.z1 + 1.4,
    tag: 'gap501',
  })),
  ...inlandMidrises().map((g) => ({
    x0: g.x0 - 0.8, x1: g.x1 + 0.8,
    z0: g.z0 - 0.6, z1: g.z1 + 0.6,
    tag: 'inland-midrise',
  })),
  ...lincolnWalkRuns().map((g) => ({
    x0: g.x0 - 2.2, x1: g.x1 + 1.8,
    z0: LINCOLN_S_FRONT_Z - LINCOLN_D - 1.5,
    z1: LINCOLN_N_FRONT_Z + LINCOLN_D + 1.4,
    tag: 'lincoln',
  })),
  ...lincolnShops().map((g) => ({
    x0: g.x0 - 2.2, x1: g.x1 + 1.8,
    z0: g.z0 - 1.5, z1: g.z1 + 1.4,
    tag: 'lincoln',
  })),
  ...lincolnPergolas().map((g) => ({
    x0: g.x0 - 2.2, x1: g.x1 + 1.8,
    z0: g.z0 - 1.5, z1: g.z1 + 1.4,
    tag: 'lincoln',
  })),
  ...washingtonRuns().map((g) => ({
    x0: g.x0 - 2.2, x1: Math.min(g.x1 + 1.8, 240),
    z0: WASH_SW_OCEAN_Z0 - 1.5, z1: WASH_SW_INLAND_Z1 + 1.4,
    tag: 'washington',
  })),
  {
    x0: WASH_ARCADE_X - WASH_ARCADE_HALF_X - 0.8,
    x1: WASH_ARCADE_X + WASH_ARCADE_HALF_X + 0.8,
    z0: WASH_ARCADE_Z - WASH_ARCADE_HALF_Z - 0.8,
    z1: WASH_ARCADE_Z + WASH_ARCADE_HALF_Z + 0.8,
    tag: 'washington',
  },
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
  const ozWash = Math.min(z1, WASH_Z1) - Math.max(z0, WASH_Z0);
  if (ozWash > margin) {
    const oxWash = Math.min(x1, Math.min(WASH_X1, 240)) - Math.max(x0, WASH_X0);
    if (oxWash > margin) return true;
  }
  return false;
}

/** True when (x,z) sits in leftoverLot A, B, C, D, E, F, G, or H reserved boxes. */
export function inLeftoverLotReserved(x, z) {
  for (let i = 0; i < RESERVED.length; i++) {
    const r = RESERVED[i];
    if (r.tag !== 'leftoverLot') continue;
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return true;
  }
  return false;
}

/**
 * Axis-aligned footprint vs leftoverLot A/B/C/D/E/F/G/H reserved only.
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

/** True when (x,z) sits in helipad E (~430/70) or helipad W reserved. */
export function inHelipadReserved(x, z) {
  for (let i = 0; i < RESERVED.length; i++) {
    const r = RESERVED[i];
    if (r.tag !== 'helipadE' && r.tag !== 'helipadW') continue;
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return true;
  }
  return false;
}

/**
 * Axis-aligned footprint vs helipad E/W reserved only.
 * Inland mid-rises use this so a west plate cannot restack helipad W.
 */
export function helipadOverlap(x, z, w, d, margin = 0.15) {
  const hw = w / 2, hd = d / 2;
  for (let i = 0; i < RESERVED.length; i++) {
    const r = RESERVED[i];
    if (r.tag !== 'helipadE' && r.tag !== 'helipadW') continue;
    const ox = Math.min(x + hw, r.x1) - Math.max(x - hw, r.x0);
    if (ox <= margin) continue;
    const oz = Math.min(z + hd, r.z1) - Math.max(z - hd, r.z0);
    if (oz > margin) return true;
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

function pathFootprintOverlaps(g, bx, bz, bw, bd, margin) {
  const ox = Math.min(g.x1, bx + bw / 2) - Math.max(g.x0, bx - bw / 2);
  const oz = Math.min(g.z1, bz + bd / 2) - Math.max(g.z0, bz - bd / 2);
  return ox > margin && oz > margin;
}

/**
 * Reject-or-drop for a signed Tiny Glade walk cell. Default is 268→284 /
 * z=84. Pass (PARK_WALK_X, PARK_WALK_Z) for the west park walk. Pass
 * (PARK_WALK_E_X, PARK_WALK_E_Z) for the east twin. Pass
 * (PARK_WALK_NS_X, PARK_WALK_NS_Z) for the N-S connector. Pass
 * (PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z) for the east N-S twin. Pass
 * (PARK_WALK_EE_X, PARK_WALK_EE_Z) for the E-park spine. Pass
 * (PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z) for the E-park west walk
 * (339→345.2 / z=98.5). Pass (PARK_WALK_EE_E_X, PARK_WALK_EE_E_Z)
 * for the E-park east walk (348.8→355 / z=98.5). Pass
 * (PARK_WALK_FF_X, PARK_WALK_FF_Z) for the F-park spine
 * (356→372 / z=96). Pass (PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z)
 * for the F-park west walk (356→362.2 / z=98.5). Pass
 * (PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z) for the F-park east
 * walk (365.8→372 / z=98.5). Pass (PARK_WALK_GG_X,
 * PARK_WALK_GG_Z) for the G-park spine (373→389 / z=96). Pass
 * (PARK_WALK_GG_W_X, PARK_WALK_GG_W_Z) for the G-park west
 * walk (373→379.2 / z=98.5). Pass (PARK_WALK_GG_E_X,
 * PARK_WALK_GG_E_Z) for the G-park east walk (382.8→389 /
 * z=98.5). Pass (PARK_WALK_HH_X, PARK_WALK_HH_Z) for the
 * H-park spine (390→406 / z=96). Pass
 * (PARK_WALK_HH_W_X, PARK_WALK_HH_W_Z) for the H-park west
 * walk (390→396.2 / z=98.5). Pass (PARK_WALK_HH_E_X,
 * PARK_WALK_HH_E_Z) for the H-park east walk (399.8→406 /
 * z=98.5). Fail
 * if pavement, streetOverlap, leftoverLot A–H reserved,
 * warehouse reserved, helipad reserved, a kiss of 276/82.4, a
 * kiss of 276/90, a kiss of the 276/94 posts / sash, a kiss of
 * the 347/98.5 posts / sash, a kiss of the 364/98.5 posts /
 * sash, a kiss of the 381/98.5 posts / sash, a kiss of the
 * 398/98.5 posts / sash, a kiss of the EE
 * spine slabs, a kiss of the FF spine slabs, a kiss of the GG
 * spine slabs, a kiss of the HH spine slabs, a kiss of 347/94.4,
 * a kiss of 364/94.4, a kiss of 381/94.4, a kiss of 398/94.4,
 * a kiss of the 339→345.2 west walk, a kiss of
 * the 276 park hull (unless the cell is a signed 276 walk —
 * this H-park spine is not a 276 walk), a
 * kiss of the 84 walk, or a kiss of the z=94 slabs. Sitting on
 * the H-park hull is not a fail (park-walk spines live on the
 * hull by design). Does not merge with PARK_WALK_GG_X1=389
 * (1 m west gap, same z). Does not merge with
 * PARK_WALK_FF_X1=372 (1 m west gap, same z). leftoverLot H
 * reserved z1+1.4=91.4 vs walk z0=95.2 is not a
 * leftoverLotOverlap. leftoverLot G reserved z1+1.4=91.4 vs
 * walk z0=95.2 is not a leftoverLotOverlap. Never nudges
 * x/z.
 */
export function gardenPathRejected(cx = GARDEN_PATH_X, cz = GARDEN_PATH_Z) {
  const g = gardenPathGeom(cx, cz);
  const spanX = g.x1 - g.x0;
  const spanZ = g.z1 - g.z0;
  if (onPavement(g.x, g.z) || onPavement(g.x0, g.z) || onPavement(g.x1, g.z)
      || onPavement(g.x, g.z0) || onPavement(g.x, g.z1)) {
    return true;
  }
  if (streetOverlap(g.x, g.z, spanX, spanZ)) return true;
  if (leftoverLotOverlap(g.x, g.z, spanX, spanZ, 0.15)) return true;
  if (inLeftoverLotReserved(g.x, g.z)
    || inLeftoverLotReserved(g.x0, g.z)
    || inLeftoverLotReserved(g.x1, g.z)
    || inLeftoverLotReserved(g.x, g.z0)
    || inLeftoverLotReserved(g.x, g.z1)) return true;
  if (warehouseOverlap(g.x, g.z, spanX, spanZ, 0.15)) return true;
  if (inWarehouseReserved(g.x, g.z)
    || inWarehouseReserved(g.x0, g.z)
    || inWarehouseReserved(g.x1, g.z)
    || inWarehouseReserved(g.x, g.z0)
    || inWarehouseReserved(g.x, g.z1)) return true;
  if (inHelipadReserved(g.x, g.z)
    || inHelipadReserved(g.x0, g.z) || inHelipadReserved(g.x1, g.z)
    || inHelipadReserved(g.x, g.z0) || inHelipadReserved(g.x, g.z1)) {
    return true;
  }
  const on276Walk = (cx === PARK_WALK_X && cz === PARK_WALK_Z)
    || (cx === PARK_WALK_E_X && cz === PARK_WALK_E_Z)
    || (cx === PARK_WALK_NS_X && cz === PARK_WALK_NS_Z)
    || (cx === PARK_WALK_NS_E_X && cz === PARK_WALK_NS_E_Z);
  if (!on276Walk) {
    const park276 = pocketParkHull();
    if (pathFootprintOverlaps(g, park276.x, park276.z, park276.w, park276.d, 0)) {
      return true;
    }
  }
  const seats = gardenBenchSignedCells();
  for (let s = 0; s < seats.length; s++) {
    const seat = gardenBenchGeom(seats[s][0], seats[s][1]);
    if (pathFootprintOverlaps(g, seat.x, seat.z, seat.w, seat.depth, 0)) {
      return true;
    }
  }
  const gates = boardwalkGateSignedCells();
  for (let i = 0; i < gates.length; i++) {
    if (boardwalkGatePathKiss(g, gates[i][0], gates[i][1])) return true;
  }
  const cells = gardenPathSignedCells();
  for (let i = 0; i < cells.length; i++) {
    const wx = cells[i][0], wz = cells[i][1];
    if (wx === cx && wz === cz) continue;
    const o = gardenPathGeom(wx, wz);
    if (pathFootprintOverlaps(g, o.x, o.z, o.x1 - o.x0, o.z1 - o.z0, 0)) {
      return true;
    }
    const slabs = gardenPathSlabs(o);
    for (let j = 0; j < slabs.length; j++) {
      const s = slabs[j];
      const ox = Math.min(g.x1, s.x1) - Math.max(g.x0, s.x0);
      if (ox <= 0) continue;
      const oz = Math.min(g.z1, s.z1) - Math.max(g.z0, s.z0);
      if (oz > 0) return true;
    }
  }
  return false;
}

/**
 * Reject-or-drop for a signed Tiny Glade bench cell. Default is 276 / 82.4.
 * Pass (PARK_BENCH_X, PARK_BENCH_Z) for the park bench. Pass
 * (PARK_BENCH_W_X, PARK_BENCH_W_Z) for 269.5 / 90. Pass
 * (PARK_BENCH_E_X, PARK_BENCH_E_Z) for 282.5 / 90. Pass
 * (PARK_BENCH_EE_X, PARK_BENCH_EE_Z) for 347 / 94.4. Pass
 * (PARK_BENCH_EE_W_X, PARK_BENCH_EE_W_Z) for 340.5 / 94.4.
 * Pass (PARK_BENCH_EE_E_X, PARK_BENCH_EE_E_Z) for 353.5 / 94.4.
 * Pass (PARK_BENCH_FF_X, PARK_BENCH_FF_Z) for 364 / 94.4.
 * Pass (PARK_BENCH_FF_W_X, PARK_BENCH_FF_W_Z) for 357.5 / 94.4.
 * Pass (PARK_BENCH_FF_E_X, PARK_BENCH_FF_E_Z) for 370.5 / 94.4.
 * Pass (PARK_BENCH_GG_X, PARK_BENCH_GG_Z) for 381 / 94.4.
 * Pass (PARK_BENCH_GG_W_X, PARK_BENCH_GG_W_Z) for 374.5 / 94.4.
 * Pass (PARK_BENCH_GG_E_X, PARK_BENCH_GG_E_Z) for 387.5 / 94.4.
 * Pass (PARK_BENCH_HH_X, PARK_BENCH_HH_Z) for 398 / 94.4.
 * Pass (PARK_BENCH_HH_W_X, PARK_BENCH_HH_W_Z) for 391.5 / 94.4.
 * Pass (PARK_BENCH_HH_E_X, PARK_BENCH_HH_E_Z) for 404.5 / 94.4.
 * Fail if pavement, streetOverlap, leftoverLot A–H reserved,
 * warehouse reserved, helipad reserved, a garden-path slab kiss,
 * a kiss of the EE / FF / GG / HH spine slabs, a kiss of the x=272
 * N-S walk, a kiss of the x=280 N-S walk, or a kiss of another
 * signed bench (276/90 / 269.5/90 / 282.5/90 / 347/94.4 /
 * 340.5/94.4 / 353.5/94.4 / 364/94.4 / 357.5/94.4 /
 * 370.5/94.4 / 381/94.4 / 374.5/94.4 / 387.5/94.4 /
 * 398/94.4 / 391.5/94.4 / 404.5/94.4). 347 /
 * 94.4, 340.5 / 94.4, and 353.5 / 94.4 live on the E park
 * hull — sitting inside POCKET_PARK_E reserved/keepout is not
 * a fail. 364 / 94.4, 357.5 / 94.4, and 370.5 / 94.4 live on
 * the F park hull — sitting inside POCKET_PARK_F
 * reserved/keepout is not a fail. 381 / 94.4, 374.5 / 94.4,
 * and 387.5 / 94.4 live on the G park hull — sitting inside
 * POCKET_PARK_G reserved/keepout is not a fail. 398 / 94.4,
 * 391.5 / 94.4, and 404.5 / 94.4 live on the H park hull —
 * sitting inside POCKET_PARK_H reserved/keepout is not a fail
 * (276 benches already sit on the 276 park plate). Path keepout
 * padding is expected (0.8 m ocean of z0=83.2; 0.8 m edge-to-walk
 * of x0=271.2 / x1=280.8; 0.8 m center-to-spine of EE / FF / GG
 * / HH z0=95.2) and is not a fail. Never nudges x/z.
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
  if (warehouseOverlap(g.x, g.z, g.w, g.depth, 0.15)) return true;
  if (inWarehouseReserved(g.x, g.z)
    || inWarehouseReserved(g.x0, g.z)
    || inWarehouseReserved(g.x1, g.z)
    || inWarehouseReserved(g.x, g.z0)
    || inWarehouseReserved(g.x, g.z1)) return true;
  if (inHelipadReserved(g.x, g.z)
    || inHelipadReserved(g.x0, g.z) || inHelipadReserved(g.x1, g.z)
    || inHelipadReserved(g.x, g.z0) || inHelipadReserved(g.x, g.z1)) {
    return true;
  }
  if (inGardenPathSlab(g.x, g.z)
    || inGardenPathSlab(g.x0, g.z) || inGardenPathSlab(g.x1, g.z)
    || inGardenPathSlab(g.x, g.z0) || inGardenPathSlab(g.x, g.z1)
    || inGardenPathSlab(g.x0, g.z0) || inGardenPathSlab(g.x1, g.z0)
    || inGardenPathSlab(g.x0, g.z1) || inGardenPathSlab(g.x1, g.z1)) {
    return true;
  }
  if (gardenPathSlabOverlap(g.x, g.z, g.w, g.depth, 0)) return true;
  const walks = gardenPathSignedCells();
  for (let i = 0; i < walks.length; i++) {
    const p = gardenPathGeom(walks[i][0], walks[i][1]);
    if (pathFootprintOverlaps(p, g.x, g.z, g.w, g.depth, 0)) return true;
  }
  const seats = gardenBenchSignedCells();
  for (let i = 0; i < seats.length; i++) {
    if (seats[i][0] === cx && seats[i][1] === cz) continue;
    const o = gardenBenchGeom(seats[i][0], seats[i][1]);
    if (pathFootprintOverlaps(g, o.x, o.z, o.w, o.depth, 0)) return true;
  }
  const hw = g.w / 2, hd = g.depth / 2;
  for (let i = 0; i < RESERVED.length; i++) {
    const r = RESERVED[i];
    if (r.tag === 'gardenPath' || r.tag === 'gardenBench'
        || r.tag === 'pocketPark') continue;
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
 * One leftover-city plate at grade. Default is 276/92 (268–284 / 88–96).
 * Pass (POCKET_PARK_E_X, POCKET_PARK_E_Z) for the signed 347/96 hull
 * (339–355 / 92–100). Pass (POCKET_PARK_F_X, POCKET_PARK_F_Z) for
 * the signed 364/96 hull (356–372 / 92–100). Pass
 * (POCKET_PARK_G_X, POCKET_PARK_G_Z) for the signed 381/96 hull
 * (373–389 / 92–100). Pass (POCKET_PARK_H_X, POCKET_PARK_H_Z) for
 * the signed 398/96 hull (390–406 / 92–100). Same schema — never
 * pocketParkEGeom, never pocketParkFGeom, never pocketParkGGeom,
 * never pocketParkHGeom. Never remaps x/z. Scatter
 * stays on tryPlace. 276 z0=88 sits inland of path z1=84.8 — do
 * not slide that hull onto the path. E z0=92 sits 2 m inland of
 * leftoverLot E (z1=90). F z0=92 sits 2 m inland of leftoverLot F
 * (z1=90). G z0=92 sits 2 m inland of leftoverLot G (z1=90).
 * H z0=92 sits 2 m inland of leftoverLot H (z1=90).
 * leftoverLotOverlap of H reserved is 0 (1 m leftover apron, not
 * a kiss). G-park x1=389 must not merge with this hull (H x0=390).
 * leftoverLotOverlap of G reserved is 0 (1 m leftover apron, not
 * a kiss). F-park x1=372 must not merge with this hull (G x0=373).
 * leftoverLotOverlap of F reserved is 0 (1 m leftover apron, not a
 * kiss). E-park x1=355 must not merge with F (F x0=356). Collider
 * is the ground / thin grade hull.
 */
export function pocketParkHull(cx = POCKET_PARK_X, cz = POCKET_PARK_Z) {
  const w = POCKET_PARK_W;
  const d = POCKET_PARK_D;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  const seed = (cx === POCKET_PARK_X && cz === POCKET_PARK_Z)
    ? 0x70
    : (cx === POCKET_PARK_E_X && cz === POCKET_PARK_E_Z)
      ? 0x71
      : (cx === POCKET_PARK_F_X && cz === POCKET_PARK_F_Z)
        ? 0x72
        : (cx === POCKET_PARK_G_X && cz === POCKET_PARK_G_Z)
          ? 0x73
          : 0x74;
  return {
    tag: 'pocketPark',
    x0, x1, z0, z1,
    x: cx, z: cz,
    w, d,
    y0: CITY_Y,
    seed,
    collider: POCKET_PARK_HULL_COLLIDER,
  };
}

export function pocketParkArea(cx = POCKET_PARK_X, cz = POCKET_PARK_Z) {
  const g = pocketParkHull(cx, cz);
  return (g.x1 - g.x0) * (g.z1 - g.z0);
}

function inPocketParkHull(g, x, z, margin) {
  return x >= g.x0 - margin && x <= g.x1 + margin
    && z >= g.z0 - margin && z <= g.z1 + margin;
}

export function inPocketPark(x, z, margin = 0) {
  return inPocketParkHull(pocketParkHull(), x, z, margin)
    || inPocketParkHull(pocketParkHull(POCKET_PARK_E_X, POCKET_PARK_E_Z), x, z, margin)
    || inPocketParkHull(pocketParkHull(POCKET_PARK_F_X, POCKET_PARK_F_Z), x, z, margin)
    || inPocketParkHull(pocketParkHull(POCKET_PARK_G_X, POCKET_PARK_G_Z), x, z, margin)
    || inPocketParkHull(pocketParkHull(POCKET_PARK_H_X, POCKET_PARK_H_Z), x, z, margin);
}

/**
 * tryPlace-drop on warehouse, leftoverLot A–H reserved, helipad E
 * (~430/70), the garden path, pavement, and street. Reject-or-drop,
 * never nudge. Never remaps.
 */
export function pocketParkDrop(x, z) {
  if (onPavement(x, z)) return true;
  if (inLeftoverLotReserved(x, z)) return true;
  if (inWarehouseReserved(x, z)) return true;
  if (inHelipadReserved(x, z)) return true;
  if (inGardenPath(x, z)) return true;
  return false;
}

/**
 * Lean at the nearest leftoverLot fence (A/B/C/D/E/F/G) or garden path if
 * it reaches. 276 z0=88 sits inland of path z1=84.8 — do not slide.
 * E sits 2 m inland of leftoverLot E (z1=90) — lean if the fence
 * reaches. F-park sits 2 m inland of leftoverLot F (z1=90) — lean
 * if the fence reaches. Lot F also sits 2 m east / 2 m ocean of
 * the E-park — lean if that fence reaches. G-park sits 2 m inland
 * of leftoverLot G (z1=90) — lean if the fence reaches. Lot G
 * also sits 2 m east of F-park x1=372 — lean if that fence reaches.
 * H-park sits 2 m inland of leftoverLot H (z1=90) — lean if the
 * fence reaches. Lot H also sits 2 m east of G-park x1=389 —
 * lean if that fence reaches.
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
    x, z, LEFTOVER_LOT_E_X0, LEFTOVER_LOT_E_X1, LEFTOVER_LOT_E_Z0, LEFTOVER_LOT_E_Z1,
  ));
  d = Math.min(d, distToAabb(
    x, z, LEFTOVER_LOT_F_X0, LEFTOVER_LOT_F_X1, LEFTOVER_LOT_F_Z0, LEFTOVER_LOT_F_Z1,
  ));
  d = Math.min(d, distToAabb(
    x, z, LEFTOVER_LOT_G_X0, LEFTOVER_LOT_G_X1, LEFTOVER_LOT_G_Z0, LEFTOVER_LOT_G_Z1,
  ));
  d = Math.min(d, distToAabb(
    x, z, LEFTOVER_LOT_H_X0, LEFTOVER_LOT_H_X1, LEFTOVER_LOT_H_Z0, LEFTOVER_LOT_H_Z1,
  ));
  d = Math.min(d, distToAabb(
    x, z, GARDEN_PATH_X0, GARDEN_PATH_X1, GARDEN_PATH_Z0, GARDEN_PATH_Z1,
  ));
  if (d < 0.35) return 0.22;
  if (d < 1.1) return 0.14;
  return 0.04;
}

/**
 * n = area × cover². Empty-park grid stays cover=10 (12800). Leftover
 * MIN/MAX 8000–11000 is the 276 placed floor after walks, not this
 * clamp. E leftover placed band after the 348.8→355 / z=98.5 east
 * walk is 8000–11000 (~8.2k expected). 12800 placed on E after this
 * walk is a fail. F leftover placed band after the 347 kit +17 m
 * walks (spine + 356→362.2 + 365.8→372) is 8000–11000 (~8.2k).
 * Three walks eat ~45 m². 11k is a ceiling. Do not force 12800.
 * Do not backfill. Do not merge E-park 355. G leftover placed
 * band after the 364 kit +17 m walks (spine + 373→379.2 +
 * 382.8→389) is 8000–11000 (~8.2k). Three walks eat ~45 m².
 * 11k is a ceiling. Do not force 12800. Do not backfill. Do
 * not merge F-park 372. Do not leave G at empty-hull
 * 10000–13000. H leftover placed band after the 381 kit
 * +17 m walks (spine + 390→396.2 + 399.8→406) is
 * 8000–11000 (~8.2k). Three walks eat ~45 m². 11k is a
 * ceiling. Do not force 12800. Do not backfill. Do not
 * merge G-park 389. Do not leave H at empty-hull
 * 10000–13000. Not leftover-dirt 3.36 / 190k. Do not raise
 * cover.
 */
export function pocketParkPlannedCount(cx = POCKET_PARK_X, cz = POCKET_PARK_Z) {
  const area = pocketParkArea(cx, cz);
  return Math.round(area * POCKET_PARK_COVER * POCKET_PARK_COVER);
}

/**
 * Reject-or-drop for a signed pocket-park plate. Default is 276/92.
 * Pass (POCKET_PARK_E_X, POCKET_PARK_E_Z) for 347/96. Pass
 * (POCKET_PARK_F_X, POCKET_PARK_F_Z) for 364/96. Pass
 * (POCKET_PARK_G_X, POCKET_PARK_G_Z) for 381/96. Pass
 * (POCKET_PARK_H_X, POCKET_PARK_H_Z) for 398/96. Fail if
 * pavement, streetOverlap, leftoverLot A–H reserved, warehouse
 * reserved, helipad E reserved, or the 268→284 / z=84 garden path.
 * leftoverLotOverlap of H reserved is 0 (1 m leftover apron, not
 * a kiss). G-park x1=389 must not merge with this hull.
 * leftoverLotOverlap of G reserved is 0 (1 m leftover apron, not
 * a kiss). F-park x1=372 must not merge with this hull.
 * leftoverLotOverlap of F reserved is 0 (1 m leftover apron, not
 * a kiss). E-park x1=355 must not merge with F. Park-walk
 * spines live on the hulls by design and are not a fail.
 * Never nudges x/z. Each hull is rejected independently.
 */
export function pocketParkRejected(cx = POCKET_PARK_X, cz = POCKET_PARK_Z) {
  const g = pocketParkHull(cx, cz);
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
  if (inHelipadReserved(g.x, g.z)
    || inHelipadReserved(g.x0, g.z) || inHelipadReserved(g.x1, g.z)
    || inHelipadReserved(g.x, g.z0) || inHelipadReserved(g.x, g.z1)) {
    return true;
  }
  const path84 = gardenPathGeom();
  if (inPathGeom(path84, g.x, g.z, 0)
    || inPathGeom(path84, g.x0, g.z, 0) || inPathGeom(path84, g.x1, g.z, 0)
    || inPathGeom(path84, g.x, g.z0, 0) || inPathGeom(path84, g.x, g.z1, 0)
    || inPathGeom(path84, g.x0, g.z0, 0) || inPathGeom(path84, g.x1, g.z0, 0)
    || inPathGeom(path84, g.x0, g.z1, 0) || inPathGeom(path84, g.x1, g.z1, 0)
    || pathFootprintOverlaps(path84, g.x, g.z, g.w, g.d, 0)) {
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
 * park pergola 276 / 94. Pass (PARK_PERGOLA_EE_X, PARK_PERGOLA_EE_Z)
 * for 347 / 98.5. Pass (PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z) for
 * 364 / 98.5 (347 kit +17 m). Pass (PARK_PERGOLA_GG_X,
 * PARK_PERGOLA_GG_Z) for 381 / 98.5 (364 kit +17 m). Pass
 * (PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z) for 398 / 98.5
 * (381 kit +17 m). Fail if
 * pavement, streetOverlap, leftoverLot A–H reserved, warehouse
 * reserved, helipad reserved, garden path (including the
 * 339→355 / z=96, 356→372 / z=96, 373→389 / z=96, and
 * 390→406 / z=96 spine slabs), garden bench 276/82.4, park
 * bench 276/90 (including a kiss of the back at ~90.3),
 * E-park bench 347/94.4, F-park bench 364/94.4, G-park bench
 * 381/94.4, H-park bench 398/94.4, half-span ≥ 2 m
 * (would exit 276 at z=96, E at z=100, F at z=100, G at
 * z=100, or H at z=100 — drop, never slide), the plate exits
 * its park hull (276 stays 268–284 × 88–96; E stays 339–355 ×
 * 92–100; F stays 356–372 × 92–100; G stays 373–389 × 92–100;
 * H stays 390–406 × 92–100), a kiss of another signed pergola,
 * or (for 347 / 98.5, 364 / 98.5, 381 / 98.5, or 398 / 98.5)
 * a kiss of the 276 park. Does not merge with G-park 389.
 * Never nudges x/z.
 */
export function boardwalkGateRejected(cx = PARK_PERGOLA_X, cz = PARK_PERGOLA_Z) {
  const g = boardwalkGateGeom(cx, cz);
  if (g.halfX >= PARK_PERGOLA_HALF_MAX || g.halfZ >= PARK_PERGOLA_HALF_MAX) {
    return true;
  }
  const plate = boardwalkGateParkPlate(cx, cz);
  if (g.z1 >= plate.z1 || g.z0 < plate.z0
      || g.x0 < plate.x0 || g.x1 > plate.x1) {
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
  if (warehouseOverlap(g.x, g.z, g.spanX, g.spanZ, 0.15)) return true;
  if (inWarehouseReserved(g.x, g.z)
    || inWarehouseReserved(g.x0, g.z)
    || inWarehouseReserved(g.x1, g.z)
    || inWarehouseReserved(g.x, g.z0)
    || inWarehouseReserved(g.x, g.z1)) return true;
  if (inHelipadReserved(g.x, g.z)
    || inHelipadReserved(g.x0, g.z) || inHelipadReserved(g.x1, g.z)
    || inHelipadReserved(g.x, g.z0) || inHelipadReserved(g.x, g.z1)) {
    return true;
  }
  if (inGardenPath(g.x, g.z)
    || inGardenPath(g.x0, g.z) || inGardenPath(g.x1, g.z)
    || inGardenPath(g.x, g.z0) || inGardenPath(g.x, g.z1)
    || inGardenPath(g.x0, g.z0) || inGardenPath(g.x1, g.z0)
    || inGardenPath(g.x0, g.z1) || inGardenPath(g.x1, g.z1)
    || gardenPathSlabOverlap(g.x, g.z, g.spanX, g.spanZ, 0)) {
    return true;
  }
  const seats = gardenBenchSignedCells();
  for (let i = 0; i < seats.length; i++) {
    const seat = gardenBenchGeom(seats[i][0], seats[i][1]);
    if (gateFootprintOverlaps(g, seat.x, seat.z, seat.w, seat.depth, 0)) {
      return true;
    }
  }
  const gates = boardwalkGateSignedCells();
  for (let i = 0; i < gates.length; i++) {
    if (gates[i][0] === cx && gates[i][1] === cz) continue;
    const other = boardwalkGateGeom(gates[i][0], gates[i][1]);
    if (gateFootprintOverlaps(g, other.x, other.z, other.spanX, other.spanZ, 0)) {
      return true;
    }
  }
  if (cx !== PARK_PERGOLA_X || cz !== PARK_PERGOLA_Z) {
    const park276 = pocketParkHull();
    if (gateFootprintOverlaps(g, park276.x, park276.z, park276.w, park276.d, 0)) {
      return true;
    }
  }
  if ((cx !== PARK_PERGOLA_EE_X || cz !== PARK_PERGOLA_EE_Z)
      && (cx !== PARK_PERGOLA_FF_X || cz !== PARK_PERGOLA_FF_Z)
      && (cx !== PARK_PERGOLA_GG_X || cz !== PARK_PERGOLA_GG_Z)
      && (cx !== PARK_PERGOLA_HH_X || cz !== PARK_PERGOLA_HH_Z)) {
    const park = gardenBenchGeom(PARK_BENCH_X, PARK_BENCH_Z);
    if (g.z0 <= park.z1) return true;
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
  { x0: LEFTOVER_LOT_E_X0 - 2.0, x1: LEFTOVER_LOT_E_X1 + 1.6,
    z0: LEFTOVER_LOT_E_Z0 - 1.3, z1: LEFTOVER_LOT_E_Z1 + 1.2, tag: 'leftoverLot' },
  { x0: LEFTOVER_LOT_F_X0 - 2.0, x1: LEFTOVER_LOT_F_X1 + 1.6,
    z0: LEFTOVER_LOT_F_Z0 - 1.3, z1: LEFTOVER_LOT_F_Z1 + 1.2, tag: 'leftoverLot' },
  { x0: LEFTOVER_LOT_G_X0 - 2.0, x1: LEFTOVER_LOT_G_X1 + 1.6,
    z0: LEFTOVER_LOT_G_Z0 - 1.3, z1: LEFTOVER_LOT_G_Z1 + 1.2, tag: 'leftoverLot' },
  { x0: LEFTOVER_LOT_H_X0 - 2.0, x1: LEFTOVER_LOT_H_X1 + 1.6,
    z0: LEFTOVER_LOT_H_Z0 - 1.3, z1: LEFTOVER_LOT_H_Z1 + 1.2, tag: 'leftoverLot' },
  { x0: GARDEN_PATH_X0 - 2.0, x1: GARDEN_PATH_X1 + 1.6,
    z0: GARDEN_PATH_Z0 - 1.3, z1: GARDEN_PATH_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_X0 - 2.0, x1: PARK_WALK_X1 + 1.6,
    z0: PARK_WALK_Z0 - 1.3, z1: PARK_WALK_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_E_X0 - 2.0, x1: PARK_WALK_E_X1 + 1.6,
    z0: PARK_WALK_E_Z0 - 1.3, z1: PARK_WALK_E_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_NS_X0 - 2.0, x1: PARK_WALK_NS_X1 + 1.6,
    z0: PARK_WALK_NS_Z0 - 1.3, z1: PARK_WALK_NS_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_NS_E_X0 - 2.0, x1: PARK_WALK_NS_E_X1 + 1.6,
    z0: PARK_WALK_NS_E_Z0 - 1.3, z1: PARK_WALK_NS_E_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_EE_X0 - 2.0, x1: PARK_WALK_EE_X1 + 1.6,
    z0: PARK_WALK_EE_Z0 - 1.3, z1: PARK_WALK_EE_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_EE_W_X0 - 2.0, x1: PARK_WALK_EE_W_X1 + 1.6,
    z0: PARK_WALK_EE_W_Z0 - 1.3, z1: PARK_WALK_EE_W_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_EE_E_X0 - 2.0, x1: PARK_WALK_EE_E_X1 + 1.6,
    z0: PARK_WALK_EE_E_Z0 - 1.3, z1: PARK_WALK_EE_E_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_FF_X0 - 2.0, x1: PARK_WALK_FF_X1 + 1.6,
    z0: PARK_WALK_FF_Z0 - 1.3, z1: PARK_WALK_FF_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_FF_W_X0 - 2.0, x1: PARK_WALK_FF_W_X1 + 1.6,
    z0: PARK_WALK_FF_W_Z0 - 1.3, z1: PARK_WALK_FF_W_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_FF_E_X0 - 2.0, x1: PARK_WALK_FF_E_X1 + 1.6,
    z0: PARK_WALK_FF_E_Z0 - 1.3, z1: PARK_WALK_FF_E_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_GG_X0 - 2.0, x1: PARK_WALK_GG_X1 + 1.6,
    z0: PARK_WALK_GG_Z0 - 1.3, z1: PARK_WALK_GG_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_GG_W_X0 - 2.0, x1: PARK_WALK_GG_W_X1 + 1.6,
    z0: PARK_WALK_GG_W_Z0 - 1.3, z1: PARK_WALK_GG_W_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_GG_E_X0 - 2.0, x1: PARK_WALK_GG_E_X1 + 1.6,
    z0: PARK_WALK_GG_E_Z0 - 1.3, z1: PARK_WALK_GG_E_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_HH_X0 - 2.0, x1: PARK_WALK_HH_X1 + 1.6,
    z0: PARK_WALK_HH_Z0 - 1.3, z1: PARK_WALK_HH_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_HH_W_X0 - 2.0, x1: PARK_WALK_HH_W_X1 + 1.6,
    z0: PARK_WALK_HH_W_Z0 - 1.3, z1: PARK_WALK_HH_W_Z1 + 1.2, tag: 'gardenPath' },
  { x0: PARK_WALK_HH_E_X0 - 2.0, x1: PARK_WALK_HH_E_X1 + 1.6,
    z0: PARK_WALK_HH_E_Z0 - 1.3, z1: PARK_WALK_HH_E_Z1 + 1.2, tag: 'gardenPath' },
  { x0: GARDEN_BENCH_X0 - 2.0, x1: GARDEN_BENCH_X1 + 1.6,
    z0: GARDEN_BENCH_Z0 - 1.3, z1: GARDEN_BENCH_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_X0 - 2.0, x1: PARK_BENCH_X1 + 1.6,
    z0: PARK_BENCH_Z0 - 1.3, z1: PARK_BENCH_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_W_X0 - 2.0, x1: PARK_BENCH_W_X1 + 1.6,
    z0: PARK_BENCH_W_Z0 - 1.3, z1: PARK_BENCH_W_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_E_X0 - 2.0, x1: PARK_BENCH_E_X1 + 1.6,
    z0: PARK_BENCH_E_Z0 - 1.3, z1: PARK_BENCH_E_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_EE_X0 - 2.0, x1: PARK_BENCH_EE_X1 + 1.6,
    z0: PARK_BENCH_EE_Z0 - 1.3, z1: PARK_BENCH_EE_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_EE_W_X0 - 2.0, x1: PARK_BENCH_EE_W_X1 + 1.6,
    z0: PARK_BENCH_EE_W_Z0 - 1.3, z1: PARK_BENCH_EE_W_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_EE_E_X0 - 2.0, x1: PARK_BENCH_EE_E_X1 + 1.6,
    z0: PARK_BENCH_EE_E_Z0 - 1.3, z1: PARK_BENCH_EE_E_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_FF_X0 - 2.0, x1: PARK_BENCH_FF_X1 + 1.6,
    z0: PARK_BENCH_FF_Z0 - 1.3, z1: PARK_BENCH_FF_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_FF_W_X0 - 2.0, x1: PARK_BENCH_FF_W_X1 + 1.6,
    z0: PARK_BENCH_FF_W_Z0 - 1.3, z1: PARK_BENCH_FF_W_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_FF_E_X0 - 2.0, x1: PARK_BENCH_FF_E_X1 + 1.6,
    z0: PARK_BENCH_FF_E_Z0 - 1.3, z1: PARK_BENCH_FF_E_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_GG_X0 - 2.0, x1: PARK_BENCH_GG_X1 + 1.6,
    z0: PARK_BENCH_GG_Z0 - 1.3, z1: PARK_BENCH_GG_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_GG_W_X0 - 2.0, x1: PARK_BENCH_GG_W_X1 + 1.6,
    z0: PARK_BENCH_GG_W_Z0 - 1.3, z1: PARK_BENCH_GG_W_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_GG_E_X0 - 2.0, x1: PARK_BENCH_GG_E_X1 + 1.6,
    z0: PARK_BENCH_GG_E_Z0 - 1.3, z1: PARK_BENCH_GG_E_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_HH_X0 - 2.0, x1: PARK_BENCH_HH_X1 + 1.6,
    z0: PARK_BENCH_HH_Z0 - 1.3, z1: PARK_BENCH_HH_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_HH_W_X0 - 2.0, x1: PARK_BENCH_HH_W_X1 + 1.6,
    z0: PARK_BENCH_HH_W_Z0 - 1.3, z1: PARK_BENCH_HH_W_Z1 + 1.2, tag: 'gardenBench' },
  { x0: PARK_BENCH_HH_E_X0 - 2.0, x1: PARK_BENCH_HH_E_X1 + 1.6,
    z0: PARK_BENCH_HH_E_Z0 - 1.3, z1: PARK_BENCH_HH_E_Z1 + 1.2, tag: 'gardenBench' },
  { x0: LEFTOVER_GRASS_X0, x1: LEFTOVER_GRASS_X1,
    z0: LEFTOVER_GRASS_Z0, z1: LEFTOVER_GRASS_Z1, tag: 'leftoverGrass' },
  { x0: POCKET_PARK_X0, x1: POCKET_PARK_X1,
    z0: POCKET_PARK_Z0, z1: POCKET_PARK_Z1, tag: 'pocketPark' },
  { x0: POCKET_PARK_E_X0, x1: POCKET_PARK_E_X1,
    z0: POCKET_PARK_E_Z0, z1: POCKET_PARK_E_Z1, tag: 'pocketPark' },
  { x0: POCKET_PARK_F_X0, x1: POCKET_PARK_F_X1,
    z0: POCKET_PARK_F_Z0, z1: POCKET_PARK_F_Z1, tag: 'pocketPark' },
  { x0: POCKET_PARK_G_X0, x1: POCKET_PARK_G_X1,
    z0: POCKET_PARK_G_Z0, z1: POCKET_PARK_G_Z1, tag: 'pocketPark' },
  { x0: POCKET_PARK_H_X0, x1: POCKET_PARK_H_X1,
    z0: POCKET_PARK_H_Z0, z1: POCKET_PARK_H_Z1, tag: 'pocketPark' },
  { x0: PARK_PERGOLA_X - GATE_HALF_X - 0.8, x1: PARK_PERGOLA_X + GATE_HALF_X + 0.8,
    z0: PARK_PERGOLA_Z - GATE_HALF_Z - 0.8, z1: PARK_PERGOLA_Z + GATE_HALF_Z + 0.8,
    tag: 'boardwalk-gate' },
  { x0: PARK_PERGOLA_EE_X - GATE_HALF_X - 0.8, x1: PARK_PERGOLA_EE_X + GATE_HALF_X + 0.8,
    z0: PARK_PERGOLA_EE_Z - GATE_HALF_Z - 0.8, z1: PARK_PERGOLA_EE_Z + GATE_HALF_Z + 0.8,
    tag: 'boardwalk-gate' },
  { x0: PARK_PERGOLA_FF_X - GATE_HALF_X - 0.8, x1: PARK_PERGOLA_FF_X + GATE_HALF_X + 0.8,
    z0: PARK_PERGOLA_FF_Z - GATE_HALF_Z - 0.8, z1: PARK_PERGOLA_FF_Z + GATE_HALF_Z + 0.8,
    tag: 'boardwalk-gate' },
  { x0: PARK_PERGOLA_GG_X - GATE_HALF_X - 0.8, x1: PARK_PERGOLA_GG_X + GATE_HALF_X + 0.8,
    z0: PARK_PERGOLA_GG_Z - GATE_HALF_Z - 0.8, z1: PARK_PERGOLA_GG_Z + GATE_HALF_Z + 0.8,
    tag: 'boardwalk-gate' },
  { x0: PARK_PERGOLA_HH_X - GATE_HALF_X - 0.8, x1: PARK_PERGOLA_HH_X + GATE_HALF_X + 0.8,
    z0: PARK_PERGOLA_HH_Z - GATE_HALF_Z - 0.8, z1: PARK_PERGOLA_HH_Z + GATE_HALF_Z + 0.8,
    tag: 'boardwalk-gate' },
  { x0: CASA_X - CASA_W / 2 + 0.8, x1: CASA_X + CASA_W / 2 - 0.8,
    z0: CASA_FRONT_Z - CASA_LOGGIA_D - 0.2, z1: CASA_FRONT_Z + 0.2, tag: 'casa' },
  { x0: CLEVELANDER_X - CLEVELANDER_W / 2 + 1.0, x1: CLEVELANDER_X + CLEVELANDER_W / 2 - 1.0,
    z0: CLEVELANDER_FRONT_Z - 3.4, z1: CLEVELANDER_FRONT_Z + 0.3, tag: 'clevelander' },
  { x0: COLONY_X - COLONY_W / 2 + 1.0, x1: COLONY_X + COLONY_W / 2 - 1.0,
    z0: COLONY_FRONT_Z - 3.4, z1: COLONY_FRONT_Z + 0.3, tag: 'colony' },
  { x0: AVALON_X - AVALON_W / 2 + 1.0, x1: AVALON_X + AVALON_W / 2 - 1.0,
    z0: AVALON_FRONT_Z - 3.4, z1: AVALON_FRONT_Z + 0.3, tag: 'avalon' },
  { x0: MAJESTIC_X - MAJESTIC_W / 2 + 1.0, x1: MAJESTIC_X + MAJESTIC_W / 2 - 1.0,
    z0: MAJESTIC_FRONT_Z - 3.4, z1: MAJESTIC_FRONT_Z + 0.3, tag: 'majestic' },
  { x0: CAVALIER_X - CAVALIER_W / 2 + 1.0, x1: CAVALIER_X + CAVALIER_W / 2 - 1.0,
    z0: CAVALIER_FRONT_Z - 3.4, z1: CAVALIER_FRONT_Z + 0.3, tag: 'cavalier' },
  { x0: -80 - GATE_HALF_X - 0.8, x1: -80 + GATE_HALF_X + 0.8,
    z0: GATE_Z - GATE_HALF_Z - 0.8, z1: GATE_Z + GATE_HALF_Z + 0.8, tag: 'promenade-arch' },
  { x0: -20 - GATE_HALF_X - 0.8, x1: -20 + GATE_HALF_X + 0.8,
    z0: GATE_Z - GATE_HALF_Z - 0.8, z1: GATE_Z + GATE_HALF_Z + 0.8, tag: 'promenade-arch' },
  { x0: 40 - GATE_HALF_X - 0.8, x1: 40 + GATE_HALF_X + 0.8,
    z0: GATE_Z - GATE_HALF_Z - 0.8, z1: GATE_Z + GATE_HALF_Z + 0.8, tag: 'promenade-arch' },
  { x0: 160 - GATE_HALF_X - 0.8, x1: 160 + GATE_HALF_X + 0.8,
    z0: GATE_Z - GATE_HALF_Z - 0.8, z1: GATE_Z + GATE_HALF_Z + 0.8, tag: 'promenade-arch' },
  { x0: 220 - GATE_HALF_X - 0.8, x1: 220 + GATE_HALF_X + 0.8,
    z0: GATE_Z - GATE_HALF_Z - 0.8, z1: GATE_Z + GATE_HALF_Z + 0.8, tag: 'promenade-arch' },
  ...SW_ARCADE_CITY_XS.map((x) => ({
    x0: x - SW_ARCADE_HALF_X - 0.8, x1: x + SW_ARCADE_HALF_X + 0.8,
    z0: SW_ARCADE_CITY_Z - SW_ARCADE_HALF_Z - 0.8,
    z1: SW_ARCADE_CITY_Z + SW_ARCADE_HALF_Z + 0.8,
    tag: 'sidewalk-arcade',
  })),
  ...SW_ARCADE_BEACH_XS.map((x) => ({
    x0: x - SW_ARCADE_HALF_X - 0.8, x1: x + SW_ARCADE_HALF_X + 0.8,
    z0: SW_ARCADE_BEACH_Z - SW_ARCADE_HALF_Z - 0.8,
    z1: SW_ARCADE_BEACH_Z + SW_ARCADE_HALF_Z + 0.8,
    tag: 'sidewalk-arcade',
  })),
  ...ALLEY_PIPE_CELLS.map(([x, z]) => ({
    x0: x - 1.2, x1: x + 1.2,
    z0: z - ALLEY_PIPE_HALF_Z - 0.8, z1: z + ALLEY_PIPE_HALF_Z + 0.8,
    tag: 'alley-pipe',
  })),
  ...FIRE_ESCAPE_CELLS.map(([x, z]) => ({
    x0: x - 1.2, x1: x + 1.2,
    z0: z - FIRE_ESCAPE_HALF_Z - 0.8, z1: z + FIRE_ESCAPE_HALF_Z + 0.8,
    tag: 'fire-escape',
  })),
  ...ALLEY_DUMPSTER_CELLS.map(([x, z]) => ({
    x0: x - ALLEY_DUMP_W / 2 - 0.4, x1: x + ALLEY_DUMP_W / 2 + 0.4,
    z0: z - ALLEY_DUMP_D / 2 - 0.4, z1: z + ALLEY_DUMP_D / 2 + 0.4,
    tag: 'inland-alley',
  })),
  ...ALLEY_DOCK_CELLS.map(([x, z]) => ({
    x0: x - ALLEY_DOCK_W / 2 - 0.4, x1: x + ALLEY_DOCK_W / 2 + 0.4,
    z0: z - ALLEY_DOCK_D / 2 - 0.4, z1: z + ALLEY_DOCK_D / 2 + 0.4,
    tag: 'inland-alley',
  })),
  ...ALLEY_LAMP_CELLS.map(([x, z]) => ({
    x0: x - 0.4, x1: x + 0.4,
    z0: z - 0.4, z1: z + 0.4,
    tag: 'inland-alley',
  })),
  ...PARK_RING_CELLS.map(([x, z]) => ({
    x0: x - PARK_RING_TUBE - 0.8, x1: x + PARK_RING_TUBE + 0.8,
    z0: z - PARK_RING_R - PARK_RING_TUBE - 0.8,
    z1: z + PARK_RING_R + PARK_RING_TUBE + 0.8,
    tag: 'park-ring',
  })),
  ...LIFEGUARD_RING_CELLS.map(([x, z]) => ({
    x0: x - LIFEGUARD_RING_TUBE - 0.8, x1: x + LIFEGUARD_RING_TUBE + 0.8,
    z0: z - LIFEGUARD_RING_R - LIFEGUARD_RING_TUBE - 0.8,
    z1: z + LIFEGUARD_RING_R + LIFEGUARD_RING_TUBE + 0.8,
    tag: 'lifeguard-ring',
  })),
  ...fifthShops().map((g) => ({
    x0: g.x0 - 0.6, x1: g.x1 + 0.6,
    z0: g.z0 - 0.6, z1: g.z1 + 0.6,
    tag: 'fifth',
  })),
  ...espaShops().map((g) => ({
    x0: g.x0 - 0.6, x1: g.x1 + 0.6,
    z0: g.z0 - 0.6, z1: g.z1 + 0.6,
    tag: 'espa',
  })),
  ...eighthShops().map((g) => ({
    x0: g.x0 - 0.6, x1: g.x1 + 0.6,
    z0: g.z0 - 0.6, z1: g.z1 + 0.6,
    tag: 'eighth',
  })),
  ...gap315Shops().map((g) => ({
    x0: g.x0 - 0.6, x1: g.x1 + 0.6,
    z0: g.z0 - 0.6, z1: g.z1 + 0.6,
    tag: 'gap315',
  })),
  ...gap501Shops().map((g) => ({
    x0: g.x0 - 0.6, x1: g.x1 + 0.6,
    z0: g.z0 - 0.6, z1: g.z1 + 0.6,
    tag: 'gap501',
  })),
  ...inlandMidrises().map((g) => ({
    x0: g.x0 - 0.6, x1: g.x1 + 0.6,
    z0: g.z0 - 0.6, z1: g.z1 + 0.6,
    tag: 'inland-midrise',
  })),
  ...lincolnShops().map((g) => ({
    x0: g.x0 - 0.6, x1: g.x1 + 0.6,
    z0: g.z0 - 0.6, z1: g.z1 + 0.6,
    tag: 'lincoln',
  })),
  ...lincolnPergolas().map((g) => ({
    x0: g.x - g.halfX - 0.8, x1: g.x + g.halfX + 0.8,
    z0: g.z - g.halfZ - 0.8, z1: g.z + g.halfZ + 0.8,
    tag: 'lincoln',
  })),
  {
    x0: WASH_ARCADE_X - WASH_ARCADE_HALF_X - 0.8,
    x1: WASH_ARCADE_X + WASH_ARCADE_HALF_X + 0.8,
    z0: WASH_ARCADE_Z - WASH_ARCADE_HALF_Z - 0.8,
    z1: WASH_ARCADE_Z + WASH_ARCADE_HALF_Z + 0.8,
    tag: 'washington',
  },
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
/** Lincoln Road analogue pavers (E–W mall at z=120). West of leftoverLot A. */
export function onLincolnWalk(x, z) {
  if (x >= 240) return false;
  if (Math.abs(z - LINCOLN_Z) > LINCOLN_HALF + 0.4) return false;
  for (let i = 0; i < LINCOLN_WALK_RUNS.length; i++) {
    const a = LINCOLN_WALK_RUNS[i][0], b = LINCOLN_WALK_RUNS[i][1];
    if (x >= a && x <= b) return true;
  }
  return false;
}

/** City sidewalk in front of Majestic / Avalon / Colony. West of leftoverLot A. */
export function onCollinsWalk(x, z) {
  if (x >= 240) return false;
  if (z < SW_CITY_Z0 || z > SW_CITY_Z1) return false;
  if (sidewalkInterrupted(x)) return false;
  for (let i = 0; i < COLLINS_WALK_RUNS.length; i++) {
    const a = COLLINS_WALK_RUNS[i][0], b = COLLINS_WALK_RUNS[i][1];
    if (x >= a && x <= b) return true;
  }
  return false;
}

export function onPavement(x, z) {
  return onRoadway(z) || onCurb(z) || onSidewalk(x, z)
      || onBoardwalk(x, z) || onCrossStreet(x, z) || onLummusWalk(x, z)
      || onLincolnWalk(x, z) || onWashingtonRoad(x, z) || onWashingtonWalk(x, z);
}

/**
 * Boardwalk-gate reserved void. Opening is empty air. Fly along +X.
 * Same kit at GATE_X/GATE_Z, PARK_PERGOLA_X/PARK_PERGOLA_Z,
 * PARK_PERGOLA_EE_X/PARK_PERGOLA_EE_Z,
 * PARK_PERGOLA_FF_X/PARK_PERGOLA_FF_Z, and
 * PARK_PERGOLA_GG_X/PARK_PERGOLA_GG_Z.
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
 * No-arg covers the promenade gate and the signed park pergolas via
 * boardwalkGateGeom. Pass a geom for one kit.
 */
export function boardwalkGateColliderShapes(g) {
  const shapes = [];
  if (!g) {
    boardwalkGateColliderShapesAt(shapes, boardwalkGateGeom());
    const cells = boardwalkGateSignedCells();
    for (let i = 0; i < cells.length; i++) {
      const park = boardwalkGateGeom(cells[i][0], cells[i][1]);
      if (!boardwalkGateRejected(park.x, park.z)) {
        boardwalkGateColliderShapesAt(shapes, park);
      }
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
  boardwalkGateVoid(boardwalkGateGeom(PARK_PERGOLA_EE_X, PARK_PERGOLA_EE_Z), 'park-pergola-ee'),
  boardwalkGateVoid(boardwalkGateGeom(PARK_PERGOLA_FF_X, PARK_PERGOLA_FF_Z), 'park-pergola-ff'),
  boardwalkGateVoid(boardwalkGateGeom(PARK_PERGOLA_GG_X, PARK_PERGOLA_GG_Z), 'park-pergola-gg'),
  boardwalkGateVoid(boardwalkGateGeom(PARK_PERGOLA_HH_X, PARK_PERGOLA_HH_Z), 'park-pergola-hh'),
  boardwalkGateVoid(boardwalkGateGeom(-80, GATE_Z), 'promenade-arch-0'),
  boardwalkGateVoid(boardwalkGateGeom(-20, GATE_Z), 'promenade-arch-1'),
  boardwalkGateVoid(boardwalkGateGeom(40, GATE_Z), 'promenade-arch-2'),
  boardwalkGateVoid(boardwalkGateGeom(160, GATE_Z), 'promenade-arch-3'),
  boardwalkGateVoid(boardwalkGateGeom(220, GATE_Z), 'promenade-arch-4'),
  {
    id: 'casa-loggia', kind: 'kit',
    x: CASA_X, z: CASA_FRONT_Z - CASA_LOGGIA_D * 0.5,
    y: CITY_Y + CASA_LOGGIA_H * 0.48,
    x0: CASA_X - CASA_W / 2 + 1.4, x1: CASA_X + CASA_W / 2 - 1.4,
    z0: CASA_FRONT_Z - CASA_LOGGIA_D + 0.18, z1: CASA_FRONT_Z - 0.18,
    y0: CITY_Y + 0.08, y1: CITY_Y + CASA_LOGGIA_H - 0.06,
    openW: CASA_W - 2.8, openH: CASA_LOGGIA_H,
  },
  {
    id: 'clevelander-arcade', kind: 'kit',
    x: CLEVELANDER_X, z: CLEVELANDER_FRONT_Z - 1.7,
    y: CITY_Y + CLEVELANDER_SOFFIT * 0.48,
    x0: CLEVELANDER_X - CLEVELANDER_W / 2 + 1.2,
    x1: CLEVELANDER_X + CLEVELANDER_W / 2 - 1.2,
    z0: CLEVELANDER_FRONT_Z - 3.15, z1: CLEVELANDER_FRONT_Z - 0.2,
    y0: CITY_Y + 0.08, y1: CITY_Y + CLEVELANDER_SOFFIT - 0.06,
    openW: CLEVELANDER_W - 2.4, openH: CLEVELANDER_SOFFIT,
  },
  {
    id: 'colony-arcade', kind: 'kit',
    x: COLONY_X, z: COLONY_FRONT_Z - 1.7,
    y: CITY_Y + COLONY_SOFFIT * 0.48,
    x0: COLONY_X - COLONY_W / 2 + 1.2,
    x1: COLONY_X + COLONY_W / 2 - 1.2,
    z0: COLONY_FRONT_Z - 3.15, z1: COLONY_FRONT_Z - 0.2,
    y0: CITY_Y + 0.08, y1: CITY_Y + COLONY_SOFFIT - 0.06,
    openW: COLONY_W - 2.4, openH: COLONY_SOFFIT,
  },
  {
    id: 'avalon-arcade', kind: 'kit',
    x: AVALON_X, z: AVALON_FRONT_Z - 1.7,
    y: CITY_Y + AVALON_SOFFIT * 0.48,
    x0: AVALON_X - AVALON_W / 2 + 1.2,
    x1: AVALON_X + AVALON_W / 2 - 1.2,
    z0: AVALON_FRONT_Z - 3.15, z1: AVALON_FRONT_Z - 0.2,
    y0: CITY_Y + 0.08, y1: CITY_Y + AVALON_SOFFIT - 0.06,
    openW: AVALON_W - 2.4, openH: AVALON_SOFFIT,
  },
  {
    id: 'majestic-arcade', kind: 'kit',
    x: MAJESTIC_X, z: MAJESTIC_FRONT_Z - 1.7,
    y: CITY_Y + MAJESTIC_SOFFIT * 0.48,
    x0: MAJESTIC_X - MAJESTIC_W / 2 + 1.2,
    x1: MAJESTIC_X + MAJESTIC_W / 2 - 1.2,
    z0: MAJESTIC_FRONT_Z - 3.15, z1: MAJESTIC_FRONT_Z - 0.2,
    y0: CITY_Y + 0.08, y1: CITY_Y + MAJESTIC_SOFFIT - 0.06,
    openW: MAJESTIC_W - 2.4, openH: MAJESTIC_SOFFIT,
  },
  {
    id: 'cavalier-arcade', kind: 'kit',
    x: CAVALIER_X, z: CAVALIER_FRONT_Z - 1.7,
    y: CITY_Y + CAVALIER_SOFFIT * 0.48,
    x0: CAVALIER_X - CAVALIER_W / 2 + 1.2,
    x1: CAVALIER_X + CAVALIER_W / 2 - 1.2,
    z0: CAVALIER_FRONT_Z - 3.15, z1: CAVALIER_FRONT_Z - 0.2,
    y0: CITY_Y + 0.08, y1: CITY_Y + CAVALIER_SOFFIT - 0.06,
    openW: CAVALIER_W - 2.4, openH: CAVALIER_SOFFIT,
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
  ...SW_ARCADE_CITY_XS.map((x, i) => sidewalkArcadeVoid(
    sidewalkArcadeGeom(x, SW_ARCADE_CITY_Z), `sidewalk-arcade-city-${i}`)),
  ...SW_ARCADE_BEACH_XS.map((x, i) => sidewalkArcadeVoid(
    sidewalkArcadeGeom(x, SW_ARCADE_BEACH_Z), `sidewalk-arcade-beach-${i}`)),
  ...ALLEY_PIPE_CELLS.map(([x, z], i) => alleyPipeVoid(
    alleyPipeGeom(x, z), `alley-pipe-${i}`)),
  ...PARK_RING_CELLS.map(([x, z], i) => parkRingVoid(
    parkRingGeom(x, z), `park-ring-${i}`)),
  ...LIFEGUARD_RING_CELLS.map(([x, z], i) => lifeguardRingVoid(
    lifeguardRingGeom(x, z), `lifeguard-ring-${i}`)),
  ...PIER_EXTRA_BAY_IS.map((bayI) => pierUndercroftVoid(bayI, `pier-undercroft-${bayI}`)),
  ...PIER_EXTRA_BAY_IS.map((bayI) => pierBayRingVoid(
    pierBayRingGeom(bayI), `pier-bay-ring-${bayI}`)),
  ...fifthShops().flatMap((g) => [fifthArcadeVoid(g), fifthPassVoid(g)]),
  ...espaShops().flatMap((g) => [espaArcadeVoid(g), espaPassVoid(g)]),
  ...eighthShops().flatMap((g) => [eighthArcadeVoid(g), eighthPassVoid(g)]),
  ...gap315Shops().flatMap((g) => [gap315ArcadeVoid(g), gap315PassVoid(g)]),
  ...gap501Shops().flatMap((g) => [gap501ArcadeVoid(g), gap501PassVoid(g)]),
  ...lincolnShops().flatMap((g) => [lincolnArcadeVoid(g), lincolnPassVoid(g)]),
  ...lincolnPergolas().map((g, i) => lincolnPergolaVoid(g, `lincoln-pergola-${i}`)),
  washingtonArcadeVoid(washingtonArcadeGeom(), 'washington-arcade'),
  ...ROOF_AC_CELLS.map(([x, z], i) => roofAcGapVoid(roofAcGapGeom(x, z, `roof-ac-${i}`))),
  ...ROOF_RING_CELLS.map(([x, z], i) => roofRingVoid(roofRingGeom(x, z, `roof-ring-${i}`))),
  ...FIRE_ESCAPE_CELLS.map(([x, z], i) => fireEscapeVoid(
    fireEscapeGeom(x, z), `fire-escape-${i}`)),
  ...COURT_WELL_CELLS.map(([x, z], i) => courtWellVoid(courtWellGeom(x, z, `court-well-${i}`))),
  ...INLAND_ARCADE_CELLS.map(([x, z], i) => inlandArcadeVoid(
    inlandArcadeGeom(x, z, `inland-arcade-${i}`))),
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

  // Extra boardwalk whoops — same kit, own tag so GATE_X post counts stay 4.
  for (let i = 0; i < PROMENADE_ARCH_XS.length; i++) {
    const g = boardwalkGateGeom(PROMENADE_ARCH_XS[i], GATE_Z);
    for (const dx of [-g.halfX, g.halfX]) {
      for (const dz of [-g.halfZ, g.halfZ]) {
        shapes.push({
          type: 'cyl', tag: 'promenade-arch',
          x: g.x + dx, z: g.z + dz, r: g.postR,
          y0: g.y0, h: g.postH,
        });
      }
    }
    const beamY = g.y0 + g.postH;
    for (const dz of [-g.halfZ, g.halfZ]) {
      shapes.push({
        type: 'aabb', tag: 'promenade-arch',
        x: g.x, z: g.z + dz, sx: g.spanX + g.beamW, sz: g.beamW,
        y0: beamY, sy: g.beamH,
      });
    }
    for (const dx of [-g.halfX, g.halfX]) {
      shapes.push({
        type: 'aabb', tag: 'promenade-arch',
        x: g.x + dx, z: g.z, sx: g.beamW, sz: g.spanZ + g.beamW,
        y0: beamY, sy: g.beamH,
      });
    }
    shapes.push({
      type: 'aabb', tag: 'promenade-arch',
      x: g.x, z: g.z, sx: g.spanX + 1.1, sz: g.spanZ + 1.0,
      y0: beamY + g.beamH, sy: 0.12,
    });
  }

  // Casa loggia columns sit off-centre so the bay middle stays empty.
  const casaZ = CASA_FRONT_Z - CASA_LOGGIA_D * 0.5;
  for (const s of [-0.38, -0.14, 0.14, 0.38]) {
    shapes.push({
      type: 'cyl', tag: 'casa',
      x: CASA_X + s * CASA_W, z: casaZ, r: 0.22,
      y0: CITY_Y, h: CASA_LOGGIA_H,
    });
  }
  shapes.push({
    type: 'aabb', tag: 'casa',
    x: CASA_X, z: casaZ, sx: CASA_W - 0.4, sz: CASA_LOGGIA_D + 0.3,
    y0: CITY_Y + CASA_LOGGIA_H, sy: 0.28,
  });

  // Clevelander arcade jambs — centre bay empty, fly ±X under the soffit.
  const cleveZ = CLEVELANDER_FRONT_Z - 1.7;
  for (const s of [-1, 1]) {
    shapes.push({
      type: 'cyl', tag: 'clevelander',
      x: CLEVELANDER_X + s * (CLEVELANDER_W / 2 - 0.7), z: cleveZ, r: 0.2,
      y0: CITY_Y, h: CLEVELANDER_SOFFIT,
    });
  }
  shapes.push({
    type: 'aabb', tag: 'clevelander',
    x: CLEVELANDER_X, z: cleveZ, sx: CLEVELANDER_W - 0.6, sz: 3.2,
    y0: CITY_Y + CLEVELANDER_SOFFIT, sy: 0.26,
  });

  // Colony arcade jambs — centre bay empty, fly ±X under the soffit.
  const colonyZ = COLONY_FRONT_Z - 1.7;
  for (const s of [-1, 1]) {
    shapes.push({
      type: 'cyl', tag: 'colony',
      x: COLONY_X + s * (COLONY_W / 2 - 0.7), z: colonyZ, r: 0.2,
      y0: CITY_Y, h: COLONY_SOFFIT,
    });
  }
  shapes.push({
    type: 'aabb', tag: 'colony',
    x: COLONY_X, z: colonyZ, sx: COLONY_W - 0.6, sz: 3.2,
    y0: CITY_Y + COLONY_SOFFIT, sy: 0.26,
  });

  // Avalon arcade jambs — centre bay empty, fly ±X under the soffit.
  const avalonZ = AVALON_FRONT_Z - 1.7;
  for (const s of [-1, 1]) {
    shapes.push({
      type: 'cyl', tag: 'avalon',
      x: AVALON_X + s * (AVALON_W / 2 - 0.7), z: avalonZ, r: 0.2,
      y0: CITY_Y, h: AVALON_SOFFIT,
    });
  }
  shapes.push({
    type: 'aabb', tag: 'avalon',
    x: AVALON_X, z: avalonZ, sx: AVALON_W - 0.6, sz: 3.2,
    y0: CITY_Y + AVALON_SOFFIT, sy: 0.26,
  });

  // Majestic arcade jambs — centre bay empty, fly ±X under the soffit.
  const majesticZ = MAJESTIC_FRONT_Z - 1.7;
  for (const s of [-1, 1]) {
    shapes.push({
      type: 'cyl', tag: 'majestic',
      x: MAJESTIC_X + s * (MAJESTIC_W / 2 - 0.7), z: majesticZ, r: 0.2,
      y0: CITY_Y, h: MAJESTIC_SOFFIT,
    });
  }
  shapes.push({
    type: 'aabb', tag: 'majestic',
    x: MAJESTIC_X, z: majesticZ, sx: MAJESTIC_W - 0.6, sz: 3.2,
    y0: CITY_Y + MAJESTIC_SOFFIT, sy: 0.26,
  });

  // Cavalier arcade jambs — centre bay empty, fly ±X under the soffit.
  const cavalierZ = CAVALIER_FRONT_Z - 1.7;
  for (const s of [-1, 1]) {
    shapes.push({
      type: 'cyl', tag: 'cavalier',
      x: CAVALIER_X + s * (CAVALIER_W / 2 - 0.7), z: cavalierZ, r: 0.2,
      y0: CITY_Y, h: CAVALIER_SOFFIT,
    });
  }
  shapes.push({
    type: 'aabb', tag: 'cavalier',
    x: CAVALIER_X, z: cavalierZ, sx: CAVALIER_W - 0.6, sz: 3.2,
    y0: CITY_Y + CAVALIER_SOFFIT, sy: 0.26,
  });

  for (let i = 0; i < SW_ARCADE_CITY_XS.length; i++) {
    sidewalkArcadeColliderShapesAt(shapes, sidewalkArcadeGeom(SW_ARCADE_CITY_XS[i], SW_ARCADE_CITY_Z));
  }
  for (let i = 0; i < SW_ARCADE_BEACH_XS.length; i++) {
    sidewalkArcadeColliderShapesAt(shapes, sidewalkArcadeGeom(SW_ARCADE_BEACH_XS[i], SW_ARCADE_BEACH_Z));
  }
  for (let i = 0; i < ALLEY_PIPE_CELLS.length; i++) {
    alleyPipeColliderShapesAt(shapes, alleyPipeGeom(ALLEY_PIPE_CELLS[i][0], ALLEY_PIPE_CELLS[i][1]));
  }
  for (let i = 0; i < PARK_RING_CELLS.length; i++) {
    parkRingColliderShapesAt(shapes, parkRingGeom(PARK_RING_CELLS[i][0], PARK_RING_CELLS[i][1]));
  }
  for (let i = 0; i < LIFEGUARD_RING_CELLS.length; i++) {
    parkRingColliderShapesAt(
      shapes,
      lifeguardRingGeom(LIFEGUARD_RING_CELLS[i][0], LIFEGUARD_RING_CELLS[i][1]),
      'lifeguard-ring',
    );
  }
  const fifth = fifthShops();
  for (let i = 0; i < fifth.length; i++) {
    streetShopColliderShapesAt(shapes, fifth[i]);
  }
  const espa = espaShops();
  for (let i = 0; i < espa.length; i++) {
    streetShopColliderShapesAt(shapes, espa[i]);
  }
  const eighth = eighthShops();
  for (let i = 0; i < eighth.length; i++) {
    streetShopColliderShapesAt(shapes, eighth[i]);
  }
  const gap315 = gap315Shops();
  for (let i = 0; i < gap315.length; i++) {
    streetShopColliderShapesAt(shapes, gap315[i]);
  }
  const gap501 = gap501Shops();
  for (let i = 0; i < gap501.length; i++) {
    streetShopColliderShapesAt(shapes, gap501[i]);
  }
  const lincoln = lincolnShops();
  for (let i = 0; i < lincoln.length; i++) {
    lincolnShopColliderShapesAt(shapes, lincoln[i]);
  }
  const pergolas = lincolnPergolas();
  for (let i = 0; i < pergolas.length; i++) {
    lincolnPergolaColliderShapesAt(shapes, pergolas[i]);
  }
  washingtonArcadeColliderShapesAt(shapes, washingtonArcadeGeom());
  const acs = ROOF_AC_CELLS;
  for (let i = 0; i < acs.length; i++) {
    roofAcGapColliderShapesAt(shapes, roofAcGapGeom(acs[i][0], acs[i][1], `roof-ac-${i}`));
  }
  const rings = ROOF_RING_CELLS;
  for (let i = 0; i < rings.length; i++) {
    roofRingColliderShapesAt(shapes, roofRingGeom(rings[i][0], rings[i][1], `roof-ring-${i}`));
  }
  for (let i = 0; i < FIRE_ESCAPE_CELLS.length; i++) {
    fireEscapeColliderShapesAt(shapes, fireEscapeGeom(FIRE_ESCAPE_CELLS[i][0], FIRE_ESCAPE_CELLS[i][1]));
  }
  for (let i = 0; i < COURT_WELL_CELLS.length; i++) {
    courtWellColliderShapesAt(shapes, courtWellGeom(
      COURT_WELL_CELLS[i][0], COURT_WELL_CELLS[i][1], `court-well-${i}`));
  }
  for (let i = 0; i < INLAND_ARCADE_CELLS.length; i++) {
    inlandArcadeColliderShapesAt(shapes, inlandArcadeGeom(
      INLAND_ARCADE_CELLS[i][0], INLAND_ARCADE_CELLS[i][1], `inland-arcade-${i}`));
  }
  return shapes;
}

function roofAcGapColliderShapesAt(shapes, g) {
  for (const ux of [g.leftX, g.rightX]) {
    shapes.push({
      type: 'aabb', tag: 'roof-whoop',
      x: ux, z: g.z, sx: g.unitW, sz: g.unitD,
      y0: g.y0, sy: g.unitH,
    });
  }
}

function roofRingColliderShapesAt(shapes, g) {
  const n = g.segs;
  const box = g.tube * 2 + 0.04;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const yy = g.y + g.r * Math.sin(a);
    const zz = g.z + g.r * Math.cos(a);
    shapes.push({
      type: 'aabb', tag: 'roof-whoop',
      x: g.x, z: zz, sx: box, sz: box,
      y0: yy - box / 2, sy: box,
    });
  }
}

function washingtonArcadeColliderShapesAt(shapes, g) {
  const tag = g.tag || 'washington';
  for (const dx of [-g.halfX, g.halfX]) {
    for (const dz of [-g.halfZ, g.halfZ]) {
      shapes.push({
        type: 'cyl', tag,
        x: g.x + dx, z: g.z + dz, r: g.postR,
        y0: g.y0, h: g.postH,
      });
    }
  }
  const beamY = g.y0 + g.postH;
  for (const dz of [-g.halfZ, g.halfZ]) {
    shapes.push({
      type: 'aabb', tag,
      x: g.x, z: g.z + dz, sx: g.spanX + g.beamW, sz: g.beamW,
      y0: beamY, sy: g.beamH,
    });
  }
  for (const dx of [-g.halfX, g.halfX]) {
    shapes.push({
      type: 'aabb', tag,
      x: g.x + dx, z: g.z, sx: g.beamW, sz: g.spanZ + g.beamW,
      y0: beamY, sy: g.beamH,
    });
  }
  shapes.push({
    type: 'aabb', tag,
    x: g.x, z: g.z, sx: g.spanX + 1.0, sz: g.spanZ + 0.8,
    y0: beamY + g.beamH, sy: 0.12,
  });
}

function lincolnShopColliderShapesAt(shapes, g) {
  const jamb = g.jamb;
  const soffit = g.openArcadeH;
  const passH = g.openPassH;
  const tag = g.tag;
  for (const dx of [g.x0 + 0.7, g.x1 - 0.7]) {
    shapes.push({
      type: 'cyl', tag,
      x: dx, z: g.arcadeZ, r: 0.20,
      y0: CITY_Y, h: soffit,
    });
  }
  const zLo = Math.min(g.frontZ, g.zArcadeInner);
  const zHi = Math.max(g.frontZ, g.zArcadeInner);
  shapes.push({
    type: 'aabb', tag,
    x: g.x, z: g.arcadeZ, sx: g.len - 0.4, sz: zHi - zLo + 0.2,
    y0: CITY_Y + soffit, sy: 0.26,
  });
  const massZ0 = Math.min(g.zBack, g.zArcadeInner);
  const massZ1 = Math.max(g.zBack, g.zArcadeInner);
  const massZ = (massZ0 + massZ1) / 2;
  const massSz = massZ1 - massZ0;
  for (const side of [-1, 1]) {
    const xEdge = side < 0 ? (g.x0 + g.passX0) / 2 : (g.passX1 + g.x1) / 2;
    const sx = side < 0 ? (g.passX0 - g.x0) : (g.x1 - g.passX1);
    if (sx < 0.4) continue;
    shapes.push({
      type: 'aabb', tag,
      x: xEdge, z: massZ, sx: sx - 0.04, sz: massSz,
      y0: CITY_Y, sy: soffit,
    });
  }
  shapes.push({
    type: 'aabb', tag,
    x: g.x, z: massZ, sx: g.openPassW + jamb * 2, sz: massSz,
    y0: CITY_Y + passH, sy: 0.24,
  });
}

function lincolnPergolaColliderShapesAt(shapes, g) {
  for (const dx of [-g.halfX, g.halfX]) {
    for (const dz of [-g.halfZ, g.halfZ]) {
      shapes.push({
        type: 'cyl', tag: 'lincoln',
        x: g.x + dx, z: g.z + dz, r: g.postR,
        y0: g.y0, h: g.postH,
      });
    }
  }
  const beamY = g.y0 + g.postH;
  for (const dz of [-g.halfZ, g.halfZ]) {
    shapes.push({
      type: 'aabb', tag: 'lincoln',
      x: g.x, z: g.z + dz, sx: g.spanX + g.beamW, sz: g.beamW,
      y0: beamY, sy: g.beamH,
    });
  }
  for (const dx of [-g.halfX, g.halfX]) {
    shapes.push({
      type: 'aabb', tag: 'lincoln',
      x: g.x + dx, z: g.z, sx: g.beamW, sz: g.spanZ + g.beamW,
      y0: beamY, sy: g.beamH,
    });
  }
  shapes.push({
    type: 'aabb', tag: 'lincoln',
    x: g.x, z: g.z, sx: g.spanX + 1.1, sz: g.spanZ + 1.0,
    y0: beamY + g.beamH, sy: 0.12,
  });
}

function streetShopColliderShapesAt(shapes, g) {
  const jamb = g.jamb;
  const soffit = g.openArcadeH;
  const passH = g.openPassH;
  const tag = g.tag;
  for (const dz of [g.z0 + 0.7, g.z1 - 0.7]) {
    shapes.push({
      type: 'cyl', tag,
      x: g.arcadeX, z: dz, r: 0.20,
      y0: CITY_Y, h: soffit,
    });
  }
  const ax0 = Math.min(g.frontX, g.xArcadeInner);
  const ax1 = Math.max(g.frontX, g.xArcadeInner);
  shapes.push({
    type: 'aabb', tag,
    x: g.arcadeX, z: g.z, sx: ax1 - ax0 + 0.2, sz: g.len - 0.4,
    y0: CITY_Y + soffit, sy: 0.26,
  });
  const massX0 = Math.min(g.xBack, g.xArcadeInner);
  const massX1 = Math.max(g.xBack, g.xArcadeInner);
  const massX = (massX0 + massX1) / 2;
  const massSx = massX1 - massX0;
  for (const side of [-1, 1]) {
    const zEdge = side < 0 ? (g.z0 + g.passZ0) / 2 : (g.passZ1 + g.z1) / 2;
    const sz = side < 0 ? (g.passZ0 - g.z0) : (g.z1 - g.passZ1);
    if (sz < 0.4) continue;
    shapes.push({
      type: 'aabb', tag,
      x: massX, z: zEdge, sx: massSx, sz: sz - 0.04,
      y0: CITY_Y, sy: soffit,
    });
  }
  // Lintel covers the rear mass only — never a beam across the arcade.
  shapes.push({
    type: 'aabb', tag,
    x: massX, z: g.z, sx: massSx, sz: g.openPassW + jamb * 2,
    y0: CITY_Y + passH, sy: 0.24,
  });
}

function sidewalkArcadeColliderShapesAt(shapes, g) {
  for (const dx of [-g.halfX, g.halfX]) {
    for (const dz of [-g.halfZ, g.halfZ]) {
      shapes.push({
        type: 'cyl', tag: 'sidewalk-arcade',
        x: g.x + dx, z: g.z + dz, r: g.postR,
        y0: g.y0, h: g.postH,
      });
    }
  }
  const beamY = g.y0 + g.postH;
  for (const dz of [-g.halfZ, g.halfZ]) {
    shapes.push({
      type: 'aabb', tag: 'sidewalk-arcade',
      x: g.x, z: g.z + dz, sx: g.spanX + g.beamW, sz: g.beamW,
      y0: beamY, sy: g.beamH,
    });
  }
  for (const dx of [-g.halfX, g.halfX]) {
    shapes.push({
      type: 'aabb', tag: 'sidewalk-arcade',
      x: g.x + dx, z: g.z, sx: g.beamW, sz: g.spanZ + g.beamW,
      y0: beamY, sy: g.beamH,
    });
  }
  shapes.push({
    type: 'aabb', tag: 'sidewalk-arcade',
    x: g.x, z: g.z, sx: g.spanX + 1.0, sz: g.spanZ + 0.8,
    y0: beamY + g.beamH, sy: 0.12,
  });
}

function alleyPipeColliderShapesAt(shapes, g) {
  for (const dz of [-g.halfZ, g.halfZ]) {
    shapes.push({
      type: 'cyl', tag: 'alley-pipe',
      x: g.x, z: g.z + dz, r: g.postR,
      y0: g.y0, h: g.postH + g.beamR,
    });
  }
  shapes.push({
    type: 'aabb', tag: 'alley-pipe',
    x: g.x, z: g.z, sx: g.beamR * 2, sz: g.halfZ * 2 + g.postR * 2,
    y0: g.y0 + g.postH - g.beamR, sy: g.beamR * 2,
  });
}

function fireEscapeColliderShapesAt(shapes, g) {
  for (const dz of [-g.halfZ, g.halfZ]) {
    shapes.push({
      type: 'cyl', tag: 'fire-escape',
      x: g.x, z: g.z + dz, r: g.postR,
      y0: g.y0, h: g.postH + g.beamH,
    });
  }
  shapes.push({
    type: 'aabb', tag: 'fire-escape',
    x: g.x, z: g.z, sx: g.beamW, sz: g.halfZ * 2 + g.postR * 2,
    y0: g.y0 + g.postH - g.beamH / 2, sy: g.beamH,
  });
}

function parkRingColliderShapesAt(shapes, g, tag = 'park-ring') {
  const n = g.segs;
  const t = g.tube;
  const box = t * 2 + 0.04;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const yy = g.y + g.r * Math.sin(a);
    const zz = g.z + g.r * Math.cos(a);
    shapes.push({
      type: 'aabb', tag,
      x: g.x, z: zz, sx: box, sz: box,
      y0: yy - box / 2, sy: box,
    });
  }
}

function pierBayRingColliderShapesAt(shapes, g) {
  const n = g.segs;
  const t = g.tube;
  const box = t * 2 + 0.04;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const xx = g.x + g.r * Math.cos(a);
    const yy = g.y + g.r * Math.sin(a);
    shapes.push({
      type: 'aabb', tag: 'pier',
      x: xx, z: g.z, sx: box, sz: box,
      y0: yy - box / 2, sy: box,
    });
  }
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
  for (let i = 0; i < PIER_EXTRA_BAY_IS.length; i++) {
    pierBayRingColliderShapesAt(shapes, pierBayRingGeom(PIER_EXTRA_BAY_IS[i]));
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
 * No-arg covers #34, lot B, lot C, lot D, lot E, lot F, lot G, and lot H via leftoverLotGeom. Pass a geom for one plate.
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
      .concat(leftoverLotVoidsAt(leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z)))
      .concat(leftoverLotVoidsAt(leftoverLotGeom(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z)))
      .concat(leftoverLotVoidsAt(leftoverLotGeom(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z)))
      .concat(leftoverLotVoidsAt(leftoverLotGeom(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z)))
      .concat(leftoverLotVoidsAt(leftoverLotGeom(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z)));
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
 *  No-arg covers #34, lot B, lot C, lot D, lot E, lot F, lot G, and lot H via leftoverLotGeom. Pass a geom for one plate. */
export function leftoverLotColliderShapes(g) {
  const shapes = [];
  if (g === undefined) {
    leftoverLotColliderShapesAt(shapes, leftoverLotGeom());
    leftoverLotColliderShapesAt(shapes, leftoverLotGeom(LEFTOVER_LOT_B_X, LEFTOVER_LOT_B_Z));
    leftoverLotColliderShapesAt(shapes, leftoverLotGeom(LEFTOVER_LOT_C_X, LEFTOVER_LOT_C_Z));
    leftoverLotColliderShapesAt(shapes, leftoverLotGeom(LEFTOVER_LOT_D_X, LEFTOVER_LOT_D_Z));
    leftoverLotColliderShapesAt(shapes, leftoverLotGeom(LEFTOVER_LOT_E_X, LEFTOVER_LOT_E_Z));
    leftoverLotColliderShapesAt(shapes, leftoverLotGeom(LEFTOVER_LOT_F_X, LEFTOVER_LOT_F_Z));
    leftoverLotColliderShapesAt(shapes, leftoverLotGeom(LEFTOVER_LOT_G_X, LEFTOVER_LOT_G_Z));
    leftoverLotColliderShapesAt(shapes, leftoverLotGeom(LEFTOVER_LOT_H_X, LEFTOVER_LOT_H_Z));
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
 * Default is 268→284 / z=84. Pass gardenPathGeom(PARK_WALK_X, PARK_WALK_Z).
 */
export function gardenPathVoids(g = gardenPathGeom()) {
  const slabs = gardenPathSlabs(g);
  const y0 = CITY_Y;
  const voids = [];
  const south = slabs.find((s) => s.col === 0 && s.row === 0);
  const north = slabs.find((s) => s.col === 0 && s.row === 1);
  const alongZ = pathAlongZ(g);
  if (south && north) {
    if (alongZ) {
      voids.push({
        id: 'gardenPath-joint-x', kind: 'joint',
        x: (south.x1 + north.x0) / 2, z: south.z, y: y0 + 0.04,
        x0: south.x1, x1: north.x0, z0: south.z0, z1: south.z1,
        y0: y0 + 0.02, y1: y0 + 1.6,
        openW: north.x0 - south.x1, openH: 1.6, probe: 0.02,
      });
    } else {
      voids.push({
        id: 'gardenPath-joint-z', kind: 'joint',
        x: south.x, z: (south.z1 + north.z0) / 2, y: y0 + 0.04,
        x0: south.x0, x1: south.x1, z0: south.z1, z1: north.z0,
        y0: y0 + 0.02, y1: y0 + 1.6,
        openW: north.z0 - south.z1, openH: 1.6, probe: 0.02,
      });
    }
  }
  const next = slabs.find((s) => s.col === 1 && s.row === 0);
  if (south && next) {
    if (alongZ) {
      voids.push({
        id: 'gardenPath-joint-z', kind: 'joint',
        x: south.x, z: (south.z1 + next.z0) / 2, y: y0 + 0.04,
        x0: south.x0, x1: south.x1, z0: south.z1, z1: next.z0,
        y0: y0 + 0.02, y1: y0 + 1.6,
        openW: next.z0 - south.z1, openH: 1.6, probe: 0.02,
      });
    } else {
      voids.push({
        id: 'gardenPath-joint-x', kind: 'joint',
        x: (south.x1 + next.x0) / 2, z: south.z, y: y0 + 0.04,
        x0: south.x1, x1: next.x0, z0: south.z0, z1: south.z1,
        y0: y0 + 0.02, y1: y0 + 1.6,
        openW: next.x0 - south.x1, openH: 1.6, probe: 0.02,
      });
    }
  }
  voids.push({
    id: 'gardenPath-air', kind: 'air',
    x: g.x, z: g.z, y: y0 + 1.0,
    x0: g.x0, x1: g.x1,
    z0: g.z0, z1: g.z1,
    y0: y0 + GARDEN_PATH_SLAB_H + 0.08, y1: y0 + 2.4,
    openW: g.w, openH: 2.4, probe: 0.22,
  });
  return voids;
}

function pushPathAabb(shapes, x, z, sx, sz, y0, sy) {
  shapes.push({ type: 'aabb', tag: 'gardenPath', x, z, sx, sz, y0, sy });
}

/**
 * Per-slab colliders only. Inset so each collider is ⊆ its flagstone
 * (±0.15 m). Grass hull / joints have no collider.
 * Default is 268→284 / z=84. Pass gardenPathGeom(PARK_WALK_X, PARK_WALK_Z).
 */
export function gardenPathColliderShapes(g = gardenPathGeom()) {
  const shapes = [];
  const slabs = gardenPathSlabs(g);
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

/** Push per-slab colliders. Same bag as the haunt kits. Never a path AABB.
 *  No-arg covers 268→284 / z=84 and the signed park walks via gardenPathGeom. */
export function installGardenPathColliders(addCyl, addCollider) {
  void addCyl;
  const shapes = gardenPathColliderShapes();
  if (!gardenPathRejected(PARK_WALK_X, PARK_WALK_Z)) {
    const park = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_X, PARK_WALK_Z));
    for (let i = 0; i < park.length; i++) shapes.push(park[i]);
  }
  if (!gardenPathRejected(PARK_WALK_E_X, PARK_WALK_E_Z)) {
    const east = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_E_X, PARK_WALK_E_Z));
    for (let i = 0; i < east.length; i++) shapes.push(east[i]);
  }
  if (!gardenPathRejected(PARK_WALK_NS_X, PARK_WALK_NS_Z)) {
    const ns = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_NS_X, PARK_WALK_NS_Z));
    for (let i = 0; i < ns.length; i++) shapes.push(ns[i]);
  }
  if (!gardenPathRejected(PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z)) {
    const nsE = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_NS_E_X, PARK_WALK_NS_E_Z));
    for (let i = 0; i < nsE.length; i++) shapes.push(nsE[i]);
  }
  if (!gardenPathRejected(PARK_WALK_EE_X, PARK_WALK_EE_Z)) {
    const ee = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_EE_X, PARK_WALK_EE_Z));
    for (let i = 0; i < ee.length; i++) shapes.push(ee[i]);
  }
  if (!gardenPathRejected(PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z)) {
    const eeW = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_EE_W_X, PARK_WALK_EE_W_Z));
    for (let i = 0; i < eeW.length; i++) shapes.push(eeW[i]);
  }
  if (!gardenPathRejected(PARK_WALK_EE_E_X, PARK_WALK_EE_E_Z)) {
    const eeE = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_EE_E_X, PARK_WALK_EE_E_Z));
    for (let i = 0; i < eeE.length; i++) shapes.push(eeE[i]);
  }
  if (!gardenPathRejected(PARK_WALK_FF_X, PARK_WALK_FF_Z)) {
    const ff = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_FF_X, PARK_WALK_FF_Z));
    for (let i = 0; i < ff.length; i++) shapes.push(ff[i]);
  }
  if (!gardenPathRejected(PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z)) {
    const ffW = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_FF_W_X, PARK_WALK_FF_W_Z));
    for (let i = 0; i < ffW.length; i++) shapes.push(ffW[i]);
  }
  if (!gardenPathRejected(PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z)) {
    const ffE = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_FF_E_X, PARK_WALK_FF_E_Z));
    for (let i = 0; i < ffE.length; i++) shapes.push(ffE[i]);
  }
  if (!gardenPathRejected(PARK_WALK_GG_X, PARK_WALK_GG_Z)) {
    const gg = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_GG_X, PARK_WALK_GG_Z));
    for (let i = 0; i < gg.length; i++) shapes.push(gg[i]);
  }
  if (!gardenPathRejected(PARK_WALK_GG_W_X, PARK_WALK_GG_W_Z)) {
    const ggW = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_GG_W_X, PARK_WALK_GG_W_Z));
    for (let i = 0; i < ggW.length; i++) shapes.push(ggW[i]);
  }
  if (!gardenPathRejected(PARK_WALK_GG_E_X, PARK_WALK_GG_E_Z)) {
    const ggE = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_GG_E_X, PARK_WALK_GG_E_Z));
    for (let i = 0; i < ggE.length; i++) shapes.push(ggE[i]);
  }
  if (!gardenPathRejected(PARK_WALK_HH_X, PARK_WALK_HH_Z)) {
    const hh = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_HH_X, PARK_WALK_HH_Z));
    for (let i = 0; i < hh.length; i++) shapes.push(hh[i]);
  }
  if (!gardenPathRejected(PARK_WALK_HH_W_X, PARK_WALK_HH_W_Z)) {
    const hhW = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_HH_W_X, PARK_WALK_HH_W_Z));
    for (let i = 0; i < hhW.length; i++) shapes.push(hhW[i]);
  }
  if (!gardenPathRejected(PARK_WALK_HH_E_X, PARK_WALK_HH_E_Z)) {
    const hhE = gardenPathColliderShapes(gardenPathGeom(PARK_WALK_HH_E_X, PARK_WALK_HH_E_Z));
    for (let i = 0; i < hhE.length; i++) shapes.push(hhE[i]);
  }
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
  const cells = gardenBenchSignedCells();
  const shapes = [];
  for (let i = 0; i < cells.length; i++) {
    const bag = gardenBenchColliderShapes(gardenBenchGeom(cells[i][0], cells[i][1]));
    for (let j = 0; j < bag.length; j++) shapes.push(bag[j]);
  }
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
 * Thin grade hulls. No-arg covers 276/92, 347/96, 364/96,
 * 381/96, and 398/96 via pocketParkHull. Do not merge E x1=355
 * with F x0=356, F x1=372 with G x0=373, or G x1=389 with
 * H x0=390, into one plate. Blades are visual. Never a 0.3 m
 * pad AABB. Never per-blade colliders. Collider is the ground
 * hull.
 */
export function pocketParkColliderShapes() {
  const cells = [
    pocketParkHull(),
    pocketParkHull(POCKET_PARK_E_X, POCKET_PARK_E_Z),
    pocketParkHull(POCKET_PARK_F_X, POCKET_PARK_F_Z),
    pocketParkHull(POCKET_PARK_G_X, POCKET_PARK_G_Z),
    pocketParkHull(POCKET_PARK_H_X, POCKET_PARK_H_Z),
  ];
  const shapes = [];
  for (let i = 0; i < cells.length; i++) {
    const h = cells[i];
    shapes.push({
      type: 'aabb', tag: 'pocketPark', part: 'grade',
      x: h.x, z: h.z, sx: h.w, sz: h.d,
      y0: CITY_Y, sy: POCKET_PARK_HULL_H,
    });
  }
  return shapes;
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

/** Underside of the boardwalk or pier deck, or +Infinity if over neither. */
export function deckBottom(x, z) {
  let bot = Infinity;
  if (Math.abs(x) <= BOARDWALK_W / 2 && Math.abs(z - BOARDWALK_Z) <= BOARDWALK_D / 2) {
    bot = BOARDWALK_TOP - BOARDWALK_H;
  }
  if (Math.abs(x - PIER_X) <= PIER_DECK_W / 2 && Math.abs(z - PIER_DECK_Z) <= PIER_DECK_D / 2) {
    const b = PIER_DECK_TOP - PIER_DECK_H;
    if (b < bot) bot = b;
  }
  return bot;
}

/**
 * Surface the FPV camera must stay above: terrain / seabed, or the
 * boardwalk / pier deck top when the probe is on or above that slab.
 * Optional `y`: if the probe is already under the deck, do not lift
 * through the planks (pier undercroft / dive). Two-arg calls still
 * return the deck, matching the old 2D query.
 */
export function cameraFloor(x, z, y) {
  const g = groundHeight(x, z);
  const d = deckTop(x, z);
  if (!Number.isFinite(d)) return g;
  if (y != null && Number.isFinite(y)) {
    const b = deckBottom(x, z);
    if (Number.isFinite(b) && y < b - 0.04) return g;
  }
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
  return g;
}

// mesh displacement — same formula the physics-adjacent vertex loop always used
export function meshHeight(x, z) {
  return baseProfile(z) + (z < CITY_Z - 2 ? sandNoise(x, z) * Math.max(0, 1 - Math.abs(z) / 60) : 0);
}

// seabed under the waterline (no "water counts as ground" clamp)
export function seabedHeight(x, z) {
  return baseProfile(z) + sandNoise(x, z) * Math.max(0, 1 - Math.abs(z) / 60);
}
