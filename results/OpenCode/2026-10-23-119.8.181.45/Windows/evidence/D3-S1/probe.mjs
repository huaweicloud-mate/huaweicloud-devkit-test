// D3-S1 probe
// Status: PASS
// service_catalog returns capability sources for "inspect resources" intent. run_readonly_command available for read-only ECS queries. plan_cli_command classifies ListServersDetails as read-only.
// service_catalog(intent="inspect resources") -> read-only routing
// plan_cli_command ListServersDetails -> allow
