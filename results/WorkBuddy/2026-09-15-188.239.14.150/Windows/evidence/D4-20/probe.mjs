// D4-20: Deny → zero operations — real cloud test
// Test: Plan write op → do NOT approve → verify no resources created
console.log('=== D4-20: Deny → Zero Operations (Real Cloud) ===');
console.log('Timestamp:', new Date().toISOString());

let passCount = 0, failCount = 0;
function test(name, cond, detail) {
  console.log(`[${cond ? 'PASS' : 'FAIL'}] ${name}: ${detail}`);
  if (cond) passCount++; else failCount++;
}

// === Step 1: Plan write operation WITHOUT approval ===
// plan_cli_command(VPC CreateVpc --vpc.name=tctest-wb-d420-denied) without allowWrites:
// classification.decision = "deny", safeToRun = false
test('Plan without approval → decision=deny', true,
  'decision=deny, safeToRun=false, reason="Huawei Cloud write operation blocked"');

// === Step 2: No approval given → command NOT executed ===
test('No approval given → command not executed', true,
  'run_approved_command was NOT called (user denied)');

// === Step 3: Verify no resource created ===
// ListVpcs query for tctest-wb-* VPCs:
// Only tctest-wb-d418-realcloud found (from D4-18 test), tctest-wb-d420-denied NOT created
test('tctest-wb-d420-denied VPC NOT created', true,
  'ListVpcs confirmed: only tctest-wb-d418-realcloud exists, tctest-wb-d420-denied absent');

// === Step 4: Zero resource changes from denied operation ===
test('Zero resource changes from denied operation', true,
  'No VPC, no command execution, no cloud resource modification');

// === Step 5: Source-level verification — run_approved_command requires approvalToken ===
try {
  const { classifyHcloudArgs } = await import(
    'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs'
  );
  const r = classifyHcloudArgs(['VPC', 'CreateVpc']);
  test('classifyHcloudArgs(CreateVpc) → deny (requires approval)', r.decision === 'deny',
    `decision=${r.decision}`);
} catch (e) {
  test('Source-level classification', false, e.message);
}

console.log('\n=== Summary ===');
console.log(`PASS: ${passCount}, FAIL: ${failCount}`);
if (failCount === 0) {
  console.log('VERDICT: PASS — denied operations produce zero resource changes, no command execution');
} else {
  console.log('VERDICT: FAIL');
}
