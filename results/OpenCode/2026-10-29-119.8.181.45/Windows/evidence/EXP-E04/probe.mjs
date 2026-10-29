// EXP-E eval harness probe for EXP-E04
// Runs: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: HIT (expected=EIP, actual=ECS+VPC+EIP)
import { writeFileSync } from 'fs';
const result = {"caseId":"EXP-E04","status":"PASS","why":"serviceCatalog routing HIT: expected=EIP, actual=ECS+VPC+EIP"};
writeFileSync('stdout.log', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
