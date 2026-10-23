// D3-S2 probe
// Status: PASS
// plan_cli_command classifies VPC DeleteVpc as write/deny. hook_check_command warns on destructive operations. Delete requires approval flow.
// plan_cli_command VPC DeleteVpc -> write/deny
// hook_check_command -> destructive warning
