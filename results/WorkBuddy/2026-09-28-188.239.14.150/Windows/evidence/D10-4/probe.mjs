import { loadRiskRules, evaluateCommandRisk } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).substring(0,200), expected: String(expected).substring(0,120) });
}

// D10-4: 安全干预-静态规则层
// 1. loadRiskRules - 规则库完整加载
const rulesObj = loadRiskRules();
const rules = Array.isArray(rulesObj) ? rulesObj : (rulesObj.rules || []);
const ruleCount = rules.length;
test('D10-4', 'rules-loaded', ruleCount > 0, `${ruleCount} rules`, '>0');

const denyRules = rules.filter(r => r.severity === 'deny' || r.decision === 'deny');
const warnRules = rules.filter(r => r.severity === 'warn' || r.decision === 'warn');
test('D10-4', 'deny-rules', denyRules.length >= 9, `${denyRules.length} deny rules`, '>=9 deny');
test('D10-4', 'warn-rules', warnRules.length >= 7, `${warnRules.length} warn rules`, '>=7 warn');

// 2. evaluateCommandRisk - 高危命令判 deny
const catCred = evaluateCommandRisk('cat ~/.config/huaweicloud/credentials.json');
test('D10-4', 'cat-cred-deny', catCred?.decision === 'deny' || catCred?.verdict === 'deny', catCred?.decision || catCred?.verdict, 'deny');

const envDump = evaluateCommandRisk('printenv HUAWEICLOUD_ACCESS_KEY_ID');
test('D10-4', 'env-dump-deny', envDump?.decision === 'deny' || envDump?.verdict === 'deny', envDump?.decision || envDump?.verdict, 'deny');

const delRes = evaluateCommandRisk('hcloud ECS DeleteServers --servers.1.id=abc');
test('D10-4', 'delete-deny', delRes?.decision === 'deny' || delRes?.decision === 'confirm' || delRes?.verdict === 'deny', delRes?.decision || delRes?.verdict, 'deny/confirm');

// 3. 只读命令判 allow, 不带 token
const listCmd = evaluateCommandRisk('hcloud ECS ListServers --cli-region=cn-north-4');
test('D10-4', 'list-allow', listCmd?.decision === 'allow' || listCmd?.verdict === 'allow', listCmd?.decision || listCmd?.verdict, 'allow');
test('D10-4', 'list-no-token', !listCmd?.approvalToken, listCmd?.approvalToken ? 'has token' : 'no token', 'no token');

const outDir = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/results/WorkBuddy/2026-09-28-188.239.14.150/Windows/evidence/D10-4';
mkdirSync(outDir, { recursive: true });
const status = results.every(r => r.pass) ? 'PASS' : 'FAIL';
const output = { case: 'D10-4', status, total: results.length, passed: results.filter(r => r.pass).length, results };
writeFileSync(outDir + '/stdout.log', JSON.stringify(output, null, 2), 'utf8');
console.log(JSON.stringify(output, null, 2));
