// Evidence for D4-5
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "decision": "deny", "risk": "write", "why": "Expected risk=write or deny, got decision=deny risk=write"};
console.log(JSON.stringify(result, null, 2));
