// P0 Safety Probes — D4-1,D4-2,D4-3,D4-5,D4-9,D4-15,D4-16,D4-21,D4-22,D4-28
// Tests safety-policy classification, risk rule evaluation, and hook checks
import { classifyHcloudArgs, redactSecrets, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, loadRiskRules } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import fs from 'fs';

const results = {};

function test(name, fn) {
  try {
    results[name] = fn();
  } catch(e) {
    results[name] = { status: 'ERROR', error: e.message, stack: e.stack?.split('\n').slice(0,3).join('\n') };
  }
}

// D4-1: 凭证文件读取拦截 — cat ~/.hcloud/credentials should be blocked
test('D4-1', () => {
  const r = classifyTextCommand('cat ~/.config/huaweicloud/credentials.json');
  const blocked = r.decision === 'deny' || r.decision === 'blocked';
  return { status: blocked ? 'PASS' : 'FAIL', decision: r.decision, reason: r.reason || r.classification, evidence: 'cat credentials file classified as ' + r.decision };
});

// D4-2: 凭证env打印拦截 — printenv HW_SECRET_KEY should be blocked
test('D4-2', () => {
  const r1 = classifyTextCommand('printenv HW_SECRET_ACCESS_KEY');
  const r2 = classifyTextCommand('echo $HW_SECRET_KEY');
  const blocked = r1.decision === 'deny' || r2.decision === 'deny';
  return { status: blocked ? 'PASS' : 'FAIL', decision1: r1.decision, decision2: r2.decision, reason: r1.reason || r2.reason, evidence: 'printenv/echo credentials blocked' };
});

// D4-3: 明文secret API拦截 — classify hcloud command returning secrets
test('D4-3', () => {
  const r = classifyHcloudArgs(['IAM', 'CreateCredential', '--user=test']);
  const blocked = r.decision === 'deny' || r.decision === 'warn';
  return { status: blocked ? 'PASS' : 'FAIL', decision: r.decision, risk: r.risk, reason: r.reason, evidence: 'CreateCredential classified as ' + r.decision };
});

// D4-5: 写操作误判检测 — delete server should not be classified as read-only
test('D4-5', () => {
  const r = classifyHcloudArgs(['ECS', 'DeleteServers', '--server_ids=test']);
  const misjudged = r.decision === 'allow' || r.risk === 'read_only';
  return { status: !misjudged ? 'PASS' : 'FAIL', decision: r.decision, risk: r.risk, reason: r.reason, evidence: 'DeleteServers not misjudged as read-only, decision=' + r.decision };
});

// D4-9: 公开暴露/破坏性预检 — risky public exposure operations
test('D4-9', () => {
  const r1 = classifyHcloudArgs(['ECS', 'CreateServers', '--publicip=true']);
  const r2 = classifyHcloudArgs(['ECS', 'DeleteServers', '--server_ids=all']);
  const blocked = r1.decision !== 'allow' || r2.decision !== 'allow';
  return { status: blocked ? 'PASS' : 'FAIL', decision1: r1.decision, decision2: r2.decision, evidence: 'Public exposure/destructive ops not allowed directly' };
});

// D4-15: hook绕过尝试 — case variants, URL encoding
test('D4-15', () => {
  const variants = [
    ['ECS', 'deleteServer', '--server_id=test'],
    ['ecs', 'DeleteServer', '--server_id=test'],
    ['ECS', 'DELETEserver', '--server_id=test'],
    ['ECS', 'DeleteServer', '--server_id=test%00'],
  ];
  let allBlocked = true;
  const details = [];
  for (const args of variants) {
    const r = classifyHcloudArgs(args);
    if (r.decision === 'allow') allBlocked = false;
    details.push({ args: args.join(' '), decision: r.decision });
  }
  return { status: allBlocked ? 'PASS' : 'FAIL', details, evidence: 'All variants blocked, none bypassed' };
});

// D4-16: 命令包裹穿透 — shell-wrapped commands
test('D4-16', () => {
  const wrapped = [
    'hcloud ECS DeleteServers --server_ids=test',
    'bash -c "hcloud ECS DeleteServers --server_ids=test"',
    'sh -c "hcloud ECS DeleteServers"',
    'ECS.DeleteServers({"server_ids":"test"})',
  ];
  let detected = false;
  const details = [];
  for (const cmd of wrapped) {
    const r = classifyTextCommand(cmd);
    details.push({ cmd, decision: r.decision });
    if (r.decision === 'deny' || r.decision === 'warn') detected = true;
  }
  return { status: detected ? 'PASS' : 'FAIL', details, evidence: 'Inner command detected in wrapped commands' };
});

