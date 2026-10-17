import { classifyHcloudArgs, classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const results = [];

const testCases = [
  { name: 'ECS DeleteServers', args: ['ECS', 'DeleteServers', '--server.id=123'], type: 'args' },
  { name: 'ECS NovaDeleteServers', args: ['ECS', 'NovaDeleteServers', '--server.id=123'], type: 'args' },
  { name: 'EIP DeletePublicip', args: ['EIP', 'DeletePublicip', '--publicip.id=123'], type: 'args' },
  { name: 'VPC DeleteVpc', args: ['VPC', 'DeleteVpc', '--vpc.id=123'], type: 'args' },
  { name: 'CCE DeleteCluster', args: ['CCE', 'DeleteCluster', '--cluster.id=123'], type: 'args' },
  { name: 'OBS delete', args: ['obs', 'delete', 'obs://bucket/obj'], type: 'args' },
  { name: 'ECS DeleteServers text', command: 'hcloud ECS DeleteServers --server.id=123', type: 'text' },
  { name: 'EIP DeletePublicip text', command: 'hcloud EIP DeletePublicip --publicip.id=123', type: 'text' },
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
  const isWriteBlocked = result.decision === 'deny' && result.risk === 'write';
  const notReadOnly = result.risk !== 'read_only';
  const passed = isWriteBlocked && notReadOnly;
  
  results.push({
    case: tc.name,
    type: tc.type,
    command: tc.command || tc.args.join(' '),
    decision: result.decision,
    risk: result.risk,
    passed: passed,
    status: passed ? 'PASS' : 'FAIL'
  });
  if (passed) passCount++;
  else failCount++;
}

const output = {
  suite: 'D4-5',
  description: '写操作误判检测 (DeleteServer等写命令不应被误判为只读)',
  total: testCases.length,
  pass: passCount,
  fail: failCount,
  status: failCount === 0 ? 'PASS' : 'FAIL',
  tests: results
};

console.log(JSON.stringify(output, null, 2));
