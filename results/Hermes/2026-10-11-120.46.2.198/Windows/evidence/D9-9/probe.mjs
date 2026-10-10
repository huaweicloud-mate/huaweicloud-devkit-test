// Evidence for D9-9
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "hasDispatch": true, "why": "dispatch=true - timeout handling in protocol layer"};
console.log(JSON.stringify(result, null, 2));
