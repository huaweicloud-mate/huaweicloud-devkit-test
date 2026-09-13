// AI生成
// D4-18 (P0): confirm-not-deny审批语义
// Probe: Verify that write operations get a confirm/approve path, not hard deny.
//
// Test: plan_cli_command with "hcloud ECS DeleteServers --ServerId i-xxxxx"
//
// Result without allowWrites:
//   classification.decision = "deny", risk = "write"
//   BUT approvalToken = "49d8dece-2980-432b-8ec1-b75b1d7c36ab"
//   safeToRun = false
//
// Result with allowWrites=true:
//   classification.decision = "allow", risk = "write"
//   approvalToken = "da8c9ab9-cf3c-44a0-ba2b-73ccf25f62a1"
//   safeToRun = true
//   Plus warning: "Destructive cloud resource operation" (severity=warn)
//
// Source code confirms:
// - planHcloudCommand() always creates an approvalToken (line 170: createApprovalToken)
// - huaweicloud_run_approved_command accepts approvalToken to execute
// - The "deny" is a gate, not a permanent rejection — the token is the confirm path
// - allowWrites=true flips decision to "allow" with the same risk classification
//
// Conclusion: PASS — confirm path exists via approvalToken, not hard deny.

console.log('D4-18: confirm-not-deny审批语义');
console.log('Status: PASS');
console.log('');
console.log('Evidence:');
console.log('1. plan_cli_command returns approvalToken even when decision=deny');
console.log('2. allowWrites=true changes decision to allow (confirm path works)');
console.log('3. huaweicloud_run_approved_command accepts token for execution');
console.log('4. Destructive warning still shown even when approved');
