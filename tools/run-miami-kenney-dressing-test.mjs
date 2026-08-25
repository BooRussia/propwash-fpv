#!/usr/bin/env node
import { runMiamiKenneyDressingTests } from '../js/world/miami/kenneyDressingTest.js';
const report = runMiamiKenneyDressingTests();
if (!report.passed) process.exit(1);
