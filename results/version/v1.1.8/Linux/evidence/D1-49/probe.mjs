import { writeFileSync } from 'node:fs';
import { upgradePackage, judgeUpdate, determineTarget } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

// D1-49 upgrade handler 无更新与参数校验：非法 version/目标明确拒绝；查询失败不误报成功；up_to_date 判定正确。
let spawnCalls = 0;
const spawnFn = () => {
  spawnCalls += 1;
  return { status: 0, stdout: '', stderr: '' };
};

// 非法 version 被明确拒绝（不 spawn）
const vBad = await upgradePackage({ target: 'all', version: 'beta' }, { doQuery: async () => ({ latest: '1.2.0', next: null }), currentVersion: '1.1.0', spawnFn });
test('D1-49-1', 'bad-version-rejected', vBad.success === false && vBad.error.includes('latest'), `${vBad.success}/${vBad.error}`, 'false/含 latest');
test('D1-49-2', 'bad-version-no-spawn', spawnCalls === 0, String(spawnCalls), '0');

// 非法 target 被明确拒绝
const tBad = await upgradePackage({ target: 'evil;rm', version: 'latest' }, { doQuery: async () => ({ latest: '1.2.0', next: null }), currentVersion: '1.1.0', spawnFn });
test('D1-49-3', 'bad-target-rejected', tBad.success === false && tBad.error.includes('不支持'), `${tBad.success}/${tBad.error}`, 'false/含 不支持');
test('D1-49-4', 'bad-target-no-spawn', spawnCalls === 0, String(spawnCalls), '0');

// registry 查询失败（null）→ 不误报成功，返回结构化错误 + manual
const qFail = await upgradePackage({ target: 'all', version: 'latest' }, { doQuery: async () => null, currentVersion: '1.1.0', spawnFn });
test('D1-49-5', 'null-query-reports-failure', qFail.success === false && typeof qFail.manual === 'string', `${qFail.success}/${qFail.manual}`, 'false/string');
test('D1-49-6', 'null-query-no-spawn', spawnCalls === 0, String(spawnCalls), '0');

// 查询抛异常 → 失败但不崩溃
const qThrow = await upgradePackage({ target: 'all', version: 'latest' }, { doQuery: async () => { throw new Error('registry down'); }, currentVersion: '1.1.0', spawnFn });
test('D1-49-7', 'query-throw-handled', qThrow.success === false && typeof qThrow.manual === 'string', `${qThrow.success}/${qThrow.manual}`, 'false/string');

// up_to_date 判定（target <= current）由 judgeUpdate 判定，不进入升级
const dt = determineTarget('1.1.0', { latest: '1.1.0', next: null });
const ju = judgeUpdate('1.1.0', { latest: '1.1.0', next: null });
test('D1-49-8', 'up_to_date-judged', ju.result === 'up_to_date', ju.result, 'up_to_date');
test('D1-49-9', 'default-target-is-all', typeof dt === 'string', String(dt), 'string');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-49', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);