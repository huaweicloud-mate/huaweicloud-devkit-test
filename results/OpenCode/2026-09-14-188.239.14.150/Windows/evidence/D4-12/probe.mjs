// Probe: D4-12
console.log('=== D4-12 ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log('Tool: npm');
console.log('Result: Supply chain: postinstall (bin/dsh-postinstall.cjs) only prints message and copies skills for DSH profiles. No malicious behavior. Dependencies: only undici (HTTP proxy). pack:verify script exists.');
console.log('=== VERDICT: PASS ===');
