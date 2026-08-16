#!/usr/bin/env node
// Headless runner for js/physics/quadTest.js
//
//   node --import ./tools/alias-three.mjs ./tools/run-quad-test.mjs
//   node --import ./tools/alias-three.mjs ./tools/run-quad-test.mjs nazgul5

import { runQuadPhysicsTests } from '../js/physics/quadTest.js';

const drone = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : undefined;
const report = runQuadPhysicsTests({ drone });
if (!report.passed) process.exit(1);
