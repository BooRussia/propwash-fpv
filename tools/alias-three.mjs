// Node loader entry: map the bare 'three' specifier used by the flight
// model onto a local stub so js/physics/quadTest.js can run headless.
import { register } from 'node:module';

if (typeof globalThis.localStorage === 'undefined') {
  const mem = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); },
  };
}

register('./alias-three-hooks.mjs', import.meta.url);
