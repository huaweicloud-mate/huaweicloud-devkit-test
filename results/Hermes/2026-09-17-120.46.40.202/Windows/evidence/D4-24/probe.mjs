// P0 Probes Batch 2: D4-18, D4-19, D4-21, D4-22, D4-24
import { classifyHcloudArgs } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand, createApprovalToken, consumeApprovalToken } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';

const results = {};

// ============ D4-18: confirm-not-deny approval semantics ============
console.log('\n=== D4-18: confirm-not-deny approval semantics ===');
// Write operation WITHOUT approval → should be deny/write with approvalToken
const plan1 = planHcloudCommand(['ECS', 'DeleteServer', '--server_id=test']);
console.log(`  Without approval: decision=${plan1.classification.decision} risk=${plan1.classification.risk} approvalToken=${plan1.approvalToken ? 'present' : 'missing'} safeToRun=${plan1.safeToRun}`);
// Write operation WITH approval → should be allow/write (unless risk rules override)
const plan2 = planHcloudCommand(['ECS', 'DeleteServer', '--server_id=test'], { allowWrites: true });
console.log(`  With approval: decision=${plan2.classification.decision} risk=${plan2.classification.risk} safeToRun=${plan2.safeToRun}`);
// Read operation → should be allow/read_only (no approval needed)
const plan3 = planHcloudCommand(['ECS', 'ListServers']);
console.log(`  Read operation: decision=${plan3.classification.decision} risk=${plan3.classification.risk} safeToRun=${plan3.safeToRun}`);

const d4_18_pass = 
  plan1.classification.decision === 'deny' && plan1.classification.risk === 'write' && plan1.approvalToken && !plan1.safeToRun &&
  plan2.classification.decision === 'allow' && plan2.safeToRun === true &&
  plan3.classification.decision === 'allow' && plan3.safeToRun === true;
results['D4-18'] = { pass: d4_18_pass, details: { withoutApproval: plan1, withApproval: plan2, readOp: plan3 } };
console.log(`  RESULT: ${d4_18_pass ? 'PASS' : 'FAIL'}`);

// ============ D4-19: preflight still works in confirm flow ============
console.log('\n=== D4-19: preflight in confirm flow ===');
// High-risk write WITH approval → risk rules should still block
const dangerous1 = planHcloudCommand(['VPC', 'CreateSecurityGroupRule', '--direction=ingress', '--port_range_min=22', '--protocol=tcp', '--remote_ip_prefix=0.0.0.0/0'], { allowWrites: true });
console.log(`  Public SSH rule WITH approval: decision=${dangerous1.classification.decision} blockedByRiskRule=${dangerous1.classification.blockedByRiskRule} safeToRun=${dangerous1.safeToRun}`);
// Force delete WITH approval → destructive rule should still block/warn
const dangerous2 = planHcloudCommand(['ECS', 'DeleteServer', '--server_id=test', '--force'], { allowWrites: true });
console.log(`  Force delete WITH approval: decision=${dangerous2.classification.decision} safeToRun=${dangerous2.safeToRun} findings=${JSON.stringify(dangerous2.classification.findings?.map(f=>f.ruleId)||[])}`);

const d4_19_pass = dangerous1.classification.decision === 'deny' && !dangerous1.safeToRun;
results['D4-19'] = { pass: d4_19_pass, details: { publicSSH: dangerous1, forceDelete: dangerous2 } };
console.log(`  RESULT: ${d4_19_pass ? 'PASS' : 'FAIL'}`);

// ============ D4-21: hook_check_artifacts - broad IAM policy ============
console.log('\n=== D4-21: artifact pre-check (broad IAM policy) ===');
const broadPolicy = evaluateArtifacts([{
  path: 'policy.json',
  content: JSON.stringify({ Statement: [{ Effect: 'Allow', Action: ['*'], Resource: ['*'] }] })
}]);
console.log(`  Broad IAM policy: decision=${broadPolicy.decision} findings=${JSON.stringify(broadPolicy.findings?.map(f=>({rule: f.ruleId, sev: f.severity}))||[])}`);

// Normal IAM policy (should be allow)
const normalPolicy = evaluateArtifacts([{
  path: 'policy.json',
  content: JSON.stringify({ Statement: [{ Effect: 'Allow', Action: ['ecs:servers:list'], Resource: ['*'] }] })
}]);
console.log(`  Normal IAM policy: decision=${normalPolicy.decision}`);

const d4_21_pass = broadPolicy.decision === 'deny' && normalPolicy.decision === 'allow';
results['D4-21'] = { pass: d4_21_pass, details: { broad: broadPolicy, normal: normalPolicy } };
console.log(`  RESULT: ${d4_21_pass ? 'PASS' : 'FAIL'}`);

// ============ D4-22: hook_check_deploy_plan - public FunctionGraph ============
console.log('\n=== D4-22: deploy plan pre-check (public FunctionGraph) ===');
const fgPlan = evaluateDeployPlan(JSON.stringify({
  service: 'FunctionGraph',
  trigger: { type: 'APIG', auth: 'NONE', public: true }
}));
console.log(`  Public FG no-auth: decision=${fgPlan.decision} findings=${JSON.stringify(fgPlan.findings?.map(f=>({rule: f.ruleId, sev: f.severity}))||[])}`);

// Normal deploy plan (should be allow)
const normalPlan = evaluateDeployPlan(JSON.stringify({
  service: 'ECS',
  action: 'create',
  config: { instance_type: 's6.small.1' }
}));
console.log(`  Normal ECS plan: decision=${normalPlan.decision}`);

const d4_22_pass = (fgPlan.decision === 'deny' || fgPlan.decision === 'warn') && fgPlan.findings?.length > 0;
results['D4-22'] = { pass: d4_22_pass, details: { publicFG: fgPlan, normal: normalPlan } };
console.log(`  RESULT: ${d4_22_pass ? 'PASS' : 'FAIL'}`);

// ============ D4-24: approval token expiry and reuse ============
console.log('\n=== D4-24: approval token lifecycle ===');
// Token is single-use
const token = createApprovalToken(['ECS', 'DeleteServer', '--server_id=test']);
const consume1 = consumeApprovalToken(token);
const consume2 = consumeApprovalToken(token);
console.log(`  First consume: ${consume1 ? 'entry returned' : 'null'}`);
console.log(`  Second consume (reuse): ${consume2 ? 'entry returned (BAD!)' : 'null (correct - single use)'}`);
const d4_24_pass = consume1 !== null && consume2 === null;
results['D4-24'] = { pass: d4_24_pass, details: { firstConsume: consume1, secondConsume: consume2 } };
console.log(`  RESULT: ${d4_24_pass ? 'PASS' : 'FAIL'}`);

console.log('\n\n=== BATCH 2 SUMMARY ===');
console.log(JSON.stringify(results, null, 2));
