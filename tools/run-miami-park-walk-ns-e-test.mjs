#!/usr/bin/env node
// Headless runner for js/world/miami/parkWalkNSETest.js
//
//   node ./tools/run-miami-park-walk-ns-e-test.mjs

import { runMiamiParkWalkNSETests } from '../js/world/miami/parkWalkNSETest.js';

const report = runMiamiParkWalkNSETests();
if (!report.passed) process.exit(1);
