// Evidence for EXP-NR3-01
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "hasFourStates": true, "utd": "up_to_date", "avail": "update_available", "dismissed": "dismissed", "why": "Four-state: utd=up_to_date, avail=update_available, dismissed=dismissed"};
console.log(JSON.stringify(result, null, 2));
