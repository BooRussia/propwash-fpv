#!/usr/bin/env node
// Headless runner for js/world/miami/palmsTest.js
//
//   node ./tools/run-miami-palms-test.mjs

import { runMiamiPalmsTests } from '../js/world/miami/palmsTest.js';

const report = runMiamiPalmsTests();
if (!report.passed) process.exit(1);
