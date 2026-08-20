// Headless checks for the signed Ocean Drive curb roll.
// No three.js, no game state, no ped.js / traffic.js.
//
//   node ./js/world/vehiclesTest.js
//   node ./tools/run-vehicles-test.mjs

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

function loadFleetMotion() {
  const src = readFileSync(join(here, 'vehicles.js'), 'utf8');
  const start = src.indexOf('// ---- Ocean Drive curb roll');
  const end = src.indexOf('// ---------------- small geometry helpers');
  if (start < 0 || end < 0 || end <= start) throw new Error('fleet motion block missing');
  const block = src.slice(start, end).replace(/\bexport\s+/g, '');
  return new Function(`${block}
    return {
      FLEET_ROLL_I, FLEET_BUS_I, FLEET_X0, FLEET_DX, FLEET_N,
      FLEET_WRAP0, FLEET_WRAP_SPAN, FLEET_CROSS_X, FLEET_ZEBRA_HALF,
      FLEET_HOLD, FLEET_SPEED_MIN, FLEET_SPEED_MAX,
      FLEET_LANE_BEACH_Z, FLEET_LANE_CITY_Z,
      fleetIsRoller, fleetLaneOf, fleetCrawlSpeed, fleetWrapX,
      fleetStopAhead, stepFleetRoller,
    };`)();
}

function walkJs(dir, out = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) walkJs(p, out);
    else if (name.name.endsWith('.js')) out.push(p);
  }
  return out;
}

