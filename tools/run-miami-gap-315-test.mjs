#!/usr/bin/env node
// Headless runner for js/world/miami/gap315Test.js
//
//   node ./tools/run-miami-gap-315-test.mjs

import { runMiamiGap315Tests } from '../js/world/miami/gap315Test.js';

const report = runMiamiGap315Tests();
if (!report.passed) process.exit(1);
