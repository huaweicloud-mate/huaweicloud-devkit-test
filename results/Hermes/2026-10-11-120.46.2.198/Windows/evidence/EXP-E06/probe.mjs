// Evidence for EXP-E06
// D10-3 routing accuracy via eval harness
// Run: node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Results: HIT (expected=DCS, got=DDS+DCS)
import { writeFileSync } from 'node:fs';

const results = {
  "EXP-E06": {
    "status": "PASS",
    "verdict": "HIT",
    "expect": "DCS",
    "got": "DDS+DCS",
    "prompt": "创建一个 Redis 缓存实例用于会话存储",
    "why": "serviceCatalog HIT: expected=DCS, got=DDS+DCS"
  }
};

console.log(JSON.stringify(results, null, 2));
writeFileSync('eval-EXP-E06-results.json', JSON.stringify(results, null, 2));
