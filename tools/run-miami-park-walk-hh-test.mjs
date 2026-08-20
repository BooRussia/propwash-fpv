#!/usr/bin/env node
// Headless runner for js/world/miami/parkWalkHHTest.js
//
//   node ./tools/run-miami-park-walk-hh-test.mjs

import { runMiamiParkWalkHHTests } from '../js/world/miami/parkWalkHHTest.js';

const report = runMiamiParkWalkHHTests();
if (!report.passed) process.exit(1);
