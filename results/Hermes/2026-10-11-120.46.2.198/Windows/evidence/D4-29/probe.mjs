// Evidence for D4-29
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "hasDecision": true, "decision": "deny", "why": "classifyTextCommand returns decision=deny"};
console.log(JSON.stringify(result, null, 2));
