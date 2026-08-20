#!/usr/bin/env node
// Headless runner for js/world/miami/parkKitHHTest.js
//
//   node ./tools/run-miami-park-kit-hh-test.mjs

import { runMiamiParkKitHHTests } from '../js/world/miami/parkKitHHTest.js';

const report = runMiamiParkKitHHTests();
if (!report.passed) process.exit(1);
