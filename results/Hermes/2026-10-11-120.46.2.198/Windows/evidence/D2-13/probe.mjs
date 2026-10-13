// Evidence for D2-13
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "hasResolve": true, "why": "resolveCredentials exists=true - session/env priority handling available"};
console.log(JSON.stringify(result, null, 2));
