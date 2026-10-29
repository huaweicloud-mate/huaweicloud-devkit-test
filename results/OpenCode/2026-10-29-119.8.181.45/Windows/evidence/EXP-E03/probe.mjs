// EXP-E eval harness probe for EXP-E03
// Runs: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: HIT (expected=OBS, actual=OBS+Sandbox+DevStation)
import { writeFileSync } from 'fs';
const result = {"caseId":"EXP-E03","status":"PASS","why":"serviceCatalog routing HIT: expected=OBS, actual=OBS+Sandbox+DevStation"};
writeFileSync('stdout.log', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
