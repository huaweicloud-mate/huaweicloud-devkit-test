import { evaluateDeployPlan, loadRiskRules } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { writeFileSync } from 'node:fs';

const caseId = 'D4-22';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D4-22: hook_check_deploy_plan named regression (deploy plan pre-check)
// Test: high-risk deploy plans with public exposure should be denied/warned
try {
  // Test 1: Public-exposed FunctionGraph
  const publicFgPlan = {
    service: 'FunctionGraph',
    config: {
      handler: 'index.handler',
      runtime: 'Python3.9',
      public_access: true,
      endpoint: '0.0.0.0/0'
    }
  };
  const publicFgResult = evaluateDeployPlan(publicFgPlan);

  // Test 2: ECS with public IP
  const publicEcsPlan = {
    service: 'ECS',
    config: {
      name: 'test-server',
      image_id: 'img-xxx',
      flavor_id: 's6.small.1',
      public_ip: true,
      security_groups: ['default']
    }
  };
  const publicEcsResult = evaluateDeployPlan(publicEcsPlan);

  // Test 3: Safe deploy plan (no public exposure)
  const safePlan = {
    service: 'ECS',
    config: {
      name: 'test-server',
      image_id: 'img-xxx',
      flavor_id: 's6.small.1',
      public_ip: false,
      security_groups: ['restricted']
    }
  };
  const safeResult = evaluateDeployPlan(safePlan);

  // Test 4: Destructive deploy plan
  const destructivePlan = {
    service: 'ECS',
    action: 'delete',
    config: {
      server_ids: ['prod-instance-1', 'prod-instance-2']
    }
  };
  const destructiveResult = evaluateDeployPlan(destructivePlan);

  // Determine status: public exposure should be denied/warned
  const publicFgBlocked = publicFgResult?.decision === 'deny' || publicFgResult?.decision === 'warn';
  const publicEcsBlocked = publicEcsResult?.decision === 'deny' || publicEcsResult?.decision === 'warn';

  const status = (publicFgBlocked || publicEcsBlocked) ? 'PASS' : 'FAIL';
  const why = status === 'PASS'
    ? `Public FunctionGraph: decision=${publicFgResult?.decision}; public ECS: decision=${publicEcsResult?.decision}; safe plan: decision=${safeResult?.decision}; destructive: decision=${destructiveResult?.decision}.`
    : `Public deploy plans NOT blocked: publicFg=${publicFgResult?.decision}, publicEcs=${publicEcsResult?.decision}. evaluateDeployPlan failed to catch public exposure.`;

  const output = {
    caseId,
    status,
    why,
    executedAt: execTs,
    result: {
      publicFgResult: { decision: publicFgResult?.decision, severity: publicFgResult?.severity, reason: publicFgResult?.reason?.slice(0,100) },
      publicEcsResult: { decision: publicEcsResult?.decision, severity: publicEcsResult?.severity },
      safeResult: { decision: safeResult?.decision },
      destructiveResult: { decision: destructiveResult?.decision }
    }
  };

  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = {
    caseId,
    status: 'FAIL',
    why: `evaluateDeployPlan test error: ${e.message}`,
    executedAt: execTs,
    error: e.message
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
