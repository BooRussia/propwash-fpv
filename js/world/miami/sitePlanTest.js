// Headless checks for the Ocean Drive 2D site plan.
// JSON-only — do not import sitePlan.js (it pulls three.js).
// Travel-lane guard is copied here; sitePlan.js is source-locked.
//
//   node ./js/world/miami/sitePlanTest.js
//   node ./tools/run-miami-site-plan-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');

const TRAVEL_Z0 = 40.2;
const TRAVEL_Z1 = 47.8;
const GUTTER_BEACH = 37.35;
const GUTTER_CITY = 50.65;
const GUTTER_SLACK = 0.2;
const PAINT_KINDS = ['strip', 'dash', 'stall-tick', 'zebra-bar', 'stop-bar'];

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

function isTravelLane(z) {
  return z > TRAVEL_Z0 && z < TRAVEL_Z1;
}

/** Copied from sitePlan.js — keep in lockstep. Does not import three. */
function assertPlan(plan) {
  const out = [];
  const stamps = plan.stamps || [];
  for (let i = 0; i < stamps.length; i++) {
    const s = stamps[i];
    if (!s || !s.id || !Number.isFinite(s.x) || !Number.isFinite(s.z)) {
      out.push(`stamp[${i}] missing id/x/z`);
      continue;
    }
    if (s.flush) continue;
    if (isTravelLane(s.z)) out.push(`${s.id} @ ${s.x.toFixed(1)},${s.z.toFixed(1)} sits in a travel lane`);
  }
  const paint = plan.paint || [];
  for (let i = 0; i < paint.length; i++) {
    const p = paint[i];
    if (!p || !p.kind) out.push(`paint[${i}] missing kind`);
  }
  return out;
}

