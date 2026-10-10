// Evidence for EXP-E11
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: MISS (expected=BSS, got=Run hcloud --help to list available services.)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E11": {
    "status": "FAIL",
    "verdict": "MISS",
    "expect": "BSS",
    "got": "Run hcloud --help to list available services.",
    "prompt": "查一下我账号这个月的费用情况",
    "why": "serviceCatalog MISS: expected=BSS, got=Run hcloud --help to list available services."
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E11-results.json', JSON.stringify(results, null, 2));
