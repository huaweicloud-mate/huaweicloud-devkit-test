// D4-19: 确认流下预检仍生效
import { classifyHcloudArgs } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
const results = {};
try {
  // High-risk write operations - even in approval flow, preflight checks should still fire
  const highRiskWriteOps = [
    ['ECS', 'DeleteServers', '--server_ids=i-xxx', '--force'],
    ['IAM', 'CreateUser', '--name=admin'],
    ['VPC', 'DeleteVpc', '--vpc_id=xxx'],
  ];
  
  const testResults = [];
  for (const [svc, op, ...args] of highRiskWriteOps) {
    const classifyResult = classifyHcloudArgs([svc, op, ...args]);
    const riskResult = evaluateCommandRisk(`hcloud ${svc} ${op} ${args.join(' ')}`);
    const planResult = planHcloudCommand([svc, op, ...args], {});
    testResults.push({
      service: svc, operation: op,
      classifyDecision: classifyResult.decision,
      riskDecision: riskResult.decision,
      planDecision: planResult.decision || planResult.action || 'N/A',
      riskPreCheckFired: riskResult.decision === 'deny' || riskResult.decision === 'warn'
    });
    console.log(`  ${svc} ${op} -> classify:${classifyResult.decision} risk:${riskResult.decision} plan:${planResult.decision || planResult.action}`);
  }
  
  // Preflight risk checks should fire even in approval flow
  const preCheckStillWorks = testResults.every(r => r.riskPreCheckFired || r.classifyDecision === 'deny');
  
  results['D4-19'] = {
    status: preCheckStillWorks ? 'PASS' : 'FAIL',
    why: preCheckStillWorks ? '' : 'Preflight checks not firing in approval flow',
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { testResults, preCheckStillWorks }
  };
  console.log('STATUS:', results['D4-19'].status);
  console.log(JSON.stringify(results['D4-19'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D4-19'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}
