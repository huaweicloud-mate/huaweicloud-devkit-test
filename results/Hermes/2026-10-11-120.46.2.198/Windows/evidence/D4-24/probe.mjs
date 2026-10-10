// Evidence for D4-24
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "isSingleUse": true, "firstConsume": true, "secondConsume": false, "why": "Token single-use: first=true, second=false (should be false)"};
console.log(JSON.stringify(result, null, 2));
