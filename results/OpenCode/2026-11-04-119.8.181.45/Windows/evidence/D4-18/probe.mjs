// D4-18 probe: confirm-not-deny approval semantics
// Write ops via plan_cli_command return approvalToken (pending approval), NOT auto-execute, NOT direct reject
// Verified via MCP huaweicloud_plan_cli_command ECS CreateServers -> decision=deny risk=write + approvalToken + safeToRun=false
// This is the "confirm" gate: blocked until explicit approval, neither auto-run nor hard-rejected.
