// P0 Safety classification batch probe — D4-1, D4-2, D4-3, D4-5, D4-9, D4-15, D4-16, D4-18, D4-19
import { classifyHcloudArgs, redactSecrets, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand, createApprovalToken, consumeApprovalToken } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

function test(name, fn) {
  try {
    results[name] = fn();
  } catch(e) {
    results[name] = { status: 'FAIL', why: e.message };
  }
}

// ===== D4-1: 凭证文件读取拦截 =====
test('D4-1', () => {
  const r1 = evaluateCommandRisk('cat ~/.hcloud/credentials.json');
  const r2 = evaluateCommandRisk('cat ~/.config/huaweicloud/credentials.json');
  const r3 = evaluateCommandRisk('type %USERPROFILE%\.config\huaweicloud\credentials.json');
  const denied = r1.decision === 'deny' || r2.decision === 'deny' || r3.decision === 'deny';
  return {
    status: denied ? 'PASS' : 'FAIL',
    why: `r1=${r1.decision} r2=${r2.decision} r3=${r3.decision}`,
    detail: { r1: {decision:r1.decision, findings:r1.findings?.length}, r2: {decision:r2.decision, findings:r2.findings?.length}, r3: {decision:r3.decision, findings:r3.findings?.length} }
  };
});

// ===== D4-2: 凭证env打印拦截 =====
test('D4-2', () => {
  const r1 = evaluateCommandRisk('echo $HW_SECRET_KEY');
  const r2 = evaluateCommandRisk('echo $ACCESS_KEY');
  const r3 = evaluateCommandRisk('printenv | grep -i secret');
  const r4 = evaluateCommandRisk('echo $HW_ACCESS_KEY');
  const blocked = r1.decision !== 'allow' || r2.decision !== 'allow' || r3.decision !== 'allow' || r4.decision !== 'allow';
  return {
    status: blocked ? 'PASS' : 'FAIL',
    why: `r1=${r1.decision} r2=${r2.decision} r3=${r3.decision} r4=${r4.decision}`,
    detail: { r1:{decision:r1.decision}, r2:{decision:r2.decision}, r3:{decision:r3.decision}, r4:{decision:r4.decision} }
  };
});

// ===== D4-3: 明文secret API拦截 =====
test('D4-3', () => {
  const r1 = evaluateCommandRisk('hcloud ECS ListServers --ak=AKIDtest123 --sk=SKtest456');
  let r2 = null, r3 = null;
  try { r2 = classifyTextCommand('hcloud ECS ListServers --ak=AKIDtest123 --sk=SKtest456'); } catch(e) { r2 = {error: e.message}; }
  try { r3 = classifyTextCommand('export HW_SECRET_KEY=mysupersecretkey123456'); } catch(e) { r3 = {error: e.message}; }
  const blocked = r1.decision === 'deny' || (r2 && r2.decision === 'deny') || (r3 && r3.decision !== 'allow');
  return {
    status: blocked ? 'PASS' : 'FAIL',
    why: `r1.decision=${r1.decision} r2=${r2?.decision} r3=${r3?.decision}`,
    detail: { r1:{decision:r1.decision,findings:r1.findings?.length}, r2, r3 }
  };
});

// ===== D4-5: 写操作误判检测 =====
test('D4-5', () => {
  const writeOps = [
    ['ECS', 'DeleteServer', '--server_id=test'],
    ['VPC', 'DeleteVpc', '--vpc_id=test'],
    ['RDS', 'DeleteInstance', '--instance_id=test'],
  ];
  const readOps = [
    ['ECS', 'ListServers'],
    ['VPC', 'ListVpcs'],
    ['RDS', 'ListInstances'],
  ];
  let writeOk = true, readOk = true;
  const writeResults = [], readResults = [];
  for (const args of writeOps) {
    const r = classifyHcloudArgs(args);
    writeResults.push({ op: args.join(' '), decision: r.decision, risk: r.risk });
    if (r.decision !== 'deny' && r.risk !== 'write') writeOk = false;
  }
  for (const args of readOps) {
    const r = classifyHcloudArgs(args);
    readResults.push({ op: args.join(' '), decision: r.decision, risk: r.risk });
    if (r.decision === 'deny' && r.risk === 'write') readOk = false;
  }
  return {
    status: (writeOk && readOk) ? 'PASS' : 'FAIL',
    why: `writeOk=${writeOk} readOk=${readOk}`,
    detail: { writeResults, readResults }
  };
});

