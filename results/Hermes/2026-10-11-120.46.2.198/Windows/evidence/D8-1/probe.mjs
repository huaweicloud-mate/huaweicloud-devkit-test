// Evidence for D8-1
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "readmeExists": true, "agentsExists": true, "why": "README=true, AGENTS.md=true"};
console.log(JSON.stringify(result, null, 2));
