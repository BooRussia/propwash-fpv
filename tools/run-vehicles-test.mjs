#!/usr/bin/env node
// Headless runner for js/world/vehiclesTest.js
//
//   node ./tools/run-vehicles-test.mjs

import { runVehiclesTests } from '../js/world/vehiclesTest.js';

const report = runVehiclesTests();
if (!report.passed) process.exit(1);
