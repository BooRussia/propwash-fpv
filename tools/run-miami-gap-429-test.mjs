#!/usr/bin/env node
// Headless runner for js/world/miami/gap429Test.js
//
//   node ./tools/run-miami-gap-429-test.mjs

import { runMiamiGap429Tests } from '../js/world/miami/gap429Test.js';

const report = runMiamiGap429Tests();
if (!report.passed) process.exit(1);
