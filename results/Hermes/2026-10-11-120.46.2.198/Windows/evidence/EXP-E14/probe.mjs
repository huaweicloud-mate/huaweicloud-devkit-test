// Evidence for EXP-E14
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: MISS (expected=IAM, got=Run hcloud --help to list available services.)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E14": {
    "status": "FAIL",
    "verdict": "MISS",
    "expect": "IAM",
    "got": "Run hcloud --help to list available services.",
    "prompt": "我账号下的用户都有哪些权限 帮我审计一下",
    "why": "serviceCatalog MISS: expected=IAM, got=Run hcloud --help to list available services."
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E14-results.json', JSON.stringify(results, null, 2));
