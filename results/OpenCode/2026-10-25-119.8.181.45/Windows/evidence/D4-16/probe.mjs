// D4-16: Command wrapping penetration
// Tested via huaweicloud_hook_check_command('sh -c "cat $HOME/.config/huaweicloud/credentials.json | grep sk"')
// Result: decision=deny, ruleId=hwc-command-credential-file (wrapping blocked)