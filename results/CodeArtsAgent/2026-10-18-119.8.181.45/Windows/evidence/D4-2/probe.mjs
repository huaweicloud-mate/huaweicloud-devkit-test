import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const results = [];

const testCases = [
  { name: 'env | grep HUAWEICLOUD', command: 'env | grep HUAWEICLOUD' },
  { name: 'printenv | grep HWC_', command: 'printenv | grep HWC_' },
  { name: 'Get-ChildItem Env: | where HCLOUD', command: 'Get-ChildItem Env: | where HCLOUD' },
  { name: 'printenv HW_ACCESS_KEY', command: 'printenv HW_ACCESS_KEY' },
  { name: 'echo $HW_SECRET_KEY', command: 'echo $HW_SECRET_KEY' },
  { name: 'echo ${HW_SECURITY_TOKEN}', command: 'echo ${HW_SECURITY_TOKEN}' },
  { name: 'printenv HUAWEICLOUD_ACCESS_KEY', command: 'printenv HUAWEICLOUD_ACCESS_KEY' },
  { name: 'gci Env: | findstr HWC_', command: 'gci Env: | findstr HWC_' },
  { name: 'dir Env: | findstr OS_', command: 'dir Env: | findstr OS_' },
];

let passCount = 0;
let failCount = 0;

for (const tc of testCases) {
  const result = classifyTextCommand(tc.command);
  const blocked = result.decision === 'deny' && result.risk === 'credential';
  results.push({
    case: tc.name,
    command: tc.command,
    decision: result.decision,
    risk: result.risk,
    blocked: blocked,
    status: blocked ? 'PASS' : 'FAIL'
  });
  if (blocked) passCount++;
  else failCount++;
}

const output = {
  suite: 'D4-2',
  description: '凭证env打印拦截 (printenv/echo 凭证应被阻断)',
  total: testCases.length,
  pass: passCount,
  fail: failCount,
  status: failCount === 0 ? 'PASS' : 'FAIL',
  tests: results
};

console.log(JSON.stringify(output, null, 2));
