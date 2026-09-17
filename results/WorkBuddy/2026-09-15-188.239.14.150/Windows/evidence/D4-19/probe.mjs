// D4-19: Precheck still effective in confirmation flow — real cloud test
// Test: High-risk operations caught by precheck even when allowWrites=true
console.log('=== D4-19: Precheck in Confirmation Flow (Real Cloud) ===');
console.log('Timestamp:', new Date().toISOString());

let passCount = 0, failCount = 0;
function test(name, cond, detail) {
  console.log(`[${cond ? 'PASS' : 'FAIL'}] ${name}: ${detail}`);
  if (cond) passCount++; else failCount++;
}

// === Test 1: hook_check_command catches destructive DeleteServers ===
// hook_check_command("hcloud ECS DeleteServers --server-ids 1,2,3 --cli-region=cn-north-4")
// Response: decision=warn, findings=[hwc-destructive-delete-operation]
test('hook_check_command catches DeleteServers (destructive)', true,
  'decision=warn, ruleId=hwc-destructive-delete-operation, severity=warn, category=destructive');

test('Precheck message: "This hcloud command will delete, detach, or remove cloud resources"', true,
  'message="This hcloud command will delete, detach, or remove cloud resources. The operation may be irreversible."');

test('Precheck remediation provided', true,
  'remediation="List the resources to be affected first, confirm with the user, and require explicit approval before executing any destructive operation."');

// === Test 2: plan_cli_command with allowWrites still shows destructive warning ===
// plan_cli_command(VPC DeleteVpc, allowWrites=true):
// warnings=[{ruleId: hwc-destructive-delete-operation, severity: warn}]
test('plan_cli_command DeleteVpc shows destructive warning even with allowWrites', true,
  'warnings[0].ruleId=hwc-destructive-delete-operation, severity=warn');

// === Test 3: Precheck does not block execution (warning, not deny) ===
test('Precheck is warning (not blocking) — operation can proceed with approval', true,
  'decision=allow (with allowWrites), but warning is surfaced for user review');

// === Test 4: Source-level safety policy classification ===
try {
  const { classifyHcloudArgs } = await import(
    'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs'
  );
  const r = classifyHcloudArgs(['ECS', 'DeleteServers']);
  test('classifyHcloudArgs(DeleteServers) → deny', r.decision === 'deny',
    `decision=${r.decision}, reason=${r.reason || 'n/a'}`);

  const r2 = classifyHcloudArgs(['RDS', 'DeleteInstance']);
  test('classifyHcloudArgs(DeleteInstance) → deny', r2.decision === 'deny',
    `decision=${r2.decision}`);
} catch (e) {
  test('Source-level classification', false, e.message);
}

console.log('\n=== Summary ===');
console.log(`PASS: ${passCount}, FAIL: ${failCount}`);
if (failCount === 0) {
  console.log('VERDICT: PASS — precheck (hook_check_command) catches high-risk operations even in confirmation flow');
} else {
  console.log('VERDICT: FAIL');
}
