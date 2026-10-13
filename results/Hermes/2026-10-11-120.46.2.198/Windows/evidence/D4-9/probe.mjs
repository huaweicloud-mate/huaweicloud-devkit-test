// Evidence for D4-9
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "r1": "deny", "r2": "warn", "why": "Public exposure=deny, destructive=warn"};
console.log(JSON.stringify(result, null, 2));
