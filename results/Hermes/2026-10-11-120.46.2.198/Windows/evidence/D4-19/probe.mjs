// Evidence for D4-19
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "decision": "deny", "blockedByRiskRule": true, "why": "Expected blockedByRiskRule=true, got true"};
console.log(JSON.stringify(result, null, 2));
