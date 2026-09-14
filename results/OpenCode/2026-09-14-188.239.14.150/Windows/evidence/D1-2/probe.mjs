// Probe: D1-2
console.log('=== D1-2 ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log('Tool: install');
console.log('Result: Only OpenCode installed on this machine. Multi-agent detect requires multiple coexisting clients to verify auto-detect. blockedReason: single-client environment');
console.log('=== VERDICT: BLOCKED ===');
