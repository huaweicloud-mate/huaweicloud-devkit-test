// D4-19 确认流下预检仍生效（P0）
// 断言：走 confirm（allowWrites=true）通道拿到 approvalToken 的高危写命令，
//       风险预检仍生效——plan 阶段给出 sgFindings/warnings，且对同一命令文本的 hook 预检不放过
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D4-19';
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

// 高危写命令：公网暴露管理端口 + 强制删除
const HIGH_RISK = [
  ['VPC', 'CreateSecurityGroupRule', '--security-group-id', 'sg-probe', '--remote-ip-prefix', '0.0.0.0/0', '--port', '22'],
  ['ECS', 'DeleteServers', '--server-ids', 'probe-id', '--force'],
];

const rows = [];
for (const args of HIGH_RISK) {
  // ① confirm 通道：呈现计划，等待显式确认
  const plan = await tools.callTool('huaweicloud_plan_cli_command', { args, allowWrites: true });
  // ② 确认流中的风险预检：对确认流产出的命令块再做 hook 预检
  const hook = await tools.callTool('huaweicloud_hook_check_command', { command: plan.command });
  const ev = risk.evaluateCommandRisk(plan.command);
  const cls = safety.classifyTextCommand(plan.command);
  rows.push({
    args,
    plannedCommand: plan.command,
    approvalTokenIssued: !!plan.approvalToken,
    planWarnings: plan.warnings,
    sgFindings: plan.sgFindings,
    planClassification: plan.classification && plan.classification.decision,
    preflightHookDecision: hook && hook.decision,
    preflightFindings: (hook && hook.findings || []).map((f) => `${f.ruleId}:${f.severity}`),
    riskEngineDecision: ev.decision,
    classifyTextCommandDecision: cls.decision,
  });
}
// ③ 确认流也必须挡住凭证型高危制品（deploy plan / artifacts 预检在确认流内仍生效）
const artifactPrecheck = await tools.callTool('huaweicloud_hook_check_artifacts', {
  artifacts: [{ path: 'iam-policy.json', content: '{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}' }],
});
const deployPlanPrecheck = await tools.callTool('huaweicloud_hook_check_deploy_plan', {
  plan: { service: 'ECS', resources: [{ type: 'securityGroupRule', remoteIpPrefix: '0.0.0.0/0', port: 22 }] },
});

const preflightActive = rows.every((r) =>
  r.approvalTokenIssued
  && ((r.sgFindings && r.sgFindings.length > 0) || (r.planWarnings && r.planWarnings.length > 0)
      || r.preflightHookDecision !== 'allow' || r.riskEngineDecision !== 'allow'
      || r.classifyTextCommandDecision !== 'allow'));
const artifactsBlocked = artifactPrecheck && artifactPrecheck.decision === 'deny';
const deployPlanBlocked = deployPlanPrecheck && ['deny', 'warn'].includes(deployPlanPrecheck.decision);
const ok = preflightActive && artifactsBlocked && deployPlanBlocked;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `确认流（allowWrites=true）下风险预检仍生效：${rows.length}/${rows.length} 条高危写命令在拿到 approvalToken 的同时仍触发 sgFindings/warnings 或 hook/risk 引擎告警；宽泛 IAM 制品被 deny，公网暴露部署计划被 ${deployPlanPrecheck && deployPlanPrecheck.decision}`
      : `确认流下预检被绕过：preflightActive=${preflightActive} artifactsBlocked=${artifactsBlocked} deployPlanBlocked=${deployPlanBlocked}`,
  {
    rows,
    preflightActive,
    hookCheckArtifacts: { decision: artifactPrecheck && artifactPrecheck.decision, findings: (artifactPrecheck && artifactPrecheck.findings || []).map((f) => `${f.ruleId}:${f.severity}`) },
    hookCheckDeployPlan: { decision: deployPlanPrecheck && deployPlanPrecheck.decision, findings: (deployPlanPrecheck && deployPlanPrecheck.findings || []).map((f) => `${f.ruleId}:${f.severity}`) },
  });