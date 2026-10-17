// D4-18: confirm-not-deny审批语义
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const results = [];
const writeResult = classifyHcloudArgs(['ECS', 'CreateServers', '--server.flavorRef=s1.small']);
results.push({
  test: 'CreateServers write operation',
  decision: writeResult.decision,
  risk: writeResult.risk,
  expected: 'deny',
  passed: writeResult.decision === 'deny' && writeResult.risk === 'write'
});

const readResult = classifyHcloudArgs(['ECS', 'ListServers']);
results.push({
  test: 'ListServers read operation',
  decision: readResult.decision,
  risk: readResult.risk,
  expected: 'allow',
  passed: readResult.decision === 'allow'
});

const deleteResult = classifyHcloudArgs(['ECS', 'DeleteServer', '--server_id=123']);
results.push({
  test: 'DeleteServer operation',
  decision: deleteResult.decision,
  risk: deleteResult.risk,
  expected: 'deny',
  passed: deleteResult.decision === 'deny' && deleteResult.risk === 'write'
});

const allPassed = results.every(r => r.passed);
console.log(JSON.stringify({
  status: allPassed ? 'PASS' : 'FAIL',
  caseId: 'D4-18',
  title: 'confirm-not-deny审批语义',
  timestamp: new Date().toISOString(),
  results: results
}, null, 2));
