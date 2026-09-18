// AI生成
// D4-1: 凭证文件读取拦截
// D4-2: 凭证 env 打印拦截
// D4-3: 明文 secret API 拦截
// Test that classifyTextCommand blocks credential file reads, env dumps, and secret reads

import { classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D4-1: Credential File Read Interception ===');
const credFileTests = [
  'cat ~/.hcloud/config.json',
  'type %USERPROFILE%\\.huaweicloud\\credentials.json',
  'Get-Content ~/.hcloud/credentials',
  'cat /root/.hcloud/config',
  'less ~/.huaweicloud/credentials',
  'cat hcloud/config/credentials',
];
let d4_1_pass = true;
for (const cmd of credFileTests) {
  const result = classifyTextCommand(cmd);
  const blocked = result.decision === 'deny';
  console.log(`  "${cmd}" => decision=${result.decision}, risk=${result.risk}`);
  if (!blocked) d4_1_pass = false;
}
console.log('D4-1 RESULT:', d4_1_pass ? 'PASS' : 'FAIL');

console.log('\n=== D4-2: Credential Env Print Interception ===');
const envDumpTests = [
  'env | grep HUAWEICLOUD',
  'printenv HWC_ACCESS_KEY',
  'printenv HW_SECRET_KEY',
  'Get-ChildItem Env: | grep HWC_',
  'echo $HUAWEICLOUD_ACCESS_KEY',
  'echo $HW_SECRET_KEY',
  'echo $OS_ACCESS_KEY',
  'printenv HW_SECURITY_TOKEN',
  'dir Env: | findstr HCLOUD',
];
let d4_2_pass = true;
for (const cmd of envDumpTests) {
  const result = classifyTextCommand(cmd);
  const blocked = result.decision === 'deny';
  console.log(`  "${cmd}" => decision=${result.decision}, risk=${result.risk}`);
  if (!blocked) d4_2_pass = false;
}
console.log('D4-2 RESULT:', d4_2_pass ? 'PASS' : 'FAIL');

console.log('\n=== D4-3: Plaintext Secret API Interception ===');
const secretTests = [
  'hcloud csms ShowSecretVersion --secret-id=xxx',
  'hcloud csms GetSecretValue --name=test',
  'hcloud csms DownloadSecret --id=abc',
  'hcloud kms decrypt --cipher-text=xxx',
  'hcloud csms show-secret --id=test',
  'hcloud csms secret_string --id=test',
  'hcloud csms secret_binary --id=test',
];
let d4_3_pass = true;
for (const cmd of secretTests) {
  const result = classifyTextCommand(cmd);
  const blocked = result.decision === 'deny';
  console.log(`  "${cmd}" => decision=${result.decision}, risk=${result.risk}`);
  if (!blocked) d4_3_pass = false;
}
console.log('D4-3 RESULT:', d4_3_pass ? 'PASS' : 'FAIL');
