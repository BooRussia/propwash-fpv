#!/usr/bin/env node
// Headless runner for js/world/miami/parkWalkETest.js
//
//   node ./tools/run-miami-park-walk-e-test.mjs

import { runMiamiParkWalkETests } from '../js/world/miami/parkWalkETest.js';

const report = runMiamiParkWalkETests();
if (!report.passed) process.exit(1);
