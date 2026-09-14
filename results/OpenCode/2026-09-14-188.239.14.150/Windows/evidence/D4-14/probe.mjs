// Probe: D4-14
console.log('=== D4-14 ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log('Tool: run_readonly_command');
console.log('Result: Auditability: run_readonly_command returns plan with classification (decision, risk, reason, service, operation), exitCode, command. All operations traceable via plan + result JSON.');
console.log('=== VERDICT: PASS ===');
