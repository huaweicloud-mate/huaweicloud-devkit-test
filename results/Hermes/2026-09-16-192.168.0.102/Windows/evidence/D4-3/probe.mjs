// D4-3: 明文secret API拦截
// Tool: huaweicloud_hook_check_command
// Command: hcloud DEW ShowSecretVersion --secret_id=test-123
// Expected: denied (plaintext secret read blocked)
// Actual: decision=deny, ruleId=hwc-command-secret-value-read
// Conclusion: PASS
