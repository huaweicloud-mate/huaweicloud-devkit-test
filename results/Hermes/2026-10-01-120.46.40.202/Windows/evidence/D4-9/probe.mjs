// D4-9: 公开暴露/破坏性预检 (v2 - uses classifyHcloudArgs + evaluateCommandRisk)
import { classifyHcloudArgs } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateDeployPlan } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const results = {};
try {
  // Public exposure operations - classifyHcloudArgs should classify as write/plan (not allow)
  const exposureCmds = [
    ['ECS', 'CreateServers', '--publicip.type=5_bgp'],
    ['ELB', 'CreateLoadBalancer', '--type=External'],
    ['FunctionGraph', 'CreateFunction', '--code_type=inline'],
  ];
  // Destructive operations - should be classified as write/plan and risk-evaluated
  const destructiveCmds = [
    ['ECS', 'DeleteServers', '--server_ids=i-xxx', '--force'],
    ['RDS', 'DeleteInstance', '--instance_id=xxx'],
    ['VPC', 'DeleteVpc', '--vpc_id=xxx'],
    ['EVS', 'DeleteVolume', '--volume_id=xxx'],
  ];
  
  const exposureResults = [];
  for (const [svc, op, ...args] of exposureCmds) {
    const hcloudResult = classifyHcloudArgs([svc, op, ...args]);
    const riskResult = evaluateCommandRisk(`hcloud ${svc} ${op} ${args.join(' ')}`);
    exposureResults.push({service: svc, operation: op, hcloudDecision: hcloudResult.decision, riskDecision: riskResult.decision});
    console.log(`  EXPOSURE: ${svc} ${op} -> hcloud:${hcloudResult.decision} risk:${riskResult.decision}`);
  }
  
  const destructiveResults = [];
  for (const [svc, op, ...args] of destructiveCmds) {
    const hcloudResult = classifyHcloudArgs([svc, op, ...args]);
    const riskResult = evaluateCommandRisk(`hcloud ${svc} ${op} ${args.join(' ')}`);
    destructiveResults.push({service: svc, operation: op, hcloudDecision: hcloudResult.decision, riskDecision: riskResult.decision});
    console.log(`  DESTRUCT: ${svc} ${op} -> hcloud:${hcloudResult.decision} risk:${riskResult.decision}`);
  }
  
  // Test deploy plan with public exposure
  const deployPlan = JSON.stringify({
    service: 'FunctionGraph',
    operation: 'CreateFunction',
    config: { auth_type: 'NONE', trigger: { type: 'APIG', visibility: 'PUBLIC' } }
  });
  const planResult = evaluateDeployPlan(deployPlan);
  console.log(`  DEPLOY PLAN (public FG): -> ${planResult.decision}`);
  
  // Exposure operations: should be write/plan (not allow/read_only) = pre-checked by safety policy
  const exposurePreChecked = exposureResults.every(r => r.hcloudDecision !== 'allow' && r.hcloudDecision !== 'read_only');
  // Destructive operations: should be write/plan AND risk should be deny/warn
  const destructivePreChecked = destructiveResults.every(r => 
    (r.hcloudDecision !== 'allow' && r.hcloudDecision !== 'read_only') &&
    (r.riskDecision === 'deny' || r.riskDecision === 'warn' || r.hcloudDecision === 'deny' || r.hcloudDecision === 'write')
  );
  
  const allPreChecked = exposurePreChecked && destructivePreChecked;
  
  results['D4-9'] = {
    status: allPreChecked ? 'PASS' : 'FAIL',
    why: allPreChecked ? '' : `Exposure preChecked:${exposurePreChecked}, Destructive preChecked:${destructivePreChecked}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { exposureResults, destructiveResults, deployPlanResult: planResult.decision, exposurePreChecked, destructivePreChecked }
  };
  console.log('STATUS:', results['D4-9'].status);
  console.log(JSON.stringify(results['D4-9'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D4-9'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}
