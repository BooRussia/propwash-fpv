#!/usr/bin/env node
// Headless runner for js/world/miami/parkWalkGGTest.js
//
//   node ./tools/run-miami-park-walk-gg-test.mjs

import { runMiamiParkWalkGGTests } from '../js/world/miami/parkWalkGGTest.js';

const report = runMiamiParkWalkGGTests();
if (!report.passed) process.exit(1);
