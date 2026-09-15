// 升级检测链探针：直调 update-check.mjs 导出函数
import {
  semverCompare,
  semverParse,
  hasPrerelease,
  determineTarget,
  judgeUpdate,
  parseDistTagsOutput,
} from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/update-check.mjs';

let pass = 0, fail = 0;
function eq(id, desc, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D1-30 semver 比对正确性
eq('D1-30', '1.1.3 < 1.1.4', semverCompare('1.1.3', '1.1.4'), -1);
eq('D1-30', '1.1.4 == 1.1.4', semverCompare('1.1.4', '1.1.4'), 0);
eq('D1-30', '1.2.0 > 1.1.9', semverCompare('1.2.0', '1.1.9'), 1);
eq('D1-30', 'prerelease 升序 (next.2 < next.3)', Math.sign(semverCompare('1.1.4-next.2', '1.1.4-next.3')), -1);
eq('D1-30', 'hasPrerelease("1.1.4-next.3")', hasPrerelease('1.1.4-next.3'), true);
eq('D1-30', 'hasPrerelease("1.1.4")', hasPrerelease('1.1.4'), false);
// D1-26 检测语义：已是最新 / 有新版本
eq('D1-27', '当前=最新 => up_to_date', judgeUpdate('1.1.4', { latest: '1.1.4' }, null).result, 'up_to_date');
eq('D1-28', '当前<最新 => update_available', judgeUpdate('1.1.3', { latest: '1.1.4' }, null).result, 'update_available');
eq('D1-28', 'targetVersion 正确', judgeUpdate('1.1.3', { latest: '1.1.4' }, null).targetVersion, '1.1.4');
// D1-40 镜像 lag / prerelease 跟随 next
eq('D1-40', 'pre 跟随更高 next', determineTarget('1.1.4-next.1', { latest: '1.1.4', next: '1.1.5-next.0' }), '1.1.5-next.0');
eq('D1-40', '稳定版只跟 latest', determineTarget('1.1.4', { latest: '1.1.5', next: '1.1.5-next.0' }), '1.1.5');
// D1-31 dismiss 冷却期
{
  const skipState = { expireAt: new Date(Date.now() + 60000).toISOString(), dismissedVersion: '1.1.4' };
  eq('D1-31', '冷却期内 => dismissed', judgeUpdate('1.1.3', { latest: '1.1.4' }, skipState).result, 'dismissed');
}
{
  const skipState = { expireAt: new Date(Date.now() - 60000).toISOString(), dismissedVersion: '1.1.4' };
  eq('D1-31', '冷却期过 => update_available', judgeUpdate('1.1.3', { latest: '1.1.4' }, skipState).result, 'update_available');
}
// D1-45 兜底提示 SKIP_UPDATE
{
  process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE = '1';
  const r = judgeUpdate('1.1.3', { latest: '1.1.4' }, null);
  eq('D1-45', 'SKIP_UPDATE=1 兜底返回 up_to_date', r.result, 'up_to_date');
  delete process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE;
}

console.log(`TOTAL pass=${pass} fail=${fail}`);