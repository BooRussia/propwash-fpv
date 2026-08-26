import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cBox, cCyl } from '../geo.js';

// Catalog section sidewalk-furniture — vertex-coloured builders.
// Origin at ground; +Y is a coloured lid/roof, never a window atlas.
// Does not consume rng/rng2/rng3/rng4.

function merge(G) {
  const m = mergeGeometries(G);
  G.forEach((g) => g.dispose());
  return m;
}

/** USPS collection box. Origin at ground.
 *  Front: drop door + pull + slot; back: enamel; left: schedule plate;
 *  right: enamel; top: lid; bottom: four legs. */
export function buildMailboxGeo() {
  const blue = 0x1e4d8c, door = 0x163a6b, chrome = 0xb8c0c6, leg = 0x2b3036;
  const cream = 0xf0e6bb, slot = 0x0c0f12;
  const G = [
    cBox(0.50, 1.08, 0.44, blue, 0, 0.70, 0),
    cBox(0.38, 0.52, 0.03, door, 0, 0.58, -0.235),
    cBox(0.12, 0.03, 0.04, chrome, 0, 0.50, -0.255),
    cBox(0.28, 0.03, 0.04, slot, 0, 1.04, -0.235),
    cBox(0.50, 1.08, 0.03, 0x163a6b, 0, 0.70, 0.235),
    cBox(0.02, 0.22, 0.16, cream, -0.26, 0.92, 0),
    cBox(0.52, 0.06, 0.46, 0x163a6b, 0, 1.27, 0),
    cBox(0.18, 0.03, 0.04, chrome, 0, 1.31, -0.08),
  ];
  for (const sx of [-0.20, 0.20]) {
    for (const sz of [-0.17, 0.17]) {
      G.push(cBox(0.05, 0.16, 0.05, leg, sx, 0.08, sz));
    }
  }
  return merge(G);
}

/** Tied newspaper stack. Origin at ground.
 *  Front/back: paper edges + ink band; left/right: stacked sheet ends;
 *  top: masthead; bottom: underside of the bundle. */
export function buildPaperStackGeo() {
  const twine = 0x8a7048;
  const sheets = [
    [0.40, 0.048, 0.30, 0xe8e4d8, 0.026],
    [0.39, 0.046, 0.29, 0xddd6c4, 0.074],
    [0.40, 0.048, 0.30, 0xf2eee6, 0.122],
    [0.385, 0.046, 0.285, 0xd4cfc2, 0.170],
    [0.395, 0.048, 0.295, 0xe6e0d2, 0.218],
  ];
  const G = [];
  for (const [w, h, d, hex, y] of sheets) G.push(cBox(w, h, d, hex, 0, y, 0));
  G.push(cBox(0.22, 0.012, 0.26, 0x2b3036, 0, 0.246, 0));
  G.push(cBox(0.42, 0.018, 0.018, twine, 0, 0.125, 0));
  G.push(cBox(0.018, 0.018, 0.32, twine, 0, 0.125, 0));
  G.push(cBox(0.018, 0.26, 0.018, twine, 0, 0.125, 0));
  return merge(G);
}

/** Dog-bag dispenser on a post. Origin at ground.
 *  Front: dispenser door + roll; back: post; left/right: box sides;
 *  top: lid; bottom: flange. */
export function buildDogBagDispenserGeo() {
  const post = 0x3a4038, box = 0x4a7a3c, lid = 0x2f4e28, roll = 0xc4c8b0;
  const G = [
    cCyl(0.08, 0.08, 0.04, 8, 0x2b3036, 0, 0.02, 0),
    cCyl(0.028, 0.028, 1.06, 8, post, 0, 0.57, 0),
    cBox(0.12, 0.18, 0.10, box, 0, 0.90, -0.04),
    cBox(0.08, 0.10, 0.02, 0x2a4538, 0, 0.88, -0.10),
    cBox(0.13, 0.03, 0.11, lid, 0, 1.005, -0.04),
    cCyl(0.035, 0.035, 0.07, 8, roll, 0, 0.88, -0.09, Math.PI / 2),
    cBox(0.08, 0.04, 0.02, 0xf0e6bb, 0, 1.04, -0.04),
  ];
  return merge(G);
}

/** Sidewalk drinking fountain. Origin at ground.
 *  Front: spout + button; back/left/right: stem; top: bowl + basin;
 *  bottom: concrete base. */
export function buildStreetFountainGeo() {
  const stone = 0x9a9488, steel = 0x9aa6b0, basin = 0x4a5858, chrome = 0xb8c0c6;
  const G = [
    cCyl(0.26, 0.28, 0.08, 10, stone, 0, 0.04, 0),
    cCyl(0.11, 0.13, 0.62, 10, steel, 0, 0.39, 0),
    cCyl(0.22, 0.20, 0.10, 10, steel, 0, 0.78, 0),
    cCyl(0.16, 0.15, 0.04, 8, basin, 0, 0.81, 0),
    cCyl(0.04, 0.04, 0.03, 6, 0x1e252c, 0, 0.79, 0),
    cCyl(0.025, 0.02, 0.12, 6, chrome, 0, 0.88, -0.14, Math.PI / 2),
    cCyl(0.018, 0.018, 0.05, 6, chrome, 0, 0.93, -0.18),
    cCyl(0.03, 0.03, 0.03, 8, 0x37525c, 0, 0.52, -0.13, Math.PI / 2),
  ];
  return merge(G);
}

/** Payphone kiosk. Origin at ground.
 *  Front: hood + phone + keypad; back: enamel panel; left/right: wings;
 *  top: roof; bottom: pad. */
export function buildPayphoneKioskGeo() {
  const teal = 0x2f6f7a, cream = 0xf0e6bb, chrome = 0xb8c0c6, dark = 0x1e252c;
  const G = [
    cBox(0.78, 0.08, 0.48, 0x2a2f36, 0, 0.04, 0),
    cBox(0.76, 2.00, 0.06, teal, 0, 1.12, 0.20),
    cBox(0.06, 1.70, 0.44, teal, -0.37, 0.93, -0.02),
    cBox(0.06, 1.70, 0.44, teal, 0.37, 0.93, -0.02),
    cBox(0.78, 0.12, 0.50, teal, 0, 1.94, -0.02),
    cBox(0.80, 0.08, 0.50, cream, 0, 2.16, 0),
    cBox(0.70, 0.04, 0.08, chrome, 0, 1.86, -0.22),
    cBox(0.28, 0.55, 0.12, dark, 0, 1.18, -0.04),
    cBox(0.16, 0.18, 0.04, 0x3a4038, 0, 1.08, -0.12),
    cBox(0.10, 0.06, 0.03, chrome, 0, 1.32, -0.12),
    cBox(0.18, 0.08, 0.06, chrome, 0.10, 1.42, -0.02, 0, 0, 0.4),
    cBox(0.05, 0.16, 0.05, dark, 0.16, 1.30, -0.04),
    cBox(0.36, 0.04, 0.18, cream, 0, 0.86, -0.08),
    cBox(0.22, 0.10, 0.02, cream, 0, 1.62, 0.16),
  ];
  return merge(G);
}
