import { writeFileSync } from 'node:fs';
import { getCachedUpdateInfo, invalidateUpdateCache } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

// D1-47 缓存与当前版本解耦：共享 registry 结果复用，但每次按当前版本重算 target/result。
const T0 = 1_000_000_000;
let q = 0;
const doQuery = async () => {
  q += 1;
  return { latest: '1.2.0', next: null };
};

invalidateUpdateCache();
const a = await getCachedUpdateInfo('1.1.0', { doQuery, now: T0 });
test('D1-47-1', 'stable-old-current-update', a.result === 'update_available' && a.targetVersion === '1.2.0', `${a.result}/${a.targetVersion}`, 'update_available/1.2.0');

const b = await getCachedUpdateInfo('1.2.0', { doQuery, now: T0 });
test('D1-47-2', 'same-as-target-up_to_date', b.result === 'up_to_date' && b.updateAvailable === false, `${b.result}/av=${b.updateAvailable}`, 'up_to_date/av=false');

const c = await getCachedUpdateInfo('1.3.0', { doQuery, now: T0 });
test('D1-47-3', 'newer-current-up_to_date', c.result === 'up_to_date', c.result, 'up_to_date');

// prerelease current 对同一份缓存重算
const d = await getCachedUpdateInfo('1.2.0-next.1', { doQuery, now: T0 });
test('D1-47-4', 'prerelease-current-recomputes-update', d.result === 'update_available' && d.targetVersion === '1.2.0', `${d.result}/${d.targetVersion}`, 'update_available/1.2.0');

// 全程只查询一次 registry（结果复用），未串用上一个 current 的 updateAvailable 结论
test('D1-47-5', 'registry-queried-once', q === 1, `q=${q}`, '1');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-47', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);