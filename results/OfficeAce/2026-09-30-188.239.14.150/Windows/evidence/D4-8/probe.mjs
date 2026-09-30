// D4-8: 凭证读取拦截 - verify classifyTextCommand denies credential file reads & env dumps
import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const credentialCommands = [
  'cat ~/.hcloud/config.json',
  'cat ~/.huaweicloud/credentials.json',
  'type C:\\Users\\Administrator\\.hcloud\\config.json',
  'cat /home/user/.huaweicloud/credentials',
  'env | grep HUAWEICLOUD',
  'printenv HW_ACCESS_KEY',
  'printenv HUAWEICLOUD_SECRET_ACCESS_KEY',
  'echo $HW_SECRET_KEY',
  'echo $HUAWEICLOUD_SECRET_ACCESS_KEY',
  'bash -c "cat ~/.hcloud/config.json"',
  'hcloud configure show',
  'hcloud configure get',
  'hcloud configure list',
  'hcloud configure export',
];

const results = [];
let allPass = true;

for (const cmd of credentialCommands) {
  const r = classifyTextCommand(cmd);
  const isDenied = r.decision === 'deny';
  const isCredential = r.risk === 'credential';
  const pass = isDenied && isCredential;
  if (!pass) allPass = false;
  results.push({
    command: cmd,
    decision: r.decision,
    risk: r.risk,
    reason: r.reason,
    pass,
  });
}

const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D4-8',
  why: allPass
    ? `All ${credentialCommands.length} credential read commands correctly denied by classifyTextCommand.`
    : `Some credential read commands not correctly denied. See details.`,
  executedAt: '20260930103000',
  details: results,
};

console.log(JSON.stringify(output, null, 2));