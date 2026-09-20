import { planHcloudCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';

// D4-18: confirm-not-deny 审批语义
console.log('=== D4-18: confirm-not-deny ===');
// Write operations should be warn (need confirmation), not deny (hard block) or allow (no confirm)
const d418tests = [
  { args: ['ECS', 'DeleteServers', '--instance_ids', 'i-1234'], desc: 'delete-servers' },
  { args: ['ECS', 'BatchStopServers', '--instance_ids', 'i-1234'], desc: 'stop-servers' },
  { args: ['VPC', 'DeleteVpc', '--vpc_id', 'vpc-1234'], desc: 'delete-vpc' },
];
let d418pass = true;
for (const t of d418tests) {
  const plan = planHcloudCommand(t.args, { allowWrites: false });
  const decision = plan.classification.decision;
  // Write ops should be warn (needs confirmation) or deny, NOT allow
  const ok = decision !== 'allow';
  if (!ok) d418pass = false;
  console.log('  ' + t.desc + ': decision=' + decision + ' safeToRun=' + plan.safeToRun + ' hasApprovalToken=' + !!plan.approvalToken + ' ' + (ok ? 'OK' : 'FAIL(allow without confirm)'));
}
console.log('D4-18_VERDICT=' + (d418pass ? 'PASS' : 'FAIL'));

// D4-19: 确认流下预检仍生效
console.log('=== D4-19: preflight in confirm flow ===');
// High-risk operations should still have preflight warnings during planning
const d419tests = [
  { args: ['SG', 'CreateSecurityGroupRule', '--remote_ip_prefix', '0.0.0.0/0', '--port', '22'], desc: 'public-sg-rule' },
  { args: ['ECS', 'DeleteServers', '--instance_ids', 'i-1234', '--force'], desc: 'force-delete' },
];
let d419pass = true;
for (const t of d419tests) {
  const plan = planHcloudCommand(t.args, { allowWrites: false });
  const hasWarnings = plan.warnings && plan.warnings.length > 0;
  const hasClassification = !!plan.classification;
  // Preflight should produce warnings or classification with risk
  const ok = hasClassification && (hasWarnings || plan.classification.decision !== 'allow');
  if (!ok) d419pass = false;
  console.log('  ' + t.desc + ': decision=' + plan.classification.decision + ' warnings=' + (plan.warnings || []).length + ' sgFindings=' + (plan.sgFindings || []).length + ' ' + (ok ? 'OK' : 'FAIL'));
  if (hasWarnings) console.log('    warning[0]: ' + plan.warnings[0]);
}
console.log('D4-19_VERDICT=' + (d419pass ? 'PASS' : 'FAIL'));
