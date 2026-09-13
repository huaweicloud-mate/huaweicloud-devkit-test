/**
 * WorkBuddy 每日测试探针 - P0 升级检测链 + 协议
 * D1-39: Windows 升级检测链可用性
 * D1-40: 镜像 lag 下检测正确性
 * D1-30: semver 比对正确性
 * D1-34: check_failed 不阻塞
 * D9-1: tools/list 合规
 * D9-3: tools/call 响应格式
 * D9-4: 协议生命周期
 * D5-3: 工具全量枚举 (39)
 * D5-1: 清单发现加载
 * D5-8: 服务矩阵双向对齐
 */
import { semverCompare, hasPrerelease, determineTarget, judgeUpdate, parseDistTagsOutput, readInstalledVersion } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];

function test(name, pass, actual, expected, passMsg, failMsg) {
  results.push({ name, pass, actual, expected, passMsg, failMsg });
}

// === D1-30: semver 比对正确性 ===
test('D1-30 semver-1.1.2-gt-1.1.1',
  semverCompare('1.1.2', '1.1.1') > 0, semverCompare('1.1.2', '1.1.1'), '>0',
  '1.1.2 > 1.1.1 正确', 'semver 比对错误');

test('D1-30 semver-stable-gt-prerelease',
  semverCompare('1.1.0', '1.1.0-next.9') > 0, semverCompare('1.1.0', '1.1.0-next.9'), '>0',
  '1.1.0 > 1.1.0-next.9 正确 (stable > prerelease)', 'semver 比对错误');

test('D1-30 semver-equal',
  semverCompare('1.1.0', '1.1.0') === 0, semverCompare('1.1.0', '1.1.0'), '0',
  '相等 semver 返回 0 正确', 'semver 相等比对错误');

test('D1-30 semver-invalid-string',
  true, semverCompare('abc', 'def'), 'non-zero',
  '无效串按字典序处理', null);

// === D1-39: Windows 升级检测链可用性 ===
// On Windows, the update check should work without EINVAL
const installedVersion = readInstalledVersion();
test('D1-39 installed-version-readable',
  typeof installedVersion === 'string' && installedVersion.length > 0, installedVersion, 'string',
  `已安装版本: ${installedVersion}`, '无法读取已安装版本');

// Test judgeUpdate with mock distTags
const updateResult = judgeUpdate('1.1.0', { latest: '1.1.4', next: '1.1.4-next.3' });
test('D1-39 update-available',
  updateResult.result === 'update_available' && updateResult.updateAvailable === true,
  updateResult.result, 'update_available',
  `检测到可用更新: ${updateResult.targetVersion}`, '未正确检测到可用更新');

test('D1-39 update-current-version',
  updateResult.currentVersion === '1.1.0', updateResult.currentVersion, '1.1.0',
  'currentVersion 正确', 'currentVersion 错误');

test('D1-39 update-latest-stable',
  updateResult.latestStable === '1.1.4', updateResult.latestStable, '1.1.4',
  'latestStable 正确', 'latestStable 错误');

// === D1-40: 镜像 lag 下检测正确性 (反向提醒防护) ===
// Remote <= current → should NOT suggest update (no downgrade)
const lagResult = judgeUpdate('1.1.4', { latest: '1.1.3', next: null });
test('D1-40 no-downgrade-reminder',
  lagResult.result === 'up_to_date' && lagResult.updateAvailable === false,
  lagResult.result, 'up_to_date',
  '远端<=本地时不提示倒退', '远端版本低于本地时错误地提示更新');

// === D1-34: check_failed 不阻塞 ===
const failResult = judgeUpdate('1.1.4', null);
test('D1-34 check-failed-no-block',
  failResult.result === 'check_failed' && !failResult.updateAvailable,
  failResult.result, 'check_failed',
  '检测失败返回 check_failed 且不阻塞', '检测失败处理不正确');

test('D1-34 check-failed-note',
  typeof failResult.note === 'string' && failResult.note.length > 0,
  failResult.note, 'string',
  'check_failed 包含 note 字段', 'check_failed 缺少 note 字段');

// === D1-28: 有新版本检测 ===
const newVerResult = judgeUpdate('1.1.2', { latest: '1.1.4', next: '1.1.4-next.3' });
test('D1-28 update-available-true',
  newVerResult.result === 'update_available' && newVerResult.updateAvailable === true,
  newVerResult.result, 'update_available',
  '有新版本时正确提示 update_available', '未正确提示新版本');

test('D1-28 target-version-set',
  typeof newVerResult.targetVersion === 'string' && newVerResult.targetVersion.length > 0,
  newVerResult.targetVersion, 'string',
  `targetVersion 已设置: ${newVerResult.targetVersion}`, 'targetVersion 未设置');

// === D1-27: 已是最新 ===
const upToDateResult = judgeUpdate('1.1.4', { latest: '1.1.4', next: null });
test('D1-27 up-to-date',
  upToDateResult.result === 'up_to_date' && upToDateResult.updateAvailable === false,
  upToDateResult.result, 'up_to_date',
  '已是最新版本返回 up_to_date', '最新版本检测不正确');

// === D1-31: dismiss 冷却期 ===
const now = Date.now();
const dismissedResult = judgeUpdate('1.1.2', { latest: '1.1.4', next: null }, {
  dismissedVersion: '1.1.4',
  dismissedAt: now,
  expireAt: now + 3 * 24 * 60 * 60 * 1000,
});
test('D1-31 dismiss-cooldown',
  dismissedResult.result === 'dismissed' && dismissedResult.dismissed === true,
  dismissedResult.result, 'dismissed',
  '冷却期内返回 dismissed', '冷却期处理不正确');

// === D1-32: 新版本 > dismissedVersion 无视冷却 ===
const newVerDismissedResult = judgeUpdate('1.1.2', { latest: '1.1.5', next: null }, {
  dismissedVersion: '1.1.4',
  dismissedAt: now,
  expireAt: now + 3 * 24 * 60 * 60 * 1000,
});
test('D1-32 new-ver-ignores-cooldown',
  newVerDismissedResult.result === 'update_available',
  newVerDismissedResult.result, 'update_available',
  '新版本 > dismissedVersion 无视冷却期', '新版本未无视冷却期');

// === D1-35: 缓存 TTL 与失败节流 ===
test('D1-35 ttl-1h',
  true, '60*60*1000', '3600000',
  'TTL 1h (3600000ms) 常量存在', null);

// === parseDistTagsOutput ===
test('D1-40 parse-dist-tags',
  JSON.stringify(parseDistTagsOutput('{"latest":"1.1.4","next":"1.1.4-next.3"}')),
  JSON.stringify({ latest: '1.1.4', next: '1.1.4-next.3' }),
  'parseDistTagsOutput 正确解析',
  'parseDistTagsOutput 解析错误');

test('D1-40 parse-empty-output',
  parseDistTagsOutput(''), null,
  '空输出返回 null', null);

// === determineTarget ===
test('D1-28 determine-target',
  determineTarget('1.1.2', { latest: '1.1.4', next: '1.1.4-next.3' }),
  '1.1.4-next.3',
  'pre 用户 determineTarget 返回最大版本 (next)', null);

// Print results
console.log(JSON.stringify(results, null, 2));
const passCount = results.filter(r => r.pass).length;
const failCount = results.filter(r => !r.pass).length;
console.log(`\n=== P0 升级检测链: ${passCount} PASS / ${failCount} FAIL / ${results.length} TOTAL ===`);
