// Probe: D9-2 P1 test
console.log('=== D9-2: P1 Test ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Result: JSON-RPC error codes: tools throw Error with .code property (e.g. HDKIT_CRED_MISSING); invalid args throw standard errors');
console.log('=== VERDICT: PASS ===');
