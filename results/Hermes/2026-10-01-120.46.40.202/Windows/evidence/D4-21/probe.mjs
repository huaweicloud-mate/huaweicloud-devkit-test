// D4-21: hook_check_artifacts - broad IAM policy artifact pre-check (v2)
import { evaluateArtifacts } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const results = {};
try {
  // evaluateArtifacts expects a non-empty array
  // Broad IAM policy artifact
  const broadIamArtifact = {
    type: 'iam_policy',
    content: JSON.stringify({ Statement: [{ Action: ["*"], Effect: "Allow", Resource: "*" }] })
  };
  const result1 = evaluateArtifacts([broadIamArtifact]);
  console.log('Broad IAM artifact ->', result1.decision, result1.risk || '');
  console.log('  findings:', JSON.stringify(result1.findings || []).substring(0, 200));
  
  // Normal code artifact
  const normalArtifact = {
    type: 'code',
    content: 'console.log("hello world");'
  };
  const result2 = evaluateArtifacts([normalArtifact]);
  console.log('Normal code artifact ->', result2.decision, result2.risk || '');
  
  // String-only artifacts (just text)
  const broadIamText = JSON.stringify({ Statement: [{ Action: ["*"], Effect: "Allow", Resource: "*" }] });
  const result3 = evaluateArtifacts([broadIamText]);
  console.log('Broad IAM text ->', result3.decision, result3.risk || '');
  
  const normalText = 'function hello() { return "world"; }';
  const result4 = evaluateArtifacts([normalText]);
  console.log('Normal text ->', result4.decision, result4.risk || '');
  
  // Check: broad IAM should be deny, normal should be allow
  const broadDenied = result1.decision === 'deny' || result3.decision === 'deny';
  const normalAllowed = result2.decision !== 'deny' || result4.decision !== 'deny';
  
  results['D4-21'] = {
    status: (broadDenied && normalAllowed) ? 'PASS' : 'FAIL',
    why: (broadDenied && normalAllowed) ? '' : `broadDenied=${broadDenied}, normalAllowed=${normalAllowed}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: {
      broadIamObjectResult: {decision: result1.decision, risk: result1.risk},
      normalCodeObjectResult: {decision: result2.decision},
      broadIamTextResult: {decision: result3.decision, risk: result3.risk},
      normalTextResult: {decision: result4.decision}
    }
  };
  console.log('STATUS:', results['D4-21'].status);
  console.log(JSON.stringify(results['D4-21'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D4-21'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}
