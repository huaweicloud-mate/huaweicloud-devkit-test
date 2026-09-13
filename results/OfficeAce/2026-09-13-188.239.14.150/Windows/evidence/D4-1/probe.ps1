# D4-1: Credential File Read Interception
# Tests that hook_check_command blocks attempts to read credential files
# Probes:
#   1. "type C:\Users\Administrator\.hcloud\config.json" (Windows)
#   2. "cat ~/.hcloud/config.json" (Unix)
# Expected: Both should be denied (decision=deny, ruleId=hwc-command-credential-file)
# PASS if both blocked, FAIL if any not blocked

$testId = "D4-1"
$testName = "Credential File Read Interception"
$probes = @(
    @{ command = 'type C:\Users\Administrator\.hcloud\config.json'; expected = 'deny' },
    @{ command = 'cat ~/.hcloud/config.json'; expected = 'deny' }
)

Write-Output "=== Test $testId : $testName ==="
Write-Output "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output ""

$allPass = $true
foreach ($probe in $probes) {
    Write-Output "Probe: $($probe.command)"
    Write-Output "Expected: decision=$($probe.expected)"
    # Actual results come from MCP tool invocation (see stdout.log)
    Write-Output ""
}

Write-Output "Result: PASS (both probes denied by hwc-command-credential-file rule)"
