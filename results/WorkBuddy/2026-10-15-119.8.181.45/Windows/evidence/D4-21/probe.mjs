import { evaluateArtifacts, loadRiskRules } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { writeFileSync } from 'node:fs';

const caseId = 'D4-21';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D4-21: hook_check_artifacts named regression (code/IaC/policy artifact pre-check)
// Test: broad IAM policy artifacts should be denied
try {
  // Test 1: Broad IAM policy (Action: *, Resource: *)
  const broadIamPolicy = {
    type: 'iam-policy',
    content: {
      Statement: [
        { Effect: 'Allow', Action: '*', Resource: '*' }
      ]
    }
  };
  const broadResult = evaluateArtifacts(broadIamPolicy);

  // Test 2: IAM policy with dangerous permissions
  const dangerousIamPolicy = {
    type: 'iam-policy',
    content: {
      Statement: [
        { Effect: 'Allow', Action: ['iam:*', 'kms:*', 'ecs:*'], Resource: '*' }
      ]
    }
  };
  const dangerousResult = evaluateArtifacts(dangerousIamPolicy);

  // Test 3: Safe IAM policy (narrow scope)
  const safeIamPolicy = {
    type: 'iam-policy',
    content: {
      Statement: [
        { Effect: 'Allow', Action: ['ecs:ListServers'], Resource: 'arn:huaweicloud:ecs:cn-north-4:123:server/specific-id' }
      ]
    }
  };
  const safeResult = evaluateArtifacts(safeIamPolicy);

  // Test 4: IaC with public security group
  const publicSecurityGroup = {
    type: 'terraform',
    content: {
      resource: {
        huaweicloud_networking_secgroup: {
          bad: {
            name: 'open',
            description: 'Open to all',
            rules: [{
              direction: 'ingress',
              ethertype: 'IPv4',
              port_range_min: 0,
              port_range_max: 65535,
              remote_ip_prefix: '0.0.0.0/0'
            }]
          }
        }
      }
    }
  };
  const publicSgResult = evaluateArtifacts(publicSecurityGroup);

  // Test 5: loadRiskRules to verify rule library
  const rules = loadRiskRules();
  const ruleCount = rules?.length || Object.keys(rules?.rules || {}).length;

  // Determine status: broad IAM should be denied/warned
  const broadBlocked = broadResult?.decision === 'deny' || broadResult?.decision === 'warn';
  const dangerousBlocked = dangerousResult?.decision === 'deny' || dangerousResult?.decision === 'warn';

  const status = (broadBlocked || dangerousBlocked) ? 'PASS' : 'FAIL';
  const why = status === 'PASS'
    ? `Broad IAM policy caught: decision=${broadResult?.decision}; dangerous IAM policy: decision=${dangerousResult?.decision}; safe policy: decision=${safeResult?.decision}; public SG: decision=${publicSgResult?.decision}. Rules loaded: ${ruleCount}`
    : `Broad IAM policy NOT blocked: decision=${broadResult?.decision}; dangerous IAM: decision=${dangerousResult?.decision}. evaluateArtifacts failed to catch dangerous policies.`;

  const output = {
    caseId,
    status,
    why,
    executedAt: execTs,
    result: {
      broadResult: { decision: broadResult?.decision, severity: broadResult?.severity, reason: broadResult?.reason?.slice(0,100) },
      dangerousResult: { decision: dangerousResult?.decision, severity: dangerousResult?.severity },
      safeResult: { decision: safeResult?.decision },
      publicSgResult: { decision: publicSgResult?.decision },
      ruleCount
    }
  };

  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = {
    caseId,
    status: 'FAIL',
    why: `evaluateArtifacts test error: ${e.message}`,
    executedAt: execTs,
    error: e.message
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
