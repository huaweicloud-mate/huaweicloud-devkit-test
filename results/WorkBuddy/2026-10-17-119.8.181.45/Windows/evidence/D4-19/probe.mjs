import { writeFileSync } from 'node:fs';
// D4-19: Preflight checks still active during confirm flow
const caseId = 'D4-19';
const executedAt = '20261017053600';
try {
  const { callTool } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');

  // Test: hook_check_command on high-risk write command during confirm flow
  const hookResult = await callTool('huaweicloud_hook_check_command', {
    command: 'hcloud ECS DeleteServer --server_ids=fake-test-id --force',
  });

  // hookResult should have deny or warn decision (preflight active)
  const decision = hookResult?.hookSpecificOutput?.permissionDecision || hookResult?.decision || hookResult?.result?.decision;
  const isBlocked = decision === 'deny' || decision === 'warn';

  // Also test hook_check_deploy_plan with high-risk plan
  const deployPlanResult = await callTool('huaweicloud_hook_check_deploy_plan', {
    plan: {
      service: 'FunctionGraph',
      operation: 'CreateFunction',
      parameters: { handler: 'index.handler', public_access: true, auth_type: 'NONE' },
    },
  });
  const deployDecision = deployPlanResult?.hookSpecificOutput?.permissionDecision || deployPlanResult?.decision || deployPlanResult?.result?.decision;
  const deployBlocked = deployDecision === 'deny' || deployDecision === 'warn';

  const status = (isBlocked && deployBlocked) ? 'PASS' : 'FAIL';
  const output = {
    caseId,
    status,
    why: 'hook_check_command on DeleteServer+force: decision=' + decision + ', blocked=' + isBlocked + '; hook_check_deploy_plan on public FunctionGraph: decision=' + deployDecision + ', blocked=' + deployBlocked,
    executedAt,
    result: { hookResult, decision, isBlocked, deployPlanResult, deployDecision, deployBlocked },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
