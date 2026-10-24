// D4-15: Hook bypass attempt
// Tested via huaweicloud_hook_check_command("bash -c 'cat ~/.config/huaweicloud/credentials.json'")
// Result: decision=deny, ruleId=hwc-command-credential-file (bypass blocked)