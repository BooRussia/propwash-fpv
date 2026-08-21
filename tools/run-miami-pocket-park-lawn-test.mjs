#!/usr/bin/env node
// Headless runner for js/world/miami/pocketParkLawnTest.js
//
//   node ./tools/run-miami-pocket-park-lawn-test.mjs

import { runMiamiPocketParkLawnTests } from '../js/world/miami/pocketParkLawnTest.js';

const report = runMiamiPocketParkLawnTests();
if (!report.passed) process.exit(1);
