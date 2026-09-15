// D4-23 全局规则 huawei-agent-rules.mdc 注入生效性探针
// ① 规则源文件存在 ② 含「禁直连 csms/kms」MUST 约束 ③ 约束在安全策略中实际生效（直接读 secret 被 deny）
import { readFileSync, existsSync } from 'node:fs';
import { classifyTextCommand } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const RULES = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/rules/huawei-agent-rules.mdc';

let pass = 0, fail = 0;
function check(id, desc, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function bool(id, desc, cond) { check(id, desc, Boolean(cond), true); }

bool('D4-23', '全局规则源文件 huawei-agent-rules.mdc 存在', existsSync(RULES));
const ruleText = existsSync(RULES) ? readFileSync(RULES, 'utf8') : '';
bool('D4-23', '规则含 MUST NOT call csms download-secret/show-secret', /MUST NOT call[\s\S]{0,40}csms (download-secret|show-secret)/i.test(ruleText));
bool('D4-23', '规则含 MUST NOT call kms decrypt', /hcloud kms decrypt/i.test(ruleText));
bool('D4-23', '规则含 least-privilege（最小权限）', /least privilege/i.test(ruleText));

// 约束在安全策略中实际生效：直接读取 secret 值被 deny
const r1 = classifyTextCommand('hcloud csms ShowSecretVersion --secret-name x');
const r2 = classifyTextCommand('hcloud kms Decrypt --ciphertext-blob x');
console.log(`INFO   D4-23  csms ShowSecretVersion => ${JSON.stringify(r1)}`);
console.log(`INFO   D4-23  kms Decrypt => ${JSON.stringify(r2)}`);
bool('D4-23', '直连 csms ShowSecretVersion 被 deny', r1.decision === 'deny');
bool('D4-23', '直连 kms Decrypt 被识别（secret 拦截）', r2.decision === 'deny' || /secret/i.test(r2.risk || ''));

console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);