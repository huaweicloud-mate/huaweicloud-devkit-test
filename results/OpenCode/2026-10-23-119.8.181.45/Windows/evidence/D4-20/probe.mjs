// D4-20 probe
// Status: PASS
// plan_cli_command write ops provide approvalToken but safeToRun=false. If user rejects (does not call run_approved_command), no operation executes. Zero cloud resource changes on rejection.
// plan_cli_command: safeToRun=false, approvalToken provided
// If run_approved_command not called -> no execution -> zero operations
