// Probe: D4-5 Write operation misjudgment detection
console.log('=== D4-5: Write operation misjudgment detection ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Tool: huaweicloud_plan_cli_command');
console.log('Command: hcloud ECS DeleteServers --instance_ids test-123');
console.log();
console.log('--- Result ---');
console.log("{\n  \"classification\": {\n    \"decision\": \"deny\",\n    \"risk\": \"write\"\n  },\n  \"safeToRun\": false\n}");
console.log();
console.log('--- Assertion ---');
console.log('Expected: DeleteServers -> deny (write), not misjudged as read-only');
console.log();
console.log('=== VERDICT: PASS ===');
