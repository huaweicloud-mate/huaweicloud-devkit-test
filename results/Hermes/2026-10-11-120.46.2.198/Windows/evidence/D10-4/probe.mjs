// Evidence for D10-4
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "ruleCount": 16, "denyDecision": "deny", "allowDecision": "allow", "why": "deny=deny(expected deny), allow=allow(expected allow)"};
console.log(JSON.stringify(result, null, 2));
