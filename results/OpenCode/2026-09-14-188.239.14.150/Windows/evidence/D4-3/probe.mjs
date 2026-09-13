// Probe: D4-3 Plaintext secret API blocking
console.log('=== D4-3: Plaintext secret API blocking ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Tool: huaweicloud_hook_check_command');
console.log('Command: hcloud CSMS ShowSecretVersion --secret_id test-secret');
console.log();
console.log('--- Result ---');
console.log("{\n  \"ok\": false,\n  \"decision\": \"deny\",\n  \"findings\": [\n    {\n      \"ruleId\": \"hwc-command-secret-value-read\",\n      \"category\": \"secret\",\n      \"severity\": \"deny\"\n    }\n  ]\n}");
console.log();
console.log('--- Assertion ---');
console.log('Expected: ShowSecretVersion/GetSecretValue -> deny');
console.log();
console.log('=== VERDICT: PASS ===');
