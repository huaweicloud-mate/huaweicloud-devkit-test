// D4-9: 公开暴露/破坏性预检
// Tools: huaweicloud_hook_check_deploy_plan + huaweicloud_hook_check_command
// Tests:
//   1. deploy_plan: SSH(22) to 0.0.0.0/0 -> DENY (public admin port exposure)
//   2. command: hcloud ECS DeleteServers --force -> DENY (forced destructive)
// Conclusion: PASS
