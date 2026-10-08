// D4-7: 秘密操作拦截 - verify classifyHcloudArgs denies secret operations
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const secretOps = [
  ['DEW', 'ShowSecret'],
  ['DEW', 'ShowSecretVersion'],
  ['DEW', 'DownloadSecret'],
  ['DEW', 'GetSecretValue'],
  ['CSMS', 'ShowSecret'],
  ['CSMS', 'ShowSecretVersion'],
  // Also test secret pattern detection in joined args
  ['DEW', 'CreateSecret', '--secret_string', 'my-secret-value'],
  ['DEW', 'UpdateSecret', '--secret_binary', 'base64data'],
];

const results = [];
let allPass = true;

for (const op of secretOps) {
  const args = op;
  const r = classifyHcloudArgs(args);
  const isDenied = r.decision === 'deny';
  const isSecret = r.risk === 'secret';
  const pass = isDenied && isSecret;
  if (!pass) allPass = false;
  results.push({
    command: `hcloud ${op.join(' ')}`,
    decision: r.decision,
    risk: r.risk,
    reason: r.reason,
    pass,
  });
}

const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D4-7',
  why: allPass
    ? `All ${secretOps.length} secret operations correctly denied by classifyHcloudArgs.`
    : `Some secret operations not correctly denied. See details.`,
  executedAt: '20261001103000',
  details: results,
};

console.log(JSON.stringify(output, null, 2));