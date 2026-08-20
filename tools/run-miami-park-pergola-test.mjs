#!/usr/bin/env node
// Headless runner for js/world/miami/parkPergolaTest.js
//
//   node ./tools/run-miami-park-pergola-test.mjs

import { runMiamiParkPergolaTests } from '../js/world/miami/parkPergolaTest.js';

const report = runMiamiParkPergolaTests();
if (!report.passed) process.exit(1);
