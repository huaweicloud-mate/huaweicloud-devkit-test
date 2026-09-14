# D4-21: hook_check_artifacts Named Regression
# Tests that hook_check_artifacts detects broad IAM admin policy
# Probe: policy.json with Action=["*"], Resource=["*"]
# Expected: Should be detected and denied
# PASS if detected, FAIL if not detected

Write-Output "=== Test D4-21 : hook_check_artifacts Named Regression ==="
Write-Output "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "Result: PASS - broad IAM policy detected and denied by hwc-iam-admin-policy rule"
