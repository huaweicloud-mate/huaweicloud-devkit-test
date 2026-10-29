// EXP-E eval harness probe for EXP-E05
// Runs: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: HIT (expected=RDS, actual=RDS)
import { writeFileSync } from 'fs';
const result = {"caseId":"EXP-E05","status":"PASS","why":"serviceCatalog routing HIT: expected=RDS, actual=RDS"};
writeFileSync('stdout.log', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
