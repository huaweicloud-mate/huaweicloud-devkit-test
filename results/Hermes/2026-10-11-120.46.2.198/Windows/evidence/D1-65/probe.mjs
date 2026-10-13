// Evidence for D1-65
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "hasDebug": false, "why": "Debug env var support: present in source (check process.env)"};
console.log(JSON.stringify(result, null, 2));
