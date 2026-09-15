// D4-18: confirm-not-deny审批语义
// Tool: huaweicloud_plan_cli_command
// Test: write operation (DeleteServers) is not directly denied without reason,
//   nor directly allowed. It returns deny with approvalToken for user confirmation.
// Expected: write operation requires explicit confirmation
// Actual: decision=deny, risk=write, approvalToken provided, safeToRun=false
// Conclusion: PASS - confirm-not-deny semantics work (not directly denied, not directly allowed)
