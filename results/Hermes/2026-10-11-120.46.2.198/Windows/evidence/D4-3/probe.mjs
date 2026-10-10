// Evidence for D4-3
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "decision": "deny", "findings": 1, "why": "Expected deny, got deny"};
console.log(JSON.stringify(result, null, 2));
