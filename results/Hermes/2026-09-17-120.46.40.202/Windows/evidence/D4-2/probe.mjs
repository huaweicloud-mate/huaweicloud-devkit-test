// P0 Safety Classification Probes: D4-1, D4-2, D4-3, D4-5, D4-9, D4-15, D4-16
import { classifyHcloudArgs, redactSecrets, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, loadRiskRules } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';

const results = {};

// ============ D4-1: Credential file read blocked ============
console.log('\n=== D4-1: Credential file read interception ===');
const d4_1_cmds = [
  'cat ~/.hcloud/credentials.json',
  'type %USERPROFILE%\\.hcloud\\credentials.json',
  'cat ~/.huaweicloud/credentials.json',
  'cat ~/.config/huaweicloud/credentials.json',
  'cat ~/.hcloud/credential.json',
];
const d4_1_results = [];
for (const cmd of d4_1_cmds) {
  const r = evaluateCommandRisk(cmd);
  console.log(`  [${r.decision}] ${cmd}`);
  d4_1_results.push({ cmd, decision: r.decision, findings: r.findings?.map(f => f.ruleId) });
}
results['D4-1'] = { allBlocked: d4_1_results.every(r => r.decision === 'deny'), details: d4_1_results };

// ============ D4-2: Credential env print blocked ============
console.log('\n=== D4-2: Credential env print interception ===');
const d4_2_cmds = [
  'env | grep HW_ACCESS_KEY',
  'printenv HW_ACCESS_KEY',
  'echo $HW_ACCESS_KEY',
  'printenv HUAWEICLOUD_ACCESS_KEY',
  'env | grep HWC_SECRET_KEY',
  'echo $HCLOUD_ACCESS_KEY',
  'printenv HW_SECRET_ACCESS_KEY',
  'env | grep AK',
];
const d4_2_results = [];
for (const cmd of d4_2_cmds) {
  const r = evaluateCommandRisk(cmd);
  console.log(`  [${r.decision}] ${cmd}`);
  d4_2_results.push({ cmd, decision: r.decision, findings: r.findings?.map(f => f.ruleId) });
}
results['D4-2'] = { allBlocked: d4_2_results.every(r => r.decision === 'deny'), details: d4_2_results };

// ============ D4-3: Plaintext secret API interception ============
console.log('\n=== D4-3: Plaintext secret API interception ===');
const d4_3_cmds = [
  ['DEW', 'ShowSecret', '--secret_id=test'],
  ['KMS', 'ShowSecret', '--secret_id=test'],
  ['CSMS', 'ShowSecretVersion', '--secret_id=test', '--version_id=v1'],
  ['DEW', 'ListSecrets', '--name=test'],
  ['KMS', 'DecryptData', '--cipher_text=test'],
];
const d4_3_results = [];
for (const args of d4_3_cmds) {
  const r = classifyHcloudArgs(args);
  console.log(`  [${r.decision}/${r.risk}] hcloud ${args.join(' ')}`);
  d4_3_results.push({ args, decision: r.decision, risk: r.risk, reason: r.reason });
}
const d4_3_text = [
  'hcloud DEW ShowSecret --secret_id=test',
  'hcloud KMS ShowSecret --secret_id=test',
];
for (const cmd of d4_3_text) {
  const r = evaluateCommandRisk(cmd);
  console.log(`  [${r.decision}] ${cmd}`);
  d4_3_results.push({ cmd, decision: r.decision });
}
results['D4-3'] = { allBlocked: d4_3_results.every(r => r.decision === 'deny'), details: d4_3_results };

// ============ D4-5: Write operation misjudgment detection ============
console.log('\n=== D4-5: Write operation classification (must not be read_only/allow) ===');
const d4_5_cmds = [
  ['ECS', 'DeleteServer', '--server_id=test'],
  ['ECS', 'CreateServer', '--name=test'],
  ['VPC', 'DeleteVpc', '--vpc_id=test'],
  ['RDS', 'DeleteInstance', '--instance_id=test'],
  ['EVS', 'DeleteVolume', '--volume_id=test'],
  ['IAM', 'CreateUser', '--name=test'],
  ['CCE', 'DeleteCluster', '--cluster_id=test'],
  ['OBS', 'DeleteBucket', '--bucket=test'],
];
const d4_5_results = [];
for (const args of d4_5_cmds) {
  const r = classifyHcloudArgs(args);
  const misjudged = (r.decision === 'allow' && r.risk !== 'write') || r.risk === 'read_only';
  console.log(`  [${r.decision}/${r.risk}] hcloud ${args.join(' ')}${misjudged ? ' MISJUDGED!' : ''}`);
  d4_5_results.push({ args, decision: r.decision, risk: r.risk, misjudged });
}
results['D4-5'] = { noMisjudgment: d4_5_results.every(r => !r.misjudged), details: d4_5_results };

