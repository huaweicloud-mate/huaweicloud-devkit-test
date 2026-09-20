// AI生成
/**
 * D4-16: Command Wrapping Penetration
 *
 * Objective: Verify that shell-wrapped hcloud commands (bash -c, $(), sudo,
 * command chaining) are detected and the inner destructive command is
 * intercepted.
 *
 * Method: Direct source import of classifyTextCommand and classifyHcloudArgs
 * from safety-policy.mjs, plus evaluateCommandRisk from risk-rule-engine.mjs.
 *
 * The key defense is in safety-policy.mjs:
 *   - stripExecutable() unwraps bash -c / sh -c / sudo wrappers
 *   - findHcloudCommandSegments() splits by shell operators (; && || |)
 *   - classifyHcloudArgs() then classifies each hcloud segment
 *
 * Pass criteria: The inner write/destructive command is detected (decision=deny
 * or risk=write/destructive). A bypass = the wrapped command returns allow.
 */

import { classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
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

// ─── Shell Wrapper Tests (bash -c / sh -c) ───

// 1. bash -c "hcloud ECS DeleteServers"
test('bash -c double-quote', 'bash -c "hcloud ECS DeleteServers"', () => {
  const cmd = 'bash -c "hcloud ECS DeleteServers"';
  const c = classifyTextCommand(cmd);
  const pass = c.decision === 'deny';
  return { pass, decision: c.decision, risk: c.risk, reason: c.reason };
});

// 2. sh -c 'hcloud VPC DeleteVpc'
test('sh -c single-quote', "sh -c 'hcloud VPC DeleteVpc'", () => {
  const cmd = "sh -c 'hcloud VPC DeleteVpc'";
  const c = classifyTextCommand(cmd);
  const pass = c.decision === 'deny';
  return { pass, decision: c.decision, risk: c.risk, reason: c.reason };
});

// 3. zsh -c "hcloud ECS DeleteServers"
test('zsh -c double-quote', 'zsh -c "hcloud ECS DeleteServers"', () => {
  const cmd = 'zsh -c "hcloud ECS DeleteServers"';
  const c = classifyTextCommand(cmd);
  const pass = c.decision === 'deny';
  return { pass, decision: c.decision, risk: c.risk, reason: c.reason };
});

// 4. /bin/bash -c "hcloud ECS DeleteServers"
test('/bin/bash -c', '/bin/bash -c "hcloud ECS DeleteServers"', () => {
  const cmd = '/bin/bash -c "hcloud ECS DeleteServers"';
  const c = classifyTextCommand(cmd);
  const pass = c.decision === 'deny';
  return { pass, decision: c.decision, risk: c.risk, reason: c.reason };
});

// ─── sudo wrapper ───

// 5. sudo hcloud ECS DeleteServers
test('sudo wrapper', 'sudo hcloud ECS DeleteServers', () => {
  const cmd = 'sudo hcloud ECS DeleteServers';
  const c = classifyTextCommand(cmd);
  const pass = c.decision === 'deny';
  return { pass, decision: c.decision, risk: c.risk, reason: c.reason };
});

// 6. sudo bash -c "hcloud ECS DeleteServers"
test('sudo bash -c', 'sudo bash -c "hcloud ECS DeleteServers"', () => {
  const cmd = 'sudo bash -c "hcloud ECS DeleteServers"';
  const c = classifyTextCommand(cmd);
  const pass = c.decision === 'deny';
  return { pass, decision: c.decision, risk: c.risk, reason: c.reason };
});

// ─── Command Chaining (&& || ; |) ───

// 7. hcloud ECS ListServers && hcloud ECS DeleteServers
test('&& chaining', 'hcloud ECS ListServers && hcloud ECS DeleteServers', () => {
  const cmd = 'hcloud ECS ListServers && hcloud ECS DeleteServers';
  const c = classifyTextCommand(cmd);
  const pass = c.decision === 'deny';
  return { pass, decision: c.decision, risk: c.risk, reason: c.reason };
});

// 8. hcloud ECS ListServers ; hcloud VPC DeleteVpc
test('; chaining', 'hcloud ECS ListServers ; hcloud VPC DeleteVpc', () => {
  const cmd = 'hcloud ECS ListServers ; hcloud VPC DeleteVpc';
  const c = classifyTextCommand(cmd);
  const pass = c.decision === 'deny';
  return { pass, decision: c.decision, risk: c.risk, reason: c.reason };
});

// 9. hcloud ECS ListServers || hcloud ECS DeleteServers
test('|| chaining', 'hcloud ECS ListServers || hcloud ECS DeleteServers', () => {
  const cmd = 'hcloud ECS ListServers || hcloud ECS DeleteServers';
  const c = classifyTextCommand(cmd);
  const pass = c.decision === 'deny';
  return { pass, decision: c.decision, risk: c.risk, reason: c.reason };
});

// 10. hcloud ECS ListServers | hcloud ECS DeleteServers
test('| piping', 'hcloud ECS ListServers | hcloud ECS DeleteServers', () => {
  const cmd = 'hcloud ECS ListServers | hcloud ECS DeleteServers';
  const c = classifyTextCommand(cmd);
  const pass = c.decision === 'deny';
  return { pass, decision: c.decision, risk: c.risk, reason: c.reason };
});

// ─── Command Substitution $(...) ───

// 11. $(hcloud ECS DeleteServers)
test('$(...) substitution', '$(hcloud ECS DeleteServers)', () => {
  const cmd = '$(hcloud ECS DeleteServers)';
  const c = classifyTextCommand(cmd);
  const r = evaluateCommandRisk(cmd);
  // $(...) is not directly handled by stripExecutable, but the risk rule engine
  // should catch "Delete" patterns. The classifyTextCommand won't see hcloud prefix.
  // Pass = not both allow + read_only (the command is suspicious)
  const bypass = c.decision === 'allow' && c.risk === 'read_only';
  const pass = !bypass;
  return { pass, bypass, classify: { decision: c.decision, risk: c.risk }, risk: { decision: r.decision, findings: r.findings.length } };
});

// 12. echo $(hcloud ECS DeleteServers)
test('echo $(...) substitution', 'echo $(hcloud ECS DeleteServers)', () => {
  const cmd = 'echo $(hcloud ECS DeleteServers)';
  const c = classifyTextCommand(cmd);
  const r = evaluateCommandRisk(cmd);
  const bypass = c.decision === 'allow' && c.risk === 'read_only';
  const pass = !bypass;
  return { pass, bypass, classify: { decision: c.decision, risk: c.risk }, risk: { decision: r.decision, findings: r.findings.length } };
});

// ─── Nested Wrapping ───

// 13. bash -c "sh -c 'hcloud ECS DeleteServers'"
test('Nested bash->sh', 'bash -c "sh -c \'hcloud ECS DeleteServers\'"', () => {
  const cmd = 'bash -c "sh -c \'hcloud ECS DeleteServers\'"';
  const c = classifyTextCommand(cmd);
  const pass = c.decision === 'deny';
  return { pass, decision: c.decision, risk: c.risk, reason: c.reason };
});

// 14. bash -c "hcloud ECS ListServers && hcloud ECS DeleteServers"
test('bash -c with &&', 'bash -c "hcloud ECS ListServers && hcloud ECS DeleteServers"', () => {
  const cmd = 'bash -c "hcloud ECS ListServers && hcloud ECS DeleteServers"';
  const c = classifyTextCommand(cmd);
  const pass = c.decision === 'deny';
  return { pass, decision: c.decision, risk: c.risk, reason: c.reason };
});

// ─── Direct classifyHcloudArgs API (args array) ───

// 15. classifyHcloudArgs with bash wrapper
test('classifyHcloudArgs bash -c', '["bash","-c","hcloud ECS DeleteServers"]', () => {
  const r = classifyHcloudArgs(['bash', '-c', 'hcloud ECS DeleteServers']);
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// 16. classifyHcloudArgs with sudo
test('classifyHcloudArgs sudo', '["sudo","ECS","DeleteServers"]', () => {
  const r = classifyHcloudArgs(['sudo', 'ECS', 'DeleteServers']);
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, risk: r.risk, reason: r.reason };
});

// ─── Risk Rule Engine on wrapped commands ───

// 17. evaluateCommandRisk for bash -c "hcloud ECS DeleteServers --force"
test('Risk engine: bash -c force', 'bash -c "hcloud ECS DeleteServers --force"', () => {
  const cmd = 'bash -c "hcloud ECS DeleteServers --force"';
  const r = evaluateCommandRisk(cmd);
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// 18. evaluateCommandRisk for rm -rf / via bash -c
test('Risk engine: bash -c rm -rf /', 'bash -c "rm -rf /"', () => {
  const cmd = 'bash -c "rm -rf /"';
  const r = evaluateCommandRisk(cmd);
  const pass = r.decision === 'deny';
  return { pass, decision: r.decision, findings: r.findings.map(f => ({ id: f.ruleId, severity: f.severity, category: f.category })) };
});

// ─── Report ───
console.log('═══════════════════════════════════════════════════════════════');
console.log('  D4-16: Command Wrapping Penetration');
console.log('═══════════════════════════════════════════════════════════════');
console.log();

for (const r of results) {
  const status = r.pass ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} | ${r.label}`);
  console.log(`       command: ${r.command}`);
  if (r.error) {
    console.log(`       ERROR: ${r.error}`);
  } else {
    if (r.decision !== undefined) {
      console.log(`       decision=${r.decision}  risk=${r.risk || 'N/A'}`);
      if (r.reason) console.log(`       reason: ${r.reason}`);
    } else {
      console.log(`       bypass=${r.bypass}  classify=${JSON.stringify(r.classify)}  risk=${JSON.stringify(r.risk)}`);
    }
    if (r.findings) console.log(`       findings: ${JSON.stringify(r.findings)}`);
  }
  console.log();
}

console.log('───────────────────────────────────────────────────────────────');
console.log(`  Summary: ${passCount} PASS, ${failCount} FAIL, ${results.length} total`);
console.log(`  Overall: ${failCount === 0 ? '✅ PASS' : '❌ FAIL (P0 finding!)'}`);
console.log('───────────────────────────────────────────────────────────────');
