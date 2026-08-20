#!/usr/bin/env node
// Headless runner for js/world/miami/gardenPathTest.js
//
//   node ./tools/run-miami-garden-path-test.mjs

import { runMiamiGardenPathTests } from '../js/world/miami/gardenPathTest.js';

const report = runMiamiGardenPathTests();
if (!report.passed) process.exit(1);
