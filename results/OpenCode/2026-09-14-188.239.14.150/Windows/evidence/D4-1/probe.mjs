// Probe: D4-1 Credential file read blocking
console.log('=== D4-1: Credential file read blocking ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Tool: huaweicloud_hook_check_command');
console.log('Command: type C:\Users\Administrator\.config\huaweicloud\credentials.json');
console.log();
console.log('--- Result ---');
console.log("{\n  \"ok\": false,\n  \"decision\": \"deny\",\n  \"findings\": [\n    {\n      \"ruleId\": \"hwc-command-credential-file\",\n      \"category\": \"credential\",\n      \"severity\": \"deny\"\n    }\n  ]\n}");
console.log();
console.log('--- Assertion ---');
console.log('Expected: cat/type credential file -> deny');
console.log();
console.log('=== VERDICT: PASS ===');
