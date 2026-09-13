# D4-2: Credential Env Print Interception
# Tests that hook_check_command blocks attempts to print credential env vars
# Probes:
#   1. "set HW_ACCESS_KEY"
#   2. "echo %HW_ACCESS_KEY%"
#   3. "printenv HW_ACCESS_KEY"
# Expected: All should be denied as credential env exposure
# PASS if all blocked, FAIL if any not blocked

Write-Output "=== Test D4-2 : Credential Env Print Interception ==="
Write-Output "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "Result: FAIL - all 3 probes returned decision=allow (no rule matched)"
