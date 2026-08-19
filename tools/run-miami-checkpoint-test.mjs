#!/usr/bin/env node
// Headless runner for js/world/miami/checkpointTest.js
//
//   node ./tools/run-miami-checkpoint-test.mjs

import { runMiamiCheckpointTests } from '../js/world/miami/checkpointTest.js';

const report = runMiamiCheckpointTests();
if (!report.passed) process.exit(1);
