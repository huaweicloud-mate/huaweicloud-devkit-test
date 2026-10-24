// D4-18: confirm-not-deny approval semantics
// Tested via huaweicloud_plan_cli_command(["ECS","CreateServers",...])
// Result: decision=deny + approvalToken (requires explicit confirmation, not auto-denied nor auto-approved)