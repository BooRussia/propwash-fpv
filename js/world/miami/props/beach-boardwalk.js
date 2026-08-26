import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cBox, cCyl } from '../geo.js';

// Beach / boardwalk catalog units. Origin at ground. Vertex colours only —
// never a window atlas on +Y. Does not draw rng/rng2/rng3/rng4.

const STEEL = 0x6d747c;
const STEEL2 = 0x4a5158;
const ORANGE = 0xff6a2a;
const WHITE = 0xf4f1ea;
const BRASS = 0xb08a4a;
const DARK = 0x2b3036;
const CREAM = 0xf0e6bb;

function merge(G) {
  const m = mergeGeometries(G);
  G.forEach((g) => g.dispose());
  return m;
}

/** Torus in the XY plane (faces ±Z) from tangent cCyl segments. */
function ringXY(G, r, tube, n, hex, y, z) {
  const chord = 2 * r * Math.sin(Math.PI / n);
  const step = (Math.PI * 2) / n;
  for (let i = 0; i < n; i++) {
    const a = i * step;
    G.push(cCyl(
      tube, tube, chord * 1.12, 6, hex,
      Math.cos(a) * r, y + Math.sin(a) * r, z,
      0, 0, a + Math.PI / 2,
    ));
  }
}

/**
 * SOLAS life ring on a pier post. Origin at ground. ~Ø0.63 × 1.38 m.
 *
 * Six sides — vertex colour, never a window atlas:
 *   +Z  — brass plaque on the post
 *   -Z  — orange ring + white bands
 *   +X / -X — post barrel + ring profile
 *   +Y top  — post cap
 *   -Y bottom — flange plate
 */
export function buildLifeRingGeo() {
  const yRing = 1.04;
  const zRing = -0.18;
  const r = 0.26;
  const tube = 0.055;
  const G = [
    cCyl(0.10, 0.11, 0.05, 10, STEEL2, 0, 0.025, 0),
    cCyl(0.045, 0.052, 1.28, 8, STEEL, 0, 0.69, 0),
    cCyl(0.055, 0.028, 0.05, 8, STEEL2, 0, 1.355, 0),
    cBox(0.07, 0.08, 0.12, STEEL2, 0, yRing, -0.07),
    cBox(0.16, 0.12, 0.02, BRASS, 0, 0.52, 0.058),
    cBox(0.13, 0.085, 0.01, CREAM, 0, 0.52, 0.070),
    cBox(0.10, 0.012, 0.008, DARK, 0, 0.548, 0.078),
    cBox(0.085, 0.012, 0.008, DARK, 0, 0.520, 0.078),
    cBox(0.10, 0.012, 0.008, DARK, 0, 0.492, 0.078),
  ];
  ringXY(G, r, tube, 16, ORANGE, yRing, zRing);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    G.push(cCyl(
      tube * 1.08, tube * 1.08, 0.12, 6, WHITE,
      Math.cos(a) * r, yRing + Math.sin(a) * r, zRing,
      0, 0, a + Math.PI / 2,
    ));
  }
  return merge(G);
}
