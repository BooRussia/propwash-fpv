#!/usr/bin/env node
// Headless runner for js/world/miami/parkKitGGTest.js
//
//   node ./tools/run-miami-park-kit-gg-test.mjs

import { runMiamiParkKitGGTests } from '../js/world/miami/parkKitGGTest.js';

const report = runMiamiParkKitGGTests();
if (!report.passed) process.exit(1);
