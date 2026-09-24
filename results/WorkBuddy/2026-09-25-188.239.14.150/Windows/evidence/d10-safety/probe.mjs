/**
 * WorkBuddy daily test probe - D10-4 safety rule engine (static rule layer)
 * Covers: D10-4 loadRiskRules + evaluateCommandRisk decision three-state
 */
import {
  loadRiskRules, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan,
} from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const evDir = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/results/WorkBuddy/2026-09-25-188.239.14.150/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,120), expected: String(expected).substring(0,120), passMsg, failMsg });
}

// D10-4: ① loadRiskRules - rule count + severity distribution
const rules = loadRiskRules();
const ruleList = rules.rules || [];
test('D10-4', 'rules-count', ruleList.length === 16, ruleList.length, 16, `${ruleList.length} rules loaded`, `rules count ${ruleList.length} != 16`);

const denyCount = ruleList.filter(r => r.severity === 'deny').length;
const warnCount = ruleList.filter(r => r.severity === 'warn').length;
test('D10-4', 'deny-count', denyCount === 9, denyCount, 9, `${denyCount} deny rules`, `deny rules ${denyCount} != 9`);
test('D10-4', 'warn-count', warnCount === 7, warnCount, 7, `${warnCount} warn rules`, `warn rules ${warnCount} != 7`);

// D10-4: ② evaluateCommandRisk - high-risk commands should deny
const credFileResult = evaluateCommandRisk('cat ~/.config/huaweicloud/credentials.json');
test('D10-4', 'cred-file-deny', credFileResult.decision === 'deny', credFileResult.decision, 'deny', 'credential file read denied', 'credential file not denied');

const envDumpResult = evaluateCommandRisk('printenv HUAWEICLOUD_ACCESS_KEY_ID');
test('D10-4', 'env-dump-deny', envDumpResult.decision === 'deny', envDumpResult.decision, 'deny', 'env dump denied', 'env dump not denied');

const delResult = evaluateCommandRisk('hcloud ECS DeleteServers --server-ids test --force');
test('D10-4', 'delete-deny', delResult.decision === 'deny' || delResult.decision === 'warn', delResult.decision, 'deny/warn', 'destructive delete detected', 'destructive delete not detected');

// D10-4: ③ readonly commands should allow
const listResult = evaluateCommandRisk('hcloud ECS ListServers');
test('D10-4', 'list-allow', listResult.decision === 'allow', listResult.decision, 'allow', 'readonly allowed', 'readonly denied');

const showResult = evaluateCommandRisk('hcloud ECS ShowServer --server-id test');
test('D10-4', 'show-allow', showResult.decision === 'allow', showResult.decision, 'allow', 'show readonly allowed', 'show readonly denied');

// D10-4: no token in output (evidence redaction)
const credFindings = JSON.stringify(credFileResult);
test('D10-4', 'no-token-leak', !/AKID[A-Z0-9]{10,}|SK[A-Z0-9]{10,}/.test(credFindings), 'clean', 'clean', 'no token in risk output', 'token leaked in risk output');

// D10-4: three-state (deny/warn/allow)
const warnResult = evaluateCommandRisk('hcloud VPC DeleteSecurityGroupRule --security-group-rule-id test');
test('D10-4', 'three-state-warn', warnResult.decision === 'deny' || warnResult.decision === 'warn', warnResult.decision, 'deny/warn', 'warn-level detected', 'warn-level missed');

// D10-4: evaluateArtifacts + evaluateDeployPlan also work
const artRes = evaluateArtifacts([{ path: 'policy.json', content: '{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}' }]);
test('D10-4', 'artifacts-eval', artRes !== null && typeof artRes === 'object', typeof artRes, 'object', 'artifacts evaluated', 'artifacts eval failed');

const depRes = evaluateDeployPlan({ action: 'create', resource: 'ecs', config: { publicIp: true, securityGroups: ['0.0.0.0/0'] } });
test('D10-4', 'deploy-plan-eval', depRes !== null && typeof depRes === 'object', typeof depRes, 'object', 'deploy plan evaluated', 'deploy plan eval failed');

const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(join(evDir, 'd10-safety', 'stdout.log'), output, 'utf8');
console.log(output);
