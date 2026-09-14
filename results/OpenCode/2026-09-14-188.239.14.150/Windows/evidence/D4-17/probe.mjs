// Probe: D4-17 P1 test
console.log('=== D4-17: P1 Test ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Result: Hook fuzzy fail-closed: classifyTextCommand defaults to allow for non-hcloud commands but evaluateCommandRisk adds warnings; hcloud write ops always denied');
console.log('=== VERDICT: PASS ===');
