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
  // D4-15: hook 绕过尝试 — 大小写变体、URL编码、参数拼接拆分
  const cmds = [
    'CAT ~/.hcloud/credentials.json',
    'cat ~\\.hcloud%2Fcredentials.json',
    'cat .huaweicloud' + '/' + 'credentials',
    'type C:\\Users\\X\\.huaweicloud\\config',
    'bash -c "cat ~/.hcloud/credentials.json"',
    'sh -c "type $HOME/.huaweicloud/credentials"',
  ];
  const results = cmds.map(c => {
    const riskResult = risk.evaluateCommandRisk(c);
    const classifyResult = safety.classifyTextCommand(c);
    return { cmd: c, riskDecision: riskResult.decision, classifyDecision: classifyResult.decision };
  });
  evidence.results = results;
  const bypassed = results.filter(r => r.riskDecision !== 'deny' && r.classifyDecision !== 'deny');
  if (bypassed.length === 0) {
    status = 'PASS'; why = '所有绕过变体被 deny';
  } else {
    // 部分大小写/拼接可能漏过 — 视为 FINDINGS
    status = 'FAIL'; why = '存在绕过：' + JSON.stringify(bypassed).slice(0,400);
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D4-15', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
