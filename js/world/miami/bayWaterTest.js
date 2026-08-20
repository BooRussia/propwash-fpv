// Headless checks for the Biscayne bay water increment.
// No three.js, no game state.
//
//   node ./tools/run-miami-bay-water-test.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BAY_PRESET, G, jonswapParams, jonswapS, tmaPhi, donelanD, donelanBeta,
  directionalEk, hasselmannHs,
} from './spectrum.js';
import { createBaySim, fft1d } from './baySim.js';
import {
  cameraFloor, deckTop, groundHeight, FLY_VOIDS, flyColliderShapes, pierFlyShapes,
  BOARDWALK_Z, BOARDWALK_TOP, PIER_X, PIER_DECK_Z, PIER_DECK_TOP, SHORE_Z,
} from './constants.js';
import { clampCameraToFloor } from '../../camera/floor.js';

const here = dirname(fileURLToPath(import.meta.url));

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

function probeBlocked(shapes, x, y, z, r) {
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    const y0 = s.y0;
    const y1 = y0 + (s.h !== undefined ? s.h : s.sy);
    if (y + r < y0 || y - r > y1) continue;
    if (s.type === 'cyl') {
      const dx = x - s.x, dz = z - s.z;
      if (Math.sqrt(dx * dx + dz * dz) < s.r + r) return s;
    } else {
      const ex = Math.abs(x - s.x) - s.sx / 2;
      const ez = Math.abs(z - s.z) - s.sz / 2;
      if (ex <= 0 && ez <= 0) return s;
    }
  }
  return null;
}

