#!/usr/bin/env node
// Bootstrap the Ocean Drive 2D site plan (world XZ metres).
// Edit the emitted JSON after this — it is the source of truth.
//
//   node ./tools/build-ocean-drive-plan.mjs

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '../assets/catalog/miami-ocean-drive-plan.json');

const ROAD_Z = 44;
const X0 = -620, X1 = 620;
const GAP_X = [-501, -315, -129, 57, 243, 429];
const CROSS_X = [-129, 57];
const XS_HALF = 6.5;
const SW_CUT = 0.55;
const PIER_X = -150;
const CITY_Y = 1.5;

const SW_BEACH = 34.90;
const PLANT_BEACH = 36.5;
const GUTTER_BEACH = 37.35;
const PARK_BEACH = 38.45;
const TRAVEL_BEACH = 41.7;
const TRAVEL_CITY = 46.3;
const PARK_CITY = 49.55;
const GUTTER_CITY = 50.65;
const PLANT_CITY = 51.5;
const SW_CITY = 52.95;

function nearGap(x, pad = 8) {
  return GAP_X.some((c) => Math.abs(x - c) < pad);
}
function nearPier(x, pad = 12) {
  return Math.abs(x - PIER_X) < pad;
}
function nearCross(x, pad = 5) {
  return CROSS_X.some((c) => Math.abs(x - c) < pad);
}

function sidewalkRuns() {
  const half = XS_HALF + SW_CUT;
  const cuts = GAP_X.slice().sort((a, b) => a - b);
  const runs = [];
  let x = X0;
  for (let i = 0; i < cuts.length; i++) {
    const a = cuts[i] - half, b = cuts[i] + half;
    if (a > x + 1.5) runs.push({ x0: x, x1: a });
    if (b > x) x = b;
  }
  if (X1 - x > 1.5) runs.push({ x0: x, x1: X1 });
  return runs;
}

function along(runs, spacing, offset, filter) {
  const xs = [];
  for (const run of runs) {
    for (let x = run.x0 + offset; x < run.x1 - 1.2; x += spacing) {
      if (filter && !filter(x)) continue;
      xs.push(Math.round(x * 100) / 100);
    }
  }
  return xs;
}

const runs = sidewalkRuns();
const paint = [];
const stamps = [];

// ---- civil slabs (documentation / SVG) ----
const slabs = [
  { id: 'asphalt', x: 0, z: ROAD_Z, w: 1240, d: 14, fill: '#3a3d42' },
  { id: 'sidewalk-beach', x: 0, z: 34.9, w: 1240, d: 1.9, fill: '#b4b0a6' },
  { id: 'tree-lawn-beach', x: 0, z: 36.5, w: 1240, d: 0.7, fill: '#5f7d4a' },
  { id: 'sidewalk-city', x: 0, z: 52.95, w: 1240, d: 1.8, fill: '#b4b0a6' },
  { id: 'tree-lawn-city', x: 0, z: 51.5, w: 1240, d: 0.7, fill: '#5f7d4a' },
];

// ---- paint ----
paint.push({ kind: 'strip', color: 'white', x: 0, z: ROAD_Z - 6.88, w: 1240, d: 0.12 });
paint.push({ kind: 'strip', color: 'white', x: 0, z: ROAD_Z + 6.88, w: 1240, d: 0.12 });
paint.push({ kind: 'strip', color: 'yellow', x: 0, z: ROAD_Z - 0.12, w: 1240, d: 0.09 });
paint.push({ kind: 'strip', color: 'yellow', x: 0, z: ROAD_Z + 0.12, w: 1240, d: 0.09 });

for (const z of [ROAD_Z - 3.9, ROAD_Z + 3.9]) {
  for (let i = 0; i < Math.ceil(1240 / 9.5); i++) {
    const x = -620 + 4.8 + i * 9.5;
    if (nearGap(x, 8)) continue;
    paint.push({ kind: 'dash', x, z });
  }
}
for (let x = -600; x <= 600; x += 6.4) {
  if (nearGap(x, 9) || nearCross(x, 5)) continue;
  paint.push({ kind: 'stall-tick', x, z: ROAD_Z - 5.75 });
  paint.push({ kind: 'stall-tick', x, z: ROAD_Z + 5.75 });
}
for (const cx of GAP_X) {
  for (let z = 37.45; z <= 50.55; z += 1.18) {
    paint.push({ kind: 'zebra-bar', x: cx, z: Math.round(z * 100) / 100 });
  }
}
for (const cx of CROSS_X) {
  paint.push({ kind: 'stop-bar', x: cx - 2.4, z: TRAVEL_BEACH });
  paint.push({ kind: 'stop-bar', x: cx + 2.4, z: TRAVEL_CITY });
}

function stamp(id, x, z, yaw, extra = {}) {
  if (nearPier(x)) return;
  stamps.push({ id, x, z, yaw: yaw || 0, ...extra });
}

