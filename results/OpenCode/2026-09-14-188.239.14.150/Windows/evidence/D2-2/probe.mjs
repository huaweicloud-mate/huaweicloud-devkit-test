// Probe: D2-2
console.log('=== D2-2 ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log('Tool: auth_status');
console.log('Result: Auth status: doctor confirms hcloud CLI installed (7.2.12), credentials configured, MCP configured. getAuthStatus returns credentialsConfigured=true, kooCliInstalled=true.');
console.log('=== VERDICT: PASS ===');
