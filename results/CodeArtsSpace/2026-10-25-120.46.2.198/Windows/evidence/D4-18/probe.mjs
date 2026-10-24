// D4-18: plan_cli_command confirm-not-deny 审批语义
// MCP: huaweicloud_plan_cli_command(["ECS","DeleteServers","--server-id","i-12345"])
// 结果: decision=deny, risk=write, safeToRun=false, approvalToken=dc15727f...
// 写操作需显式确认(approvalToken存在), 不被直接放行(safeToRun=false), 也不被直接拒绝(可走确认流程)