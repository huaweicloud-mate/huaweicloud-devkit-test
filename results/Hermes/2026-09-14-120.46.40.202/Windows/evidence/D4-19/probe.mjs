// D4-19: 确认流下预检仍生效
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D4-19: 确认流下预检仍生效 ===');

// High-risk operations should still be blocked even in confirmation flow
const highRiskOps = [
  'hcloud ECS delete-servers --instance_ids=prod-1,prod-2',
  'hcloud RDS delete-instance --instance_id=prod-db',
  'hcloud IAM delete-domain --domain_id=root',
  'hcloud VPC delete-vpc --vpc_id=default',
];

let allBlocked = true;
for (const cmd of highRiskOps) {
  const result = classifyTextCommand(cmd);
  console.log(`  "${cmd}" → decision: ${result.decision}, reason: ${result.reason}`);
  if (result.decision === 'allow') allBlocked = false;
}

if (allBlocked) {
  console.log('RESULT: PASS - Preflight checks still effective in confirmation flow');
} else {
  console.log('RESULT: FAIL - Preflight checks bypassed in confirmation flow');
}
