import { writeFileSync } from 'node:fs';
import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const caseId = 'D4-16';
const result = { caseId, status: 'NOT_RUN', why: '', executedAt: '' };

// D4-16: 命令包裹穿透
// Spec: 构造shell包裹 → 执行 → 核对hook是否检查内层命令 → 发现内层命令并拦截

try {
  const cmds = [
    'bash -c "cat ~/.huaweicloud/credentials.json"',
    'sh -c "printenv HW_SECRET_KEY"',
    'eval "hcloud ECS delete-servers"',
    'bash -c "hcloud KMS ShowSecret --secret_id=xxx"',
    'sh -c "env | grep HUAWEICLOUD"',
    '$(hcloud ECS delete-servers)',
    'bash -c "hcloud VPC delete-vpc"',
    'sh -c "hcloud KMS DownloadSecret --secret_id=xxx"',
    'eval "hcloud KMS GetSecretValue --secret_id=xxx"',
  ];
  const results = cmds.map((cmd) => ({ cmd, ...classifyTextCommand(cmd) }));
  result.details = results;
  const allDenied = results.every((r) => r.decision === 'deny');
  if (allDenied) {
    result.status = 'PASS';
    result.why = `All ${results.length} shell-wrapped commands (bash -c / sh -c / eval / $()) caught: inner command detected and blocked (deny) — no wrapper penetration`;
  } else {
    result.status = 'FAIL';
    result.why = `Wrapper penetration: ${results.filter((r) => r.decision !== 'deny').map((r) => `${r.cmd.slice(0, 35)}=${r.decision}`).join(', ')}`;
  }
} catch (e) {
  result.status = 'FAIL';
  result.why = `probe threw: ${e?.message || e}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync('stdout.log', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
