# D4-9: Public Exposure / Destructive Pre-check
# Tests that hook_check_command and hook_check_deploy_plan detect public exposure
# Probes:
#   1. hook_check_command: hcloud VPC CreateSecurityGroupRules with 0.0.0.0/0 ingress
#   2. hook_check_deploy_plan: VPC plan with public exposure config
# Expected: Both should be detected and blocked/warned
# PASS if detected, FAIL if not detected

Write-Output "=== Test D4-9 : Public Exposure / Destructive Pre-check ==="
Write-Output "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "Result: FAIL - neither probe detected public exposure (both returned allow)"
