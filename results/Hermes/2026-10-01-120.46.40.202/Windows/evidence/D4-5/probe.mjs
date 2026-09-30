// D4-5: 写操作误判检测
import { classifyHcloudArgs } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { planHcloudCommand } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
const results = {};
try {
  // Write/delete operations that must NOT be classified as read-only
  const writeOps = [
    ['ECS', 'DeleteServers', '--server_ids=i-xxx'],
    ['ECS', 'CreateServers', '--name=test'],
    ['VPC', 'DeleteVpc', '--vpc_id=xxx'],
    ['RDS', 'DeleteInstance', '--instance_id=xxx'],
    ['IAM', 'CreateUser', '--name=testuser'],
    ['ECS', 'StopServer', '--server_id=xxx'],
    ['ECS', 'RebootServer', '--server_id=xxx'],
  ];
  
  const testResults = [];
  for (const [svc, op, args] of writeOps) {
    const argsArr = args.split(' ');
    const result = classifyHcloudArgs([svc, op, ...argsArr]);
    testResults.push({ service: svc, operation: op, decision: result.decision, risk: result.risk, action: result.action });
    console.log(`  ${svc} ${op} -> decision:${result.decision} action:${result.action || 'N/A'}`);
  }
  
  // None should be read_only/allow - they should be write or plan
  const noneReadOnly = testResults.every(r => r.decision !== 'read_only' && r.decision !== 'allow');
  
  results['D4-5'] = {
    status: noneReadOnly ? 'PASS' : 'FAIL',
    why: noneReadOnly ? '' : 'Some write operations misclassified as read-only',
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { testResults, noneReadOnly }
  };
  console.log('STATUS:', results['D4-5'].status);
  console.log(JSON.stringify(results['D4-5'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D4-5'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}
