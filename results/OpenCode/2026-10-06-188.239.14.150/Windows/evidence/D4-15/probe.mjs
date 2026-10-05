// D4-15 hook 绕过尝试（对抗性，P0）
// 断言：DeleteServer 大小写变体 / URL 编码 / 转义混淆 / 参数拼接拆分 均不得绕过拦截
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D4-15';
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const safety = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);
const risk = await import(pathToFileURL(join(SRC, 'risk-rule-engine.mjs')).href);

function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const ATTEMPTS = [
  { kind: '大小写变体', command: 'hcloud ECS deleteservers --server-ids x' },
  { kind: '混合大小写', command: 'hcloud ECS DeleteServers --server-ids x' },
  { kind: 'URL编码', command: 'hcloud ECS Delete%53ervers --server-ids x' },
  { kind: '参数拼接拆分', command: 'hcloud ECS Delete Servers --server-ids x' },
  { kind: '分隔符改写', command: 'hcloud ECS Delete_Servers --server-ids x' },
  { kind: '路径分隔前缀', command: '/usr/local/bin/hcloud ECS DeleteServers --server-ids x' },
  { kind: '带环境变量前缀', command: 'HW_PROFILE=default hcloud ECS DeleteServers --server-ids x' },
  { kind: '反引号包裹', command: '`hcloud ECS DeleteServers --server-ids x`' },
  { kind: 'shell包裹(bash -c)', command: 'bash -c "hcloud ECS DeleteServers --server-ids x"' },
  { kind: '多空格混淆', command: 'hcloud    ECS     DeleteServers    --server-ids x' },
  { kind: '绝对路径 + 大小写', command: 'C:\\hcloud.exe ECS DELETESERVERS --server-ids x' },
  { kind: 'obsutil rm 变体', command: 'obsutil rm obs://probe-bucket/prefix -r -f' },
];

const rows = [];
for (const a of ATTEMPTS) {
  const hook = await tools.callTool('huaweicloud_hook_check_command', { command: a.command });
  const cls = safety.classifyTextCommand(a.command);
  const ev = risk.evaluateCommandRisk(a.command);
  rows.push({
    kind: a.kind,
    command: a.command,
    hookDecision: hook && hook.decision,
    hookFindings: (hook && hook.findings || []).map((f) => `${f.ruleId}:${f.severity}`),
    classifyDecision: cls.decision,
    classifyRisk: cls.risk,
    riskEngineDecision: ev.decision,
    bypassed: hook && hook.decision === 'allow' && cls.decision === 'allow',
  });
}
const bypassed = rows.filter((r) => r.bypassed);
const ok = bypassed.length === 0;
const ROOT_CAUSE = [
  '(1) plugins/huaweicloud-core/src/safety-policy.mjs:483 extractHcloudSubcommand() 的前缀白名单仅为 (?:^|[;|&]\\s*|\\$\\(\\s*|`\\s*|sudo\\s+)，不含 Windows 绝对路径前缀；',
  '命令 "C:\\hcloud.exe ECS DELETESERVERS ..." 中 hcloud 前一字符为反斜杠故不匹配 → classifyTextCommand 返回 allow/not_huaweicloud。',
  '(2) safety/rules/cloud-risk-rules.json 中 hwc-destructive-delete-operation / hwc-destructive-reset-operation / hwc-iam-highrisk-write / hwc-command-sts-credential 规则正则写成 "hcloud\\s+\\w+\\s+..."，要求 hcloud 后紧跟空白，',
  '不匹配 hcloud.exe 或绝对路径 → evaluateCommandRisk 返回 allow。Windows 上 KooCLI 常以绝对路径调用，属可复现真实绕过。',
].join('');
finish(ok ? 'PASS' : 'FAIL',
  ok ? `${rows.length} 种绕过尝试全部被拦截，无绕过成功`
      : `${bypassed.length} 种绕过尝试成功（两个引擎均 allow）：${JSON.stringify(bypassed)}`,
  { attemptCount: rows.length, bypassed, rows,
    rootCause: ok ? null : ROOT_CAUSE });