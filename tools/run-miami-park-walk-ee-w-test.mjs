#!/usr/bin/env node
// Headless runner for js/world/miami/parkWalkEEWTest.js
//
//   node ./tools/run-miami-park-walk-ee-w-test.mjs

import { runMiamiParkWalkEEWTests } from '../js/world/miami/parkWalkEEWTest.js';

const report = runMiamiParkWalkEEWTests();
if (!report.passed) process.exit(1);
