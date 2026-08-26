#!/usr/bin/env node
// Top-down SVG of the Ocean Drive 2D site plan (world XZ metres).
//
//   node ./tools/render-ocean-drive-plan.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../assets/catalog/miami-ocean-drive-plan.json');
const out = join(here, '../assets/catalog/miami-ocean-drive-plan.svg');

// Same columns as js/world/miami/constants.js — the JSON is stamps/paint only.
const GAP_X = [-501, -315, -129, 57, 243, 429];
const CROSS_X = [-129, 57];

const WHITE = '#e9e9e2';
const YELLOW = '#e8c545';

// Paint plates match js/world/miami/sitePlan.js bakePlanPaint sizes (XZ metres).
const PAINT_SIZE = {
  dash: { w: 3.2, d: 0.1 },
  'stall-tick': { w: 0.1, d: 2.15 },
  'zebra-bar': { w: 3.6, d: 0.62 },
  'stop-bar': { w: 0.45, d: 3.4 },
};

const STAMP_COLORS = {
  'gooseneck-lamp': '#f4d35e',
  'deco-lamp': '#f7c59f',
  'bench-slat': '#5b8e7d',
  'bin-drum': '#8d6b4f',
  hydrant: '#d64045',
  meter: '#6c8ead',
  'mail-box': '#3d5a80',
  newsbox: '#ee6c4d',
  'water-fountain': '#98c1d9',
  'dog-bag': '#80b918',
  'bike-rack': '#7b2cbf',
  bollard: '#adb5bd',
  'ped-signal': '#ff9f1c',
  'stop-sign': '#c1121f',
  'traffic-cabinet': '#495057',
  'traffic-signal': '#2d6a4f',
  ramp: '#c9ada7',
  'tree-grate': '#40916c',
  manhole: '#212529',
};

function fmt(n) {
  const x = Math.round(Number(n) * 1000) / 1000;
  return Object.is(x, -0) ? '0' : String(x);
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function colorForId(id) {
  if (STAMP_COLORS[id]) return STAMP_COLORS[id];
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `hsl(${(h >>> 0) % 360}, 62%, 48%)`;
}

function plate(x, z, w, d, fill, extra = '') {
  return `<rect x="${fmt(x - w / 2)}" y="${fmt(z - d / 2)}" width="${fmt(w)}" height="${fmt(d)}" fill="${fill}"${extra}/>`;
}

const plan = JSON.parse(readFileSync(src, 'utf8'));
const x0 = plan.x0;
const x1 = plan.x1;
const z0 = plan.z0;
const z1 = plan.z1;
const vbW = x1 - x0;
const vbH = z1 - z0;
const travelZ0 = plan.lanes?.travelZ0 ?? 40.2;
const travelZ1 = plan.lanes?.travelZ1 ?? 47.8;
const slabs = plan.slabs || [];
const paint = plan.paint || [];
const stamps = plan.stamps || [];

const counts = new Map();
for (const st of stamps) {
  const id = st.id || '?';
  counts.set(id, (counts.get(id) || 0) + 1);
}
const ids = [...counts.keys()].sort();

const legendH = 8;
const parts = [];
parts.push('<?xml version="1.0" encoding="UTF-8"?>');
parts.push(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fmt(x0)} ${fmt(z0)} ${fmt(vbW)} ${fmt(vbH + legendH)}" width="${fmt(vbW * 8)}" height="${fmt((vbH + legendH) * 8)}">`,
);
parts.push(`<title>${esc(plan.name || 'ocean-drive-corridor')}</title>`);
parts.push(`<rect x="${fmt(x0)}" y="${fmt(z0)}" width="${fmt(vbW)}" height="${fmt(vbH)}" fill="#1c1e22"/>`);

parts.push('<g id="slabs">');
for (const s of slabs) {
  parts.push(plate(s.x, s.z, s.w, s.d, s.fill || '#888', ` data-id="${esc(s.id || '')}"`));
}
parts.push('</g>');

parts.push('<g id="paint">');
for (const p of paint) {
  const kind = p.kind;
  if (kind === 'strip') {
    const fill = p.color === 'yellow' ? YELLOW : WHITE;
    parts.push(plate(p.x, p.z, p.w, p.d, fill, ` data-kind="strip" data-color="${esc(p.color || 'white')}"`));
    continue;
  }
  const size = PAINT_SIZE[kind];
  if (!size) continue;
  parts.push(plate(p.x, p.z, size.w, size.d, WHITE, ` data-kind="${esc(kind)}"`));
}
parts.push('</g>');

parts.push('<g id="guides">');
parts.push('<g id="GAP_X">');
for (const x of GAP_X) {
  parts.push(
    `<line x1="${fmt(x)}" y1="${fmt(z0)}" x2="${fmt(x)}" y2="${fmt(z1)}" stroke="#5ec8ff" stroke-width="0.12" stroke-dasharray="0.8 0.45"/>`,
  );
}
parts.push('</g>');
parts.push('<g id="CROSS_X">');
for (const x of CROSS_X) {
  parts.push(
    `<line x1="${fmt(x)}" y1="${fmt(z0)}" x2="${fmt(x)}" y2="${fmt(z1)}" stroke="#ff7ad9" stroke-width="0.2"/>`,
  );
}
parts.push('</g>');
parts.push('</g>');

parts.push('<g id="stamps">');
for (const st of stamps) {
  const id = st.id || '?';
  const fill = colorForId(id);
  parts.push(
    `<circle cx="${fmt(st.x)}" cy="${fmt(st.z)}" r="0.42" fill="${fill}" stroke="#0b0c0e" stroke-width="0.08" data-id="${esc(id)}"><title>${esc(id)}</title></circle>`,
  );
}
parts.push('</g>');

parts.push(
  `<rect id="travel-overlay" x="${fmt(x0)}" y="${fmt(travelZ0)}" width="${fmt(vbW)}" height="${fmt(travelZ1 - travelZ0)}" fill="#ff2a2a" fill-opacity="0.28" pointer-events="none"/>`,
);

parts.push(`<g id="legend" font-family="ui-sans-serif, system-ui, sans-serif" font-size="1.05" fill="#e8e6df">`);
parts.push(`<rect x="${fmt(x0)}" y="${fmt(z1)}" width="${fmt(vbW)}" height="${fmt(legendH)}" fill="#14161a"/>`);
parts.push(`<text x="${fmt(x0 + 4)}" y="${fmt(z1 + 1.7)}" font-size="1.35">stamps ${stamps.length}</text>`);
const colW = 38;
const rowH = 1.55;
const cols = Math.max(1, Math.floor((vbW - 8) / colW));
ids.forEach((id, i) => {
  const col = i % cols;
  const row = Math.floor(i / cols);
  const x = x0 + 4 + col * colW;
  const y = z1 + 3.4 + row * rowH;
  parts.push(`<circle cx="${fmt(x + 0.55)}" cy="${fmt(y - 0.35)}" r="0.5" fill="${colorForId(id)}" stroke="#0b0c0e" stroke-width="0.08"/>`);
  parts.push(`<text x="${fmt(x + 1.4)}" y="${fmt(y)}">${esc(id)} × ${counts.get(id)}</text>`);
});
parts.push('</g>');
parts.push('</svg>');
parts.push('');

writeFileSync(out, parts.join('\n'));

console.log('wrote', out);
console.log('stamps', stamps.length);
for (const id of ids) console.log(' ', id, counts.get(id));
console.log('travel overlay', travelZ0, '..', travelZ1);
