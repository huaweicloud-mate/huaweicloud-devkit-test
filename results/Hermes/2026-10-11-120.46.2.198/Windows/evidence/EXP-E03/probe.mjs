// Evidence for EXP-E03
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: MISS (expected=OBS, got=Sandbox+DevStation)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E03": {
    "status": "FAIL",
    "verdict": "MISS",
    "expect": "OBS",
    "got": "Sandbox+DevStation",
    "prompt": "把本地 dist 目录部署成一个公网静态网站",
    "why": "serviceCatalog MISS: expected=OBS, got=Sandbox+DevStation"
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E03-results.json', JSON.stringify(results, null, 2));