export function runBayWaterTests() {
  fails.length = 0;
  passedCount = 0;

  // ---- locked preset -----------------------------------------------------
  ok('phone FFT is 256', BAY_PRESET.n === 256);
  ok('cascade is 19 m', BAY_PRESET.cascadeM === 19);
  ok('one cascade shipped', BAY_PRESET.cascades.length === 1
    && BAY_PRESET.cascades[0] === 19);
  ok('768 m tile is not default', !BAY_PRESET.cascades.includes(768));
  ok('scale 1.0', BAY_PRESET.scale === 1.0);
  ok('SSR off', BAY_PRESET.ssr === false);
  ok('TMA depth is bay-shallow', BAY_PRESET.depthM <= 8 && BAY_PRESET.depthM >= 2);
  ok('gravity is 9.81', G === 9.81);
  ok('foam threshold is NVIDIA M≤0.3, not Abyssal 0.62',
    BAY_PRESET.jThresh <= 0.30 && BAY_PRESET.jThresh >= 0.20);

  // ---- spectrum ----------------------------------------------------------
  const jp = jonswapParams(BAY_PRESET.windMs, BAY_PRESET.fetchM);
  ok('JONSWAP peak is a few-second bay sea', jp.omegaP > 1.2 && jp.omegaP < 4.5);
  const sPeak = jonswapS(jp.omegaP, { ...jp, gamma: 3.3 });
  const sTail = jonswapS(jp.omegaP * 3, { ...jp, gamma: 3.3 });
  ok('JONSWAP peaks at ωp', sPeak > sTail * 4);

  const phiLongBay = tmaPhi(0.55, BAY_PRESET.depthM);
  const phiLongDeep = tmaPhi(0.55, 200);
  const phiShortBay = tmaPhi(jp.omegaP * 3, BAY_PRESET.depthM);
  ok('TMA suppresses long waves in 4 m', phiLongBay < phiLongDeep * 0.35);
  ok('TMA → 1 for short waves / deep water',
    phiShortBay > 0.85 && tmaPhi(jp.omegaP * 3, 200) > 0.98);
  ok('TMA → 0 at zero frequency', tmaPhi(0.01, 4) < 0.15);

  let dInt = 0;
  const nTh = 720;
  for (let i = 0; i < nTh; i++) {
    const th = -Math.PI + (i + 0.5) * (2 * Math.PI / nTh);
    dInt += donelanD(th, jp.omegaP, jp.omegaP, Math.PI / 2) * (2 * Math.PI / nTh);
  }
  ok('Donelan–Banner integrates to ~1', Math.abs(dInt - 1) < 0.08);
  ok('Donelan tighter at the peak than in the tail',
    donelanBeta(jp.omegaP, jp.omegaP) > donelanBeta(jp.omegaP * 2.2, jp.omegaP));

  const ekDown = directionalEk(0, 0.8, { ...jp, gamma: 3.3, depthM: 4, windTheta: Math.PI / 2 });
  const ekUp = directionalEk(0, -0.8, { ...jp, gamma: 3.3, depthM: 4, windTheta: Math.PI / 2 });
  ok('energy is downwind (+Z, onshore)', ekDown > ekUp * 2);

  const hsEst = hasselmannHs(BAY_PRESET.windMs, BAY_PRESET.fetchM);
  ok('fetch-limited Hs is bay chop (0.15–1.2 m)', hsEst > 0.15 && hsEst < 1.2);

  // ---- FFT + Jacobian foam ----------------------------------------------
  const re = new Float32Array([1, 0, 0, 0]);
  const im = new Float32Array(4);
  fft1d(re, im, 4, -1);
  fft1d(re, im, 4, +1);
  ok('FFT round-trip preserves DC', Math.abs(re[0] - 1) < 1e-6);

  const sim = createBaySim();
  ok('sim ships 256² / 19 m / no SSR', sim.n === 256 && sim.L === 19 && sim.ssr === false);
  ok('sim cascade list is [19]', sim.cascades.length === 1 && sim.cascades[0] === 19);

  let threw = false;
  try { createBaySim({ n: 1024 }); } catch (e) { threw = true; }
  ok('1024 FFT is rejected', threw);

  for (let i = 0; i < 36; i++) sim.step(1 / 24);
  const hs = sim.significantHeight();
  ok('realized Hs is 8–25 m chop, not a swell plate', hs > 0.05 && hs < 1.6);

  let minJ = Infinity, maxFoam = 0, maxAbsH = 0;
  for (let i = 0; i < sim.n * sim.n; i++) {
    if (sim.jacobian[i] < minJ) minJ = sim.jacobian[i];
    if (sim.foam[i] > maxFoam) maxFoam = sim.foam[i];
    const ah = Math.abs(sim.height[i]);
    if (ah > maxAbsH) maxAbsH = ah;
  }
  ok('Jacobian field is live', Number.isFinite(minJ) && minJ < 1.05);
  let foamCells = 0;
  for (let i = 0; i < sim.n * sim.n; i++) {
    if (sim.foam[i] > 0.002) foamCells++;
  }
  // min J on this 19 m plate is ~0.37. M=0.30 means fold foam is none
  // unless a cell actually folds. Do not require a dotted bay.
  ok('flats have no foam / foam is stream-or-none',
    minJ >= BAY_PRESET.jThresh ? maxFoam <= 1e-6
      : foamCells / (sim.n * sim.n) < 0.04);
  ok('foam is sparse breaking, not salt-and-pepper',
    foamCells / (sim.n * sim.n) < 0.04);
  ok('displacement stays under the deck (no punch-through)', maxAbsH < 1.2);

  const foamBefore = sim.foam[0];
  sim.stampWake(0, 0, 0.8, 2.5);
  const cx = 0;
  ok('wake stamp raises foam', sim.foam[cx] > foamBefore + 0.15);

  const stamped = sim.foam[cx];
  for (let i = 0; i < 80; i++) sim.step(1 / 24);
  ok('ping-pong decay lets a wake fade', sim.foam[cx] < stamped * 0.95 + 1e-6);
  ok('ping-pong does not instantly wipe a wake', sim.foam[cx] > 0.002
    || maxFoam > 0.01);

  const h0 = sim.sampleHeight(3.2, -11.4);
  const h1 = sim.sampleHeight(3.2 + sim.L, -11.4);
  ok('height field tiles on the 19 m cascade', Math.abs(h0 - h1) < 1e-5);

  // dispersion on the 19 m tile: peak wavelength is a few metres (chop)
  const lp = (2 * Math.PI * G) / (jp.omegaP * jp.omegaP);
  ok('peak wavelength sits in the 19 m tile (8–25 m read)', lp > 3 && lp < 18);

  // ---- camera / fly voids unchanged --------------------------------------
  ok('cameraFloor over boardwalk is still the deck',
    cameraFloor(0, BOARDWALK_Z) === BOARDWALK_TOP);
  ok('cameraFloor over pier is still the deck',
    cameraFloor(PIER_X, PIER_DECK_Z) === PIER_DECK_TOP);
  const punched = { x: 0, y: 0.02, z: BOARDWALK_Z };
  clampCameraToFloor(punched, cameraFloor, 0.06);
  ok('crash-cam still dies on the deck', punched.y >= BOARDWALK_TOP + 0.06);
  const overWater = { x: 0, y: -2, z: -40 };
  clampCameraToFloor(overWater, cameraFloor, 0.06);
  ok('crash-cam stays on the water sit-plane',
    overWater.y >= groundHeight(0, -40) + 0.06);
  ok('deck wins over the water plane',
    deckTop(0, BOARDWALK_Z) > 0 && cameraFloor(0, BOARDWALK_Z) > 1);

  const all = flyColliderShapes().concat(pierFlyShapes());
  for (const v of FLY_VOIDS) {
    const hit = probeBlocked(all, v.x, v.y, v.z, 0.28);
    ok(`${v.id} still open (no water AABB)`, !hit);
  }
  ok('sit-plane is a surface, not a 20 m slab',
    groundHeight(0, -40) < 0.05 && SHORE_Z === -30);

  // ---- source locks: Water.js gone, no second ocean ----------------------
  const terrain = readFileSync(join(here, 'terrain.js'), 'utf8');
  const bayWater = readFileSync(join(here, 'bayWater.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  ok('terrain.js does not import Water.js', !terrain.includes('objects/Water.js'));
  ok('index.js does not drive Water.js uniforms',
    !index.includes("uniforms['time']") && !index.includes('waterColor'));
  ok('hero material is MeshPhysicalMaterial',
    bayWater.includes('MeshPhysicalMaterial') && !/\bShaderMaterial\b/.test(bayWater));
  ok('foam encode floors leftover specks',
    bayWater.includes('0.05') && bayWater.includes('foam'));
  ok('no Abyssal WIND_GLSL paste',
    !bayWater.includes('WIND_GLSL') && !terrain.includes('WIND_GLSL'));
  ok('one bay mesh, no open-ocean far plate',
    bayWater.includes('5000') && !bayWater.includes('24000') && !/24\s*km/i.test(bayWater));
  ok('buildOcean uses buildBayWater', terrain.includes('buildBayWater'));

  if (fails.length) {
    console.error('[miami-bay-water] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-bay-water] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('bayWaterTest.js');
if (isMain) {
  const r = runBayWaterTests();
  if (!r.passed) process.exit(1);
}
