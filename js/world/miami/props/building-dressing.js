import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cBox, cCyl } from '../geo.js';

// Catalog section building-dressing — vertex-coloured builders.
// Origin at ground; +Y is a coloured lid/ball, never a window atlas.
// Does not consume rng/rng2/rng3/rng4.

const GALV = 0x9ba3ab;
const GALV2 = 0x8d959d;
const GRILLE = 0x5c646c;
const LOUVRE = 0x4a5158;
const COND = 0x3c4249;
const DRIP = 0x6d747c;
const DRIP2 = 0x4a5158;
const CREAM = 0xe8e0d0;
const GOLD = 0xd4b45a;
const STONE = 0x9a9488;
const STEEL = 0x6d747c;
const STEEL2 = 0x4a5158;

function merge(G) {
  const m = mergeGeometries(G);
  G.forEach((g) => g.dispose());
  return m;
}

function oneWindowAc(G, x) {
  G.push(cBox(0.70, 0.045, 0.58, DRIP, x, 0.022, 0));
  G.push(cBox(0.70, 0.03, 0.04, DRIP2, x, 0.012, -0.30));
  G.push(cBox(0.62, 0.38, 0.50, GALV, x, 0.24, 0.02));
  G.push(cBox(0.58, 0.03, 0.46, GALV2, x, 0.445, 0.02));
  G.push(cBox(0.56, 0.30, 0.03, GRILLE, x, 0.24, -0.245));
  for (let i = 0; i < 5; i++) {
    G.push(cBox(0.50, 0.018, 0.04, LOUVRE, x, 0.14 + i * 0.05, -0.265));
  }
  G.push(cBox(0.54, 0.28, 0.03, COND, x, 0.24, 0.28));
  G.push(cBox(0.03, 0.22, 0.22, GRILLE, x - 0.325, 0.24, 0.04));
  G.push(cBox(0.03, 0.22, 0.22, GRILLE, x + 0.325, 0.24, 0.04));
  G.push(cCyl(0.07, 0.07, 0.14, 8, COND, x + 0.12, 0.20, 0.22, Math.PI / 2));
}

/**
 * Through-wall AC row (3 chassis on a shared drip sill). Origin at ground.
 *
 * Six sides — vertex colour, never a window atlas:
 *   -Z street  — louvered grille + drip lip
 *   +Z back    — condenser face
 *   ±X         — chassis sides + vents
 *   +Y top     — chassis lids
 *   -Y bottom  — drip pan
 */
export function buildWindowAcRowGeo() {
  const G = [
    cBox(2.56, 0.04, 0.62, DRIP, 0, 0.02, 0.02),
    cBox(2.56, 0.035, 0.05, DRIP2, 0, 0.01, -0.31),
  ];
  oneWindowAc(G, -0.92);
  oneWindowAc(G, 0);
  oneWindowAc(G, 0.92);
  return merge(G);
}

/**
 * Hotel flagpole. Origin at ground; grows +Y. ~7 m.
 *
 * Six sides — vertex colour, never a window atlas:
 *   ±X / ±Z    — tapered pole + plinth drum
 *   +Y top     — gold ball
 *   -Y bottom  — stone base
 */
export function buildFlagpoleGeo() {
  return merge([
    cCyl(0.22, 0.26, 0.18, 10, STONE, 0, 0.09, 0),
    cCyl(0.18, 0.18, 0.04, 10, 0x7a756c, 0, 0.19, 0),
    cCyl(0.07, 0.085, 0.12, 8, STEEL, 0, 0.26, 0),
    cCyl(0.028, 0.048, 6.52, 8, CREAM, 0, 3.58, 0),
    cCyl(0.04, 0.04, 0.06, 8, STEEL2, 0, 6.87, 0),
    cCyl(0.0, 0.07, 0.07, 10, GOLD, 0, 6.93, 0),
    cCyl(0.07, 0.0, 0.07, 10, GOLD, 0, 7.00, 0),
  ]);
}
