#!/usr/bin/env node
// Headless runner for js/world/miami/leftoverGrassLawnTest.js
//
//   node ./tools/run-miami-leftover-grass-lawn-test.mjs

import { runMiamiLeftoverGrassLawnTests } from '../js/world/miami/leftoverGrassLawnTest.js';

const report = runMiamiLeftoverGrassLawnTests();
if (!report.passed) process.exit(1);
