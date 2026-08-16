// ============================================================
// PropWash FPV — drone specifications
// Physical numbers tuned from Liftoff Part*Data extracts
// (UnityPy + TypeTreeGenerator). See LIFTOFF_FEEL_BRIEF.json.
//
// Field reference:
//   id, displayName, class, propInches, cells, massKg, sizeM
//   maxThrustN         4-motor peak thrust, fresh pack (N)
//   motorTau, inertia, maxTorque, dragArea
//   battWh, sagVoltsPerCell, camTiltDefaultDeg
//   idleMotorThrottle, feel (rates / idle / cam / throttle expo)
//   parts              Liftoff Motor/Prop/Battery/Frame tables
//
// Thrust path (quad.js) reads maxThrustN and scales by
// parts.prop.propConstant / propConstantBaseline when present.
// ============================================================

const ACTUAL_METEOR = { centerSens: 10, maxRate: 670, expo: 0.7 };
const BF_METEOR_RP = { rate: 155, expo: 30, superExpo: 73 };
const BF_METEOR_Y = { rate: 100, expo: 30, superExpo: 73 };
const BF_CHAMELEON = { rate: 100, expo: 0, superExpo: 78 };
const ACTUAL_CINE = { centerSens: 160, maxRate: 400, expo: 0.35 };

/** Peak thrust used by the flight model (N). */
export function effectiveMaxThrustN(spec) {
  if (!spec) return 0;
  const base = Number(spec.maxThrustN) || 0;
  const pc = Number(spec.parts?.prop?.propConstant);
  const pc0 = Number(spec.parts?.prop?.propConstantBaseline);
  if (Number.isFinite(pc) && Number.isFinite(pc0) && pc0 > 0) {
    return base * (pc / pc0);
  }
  return base;
}

