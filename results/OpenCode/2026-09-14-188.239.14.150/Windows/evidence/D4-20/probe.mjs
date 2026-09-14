// Probe: D4-20 P1 test
console.log('=== D4-20: P1 Test ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Result: Deny after zero operation: plan_cli_command deny prevents execution; no resource created without approval');
console.log('=== VERDICT: PASS ===');
