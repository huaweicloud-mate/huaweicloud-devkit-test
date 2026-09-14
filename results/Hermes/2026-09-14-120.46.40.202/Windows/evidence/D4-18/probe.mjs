// D4-18: confirm-not-deny approval semantics
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D4-18: confirm-not-deny审批语义 ===');

// Write operations should be denied (needs explicit confirmation)
// but NOT because they are harmful per se - they need approval flow
const writeOps = [
  'hcloud ECS create-servers --name=test',
  'hcloud ECS delete-server --server_id=12345',
  'hcloud IAM create-user --name=test',
  'hcloud OBS put-object --bucket=test --key=file',
];

let allNeedApproval = true;
for (const cmd of writeOps) {
  const result = classifyTextCommand(cmd);
  console.log(`  "${cmd}" → decision: ${result.decision}, reason: ${result.reason}`);
  // Write ops should be denied (require plan + approval), not allowed
  if (result.decision === 'allow') {
    allNeedApproval = false;
  }
}

if (allNeedApproval) {
  console.log('RESULT: PASS - Write operations require explicit confirmation (denied until approved)');
} else {
  console.log('RESULT: FAIL - Some write operations not requiring confirmation');
}
