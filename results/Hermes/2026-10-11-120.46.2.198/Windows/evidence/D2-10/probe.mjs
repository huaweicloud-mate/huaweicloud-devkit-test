// Evidence for D2-10
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: FAIL
import { writeFileSync } from 'node:fs';
const result = {"status": "FAIL", "hasProfiles": false, "why": "KooCLI profile management=false"};
console.log(JSON.stringify(result, null, 2));
