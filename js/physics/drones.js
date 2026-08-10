// ============================================================
// PropWash FPV — drone specifications
// Three real quads with realistic physical numbers (SI units).
//
// Field reference:
//   id                 key in DRONES / settings.drone
//   displayName        UI name
//   class              'whoop' | 'cinewhoop' | 'freestyle'
//   propInches         prop diameter in inches
//   cells              LiPo cell count (1S/4S/6S)
//   massKg             all-up weight incl. battery (kg)
//   sizeM              wheelbase, motor-to-motor diagonal (m)
//   maxThrustN         total thrust, 4 motors, full stick, fresh pack (N)
//   motorTau           motor+prop spool time constant (s)
//   inertia {x,y,z}    body inertia (kg*m^2); x=pitch, y=yaw, z=roll
//   maxTorque {x,y,z}  peak control torque per axis (N*m)
//   dragArea {front,top,side}  Cd*A per body axis (m^2)
//   battWh             battery energy (Wh)
//   sagVoltsPerCell    voltage sag per cell at full punch (V)
//   camTiltDefaultDeg  typical FPV camera uptilt (deg)
//   description        one-liner for the UI
//
// Inertia model: quads are roughly flat discs —
//   I_pitch/roll ≈ m * (wheelbase/2)^2 * 0.5,  I_yaw ≈ 1.5x that.
// Torque model: sized so torque-limited time-to-max-rate (670 deg/s,
//   including first-order motor lag) matches each class:
//   5in ~75 ms, whoop ~90 ms, cinewhoop ~115 ms. Yaw is much weaker
//   (prop drag torque only), reaching 500 deg/s in ~180-220 ms.
// ============================================================

export const DRONES = {
  // ----------------------------------------------------------
  // BetaFPV Meteor75 Pro — 75 mm brushless 1S tiny whoop.
  // ~24.7 g dry, ~34 g AUW with 1S 450 mAh. 40 mm (1.6") props.
  // Sanity: weight = 0.034*9.81 = 0.3335 N; maxThrust 0.93 N
  //   → TWR = 2.79; hoverThrottle = sqrt(0.3335/0.93) = 0.599 ✓ (0.58–0.65)
  // Inertia: 0.034*(0.0375)^2*0.5 = 2.4e-5 (pitch/roll), yaw 1.5x = 3.6e-5
  // Torque: I*178 rad/s^2 ≈ 4.3e-3 N*m → 670 deg/s in ~90 ms with 25 ms tau
  // Drag: ducted frame, huge CdA for its mass — top speed ~24 m/s,
  //   and wind shoves it around hard (CdA/m ≈ 0.07, 1.6x the 5-inch).
  // ----------------------------------------------------------
  meteor75: {
    id: 'meteor75',
    displayName: 'BetaFPV Meteor75 Pro',
    class: 'whoop',
    propInches: 1.6,
    cells: 1,
    massKg: 0.034,
    sizeM: 0.075,
    maxThrustN: 0.93,
    motorTau: 0.025,
    inertia:   { x: 2.4e-5, y: 3.6e-5, z: 2.4e-5 },
    maxTorque: { x: 4.3e-3, y: 1.8e-3, z: 4.3e-3 },
    dragArea:  { front: 0.0024, top: 0.0060, side: 0.0028 },
    battWh: 1.66,               // 1S 450 mAh * 3.7 V
    sagVoltsPerCell: 0.35,      // 1S sags hard on punch-outs
    camTiltDefaultDeg: 20,
    description: 'Ducted 1S micro whoop — nimble indoors, tossed around by any wind.',
  },

  // ----------------------------------------------------------
  // GEPRC Cinebot30 — 3-inch 4S ducted cinewhoop.
  // ~410 g AUW with 4S 850 mAh, 127 mm wheelbase.
  // Sanity: weight = 0.410*9.81 = 4.022 N; maxThrust 16.1 N
  //   → TWR = 4.00; hoverThrottle = sqrt(4.022/16.1) = 0.500 ✓ (~0.5)
  // Inertia: 0.410*(0.0635)^2*0.5 = 8.3e-4 (pitch/roll), yaw 1.24e-3
  // Torque: I*159 rad/s^2 ≈ 0.131 N*m → 670 deg/s in ~115 ms with 45 ms tau
  // Drag: chunky ducts → top speed ~35 m/s. Highest disc loading of the
  //   three (≈220 N/m^2), so it prop-washes worst in fast descents.
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
    dragArea:  { front: 0.020, top: 0.034, side: 0.022 },
    battWh: 12.6,               // 4S 850 mAh * 14.8 V
    sagVoltsPerCell: 0.16,
    camTiltDefaultDeg: 25,
    description: 'Heavy ducted 3-inch cinewhoop — smooth, stable, deliberate.',
  },

  // ----------------------------------------------------------
  // iFlight Nazgul5 V3 — classic 5-inch 6S freestyle quad.
  // ~640 g AUW with 6S 1300 mAh, 2306 motors, 240 mm wheelbase.
  // Sanity: weight = 0.640*9.81 = 6.278 N; maxThrust 50 N
  //   → TWR = 7.96; hoverThrottle = sqrt(6.278/50) = 0.354 ✓ (0.34–0.37)
  // Inertia: 0.640*(0.120)^2*0.5 = 4.6e-3 (pitch/roll), yaw 6.9e-3
  // Torque: I*363 rad/s^2 ≈ 1.7 N*m → 670 deg/s in ~75 ms with 60 ms tau
  //   (physically plausible: 2 motors * 12.5 N * 0.085 m arm ≈ 2.1 N*m ceiling)
  // Drag: open frame, low CdA/m → 50+ m/s in a full-tilt dive.
  // ----------------------------------------------------------
  nazgul5: {
    id: 'nazgul5',
    displayName: 'iFlight Nazgul5 V3',
    class: 'freestyle',
    propInches: 5,
    cells: 6,
    massKg: 0.640,
    sizeM: 0.240,
    maxThrustN: 50,
    motorTau: 0.06,
    inertia:   { x: 4.6e-3, y: 6.9e-3, z: 4.6e-3 },
    maxTorque: { x: 1.7,    y: 0.50,   z: 1.7 },
    dragArea:  { front: 0.030, top: 0.055, side: 0.034 },
    battWh: 28.9,               // 6S 1300 mAh * 22.2 V
    sagVoltsPerCell: 0.13,
    camTiltDefaultDeg: 30,
    description: 'The 5-inch freestyle benchmark — huge power, instant rotation.',
  },
};

/**
 * Simple-model hover throttle for UI display: sqrt(weight / maxThrust).
 * (The flight model uses thrust ∝ throttle^2, so this is the stick position
 * at which thrust equals weight on a fresh battery.)
 */
export function hoverThrottle(spec) {
  if (!spec || !(spec.maxThrustN > 0) || !(spec.massKg > 0)) return 0;
  return Math.sqrt((spec.massKg * 9.81) / spec.maxThrustN);
}
