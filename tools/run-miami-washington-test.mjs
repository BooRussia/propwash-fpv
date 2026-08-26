#!/usr/bin/env node
// Headless runner for js/world/miami/washingtonTest.js
//
//   node ./tools/run-miami-washington-test.mjs

import { runMiamiWashingtonTests } from '../js/world/miami/washingtonTest.js';

const report = runMiamiWashingtonTests();
if (!report.passed) process.exit(1);
