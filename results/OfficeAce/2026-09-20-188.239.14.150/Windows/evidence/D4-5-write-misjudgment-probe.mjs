// AI生成
/**
 * D4-5: Write Operation Misjudgment Detection
 *
 * Objective: Verify that write operations (Delete, Create, Update, etc.)
 * are NOT misclassified as read-only/allow by the safety policy.
 *
 * Method: Direct source import of classifyHcloudArgs and classifyTextCommand
 * from safety-policy.mjs, plus evaluateCommandRisk from risk-rule-engine.mjs.
 *
 * Pass criteria: Every write operation must return decision=deny (or at minimum
 * risk != read_only). If any write op returns allow + read_only, that is a P0
 * finding (false negative — write masquerading as read).
 */

import { classifyHcloudArgs, classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const results = [];
let passCount = 0;
let failCount = 0;

function test(label, command, fn) {
  try {
    const result = fn();
    results.push({ label, command, ...result, error: null });
    if (result.pass) passCount++; else failCount++;
  } catch (e) {
    results.push({ label, command, pass: false, error: e.message });
    failCount++;
  }
}

// ─── Test Cases: Write operations that must NOT be classified as read-only ───

// 1. hcloud ECS DeleteServers — classic delete
test('ECS DeleteServers', 'hcloud ECS DeleteServers', () => {
  const r = classifyTextCommand('hcloud ECS DeleteServers');
  const pass = r.decision !== 'allow' || r.risk !== 'read_only';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 2. hcloud VPC DeleteVpc — VPC delete
test('VPC DeleteVpc', 'hcloud VPC DeleteVpc', () => {
  const r = classifyTextCommand('hcloud VPC DeleteVpc');
  const pass = r.decision !== 'allow' || r.risk !== 'read_only';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 3. hcloud ECS CreateServers — create is also a write
test('ECS CreateServers', 'hcloud ECS CreateServers', () => {
  const r = classifyTextCommand('hcloud ECS CreateServers');
  const pass = r.decision !== 'allow' || r.risk !== 'read_only';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 4. hcloud ECS UpdateServer — update is a write
test('ECS UpdateServer', 'hcloud ECS UpdateServer', () => {
  const r = classifyTextCommand('hcloud ECS UpdateServer');
  const pass = r.decision !== 'allow' || r.risk !== 'read_only';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 5. hcloud IAM CreatePolicy — IAM write
test('IAM CreatePolicy', 'hcloud IAM CreatePolicy', () => {
  const r = classifyTextCommand('hcloud IAM CreatePolicy');
  const pass = r.decision !== 'allow' || r.risk !== 'read_only';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 6. hcloud ECS BatchDeleteServers — batch delete
test('ECS BatchDeleteServers', 'hcloud ECS BatchDeleteServers', () => {
  const r = classifyTextCommand('hcloud ECS BatchDeleteServers');
  const pass = r.decision !== 'allow' || r.risk !== 'read_only';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 7. hcloud VPC DeleteSubnet — subnet delete
test('VPC DeleteSubnet', 'hcloud VPC DeleteSubnet', () => {
  const r = classifyTextCommand('hcloud VPC DeleteSubnet');
  const pass = r.decision !== 'allow' || r.risk !== 'read_only';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 8. hcloud ECS AttachVolume — attach is a write
test('ECS AttachVolume', 'hcloud ECS AttachVolume', () => {
  const r = classifyTextCommand('hcloud ECS AttachVolume');
  const pass = r.decision !== 'allow' || r.risk !== 'read_only';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 9. hcloud ECS DetachVolume — detach is a write
test('ECS DetachVolume', 'hcloud ECS DetachVolume', () => {
  const r = classifyTextCommand('hcloud ECS DetachVolume');
  const pass = r.decision !== 'allow' || r.risk !== 'read_only';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 10. hcloud VPC ModifySecurityGroup — modify is a write
test('VPC ModifySecurityGroup', 'hcloud VPC ModifySecurityGroup', () => {
  const r = classifyTextCommand('hcloud VPC ModifySecurityGroup');
  const pass = r.decision !== 'allow' || r.risk !== 'read_only';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 11. hcloud ECS RebootServers — reboot is a write/execution
test('ECS RebootServers', 'hcloud ECS RebootServers', () => {
  const r = classifyTextCommand('hcloud ECS RebootServers');
  const pass = r.decision !== 'allow' || r.risk !== 'read_only';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 12. hcloud ECS StopServers — stop is a write/execution
test('ECS StopServers', 'hcloud ECS StopServers', () => {
  const r = classifyTextCommand('hcloud ECS StopServers');
  const pass = r.decision !== 'allow' || r.risk !== 'read_only';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 13. Direct args API: classifyHcloudArgs(['ECS', 'DeleteServers'])
test('classifyHcloudArgs ECS DeleteServers', 'ECS DeleteServers (args API)', () => {
  const r = classifyHcloudArgs(['ECS', 'DeleteServers']);
  const pass = r.decision !== 'allow' || r.risk !== 'read_only';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 14. Risk rule engine: evaluateCommandRisk for DeleteServers
test('evaluateCommandRisk DeleteServers', 'hcloud ECS DeleteServers (risk engine)', () => {
  const r = evaluateCommandRisk('hcloud ECS DeleteServers');
  const hasDestructiveFinding = r.findings.some(f => f.category === 'destructive');
  const pass = r.decision !== 'allow' || hasDestructiveFinding;
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// 15. Negative control: hcloud ECS ListServers SHOULD be read-only
test('NEGATIVE: ECS ListServers (should be read_only)', 'hcloud ECS ListServers', () => {
  const r = classifyTextCommand('hcloud ECS ListServers');
  const pass = r.risk === 'read_only' || r.risk === 'unknown_read';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason, note: 'Negative control - should be read-only' };
});

// ─── Report ───
console.log('═══════════════════════════════════════════════════════════════');
console.log('  D4-5: Write Operation Misjudgment Detection');
console.log('═══════════════════════════════════════════════════════════════');
console.log();

for (const r of results) {
  const status = r.pass ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} | ${r.label}`);
  console.log(`       command: ${r.command}`);
  if (r.error) {
    console.log(`       ERROR: ${r.error}`);
  } else {
    console.log(`       decision=${r.decision}  risk=${r.risk || 'N/A'}`);
    if (r.reason) console.log(`       reason: ${r.reason}`);
    if (r.findings) console.log(`       findings: ${JSON.stringify(r.findings)}`);
  }
  console.log();
}

console.log('───────────────────────────────────────────────────────────────');
console.log(`  Summary: ${passCount} PASS, ${failCount} FAIL, ${results.length} total`);
console.log(`  Overall: ${failCount === 0 ? '✅ PASS' : '❌ FAIL (P0 finding!)'}`);
console.log('───────────────────────────────────────────────────────────────');
