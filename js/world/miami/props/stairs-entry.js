import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cBox, cCyl } from '../geo.js';

// Authored stairs-entry kit (curb ramp, wall-mount handrail).
// Vertex-coloured BufferGeometries, origin at ground. No rng stream.

/**
 * ADA curb ramp + truncated-dome detectable warning.
 * Origin at ground at the street-edge (bottom) of the slope; runs +Z, rises +Y.
 *   -Z street  — truncated-dome detectable warning
 *   +Z walk    — sidewalk landing
 *   +X / -X    — cheek curbs
 *   +Y         — sloped walking surface
 *   -Y         — soffit
 * Vertex colours. Does not consume any rng stream. Never a window atlas.
 */
export function buildCurbRampGeo(opts = {}) {
  const width = opts.width ?? 1.52;
  const rise = opts.rise ?? 0.15;
  const run = opts.run ?? 1.82;
  const slab = 0.06;
  const pitch = Math.atan(rise / run);
  const slopeLen = run / Math.cos(pitch);
  const conc = 0x7a756c, conc2 = 0x5c5852, warn = 0xd4a017, cheek = 0x6a655c;
  const midY = rise / 2 + slab / 2;
  const midZ = run / 2;
  const G = [
    cBox(width, slab, slopeLen, conc, 0, midY, midZ, -pitch),
    cBox(width - 0.08, 0.02, slopeLen - 0.1, conc2, 0, midY - slab * 0.42, midZ, -pitch),
    cBox(width - 0.1, 0.018, 0.62 / Math.cos(pitch), warn, 0, slab * 0.5 + 0.305 * (rise / run) + 0.02, 0.31, -pitch),
    cBox(0.08, 0.14, slopeLen, cheek, -(width / 2) - 0.03, rise / 2 + 0.1, midZ, -pitch),
    cBox(0.08, 0.14, slopeLen, cheek, (width / 2) + 0.03, rise / 2 + 0.1, midZ, -pitch),
    cBox(width + 0.16, slab, 0.42, conc, 0, rise + slab / 2, run + 0.18),
    cBox(width + 0.2, 0.03, 0.46, conc2, 0, rise + slab + 0.015, run + 0.18),
    cBox(width + 0.16, 0.05, 0.08, cheek, 0, 0.025, -0.02),
  ];
  const cols = 11, rows = 5, sp = 0.12, z0 = 0.1;
  for (let iz = 0; iz < rows; iz++) {
    for (let ix = 0; ix < cols; ix++) {
      const x = (ix - (cols - 1) / 2) * sp;
      const z = z0 + iz * sp;
      const y = slab + z * (rise / run) + 0.008;
      G.push(cCyl(0.012, 0.022, 0.016, 8, warn, x, y, z));
    }
  }
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}

/**
 * Wall-mount stair handrail. Origin at ground under the bottom return.
 * Runs +Z, rises +Y; wall is +X.
 *   +X wall    — brackets + plates
 *   -X street  — rail barrel
 *   -Z         — bottom return
 *   +Z         — top return
 *   +Y         — rail
 *   -Y         — bracket arms
 * Vertex colours. Does not consume any rng stream. Never a window atlas.
 */
export function buildStairHandrailGeo(opts = {}) {
  const steps = opts.steps ?? 7;
  const rise = opts.rise ?? 0.14;
  const run = opts.run ?? 0.30;
  const railH = opts.railH ?? 0.90;
  const steel = 0x9aa3ab, dark = 0x6d747c, plateC = 0x5c646c;
  const rad = 0.022;
  const totalRise = steps * rise;
  const totalRun = steps * run;
  const z0 = 0.10, z1 = totalRun;
  const y0 = railH, y1 = railH + totalRise;
  const dy = y1 - y0, dz = z1 - z0;
  const len = Math.hypot(dy, dz);
  const rx = Math.atan2(dz, dy);
  const G = [
    cCyl(rad, rad, len, 8, steel, 0, (y0 + y1) / 2, (z0 + z1) / 2, rx),
    cCyl(rad, rad, 0.10, 8, steel, 0.05, y0, z0, 0, 0, -Math.PI / 2),
    cCyl(rad, rad, 0.10, 8, steel, 0.05, y1, z1, 0, 0, -Math.PI / 2),
    cBox(0.02, 0.14, 0.09, plateC, 0.11, y0, z0),
    cBox(0.02, 0.14, 0.09, plateC, 0.11, y1, z1),
  ];
  for (const t of [0.22, 0.50, 0.78]) {
    const y = y0 + t * dy;
    const z = z0 + t * dz;
    G.push(cCyl(0.012, 0.012, 0.09, 6, dark, 0.05, y, z, 0, 0, -Math.PI / 2));
    G.push(cBox(0.02, 0.11, 0.07, plateC, 0.11, y, z));
    G.push(cBox(0.05, 0.03, 0.03, dark, 0.03, y, z));
  }
  const m = mergeGeometries(G); G.forEach((g) => g.dispose()); return m;
}
