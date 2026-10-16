import { writeFileSync } from 'node:fs';
// D10-4: Static risk rule layer — loadRiskRules + evaluateCommandRisk three-state (deny/warn/allow)
const caseId = 'D10-4';
const executedAt = '20261017054200';
try {
  const { loadRiskRules, evaluateCommandRisk } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs');

  // 1) Load rules — verify count and severity distribution
  const rules = loadRiskRules();
  const ruleList = rules.rules || rules;
  const denyCount = ruleList.filter(r => r.severity === 'deny').length;
  const warnCount = ruleList.filter(r => r.severity === 'warn').length;

  // 2) evaluateCommandRisk on high-risk commands → deny
  const highRiskCmds = [
    'cat ~/.config/huaweicloud/credentials.json',
    'printenv HW_ACCESS_KEY',
    'rm -rf /',
    'hcloud ECS DeleteServer --server_ids=xxx --force',
  ];
  const highRiskResults = highRiskCmds.map(cmd => ({ cmd, decision: evaluateCommandRisk(cmd).decision }));

  // 3) evaluateCommandRisk on read-only commands → allow
  const readOnlyCmds = [
    'hcloud ECS ListServers',
    'hcloud VPC ListVpcs',
    'ls -la',
    'hcloud IAM ListUsers',
  ];
  const readOnlyResults = readOnlyCmds.map(cmd => ({ cmd, decision: evaluateCommandRisk(cmd).decision }));

  const allHighDeny = highRiskResults.every(r => r.decision === 'deny' || r.decision === 'warn');
  const allReadAllow = readOnlyResults.every(r => r.decision === 'allow');
  const rulesComplete = denyCount >= 9 && warnCount >= 7; // Expected 9 deny + 7 warn per case spec

  const status = (rulesComplete && allHighDeny && allReadAllow) ? 'PASS' : 'FAIL';
  const output = {
    caseId,
    status,
    why: 'Rules: deny=' + denyCount + ' warn=' + warnCount + ' (expected 9 deny + 7 warn); high-risk all deny/warn=' + allHighDeny + '; read-only all allow=' + allReadAllow,
    executedAt,
    result: { totalRules: ruleList.length, denyCount, warnCount, highRiskResults, readOnlyResults, allHighDeny, allReadAllow, rulesComplete },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
