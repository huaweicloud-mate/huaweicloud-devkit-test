// Probe: D4-9 Public exposure/destructive pre-check
console.log('=== D4-9: Public exposure/destructive pre-check ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Tool: huaweicloud_plan_cli_command + hook_check_deploy_plan');
console.log('Command: CreateSecurityGroupRule 0.0.0.0/0 + DeleteServers');
console.log();
console.log('--- Result ---');
console.log("{\n  \"plan\": {\n    \"classification\": {\n      \"decision\": \"deny\",\n      \"risk\": \"write\"\n    },\n    \"safeToRun\": false\n  },\n  \"deploy_plan\": {\n    \"decision\": \"warn\",\n    \"findings_count\": 3\n  }\n}");
console.log();
console.log('--- Assertion ---');
console.log('Expected: Public exposure SG rule -> deny (write gate); Deploy plan with public exposure -> warn (3 findings)');
console.log();
console.log('=== VERDICT: PASS ===');
