#!/usr/bin/env node
// Headless runner for js/world/miami/parkWalkFFTest.js
//
//   node ./tools/run-miami-park-walk-ff-test.mjs

import { runMiamiParkWalkFFTests } from '../js/world/miami/parkWalkFFTest.js';

const report = runMiamiParkWalkFFTests();
if (!report.passed) process.exit(1);
