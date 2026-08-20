#!/usr/bin/env node
// Headless runner for js/world/miami/parkWalkEETest.js
//
//   node ./tools/run-miami-park-walk-ee-test.mjs

import { runMiamiParkWalkEETests } from '../js/world/miami/parkWalkEETest.js';

const report = runMiamiParkWalkEETests();
if (!report.passed) process.exit(1);
