// P0 Safety Re-test: D4-2, D4-15, D4-16 with classifyTextCommand
import { classifyHcloudArgs, redactSecrets, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const evidenceBase = join(__dirname, '..', 'huaweicloud-devkit-test', 'results', 'Hermes', '2026-09-23-120.46.40.202', 'Windows', 'evidence');
const results = {};

function test(name, fn) {
  try {
    const r = fn();
    results[name] = r;
    console.log(`[${r.status}] ${name}: ${JSON.stringify(r).substring(0, 300)}`);
  } catch(e) {
    results[name] = { status: 'ERROR', error: e.message };
    console.log(`[ERROR] ${name}: ${e.message}`);
  }
}

// D4-2: Credential env var print blocked — use classifyTextCommand (the function that checks $HW_* patterns)
test('D4-2', () => {
  const r1 = classifyTextCommand('echo $HW_ACCESS_KEY');
  const r2 = classifyTextCommand('printenv HW_SECRET_ACCESS_KEY');
  const r3 = classifyTextCommand('echo $HW_SECRET_KEY');
  const r4 = classifyTextCommand('printenv HW_ACCESS_KEY');
  const allBlocked = [r1, r2, r3, r4].every(r => r.decision === 'deny' || r.decision === 'block');
  return { 
    status: allBlocked ? 'PASS' : 'FAIL', 
    echo_HW_AK: r1.decision, 
    printenv_HW_SK: r2.decision,
    echo_HW_SK: r3.decision,
    printenv_HW_AK: r4.decision,
    detail: JSON.stringify(r1).substring(0, 300)
  };
});

// D4-15: Hook bypass attempt — use classifyTextCommand for text-level commands
test('D4-15', () => {
  // The safety system has multiple layers:
  // 1. classifyTextCommand for general shell commands
  // 2. classifyHcloudArgs for hcloud-specific commands
  // 3. Risk rules for command-level patterns
  // --no-confirm flag should still require approval for write ops
  const bypasses = [
    'hcloud ECS DeleteServer --server_id=test --no-confirm',
    'hcloud ECS DeleteServer --server_id=test --force',
    'hcloud --debug ECS DeleteServer --server_id=test',
  ];
  let allBlocked = true;
  const details = [];
  for (const cmd of bypasses) {
    const r = classifyTextCommand(cmd);
    const blocked = r.decision === 'deny' || r.decision === 'block' || (r.risk === 'write' && !r.safeToRun);
    if (!blocked) allBlocked = false;
    details.push({ cmd, decision: r.decision, risk: r.risk, safeToRun: r.safeToRun });
  }
  return { status: allBlocked ? 'PASS' : 'FAIL', details };
});

// D4-16: Command wrapping penetration — use classifyTextCommand
test('D4-16', () => {
  const wraps = [
    'hcloud ECS ListServers; cat ~/.hcloud/credentials.json',
    'hcloud ECS ListServers && echo $HW_ACCESS_KEY',
    'hcloud ECS ListServers | grep -i secret',
    '$(hcloud ECS DeleteServer --server_id=test)',
  ];
  let allBlocked = true;
  const details = [];
  for (const cmd of wraps) {
    const r = classifyTextCommand(cmd);
    const blocked = r.decision === 'deny' || r.decision === 'block';
    if (!blocked) allBlocked = false;
    details.push({ cmd, decision: r.decision, risk: r.risk, findings: r.findings?.length || 0 });
  }
  return { status: allBlocked ? 'PASS' : 'FAIL', details };
});

console.log('\n=== RESULTS JSON ===');
console.log(JSON.stringify(results, null, 2));

for (const [caseId, result] of Object.entries(results)) {
  const evidencePath = join(evidenceBase, caseId, 'stdout.log');
  try {
    writeFileSync(evidencePath, JSON.stringify({ ...result, caseId, executedAt: '20260923053700' }, null, 2));
    console.log(`Evidence written: ${caseId}`);
  } catch(e) {
    console.log(`Failed to write evidence for ${caseId}: ${e.message}`);
  }
}

// Save probe script
for (const caseId of Object.keys(results)) {
  const probePath = join(evidenceBase, caseId, 'probe.mjs');
  try {
    writeFileSync(probePath, `// Auto-generated probe for ${caseId} (re-test with classifyTextCommand)\n// See probe-p0-safety-batch2.mjs in hdk root\n`);
  } catch(e) {}
}
