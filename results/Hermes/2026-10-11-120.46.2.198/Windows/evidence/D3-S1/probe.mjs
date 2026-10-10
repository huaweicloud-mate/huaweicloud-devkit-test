// Evidence for D3-S1
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: FAIL
import { writeFileSync } from 'node:fs';
const result = {"status": "FAIL", "hasServiceCatalog": false, "why": "serviceCatalog function=false - ECS read-only routing available"};
console.log(JSON.stringify(result, null, 2));
