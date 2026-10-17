// D4-19: 确认流下预检仍生效
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const results = [];

const commandResult = evaluateCommandRisk('hcloud ECS CreateServers --security_group_id.1=sg-123 --remote_ip_prefix=0.0.0.0/0');
results.push({
  test: 'Command risk evaluation - public exposure',
  decision: commandResult.decision,
  findingsCount: commandResult.findings?.length || 0,
  expected: 'deny',
  passed: commandResult.decision === 'deny' || commandResult.findings?.some(f => f.severity === 'deny')
});

const artifactResult = evaluateArtifacts([{
  path: 'policy.json',
  content: JSON.stringify({ Statement: [{ Effect: 'Allow', Action: ['*'], Resource: '*' }] })
}]);
results.push({
  test: 'Artifact risk evaluation - broad IAM',
  decision: artifactResult.decision,
  findingsCount: artifactResult.findings?.length || 0,
  expected: 'deny',
  passed: artifactResult.decision === 'deny' || artifactResult.findings?.some(f => f.severity === 'deny')
});

const deployResult = evaluateDeployPlan({ plan: 'Create FunctionGraph function with public endpoint and no auth' });
results.push({
  test: 'Deploy plan risk evaluation - public exposure',
  decision: deployResult.decision,
  findingsCount: deployResult.findings?.length || 0,
  expected: 'deny or warn',
  passed: deployResult.decision === 'deny' || deployResult.decision === 'warn'
});

const allPassed = results.every(r => r.passed);
console.log(JSON.stringify({
  status: allPassed ? 'PASS' : 'FAIL',
  caseId: 'D4-19',
  title: '确认流下预检仍生效',
  timestamp: new Date().toISOString(),
  results: results
}, null, 2));
