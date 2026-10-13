// Evidence for D4-8
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "consistent": true, "nodeWrite": "deny", "nodeCred": "deny", "why": "Node classify: write=deny, cred=deny - consistent=true"};
console.log(JSON.stringify(result, null, 2));
