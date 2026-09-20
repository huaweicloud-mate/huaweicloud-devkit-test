// AI生成
/**
 * D4-9: Public Exposure / Destructive Pre-check
 *
 * Objective: Verify that public exposure operations (0.0.0.0/0 on admin ports)
 * and destructive operations (rm -rf, DeleteServers --force) are intercepted
 * BEFORE execution (deny or warn).
 *
 * Method: Direct source import of classifyTextCommand from safety-policy.mjs
 * and evaluateCommandRisk from risk-rule-engine.mjs.
 *
 * Pass criteria:
 *   - Public exposure: decision=deny (hwc-network-public-admin-port rule)
 *   - Destructive force: decision=deny (hwc-destructive-delete-force rule)
 *   - rm -rf /: decision=deny (hwc-sandbox-destructive-command rule)
 *   - hcloud delete ops: decision=deny or warn (destructive rules)
 */

import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
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

// ─── Public Exposure Tests ───

// 1. Open SSH (port 22) to 0.0.0.0/0
test('Public SSH 0.0.0.0/0', 'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix 0.0.0.0/0 --port 22', () => {
  const cmd = 'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix 0.0.0.0/0 --port 22';
  const r = evaluateCommandRisk(cmd);
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category, title: f.title })) };
});

// 2. Open RDP (port 3389) to 0.0.0.0/0
test('Public RDP 0.0.0.0/0', 'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix 0.0.0.0/0 --port 3389', () => {
  const cmd = 'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix 0.0.0.0/0 --port 3389';
  const r = evaluateCommandRisk(cmd);
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// 3. Open MySQL (port 3306) to 0.0.0.0/0
test('Public MySQL 0.0.0.0/0', 'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix 0.0.0.0/0 --port 3306', () => {
  const cmd = 'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix 0.0.0.0/0 --port 3306';
  const r = evaluateCommandRisk(cmd);
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// 4. Open Redis (port 6379) to ::/0 (IPv6 any)
test('Public Redis ::/0', 'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix ::/0 --port 6379', () => {
  const cmd = 'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix ::/0 --port 6379';
  const r = evaluateCommandRisk(cmd);
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// 5. Open MongoDB (port 27017) to 0.0.0.0/0
test('Public MongoDB 0.0.0.0/0', 'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix 0.0.0.0/0 --port 27017', () => {
  const cmd = 'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix 0.0.0.0/0 --port 27017';
  const r = evaluateCommandRisk(cmd);
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// 6. Also verify via classifyTextCommand (full pipeline)
test('classifyTextCommand public SSH', 'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix 0.0.0.0/0 --port 22', () => {
  const r = classifyTextCommand('hcloud VPC CreateSecurityGroupRule --remote_ip_prefix 0.0.0.0/0 --port 22');
  // CreateSecurityGroupRule is a write op → deny by policy, plus risk rule may also fire
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// ─── Destructive Operation Tests ───

// 7. rm -rf / — sandbox destructive
test('rm -rf /', 'rm -rf /', () => {
  const r = evaluateCommandRisk('rm -rf /');
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// 8. hcloud ECS DeleteServers --force — forced delete
test('DeleteServers --force', 'hcloud ECS DeleteServers --force', () => {
  const r = evaluateCommandRisk('hcloud ECS DeleteServers --force');
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// 9. hcloud ECS DeleteServers --force via classifyTextCommand (full pipeline)
test('classifyTextCommand DeleteServers --force', 'hcloud ECS DeleteServers --force', () => {
  const r = classifyTextCommand('hcloud ECS DeleteServers --force');
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 10. rm -rf / via classifyTextCommand
test('classifyTextCommand rm -rf /', 'rm -rf /', () => {
  const r = classifyTextCommand('rm -rf /');
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 11. hcloud ECS DeleteServers (plain delete — should be warn or deny)
test('DeleteServers (plain)', 'hcloud ECS DeleteServers', () => {
  const r = evaluateCommandRisk('hcloud ECS DeleteServers');
  const pass = r.decision === 'deny' || r.decision === 'warn';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// 12. hcloud ECS BatchDeleteServers (batch delete — should be warn or deny)
test('BatchDeleteServers', 'hcloud ECS BatchDeleteServers', () => {
  const r = evaluateCommandRisk('hcloud ECS BatchDeleteServers');
  const pass = r.decision === 'deny' || r.decision === 'warn';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// 13. mkfs — destructive disk format
test('mkfs', 'mkfs.ext4 /dev/sda', () => {
  const r = evaluateCommandRisk('mkfs.ext4 /dev/sda');
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// 14. shutdown — destructive
test('shutdown', 'shutdown -h now', () => {
  const r = evaluateCommandRisk('shutdown -h now');
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// 15. Delete with cascade: delete_publicip=true
test('DeleteServers cascade', 'hcloud ECS DeleteServers --delete_publicip=true --delete_volume=true', () => {
  const r = evaluateCommandRisk('hcloud ECS DeleteServers --delete_publicip=true --delete_volume=true');
  const pass = r.decision === 'deny' || r.decision === 'warn';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// ─── Report ───
console.log('═══════════════════════════════════════════════════════════════');
console.log('  D4-9: Public Exposure / Destructive Pre-check');
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
