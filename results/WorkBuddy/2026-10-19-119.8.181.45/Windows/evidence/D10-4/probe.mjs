// Real probe for D10-4
// Real execution: 20261019050816
// Calls real functions and asserts on real return fields.
import { writeFileSync } from 'node:fs';
import { loadRiskRules, evaluateCommandRisk } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const catalog = loadRiskRules();
const denyCount = catalog.rules.filter(r => r.severity === 'deny').length;
const warnCount = catalog.rules.filter(r => r.severity === 'warn').length;
const denyCmd = evaluateCommandRisk('cat ~/.hcloud/credentials.json');
const allowCmd = evaluateCommandRisk('hcloud ECS listServers --region cn-north-4');
const status = (denyCount === 9 && denyCmd.decision === 'deny' && allowCmd.decision === 'allow') ? 'PASS' : 'SPEC-MISMATCH';
const output = { caseId: 'D10-4', status, why: 'deny=' + denyCount + ' warn=' + warnCount, executedAt: '20261019050816', result: { denyCount, warnCount, denyCmdDecision: denyCmd.decision, allowCmdDecision: allowCmd.decision } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

