import { writeFileSync } from 'node:fs';
import { judgeUpdate } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

// D1-34 check_failed 不阻塞正常调用：registry 不可达 -> check_failed，不抛错。
let threw = false;
let r = null;
try {
  r = judgeUpdate('1.1.0', null);
} catch (e) {
  threw = true;
}
test('D1-34-1', 'distTags-null-no-throw', threw === false, threw, 'false');
test('D1-34-2', 'distTags-null-is-check_failed', r?.result === 'check_failed', r?.result, 'check_failed');
test('D1-34-3', 'note-tells-non-blocking', typeof r?.note === 'string' && r.note.includes('不影响使用'), r?.note, '含"不影响使用"');
test('D1-34-4', 'check_failed-updateAvailable-false', r?.updateAvailable === false, r?.updateAvailable, 'false');

const r2 = judgeUpdate('1.1.0', { latest: null, next: null });
test('D1-34-5', 'empty-distTags-is-check_failed', r2.result === 'check_failed', r2.result, 'check_failed');

const r3 = judgeUpdate('1.1.0', {});
test('D1-34-6', 'empty-object-is-check_failed', r3.result === 'check_failed', r3.result, 'check_failed');

// 离线返回后，正常工具调用（后续真实 dist-tags）仍可得到正确结果，说明检测失败不阻塞。
const r4 = judgeUpdate('1.1.0', { latest: '1.2.0', next: null });
test('D1-34-7', 'recover-when-registry-returns', r4.result === 'update_available', r4.result, 'update_available');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-34', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);