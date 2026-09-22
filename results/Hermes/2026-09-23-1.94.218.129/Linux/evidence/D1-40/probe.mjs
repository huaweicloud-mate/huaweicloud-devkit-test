// D1-40 (P0): 镜像 lag 下检测正确性(反向提醒防护)
// 源码级断言: judgeUpdate + semverCompare 在「远端 <= 本地」时不得提示版本倒退。
// 真实镜像 lag 佐证: 本机 npm 私有镜像 127.0.0.1:45998 latest=1.1.3，官方 registry.npmjs.org latest=1.1.5（verify 步骤已实测）。
import { judgeUpdate, semverCompare, readInstalledVersion } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { writeFileSync } from 'node:fs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual), expected: String(expected) });
}

// ---- semverCompare 正确性 ----
test('D1-40', 'semver-gt', semverCompare('1.1.2', '1.1.1') > 0, semverCompare('1.1.2', '1.1.1'), '>0');
test('D1-40', 'semver-lt', semverCompare('1.1.2', '1.1.3') < 0, semverCompare('1.1.2', '1.1.3'), '<0');
test('D1-40', 'semver-eq', semverCompare('1.1.2', '1.1.2') === 0, semverCompare('1.1.2', '1.1.2'), '==0');
test('D1-40', 'semver-stable-gt-pre', semverCompare('1.1.2', '1.1.2-rc.1') > 0, semverCompare('1.1.2', '1.1.2-rc.1'), '>0');

// ---- 核心断言: 镜像 lag（远端 latest < 本地 current）不得提示倒退 ----
// 本机真实场景: 镜像 latest=1.1.3，本地已装 1.1.5 → judgeUpdate 必须 up_to_date（不得说 upgrade 到 1.1.3）
const mirrorLag = judgeUpdate('1.1.5', { latest: '1.1.3', next: null });
test('D1-40', 'mirror-lag-no-downgrade', mirrorLag.result === 'up_to_date', mirrorLag.result, 'up_to_date');

// 远端 == 本地 → up_to_date
const equalVer = judgeUpdate('1.1.5', { latest: '1.1.5', next: null });
test('D1-40', 'equal-no-hint', equalVer.result === 'up_to_date', equalVer.result, 'up_to_date');

// 远端 > 本地 → update_available（正常升级提示仍有效，证明不是一律静默）
const newerVer = judgeUpdate('1.1.4', { latest: '1.1.5', next: null });
test('D1-40', 'newer-still-updates', newerVer.result === 'update_available', newerVer.result, 'update_available');

// distTags 缺失/无效 → check_failed（检测失败也不提示倒退）
const noTags = judgeUpdate('1.1.5', { latest: null, next: null });
test('D1-40', 'no-tags-check-failed', noTags.result === 'check_failed', noTags.result, 'check_failed');

// readInstalledVersion 可读
const installed = readInstalledVersion();
test('D1-40', 'installed-version-readable', typeof installed === 'string' && installed.length > 0, installed, 'string');

const passed = results.filter(r => r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed: results.length - passed, results }, null, 2);
writeFileSync(new URL('file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-23-1.94.218.129/Linux/evidence/D1-40/stdout.log'), output, 'utf8');
console.log(output);