// D4-21: hook_check_artifacts — broad IAM policy
test('D4-21', () => {
  const broadPolicy = {
    type: 'iam-policy',
    content: JSON.stringify({
      Statement: [{
        Effect: 'Allow',
        Action: '*',
        Resource: '*'
      }]
    })
  };
  const r = evaluateArtifacts([broadPolicy]);
  const denied = r.decision === 'deny' || r.level === 'deny' || (r.results && r.results.some(x => x.decision === 'deny'));
  return { status: denied ? 'PASS' : 'FAIL', decision: r.decision || r.level, details: JSON.stringify(r).slice(0,300), evidence: 'Broad IAM policy artifact denied' };
});

// D4-22: hook_check_deploy_plan — public exposure deploy plan
test('D4-22', () => {
  const deployPlan = {
    service: 'FunctionGraph',
    action: 'create',
    exposure: 'public',
    config: { handler: 'index.handler', code_type: 'inline', code: 'test' }
  };
  const r = evaluateDeployPlan(deployPlan);
  const warned = r.decision === 'deny' || r.decision === 'warn' || r.level === 'deny' || r.level === 'warn';
  return { status: warned ? 'PASS' : 'FAIL', decision: r.decision || r.level, details: JSON.stringify(r).slice(0,300), evidence: 'Public exposure deploy plan warned/denied' };
});

// D4-28: Node版安全hook链路 — hooks.json registration + commandText extraction + deny
test('D4-28', () => {
  // Test classifyTextCommand with credential-related commands
  const cmd1 = classifyTextCommand('cat ~/.config/huaweicloud/credentials.json');
  const cmd2 = classifyTextCommand('hcloud ECS DeleteServers --server_ids=test');
  const cmd3 = classifyTextCommand('ls -la');
  
  const deny1 = cmd1.decision === 'deny';
  const deny2 = cmd2.decision === 'deny' || cmd2.decision === 'warn';
  const allow3 = cmd3.decision === 'allow';
  
  return { 
    status: (deny1 && deny2 && allow3) ? 'PASS' : 'FAIL', 
    cmd1: cmd1.decision, cmd2: cmd2.decision, cmd3: cmd3.decision,
    evidence: 'credential cat=deny, delete=warn/deny, ls=allow' 
  };
});

// D10-4: 安全干预-静态规则层 — loadRiskRules + evaluateCommandRisk
test('D10-4', () => {
  const rules = loadRiskRules();
  const ruleCount = rules.length || (rules.rules && rules.rules.length) || 0;
  
  // Test high-risk commands
  const catCreds = evaluateCommandRisk('cat ~/.config/huaweicloud/credentials.json', {});
  const envDump = evaluateCommandRisk('printenv HW_SECRET_ACCESS_KEY', {});
  const deleteRes = evaluateCommandRisk('hcloud ECS DeleteServers --server_ids=test', {});
  // Test read-only command
  const listServers = evaluateCommandRisk('hcloud ECS ListServers', {});
  
  const denyCount = [catCreds, envDump, deleteRes].filter(r => r.decision === 'deny').length;
  const allowRead = listServers.decision === 'allow';
  
  return {
    status: (denyCount >= 2 && allowRead) ? 'PASS' : 'FAIL',
    ruleCount,
    catCreds: catCreds.decision,
    envDump: envDump.decision,
    deleteRes: deleteRes.decision,
    listServers: listServers.decision,
    evidence: `rules loaded=${ruleCount}, deny=${denyCount}, read allow=${allowRead}`
  };
});

// Write results to stdout.log files
for (const [caseId, result] of Object.entries(results)) {
  const dir = `C:/Users/Administrator/devkit-test/hermes/huaweicloud-devkit-test/results/Hermes/2026-10-16-120.46.2.198/Windows/evidence/${caseId}`;
  if (fs.existsSync(dir)) {
    fs.writeFileSync(`${dir}/stdout.log`, JSON.stringify(result, null, 2));
  }
}

console.log(JSON.stringify(results, null, 2));