// ============ D4-9: Public exposure / destructive pre-check ============
console.log('\n=== D4-9: Public exposure / destructive pre-check ===');
const d4_9_public = [
  ['VPC', 'CreateSecurityGroupRule', '--direction=ingress', '--port_range_min=22', '--protocol=tcp', '--remote_ip_prefix=0.0.0.0/0'],
  ['VPC', 'CreateSecurityGroupRule', '--direction=ingress', '--port_range_min=3389', '--protocol=tcp', '--remote_ip_prefix=0.0.0.0/0'],
  ['ELB', 'CreateListener', '--protocol=TCP', '--protocol_port=22'],
];
const d4_9_destructive = [
  ['ECS', 'DeleteServer', '--server_id=test'],
  ['RDS', 'DeleteInstance', '--instance_id=test'],
  ['EVS', 'DeleteVolume', '--volume_id=test'],
];
const d4_9_results = [];
for (const args of d4_9_public) {
  const r = planHcloudCommand(args, { allowWrites: true });
  console.log(`  [${r.classification.decision}] hcloud ${args.join(' ')} (with approval) blockedByRiskRule=${r.classification.blockedByRiskRule}`);
  d4_9_results.push({ type: 'public', args, decision: r.classification.decision, blockedByRiskRule: r.classification.blockedByRiskRule });
}
for (const args of d4_9_destructive) {
  const r = planHcloudCommand(args);
  console.log(`  [${r.classification.decision}/${r.classification.risk}] hcloud ${args.join(' ')} (no approval) safeToRun=${r.safeToRun}`);
  d4_9_results.push({ type: 'destructive', args, decision: r.classification.decision, risk: r.classification.risk, safeToRun: r.safeToRun });
}
results['D4-9'] = {
  publicBlocked: d4_9_results.filter(r => r.type === 'public').every(r => r.decision === 'deny'),
  destructiveBlocked: d4_9_results.filter(r => r.type === 'destructive').every(r => !r.safeToRun),
  details: d4_9_results
};

// ============ D4-15: Hook bypass attempts ============
console.log('\n=== D4-15: Hook bypass attempt detection ===');
const d4_15_variants = [
  ['ECS', 'DeleteServer', '--server_id=test'],
  ['ecs', 'deleteserver', '--server_id=test'],
  ['ECS', 'DELETEserver', '--server_id=test'],
  ['ECS', 'Delete_Server', '--server_id=test'],
  ['ECS', 'DeleteServer', '--server_id', 'test'],
  ['Ecs', 'DeleteServer', '--SERVER_ID=test'],
];
const d4_15_results = [];
for (const args of d4_15_variants) {
  const r = classifyHcloudArgs(args);
  const bypassed = r.decision !== 'deny' && r.risk !== 'write';
  console.log(`  [${r.decision}/${r.risk}] hcloud ${args.join(' ')}${bypassed ? ' BYPASSED!' : ''}`);
  d4_15_results.push({ args, decision: r.decision, risk: r.risk, bypassed });
}
results['D4-15'] = { noBypass: d4_15_results.every(r => !r.bypassed), details: d4_15_results };

// ============ D4-16: Command wrapping penetration ============
console.log('\n=== D4-16: Command wrapping penetration ===');
const d4_16_wraps = [
  'bash -c "hcloud ECS DeleteServer --server_id=test"',
  'sh -c "hcloud ECS DeleteServer"',
  'cmd /c "hcloud ECS DeleteServer --server_id=test"',
  'powershell -c "hcloud ECS DeleteServer"',
  'hcloud ECS DeleteServer; echo done',
  'hcloud ECS DeleteServer && echo ok',
  '$(hcloud ECS DeleteServer)',
  'hcloud ECS DeleteServer | tee log',
];
const d4_16_results = [];
for (const cmd of d4_16_wraps) {
  const r = evaluateCommandRisk(cmd);
  const penetrated = r.decision === 'allow';
  console.log(`  [${r.decision}] ${cmd}${penetrated ? ' PENETRATED!' : ''}`);
  d4_16_results.push({ cmd, decision: r.decision, penetrated });
}
results['D4-16'] = { noPenetration: d4_16_results.every(r => !r.penetrated), details: d4_16_results };

// Summary
console.log('\n\n=== P0 SAFETY SUMMARY ===');
for (const [caseId, data] of Object.entries(results)) {
  console.log(`${caseId}: ${JSON.stringify(data)}`);
}
console.log('\n=== JSON ===');
console.log(JSON.stringify(results, null, 2));
