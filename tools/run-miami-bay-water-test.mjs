#!/usr/bin/env node
// Headless runner for js/world/miami/bayWaterTest.js
//
//   node ./tools/run-miami-bay-water-test.mjs

import { runBayWaterTests } from '../js/world/miami/bayWaterTest.js';

const report = runBayWaterTests();
if (!report.passed) process.exit(1);
