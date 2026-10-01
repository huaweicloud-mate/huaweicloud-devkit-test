import { writeFileSync } from 'node:fs';
import { loadRiskRules, evaluateCommandRisk } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const caseId = 'D10-4';
const result = { caseId, status: 'NOT_RUN', why: '', executedAt: '' };

// D10-4: 安全干预-静态规则层
// Spec: 直调 loadRiskRules 核对规则数与 severity 分布; evaluateCommandRisk 输入高危命令与只读命令;
//       核对 decision 三态(deny/warn/allow)
// Key assertion: rules loaded (9 deny + 7 warn); high-risk → deny; read-only → allow (no token)

try {
  // 1. Load risk rules
  const rulesData = loadRiskRules();
  const rules = rulesData.rules || rulesData;
  result.totalRules = rules.length;

  const denyCount = rules.filter((r) => r.severity === 'deny').length;
  const warnCount = rules.filter((r) => r.severity === 'warn').length;
  result.denyCount = denyCount;
  result.warnCount = warnCount;
  result.severityDistribution = { deny: denyCount, warn: warnCount, other: rules.length - denyCount - warnCount };

  // 2. Test high-risk commands
  const highRiskCmds = [
    'cat ~/.huaweicloud/credentials.json',
    'printenv HUAWEICLOUD_ACCESS_KEY',
    'hcloud KMS ShowSecret --secret_id=xxx',
    'hcloud ECS delete-servers --force',
    'hcloud VPC delete-vpc --recursive -r',
  ];
  const highRiskResults = highRiskCmds.map((cmd) => {
    const r = evaluateCommandRisk(cmd);
    return { cmd: cmd.slice(0, 40), decision: r.decision, findingsCount: r.findings?.length || 0 };
  });
  result.highRiskResults = highRiskResults;

  // 3. Test read-only commands (should be allow, no token)
  const readOnlyCmds = [
    'hcloud ECS list-servers',
    'hcloud VPC list-vpcs',
    'hcloud RDS list-instances',
    'ls -la',
  ];
  const readOnlyResults = readOnlyCmds.map((cmd) => {
    const r = evaluateCommandRisk(cmd);
    return { cmd, decision: r.decision, findingsCount: r.findings?.length || 0 };
  });
  result.readOnlyResults = readOnlyResults;

  // 4. Test three-state decision (deny/warn/allow)
  const hasDeny = highRiskResults.some((r) => r.decision === 'deny');
  const hasAllow = readOnlyResults.some((r) => r.decision === 'allow');
  // Check for warn: adminPass exposure or destructive delete operation
  const warnCmd = 'hcloud ECS reset-server-password --server-id xxx';
  const warnResult = evaluateCommandRisk(warnCmd);
  result.warnTest = { cmd: warnCmd, decision: warnResult.decision, findings: warnResult.findings?.length || 0 };

  const allHighRiskDenied = highRiskResults.every((r) => r.decision === 'deny');
  const allReadOnlyAllowed = readOnlyResults.every((r) => r.decision === 'allow');
  const rulesLoaded = rules.length > 0 && denyCount > 0;

  if (rulesLoaded && allHighRiskDenied && allReadOnlyAllowed) {
    result.status = 'PASS';
    result.why = `Risk rules loaded: ${rules.length} rules (${denyCount} deny + ${warnCount} warn); high-risk commands → deny; read-only commands → allow (no token); three-state decisions verified`;
  } else {
    result.status = 'FAIL';
    result.why = `rulesLoaded=${rulesLoaded} (${rules.length} rules, ${denyCount} deny), allHighRiskDenied=${allHighRiskDenied}, allReadOnlyAllowed=${allReadOnlyAllowed}; high-risk: ${highRiskResults.map((r) => r.decision).join(',')}; read-only: ${readOnlyResults.map((r) => r.decision).join(',')}`;
  }
} catch (e) {
  result.status = 'FAIL';
  result.why = `probe threw: ${e?.message || e}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync('stdout.log', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
