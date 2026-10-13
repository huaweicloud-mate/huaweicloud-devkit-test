// Evidence for EXP-E07
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: MISS (expected=CBR, got=Run hcloud --help to list available services.)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E07": {
    "status": "FAIL",
    "verdict": "MISS",
    "expect": "CBR",
    "got": "Run hcloud --help to list available services.",
    "prompt": "给生产环境的服务器配置一个每日备份策略",
    "why": "serviceCatalog MISS: expected=CBR, got=Run hcloud --help to list available services."
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E07-results.json', JSON.stringify(results, null, 2));
