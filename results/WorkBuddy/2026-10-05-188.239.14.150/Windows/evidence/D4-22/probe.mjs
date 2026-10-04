import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const risk = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
let status = 'PASS', why = '', evidence = {};
try {
  // D4-22: hook_check_deploy_plan — 高危 deploy plan 应被 warn/deny
  const plans = [
    '{"service":"FunctionGraph","function":{"handler":"index.handler","code":"rm -rf /","public":true}}',
    '{"service":"ECS","public_ip":true,"ports":[22,3389,3306]}',
  ];
  const results = plans.map(p => risk.evaluateDeployPlan(p));
  evidence.results = results;
  const blocked = results.filter(r => r.decision === 'deny' || r.decision === 'warn');
  if (blocked.length >= 1) {
    status = 'PASS'; why = '高危 deploy plan 被拦截（' + blocked.length + '/' + plans.length + '）';
  } else {
    status = 'FAIL'; why = '高危 deploy plan 未被拦截：' + JSON.stringify(results).slice(0,400);
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D4-22', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
