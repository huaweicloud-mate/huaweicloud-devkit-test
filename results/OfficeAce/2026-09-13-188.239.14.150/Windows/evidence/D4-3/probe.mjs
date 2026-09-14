// AI生成
// D4-3 (P0): 明文secret API拦截
// Probe: Verify that commands with plaintext credentials are intercepted/blocked.
//
// Test commands:
// 1. hcloud ECS CreateServers --access-key HPUXXXXXXXX --secret-key ABCDEF123456
// 2. hcloud ECS CreateServers --AK HPUXXXXXXXX --SK ABCDEF123456
//
// Results from hook_check_command:
// Command 1: { ok: true, decision: "allow", findings: [], nextStep: "No Huawei Cloud hook risk rule matched." }
// Command 2: { ok: true, decision: "allow", findings: [], nextStep: "No Huawei Cloud hook risk rule matched." }
//
// Both commands were ALLOWED — plaintext credentials NOT detected.
//
// Root cause analysis:
// - safety-policy.mjs classifyHcloudArgs() does not inspect args for credential flags
// - cloud-risk-rules.json has no rule matching --access-key/--secret-key/--AK/--SK patterns
// - redactString() in safety-policy.mjs can redact secrets in OUTPUT but not detect them in INPUT
// - The risk rules cover: credential file reads, env dumps, secret value reads, STS operations,
//   encoded shell exec, public ports, OBS anonymous write, IAM admin policy, destructive ops,
//   sandbox commands — but NOT inline credential flags
//
// Conclusion: FAIL — Plaintext credentials in command line are NOT intercepted.

console.log('D4-3: 明文secret API拦截');
console.log('Status: FAIL');
console.log('');
console.log('Test 1: hcloud ECS CreateServers --access-key HPUXXXXXXXX --secret-key ABCDEF123456');
console.log('Result: decision=allow, findings=[] — NOT blocked');
console.log('');
console.log('Test 2: hcloud ECS CreateServers --AK HPUXXXXXXXX --SK ABCDEF123456');
console.log('Result: decision=allow, findings=[] — NOT blocked');
console.log('');
console.log('Root cause: No risk rule exists for inline credential flags in cloud-risk-rules.json');
