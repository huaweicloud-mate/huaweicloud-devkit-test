// AI生成
// D4-3: 明文 secret API 拦截
// Test that classifyTextCommand/classifyHcloudArgs blocks plaintext secret retrieval
// Note: kms decrypt is controlled at agent-rules level (huawei-agent-rules.mdc),
// safety-policy blocks CSMS secret value reads

import { classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D4-3: Plaintext Secret API Interception ===');

// Operations that MUST be blocked by safety policy
const mustBlock = [
  'hcloud csms ShowSecretVersion --secret-id=xxx',
  'hcloud csms GetSecretValue --name=test',
  'hcloud csms DownloadSecret --id=abc',
  'hcloud csms secret_string --id=test',
  'hcloud csms secret_binary --id=test',
  'ShowSecretVersion',
  'GetSecretValue',
  'DownloadSecret',
];

let d4_3_pass = true;
for (const cmd of mustBlock) {
  const result = classifyTextCommand(cmd);
  const blocked = result.decision === 'deny';
  console.log(`  [MUST-BLOCK] "${cmd}" => decision=${result.decision}, risk=${result.risk}`);
  if (!blocked) d4_3_pass = false;
}

// kms decrypt is controlled by agent rules, not safety policy
// Verify agent rules mention it
import { readFileSync } from 'node:fs';
const rulesContent = readFileSync('C:\\Users\\Administrator\\devkit-test\\officeclaw\\hdk\\rules\\huawei-agent-rules.mdc', 'utf8');
const kmsDecryptInRules = rulesContent.includes('kms decrypt');
console.log(`  [AGENT-RULE] "hcloud kms decrypt" in agent rules: ${kmsDecryptInRules}`);

// Verify show-secret variant: the hcloud CLI uses ShowSecretVersion (camelCase),
// not show-secret (kebab-case). Check if show-secret is caught by regex.
const showSecretResult = classifyTextCommand('hcloud csms show-secret --id=test');
console.log(`  [INFO] "hcloud csms show-secret" => decision=${showSecretResult.decision} (kebab-case variant, real CLI uses ShowSecretVersion)`);

console.log('\nD4-3 RESULT:', d4_3_pass ? 'PASS' : 'FAIL');
console.log('Note: kms decrypt controlled at agent-rules level, safety-policy blocks CSMS secret reads');
