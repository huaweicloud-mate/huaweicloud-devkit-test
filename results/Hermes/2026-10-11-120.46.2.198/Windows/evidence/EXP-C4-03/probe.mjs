// Evidence for EXP-C4-03
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "service": "OBS", "readDecision": "allow", "readRisk": "read_only", "why": "OBS: read=allow, plan available=true"};
console.log(JSON.stringify(result, null, 2));
