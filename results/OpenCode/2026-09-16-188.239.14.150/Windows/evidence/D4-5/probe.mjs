// D4-5: 写操作误判检测
// Tool: huaweicloud_plan_cli_command
// Command: hcloud ECS DeleteServers --servers.1.id=test-123
// Expected: write operation NOT misjudged as read-only
// Actual: classification.decision=deny, risk=write
// Conclusion: PASS
