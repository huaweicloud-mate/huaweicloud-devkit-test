// D4-15: Hook bypass attempts
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D4-15: hook绕过尝试 ===');

const bypassCommands = [
  // Case variations
  'hcloud ecs DELETE-SERVER --server_id=12345',
  'hcloud ECS Delete-Server --server_id=12345',
  // URL encoding
  'hcloud ECS delete-server%20--server_id=12345',
  // Parameter splitting
  'hcloud ECS delete --server=server --id=12345',
  // Subcommand tricks
  'hcloud ecs delete_server --server_id=12345',
  // Wrapped in quotes
  'hcloud "ECS delete-server" --server_id=12345',
];

let allBlocked = true;
for (const cmd of bypassCommands) {
  const result = classifyTextCommand(cmd);
  console.log(`  "${cmd}" → decision: ${result.decision}, reason: ${result.reason}`);
  if (result.decision === 'allow') allBlocked = false;
}

if (allBlocked) {
  console.log('RESULT: PASS - No bypass succeeded');
} else {
  console.log('RESULT: FAIL - Some bypass attempts succeeded');
}
