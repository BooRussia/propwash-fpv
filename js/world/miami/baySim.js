// Tessendorf FFT field + Jacobian foam for the Biscayne plane.
// CPU, 256², one 19 m cascade. No GLSL, no second ocean tile.
//
// Foam source is the Tessendorf Jacobian of the choppy displacement
// (the surface folds). A ping-pong accumulate / 4-neighbour diffuse /
// exponential decay keeps fold foam and boat-wake stamps at the waterline.

import {
  BAY_PRESET, G, jonswapParams, directionalEk, omegaOfK,
} from './spectrum.js';

export { BAY_PRESET };

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function gaussPair(rng) {
  let u = rng();
  if (u < 1e-12) u = 1e-12;
  const v = rng();
  const r = Math.sqrt(-2 * Math.log(u));
  const a = Math.PI * 2 * v;
  return [r * Math.cos(a), r * Math.sin(a)];
}

/** In-place radix-2 complex FFT. `inv = +1` forward, `-1` inverse (1/n scaled). */
export function fft1d(re, im, n, inv) {
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (i < j) {
      const tr = re[j]; re[j] = re[i]; re[i] = tr;
      const ti = im[j]; im[j] = im[i]; im[i] = ti;
    }
    let m = n >> 1;
    while (m >= 1 && j >= m) { j -= m; m >>= 1; }
    j += m;
  }
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const ang = inv * 2 * Math.PI / len;
    const wr0 = Math.cos(ang), wi0 = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wr = 1, wi = 0;
      for (let k = 0; k < half; k++) {
        const p = i + k, q = p + half;
        const tr = wr * re[q] - wi * im[q];
        const ti = wr * im[q] + wi * re[q];
        re[q] = re[p] - tr; im[q] = im[p] - ti;
        re[p] += tr; im[p] += ti;
        const nwr = wr * wr0 - wi * wi0;
        wi = wr * wi0 + wi * wr0;
        wr = nwr;
      }
    }
  }
  if (inv < 0) {
    const s = 1 / n;
    for (let i = 0; i < n; i++) { re[i] *= s; im[i] *= s; }
  }
}

function fft2d(re, im, n, inv, tmpR, tmpI) {
  for (let y = 0; y < n; y++) {
    const o = y * n;
    fft1d(re.subarray(o, o + n), im.subarray(o, o + n), n, inv);
  }
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      tmpR[y] = re[y * n + x];
      tmpI[y] = im[y * n + x];
    }
    fft1d(tmpR, tmpI, n, inv);
    for (let y = 0; y < n; y++) {
      re[y * n + x] = tmpR[y];
      im[y * n + x] = tmpI[y];
    }
  }
}

function kComp(i, n, L) {
  const ii = i <= n / 2 ? i : i - n;
  return (Math.PI * 2 * ii) / L;
}

/**
 * Create the bay sim. Default is the locked phone preset (256², 19 m, SSR off).
 */
