#!/usr/bin/env node
// Headless runner for js/world/miami/eighthTest.js
//
//   node ./tools/run-miami-eighth-test.mjs

import { runMiamiEighthTests } from '../js/world/miami/eighthTest.js';

const report = runMiamiEighthTests();
if (!report.passed) process.exit(1);
