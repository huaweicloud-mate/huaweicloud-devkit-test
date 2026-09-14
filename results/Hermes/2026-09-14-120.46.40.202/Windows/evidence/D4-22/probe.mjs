// D4-22: hook_check_deploy_plan named regression
import { evaluateDeployPlan } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';

console.log('=== D4-22: hook_check_deploy_plan 具名回归 ===');

// Test with high-risk deploy plan (public exposure)
const deployPlan = {
  deployPlan: {
    service: 'FunctionGraph',
    action: 'create-function',
    public_exposure: true,
    internet_access: true,
    config: {
      handler: 'index.handler',
      code_type: 'inline',
      code: '...',
    },
  },
};

try {
  const result = evaluateDeployPlan(deployPlan.deployPlan);
  console.log('evaluateDeployPlan result:', JSON.stringify(result, null, 2));
  
  if (result.decision === 'deny' || result.decision === 'warn') {
    console.log('RESULT: PASS - Public exposure deploy plan blocked/warned');
  } else {
    console.log('RESULT: FAIL - Public exposure deploy plan not blocked');
  }
} catch (error) {
  console.log('Error:', error?.message);
  // Try alternative API
  try {
    const result2 = evaluateDeployPlan(deployPlan);
    console.log('evaluateDeployPlan (alt) result:', JSON.stringify(result2, null, 2));
    if (result2.decision === 'deny' || result2.decision === 'warn') {
      console.log('RESULT: PASS - Public exposure deploy plan blocked/warned (alt API)');
    } else {
      console.log('RESULT: FAIL - Public exposure deploy plan not blocked (alt API)');
    }
  } catch (e2) {
    console.log('Alt error:', e2?.message);
    console.log('RESULT: BLOCKED - Could not evaluate deploy plan');
  }
}
