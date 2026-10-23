// D3-C1 probe
// Status: BLOCKED
// ECS lifecycle E2E requires real cloud resource creation (plan+approve+create+delete). plan_cli_command available but actual create/delete needs user approval for billed resources. Marked BLOCKED: real cloud ECS create/delete requires explicit user approval for billed resources.
// plan_cli_command ECS CreateServers -> write/deny
// Requires user approval for billed ECS creation
