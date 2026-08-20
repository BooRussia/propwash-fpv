#!/usr/bin/env node
// Headless runner for js/world/miami/pocketParkTest.js
//
//   node ./tools/run-miami-pocket-park-test.mjs

import { runMiamiPocketParkTests } from '../js/world/miami/pocketParkTest.js';

const report = runMiamiPocketParkTests();
if (!report.passed) process.exit(1);
