#!/usr/bin/env node
// Headless runner for js/world/miami/leftoverLotTest.js
//
//   node ./tools/run-miami-leftover-lot-test.mjs

import { runMiamiLeftoverLotTests } from '../js/world/miami/leftoverLotTest.js';

const report = runMiamiLeftoverLotTests();
if (!report.passed) process.exit(1);
