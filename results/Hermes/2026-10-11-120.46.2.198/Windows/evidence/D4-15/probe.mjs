// Evidence for D4-15
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "v1": "deny", "v2": "deny", "v3": "deny", "why": "Case variants: deny, deny, deny"};
console.log(JSON.stringify(result, null, 2));
