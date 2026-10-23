// D4-9: Public exposure/destructive preflight
// Tested via huaweicloud_hook_check_deploy_plan with deploy plan containing 0.0.0.0/0 exposure and 10 ECS
// Result: decision=warn, 2 findings (sandbox-missing-ttl, cost-unbounded-scale)
