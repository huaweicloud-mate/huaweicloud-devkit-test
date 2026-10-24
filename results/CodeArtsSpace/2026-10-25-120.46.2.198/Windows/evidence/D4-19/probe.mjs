// D4-19: 确认流下预检仍生效
// ①plan_cli_command DeleteServers => deny+approvalToken (预检在确认前已生效)
// ②hook_check_command DeleteServers --force => deny (高危写操作被拦截)