// D4-21: hook_check_artifacts 具名回归
import { evaluateArtifacts } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const results = [];

const broadIamResult = evaluateArtifacts([{
  path: 'iam-policy.json',
  content: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }]
  })
}]);
results.push({
  test: 'Broad IAM policy - Action: *',
  decision: broadIamResult.decision,
  category: broadIamResult.findings?.[0]?.category,
  ruleId: broadIamResult.findings?.[0]?.ruleId,
  expected: 'deny',
  passed: broadIamResult.decision === 'deny' && broadIamResult.findings?.some(f => f.ruleId === 'hwc-iam-admin-policy')
});

const adminAccessResult = evaluateArtifacts([{
  path: 'admin-policy.json',
  content: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{ Effect: 'Allow', Action: ['*'], Resource: '*' }]
  })
}]);
results.push({
  test: 'Broad IAM policy - AdministratorAccess pattern',
  decision: adminAccessResult.decision,
  category: adminAccessResult.findings?.[0]?.category,
  expected: 'deny',
  passed: adminAccessResult.decision === 'deny' && adminAccessResult.findings?.some(f => f.category === 'iam')
});

const leastPrivilegeResult = evaluateArtifacts([{
  path: 'limited-policy.json',
  content: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{ Effect: 'Allow', Action: ['ecs:ListServers', 'ecs:ShowServer'], Resource: '*' }]
  })
}]);
results.push({
  test: 'Least privilege policy - should pass',
  decision: leastPrivilegeResult.decision,
  findingsCount: leastPrivilegeResult.findings?.length || 0,
  expected: 'allow',
  passed: leastPrivilegeResult.decision === 'allow'
});

const allPassed = results.every(r => r.passed);
console.log(JSON.stringify({
  status: allPassed ? 'PASS' : 'FAIL',
  caseId: 'D4-21',
  title: 'hook_check_artifacts 具名回归',
  timestamp: new Date().toISOString(),
  results: results
}, null, 2));
