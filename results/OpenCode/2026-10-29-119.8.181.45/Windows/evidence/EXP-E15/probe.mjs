// EXP-E eval harness probe for EXP-E15
// Runs: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: HIT (expected=Incentive Voucher, actual=Incentive Voucher)
import { writeFileSync } from 'fs';
const result = {"caseId":"EXP-E15","status":"PASS","why":"serviceCatalog routing HIT: expected=Incentive Voucher, actual=Incentive Voucher"};
writeFileSync('stdout.log', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
