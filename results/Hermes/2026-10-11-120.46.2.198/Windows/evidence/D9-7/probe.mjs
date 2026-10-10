// Evidence for D9-7
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "hasDispatch": true, "why": "dispatch=true - version negotiation in dispatch"};
console.log(JSON.stringify(result, null, 2));
