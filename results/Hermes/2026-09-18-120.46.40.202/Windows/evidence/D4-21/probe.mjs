import { evaluateArtifacts, evaluateDeployPlan } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';

// D4-21: Correct API - pass array of artifacts
const broadIAMPolicy = JSON.stringify({
  Version: '2012-10-17',
  Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }]
});

const artifacts = [{ path: 'policy.json', content: broadIAMPolicy }];
const r21 = evaluateArtifacts(artifacts);
console.log('D4-21:', JSON.stringify(r21, null, 2));

// D4-22: deploy plan with public FunctionGraph
const deployPlan = JSON.stringify({
  service: 'FunctionGraph',
  action: 'create',
  triggers: [{ type: 'APIG', auth: false }],
  config: { handler: 'index.handler' }
});
const r22 = evaluateDeployPlan(deployPlan);
console.log('D4-22:', JSON.stringify(r22, null, 2));
