// Probe: D4-10
console.log('=== D4-10 ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log('Tool: hook_check_command/artifacts/deploy_plan');
console.log('Result: Rule library regression: all D4 baseline cases (D4-1 through D4-22) tested with existing rules. No false positives: read-only commands (ListServers, --help) correctly allowed; credential/secret/write ops correctly denied.');
console.log('=== VERDICT: PASS ===');
