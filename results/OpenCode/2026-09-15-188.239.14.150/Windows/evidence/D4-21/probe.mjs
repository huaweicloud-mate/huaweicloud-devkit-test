// D4-21: hook_check_artifacts 具名回归
// Tool: huaweicloud_hook_check_artifacts
// Test: Terraform IaC with embedded credentials
// Expected: detects risks in artifacts
// Actual: decision=warn, detected sandbox-missing-ttl + redacted credentials in evidence
// Conclusion: PASS - artifacts check works, detects risks and redacts credentials
