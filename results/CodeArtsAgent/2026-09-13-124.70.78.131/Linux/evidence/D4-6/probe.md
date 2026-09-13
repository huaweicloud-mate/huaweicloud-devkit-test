# D4-6 adminPass 回显警告
客户端: CodeArtsAgent / Linux / codearts
工具: huaweicloud_hook_check_command
命令: hcloud ECS CreateServers --server.1.adminPass MySecret123 --server.1.name test-ecs
断言: 创建 ECS 含 password 时应警告且不裸回显密码
