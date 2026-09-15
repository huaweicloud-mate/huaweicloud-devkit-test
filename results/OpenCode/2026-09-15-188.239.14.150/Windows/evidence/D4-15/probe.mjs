// D4-15: hook绕过尝试
// Tool: huaweicloud_hook_check_command
// Command: cat $HOME/.config/huaweicloud/credentials.json (variable bypass)
// Expected: denied
// Actual: decision=deny, ruleId=hwc-command-credential-file
// Conclusion: PASS
