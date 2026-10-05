// D4-9 公开暴露/破坏性预检（P0）
// 断言：①公网暴露操作（0.0.0.0/0 + 管理端口）在执行前被拦（hook_check_command deny）
//       ②破坏性操作（rm -rf / / force 删除 / 重启）在执行前被拦
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D4-9';
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const safety = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);

function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const PUBLIC_EXPOSURE = [
  'hcloud VPC CreateSecurityGroupRule --remote-ip-prefix 0.0.0.0/0 --port 22',
  'hcloud ECS CreateSecurityGroupRule --cidr 0.0.0.0/0 --port 3389',
  'hcloud VPC UpdateSecurityGroupRule --remote-ip-prefix 0.0.0.0/0 --port 3306',
];
const DESTRUCTIVE = [
  'rm -rf /',
  'hcloud ECS DeleteServers --server-ids x --force',
  'mkfs.ext4 /dev/sda1',
  'dd if=/dev/zero of=/dev/sda',
  'hcloud OBS DeleteBucket --bucket my-bucket',
];

async function probe(list, label) {
  const rows = [];
  for (const command of list) {
    const hook = await tools.callTool('huaweicloud_hook_check_command', { command });
    const cls = safety.classifyTextCommand(command);
    rows.push({
      command,
      hookDecision: hook && hook.decision,
      hookFindings: (hook && hook.findings || []).map((f) => `${f.ruleId}:${f.severity}`),
      classifyDecision: cls.decision,
      classifyRisk: cls.risk,
    });
  }
  return { label, rows, notBlocked: rows.filter((r) => r.hookDecision === 'allow' && r.classifyDecision === 'allow') };
}

const exposure = await probe(PUBLIC_EXPOSURE, '公网暴露');
const destructive = await probe(DESTRUCTIVE, '破坏性操作');

const notBlocked = [...exposure.notBlocked, ...destructive.notBlocked];
const ok = notBlocked.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `公网暴露 ${PUBLIC_EXPOSURE.length} 条 + 破坏性 ${DESTRUCTIVE.length} 条命令均被至少一个引擎在执行前拦截（deny/warn）`
      : `以下高危命令执行前未被任何引擎拦截：${JSON.stringify(notBlocked)}`,
  { exposure, destructive, notBlocked });