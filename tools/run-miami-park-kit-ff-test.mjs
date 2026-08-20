#!/usr/bin/env node
// Headless runner for js/world/miami/parkKitFFTest.js
//
//   node ./tools/run-miami-park-kit-ff-test.mjs

import { runMiamiParkKitFFTests } from '../js/world/miami/parkKitFFTest.js';

const report = runMiamiParkKitFFTests();
if (!report.passed) process.exit(1);
