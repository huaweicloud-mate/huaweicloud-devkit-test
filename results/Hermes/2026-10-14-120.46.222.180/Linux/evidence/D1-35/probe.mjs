import { writeFileSync } from 'node:fs';
import { getCachedUpdateInfo, invalidateUpdateCache } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

const TTL_MS = 60 * 60 * 1000; // 1h
const FAIL_THROTTLE_MS = 5 * 60 * 1000; // 5min
const T0 = 1_000_000_000;

// 成功缓存：1h 内复用探测结果
let successCalls = 0;
const successQuery = async () => {
  successCalls += 1;
  return { latest: '1.2.0', next: null };
};
invalidateUpdateCache();
const s1 = await getCachedUpdateInfo('1.1.0', { doQuery: successQuery, now: T0 });
const s2 = await getCachedUpdateInfo('1.1.0', { doQuery: successQuery, now: T0 + TTL_MS - 1 });
test('D1-35-1', 'first-call-queries', s1.result === 'update_available', s1.result, 'update_available');
test('D1-35-2', 'within-1h-reuses-cache', successCalls === 1, String(successCalls), '1');

// 失败节流：失败后 5min 内不再查询
let failCalls = 0;
const failQuery = async () => {
  failCalls += 1;
  return null;
};
invalidateUpdateCache();
const f1 = await getCachedUpdateInfo('1.1.0', { doQuery: failQuery, now: T0 });
const f2 = await getCachedUpdateInfo('1.1.0', { doQuery: failQuery, now: T0 + FAIL_THROTTLE_MS - 1 });
test('D1-35-3', 'failure-returns-check_failed', f1.result === 'check_failed', f1.result, 'check_failed');
test('D1-35-4', 'failure-throttled-5min', failCalls === 1, String(failCalls), '1');

const f3 = await getCachedUpdateInfo('1.1.0', { doQuery: failQuery, now: T0 + FAIL_THROTTLE_MS });
test('D1-35-5', 'failure-retry-after-5min', failCalls === 2, String(failCalls), '2');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-35', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);