#!/usr/bin/env node
// Headless runner for js/world/miami/parkWalkNSTest.js
//
//   node ./tools/run-miami-park-walk-ns-test.mjs

import { runMiamiParkWalkNSTests } from '../js/world/miami/parkWalkNSTest.js';

const report = runMiamiParkWalkNSTests();
if (!report.passed) process.exit(1);
