// AI生成
// D4-5: 写操作误判检测
// Check that write operation detection has no false positives/negatives
// Read operations should NOT be classified as write, and write operations should be denied without approval

import { classifyHcloudArgs, classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D4-5: Write Operation Misclassification Detection ===');

// Read operations that should NOT be blocked (no false positives)
const readOps = [
  ['ECS', 'ListServers'],
  ['ECS', 'ShowServer'],
  ['ECS', 'NovaListServers'],
  ['VPC', 'ListSecurityGroups'],
  ['RDS', 'ShowInstance'],
  ['OBS', 'ls'],
  ['OBS', 'stat'],
  ['CCE', 'DescribeCluster'],
  ['IAM', 'ListUsers'],
  ['VPC', 'GetSubnet'],
];
let falsePositives = 0;
for (const [svc, op] of readOps) {
  const result = classifyHcloudArgs(['hcloud', svc, op]);
  const wronglyBlocked = result.decision === 'deny' && result.risk === 'write';
  console.log(`  [READ] hcloud ${svc} ${op} => decision=${result.decision}, risk=${result.risk} ${wronglyBlocked ? 'FALSE POSITIVE!' : 'OK'}`);
  if (wronglyBlocked) falsePositives++;
}

// Write operations that SHOULD be blocked without approval (no false negatives)
const writeOps = [
  ['ECS', 'CreateServers'],
  ['ECS', 'DeleteServers'],
  ['ECS', 'UpdateServer'],
  ['VPC', 'CreateSecurityGroup'],
  ['VPC', 'DeleteSubnet'],
  ['RDS', 'CreateInstance'],
  ['RDS', 'DeleteInstance'],
  ['OBS', 'mb'],
  ['OBS', 'rm'],
  ['CCE', 'CreateCluster'],
  ['IAM', 'CreateUser'],
  ['ECS', 'BatchStartServers'],
  ['ECS', 'RebootServers'],
];
let falseNegatives = 0;
for (const [svc, op] of writeOps) {
  const result = classifyHcloudArgs(['hcloud', svc, op]);
  const shouldBlock = result.decision === 'deny';
  console.log(`  [WRITE] hcloud ${svc} ${op} => decision=${result.decision}, risk=${result.risk} ${!shouldBlock ? 'FALSE NEGATIVE!' : 'OK'}`);
  if (!shouldBlock) falseNegatives++;
}

// Write operations WITH allowWrites=true should be allowed
const writeWithApproval = classifyHcloudArgs(['hcloud', 'ECS', 'CreateServers'], { allowWrites: true });
const approvalWorks = writeWithApproval.decision === 'allow';
console.log(`  [APPROVED] hcloud ECS CreateServers (allowWrites=true) => decision=${writeWithApproval.decision} ${approvalWorks ? 'OK' : 'FAIL'}`);

const allPass = falsePositives === 0 && falseNegatives === 0 && approvalWorks;
console.log(`\nFalse Positives: ${falsePositives}, False Negatives: ${falseNegatives}`);
console.log('D4-5 RESULT:', allPass ? 'PASS' : 'FAIL');
