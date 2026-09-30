
import { classifyHcloudArgs, redactSecrets, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, loadRiskRules } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand, createApprovalToken, consumeApprovalToken } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const results = {};

// D4-1: Credential file read blocked
try {
  const r = evaluateCommandRisk('cat ~/.hcloud/credentials.json');
  results['D4-1'] = { status: r.decision === 'deny' ? 'PASS' : 'FAIL', why: `decision=${r.decision}, findings=${r.findings?.length||0}` };
} catch(e) { results['D4-1'] = { status: 'BLOCKED', why: e.message }; }

// D4-2: Credential env print blocked
try {
  const r = evaluateCommandRisk('printenv HW_SECRET_ACCESS_KEY');
  results['D4-2'] = { status: r.decision === 'deny' ? 'PASS' : 'FAIL', why: `decision=${r.decision}` };
} catch(e) { results['D4-2'] = { status: 'BLOCKED', why: e.message }; }

// D4-3: Plaintext secret API blocked
try {
  const r = evaluateCommandRisk('type %USERPROFILE%\\.hcloud\\credentials.json');
  results['D4-3'] = { status: r.decision === 'deny' ? 'PASS' : 'FAIL', why: `decision=${r.decision}` };
} catch(e) { results['D4-3'] = { status: 'BLOCKED', why: e.message }; }

// D4-5: Write operation not misclassified as read-only
try {
  const w = classifyHcloudArgs(['ECS', 'DeleteServer', '--server_id=test']);
  results['D4-5'] = { status: (w.decision === 'deny' || w.decision === 'write') && w.risk === 'write' ? 'PASS' : 'FAIL', why: `decision=${w.decision}, risk=${w.risk}` };
} catch(e) { results['D4-5'] = { status: 'BLOCKED', why: e.message }; }

// D4-9: Public exposure / destructive pre-check
try {
  const destructive = classifyHcloudArgs(['ECS', 'DeleteServer', '--server_id=test']);
  results['D4-9'] = { status: destructive.decision === 'deny' ? 'PASS' : 'FAIL', why: `DeleteServer decision=${destructive.decision}` };
} catch(e) { results['D4-9'] = { status: 'BLOCKED', why: e.message }; }

// D4-15: Hook bypass attempts
try {
  const variants = [
    ['ecs', 'DeleteServer', '--server_id=test'],
    ['ECS', 'deleteServer', '--server_id=test'],
    ['ECS', 'DELETEserver', '--server_id=test'],
  ];
  let allBlocked = true;
  const details = [];
  for (const args of variants) {
    const r = classifyHcloudArgs(args);
    details.push(`${args.join(' ')}=>${r.decision}/${r.risk}`);
    if (r.decision !== 'deny' && r.risk !== 'write') allBlocked = false;
  }
  results['D4-15'] = { status: allBlocked ? 'PASS' : 'FAIL', why: details.join('; ') };
} catch(e) { results['D4-15'] = { status: 'BLOCKED', why: e.message }; }

// D4-16: Command wrapping penetration
try {
  const wrapped = evaluateCommandRisk('bash -c "hcloud ECS DeleteServer"');
  const wrapped2 = evaluateCommandRisk('sh -c "cat ~/.hcloud/credentials.json"');
  results['D4-16'] = { status: wrapped.decision === 'deny' || wrapped2.decision === 'deny' ? 'PASS' : 'FAIL', why: `bash-c=>${wrapped.decision}; sh-c=>${wrapped2.decision}` };
} catch(e) { results['D4-16'] = { status: 'BLOCKED', why: e.message }; }

// D4-21: hook_check_artifacts - broad IAM policy
try {
  const artifact = evaluateArtifacts([{
    path: 'policy.json',
    content: JSON.stringify({ Statement: [{ Effect: 'Allow', Action: ['*'], Resource: ['*'] }] })
  }]);
  results['D4-21'] = { status: artifact.decision === 'deny' ? 'PASS' : 'FAIL', why: `decision=${artifact.decision}, rule=${artifact.findings?.[0]?.ruleId||'none'}` };
} catch(e) { results['D4-21'] = { status: 'BLOCKED', why: e.message }; }

// D4-22: hook_check_deploy_plan - public FunctionGraph
try {
  const plan = evaluateDeployPlan(JSON.stringify({
    service: 'FunctionGraph', trigger: { type: 'APIG', auth: 'NONE', public: true }
  }));
  results['D4-22'] = { status: plan.decision === 'deny' || plan.decision === 'warn' ? 'PASS' : 'FAIL', why: `decision=${plan.decision}, rule=${plan.findings?.[0]?.ruleId||'none'}` };
} catch(e) { results['D4-22'] = { status: 'BLOCKED', why: e.message }; }

