#!/usr/bin/env node
// Headless runner for js/world/miami/gardenBenchEEWTest.js
//
//   node ./tools/run-miami-garden-bench-ee-w-test.mjs

import { runMiamiGardenBenchEEWTests } from '../js/world/miami/gardenBenchEEWTest.js';

const report = runMiamiGardenBenchEEWTests();
if (!report.passed) process.exit(1);
