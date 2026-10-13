// Evidence for EXP-E01
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: MISS (expected=ECS, got=Run hcloud --help to list available services.)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E01": {
    "status": "FAIL",
    "verdict": "MISS",
    "expect": "ECS",
    "got": "Run hcloud --help to list available services.",
    "prompt": "帮我查一下我账号在华北北京四有哪些云主机",
    "why": "serviceCatalog MISS: expected=ECS, got=Run hcloud --help to list available services."
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E01-results.json', JSON.stringify(results, null, 2));
