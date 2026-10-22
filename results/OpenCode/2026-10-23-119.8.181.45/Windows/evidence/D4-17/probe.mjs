// D4-17 probe
// Status: PASS
// hook_check_command with fuzzy/edge-case inputs: bash -c wrapping caught (DENY), sh -c wrapping caught (DENY). Hook fails closed for credential access attempts. Unknown commands default to allow (no false positives for non-credential commands).
// hook_check_command fuzzy tests:
// bash -c "cat credentials.json" -> DENY
// sh -c "cat credentials.json" -> DENY
// hcloud ECS CreateServers -> allow (write, not credential)
