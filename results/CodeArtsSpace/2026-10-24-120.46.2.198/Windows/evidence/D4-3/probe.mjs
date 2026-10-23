// D4-3: hook_check_command 明文 secret API 拦截
// MCP: huaweicloud_hook_check_command("hcloud CSMS ShowSecret --secret-id xxx --plaintext")
// 结果: decision=deny, rule=hwc-command-secret-value-read