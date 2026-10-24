// D4-2: Credential env print interception
// Tested via huaweicloud_hook_check_command("echo $HW_SECRET_KEY && printenv HW_ACCESS_KEY")
// Result: decision=deny, ruleId=hwc-command-env-dump