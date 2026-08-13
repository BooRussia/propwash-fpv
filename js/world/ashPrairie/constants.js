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

// Ash Prairie v2/chernobyl anchors (approach z>145 lighter density; |x|>230 far field)
export const ADMIN = { x: 130, z: 70, w: 20, d: 14, h: 5.2 }; // beside coop whoop-indoor
export const ANTENNA_FARM = { x0: -210, x1: -195, z0: -90, z1: -60, mastN: 5 };
export const BUCKET_ELEV = { x: 120, z: -10, w: 4.5, d: 4.5, h: 56 };
export const RUINS = { x: 50, z: -130, w: 16, d: 12 }; // between T2 & containment
export const RETENTION = { x: -60, z: -130, r: 14 };
export const STEEL_BINS = { x: 160, z: -25, n: 3 };

export const SPAWN = { x: 0, z: 165 };
export const PAD_Y = 0.06;

/** Rolling prairie + berms. Amplitudes large enough to read from air (Chernobyl wave). */
export function prairieNoise(x, z) {
  // Macro rolling hills (1.2–2.8 m)
  const macro = 1.6 * Math.sin(x * 0.0085 + 0.4) * Math.sin(z * 0.0072 + 1.1)
              + 1.1 * Math.sin(x * 0.014 + 2.0) * Math.cos(z * 0.011 + 0.6);
  // Mid freckles
  const mid = 0.55 * Math.sin(x * 0.032 + 0.9) * Math.sin(z * 0.028 + 1.7)
            + 0.35 * Math.sin(x * 0.055 + 2.4) * Math.cos(z * 0.048);
  // Fine ripples
  const fine = 0.12 * Math.sin(x * 0.12) * Math.cos(z * 0.1 + 0.3);
  // Soft berm rings near major landmarks (additive mounds)
  let berm = 0;
  const berms = [
    [-90, -150, 55, 2.4], [-30, -165, 52, 2.2], [35, -148, 56, 2.5],
    [75, -115, 40, 1.8], [145, -40, 35, 1.6], [-145, -15, 38, 1.5],
    [110, 55, 30, 1.2], [40, 88, 22, 1.0],
  ];
  for (const [bx, bz, br, bh] of berms) {
    const dx = x - bx, dz = z - bz;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < br) {
      const t = 1 - d / br;
      berm += bh * t * t * (3 - 2 * t);
    }
  }
  // Flatten spawn approach pad strip (z>150 near x=0) so takeoff stays honest
  let flatten = 1;
  if (z > 150 && Math.abs(x) < 40) flatten = 0.15;
  else if (z > 140 && Math.abs(x) < 60) flatten = 0.35;
  return (macro + mid + fine + berm) * flatten;
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
  rust: 0x8B4513,
  voidDark: 0x1A1816,
  rustHot: 0x8B4513,
  rustCool: 0x5C4033,
  beaconAmber: 0xC4A35A,
  beaconCool: 0xD8DCE0,
  // Chernobyl / Pripyat documentary decay (Desi)
  mossA: 0x3F4A32,
  mossB: 0x2C3524,
  overgrowA: 0x5A6340,
  overgrowB: 0x4A5238,
  poisonGrass: 0x6B7054,
  carBodyA: 0x4A5560,
  carBodyB: 0x5C4038,
  carBodyC: 0x3E3E38,
  glassDead: 0x1C2220,
  mountainFar: 0x6A7380,
  mountainNear: 0x5C6358,
};
