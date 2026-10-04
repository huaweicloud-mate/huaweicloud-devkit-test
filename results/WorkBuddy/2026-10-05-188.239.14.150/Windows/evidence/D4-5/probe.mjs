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
  // D4-5: 写操作误判检测 — plan 删除类命令不应被判 read-only/allow
  // 用 classifyTextCommand (safety-policy) + evaluateCommandRisk (risk-rule-engine) 双重验证
  const writeCmds = [
    'hcloud ECS delete-servers --instance-ids i-xxxx',
    'hcloud RDS delete-instance --instance-id rds-xxxx',
    'hcloud VPC delete-vpc --vpc-id vpc-xxxx',
    'rm -rf /',
    'hcloud ECS stop-servers --instance-ids i-xxxx',
  ];
  const results = writeCmds.map(c => {
    const riskResult = risk.evaluateCommandRisk(c);
    const classifyResult = safety.classifyTextCommand(c);
    return { cmd: c, riskDecision: riskResult.decision, classifyDecision: classifyResult.decision };
  });
  evidence.results = results;
  // 写操作不应被误判为 allow/read-only（应至少 warn 或 deny）
  const misjudged = results.filter(r => r.riskDecision === 'allow' && r.classifyDecision === 'allow');
  if (misjudged.length === 0) {
    status = 'PASS'; why = '所有写操作未被误判为 allow';
  } else {
    status = 'FAIL'; why = '写操作被误判为 allow：' + JSON.stringify(misjudged).slice(0,300);
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D4-5', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
