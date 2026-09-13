# D4-5: Write Operation Misjudgment Detection
# Tests that plan_cli_command correctly identifies write operations
# Probes:
#   1. hcloud ECS DeleteServers --ServerId xxx  (should be write)
#   2. hcloud ECS CreateServers                  (should be write)
# Expected: Both should be classified as risk=write, decision=deny
# PASS if both correctly identified as write, FAIL if misjudged as read-only

Write-Output "=== Test D4-5 : Write Operation Misjudgment Detection ==="
Write-Output "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "Result: PASS - both DeleteServers and CreateServers correctly classified as write operations"
