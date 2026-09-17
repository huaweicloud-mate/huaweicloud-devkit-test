import { evaluateDeployPlan } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const riskyPlan = {
  resources: [
    { type: 'FunctionGraph', config: { publicAccess: true, noCleanup: true } },
    { type: 'ECS', config: { publicIP: true, securityGroup: '0.0.0.0/0' } }
  ]
};
try {
  const r = evaluateDeployPlan(riskyPlan);
  console.log('Deploy plan result:', JSON.stringify(r));
  if (r && (r.decision === 'deny' || r.decision === 'warn' || (r.results && r.results.some(x => x.decision === 'deny' || x.decision === 'warn')))) {
    console.log('PASS: risky deploy plan detected');
  } else {
    console.log('FAIL: risky deploy plan not detected');
  }
} catch(e) {
  console.log('Error:', e.message);
  // Try with string input
  try {
    const r2 = evaluateDeployPlan(JSON.stringify(riskyPlan));
    console.log('String input result:', JSON.stringify(r2));
    if (r2 && (r2.decision === 'deny' || r2.decision === 'warn')) {
      console.log('PASS: risky deploy plan detected (string)');
    } else {
      console.log('FAIL: risky deploy plan not detected');
    }
  } catch(e2) {
    console.log('FAIL: evaluateDeployPlan threw error:', e2.message);
  }
}