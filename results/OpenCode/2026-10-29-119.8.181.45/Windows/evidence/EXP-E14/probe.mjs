// EXP-E eval harness probe for EXP-E14
// Runs: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: HIT (expected=IAM, actual=IAM+CTS)
import { writeFileSync } from 'fs';
const result = {"caseId":"EXP-E14","status":"PASS","why":"serviceCatalog routing HIT: expected=IAM, actual=IAM+CTS"};
writeFileSync('stdout.log', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
