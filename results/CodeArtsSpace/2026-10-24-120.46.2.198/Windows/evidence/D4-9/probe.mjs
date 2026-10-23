// D4-9: hook_check_command 破坏性预检 + hook_check_deploy_plan 公网暴露
// ①hcloud ECS DeleteServers --force => deny(hwc-destructive-delete-force)
// ②hook_check_deploy_plan FunctionGraph public => warn(hwc-functiongraph-public-no-auth)