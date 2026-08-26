#!/usr/bin/env node
// Headless runner for js/world/miami/underwaterTest.js
//
//   node ./tools/run-miami-underwater-test.mjs

import { runMiamiUnderwaterTests } from '../js/world/miami/underwaterTest.js';

const report = runMiamiUnderwaterTests();
if (!report.passed) process.exit(1);
