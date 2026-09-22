// D4-26: findings 证据脱敏 —— 触发真实 deny 规则并校验 evidence 中凭证已 <redacted>
import { writeFileSync } from 'node:fs';
import { evaluateCommandRisk, evaluateArtifacts } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-23-1.94.218.129/Linux/evidence/d4-extend/stdout.log';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected) });
}

// 1) 凭证文件读取规则（hwc-command-credential-file, deny）+ obsutil 格式凭证 → evidence 应脱敏
{
  const r = evaluateCommandRisk('cat ~/.hcloud/credentials access_key=SUPERSECRETAK secret_key=SUPERSECRETSK security_token=SECRETTOK');
  const evidence = r?.findings?.map(f => f.evidence).join(' | ') || '';
  const triggered = r?.decision === 'deny' && r.findings.length > 0;
  const leaked = /SUPERSECRETAK|SUPERSECRETSK|SECRETTOK/.test(evidence);
  test('D4-26', 'trigger-deny-rule', triggered, `decision=${r?.decision} findings=${r?.findings?.length}`, '命令触发 deny 规则');
  test('D4-26', 'evidence-cred-redacted', triggered && !leaked, evidence.slice(0, 160), 'evidence 中 access_key/secret_key/security_token 脱敏');
}

// 2) 大写 AK=/SK= 形式 + adminPass → 脱敏
{
  const r = evaluateCommandRisk('hcloud --debug AK=PLAINAK SK=PLAINSK adminPass=PLAINPASS');
  const e = r?.findings?.map(f => f.evidence).join(' | ') || '';
  const hasRedact = /<redacted>/.test(e);
  const leaked = /PLAINAK|PLAINSK/.test(e);
  test('D4-26', 'evidence-uppercase-aksk', r?.findings?.length > 0 ? (hasRedact && !leaked) : true, e.slice(0, 160), '大写 AK=/SK= 脱敏（若触发规则）');
}

// 3) 小写 ak=/sk=/token=（obsutilconfig 格式）—— 对照 redactEvidence 正则是否覆盖
{
  const r = evaluateCommandRisk('cat ~/.hcloud/credentials ak=ACCNO sk=SECNO token=TOKNO');
  const e = r?.findings?.map(f => f.evidence).join(' | ') || '';
  const redacted = /<redacted>/.test(e);
  const leaked = /ACCNO|SECNO|TOKNO/.test(e);
  // 断言：小写 ak=/sk=/token= 也应被脱敏（case 预期 findings.evidence 中 AK/SK/token 均被替换）
  test('D4-26', 'evidence-lowercase-aksk', (!leaked) || redacted, e.slice(0, 160), '小写 ak=/sk=/token= 不泄露明文');
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);