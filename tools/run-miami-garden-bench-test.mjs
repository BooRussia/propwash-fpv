#!/usr/bin/env node
// Headless runner for js/world/miami/gardenBenchTest.js
//
//   node ./tools/run-miami-garden-bench-test.mjs

import { runMiamiGardenBenchTests } from '../js/world/miami/gardenBenchTest.js';

const report = runMiamiGardenBenchTests();
if (!report.passed) process.exit(1);
