import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cBox, cCyl } from '../geo.js';

// Fence / railing catalog units. Origin at ground. Vertex colours only —
// never a window atlas on +Y. Does not draw rng/rng2/rng3/rng4.

const STEEL = 0x8d959d;
const STEEL2 = 0x6d747c;
const GALV = 0x9ba3ab;
const MESH = 0x7a8078;
const RUST = 0x6a4034;
const DARK = 0x3c4249;

function merge(G) {
  const m = mergeGeometries(G);
  G.forEach((g) => g.dispose());
  return m;
}

function wireGrid(G, x0, x1, y0, y1, z, hex, pitch = 0.14) {
  const t = 0.01;
  const w = x1 - x0;
  const h = y1 - y0;
  const nV = Math.max(2, Math.round(w / pitch));
  const nH = Math.max(2, Math.round(h / pitch));
  const dx = w / nV;
  const dy = h / nH;
  for (let i = 0; i <= nV; i++) {
    G.push(cBox(t, h, t, hex, x0 + i * dx, y0 + h / 2, z));
  }
  for (let j = 0; j <= nH; j++) {
    G.push(cBox(w, t, t, hex, (x0 + x1) / 2, y0 + j * dy, z));
  }
}

/**
 * Steel pipe railing bay. Origin at ground; run along +X.
 *
 * Six sides — vertex colour, never a window atlas:
 *   +Z / -Z  — posts, top rail, mid rail
 *   +X / -X  — post barrels
 *   +Y top   — top rail
 *   -Y bottom — flange plates
 */
export function buildPipeRailingGeo(opts = {}) {
  const span = opts.span ?? 1.6;
  const postH = 1.02;
  const postR = 0.022;
  const railR = 0.018;
  const nBay = Math.max(1, Math.round(span / 1.5));
  const step = span / nBay;
  const G = [];
  for (let i = 0; i <= nBay; i++) {
    const x = -span / 2 + i * step;
    G.push(cCyl(0.05, 0.055, 0.04, 8, STEEL2, x, 0.02, 0));
    G.push(cCyl(postR, postR * 1.08, postH, 8, GALV, x, postH / 2, 0));
    G.push(cCyl(postR * 1.15, postR * 0.4, 0.04, 8, STEEL2, x, postH + 0.01, 0));
  }
  G.push(cCyl(railR, railR, span, 8, STEEL, 0, 1.02, 0, 0, 0, Math.PI / 2));
  G.push(cCyl(railR * 0.9, railR * 0.9, span, 8, STEEL, 0, 0.54, 0, 0, 0, Math.PI / 2));
  return merge(G);
}

/**
 * Chain-link bay. Origin at ground; run along +X.
 *
 * Six sides — vertex colour, never a window atlas:
 *   +Z / -Z  — mesh panel
 *   +X / -X  — terminal posts
 *   +Y top   — top rail
 *   -Y bottom — tension wire + post feet
 */
export function buildChainLinkRunGeo(opts = {}) {
  const span = opts.span ?? 2.44;
  const h = 1.7;
  const postR = 0.03;
  const nBay = Math.max(1, Math.round(span / 2.44));
  const step = span / nBay;
  const G = [];
  for (let i = 0; i <= nBay; i++) {
    const x = -span / 2 + i * step;
    G.push(cCyl(0.06, 0.065, 0.05, 8, STEEL2, x, 0.025, 0));
    G.push(cCyl(postR, postR, h, 8, STEEL, x, h / 2, 0));
    G.push(cCyl(0.012, 0.034, 0.07, 6, STEEL2, x, h + 0.02, 0));
  }
  G.push(cCyl(0.016, 0.016, span, 7, STEEL2, 0, h - 0.04, 0, 0, 0, Math.PI / 2));
  G.push(cCyl(0.01, 0.01, span, 6, STEEL2, 0, 0.1, 0, 0, 0, Math.PI / 2));
  const inset = postR + 0.01;
  for (let i = 0; i < nBay; i++) {
    const x0 = -span / 2 + i * step + inset;
    const x1 = -span / 2 + (i + 1) * step - inset;
    wireGrid(G, x0, x1, 0.12, h - 0.08, 0, MESH, 0.13);
  }
  return merge(G);
}

/**
 * Pipe swing gate. Origin at ground; leaf in the XZ plane, hinges on -X.
 *
 * Six sides — vertex colour, never a window atlas:
 *   +Z / -Z  — frame + mesh
 *   -X left  — hinge barrels
 *   +X right — latch
 *   +Y top   — frame header
 *   -Y bottom — bottom rail
 */
export function buildSwingGateGeo(opts = {}) {
  const w = opts.w ?? 1.4;
  const h = opts.h ?? 1.2;
  const r = 0.02;
  const hx = -w / 2;
  const x1 = w / 2;
  const G = [];
  G.push(cCyl(r, r, h, 8, GALV, hx, h / 2, 0));
  G.push(cCyl(r, r, h, 8, GALV, x1, h / 2, 0));
  G.push(cCyl(r, r, w, 8, STEEL, 0, h - r, 0, 0, 0, Math.PI / 2));
  G.push(cCyl(r, r, w, 8, STEEL, 0, r + 0.04, 0, 0, 0, Math.PI / 2));
  G.push(cCyl(r * 0.85, r * 0.85, w, 7, STEEL2, 0, h * 0.52, 0, 0, 0, Math.PI / 2));
  wireGrid(G, hx + 0.05, x1 - 0.05, 0.12, h - 0.08, 0, MESH, 0.15);
  for (const hy of [0.28, 0.92]) {
    G.push(cCyl(0.028, 0.028, 0.07, 8, RUST, hx - 0.03, hy, 0, Math.PI / 2));
    G.push(cCyl(0.012, 0.012, 0.1, 6, DARK, hx - 0.03, hy, 0, Math.PI / 2));
  }
  G.push(cBox(0.12, 0.04, 0.03, DARK, x1 + 0.04, h * 0.52, 0));
  G.push(cBox(0.03, 0.16, 0.03, STEEL2, x1 + 0.09, h * 0.52, 0));
  G.push(cCyl(0.014, 0.014, 0.22, 6, STEEL2, x1, 0.14, 0));
  return merge(G);
}
