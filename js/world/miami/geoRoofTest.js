// Headless source-locks for the Miami roof/facade contract.
// No three.js, no game state.
//
//   node ./tools/run-miami-geo-roof-test.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

function sliceFn(src, name) {
  const re = new RegExp(`export function ${name}\\(`);
  const m = src.match(re);
  if (!m) return '';
  const start = m.index;
  const next = src.indexOf('\nexport function ', start + 1);
  return src.slice(start, next < 0 ? src.length : next);
}

export function runMiamiGeoRoofTests() {
  fails.length = 0;
  passedCount = 0;

  const geo = readFileSync(join(here, 'geo.js'), 'utf8');
  const buildings = readFileSync(join(here, 'buildings.js'), 'utf8');
  const lot = readFileSync(join(here, 'landmarks/leftoverLot.js'), 'utf8');
  const street = readFileSync(join(here, 'street.js'), 'utf8');
  const beach = readFileSync(join(here, 'landmarks/beachProps.js'), 'utf8');

  const facade = sliceFn(geo, 'facadeUV');
  const strip = sliceFn(geo, 'stripBoxCaps');
  const roof = sliceFn(geo, 'roofSlabGeo');
  const soffit = sliceFn(geo, 'soffitGeo');
  const midrise = sliceFn(geo, 'buildDecoMidriseGeos');
  const cylUV = sliceFn(geo, 'facadeCylUV');
  const backdropStart = buildings.indexOf('// backdrop city (cheap, far)');
  const backdrop = buildings.slice(
    backdropStart,
    buildings.indexOf('return {', backdropStart),
  );
  const near = buildings.slice(0, backdropStart);

  ok('facadeUV zeros +Y/-Y on 24-vert boxes',
    facade.includes('if (f === 2 || f === 3)')
    && facade.includes('uv.setXY(f * 4 + k, 0, 0)'));
  ok('stripBoxCaps keeps only side groups 0,1,4,5',
    strip.includes('for (const f of [0, 1, 4, 5])'));
  ok('roofSlabGeo is a separate lid', roof.includes('new THREE.BoxGeometry(w + 0.14, thick, d + 0.14)'));
  ok('soffitGeo is a separate underside', soffit.includes('export function soffitGeo'));
  ok('stripCylinderCaps drops cap groups',
    geo.includes('export function stripCylinderCaps')
    && geo.includes('geo.groups.length < 3'));
  ok('zeroCylCaps degenerates cap UVs',
    geo.includes('export function zeroCylCaps')
    && cylUV.includes('zeroCylCaps(geo)'));

  ok('deco midrise helper uses facadeUV + stripBoxCaps',
    midrise.includes('facadeUV(walls, w, h, d, tileU, tileV, offU, offV)')
    && midrise.includes('stripBoxCaps(walls)'));
  ok('deco midrise helper has separate roof + soffit',
    midrise.includes('roofSlabGeo(w, d, 0, h / 2, 0)')
    && midrise.includes('soffitGeo(w, d, 0, -h / 2, 0)'));
  ok('deco midrise helper does not map facade onto roof geo',
    !/facadeUV\(\s*roof/.test(midrise) && !/facadeUV\(\s*soffit/.test(midrise));
  ok('deco midrise comments lock all 6 sides',
    geo.includes('+Z front')
    && geo.includes('-Z back')
    && geo.includes('+X right')
    && geo.includes('-X left')
    && geo.includes('+Y top')
    && geo.includes('-Y bottom'));

  const stair = sliceFn(geo, 'buildStairFlightGeo');
  const pilotis = sliceFn(geo, 'buildPilotisColumnGeo');
  const ac = sliceFn(geo, 'buildRoofAcUnitGeo');
  ok('stair / pilotis / roof AC geos are exported',
    stair.includes('export function buildStairFlightGeo')
    && pilotis.includes('export function buildPilotisColumnGeo')
    && ac.includes('export function buildRoofAcUnitGeo'));
  ok('roof AC geo does not mention glassMat',
    ac.length > 0 && !ac.includes('glassMat'));

  ok('near deco towers use the midrise helper',
    near.includes('buildDecoMidriseGeos(tw, th, td, DECO_TILE_U, DECO_TILE_V, offU, offV)'));
  ok('cyl towers are open-ended + facadeCylUV + stripCylinderCaps',
    near.includes('new THREE.CylinderGeometry(w / 2, w / 2, h, 18, 1, true)')
    && near.includes('facadeCylUV(geo, Math.PI * w, h')
    && near.includes('stripCylinderCaps(geo)')
    && near.includes('metalRoofMat'));
  ok('deco parapet cylinder is open-ended',
    near.includes('new THREE.CylinderGeometry(capR0, capR1, 3.5, 10, 1, true)')
    && near.includes('facadeCylUV(capGeo'));
  ok('glass addBox still stripBoxCaps + roofSlabGeo + soffitGeo',
    near.includes('stripBoxCaps(g)')
    && near.includes('roofs.push(roofSlabGeo(bw, bd, bx, by + bh / 2, bz, ry))')
    && near.includes('soffits.push(soffitGeo(bw, bd, bx, by - bh / 2, bz, ry))'));

  ok('helipad still stripBoxCaps + dedicated roof slab',
    buildings.includes('stripBoxCaps(geo)')
    && buildings.includes('roofSlabGeo(16, 16)')
    && buildings.includes('soffitGeo(16, 16)')
    && buildings.includes('[[430, 70], [-430, 100]]'));
  ok('helipad pad is tarmac, not a facade map',
    buildings.includes('new THREE.CylinderGeometry(6, 6, 0.4, 24)')
    && buildings.includes('color: 0x2a2f36'));

  ok('backdrop 60-box contract is untouched',
    backdrop.includes('for (let i = 0; i < 60; i++)')
    && backdrop.includes('stripBoxCaps(g)')
    && backdrop.includes('facadeUV(g, w, h, d, TU, TV')
    && !backdrop.includes('InstancedMesh')
    && !backdrop.includes('ShaderMaterial')
    && !backdrop.includes('buildDecoMidriseGeos')
    && (backdrop.match(/new THREE\.BoxGeometry/g) || []).length === 1);
  ok('backdrop lids are roofSlabGeo + metalRoofMat, not the wall atlas',
    backdrop.includes('roofSlabGeo(w, d, x, CITY_Y + h, z)')
    && backdrop.includes('addMerged(roofGeos, metalRoofMat)'));

  ok('leftoverLot shed stripBoxCaps + roofSlabGeo',
    lot.includes('stripBoxCaps(geo)')
    && lot.includes('roofSlabGeo(g.shedW, g.shedD'));

  ok('rooftop kits are vertex-coloured, not facade-mapped',
    buildings.includes('function buildRooftopKitGeo')
    && buildings.includes('function buildRooftopDishGeo')
    && buildings.includes('function buildRooftopTankGeo')
    && buildings.includes('function buildRooftopPadGeo')
    && buildings.includes("'tower-rooftops-pad'")
    && !/function buildRooftopPadGeo[\s\S]{0,600}glassMat/.test(buildings));

  ok('street extras: deco lamp + newsbox + trash can',
    street.includes('function buildDecoLampGeo')
    && street.includes('function buildNewsboxGeo')
    && street.includes('function buildTrashCanGeo')
    && street.includes('Front: glass door')
    && street.includes('bottom: limestone plinth'));
  ok('beach extras: lounger + cooler + drum + rack',
    beach.includes('function buildLoungerGeo')
    && beach.includes('function buildCoolerGeo')
    && beach.includes('function buildTrashDrumGeo')
    && beach.includes('function buildBeachRackGeo')
    && beach.includes('hash01 only'));
  ok('beach extras do not consume layout rng',
    beach.includes('hash01(i, 11)')
    && !/rng\(\)/.test(beach.slice(beach.indexOf('// extras: hash01 only'))));

  if (fails.length) {
    console.error('[miami-geo-roof] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-geo-roof] ok', passedCount, 'checks');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('geoRoofTest.js');
if (isMain) {
  const r = runMiamiGeoRoofTests();
  if (!r.passed) process.exit(1);
}
