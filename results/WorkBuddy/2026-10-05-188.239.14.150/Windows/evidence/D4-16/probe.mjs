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
  // D4-16: 命令包裹穿透 — shell 包裹内层高危命令
  const cmds = [
    'bash -c "cat ~/.hcloud/credentials.json"',
    'sh -c "printenv HW_ACCESS_KEY"',
    'powershell -Command "Get-Content ~/.huaweicloud/credentials.json"',
    'eval "cat ~/.hcloud/credentials"',
    'echo $(cat ~/.hcloud/credentials.json)',
    'cmd /c "type %USERPROFILE%\\.huaweicloud\\credentials.json"',
  ];
  const results = cmds.map(c => {
    const riskResult = risk.evaluateCommandRisk(c);
    const classifyResult = safety.classifyTextCommand(c);
    return { cmd: c, riskDecision: riskResult.decision, classifyDecision: classifyResult.decision };
  });
  evidence.results = results;
  // 命令包裹应能发现内层命令并拦截（至少 deny 或 warn）
  const bypassed = results.filter(r => r.riskDecision === 'allow' && r.classifyDecision === 'allow');
  if (bypassed.length === 0) {
    status = 'PASS'; why = '所有包裹命令被识别并拦截';
  } else {
    status = 'FAIL'; why = '包裹穿透成功：' + JSON.stringify(bypassed).slice(0,400);
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D4-16', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
