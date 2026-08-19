#!/usr/bin/env node
// Headless runner for js/world/miami/bladesTest.js
//
//   node ./tools/run-miami-blades-test.mjs

import { runMiamiBladesTests } from '../js/world/miami/bladesTest.js';

const report = runMiamiBladesTests();
if (!report.passed) process.exit(1);
