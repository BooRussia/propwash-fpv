import * as THREE from 'three';
import { mulberry32 } from './rng.js';

// ---------- canvas textures (procedural fallbacks + deco windows) ----------
export function windowTexture(rng, lit = 0.55, warmBias = 0.7) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#0b1420';
  g.fillRect(0, 0, 128, 256);
  const cols = 6, rows = 18;
  const cw = 128 / cols, ch = 256 / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (rng() < lit) {
        g.fillStyle = rng() < warmBias
          ? `rgba(255, ${190 + (rng() * 40) | 0}, 120, ${0.75 + rng() * 0.25})`
          : `rgba(160, 210, 255, ${0.6 + rng() * 0.35})`;
      } else {
        g.fillStyle = 'rgba(30, 44, 60, 0.9)';
      }
      g.fillRect(i * cw + 2, j * ch + 2, cw - 4, ch - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Procedural blacktop with baked centre-line dashes (asphalt scan absent).
export function roadTexture() {
  const r = mulberry32(0x20AD);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#23262a'; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(255,255,255,${r() * 0.04})`;
    g.fillRect(r() * 256, r() * 128, 2, 2);
  }
  g.fillStyle = '#e8c545';
  for (let x = 0; x < 256; x += 42) g.fillRect(x, 61, 22, 5);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Deck planking with per-plank tone jitter, butt joints and grain streaks.
// Deterministic (own PRNG) — never touches the layout streams.
export function plankTexture(baseHex, seed = 7, w = 512, h = 512, planks = 16) {
  const r = mulberry32(seed);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const base = new THREE.Color(baseHex);
  const ph = h / planks;
  for (let i = 0; i < planks; i++) {
    const t = base.clone().offsetHSL((r() - 0.5) * 0.035, (r() - 0.5) * 0.14, (r() - 0.5) * 0.13);
    g.fillStyle = `#${t.getHexString()}`;
    g.fillRect(0, i * ph, w, ph);
    // lengthwise grain
    for (let k = 0; k < 26; k++) {
      const gy = i * ph + 2 + r() * (ph - 4);
      g.strokeStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`;
      g.lineWidth = 0.6 + r();
      g.beginPath();
      g.moveTo(r() * w * 0.4, gy);
      g.lineTo(r() * w * 0.4 + w * 0.45, gy + (r() - 0.5) * 2);
      g.stroke();
    }
    // butt joint across the plank
    const jx = (r() * w) | 0;
    g.fillStyle = 'rgba(0,0,0,0.32)';
    g.fillRect(jx, i * ph + 1, 2, ph - 2);
    // shadowed gap between boards
    g.fillStyle = 'rgba(0,0,0,0.42)';
    g.fillRect(0, i * ph, w, 2);
    g.fillStyle = 'rgba(255,255,255,0.07)';
    g.fillRect(0, i * ph + 2, w, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

// Mottled foliage sheet — stops clipped hedges reading as painted plastic.
export function foliageTexture() {
  const r = mulberry32(0x1EAF);
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#5f7d4a'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    const l = r();
    g.fillStyle = l < 0.42
      ? `rgba(28,46,22,${0.25 + r() * 0.5})`
      : l < 0.82 ? `rgba(96,128,64,${0.2 + r() * 0.45})`
        : `rgba(158,190,110,${0.15 + r() * 0.35})`;
    const s = 3 + r() * 8;
    g.beginPath();
    g.ellipse(r() * 128, r() * 128, s, s * (0.4 + r() * 0.5), r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Parking-lot asphalt with painted stalls — one tile = one 2-row bay.
export function parkingTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const r = mulberry32(0x9A5);
  g.fillStyle = '#6e7276'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    const v = r() < 0.5 ? 40 : 210;
    g.fillStyle = `rgba(${v},${v},${v},${r() * 0.10})`;
    g.fillRect(r() * 256, r() * 256, 2 + r() * 3, 2 + r() * 3);
  }
  // patched seams
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(50,52,55,${0.12 + r() * 0.14})`;
    g.fillRect(0, r() * 256, 256, 3 + r() * 7);
  }
  g.fillStyle = 'rgba(226,220,196,0.46)';
  for (let x = 8; x < 256; x += 30) {
    g.fillRect(x, 14, 3, 74);
    g.fillRect(x, 168, 3, 74);
  }
  g.fillRect(0, 86, 256, 3);
  g.fillRect(0, 165, 256, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

// Art-deco tower skin. The photographic facade scans are all blue-grey glass,
// which turns every pastel into mud; this pair is authored white-based so the
// per-tower pastel tints it, and the two canvases share ONE grid so the lit
// windows at night land exactly on the daylight openings.
//   albedo   — white stucco, eyebrow band under every floor, recessed windows
//   emissive — black wall, warm/cool lit panes (about half the cells)
export function decoFacadeTextures(cols = 4, rows = 4) {
  const S = 512;
  const cw = S / cols, ch = S / rows;
  const r = mulberry32(0xDEC0DE);
  const ca = document.createElement('canvas'); ca.width = ca.height = S;
  const ce = document.createElement('canvas'); ce.width = ce.height = S;
  const a = ca.getContext('2d');
  const e = ce.getContext('2d');
  a.fillStyle = '#ffffff'; a.fillRect(0, 0, S, S);
  e.fillStyle = '#000000'; e.fillRect(0, 0, S, S);
  // stucco mottle
  for (let i = 0; i < 1500; i++) {
    a.fillStyle = `rgba(${r() < 0.5 ? '208,204,196' : '255,255,255'},${0.05 + r() * 0.12})`;
    const s = 3 + r() * 12;
    a.beginPath();
    a.ellipse(r() * S, r() * S, s, s * (0.5 + r() * 0.6), r() * Math.PI, 0, Math.PI * 2);
    a.fill();
  }
  for (let row = 0; row < rows; row++) {
    const y0 = row * ch;
    // eyebrow shade + its cast shadow, the deco signature
    a.fillStyle = 'rgba(255,255,255,0.95)';
    a.fillRect(0, y0 + ch * 0.16, S, ch * 0.055);
    a.fillStyle = 'rgba(96,92,86,0.34)';
    a.fillRect(0, y0 + ch * 0.215, S, ch * 0.045);
    // floor-line reveal
    a.fillStyle = 'rgba(120,116,110,0.18)';
    a.fillRect(0, y0 + ch - 2, S, 2);
    for (let col = 0; col < cols; col++) {
      const x0 = col * cw;
      const wx = x0 + cw * 0.2, wy = y0 + ch * 0.28;
      const ww = cw * 0.6, wh = ch * 0.44;
      // recessed reveal, then the pane
      a.fillStyle = 'rgba(84,80,74,0.5)';
      a.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
      const g = a.createLinearGradient(wx, wy, wx, wy + wh);
      g.addColorStop(0, '#2b3742');
      g.addColorStop(1, '#4b5b66');
      a.fillStyle = g;
      a.fillRect(wx, wy, ww, wh);
      // mullion + transom
      a.fillStyle = 'rgba(240,238,232,0.85)';
      a.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
      a.fillRect(wx, wy + wh * 0.28, ww, 2.5);
      // sill
      a.fillStyle = 'rgba(255,255,255,0.9)';
      a.fillRect(wx - 3, wy + wh, ww + 6, ch * 0.045);
      // lit pane at night
      if (r() < 0.55) {
        e.fillStyle = r() < 0.72
          ? `rgba(255,${196 + (r() * 40) | 0},142,${0.7 + r() * 0.3})`
          : `rgba(178,214,255,${0.55 + r() * 0.35})`;
        e.fillRect(wx, wy, ww, wh);
      }
    }
  }
  const mk = (canvas, srgb) => {
    const t = new THREE.CanvasTexture(canvas);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };
  return { albedo: mk(ca, true), emissive: mk(ce, true) };
}

// Shared albedo + emissive CanvasTexture pair. Both canvases share ONE window
// grid so night lights land on daylight openings. Own mulberry32 seed — never
// a layout stream. Wall atlases only; callers map via facadeUV + stripBoxCaps.
//   seed, cols, rows, size=512, wall, paint(a, r, grid), cell(...) → pane rect
export function facadeCanvasPair(opts) {
  const {
    seed, cols, rows, size = 512, wall = '#ffffff', paint, cell,
    lit = 0.55, warmBias = 0.72,
  } = opts;
  const S = size;
  const cw = S / cols, ch = S / rows;
  const r = mulberry32(seed);
  const ca = document.createElement('canvas'); ca.width = ca.height = S;
  const ce = document.createElement('canvas'); ce.width = ce.height = S;
  const a = ca.getContext('2d');
  const e = ce.getContext('2d');
  a.fillStyle = wall; a.fillRect(0, 0, S, S);
  e.fillStyle = '#000000'; e.fillRect(0, 0, S, S);
  if (paint) paint(a, r, { S, cols, rows, cw, ch });
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = col * cw, y0 = row * ch;
      const pane = cell({ a, e, r, x0, y0, cw, ch, col, row, S });
      if (!pane) continue;
      if (r() < lit) {
        e.fillStyle = r() < warmBias
          ? `rgba(255,${196 + (r() * 40) | 0},142,${0.7 + r() * 0.3})`
          : `rgba(178,214,255,${0.55 + r() * 0.35})`;
        e.fillRect(pane.wx, pane.wy, pane.ww, pane.wh);
      }
    }
  }
  const mk = (canvas) => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };
  return { albedo: mk(ca), emissive: mk(ce) };
}

// Red/tan Miami Beach brick, punched windows, dark reveals, limestone sills.
// ~6 bays x 8 floors on a 512 canvas. Brick color lives in the albedo.
export function brickFacadeTextures(cols = 6, rows = 8) {
  return facadeCanvasPair({
    seed: 0xB81C4,
    cols, rows,
    wall: '#c47a5c',
    paint(a, r, { S }) {
      a.fillStyle = '#d9cfc0'; a.fillRect(0, 0, S, S);
      const bh = 8, bw = 16;
      const nRows = S / bh, nCols = S / bw;
      for (let j = 0; j < nRows; j++) {
        const off = (j % 2) ? bw / 2 : 0;
        for (let i = 0; i < nCols; i++) {
          const tan = r() < 0.22;
          const rr = tan ? 186 + (r() * 36) | 0 : 154 + (r() * 42) | 0;
          const gg = tan ? 128 + (r() * 32) | 0 : 72 + (r() * 38) | 0;
          const bb = tan ? 96 + (r() * 24) | 0 : 58 + (r() * 26) | 0;
          a.fillStyle = `rgb(${rr},${gg},${bb})`;
          const x = (i * bw + off) % S;
          const y = j * bh;
          const w = bw - 2, h = bh - 2;
          if (x + w <= S) a.fillRect(x + 1, y + 1, w, h);
          else {
            a.fillRect(x + 1, y + 1, S - x - 1, h);
            a.fillRect(0, y + 1, w - (S - x - 1), h);
          }
        }
      }
      for (let i = 0; i < 400; i++) {
        a.fillStyle = `rgba(40,28,22,${r() * 0.06})`;
        a.fillRect(r() * S, r() * S, 2 + r() * 6, 1 + r() * 3);
      }
    },
    cell({ a, x0, y0, cw, ch }) {
      const wx = x0 + cw * 0.18, wy = y0 + ch * 0.22;
      const ww = cw * 0.64, wh = ch * 0.52;
      a.fillStyle = '#8a4a38';
      a.fillRect(wx - 4, wy - 6, ww + 8, 5);
      a.fillStyle = 'rgba(28,22,18,0.72)';
      a.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
      const g = a.createLinearGradient(wx, wy, wx, wy + wh);
      g.addColorStop(0, '#1e2830');
      g.addColorStop(1, '#3a4a54');
      a.fillStyle = g;
      a.fillRect(wx, wy, ww, wh);
      a.fillStyle = 'rgba(32,30,28,0.85)';
      a.fillRect(wx + ww / 2 - 1, wy, 2, wh);
      a.fillRect(wx, wy + wh * 0.45, ww, 2);
      a.fillStyle = '#e6e0d2';
      a.fillRect(wx - 4, wy + wh, ww + 8, ch * 0.08);
      a.fillStyle = 'rgba(255,255,255,0.35)';
      a.fillRect(wx - 4, wy + wh, ww + 8, 1.5);
      a.fillStyle = 'rgba(90,82,70,0.28)';
      a.fillRect(wx - 4, wy + wh + ch * 0.07, ww + 8, 1.5);
      return { wx, wy, ww, wh };
    },
  });
}

// Warm cream stucco condo. Sliding-glass balcony doors (no deco eyebrow).
// White-based albedo so a per-tower pastel can tint it.
export function stuccoCondoTextures(cols = 4, rows = 6) {
  return facadeCanvasPair({
    seed: 0x57CC0,
    cols, rows,
    wall: '#ffffff',
    paint(a, r, { S }) {
      for (let i = 0; i < 1500; i++) {
        a.fillStyle = `rgba(${r() < 0.5 ? '232,220,204' : '255,255,255'},${0.05 + r() * 0.12})`;
        const s = 3 + r() * 12;
        a.beginPath();
        a.ellipse(r() * S, r() * S, s, s * (0.5 + r() * 0.6), r() * Math.PI, 0, Math.PI * 2);
        a.fill();
      }
    },
    cell({ a, x0, y0, cw, ch }) {
      a.fillStyle = 'rgba(120,114,106,0.22)';
      a.fillRect(x0, y0 + ch - 3, cw, 3);
      const wx = x0 + cw * 0.08, wy = y0 + ch * 0.12;
      const ww = cw * 0.84, wh = ch * 0.72;
      a.fillStyle = 'rgba(210,206,198,0.95)';
      a.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
      const g = a.createLinearGradient(wx, wy, wx + ww, wy + wh);
      g.addColorStop(0, '#6a8a96');
      g.addColorStop(0.45, '#8aadb8');
      g.addColorStop(1, '#5c7c88');
      a.fillStyle = g;
      a.fillRect(wx, wy, ww, wh);
      a.fillStyle = 'rgba(236,232,224,0.92)';
      a.fillRect(wx + ww * 0.5 - 2, wy, 4, wh);
      a.fillStyle = 'rgba(80,84,88,0.55)';
      a.fillRect(wx + ww * 0.5 + 6, wy + wh * 0.48, 3, 8);
      a.fillStyle = 'rgba(228,224,216,0.9)';
      a.fillRect(x0 + cw * 0.04, wy + wh, cw * 0.92, ch * 0.06);
      a.fillStyle = 'rgba(90,86,80,0.28)';
      a.fillRect(x0 + cw * 0.04, wy + wh + ch * 0.055, cw * 0.92, 2);
      a.fillStyle = 'rgba(40,48,52,0.45)';
      a.fillRect(x0 + cw * 0.05, wy + wh - ch * 0.02, cw * 0.9, 2);
      for (let k = 0; k < 5; k++) {
        a.fillRect(x0 + cw * (0.12 + k * 0.18), wy + wh - ch * 0.12, 1.5, ch * 0.1);
      }
      return { wx, wy, ww, wh };
    },
  });
}

// Teal/green curtain wall with horizontal spandrels — not the blue-grey glass
// photo. Vision panes and night lights share the same grid.
export function tealGlassTextures(cols = 8, rows = 10) {
  return facadeCanvasPair({
    seed: 0x7EA155,
    cols, rows,
    wall: '#1a3c40',
    paint(a, r, { S, cols: nCols, rows: nRows, cw, ch }) {
      for (let row = 0; row < nRows; row++) {
        const y0 = row * ch;
        a.fillStyle = '#24383c';
        a.fillRect(0, y0, S, ch * 0.22);
        a.fillStyle = 'rgba(18,40,42,0.55)';
        a.fillRect(0, y0 + ch * 0.18, S, 2);
        a.fillStyle = `rgba(120,180,170,${0.08 + r() * 0.06})`;
        a.fillRect(0, y0, S, 1);
      }
      for (let col = 0; col < nCols; col++) {
        a.fillStyle = 'rgba(12,28,30,0.65)';
        a.fillRect(col * cw, 0, 3, S);
        a.fillStyle = 'rgba(160,190,186,0.18)';
        a.fillRect(col * cw + 3, 0, 1, S);
      }
    },
    cell({ a, r, x0, y0, cw, ch }) {
      const wx = x0 + 4, wy = y0 + ch * 0.24;
      const ww = cw - 7, wh = ch * 0.72;
      const g = a.createLinearGradient(wx, wy, wx + ww, wy + wh);
      g.addColorStop(0, '#2d6e72');
      g.addColorStop(0.4, '#4aa090');
      g.addColorStop(1, '#1e5558');
      a.fillStyle = g;
      a.fillRect(wx, wy, ww, wh);
      a.fillStyle = `rgba(180,230,220,${0.08 + r() * 0.1})`;
      a.fillRect(wx + ww * 0.15, wy, ww * 0.18, wh);
      return { wx, wy, ww, wh };
    },
  });
}

// Coral/salmon punched-window hotel. White-based so a material color tints it.
export function coralCondoTextures(cols = 5, rows = 6) {
  return facadeCanvasPair({
    seed: 0xC0A1A,
    cols, rows,
    wall: '#ffffff',
    paint(a, r, { S }) {
      for (let i = 0; i < 1600; i++) {
        a.fillStyle = r() < 0.55
          ? `rgba(255,214,200,${0.06 + r() * 0.12})`
          : `rgba(255,255,255,${0.05 + r() * 0.14})`;
        const s = 3 + r() * 11;
        a.beginPath();
        a.ellipse(r() * S, r() * S, s, s * (0.5 + r() * 0.6), r() * Math.PI, 0, Math.PI * 2);
        a.fill();
      }
    },
    cell({ a, x0, y0, cw, ch }) {
      a.fillStyle = 'rgba(200,160,150,0.16)';
      a.fillRect(x0, y0 + ch - 2, cw, 2);
      const wx = x0 + cw * 0.22, wy = y0 + ch * 0.24;
      const ww = cw * 0.56, wh = ch * 0.48;
      a.fillStyle = 'rgba(90,70,64,0.45)';
      a.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
      const g = a.createLinearGradient(wx, wy, wx, wy + wh);
      g.addColorStop(0, '#3a4248');
      g.addColorStop(1, '#5a6870');
      a.fillStyle = g;
      a.fillRect(wx, wy, ww, wh);
      a.fillStyle = 'rgba(255,244,238,0.85)';
      a.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
      a.fillStyle = 'rgba(255,248,242,0.92)';
      a.fillRect(wx - 4, wy + wh, ww + 8, ch * 0.05);
      return { wx, wy, ww, wh };
    },
  });
}

// Weathered stucco — the art-deco hotel skin. Pastel is applied per-vertex,
// this sheet only supplies the tonal break-up and the trowel texture.
export function stuccoTexture() {
  const r = mulberry32(0xDEC0);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const v = r();
    g.fillStyle = v < 0.5
      ? `rgba(196,190,178,${0.05 + r() * 0.14})`
      : `rgba(255,255,255,${0.05 + r() * 0.16})`;
    const s = 2 + r() * 9;
    g.beginPath();
    g.ellipse(r() * 256, r() * 256, s, s * (0.5 + r() * 0.6), r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  // faint horizontal rain-streaking under the eyebrow lines
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(150,146,138,${0.03 + r() * 0.05})`;
    g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 20 + r() * 60);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** Roof albedo — tile / TPO membrane / standing-seam metal. Never windows. */
export function roofTexture(kind = 'tpo', seed = 1) {
  const r = mulberry32(0x400f0000 + (seed | 0) + (kind === 'tile' ? 17 : kind === 'metal' ? 41 : 3));
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  if (kind === 'tile') {
    g.fillStyle = '#8a3d32'; g.fillRect(0, 0, 128, 128);
    const rows = 10, cols = 8;
    for (let j = 0; j < rows; j++) {
      for (let i = -1; i < cols; i++) {
        const x = (i + (j % 2) * 0.5) * (128 / cols);
        const y = j * (128 / rows);
        g.fillStyle = `rgb(${130 + (r() * 40) | 0},${50 + (r() * 28) | 0},${40 + (r() * 22) | 0})`;
        g.fillRect(x + 1, y + 1, 128 / cols - 2, 128 / rows - 2);
      }
    }
  } else if (kind === 'metal') {
    g.fillStyle = '#7d868e'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 8; i++) {
      const x = i * 16;
      g.fillStyle = `rgba(255,255,255,${0.06 + r() * 0.05})`;
      g.fillRect(x, 0, 12, 128);
      g.fillStyle = 'rgba(20,24,28,0.28)';
      g.fillRect(x + 12, 0, 2, 128);
    }
  } else {
    g.fillStyle = '#c8c2b4'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 200; i++) {
      g.fillStyle = `rgba(0,0,0,${r() * 0.04})`;
      g.fillRect(r() * 128, r() * 128, 2, 2);
    }
    g.fillStyle = 'rgba(90,88,80,0.22)';
    for (let i = 0; i < 4; i++) g.fillRect(i * 32, 0, 1, 128);
    for (let j = 0; j < 4; j++) g.fillRect(0, j * 32, 128, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// aoMap UVs: three r180 samples aoMap through texture.channel (default 0 → 'uv'),
// but we alias uv1/uv2 too so any channel choice — and older code paths — resolve.
export function setAoUVs(geo) {
  if (!geo.attributes.uv) return;
  geo.setAttribute('uv1', geo.attributes.uv);
  geo.setAttribute('uv2', geo.attributes.uv);
}
