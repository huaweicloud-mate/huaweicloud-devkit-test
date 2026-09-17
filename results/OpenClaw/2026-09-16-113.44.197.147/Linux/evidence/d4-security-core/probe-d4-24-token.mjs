// D4-24 确认令牌过期与重复确认边界（审批流健壮性）—— 源码级真工具断言（隔离 HOME）
import { callTool } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let pass = 0, fail = 0;
const lines = [];
function check(id, title, cond, note) { cond ? pass++ : fail++; lines.push(`${cond ? 'PASS':'FAIL'}  ${id}  ${title}  => ${note}`); }

const iso = mkdtempSync(join(tmpdir(), 'hdk-d424-'));
const oldHome = process.env.HUAWEICLOUD_HOME;
process.env.HUAWEICLOUD_HOME = iso;
const approvalsPath = join(iso, '.config', 'huaweicloud', 'approvals.json');

try {
  // ① plan 产生真实 approvalToken（一个 dedicate 只读 token 用于持久化/伪造检查）
  const plan = await callTool('huaweicloud_plan_cli_command', { args: ['ECSA', 'DummyPlaceholder'] });
  const token = plan?.approvalToken;
  check('D4-24', 'plan 产生 approvalToken', typeof token === 'string' && token.length > 0, `token=${!!token}`);
  const persisted = existsSync(approvalsPath);
  check('D4-24', 'approvalToken 持久化到 approvals.json(跨进程)', persisted, `exists=${persisted}`);

  // ② 伪造 token 被拒
  let forgedRejected = false;
  try {
    await callTool('huaweicloud_run_approved_command', { args: ['ECS', 'DescribeInstances'], approvalToken: 'forge-nonexistent', approvedByUser: true });
  } catch (e) { forgedRejected = true; }
  check('D4-24', '不存在 token 提交被拒', forgedRejected, `rejected=${forgedRejected}`);

  // ③ 重复确认边界：同一 token 第一次消费后，第二次应被拒（单次消费）
  let firstErr = null;
  try { await callTool('huaweicloud_run_approved_command', { args: ['ECS', 'DescribeInstances'], approvalToken: token, approvedByUser: true }); }
  catch (e) { firstErr = e.message; }
  let secondRejected = false;
  try { await callTool('huaweicloud_run_approved_command', { args: ['ECS', 'DescribeInstances'], approvalToken: token, approvedByUser: true }); }
  catch (e) { secondRejected = /Invalid|expired|not found|Approval/i.test(String(e?.message || e)); }
  check('D4-24', 'token 单次消费(重复提交第二次被拒)', secondRejected, `secondRejected=${secondRejected}`);

  // ④ TTL 过期：重新 plan 产生一个全新 token，回拨其 createdAt 超过 5min 后提交应被拒
  const plan2 = await callTool('huaweicloud_plan_cli_command', { args: ['ECSB', 'DummyPlaceholder'] });
  const token2 = plan2?.approvalToken;
  const raw = JSON.parse(readFileSync(approvalsPath, 'utf8'));
  if (token2 && raw[token2]) {
    raw[token2].createdAt = Date.now() - 6 * 60_000; // 6 分钟 → 超过 5min TTL
    writeFileSync(approvalsPath, JSON.stringify(raw), 'utf8');
    let expiredRejected = false;
    try { await callTool('huaweicloud_run_approved_command', { args: ['ECS', 'DescribeInstances'], approvalToken: token2, approvedByUser: true }); }
    catch (e) { expiredRejected = /Invalid|expired|not found/i.test(String(e?.message || e)); }
    check('D4-24', '过期 token(>5min TTL)提交被拒', expiredRejected, `expiredRejected=${expiredRejected}`);
  } else {
    check('D4-24', '过期 token(>5min TTL)提交被拒', false, '未生成新 token，无法回拨');
  }
} finally {
  if (oldHome === undefined) delete process.env.HUAWEICLOUD_HOME; else process.env.HUAWEICLOUD_HOME = oldHome;
}

console.log('\n=== D4-24 确认令牌过期与重复确认边界探针结果 ===');
for (const l of lines) console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);
