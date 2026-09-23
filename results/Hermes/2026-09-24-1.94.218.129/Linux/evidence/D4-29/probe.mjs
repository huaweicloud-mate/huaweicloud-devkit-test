// D4-29 (P2): 分类断言与原始命令分类入口
// 断言: classifyRawCommand 是 classifyTextCommand 的包装；DENY 决策 assertAllowed 抛拒绝、allow 通过；分类结果含 decision/reason。
import { writeFileSync } from 'node:fs';
import { classifyRawCommand } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { classifyTextCommand, assertAllowed } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-24-1.94.218.129/Linux/evidence/D4-29/stdout.log';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected) });
}

// 1) classifyRawCommand 是 classifyTextCommand 的包装（同输入同决策）
const raw1 = classifyRawCommand('printenv HUAWEICLOUD_ACCESS_KEY_ID');
const txt1 = classifyTextCommand('printenv HUAWEICLOUD_ACCESS_KEY_ID');
test('D4-29', 'wrapper-equivalence', raw1.decision === txt1.decision, `raw=${raw1.decision} txt=${txt1.decision}`, 'classifyRawCommand 与 classifyTextCommand 决策一致');

// 2) 凭证文件读取 → deny（且结果含 decision/reason 字段）
{
  const r = classifyRawCommand('cat ~/.huaweicloud/credentials');
  const hasFields = r && 'decision' in r && 'reason' in r;
  test('D4-29', 'deny-credential-file', r.decision === 'deny' && hasFields, `${r.decision}|reason=${!!r.reason}`, 'deny + 含 decision/reason');
}

// 3) 凭证 env 打印 → deny
{
  const r = classifyRawCommand('printenv HUAWEICLOUD_ACCESS_KEY_ID');
  test('D4-29', 'deny-credential-env', r.decision === 'deny', r.decision, 'deny');
}

// 4) 只读 hcloud 命令 → allow
{
  const r = classifyRawCommand('hcloud ECS ListServersDetails --cli-region=cn-north-4');
  test('D4-29', 'allow-read', r.decision === 'allow', r.decision, 'allow');
}

// 5) 写命令（未确认）→ confirm/deny
{
  const r = classifyRawCommand('hcloud VPC DeleteVpc --vpc_id=test-id');
  test('D4-29', 'write-need-confirm', r.decision === 'deny' || r.decision === 'confirm', r.decision, 'confirm/deny');
}

// 6) assertAllowed：DENY 抛拒绝（附 policy），allow 通过
{
  const denyR = classifyRawCommand('printenv HUAWEICLOUD_ACCESS_KEY_ID');
  let threw = false, policyAttached = false;
  try { assertAllowed(denyR); } catch (e) { threw = true; policyAttached = !!e.policy; }
  test('D4-29', 'assertAllowed-deny-throws', threw && policyAttached, `threw=${threw} policy=${policyAttached}`, 'deny 抛异常 + policy 附加');

  const allowR = classifyRawCommand('hcloud ECS ListServersDetails --cli-region=cn-north-4');
  let passt = false;
  try { const ret = assertAllowed(allowR); passt = ret === allowR; } catch { passt = false; }
  test('D4-29', 'assertAllowed-allow-passes', passt, `passt=${passt}`, 'allow 通过并返回 result');
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r=>r.pass).length, failed: results.filter(r=>!r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);