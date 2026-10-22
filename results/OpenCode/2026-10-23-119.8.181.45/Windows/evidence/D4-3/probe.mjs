// D4-3: Plaintext secret API interception
// Tested via huaweicloud_hook_check_command("hcloud ECS CreateServers --Server.adminPass=MyPassword123!")
// Result: decision=allow, no findings - FAIL: adminPass in command not caught
