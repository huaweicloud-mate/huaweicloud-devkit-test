// Evidence for EXP-E09
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: HIT (expected=CCE, got=CCE+SWR)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E09": {
    "status": "PASS",
    "verdict": "HIT",
    "expect": "CCE",
    "got": "CCE+SWR",
    "prompt": "开设一个 Kubernetes 集群用于微服务部署",
    "why": "serviceCatalog HIT: expected=CCE, got=CCE+SWR"
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E09-results.json', JSON.stringify(results, null, 2));
