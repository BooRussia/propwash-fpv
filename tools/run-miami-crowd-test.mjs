#!/usr/bin/env node
// Headless runner for js/world/miami/crowdTest.js
//
//   node ./tools/run-miami-crowd-test.mjs

import { runMiamiCrowdTests } from '../js/world/miami/crowdTest.js';

const report = runMiamiCrowdTests();
if (!report.passed) process.exit(1);
