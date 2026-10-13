// Evidence for EXP-E08
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: N/A (expected=(诊断), got=Run hcloud --help to list available services.)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E08": {
    "status": "FAIL",
    "verdict": "N/A",
    "expect": "(诊断)",
    "got": "Run hcloud --help to list available services.",
    "prompt": "我的ECS启动失败了 帮我分析原因",
    "why": "serviceCatalog N/A: expected=(诊断), got=Run hcloud --help to list available services."
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E08-results.json', JSON.stringify(results, null, 2));
