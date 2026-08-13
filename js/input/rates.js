// ============================================================
// PropWash FPV — stick → deg/s rate curves
// Shared by the Rates chart (menu) and the flight model (quad).
// Supports Betaflight "Actual" and classical Betaflight rates
// (Liftoff Rate / Expo / SuperExpo UI units).
// ============================================================

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function constrain(x, a, b) {
  return clamp(x, a, b);
}

/** Default Actual axis (Liftoff Meteor75-matched). */
export const DEF_ACTUAL_RP = { centerSens: 10, maxRate: 670, expo: 0.7 };
export const DEF_ACTUAL_Y = { centerSens: 10, maxRate: 670, expo: 0.7 };

/** Default Betaflight axis (Liftoff Meteor75 BF alt slot). */
export const DEF_BF_RP = { rate: 155, expo: 30, superExpo: 73 };
export const DEF_BF_Y = { rate: 100, expo: 30, superExpo: 73 };

export function defaultRatesSettings() {
  return {
    model: 'actual',
    actual: {
      roll: { ...DEF_ACTUAL_RP },
      pitch: { ...DEF_ACTUAL_RP },
      yaw: { ...DEF_ACTUAL_Y },
    },
    betaflight: {
      roll: { ...DEF_BF_RP },
      pitch: { ...DEF_BF_RP },
      yaw: { ...DEF_BF_Y },
    },
  };
}

/**
 * Betaflight applyActualRates (deg/s), matching existing PropWash / menu.js:
 *   expof = |x| * (x^5 * expo + x * (1 - expo))
 *   rate  = centerSens * x + max(0, maxRate - centerSens) * expof
 */
export function actualRate(x, ax) {
  const centerSens = Number(ax?.centerSens) || 0;
  const maxRate = Number(ax?.maxRate) || 0;
  const expo = clamp(Number(ax?.expo) || 0, 0, 1);
  const xx = constrain(Number(x) || 0, -1, 1);
  const expof = Math.abs(xx) * (Math.pow(xx, 5) * expo + xx * (1 - expo));
  return centerSens * xx + Math.max(0, maxRate - centerSens) * expof;
}

/**
 * Classical Betaflight rates → setpoint deg/s.
 * Matches Betaflight applyBetaflightRates / getSetpointRate style used by
 * Liftoff's Rate / Expo / SuperExpo sliders:
 *   - expo, superExpo are 0–100 UI values
 *   - rate is the BF RC rate slider (typically ~0–200)
 *   - rcRatef quirk: values above 2.0 add 2*(rcRatef-2)
 *   - super-expo divides by (1 - superP * |rc|)
 */
export function betaflightRate(x, ax) {
  const rcRate = Math.max(0, Number(ax?.rate) || 0);
  const expoP = clamp((Number(ax?.expo) || 0) / 100, 0, 1);
  const superP = clamp((Number(ax?.superExpo) || 0) / 100, 0, 0.99);
  let rc = constrain(Number(x) || 0, -1, 1);
  if (expoP > 0) rc = rc * rc * rc * expoP + rc * (1 - expoP);
  let rcRatef = rcRate / 100;
  if (rcRatef > 2.0) rcRatef += 2.0 * (rcRatef - 2.0);
  let angleRate = 200 * rcRatef * rc;
  const absRc = Math.abs(rc);
  const fac = 1 - superP * absRc;
  if (fac > 1e-6) angleRate = angleRate / fac;
  return angleRate;
}

/**
 * Active-model stick → deg/s for one axis.
 * @param {'roll'|'pitch'|'yaw'} axis
 * @param {number} x stick -1..1
 * @param {object} rates settings.rates (normalized or legacy)
 */
export function getRateDegS(axis, x, rates) {
  const r = normalizeRates(rates);
  if (r.model === 'betaflight') {
    return betaflightRate(x, r.betaflight[axis] || DEF_BF_RP);
  }
  return actualRate(x, r.actual[axis] || DEF_ACTUAL_RP);
}

/** Full-stick deg/s for angle-mode clamps / chart scaling. */
export function getMaxRateDegS(axis, rates) {
  return Math.abs(getRateDegS(axis, 1, rates));
}

