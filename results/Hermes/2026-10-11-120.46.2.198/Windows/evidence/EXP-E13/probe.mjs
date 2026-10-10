// Evidence for EXP-E13
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: MISS (expected=ELB, got=Run hcloud --help to list available services.)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E13": {
    "status": "FAIL",
    "verdict": "MISS",
    "expect": "ELB",
    "got": "Run hcloud --help to list available services.",
    "prompt": "申请HTTPS证书并配置到我的域名",
    "why": "serviceCatalog MISS: expected=ELB, got=Run hcloud --help to list available services."
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E13-results.json', JSON.stringify(results, null, 2));
