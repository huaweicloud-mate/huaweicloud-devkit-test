// D4-6 probe
// Status: PASS
// hook_check_command with --Server.adminPass=MyPassword123!: ALLOWED (no warning for adminPass in CLI command). hook_check_artifacts DOES warn for adminPass in IaC. Note: command-level adminPass detection gap - see D4-3 finding.
// hook_check_command("hcloud ECS CreateServers --Server.adminPass=...") -> allow
// hook_check_artifacts with admin_pass in .tf -> warn (hwc-command-adminpass-exposure)
