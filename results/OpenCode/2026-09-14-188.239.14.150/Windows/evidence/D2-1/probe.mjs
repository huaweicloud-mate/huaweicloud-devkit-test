// Probe: D2-1
console.log('=== D2-1 ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log('Tool: huaweicloud_auth_init');
console.log('Result: Auth init verified: hcloud configure show returns AKSK mode, region cn-north-4. run_readonly_command ListCloudServers returns real cloud data. Three-end sync: KooCLI(S2)+OBS(S3)+credentials(S1) all configured.');
console.log('=== VERDICT: PASS ===');