// Gooseneck streetlights in the tree lawn, arm toward the road.
along(runs, 24.5, 2.0, (x) => !nearGap(x, 7)).forEach((x, i) => {
  stamp('gooseneck-lamp', x, i % 2 ? PLANT_BEACH : PLANT_CITY, i % 2 ? 0 : Math.PI);
});
// Deco lamps on the city walk.
along(runs, 74, 11, (x) => !nearGap(x, 7)).forEach((x) => {
  stamp('deco-lamp', x, SW_CITY, 0);
});
// Benches + bins on both walks.
along(runs, 47, 6, (x) => !nearGap(x, 7)).forEach((x, i) => {
  const z = i % 2 ? SW_CITY : SW_BEACH;
  stamp('bench-slat', x, z, 0);
  if (i % 2 === 0) stamp('bin-drum', x + 2.5, z, 0);
});
// Hydrants on city tree lawn.
along(runs, 88, 18, (x) => !nearGap(x, 8)).forEach((x) => {
  stamp('hydrant', x, PLANT_CITY, 0);
});
// Parking meters behind city-shoulder stalls.
along(runs, 34, 8, (x) => !nearGap(x, 8) && !nearCross(x, 6)).forEach((x) => {
  stamp('meter', x + 2.1, PLANT_CITY, 0);
});
// Mailboxes, newsboxes, fountains, dog-bag posts.
along(runs, 180, 40, (x) => !nearGap(x, 8)).forEach((x) => {
  stamp('mail-box', x, SW_CITY, Math.PI);
});
along(runs, 94, 21, (x) => !nearGap(x, 7)).forEach((x, i) => {
  if (i % 3 === 1) stamp('newsbox', x, SW_CITY, 0);
});
along(runs, 220, 55, (x) => !nearGap(x, 8)).forEach((x) => {
  stamp('water-fountain', x, SW_BEACH, 0);
});
along(runs, 96, 30, (x) => !nearGap(x, 7)).forEach((x) => {
  stamp('dog-bag', x, PLANT_BEACH, 0);
});
// Bike racks at signed zebras.
for (const cx of CROSS_X) {
  for (const s of [-1, 1]) stamp('bike-rack', cx + s * 9, SW_CITY, 0);
}
// Steel bollards + ped signals at signed crossings (sidewalk, not roadway).
for (const cx of CROSS_X) {
  for (const s of [-1, 1]) {
    stamp('bollard', cx + s * 3.6, SW_CITY, 0);
    stamp('ped-signal', cx + s * (XS_HALF + 0.9), SW_CITY, s < 0 ? Math.PI / 2 : -Math.PI / 2);
  }
}
// Stop signs + cabinets at every gap, on the tree lawn / walk — not the asphalt.
for (const cx of GAP_X) {
  stamp('stop-sign', cx + 3.55, 50.72, Math.PI);
  stamp('stop-sign', cx - 3.55, 37.28, 0);
  stamp('traffic-cabinet', cx + 4.2, SW_CITY, 0);
  stamp('traffic-signal', cx - (XS_HALF + 1.35), SW_BEACH, 0);
  stamp('traffic-signal', cx + (XS_HALF + 1.35), SW_CITY, Math.PI);
}
// Curb ramps at every gap, city walk.
for (const cx of GAP_X) {
  for (const s of [-1, 1]) {
    stamp('ramp', cx + s * (XS_HALF + SW_CUT + 0.35), 52.45, s > 0 ? Math.PI / 2 : -Math.PI / 2);
  }
}
// Tree grates on the city lawn.
along(runs, 24.5, 2.0, (x) => !nearGap(x, 7)).forEach((x, i) => {
  if (i % 2 === 0) stamp('tree-grate', x, PLANT_CITY, 0);
});
// Gutter manholes — flush, NOT the travel lanes.
for (let x = -570; x <= 570; x += 60) {
  if (nearGap(x, 8) || nearCross(x, 5)) continue;
  stamp('manhole', x, GUTTER_BEACH, 0, { flush: true, y: CITY_Y + 0.07 });
  stamp('manhole', x + 27, GUTTER_CITY, 0, { flush: true, y: CITY_Y + 0.07 });
}

const plan = {
  version: 1,
  name: 'ocean-drive-corridor',
  crs: 'miami-xz-meters',
  x0: X0,
  x1: X1,
  z0: 32,
  z1: 62,
  lanes: {
    parkBeach: PARK_BEACH,
    travelBeach: TRAVEL_BEACH,
    travelCity: TRAVEL_CITY,
    parkCity: PARK_CITY,
    travelZ0: 40.2,
    travelZ1: 47.8,
  },
  slabs,
  paint,
  stamps,
};

writeFileSync(out, JSON.stringify(plan, null, 2) + '\n');
const travelHits = stamps.filter((s) => !s.flush && s.z > 40.2 && s.z < 47.8);
console.log('wrote', out);
console.log('paint', paint.length, 'stamps', stamps.length, 'travel-lane solids', travelHits.length);
if (travelHits.length) {
  console.error(travelHits.slice(0, 8));
  process.exit(1);
}
