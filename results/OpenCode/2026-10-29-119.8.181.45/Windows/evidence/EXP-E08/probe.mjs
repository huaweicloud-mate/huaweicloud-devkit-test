// EXP-E eval harness probe for EXP-E08
// Runs: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: N/A (expected=(诊断), actual=Run hcloud --help to list available services.)
import { writeFileSync } from 'fs';
const result = {"caseId":"EXP-E08","status":"BLOCKED","why":"serviceCatalog routing N/A: expected=(诊断), actual=Run hcloud --help to list available services."};
writeFileSync('stdout.log', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
