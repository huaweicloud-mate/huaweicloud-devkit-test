# D4-4 写操作审批门
客户端: CodeArtsAgent / Linux / codearts
工具: huaweicloud_plan_cli_command (allowWrites 缺省=false)
步骤: ① 写语义命令 DeleteServers ② 只读命令 ListServersDetails
断言: 写操作 decision=deny/risk=write/safeToRun=false；只读 decision=allow/read_only/safeToRun=true
