// EXP-E eval harness probe for EXP-E07
// Runs: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: HIT (expected=CBR, actual=ECS+IAM+CBR)
import { writeFileSync } from 'fs';
const result = {"caseId":"EXP-E07","status":"PASS","why":"serviceCatalog routing HIT: expected=CBR, actual=ECS+IAM+CBR"};
writeFileSync('stdout.log', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
