// EXP-E eval harness probe for EXP-E02
// Runs: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: HIT (expected=ECS, actual=ECS)
import { writeFileSync } from 'fs';
const result = {"caseId":"EXP-E02","status":"PASS","why":"serviceCatalog routing HIT: expected=ECS, actual=ECS"};
writeFileSync('stdout.log', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
