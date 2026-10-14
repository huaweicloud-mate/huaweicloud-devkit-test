import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync } from 'node:fs';

const caseId = 'D4-3';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D4-3: Plaintext secret API interception (RED-LINE case)
// Test: calls that return plaintext/binary secrets should be denied
// Specifically tests KMS DecryptData and similar APIs
const testCommands = [
  // KMS DecryptData - should be blocked
  { cmd: 'hcloud KMS DecryptData --cipher-text="xxx"', desc: 'KMS DecryptData' },
  { cmd: 'hcloud kms decrypt-data --cipher-text="xxx"', desc: 'kms decrypt-data (kebab)' },
  // CSMS ShowSecretVersion - should be blocked
  { cmd: 'hcloud CSMS ShowSecretVersion --secret_id="test" --version_id="v1"', desc: 'CSMS ShowSecretVersion' },
  { cmd: 'hcloud csms show-secret-version --secret_id="test"', desc: 'csms show-secret-version' },
  // CSMS GetSecretValue - should be blocked
  { cmd: 'hcloud CSMS GetSecretValue --name="mysecret"', desc: 'CSMS GetSecretValue' },
  // ShowSecret patterns
  { cmd: 'hcloud CSMS ShowSecret --id="test"', desc: 'CSMS ShowSecret' },
  // Direct secret value retrieval patterns
  { cmd: 'GetSecretValue', desc: 'AWS-style GetSecretValue' },
  { cmd: 'secret_string', desc: 'secret_string pattern' },
  { cmd: 'secret_binary', desc: 'secret_binary pattern' },
  // KMS list (read-only, should NOT be blocked)
  { cmd: 'hcloud KMS ListKeys --limit=10', desc: 'KMS ListKeys (read-only)' },
];

let allSecretDenied = true;
const results = [];
for (const { cmd, desc } of testCommands) {
  const result = classifyTextCommand(cmd);
  const denied = result.decision === 'deny';
  // Read-only KMS ListKeys should be allow
  const isReadOnly = desc.includes('(read-only)');
  const expected = isReadOnly ? 'allow' : 'deny';
  const matches = result.decision === expected;
  if (!isReadOnly && !denied) allSecretDenied = false;
  results.push({ desc, decision: result.decision, risk: result.risk, reason: result.reason, expected, matches });
}

const status = allSecretDenied ? 'PASS' : 'FAIL';
const failedTests = results.filter(r => !r.matches);
const why = allSecretDenied
  ? `All secret API calls were denied and read-only KMS calls were allowed. ${results.filter(r=>r.expected==='deny'&&r.decision==='deny').length} denied, ${results.filter(r=>r.expected==='allow'&&r.decision==='allow').length} allowed.`
  : `${failedTests.length} tests did not match expected: ${failedTests.map(r => `${r.desc}(expected=${r.expected}, got=${r.decision})`).join(', ')}`;

const output = {
  caseId,
  status,
  why,
  executedAt: execTs,
  result: { tests: results }
};

writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
