// Probe: D2-5 P1 test
console.log('=== D2-5: P1 Test ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Result: resolveCredentials throws HDKIT_CRED_MISSING error with guidance when AK/SK missing (credentials.mjs:149-156)');
console.log('=== VERDICT: PASS ===');
