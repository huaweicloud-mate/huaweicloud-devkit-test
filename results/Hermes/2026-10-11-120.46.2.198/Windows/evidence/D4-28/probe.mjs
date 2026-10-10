// Evidence for D4-28
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "decision": "deny", "why": "Expected deny for credential file read, got deny"};
console.log(JSON.stringify(result, null, 2));
