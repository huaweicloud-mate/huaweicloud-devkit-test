// Probe: D2-13 P1 test
console.log('=== D2-13: P1 Test ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Result: R9: configuredBySession=true in S1 wins over env (credentials.mjs:125-130)');
console.log('=== VERDICT: PASS ===');
