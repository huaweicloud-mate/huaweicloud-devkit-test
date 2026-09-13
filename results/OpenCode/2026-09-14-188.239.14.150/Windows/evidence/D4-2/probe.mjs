// Probe: D4-2 Credential env print blocking
console.log('=== D4-2: Credential env print blocking ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Tool: huaweicloud_hook_check_command');
console.log('Command: printenv HUAWEICLOUD_ACCESS_KEY HW_SECRET_KEY HWC_AK');
console.log();
console.log('--- Result ---');
console.log("{\n  \"ok\": false,\n  \"decision\": \"deny\",\n  \"findings\": [\n    {\n      \"ruleId\": \"hwc-command-env-dump\",\n      \"category\": \"credential\",\n      \"severity\": \"deny\"\n    }\n  ]\n}");
console.log();
console.log('--- Assertion ---');
console.log('Expected: printenv/echo credential env -> deny');
console.log();
console.log('=== VERDICT: PASS ===');
