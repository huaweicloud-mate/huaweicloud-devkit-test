import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const risk = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
let status = 'PASS', why = '', evidence = {};
try {
  // D4-3: 明文 secret API 拦截 — 命中 hwc-command-secret-value-read / hwc-command-secret-in-arg 规则
  // 规则匹配 ShowSecret/ShowSecretVersion/GetSecretValue 或 hcloud ... --secret= 明文
  const cmds = [
    'hcloud csms ShowSecret --secret-id my-secret',
    'hcloud csms ShowSecretVersion --secret-id my-secret --version-id v1',
    'hcloud csms GetSecretValue --secret-id my-secret',
    'hcloud csms secret-show --secret-id my-secret --adminPass=p@ssw0rd',
    'hcloud RDS create-instance --adminPass PlainTextPwd123',
    'hcloud csms secret-show --secret-id my-secret --token=abc123 --password=xyz',
  ];
  const results = cmds.map(c => ({ cmd: c, result: risk.evaluateCommandRisk(c) }));
  evidence.results = results;
  const denyCount = results.filter(r => r.result.decision === 'deny').length;
  const warnCount = results.filter(r => r.result.decision === 'warn').length;
  if (denyCount >= 3) {
    status = 'PASS'; why = '明文 secret API/参数命令被 deny（deny=' + denyCount + ', warn=' + warnCount + '/' + cmds.length + '）';
  } else {
    status = 'FAIL'; why = '明文 secret 命令未充分 deny（deny=' + denyCount + ', warn=' + warnCount + '/' + cmds.length + '）：' + JSON.stringify(results).slice(0,400);
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D4-3', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
