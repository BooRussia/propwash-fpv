#!/usr/bin/env node
// Headless runner for js/world/miami/lincolnTest.js
//
//   node ./tools/run-miami-lincoln-test.mjs

import { runMiamiLincolnTests } from '../js/world/miami/lincolnTest.js';

const report = runMiamiLincolnTests();
if (!report.passed) process.exit(1);
