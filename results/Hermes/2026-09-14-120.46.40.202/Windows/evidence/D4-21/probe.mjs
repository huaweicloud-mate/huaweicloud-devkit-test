// D4-21: hook_check_artifacts named regression
import { evaluateArtifacts } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';

console.log('=== D4-21: hook_check_artifacts 具名回归 ===');

// Test with broad IAM policy JSON
const broadIamPolicy = {
  artifacts: [{
    type: 'iam-policy',
    content: JSON.stringify({
      Statement: [{
        Effect: 'Allow',
        Action: ['*'],
        Resource: ['*'],
      }],
    }),
  }],
};

try {
  const result = evaluateArtifacts(broadIamPolicy.artifacts);
  console.log('evaluateArtifacts result:', JSON.stringify(result, null, 2));
  
  // Broad IAM policy (Action: *, Resource: *) should be denied/warned
  if (result.decision === 'deny' || result.decision === 'warn') {
    console.log('RESULT: PASS - Broad IAM policy artifact blocked/warned');
  } else {
    console.log('RESULT: FAIL - Broad IAM policy artifact not blocked');
  }
} catch (error) {
  console.log('Error:', error?.message);
  console.log('RESULT: BLOCKED - Could not evaluate artifacts');
}
