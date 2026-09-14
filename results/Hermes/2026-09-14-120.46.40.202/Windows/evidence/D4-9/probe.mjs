// D4-9: Public exposure/destructive pre-check
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D4-9: 公开暴露/破坏性预检 ===');

const dangerousCommands = [
  'hcloud ECS create-servers --public_ip=eip --name=test',
  'hcloud VPC create-eip --type=5_bgp',
  'hcloud ELB create-loadbalancer --type=External',
  'hcloud ECS delete-servers --instance_ids=all',
  'hcloud RDS delete-instance --instance_id=prod-db',
  'hcloud IAM delete-domain --domain_id=root',
  'hcloud SFS delete-share --share_id=prod',
];

let allBlocked = true;
for (const cmd of dangerousCommands) {
  const result = classifyTextCommand(cmd);
  console.log(`  "${cmd}" → decision: ${result.decision}, reason: ${result.reason}`);
  if (result.decision === 'allow') allBlocked = false;
}

if (allBlocked) {
  console.log('RESULT: PASS - All public exposure/destructive operations blocked');
} else {
  console.log('RESULT: FAIL - Some dangerous operations allowed');
}
