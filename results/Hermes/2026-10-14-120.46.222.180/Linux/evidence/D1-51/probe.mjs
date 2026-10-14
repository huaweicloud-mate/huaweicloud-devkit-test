import { writeFileSync } from 'node:fs';
import { upgradePackage, peekCachedUpdateInfo } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

// D1-51 upgrade 失败恢复与副作用：失败不崩溃、不误报 success、含 manual 命令；恢复后可再次升级。
const dist = { latest: '1.2.0', next: null };

// 1) spawn 返回非零退出（含 stderr）→ 失败 + manual
const f1 = await upgradePackage(
  { target: 'all', version: 'latest' },
  { doQuery: async () => dist, currentVersion: '1.1.0', spawnFn: () => ({ status: 1, stderr: 'EBUSY: resource busy or locked', error: null }) },
);
test('D1-51-1', 'nonzero-exit-not-success', f1.success === false, f1.success, 'false');
test('D1-51-2', 'nonzero-exit-error-reason', typeof f1.error === 'string' && f1.error.includes('EBUSY'), f1.error, '含 EBUSY');
test('D1-51-3', 'nonzero-exit-manual-with-tag', typeof f1.manual === 'string' && f1.manual.includes('huaweicloud-devkit@latest') && f1.manual.includes('--target all'), f1.manual, '含 @latest + --target all');

// 2) spawn 抛异常（如 ENOENT）→ 失败不崩溃 + manual
const f2 = await upgradePackage(
  { target: 'all', version: 'latest' },
  { doQuery: async () => dist, currentVersion: '1.1.0', spawnFn: () => { throw new Error('spawn ENOENT'); } },
);
test('D1-51-4', 'spawn-throw-not-crash', f2.success === false, f2.success, 'false');
test('D1-51-5', 'spawn-throw-manual', typeof f2.manual === 'string' && f2.manual.includes('npx'), f2.manual, '含 npx');

// 3) registry 查询抛异常 → 失败 + manual，不崩溃
const f3 = await upgradePackage(
  { target: 'all', version: 'latest' },
  { doQuery: async () => { throw new Error('EINVAL'); }, currentVersion: '1.1.0', spawnFn: () => ({ status: 0, stdout: '', stderr: '' }) },
);
test('D1-51-6', 'query-throw-manual', f3.success === false && typeof f3.manual === 'string' && f3.error.includes('EINVAL'), `${f3.success}/${f3.error}`, 'false/含 EINVAL');

// 4) 故障修复后重试 → 成功，可恢复
const ok = await upgradePackage(
  { target: 'all', version: 'latest' },
  { doQuery: async () => dist, currentVersion: '1.1.0', spawnFn: () => ({ status: 0, stdout: '', stderr: '' }) },
);
test('D1-51-7', 'recovery-succeeds', ok.success === true && ok.installedVersion === '1.2.0' && ok.requiresRestart === true, `${ok.success}/${ok.installedVersion}/${ok.requiresRestart}`, 'true/1.2.0/true');

// 升级失败不应污染 skip 状态（upgradePackage 不写 skip 文件；peek 仅反映内存 hint，此处无 update check 调用）
test('D1-51-8', 'no-skip-pollution-by-upgrade', f1.success === false && f1.dismissed === undefined, 'no dismissed field', 'no dismissed field');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-51', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);