export function runVehiclesTests() {
  fails.length = 0;
  passedCount = 0;

  const M = loadFleetMotion();
  const vehicles = readFileSync(join(here, 'vehicles.js'), 'utf8');
  const street = readFileSync(join(here, 'miami/street.js'), 'utf8');
  const index = readFileSync(join(here, 'miami/index.js'), 'utf8');
  const road = readFileSync(join(here, 'miami/road.js'), 'utf8');

  // ---- signed fold -------------------------------------------------------
  ok('eight curb indices', M.FLEET_ROLL_I.length === 8
    && M.FLEET_ROLL_I.join() === '3,6,11,14,19,22,27,30');
  ok('bus 16 is not a roller', M.FLEET_BUS_I === 16 && !M.fleetIsRoller(16)
    && !M.FLEET_ROLL_I.includes(16));
  ok('odds +X on z=39.5', [3, 11, 19, 27].every((i) => {
    const L = M.fleetLaneOf(i);
    return L.z === 39.5 && L.rotY === 0 && L.dir === 1;
  }));
  ok('evens −X on z=48.5', [6, 14, 22, 30].every((i) => {
    const L = M.fleetLaneOf(i);
    return L.z === 48.5 && L.rotY === Math.PI && L.dir === -1;
  }));
  ok('crawl 6–8 m/s', M.FLEET_ROLL_I.every((i) => {
    const s = M.fleetCrawlSpeed(i);
    return s >= 6 && s <= 8;
  }));
  ok('only CROSS_X −129 / 57', M.FLEET_CROSS_X.join() === '-129,57');
  ok('hold is ~2s', M.FLEET_HOLD === 2);
  ok('wrap is the 34-spot lattice', M.FLEET_X0 === -560 && M.FLEET_DX === 34
    && M.FLEET_N === 34 && M.FLEET_WRAP_SPAN === 34 * 34);

  // ---- motion: stay on ribbon, stop at zebra, wrap ------------------------
  const zebra = 3.6;
  ok('zebra half matches road.js 3.6 m bars',
    road.includes('BoxGeometry(3.6,') && M.FLEET_ZEBRA_HALF === zebra / 2);

  for (const i of M.FLEET_ROLL_I) {
    const L = M.fleetLaneOf(i);
    const st = {
      x: M.FLEET_X0 + i * M.FLEET_DX,
      hold: 0,
      dir: L.dir,
      speed: M.fleetCrawlSpeed(i),
      z: L.z,
      rotY: L.rotY,
    };
    const x0 = st.x;
    M.stepFleetRoller(st, 0.05);
    ok(`i=${i} rolled along X`, Math.abs(st.x - (x0 + L.dir * st.speed * 0.05)) < 1e-9);
    ok(`i=${i} lane z locked`, st.z === L.z);
    ok(`i=${i} rotY locked`, st.rotY === L.rotY);
  }

  // +X car approaching −129: stop at near (west) zebra edge, hold 2s, then go
  {
    const stop = -129 - M.FLEET_ZEBRA_HALF;
    const st = { x: stop - 1.0, hold: 0, dir: 1, speed: 7, z: 39.5, rotY: 0 };
    M.stepFleetRoller(st, 0.2);                       // 1.4 m would overshoot
    ok('+X stops at −129 near edge', Math.abs(st.x - stop) < 1e-9 && st.hold === 2);
    const held = { ...st };
    M.stepFleetRoller(held, 1.5);
    ok('+X holds through 1.5s', Math.abs(held.x - stop) < 1e-9 && held.hold > 0);
    M.stepFleetRoller(st, 2.0);
    ok('+X still on the line at hold end', Math.abs(st.x - stop) < 1e-9 && st.hold === 0);
    M.stepFleetRoller(st, 0.1);
    ok('+X continues through the zebra', st.x > stop && st.x < -129 + M.FLEET_ZEBRA_HALF + 2);
    ok('+X stayed on beach lane', st.z === 39.5);
  }

  // −X car approaching 57: stop at near (east) zebra edge
  {
    const stop = 57 + M.FLEET_ZEBRA_HALF;
    const st = { x: stop + 0.8, hold: 0, dir: -1, speed: 6.5, z: 48.5, rotY: Math.PI };
    M.stepFleetRoller(st, 0.2);
    ok('−X stops at 57 near edge', Math.abs(st.x - stop) < 1e-9 && st.hold === 2);
    M.stepFleetRoller(st, 2.05);
    M.stepFleetRoller(st, 0.1);
    ok('−X continues west through 57', st.x < stop && st.x > 57 - 4);
    ok('−X stayed on city lane', st.z === 48.5);
  }

  {
    const wrapped = M.fleetWrapX(-560 + 34 * 34 + 3);
    ok('wrap east → west lattice', Math.abs(wrapped - (-560 + 3)) < 1e-9);
    const back = M.fleetWrapX(-560 - 5);
    ok('wrap west → east lattice', Math.abs(back - (-560 + 34 * 34 - 5)) < 1e-9);
  }

  // long crawl stays inside ROAD_Z0–Z1 lanes and the wrap ribbon
  for (const i of M.FLEET_ROLL_I) {
    const L = M.fleetLaneOf(i);
    const st = {
      x: M.FLEET_X0 + i * M.FLEET_DX, hold: 0,
      dir: L.dir, speed: M.fleetCrawlSpeed(i), z: L.z, rotY: L.rotY,
    };
    let leftLane = false, leftRibbon = false, missedHold = false;
    for (let t = 0; t < 400; t++) {
      const before = st.x;
      M.stepFleetRoller(st, 0.25);
      if (st.z !== L.z) leftLane = true;
      if (st.x < M.FLEET_WRAP0 - 1e-6 || st.x > M.FLEET_WRAP0 + M.FLEET_WRAP_SPAN + 1e-6) {
        leftRibbon = true;
      }
      for (const cx of M.FLEET_CROSS_X) {
        const edge = cx - L.dir * M.FLEET_ZEBRA_HALF;
        const crossed = L.dir > 0
          ? before < edge && st.x > edge + 0.05
          : before > edge && st.x < edge - 0.05;
        if (crossed && st.hold <= 0 && Math.abs(before - edge) > 0.01) missedHold = true;
      }
    }
    ok(`i=${i} never left z lane`, !leftLane);
    ok(`i=${i} stayed on the 34-spot ribbon`, !leftRibbon);
    ok(`i=${i} did not skip a zebra without holding`, !missedHold);
  }

  // ---- wire-up / fail bars ----------------------------------------------
  ok('vehicles.js owns update(dt)', /function update\s*\(\s*dt\s*\)/.test(vehicles)
    && vehicles.includes('stepFleetRoller')
    && /return \{ group, placeAt, finalize, update, dispose \}/.test(vehicles));
  ok('miami update hooks the fleet', index.includes('street.fleet?.update?.(dt)'));
  ok('street drops roller colliders', street.includes('fleetIsRoller')
    && street.includes('if (!fleetIsRoller(i)) addCollider'));
  ok('no ped.js / traffic.js engine',
    !existsSync(join(here, 'ped.js')) && !existsSync(join(here, 'traffic.js'))
    && !existsSync(join(here, 'miami/ped.js')) && !existsSync(join(here, 'miami/traffic.js')));
  ok('PAINT factory list not restacked',
    vehicles.includes('0x3cb7ab') && vehicles.includes('Tropical')
    && (vehicles.match(/0x[0-9a-f]{6}, \/\/ /g) || []).length >= 12);
  ok('no photo-mode / colony HUD',
    !vehicles.includes('photo-mode') && !vehicles.includes('photoMode')
    && !vehicles.includes('colony HUD') && !vehicles.includes('colonyHud'));

  const worldJs = walkJs(here);
  ok('no new ped/traffic modules under world/',
    !worldJs.some((p) => /(?:^|\/)(?:ped|traffic)\.js$/.test(p)));

  if (fails.length) {
    console.error('[vehicles] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[vehicles] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('vehiclesTest.js');
if (isMain) {
  const r = runVehiclesTests();
  if (!r.passed) process.exit(1);
}
