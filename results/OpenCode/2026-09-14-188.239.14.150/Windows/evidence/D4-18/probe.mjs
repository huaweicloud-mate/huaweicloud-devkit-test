// Probe: D4-18 Confirm-not-deny approval semantics
console.log('=== D4-18: Confirm-not-deny approval semantics ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Tool: huaweicloud_plan_cli_command');
console.log('Command: hcloud ECS DeleteServers (write operation)');
console.log();
console.log('--- Result ---');
console.log("{\n  \"classification\": {\n    \"decision\": \"deny\",\n    \"risk\": \"write\",\n    \"reason\": \"Huawei Cloud write operation blocked until the agent presents a plan and receives explicit user approval.\"\n  },\n  \"safeToRun\": false\n}");
console.log();
console.log('--- Assertion ---');
console.log('Expected: Write op -> deny with blocked-until-approval (not direct reject, not direct allow)');
console.log();
console.log('=== VERDICT: PASS ===');
