import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  judgeUpdate,
  writeSkipState,
  readSkipState,
  semverCompare,
} from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

const tmp = mkdtempSync(join(tmpdir(), 'd1-32-'));
const file = join(tmp, 'skip.json');
try {
  // 构造冷却期 skip 状态：dismissedVersion=1.1.2，3 天冷却
  const state = writeSkipState(file, '1.1.2');
  test('D1-32-1', 'writeSkipState-roundtrip', readSkipState(file)?.dismissedVersion === '1.1.2', readSkipState(file)?.dismissedVersion, '1.1.2');

  // 新版本 1.2.0 > dismissedVersion 1.1.2 -> 无视冷却，重新提醒
  const ju = judgeUpdate('1.1.0', { latest: '1.2.0', next: null }, state);
  test('D1-32-2', 'new-version-beats-dismissed', ju.result === 'update_available' && ju.targetVersion === '1.2.0', `${ju.result}/${ju.targetVersion}`, 'update_available/1.2.0');
  test('D1-32-3', 'new-version-not-dismissed', ju.dismissed === false, ju.dismissed, 'false');

  // 目标版本 1.1.1 <= dismissedVersion 1.1.2 仍在冷却 => dismissed
  const ju2 = judgeUpdate('1.1.0', { latest: '1.1.1', next: null }, state);
  test('D1-32-4', 'target-le-dismissed-stays-cooling', ju2.result === 'dismissed' && ju2.dismissed === true, `${ju2.result}/dismissed=${ju2.dismissed}`, 'dismissed/dismissed=true');

  // 目标恰等于 dismissedVersion 仍在冷却（semverCompare<=0）
  const ju3 = judgeUpdate('1.1.0', { latest: '1.1.2', next: null }, state);
  test('D1-32-5', 'target-eq-dismissed-stays-cooling', ju3.result === 'dismissed', ju3.result, 'dismissed');

  test('D1-32-6', 'semver-eq', semverCompare('1.1.2', '1.1.2') === 0, semverCompare('1.1.2', '1.1.2'), '0');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-32', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);