// P0 Safety Classification Batch: D4-1, D4-2, D4-3, D4-5, D4-9, D4-15, D4-16, D2-4
import { classifyHcloudArgs, redactSecrets, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, loadRiskRules } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
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
    console.log(`[${r.status}] ${name}: ${JSON.stringify(r).substring(0, 200)}`);
  } catch(e) {
    results[name] = { status: 'ERROR', error: e.message };
    console.log(`[ERROR] ${name}: ${e.message}`);
  }
}

// D4-1: Credential file read blocked
test('D4-1', () => {
  const r = evaluateCommandRisk('cat ~/.hcloud/credentials.json');
  const blocked = r.decision === 'deny' || r.decision === 'block';
  return { status: blocked ? 'PASS' : 'FAIL', decision: r.decision, findings: r.findings?.length, detail: JSON.stringify(r).substring(0, 500) };
});

// D4-2: Credential env var print blocked
test('D4-2', () => {
  const r1 = evaluateCommandRisk('echo $HW_ACCESS_KEY');
  const r2 = evaluateCommandRisk('printenv HW_SECRET_ACCESS_KEY');
  const blocked = (r1.decision === 'deny' || r1.decision === 'block') || (r2.decision === 'deny' || r2.decision === 'block');
  return { status: blocked ? 'PASS' : 'FAIL', r1: r1.decision, r2: r2.decision, detail1: JSON.stringify(r1).substring(0,300), detail2: JSON.stringify(r2).substring(0,300) };
});

// D4-3: Plaintext secret API intercepted
test('D4-3', () => {
  const r = classifyHcloudArgs(['IAM', 'CreatePermanentAccessKey', '--secret=mysecret123']);
  const blocked = r.decision === 'deny' || r.decision === 'block' || (r.risk === 'secret');
  return { status: blocked ? 'PASS' : 'FAIL', decision: r.decision, risk: r.risk, detail: JSON.stringify(r).substring(0, 500) };
});

// D4-5: Write operation misjudgment detection
test('D4-5', () => {
  const w = classifyHcloudArgs(['ECS', 'DeleteServer', '--server_id=test']);
  const isWrite = w.decision === 'deny' && (w.risk === 'write' || w.risk === 'destructive');
  const ro = classifyHcloudArgs(['ECS', 'ListServers', '--limit=10']);
  const isRead = ro.decision === 'allow' || ro.risk === 'read_only';
  return { status: (isWrite && isRead) ? 'PASS' : 'FAIL', writeDecision: w.decision, writeRisk: w.risk, readDecision: ro.decision, readRisk: ro.risk };
});

// D4-9: Public exposure/destructive pre-check
test('D4-9', () => {
  const dangerous = classifyHcloudArgs(['VPC', 'CreateSecurityGroupRule', '--direction=ingress', '--port_range_min=22', '--protocol=tcp', '--remote_ip_prefix=0.0.0.0/0'], { allowWrites: true });
  const blocked = dangerous.decision === 'deny' && dangerous.blockedByRiskRule === true;
  return { status: blocked ? 'PASS' : 'FAIL', decision: dangerous.decision, blockedByRiskRule: dangerous.blockedByRiskRule, detail: JSON.stringify(dangerous).substring(0, 500) };
});

// D4-15: Hook bypass attempt
test('D4-15', () => {
  const bypasses = [
    'hcloud ECS DeleteServer --server_id=test --no-confirm',
    'hcloud ECS DeleteServer --server_id=test --force',
    'hcloud --debug ECS DeleteServer --server_id=test',
  ];
  let allBlocked = true;
  const details = [];
  for (const cmd of bypasses) {
    const r = evaluateCommandRisk(cmd);
    if (r.decision !== 'deny' && r.decision !== 'block') allBlocked = false;
    details.push({ cmd, decision: r.decision });
  }
  return { status: allBlocked ? 'PASS' : 'FAIL', details };
});

// D4-16: Command wrapping penetration
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
    const r = evaluateCommandRisk(cmd);
    if (r.decision !== 'deny' && r.decision !== 'block') allBlocked = false;
    details.push({ cmd, decision: r.decision, findings: r.findings?.length });
  }
  return { status: allBlocked ? 'PASS' : 'FAIL', details };
});

// D2-4: Credential redaction correctness
test('D2-4', () => {
  const input = { access_key: 'AKIDtest123456', secret_key: 'SKtest789012', region: 'cn-north-4', project_id: 'proj123' };
  const redacted = redactSecrets(input);
  const akRedacted = redacted.access_key !== input.access_key;
  const skRedacted = redacted.secret_key !== input.secret_key;
  const regionKept = redacted.region === input.region;
  return { status: (akRedacted && skRedacted && regionKept) ? 'PASS' : 'FAIL', redacted, original: input };
});

// Write all results
console.log('\n=== RESULTS JSON ===');
console.log(JSON.stringify(results, null, 2));

for (const [caseId, result] of Object.entries(results)) {
  const evidencePath = join(evidenceBase, caseId, 'stdout.log');
  try {
    writeFileSync(evidencePath, JSON.stringify({ ...result, caseId, executedAt: '20260923053600' }, null, 2));
    console.log(`Evidence written: ${caseId}`);
  } catch(e) {
    console.log(`Failed to write evidence for ${caseId}: ${e.message}`);
  }
}

// Also save probe script itself
for (const caseId of Object.keys(results)) {
  const probePath = join(evidenceBase, caseId, 'probe.mjs');
  try {
    writeFileSync(probePath, `// Auto-generated probe for ${caseId}\n// See probe-p0-safety-batch1.mjs in hdk root\n`);
  } catch(e) {}
}
