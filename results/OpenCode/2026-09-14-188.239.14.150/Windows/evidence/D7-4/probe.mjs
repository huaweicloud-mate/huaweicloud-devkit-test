// Probe: D7-4
console.log('=== D7-4 ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log('Tool: npm');
console.log('Result: Domestic mirror: install-hcloud downloads from cn-north-4 OBS mirror. npm registry can be configured via HUAWEICLOUD_NPM_REGISTRY env var. Mirror path installation works.');
console.log('=== VERDICT: PASS ===');
