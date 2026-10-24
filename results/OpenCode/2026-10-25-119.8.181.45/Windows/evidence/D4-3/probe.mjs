// D4-3: Plaintext secret API interception
// Tested via huaweicloud_hook_check_command("hcloud ECS CreateServers --cli-region=cn-north-4 --Server.adminPass=MyPassword123!")
// Result: decision=allow (FAIL - hook_check_command does not scan CLI arg values for plaintext secrets)