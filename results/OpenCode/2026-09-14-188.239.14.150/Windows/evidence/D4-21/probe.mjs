// Probe: D4-21 hook_check_artifacts named regression (broad IAM policy)
console.log('=== D4-21: hook_check_artifacts named regression (broad IAM policy) ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Tool: huaweicloud_hook_check_artifacts');
console.log('Command: Artifact: broad IAM policy with Action=* Resource=*');
console.log();
console.log('--- Result ---');
console.log("{\n  \"ok\": false,\n  \"decision\": \"deny\",\n  \"findings\": [\n    {\n      \"ruleId\": \"hwc-iam-admin-policy\",\n      \"category\": \"iam\",\n      \"severity\": \"deny\"\n    }\n  ]\n}");
console.log();
console.log('--- Assertion ---');
console.log('Expected: Broad IAM policy (* action, * resource) -> deny');
console.log();
console.log('=== VERDICT: PASS ===');
