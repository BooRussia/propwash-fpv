import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cBox, cCyl } from '../geo.js';

const IRON = 0x3a3d40;
const IRON_DK = 0x2c2f33;
const IRON_LT = 0x4c5156;
const BOLT = 0x6a7178;

/** Tangential box segments around a circle in XZ. */
function ring(G, r, radial, h, n, hex, y) {
  const chord = 2 * r * Math.tan(Math.PI / n);
  const step = (Math.PI * 2) / n;
  for (let i = 0; i < n; i++) {
    const a = i * step;
    G.push(cBox(
      chord * 0.94, h, radial, hex,
      Math.sin(a) * r, y, Math.cos(a) * r,
      0, a, 0,
    ));
  }
}

/**
 * Cast-iron street tree grate. Origin at ground.
 * Top: slotted rings + radials; sides: square frame + lip;
 * bottom: bar undersides + corner pads. Inner hole is open.
 */
export function buildTreeGrateGeo() {
  const S = 1.36;
  const T = 0.046;
  const FW = 0.09;
  const PAD = 0.014;
  const y = PAD + T / 2;
  const half = S / 2;
  const G = [];

  const railZ = half - FW / 2;
  G.push(cBox(S, T, FW, IRON, 0, y, railZ));
  G.push(cBox(S, T, FW, IRON, 0, y, -railZ));
  G.push(cBox(FW, T, S - 2 * FW, IRON, railZ, y, 0));
  G.push(cBox(FW, T, S - 2 * FW, IRON, -railZ, y, 0));

  const lipH = 0.02;
  const lipW = 0.028;
  const lipY = PAD + T + lipH / 2;
  G.push(cBox(S, lipH, lipW, IRON_LT, 0, lipY, half - lipW / 2));
  G.push(cBox(S, lipH, lipW, IRON_LT, 0, lipY, -(half - lipW / 2)));
  G.push(cBox(lipW, lipH, S - 2 * lipW, IRON_LT, half - lipW / 2, lipY, 0));
  G.push(cBox(lipW, lipH, S - 2 * lipW, IRON_LT, -(half - lipW / 2), lipY, 0));

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      G.push(cBox(0.1, PAD, 0.1, IRON_DK, sx * (half - 0.08), PAD / 2, sz * (half - 0.08)));
      G.push(cCyl(0.016, 0.016, 0.01, 6, BOLT,
        sx * (half - 0.045), PAD + T + 0.005, sz * (half - 0.045)));
    }
  }

  ring(G, 0.28, 0.05, T, 14, IRON_DK, y);
  ring(G, 0.27, 0.03, T + 0.018, 14, IRON_LT, y + 0.009);
  ring(G, 0.38, 0.028, T, 16, IRON, y);
  ring(G, 0.48, 0.028, T, 16, IRON, y);
  ring(G, 0.575, 0.028, T, 16, IRON, y);

  const r0 = 0.31;
  const r1 = half - FW;
  const len = r1 - r0;
  const rBar = (r0 + r1) / 2;
  for (let i = 0; i < 12; i++) {
    const a = i * (Math.PI / 6);
    G.push(cBox(0.028, T, len, IRON, Math.sin(a) * rBar, y, Math.cos(a) * rBar, 0, a, 0));
  }

  const gx = half - FW - 0.07;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      G.push(cBox(0.14, T, 0.14, IRON, sx * gx, y, sz * gx));
    }
  }

  const m = mergeGeometries(G);
  G.forEach((g) => g.dispose());
  return m;
}
