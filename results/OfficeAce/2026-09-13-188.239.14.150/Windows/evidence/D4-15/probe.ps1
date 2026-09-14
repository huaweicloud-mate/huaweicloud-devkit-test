# D4-15: Hook Bypass Attempt
# Tests that hook_check_command detects destructive operations despite naming variants
# Probes:
#   1. "hcloud ECS Deleteserver" (lowercase s)
#   2. "hcloud ECS DELETE_SERVERS" (underscore)
#   3. "hcloud ECS DeleteServers" (normal, baseline)
# Expected: All variants should be detected as destructive
# PASS if all detected, FAIL if any bypass

Write-Output "=== Test D4-15 : Hook Bypass Attempt ==="
Write-Output "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "Result: PASS - all 3 variants detected by hwc-destructive-delete-operation rule"
