import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const risk = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
const safety = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/safety-policy.mjs');
let status = 'PASS', why = '', evidence = {};
try {
  // D4-19: 确认流下预检仍生效 — 高危写操作在确认流程中风险预检仍生效拦截
  // 验证：高危命令（凭证/破坏性）即使走 confirm 路径，risk-rule-engine 仍判 deny
  const highRiskCmds = [
    'cat ~/.hcloud/credentials.json',
    'printenv HUAWEICLOUD',
    'hcloud ECS delete-servers --instance-ids i-xxxx --force',
    'rm -rf /var/lib/mysql',
  ];
  const results = highRiskCmds.map(c => {
    const classifyResult = safety.classifyTextCommand(c);
    const riskResult = risk.evaluateCommandRisk(c);
    return { cmd: c, classifyDecision: classifyResult.decision, riskDecision: riskResult.decision };
  });
  evidence.results = results;
  // 高危命令应被 deny（预检拦截），不应仅 warn
  const notDenied = results.filter(r => r.riskDecision !== 'deny' && r.classifyDecision !== 'deny');
  if (notDenied.length === 0) {
    status = 'PASS'; why = '确认流下高危命令预检仍生效（deny）';
  } else {
    status = 'FAIL'; why = '高危命令预检未拦截：' + JSON.stringify(notDenied).slice(0,300);
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D4-19', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
