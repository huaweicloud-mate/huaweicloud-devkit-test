// D4-22: hook_check_deploy_plan - high-risk deploy plan pre-check
import { evaluateDeployPlan } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const results = {};
try {
  // Public exposure FunctionGraph deploy plan
  const publicFgPlan = JSON.stringify({
    service: 'FunctionGraph',
    operation: 'CreateFunction',
    config: { auth_type: 'NONE', trigger: { type: 'APIG', visibility: 'PUBLIC' } }
  });
  const result1 = evaluateDeployPlan(publicFgPlan);
  console.log('Public FG deploy plan ->', result1.decision, result1.risk || '');
  
  // Normal deploy plan (internal service)
  const normalPlan = JSON.stringify({
    service: 'ECS',
    operation: 'ListServers',
    config: { region: 'cn-north-4' }
  });
  const result2 = evaluateDeployPlan(normalPlan);
  console.log('Normal deploy plan ->', result2.decision, result2.risk || '');
  
  // Destructive deploy plan
  const destructivePlan = JSON.stringify({
    service: 'ECS',
    operation: 'DeleteServers',
    config: { force: true, server_ids: ['i-xxx'] }
  });
  const result3 = evaluateDeployPlan(destructivePlan);
  console.log('Destructive deploy plan ->', result3.decision, result3.risk || '');
  
  const publicWarned = result1.decision === 'deny' || result1.decision === 'warn';
  const normalOk = result2.decision !== 'deny';
  
  results['D4-22'] = {
    status: (publicWarned && normalOk) ? 'PASS' : 'FAIL',
    why: (publicWarned && normalOk) ? '' : `publicWarned=${publicWarned}, normalOk=${normalOk}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { publicFgResult: {decision: result1.decision}, normalResult: {decision: result2.decision}, destructiveResult: {decision: result3.decision} }
  };
  console.log('STATUS:', results['D4-22'].status);
  console.log(JSON.stringify(results['D4-22'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D4-22'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}
