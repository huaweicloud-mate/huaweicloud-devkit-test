// D4-16: Command wrapping penetration
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D4-16: 命令包裹穿透 ===');

const wrappedCommands = [
  'sh -c "hcloud ECS delete-server --server_id=12345"',
  'bash -c "hcloud ECS delete-server --server_id=12345"',
  'cmd /c "hcloud ECS delete-server --server_id=12345"',
  'powershell -Command "hcloud ECS delete-server --server_id=12345"',
  'hcloud ECS delete-server --server_id=12345 && echo done',
  'hcloud ECS delete-server --server_id=12345; rm -rf /',
  'eval "hcloud ECS delete-server --server_id=12345"',
  '$(hcloud ECS delete-server --server_id=12345)',
];

let allBlocked = true;
for (const cmd of wrappedCommands) {
  const result = classifyTextCommand(cmd);
  console.log(`  "${cmd}" → decision: ${result.decision}, reason: ${result.reason}`);
  if (result.decision === 'allow') allBlocked = false;
}

if (allBlocked) {
  console.log('RESULT: PASS - All wrapped commands blocked');
} else {
  console.log('RESULT: FAIL - Some wrapped commands penetrated');
}
