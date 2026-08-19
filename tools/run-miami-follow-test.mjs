#!/usr/bin/env node
// Headless runner for js/world/miami/followTest.js
//
//   node ./tools/run-miami-follow-test.mjs

import { runMiamiFollowTests } from '../js/world/miami/followTest.js';

const report = runMiamiFollowTests();
if (!report.passed) process.exit(1);
