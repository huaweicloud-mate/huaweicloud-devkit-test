import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const risk = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
let status = 'PASS', why = '', evidence = {};
try {
  // D4-21: hook_check_artifacts — 宽泛 IAM policy JSON 应被 deny
  const artifacts = [
    { path: 'policy.json', content: '{"Version":"2024","Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}' },
    { path: 'main.tf', content: 'resource "huaweicloud_vpc" "x" { cidr = "0.0.0.0/0" }' },
  ];
  const r = risk.evaluateArtifacts(artifacts);
  evidence.result = r;
  if (r.decision === 'deny' && r.findings && r.findings.length > 0) {
    status = 'PASS'; why = '宽泛 IAM/IaC 制品被 deny';
  } else {
    status = 'FAIL'; why = '宽泛制品未 deny：' + JSON.stringify(r).slice(0,300);
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D4-21', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
