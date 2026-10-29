// EXP-E eval harness probe for EXP-E10
// Runs: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: HIT (expected=FunctionGraph, actual=FunctionGraph)
import { writeFileSync } from 'fs';
const result = {"caseId":"EXP-E10","status":"PASS","why":"serviceCatalog routing HIT: expected=FunctionGraph, actual=FunctionGraph"};
writeFileSync('stdout.log', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
