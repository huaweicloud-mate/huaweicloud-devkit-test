import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const risk = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
let status = 'PASS', why = '', evidence = {};
try {
  // D4-9: 公开暴露/破坏性预检 — 公网暴露操作 + 破坏性操作应被拦截
  const cmds = [
    'hcloud ECS create-servers --name public-test --public-ip eip',
    'hcloud EIP create --public-ip --bandwidth-size 100',
    'hcloud IAM createUser --name backdoor --password P@ssw0rd',
    'hcloud ECS delete-servers --instance-ids i-xxxx --force',
    'rm -rf /var/lib/mysql',
  ];
  const results = cmds.map(c => ({ cmd: c, result: risk.evaluateCommandRisk(c) }));
  evidence.results = results;
  const blocked = results.filter(r => r.result.decision === 'deny' || r.result.decision === 'warn');
  if (blocked.length >= 3) {
    status = 'PASS'; why = '破坏性/公开暴露操作被拦截（' + blocked.length + '/' + cmds.length + ' deny|warn）';
  } else {
    status = 'FAIL'; why = '破坏性操作未充分拦截：' + JSON.stringify(results).slice(0,400);
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D4-9', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
