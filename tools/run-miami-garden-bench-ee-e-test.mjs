#!/usr/bin/env node
// Headless runner for js/world/miami/gardenBenchEEETest.js
//
//   node ./tools/run-miami-garden-bench-ee-e-test.mjs

import { runMiamiGardenBenchEEETests } from '../js/world/miami/gardenBenchEEETest.js';

const report = runMiamiGardenBenchEEETests();
if (!report.passed) process.exit(1);
