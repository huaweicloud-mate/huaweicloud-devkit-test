// D4-1 凭证文件读取拦截（P0 / safety-model Blocked#1）
// 断言：读取 devkit 凭证文件的命令（含 Windows type/PowerShell 变体）一律被阻断（deny/credential）
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D4-1';
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

const CASES = [
  'cat ~/.config/huaweicloud/credentials.json',
  'type $env:USERPROFILE\\.config\\huaweicloud\\credentials.json',
  'Get-Content ~/.huaweicloud/credentials.json',
  'cat ~/.config/huaweicloud/credentials.readonly.json',
  'cat ~/.obsutilconfig',
  'more < %USERPROFILE%\\.obsutilconfig',
  'cp ~/.config/huaweicloud/credentials.json /tmp/leak.json',
];

const rows = [];
for (const cmd of CASES) {
  const hook = await tools.callTool('huaweicloud_hook_check_command', { command: cmd });
  const cls = safety.classifyTextCommand(cmd);
  const ev = risk.evaluateCommandRisk(cmd);
  rows.push({
    command: cmd,
    hookDecision: hook && hook.decision,
    hookFindings: (hook && hook.findings || []).map((f) => `${f.ruleId}:${f.severity}`),
    classifyDecision: cls.decision,
    classifyRisk: cls.risk,
    riskEngineDecision: ev.decision,
  });
}
const notBlocked = rows.filter((r) => r.hookDecision !== 'deny');
const ok = rows.length > 0 && notBlocked.length === 0;
const ROOT_CAUSE = [
  '(1) plugins/huaweicloud-core/safety/policy.json 的 credentialFilePatterns = [".hcloud", ".huaweicloud", "hcloud[/\\\\](config|credentials)", "huaweicloud[/\\\\](config|credentials)"]，',
  '被 safety-policy.mjs:501 matchesAny(candidate, policy.credentialFilePatterns) 使用，不含 .obsutilconfig；',
  '(2) plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json 规则 hwc-command-credential-file 的正则仅覆盖 .hcloud|.huaweicloud 与 hcloud/huaweicloud/(config|credentials)。',
  '而 .obsutilconfig 正是 devkit 自身 writeObsConfigFile 写入 AK/SK 的 S3 凭证仓（src/auth/credentials.mjs:45 obsConfigPath），读取它等同读取明文凭证。',
].join('');
finish(ok ? 'PASS' : 'FAIL',
  ok ? `${rows.length}/${rows.length} 条凭证文件读取命令均被 hook_check_command 判 deny（safety-model Blocked#1）`
      : `存在未被阻断的凭证读取命令：${JSON.stringify(notBlocked)}`,
  { blockedCount: rows.length - notBlocked.length, total: rows.length, rows,
    rootCause: ok ? null : ROOT_CAUSE });