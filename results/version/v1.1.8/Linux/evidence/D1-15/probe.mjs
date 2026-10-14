import { writeFileSync } from 'node:fs';
import {
  judgeUpdate,
  determineTarget,
  parseDistTagsOutput,
  semverCompare,
} from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

// D1-15 检查更新提示：正确判断 next/latest 并提示可用更新。
const r1 = judgeUpdate('1.1.0', { latest: '1.1.9', next: null });
test('D1-15-1', 'new-latest-triggers-update', r1.result === 'update_available' && r1.updateAvailable === true, `${r1.result},av=${r1.updateAvailable}`, 'update_available,av=true');
test('D1-15-2', 'target-is-latest', r1.targetVersion === '1.1.9', r1.targetVersion, '1.1.9');

const r2 = judgeUpdate('1.1.9', { latest: '1.1.9', next: null });
test('D1-15-3', 'same-version-up_to_date', r2.result === 'up_to_date' && r2.updateAvailable === false, r2.result, 'up_to_date');

// 稳定版用户只候选 latest，忽略 next
const t = determineTarget('1.1.0', { latest: '1.2.0', next: '1.3.0-next.0' });
test('D1-15-4', 'stable-user-ignores-next', t === '1.2.0', t, '1.2.0');

// parse dist-tags 输出（npm view --json）
const parsed = parseDistTagsOutput('{"latest":"1.2.0","next":"1.3.0-next.0"}');
test('D1-15-5', 'parse-dist-tags', parsed && parsed.latest === '1.2.0' && parsed.next === '1.3.0-next.0', JSON.stringify(parsed), '{"latest":"1.2.0","next":"1.3.0-next.0"}');

test('D1-15-6', 'semver-newer-positive', semverCompare('1.1.9', '1.1.0') === 1, semverCompare('1.1.9', '1.1.0'), '1');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-15', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);