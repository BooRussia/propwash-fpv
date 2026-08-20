#!/usr/bin/env node
// Headless runner for js/world/miami/parkWalkEEETest.js
//
//   node ./tools/run-miami-park-walk-ee-e-test.mjs

import { runMiamiParkWalkEEETests } from '../js/world/miami/parkWalkEEETest.js';

const report = runMiamiParkWalkEEETests();
if (!report.passed) process.exit(1);
