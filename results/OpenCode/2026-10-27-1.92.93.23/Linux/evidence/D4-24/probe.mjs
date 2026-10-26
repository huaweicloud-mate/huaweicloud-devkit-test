// D4-24 确认令牌过期与重复确认边界（OpenCode Linux 每日回归）
// 源码级直调 hcloud-cli.mjs 审批令牌生命周期函数，核对 D4-24 精确 JSON 契约：
//   valid / already_consumed / expired / not_found 四态 + 重复确认（单次消费）。
// 用法: node probe.mjs <hdk src>
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

const srcDir = process.argv[2];
const S = (f) => join(srcDir, f);
const { createApprovalToken, inspectApprovalToken, consumeApprovalToken } =
  await import(pathToFileURL(S('hcloud-cli.mjs')).href);

const ISO = mkdtempSync(join(tmpdir(), 'd4-24-'));
process.env.HUAWEICLOUD_HOME = ISO;
const APPROVALS = join(ISO, '.config', 'huaweicloud', 'approvals.json');
const TTL = 5 * 60_000;

const results = [];
function rec(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' | ' + detail : ''}`);
}

try {
  // ① valid + 首次消费
  const t1 = createApprovalToken(['VPC', 'CreateVpc', '--vpc.name=x']);
  const s0 = inspectApprovalToken(t1);
  rec('新建令牌 inspect=valid', s0.state === 'valid', `state=${s0.state}`);
  const c1 = consumeApprovalToken(t1);
  rec('首次 consume 返回 entry', !!c1 && !!c1.argsHash, `entry=${!!c1}`);
  const s1 = inspectApprovalToken(t1);
  rec('消费后 inspect=already_consumed', s1.state === 'already_consumed', `state=${s1.state}`);
  const c2 = consumeApprovalToken(t1);
  rec('重复 consume 返回 null（单次消费）', c2 === null, `c2=${c2}`);

  // ② not_found
  const s2 = inspectApprovalToken(randomUUID());
  rec('未知令牌 inspect=not_found', s2.state === 'not_found', `state=${s2.state}`);

  // ③ expired：创建后手动回拨 createdAt 超过 TTL
  const t2 = createApprovalToken(['VPC', 'CreateVpc', '--vpc.name=y']);
  const map = JSON.parse(readFileSync(APPROVALS, 'utf8'));
  if (map[t2]) map[t2].createdAt = Date.now() - TTL - 1000;
  writeFileSync(APPROVALS, JSON.stringify(map));
  const s3 = inspectApprovalToken(t2);
  rec('回拨 createdAt 后 inspect=expired', s3.state === 'expired', `state=${s3.state}`);
  const c3 = consumeApprovalToken(t2);
  rec('过期令牌 consume 返回 null（不执行）', c3 === null, `c3=${c3}`);
} catch (e) {
  console.log('[EXCEPTION]', e.message);
  results.push({ name: 'exception', ok: false, detail: e.message });
} finally {
  rmSync(ISO, { recursive: true, force: true });
  delete process.env.HUAWEICLOUD_HOME;
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
const summary = {
  caseId: 'D4-24',
  verdict: fail === 0 ? 'PASS' : 'FAIL',
  pass,
  fail,
  total: results.length,
  results,
};
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify(summary, null, 2));
process.exit(fail > 0 ? 1 : 0);