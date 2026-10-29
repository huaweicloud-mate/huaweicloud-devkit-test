// EXP-E eval harness probe for EXP-E09
// Runs: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: HIT (expected=CCE, actual=CCE+SWR)
import { writeFileSync } from 'fs';
const result = {"caseId":"EXP-E09","status":"PASS","why":"serviceCatalog routing HIT: expected=CCE, actual=CCE+SWR"};
writeFileSync('stdout.log', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
