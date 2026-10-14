import { classifyTextCommand, extractInnerCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync } from 'node:fs';

const caseId = 'D4-16';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D4-16: Command wrapping penetration (RED-LINE case)
// Test: shell-wrapped commands should be inspected and inner command caught
const testCommands = [
  // bash -c wrapper
  { cmd: 'bash -c "hcloud ECS DeleteServer --server_ids=xxx"', desc: 'bash -c hcloud Delete', expected: 'deny' },
  { cmd: 'sh -c "hcloud IAM DeleteUser --user_id=xxx"', desc: 'sh -c hcloud DeleteUser', expected: 'deny' },
  // eval wrapper
  { cmd: 'eval "hcloud ECS DeleteServer --server_ids=xxx"', desc: 'eval hcloud Delete', expected: 'deny' },
  // $(...) command substitution
  { cmd: '$(hcloud ECS DeleteServer --server_ids=xxx)', desc: '$() hcloud Delete', expected: 'deny' },
  // backtick
  { cmd: '`hcloud ECS DeleteServer --server_ids=xxx`', desc: 'backtick hcloud Delete', expected: 'deny' },
  // Windows cmd /c
  { cmd: 'cmd /c "hcloud ECS DeleteServer --server_ids=xxx"', desc: 'cmd /c hcloud Delete', expected: 'deny' },
  // PowerShell -Command
  { cmd: 'powershell -Command "hcloud ECS DeleteServer --server_ids=xxx"', desc: 'powershell -Command hcloud Delete', expected: 'deny' },
  // Nested wrapper
  { cmd: 'bash -c "sh -c \'hcloud ECS DeleteServer --server_ids=xxx\'"', desc: 'nested bash->sh hcloud Delete', expected: 'deny' },
  // Wrapper with credential access
  { cmd: 'bash -c "cat ~/.hcloud/config.json"', desc: 'bash -c cat credentials', expected: 'deny' },
  // env·bash penetration (red-line)
  { cmd: 'bash -c "printenv HW_ACCESS_KEY"', desc: 'bash -c printenv HW_ACCESS_KEY', expected: 'deny' },
  // Non-hcloud wrapped (should be allow)
  { cmd: 'bash -c "ls -la"', desc: 'bash -c ls (non-hcloud)', expected: 'allow' },
];

let allCorrect = true;
const results = [];
for (const { cmd, desc, expected } of testCommands) {
  const result = classifyTextCommand(cmd);
  const matches = result.decision === expected;
  if (!matches) allCorrect = false;
  // Also test extractInnerCommand to verify extraction
  const innerCmds = extractInnerCommand(cmd);
  results.push({ 
    desc, 
    decision: result.decision, 
    risk: result.risk, 
    expected, 
    matches,
    innerCommands: innerCmds.length > 0 ? `[${innerCmds.length} extracted]` : '[none]'
  });
}

const status = allCorrect ? 'PASS' : 'FAIL';
const failedTests = results.filter(r => !r.matches);
const why = allCorrect
  ? `All ${testCommands.length} command wrapping tests correctly classified. extractInnerCommand works on shell wrappers.`
  : `${failedTests.length} wrapping tests failed: ${failedTests.map(r => `${r.desc}(expected=${r.expected}, got=${r.decision})`).join('; ')}`;

const output = {
  caseId,
  status,
  why,
  executedAt: execTs,
  result: { tests: results }
};

writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
