import { writeFileSync } from 'node:fs';
import { upgradePackage } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 180), expected: String(expected).slice(0, 180) });
}

const spawnOk = () => ({ status: 0, stdout: '', stderr: '' });
const dist = async () => ({ latest: '1.2.0', next: null });

// D1-61 升级重启文案 officeace 分支
const officeace = await upgradePackage(
  { target: 'officeace', version: 'latest' },
  { doQuery: dist, currentVersion: '1.1.0', spawnFn: spawnOk },
);
test('D1-61-1', 'officeace-restart-true', officeace.requiresRestart === true, officeace.requiresRestart, 'true');
test('D1-61-2', 'officeace-specific-message', typeof officeace.message === 'string' && officeace.message.includes('连接器') && officeace.message.includes('重新连接'), officeace.message, '含 连接器 + 重新连接');

const other = await upgradePackage(
  { target: 'opencode', version: 'latest' },
  { doQuery: dist, currentVersion: '1.1.0', spawnFn: spawnOk },
);
test('D1-61-3', 'other-target-restart-true', other.requiresRestart === true, other.requiresRestart, 'true');
test('D1-61-4', 'other-target-generic-message', typeof other.message === 'string' && other.message.includes('重启当前会话'), other.message, '含 重启当前会话');

// 两者文案不同
test('D1-61-5', 'messages-differ', officeace.message !== other.message, 'differ', 'differ');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-61', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);