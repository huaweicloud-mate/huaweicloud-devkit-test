// AI生成
// D4-9: 公开暴露/破坏性预检
// Check public exposure and destructive operation preflight via risk rules

import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

console.log('=== D4-9: Public Exposure / Destructive Preflight ===');

// Test public exposure detection
const publicExposeTests = [
  'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0 --port_range_max=22',
  'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0 --port_range_max=3306',
  'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0 --port_range_max=3389',
  'hcloud OBS SetBucketAcl --acl=public-read-write',
  'hcloud IAM CreatePolicy --action=* --effect=Allow',
];
let d4_9_pass = true;
for (const cmd of publicExposeTests) {
  const result = classifyTextCommand(cmd);
  const blocked = result.decision === 'deny';
  console.log(`  [PUBLIC-EXPOSE] "${cmd.substring(0, 80)}..." => decision=${result.decision}, risk=${result.risk}`);
  if (!blocked) d4_9_pass = false;
}

// Test destructive operation detection
const destructiveTests = [
  'hcloud ECS DeleteServers --force',
  'hcloud ECS BatchDeleteServers --force',
  'rm -rf /',
  'mkfs.ext4 /dev/sda',
  'dd if=/dev/zero of=/dev/sda',
  'shutdown -h now',
  'hcloud ECS DeleteServers --delete_publicip=true --delete_volume=true',
];
for (const cmd of destructiveTests) {
  const result = classifyTextCommand(cmd);
  const blocked = result.decision === 'deny';
  console.log(`  [DESTRUCTIVE] "${cmd.substring(0, 80)}" => decision=${result.decision}, risk=${result.risk}`);
  if (!blocked) d4_9_pass = false;
}

// Test artifact check for public exposure in IaC
const artifactResult = evaluateArtifacts([{
  path: 'terraform/main.tf',
  content: 'resource "huaweicloud_vpc_security_group_rule" "open" { remote_ip_prefix = "0.0.0.0/0" port_range_max = 22 }'
}]);
const artifactBlocked = artifactResult.decision === 'deny';
console.log(`  [ARTIFACT] terraform with 0.0.0.0/0:22 => decision=${artifactResult.decision}`);
if (!artifactBlocked) d4_9_pass = false;

// Test deploy plan check for IAM admin policy
const deployResult = evaluateDeployPlan({
  plan: 'Create IAM policy with Action="*" and Effect="Allow" for all resources'
});
const deployBlocked = deployResult.decision === 'deny';
console.log(`  [DEPLOY-PLAN] IAM admin policy => decision=${deployResult.decision}`);
if (!deployBlocked) d4_9_pass = false;

console.log('\nD4-9 RESULT:', d4_9_pass ? 'PASS' : 'FAIL');
