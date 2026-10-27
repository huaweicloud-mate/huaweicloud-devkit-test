// Source probe: tools.mjs persistCredentials function
// MCP tool: huaweicloud_auth_switch (persist+token → needs_confirmation)
// Expected: {status:error, scope:rejected}
// Actual: persistCredentials returns rejected; token never persisted