// D4-28: Node safety hook chain
try {
  let credDecision = 'unknown';
  try {
    const credCmd = classifyTextCommand('cat ~/.hcloud/credentials.json');
    credDecision = credCmd.decision;
  } catch(e1) {
    const r = evaluateCommandRisk('cat ~/.hcloud/credentials.json');
    credDecision = r.decision;
  }
  const safeR = evaluateCommandRisk('ls -la');
  results['D4-28'] = { status: credDecision === 'deny' ? 'PASS' : 'FAIL', why: `cred decision=${credDecision}, safe decision=${safeR.decision}` };
} catch(e) { results['D4-28'] = { status: 'BLOCKED', why: e.message }; }

// D2-4: Credential redaction
try {
  const redacted = redactSecrets({ access_key: 'AKIDtest123456', secret_key: 'SKtest789012', region: 'cn-north-4', security_token: 'STStoken456' });
  const hasPlaintext = JSON.stringify(redacted).includes('AKIDtest') || JSON.stringify(redacted).includes('SKtest') || JSON.stringify(redacted).includes('STStoken');
  results['D2-4'] = { status: !hasPlaintext ? 'PASS' : 'FAIL', why: `redacted=${JSON.stringify(redacted)}` };
} catch(e) { results['D2-4'] = { status: 'BLOCKED', why: e.message }; }

// D10-4: Safety intervention - static rule layer
try {
  const rules = loadRiskRules();
  const denyCount = rules.filter(r => r.severity === 'deny').length;
  const warnCount = rules.filter(r => r.severity === 'warn').length;
  const credRisk = evaluateCommandRisk('cat ~/.hcloud/credentials.json');
  const readonlyCmd = classifyHcloudArgs(['ECS', 'ListServers']);
  results['D10-4'] = { 
    status: denyCount >= 9 && warnCount >= 7 && credRisk.decision === 'deny' && readonlyCmd.decision === 'allow' ? 'PASS' : 'FAIL',
    why: `deny=${denyCount}, warn=${warnCount}, total=${rules.length}, credRisk=${credRisk.decision}, readonly=${readonlyCmd.decision}` 
  };
} catch(e) { results['D10-4'] = { status: 'BLOCKED', why: e.message }; }

// D4-18: confirm-not-deny approval semantics
try {
  const plan = planHcloudCommand(['ECS', 'DeleteServer', '--server_id=test']);
  const hasToken = plan.approvalToken ? true : false;
  const notAllowed = plan.safeToRun === false;
  const approved = planHcloudCommand(['ECS', 'DeleteServer', '--server_id=test'], { allowWrites: true });
  results['D4-18'] = { 
    status: hasToken && notAllowed && approved.classification.decision === 'allow' ? 'PASS' : 'FAIL',
    why: `no-approval: decision=${plan.classification.decision}, token=${hasToken}, safe=${plan.safeToRun}; with-approval: ${approved.classification.decision}` 
  };
} catch(e) { results['D4-18'] = { status: 'BLOCKED', why: e.message }; }

// D4-19: Preflight still effective during confirmation
try {
  const dangerous = planHcloudCommand(['VPC', 'CreateSecurityGroupRule', '--direction=ingress', '--port_range_min=22', '--protocol=tcp', '--remote_ip_prefix=0.0.0.0/0'], { allowWrites: true });
  results['D4-19'] = { 
    status: dangerous.classification.decision === 'deny' ? 'PASS' : 'FAIL',
    why: `dangerous with approval: decision=${dangerous.classification.decision}, blockedByRiskRule=${dangerous.classification.blockedByRiskRule}` 
  };
} catch(e) { results['D4-19'] = { status: 'BLOCKED', why: e.message }; }

// D4-20: Approval token single-use
try {
  const token = createApprovalToken(['ECS', 'DeleteServer', '--server_id=test']);
  const c1 = consumeApprovalToken(token);
  const c2 = consumeApprovalToken(token);
  results['D4-20'] = { status: c1 && !c2 ? 'PASS' : 'FAIL', why: `first=${!!c1}, second=${!!c2}` };
} catch(e) { results['D4-20'] = { status: 'BLOCKED', why: e.message }; }

// D4-23: Global rules injection
try {
  const rulesPath = join(process.cwd(), 'plugins', 'huaweicloud-core', 'safety', 'policy.json');
  const policy = JSON.parse(readFileSync(rulesPath, 'utf8'));
  results['D4-23'] = { 
    status: policy.blockedOperations?.length > 0 && policy.writePrefixes?.length > 0 ? 'PASS' : 'FAIL',
    why: `blockedOps=${policy.blockedOperations?.length||0}, writePrefixes=${policy.writePrefixes?.length||0}` 
  };
} catch(e) { results['D4-23'] = { status: 'BLOCKED', why: e.message }; }

// Output
console.log(JSON.stringify(results, null, 2));
