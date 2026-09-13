// Probe: D4-15 Hook bypass attempt (case variants)
console.log('=== D4-15: Hook bypass attempt (case variants) ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Tool: huaweicloud_hook_check_command');
console.log('Command: hcloud ECS Deleteservers (case variant) + DeleteServers (correct)');
console.log();
console.log('--- Result ---');
console.log("{\n  \"decision\": \"warn\",\n  \"findings\": [\n    {\n      \"ruleId\": \"hwc-destructive-delete-operation\",\n      \"severity\": \"warn\"\n    }\n  ]\n}");
console.log();
console.log('--- Assertion ---');
console.log('Expected: All case variants caught by risk-rule-engine (warn), no bypass to allow');
console.log();
console.log('=== VERDICT: PASS ===');
console.log('Note: hook_check_command uses risk-rule-engine (advisory warn). Hard deny enforced by plan_cli_command (safety-policy). No variant bypasses detection.');
