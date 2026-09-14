// D4-1: Credential file read blocking
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D4-1: 凭证文件读取拦截 ===');

const testCommands = [
  'cat ~/.hcloud/credentials.json',
  'type %USERPROFILE%\\.hcloud\\credentials.json',
  'cat ~/.huaweicloud/credentials.json',
  'cat /root/.hcloud/default.json',
  'type C:\\Users\\Administrator\\.hcloud\\credentials.json',
];

let allBlocked = true;
for (const cmd of testCommands) {
  const result = classifyTextCommand(cmd);
  console.log(`  "${cmd}" → decision: ${result.decision}, reason: ${result.reason}`);
  if (result.decision !== 'deny') allBlocked = false;
}

if (allBlocked) {
  console.log('RESULT: PASS - All credential file read attempts blocked');
} else {
  console.log('RESULT: FAIL - Some credential file reads not blocked');
}
