// Headless source-locks for inland six-sided mid-rises + alley pipes.
// No three.js, no game state.
//
//   node ./tools/run-miami-inland-test.mjs

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INLAND_MIDRISE_W, INLAND_MIDRISE_D, INLAND_MIDRISE_H, INLAND_MIDRISE_CELLS,
  inlandMidrises, ALLEY_PIPE_CELLS, FLY_VOIDS, inKeepout, inReserved,
  COURT_WELL_CELLS, COURT_WELL_W, COURT_WELL_D, isCourtWellCell,
  INLAND_ARCADE_CELLS, INLAND_ARCADE_SOFFIT, INLAND_ARCADE_OPEN_W, isInlandArcadeCell, inlandArcadeGeom, courtWellGeom,
  leftoverLotOverlap, streetOverlap, helipadOverlap, inHelipadReserved,
  WASH_X0, WASH_Z0, WASH_Z1,
  FIRE_ESCAPE_CELLS, FIRE_ESCAPE_Z, FIRE_ESCAPE_POST_H, FIRE_ESCAPE_HALF_Z,
  ALLEY_DUMPSTER_CELLS, ALLEY_DOCK_CELLS,
  ALLEY_DUMP_W, ALLEY_DUMP_D, ALLEY_DOCK_W, ALLEY_DOCK_D,
  ALLEY_LAMP_CELLS, ALLEY_LAMP_H, ALLEY_LAMP_R, alleyLampGeom,
  alleySolidHitsWhoop,
  CITY_Y,
  LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D,
  LEFTOVER_LOT_B_X, LEFTOVER_LOT_H_X,
  ROOF_AC_CELLS, ROOF_RING_CELLS, ROOF_AC_CLEAR, ROOF_AC_H,
  ROOF_RING_R, ROOF_RING_TUBE, flyColliderShapes,
} from './constants.js';

const here = dirname(fileURLToPath(import.meta.url));
const TRAVEL_Z0 = 40.2;
const TRAVEL_Z1 = 47.8;

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

