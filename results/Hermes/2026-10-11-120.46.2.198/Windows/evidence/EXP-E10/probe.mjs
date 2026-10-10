// Evidence for EXP-E10
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: MISS (expected=FunctionGraph, got=Run hcloud --help to list available services.)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E10": {
    "status": "FAIL",
    "verdict": "MISS",
    "expect": "FunctionGraph",
    "got": "Run hcloud --help to list available services.",
    "prompt": "部署一个函数处理图片自动压缩",
    "why": "serviceCatalog MISS: expected=FunctionGraph, got=Run hcloud --help to list available services."
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E10-results.json', JSON.stringify(results, null, 2));
