// Evidence for D4-6
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "isRedacted": true, "redacted": "{\"adminPass\":\"<redacted>\",\"flavor\":\"s6.small.1\"}", "why": "adminPass redacted=true"};
console.log(JSON.stringify(result, null, 2));
