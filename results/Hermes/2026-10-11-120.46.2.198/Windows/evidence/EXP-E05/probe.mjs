// Evidence for EXP-E05
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: MISS (expected=RDS, got=Run hcloud --help to list available services.)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E05": {
    "status": "FAIL",
    "verdict": "MISS",
    "expect": "RDS",
    "got": "Run hcloud --help to list available services.",
    "prompt": "看一下我的云数据库MySQL实例的状态",
    "why": "serviceCatalog MISS: expected=RDS, got=Run hcloud --help to list available services."
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E05-results.json', JSON.stringify(results, null, 2));
