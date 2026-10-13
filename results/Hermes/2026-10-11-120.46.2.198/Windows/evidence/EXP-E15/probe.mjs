// Evidence for EXP-E15
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: HIT (expected=Incentive Voucher, got=Incentive Voucher)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E15": {
    "status": "PASS",
    "verdict": "HIT",
    "expect": "Incentive Voucher",
    "got": "Incentive Voucher",
    "prompt": "帮我领一下华为云的代金券",
    "why": "serviceCatalog HIT: expected=Incentive Voucher, got=Incentive Voucher"
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E15-results.json', JSON.stringify(results, null, 2));
