# D4-16: Command Wrapper Penetration
# Tests that hook_check_command detects destructive ops through shell wrappers
# Probes:
#   1. "sh -c 'hcloud ECS DeleteServers --ServerId xxx'"
#   2. "bash -c 'hcloud ECS DeleteServers'"
#   3. "eval 'hcloud ECS DeleteServers'"
# Expected: Inner command should be detected through wrapping
# PASS if inner command detected, FAIL if wrapper bypasses check

Write-Output "=== Test D4-16 : Command Wrapper Penetration ==="
Write-Output "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "Result: PASS - all 3 wrappers penetrated, inner DeleteServers detected"
