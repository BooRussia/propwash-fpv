import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cBox, cCyl } from '../geo.js';

// Alleys / lots / marina catalog builders. Origin at local ground (y = 0).
// Vertex colours only — never a window atlas on +Y. Do not call
// rng/rng2/rng3/rng4.

const IRON = 0x4a5158;
const GALV = 0x8a9298;
const GALV2 = 0x6d747c;
const BOLT = 0x3a3e42;
const WOOD = 0x6a5344;
const WOOD2 = 0x4e3d32;
const ROPE = 0x8a7048;
const ROPE2 = 0x7a6240;
const CAP = 0xd8d4c8;
const DECK = 0xb08a58;
const DECK2 = 0x9a7548;
const STRINGER = 0x6a4e32;
const UNDER = 0x5a4030;
const KRAFT = 0xc4a06a;
const KRAFT2 = 0xb08a52;
const KRAFT3 = 0xd4b07a;
const TAPE = 0xd8c48a;
const FLAP = 0xae8c58;
const SEAM = 0x8a6a40;
const STENCIL = 0x3a5a7a;

function merge(G) {
  const m = mergeGeometries(G);
  G.forEach((g) => g.dispose());
  return m;
}

/** Dock cleat. Origin at deck.
 *  ±X: horn tips; ±Z: base plate + horn barrel; +Y: horns; -Y: underside. */
export function buildDockCleatGeo() {
  const G = [
    cBox(0.30, 0.016, 0.16, IRON, 0, 0.008, 0),
    cBox(0.10, 0.05, 0.06, GALV2, 0, 0.041, 0),
    cCyl(0.024, 0.024, 0.18, 8, GALV, 0, 0.095, 0, 0, 0, Math.PI / 2),
    cCyl(0.026, 0.016, 0.07, 8, GALV, -0.12, 0.108, 0, 0, 0, Math.PI / 2 - 0.32),
    cCyl(0.026, 0.016, 0.07, 8, GALV, 0.12, 0.108, 0, 0, 0, -Math.PI / 2 + 0.32),
    cCyl(0.014, 0.014, 0.022, 6, GALV2, -0.165, 0.128, 0, 0, 0, Math.PI / 2),
    cCyl(0.014, 0.014, 0.022, 6, GALV2, 0.165, 0.128, 0, 0, 0, Math.PI / 2),
  ];
  for (const sx of [-0.11, 0.11]) {
    for (const sz of [-0.05, 0.05]) {
      G.push(cCyl(0.012, 0.012, 0.01, 6, BOLT, sx, 0.021, sz));
    }
  }
  return merge(G);
}

/** Dock pile + cap. Origin at ground.
 *  Sides: tapered timber; wrap: rope bands; +Y: pyramidal cap; -Y: butt. */
export function buildDockPileGeo() {
  return merge([
    cCyl(0.17, 0.20, 2.18, 10, WOOD, 0, 1.09, 0),
    cCyl(0.178, 0.188, 0.08, 10, WOOD2, 0, 0.55, 0),
    cCyl(0.175, 0.182, 0.06, 10, WOOD2, 0, 1.25, 0),
    cCyl(0.186, 0.188, 0.035, 10, ROPE, 0, 1.70, 0),
    cCyl(0.188, 0.186, 0.035, 10, ROPE2, 0, 1.735, 0),
    cCyl(0.186, 0.184, 0.035, 10, ROPE, 0, 1.77, 0),
    cCyl(0.192, 0.192, 0.04, 10, GALV2, 0, 2.00, 0),
    cCyl(0.02, 0.20, 0.16, 8, CAP, 0, 2.26, 0),
    cCyl(0.018, 0.018, 0.04, 6, GALV2, 0, 2.36, 0),
  ]);
}

/** GMA wood pallet. Origin at ground.
 *  +Y: deck boards; -Y: underside boards; ±X/±Z: stringer ends + slat edges. */
export function buildPalletWoodGeo() {
  const G = [];
  for (const z of [-0.48, 0, 0.48]) {
    G.push(cBox(1.20, 0.090, 0.040, STRINGER, 0, 0.067, z));
  }
  const xs = [-0.55, -0.367, -0.183, 0, 0.183, 0.367, 0.55];
  for (let i = 0; i < xs.length; i++) {
    G.push(cBox(0.10, 0.022, 1.00, i % 2 ? DECK2 : DECK, xs[i], 0.123, 0));
  }
  for (const x of [-0.55, 0, 0.55]) {
    G.push(cBox(0.10, 0.022, 1.00, UNDER, x, 0.011, 0));
  }
  return merge(G);
}

/** Alley cardboard stack. Origin at ground.
 *  Faces: kraft panels + tape seams; +Y: closed/open flaps; -Y: bottom carton. */
export function buildCardboardStackGeo() {
  return merge([
    cBox(0.54, 0.36, 0.40, KRAFT, 0, 0.18, 0),
    cBox(0.04, 0.36, 0.01, SEAM, 0, 0.18, -0.205),
    cBox(0.22, 0.03, 0.012, TAPE, 0, 0.34, -0.206),
    cBox(0.54, 0.36, 0.012, KRAFT2, 0, 0.18, 0.206),
    cBox(0.26, 0.016, 0.38, FLAP, -0.13, 0.368, 0),
    cBox(0.26, 0.016, 0.38, KRAFT3, 0.13, 0.372, 0),
    cBox(0.18, 0.012, 0.04, TAPE, 0, 0.382, 0),
    cBox(0.012, 0.12, 0.16, STENCIL, 0.276, 0.22, 0),
    cBox(0.40, 0.26, 0.32, KRAFT2, 0.04, 0.51, -0.02),
    cBox(0.03, 0.26, 0.01, SEAM, 0.04, 0.51, -0.185),
    cBox(0.16, 0.02, 0.01, TAPE, 0.04, 0.61, -0.186),
    cBox(0.16, 0.012, 0.30, FLAP, -0.24, 0.655, -0.02),
    cBox(0.16, 0.012, 0.30, KRAFT3, 0.32, 0.655, -0.02),
    cBox(0.28, 0.16, 0.22, KRAFT3, -0.04, 0.72, 0.04),
    cBox(0.26, 0.012, 0.10, FLAP, -0.04, 0.808, -0.04),
    cBox(0.26, 0.012, 0.10, KRAFT, -0.04, 0.808, 0.12),
    cBox(0.04, 0.14, 0.01, SEAM, -0.04, 0.72, -0.075),
  ]);
}
