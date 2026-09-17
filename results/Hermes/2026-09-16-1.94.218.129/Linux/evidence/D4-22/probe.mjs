// D4-22: hook_check_deploy_plan 具名回归
// Tool: huaweicloud_hook_check_deploy_plan
// Test 1: public SSH exposure -> DENY (correct)
// Test 2: destructive plan (delete all) -> ALLOW (no destructive rules for deploy_plan stage)
// Note: deploy_plan stage has rules for public_exposure/IAM/OBS/sandbox/cost but NOT destructive
// Conclusion: PASS - deploy_plan check works for its defined rules