export function runMiamiInlandTests() {
  fails.length = 0;
  passedCount = 0;

  const inland = readFileSync(join(here, 'landmarks/inland.js'), 'utf8');
  const buildings = readFileSync(join(here, 'buildings.js'), 'utf8');
  const kenney = readFileSync(join(here, 'kenneyDressing.js'), 'utf8');
  const index = readFileSync(join(here, 'index.js'), 'utf8');

  ok('inland.js exists', existsSync(join(here, 'landmarks/inland.js')));
  ok('hash01 only — no layout rng',
    inland.includes('hash01')
    && !/\brng2?\s*\(/.test(inland)
    && !/\brng3\s*\(/.test(inland)
    && !/\brng4\s*\(/.test(inland));
  ok('six-sided deco helper + rooftop kits',
    inland.includes('buildDecoMidriseGeos')
    && inland.includes('buildRooftopKitGeo')
    && inland.includes('buildRooftopDishGeo')
    && inland.includes('buildRooftopTankGeo')
    && inland.includes('buildRoofAcUnitGeo'));
  ok('no ShaderMaterial / ped / traffic',
    !inland.includes('ShaderMaterial')
    && !inland.includes('ped.js') && !inland.includes('traffic.js'));
  ok('inland windows glow warm after dusk via regDN, not ShaderMaterial',
    inland.includes('regDN') && inland.includes('emissiveMap')
    && inland.includes('0xffb060') && inland.includes('2.45')
    && !inland.includes('ShaderMaterial')
    && !/\brng2?\s*\(/.test(inland));
  ok('index calls buildInland after espa, before flythrough',
    index.includes('buildInland(ctx)')
    && index.indexOf('buildInland(ctx)') > index.indexOf('buildEspa(ctx)')
    && index.indexOf('buildInland(ctx)') < index.indexOf('buildFlythrough(ctx)'));
  ok('rooftop kit geos stay exported from buildings.js',
    buildings.includes('export function buildRooftopKitGeo')
    && buildings.includes('export function buildRooftopDishGeo')
    && buildings.includes('export function buildRooftopTankGeo'));
  ok('backdrop 60-box contract untouched',
    buildings.includes('for (let i = 0; i < 60; i++)'));
  ok('far Kenney gained midrise_c behind the 60-box LOD',
    kenney.includes('kenney_midrise_c') && kenney.includes('640 + hash01'));

  ok('signed plates west of 240',
    INLAND_MIDRISE_CELLS.length === 66
    && INLAND_MIDRISE_W === 18 && INLAND_MIDRISE_D === 14 && INLAND_MIDRISE_H >= 28
    && INLAND_MIDRISE_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1 && z < 300)
    && INLAND_MIDRISE_CELLS.filter(([x]) => x < -430).length >= 4
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -720 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -720 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -660 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -660 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -660 && z === 152)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -540 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === 210 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -600 && z === 237)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -600 && z === 259)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -250 && z === 152)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === 90 && z === 210)
    && INLAND_MIDRISE_CELLS.filter(([, z]) => z === 96).length === 7
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -660 && z === 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -600 && z === 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -190 && z === 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === 210 && z === 96)
    && INLAND_MIDRISE_CELLS.filter(([, z]) => z === 96).every(([x]) => x < 240 && x !== -430
      && (x < -112 || x === 210))
    && INLAND_MIDRISE_CELLS.filter(([, z]) => z === 128).length === 6
    && INLAND_MIDRISE_CELLS.filter(([, z]) => z === 128).every(([x]) => x < 240 && x !== -430
      && x !== -250 && x < -112)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -720 && z === 128)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -190 && z === 128)
    && INLAND_MIDRISE_CELLS.filter(([, z]) => z === 196).length === 4
    && INLAND_MIDRISE_CELLS.filter(([, z]) => z === 196).every(([x]) => x < WASH_X0 && x < 240)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -720 && z === 196)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -540 && z === 196));

  const plates = inlandMidrises();
  ok('geom count matches cells', plates.length === 66);
  ok('x=-720 skyline pair stays on 1500 m city plate',
    plates.filter((g) => g.x === -720 && (g.z === 237 || g.z === 259)).length === 2
    && plates.some((g) => g.x === -720 && g.z === 237)
    && plates.some((g) => g.x === -720 && g.z === 259)
    && plates.filter((g) => g.x === -720).every((g) => g.x0 > -750 && g.x0 === -729
      && g.x1 === -711 && g.w === 18 && g.d === 14 && g.x1 + 0.8 < 240));
  ok('helipad W reserved still signed',
    inHelipadReserved(-430, 100) && helipadOverlap(-430, 101, 44, 54, 0.15));
  for (let i = 0; i < plates.length; i++) {
    const g = plates[i];
    ok(`${g.id} reserved + keepout west of 240`,
      g.x1 + 0.8 < 240 && inReserved(g.x, g.z) && inKeepout(g.x, g.z));
    ok(`${g.id} misses leftoverLot / street / travel / helipad W`,
      leftoverLotOverlap(g.x, g.z, g.w, g.d, 0.15) === false
      && streetOverlap(g.x, g.z, g.w, g.d) === false
      && helipadOverlap(g.x, g.z, g.w, g.d, 0.15) === false
      && g.z0 > TRAVEL_Z1 && g.z1 < 300
      && !(g.z0 < TRAVEL_Z1 && g.z1 > TRAVEL_Z0));
  }

  ok('ten inland alley pipes at z=248',
    ALLEY_PIPE_CELLS.filter(([, z]) => z === 248).length === 10);
  ok('five alley pipes between z=210 fill and z=237 skyline',
    ALLEY_PIPE_CELLS.filter(([, z]) => z === 223).length === 5);
  ok('two alley pipes at z=181 west of Washington reserved',
    ALLEY_PIPE_CELLS.filter(([, z]) => z === 181).length === 2
    && ALLEY_PIPE_CELLS.filter(([, z]) => z === 181).every(([x]) => x < WASH_X0 && x < 240)
    && ALLEY_PIPE_CELLS.some(([x, z]) => x === -600 && z === 181)
    && ALLEY_PIPE_CELLS.some(([x, z]) => x === -540 && z === 181)
    && ALLEY_PIPE_CELLS.length === 21);
  for (const [x, z] of ALLEY_PIPE_CELLS.filter(([, zz]) => zz === 181)) {
    const v = FLY_VOIDS.find((f) => f.x === x && f.z === z && String(f.id).startsWith('alley-pipe-'));
    ok(`pipe ${x}/${z} void + keepout, misses WASH / leftoverLot / street / travel`,
      !!v && inKeepout(x, z) && x < 240 && x < WASH_X0
      && leftoverLotOverlap(x, z, 2.4, 2.6, 0.15) === false
      && streetOverlap(x, z, 0.4, 2.6) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)
      && !(x >= WASH_X0 && z > WASH_Z0 && z < WASH_Z1));
  }
  for (const [x, z] of ALLEY_PIPE_CELLS.filter(([, zz]) => zz === 248)) {
    const v = FLY_VOIDS.find((f) => f.x === x && f.z === z && String(f.id).startsWith('alley-pipe-'));
    ok(`pipe ${x}/${z} void + keepout`, !!v && inKeepout(x, z) && x < 240);
    ok(`pipe ${x}/${z} misses leftoverLot / street`,
      leftoverLotOverlap(x, z, 2.4, 2.6, 0.15) === false
      && streetOverlap(x, z, 0.4, 2.6) === false);
  }

  ok('eight fire-escape frames on mid-rise flanks at z=248',
    FIRE_ESCAPE_CELLS.length === 8 && FIRE_ESCAPE_Z === 248
    && FIRE_ESCAPE_POST_H >= 3.2
    && FIRE_ESCAPE_HALF_Z * 2 - 0.16 >= 1.15
    && FIRE_ESCAPE_CELLS.every(([x, z]) => x < 240 && z === 248 && x < 251));
  const fly = readFileSync(join(here, 'landmarks/flythrough.js'), 'utf8');
  ok('flythrough builds fire-escape jambs, no layout rng',
    fly.includes('FIRE_ESCAPE_CELLS') && fly.includes('buildFireEscape')
    && fly.includes("setTag('fire-escape')")
    && !/\brng2?\s*\(/.test(fly) && !/\brng3\s*\(/.test(fly) && !/\brng4\s*\(/.test(fly));
  for (let i = 0; i < FIRE_ESCAPE_CELLS.length; i++) {
    const [x, z] = FIRE_ESCAPE_CELLS[i];
    const v = FLY_VOIDS.find((f) => f.id === `fire-escape-${i}`);
    ok(`fire-escape-${i} void + keepout west of 240`,
      !!v && v.x === x && v.z === z && inKeepout(x, z) && inReserved(x, z)
      && x < 240 && v.openH >= 2 && v.openW >= 1.15);
    ok(`fire-escape-${i} misses leftoverLot / street / travel`,
      leftoverLotOverlap(x, z, 2.4, 2.6, 0.15) === false
      && streetOverlap(x, z, 0.4, 2.6) === false
      && z > TRAVEL_Z1);
  }

  ok('four signed alley dumpsters + four loading docks at z=248',
    ALLEY_DUMPSTER_CELLS.length === 4 && ALLEY_DOCK_CELLS.length === 4
    && ALLEY_DUMPSTER_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1 && z < 252)
    && ALLEY_DOCK_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1 && x < 251));
  ok('inland.js builds alley dumpsters, hash01, no layout rng',
    inland.includes('ALLEY_DUMPSTER_CELLS') && inland.includes('ALLEY_DOCK_CELLS')
    && inland.includes('inland-alley-dumpsters')
    && inland.includes('alleySolidHitsWhoop')
    && !/\brng2?\s*\(/.test(inland) && !/\brng3\s*\(/.test(inland)
    && !/\brng4\s*\(/.test(inland));
  for (let i = 0; i < ALLEY_DUMPSTER_CELLS.length; i++) {
    const [x, z] = ALLEY_DUMPSTER_CELLS[i];
    ok(`dumpster ${x}/${z} misses leftoverLot / street / travel / whoops`,
      leftoverLotOverlap(x, z, ALLEY_DUMP_W, ALLEY_DUMP_D, 0.15) === false
      && streetOverlap(x, z, ALLEY_DUMP_W, ALLEY_DUMP_D) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)
      && alleySolidHitsWhoop(x, z, ALLEY_DUMP_W, ALLEY_DUMP_D) === false
      && x < 240);
  }
  for (let i = 0; i < ALLEY_DOCK_CELLS.length; i++) {
    const [x, z] = ALLEY_DOCK_CELLS[i];
    ok(`dock ${x}/${z} misses leftoverLot / street / travel / whoops`,
      leftoverLotOverlap(x, z, ALLEY_DOCK_W, ALLEY_DOCK_D, 0.15) === false
      && streetOverlap(x, z, ALLEY_DOCK_W, ALLEY_DOCK_D) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)
      && alleySolidHitsWhoop(x, z, ALLEY_DOCK_W, ALLEY_DOCK_D) === false
      && x < 240);
  }

  ok('ten signed alley goosenecks at z=248',
    ALLEY_LAMP_CELLS.length === 10 && ALLEY_LAMP_H >= 3.6 && ALLEY_LAMP_R <= 0.14
    && ALLEY_LAMP_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1 && z < 252)
    && ALLEY_LAMP_CELLS.filter(([x]) => x < -500).length === 2);
  ok('inland.js builds alley goosenecks, night head via regDN, no layout rng',
    inland.includes('ALLEY_LAMP_CELLS') && inland.includes('inland-alley-lamps')
    && inland.includes('alleySolidHitsWhoop') && inland.includes('0xffd27a')
    && inland.includes('regDN') && inland.includes('2.4')
    && !inland.includes('ShaderMaterial')
    && !/\brng2?\s*\(/.test(inland) && !/\brng3\s*\(/.test(inland)
    && !/\brng4\s*\(/.test(inland));
  for (let i = 0; i < ALLEY_LAMP_CELLS.length; i++) {
    const [x, z] = ALLEY_LAMP_CELLS[i];
    const g = alleyLampGeom(x, z);
    ok(`lamp ${x}/${z} misses leftoverLot / street / travel / whoops`,
      leftoverLotOverlap(x, z, 0.4, 0.4, 0.15) === false
      && streetOverlap(x, z, 0.4, 0.4) === false
      && !(z > TRAVEL_Z0 && z < TRAVEL_Z1)
      && alleySolidHitsWhoop(x, z, 0.4, 0.4) === false
      && x < 240 && g.arm > 0.8
      && ((z < 248 && g.yaw === 0) || (z > 248 && g.yaw === Math.PI)));
  }

  ok('nine courtyard drop-wells, fly −Y, west of leftoverLot',
    COURT_WELL_CELLS.length === 17 && COURT_WELL_W >= 6 && COURT_WELL_D >= 6
    && COURT_WELL_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1
      && (z === 96 || z === 152 || z === 210 || z === 196 || z === 128)
      && isCourtWellCell(x, z)
      && courtWellGeom(x, z, 't').fly === '-Y'
      && INLAND_MIDRISE_CELLS.some(([mx, mz]) => mx === x && mz === z)
      && !ROOF_AC_CELLS.some(([rx, rz]) => rx === x && rz === z)
      && !INLAND_ARCADE_CELLS.some(([ax, az]) => ax === x && az === z))
    && COURT_WELL_CELLS.some(([x, z]) => x === -390 && z === 152)
    && COURT_WELL_CELLS.some(([x, z]) => x === 210 && z === 210)
    && COURT_WELL_CELLS.some(([x, z]) => x === -160 && z === 152)
    && COURT_WELL_CELLS.some(([x, z]) => x === 130 && z === 152)
    && COURT_WELL_CELLS.some(([x, z]) => x === -660 && z === 210)
    && COURT_WELL_CELLS.some(([x, z]) => x === -660 && z === 196)
    && COURT_WELL_CELLS.some(([x, z]) => x === -160 && z === 210)
    && COURT_WELL_CELLS.some(([x, z]) => x === -720 && z === 128)
    && COURT_WELL_CELLS.some(([x, z]) => x === -600 && z === 128)
    && COURT_WELL_CELLS.some(([x, z]) => x === -190 && z === 128)
    && COURT_WELL_CELLS.some(([x, z]) => x === -390 && z === 96)
    && COURT_WELL_CELLS.some(([x, z]) => x === -250 && z === 96)
    && COURT_WELL_CELLS.filter(([, z]) => z === 96).length === 2
    && !COURT_WELL_CELLS.some(([x, z]) => x === 210 && z === 96)
    && !isCourtWellCell(210, 96));
  ok('east z=96 plate skips court well because arcade occupies',
    isInlandArcadeCell(210, 96)
    && !isCourtWellCell(210, 96)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === 210 && z === 96)
    && leftoverLotOverlap(210, 96, 18, 14, 0.15) === false
    && 210 < 240 && 210 < 251
    && !FLY_VOIDS.some((f) => String(f.id).startsWith('court-well-') && f.x === 210 && f.z === 96)
    && FLY_VOIDS.some((f) => String(f.id).startsWith('inland-arcade-') && f.x === 210 && f.z === 96));
  ok('inland.js hollows court wells, no layout rng',
    inland.includes('isCourtWellCell') && inland.includes('COURT_WELL_W')
    && inland.includes('isInlandArcadeCell')
    && inland.includes('addCollider') && !/\brng2?\s*\(/.test(inland));
  ok('z=210/152/96/128 ground-floor arcades, fly ±Z, jambs only',
    INLAND_ARCADE_CELLS.length === 23
    && INLAND_ARCADE_SOFFIT >= 3.2 && INLAND_ARCADE_OPEN_W >= 4
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 210).length === 4
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 152).length === 5
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 96).length === 4
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 237).length === 4
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 259).length === 1
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 196).length === 2
    && INLAND_ARCADE_CELLS.filter(([, z]) => z === 128).length === 3
    && INLAND_ARCADE_CELLS.every(([x, z]) => x < 240
      && (z === 210 || z === 152 || z === 96 || z === 237 || z === 259 || z === 196 || z === 128)
      && isInlandArcadeCell(x, z)
      && !isCourtWellCell(x, z)
      && leftoverLotOverlap(x, z, 18, 14, 0.15) === false
      && INLAND_MIDRISE_CELLS.some(([mx, mz]) => mx === x && mz === z))
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -600 && z === 152)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 160 && z === 152)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -660 && z === 152)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -660 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -660 && z === 259)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -720 && z === 196)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -540 && z === 196)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -600 && z === 96)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -190 && z === 96)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === 210 && z === 96)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -540 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -390 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -190 && z === 237)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -660 && z === 128)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -540 && z === 128)
    && INLAND_ARCADE_CELLS.some(([x, z]) => x === -390 && z === 128)
    && !INLAND_ARCADE_CELLS.some(([x, z]) => x === -390 && z === 96)
    && !INLAND_ARCADE_CELLS.some(([x, z]) => x === -250 && z === 96)
    && !INLAND_ARCADE_CELLS.some(([x, z]) => x === -720 && z === 128)
    && !INLAND_ARCADE_CELLS.some(([x, z]) => x === -600 && z === 128)
    && !INLAND_ARCADE_CELLS.some(([x, z]) => x === -190 && z === 128)
    && inland.includes('isInlandArcadeCell') && inland.includes('INLAND_ARCADE_SOFFIT')
    && inland.includes('addCollider') && !/\brng2?\s*\(/.test(inland));
  ok('skyline arcades at x=-540/-390/-190 miss roof rings and court wells',
    [[-540, 237], [-390, 237], [-190, 237]].every(([x, z]) =>
      isInlandArcadeCell(x, z)
      && !isCourtWellCell(x, z)
      && !ROOF_RING_CELLS.some(([rx, rz]) => rx === x && rz === z)
      && !ROOF_AC_CELLS.some(([rx, rz]) => rx === x && rz === z)
      && leftoverLotOverlap(x, z, 18, 14, 0.15) === false
      && inlandArcadeGeom(x, z, 't').fly === '±Z'
      && x < 240 && x < 251)
    && !isInlandArcadeCell(-540, 259)
    && !isInlandArcadeCell(-390, 259)
    && !isInlandArcadeCell(-190, 259)
    && ROOF_RING_CELLS.some(([x, z]) => x === -540 && z === 259)
    && ROOF_RING_CELLS.some(([x, z]) => x === -390 && z === 259)
    && ROOF_RING_CELLS.some(([x, z]) => x === -190 && z === 259));
  ok('z=128 ground-floor arcades miss court wells, fly ±Z, jambs only',
    [[-660, 128], [-540, 128], [-390, 128]].every(([x, z]) =>
      isInlandArcadeCell(x, z)
      && !isCourtWellCell(x, z)
      && leftoverLotOverlap(x, z, 18, 14, 0.15) === false
      && inlandArcadeGeom(x, z, 't').fly === '±Z'
      && x < 240 && x < 251)
    && !isInlandArcadeCell(-720, 128)
    && !isInlandArcadeCell(-600, 128)
    && !isInlandArcadeCell(-190, 128)
    && isCourtWellCell(-720, 128)
    && isCourtWellCell(-600, 128)
    && isCourtWellCell(-190, 128)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -660 && z === 128)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -540 && z === 128)
    && INLAND_MIDRISE_CELLS.some(([x, z]) => x === -390 && z === 128));

  ok('leftoverLot A–H unmoved',
    LEFTOVER_LOT_X === 258 && LEFTOVER_LOT_B_X === 295 && LEFTOVER_LOT_H_X === 398
    && leftoverLotOverlap(LEFTOVER_LOT_X, LEFTOVER_LOT_Z, LEFTOVER_LOT_W, LEFTOVER_LOT_D, 0.15));

  ok('signed rooftop AC gaps + billboard rings including east z=96 plate',
    ROOF_AC_CELLS.length === 15 && ROOF_RING_CELLS.length === 15
    && ROOF_AC_CLEAR >= 2.0 && ROOF_AC_H >= 2.0
    && 2 * (ROOF_RING_R - ROOF_RING_TUBE) >= 2.0
    && ROOF_AC_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1
      && !isCourtWellCell(x, z)
      && leftoverLotOverlap(x, z, 4, 2, 0.15) === false)
    && ROOF_AC_CELLS.filter(([, z]) => z === 96).length === 5
    && ROOF_RING_CELLS.every(([x, z]) => x < 240 && z > TRAVEL_Z1
      && (z === 259 || z === 210)
      && !isCourtWellCell(x, z)
      && leftoverLotOverlap(x, z, 0.8, 2.4, 0.15) === false
      && INLAND_MIDRISE_CELLS.some(([mx, mz]) => mx === x && mz === z))
    && ROOF_RING_CELLS.some(([x, z]) => x === -600 && z === 259)
    && ROOF_RING_CELLS.some(([x, z]) => x === -540 && z === 259)
    && ROOF_RING_CELLS.some(([x, z]) => x === 210 && z === 259)
    && ROOF_RING_CELLS.some(([x, z]) => x === -540 && z === 210)
    && ROOF_AC_CELLS.some(([x, z]) => x === -430 && z === 237)
    && ROOF_AC_CELLS.some(([x, z]) => x === -80 && z === 237)
    && ROOF_AC_CELLS.some(([x, z]) => x === -600 && z === 96)
    && ROOF_AC_CELLS.some(([x, z]) => x === -660 && z === 96)
    && ROOF_AC_CELLS.some(([x, z]) => x === -190 && z === 96)
    && ROOF_AC_CELLS.some(([x, z]) => x === 210 && z === 96)
    && ROOF_AC_CELLS.some(([x, z]) => x === 190 && z === 152)
    && ROOF_AC_CELLS.some(([x, z]) => x === -600 && z === 196)
    && !ROOF_AC_CELLS.some(([x, z]) => x === -390 && z === 96)
    && !ROOF_AC_CELLS.some(([x, z]) => x === -250 && z === 96)
    && ROOF_AC_CELLS.every(([x, z]) =>
      INLAND_MIDRISE_CELLS.some(([mx, mz]) => mx === x && mz === z)));
  ok('inland.js builds roof whoops with hash01 skip, no layout rng',
    inland.includes('roof-whoop') && inland.includes('ROOF_AC_CELLS')
    && inland.includes('cTorus') && !/\brng2?\s*\(/.test(inland));
  const kit = flyColliderShapes();
  function probe(x, y, z, r) {
    for (let i = 0; i < kit.length; i++) {
      const s = kit[i];
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
  for (let i = 0; i < ROOF_AC_CELLS.length; i++) {
    const [x, z] = ROOF_AC_CELLS[i];
    const v = FLY_VOIDS.find((f) => f.id === `roof-ac-${i}`);
    ok(`roof-ac-${i} listed + open`,
      !!v && v.x === x && v.z === z && v.openH >= 2 && v.openW >= 2
      && inKeepout(x, z) && !probe(v.x, v.y, v.z, 0.28)
      && leftoverLotOverlap(x, z, 4, 2, 0.15) === false);
  }
  for (let i = 0; i < ROOF_RING_CELLS.length; i++) {
    const [x, z] = ROOF_RING_CELLS[i];
    const v = FLY_VOIDS.find((f) => f.id === `roof-ring-${i}`);
    ok(`roof-ring-${i} listed + open disc`,
      !!v && v.x === x && v.z === z && v.openH >= 2
      && inKeepout(x, z) && !probe(v.x, v.y, v.z, 0.28)
      && leftoverLotOverlap(x, z, 0.8, 2.4, 0.15) === false);
  }
  for (let i = 0; i < COURT_WELL_CELLS.length; i++) {
    const [x, z] = COURT_WELL_CELLS[i];
    const v = FLY_VOIDS.find((f) => f.id === `court-well-${i}`);
    ok(`court-well-${i} void + keepout, bay open`,
      !!v && v.x === x && v.z === z && v.openW >= 5 && v.openH >= 20
      && inKeepout(x, z) && leftoverLotOverlap(x, z, 6.2, 6.2, 0.15) === false
      && courtWellGeom(x, z, v.id).fly === '-Y'
      && !probe(x, CITY_Y + 16, z, 0.28));
  }
  for (let i = 0; i < INLAND_ARCADE_CELLS.length; i++) {
    const [x, z] = INLAND_ARCADE_CELLS[i];
    const v = FLY_VOIDS.find((f) => f.id === `inland-arcade-${i}`);
    ok(`inland-arcade-${i} void + keepout, bay open`,
      !!v && v.x === x && v.z === z && v.openW >= 3.5 && v.openH >= 3
      && inKeepout(x, z) && leftoverLotOverlap(x, z, 4.4, 14, 0.15) === false
      && !probe(v.x, v.y, v.z, 0.28)
      && !isCourtWellCell(x, z));
  }

  if (fails.length) {
    console.error('[miami-inland] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-inland] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('inlandTest.js');
if (isMain) {
  const r = runMiamiInlandTests();
  if (!r.passed) process.exit(1);
}
