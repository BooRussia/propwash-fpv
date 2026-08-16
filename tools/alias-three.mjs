// Node loader entry: map the bare 'three' specifier used by the flight
// model onto a local stub so js/physics/quadTest.js can run headless.
import { register } from 'node:module';

register('./alias-three-hooks.mjs', import.meta.url);
