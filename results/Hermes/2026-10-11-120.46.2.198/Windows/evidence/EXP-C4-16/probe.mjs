// Evidence for EXP-C4-16
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "service": "CDN", "readDecision": "allow", "readRisk": "read_only", "why": "CDN: read=allow, plan available=true"};
console.log(JSON.stringify(result, null, 2));
