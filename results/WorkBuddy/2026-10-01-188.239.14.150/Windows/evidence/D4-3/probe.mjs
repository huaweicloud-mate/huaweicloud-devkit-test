import { writeFileSync } from 'node:fs';
import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const caseId = 'D4-3';
const result = { caseId, status: 'NOT_RUN', why: '', executedAt: '' };

// D4-3: 明文secret API拦截
// Spec: 调用返回明文/二进制secret的API → 被阻断
// hcloud KMS/CSMS/DEW uses CamelCase operations: ShowSecret, ShowSecretVersion, DownloadSecret, GetSecretValue

try {
  const cmds = [
    'hcloud KMS ShowSecret --secret_id=xxx',
    'hcloud KMS ShowSecretVersion --secret_id=xxx',
    'hcloud CSMS ShowSecretVersion --secret_name prod/db',
    'hcloud DEW ShowSecret --secret_name prod/db',
    'hcloud KMS DownloadSecret --secret_id=xxx',
    'hcloud KMS GetSecretValue --secret_id=xxx',
  ];
  const results = cmds.map((cmd) => ({ cmd, ...classifyTextCommand(cmd) }));
  result.details = results;
  const allDenied = results.every((r) => r.decision === 'deny' && r.risk === 'secret');
  if (allDenied) {
    result.status = 'PASS';
    result.why = `All ${results.length} plaintext secret API calls (ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue across KMS/CSMS/DEW) blocked (deny, risk=secret)`;
  } else {
    result.status = 'FAIL';
    result.why = `Expected all deny/secret; got: ${results.filter((r) => r.decision !== 'deny' || r.risk !== 'secret').map((r) => `${r.cmd}=${r.decision}/${r.risk}`).join(', ')}`;
  }
} catch (e) {
  result.status = 'FAIL';
  result.why = `probe threw: ${e?.message || e}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync('stdout.log', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
