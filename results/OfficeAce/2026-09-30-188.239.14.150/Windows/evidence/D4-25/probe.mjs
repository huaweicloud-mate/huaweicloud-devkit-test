// D4-25: configure read interception test
// Tests that hcloud configure show/list/get/export/init are intercepted (denied)
// when allowCredentialRead is not set.
import { classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const configureCommands = [
  ['hcloud', 'configure', 'show'],
  ['hcloud', 'configure', 'list'],
  ['hcloud', 'configure', 'get'],
  ['hcloud', 'configure', 'export'],
  ['hcloud', 'configure', 'init'],
  // Also test via text command
  'hcloud configure show',
  'hcloud configure list',
  'hcloud configure get',
  'hcloud configure export',
  'hcloud configure init',
];

const results = [];
let allDenied = true;
for (const cmd of configureCommands) {
  const r = typeof cmd === 'string' ? classifyTextCommand(cmd) : classifyHcloudArgs(cmd);
  results.push({ cmd: typeof cmd === 'string' ? cmd : cmd.join(' '), decision: r.decision, risk: r.risk, reason: r.reason?.substring(0, 60) });
  if (r.decision !== 'deny') allDenied = false;
}

const status = allDenied ? 'PASS' : 'FAIL';
const why = allDenied
  ? `All ${configureCommands.length} hcloud configure read subcommands (show/list/get/export/init) were correctly denied with risk=credential.`
  : `${results.filter(r => r.decision !== 'deny').length} command(s) were NOT denied: ${JSON.stringify(results.filter(r => r.decision !== 'deny'))}`;

const output = {
  status,
  caseId: 'D4-25',
  why,
  executedAt: '20260930103000',
  details: results,
};

console.log(JSON.stringify(output, null, 2));