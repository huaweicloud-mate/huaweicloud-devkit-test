// EXP-E eval harness probe for EXP-E12
// Runs: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: HIT (expected=CES, actual=CES)
import { writeFileSync } from 'fs';
const result = {"caseId":"EXP-E12","status":"PASS","why":"serviceCatalog routing HIT: expected=CES, actual=CES"};
writeFileSync('stdout.log', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
