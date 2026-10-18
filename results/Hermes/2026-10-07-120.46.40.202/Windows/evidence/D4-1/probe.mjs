import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
const r = classifyTextCommand('cat ~/.hcloud/credentials.json');
console.log(JSON.stringify({status: r.decision === 'deny' ? 'PASS' : 'FAIL', decision: r.decision, risk: r.risk, reason: r.reason}));