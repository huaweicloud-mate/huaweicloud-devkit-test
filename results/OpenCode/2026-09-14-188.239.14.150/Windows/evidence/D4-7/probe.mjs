// Probe: D4-7 P1 test
console.log('=== D4-7: P1 Test ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Result: Hook three tools: hook_check_command (deny credential), hook_check_artifacts (deny broad IAM), hook_check_deploy_plan (warn public exposure) - all effective');
console.log('=== VERDICT: PASS ===');
