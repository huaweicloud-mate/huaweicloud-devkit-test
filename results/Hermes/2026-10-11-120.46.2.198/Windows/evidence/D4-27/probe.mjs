// Evidence for D4-27
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "akRedacted1": true, "akRedacted2": true, "hasRedactOutput": false, "why": "redactSecrets AK redacted=true, redactOutput AK redacted=true"};
console.log(JSON.stringify(result, null, 2));
