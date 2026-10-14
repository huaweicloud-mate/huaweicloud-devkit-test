import { writeFileSync } from 'node:fs';
import { judgeUpdate, parseDistTagsOutput, determineTarget } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

// D1-53 镜像滞后确定性夹具：远端不高于 current 时不提示倒退；官方有新版本时提示升级；坏响应 check_failed。
// 夹具1：镜像 latest < current（滞后）→ 不提示倒退
const m1 = judgeUpdate('1.2.0', { latest: '1.1.0', next: null });
test('D1-53-1', 'mirror-latest-below-current-no-downgrade', m1.result === 'up_to_date' && m1.updateAvailable === false, `${m1.result}/av=${m1.updateAvailable}`, 'up_to_date/av=false');

// 夹具2：镜像 next 滞后（next < current 且 latest == current）→ 不提示倒退
const m2 = judgeUpdate('1.2.0', { latest: '1.2.0', next: '1.1.0-next.1' });
test('D1-53-2', 'mirror-next-lagged-no-downgrade', m2.result === 'up_to_date', m2.result, 'up_to_date');

// 夹具3：官方 latest > current → update_available
const m3 = judgeUpdate('1.1.0', { latest: '1.2.0', next: null });
test('D1-53-3', 'official-newer-update', m3.result === 'update_available' && m3.targetVersion === '1.2.0', `${m3.result}/${m3.targetVersion}`, 'update_available/1.2.0');

// 夹具4：镜像返回坏 JSON / 坏响应 → check_failed
const m4 = judgeUpdate('1.1.0', null);
test('D1-53-4', 'bad-response-check_failed', m4.result === 'check_failed', m4.result, 'check_failed');
test('D1-53-5', 'bad-json-parses-to-null', parseDistTagsOutput('{not json') === null, String(parseDistTagsOutput('{not json')), 'null');
test('D1-53-6', 'empty-output-null', parseDistTagsOutput('') === null, String(parseDistTagsOutput('')), 'null');
test('D1-53-7', 'determine-target-from-mirror', determineTarget('1.2.0', { latest: '1.1.0', next: null }) === '1.1.0', determineTarget('1.2.0', { latest: '1.1.0', next: null }), '1.1.0');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-53', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);