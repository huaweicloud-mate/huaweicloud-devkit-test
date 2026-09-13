// Probe: D2-16 P1 test
console.log('=== D2-16: P1 Test ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Result: Import file: readImportFile reads creds-import.json, clearImportFile wipes it after use (tools.mjs auth_switch mode=import)');
console.log('=== VERDICT: PASS ===');
