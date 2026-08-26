import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cBox, cCyl } from '../geo.js';

// Catalog section traffic-control — vertex-coloured builders.
// Origin at ground; +Y is a coloured cap/lid, never a window atlas.
// Does not consume rng/rng2/rng3/rng4.

function merge(G) {
  const m = mergeGeometries(G);
  G.forEach((g) => g.dispose());
  return m;
}

/** Steel bollard. Origin at ground; grows +Y. ~1.05 m.
 *  +Z/+X/-Z/-X: galvanized shaft + yellow band; +Y: domed cap; -Y: flange. */
export function buildBollardSteelGeo() {
  const steel = 0x3a424a, band = 0xe8c43a, cap = 0x4a525a, flange = 0x2a3036;
  return merge([
    cCyl(0.14, 0.15, 0.06, 10, flange, 0, 0.03, 0),
    cCyl(0.085, 0.095, 0.88, 10, steel, 0, 0.50, 0),
    cCyl(0.098, 0.098, 0.10, 10, band, 0, 0.62, 0),
    cCyl(0.09, 0.04, 0.11, 10, cap, 0, 0.995, 0),
  ]);
}

/** Flexible delineator post. Origin at ground; grows +Y. ~0.85 m.
 *  +Z/+X/-Z/-X: orange post + white reflectors; +Y: rounded cap; -Y: rubber base. */
export function buildBollardFlexGeo() {
  const orange = 0xe85a18, white = 0xeee6d8, base = 0x1e2226, cap = 0xd44e14;
  return merge([
    cCyl(0.10, 0.11, 0.08, 8, base, 0, 0.04, 0),
    cCyl(0.035, 0.04, 0.70, 8, orange, 0, 0.43, 0),
    cCyl(0.042, 0.042, 0.06, 8, white, 0, 0.38, 0),
    cCyl(0.042, 0.042, 0.06, 8, white, 0, 0.58, 0),
    cCyl(0.038, 0.02, 0.07, 8, cap, 0, 0.815, 0),
  ]);
}

/** Walk / don't-walk head. Origin at the housing foot.
 *  -Z face: orange hand + white walk; visors over each lens;
 *  +Z back: access door; ±X: housing; +Y: lid; -Y: mount collar. */
export function buildPedSignalGeo() {
  const house = 0x1a1d22, visor = 0x101214, back = 0x2a2e34;
  const hand = 0xcc4a1a, walk = 0xd8dce0, mount = 0x3a4148;
  return merge([
    cCyl(0.06, 0.07, 0.05, 8, mount, 0, 0.025, 0),
    cBox(0.32, 0.60, 0.14, house, 0, 0.36, 0),
    cBox(0.34, 0.04, 0.16, house, 0, 0.68, 0),
    cBox(0.28, 0.56, 0.03, back, 0, 0.36, 0.085),
    cBox(0.12, 0.18, 0.03, hand, 0, 0.50, -0.085),
    cBox(0.12, 0.18, 0.03, walk, 0, 0.26, -0.085),
    cBox(0.16, 0.04, 0.10, visor, 0, 0.61, -0.12),
    cBox(0.16, 0.04, 0.10, visor, 0, 0.37, -0.12),
    cBox(0.03, 0.50, 0.12, house, -0.175, 0.36, 0),
    cBox(0.03, 0.50, 0.12, house, 0.175, 0.36, 0),
  ]);
}

/** MUTCD speed-limit 25. Origin at ground; grows +Y. ~2.5 m.
 *  +Z: white face + black 25; -Z: galvanized back; ±X: post + plate edge;
 *  +Y: post cap; -Y: post foot. Vertex colour — no window atlas. */
export function buildSpeedLimitSignGeo() {
  const pole = 0x6a7278, face = 0xf4f1ea, back = 0x8a9096, ink = 0x1a1a1a, edge = 0xc8c4bc;
  const G = [
    cCyl(0.03, 0.035, 2.42, 6, pole, 0, 1.21, 0),
    cCyl(0.04, 0.04, 0.08, 6, pole, 0, 2.46, 0),
    cBox(0.66, 0.82, 0.04, face, 0, 2.02, 0.05),
    cBox(0.68, 0.84, 0.02, edge, 0, 2.02, 0.02),
    cBox(0.66, 0.82, 0.03, back, 0, 2.02, -0.01),
    cBox(0.40, 0.035, 0.02, ink, 0, 2.30, 0.08),
    cBox(0.34, 0.035, 0.02, ink, 0, 2.24, 0.08),
  ];
  const z = 0.085, t = 0.035, w = 0.13, h = 0.28;
  const digit = (x, segs) => {
    const y = 1.92;
    if (segs[0]) G.push(cBox(w, t, t, ink, x, y + h / 2, z));
    if (segs[1]) G.push(cBox(t, h / 2 - 0.01, t, ink, x + w / 2, y + h / 4, z));
    if (segs[2]) G.push(cBox(t, h / 2 - 0.01, t, ink, x + w / 2, y - h / 4, z));
    if (segs[3]) G.push(cBox(w, t, t, ink, x, y - h / 2, z));
    if (segs[4]) G.push(cBox(t, h / 2 - 0.01, t, ink, x - w / 2, y - h / 4, z));
    if (segs[5]) G.push(cBox(t, h / 2 - 0.01, t, ink, x - w / 2, y + h / 4, z));
    if (segs[6]) G.push(cBox(w, t, t, ink, x, y, z));
  };
  digit(-0.13, [1, 1, 0, 1, 1, 0, 1]);
  digit(0.13, [1, 0, 1, 1, 0, 1, 1]);
  return merge(G);
}
