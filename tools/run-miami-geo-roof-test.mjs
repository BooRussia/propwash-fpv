#!/usr/bin/env node
// Headless runner for js/world/miami/geoRoofTest.js
//
//   node ./tools/run-miami-geo-roof-test.mjs

import { runMiamiGeoRoofTests } from '../js/world/miami/geoRoofTest.js';

const report = runMiamiGeoRoofTests();
if (!report.passed) process.exit(1);
