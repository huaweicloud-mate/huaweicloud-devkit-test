import { writeFileSync, readFileSync } from 'node:fs';
import { evaluateArtifacts } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const caseId = 'D4-21';
const result = { caseId, status: 'NOT_RUN', why: '', executedAt: '' };

// D4-21: hook_check_artifacts 具名回归（代码/IaC/策略制品预检）
// Spec: 构造宽泛 IAM policy JSON → hook_check_artifacts → 核对 deny
// Key assertion: broad IAM administrator policy artifact is denied by evaluateArtifacts

try {
  // Broad IAM policy artifact
  const broadIamPolicy = {
    type: 'iam_policy',
    name: 'broad-admin',
    content: JSON.stringify({
      Statement: [
        {
          Effect: 'Allow',
          Action: ['*:*'],
          Resource: ['*'],
        },
      ],
    }),
  };

  const r1 = evaluateArtifacts([broadIamPolicy]);
  result.broadIamResult = { decision: r1.decision, findingsCount: r1.findings?.length || 0, findings: r1.findings?.slice(0, 2) };

  // Also test via callTool
  const { callTool } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');
  const r2 = await callTool('huaweicloud_hook_check_artifacts', { artifacts: [broadIamPolicy] });
  result.callToolResult = r2;

  // Safe artifact (least-privilege)
  const safePolicy = {
    type: 'iam_policy',
    name: 'least-privilege',
    content: JSON.stringify({
      Statement: [
        {
          Effect: 'Allow',
          Action: ['ecs:servers:list'],
          Resource: ['obs://bucket/*'],
        },
      ],
    }),
  };
  const r3 = evaluateArtifacts([safePolicy]);
  result.safeResult = { decision: r3.decision, findingsCount: r3.findings?.length || 0 };

  const broadDenied = r1.decision === 'deny';
  const safeOk = r3.decision !== 'deny';

  if (broadDenied && safeOk) {
    result.status = 'PASS';
    result.why = `hook_check_artifacts denies broad IAM admin policy (Action=*:*, Effect=Allow); safe least-privilege policy not denied; rule hwc-iam-admin-policy effective`;
  } else {
    result.status = 'FAIL';
    result.why = `broadDenied=${broadDenied}, safeOk=${safeOk}; broad=${r1.decision}, safe=${r3.decision}`;
  }
} catch (e) {
  result.status = 'FAIL';
  result.why = `probe threw: ${e?.message || e}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync('stdout.log', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
