import { redactSecrets } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
const test = 'AK=A1234567890ABCDEF SK=S1234567890abcdef';
const redacted = redactSecrets(test);
console.log('Original:', test);
console.log('Redacted:', redacted);
if (!redacted.includes('1234567890')) console.log('PASS: secrets redacted in readonly output');
else console.log('FAIL: secrets not redacted');