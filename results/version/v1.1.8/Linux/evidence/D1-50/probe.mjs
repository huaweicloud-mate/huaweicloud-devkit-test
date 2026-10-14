import { writeFileSync } from 'node:fs';
import { upgradePackage } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 150), expected: String(expected).slice(0, 150) });
}

// D1-50 upgrade 命令语义与目标选择：稳定版选 latest，pre 版选 next；目标正确传递；成功必返回 requiresRestart=true。
// 稳定版 current -> 选 latest tag
let cap1 = null;
const r1 = await upgradePackage(
  { target: 'opencode', version: 'latest' },
  {
    doQuery: async () => ({ latest: '1.2.0', next: '1.3.0-next.0' }),
    currentVersion: '1.1.0',
    spawnFn: (cmd, args) => {
      cap1 = { cmd, args };
      return { status: 0, stdout: '', stderr: '' };
    },
  },
);
test('D1-50-1', 'stable-selects-latest-tag', cap1?.args.includes('huaweicloud-devkit@latest') === true, JSON.stringify(cap1?.args), '含 huaweicloud-devkit@latest');
test('D1-50-2', 'target-correct', cap1?.args.includes('--target') === true && cap1?.args[cap1.args.indexOf('--target') + 1] === 'opencode', JSON.stringify(cap1?.args), '--target opencode');
test('D1-50-3', 'success-restart-true', r1.success === true && r1.requiresRestart === true, `${r1.success}/${r1.requiresRestart}`, 'true/true');
test('D1-50-4', 'installed-version', r1.installedVersion === '1.2.0', r1.installedVersion, '1.2.0');

// pre 版 current + next 更高 -> 选 next tag
let cap2 = null;
const r2 = await upgradePackage(
  { target: 'officeace', version: 'latest' },
  {
    doQuery: async () => ({ latest: '1.2.0', next: '1.3.0-next.0' }),
    currentVersion: '1.2.0-next.1',
    spawnFn: (cmd, args) => {
      cap2 = { cmd, args };
      return { status: 0, stdout: '', stderr: '' };
    },
  },
);
test('D1-50-5', 'pre-selects-next-tag', cap2?.args.includes('huaweicloud-devkit@next') === true, JSON.stringify(cap2?.args), '含 huaweicloud-devkit@next');
test('D1-50-6', 'pre-installed-version-next', r2.installedVersion === '1.3.0-next.0', r2.installedVersion, '1.3.0-next.0');
test('D1-50-7', 'officeace-target-correct', cap2?.args.includes('--target') === true && cap2?.args[cap2.args.indexOf('--target') + 1] === 'officeace', JSON.stringify(cap2?.args), '--target officeace');

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-50', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);