import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const results = [];

// Test cases for D4-16: 命令包裹穿透
// sh -c/bash -c/eval 包裹写命令应被拦截
const testCases = [
  // shell 包裹
  { name: 'bash -c 包裹创建', args: ['bash', '-c', 'hcloud ECS CreateServers --flavor=x'], expected: 'deny' },
  { name: 'sh -c 包裹删除', args: ['sh', '-c', 'hcloud CCE DeleteCluster --cluster_id=x'], expected: 'deny' },
  { name: 'bash -c sudo 组合', args: ['bash', '-c', 'sudo hcloud OBS rm obs://bucket/obj'], expected: 'deny' },
  { name: 'sudo hcloud', args: ['sudo', 'hcloud', 'ECS', 'CreateServers'], expected: 'deny' },
  { name: '/bin/bash -c', args: ['/bin/bash', '-c', 'hcloud ECS DeleteServers --servers=[]'], expected: 'deny' },
  { name: 'zsh -c 包裹', args: ['zsh', '-c', 'hcloud ECS CreateServers'], expected: 'deny' },
  
  // 嵌套包裹
  { name: '嵌套 bash -c', args: ['bash', '-c', 'bash -c "hcloud ECS DeleteServers"'], expected: 'deny' },
  { name: '多层 sudo', args: ['sudo', 'sudo', 'hcloud', 'ECS', 'CreateServers'], expected: 'deny' },
  
  // 命令分隔符中的写命令
  { name: '分号分隔写命令', args: ['bash', '-c', 'echo x; hcloud ECS CreateServers'], expected: 'deny' },
  { name: '&& 分隔写命令', args: ['bash', '-c', 'echo done && hcloud CCE DeleteCluster'], expected: 'deny' },
  { name: '|| 分隔写命令', args: ['bash', '-c', 'echo done || hcloud ECS CreateServers'], expected: 'deny' },
  
  // 读命令应该被允许
  { name: 'bash -c 读命令', args: ['bash', '-c', 'hcloud ECS ListServers'], expected: 'allow' },
  { name: 'sh -c 读命令', args: ['sh', '-c', 'hcloud VPC ListVpcs'], expected: 'allow' },
];

let passCount = 0;
let failCount = 0;

for (const tc of testCases) {
  const result = classifyHcloudArgs(tc.args);
  const passed = result.decision === tc.expected;
  
  results.push({
    case: tc.name,
    args: tc.args.join(' '),
    expected: tc.expected,
    actual: result.decision,
    risk: result.risk,
    passed: passed,
    status: passed ? 'PASS' : 'FAIL'
  });
  if (passed) passCount++;
  else failCount++;
}

const output = {
  suite: 'D4-16',
  description: '命令包裹穿透 (sh -c/bash -c/eval 包裹写命令应被拦截)',
  total: testCases.length,
  pass: passCount,
  fail: failCount,
  status: failCount === 0 ? 'PASS' : 'FAIL',
  tests: results
};

console.log(JSON.stringify(output, null, 2));
