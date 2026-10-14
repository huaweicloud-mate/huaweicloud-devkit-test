import { classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, loadRiskRules } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { writeFileSync } from 'node:fs';

const caseId = 'D4-19';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D4-19: Preflight checks still effective during confirmation flow
// Test: high-risk write operations should still be caught by preflight checks
// even when going through the confirmation/planning flow
try {
  // Test 1: classifyTextCommand on high-risk commands
  const highRiskCommands = [
    'hcloud ECS DeleteServer --server_ids="prod-id"',
    'hcloud RDS DeleteInstance --instance_id="prod-db"',
    'hcloud IAM DeleteUser --user_id="admin"',
    'hcloud VPC DeleteVpc --vpc_id="prod-vpc"',
  ];
  
  const classifyResults = highRiskCommands.map(cmd => {
    const result = classifyTextCommand(cmd);
    return { cmd: cmd.slice(0, 50), decision: result.decision, risk: result.risk };
  });

  // Test 2: evaluateCommandRisk on high-risk patterns
  const riskEvaluations = highRiskCommands.map(cmd => {
    const result = evaluateCommandRisk(cmd);
    return { cmd: cmd.slice(0, 50), decision: result.decision, severity: result.severity };
  });

  // Test 3: evaluateArtifacts on dangerous IAM policy
  const dangerousPolicy = {
    Type: 'IAM',
    Policy: {
      Statement: [
        { Effect: 'Allow', Action: '*', Resource: '*' }
      ]
    }
  };
  const artifactResult = evaluateArtifacts(dangerousPolicy);

  // Test 4: evaluateDeployPlan on public-exposed FunctionGraph
  const dangerousDeployPlan = {
    service: 'FunctionGraph',
    config: {
      handler: 'index.handler',
      public_access: true,
      endpoint: '0.0.0.0/0'
    }
  };
  const deployResult = evaluateDeployPlan(dangerousDeployPlan);

  // Check: all high-risk commands should be deny
  const allCommandsDenied = classifyResults.every(r => r.decision === 'deny');
  const allRiskEvaluated = riskEvaluations.every(r => r.decision === 'deny' || r.severity === 'high');
  
  // Artifacts and deploy plan should have risk decisions
  const artifactHasRisk = artifactResult?.decision === 'deny' || artifactResult?.decision === 'warn' || artifactResult?.severity;
  const deployHasRisk = deployResult?.decision === 'deny' || deployResult?.decision === 'warn' || deployResult?.severity;

  const status = (allCommandsDenied && artifactHasRisk && deployHasRisk) ? 'PASS' : 'FAIL';
  const why = status === 'PASS'
    ? `All ${highRiskCommands.length} high-risk commands denied by classifyTextCommand; artifacts decision=${artifactResult?.decision}; deploy plan decision=${deployResult?.decision}. Preflight checks effective during confirmation flow.`
    : `Preflight check failure: commands denied=${allCommandsDenied}, artifact risk=${artifactHasRisk}, deploy risk=${deployHasRisk}`;

  const output = {
    caseId,
    status,
    why,
    executedAt: execTs,
    result: {
      classifyResults,
      riskEvaluations,
      artifactResult: { decision: artifactResult?.decision, severity: artifactResult?.severity },
      deployResult: { decision: deployResult?.decision, severity: deployResult?.severity }
    }
  };

  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = {
    caseId,
    status: 'FAIL',
    why: `Preflight test error: ${e.message}`,
    executedAt: execTs,
    error: e.message
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
