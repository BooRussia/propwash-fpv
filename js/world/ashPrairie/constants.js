// Shared Ash Prairie terrain constants + height profile (mesh + physics).
// Decommissioned Great Plains nuclear yard + grain co-op.
// True industrial scale — cooling towers are NOT shrunk.

export const GROUND_Y = 0;

// Landmark anchors (x, z) — hierarchy: towers → containment → elevators →
// turbine/switchyard → pipe racks → co-op → pads. Negative space is prairie.
export const TOWER_SITES = [
  { x: -90, z: -150, h: 122, baseR: 48, throatR: 24, topR: 30, throatT: 0.72 },
  { x: -30, z: -165, h: 118, baseR: 46, throatR: 23, topR: 29, throatT: 0.70 },
  { x: 35, z: -148, h: 125, baseR: 50, throatR: 25, topR: 31, throatT: 0.73 },
];

export const CONTAINMENT = { x: 75, z: -115, r: 28, h: 42, domeH: 18 };
export const FUEL_BLDG = { x: 115, z: -95, w: 22, d: 16, h: 14 };

export const ELEVATORS = { x: 145, z: -40, count: 5, spacing: 14, r: 5.2, h: 48, headH: 12 };
export const PIPE_RACK = { x0: -50, x1: 70, z0: -10, z1: 55, levels: 4 };
export const CONVEYOR = { x0: 55, x1: 145, z: 18, y: 14, w: 4.2 };
export const SWITCHYARD = { x: -145, z: -15, w: 70, d: 55 };
export const TURBINE = { x: -105, z: 35, w: 55, d: 28, h: 22 };
export const STACK = { x: -88, z: 48, r: 3.6, h: 78 };
export const COOP = { x: 110, z: 55, w: 48, d: 32, h: 9 };
export const RAIL = { z: 95, x0: -200, x1: 220 };
export const CANAL = { z: 118, x0: -80, x1: 160, w: 18, depth: 2.4 };
export const DUMP_CANOPY = { x: 40, z: 88, w: 28, d: 16, h: 7.5 };
export const SILO_LF = { x: -185, z: -75, r: 4.8, depth: 22, collarH: 1.2 };

export const SPAWN = { x: 0, z: 165 };
export const PAD_Y = 0.06;

export function prairieNoise(x, z) {
  return 0.35 * Math.sin(x * 0.021 + 0.7) * Math.sin(z * 0.017 + 1.3)
       + 0.18 * Math.sin(x * 0.053 + 2.1) * Math.sin(z * 0.047)
       + 0.08 * Math.sin(x * 0.11) * Math.cos(z * 0.09 + 0.4);
}

/** Physics / spawn ground height. Pads and hardscape sit at known elevations. */
export function groundHeight(x, z) {
  // Canal water surface counts as ground for crash/land
  if (z > CANAL.z - CANAL.w / 2 && z < CANAL.z + CANAL.w / 2
      && x > CANAL.x0 && x < CANAL.x1) {
    return -0.15;
  }
  // LF silo tube floor
  const dsx = x - SILO_LF.x, dsz = z - SILO_LF.z;
  if (dsx * dsx + dsz * dsz < (SILO_LF.r - 0.35) ** 2) {
    return -SILO_LF.depth;
  }
  return GROUND_Y + prairieNoise(x, z);
}

export function meshHeight(x, z) {
  // Soft bank into canal (mesh only — water sits below bank to avoid z-fight)
  if (z > CANAL.z - CANAL.w / 2 - 4 && z < CANAL.z + CANAL.w / 2 + 4
      && x > CANAL.x0 - 2 && x < CANAL.x1 + 2) {
    const half = CANAL.w / 2;
    const dz = Math.abs(z - CANAL.z);
    if (dz < half) return -CANAL.depth;
    const t = (dz - half) / 4;
    const bank = -CANAL.depth * (1 - t * t * (3 - 2 * t));
    return bank + prairieNoise(x, z) * t;
  }
  const dsx = x - SILO_LF.x, dsz = z - SILO_LF.z;
  const rr = Math.sqrt(dsx * dsx + dsz * dsz);
  if (rr < SILO_LF.r + 2.5) {
    if (rr < SILO_LF.r - 0.2) return -SILO_LF.depth;
    const t = (rr - (SILO_LF.r - 0.2)) / 2.7;
    return -SILO_LF.depth * (1 - Math.min(1, t)) + prairieNoise(x, z) * Math.min(1, t);
  }
  return GROUND_Y + prairieNoise(x, z);
}

// Palette (Desi)
export const PAL = {
  soilA: 0x5C5346,
  soilB: 0x3E3830,
  grassA: 0x8A7E5C,
  grassB: 0x6E6648,
  concreteA: 0xB8B4AA,
  concreteB: 0x8E8A82,
  oxideA: 0x6B4E3D,
  oxideB: 0x4A3A32,
  galv: 0xA8ADB4,
  brick: 0x7A4E3D,
  asphalt: 0x2A2A2C,
  warnRed: 0x6E2E2E,
  warnYellow: 0x8A7A2A,
  water: 0x2C3538,
};
