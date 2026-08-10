// ============================================================
// PropWash FPV — FPV video static / interference overlay
// Fullscreen 2D canvas at HALF device resolution, CSS-scaled to
// 100% with image-rendering: pixelated for that chunky video
// feel. Two modes:
//   "analog"  — white-noise snow, rolling tear bands, scanlines,
//               line-displacement jitter + red/cyan color fringe
//               at high intensity.
//   "digital" — HD breakup: macroblock corruption grid (frozen
//               gray/green blocks, pixelated color rects,
//               horizontal smears), full-frame stutter, and a
//               desaturation veil as intensity rises.
// Effect ticks internally at 30fps. No per-frame allocations:
// noise tiles, palettes, bands and grid arrays are all built
// once up front.
// ============================================================
import { clamp } from '../core/state.js';

const STEP = 1 / 30;         // internal effect tick
const TILE_W = 160;
const TILE_H = 90;
const N_TILES = 5;           // grayscale snow tiles
const COLS = 24;             // digital macroblock grid
const ROWS = 14;

// Digital-mode palettes (precomputed strings — never built per frame)
const FROZEN_COLORS = ['#565d56', '#49544b', '#616a5f', '#3c463f', '#6d766d', '#525a52'];
const BLOCK_COLORS = ['#b9c4ba', '#8fd08f', '#dfe5df', '#6fa477', '#c9c9c9', '#a4b4a6', '#2e352f', '#e8f5e8'];
const SMEAR_COLORS = ['#9aa39b', '#c2c9c2', '#788078', '#d5dad5'];

const TYPE_FROZEN = 0;
const TYPE_BLOCKS = 1;
const TYPE_SMEAR = 2;

export class StaticFX {
  constructor(containerEl) {
    this.container = containerEl || document.body;
    this.enabled = false;
    this.mode = 'analog';
    this.intensity = 0;
    this._accum = 0;
    this._stutter = 0;

    // fullscreen half-res canvas
    this.canvas = document.createElement('canvas');
    const st = this.canvas.style;
    st.position = 'absolute';
    st.inset = '0';
    st.width = '100%';
    st.height = '100%';
    st.display = 'none';
    st.pointerEvents = 'none';
    st.imageRendering = 'pixelated';
    this.container.appendChild(this.canvas);

    this.ctx = null;
    try {
      this.ctx = this.canvas.getContext('2d', { alpha: true });
    } catch (e) {
      console.warn('[StaticFX] 2D context unavailable', e);
    }

    // analog assets (built once)
    this._tiles = [];
    this._tileRed = null;
    this._tileCyan = null;
    this._scan = null;
    if (this.ctx) {
      for (let i = 0; i < N_TILES; i++) this._tiles.push(this._makeNoiseTile(0));
      this._tileRed = this._makeNoiseTile(1);
      this._tileCyan = this._makeNoiseTile(2);
    }

    // rolling tear bands (mutated in place, never reallocated)
    this._bands = [
      { y: Math.random(), speed: 0.12 + Math.random() * 0.20, h: 8 + Math.random() * 10 },
      { y: Math.random(), speed: -(0.08 + Math.random() * 0.15), h: 6 + Math.random() * 8 },
    ];

    // digital macroblock grid state
    this._cellT = new Float32Array(COLS * ROWS);    // seconds remaining
    this._cellType = new Uint8Array(COLS * ROWS);
    this._cellSeed = new Uint16Array(COLS * ROWS);
    this._cellW = 1;
    this._cellH = 1;

    this.resize();
  }

