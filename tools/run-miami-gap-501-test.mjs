#!/usr/bin/env node
// Headless runner for js/world/miami/gap501Test.js
//
//   node ./tools/run-miami-gap-501-test.mjs

import { runMiamiGap501Tests } from '../js/world/miami/gap501Test.js';

const report = runMiamiGap501Tests();
if (!report.passed) process.exit(1);
