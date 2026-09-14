// D4-5: Write operation misjudgment detection
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D4-5: 写操作误判检测 ===');

const writeCommands = [
  'hcloud ECS delete-servers --instance_ids=test',
  'hcloud ECS delete-server --server_id=12345',
  'hcloud IAM delete-user --user_id=test',
  'hcloud VPC delete-vpc --vpc_id=test',
  'hcloud OBS delete-object --bucket=test --key=file',
  'hcloud ECS stop-server --server_id=12345',
  'hcloud IAM create-user --name=test',
  'hcloud ECS create-servers --name=test',
];

let allCorrect = true;
for (const cmd of writeCommands) {
  const result = classifyTextCommand(cmd);
  const isWrite = result.decision === 'deny' || (result.decision === 'warn' && /write|destruct|danger/i.test(result.reason || ''));
  console.log(`  "${cmd}" → decision: ${result.decision}, reason: ${result.reason}`);
  if (result.decision === 'allow') {
    console.log('    WARNING: Write command classified as allow!');
    allCorrect = false;
  }
}

if (allCorrect) {
  console.log('RESULT: PASS - Write operations not misjudged as read-only');
} else {
  console.log('RESULT: FAIL - Write operations misjudged as read-only/allow');
}