  // ---------------- public API ----------------
  setEnabled(enabled) {
    const v = !!enabled;
    if (this.enabled === v) return;
    this.enabled = v;
    this.canvas.style.display = v ? 'block' : 'none';
    if (v) {
      this._accum = STEP; // force a draw on the very next update()
    } else {
      this._stutter = 0;
      if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  setMode(mode) {
    const m = mode === 'digital' ? 'digital' : 'analog';
    if (this.mode === m) return;
    this.mode = m;
    this._stutter = 0;
    this._cellT.fill(0);
    if (this.ctx && this.enabled) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setIntensity(v) {
    const n = typeof v === 'number' && isFinite(v) ? v : 0;
    this.intensity = clamp(n, 0, 1);
  }

  update(dt) {
    if (!this.enabled || !this.ctx) return;
    this._accum += Math.min(typeof dt === 'number' && isFinite(dt) ? dt : 0, 0.25);
    if (this._accum < STEP) return;
    const elapsed = Math.min(this._accum, 0.1); // cap so tab-switch doesn't warp bands
    this._accum = 0;
    if (this.mode === 'digital') this._drawDigital(elapsed);
    else this._drawAnalog(elapsed);
  }

  resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round((window.innerWidth || 1) * dpr * 0.5));
    const h = Math.max(1, Math.round((window.innerHeight || 1) * dpr * 0.5));
    if (this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this._cellW = w / COLS;
    this._cellH = h / ROWS;
    if (this.ctx) {
      this._buildScanlines(w, h);
      this.ctx.clearRect(0, 0, w, h);
    }
  }

  // ---------------- asset construction (init-time only) ----------------
  _makeNoiseTile(channelMode) {
    // channelMode: 0 = grayscale, 1 = red only, 2 = cyan (g+b)
    const c = document.createElement('canvas');
    c.width = TILE_W;
    c.height = TILE_H;
    try {
      const cx = c.getContext('2d');
      if (!cx) return c;
      const img = cx.createImageData(TILE_W, TILE_H);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = Math.random();
        const v = (r < 0.55 ? r * 200 : 120 + Math.random() * 135) | 0;
        if (channelMode === 0) {
          d[i] = d[i + 1] = d[i + 2] = v;
        } else if (channelMode === 1) {
          d[i] = v; d[i + 1] = 0; d[i + 2] = 0;
        } else {
          d[i] = 0; d[i + 1] = v; d[i + 2] = v;
        }
        d[i + 3] = 255;
      }
      cx.putImageData(img, 0, 0);
    } catch (e) { /* blank tile is a safe fallback */ }
    return c;
  }

  _buildScanlines(w, h) {
    if (!this._scan) this._scan = document.createElement('canvas');
    this._scan.width = w;
    this._scan.height = h;
    try {
      const cx = this._scan.getContext('2d');
      if (!cx) return;
      cx.fillStyle = 'rgba(0,0,0,0.55)';
      for (let y = 0; y < h; y += 3) cx.fillRect(0, y, w, 1);
    } catch (e) { /* no scanlines is a safe fallback */ }
  }

  // ---------------- analog mode ----------------
  _drawAnalog(elapsed) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const k = this.intensity;

    ctx.clearRect(0, 0, w, h);
    if (this._tiles.length === 0) return;

    // --- white-noise snow: two random tiles at random offsets, scaled up ---
    const snowAlpha = Math.min(1, 0.06 + 0.92 * k * k); // ~full snow at 1.0
    let tile = this._tiles[(Math.random() * this._tiles.length) | 0];
    ctx.globalAlpha = snowAlpha;
    ctx.drawImage(tile,
      -((Math.random() * 48) | 0), -((Math.random() * 28) | 0),
      w + 56, h + 36);
    tile = this._tiles[(Math.random() * this._tiles.length) | 0];
    ctx.globalAlpha = snowAlpha * 0.55;
    ctx.drawImage(tile,
      -((Math.random() * 64) | 0), -((Math.random() * 36) | 0),
      w + 80, h + 48);

    // --- color fringe: red/cyan noise offsets (additive) at high intensity ---
    if (k > 0.6 && this._tileRed && this._tileCyan) {
      const f = (k - 0.6) / 0.4;
      const shift = (2 + f * 6) | 0;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.22 * f;
      ctx.drawImage(this._tileRed,
        -shift - ((Math.random() * 30) | 0), -((Math.random() * 20) | 0),
        w + 60, h + 40);
      ctx.drawImage(this._tileCyan,
        shift - ((Math.random() * 30) | 0), -((Math.random() * 20) | 0),
        w + 60, h + 40);
      ctx.globalCompositeOperation = 'source-over';
    }

    // --- rolling tear bands (bright distorted strips drifting vertically) ---
    const hScale = h / 540; // band pixel heights tuned against 540p half-res
    const nBands = k > 0.35 ? 2 : 1;
    for (let i = 0; i < nBands; i++) {
      const b = this._bands[i];
      b.y += b.speed * elapsed;
      if (b.y > 1.15) b.y = -0.15;
      else if (b.y < -0.15) b.y = 1.15;
      const py = (b.y * h) | 0;
      const bh = Math.max(2, (b.h * hScale) | 0);
      tile = this._tiles[(Math.random() * this._tiles.length) | 0];
      ctx.globalAlpha = 0.30 + 0.45 * k;
      const dx = ((Math.random() * 2 - 1) * w * 0.03) | 0;
      ctx.drawImage(tile,
        0, (Math.random() * (TILE_H - 8)) | 0, TILE_W, 8,
        dx, py, w + ((Math.random() * 80) | 0), bh);
      ctx.globalAlpha = 0.18 + 0.30 * k;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, py, w, Math.max(1, (bh * 0.18) | 0));
    }

    // --- faint scanlines ---
    if (this._scan) {
      ctx.globalAlpha = 0.10 + 0.18 * k;
      ctx.drawImage(this._scan, 0, 0);
    }

