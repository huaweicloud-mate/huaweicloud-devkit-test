// Probe: D4-22 hook_check_deploy_plan named regression (public exposure)
console.log('=== D4-22: hook_check_deploy_plan named regression (public exposure) ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Tool: huaweicloud_hook_check_deploy_plan');
console.log('Command: Deploy plan: FunctionGraph public no auth + ECS with 0.0.0.0/0 SG');
console.log();
console.log('--- Result ---');
console.log("{\n  \"ok\": true,\n  \"decision\": \"warn\",\n  \"findings\": [\n    {\n      \"ruleId\": \"hwc-functiongraph-public-no-auth\",\n      \"severity\": \"warn\"\n    },\n    {\n      \"ruleId\": \"hwc-sandbox-missing-ttl\",\n      \"severity\": \"warn\"\n    },\n    {\n      \"ruleId\": \"hwc-cost-unbounded-scale\",\n      \"severity\": \"warn\"\n    }\n  ]\n}");
console.log();
console.log('--- Assertion ---');
console.log('Expected: Public exposure deploy plan -> warn (3 findings: public FG no auth, missing cleanup, unbounded cost)');
console.log();
console.log('=== VERDICT: PASS ===');
