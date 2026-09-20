import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { loadRiskRules, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

// D4-5: 写操作误判检测 - write commands should NOT be misclassified as read-only
console.log('=== D4-5: write op misclassification ===');
const d45tests = [
  { cmd: 'hcloud ECS DeleteServers --instance_ids i-1234', expectNot: 'allow' },
  { cmd: 'hcloud ECS BatchStopServers', expectNot: 'allow' },
  { cmd: 'hcloud VPC DeleteVpc --vpc_id vpc-1234', expectNot: 'allow' },
  { cmd: 'hcloud IAM DeleteUser --user_name test', expectNot: 'allow' },
];
let d45pass = true;
for (const t of d45tests) {
  const r = classifyTextCommand(t.cmd);
  const ok = r.decision !== t.expectNot;
  if (!ok) d45pass = false;
  console.log('  ' + t.cmd + ' => ' + r.decision + ' ' + (ok ? 'OK' : 'FAIL(misclassified as allow)'));
}
console.log('D4-5_VERDICT=' + (d45pass ? 'PASS' : 'FAIL'));

// D4-9: 公开暴露/破坏性预检
console.log('=== D4-9: public exposure / destructive preflight ===');
const d49tests = [
  { cmd: 'hcloud SG CreateSecurityGroupRule --remote_ip_prefix 0.0.0.0/0 --port 22', expect: 'deny' },
  { cmd: 'hcloud ECS DeleteServers --force', expect: 'deny' },
  { cmd: 'rm -rf /', expect: 'deny' },
];
let d49pass = true;
for (const t of d49tests) {
  const r = evaluateCommandRisk(t.cmd);
  const ok = r.decision === t.expect;
  if (!ok) d49pass = false;
  console.log('  ' + t.cmd + ' => ' + r.decision + ' ' + (ok ? 'OK' : 'FAIL'));
}
console.log('D4-9_VERDICT=' + (d49pass ? 'PASS' : 'FAIL'));

// D4-15: hook绕过尝试 - adversarial variants
console.log('=== D4-15: hook bypass attempts ===');
const d415tests = [
  'CAT ~/.hcloud/credentials.json',
  'cat ~/.HCloud/credentials.json',
  'cat ~/.hcloud/credentials.json%00',
  'cat ~/​.hcloud/credentials.json',
  'c""at ~/.hcloud/credentials.json',
];
let d415pass = true;
let d415blocked = 0;
for (const cmd of d415tests) {
  const r = classifyTextCommand(cmd);
  if (r.decision === 'deny') d415blocked++;
  console.log('  variant: ' + cmd + ' => ' + r.decision);
}
// At least the basic case-insensitive should be caught
const r1 = classifyTextCommand('CAT ~/.hcloud/credentials.json');
console.log('  case-insensitive CAT blocked=' + (r1.decision === 'deny'));
d415pass = r1.decision === 'deny';
console.log('D4-15_VERDICT=' + (d415pass ? 'PASS' : 'FAIL'));

// D4-16: 命令包裹穿透
console.log('=== D4-16: command wrapping ===');
const d416tests = [
  'bash -c "cat ~/.hcloud/credentials.json"',
  'sh -c "cat ~/.hcloud/credentials.json"',
  'powershell -c "cat ~/.hcloud/credentials.json"',
  'cmd /c "type credentials.json"',
];
let d416pass = true;
for (const cmd of d416tests) {
  const r = classifyTextCommand(cmd);
  console.log('  wrapped: ' + cmd + ' => ' + r.decision);
}
// Check if at least some wrapping is caught
const wrapR = classifyTextCommand('bash -c "cat ~/.hcloud/credentials.json"');
d416pass = wrapR.decision === 'deny';
console.log('D4-16_VERDICT=' + (d416pass ? 'PASS' : 'FAIL'));

// D4-21: hook_check_artifacts - broad IAM policy
console.log('=== D4-21: hook_check_artifacts broad IAM ===');
const broadIamPolicy = JSON.stringify({
  Statement: [{ Effect: 'Allow', Action: ['*:*'], Resource: ['*'] }],
});
const d421r = evaluateArtifacts([{ path: 'policy.json', content: broadIamPolicy }]);
const d421pass = d421r.decision === 'deny';
console.log('  broad IAM policy => ' + d421r.decision + ' findings=' + d421r.findings.length);
console.log('D4-21_VERDICT=' + (d421pass ? 'PASS' : 'FAIL'));

// D4-22: hook_check_deploy_plan - public FunctionGraph
console.log('=== D4-22: hook_check_deploy_plan ===');
const deployPlan = JSON.stringify({
  service: 'FunctionGraph',
  trigger: { type: 'APIG', auth: 'NONE', public: true },
});
const d422r = evaluateDeployPlan({ plan: deployPlan });
const d422pass = d422r.decision === 'warn' || d422r.decision === 'deny';
console.log('  public FunctionGraph deploy => ' + d422r.decision + ' findings=' + d422r.findings.length);
console.log('D4-22_VERDICT=' + (d422pass ? 'PASS' : 'FAIL'));
