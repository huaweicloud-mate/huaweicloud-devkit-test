import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  judgeUpdate,
  determineTarget,
  getUpdateDistTags,
  writeSkipState,
  readSkipState,
} from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

// D1-43 dismiss 参数边界与失败语义：registry 失败/无更新不伪造 dismissed 或 up_to_date；不写 undefined/current 伪冷却。
// 1) registry 查询失败 -> check_failed（不降级为 dismissed/up_to_date）
const failedTags = await getUpdateDistTags('1.1.0', { doQuery: async () => null });
test('D1-43-1', 'query-failed-returns-null', failedTags === null, String(failedTags), 'null');
const jf = judgeUpdate('1.1.0', null, null);
test('D1-43-2', 'query-failed-not-forged-dismissed', jf.result === 'check_failed' && jf.result !== 'dismissed' && jf.result !== 'up_to_date', jf.result, 'check_failed');
test('D1-43-3', 'no-pseudo-cooldown-write', jf.dismissed === false && jf.dismissExpiresAt === null, `dismissed=${jf.dismissed},exp=${jf.dismissExpiresAt}`, 'dismissed=false,exp=null');

// 2) 无更新场景（target<=current）-> up_to_date，不伪造 dismissed
const jn = judgeUpdate('1.1.0', { latest: '1.1.0', next: null });
test('D1-43-4', 'no-update-is-up_to_date', jn.result === 'up_to_date' && jn.dismissed === false, `${jn.result}/dismissed=${jn.dismissed}`, 'up_to_date/dismissed=false');

// 3) dismiss 目标回退：target 或 current 作为 dismissedVersion，写入真实字符串而非 undefined
const dt = determineTarget('1.1.0', { latest: '1.2.0', next: null });
test('D1-43-5', 'dismiss-fallback-target', dt === '1.2.0', dt, '1.2.0');

const tmp = mkdtempSync(join(tmpdir(), 'd1-43-'));
const file = join(tmp, 'skip.json');
try {
  writeSkipState(file, dt);
  const st = readSkipState(file);
  test('D1-43-6', 'skip-writes-real-version', st?.dismissedVersion === '1.2.0' && st?.dismissedVersion !== 'undefined', st?.dismissedVersion, '1.2.0');
  test('D1-43-7', 'skip-has-expireAt', typeof st?.expireAt === 'string' && st.expireAt.length > 0, st?.expireAt, 'ISO 时间');
  const jd = judgeUpdate('1.1.0', { latest: '1.2.0', next: null }, st);
  test('D1-43-8', 'dismiss-then-cooled', jd.result === 'dismissed' && jd.dismissExpiresAt === st.expireAt, `${jd.result}/${jd.dismissExpiresAt}`, `dismissed/${st.expireAt}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// 4) 未写 skip 时 readSkipState 为 null（坏状态安全降级）
const tmp2 = mkdtempSync(join(tmpdir(), 'd1-43b-'));
const bad = join(tmp2, 'bad.json');
try {
  writeFileSync(bad, '{not valid json', 'utf8');
  test('D1-43-9', 'bad-skip-file-reads-null', readSkipState(bad) === null, String(readSkipState(bad)), 'null');
} finally {
  rmSync(tmp2, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-43', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);