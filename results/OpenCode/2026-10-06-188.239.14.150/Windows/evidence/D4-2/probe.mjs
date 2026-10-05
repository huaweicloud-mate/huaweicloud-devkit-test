// D4-2 凭证 env 打印拦截（P0 / safety-model Blocked#2）
// 断言：printenv/echo 凭证 env（AK/SK/token）一律被阻断（deny）
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D4-2';
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
  'printenv HW_SECRET_KEY',
  'printenv HW_ACCESS_KEY',
  'echo $HW_SECRET_KEY',
  'echo $HW_ACCESS_KEY',
  'env | grep -i huaweicloud',
  'printenv | grep -i SECRET',
  'set | findstr HWC_SECRET',
  'echo $X_HW_SECURITY_TOKEN',
  'printenv HW_SECURITY_TOKEN',
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
  '两引擎判定不一致：plugins/huaweicloud-core/src/safety-policy.mjs:536-551 的 classifyTextCommand 已能拦截 "echo $HW_SECRET_KEY"（deny/credential，#650/#770 修复），',
  '但 plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json 规则 hwc-command-env-dump 的 match.all 要求同时出现 (env|printenv|Get-ChildItem Env:|gci Env:|dir Env:) 与凭证前缀(HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_)，',
  '纯 "echo $HW_SECRET_KEY" 不含 env/printenv → evaluateCommandRisk=allow；而 MCP 工具 huaweicloud_hook_check_command（src/tools.mjs:1147 hookResult(evaluateCommandRisk(args.command))）走的正是 evaluateCommandRisk，故对外呈现 allow。',
  '另 "printenv | grep -i SECRET" 两引擎均 allow（凭证前缀正则不含裸 SECRET），属同类盲区。',
].join('');
finish(ok ? 'PASS' : 'FAIL',
  ok ? `${rows.length}/${rows.length} 条凭证 env 打印命令均被阻断（deny，safety-model Blocked#2）`
      : `存在未被阻断的凭证 env 打印命令：${JSON.stringify(notBlocked)}`,
  { blockedCount: rows.length - notBlocked.length, total: rows.length, rows,
    rootCause: ok ? null : ROOT_CAUSE });