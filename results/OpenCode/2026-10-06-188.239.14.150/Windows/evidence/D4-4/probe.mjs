// D4-4 write-operation approval gate (P1)
// case: trigger each of the 12 write verbs -> every write verb must be forced through approval
// gate: plan_cli_command must not report safeToRun=true for any write verb (plan never executes)
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const HOOKS = process.env.HDK_HOOKS || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/hooks';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

const VERBS = [
  { verb: 'create', args: ['ECS', 'CreateServers', '--name', 'tctest-d4-4', '--flavor-id', 't6.smallest', '--image-id', 'probe'] },
  { verb: 'delete', args: ['ECS', 'DeleteServers', '--servers', 'probe-id'] },
  { verb: 'update', args: ['ECS', 'UpdateServerName', '--servers', 'probe-id', '--name', 'probe'] },
  { verb: 'resize', args: ['ECS', 'ResizeServer', '--servers', 'probe-id', '--flavor-id', 't6.medium'] },
  { verb: 'start', args: ['ECS', 'StartServers', '--servers', 'probe-id'] },
  { verb: 'stop', args: ['ECS', 'StopServers', '--servers', 'probe-id'] },
  { verb: 'authorize', args: ['VPC', 'AuthorizeSecurityGroupRule', '--security-group-id', 'probe-sg'] },
  { verb: 'revoke', args: ['VPC', 'RevokeSecurityGroupRule', '--security-group-id', 'probe-sg', '--rule-id', 'probe-rule'] },
  { verb: 'attach', args: ['EVS', 'AttachVolume', '--servers', 'probe-id', '--volume-id', 'probe-vol'] },
  { verb: 'detach', args: ['EVS', 'DetachVolume', '--volume-id', 'probe-vol'] },
  { verb: 'enable', args: ['SMN', 'EnableTopic', '--topic-urn', 'urn:probe:topic'] },
  { verb: 'disable', args: ['SMN', 'DisableTopic', '--topic-urn', 'urn:probe:topic'] },
];
const results = [];
for (const item of VERBS) {
  const plan = await callTool('huaweicloud_plan_cli_command', { args: item.args });
  results.push({
    verb: item.verb,
    decision: plan.classification && plan.classification.decision,
    safeToRun: plan.safeToRun,
    hasApprovalToken: typeof plan.approvalToken === 'string' && plan.approvalToken.length > 0,
    ruleId: (plan.classification && plan.classification.ruleId) || null,
  });
}
const rows = results.map((r) => ({
  id: '写动词 ' + r.verb + ' 被强制审批(不可直接执行)',
  ok: r.safeToRun === false && r.decision !== 'allow',
  actual: r,
}));
const violations = rows.filter((x) => !x.ok);
const allHaveToken = results.every((r) => r.hasApprovalToken);
const ok = violations.length === 0 && allHaveToken;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `12 类写动词全部被审批门拦截：每条写语义命令 plan_cli_command 均返回 decision!=allow 且 safeToRun=false，并附带 approvalToken（plan 阶段不执行任何命令）`
      : `写操作审批门断言不成立：${JSON.stringify(violations)}`,
  { verbsTested: results.length, results, allHaveApprovalToken: allHaveToken, rows, violations });
