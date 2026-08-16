#!/usr/bin/env node
// Headless runner for js/world/miami/rejectsTest.js
//
//   node ./tools/run-miami-rejects-test.mjs

import { runMiamiRejectsTests } from '../js/world/miami/rejectsTest.js';

const report = runMiamiRejectsTests();
if (!report.passed) process.exit(1);
