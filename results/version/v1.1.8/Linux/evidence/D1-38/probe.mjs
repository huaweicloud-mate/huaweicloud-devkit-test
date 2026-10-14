import { writeFileSync } from 'node:fs';
import { upgradePackage } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

// D1-38 huaweicloud_upgrade 语义：成功返回 previousVersion/installedVersion/requiresRestart=true + 重启文案；失败返回手动 npx 命令。
const spawnOk = () => ({ status: 0, stdout: '', stderr: '' });
const ok = await upgradePackage(
  { target: 'opencode', version: 'latest' },
  { doQuery: async () => ({ latest: '1.2.0', next: null }), currentVersion: '1.1.0', spawnFn: spawnOk },
);
test('D1-38-1', 'upgrade-success', ok.success === true, ok.success, 'true');
test('D1-38-2', 'previous-version', ok.previousVersion === '1.1.0', ok.previousVersion, '1.1.0');
test('D1-38-3', 'installed-version', ok.installedVersion === '1.2.0', ok.installedVersion, '1.2.0');
test('D1-38-4', 'requires-restart-true', ok.requiresRestart === true, ok.requiresRestart, 'true');
test('D1-38-5', 'restart-hint-present', typeof ok.message === 'string' && ok.message.includes('重启'), ok.message, '含"重启"');

// 失败（registry 查询失败）→ 提示手动 npx 命令，不误报成功
const fail = await upgradePackage(
  { target: 'opencode', version: 'latest' },
  { doQuery: async () => null, currentVersion: '1.1.0', spawnFn: spawnOk },
);
test('D1-38-6', 'query-fail-not-success', fail.success === false, fail.success, 'false');
test('D1-38-7', 'query-fail-manual-npx', typeof fail.manual === 'string' && fail.manual.includes('npx') && fail.manual.includes('huaweicloud-devkit'), fail.manual, '含 npx + huaweicloud-devkit');

// 命令执行失败 → 失败提示手动 npx 命令
const execFail = await upgradePackage(
  { target: 'opencode', version: 'latest' },
  { doQuery: async () => ({ latest: '1.2.0', next: null }), currentVersion: '1.1.0', spawnFn: () => ({ status: 1, stderr: 'boom', error: null }) },
);
test('D1-38-8', 'exec-fail-manual', execFail.success === false && typeof execFail.manual === 'string' && execFail.manual.includes('npx'), `${execFail.success}/${execFail.manual}`, 'false/含 npx');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-38', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);