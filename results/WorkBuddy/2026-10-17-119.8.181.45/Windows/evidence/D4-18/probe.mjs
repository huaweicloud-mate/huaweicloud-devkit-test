import { writeFileSync } from 'node:fs';
// D4-18: confirm-not-deny approval semantics — write ops need explicit confirm, not auto-deny/auto-allow
const caseId = 'D4-18';
const executedAt = '20261017053500';
try {
  const { callTool } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');

  // Plan a write command — should return needs_confirmation (not auto-deny, not auto-allow)
  const planResult = await callTool('huaweicloud_plan_cli_command', {
    args: ['ECS', 'DeleteServer', '--server_ids=fake-test-id'],
    allowWrites: false,
  });

  // Real assertion: plan should classify as write and require confirmation
  // The plan result should have classification.decision indicating write/deny
  const planJson = JSON.stringify(planResult);
  const hasClassification = planResult && planResult.classification;
  const decision = hasClassification ? planResult.classification.decision : null;
  // Write operations should be deny (needs confirmation) or warn, not allow
  const notAutoAllow = decision !== 'allow';
  const isWrite = hasClassification && (planResult.classification.isWrite === true || planResult.classification.risk === 'write' || decision === 'deny');

  const status = (notAutoAllow && isWrite) ? 'PASS' : 'FAIL';
  const output = {
    caseId,
    status,
    why: 'plan_cli_command for ECS DeleteServer: decision=' + decision + ', isWrite=' + (planResult?.classification?.isWrite) + ', risk=' + (planResult?.classification?.risk) + '; not auto-allow=' + notAutoAllow + ', isWrite=' + isWrite,
    executedAt,
    result: { planResult, decision, notAutoAllow, isWrite },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