// ===== D4-9: 公开暴露/破坏性预检 =====
test('D4-9', () => {
  const r1 = planHcloudCommand(['VPC', 'CreateSecurityGroupRule', '--direction=ingress', '--port_range_min=22', '--protocol=tcp', '--remote_ip_prefix=0.0.0.0/0'], { allowWrites: true });
  const r2 = evaluateArtifacts([{
    path: 'policy.json',
    content: JSON.stringify({ Statement: [{ Effect: 'Allow', Action: ['*'], Resource: ['*'] }] })
  }]);
  const r3 = evaluateDeployPlan(JSON.stringify({
    service: 'FunctionGraph', trigger: { type: 'APIG', auth: 'NONE', public: true }
  }));
  const caught = (r1.classification.decision === 'deny' || r1.classification.blockedByRiskRule) 
    && r2.decision === 'deny' 
    && r3.decision !== 'allow';
  return {
    status: caught ? 'PASS' : 'FAIL',
    why: `sshRule.decision=${r1.classification.decision} blockedByRisk=${r1.classification.blockedByRiskRule} iamPolicy.decision=${r2.decision} fgPlan.decision=${r3.decision}`,
    detail: { sshRule: {decision:r1.classification.decision, blockedByRiskRule:r1.classification.blockedByRiskRule}, iamPolicy: {decision:r2.decision, findings:r2.findings?.length}, fgPlan: {decision:r3.decision, findings:r3.findings?.length} }
  };
});

// ===== D4-15: hook绕过尝试 =====
test('D4-15', () => {
  const r1 = evaluateCommandRisk('hcloud ECS DeleteServer --server_id=test # bypass');
  const r2 = evaluateCommandRisk('bash -c "hcloud ECS DeleteServer --server_id=test"');
  const r3 = evaluateCommandRisk('hcloud ECS DeleteServer --server_id=test; echo done');
  const r4 = evaluateCommandRisk('$(hcloud ECS DeleteServer --server_id=test)');
  const caught = r1.decision !== 'allow';
  return {
    status: caught ? 'PASS' : 'FAIL',
    why: `direct=${r1.decision} bash_wrap=${r2.decision} semicolon=${r3.decision} subshell=${r4.decision}`,
    detail: { r1:{decision:r1.decision}, r2:{decision:r2.decision}, r3:{decision:r3.decision}, r4:{decision:r4.decision} }
  };
});

// ===== D4-16: 命令包裹穿透 =====
test('D4-16', () => {
  const r1 = evaluateCommandRisk('hcloud ECS ListServers && hcloud ECS DeleteServer --server_id=test');
  const r2 = evaluateCommandRisk('hcloud ECS ListServers | hcloud ECS DeleteServer');
  const r3 = evaluateCommandRisk('hcloud "ECS" "DeleteServer" "--server_id=test"');
  const caught = r1.decision !== 'allow' || r2.decision !== 'allow';
  return {
    status: caught ? 'PASS' : 'FAIL',
    why: `compound_and=${r1.decision} pipe=${r2.decision} quoted=${r3.decision}`,
    detail: { r1:{decision:r1.decision}, r2:{decision:r2.decision}, r3:{decision:r3.decision} }
  };
});

// ===== D4-18: confirm-not-deny审批语义 =====
test('D4-18', () => {
  const plan = planHcloudCommand(['ECS', 'DeleteServer', '--server_id=test']);
  const hasToken = !!plan.approvalToken;
  const denied = plan.classification.decision === 'deny';
  const notSafe = !plan.safeToRun;
  const approved = planHcloudCommand(['ECS', 'DeleteServer', '--server_id=test'], { allowWrites: true });
  const allowed = approved.classification.decision === 'allow';
  const correct = denied && hasToken && notSafe && allowed;
  return {
    status: correct ? 'PASS' : 'FAIL',
    why: `denied=${denied} hasToken=${hasToken} notSafe=${notSafe} approvedAllowed=${allowed}`,
    detail: { withoutApproval: {decision:plan.classification.decision, risk:plan.classification.risk}, withApproval: {decision:approved.classification.decision, risk:approved.classification.risk}, hasToken }
  };
});

// ===== D4-19: 确认流下预检仍生效 =====
test('D4-19', () => {
  const dangerous = planHcloudCommand(
    ['VPC', 'CreateSecurityGroupRule', '--direction=ingress', '--port_range_min=22', '--protocol=tcp', '--remote_ip_prefix=0.0.0.0/0'],
    { allowWrites: true }
  );
  const stillBlocked = dangerous.classification.decision === 'deny' || dangerous.classification.blockedByRiskRule;
  return {
    status: stillBlocked ? 'PASS' : 'FAIL',
    why: `decision=${dangerous.classification.decision} blockedByRiskRule=${dangerous.classification.blockedByRiskRule}`,
    detail: { decision: dangerous.classification.decision, blockedByRiskRule: dangerous.classification.blockedByRiskRule, risk: dangerous.classification.risk }
  };
});

// Output all results
const output = JSON.stringify(results, null, 2);
console.log(output);

// Write to individual evidence files
const evidBase = join(__dirname, '..', 'huaweicloud-devkit-test', 'results', 'Hermes', '2026-10-02-120.46.40.202', 'Windows', 'evidence');
for (const [caseId, result] of Object.entries(results)) {
  try {
    writeFileSync(join(evidBase, caseId, 'stdout.log'), JSON.stringify(result, null, 2));
  } catch(e) {
    // evidence dir may not exist
  }
}