export function runMiamiSitePlanTests() {
  fails.length = 0;
  passedCount = 0;

  const planPath = join(root, 'assets/catalog/miami-ocean-drive-plan.json');
  const builderPath = join(root, 'tools/build-ocean-drive-plan.mjs');
  const sitePlanPath = join(here, 'sitePlan.js');
  const indexPath = join(here, 'index.js');

  ok('plan JSON exists', existsSync(planPath));

  let plan = null;
  try {
    plan = JSON.parse(readFileSync(planPath, 'utf8'));
    ok('plan JSON parses', !!plan && typeof plan === 'object');
  } catch (err) {
    ok('plan JSON parses', false, err.message);
    plan = { stamps: [], paint: [], lanes: {} };
  }

  ok('version 1', plan.version === 1, String(plan.version));
  ok('crs miami-xz-meters', plan.crs === 'miami-xz-meters', String(plan.crs));

  const lanes = plan.lanes || {};
  ok('TRAVEL_Z0 is 40.2', lanes.travelZ0 === TRAVEL_Z0, String(lanes.travelZ0));
  ok('TRAVEL_Z1 is 47.8', lanes.travelZ1 === TRAVEL_Z1, String(lanes.travelZ1));

  const planFails = assertPlan(plan);
  ok('assertPlan returns []', planFails.length === 0,
    planFails.slice(0, 8).join('; '));

  const stamps = plan.stamps || [];
  const travelHits = stamps.filter((s) => s && !s.flush && isTravelLane(s.z));
  ok('zero non-flush stamps in travel lanes', travelHits.length === 0,
    travelHits.slice(0, 6).map((s) => `${s.id}@${s.x},${s.z}`).join('; '));

  const manholes = stamps.filter((s) => s && s.id === 'manhole');
  ok('manhole stamps exist', manholes.length > 0);
  ok('manhole stamps are flush', manholes.every((s) => s.flush === true),
    manholes.filter((s) => !s.flush).slice(0, 4).map((s) => `${s.x},${s.z}`).join('; '));
  const gutterOk = manholes.every((s) => (
    Math.abs(s.z - GUTTER_BEACH) <= GUTTER_SLACK
    || Math.abs(s.z - GUTTER_CITY) <= GUTTER_SLACK
  ));
  ok('manholes at gutter z 37.35 or 50.65 (±0.2)', gutterOk,
    manholes.filter((s) => (
      Math.abs(s.z - GUTTER_BEACH) > GUTTER_SLACK
      && Math.abs(s.z - GUTTER_CITY) > GUTTER_SLACK
    )).slice(0, 4).map((s) => String(s.z)).join('; '));

  const kinds = new Set((plan.paint || []).map((p) => p && p.kind).filter(Boolean));
  for (const kind of PAINT_KINDS) {
    ok(`paint includes ${kind}`, kinds.has(kind));
  }

  ok('tools/build-ocean-drive-plan.mjs exists', existsSync(builderPath));
  ok('sitePlan.js exists', existsSync(sitePlanPath));

  const sitePlanSrc = existsSync(sitePlanPath) ? readFileSync(sitePlanPath, 'utf8') : '';
  const indexSrc = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
  const roadPath = join(here, 'road.js');
  const roadSrc = existsSync(roadPath) ? readFileSync(roadPath, 'utf8') : '';

  ok('sitePlan.js TRAVEL_Z0 = 40.2', /export const TRAVEL_Z0 = 40\.2\s*;/.test(sitePlanSrc));
  ok('sitePlan.js TRAVEL_Z1 = 47.8', /export const TRAVEL_Z1 = 47\.8\s*;/.test(sitePlanSrc));
  ok('sitePlan.js exports assertPlan', /export function assertPlan\s*\(/.test(sitePlanSrc));
  ok('index.js fetches PLAN_URL',
    indexSrc.includes('fetch(PLAN_URL)') && indexSrc.includes('parseSitePlan')
    && indexSrc.includes('assertPlan'));
  ok('index.js calls bakePlanPaint after buildRoad',
    indexSrc.includes('bakePlanPaint(ctx')
    && indexSrc.indexOf('bakePlanPaint(ctx') > indexSrc.indexOf('await buildRoad(ctx)'));
  ok('index.js bakes stamps after kenneyDressing',
    indexSrc.includes('bakePlanStamps(ctx') && indexSrc.includes('bakePlanFlush(ctx')
    && indexSrc.indexOf('bakePlanStamps(ctx')
      > indexSrc.indexOf('await buildKenneyDressing(ctx)'));
  const paintIdx = roadSrc.indexOf('lane paint');
  const sitePlanGuard = roadSrc.indexOf('if (!ctx.sitePlan)', paintIdx);
  const stampRunIdx = roadSrc.indexOf('stampRun(1240, 0.12', paintIdx);
  ok('road.js checks sitePlan before guessed paint',
    paintIdx >= 0 && sitePlanGuard >= 0 && stampRunIdx >= 0
    && sitePlanGuard < stampRunIdx);
  ok('road.js checks sitePlan before zebra/stop-bar',
    roadSrc.includes('zebra crosswalks')
    && roadSrc.indexOf('if (!ctx.sitePlan)', roadSrc.indexOf('zebra crosswalks'))
      < roadSrc.indexOf('BoxGeometry(3.6, 0.022, 0.62)'));
  ok('no rng() in sitePlan.js',
    !/\brng\s*\(/.test(sitePlanSrc) && !/\brng2\s*\(/.test(sitePlanSrc)
    && !/\brng3\s*\(/.test(sitePlanSrc) && !/\brng4\s*\(/.test(sitePlanSrc));
  ok('no ShaderMaterial / window atlas in sitePlan.js',
    !sitePlanSrc.includes('ShaderMaterial')
    && !sitePlanSrc.includes('windowTexture')
    && !sitePlanSrc.includes('facadeUV'));
  ok('sitePlanBuilders bakes exported props',
    sitePlanSrc.includes("export function sitePlanBuilders")
    && sitePlanSrc.includes("'mail-box'")
    && sitePlanSrc.includes("'dog-bag'")
    && sitePlanSrc.includes("'water-fountain'")
    && sitePlanSrc.includes("'bollard'")
    && sitePlanSrc.includes("'ped-signal'")
    && sitePlanSrc.includes("'ramp'")
    && sitePlanSrc.includes("'tree-grate'")
    && sitePlanSrc.includes("'traffic-cabinet'")
    && sitePlanSrc.includes("'manhole'"));
  ok('street.js-only stamps are skipped',
    sitePlanSrc.includes('gooseneck-lamp')
    && sitePlanSrc.includes('not exported')
    && !/['"]gooseneck-lamp['"]\s*:/.test(sitePlanSrc)
    && !/['"]stop-sign['"]\s*:/.test(sitePlanSrc)
    && !/['"]traffic-signal['"]\s*:/.test(sitePlanSrc));

  if (fails.length) {
    console.error('[miami-site-plan] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-site-plan] ok', passedCount, 'checks',
      stamps.length, 'stamps', (plan.paint || []).length, 'paint');
  }
  return { passed: fails.length === 0, fails, passedCount };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('sitePlanTest.js');
if (isMain) {
  const r = runMiamiSitePlanTests();
  if (!r.passed) process.exit(1);
}
