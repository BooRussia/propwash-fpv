#!/usr/bin/env node
// Headless runner for js/world/miami/houseTest.js
//
//   node ./tools/run-miami-house-test.mjs

import { runMiamiHouseTests } from '../js/world/miami/houseTest.js';

const report = runMiamiHouseTests();
if (!report.passed) process.exit(1);
