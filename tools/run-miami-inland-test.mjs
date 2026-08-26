#!/usr/bin/env node
// Headless runner for js/world/miami/inlandTest.js
//
//   node ./tools/run-miami-inland-test.mjs

import { runMiamiInlandTests } from '../js/world/miami/inlandTest.js';

const report = runMiamiInlandTests();
if (!report.passed) process.exit(1);
