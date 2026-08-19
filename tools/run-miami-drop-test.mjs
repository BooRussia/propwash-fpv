#!/usr/bin/env node
// Headless runner for js/world/miami/dropTest.js
//
//   node ./tools/run-miami-drop-test.mjs

import { runMiamiDropTests } from '../js/world/miami/dropTest.js';

const report = runMiamiDropTests();
if (!report.passed) process.exit(1);
