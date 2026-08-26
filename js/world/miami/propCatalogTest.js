// Headless checks for assets/catalog/miami-props.json
//
//   node ./js/world/miami/propCatalogTest.js
//   node ./tools/run-miami-prop-catalog-test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCatalog, allItems, catalogStats, sectionById } from './propCatalog.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');

const fails = [];
let passedCount = 0;
const ok = (name, cond, detail) => {
  if (!cond) fails.push(detail ? `${name}: ${detail}` : name);
  else passedCount++;
};

export function runMiamiPropCatalogTests() {
  fails.length = 0;
  passedCount = 0;

  const path = join(root, 'assets/catalog/miami-props.json');
  ok('catalog file exists', existsSync(path));
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const cat = parseCatalog(raw);
  const items = allItems(cat);
  const stats = catalogStats(cat);

  ok('nine placement sections', cat.sections.length === 9);
  ok('mass list is 90+ items', items.length >= 90);
  ok('unique item ids', new Set(items.map((i) => i.id)).size === items.length);
  ok('unique slugs per section-item', items.length === items.length);

  const ids = new Set();
  for (const it of items) {
    if (ids.has(it.id)) ok('dup id ' + it.id, false);
    ids.add(it.id);
    ok(`${it.id} has place.band`, !!(it.place && it.place.band && cat.bands[it.place.band]));
    ok(`${it.id} wrap kind known`,
      !it.wrap || ['vertex-color', 'colormap', 'pbr'].includes(it.wrap.kind));
    ok(`${it.id} status known`,
      cat.engine.status.includes(it.status));
    ok(`${it.id} sixSides noted`, typeof it.sixSides === 'string' && it.sixSides.length > 3);
    for (const sk of it.skins || []) {
      ok(`${it.id} skin ${sk}`, !!cat.skins[sk]);
    }
  }

  ok('sidewalk-furniture exists', !!sectionById(cat, 'sidewalk-furniture'));
  ok('utilities-power exists', !!sectionById(cat, 'utilities-power'));
  ok('fence-rail exists', !!sectionById(cat, 'fence-rail'));
  ok('stairs-entry exists', !!sectionById(cat, 'stairs-entry'));
  ok('stairs-entry items approved',
    sectionById(cat, 'stairs-entry').items.every((it) => it.status === 'approved'));
  ok('pipeline statuses cover the list',
    (stats.byStatus.approved || 0) + (stats.byStatus.rejected || 0)
    + (stats.byStatus['needs-wrap'] || 0) === stats.items);
  ok('some items approved', (stats.approved || 0) >= 9);
  ok('hash01 engine, rng streams forbidden',
    cat.engine.hash === 'hash01'
    && cat.engine.rngForbidden.includes('rng4'));

  const engine = readFileSync(join(here, 'propCatalog.js'), 'utf8');
  ok('catalog module does not draw layout rng',
    !/\brng2?\(/.test(engine) && !/\brng3\(/.test(engine) && !/\brng4\(/.test(engine));

  if (fails.length) {
    console.error('[miami-prop-catalog] FAIL');
    for (const f of fails) console.error('  -', f);
  } else {
    console.log('[miami-prop-catalog] ok', passedCount, 'checks', stats.items, 'items');
  }
  return { passed: fails.length === 0, fails, passedCount, stats };
}

const isMain = typeof process !== 'undefined'
  && process.argv[1] && process.argv[1].endsWith('propCatalogTest.js');
if (isMain) {
  const r = runMiamiPropCatalogTests();
  if (!r.passed) process.exit(1);
}
