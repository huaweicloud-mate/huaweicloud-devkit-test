// Evidence for EXP-E12
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: MISS (expected=CES, got=Run hcloud --help to list available services.)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E12": {
    "status": "FAIL",
    "verdict": "MISS",
    "expect": "CES",
    "got": "Run hcloud --help to list available services.",
    "prompt": "把应用日志指标推送到云监控告警",
    "why": "serviceCatalog MISS: expected=CES, got=Run hcloud --help to list available services."
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E12-results.json', JSON.stringify(results, null, 2));