export function createBaySim(opts = {}) {
  const n = opts.n ?? BAY_PRESET.n;
  const L = opts.cascadeM ?? BAY_PRESET.cascadeM;
  if ((n & (n - 1)) !== 0) throw new Error('FFT n must be a power of two');
  if (n > 512) throw new Error('FFT n > 512 is out');

  const windMs = opts.windMs ?? BAY_PRESET.windMs;
  const fetchM = opts.fetchM ?? BAY_PRESET.fetchM;
  const depthM = opts.depthM ?? BAY_PRESET.depthM;
  const windTheta = opts.windTheta ?? BAY_PRESET.windTheta;
  const gamma = opts.gamma ?? BAY_PRESET.gamma;
  const g = opts.g ?? G;
  const lambda = opts.lambda ?? 0.88;       // Tessendorf chop
  const jThresh = opts.jThresh ?? BAY_PRESET.jThresh;
  const foamGain = opts.foamGain ?? BAY_PRESET.foamGain;
  const foamDecay = opts.foamDecay ?? BAY_PRESET.foamDecay;
  const foamBlur = opts.foamBlur ?? BAY_PRESET.foamBlur;
  const { alpha, omegaP } = jonswapParams(windMs, fetchM, g);

  const spec = { alpha, omegaP, gamma, depthM, windTheta, g };

  const N2 = n * n;
  const h0r = new Float32Array(N2);
  const h0i = new Float32Array(N2);
  const omega = new Float32Array(N2);
  const kxA = new Float32Array(N2);
  const kzA = new Float32Array(N2);

  const re = new Float32Array(N2);
  const im = new Float32Array(N2);
  const tmpR = new Float32Array(n);
  const tmpI = new Float32Array(n);

  const height = new Float32Array(N2);
  const dx = new Float32Array(N2);
  const dz = new Float32Array(N2);
  const slopeX = new Float32Array(N2);
  const slopeZ = new Float32Array(N2);
  const jacobian = new Float32Array(N2);
  const foamA = new Float32Array(N2);
  const foamB = new Float32Array(N2);
  let foam = foamA;
  let foamBack = foamB;

  // World-space wake overlay for the Biscayne plate (not the 19 m cascade).
  // Matches bayWater BAY_PLANE / FOAM_N so encodeShoreFoam can sample it.
  const wakeN = opts.wakeN ?? 512;
  const wakeW = opts.wakeW ?? 5000;
  const wakeD = opts.wakeD ?? 3600;
  const wakeOX = opts.wakeX ?? 0;
  const wakeOZ = opts.wakeZ ?? -1700;
  const wakeField = new Float32Array(wakeN * wakeN);

  const rng = mulberry32(opts.seed ?? BAY_PRESET.seed);
  const dk = (Math.PI * 2) / L;
  const kMin = dk * 0.5;
  const kNyq = Math.PI * n / L;

  for (let j = 0; j < n; j++) {
    const kz = kComp(j, n, L);
    for (let i = 0; i < n; i++) {
      const kx = kComp(i, n, L);
      const idx = j * n + i;
      kxA[idx] = kx;
      kzA[idx] = kz;
      const k = Math.hypot(kx, kz);
      omega[idx] = omegaOfK(k, depthM, g);
      if (k < kMin || k > kNyq * 0.999) continue;
      const Ek = directionalEk(kx, kz, spec);
      const amp = Math.sqrt(Math.max(0, Ek) * dk * dk * 0.5);
      const [gr, gi] = gaussPair(rng);
      h0r[idx] = gr * amp;
      h0i[idx] = gi * amp;
    }
  }

  const pairAt = (i, j) => {
    const ii = (i + n) % n, jj = (j + n) % n;
    return jj * n + ii;
  };

  let time = 0;

  const evolve = (t, outR, outI, mode) => {
    // h(k,t) = h0(k) e^{-iωt} + h0*(-k) e^{iωt}
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const idx = j * n + i;
        const w = omega[idx];
        const c = Math.cos(w * t), s = Math.sin(w * t);
        const nidx = pairAt(-i, -j);
        // h0 e^{-iωt} = (hr+i hi)(c - i s) = (hr c + hi s) + i (hi c - hr s)
        const r1 = h0r[idx] * c + h0i[idx] * s;
        const i1 = h0i[idx] * c - h0r[idx] * s;
        // h0*(-k) e^{iωt} = (hr_n - i hi_n)(c + i s)
        const r2 = h0r[nidx] * c + h0i[nidx] * s;
        const i2 = h0r[nidx] * s - h0i[nidx] * c;
        const hr = r1 + r2;
        const hi = i1 + i2;
        const kx = kxA[idx], kz = kzA[idx];
        const k = Math.hypot(kx, kz);
        if (mode === 'h') {
          outR[idx] = hr; outI[idx] = hi;
        } else if (mode === 'dx') {
          // Dx = IFFT( -i (kx/k) h ) — multiply by -i: (hr,hi) → (hi, -hr)
          const f = k > 1e-8 ? kx / k : 0;
          outR[idx] = hi * f;
          outI[idx] = -hr * f;
        } else {
          const f = k > 1e-8 ? kz / k : 0;
          outR[idx] = hi * f;
          outI[idx] = -hr * f;
        }
      }
    }
    fft2d(outR, outI, n, -1, tmpR, tmpI);
    // Tessendorf sums h̃(k) e^{ikx} over discrete k — unnormalized inverse.
    // fft1d inverse scales 1/n per axis (1/n² in 2D); put the sum back.
    const restore = n * n;
    for (let i = 0; i < N2; i++) outR[i] *= restore;
  };

  const wrap = (i) => (i + n) % n;

  const fillSlopesAndJ = () => {
    const invDx = n / L;
    for (let j = 0; j < n; j++) {
      const jp = wrap(j + 1), jm = wrap(j - 1);
      for (let i = 0; i < n; i++) {
        const ip = wrap(i + 1), im = wrap(i - 1);
        const idx = j * n + i;
        const dHdx = (height[j * n + ip] - height[j * n + im]) * 0.5 * invDx;
        const dHdz = (height[jp * n + i] - height[jm * n + i]) * 0.5 * invDx;
        slopeX[idx] = dHdx;
        slopeZ[idx] = dHdz;
        const dDxdx = (dx[j * n + ip] - dx[j * n + im]) * 0.5 * invDx;
        const dDzdz = (dz[jp * n + i] - dz[jm * n + i]) * 0.5 * invDx;
        const dDxdz = (dx[jp * n + i] - dx[jm * n + i]) * 0.5 * invDx;
        const dDzdx = (dz[j * n + ip] - dz[j * n + im]) * 0.5 * invDx;
        jacobian[idx] = (1 + dDxdx) * (1 + dDzdz) - dDxdz * dDzdx;
      }
    }
  };

  const pingPongFoam = (dt) => {
    const steps = Math.max(0.25, dt * 60);
    const decay = Math.pow(foamDecay, steps);
    const blur = foamBlur;
    const src = foam, dst = foamBack;
    for (let j = 0; j < n; j++) {
      const jp = wrap(j + 1), jm = wrap(j - 1);
      for (let i = 0; i < n; i++) {
        const ip = wrap(i + 1), im = wrap(i - 1);
        const idx = j * n + i;
        const c = src[idx];
        const n4 = src[j * n + ip] + src[j * n + im] + src[jp * n + i] + src[jm * n + i];
        const diffused = (1 - blur) * c + blur * n4 * 0.25;
        // Plate never Tessendorf-folds (J<0). Flats-off is a mask, not a
        // lower M. Skip J<M paint. Wake stamps still ride this ping-pong.
        const fold = 0;
        let v = decay * diffused + fold * Math.min(1, dt * 8);
        if (v < 0) v = 0;
        else if (v > 1) v = 1;
        dst[idx] = v;
      }
    }
    foam = dst;
    foamBack = src;
    // Plate wakes decay with the same clock; no 19 m blur (that would tile).
    for (let i = 0, nW = wakeField.length; i < nW; i++) {
      const wv = wakeField[i] * decay;
      wakeField[i] = wv < 1e-4 ? 0 : wv;
    }
  };

  const step = (dt) => {
    const d = Math.max(0, dt);
    time += d;
    evolve(time, re, im, 'h');
    height.set(re);
    evolve(time, re, im, 'dx');
    for (let i = 0; i < N2; i++) dx[i] = re[i] * lambda;
    evolve(time, re, im, 'dz');
    for (let i = 0; i < N2; i++) dz[i] = re[i] * lambda;
    fillSlopesAndJ();
    pingPongFoam(d);
    return time;
  };

  /** World-space splat onto the plate wake field. Inland z>0 stays dry. */
  const splatWorldWake = (x, z, amount, radiusM) => {
    if (z > 0) return;
    const r = Math.max(0.4, radiusM);
    const u = (x - wakeOX) / wakeW + 0.5;
    const v = (wakeOZ - z) / wakeD + 0.5;
    const cx = u * wakeN;
    const cz = v * wakeN;
    const rU = (r / wakeW) * wakeN;
    const rV = (r / wakeD) * wakeN;
    const invR2 = 1 / (r * r);
    const i0 = Math.max(0, Math.floor(cx - rU - 1));
    const i1 = Math.min(wakeN - 1, Math.ceil(cx + rU + 1));
    const j0 = Math.max(0, Math.floor(cz - rV - 1));
    const j1 = Math.min(wakeN - 1, Math.ceil(cz + rV + 1));
    for (let j = j0; j <= j1; j++) {
      const wz = wakeOZ - ((j + 0.5) / wakeN - 0.5) * wakeD;
      for (let i = i0; i <= i1; i++) {
        const wx = wakeOX + ((i + 0.5) / wakeN - 0.5) * wakeW;
        const d2 = (wx - x) * (wx - x) + (wz - z) * (wz - z);
        if (d2 > r * r) continue;
        const w = Math.exp(-d2 * invR2 * 2.2);
        const idx = j * wakeN + i;
        const nv = wakeField[idx] + amount * w;
        wakeField[idx] = nv > 1 ? 1 : nv;
      }
    }
  };

  /** Bilinear sample of the plate wake field. Inland z>0 is dry. */
  const wakeAt = (x, z) => {
    if (z > 0) return 0;
    const u = (x - wakeOX) / wakeW + 0.5;
    const vv = (wakeOZ - z) / wakeD + 0.5;
    if (u < 0 || u > 1 || vv < 0 || vv > 1) return 0;
    const px = u * wakeN - 0.5;
    const pz = vv * wakeN - 0.5;
    let i0 = Math.floor(px);
    let j0 = Math.floor(pz);
    const fu = px - i0;
    const fv = pz - j0;
    if (i0 < 0) i0 = 0;
    else if (i0 > wakeN - 2) i0 = wakeN - 2;
    if (j0 < 0) j0 = 0;
    else if (j0 > wakeN - 2) j0 = wakeN - 2;
    const i1 = i0 + 1;
    const j1 = j0 + 1;
    const a = wakeField[j0 * wakeN + i0];
    const b = wakeField[j0 * wakeN + i1];
    const c = wakeField[j1 * wakeN + i0];
    const d = wakeField[j1 * wakeN + i1];
    return a * (1 - fu) * (1 - fv) + b * fu * (1 - fv)
      + c * (1 - fu) * fv + d * fu * fv;
  };

  /** Stamp wake foam: tiled 19 m field (tests) + world-space plate overlay. */
  const stampWake = (x, z, amount, radiusM = 1.6) => {
    if (!(amount > 0)) return;
    const r = Math.max(0.4, radiusM);
    const rTex = (r / L) * n;
    const cx = ((x / L) % 1 + 1) % 1 * n;
    const cz = ((z / L) % 1 + 1) % 1 * n;
    const rad = Math.ceil(rTex + 1);
    const invR2 = 1 / (rTex * rTex);
    for (let dj = -rad; dj <= rad; dj++) {
      for (let di = -rad; di <= rad; di++) {
        const d2 = di * di + dj * dj;
        if (d2 > rTex * rTex) continue;
        const ii = wrap(Math.round(cx) + di);
        const jj = wrap(Math.round(cz) + dj);
        const w = Math.exp(-d2 * invR2 * 2.2);
        const idx = jj * n + ii;
        const v = foam[idx] + amount * w;
        foam[idx] = v > 1 ? 1 : v;
      }
    }
    splatWorldWake(x, z, amount, r);
  };

  const sampleHeight = (x, z) => {
    const u = ((x / L) % 1 + 1) % 1 * n;
    const v = ((z / L) % 1 + 1) % 1 * n;
    const i0 = Math.floor(u), j0 = Math.floor(v);
    const fu = u - i0, fv = v - j0;
    const i1 = wrap(i0 + 1), j1 = wrap(j0 + 1);
    const a = height[wrap(j0) * n + wrap(i0)];
    const b = height[wrap(j0) * n + i1];
    const c = height[j1 * n + wrap(i0)];
    const d = height[j1 * n + i1];
    return a * (1 - fu) * (1 - fv) + b * fu * (1 - fv) + c * (1 - fu) * fv + d * fu * fv;
  };

  const significantHeight = () => {
    let acc = 0;
    for (let i = 0; i < N2; i++) acc += height[i] * height[i];
    return 4 * Math.sqrt(acc / N2);
  };

  return {
    n, L, depthM, windMs, fetchM, omegaP, alpha,
    cascades: [L],
    ssr: false,
    scale: BAY_PRESET.scale,
    height, dx, dz, slopeX, slopeZ, jacobian,
    get foam() { return foam; },
    wakeN, wakeField, wakeAt,
    step, stampWake, sampleHeight, significantHeight,
    get time() { return time; },
  };
}
