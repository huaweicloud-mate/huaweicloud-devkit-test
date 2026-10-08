// D4-26: allowCredentialRead:true bypass test
// Tests that when allowCredentialRead:true is passed in options,
// hcloud configure show/list/get are allowed (not denied).
import { classifyHcloudArgs, classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const configureCommands = [
  ['configure', 'show'],
  ['configure', 'list'],
  ['configure', 'get'],
  ['configure', 'export'],
  ['configure', 'init'],
];

const results = [];
let allAllowed = true;
for (const cmd of configureCommands) {
  const r = classifyHcloudArgs(cmd, { allowCredentialRead: true });
  results.push({ cmd: cmd.join(' '), decision: r.decision, risk: r.risk });
  if (r.decision !== 'allow') allAllowed = false;
}

// Also test via text command with allowCredentialRead
const textResults = [];
const textCmds = ['hcloud configure show', 'hcloud configure list', 'hcloud configure get'];
for (const cmd of textCmds) {
  const r = classifyTextCommand(cmd, { allowCredentialRead: true });
  textResults.push({ cmd, decision: r.decision, risk: r.risk });
  if (r.decision !== 'allow') allAllowed = false;
}

// Verify that WITHOUT allowCredentialRead, these are still denied
let stillDeniedWithoutFlag = true;
for (const cmd of configureCommands) {
  const r = classifyHcloudArgs(cmd);
  if (r.decision !== 'deny') stillDeniedWithoutFlag = false;
}

const status = (allAllowed && stillDeniedWithoutFlag) ? 'PASS' : 'FAIL';
const why = (allAllowed && stillDeniedWithoutFlag)
  ? `All configure read subcommands were ALLOWED with allowCredentialRead:true (${configureCommands.length} args-based + ${textCmds.length} text-based), and correctly DENIED without the flag.`
  : !allAllowed
    ? `Some configure commands were NOT allowed with allowCredentialRead:true: ${JSON.stringify(results.filter(r => r.decision !== 'allow'))}`
    : `Configure commands were not denied without allowCredentialRead flag (regression check failed).`;

const output = {
  status,
  caseId: 'D4-26',
  why,
  executedAt: '20261001103000',
  details: { withFlag: results, withFlagText: textResults, withoutFlagDenied: stillDeniedWithoutFlag },
};

console.log(JSON.stringify(output, null, 2));