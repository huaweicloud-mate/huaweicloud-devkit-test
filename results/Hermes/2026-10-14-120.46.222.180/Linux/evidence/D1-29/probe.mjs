import { writeFileSync } from 'node:fs';
import {
  determineTarget,
  judgeUpdate,
  hasPrerelease,
  semverCompare,
} from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

// D1-29 pre-release 用户提醒策略：候选含 latest + next 取最大。
// 场景1：latest 比 next 大，取 latest
const dt1 = determineTarget('1.1.0-next.8', { latest: '1.2.0', next: '1.1.0-next.9' });
test('D1-29-1', 'pre-candidates-include-latest-and-next-take-max', dt1 === '1.2.0', dt1, '1.2.0');

// 场景2：仅 next 提升时，latest 作为正式版仍大于 prerelease，取 latest
const dt2 = determineTarget('1.1.0-next.8', { latest: '1.1.0', next: '1.1.0-next.9' });
test('D1-29-2', 'pre-candidates-max-is-stable-latest', dt2 === '1.1.0', dt2, '1.1.0');

// 场景3：next 大于 latest 时（next 跨 minor），取 next
const dt3 = determineTarget('1.2.0-next.1', { latest: '1.2.0', next: '1.3.0-next.0' });
test('D1-29-3', 'pre-candidates-max-is-next-when-higher', dt3 === '1.3.0-next.0', dt3, '1.3.0-next.0');

// judgeUpdate 对 pre 用户返回 update_available
const ju = judgeUpdate('1.1.0-next.8', { latest: '1.2.0', next: '1.1.0-next.9' });
test('D1-29-4', 'pre-user-judge-update', ju.result === 'update_available' && ju.targetVersion === '1.2.0', `${ju.result}/${ju.targetVersion}`, 'update_available/1.2.0');

test('D1-29-5', 'hasPrerelease-true', hasPrerelease('1.1.0-next.8') === true, hasPrerelease('1.1.0-next.8'), 'true');
test('D1-29-6', 'hasPrerelease-false', hasPrerelease('1.1.0') === false, hasPrerelease('1.1.0'), 'false');
test('D1-29-7', 'semver-prerelease-lt-stable', semverCompare('1.1.0-next.9', '1.1.0') === -1, semverCompare('1.1.0-next.9', '1.1.0'), '-1');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-29', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);