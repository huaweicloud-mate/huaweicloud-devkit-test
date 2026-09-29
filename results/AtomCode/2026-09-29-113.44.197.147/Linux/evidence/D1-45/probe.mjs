// D1-41 / D1-42 / D1-45 —— 更新检测链 源码级直调函数探针（无需真机安装态/无需可控 npm registry/无需跨进程真实重启）
//   D1-41 check_update 真实 MCP 返回契约：judgeUpdate 四态（up_to_date/update_available/check_failed/dismissed）字段契约
//   D1-42 dismiss 真实闭环与跨调用持久化：writeSkipState/readSkipState 落盘字段 + 冷却窗口/过期重提语义
//   D1-45 兜底提示真实序列：applyUpdateHint（check/upgrade 不附加）+ _decorateResult 会话级只消费一次（注入 doQuery 驱动 getCachedUpdateInfo）
import { judgeUpdate, writeSkipState, readSkipState, applyUpdateHint, getCachedUpdateInfo, invalidateUpdateCache } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { _decorateResult, _resetHintConsumption, _isHintConsumed } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';

const now = Date.now();
const DAY = 24 * 3600 * 1000;
let pass = 0, fail = 0;
function ck(name, cond) { (cond ? pass++ : fail++); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`); }

// ---- D1-41 check_update 四态字段契约 ----
const s1 = judgeUpdate('1.1.4', { latest: '1.1.4', next: null }, null, now);
ck('D1-41 up_to_date: result=up_to_date & updateAvailable=false & currentVersion=1.1.4',
  s1.result === 'up_to_date' && s1.updateAvailable === false && s1.currentVersion === '1.1.4');
const s2 = judgeUpdate('1.1.4', { latest: '1.2.0', next: null }, null, now);
ck('D1-41 update_available: updateAvailable=true & targetVersion=1.2.0',
  s2.result === 'update_available' && s2.updateAvailable === true && s2.targetVersion === '1.2.0');
const s3 = judgeUpdate('1.1.4', null, null, now);
ck('D1-41 check_failed: result=check_failed & note 非空 & updateAvailable=false',
  s3.result === 'check_failed' && !!s3.note && s3.updateAvailable === false);
const st0 = writeSkipState('/tmp/hdk-d1-42-skip.json', '1.2.0', { at: now });
const s4 = judgeUpdate('1.1.3', { latest: '1.2.0', next: null }, st0, now);
ck('D1-41 dismissed: result=dismissed & dismissed=true & dismissExpiresAt 非空',
  s4.result === 'dismissed' && s4.dismissed === true && !!s4.dismissExpiresAt);

// ---- D1-42 dismiss 闭环 + 跨调用持久化 ----
const f = '/tmp/hdk-d1-42-skip.json';
writeSkipState(f, '1.2.0', { at: now });
const rs = readSkipState(f);
const dAt = new Date(rs.dismissedAt).getTime();
const eAt = new Date(rs.expireAt).getTime();
ck('D1-42 落盘字段完整 (dismissedVersion=dismissedAt=expireAt 齐全)', rs.dismissedVersion === '1.2.0' && !!rs.dismissedAt && !!rs.expireAt);
ck('D1-42 expireAt = dismissedAt + 3 天', eAt - dAt === 3 * DAY);
ck('D1-42 重读文件(模拟重启复查) 仍生效', readSkipState(f).dismissedVersion === '1.2.0');
ck('D1-42 同版本冷却窗口内 => dismissed', judgeUpdate('1.1.3', { latest: '1.2.0', next: null }, rs, now).result === 'dismissed');
ck('D1-42 冷却过期后 => update_available', judgeUpdate('1.1.3', { latest: '1.2.0', next: null }, rs, eAt + 1000).result === 'update_available');

// ---- D1-45 兜底提示序列（_updateInfo 只附加首个非 check/upgrade 工具，且会话级只消费一次）----
const hint = { currentVersion: '1.1.4', latestVersion: '1.2.0', updateAvailable: true, targetVersion: '1.2.0' };
ck('D1-45 check_update 不附加 _updateInfo', applyUpdateHint({ a: 1 }, 'huaweicloud_check_update', hint)._updateInfo === undefined);
ck('D1-45 upgrade 不附加 _updateInfo', applyUpdateHint({ a: 1 }, 'huaweicloud_upgrade', hint)._updateInfo === undefined);
ck('D1-45 其它工具附加 _updateInfo(latestVersion=1.2.0)', applyUpdateHint({ a: 1 }, 'huaweicloud_list_regions', hint)._updateInfo?.latestVersion === '1.2.0');

// 真实 consume-once 语义：注入固定 dist-tags 驱动 getCachedUpdateInfo
invalidateUpdateCache();
_resetHintConsumption();
const fakeDoQuery = async () => ({ latest: '1.2.0', next: null });
await getCachedUpdateInfo('1.1.4', { doQuery: fakeDoQuery, now });
ck('D1-45 首调非 check/upgrade 工具附加 _updateInfo', _decorateResult('sessA', 'huaweicloud_list_regions', {})._updateInfo?.latestVersion === '1.2.0');
ck('D1-45 首调后该会话已消费', _isHintConsumed('sessA') === true);
ck('D1-45 同会话第二次调用不附加', _decorateResult('sessA', 'huaweicloud_search_docs', {})._updateInfo === undefined);
_resetHintConsumption();
await getCachedUpdateInfo('1.1.4', { doQuery: fakeDoQuery, now });
ck('D1-45 check_update 自身不附加不消费', _decorateResult('sessB', 'huaweicloud_check_update', {})._updateInfo === undefined && _isHintConsumed('sessB') === false);
_resetHintConsumption();
await getCachedUpdateInfo('1.1.4', { doQuery: fakeDoQuery, now });
_decorateResult('sessC', 'huaweicloud_list_regions', {});
_decorateResult('sessD', 'huaweicloud_list_regions', {});
ck('D1-45 会话隔离：sessC/sessD 各自首调独立附加', _isHintConsumed('sessC') === true && _isHintConsumed('sessD') === true);

console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);
