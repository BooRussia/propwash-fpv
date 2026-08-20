#!/usr/bin/env node
// Headless runner for js/world/miami/leftoverGrassTest.js
//
//   node ./tools/run-miami-leftover-grass-test.mjs

import { runMiamiLeftoverGrassTests } from '../js/world/miami/leftoverGrassTest.js';

const report = runMiamiLeftoverGrassTests();
if (!report.passed) process.exit(1);
