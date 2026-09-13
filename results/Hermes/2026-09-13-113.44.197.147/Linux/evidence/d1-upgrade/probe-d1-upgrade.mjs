/**
 * Hermes 每日测试探针 - D1 安装/升级检测链 (Linux, 源码级)
 * SUT: huaweicloud-devkit@1.1.4-next.3 (commit 3b6290b0)
 * 覆盖: D1-3(doctor) / D1-27/28/30/31/32/34/35/40 (升级检测链) 源码级
 */
import { semverCompare, hasPrerelease, determineTarget, judgeUpdate, parseDistTagsOutput, readInstalledVersion, peekCachedUpdateInfo } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

let pass = 0, fail = 0; const failures = [];
function T(id, name, actual, expected, expectFn) {
  const ok = typeof expectFn === 'function' ? expectFn(actual) : actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${name}  => ${JSON.stringify(actual)}${ok ? '' : '  (expected ' + JSON.stringify(expected) + ')'}`);
  if (ok) pass++; else { fail++; failures.push({ id, name, actual, expected }); }
  return ok;
}

console.log('=== 环境/版本 ===');
console.log('readInstalledVersion:', readInstalledVersion());

console.log('\n===== D1-30 semver 比对正确性 =====');
T('D1-30','1.2.0 < 1.10.0 (数值非字典序)', semverCompare('1.2.0','1.10.0'), -1);
T('D1-30','1.1.4-next.3 < 1.1.4 (pre<stable)', semverCompare('1.1.4-next.3','1.1.4'), -1);
T('D1-30','1.1.4 == 1.1.4', semverCompare('1.1.4','1.1.4'), 0);
T('D1-30','2.0.0 > 1.9.9', semverCompare('2.0.0','1.9.9'), 1);

console.log('\n===== D1-27 检测语义-已是最新 =====');
T('D1-27','current==latest 不提示升级', judgeUpdate('1.1.4', {latest:'1.1.4'}).result, 'up_to_date');
T('D1-27','current==latest updateAvailable=false', judgeUpdate('1.1.4', {latest:'1.1.4'}).updateAvailable, false);

console.log('\n===== D1-28 检测语义-有新版本 =====');
const upd = judgeUpdate('1.1.3', {latest:'1.1.4'});
T('D1-28','有新版本 update_available', upd.result, 'update_available');
T('D1-28','target=1.1.4', upd.targetVersion, '1.1.4');

console.log('\n===== D1-40 镜像 lag 下检测正确性 (反向提醒防护) =====');
T('D1-40','远端低于本地不提示 (无版本倒退)', judgeUpdate('1.1.4', {latest:'1.1.3'}).result, 'up_to_date');
T('D1-40','远端等于本地不提示', judgeUpdate('1.1.4', {latest:'1.1.4'}).result, 'up_to_date');
T('D1-40','远端高于本地正常提示', judgeUpdate('1.1.3', {latest:'1.1.4'}).result, 'update_available');

console.log('\n===== D1-31 dismiss 冷却期 =====');
const future = new Date(Date.now() + 3600*1000).toISOString();
const skip = { dismissedVersion:'1.1.4', dismissedAt:'2026-09-13T00:00:00.000Z', expireAt: future };
T('D1-31','冷却期内 dismissed', judgeUpdate('1.1.3', {latest:'1.1.4'}, skip).result, 'dismissed');
console.log('\n===== D1-32 新版本 > dismissedVersion 无视冷却 =====');
T('D1-32','1.1.5 > dismissed 1.1.4 仍提示', judgeUpdate('1.1.3', {latest:'1.1.5'}, skip).result, 'update_available');

console.log('\n===== D1-34 check_failed 不阻塞 =====');
T('D1-34','distTags=null → check_failed 不抛异常', judgeUpdate('1.1.3', null).result, 'check_failed');

console.log('\n===== D1-40（补充） distTags 解析健壮 =====');
T('D1-40','parseDistTagsOutput 异常输出返回 null', parseDistTagsOutput('<!DOCTYPE html>'), null);
T('D1-40','parseDistTagsOutput 正常 JSON', parseDistTagsOutput('{"latest":"1.1.4","next":"1.1.4-next.3"}').latest, '1.1.4');

console.log('\n===== D1-35 缓存 (peek 初始状态) =====');
let peekOk = true; try { const p = peekCachedUpdateInfo(); peekOk = p === null || typeof p === 'object'; } catch { peekOk = false; }
T('D1-35','peekCachedUpdateInfo 无崩溃且可选 null', peekOk, true);

console.log('\n===== determineTarget 目标选择 =====');
T('D1-28','stable 选 latest', determineTarget('1.1.3', {latest:'1.1.4'}), '1.1.4');
T('D1-28','pre 版有更新 stable 时选 stable', determineTarget('1.1.4-next.2', {latest:'1.1.4', next:'1.1.4-next.3'}), '1.1.4');

console.log(`\n===== D1 汇总: ${pass} PASS / ${fail} FAIL =====`);
if (fail) { failures.forEach(f=>console.log(`  - ${f.id} ${f.name}: actual=${JSON.stringify(f.actual)}`)); }
process.exitCode = fail > 0 ? 1 : 0;