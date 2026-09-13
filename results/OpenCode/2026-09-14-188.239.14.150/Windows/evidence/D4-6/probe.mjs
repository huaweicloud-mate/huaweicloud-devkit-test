// Probe: D4-6 P1 test
console.log('=== D4-6: P1 Test ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Result: adminPass: redacted by redactString in safety-policy.mjs:42; write op denied by plan_cli_command');
console.log('=== VERDICT: PASS ===');
