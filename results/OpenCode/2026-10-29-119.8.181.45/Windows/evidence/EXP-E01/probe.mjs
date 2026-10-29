// EXP-E eval harness probe for EXP-E01
// Runs: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: MISS (expected=ECS, actual=Run hcloud --help to list available services.)
import { writeFileSync } from 'fs';
const result = {"caseId":"EXP-E01","status":"FAIL","why":"serviceCatalog routing MISS: expected=ECS, actual=Run hcloud --help to list available services. (routing failed to match Chinese intent to ECS service)"};
writeFileSync('stdout.log', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
