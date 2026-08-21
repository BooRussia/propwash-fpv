#!/usr/bin/env node
// Headless runner for js/world/miami/dressingTest.js
//
//   node ./tools/run-miami-dressing-test.mjs

import { runMiamiDressingTests } from '../js/world/miami/dressingTest.js';

const report = runMiamiDressingTests();
if (!report.passed) process.exit(1);
