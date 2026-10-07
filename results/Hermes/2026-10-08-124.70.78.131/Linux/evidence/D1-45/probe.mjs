// D1-45 兜底提示真实序列与预热竞态（源码级探针，Hermes Linux）
// 深挖假阻塞：兜底一次性消费 + check/upgrade 排除 + 预热未完成不阻塞，全部可函数级直调。
// 断言：
//   ① applyUpdateHint 只对「非 check_update/upgrade」工具附加 _updateInfo
//   ② 会话内首个非检查工具消费一次后被标记 consumed，后续不再附加
//   ③ 按 sessionId 隔离：A 会话消费不影响 B 会话首次提示
//   ④ 预热未完成（无缓存 hint）→ _decorateResult 原样返回、不崩溃、不阻塞
import { join } from 'node:path';

const SRCDIR = process.argv[2];
const { getCachedUpdateInfo, peekCachedUpdateInfo, invalidateUpdateCache, applyUpdateHint } =
  await import(join(SRCDIR, 'update-check.mjs'));
const { _decorateResult, _resetHintConsumption, _isHintConsumed } =
  await import(join(SRCDIR, 'mcp-protocol.mjs'));

let ok = true;
function check(id, cond, detail) {
  console.log(`[${cond ? 'PASS' : 'FAIL'}] ${id}: ${detail}`);
  if (!cond) ok = false;
}

// ① applyUpdateHint 名称过滤
const hint = { currentVersion: '1.1.0', latestVersion: '1.2.0', updateAvailable: true, targetVersion: '1.2.0' };
const rCheck = applyUpdateHint({ data: 1 }, 'huaweicloud_check_update', hint);
const rUpgrade = applyUpdateHint({ data: 1 }, 'huaweicloud_upgrade', hint);
const rOther = applyUpdateHint({ data: 1 }, 'huaweicloud_service_catalog', hint);
console.log('applyUpdateHint(check_update) =', JSON.stringify(rCheck));
console.log('applyUpdateHint(upgrade)      =', JSON.stringify(rUpgrade));
console.log('applyUpdateHint(other tool)   =', JSON.stringify(rOther));
check('①check_update 不附加', !rCheck._updateInfo, '检查工具不复读升级提示');
check('①upgrade 不附加', !rUpgrade._updateInfo, '升级工具不复读升级提示');
check('①非检查工具附加', rOther._updateInfo?.latestVersion === '1.2.0', '首个普通工具附加 _updateInfo');

// ③④ 预热竞态 + 一次性 + 会话隔离（走 _decorateResult 全链路）
invalidateUpdateCache();
_resetHintConsumption();
const noHint = _decorateResult('A', 'huaweicloud_service_catalog', { r: 1 });
console.log('预热未完成 _decorateResult =', JSON.stringify(noHint));
check('④预热未完成不阻塞', JSON.stringify(noHint) === '{"r":1}', '无缓存 hint 原样返回');

// 注入可更新 distTags → 预热就绪
await getCachedUpdateInfo('1.1.0', { doQuery: async () => ({ latest: '1.2.0', next: null }), now: Date.now() });
const peeked = peekCachedUpdateInfo();
console.log('peekCachedUpdateInfo =', JSON.stringify(peeked));
check('预热就绪', !!peeked && peeked.updateAvailable && peeked.targetVersion === '1.2.0', '注入后 lastHint 就绪');

_resetHintConsumption();
const c1 = _decorateResult('A', 'huaweicloud_some_tool', { r: 2 });
const c2 = _decorateResult('A', 'huaweicloud_other_tool', { r: 3 });
const cB = _decorateResult('B', 'huaweicloud_other_tool', { r: 4 });
console.log('A 首工具 =', JSON.stringify(c1));
console.log('A 次工具 =', JSON.stringify(c2));
console.log('B 首工具 =', JSON.stringify(cB));
check('②会话内一次性', c1._updateInfo && !c2._updateInfo, 'A 会话首个工具附加、后续不重复');
check('②消费标记', _isHintConsumed('A') === true, 'A 会话已标记 consumed');
check('③会话隔离', cB._updateInfo && !_isHintConsumed('A') === false ? true : _isHintConsumed('B') === true, 'B 会话独立首次提示');

// 检查类工具即使首次调用也不消费
_resetHintConsumption();
const d1 = _decorateResult('C', 'huaweicloud_check_update', { r: 5 });
console.log('C 首工具=check_update =', JSON.stringify(d1), '| consumed=', _isHintConsumed('C'));
check('①首工具为检查类不消费', !d1._updateInfo && _isHintConsumed('C') === false, 'check_update 不附加也不消费兜底提示');

console.log(`\n=== D1-45 探针结论: ${ok ? 'ALL PASS' : 'HAS FAIL'} ===`);
process.exit(ok ? 0 : 1);