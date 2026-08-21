#!/usr/bin/env node
// Headless runner for js/world/miami/bayWaterTest.js
//
//   node ./tools/run-miami-bay-water-test.mjs
//
// Registers the three stub so the test can import foamTermAt / encodeShoreFoam
// from bayWater.js without a browser WebGL renderer.

import { register } from 'node:module';

if (typeof globalThis.localStorage === 'undefined') {
  const mem = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); },
  };
}

register('./alias-three-hooks.mjs', import.meta.url);

const { runBayWaterTests } = await import('../js/world/miami/bayWaterTest.js');

const report = runBayWaterTests();
if (!report.passed) process.exit(1);
