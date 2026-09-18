// AI生成
// D4-15: hook 绕过尝试
// D4-16: 命令包裹穿透
// Test that hook bypass attempts are blocked and shell-wrapped commands are properly classified

import { classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D4-15: Hook Bypass Attempts ===');

// Test various bypass attempts that should still be blocked
const bypassTests = [
  // Shell wrapper bypass
  'bash -c "hcloud ECS DeleteServers --server_ids=xxx"',
  'sh -c "hcloud VPC DeleteSubnet --subnet_id=xxx"',
  'sudo hcloud ECS DeleteServers --server_ids=xxx',
  // Concatenated commands
  'hcloud ECS ListServers && hcloud ECS DeleteServers --server_ids=xxx',
  'hcloud ECS ListServers; hcloud ECS DeleteServers --server_ids=xxx',
  'hcloud ECS ListServers || hcloud ECS DeleteServers --server_ids=xxx',
  // Encoded payload
  'base64 -d <<< "aGNsb3VkIEVDUyBEZWxldGVTZXJ2ZXJz" | bash',
  // Credential file via different commands
  'cat ~/.hcloud/config.json',
  'type %USERPROFILE%\\.hcloud\\config',
  // Env dump variants
  'env | grep HUAWEICLOUD',
  'printenv HW_ACCESS_KEY',
  // Secret retrieval variants
  'hcloud csms ShowSecretVersion --secret-id=test',
];

let d4_15_pass = true;
for (const cmd of bypassTests) {
  const result = classifyTextCommand(cmd);
  const blocked = result.decision === 'deny';
  console.log(`  [BYPASS] "${cmd.substring(0, 70)}..." => decision=${result.decision}, risk=${result.risk} ${!blocked ? 'BYPASS SUCCESS!' : 'BLOCKED'}`);
  if (!blocked) d4_15_pass = false;
}
console.log('D4-15 RESULT:', d4_15_pass ? 'PASS' : 'FAIL');

console.log('\n=== D4-16: Command Wrapping Penetration ===');

// Test that shell-wrapped write commands keep their deny classification
const wrappingTests = [
  // bash -c wrapping
  { args: ['bash', '-c', 'hcloud ECS DeleteServers --server_ids=xxx'], desc: 'bash -c hcloud delete' },
  { args: ['sh', '-c', 'hcloud VPC DeleteSubnet --subnet_id=xxx'], desc: 'sh -c hcloud delete' },
  { args: ['zsh', '-c', 'hcloud RDS DeleteInstance --instance_id=xxx'], desc: 'zsh -c hcloud delete' },
  // sudo wrapping
  { args: ['sudo', 'hcloud', 'ECS', 'DeleteServers', '--server_ids=xxx'], desc: 'sudo hcloud delete' },
  // Direct hcloud with write
  { args: ['hcloud', 'ECS', 'DeleteServers', '--server_ids=xxx'], desc: 'direct hcloud delete' },
  // Shell wrapper with read (should be allowed)
  { args: ['bash', '-c', 'hcloud ECS ListServers'], desc: 'bash -c hcloud list (read)' },
  { args: ['sudo', 'hcloud', 'ECS', 'ListServers'], desc: 'sudo hcloud list (read)' },
];

let d4_16_pass = true;
for (const { args, desc } of wrappingTests) {
  const result = classifyHcloudArgs(args);
  const isWrite = desc.includes('delete');
  const correctDecision = isWrite ? result.decision === 'deny' : result.decision === 'allow';
  console.log(`  [WRAP] ${desc} => decision=${result.decision}, risk=${result.risk} ${correctDecision ? 'OK' : 'WRONG!'}`);
  if (!correctDecision) d4_16_pass = false;
}

// Test concatenated commands via classifyTextCommand
const concatTests = [
  { cmd: 'hcloud ECS ListServers && hcloud ECS DeleteServers --server_ids=xxx', expectDeny: true },
  { cmd: 'hcloud ECS ListServers; hcloud ECS DeleteServers --server_ids=xxx', expectDeny: true },
  { cmd: 'hcloud ECS ListServers | hcloud ECS DeleteServers --server_ids=xxx', expectDeny: true },
  { cmd: 'hcloud ECS ListServers || hcloud ECS DeleteServers --server_ids=xxx', expectDeny: true },
];
for (const { cmd, expectDeny } of concatTests) {
  const result = classifyTextCommand(cmd);
  const correct = expectDeny ? result.decision === 'deny' : result.decision === 'allow';
  console.log(`  [CONCAT] "${cmd.substring(0, 60)}..." => decision=${result.decision} ${correct ? 'OK' : 'WRONG!'}`);
  if (!correct) d4_16_pass = false;
}

console.log('D4-16 RESULT:', d4_16_pass ? 'PASS' : 'FAIL');
