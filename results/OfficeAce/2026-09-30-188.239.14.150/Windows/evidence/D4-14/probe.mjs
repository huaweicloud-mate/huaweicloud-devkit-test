// D4-14: Command concatenation variants interception test
// Tests that hcloud write commands embedded in shell concatenation (&&, ||, ;, |)
// are properly intercepted by classifyTextCommand.
import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const variants = [
  // && concatenation
  'echo hello && hcloud ECS DeleteServers --server_ids i-123',
  // || concatenation
  'false || hcloud ECS DeleteServers --server_ids i-456',
  // ; concatenation
  'echo prep ; hcloud ECS DeleteServers --server_ids i-789',
  // | pipe
  'echo data | hcloud ECS DeleteServers --server_ids i-abc',
  // Multiple segments with write in middle
  'hcloud ECS ListServers ; hcloud ECS DeleteServers --server_ids i-def ; echo done',
  // Nested shell wrapper with concatenation
  'bash -c "echo ok && hcloud ECS DeleteServers --server_ids i-ghi"',
  // Windows cmd wrapper
  'cmd /c "hcloud ECS DeleteServers --server_ids i-jkl"',
  // PowerShell wrapper
  'powershell -Command "hcloud ECS DeleteServers --server_ids i-mno"',
  // eval wrapper
  'eval "hcloud ECS DeleteServers --server_ids i-pqr"',
  // Command substitution
  '$(hcloud ECS DeleteServers --server_ids i-stu)',
  // Backtick substitution
  '`hcloud ECS DeleteServers --server_ids i-vwx`',
];

const results = [];
let allDenied = true;
for (const cmd of variants) {
  const r = classifyTextCommand(cmd);
  results.push({ cmd: cmd.substring(0, 80), decision: r.decision, risk: r.risk });
  if (r.decision !== 'deny') allDenied = false;
}

const status = allDenied ? 'PASS' : 'FAIL';
const why = allDenied
  ? `All ${variants.length} command concatenation variants with embedded write operations were correctly intercepted (decision=deny).`
  : `${results.filter(r => r.decision !== 'deny').length} variant(s) were NOT denied: ${JSON.stringify(results.filter(r => r.decision !== 'deny'))}`;

const output = {
  status,
  caseId: 'D4-14',
  why,
  executedAt: '20260930103000',
  details: results,
};

console.log(JSON.stringify(output, null, 2));