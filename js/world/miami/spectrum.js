// Biscayne Bay wave spectrum — JONSWAP + TMA + Donelan–Banner.
//
// Methods (not a scene, not a GLSL paste):
//   Hasselmann et al. 1973  JONSWAP
//   Bouws et al. 1985       TMA = JONSWAP × Kitaigorodskii depth factor
//   Donelan, Hamilton, Hui 1985 + Banner 1990   sech² directional spreading
//   Tessendorf 2001         k-space amplitude from the directional spectrum
//
// TMA is the bay: Biscayne is fetch-limited and a few metres deep, so the
// equilibrium range is flattened toward ω⁻³ instead of the deep ω⁻⁵ tail.
// GRAVITY stays 9.81 — same constant the flight model uses.

export const G = 9.81;

/** Phone-first preset. 512 is a ceiling; 1024 is out. 768 m is not shipped. */
export const BAY_PRESET = Object.freeze({
  n: 256,
  cascadeM: 19,          // the 8–25 m read
  cascades: Object.freeze([19]),
  scale: 1.0,
  ssr: false,
  windMs: 6.5,           // moderate onshore
  fetchM: 10000,         // bay fetch, not open Atlantic
  depthM: 4.0,           // TMA shallow-water
  windTheta: Math.PI / 2, // waves propagate +Z (toward the beach)
  gamma: 3.3,
  seed: 0xB15CA7E,
});

/** Dimensionless fetch  X̃ = g F / U² */
export function dimensionlessFetch(windMs, fetchM, g = G) {
  const u = Math.max(0.4, windMs);
  return (g * Math.max(1, fetchM)) / (u * u);
}

/** Hasselmann fetch-limited JONSWAP peak and Phillips α. */
export function jonswapParams(windMs, fetchM, g = G) {
  const u = Math.max(0.4, windMs);
  const xt = dimensionlessFetch(u, fetchM, g);
  const alpha = 0.076 * Math.pow(xt, -0.22);
  const omegaP = 22 * (g / u) * Math.pow(xt, -0.33);
  return { alpha, omegaP, xt };
}

/**
 * JONSWAP S(ω)  [m² s / rad].
 * σ = 0.07 (ω ≤ ωp), 0.09 (ω > ωp).
 */
export function jonswapS(omega, { alpha, omegaP, gamma = 3.3, g = G }) {
  const w = Math.max(1e-6, omega);
  const wp = Math.max(1e-6, omegaP);
  const sigma = w <= wp ? 0.07 : 0.09;
  const dw = (w - wp) / (sigma * wp);
  const peak = Math.pow(gamma, Math.exp(-0.5 * dw * dw));
  const pm = (alpha * g * g) / Math.pow(w, 5) * Math.exp(-1.25 * Math.pow(wp / w, 4));
  return pm * peak;
}

/**
 * Kitaigorodskii / Bouws TMA weight Φ(ω, h).
 * Exact linear-theory form:
 *   Φ = tanh²(kh) / (1 + 2kh / sinh(2kh))
 * with ω² = g k tanh(k h). Deep water → 1; the bay (h ~ 4 m) cuts the tail.
 */
export function tmaPhi(omega, depthM, g = G) {
  const h = Math.max(0.25, depthM);
  const k = waveNumber(omega, h, g);
  const kh = k * h;
  if (kh < 1e-5) return 0.5 * kh;
  const sh = Math.sinh(2 * kh);
  if (!Number.isFinite(sh) || sh === 0) return 1;
  const phi = Math.pow(Math.tanh(kh), 2) / (1 + 2 * kh / sh);
  return phi < 0 ? 0 : (phi > 1 ? 1 : phi);
}

/** Finite-depth dispersion: ω² = g k tanh(k h). Newton solve for k. */
export function waveNumber(omega, depthM, g = G) {
  const w2 = Math.max(1e-12, omega * omega);
  const h = Math.max(0.25, depthM);
  // deep-water start, then one tanh correction
  let k = w2 / g;
  for (let i = 0; i < 8; i++) {
    const kh = k * h;
    const th = Math.tanh(kh);
    const f = g * k * th - w2;
    const df = g * th + g * kh * (1 - th * th);
    const step = f / (df || 1);
    k -= step;
    if (k < 1e-8) k = 1e-8;
    if (Math.abs(step) < 1e-7 * k) break;
  }
  return k;
}

export function omegaOfK(k, depthM, g = G) {
  const kk = Math.max(0, k);
  const h = Math.max(0.25, depthM);
  return Math.sqrt(g * kk * Math.tanh(kk * h));
}

/** dω/dk — group-velocity factor used to map S(ω) → E(k). */
export function domegaDk(k, depthM, g = G) {
  const kk = Math.max(1e-8, k);
  const h = Math.max(0.25, depthM);
  const kh = kk * h;
  const th = Math.tanh(kh);
  const sech2 = 1 - th * th;
  const w = Math.sqrt(Math.max(1e-16, g * kk * th));
  return 0.5 * (g * th + g * kh * sech2) / w;
}

/**
 * Donelan–Banner sech² spreading D(θ, ω)  [1/rad].
 * β from Donelan 1985; high-frequency tail from Banner 1990.
 * Normalised so ∫_{-π}^{π} D dθ = 1.
 */
export function donelanBeta(omega, omegaP) {
  const n = omega / Math.max(1e-6, omegaP);
  if (n < 0.56) return 2.61 * Math.pow(0.56, 1.3);
  if (n < 0.95) return 2.61 * Math.pow(n, 1.3);
  if (n < 1.6) return 2.28 * Math.pow(n, -1.3);
  const ln = Math.log(n * n);
  return Math.pow(10, -0.4 + 0.8393 * Math.exp(-0.567 * ln));
}

export function donelanD(theta, omega, omegaP, windTheta = 0) {
  const beta = donelanBeta(omega, omegaP);
  let dth = theta - windTheta;
  dth = dth - Math.PI * 2 * Math.round(dth / (Math.PI * 2));
  // sech²; 0.5 β ∫ sech²(βθ) dθ over ℝ is 1, wrap is a tiny leak at ±π
  const s = 1 / Math.cosh(beta * dth);
  return 0.5 * beta * s * s;
}

/**
 * Directional spectrum E(k) such that  ⟨|h̃|²⟩ = E(k) dkx dkz.
 * E(k) = S(ω) Φ_TMA D(θ) (dω/dk) / k
 */
export function directionalEk(kx, kz, params) {
  const {
    alpha, omegaP, gamma = 3.3, depthM, windTheta = 0, g = G,
  } = params;
  const k = Math.hypot(kx, kz);
  if (k < 1e-8) return 0;
  const omega = omegaOfK(k, depthM, g);
  const s = jonswapS(omega, { alpha, omegaP, gamma, g }) * tmaPhi(omega, depthM, g);
  const d = donelanD(Math.atan2(kz, kx), omega, omegaP, windTheta);
  return s * d * domegaDk(k, depthM, g) / k;
}

/** Hasselmann-style fetch-limited Hs estimate (deep, for a sanity bound). */
export function hasselmannHs(windMs, fetchM, g = G) {
  const u = Math.max(0.4, windMs);
  const xt = dimensionlessFetch(u, fetchM, g);
  // Hs ≈ 0.0016 U²/g · X̃^{1/2}  (order-of-magnitude check, not TMA)
  return 0.0016 * (u * u / g) * Math.sqrt(xt);
}
