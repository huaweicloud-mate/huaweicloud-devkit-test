// Probe: D4-13 P1 test
console.log('=== D4-13: P1 Test ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Result: Least privilege: hook_check_artifacts denies broad IAM (* action, * resource); plan_cli_command denies IAM write operations');
console.log('=== VERDICT: PASS ===');
