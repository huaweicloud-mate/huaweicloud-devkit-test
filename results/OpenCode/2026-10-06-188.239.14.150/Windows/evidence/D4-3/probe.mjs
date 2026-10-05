// D4-3 明文 secret API 拦截（P0 / safety-model Blocked#3）
// 断言：调用会返回明文/二进制 secret 的 API（DEW ShowSecretValue / ListSecrets 等）被阻断
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D4-3';
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const risk = await import(pathToFileURL(join(SRC, 'risk-rule-engine.mjs')).href);
const safety = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);

function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const SECRET_OPS = [
  ['DEW', 'ShowSecretValue', '--secret-name', 'probe-secret'],
  ['DEW', 'ShowSecretString', '--secret-name', 'probe-secret'],
  ['DEW', 'ShowSecretBinary', '--secret-name', 'probe-secret'],
  ['KMS', 'ShowSecret', '--secret-name', 'probe-secret'],
  ['DEW', 'CreateSecret', '--name', 'probe-secret', '--password', 'Aa123456!'],
];

const rows = [];
for (const args of SECRET_OPS) {
  const cmdText = ['hcloud', ...args].join(' ');
  const hook = await tools.callTool('huaweicloud_hook_check_command', { command: cmdText });
  const cls = safety.classifyTextCommand(cmdText);
  const ev = risk.evaluateCommandRisk(cmdText);
  rows.push({
    args,
    command: cmdText,
    hookDecision: hook && hook.decision,
    hookFindings: (hook && hook.findings || []).map((f) => `${f.ruleId}:${f.severity}`),
    classifyDecision: cls.decision,
    classifyRisk: cls.risk,
    riskEngineDecision: ev.decision,
  });
}
const plainSecretReads = rows.filter((r) => /showsecret|create/i.test(r.args[1] || ''));
const notBlocked = plainSecretReads.filter((r) => r.classifyDecision !== 'deny');
const ok = plainSecretReads.length > 0 && notBlocked.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `${plainSecretReads.length}/${plainSecretReads.length} 条明文 secret API 调用均被 classifyTextCommand 判 deny（safety-model Blocked#3）`
      : `存在未被阻断的明文 secret API：${JSON.stringify(notBlocked)}`,
  { blockedCount: plainSecretReads.length - notBlocked.length, total: plainSecretReads.length, rows });