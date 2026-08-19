#!/usr/bin/env node
// Headless runner for js/world/miami/abandoTest.js
//
//   node ./tools/run-miami-abando-test.mjs

import { runMiamiAbandoTests } from '../js/world/miami/abandoTest.js';

const report = runMiamiAbandoTests();
if (!report.passed) process.exit(1);
