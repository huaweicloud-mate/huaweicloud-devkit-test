// D10-4: Safety intervention effectiveness
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D10-4: 安全干预有效性 ===');

// Simulate high-risk intent requests
const highRiskRequests = [
  'hcloud ECS delete-servers --instance_ids=prod-1,prod-2,prod-3',
  'hcloud RDS delete-instance --instance_id=production-db',
  'hcloud IAM delete-domain --domain_id=root-domain',
  'hcloud VPC delete-vpc --vpc_id=default-vpc',
  'hcloud ECS stop-servers --instance_ids=prod-1,prod-2',
  'hcloud OBS delete-bucket --bucket=production-data --force',
];

let allBlocked = true;
let details = [];

for (const cmd of highRiskRequests) {
  const result = classifyTextCommand(cmd);
  console.log(`  "${cmd}" → decision: ${result.decision}, reason: ${result.reason}`);
  details.push({ cmd, decision: result.decision });
  if (result.decision === 'allow') allBlocked = false;
}

if (allBlocked) {
  console.log('\nRESULT: PASS - All high-risk requests automatically routed to approval flow');
} else {
  const allowed = details.filter(d => d.decision === 'allow');
  console.log(`\nRESULT: FAIL - ${allowed.length} high-risk requests not blocked`);
}
