import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync } from 'node:fs';

const caseId = 'D4-9';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D4-9: Public exposure / destructive pre-execution checks
// Test: operations that expose public access or are destructive should be denied
const testCommands = [
  // Public exposure operations
  { cmd: 'hcloud ECS CreateServer --security_groups="default" --public_ip="true"', desc: 'ECS CreateServer with public IP', expected: 'deny' },
  { cmd: 'hcloud EIP CreatePublicip --type="5_bgp"', desc: 'EIP CreatePublicip (public exposure)', expected: 'deny' },
  { cmd: 'hcloud ELB CreateLoadBalancer --vip_address="0.0.0.0"', desc: 'ELB with 0.0.0.0', expected: 'deny' },
  // Destructive operations
  { cmd: 'hcloud ECS DeleteServer --server_ids="all"', desc: 'ECS DeleteServer', expected: 'deny' },
  { cmd: 'hcloud RDS DeleteInstance --instance_id="prod-db"', desc: 'RDS DeleteInstance (destructive)', expected: 'deny' },
  { cmd: 'hcloud VPC DeleteSubnet --subnet_id="xxx"', desc: 'VPC DeleteSubnet', expected: 'deny' },
  { cmd: 'hcloud IAM DeleteUser --user_id="admin"', desc: 'IAM DeleteUser', expected: 'deny' },
  // Mass deletion
  { cmd: 'hcloud ECS BatchDeleteServers --server_ids="id1,id2,id3"', desc: 'ECS BatchDeleteServers', expected: 'deny' },
  // Read operations should be allowed
  { cmd: 'hcloud ECS ListServers --limit=10', desc: 'ECS ListServers (read)', expected: 'allow' },
];

let allCorrect = true;
const results = [];
for (const { cmd, desc, expected } of testCommands) {
  const result = classifyTextCommand(cmd);
  const matches = result.decision === expected;
  if (!matches) allCorrect = false;
  results.push({ desc, decision: result.decision, risk: result.risk, reason: result.reason?.slice(0,100), expected, matches });
}

const status = allCorrect ? 'PASS' : 'FAIL';
const failedTests = results.filter(r => !r.matches);
const why = allCorrect
  ? `All ${testCommands.length} public exposure and destructive operations correctly classified.`
  : `${failedTests.length} misclassified: ${failedTests.map(r => `${r.desc}(expected=${r.expected}, got=${r.decision})`).join('; ')}`;

const output = {
  caseId,
  status,
  why,
  executedAt: execTs,
  result: { tests: results }
};

writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
