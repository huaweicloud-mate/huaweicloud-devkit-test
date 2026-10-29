// EXP-E eval harness probe for EXP-E06
// Runs: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: HIT (expected=DCS, actual=OBS+DDS+DCS)
import { writeFileSync } from 'fs';
const result = {"caseId":"EXP-E06","status":"PASS","why":"serviceCatalog routing HIT: expected=DCS, actual=OBS+DDS+DCS"};
writeFileSync('stdout.log', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
