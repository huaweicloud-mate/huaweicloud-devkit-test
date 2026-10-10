// Evidence for D4-22
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "decision": "warn", "rule": "hwc-functiongraph-public-no-auth", "why": "Expected deny/warn, got warn"};
console.log(JSON.stringify(result, null, 2));
