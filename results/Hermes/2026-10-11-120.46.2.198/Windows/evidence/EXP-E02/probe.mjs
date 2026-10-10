// Evidence for EXP-E02
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: MISS (expected=ECS, got=Run hcloud --help to list available services.)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E02": {
    "status": "FAIL",
    "verdict": "MISS",
    "expect": "ECS",
    "got": "Run hcloud --help to list available services.",
    "prompt": "创建一台 2C4G 的 Ubuntu 云服务器 规格通用型",
    "why": "serviceCatalog MISS: expected=ECS, got=Run hcloud --help to list available services."
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E02-results.json', JSON.stringify(results, null, 2));
