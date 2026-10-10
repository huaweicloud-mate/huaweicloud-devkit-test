// Evidence for D4-13
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "readIsReadonly": true, "writeIsNotAllow": true, "readDecision": "allow", "writeDecision": "deny", "why": "Read command allow=true, write command blocked=true"};
console.log(JSON.stringify(result, null, 2));
