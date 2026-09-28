tools/call credential no leak and permission check:
show_profile_redacted exists: true
No raw credential tool: true
redactSecrets function: true
Redaction test - input: AK=AKEXAMPLE123 SK=SKexample456 securityToken=token789
Redaction test - output: AK=<redacted> SK=<redacted> securityToken=<redacted>
No secret leak: true
run_readonly_command exists: true
plan_cli_command has allowWrites: true
Credentials are never leaked in tools/call responses; write operations require approval