// D4-2: Credential env print blocking
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D4-2: 凭证env打印拦截 ===');

const testCommands = [
  'printenv HUAWEICLOUD_SDK_AK',
  'echo $HUAWEICLOUD_SDK_SK',
  'echo %HUAWEICLOUD_SDK_AK%',
  'printenv HW_SDK_AK',
  'env | grep AK',
  'set | grep SK',
  'echo $HCLOUD_AK',
];

let allBlocked = true;
for (const cmd of testCommands) {
  const result = classifyTextCommand(cmd);
  console.log(`  "${cmd}" → decision: ${result.decision}, reason: ${result.reason}`);
  if (result.decision !== 'deny') allBlocked = false;
}

if (allBlocked) {
  console.log('RESULT: PASS - All credential env print attempts blocked');
} else {
  console.log('RESULT: FAIL - Some credential env prints not blocked');
}
