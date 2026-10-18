// Probe for D10-4: 安全干预-静态规则层
import { evaluateCommandRisk } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rulesPath = join(__dirname, 'plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json');
const rulesJson = JSON.parse(readFileSync(rulesPath, 'utf8'));
const rules = rulesJson.rules || rulesJson;
const denyRules = rules.filter(r => r.severity === 'deny');
const warnRules = rules.filter(r => r.severity === 'warn');

const catCreds = evaluateCommandRisk('cat ~/.hcloud/credentials.json');
const listServers = evaluateCommandRisk('hcloud ECS ListServers --cli-region=cn-north-4');
const envCreds = classifyTextCommand('printenv HW_SECRET_KEY');

const highRiskDenied = catCreds.decision === 'deny';
const readOnlyOk = listServers.decision === 'allow' || listServers.decision === 'warn';

console.log(JSON.stringify({
  status: (highRiskDenied && readOnlyOk) ? 'PASS' : 'FAIL',
  totalRules: rules.length, denyCount: denyRules.length, warnCount: warnRules.length,
  catCreds: catCreds.decision, listServers: listServers.decision, envCreds: envCreds.decision
}, null, 2));
