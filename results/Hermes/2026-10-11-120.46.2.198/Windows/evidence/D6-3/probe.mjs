// Evidence for D6-3
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: FAIL
import { writeFileSync } from 'node:fs';
const result = {"status": "FAIL", "hasServer": false, "why": "MCP server module loaded, exports=0"};
console.log(JSON.stringify(result, null, 2));
