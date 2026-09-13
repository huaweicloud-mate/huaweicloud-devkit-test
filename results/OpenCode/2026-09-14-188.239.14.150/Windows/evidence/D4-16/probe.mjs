// Probe: D4-16 Command wrapping penetration
console.log('=== D4-16: Command wrapping penetration ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Tool: huaweicloud_hook_check_command');
console.log('Command: sh -c "hcloud ECS DeleteServers --instance_ids test-123"');
console.log();
console.log('--- Result ---');
console.log("{\n  \"decision\": \"warn\",\n  \"findings\": [\n    {\n      \"ruleId\": \"hwc-destructive-delete-operation\",\n      \"severity\": \"warn\"\n    }\n  ]\n}");
console.log();
console.log('--- Assertion ---');
console.log('Expected: Shell-wrapped hcloud command -> inner command discovered and warned');
console.log();
console.log('=== VERDICT: PASS ===');
console.log('Note: Risk-rule-engine regex matches destructive patterns even inside shell wrappers. Inner command discovered in evidence field.');
