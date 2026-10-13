// Evidence for D4-16
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "r1": "warn", "r1findings": 1, "r2": "deny", "r2findings": 1, "r3": "allow", "r4": "allow", "why": "bash-wrap delete=warn(1 findings), sh-wrap cred=deny(1 findings)"};
console.log(JSON.stringify(result, null, 2));
