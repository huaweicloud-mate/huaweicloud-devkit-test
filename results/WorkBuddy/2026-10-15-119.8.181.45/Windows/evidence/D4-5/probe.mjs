import { classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync } from 'node:fs';

const caseId = 'D4-5';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D4-5: Write operation misjudgment detection
// Test: delete/write commands should NOT be classified as read-only/allow
const testCommands = [
  // Delete operations - should be deny (write)
  { cmd: 'hcloud ECS DeleteServer --server_ids="xxx"', desc: 'ECS DeleteServer', expected: 'deny' },
  { cmd: 'hcloud ECS DeleteServers --server_ids="xxx"', desc: 'ECS DeleteServers', expected: 'deny' },
  { cmd: 'hcloud VPC DeleteVpc --vpc_id="xxx"', desc: 'VPC DeleteVpc', expected: 'deny' },
  { cmd: 'hcloud EIP DeletePublicip --publicip_id="xxx"', desc: 'EIP DeletePublicip', expected: 'deny' },
  { cmd: 'hcloud RDS DeleteInstance --instance_id="xxx"', desc: 'RDS DeleteInstance', expected: 'deny' },
  { cmd: 'hcloud IAM DeleteUser --user_id="xxx"', desc: 'IAM DeleteUser', expected: 'deny' },
  // Update/create operations - should be deny (write)
  { cmd: 'hcloud ECS CreateServer --name="test"', desc: 'ECS CreateServer', expected: 'deny' },
  { cmd: 'hcloud IAM CreateUser --name="test"', desc: 'IAM CreateUser', expected: 'deny' },
  { cmd: 'hcloud VPC CreateVpc --name="test"', desc: 'VPC CreateVpc', expected: 'deny' },
  // Read operations - should be allow (read-only)
  { cmd: 'hcloud ECS ListServers --limit=10', desc: 'ECS ListServers (read)', expected: 'allow' },
  { cmd: 'hcloud IAM ListUsers --limit=10', desc: 'IAM ListUsers (read)', expected: 'allow' },
  { cmd: 'hcloud VPC ListVpcs --limit=10', desc: 'VPC ListVpcs (read)', expected: 'allow' },
];

let allCorrect = true;
const results = [];
for (const { cmd, desc, expected } of testCommands) {
  const result = classifyTextCommand(cmd);
  const matches = result.decision === expected;
  if (!matches) allCorrect = false;
  results.push({ desc, decision: result.decision, risk: result.risk, expected, matches });
}

const status = allCorrect ? 'PASS' : 'FAIL';
const failedTests = results.filter(r => !r.matches);
const why = allCorrect
  ? `All ${testCommands.length} write/read operations correctly classified: ${results.filter(r=>r.expected==='deny'&&r.decision==='deny').length} write ops denied, ${results.filter(r=>r.expected==='allow'&&r.decision==='allow').length} read ops allowed.`
  : `${failedTests.length} misclassified: ${failedTests.map(r => `${r.desc}(expected=${r.expected}, got=${r.decision}, risk=${r.risk})`).join('; ')}`;

const output = {
  caseId,
  status,
  why,
  executedAt: execTs,
  result: { tests: results }
};

writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
