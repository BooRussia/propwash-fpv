#!/usr/bin/env node
// Headless runner for js/world/miami/parkWalkTest.js
//
//   node ./tools/run-miami-park-walk-test.mjs

import { runMiamiParkWalkTests } from '../js/world/miami/parkWalkTest.js';

const report = runMiamiParkWalkTests();
if (!report.passed) process.exit(1);
