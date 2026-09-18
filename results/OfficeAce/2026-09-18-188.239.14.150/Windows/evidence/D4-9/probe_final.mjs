// AI生成
// D4-9: 公开暴露/破坏性预检 - 最终版
import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateArtifacts, evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

console.log('=== D4-9: Public Exposure / Destructive Preflight ===');

let d4_9_pass = true;

// 1. Public exposure via command classification
const publicExposeTests = [
  'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0 --port_range_max=22',
  'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0 --port_range_max=3306',
  'hcloud OBS SetBucketAcl --acl=public-read-write',
  'hcloud IAM CreatePolicy --action=* --effect=Allow',
];
for (const cmd of publicExposeTests) {
  const result = classifyTextCommand(cmd);
  console.log(`  [PUBLIC-EXPOSE] decision=${result.decision}, risk=${result.risk}`);
  if (result.decision !== 'deny') d4_9_pass = false;
}

// 2. Destructive operations
const destructiveTests = [
  'hcloud ECS DeleteServers --force',
  'rm -rf /',
  'mkfs.ext4 /dev/sda',
  'dd if=/dev/zero of=/dev/sda',
  'shutdown -h now',
];
for (const cmd of destructiveTests) {
  const result = classifyTextCommand(cmd);
  console.log(`  [DESTRUCTIVE] "${cmd}" => decision=${result.decision}, risk=${result.risk}`);
  if (result.decision !== 'deny') d4_9_pass = false;
}

// 3. Artifact check for public exposure in IaC
const artifactResult = evaluateArtifacts([{
  path: 'terraform/main.tf',
  content: 'remote_ip_prefix = "0.0.0.0/0" port_range_max = 22'
}]);
console.log(`  [ARTIFACT] 0.0.0.0/0:22 => decision=${artifactResult.decision}`);
if (artifactResult.decision !== 'deny') d4_9_pass = false;

// 4. Deploy plan: IAM admin policy (pass string directly, not wrapped)
const iamJson = '{"Statement": [{"Action": "*", "Effect": "Allow"}]}';
const deployResult = evaluateDeployPlan(iamJson);
console.log(`  [DEPLOY-PLAN] IAM "*" + Allow => decision=${deployResult.decision}, findings=${deployResult.findings?.length || 0}`);
if (deployResult.decision !== 'deny') d4_9_pass = false;

// 5. Deploy plan: AdministratorAccess + Effect=Allow
const deployResult2 = evaluateDeployPlan('IAM role AdministratorAccess Effect=Allow');
console.log(`  [DEPLOY-PLAN] AdministratorAccess + Effect=Allow => decision=${deployResult2.decision}`);
if (deployResult2.decision !== 'deny') d4_9_pass = false;

// 6. Deploy plan: OBS anonymous write (JSON format matching regex)
const deployResult3 = evaluateDeployPlan('OBS bucket {"Principal":"*"} PutObject FULL_CONTROL');
console.log(`  [DEPLOY-PLAN] OBS anonymous write => decision=${deployResult3.decision}`);
if (deployResult3.decision !== 'deny') d4_9_pass = false;

console.log('\nD4-9 RESULT:', d4_9_pass ? 'PASS' : 'FAIL');
