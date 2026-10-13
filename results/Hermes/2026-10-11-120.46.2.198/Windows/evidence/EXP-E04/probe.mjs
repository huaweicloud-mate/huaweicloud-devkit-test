// Evidence for EXP-E04
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: MISS (expected=EIP, got=Run hcloud --help to list available services.)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E04": {
    "status": "FAIL",
    "verdict": "MISS",
    "expect": "EIP",
    "got": "Run hcloud --help to list available services.",
    "prompt": "给这台服务器绑定一个弹性公网IP",
    "why": "serviceCatalog MISS: expected=EIP, got=Run hcloud --help to list available services."
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E04-results.json', JSON.stringify(results, null, 2));