export const DRONES = {
  // ----------------------------------------------------------
  // BetaFPV Meteor75 Pro — Liftoff Micro build extract
  // Happymodel EX0802 22000KV + Gemfan 40mm×3 + Air75 + Oomph 1S520
  // Parts AUW ≈ 0.0336 kg. Actual rates 10 / 0.7 / 670, idle 0.01.
  // maxThrust sized for ~TWR 3.8 on parts AUW (whoop-class punch).
  // ----------------------------------------------------------
  meteor75: {
    id: 'meteor75',
    displayName: 'BetaFPV Meteor75 Pro',
    class: 'whoop',
    propInches: 1.574,
    cells: 1,
    massKg: 0.0336,
    sizeM: 0.075,
    maxThrustN: 1.25,            // TWR ≈ 3.79 @ 0.0336 kg
    motorTau: 0.022,
    inertia:   { x: 2.36e-5, y: 3.54e-5, z: 2.36e-5 },
    maxTorque: { x: 3.1e-3,  y: 1.5e-3,  z: 3.1e-3 },
    // Belly CdA: whoop stays draggy-er than the 5″ (dead-stick vt ≈ 21 m/s).
    dragArea:  { front: 0.0023, top: 0.0012, side: 0.0027 },
    battWh: 1.976,               // 520 mAh × 3.8 V
    sagVoltsPerCell: 0.50,       // Ri 0.2 Ω 1S — punches sag hard
    camTiltDefaultDeg: 30,
    idleMotorThrottle: 0.01,
    parts: {
      motor: {
        id: 'HappymodelEX0802Motor22000KV01',
        weight_kg: 0.0016, size: 802, diameter_mm: 8, statorHeight_mm: 2,
        kv: 22000, maxPower_W: 13, maxS: 1, noLoadI: 0.45, noLoadV: 2.0, Ri_ohm: 0.2,
      },
      prop: {
        id: 'Gemfan40mmPropeller301',
        weight_kg: 0.0005, diameter_in: 1.574, pitch: 3.5, blades: 3,
        propConstant: 1.0, propConstantBaseline: 1.0,
      },
      frame: {
        id: 'BetaFPVAir75Frame01',
        weight_kg: 0.0112, maxPropellerSize_in: 1.65,
        batteryAtBottom: true, hasDragOverride: false, dragOverrideValue: 0.82,
      },
      battery: {
        id: 'Oomph1SBattery520mAh01',
        weight_kg: 0.014, mAh: 520, S: 1, Vcell: 3.8,
        cellRi_ohm: 0.1, Ccont: 80, Cburst: 160,
      },
      approxPartsAuw_kg: 0.0336,
    },
    feel: {
      ratesModel: 'actual',
      actual: {
        roll: { ...ACTUAL_METEOR },
        pitch: { ...ACTUAL_METEOR },
        yaw: { ...ACTUAL_METEOR },
      },
      betaflight: {
        roll: { ...BF_METEOR_RP },
        pitch: { ...BF_METEOR_RP },
        yaw: { ...BF_METEOR_Y },
      },
      idleMotorThrottle: 0.01,
      throttleExpo: 0.20,
      camTiltDeg: 30,
    },
    description: 'Liftoff Micro Meteor75 — 0802 22000KV / 40mm tri / 1S520. Nimble whoop punch.',
  },

  // ----------------------------------------------------------
  // GEPRC Cinebot30 — unchanged (no Liftoff extract yet)
  // ----------------------------------------------------------
  cinebot30: {
    id: 'cinebot30',
    displayName: 'GEPRC Cinebot30',
    class: 'cinewhoop',
    propInches: 3,
    cells: 4,
    massKg: 0.410,
    sizeM: 0.127,
    maxThrustN: 16.1,
    motorTau: 0.045,
    inertia:   { x: 8.3e-4, y: 1.24e-3, z: 8.3e-4 },
    maxTorque: { x: 0.131,  y: 0.062,   z: 0.131 },
    // Ducted cinewhoop: draggy-er than a 5″, vt ≈ 26 m/s belly-on.
    dragArea:  { front: 0.020, top: 0.010, side: 0.022 },
    battWh: 12.6,
    sagVoltsPerCell: 0.16,
    camTiltDefaultDeg: 25,
    idleMotorThrottle: 0.03,
    feel: {
      ratesModel: 'actual',
      actual: {
        roll: { ...ACTUAL_CINE },
        pitch: { ...ACTUAL_CINE },
        yaw: { ...ACTUAL_CINE },
      },
      betaflight: {
        roll: { rate: 100, expo: 20, superExpo: 50 },
        pitch: { rate: 100, expo: 20, superExpo: 50 },
        yaw: { rate: 100, expo: 20, superExpo: 50 },
      },
      idleMotorThrottle: 0.03,
      throttleExpo: 0.20,
      camTiltDeg: 25,
    },
    description: 'Heavy ducted 3-inch cinewhoop — smooth, stable, deliberate.',
  },

  // ----------------------------------------------------------
  // 5″ freestyle slot — Liftoff Armattan Chameleon parts mapped
  // onto nazgul5. Hypetrain 2306 2450KV + HQ 5×4×3 (pc 1.2) +
  // Chameleon frame + Ahtech 4S1500. Parts AUW ≈ 0.432 kg.
  // BF rates 100 / 0 / 78, idle 0.04. TWR ≈ 8.0.
  // ----------------------------------------------------------
  nazgul5: {
    id: 'nazgul5',
    displayName: 'iFlight Nazgul5 V3',
    class: 'freestyle',
    propInches: 5.0,
    cells: 4,
    massKg: 0.432,
    sizeM: 0.225,
    maxThrustN: 33.9,            // TWR ≈ 8.0 @ 0.432 kg; includes propConstant 1.2
    motorTau: 0.055,
    inertia:   { x: 2.73e-3, y: 4.10e-3, z: 2.73e-3 },
    maxTorque: { x: 0.95,    y: 0.32,    z: 0.95 },
    // 5″ belly CdA lets a zero-throttle dive pass ~25–40 m/s (vt ≈ 39 m/s).
    dragArea:  { front: 0.028, top: 0.0045, side: 0.032 },
    battWh: 22.2,                // 1500 mAh × 14.8 V
    sagVoltsPerCell: 0.12,       // cellRi 0.003 Ω, C85
    camTiltDefaultDeg: 30,
    idleMotorThrottle: 0.04,
    parts: {
      motor: {
        id: 'Hypetrain2306Motor01',
        weight_kg: 0.03, size: 2306, diameter_mm: 23, statorLength_mm: 6,
        kv: 2450, maxPower_W: 300, maxS: 5, noLoadI: 0.5, noLoadV: 10, Ri_ohm: 0.048,
      },
      prop: {
        id: 'HQV1Series5040TriPropeller01',
        weight_kg: 0.0034, diameter_in: 5.0, pitch: 4.0, blades: 3,
        propConstant: 1.2, propConstantBaseline: 1.2,
      },
      frame: {
        id: 'ArmattanChameleonFrame01',
        weight_kg: 0.118, maxPropellerSize_in: 5.0,
        batteryAtBottom: false, hasDragOverride: false, dragOverrideValue: 0.82,
      },
      battery: {
        id: 'AhtechInfinityBattery01',
        weight_kg: 0.18, mAh: 1500, S: 4, Vcell: 3.7,
        cellRi_ohm: 0.003, Ccont: 85, Cburst: 170,
      },
      approxPartsAuw_kg: 0.4316,
    },
    feel: {
      ratesModel: 'betaflight',
      actual: {
        roll:  { centerSens: 200, maxRate: 670, expo: 0.54 },
        pitch: { centerSens: 200, maxRate: 670, expo: 0.54 },
        yaw:   { centerSens: 200, maxRate: 500, expo: 0.54 },
      },
      betaflight: {
        roll: { ...BF_CHAMELEON },
        pitch: { ...BF_CHAMELEON },
        yaw: { ...BF_CHAMELEON },
      },
      idleMotorThrottle: 0.04,
      throttleExpo: 0.20,
      camTiltDeg: 30,
    },
    description: '5″ freestyle with Liftoff Chameleon parts — 2306 2450KV / 5040×3 / 4S1500.',
  },
};

export function hoverThrottle(spec) {
  const thrust = effectiveMaxThrustN(spec);
  if (!spec || !(thrust > 0) || !(spec.massKg > 0)) return 0;
  return Math.sqrt((spec.massKg * 9.81) / thrust);
}

export function idleMotorThrottle(spec) {
  if (!spec) return 0.035;
  const v = spec.feel?.idleMotorThrottle ?? spec.idleMotorThrottle;
  return Number.isFinite(Number(v)) ? Number(v) : 0.035;
}
