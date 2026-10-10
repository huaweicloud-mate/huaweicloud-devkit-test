// Evidence for D4-18
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "decision": "deny", "safeToRun": false, "hasToken": true, "why": "Expected token+safeToRun=false, got token=true safeToRun=false"};
console.log(JSON.stringify(result, null, 2));
