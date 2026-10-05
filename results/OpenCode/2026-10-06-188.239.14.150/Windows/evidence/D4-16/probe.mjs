// D4-16 命令包裹穿透（P0）
// 断言：shell 包裹（bash -c / sh -c / cmd /c / powershell -Command / && / ; / 管道 / 子命令）
//       包裹下的内层 hcloud 高危命令必须被发现并拦截
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D4-16';
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const safety = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);

function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const WRAPPERS = [
  { kind: 'bash -c', command: 'bash -c "hcloud ECS DeleteServers --server-ids x"' },
  { kind: 'sh -c', command: "sh -c 'hcloud ECS DeleteServers --server-ids x'" },
  { kind: 'cmd /c', command: 'cmd /c "hcloud ECS DeleteServers --server-ids x"' },
  { kind: 'powershell -Command', command: 'powershell -Command "hcloud ECS DeleteServers --server-ids x"' },
  { kind: 'pwsh -c', command: 'pwsh -c "hcloud ECS DeleteServers --server-ids x"' },
  { kind: '&& 串联', command: 'echo ok && hcloud ECS DeleteServers --server-ids x' },
  { kind: '; 串联', command: 'echo ok ; hcloud ECS DeleteServers --server-ids x' },
  { kind: '管道', command: 'echo x | hcloud ECS DeleteServers --server-ids x' },
  { kind: '包裹凭证读取', command: 'bash -c "cat ~/.config/huaweicloud/credentials.json"' },
  { kind: '嵌套双层包裹', command: 'bash -c "sh -c \'hcloud ECS DeleteServers --server-ids x\'"' },
];

const rows = [];
for (const w of WRAPPERS) {
  const hook = await tools.callTool('huaweicloud_hook_check_command', { command: w.command });
  const cls = safety.classifyTextCommand(w.command);
  let inner = null;
  try { inner = safety.extractInnerCommand(w.command); } catch (e) { inner = { error: e.message }; }
  rows.push({
    kind: w.kind,
    command: w.command,
    hookDecision: hook && hook.decision,
    hookFindings: (hook && hook.findings || []).map((f) => `${f.ruleId}:${f.severity}`),
    classifyDecision: cls.decision,
    classifyRisk: cls.risk,
    extractedInner: inner,
    penetrated: cls.decision === 'allow' && hook && hook.decision === 'allow',
  });
}
const penetrated = rows.filter((r) => r.penetrated);
const ok = penetrated.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `${rows.length} 种 shell 包裹场景全部被发现内层命令并拦截`
      : `${penetrated.length} 种包裹穿透成功：${JSON.stringify(penetrated)}`,
  { wrapperCount: rows.length, penetrated, rows });