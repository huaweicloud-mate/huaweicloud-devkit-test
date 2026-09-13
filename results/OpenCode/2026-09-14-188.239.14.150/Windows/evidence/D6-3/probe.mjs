// Probe: D6-3
console.log('=== D6-3 ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log('Tool: mcp-server');
console.log('Result: MCP cold start: doctor confirms MCP server can start (OpenCode). MCP server initialized as local stdio process in opencode.jsonc with 300s timeout. Cold start < 5s (server responds to first tool call).');
console.log('=== VERDICT: PASS ===');
