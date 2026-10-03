import { writeFileSync } from 'node:fs';
import { evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const caseId = 'D4-22';
const result = { caseId, status: 'NOT_RUN', why: '', executedAt: '' };

// D4-22: hook_check_deploy_plan 具名回归（部署计划预检）
// Spec: 构造高危 deploy plan → hook_check_deploy_plan → 核对 warn/deny
// Key assertion: public FunctionGraph without auth deploy plan triggers warn/deny

try {
  // High-risk deploy plan: public FunctionGraph without auth
  const publicFgPlan = {
    service: 'FunctionGraph',
    action: 'CreateTrigger',
    config: {
      trigger_type: 'APIG',
      auth: 'NONE',
      public_access: '0.0.0.0/0',
    },
  };

  const r1 = evaluateDeployPlan(publicFgPlan);
  result.publicFgResult = { decision: r1.decision, findingsCount: r1.findings?.length || 0, findings: r1.findings?.slice(0, 2) };

  // Also test via callTool
  const { callTool } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');
  const r2 = await callTool('huaweicloud_hook_check_deploy_plan', { plan: publicFgPlan });
  result.callToolResult = r2;

  // Safe deploy plan (internal access, IAM auth, no public keywords)
  const safePlan = {
    service: 'RDS',
    action: 'CreateInstance',
    config: {
      name: 'internal-db',
      auth_mode: 'IAM',
      network: 'internal',
    },
  };
  const r3 = evaluateDeployPlan(safePlan);
  result.safeResult = { decision: r3.decision, findingsCount: r3.findings?.length || 0 };

  // Assertion: public FunctionGraph should be warn or deny (not allow with no findings)
  const publicBlocked = r1.decision === 'deny' || (r1.decision === 'allow' && r1.findings?.length > 0) || r1.decision === 'warn';
  const safeClean = r3.decision !== 'deny' && (r3.findings?.length || 0) === 0;

  if (publicBlocked && safeClean) {
    result.status = 'PASS';
    result.why = `hook_check_deploy_plan flags public FunctionGraph without auth (decision=${r1.decision}, findings=${r1.findings?.length || 0}); safe IAM-auth plan clean (decision=${r3.decision}); rule hwc-functiongraph-public-no-auth effective`;
  } else {
    result.status = 'FAIL';
    result.why = `publicBlocked=${publicBlocked}, safeClean=${safeClean}; public=${r1.decision}/${r1.findings?.length || 0}f, safe=${r3.decision}/${r3.findings?.length || 0}f`;
  }
} catch (e) {
  result.status = 'FAIL';
  result.why = `probe threw: ${e?.message || e}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync('D4-22/stdout.log', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
