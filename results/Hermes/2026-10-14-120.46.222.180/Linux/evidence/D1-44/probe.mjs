import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { judgeUpdate, writeSkipState, readSkipState, semverCompare } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

// D1-44 冷却边界与异常 skip 状态：仅严格早于 expireAt 算冷却；边界重新提醒；新版本无视冷却；坏状态安全降级。
const base = Date.UTC(2026, 0, 1, 0, 0, 0); // 固定基准时间
const DAY = 86400000;
const expMs = base + 3 * DAY;
const skip = {
  dismissedVersion: '1.1.5',
  dismissedAt: new Date(base).toISOString(),
  expireAt: new Date(expMs).toISOString(),
};
const distEq = { latest: '1.1.5', next: null };

// now < expireAt（严格早）→ dismissed
const rBefore = judgeUpdate('1.1.0', distEq, skip, expMs - 1);
test('D1-44-1', 'strictly-before-expire-cooled', rBefore.result === 'dismissed', rBefore.result, 'dismissed');
// now == expireAt（边界）→ 重新提醒
const rAt = judgeUpdate('1.1.0', distEq, skip, expMs);
test('D1-44-2', 'boundary-reprompts', rAt.result === 'update_available', rAt.result, 'update_available');
// now > expireAt → 重新提醒
const rAfter = judgeUpdate('1.1.0', distEq, skip, expMs + 1);
test('D1-44-3', 'after-expire-reprompts', rAfter.result === 'update_available', rAfter.result, 'update_available');

// 新版本 > dismissedVersion 无视冷却
const rNew = judgeUpdate('1.1.0', { latest: '1.2.0', next: null }, skip, expMs - 1);
test('D1-44-4', 'new-version-ignores-cooldown', rNew.result === 'update_available', rNew.result, 'update_available');
// 目标 < dismissedVersion 仍在冷却
const rLow = judgeUpdate('1.1.0', { latest: '1.1.4', next: null }, skip, expMs - 1);
test('D1-44-5', 'lower-target-stays-cooled', rLow.result === 'dismissed', rLow.result, 'dismissed');
// 目标 == dismissedVersion 仍在冷却
test('D1-44-6', 'eq-target-stays-cooled', rBefore.result === 'dismissed', rBefore.result, 'dismissed');

// 坏 skip 文件：readSkipState 返回 null → judgeUpdate 走正常更新分支，不静默吞掉更新
const tmp = mkdtempSync(join(tmpdir(), 'd1-44-'));
try {
  const malformedJson = join(tmp, 'bad.json');
  writeFileSync(malformedJson, '{"dismissedVersion":"1.1.5"}', 'utf8'); // 缺 expireAt
  test('D1-44-7', 'incomplete-skip-reads-null', readSkipState(malformedJson) === null, String(readSkipState(malformedJson)), 'null');

  const rBad = judgeUpdate('1.1.0', { latest: '1.2.0', next: null }, null);
  test('D1-44-8', 'null-skip-does-not-swallow-update', rBad.result === 'update_available', rBad.result, 'update_available');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

test('D1-44-9', 'semver-compare-boundary', semverCompare('1.1.5', '1.1.5') === 0 && semverCompare('1.1.5', '1.2.0') === -1, `${semverCompare('1.1.5', '1.1.5')},${semverCompare('1.1.5', '1.2.0')}`, '0,-1');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-44', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);