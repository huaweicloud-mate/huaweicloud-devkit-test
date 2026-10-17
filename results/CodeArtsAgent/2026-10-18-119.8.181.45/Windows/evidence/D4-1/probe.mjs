import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const results = [];

const testCases = [
  { name: 'cat ~/.hcloud/config', command: 'cat ~/.hcloud/config' },
  { name: 'cat ~/.huaweicloud/credentials', command: 'cat ~/.huaweicloud/credentials' },
  { name: 'type .hcloud/config.json', command: 'type .hcloud/config.json' },
  { name: 'Get-Content ~/.hcloud/config.json', command: 'Get-Content ~/.hcloud/config.json' },
  { name: 'gc ~/.huaweicloud/config', command: 'gc ~/.huaweicloud/config' },
  { name: 'less ~/.hcloud/credentials', command: 'less ~/.hcloud/credentials' },
  { name: 'more ~/.hcloud/config', command: 'more ~/.hcloud/config' },
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
  suite: 'D4-1',
  description: '凭证文件读取拦截 (cat/type 凭证文件应被阻断)',
  total: testCases.length,
  pass: passCount,
  fail: failCount,
  status: failCount === 0 ? 'PASS' : 'FAIL',
  tests: results
};

console.log(JSON.stringify(output, null, 2));
