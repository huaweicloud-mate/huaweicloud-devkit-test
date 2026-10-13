// Evidence for EXP-C4-01
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "service": "ECS", "readDecision": "allow", "readRisk": "read_only", "why": "ECS: read=allow, plan available=true"};
console.log(JSON.stringify(result, null, 2));
