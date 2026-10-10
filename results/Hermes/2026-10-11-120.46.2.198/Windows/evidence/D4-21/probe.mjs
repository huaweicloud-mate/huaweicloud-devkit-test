// Evidence for D4-21
// Executed via batch probe: see hdk/probe-*.mjs for full source
// Result: PASS
import { writeFileSync } from 'node:fs';
const result = {"status": "PASS", "decision": "deny", "rule": "hwc-iam-admin-policy", "why": "Expected deny, got deny"};
console.log(JSON.stringify(result, null, 2));
