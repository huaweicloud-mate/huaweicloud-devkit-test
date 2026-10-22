// D4-7 probe
// Status: PASS
// All three hook tools tested and effective: hook_check_command (credential/destructive detection), hook_check_artifacts (adminPass/secret in IaC), hook_check_deploy_plan (exposure/cost warnings). All return structured findings with ruleId, severity, remediation.
// All three hook tools tested via MCP calls
// hook_check_command: DENY for credential access
// hook_check_artifacts: WARN for adminPass
// hook_check_deploy_plan: WARN for exposure+cost
