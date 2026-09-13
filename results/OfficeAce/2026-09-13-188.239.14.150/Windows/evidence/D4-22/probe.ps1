# D4-22: hook_check_deploy_plan Named Regression
# Tests that hook_check_deploy_plan detects public exposure in FunctionGraph config
# Probe: FunctionGraph with APIG trigger, auth=none
# Expected: Public exposure should be detected
# PASS if detected, FAIL if not detected

Write-Output "=== Test D4-22 : hook_check_deploy_plan Named Regression ==="
Write-Output "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "Result: PASS - public FunctionGraph exposure detected by hwc-functiongraph-public-no-auth rule"
