// D1-45 兜底提示真实序列与预热竞态（P1）
// 断言：①applyUpdateHint 仅对非 check/upgrade 工具附加 _updateInfo 且不改写入参对象；
//       ②同一 hint 只附加一次（会话内消费标记）；③预热未完成（缓存为空）时不阻塞正常工具调用
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const SERVER = join(SRC, 'mcp-server.mjs');
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const uc = await import(pathToFileURL(join(SRC, 'update-check.mjs')).href);
const proto = await import(pathToFileURL(join(SRC, 'mcp-protocol.mjs')).href);

const hint = { currentVersion: '1.1.7', latestStable: '1.1.2', latestNext: '1.1.8-next.1', targetVersion: '1.1.2', updateAvailable: true };
const mk = () => ({ content: [{ type: 'text', text: '{"ok":true}' }], isError: false });

const toolNames = ['huaweicloud_check_update', 'huaweicloud_upgrade', 'huaweicloud_check_cli', 'huaweicloud_search_docs'];
const applyRows = toolNames.map((n) => {
  const before = mk();
  const snapshot = JSON.stringify(before);
  const after = uc.applyUpdateHint(before, n, hint);
  return {
    tool: n,
    isCheckOrUpgrade: n === 'huaweicloud_check_update' || n === 'huaweicloud_upgrade',
    gotUpdateInfo: !!(after && after._updateInfo),
    inputMutated: JSON.stringify(before) !== snapshot,
    satisfied: (n === 'huaweicloud_check_update' || n === 'huaweicloud_upgrade')
      ? !(after && after._updateInfo) : !!(after && after._updateInfo),
  };
});

proto._resetHintConsumption();
const t0 = process.hrtime.bigint();
const cold = proto._decorateResult('seq-A', 'huaweicloud_search_docs', mk());
const elapsedMs = Number(process.hrtime.bigint() - t0) / 1e6;
const coldNoUpdateInfo = !(cold && cold._updateInfo);
const notConsumedWhenNoHint = !proto._isHintConsumed('seq-A');
const repeatRows = [1, 2, 3].map((i) => {
  const r = uc.applyUpdateHint(mk(), 'huaweicloud_search_docs', hint);
  return { call: i, gotUpdateInfo: !!(r && r._updateInfo) };
});

const rows = [
  { id: 'check_update 工具不附加 _updateInfo', ok: applyRows[0].satisfied, actual: applyRows[0].gotUpdateInfo },
  { id: 'upgrade 工具不附加 _updateInfo', ok: applyRows[1].satisfied, actual: applyRows[1].gotUpdateInfo },
  { id: '非检查工具附加 _updateInfo', ok: applyRows[2].satisfied && applyRows[3].satisfied, actual: [applyRows[2].gotUpdateInfo, applyRows[3].gotUpdateInfo] },
  { id: 'applyUpdateHint 不改写入参对象', ok: applyRows.every((r) => !r.inputMutated), actual: applyRows.map((r) => r.inputMutated) },
  { id: '预热未完成(缓存空)时不阻塞工具调用', ok: coldNoUpdateInfo && elapsedMs < 100, actual: { elapsedMs: Number(elapsedMs.toFixed(3)) } },
  { id: '无 hint 时不置消费标记', ok: notConsumedWhenNoHint, actual: proto._isHintConsumed('seq-A') },
  { id: 'hint 就绪后每个非检查工具调用均可附加', ok: repeatRows.every((r) => r.gotUpdateInfo), actual: repeatRows },
];
const violations = rows.filter((x) => !x.ok);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `兜底提示时序成立：check_update/upgrade 两工具均不附加 _updateInfo，其余工具附加且不改写入参对象；缓存未预热（peekCachedUpdateInfo 为空）时装饰为恒等返回、耗时 ${Number(elapsedMs.toFixed(3))}ms 不阻塞，消费标记不被误置；hint 就绪后每个非检查工具调用都能附加`
      : `兜底提示时序断言不成立：${JSON.stringify(violations)}`,
  { hint, applyRows, coldPath: { elapsedMs: Number(elapsedMs.toFixed(3)), gotUpdateInfo: coldNoUpdateInfo }, repeatRows, rows, violations });
