import { writeFileSync } from 'node:fs';
// D4-21: hook_check_artifacts — broad IAM policy JSON should be denied
const caseId = 'D4-21';
const executedAt = '20261017053700';
try {
  const { evaluateArtifacts } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
  const { callTool } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');

  // Broad IAM policy artifact — should be denied
  const broadPolicy = {
    path: 'policy.json',
    content: JSON.stringify({
      Statement: [{
        Effect: 'Allow',
        Action: ['*'],
        Resource: ['*'],
      }],
    }),
  };
  const narrowPolicy = {
    path: 'policy.json',
    content: JSON.stringify({
      Statement: [{
        Effect: 'Allow',
        Action: ['ecs:servers:list'],
        Resource: ['ecs:cn-north-4:server/xxx'],
      }],
    }),
  };

  const broadResult = evaluateArtifacts([broadPolicy]);
  const narrowResult = evaluateArtifacts([narrowPolicy]);

  // Also via callTool
  const broadHook = await callTool('huaweicloud_hook_check_artifacts', { artifacts: [broadPolicy] });
  const narrowHook = await callTool('huaweicloud_hook_check_artifacts', { artifacts: [narrowPolicy] });

  const broadDenied = broadResult.decision === 'deny';
  const narrowOk = narrowResult.decision === 'allow' || narrowResult.decision === 'warn';

  const status = (broadDenied) ? 'PASS' : 'FAIL';
  const output = {
    caseId,
    status,
    why: 'Broad IAM policy (* action, * resource) denied=' + broadDenied + ' (decision=' + broadResult.decision + '); narrow policy decision=' + narrowResult.decision,
    executedAt,
    result: { broadResult, narrowResult, broadHook, narrowHook, broadDenied, narrowOk },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