    // --- horizontal line-displacement jitter at high intensity ---
    if (k > 0.6) {
      const f = (k - 0.6) / 0.4;
      ctx.globalAlpha = 1;
      const rows = 2 + ((f * 5) | 0);
      for (let i = 0; i < rows; i++) {
        let yy = (Math.random() * h) | 0;
        let hh = 2 + ((Math.random() * 6) | 0);
        if (yy + hh > h) hh = h - yy;
        if (hh <= 0) continue;
        const dx = ((Math.random() * 2 - 1) * 0.08 * w * f) | 0;
        if (dx !== 0) ctx.drawImage(this.canvas, 0, yy, w, hh, dx, yy, w, hh);
      }
    }

    ctx.globalAlpha = 1;
  }

  // ---------------- digital mode ----------------
  _drawDigital(elapsed) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const k = this.intensity;

    // full-frame stutter: hold the previous frame(s) untouched
    if (this._stutter > 0) {
      this._stutter--;
      return;
    }
    if (k > 0.7 && Math.random() < (k - 0.7) * 0.5) {
      this._stutter = 2 + ((Math.random() * 3) | 0);
    }

    ctx.clearRect(0, 0, w, h);

    // spawn corruption clusters — probability and count scale with intensity
    const attempts = 1 + ((k * 5) | 0);
    const p = 0.10 + 0.85 * k;
    for (let a = 0; a < attempts; a++) {
      if (Math.random() < p) this._spawnCluster(k);
    }

    // decay + draw corrupted cells
    const cw = this._cellW;
    const ch = this._cellH;
    const cellT = this._cellT;
    const cellType = this._cellType;
    const cellSeed = this._cellSeed;
    for (let y = 0; y < ROWS; y++) {
      const py = y * ch;
      for (let x = 0; x < COLS; x++) {
        const i = y * COLS + x;
        let tm = cellT[i];
        if (tm <= 0) continue;
        tm -= elapsed;
        cellT[i] = tm > 0 ? tm : 0;
        const px = x * cw;
        const seed = cellSeed[i];
        const type = cellType[i];
        if (type === TYPE_FROZEN) {
          ctx.globalAlpha = 0.88;
          ctx.fillStyle = FROZEN_COLORS[seed % FROZEN_COLORS.length];
          ctx.fillRect(px, py, cw + 1, ch + 1);
        } else if (type === TYPE_BLOCKS) {
          ctx.globalAlpha = 0.92;
          const sw = cw / 4;
          const sh = ch / 2;
          for (let sy = 0; sy < 2; sy++) {
            for (let sx = 0; sx < 4; sx++) {
              ctx.fillStyle = BLOCK_COLORS[(seed * 31 + sy * 7 + sx * 13) % BLOCK_COLORS.length];
              ctx.fillRect(px + sx * sw, py + sy * sh, sw + 1, sh + 1);
            }
          }
        } else {
          // horizontal smear strips, extending past the cell
          const sh = ch / 3;
          for (let s = 0; s < 3; s++) {
            ctx.globalAlpha = 0.40 + 0.20 * (((seed >> (s * 2)) & 3) / 3);
            ctx.fillStyle = SMEAR_COLORS[(seed + s) % SMEAR_COLORS.length];
            ctx.fillRect(px, py + s * sh, cw * 1.7, sh - 0.5);
          }
        }
      }
    }

    // subtle desaturation veil as intensity rises
    ctx.globalAlpha = 0.22 * k;
    ctx.fillStyle = '#7a817c';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  _spawnCluster(k) {
    const cx = (Math.random() * COLS) | 0;
    const cy = (Math.random() * ROWS) | 0;
    const cw = 1 + ((Math.random() * (2 + k * 4)) | 0);
    const ch = 1 + ((Math.random() * (1 + k * 2)) | 0);
    // bias toward frozen blocks as intensity climbs → "mostly frozen" at 1.0
    const type = Math.random() < 0.30 + 0.50 * k
      ? TYPE_FROZEN
      : (Math.random() < 0.5 ? TYPE_BLOCKS : TYPE_SMEAR);
    let dur = 0.1 + Math.random() * 0.3; // 100–400ms
    if (k > 0.8) dur *= 1 + (k - 0.8) * 6; // linger longer near max intensity
    const xEnd = Math.min(COLS, cx + cw);
    const yEnd = Math.min(ROWS, cy + ch);
    for (let y = cy; y < yEnd; y++) {
      for (let x = cx; x < xEnd; x++) {
        const i = y * COLS + x;
        this._cellT[i] = dur;
        this._cellType[i] = type;
        this._cellSeed[i] = (Math.random() * 65535) | 0;
      }
    }
  }
}
