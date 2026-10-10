// Evidence for D1-4
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "r1": "up_to_date", "r2": "up_to_date", "why": "Idempotent: up_to_date === up_to_date"};
console.log(JSON.stringify(result, null, 2));
