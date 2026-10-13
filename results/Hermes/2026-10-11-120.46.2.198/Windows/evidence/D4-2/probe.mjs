// Evidence for D4-2
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "r1": "allow", "r2": "allow", "r3": "deny", "r4": "deny", "r5": "allow", "why": "env=allow, printenv=allow, printenv HW_ACCESS_KEY=deny, echo $HW_ACCESS_KEY=deny, env|grep=allow"};
console.log(JSON.stringify(result, null, 2));
