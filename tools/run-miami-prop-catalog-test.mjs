#!/usr/bin/env node
import { runMiamiPropCatalogTests } from '../js/world/miami/propCatalogTest.js';
const report = runMiamiPropCatalogTests();
if (!report.passed) process.exit(1);
