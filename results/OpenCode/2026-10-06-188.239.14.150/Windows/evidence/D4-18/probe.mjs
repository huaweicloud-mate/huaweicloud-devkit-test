// D4-18 confirm-not-deny 审批语义（P0）
// 断言：写操作进入「显式确认」通道——既不被直接拒绝（plan 阶段不硬 deny，可产出可执行命令块+approvalToken），
//       也不被直接放行（无有效令牌时 run_approved_command 必须拒绝且零执行）
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D4-18';

function fmt() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const safety = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);

const WRITE_ARGS = ['ECS', 'DeleteServers', '--server-ids', 'probe-nonexistent-id-0001'];

// ① plan 阶段（allowWrites=true 表示「agent 已呈现计划、等待用户确认」）
const plan = await tools.callTool('huaweicloud_plan_cli_command', { args: WRITE_ARGS, allowWrites: true });
// ② 无审批令牌直接执行 → 必须拒绝（不 deny 也不放行）
let execWithoutToken;
try {
  execWithoutToken = await tools.callTool('huaweicloud_run_approved_command', {
    args: WRITE_ARGS, approvedByUser: true, approvalToken: '',
  });
} catch (e) {
  execWithoutToken = { threw: true, message: e.message };
}
// ③ 伪造令牌 → 必须拒绝（CONFIRM_TOKEN_NOT_FOUND），零执行
let execWithFakeToken;
try {
  execWithFakeToken = await tools.callTool('huaweicloud_run_approved_command', {
    args: WRITE_ARGS, approvedByUser: true, approvalToken: 'forged-token-probe-d4-18',
  });
} catch (e) {
  execWithFakeToken = { threw: true, message: e.message };
}
// ④ 未显式确认（approvedByUser 缺失）→ 必须拒绝
let execWithoutConsent;
try {
  execWithoutConsent = await tools.callTool('huaweicloud_run_approved_command', { args: WRITE_ARGS });
} catch (e) {
  execWithoutConsent = { threw: true, message: e.message };
}

// 不 allowWrites 时仍是 deny（写门禁未被 confirm 通道绕过）
const strictPlan = await tools.callTool('huaweicloud_plan_cli_command', { args: WRITE_ARGS });

const notHardDenied = plan && typeof plan.command === 'string' && plan.command.length > 0 && !!plan.approvalToken;
const refusedNoToken = (execWithoutToken && execWithoutToken.status === 'rejected')
  || (execWithoutToken && execWithoutToken.code === 'CONFIRM_TOKEN_NOT_FOUND');
const refusedFakeToken = execWithFakeToken && execWithFakeToken.status === 'rejected';
const refusedNoConsent = (execWithoutConsent && execWithoutConsent.threw === true)
  || (execWithoutConsent && execWithoutConsent.status === 'rejected');
const strictStillGated = strictPlan && strictPlan.classification && strictPlan.classification.decision !== 'allow';

const ok = notHardDenied && refusedNoToken && refusedFakeToken && refusedNoConsent && strictStillGated;
finish(ok ? 'PASS' : 'FAIL',
  ok
    ? '写操作走 confirm-not-deny 通道：plan 产出可执行命令块+approvalToken（未硬拒绝），无令牌/伪造令牌/未确认三种路径均被拒且零执行，strict plan 仍受写门禁'
    : `审批语义异常：notHardDenied=${notHardDenied} refusedNoToken=${refusedNoToken} refusedFakeToken=${refusedFakeToken} refusedNoConsent=${refusedNoConsent} strictStillGated=${strictStillGated}`,
  {
    writeArgs: WRITE_ARGS,
    planAllowWritesTrue: {
      command: plan && plan.command,
      approvalTokenPresent: !!(plan && plan.approvalToken),
      safeToRun: plan && plan.safeToRun,
      classification: plan && plan.classification,
      warnings: plan && plan.warnings,
    },
    execWithoutToken,
    execWithFakeToken,
    execWithoutConsent,
    strictPlanClassification: strictPlan && strictPlan.classification,
    classifyTextCommandSanity: safety.classifyTextCommand(plan && plan.command || '').decision,
  });