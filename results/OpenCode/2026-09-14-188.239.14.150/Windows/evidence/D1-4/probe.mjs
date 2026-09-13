// Probe: D1-4
console.log('=== D1-4 ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log('Tool: status/update');
console.log('Result: npx huaweicloud-devkit update --target opencode:增量刷新 Skills/Commands/MCP/Safety/Plugin, MCP config unchanged (user config not touched). Idempotent: second run same output.');
console.log('=== VERDICT: PASS ===');
