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
import {
  BAY_PLANE, FOAM_N, RIP_CTRL, SHORE_WAVES, encodeShoreFoam, foamTermAt,
} from './bayWater.js';

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
  ok('fold foam is off on this plate (no M hunt)',
    BAY_PRESET.foamGain === 0);

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

  let minJ = Infinity, maxAbsH = 0;
  for (let i = 0; i < sim.n * sim.n; i++) {
    if (sim.jacobian[i] < minJ) minJ = sim.jacobian[i];
    const ah = Math.abs(sim.height[i]);
    if (ah > maxAbsH) maxAbsH = ah;
  }
  ok('Jacobian field is live', Number.isFinite(minJ) && minJ < 1.05);
  ok('19 m plate never Tessendorf-folds', minJ > 0);
  let foamCells = 0;
  for (let i = 0; i < sim.n * sim.n; i++) {
    if (sim.foam[i] > 0.002) foamCells++;
  }
  // Fold paint is off. Do not require maxFoam > 0.02 or a dotted bay.
  ok('flats have no foam', foamCells === 0);
  ok('fold foam is off on this plate', foamCells === 0);
  ok('displacement stays under the deck (no punch-through)', maxAbsH < 1.2);

  const foamBefore = sim.foam[0];
  sim.stampWake(0, 0, 0.8, 2.5);
  const cx = 0;
  ok('wake stamp raises foam', sim.foam[cx] > foamBefore + 0.15);

  const stamped = sim.foam[cx];
  for (let i = 0; i < 8; i++) sim.step(1 / 24);
  ok('ping-pong does not instantly wipe a wake', sim.foam[cx] > stamped * 0.2);
  for (let i = 0; i < 72; i++) sim.step(1 / 24);
  ok('ping-pong decay lets a wake fade', sim.foam[cx] < stamped * 0.95 + 1e-6);

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

  // ---- extra TERM: depth-break + one Catmull-Rom rip ---------------------
  ok('rip has four signed-frame ctrl points', RIP_CTRL.length === 4);
  ok('rip mouth is on the signed shore',
    RIP_CTRL[0].x === 0 && RIP_CTRL[0].z === SHORE_Z && SHORE_Z === -30);
  ok('rip ctrl 1 is BAY_W/80 , SHORE_Z - BAY_D/24',
    RIP_CTRL[1].x === 5000 / 80 && RIP_CTRL[1].z === SHORE_Z - 3600 / 24);
  ok('rip ctrl 2 is -BAY_W/100 , SHORE_Z - BAY_D/10',
    RIP_CTRL[2].x === -5000 / 100 && RIP_CTRL[2].z === SHORE_Z - 3600 / 10);
  ok('rip ctrl 3 is BAY_W/160 , SHORE_Z - BAY_D/6',
    RIP_CTRL[3].x === 5000 / 160 && RIP_CTRL[3].z === SHORE_Z - 3600 / 6);
  ok('rip runs seaward of SHORE_Z',
    RIP_CTRL.every((p, i) => i === 0 || p.z < SHORE_Z)
    && RIP_CTRL[3].z < RIP_CTRL[0].z);

  const H = 0.22;
  ok('inland z>+0 is dry',
    foamTermAt(0, 2, H) === 0
    && foamTermAt(400, 8, H) === 0
    && foamTermAt(-120, 40, H) === 0
    && foamTermAt(RIP_CTRL[0].x, 1, H) === 0);
  ok('z=0 edge is dry', foamTermAt(0, 0.01, H) === 0);

  const zBreak = SHORE_Z - 16;
  let bandMax = 0;
  let bandHits = 0;
  for (let x = 280; x <= 280 + 19 * 8; x += 4) {
    const f = foamTermAt(x, zBreak, H);
    if (f > bandMax) bandMax = f;
    if (f > 0.04) bandHits++;
  }
  ok('depth-gated crash exists seaward of SHORE_Z', bandMax > 0.08);
  ok('crash band is continuous, not 19 m specks', bandHits >= 12);
  ok('crash is depth-gated off the flats',
    foamTermAt(400, -900, H) === 0
    && foamTermAt(400, -2000, H) === 0
    && foamTermAt(400, SHORE_Z + 8, H) === 0);

  const ripMid = RIP_CTRL[1];
  const onRip = foamTermAt(ripMid.x, ripMid.z, H);
  const offRip19 = foamTermAt(ripMid.x + 19, ripMid.z, H);
  const offRip38 = foamTermAt(ripMid.x + 38, ripMid.z, H);
  ok('rip foam exists on the channel', onRip > 0.08);
  ok('rip foam is not a 19 m period',
    onRip > offRip19 * 2 && onRip > offRip38 * 2);

  const zA = SHORE_Z - 80;
  const zB = zA - 19;
  const zC = zA - 38;
  const fA = foamTermAt(0, zA, H);
  const fB = foamTermAt(0, zB, H);
  const fC = foamTermAt(0, zC, H);
  ok('x=0 seaward of the mouth is not a 19 m foam lattice',
    !(Math.abs(fA - fB) < 1e-6 && Math.abs(fB - fC) < 1e-6 && fA > 0.05));

  const foamBytes = new Uint8Array(FOAM_N * FOAM_N * 4);
  encodeShoreFoam(sim, foamBytes);
  const foamAtWorld = (x, z) => {
    const u = (x - BAY_PLANE.x) / BAY_PLANE.w + 0.5;
    const v = (BAY_PLANE.z - z) / BAY_PLANE.d + 0.5;
    const i = Math.min(FOAM_N - 1, Math.max(0, Math.floor(u * FOAM_N)));
    const j = Math.min(FOAM_N - 1, Math.max(0, Math.floor(v * FOAM_N)));
    return foamBytes[(j * FOAM_N + i) * 4];
  };
  ok('encoded inland z>+0 is 0',
    foamAtWorld(0, 12) === 0
    && foamAtWorld(200, 40) === 0
    && foamAtWorld(-80, 6) === 0);
  ok('encoded crash band is live', foamAtWorld(360, zBreak) > 4);
  ok('encoded rip is live', foamAtWorld(ripMid.x, ripMid.z) > 4);
  ok('encoded deep flats stay 0', foamAtWorld(800, -2200) === 0);
  ok('foam map is plate-scale, not 256² cascade', FOAM_N === 512);

  // ---- source locks: Water.js gone, no second ocean ----------------------
  const terrain = readFileSync(join(here, 'terrain.js'), 'utf8');
  const bayWater = readFileSync(join(here, 'bayWater.js'), 'utf8');
  const baySimSrc = readFileSync(join(here, 'baySim.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');
  ok('terrain.js does not import Water.js', !terrain.includes('objects/Water.js'));
  ok('index.js does not drive Water.js uniforms',
    !index.includes("uniforms['time']") && !index.includes('waterColor'));
  ok('hero material is MeshPhysicalMaterial',
    bayWater.includes('MeshPhysicalMaterial') && !/\bShaderMaterial\b/.test(bayWater));
  ok('coastal optics inject via onBeforeCompile',
    bayWater.includes('applyCoastalOptics') && bayWater.includes('onBeforeCompile')
    && bayWater.includes('uBayTime'));
  ok('Gerstner bands are not the 19 m cascade',
    SHORE_WAVES.length === 4
    && SHORE_WAVES.every((L) => L !== 19)
    && SHORE_WAVES[0] === 13.7 && SHORE_WAVES[1] === 8.3
    && SHORE_WAVES[2] === 37.1 && SHORE_WAVES[3] === 61.3);
  ok('shader source names the incommensurate wavelengths',
    bayWater.includes('13.7') && bayWater.includes('8.3')
    && bayWater.includes('37.1') && bayWater.includes('61.3'));
  ok('cellular foam is plate-space, not the cascade',
    bayWater.includes('cellular') && bayWater.includes('3.2'));
  ok('foam encode floors leftover specks',
    bayWater.includes('0.05') && bayWater.includes('foam'));
  ok('Jacobian J<M paint is skipped',
    baySimSrc.includes('const fold = 0') && !baySimSrc.includes('jacobian[idx] < jThresh'));
  ok('no Abyssal WIND_GLSL paste',
    !bayWater.includes('WIND_GLSL') && !terrain.includes('WIND_GLSL'));
  ok('one bay mesh, no open-ocean far plate',
    bayWater.includes('5000') && !bayWater.includes('24000') && !/24\s*km/i.test(bayWater));
  ok('one biscayne-bay mesh, no second ocean',
    bayWater.includes("'biscayne-bay'")
    && (bayWater.match(/new THREE\.Mesh\(/g) || []).length === 1
    && !bayWater.includes('768')
    && !/objects\/Water\.js/.test(bayWater));
  ok('SHORE_Z + Catmull-Rom rip are in the encode',
    bayWater.includes('SHORE_Z')
    && /CatmullRomCurve3/.test(bayWater)
    && /Catmull-Rom/.test(bayWater));
  ok('fold foamGain stays 0 — not turned back on',
    /foamGain:\s*0/.test(readFileSync(join(here, 'spectrum.js'), 'utf8'))
    && BAY_PRESET.foamGain === 0
    && !/foamGain\s*=\s*[1-9]/.test(bayWater));
  ok('foamMap does not RepeatWrap the 19 m cascade',
    !/applyRepeat\(\s*foamMap/.test(bayWater)
    && /foamMap\.repeat\.set\(\s*1\s*,\s*1/.test(bayWater)
    && /ClampToEdgeWrapping/.test(bayWater));
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
