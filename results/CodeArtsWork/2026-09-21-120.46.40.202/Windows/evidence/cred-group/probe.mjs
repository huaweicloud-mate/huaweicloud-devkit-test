import { classifyTextCommand, redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

// D4-1: 凭证文件读取拦截
console.log('=== D4-1: credential file read block ===');
const d41tests = [
  'cat ~/.hcloud/credentials.json',
  'type %USERPROFILE%\\.hcloud\\credentials.json',
  'Get-Content ~/.huaweicloud/credentials.json',
  'cat ~/.hcloud/config.ini',
];
let d41pass = true;
for (const cmd of d41tests) {
  const r = classifyTextCommand(cmd);
  const ok = r.decision === 'deny';
  if (!ok) d41pass = false;
  console.log('  ' + cmd + ' => ' + r.decision + ' ' + (ok ? 'OK' : 'FAIL'));
}
console.log('D4-1_VERDICT=' + (d41pass ? 'PASS' : 'FAIL'));

// D4-2: 凭证env打印拦截
console.log('=== D4-2: credential env print block ===');
const d42tests = [
  'printenv HUAWEICLOUD_ACCESS_KEY_ID',
  'env | grep HWC_',
  'Get-ChildItem Env: | Where-Object {$_.Name -like "HUAWEICLOUD*"}',
  'echo $HUAWEICLOUD_SECRET_ACCESS_KEY',
];
let d42pass = true;
for (const cmd of d42tests) {
  const r = classifyTextCommand(cmd);
  const ok = r.decision === 'deny';
  if (!ok) d42pass = false;
  console.log('  ' + cmd + ' => ' + r.decision + ' ' + (ok ? 'OK' : 'FAIL'));
}
console.log('D4-2_VERDICT=' + (d42pass ? 'PASS' : 'FAIL'));

// D4-3: 明文secret API拦截
console.log('=== D4-3: plaintext secret API block ===');
const d43tests = [
  'hcloud CSMS ShowSecretVersion --name=mysecret',
  'hcloud KMS ShowSecret',
  'hcloud CSMS DownloadSecret',
];
let d43pass = true;
for (const cmd of d43tests) {
  const r = classifyTextCommand(cmd);
  // Secret APIs should be denied or at least warned
  const ok = r.decision === 'deny' || r.decision === 'warn';
  if (!ok) d43pass = false;
  console.log('  ' + cmd + ' => ' + r.decision + ' ' + (ok ? 'OK' : 'FAIL'));
}
console.log('D4-3_VERDICT=' + (d43pass ? 'PASS' : 'FAIL'));

// D2-4: 凭证脱敏正确性
console.log('=== D2-4: credential redaction ===');
const credObj = {
  ak: 'AKIDEXAMPLE123456789',
  sk: 'SKEXAMPLE987654321',
  token: 'STSEXAMPLE000111222',
  region: 'cn-north-4',
  description: 'my credentials',
};
const redacted = redactSecrets(credObj);
const redactedStr = JSON.stringify(redacted);
const noPlaintextAk = !redactedStr.includes('AKIDEXAMPLE123456789');
const noPlaintextSk = !redactedStr.includes('SKEXAMPLE987654321');
const noPlaintextToken = !redactedStr.includes('STSEXAMPLE000111222');
console.log('  redacted: ' + redactedStr);
console.log('  AK hidden=' + noPlaintextAk + ' SK hidden=' + noPlaintextSk + ' token hidden=' + noPlaintextToken);
const d24pass = noPlaintextAk && noPlaintextSk && noPlaintextToken;
console.log('D2-4_VERDICT=' + (d24pass ? 'PASS' : 'FAIL'));
