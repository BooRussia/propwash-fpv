#!/usr/bin/env node
// Headless runner for js/world/miami/sitePlanTest.js
// JSON-only (does not import sitePlan.js / three).
//
//   node ./tools/run-miami-site-plan-test.mjs

import { runMiamiSitePlanTests } from '../js/world/miami/sitePlanTest.js';

const report = runMiamiSitePlanTests();
if (!report.passed) process.exit(1);
