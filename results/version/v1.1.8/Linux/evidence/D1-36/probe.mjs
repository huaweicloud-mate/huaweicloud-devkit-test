import { writeFileSync } from 'node:fs';
import { applyUpdateHint, peekCachedUpdateInfo, getCachedUpdateInfo, invalidateUpdateCache } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

const hint = { currentVersion: '1.1.0', latestVersion: '1.2.0', updateAvailable: true, targetVersion: '1.2.0' };

// 首个非检查类工具附加 _updateInfo
const decorated = applyUpdateHint({ answer: 42 }, 'huaweicloud_search_docs', hint);
test('D1-36-1', 'decorate-adds-updateInfo', Boolean(decorated._updateInfo) && decorated._updateInfo.latestVersion === '1.2.0', JSON.stringify(decorated._updateInfo), '{"currentVersion":"1.1.0","latestVersion":"1.2.0"}');
test('D1-36-2', 'original-result-preserved', decorated.answer === 42, decorated.answer, '42');

// 检查/升级工具不附加
const ck = applyUpdateHint({ x: 1 }, 'huaweicloud_check_update', hint);
test('D1-36-3', 'check-update-not-decorated', ck._updateInfo === undefined, JSON.stringify(ck), 'undefined');
const up = applyUpdateHint({ x: 1 }, 'huaweicloud_upgrade', hint);
test('D1-36-4', 'upgrade-not-decorated', up._updateInfo === undefined, JSON.stringify(up), 'undefined');

// 无 hint / 无 targetVersion / 无 updateAvailable 不附加
test('D1-36-5', 'null-hint-no-decorate', applyUpdateHint({ x: 1 }, 'foo', null)._updateInfo === undefined, 'undefined', 'undefined');
test('D1-36-6', 'no-targetVersion-no-decorate', applyUpdateHint({ x: 1 }, 'foo', { updateAvailable: true, targetVersion: null })._updateInfo === undefined, 'undefined', 'undefined');
test('D1-36-7', 'not-update-available-no-decorate', applyUpdateHint({ x: 1 }, 'foo', { updateAvailable: false, targetVersion: '1.2.0' })._updateInfo === undefined, 'undefined', 'undefined');

// peekCachedUpdateInfo：更新可用时返回 hint 供一次兜底附加
test('D1-36-8', 'peek-null-before-check', peekCachedUpdateInfo() === null, String(peekCachedUpdateInfo()), 'null');
invalidateUpdateCache();
await getCachedUpdateInfo('1.1.0', { doQuery: async () => ({ latest: '1.2.0', next: null }), now: Date.now() });
const peek = peekCachedUpdateInfo();
test('D1-36-9', 'peek-nonnull-after-check', peek !== null && peek.updateAvailable === true && peek.targetVersion === '1.2.0', JSON.stringify(peek), 'update_available/1.2.0');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-36', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);