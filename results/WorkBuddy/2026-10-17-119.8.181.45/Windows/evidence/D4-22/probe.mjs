import { writeFileSync } from 'node:fs';
// D4-22: hook_check_deploy_plan — high-risk deploy plan should be warned/denied
const caseId = 'D4-22';
const executedAt = '20261017053800';
try {
  const { evaluateDeployPlan } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
  const { callTool } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');

  // High-risk deploy plan: public FunctionGraph with no auth
  const riskyPlan = {
    service: 'FunctionGraph',
    operation: 'CreateFunction',
    parameters: {
      handler: 'index.handler',
      public_access: true,
      auth_type: 'NONE',
      code_type: 'inline',
      func_code: '{}',
    },
  };
  const safePlan = {
    service: 'ECS',
    operation: 'ListServers',
    parameters: {},
  };

  const riskyResult = evaluateDeployPlan(riskyPlan);
  const safeResult = evaluateDeployPlan(safePlan);
  const riskyHook = await callTool('huaweicloud_hook_check_deploy_plan', { plan: riskyPlan });
  const safeHook = await callTool('huaweicloud_hook_check_deploy_plan', { plan: safePlan });

  const riskyBlocked = riskyResult.decision === 'deny' || riskyResult.decision === 'warn';
  const safeOk = safeResult.decision === 'allow';

  const status = (riskyBlocked) ? 'PASS' : 'FAIL';
  const output = {
    caseId,
    status,
    why: 'Risky deploy plan (public FunctionGraph no auth) blocked=' + riskyBlocked + ' (decision=' + riskyResult.decision + '); safe plan decision=' + safeResult.decision,
    executedAt,
    result: { riskyResult, safeResult, riskyHook, safeHook, riskyBlocked, safeOk },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
