// D4-22: hook_check_deploy_plan 具名回归
import { evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const results = [];

const publicFunctionResult = evaluateDeployPlan({ plan: 'Create FunctionGraph function with APIG trigger, public endpoint, auth=NONE' });
results.push({
  test: 'Public FunctionGraph - no auth',
  decision: publicFunctionResult.decision,
  category: publicFunctionResult.findings?.[0]?.category,
  ruleId: publicFunctionResult.findings?.[0]?.ruleId,
  expected: 'warn or deny',
  passed: publicFunctionResult.decision === 'warn' || publicFunctionResult.decision === 'deny'
});

const publicApiResult = evaluateDeployPlan({ plan: 'Create API Gateway dedicated instance with public endpoint and no authentication' });
results.push({
  test: 'Public API Gateway - no auth',
  decision: publicApiResult.decision,
  category: publicApiResult.findings?.[0]?.category,
  expected: 'warn or deny',
  passed: publicApiResult.decision === 'warn' || publicApiResult.decision === 'deny'
});

const sandboxNoMetaResult = evaluateDeployPlan({ plan: 'Deploy sandbox environment for preview without ttl, owner, or cleanup metadata' });
results.push({
  test: 'Sandbox deployment - missing cleanup metadata',
  decision: sandboxNoMetaResult.decision,
  category: sandboxNoMetaResult.findings?.[0]?.category,
  ruleId: sandboxNoMetaResult.findings?.[0]?.ruleId,
  expected: 'warn',
  passed: sandboxNoMetaResult.decision === 'warn' || sandboxNoMetaResult.findings?.some(f => f.ruleId === 'hwc-sandbox-missing-ttl')
});

const safeDeployResult = evaluateDeployPlan({ plan: 'Deploy sandbox environment with ttl=24h, owner=test-team, cleanup=auto-delete, cost_center=engineering' });
results.push({
  test: 'Safe deployment - with cleanup metadata',
  decision: safeDeployResult.decision,
  findingsCount: safeDeployResult.findings?.length || 0,
  expected: 'allow',
  passed: safeDeployResult.decision === 'allow'
});

const allPassed = results.every(r => r.passed);
console.log(JSON.stringify({
  status: allPassed ? 'PASS' : 'FAIL',
  caseId: 'D4-22',
  title: 'hook_check_deploy_plan 具名回归',
  timestamp: new Date().toISOString(),
  results: results
}, null, 2));
