import { evaluateArtifacts } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const broadPolicy = {
  path: 'policy.json',
  content: JSON.stringify({
    Statement: [{
      Effect: 'Allow',
      Action: ['*'],
      Resource: ['*']
    }]
  })
};
try {
  const r = evaluateArtifacts([broadPolicy]);
  console.log('Broad IAM policy result:', JSON.stringify(r));
  if (r && (r.decision === 'deny' || r.decision === 'warn' || (r.results && r.results.some(x => x.decision === 'deny' || x.decision === 'warn')))) {
    console.log('PASS: broad IAM policy detected');
  } else {
    console.log('FAIL: broad IAM policy not detected');
  }
} catch(e) {
  console.log('Error:', e.message);
  // If function exists but throws for different input, still check
  console.log('FAIL: evaluateArtifacts threw error');
}