function copyActualAxis(src, def) {
  const s = src || {};
  return {
    centerSens: Number.isFinite(Number(s.centerSens)) ? Number(s.centerSens) : def.centerSens,
    maxRate: Number.isFinite(Number(s.maxRate)) ? Number(s.maxRate) : def.maxRate,
    expo: clamp(Number.isFinite(Number(s.expo)) ? Number(s.expo) : def.expo, 0, 1),
  };
}

function copyBfAxis(src, def) {
  const s = src || {};
  return {
    rate: Number.isFinite(Number(s.rate)) ? Number(s.rate) : def.rate,
    expo: clamp(Number.isFinite(Number(s.expo)) ? Number(s.expo) : def.expo, 0, 100),
    superExpo: clamp(Number.isFinite(Number(s.superExpo)) ? Number(s.superExpo) : def.superExpo, 0, 100),
  };
}

/**
 * Normalize any rates object (legacy flat Actual OR new nested) into:
 * { model, actual:{roll,pitch,yaw}, betaflight:{roll,pitch,yaw} }
 * Does not mutate the input.
 */
export function normalizeRates(ratesObj) {
  const base = defaultRatesSettings();
  if (!ratesObj || typeof ratesObj !== 'object') return base;

  // Legacy flat: { roll:{centerSens,maxRate,expo}, pitch, yaw }
  const looksLegacy = ratesObj.roll
    && (ratesObj.roll.centerSens != null || ratesObj.roll.maxRate != null)
    && !ratesObj.actual;

  let model = ratesObj.model === 'betaflight' ? 'betaflight' : 'actual';
  let actualSrc = ratesObj.actual;
  let bfSrc = ratesObj.betaflight;

  if (looksLegacy) {
    actualSrc = {
      roll: ratesObj.roll,
      pitch: ratesObj.pitch,
      yaw: ratesObj.yaw,
    };
    model = 'actual';
  }

  return {
    model,
    actual: {
      roll: copyActualAxis(actualSrc?.roll, DEF_ACTUAL_RP),
      pitch: copyActualAxis(actualSrc?.pitch, DEF_ACTUAL_RP),
      yaw: copyActualAxis(actualSrc?.yaw, DEF_ACTUAL_Y),
    },
    betaflight: {
      roll: copyBfAxis(bfSrc?.roll, DEF_BF_RP),
      pitch: copyBfAxis(bfSrc?.pitch, DEF_BF_RP),
      yaw: copyBfAxis(bfSrc?.yaw, DEF_BF_Y),
    },
  };
}

/**
 * Mutate settings.rates in place into the nested shape (migration helper).
 * Safe to call repeatedly. Returns the mutated object.
 */
export function ensureRatesShape(ratesObj) {
  const n = normalizeRates(ratesObj);
  if (!ratesObj || typeof ratesObj !== 'object') return n;
  // Clear legacy flat keys
  delete ratesObj.roll;
  delete ratesObj.pitch;
  delete ratesObj.yaw;
  ratesObj.model = n.model;
  ratesObj.actual = n.actual;
  ratesObj.betaflight = n.betaflight;
  return ratesObj;
}

/**
 * Write a drone's Liftoff-matched feel defaults into settings (mutates).
 * Caller should saveSettings() / emit.
 */
export function applyDroneFeelToSettings(settings, feel) {
  if (!settings || !feel) return;
  ensureRatesShape(settings.rates);
  if (feel.ratesModel === 'betaflight' || feel.ratesModel === 'actual') {
    settings.rates.model = feel.ratesModel;
  }
  if (feel.actual) {
    for (const ax of ['roll', 'pitch', 'yaw']) {
      if (feel.actual[ax]) {
        settings.rates.actual[ax] = copyActualAxis(feel.actual[ax], settings.rates.actual[ax]);
      }
    }
  }
  if (feel.betaflight) {
    for (const ax of ['roll', 'pitch', 'yaw']) {
      if (feel.betaflight[ax]) {
        settings.rates.betaflight[ax] = copyBfAxis(feel.betaflight[ax], settings.rates.betaflight[ax]);
      }
    }
  }
  if (Number.isFinite(Number(feel.throttleExpo))) {
    settings.throttleExpo = clamp(Number(feel.throttleExpo), 0, 1);
  }
  if (Number.isFinite(Number(feel.camTiltDeg)) && settings.camera) {
    settings.camera.tiltDeg = Number(feel.camTiltDeg);
  }
}
