// P0 Safety Re-test 2: D4-2 (corrected var names), D4-16 (deeper analysis)
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

// D4-2: Credential env var print blocked — test with CORRECT HuaweiCloud env var names
// The documented credential env vars are: HW_ACCESS_KEY, HW_SECRET_KEY, HW_SECURITY_TOKEN
// Also HUAWEICLOUD_ACCESS_KEY, HUAWEICLOUD_SECRET_KEY, OS_ACCESS_KEY, OS_SECRET_KEY
test('D4-2', () => {
  const tests = [
    'echo $HW_ACCESS_KEY',
    'echo $HW_SECRET_KEY',
    'echo $HW_SECURITY_TOKEN',
    'printenv HW_ACCESS_KEY',
    'printenv HW_SECRET_KEY',
    'printenv HUAWEICLOUD_ACCESS_KEY',
    'printenv HUAWEICLOUD_SECRET_KEY',
    'printenv OS_ACCESS_KEY',
    'printenv OS_SECRET_KEY',
    'echo ${HW_ACCESS_KEY}',
    'echo ${HW_SECRET_KEY}',
  ];
  let allBlocked = true;
  const details = [];
  for (const cmd of tests) {
    const r = classifyTextCommand(cmd);
    const blocked = r.decision === 'deny' || r.decision === 'block';
    if (!blocked) allBlocked = false;
    details.push({ cmd, decision: r.decision });
  }
  return { status: allBlocked ? 'PASS' : 'FAIL', details };
});

// D4-16: Command wrapping penetration — deeper analysis
// The safety system processes one command at a time via classifyTextCommand.
// Shell chaining (;, &&, |, $()) creates compound commands that the classifier should detect.
test('D4-16', () => {
  const wraps = [
    // Credential file read via chaining
    'hcloud ECS ListServers; cat ~/.hcloud/credentials.json',
    // Env var dump via chaining
    'hcloud ECS ListServers && echo $HW_ACCESS_KEY',
    // Pipe to extract secrets
    'hcloud ECS ListServers | grep -i access_key',
    // Command substitution executing dangerous op
    '$(hcloud ECS DeleteServer --server_id=test)',
    // Backtick substitution
    '`hcloud ECS DeleteServer --server_id=test`',
    // Newline injection
    'hcloud ECS ListServers\ncat ~/.hcloud/credentials.json',
  ];
  let allBlocked = true;
  const details = [];
  for (const cmd of wraps) {
    const r = classifyTextCommand(cmd);
    const blocked = r.decision === 'deny' || r.decision === 'block';
    if (!blocked) allBlocked = false;
    details.push({ cmd: cmd.replace('\n', '\\n'), decision: r.decision, risk: r.risk });
  }
  return { status: allBlocked ? 'PASS' : 'FAIL', details };
});

console.log('\n=== RESULTS JSON ===');
console.log(JSON.stringify(results, null, 2));

for (const [caseId, result] of Object.entries(results)) {
  const evidencePath = join(evidenceBase, caseId, 'stdout.log');
  try {
    writeFileSync(evidencePath, JSON.stringify({ ...result, caseId, executedAt: '20260923053800' }, null, 2));
    console.log(`Evidence written: ${caseId}`);
  } catch(e) {
    console.log(`Failed to write evidence for ${caseId}: ${e.message}`);
  }
}
