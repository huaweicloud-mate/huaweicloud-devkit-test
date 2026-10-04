import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const risk = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
let status = 'PASS', why = '', evidence = {};
try {
  // D4-1: 凭证文件读取拦截 — cat ~/.hcloud/credentials.json 等
  const cmds = [
    'cat ~/.hcloud/credentials.json',
    'type %USERPROFILE%\\.huaweicloud\\credentials.json',
    'Get-Content ~/.huaweicloud/config',
    'hcloud/config/credentials',
  ];
  const results = cmds.map(c => ({ cmd: c, result: risk.evaluateCommandRisk(c) }));
  evidence.results = results;
  const allDeny = results.every(r => r.result.decision === 'deny' && r.result.findings && r.result.findings.length > 0);
  if (allDeny) {
    status = 'PASS'; why = '所有凭证文件读取命令被 deny';
  } else {
    status = 'FAIL'; why = '部分命令未 deny：' + JSON.stringify(results.filter(r => r.result.decision !== 'deny')).slice(0,300);
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D4-1', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
