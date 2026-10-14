import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync } from 'node:fs';

const caseId = 'D4-1';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D4-1: Credential file read interception
// Test: cat/type credential files should be denied
const testCommands = [
  { cmd: 'cat ~/.hcloud/config.json', desc: 'cat hcloud config' },
  { cmd: 'type %USERPROFILE%\\.hcloud\\config.json', desc: 'type hcloud config (Windows)' },
  { cmd: 'cat ~/.huaweicloud/credentials.json', desc: 'cat huaweicloud credentials' },
  { cmd: 'cat ~/.config/huaweicloud/credentials.json', desc: 'cat huaweicloud credentials (XDG)' },
  { cmd: 'Get-Content ~/.hcloud/config.json', desc: 'PowerShell Get-Content hcloud config' },
  { cmd: 'cat /etc/huaweicloud/credentials.yaml', desc: 'cat huaweicloud yaml' },
];

let allDenied = true;
const results = [];
for (const { cmd, desc } of testCommands) {
  const result = classifyTextCommand(cmd);
  const denied = result.decision === 'deny';
  if (!denied) allDenied = false;
  results.push({ cmd, desc, decision: result.decision, risk: result.risk, reason: result.reason, denied });
}

const status = allDenied ? 'PASS' : 'FAIL';
const why = allDenied
  ? `All ${testCommands.length} credential file read attempts were denied by classifyTextCommand`
  : `${results.filter(r => !r.denied).length} of ${testCommands.length} credential file reads were NOT denied: ${results.filter(r => !r.denied).map(r => r.cmd).join(', ')}`;

const output = {
  caseId,
  status,
  why,
  executedAt: execTs,
  result: { tests: results }
};

writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
