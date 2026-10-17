import { classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const results = [];

// Test cases for D4-15: hook绕过尝试
// 大小写/编码/拼接变体无绕过成功
const testCases = [
  // 大小写变体
  { name: '大写 CAT', command: 'CAT ~/.hcloud/config', type: 'text' },
  { name: '混合大小写 Cat', command: 'Cat ~/.hcloud/config', type: 'text' },
  { name: '大写 PRINTENV', command: 'PRINTENV HW_ACCESS_KEY', type: 'text' },
  { name: '混合大小写 PrintEnv', command: 'PrintEnv HW_ACCESS_KEY', type: 'text' },
  
  // 编码变体
  { name: 'base64 编码管道', command: 'echo ZWNobyBoaQ== | base64 -d | bash', type: 'text' },
  { name: 'xxd 反转', command: 'echo 68656c6c6f | xxd -r -p | sh', type: 'text' },
  { name: 'certutil 解码', command: 'certutil -decode encoded.txt decoded.bat & decoded.bat', type: 'text' },
  
  // 拼接变体
  { name: '变量拼接 hcloud', command: 'cmd="hcloud ECS CreateServers"; eval $cmd', type: 'text' },
  { name: '字符串拼接', command: 'echo "hcloud EC""S CreateServers" | sh', type: 'text' },
  { name: '命令替换', command: 'hcloud $(echo EC)S CreateServers', type: 'text' },
  
  // 绕过尝试
  { name: '反斜杠绕过', command: 'hcloud\nECS\nCreateServers', type: 'text' },
  { name: '分号分隔', command: 'echo x; hcloud ECS CreateServers', type: 'text' },
  { name: '&& 分隔', command: 'echo done && hcloud ECS CreateServers', type: 'text' },
  { name: '|| 分隔', command: 'echo done || hcloud ECS CreateServers', type: 'text' },
  { name: '管道符', command: 'echo "hcloud ECS CreateServers" | sh', type: 'text' },
];

let passCount = 0;
let failCount = 0;

for (const tc of testCases) {
  let result;
  if (tc.type === 'text') {
    result = classifyTextCommand(tc.command);
  } else {
    result = classifyHcloudArgs(tc.args);
  }
  
  // 这些变体都应该被阻断
  const blocked = result.decision === 'deny';
  const passed = blocked;
  
  results.push({
    case: tc.name,
    command: tc.command,
    decision: result.decision,
    risk: result.risk,
    blocked: blocked,
    status: passed ? 'PASS' : 'FAIL'
  });
  if (passed) passCount++;
  else failCount++;
}

const output = {
  suite: 'D4-15',
  description: 'hook绕过尝试 (大小写/编码/拼接变体无绕过成功)',
  total: testCases.length,
  pass: passCount,
  fail: failCount,
  status: failCount === 0 ? 'PASS' : 'FAIL',
  tests: results
};

console.log(JSON.stringify(output, null, 2));
