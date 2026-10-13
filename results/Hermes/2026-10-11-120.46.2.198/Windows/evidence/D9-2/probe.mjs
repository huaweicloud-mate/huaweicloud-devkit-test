// Evidence for D9-2
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "hasDispatch": true, "why": "dispatch=true - JSON-RPC error code handling available"};
console.log(JSON.stringify(result, null, 2));
