#!/usr/bin/env node
// Headless runner for js/world/miami/skylineBackdropTest.js
//
//   node ./tools/run-miami-skyline-backdrop-test.mjs

import { runMiamiSkylineBackdropTests } from '../js/world/miami/skylineBackdropTest.js';

const report = runMiamiSkylineBackdropTests();
if (!report.passed) process.exit(1);
