// Probe for D1-41: check_update 真实 MCP 返回契约
import { judgeUpdate } from './plugins/huaweicloud-core/src/update-check.mjs';
const avail = judgeUpdate('1.1.7', { latest: '1.1.8', next: null });
console.log(JSON.stringify({
  status: (avail.result && avail.targetVersion) ? 'PASS' : 'FAIL',
  allKeys: Object.keys(avail),
  result: avail.result, targetVersion: avail.targetVersion, currentVersion: avail.currentVersion,
}, null, 2));
