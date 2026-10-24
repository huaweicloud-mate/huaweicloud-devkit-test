// D4-20: reject zero operation
// After rejection in approval flow, no resource changes or command execution
// Verified via plan_cli_command: denied commands have safeToRun=false, no execution without approval