// D4-3: Plaintext secret API blocking
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D4-3: 明文secret API拦截 ===');

const testCommands = [
  'hcloud CSMS show-secret --secret_id=12345',
  'hcloud KMS list-keys --show-key-material',
  'hcloud CSMS show-secret --secret_id=test --version_id=v1',
];

let allBlocked = true;
for (const cmd of testCommands) {
  const result = classifyTextCommand(cmd);
  console.log(`  "${cmd}" → decision: ${result.decision}, reason: ${result.reason}`);
  if (result.decision !== 'deny') allBlocked = false;
}

if (allBlocked) {
  console.log('RESULT: PASS - All plaintext secret API calls blocked');
} else {
  console.log('RESULT: FAIL - Some plaintext secret API calls not blocked');
}
