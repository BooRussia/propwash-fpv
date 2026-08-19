#!/usr/bin/env node
// Headless runner for js/world/miami/warehouseTest.js
//
//   node ./tools/run-miami-warehouse-test.mjs

import { runMiamiWarehouseTests } from '../js/world/miami/warehouseTest.js';

const report = runMiamiWarehouseTests();
if (!report.passed) process.exit(1);
