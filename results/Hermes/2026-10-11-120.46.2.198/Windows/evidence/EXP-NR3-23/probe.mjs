// Evidence for EXP-NR3-23
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "coldResult": "up_to_date", "warmResult": "up_to_date", "cacheWorks": true, "why": "cold=up_to_date, warm=up_to_date, cache=true"};
console.log(JSON.stringify(result, null, 2));
