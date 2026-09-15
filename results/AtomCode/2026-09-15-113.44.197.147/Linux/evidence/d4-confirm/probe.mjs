// D4-18 / D4-19 审批语义 + 确认流下预检探针
// 语义：写操作不得被「直接放行」也不得被「直接拒绝」，必须显式确认；确认流中风险预检仍生效。
import { classifyTextCommand, classifyHcloudArgs } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

let pass = 0, fail = 0;
function check(id, desc, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function bool(id, desc, cond) { check(id, desc, Boolean(cond), true); }

// D4-18 confirm-not-deny：写操作默认进入「待审批」态（deny 但 reason 指向审批），而非 auto-deny 或 auto-allow
const createNoAllow = classifyTextCommand('hcloud ECS CreateServers --count 1');
console.log(`INFO   D4-18  CreateServers(未确认) => ${JSON.stringify(createNoAllow)}`);
bool('D4-18', '写操作未确认时 decision=deny', createNoAllow.decision === 'deny');
bool('D4-18', 'deny 原因为「等待显式审批」（不是最终拒绝）', /approval|approve/i.test(createNoAllow.reason || ''));
// 确认后放行（confirm -> allow）
const createAllow = classifyHcloudArgs(['ECS', 'CreateServers', '--count', '1'], { allowWrites: true });
console.log(`INFO   D4-18  CreateServers(已确认 allowWrites) => ${JSON.stringify(createAllow)}`);
bool('D4-18', '显式确认后 decision=allow', createAllow.decision === 'allow');

// D4-19 确认流下预检仍生效：即便 allowWrites，破坏性删除仍被风险规则引擎告警 (hwc-destructive-delete-operation)
const delAllow = classifyHcloudArgs(['ECS', 'DeleteServers', '--servers.0.id', 'x'], { allowWrites: true });
console.log(`INFO   D4-19  DeleteServers(已确认) => ${JSON.stringify(delAllow)}`);
bool('D4-19', '确认后破坏性操作仍触发风险预检（warnings 非空）', Array.isArray(delAllow.warnings) && delAllow.warnings.length > 0);

console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);