import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { colorFill, cBox, cCyl } from '../geo.js';

// ---------- lifeguard towers v2 (classic Miami) ----------
// Raised platform on 4 splayed legs, thin-bar safety railing, access ramp,
// hut with an open window cutout, mono-pitched overhanging roof, flag.
// Vertex-colored; all 6 towers merge into a single mesh.
export function buildLifeguardGeo(primary, roofCol) {
  const trim = 0xf5f1e4, dark = 0x1e252c;
  const G = [];
  // 4 splayed legs (base wider than the deck)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const g = new THREE.BoxGeometry(0.16, 2.62, 0.16);
      g.translate(0, 1.31, 0);
      g.rotateZ(sx * 0.13);
      g.rotateX(-sz * 0.13);
      g.translate(sx * 1.35, 0, sz * 1.1);
      G.push(colorFill(g, trim));
    }
  }
  // cross braces
  G.push(cBox(2.4, 0.09, 0.09, trim, 0, 1.0, -1.22));
  G.push(cBox(2.4, 0.09, 0.09, trim, 0, 1.0, 1.22));
  G.push(cBox(0.09, 0.09, 2.2, trim, -1.22, 1.35, 0));
  G.push(cBox(0.09, 0.09, 2.2, trim, 1.22, 1.35, 0));
  // platform deck
  G.push(cBox(3.3, 0.14, 2.9, trim, 0, 2.45, 0));
  const DT = 2.52;                                    // deck top
  // railing posts (front gap at x in [-1.05, -0.15] for the ramp)
  for (const [px, pz] of [[-1.6, -1.4], [1.6, -1.4], [-1.6, 1.4], [1.6, 1.4],
                          [0, 1.4], [-1.6, 0], [1.6, 0], [-1.05, -1.4], [-0.15, -1.4], [0.72, -1.4]]) {
    G.push(cBox(0.06, 0.82, 0.06, trim, px, DT + 0.41, pz));
  }
  // twin thin rails
  for (const ry of [0.42, 0.8]) {
    const t = ry === 0.8 ? 0.055 : 0.04;
    G.push(cBox(t, t, 2.9, trim, -1.6, DT + ry, 0));
    G.push(cBox(t, t, 2.9, trim, 1.6, DT + ry, 0));
    G.push(cBox(3.3, t, t, trim, 0, DT + ry, 1.4));
    G.push(cBox(0.55, t, t, trim, -1.32, DT + ry, -1.4));
    G.push(cBox(1.75, t, t, trim, 0.72, DT + ry, -1.4));
  }
  // hut — window opening faces the ocean (-z)
  const HZ = 0.35, HH = 1.75;
  G.push(cBox(2.4, HH, 0.07, primary, 0, DT + HH / 2, HZ + 0.85));
  G.push(cBox(0.07, HH, 1.77, primary, -1.165, DT + HH / 2, HZ));
  G.push(cBox(0.07, HH, 1.77, primary, 1.165, DT + HH / 2, HZ));
  G.push(cBox(2.4, 0.5, 0.07, primary, 0, DT + 0.25, HZ - 0.85));
  G.push(cBox(2.4, 0.3, 0.07, primary, 0, DT + HH - 0.15, HZ - 0.85));
  G.push(cBox(0.38, 0.95, 0.07, primary, -1.01, DT + 0.975, HZ - 0.85));
  G.push(cBox(0.38, 0.95, 0.07, primary, 1.01, DT + 0.975, HZ - 0.85));
  G.push(cBox(2.2, 1.55, 1.55, dark, 0, DT + 0.85, HZ + 0.06));       // dark interior
  G.push(cBox(1.7, 0.06, 0.18, trim, 0, DT + 0.52, HZ - 0.88));       // window sill
  // mono-pitched roof, overhanging the deck toward the ocean
  G.push(cBox(2.85, 0.09, 2.65, roofCol, 0, DT + HH + 0.22, HZ - 0.28, -0.14));
  // access ramp through the railing gap down to the sand
  const RA = 0.48;
  G.push(cBox(0.95, 0.08, 5.0, trim, -0.6, 1.28, -3.55, -RA));
  G.push(cBox(0.05, 0.4, 5.0, primary, -1.04, 1.62, -3.55, -RA));
  G.push(cBox(0.05, 0.4, 5.0, primary, -0.16, 1.62, -3.55, -RA));
  // flag on a pole
  G.push(cCyl(0.025, 0.025, 1.5, 5, trim, 1.15, DT + HH + 0.95, HZ + 0.75));
  G.push(cBox(0.55, 0.34, 0.02, 0xff5330, 1.45, DT + HH + 1.5, HZ + 0.75));
  const merged = mergeGeometries(G);
  G.forEach((g) => g.dispose());
  return merged;
}
