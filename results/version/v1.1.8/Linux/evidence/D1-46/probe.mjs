import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { getCachedUpdateInfo, invalidateUpdateCache, queryDistTags } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

const TTL_MS = 60 * 60 * 1000;
const FAIL_THROTTLE_MS = 5 * 60 * 1000;
const T0 = 1_000_000_000;

// TTL 边界：等于 1h 仍复用，超过 1h 重新查询（实现约定为 now-cachedAt <= TTL_MS）
let q = 0;
const doQuery = async () => {
  q += 1;
  return { latest: '1.2.0', next: null };
};
invalidateUpdateCache();
const r1 = await getCachedUpdateInfo('1.1.0', { doQuery, now: T0 });
const r2 = await getCachedUpdateInfo('1.1.0', { doQuery, now: T0 + TTL_MS });
test('D1-46-1', 'ttl-equal-still-cached', r2.result === 'update_available' && q === 1, `result=${r2.result},q=${q}`, 'update_available,q=1');
const r3 = await getCachedUpdateInfo('1.1.0', { doQuery, now: T0 + TTL_MS + 1 });
test('D1-46-2', 'ttl-exceeded-requeries', q === 2, `q=${q}`, '2');

// 失败节流边界：5min 内节流，满 5min 可重试
let f = 0;
const doFail = async () => {
  f += 1;
  return null;
};
invalidateUpdateCache();
const g1 = await getCachedUpdateInfo('1.1.0', { doQuery: doFail, now: T0 });
const g2 = await getCachedUpdateInfo('1.1.0', { doQuery: doFail, now: T0 + FAIL_THROTTLE_MS - 1 });
test('D1-46-3', 'throttled-before-5min', g1.result === 'check_failed' && g2.result === 'check_failed' && f === 1, `f=${f}`, '1');
const g3 = await getCachedUpdateInfo('1.1.0', { doQuery: doFail, now: T0 + FAIL_THROTTLE_MS });
test('D1-46-4', 'retry-at-5min-boundary', f === 2, `f=${f}`, '2');

// 查询失败（doQuery resolve null）→ check_failed；恢复后可再检测
invalidateUpdateCache();
const n = await getCachedUpdateInfo('1.1.0', { doQuery: async () => null, now: T0 });
const rec = await getCachedUpdateInfo('1.1.0', { doQuery: async () => ({ latest: '1.2.0', next: null }), now: T0 + FAIL_THROTTLE_MS + 1 });
test('D1-46-5', 'null-query-check_failed', n.result === 'check_failed', n.result, 'check_failed');
test('D1-46-6', 'recover-after-failure', rec.result === 'update_available', rec.result, 'update_available');

// 默认 queryDistTags：spawn 失败（npm 缺失）→ resolve null，不抛未处理异常
const savedPath = process.env.PATH;
process.env.PATH = '/__no_such_dir_for_npm__';
let qd = null;
let threw = false;
try {
  qd = await queryDistTags({ cwd: tmpdir() });
} catch {
  threw = true;
} finally {
  process.env.PATH = savedPath;
}
test('D1-46-7', 'spawn-error-resolves-null-no-throw', qd === null && threw === false, `qd=${qd},threw=${threw}`, 'null,false');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-46', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);